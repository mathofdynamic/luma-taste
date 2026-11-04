#!/usr/bin/env node
/*
 * Luma proof validator (owner review 08). The audit proves behaviour; this proves what the visitor SEES, and it is a
 * gate: a page is not reported until `proof.mjs --verify` passes.
 *
 *   node proof.mjs --url http://localhost:3000/service/x --out proof/x [--chrome path] [--build .next/BUILD_ID]
 *   node proof.mjs --verify --out proof/x [--build .next/BUILD_ID]
 *
 * Capture writes, under --out:
 *   walk/   what the visitor sees: viewport screenshots every 0.75 screen, top to bottom, at 375x800, 768x1024,
 *           1440x900 and 1870x1880 (a tall monitor). Pinned scroll scenes are captured as they are pinned.
 *   films/  every explainer ([data-story-card]) as a five-frame filmstrip (0, 25, 50, 75, 100% of its animation)
 *           at 1440 and 375, so a poor animation is seen frame by frame, not only at rest.
 *   index.html  every image on one page, in order, for the review.
 *   REVIEW.md   one line per image. Each must get a verdict (ship / fix: reason) from the builder AND from a fresh-eyes
 *               reviewer that did not build the page; the reviewer is named on the "Fresh-eyes reviewer:" line.
 *   findings.json  geometry failures measured on the same frames.
 *
 * Geometry checks (FAIL), measured on every walk frame:
 *   GRID_ESCAPE        a content block (>= 120x80) crosses the page container edges (max 1200px, 20px padding)
 *                      unless it is marked [data-bleed]; a section background spanning the screen is not content.
 *   COLUMN_DEAD_SPACE  in a row of side-by-side columns (each >= 200px wide, row >= 240px tall), a column whose painted
 *                      content (text, media, bordered or filled boxes) leaves > 120px and > 20% of the row empty.
 *                      Measured in every frame, so pinned scenes are judged pinned.
 *   EXPLAINER_SPARSE   an explainer whose painted content covers < 35% of its stage at rest (a small drawing in a big
 *                      empty box).
 *
 * --verify fails when: findings.json has failures, REVIEW.md has an image without a verdict or any "fix" verdict,
 * the fresh-eyes reviewer line is empty, or the build (--build file) is newer than the proof (stale proof).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const out = args.out || 'proof';
const build = args.build || '.next/BUILD_ID';

if (args.verify) {
  const problems = [];
  const review = path.join(out, 'REVIEW.md'), found = path.join(out, 'findings.json');
  if (!fs.existsSync(review) || !fs.existsSync(found)) { console.error('PROOF MISSING: run proof.mjs without --verify first'); process.exit(1); }
  const fails = JSON.parse(fs.readFileSync(found, 'utf8')).filter((f) => f.level === 'FAIL');
  fails.forEach((f) => problems.push(`${f.check} ${f.where}: ${f.detail}`));
  const text = fs.readFileSync(review, 'utf8');
  const rows = text.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Image') && !l.startsWith('|---'));
  rows.forEach((l) => {
    const cells = l.split('|').map((c) => c.trim());
    const [, image, builder, reviewer] = cells;
    if (!/^ship\b/i.test(builder) || !/^ship\b/i.test(reviewer)) problems.push(`${image}: builder "${builder || '-'}", reviewer "${reviewer || '-'}" (both must be ship; fix and recapture otherwise)`);
  });
  const who = (text.match(/^Fresh-eyes reviewer:(.*)$/m) || [])[1]?.trim();
  if (!who) problems.push('no fresh-eyes reviewer named (a reviewer that did not build the page must judge every image)');
  if (fs.existsSync(build) && fs.statSync(build).mtimeMs > fs.statSync(found).mtimeMs) problems.push(`stale proof: ${build} is newer than the proof; recapture`);
  if (problems.length) { console.error(`PROOF FAILED (${problems.length})\n- ` + problems.join('\n- ')); process.exit(1); }
  console.log(`PROOF PASSED: ${rows.length} images, reviewer ${who}`);
  process.exit(0);
}

async function loadPlaywright() {
  const req = createRequire(path.join(process.cwd(), 'noop.js'));
  for (const name of ['playwright-core', 'playwright']) {
    try { return await import(name); } catch {}
    try { return await import(pathToFileURL(req.resolve(name)).href); } catch {}
  }
  return null;
}
const pw = await loadPlaywright();
if (!pw) { console.error('playwright-core not found (npm i --no-save playwright-core)'); process.exit(2); }
const chromium = pw.chromium || pw.default?.chromium;
const url = args.url || 'http://localhost:3000';
for (const d of ['walk', 'films']) { fs.rmSync(path.join(out, d), { recursive: true, force: true }); fs.mkdirSync(path.join(out, d), { recursive: true }); }

const findings = [];
const add = (level, check, where, detail) => { if (!findings.some((f) => f.check === check && f.detail === detail)) findings.push({ level, check, where, detail }); };
const images = []; // {file, label}

/* ---------- measured in the page ---------- */
function geometry() {
  const vw = innerWidth, vh = innerHeight;
  const name = (e) => (e.className?.baseVal ?? e.className ?? '').toString().split(' ').filter(Boolean).pop()?.replace(/^.*__/, '') || e.tagName.toLowerCase();
  const where = (e) => `${e.closest('[data-landing-v2]')?.getAttribute('data-landing-v2') || 'page'} > ${name(e)}`;
  // what is painted: the box cut by every clipping ancestor
  const paint = (e) => { const b = e.getBoundingClientRect(); let t = b.top, bt = b.bottom, l = b.left, r = b.right;
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { if (getComputedStyle(a).overflow === 'visible') continue; const c = a.getBoundingClientRect(); t = Math.max(t, c.top); bt = Math.min(bt, c.bottom); l = Math.max(l, c.left); r = Math.min(r, c.right); }
    return { top: t, bottom: bt, left: l, right: r, width: r - l, height: bt - t }; };
  const shown = (e) => { for (let a = e; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .05) return false; } return true; };
  const leaf = (e) => { const cs = getComputedStyle(e);
    if (e.matches('img,svg,video,canvas,picture,[data-diagram]')) return true; // a diagram's area is content even while it draws
    if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return true;
    const filled = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none';
    const bordered = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0;
    return (filled || bordered) && e.getBoundingClientRect().width < vw - 2; };
  const fixed = (e) => { for (let a = e; a; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === 'fixed') return true; } return false; };
  const main = document.querySelector('main') || document.body;
  const res = { escape: [], dead: [] };

  // GRID_ESCAPE
  const left = Math.max(0, (vw - 1200) / 2) + 20, right = vw - left;
  [...main.querySelectorAll('*')].forEach((e) => {
    if (e.closest('[data-bleed],footer,nav,header[role=banner]') || fixed(e) || !shown(e)) return;
    const p = paint(e); if (p.width < 120 || p.height < 80 || p.bottom < 0 || p.top > vh) return;
    if (p.width >= vw - 2) return; // a full-width section band, not a content block
    // judge the content box: a container's own padding is the page gutter, not an escape
    const ecs = getComputedStyle(e); const b = { left: p.left + parseFloat(ecs.paddingLeft), right: p.right - parseFloat(ecs.paddingRight) };
    if (b.left < left - 8 || b.right > right + 8) {
      // report the outermost escaping block only
      const parent = e.parentElement; const pp = parent && paint(parent);
      if (pp && pp.width < vw - 2) { const pcs = getComputedStyle(parent); const pl = pp.left + parseFloat(pcs.paddingLeft), pr = pp.right - parseFloat(pcs.paddingRight); if (pl < left - 8 || pr > right + 8) return; }
      res.escape.push(`${where(e)} spans x ${Math.round(b.left)}..${Math.round(b.right)} but the page column is ${Math.round(left)}..${Math.round(right)}`);
    }
  });

  // COLUMN_DEAD_SPACE: rows of side-by-side columns fully on screen
  [...main.querySelectorAll('*')].forEach((row) => {
    const cs = getComputedStyle(row); if (!/grid|flex/.test(cs.display) || !shown(row)) return;
    const kids = [...row.children].filter((k) => shown(k) && getComputedStyle(k).position !== 'absolute');
    if (kids.length < 2) return;
    const rb = row.getBoundingClientRect(); if (rb.height < 240 || rb.top < -1 || rb.bottom > vh + 1) return;
    const boxes = kids.map((k) => ({ k, b: k.getBoundingClientRect() }));
    const side = boxes.filter(({ b }) => b.width >= 200 && boxes.some((o) => o.b !== b && o.b.width >= 200 && Math.abs(o.b.left - b.left) > 40 && o.b.top < b.bottom && b.top < o.b.bottom));
    if (side.length < 2) return;
    // columns that are moving (a scroll scene mid-transition) cannot be judged as a layout; skip until they rest
    if (side.some(({ k }) => getComputedStyle(k).transform !== 'none')) return;
    const sticky = (k) => getComputedStyle(k).position === 'sticky'; // a sticky rail is shorter than its neighbour by design
    // one row only: every column overlaps every other vertically (a grid with spanning tiles has several rows)
    if (side.some((a) => side.some((o) => o.b.top >= a.b.bottom - 1 || a.b.top >= o.b.bottom - 1))) return;
    const top = Math.min(...side.map(({ b }) => b.top)), bottom = Math.max(...side.map(({ b }) => b.bottom)), h = bottom - top;
    side.forEach(({ k }) => {
      if (sticky(k)) return;
      const marks = [k, ...k.querySelectorAll('*')].filter((e) => e !== k && leaf(e) && shown(e)).map(paint).filter((b) => b.width > 0 && b.height > 0)
        .map((b) => [Math.max(top, b.top), Math.min(bottom, b.bottom)]).filter(([a, z]) => z > a).sort((a, z) => a[0] - z[0]);
      if (!marks.length) return;
      // the largest band of the row with nothing painted in this column (top, between blocks, or bottom)
      let gap = 0, at = '', y = top;
      for (const [a, z] of marks) { if (a - y > gap) { gap = a - y; at = y === top ? 'above' : 'inside'; } y = Math.max(y, z); }
      if (bottom - y > gap) { gap = bottom - y; at = 'below'; }
      if (gap > 120 && gap > h * .2) res.dead.push(`${where(k)}: ${Math.round(gap)}px of the ${Math.round(h)}px row is empty ${at} its content, beside ${name(side.find((s) => s.k !== k).k)}`);
    });
  });
  return res;
}

