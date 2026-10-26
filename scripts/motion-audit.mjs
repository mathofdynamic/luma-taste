#!/usr/bin/env node
/**
 * Luma motion + layout audit. Produces EVIDENCE, not opinions.
 *
 *   npm i -D playwright-core   (or playwright)   # browser: set --chrome to a Chromium/Chrome executable if none is installed
 *   node .agents/skills/luma-taste/scripts/motion-audit.mjs --url http://localhost:3000 --out audit/motion \
 *        [--widths 375,1440] [--themes dark,light] [--chrome /path/to/chrome] [--theme-attr data-theme|class] [--margin 0]
 *        [--enter-ms 600] [--seam]
 *
 * Checks (exit code 1 if any FAIL): loops running off-screen, clipped/ellipsized text, horizontal overflow,
 * text < 12px, letter-spacing on Persian text, reduced-motion behavior, no-JS visibility, entrance timing
 * (Luma: about 600ms; under 400ms fails), premature reveals (below-the-fold content already visible at load,
 * which means either everything animated at load or the later reveal will blink), layout shift during idle and
 * during a fast scroll (lazy sections, loading media), multi-line text revealed by one wipe, decorative accent
 * bars, and showcases that wait for a click instead of playing themselves (owner review 02).
 * Writes <out>/motion-audit.json and <out>/motion-audit.md, plus seam frames with --seam.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const url = args.url || 'http://localhost:3000';
const out = args.out || 'audit/motion';
const widths = String(args.widths || '375,1440').split(',').map(Number);
const themes = String(args.themes || 'dark,light').split(',');
const themeAttr = args['theme-attr'] || 'data-theme'; // use 'class' for next-themes (.dark / .light)
const margin = Number(args.margin ?? 0); // px beyond the viewport still counted as in view (strict by default)
if (!Number.isFinite(margin) || margin < 0) throw new Error('--margin must be a nonnegative finite number');
const enterMs = Number(args['enter-ms'] ?? 600); // Luma entrance duration (motion-system.md section 4)
fs.mkdirSync(out, { recursive: true });

async function loadPlaywright() {
  const req = createRequire(path.join(process.cwd(), 'noop.js')); // project cwd: works when the skill lives outside the project
  for (const name of ['playwright-core', 'playwright']) {
    try { return await import(name); } catch {}
    try { return await import(pathToFileURL(req.resolve(name)).href); } catch {}
  }
  return null;
}
const pw = await loadPlaywright();
if (!pw) { console.error('playwright-core not found from the script location or the current directory. Install it audit-only (e.g. npm i --no-save playwright-core) and pass --chrome if no Chromium is installed.'); process.exit(2); }
const chromium = pw.chromium || pw.default?.chromium;

/* ---------- injected before any page script: records the motion that actually reveals [data-reveal] elements ---------- */
function revealRecorder() {
  const shifts = (window.__lmShifts = []); // layout shifts without input: a looping demo must never move the page
  try {
    new PerformanceObserver((list) => list.getEntries().forEach((e) => { if (!e.hadRecentInput) shifts.push({ value: e.value, sources: (e.sources || []).map((s) => { if (!s.node) return ''; const el = s.node.nodeType === 1 ? s.node : s.node.parentElement; const id = el ? (el.closest('[data-landing-v2],section[id],[id]')?.getAttribute('data-landing-v2') || el.closest('[id]')?.id || '') : ''; const name = s.node.nodeType === 1 ? s.node.tagName.toLowerCase() + [...s.node.classList].slice(-1).map((c) => '.' + c).join('') : (s.node.nodeName || '') + (el ? ' in .' + [...el.classList].slice(-1).join('') : ''); return `${name}${id ? ' @' + id : ''} y${Math.round(s.previousRect.y)}->${Math.round(s.currentRect.y)} h${Math.round(s.previousRect.height)}->${Math.round(s.currentRect.height)}`; }).filter(Boolean) }); }))
      .observe({ type: 'layout-shift', buffered: true });
  } catch {}
  const log = (window.__lmRevealLog = []);
  const name = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.classList[0] ? '.' + el.classList[0] : ''));
  const keep = (el, props, ms) => {
    if (!(el instanceof Element) || !el.hasAttribute('data-reveal')) return;
    if (!props.some((p) => p === 'opacity' || p === 'transform' || p === 'translate' || p === 'all')) return;
    log.push({ el: name(el), ms, props });
  };
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (keyframes, options) {
    const a = animate.call(this, keyframes, options);
    try {
      const props = new Set();
      a.effect.getKeyframes().forEach((k) => Object.keys(k).forEach((p) => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(p)) props.add(p); }));
      keep(this, [...props], a.effect.getTiming().duration);
    } catch {}
    return a;
  };
  const durationOf = (el, prop) => {
    const cs = getComputedStyle(el);
    const names = cs.transitionProperty.split(','), durs = cs.transitionDuration.split(',');
    const i = names.findIndex((n) => n.trim() === prop || n.trim() === 'all');
    const d = durs[(i < 0 ? 0 : i) % durs.length].trim();
    return parseFloat(d) * (d.endsWith('ms') ? 1 : 1000);
  };
  addEventListener('transitionrun', (e) => keep(e.target, [e.propertyName], durationOf(e.target, e.propertyName)), true);
  addEventListener('animationstart', (e) => { const cs = getComputedStyle(e.target); const d = cs.animationDuration.split(',')[0].trim(); keep(e.target, ['opacity', 'transform'], parseFloat(d) * (d.endsWith('ms') ? 1 : 1000)); }, true);
}

