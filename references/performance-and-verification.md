# Performance and verification

Rich motion and a fast page are both requirements. This file says how to keep motion cheap and how to prove it.

## 1. Budgets (mobile, Slow 4G, 4x CPU throttle)

| Metric | Target | Hard fail |
|---|---|---|
| LCP | 2.5s or less | over 4s |
| CLS | 0.05 or less | over 0.1 |
| TBT | 200ms or less | over 400ms |
| Initial JS (gzip) | 170 KB or less | over 300 KB |
| Initial transfer above the fold | 1 MB or less | over 2 MB |
| Requests before interaction | 40 or less | over 70 |
| Any single mobile image | 120 KB or less | over 250 KB |
| Fonts | 2 files and 150 KB or less | more than 3 files |
| Motion runtime JS | about 3 KB gzip or less | over 10 KB |
| Concurrent decorative loops in a mobile viewport | 3 to 4 or less | more than 5 |
| Loading shimmers (`data-loop="skeleton"`) | exempt from the loop count while media loads; transform-only, in-view gated, stop on decode **and** on error | still running over a decoded image (`SKELETON_AFTER_LOAD`) |

If a budget cannot be met, explain why with evidence and propose the least-bad alternative. Do not silently relax a budget, and do not silently remove signature motion.

## 2. How to keep rich motion cheap

1. **CSS first.** Transitions and keyframes on `transform`/`opacity` run off the main thread. Hover stories, reveals, marquee, orbit: all CSS.
2. **Gate every loop to the viewport** (`data-loop` plus `data-in-view`). Offscreen loops cost nothing.
3. **No motion library on the critical path.** If springs or layout animation are needed (before/after slider, gestures), load that island lazily on visibility or interaction.
4. **Server-render the content;** motion adds classes after hydration. Hidden initial states only behind the `.lm-motion` class so a JS failure leaves content visible.
5. **Lazy-hydrate below-the-fold sections** and keep the motion runtime tiny (one IntersectionObserver for reveal, one for loops).
   - **Below-fold motion engines load on approach:** server-render the content, keep the client shell tiny, and `import()` the engine (marquee/lens ticker, heavy story logic) from an IntersectionObserver with about 800px root margin. Until it loads, the content is the no-JS state (a swipeable row). Home example: `LensMarquee.tsx` + `lens-engine.ts`.
   - **Measure against the baseline commit**, not only the budget: build the pre-change commit in a worktree (run `pnpm install` there; Turbopack rejects a `node_modules` junction outside the project root) and report both medians. Lighthouse *simulated* LCP chains the hero text behind CPU work; also report the observed LCP from the `metrics` audit.
6. **Small blur layers only.** `backdrop-filter` on the header, menus and lightbox, never on large areas; the audit warns on large blur on mobile. Keep blur radius at 20px or less.
7. **No large animated blur, canvas, WebGL or video backgrounds on mobile.** Use static radial gradients and pre-rendered AVIF/WebP.
8. **`content-visibility: auto` with `contain-intrinsic-size`** for long below-the-fold sections; `contain: paint` on animated zones.
9. **`will-change` only** just before a transform animation needs it, then remove it.
10. **Respect Save-Data and reduced motion:** reduced motion disables loops; consider disabling optional ambient layers when `navigator.connection.saveData` is true.

## 3. Evidence protocol

Never claim motion works from reading code. For every task:

1. **Build and project checks** pass (build, type-check, tests, lint with no new diagnostics).
2. **Run the audit** against a production build (`build` then `start`), not dev mode:
   ```
   node .agents/skills/luma-taste/scripts/motion-audit.mjs --url http://localhost:3000 \
     --out audit/motion --widths 375,1440 --themes dark,light --seam
   ```
   It needs `playwright-core` (found next to the script or in the current project; install it audit-only if missing) and a Chromium; pass `--chrome <path>` if none is installed. **Theme switching:** use `--theme-attr class` for next-themes (`.dark` / `.light`, unrelated root classes are kept); the script fails with `THEME_NOT_APPLIED` if dark and light render the same background, so a wrong attribute cannot silently audit one theme twice. **Strict viewport:** loops count as in view only inside the viewport (`--margin 0`, relax only with a reason). Exit code 1 means a FAIL.
   It checks: loops running off-screen, paint-heavy loop properties, too many concurrent decorative loops (the warning names them; `data-loop="skeleton"` loading shimmers are excluded but fail as `SKELETON_AFTER_LOAD` if they outlive their image), clipped / truncated / sub-12px text (clipping is measured on the text's line boxes, so a liquid-fill `::before` parked outside a button does not count), Persian letter-spacing, horizontal overflow, console errors, large mobile blur layers, entrance timing (`ENTRANCE_TOO_FAST` under 400ms fails; `ENTRANCE_DURATION_DRIFT` warns when more than 100ms away from `--enter-ms`, default 600), idle layout shift (`IDLE_LAYOUT_SHIFT`: the page sits at the top for 12s with no input and any auto-playing demo, story or marquee that moves layout fails; typical cause: a scene or phase whose text wraps to one more line, a caret that wraps, a badge that appears), reveals that can never fire (`REVEAL_NEVER_FIRES`: after scrolling to the very bottom, an on-screen element is still staged hidden, typically the footer inside a shrunken root margin), premature reveals (`PREMATURE_REVEAL`: a `[data-reveal]` element below the fold is already visible right after load, meaning the page revealed everything at load or never staged the hidden state, so its reveal will blink), reduced-motion behavior (no loops, nothing hidden), no-JS visibility, and seam frames for every loop (t=0, one frame before the wrap, and t=period; all other animations, including finite explainer stories, are frozen during capture; a channel delta of 2 or less counts as identical antialiasing noise; inspect the images, since endpoint wrapping can hide a jump). Animating `filter`/`backdrop-filter` inside a loop is reported as paint-heavy.
3. **Lighthouse mobile** (Slow 4G, 4x CPU, 3 runs, median): LCP, TBT, CLS, initial JS, requests, and the LCP element. Report against the budgets.
4. **Inspect rendered pages** at 375px and 1440px, dark and light, with screenshots (full-page captures render `content-visibility:auto` sections blank outside the real viewport: inject `*{content-visibility:visible!important}` before a full-page shot, and never "fix" a blank band in a capture without checking a viewport screenshot first); scroll the whole page and confirm reveals fire once, loops start only in view, and the gradient/glow concurrency stays reasonable.
5. **Interaction checks:** every hover story, press feedback, keyboard focus, menu/popover open (240ms), sheet/dialog/lightbox open (320ms), close (160ms), dropdown hover intent and morph between triggers, theme circle, liquid button fill, Escape, outside click, focus return, reopen during close.
6. **Reduced motion and JS-off** spot checks (the audit covers the basics).
7. **Seam frames:** open the `seam-*` images and confirm no visible jump between t=0 and t=period. The script reports identical-or-differs; tiny anti-aliasing differences are acceptable, a visible jump is not.
8. **Feel checks** (motion-system.md section 10) on a real phone when possible.
9. **Owner review checklist:** walk the checklist at the end of `owner-review-log.md` on the rendered page and report each line (pass / fail / not applicable).

## 4. The evidence report

Include, in the review README or the final message:

- The **motion matrix as built** and a **motion inventory**: for each animation, selector, layer (L1 to L6), purpose, tool, properties, duration/curve, trigger, loop or one-shot, in-view gating verified, reduced-motion variant.
- Audit output (`motion-audit.md`) with every FAIL fixed and every WARN fixed or explicitly accepted with a reason.
- Budget table (before / after) and the LCP element.
- Screenshots: 375px and 1440px, dark and light; before and after where relevant; seam frames for loops.
- A plain list of what is **verified in a browser** and what is **not** (for example: real-phone feel untested, live media payload unmeasured, touch hover behavior untested).
- Other pages unchanged when the task is scoped to one page (screenshots of three other pages).

## 5. Known limits of the tooling

The audit proves structure and behavior (what runs, when, on which properties, whether loops pause and seam). It does not judge taste or feel, does not measure frame rate on a real phone, and its overlap/grid checks are by overlay and eye. Say so in reports.

### Regression fixtures

`fixtures/correct.html` is a class-themed page with a strictly gated gradient, an equal-half duplicated-set marquee, and a below-the-fold element staged hidden and revealed on scroll with Luma timing. `fixtures/broken.html` plants offscreen looping, clipping, ellipsis, Persian tracking, overflow, no-JS hidden content, missing class themes, a below-the-fold element visible at load, a 100ms reveal, a footer that never reveals, and an auto demo that adds a line every 1.5s. The correct fixture also carries a liquid-fill button (must not count as clipped) and the end-of-page reveal fallback. Serve fixtures with a local HTTP server; run the audit from a tooling cwd with playwright-core, `--theme-attr class --seam --widths 375,1440 --themes dark,light --chrome <path>`. Correct must have 0 FAIL and identical seams; broken must fail every planted category. The checked summary records the executed expectations. Seam capture covers all loops (no six-loop cap). `--margin` rejects negative or non-finite values.

No-JS visibility waits for DOM and fonts, not the load event (a stalled external image must not prevent inspecting readable SSR content). Seam capture settles finite entrance/explainer effects for 1000ms before sampling the isolated loop so parent opacity is not mistaken for a loop discontinuity.

Seam captures use a fixed crop of the clipping viewport, rather than scrolling a transformed loop element into view for each frame. This keeps the near-wrap and endpoint frames comparable for translated marquees.