function sparse() {
  return [...document.querySelectorAll('[data-story-card]')].map((card) => {
    const stage = card.matches('[aria-hidden=true]') ? card : card.querySelector('[aria-hidden=true]') || card;
    const s = stage.getBoundingClientRect(); if (s.width < 120 || s.height < 80) return null;
    const N = 24, cells = new Uint8Array(N * N);
    [...stage.querySelectorAll('*')].forEach((e) => {
      const cs = getComputedStyle(e); if (+cs.opacity < .2 || cs.visibility === 'hidden') return;
      const own = e.matches('img,svg,video,canvas,i,b') || [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0;
      if (!own) return;
      const b = e.getBoundingClientRect();
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const cx = s.left + (x + .5) * s.width / N, cy = s.top + (y + .5) * s.height / N; if (cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom) cells[y * N + x] = 1; }
    });
    const cover = cells.reduce((a, c) => a + c, 0) / (N * N);
    return { name: card.getAttribute('data-story') || 'explainer', where: card.closest('[data-landing-v2]')?.getAttribute('data-landing-v2') || 'page', cover: Math.round(cover * 100) };
  }).filter(Boolean);
}

const browser = await chromium.launch({ executablePath: args.chrome || undefined, args: ['--no-sandbox'] });
async function open(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  try { await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); } catch { await page.waitForLoadState('load'); await page.waitForTimeout(2000); }
  await page.waitForTimeout(1200);
  return { ctx, page };
}