/* ---------- runs inside the page ---------- */
function auditPage(margin = 0) {
  const COMPOSITOR = new Set(['opacity', 'transform', 'translate', 'rotate', 'scale']); // filter / backdrop-filter animation is NOT treated as cheap
  const vw = innerWidth, vh = innerHeight;
  const sel = (el) => {
    if (!el) return '(none)';
    const parts = [];
    for (let n = el, d = 0; n && n.nodeType === 1 && d < 4; n = n.parentElement, d++) {
      let s = n.tagName.toLowerCase();
      if (n.id) { s += '#' + n.id; parts.unshift(s); break; }
      const cls = [...n.classList].slice(0, 2).join('.');
      if (cls) s += '.' + cls;
      parts.unshift(s);
    }
    return parts.join(' > ');
  };
  const inView = (el, margin = 0) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > -margin && r.top < vh + margin && r.right > -margin && r.left < vw + margin;
  };
  const animations = document.getAnimations().map((a) => {
    const t = a.effect?.getTiming?.() || {};
    const target = a.effect?.target;
    const props = new Set();
    try { a.effect.getKeyframes().forEach((k) => Object.keys(k).forEach((p) => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(p)) props.add(p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())); })); } catch {}
    const infinite = t.iterations === Infinity;
    return {
      kind: a.constructor.name, name: a.animationName || a.transitionProperty || '', target: sel(target),
      infinite, duration: t.duration, delay: t.delay, direction: t.direction, easing: t.easing,
      properties: [...props], paintOnly: [...props].filter((p) => !COMPOSITOR.has(p)),
      playState: a.playState, targetInView: target ? inView(target, margin) : false,
      loading: !!target?.closest?.('[data-loop=skeleton],[data-loop=placeholder]'), // transient loading shimmer: exempt from the decorative budget
    };
  });
  const loops = animations.filter((a) => a.infinite);
  const text = [];
  const isFa = (s) => /[\u0600-\u06FF]/.test(s);
  document.querySelectorAll('body *').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ');
    if (!own) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    // Measure the text's own line boxes: decorative absolute layers (a liquid-fill ::before parked
    // below a button) inflate scrollHeight without clipping any glyph.
    let clipped = false;
    if ((cs.overflow !== 'visible' || cs.overflowY !== 'visible') && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) {
      const range = document.createRange(); range.selectNodeContents(el);
      const t = range.getBoundingClientRect(), top = r.top + el.clientTop, bottom = top + el.clientHeight;
      clipped = t.height > 0 && (t.bottom > bottom + 2 || t.top < top - 2);
    }
    const ellipsis = cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1;
    const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
    const fs = parseFloat(cs.fontSize);
    const ls = cs.letterSpacing;
    text.push({ el: sel(el), sample: own.slice(0, 40), clipped, ellipsis, clamp: !!clamp, small: fs < 12, fs,
      persianTracking: isFa(own) && ls !== 'normal' && parseFloat(ls) !== 0 });
  });
  const glass = [...document.querySelectorAll('body *')].filter((el) => {
    const cs = getComputedStyle(el); const b = cs.backdropFilter || cs.webkitBackdropFilter;
    return b && b !== 'none';
  }).map((el) => { const r = el.getBoundingClientRect(); return { el: sel(el), area: Math.round(r.width * r.height), filter: getComputedStyle(el).backdropFilter }; });
  const reveal = [...document.querySelectorAll('[data-reveal]')].map((el) => {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { el: sel(el), revealed: el.getAttribute('data-revealed') === 'true', opacity: +cs.opacity, td: cs.transitionDuration, tdel: cs.transitionDelay, tf: cs.transform,
      belowFold: r.top >= vh + margin, rendered: r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' };
  });
  return {
    viewport: [vw, vh], scrollY: Math.round(scrollY),
    overflowX: document.documentElement.scrollWidth > vw + 1, scrollWidth: document.documentElement.scrollWidth,
    loops, runningLoopsInView: loops.filter((a) => a.playState === 'running' && a.targetInView && !a.loading).length, runningLoopNames: loops.filter((a) => a.playState === 'running' && a.targetInView && !a.loading).map((a) => `${a.name || a.kind}@${a.target.split(' > ').pop()}`),
    runningLoopsOffscreen: loops.filter((a) => a.playState === 'running' && !a.targetInView),
    text, glass, reveal, totalAnimations: animations.length,
  };
}

