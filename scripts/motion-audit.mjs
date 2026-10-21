#!/usr/bin/env node
/**
 * Luma motion + layout audit. Produces EVIDENCE, not opinions.
 *
 *   npm i -D playwright-core   (or playwright)   # browser: set --chrome to a Chromium/Chrome executable if none is installed
 *   node .agents/skills/luma-taste/scripts/motion-audit.mjs --url http://localhost:3000 --out audit/motion \
 *        [--widths 375,1440] [--themes dark,light] [--chrome /path/to/chrome] [--theme-attr data-theme|class] [--margin 0] [--seam]
 *
 * Checks (exit code 1 if any FAIL): loops running off-screen, clipped/ellipsized text, horizontal overflow,
 * text < 12px, letter-spacing on Persian text, reduced-motion behavior, no-JS visibility, entrance-contract drift.
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
    const clipped = (cs.overflow !== 'visible' || cs.overflowY !== 'visible') && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0;
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
    const cs = getComputedStyle(el);
    return { el: sel(el), revealed: el.getAttribute('data-revealed') === 'true', opacity: +cs.opacity, td: cs.transitionDuration, tdel: cs.transitionDelay, tf: cs.transform };
  });
  return {
    viewport: [vw, vh], scrollY: Math.round(scrollY),
    overflowX: document.documentElement.scrollWidth > vw + 1, scrollWidth: document.documentElement.scrollWidth,
    loops, runningLoopsInView: loops.filter((a) => a.playState === 'running' && a.targetInView).length,
    runningLoopsOffscreen: loops.filter((a) => a.playState === 'running' && !a.targetInView),
    text, glass, reveal, totalAnimations: animations.length,
  };
}

const findings = []; // {level, check, where, detail}
const add = (level, check, where, detail) => findings.push({ level, check, where, detail });
const seams = [];
const themeEvidence = [];
const browser = await chromium.launch({ executablePath: args.chrome || undefined, args: ['--no-sandbox'] });

for (const width of widths) {
  for (const theme of themes) {
    const where = `${width}px/${theme}`;
    const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 800 : 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(([a, t]) => {
      const el = document.documentElement;
      if (a === 'class') { el.classList.remove('light', 'dark'); el.classList.add(t); } // keep unrelated root classes
      else el.setAttribute(a, t);
    }, [themeAttr, theme]);
    await page.waitForTimeout(400);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    themeEvidence.push({ where, bg });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = page.viewportSize().height;
    let maxInView = 0;
    const seenText = new Map();
    for (let y = 0; y < total; y += Math.round(vh * 0.8)) {
      await page.evaluate((yy) => scrollTo(0, yy), y);
      await page.waitForTimeout(450);
      const r = await page.evaluate(auditPage, margin);
      maxInView = Math.max(maxInView, r.runningLoopsInView);
      if (r.overflowX) add('FAIL', 'OVERFLOW_X', where, `scrollWidth ${r.scrollWidth} > viewport at scrollY ${r.scrollY}`);
      r.runningLoopsOffscreen.forEach((a) => add('FAIL', 'LOOP_RUNS_OFFSCREEN', where, `${a.target} (${a.name}) is running while off-screen`));
      r.loops.forEach((a) => a.paintOnly.length && !a.target.includes('lm-gradient-word') && add('WARN', 'LOOP_PAINT_PROPERTY', where, `${a.target} animates ${a.paintOnly.join(', ')} (paint-heavy: use transform/opacity; the only sanctioned exception is .lm-gradient-word, in view only)`));
      r.text.forEach((t) => {
        const k = t.el + t.sample; if (seenText.has(k)) return; seenText.set(k, 1);
        if (t.clipped) add('FAIL', 'TEXT_CLIPPED', where, `${t.el} "${t.sample}"`);
        if (t.ellipsis || t.clamp) add('FAIL', 'TEXT_TRUNCATED', where, `${t.el} "${t.sample}" uses ellipsis/line-clamp; allow more lines instead`);
        if (t.small) add('FAIL', 'TEXT_TOO_SMALL', where, `${t.el} ${t.fs}px "${t.sample}"`);
        if (t.persianTracking) add('FAIL', 'PERSIAN_LETTER_SPACING', where, `${t.el} "${t.sample}"`);
      });
      r.reveal.forEach((e) => {
        if (!e.revealed) return;
        const d = parseFloat(e.td) * (e.td.endsWith('ms') ? 1 : 1000);
        if (e.td && Math.abs(d - 100) > 1 && d !== 0) add('WARN', 'ENTRANCE_DURATION_DRIFT', where, `${e.el} transition ${e.td} (contract: 100ms)`);
      });
      if (r.glass.length && width < 600) r.glass.forEach((g) => g.area > 375 * 800 * 0.6 && add('WARN', 'LARGE_BACKDROP_BLUR', where, `${g.el} ${g.area}px² (keep blur on small fixed layers)`));
    }
    if (maxInView > 4) add('WARN', 'MANY_CONCURRENT_LOOPS', where, `${maxInView} infinite animations running at once (budget: 3-4 on mobile)`);
    if (errors.length) add('FAIL', 'CONSOLE_ERRORS', where, errors.slice(0, 3).join(' | '));

    if (args.seam) {
      await page.evaluate(() => scrollTo(0, 0));
      const loops = await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.getTiming?.().iterations === Infinity).map((a, i) => { const el = a.effect.target; el.setAttribute('data-seam-id', 's' + i); return { id: 's' + i, duration: a.effect.getTiming().duration }; }));
      for (const l of loops) {
        await page.evaluate((id) => document.querySelector(`[data-seam-id="${id}"]`).scrollIntoView({ block: 'center' }), l.id);
        await page.waitForTimeout(1000); // settle finite entrance/explainer motion before isolating a loop seam
        // A moving loop's own bounds change across the wrap. Keep a fixed
        // crop of its clipping viewport so near-wrap frames show the same place.
        const clip = await page.evaluate((id) => {
          let el=document.querySelector(`[data-seam-id="${id}"]`), box=el;
          for(let p=el.parentElement;p;p=p.parentElement) {
            const c=getComputedStyle(p);
            if(/hidden|clip|auto|scroll/.test(c.overflowX+' '+c.overflowY)){box=p;break;}
          }
          const r=box.getBoundingClientRect(), x=Math.max(0,r.left), y=Math.max(0,r.top);
          return {x,y,width:Math.max(1,Math.min(innerWidth,r.right)-x),height:Math.max(1,Math.min(innerHeight,r.bottom)-y)};
        },l.id);
        const frame = async (t) => {
          await page.evaluate(([id, time]) => document.getAnimations().filter((a) => a.effect?.target?.getAttribute?.('data-seam-id') === id).forEach((a) => { a.pause(); a.currentTime = time; }), [l.id, t]);
          await page.waitForTimeout(80);
          return page.screenshot({clip});
        };
        const a = await frame(0), b = await frame(l.duration), n = await frame(Math.max(0, l.duration - 16));
        const ha = crypto.createHash('sha1').update(a).digest('hex'), hb = crypto.createHash('sha1').update(b).digest('hex');
        const base = path.join(out, `seam-${width}-${theme}-${l.id}`);
        fs.writeFileSync(base + '-t0.png', a); fs.writeFileSync(base + '-tPeriod.png', b); fs.writeFileSync(base + '-tNear.png', n); // tNear = one frame before the wrap; compare with t0 to catch a jump hidden by endpoint wrapping
        seams.push({ where, id: l.id, duration: l.duration, identical: ha === hb });
        if (ha !== hb) add('WARN', 'LOOP_SEAM_DIFFERS', where, `${l.id}: frame at t=0 differs from t=period (see ${base}-t*.png); inspect visually, tiny AA differences are OK, a visible jump is not`);
      }
    }
    await ctx.close();
  }
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
fs.writeFileSync(path.join(out, 'motion-audit.json'), JSON.stringify({ url, widths, themes, margin, themeEvidence, findings: f2, seams }, null, 2));
const md = [`# Motion audit`, `URL: ${url}`, `FAIL: ${uniq(fails).length}  WARN: ${uniq(warns).length}`, '',
  ...(f2.length ? ['| Level | Check | Where | Detail |', '|---|---|---|---|', ...f2.map((f) => `| ${f.level} | ${f.check} | ${f.where} | ${f.detail.replace(/\|/g, '/')} |`)] : ['No findings.']),
  '', seams.length ? '## Loop seams\n' + seams.map((s) => `- ${s.where} ${s.id} (${s.duration}ms): ${s.identical ? 'identical frames' : 'frames differ, inspect images'}`).join('\n') : ''].join('\n');
fs.writeFileSync(path.join(out, 'motion-audit.md'), md);
console.log(md);
process.exit(uniq(fails).length ? 1 : 0);