// 1. the walk
for (const [w, h] of [[375, 800], [768, 1024], [1440, 900], [1870, 1880]]) {
  const { ctx, page } = await open(w, h);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  let k = 0;
  for (let y = 0; y < total; y += Math.round(h * .75)) {
    await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(900);
    const file = `walk/${w}x${h}-${String(k).padStart(2, '0')}.png`;
    await page.screenshot({ path: path.join(out, file) });
    images.push({ file, label: `${w}x${h}, scrolled to ${y}px` });
    const g = await page.evaluate(geometry);
    g.escape.forEach((d) => add('FAIL', 'GRID_ESCAPE', `${w}x${h} @${y}`, d));
    g.dead.forEach((d) => add('FAIL', 'COLUMN_DEAD_SPACE', `${w}x${h} @${y}`, d));
    k++;
  }
  await ctx.close();
}

// 2. explainer filmstrips (animations paused and stepped; the story attribute is set the way the page plays it)
for (const [w, h] of [[1440, 900], [375, 800]]) {
  const { ctx, page } = await open(w, h);
  const cards = await page.evaluate(() => [...document.querySelectorAll('[data-story-card]')].map((c, i) => { c.setAttribute('data-proof-card', String(i)); return i; }));
  if (w === 1440) {
    await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => { e.setAttribute('data-revealed', 'true'); }));
    for (const s of await page.evaluate(sparse)) if (s.cover < 35) add('FAIL', 'EXPLAINER_SPARSE', `${s.where} > ${s.name}`, `painted content covers ${s.cover}% of the explainer at rest: a small drawing in a big empty box; fill the stage with the subject`);
  }
  for (const i of cards) {
    const el = page.locator(`[data-proof-card="${i}"]`);
    if (!(await el.isVisible())) continue; // hidden at this width
    await el.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(400);
    // let the card's own entrance finish first: the filmstrip shows the explainer's story, not its reveal
    await page.evaluate((i) => { const c = document.querySelector(`[data-proof-card="${i}"]`); c.setAttribute('data-revealed', 'true'); c.removeAttribute('data-story-playing'); }, i);
    await page.waitForTimeout(1100);
    await page.evaluate((i) => document.querySelector(`[data-proof-card="${i}"]`).setAttribute('data-story-playing', 'true'), i);
    await page.waitForTimeout(60);
    const ms = await page.evaluate((i) => { const c = document.querySelector(`[data-proof-card="${i}"]`); const a = c.getAnimations({ subtree: true }).filter((x) => x.effect?.target !== c && !x.effect?.target?.matches?.('[data-reveal]')); a.forEach((x) => x.pause()); return Math.max(0, ...a.map((x) => { const t = x.effect.getComputedTiming(); return (t.delay || 0) + (t.activeDuration === Infinity ? t.duration : t.activeDuration); })); }, i);
    const name = await page.evaluate((i) => document.querySelector(`[data-proof-card="${i}"]`).getAttribute('data-story') || `card${i}`, i);
    for (const f of [0, .25, .5, .75, 1]) {
      await page.evaluate(([i, t]) => { const c = document.querySelector(`[data-proof-card="${i}"]`); c.getAnimations({ subtree: true }).filter((x) => x.effect?.target !== c && !x.effect?.target?.matches?.('[data-reveal]')).forEach((x) => { x.currentTime = t; }); }, [i, ms * f]);
      await page.waitForTimeout(80);
      const file = `films/${w}-${String(i).padStart(2, '0')}-${name}-${Math.round(f * 100)}.png`;
      await el.screenshot({ path: path.join(out, file), timeout: 10000 });
      images.push({ file, label: `explainer "${name}" at ${w}px, ${Math.round(f * 100)}% of its animation` });
    }
  }
  await ctx.close();
}
await browser.close();