/* Multi-line text revealed by one clip-path wipe: every line appears at once (owner review 02). Type word by word. */
function wipeProbe() {
  // Group line boxes by vertical overlap: a fallback-font glyph (a checkmark) sits a few px off its line's top.
  const lines = (el) => { const r = document.createRange(); r.selectNodeContents(el); let n = 0, bottom = -Infinity; [...r.getClientRects()].filter((x) => x.width > 1 && x.height > 1).sort((a, b) => a.top - b.top).forEach((x) => { if (x.top >= bottom - 2) { n++; bottom = x.bottom; } else bottom = Math.max(bottom, x.bottom); }); return n; };
  return document.getAnimations().filter((a) => {
    const el = a.effect?.target; if (!(el instanceof Element) || !el.textContent.trim()) return false;
    let clip = false; try { clip = a.effect.getKeyframes().some((k) => 'clipPath' in k || 'clip-path' in k); } catch {}
    return clip && a.playState === 'running' && lines(el) > 1;
  }).map((a) => { const el = a.effect.target; return `${el.tagName.toLowerCase()}${el.classList[0] ? '.' + el.classList[0] : ''} "${el.textContent.trim().slice(0, 30)}"`; });
}
/* Decorative accent bars: thin colored/gradient lines inside rounded cards ("AI slop", owner review 02).
   Functional lines are exempt: [data-progress] (real progress/usage meters), [data-diagram] (connectors inside an
   explainer illustration), [role=progressbar], [role=slider] (comparison divider). */
function accentProbe() {
  const out = [];
  const colored = (cs) => {
    if (/gradient\(/.test(cs.backgroundImage)) return true;
    const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/); if (!m) return false;
    const [r, g, b, a = 1] = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
    return a > 0.3 && Math.max(r, g, b) - Math.min(r, g, b) > 60;
  };
  const rounded = (el) => { for (let n = el, d = 0; n && d < 3; n = n.parentElement, d++) if (parseFloat(getComputedStyle(n).borderTopLeftRadius) >= 8) return true; return false; };
  document.querySelectorAll('body *').forEach((el) => {
    if (el instanceof SVGElement || el.closest('[data-progress],[data-diagram],[role=progressbar],[role=slider]')) return;
    for (const pseudo of [null, '::before', '::after']) {
      const cs = getComputedStyle(el, pseudo);
      if (cs.display === 'none' || (pseudo && (cs.content === 'none' || cs.content === 'normal'))) continue;
      const w = parseFloat(cs.width), h = parseFloat(cs.height);
      if (!(w > 0 && h > 0)) continue;
      if (!((w <= 4 && h >= 16) || (h <= 4 && w >= 16))) continue;
      if (!colored(cs) || !rounded(pseudo ? el : el.parentElement || el)) continue;
      out.push(`${el.tagName.toLowerCase()}${el.classList[0] ? '.' + el.classList[0] : ''}${pseudo || ''} (${Math.round(w)}x${Math.round(h)})`);
    }
  });
  return out;
}

const findings = []; // {level, check, where, detail}
const add = (level, check, where, detail) => findings.push({ level, check, where, detail });
const seams = [];
const themeEvidence = [];
let glassChecked = false;
const browser = await chromium.launch({ executablePath: args.chrome || undefined, args: ['--no-sandbox'] });