fs.writeFileSync(path.join(out, 'findings.json'), JSON.stringify(findings, null, 2));
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><meta charset=utf-8><title>proof</title><style>body{background:#111;color:#ddd;font:14px system-ui;margin:24px}figure{margin:0 0 32px}img{max-width:100%;border:1px solid #333}</style>
<h1>Proof: ${url}</h1><ol>${findings.map((f) => `<li>${f.level} ${f.check} ${f.where}: ${f.detail}</li>`).join('')}</ol>
${images.map((i) => `<figure><figcaption>${i.file}: ${i.label}</figcaption><img src="${i.file}" loading=lazy></figure>`).join('\n')}`);
fs.writeFileSync(path.join(out, 'REVIEW.md'), `# Proof review: ${url}

Open index.html and judge every image at full size. Verdict per image: "ship" or "fix: <what is wrong>".
The fresh-eyes reviewer did not build the page and gets only the images and the owner-review questions
(grid alignment, dead space, legibility, does each explainer explain and look as good as the home bento).

Fresh-eyes reviewer:

| Image | Builder | Fresh eyes |
|---|---|---|
${images.map((i) => `| ${i.file} |  |  |`).join('\n')}
`);
console.log(`proof: ${images.length} images, ${findings.filter((f) => f.level === 'FAIL').length} geometry failures -> ${out}`);
findings.forEach((f) => console.log(`${f.level} ${f.check} ${f.where}: ${f.detail}`));