for (const width of widths) {
  for (const theme of themes) {
    const where = `${width}px/${theme}`;
    const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 800 : 900 }, deviceScaleFactor: 1 });
    await ctx.addInitScript(revealRecorder);
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url, { waitUntil: 'networkidle' });
    if (!glassChecked) { // shipped CSS: a rule that kept only -webkit-backdrop-filter renders NO blur in Chromium/Firefox
      glassChecked = true;
      const sheets = await page.evaluate(() => [...document.styleSheets].map((s) => s.href || s.ownerNode?.textContent || ''));
      for (const sheet of sheets) {
        let css = sheet; if (/^https?:/.test(sheet)) { try { css = await (await fetch(sheet)).text(); } catch { continue; } }
        for (const block of css.match(/[^{}]+\{[^{}]*\}/g) || []) {
          if (/-webkit-backdrop-filter\s*:/.test(block) && !/(^|[;{\s])backdrop-filter\s*:/.test(block.replace(/-webkit-backdrop-filter/g, '')))
            add('FAIL', 'BACKDROP_PREFIX_ONLY', 'css', `${block.slice(0, block.indexOf('{')).trim().slice(0, 80)} ships only -webkit-backdrop-filter (write the -webkit- declaration BEFORE backdrop-filter; minifiers keep the last one)`);
        }
      }
    }
    await page.evaluate(([a, t]) => {
      const el = document.documentElement;
      if (a === 'class') { el.classList.remove('light', 'dark'); el.classList.add(t); } // keep unrelated root classes
      else el.setAttribute(a, t);
    }, [themeAttr, theme]);
    await page.waitForTimeout(400);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    themeEvidence.push({ where, bg });
    { // idle at the top: auto-playing demos (hero studio, stories, marquees) must not shift layout
      await page.evaluate(() => window.__lmShifts.splice(0));
      const wipes = new Set();
      for (let i = 0; i < 40; i++) { (await page.evaluate(wipeProbe)).forEach((w) => wipes.add(w)); await page.waitForTimeout(300); } // 12s: long enough for a hero demo to reach its second scene
      wipes.forEach((w) => add('FAIL', 'MULTILINE_WIPE', where, `${w} is revealed by one clip-path wipe across several lines (all lines appear at once); type it word by word in reading order (signature-patterns.md section 4)`));
      const idle = await page.evaluate(() => window.__lmShifts.splice(0));
      const sum = idle.reduce((t, e) => t + e.value, 0);
      if (sum > 0.005) add('FAIL', 'IDLE_LAYOUT_SHIFT', where, `layout shifted by ${sum.toFixed(4)} in 12s with no input (sources: ${[...new Set(idle.flatMap((e) => e.sources))].slice(0, 4).join(', ') || 'unknown'}); reserve the space a loop needs (text that wraps differently per scene/phase, carets, badges)`);
    }
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = page.viewportSize().height;
    let maxInView = 0, maxNames = [];
    const seenText = new Map();
    for (let y = 0; y < total; y += Math.round(vh * 0.8)) {
      await page.evaluate((yy) => scrollTo(0, yy), y);
      await page.waitForTimeout(y === 0 ? 50 : 900); // 900ms: let a 600ms reveal (plus stagger) finish before measuring
      const r = await page.evaluate(auditPage, margin);
      if (y === 0) r.reveal.filter((e) => e.belowFold && e.rendered && e.opacity >= 0.99).forEach((e) => add('FAIL', 'PREMATURE_REVEAL', where,
        `${e.el} is below the fold but already visible at load (reveal on scroll; stage it hidden before it enters, or the reveal will blink)`));
      if (r.runningLoopsInView > maxInView) { maxInView = r.runningLoopsInView; maxNames = r.runningLoopNames; }
      if (r.overflowX) add('FAIL', 'OVERFLOW_X', where, `scrollWidth ${r.scrollWidth} > viewport at scrollY ${r.scrollY}`);
      r.runningLoopsOffscreen.forEach((a) => add('FAIL', 'LOOP_RUNS_OFFSCREEN', where, `${a.target} (${a.name}) is running while off-screen`));
      r.loops.forEach((a) => a.paintOnly.length && !a.target.includes('lm-gradient-word') && !(a.loading && a.paintOnly.every((p) => p.startsWith('background-position'))) && add('WARN', 'LOOP_PAINT_PROPERTY', where, `${a.target} animates ${a.paintOnly.join(', ')} (paint-heavy: use transform/opacity; sanctioned exceptions: .lm-gradient-word in view, and a loading shimmer's background-position)`));
      (await page.evaluate(wipeProbe)).forEach((w) => add('FAIL', 'MULTILINE_WIPE', where, `${w} is revealed by one clip-path wipe across several lines; type it word by word`));
      (await page.evaluate(accentProbe)).forEach((b) => add('FAIL', 'DECORATIVE_ACCENT_BAR', where, `${b}: a thin colored/gradient line inside a card (banned as "AI slop"; show state with surface and border, mark a real progress line data-progress, a diagram connector data-diagram)`));
      r.text.forEach((t) => {
        const k = t.el + t.sample; if (seenText.has(k)) return; seenText.set(k, 1);
        if (t.clipped) add('FAIL', 'TEXT_CLIPPED', where, `${t.el} "${t.sample}"`);
        if (t.ellipsis || t.clamp) add('FAIL', 'TEXT_TRUNCATED', where, `${t.el} "${t.sample}" uses ellipsis/line-clamp; allow more lines instead`);
        if (t.small) add('FAIL', 'TEXT_TOO_SMALL', where, `${t.el} ${t.fs}px "${t.sample}"`);
        if (t.persianTracking) add('FAIL', 'PERSIAN_LETTER_SPACING', where, `${t.el} "${t.sample}"`);
      });
      const reveals = await page.evaluate(() => (window.__lmRevealLog || []).splice(0));
      reveals.forEach((e) => {
        if (!e.ms) return;
        if (e.ms < 400) add('FAIL', 'ENTRANCE_TOO_FAST', where, `${e.el} reveals in ${e.ms}ms (Luma reveals are about ${enterMs}ms; the owner rejected 100ms)`);
        else if (Math.abs(e.ms - enterMs) > 100) add('WARN', 'ENTRANCE_DURATION_DRIFT', where, `${e.el} reveals in ${e.ms}ms (Luma: ${enterMs}ms)`);
      });
      if (r.glass.length && width < 600) r.glass.forEach((g) => g.area > 375 * 800 * 0.6 && add('WARN', 'LARGE_BACKDROP_BLUR', where, `${g.el} ${g.area}px² (keep blur on small fixed layers)`));
    }
    { // at the very bottom, nothing on screen may still be staged hidden (a shrunken root margin cannot reach a short footer)
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(1500);
      const stuckHidden = await page.evaluate(() => [...document.querySelectorAll('[data-revealed=false]')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && !el.closest('details:not([open])'); }).map((el) => (el.className?.baseVal ?? el.className).toString().split(' ').pop() || el.tagName));
      if (stuckHidden.length) add('FAIL', 'REVEAL_NEVER_FIRES', where, `${stuckHidden.length} element(s) still hidden at the end of the page: ${stuckHidden.slice(0, 4).join(', ')} (add an end-of-page fallback; see luma-motion.js tail())`);
    }
    { // a loading shimmer must stop once its media has decoded
      await page.waitForTimeout(3000);
      const stuck = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity).map((a) => a.effect.target?.closest?.('[data-loop=skeleton]')).filter((el) => el && [...el.querySelectorAll('img')].some((i) => i.complete && i.naturalWidth > 0)).length);
      if (stuck) add('FAIL', 'SKELETON_AFTER_LOAD', where, `${stuck} loading shimmer(s) still running over a decoded image (remove data-loop="skeleton" / data-loading on load and on error)`);
    }
    if (theme === themes[0]) { // sets of 3+ pressed/selected buttons are showcases: they must play themselves
      const groups = await page.evaluate(() => {
        const parents = new Map();
        document.querySelectorAll('button[aria-pressed], [role=tab][aria-selected]').forEach((b) => { if (b.closest('[data-user-choice],nav,header,footer,dialog')) return; const p = b.parentElement; parents.set(p, [...(parents.get(p) || []), b]); });
        return [...parents].filter(([, bs]) => bs.length >= 3).map(([p], i) => { p.setAttribute('data-lm-group', String(i)); return String(i); });
      });
      for (const g of groups) {
        const pick = () => page.evaluate((id) => [...document.querySelector(`[data-lm-group="${id}"]`).querySelectorAll('button[aria-pressed], [role=tab][aria-selected]')].findIndex((b) => b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-selected') === 'true'), g);
        await page.evaluate((id) => document.querySelector(`[data-lm-group="${id}"]`).scrollIntoView({ block: 'center' }), g);
        await page.mouse.move(1, 1); await page.waitForTimeout(500);
        const a = await pick(); await page.waitForTimeout(9000); const b = await pick();
        if (a === b) add('FAIL', 'SHOWCASE_WAITS_FOR_CLICK', where, `group ${g} (${await page.evaluate((id) => { const p = document.querySelector(`[data-lm-group="${id}"]`); return p.getAttribute('aria-label') || p.className.toString().split(' ')[0]; }, g)}) kept item ${a} selected for 9s in view: a showcase must play through its items itself (signature-patterns.md section 10); mark genuine filters data-user-choice. If its media was still loading, re-run before treating this as real.`);
      }
    }
    if (maxInView > 4) add('WARN', 'MANY_CONCURRENT_LOOPS', where, `${maxInView} infinite animations running at once (budget: 3-4 on mobile): ${maxNames.slice(0, 10).join(', ')}`);
    if (errors.length) add('FAIL', 'CONSOLE_ERRORS', where, errors.slice(0, 3).join(' | '));

    if (args.seam) {
      await page.evaluate(() => scrollTo(0, 0));
      const loops = await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.getTiming?.().iterations === Infinity).map((a, i) => { const el = a.effect.target; if (!el.hasAttribute('data-seam-id')) el.setAttribute('data-seam-id', 's' + i); return { id: el.getAttribute('data-seam-id'), duration: a.effect.getTiming().duration }; }).filter((l, i, all) => all.findIndex((o) => o.id === l.id) === i)); // one element can own several loops (e.g. its ::before shimmer)
      for (const l of loops) {
        const present = await page.evaluate((id) => { const el = document.querySelector(`[data-seam-id="${id}"]`); el?.scrollIntoView({ block: 'center' }); return !!el; }, l.id);
        if (!present) continue; // the loop's element left the DOM (e.g. a loading skeleton replaced by its image)
        await page.waitForTimeout(1000); // settle finite entrance/explainer motion before isolating a loop seam
        // A moving loop's own bounds change across the wrap. Keep a fixed
        // crop of its clipping viewport so near-wrap frames show the same place.
        const clip = await page.evaluate((id) => {
          document.getAnimations().forEach(a=>a.pause()); // freeze finite explainer stories too, or they read as a seam
          let el=document.querySelector(`[data-seam-id="${id}"]`); if(!el) return null; let box=el.ownerSVGElement || el;
          const moving=el.getBoundingClientRect().width>innerWidth;
          for(let p=moving?el.parentElement:null;p;p=p.parentElement) {
            const c=getComputedStyle(p);
            if(/hidden|clip|auto|scroll/.test(c.overflowX+' '+c.overflowY)){box=p;break;}
          }
          const r=box.getBoundingClientRect(), x=Math.max(0,r.left), y=Math.max(0,r.top);
          return {x,y,width:Math.max(1,Math.min(innerWidth,r.right)-x),height:Math.max(1,Math.min(innerHeight,r.bottom)-y)};
        },l.id);
        if (!clip) continue;
        const frame = async (t) => {
          await page.evaluate(([id, time]) => document.getAnimations().forEach((a) => { a.pause(); if (a.effect?.target?.getAttribute?.('data-seam-id') === id && a.effect.getTiming().iterations === Infinity) a.currentTime = time; }), [l.id, t]); // story timers may start new animations: freeze them as well
          await page.waitForTimeout(80);
          return page.screenshot({clip});
        };
        const a = await frame(0), b = await frame(l.duration), n = await frame(Math.max(0, l.duration - 16));
        const ha = crypto.createHash('sha1').update(a).digest('hex'), hb = crypto.createHash('sha1').update(b).digest('hex');
        const base = path.join(out, `seam-${width}-${theme}-${l.id}`);
        fs.writeFileSync(base + '-t0.png', a); fs.writeFileSync(base + '-tPeriod.png', b); fs.writeFileSync(base + '-tNear.png', n); // tNear = one frame before the wrap; compare with t0 to catch a jump hidden by endpoint wrapping
        // Hashes differ on 1-level antialiasing noise too; measure the largest channel delta in the page.
        const delta = ha === hb ? 0 : await page.evaluate(async ([x, y]) => {
          const load = (b64) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + b64; });
          const [p, q] = await Promise.all([load(x), load(y)]);
          const px = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
          const da = px(p), db = px(q); let m = 0;
          for (let i = 0; i < da.length; i++) m = Math.max(m, Math.abs(da[i] - db[i]));
          return m;
        }, [a.toString('base64'), b.toString('base64')]);
        seams.push({ where, id: l.id, duration: l.duration, identical: delta <= 2 });
        if (delta > 2) add('WARN', 'LOOP_SEAM_DIFFERS', where, `${l.id}: frame at t=0 differs from t=period (see ${base}-t*.png); inspect visually, tiny AA differences are OK, a visible jump is not`);
      }
    }
    await ctx.close();
  }
}

// Fast scroll, fresh page per width: lazy sections mounting late, media loading and autoplay must not move the
// page. A slow scripted pass hides this because every section has mounted before it is reached.
for (const width of widths) {
  const where = `${width}px/fast-scroll`;
  const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 800 : 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(revealRecorder);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.__lmShifts.splice(0));
  for (let y = 0; y < await page.evaluate(() => document.documentElement.scrollHeight); y += Math.round(page.viewportSize().height * 0.5)) {
    await page.evaluate((yy) => scrollTo(0, yy), y); await page.waitForTimeout(150);
  }
  await page.waitForTimeout(4000);
  const shifts = await page.evaluate(() => window.__lmShifts.splice(0));
  const sum = shifts.reduce((t, e) => t + e.value, 0);
  const sources = [...new Set(shifts.flatMap((e) => e.sources))].slice(0, 5).join(', ') || 'unknown';
  if (sum > 0.05) add('FAIL', 'SCROLL_LAYOUT_SHIFT', where, `layout shifted by ${sum.toFixed(4)} during a fast scroll with no input (sources: ${sources}); reserve lazy sections' real height, give next/dynamic ssr:false a loading placeholder, reserve loading batches, move dividers/shimmers with transform/background-position (performance-and-verification.md section 2)`);
  else if (sum > 0.01) add('WARN', 'SCROLL_LAYOUT_SHIFT', where, `layout shifted by ${sum.toFixed(4)} during a fast scroll (sources: ${sources})`);
  await ctx.close();
}

if (themes.length > 1) { // prove the theme switch really changed the page (otherwise dark and light would be the same audit twice)
  for (const w of widths) {
    const bgs = themes.map((t) => themeEvidence.find((e) => e.where === `${w}px/${t}`)?.bg);
    if (new Set(bgs).size === 1) add('FAIL', 'THEME_NOT_APPLIED', `${w}px`, `body background identical for ${themes.join('/')} (${bgs[0]}); check --theme-attr (next-themes uses class)`);
  }
}
// Reduced motion: no running infinite loops, nothing hidden
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const r = await page.evaluate(auditPage, margin);
  const running = r.loops.filter((a) => a.playState === 'running');
  running.forEach((a) => add('FAIL', 'REDUCED_MOTION_LOOP', '375px/reduce', `${a.target} (${a.name}) still loops`));
  r.reveal.filter((e) => e.opacity < 1).forEach((e) => add('FAIL', 'REDUCED_MOTION_HIDDEN', '375px/reduce', `${e.el} opacity ${e.opacity}`));
  await ctx.close();
}
// JavaScript disabled: content must be readable
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready); // CSS/font readiness, without waiting forever for unrelated remote images
  const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((el) => +getComputedStyle(el).opacity < 1).length);
  if (hidden) add('FAIL', 'NO_JS_HIDDEN_CONTENT', 'js-disabled', `${hidden} [data-reveal] elements are invisible without JavaScript`);
  await ctx.close();
}
await browser.close();

const fails = findings.filter((f) => f.level === 'FAIL'), warns = findings.filter((f) => f.level === 'WARN');
const uniq = (arr) => [...new Map(arr.map((f) => [f.level + f.check + f.where + f.detail, f])).values()];
const f2 = uniq(findings);
fs.writeFileSync(path.join(out, 'motion-audit.json'), JSON.stringify({ url, widths, themes, margin, enterMs, themeEvidence, findings: f2, seams }, null, 2));
const md = [`# Motion audit`, `URL: ${url}`, `FAIL: ${uniq(fails).length}  WARN: ${uniq(warns).length}`, '',
  ...(f2.length ? ['| Level | Check | Where | Detail |', '|---|---|---|---|', ...f2.map((f) => `| ${f.level} | ${f.check} | ${f.where} | ${f.detail.replace(/\|/g, '/')} |`)] : ['No findings.']),
  '', seams.length ? '## Loop seams\n' + seams.map((s) => `- ${s.where} ${s.id} (${s.duration}ms): ${s.identical ? 'identical frames' : 'frames differ, inspect images'}`).join('\n') : ''].join('\n');
fs.writeFileSync(path.join(out, 'motion-audit.md'), md);
console.log(md);
process.exit(uniq(fails).length ? 1 : 0);
