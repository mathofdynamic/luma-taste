# Signature patterns

Luma's recurring interactions, specified precisely enough that every page builds them the same way. Each one exists because the owner rejected a weaker version (see `owner-review-log.md`). The first implementation lives on the home page (`components/landing-v2/` in luma-landing); reuse and generalise it rather than re-inventing it per page.

All patterns: transform / opacity / clip-path only (exceptions named: the nav panel morph, and the loading shimmer in section 6, which animates `background-position` on a layer that never moves), gated hover (`(hover: hover) and (pointer: fine)`), keyboard parity, reduced-motion fallback, readable without JS.

---

## 1. Navigation: active pill + morphing hover-intent dropdown

**Active state.** The current page's item is a pill: `background: var(--surface-2); border: 1px solid var(--border-strong); color: var(--text); border-radius: 9999px`. Hover on other items shows a lighter pill (`--surface-1`, transparent border). No `text-decoration`, no `::after` underline anywhere in the nav.

**One panel, many menus.** All dropdowns share a single glass panel (`.lm-glass-strong`) positioned under the bar. Each trigger owns a *section* inside it.

```
<nav data-nav-root>                       pointerleave on this root -> close after 160ms
  <button data-menu-trigger="services" aria-expanded aria-controls="nav-panel">سرویس‌ها</button>
  ...
  <div id="nav-panel" data-state="closed|open|closing" style="--panel-x; --panel-w; --panel-h">
    <div data-menu-section="services" data-active="true|false" inert?>  icon + label + one-line description items
    <div data-menu-section="support"  ...>
  </div>
</nav>
```

| Behaviour | Spec |
|---|---|
| Hover intent | fine pointer enters a trigger: open after 80ms (cancel if it leaves first). Pointer leaves trigger **and** panel: close after 160ms (re-entering cancels). Moving to a plain link closes the panel |
| Click / touch | click toggles; touch never relies on hover |
| Keyboard | Enter/Space/ArrowDown on a trigger opens and focuses the first item; Escape closes and returns focus to the trigger; focus leaving the panel closes it |
| First open | panel placed at the trigger without sliding; materializes: opacity 0→1, `translate3d(0,8px,0) scale(.98)` → none, 240ms `--lm-ease-out`, `transform-origin` at the trigger |
| Switching menus while open | panel **slides** (`transform: translateX(var(--panel-x))`) and **morphs** (`width/height` to the new section's measured size) over 320ms `--lm-ease-move` (ease-in-out). Outgoing section fades out shifting 24px away from the direction of travel (160ms); incoming fades in from the travel side (240ms, 60ms delay). `width/height` here is the sanctioned exception: one absolutely positioned element with `contain: layout paint` |
| Items | each item: 36px icon plate (reuse the service icon, which plays its hover story on item hover) + label + optional one-line description; items stagger in (200ms, 30ms lead, 8px rise) every time a section becomes active |
| Close | opacity + 8px, 160ms `--lm-ease-close`, no stagger |
| Reduced motion | no slide/morph/stagger; instant open/close (short opacity is fine) |

Measure section sizes once on open (and on resize) with `getBoundingClientRect` of the section content; never per frame.

## 2. Theme switch: circular reveal from the toggle

```js
function switchTheme(next, button, apply) {          // apply(next) must synchronously set the root class
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce) { apply(next); return; }
  const r = button.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const root = document.documentElement;
  root.dataset.themeSwitching = '';
  const t = document.startViewTransition(() => apply(next));
  t.ready.then(() => root.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
    { duration: 550, easing: 'cubic-bezier(.77,0,.175,1)', pseudoElement: '::view-transition-new(root)' }));
  t.finished.finally(() => delete root.dataset.themeSwitching);
}
```
```css
html[data-theme-switching]::view-transition-old(root),
html[data-theme-switching]::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
```
With next-themes, `apply` sets the class on `<html>` directly and then calls `setTheme(next)` so storage and React state stay in sync. The toggle shows a sun or moon icon that rotates/cross-fades (300ms) on switch.

## 3. Liquid-fill button

The fill is a layer of the inverse color that rises from below as a curved wave; the label flips color as the wave passes it.

```css
.button { position: relative; isolation: isolate; overflow: hidden; }
.button::before {                      /* the liquid */
  content: ""; position: absolute; z-index: -1; pointer-events: none;
  inset-inline: -25%; inset-block-start: 100%; block-size: 260%;
  border-radius: 50%; background: var(--fill);
  transform: translate3d(0, 0, 0);
  transition: transform 450ms cubic-bezier(.77,0,.175,1);
}
@media (hover: hover) and (pointer: fine) {
  .button:hover::before, .button:focus-visible::before { transform: translate3d(0, -70%, 0); }
  .button:hover, .button:focus-visible { color: var(--fill-label); transition: color 250ms 120ms cubic-bezier(.23,1,.32,1); }
}
```
| Variant | Base | `--fill` / `--fill-label` | Border on hover |
|---|---|---|---|
| Primary | `--text` fill, `--bg` label | `--bg` / `--text` | `--text` (keeps the pill readable once filled) |
| Secondary | transparent, `--border-strong` | `--surface-2` / `--text` | `--text-3` |

Press: `:active { transform: scale(.97) }`. Reduced motion: no wave, instant color swap.

## 4. Hero studio (multi-tool living demo)

A product window that cycles through Luma's tools with **real** results.

```
┌ استودیو هوش مصنوعی لوما ─────────── ● آماده ┐
│ ▣ ساخت تصویر  │  [tool title, cross-fades]     │
│ ▢ ویرایش      │  ┌ canvas: skeleton → result ┐ │
│ ▢ ویدیو       │  │                            │ │
│ ▢ پوشاندن لباس│  └────────────────────────────┘ │
│ ▢ دستیار      │  [prompt typing ▍]   [تولید]    │
└────────────────────────────────────────────────┘
```
- Scenes: at least 4 tools (create image, edit image before→after, make video, virtual try-on garment→result, assistant chat). Each scene: `type` (the prompt is typed **word by word in reading order**, about 1.4s) → `process` (generate button presses, progress line fills, skeleton shimmer, about 1s) → `reveal` (result wipes/scales in, 800ms) → `hold` (about 2.4s). 5 to 6s per scene.
- **Typing is word by word, never a wipe over the block (owner review 02).** A single `clip-path` wipe over a prompt that wraps reveals line one and line two at the same time, which reads as fake. Split the text into word spans (`--w` index, `--n` count) and fade each word in at `w × (duration / n)`; a wrapped prompt then writes line one completely before line two starts. Persian words keep their joining because the split is at spaces only (ZWNJ stays inside the word). Every word keeps its final layout from the first frame (only opacity changes), so typing never reflows the hero. The caret is an absolutely positioned `::after` on the word being written (no box, no extra line); after the last word it blinks. The same applies to any typed answer (assistant chat, code, RAG answers): word by word, and the phase lasts until the last word has landed, or the switch to the next phase snaps the rest in at once.
- **Nothing in the demo may change size between scenes or phases** (idle shifts found at 375px, review 02): per-phase labels (status pill: typing / making / ready) share one grid cell with `visibility`, so the pill keeps the widest width; the studio's grid tracks are explicit (`grid-template-columns: minmax(0, 1fr)`), because an `auto` track follows the active scene's content and resized the media by 9px.
- The tool rail is real buttons: the active pill slides (`transform`) to the current tool; clicking a tool jumps to it and pauses auto-advance for 8s.
- State lives in `data-scene` / `data-phase` on the root; CSS does every motion. A tiny scheduler (timeouts, not rAF) advances phases only while the studio is in view, the tab is visible, and reduced motion is off.
- SSR / no-JS / reduced motion: the first scene in its settled `hold` frame, and the rail still lists every tool.
- Media: local optimized WebP (≤ 50 KB each) from real results with provenance; only the first scene's media in the initial HTML, the next scene's media preloaded during the current scene.
- The H1 stays the LCP element; the studio never blocks it.

## 5. Pointer-following comparison (before / after)

- Stage: `role="slider"`, `tabindex="0"`, `aria-valuemin=0 aria-valuemax=100 aria-valuenow`, `aria-label`. Two layers; the result layer is clipped with `clip-path: inset(0 0 0 var(--pos))` (physical left/right chosen so the divider matches the labels), plus a 2px divider with a round handle at `--pos`.
- **Move the divider with `transform`, never `left`.** Make the divider a full-stage layer translated by `calc(var(--pos) - 100%)` with the line and handle on its edge. Animating `left` is a layout change: every sweep (and every autoplay cycle) adds layout shift (measured on the home page, review 02).
- Image layers that sit on a shared media primitive must win by specificity (`.stage .layer`), not by stylesheet order: a later-loading chunk flipped `.media { position: relative }` over `.layer { position: absolute }` and a pair rendered in flow at half width.
- Fine pointer: `pointermove` over the stage sets `--pos` (rAF-throttled, one CSS variable write). No click needed.
- Touch: `pointerdown` + `setPointerCapture` drag; `touch-action: pan-y` keeps vertical scrolling.
- Keyboard: ArrowLeft/Right ±5, Home/End.
- On first view, and each time a case becomes active, the divider sweeps once (50 → 72 → 34 → 50, 1.6s `--lm-ease-move`) unless the user already moved it.
- No range input under the image.
- Inside a showcase with several cases, the comparison is part of the self-playing showcase (section 10).

## 6. Media loading: skeleton then reveal

- Every media tile renders a skeleton in its final shape (fixed aspect ratio) with a shimmer, **gated**: it only exists while `data-loading="true"` and runs only while the tile is in view.
- **The shimmer layer never moves (review 02).** Use `inset: 0` and a gradient `linear-gradient(100deg, transparent 40%, color-mix(in srgb, var(--text) 8%, transparent) 50%, transparent 60%) 100% 0 / 300% 100% no-repeat`, and animate only `background-position` from `100% 0` to `0 0` (1.6s linear). A highlight box translated in from outside the tile changes its clipped box on every pass, and Chrome counted each pass as layout shift (0.01 to 0.08 per gallery batch, even when the layer always covered the tile). This is the one sanctioned paint-property loop: small area, only while loading, in view only.
- When the image's `load` fires (or `img.complete` at mount), `data-loading` flips to `false`; the image transitions `opacity 0 → 1` and `scale(1.03) → 1` over 500ms `--lm-ease-out`; the skeleton fades out.
- Batches stagger by tile (40ms lead, capped).
- Error: keep the skeleton shape, stop the shimmer, show a small quiet icon and the title; never a broken-image glyph.
- **Masonry stays on the page grid.** Never CSS `columns`: it balances heights, so a short batch (a failed category, 9 of 12 works) left a column empty and the gallery stopped lining up with the sections around it (review 02). Use N equal grid columns (4 / 3 / 2) that span whole grid columns, and distribute tiles in JS (fewest tiles first, then the shortest column). Read the column count from `matchMedia` in the **first** render of a client-only section; starting at 4 and correcting in an effect painted a short block that then grew about 800px on phones.
- **A loading batch reserves its final height.** Each batch reserves a fixed column height before data arrives (`aspect-ratio: 1 / (slots × 1.1)`) and the tiles share it by shape (`flex-grow` = height ratio, images `object-fit: cover`); "load more" reserves the next batch on the click itself (inside the input window). Loading, odd image sizes or a failed request then never move the sections below. If a batch comes back short, fall back to natural tile shapes rather than stretching lone tiles into strips.
- Without JS: no `data-loading` attribute, so images are simply visible.

## 7. Explainer stories

- Card root carries `data-story-card`, `data-story="<name>"`, and `data-story-ms` (its length). The runtime sets `data-story-playing="true"` to play; CSS keyframes keyed on that attribute do the motion.
- Plays when the card enters the view (once at least 35% visible), then repeats while in view with a rest (`data-story-ms` + 2s); hover / focus restarts it immediately; stops off-screen, tab hidden, reduced motion.
- The default (non-playing) state is the **finished** frame.
- Story beats per card: see `layout-and-components.md` section 5.

## 8. Lens marquee (testimonials)

- **Full bleed (review 02).** The rows run edge to edge of the viewport, outside the 1200px container (the header stays in the container; the section clips `overflow-x`). Inside the container only about three cards show and the lens cannot be seen. This is the one sanctioned exception to "content stays in the container".
- Edge fade: `mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)` on the viewport.
- Lens: each card's transform depends on its horizontal distance `d` from the viewport center (normalized −1…1): `perspective(1200px) rotateY(d * -28deg) scale(1 + |d| * .14)` and `opacity: 1 - smoothstep(.72, 1.05, |d|)`. Cards near the edges are larger, turned toward the viewer (concave cylinder) and fade away. Normalize `d` by the **lens radius** `max(viewport / 2, 1.5 × card width)`, not by half the viewport alone: at 375px half the viewport is about one card, so neighbors sit at |d|≈1.8 (invisible) and the single card swings to the full turn within a few pixels (found on the home page at 375, review 01). Check the lens in a 375px viewport screenshot, not only at desktop.
- Implementation: one shared rAF ticker per section, running only while the section is in view and the tab is visible. It advances the track offset (`translate3d`) and writes each card's transform/opacity from cached geometry (card centers measured on resize, never per frame). Hover and focus ease the row's speed to 0 over about 400ms (no abrupt stop). **No visible pause button** (the owner called it a temporary-looking control): every row is focusable (`tabindex="0"`, an `aria-label` that says hover or focus stops it), so keyboard and pointer users can stop it, and reduced motion / Save-Data never move it.
- Two identical sets for the seamless wrap; the duplicate set is `aria-hidden` and `inert`.
- Reduced motion / Save-Data: no ticker, no lens; a swipeable static row with the edge fade.

## 10. Self-playing showcase (cases + stage)

The owner's rule (review 02): **the UI plays through its items itself; it never waits for the visitor to click.** A list of cases beside a stage is a little film, not a tab control.

- Auto-advance every 6.5s (DWELL); the comparison sweep plays at the start of each case. Pause while the pointer (mouse) or keyboard focus is inside the section, while it is less than 35% in view, in a hidden tab, and under reduced motion (then it is a static, clickable list). A click selects a case and restarts its dwell.
- A case still loading keeps its turn with the skeleton; a failed case is skipped after its dwell.
- All cases' media stay mounted and stacked, so the next case is already decoded when its turn comes; cross-fade the pairs (opacity, `will-change: opacity`: without it Chrome reported the fade to an empty case as a 0.07 layout shift).
- Titles that change per case all sit in one grid cell (`grid-area: 1/1`), so the heading keeps the tallest title's height; any text that changes during autoplay must not change layout (shifts without input count toward CLS).
- **Active state is a surface and border step, nothing else.** No gradient bars, side lines or progress lines inside cards (section 11).

## 11. No accent lines in cards; glows use all three brand colors

- **No decorative lines (review 02).** A gradient or colored bar on a card edge, a side stripe on the active item, a thin line under a card title: the owner calls this "AI slop" and it is banned in the entire UI. State is shown with surface, border, text color and motion. Functional lines stay: a real progress indicator or usage meter (mark it `data-progress`), a connector that is part of an explainer diagram (mark it `data-diagram`), the comparison divider, form focus rings. The audit fails `DECORATIVE_ACCENT_BAR`.
- **Pointer glow color rotates.** Luma's gradient has three colors (purple `#8B1BAD`, magenta `#ED457B`, orange `#FF9024`); a hover glow that is always one of them reads as a single purple brand. Each card the pointer enters picks one of the three at random, never the same as the previous card, and writes it as `--glow-c` on the card; the glow is `radial-gradient(240px circle at var(--glow-x) var(--glow-y), color-mix(in srgb, var(--glow-c) 16%, transparent), transparent 70%)`. One glowing card at a time. Applies to every grid of cards on every page.

## 9. Mobile menu sheet

- Scrim: `rgb(0 0 0 / .5)` + `backdrop-filter: blur(4px)`, opacity 240ms.
- Sheet: `.lm-glass-sheet`, 24px radius, 12px from the screen edges, max height `calc(100dvh - 24px)`; content laid out to fit 375×667 without an inner scrollbar (sub-menus collapsed as accordions).
- Open: from the menu button corner (`transform-origin` there), `scale(.96) translateY(-8px)` + opacity → none, 320ms `--lm-ease-out`; items stagger (200ms, 30ms lead). Close 160ms.
- Items: icon plate + label rows, 48px tall; active page row shows the pill; accordions rotate their chevron and reveal sub-items (with icons) using the same stagger.
- Header row: logo, theme toggle, close button (44px each). Footer row: sign-in (secondary) and sign-up (primary liquid button), always visible.
- Focus is trapped by `<dialog>.showModal()`; Escape, scrim click and close button close it; focus returns to the menu button.

## 12. Scroll-driven scene (owner reviews 06, 07, 08)

A scene whose state follows the scroll position, so scrolling tells the story. Every service page has at least one; the owner likes them.

- **Shape:** a wrapper that is the pinned screen plus the scroll distance (`calc(100svh + min(150vh, 1600px))`, capped so a tall monitor does not scroll forever) with a `position:sticky` stage inside it (`top` under the header).
- **The pinned screen is a whole screen (owner review 07).** While pinned, the stage is the only thing the visitor sees, on every monitor, including a 1900px-tall one:
  - **The section heading pins with the stage** (render it inside the stage). A heading above the wrapper scrolls away and leaves panes with no title.
  - **The stage is as tall as its capped frame and pins centred under the header** (owner review 08): on the wrapper `--h: min(calc(100svh - header - 16px), ~980px)` and `block-size: calc(var(--h) + scroll distance)`; on the stage `position:sticky; top: max(header, calc(header + (100svh - header - 16px - var(--h)) / 2)); block-size: var(--h)`. A full-screen stage that centres a smaller frame leaves an empty band above the section before it pins; a capped stage pinned to the top leaves a strip over an empty screen (review 07). Never a side column beside the stage that is shorter than it: put steps in a row under the stage instead.
  - On short screens drop the lead paragraph (and on phones the badge) from the pinned heading rather than clipping the stage.
  - Progress is measured from the real pin point: `p = (stickyTop - wrapper.top) / (wrapper.height - stage.height)`. Progress `p` = how far the wrapper has scrolled past the stage, 0 to 1. The stage shows steps or a continuous change driven by `p`: a waveform drawn left to right, panels sliding in order, a figure assembling, numbers counting.
- **Driver:** prefer CSS `animation-timeline: view()` / `scroll()` with `animation-range` where support allows; otherwise one passive `scroll` listener + `requestAnimationFrame` that writes `--scene-progress` (0 to 1) on the `[data-scroll-scene]` element and, for stepped scenes, `data-scene-step`. Everything visual derives from those with `transform`, `opacity`, `clip-path` on non-text shapes, or `stroke-dashoffset`. Never write layout properties per frame; never `scroll-snap` the page; never hijack wheel or touch.
- **Steps:** text for each step is stacked in one grid cell and cross-fades (no layout shift); the current step's text is also readable without the scene (it lives in the DOM, not only in pixels).
- **Fallbacks:** under reduced motion, without JS, or below a minimum viewport height (about 560px), the wrapper drops its extra height and the stage shows the finished state with every step's text listed; nothing is hidden.
- **Phones:** the same scene, shorter wrapper; the stage must fit in the viewport under the header with no clipped text.
- **Verification:** the audit's `NO_SCROLL_SCENE` scrolls the scene and expects `--scene-progress` or `data-scene-step` (or a CSS scroll/view timeline) to change. `PINNED_SCENE_NO_HEADING`, `PINNED_SCENE_EMPTY` and `PINNED_SCENE_CLIPPED` judge the pinned screen at 15/50/90% at every audited width plus 1440×1900 and 1920×1080. `SCROLL_LAYOUT_SHIFT` must stay clean. **Look at the pinned screen yourself** at a laptop, a phone and a tall monitor (screenshots at 50% progress) before reporting: a section frame captured outside the pin does not show what the visitor sees.

## 13. The background detail layer (owner review 10)

One decorative layer behind every page, mounted once in the root layout (`aria-hidden`, `pointer-events:none`), first child of a `position:relative` page wrapper so it paints above the sections' flat background colour but below their content. Pieces, all in the theme tokens so dark and light both work:

| Piece | How | Cost |
|---|---|---|
| Rails | two 1px lines at `calc(50% ± 600px)` (the page column's edges), `position:fixed` | none: fixed, never repaints on scroll |
| Margin dot field | `radial-gradient` dots on an 18px grid, `position:fixed`, masked to the margins outside the column and fading toward it | none while scrolling |
| Pointer light | a 360px element moved with `transform` on `pointermove` (rAF-throttled); the same dot grid as a mask (`mask-position` offset by the pointer so dots line up), filled with the purple → magenta → orange gradient, faded by a radial mask | one small repaint per frame while the pointer moves; only `(hover:hover) and (pointer:fine)`, never under reduced motion |
| Rail light | one fixed element as wide as the column whose two 1px edges are gradient segments (magenta left, orange right), travelling down with `translate3d` (11s): both rails, one loop | compositor only; one infinite animation (the page loop budget is 3 to 4); off under reduced motion |
| Seams | at each major section start (sections at least 360px apart; the first section opens the page): a dashed 1px hairline across the width, a 9px "+" on each rail (the first seam's in magenta), the section number (12px, Persian digits) in the right margin (RTL start) | positions measured once and on `ResizeObserver` of `<main>`; absolute elements |
| Rings | `repeating-radial-gradient` rings every 72px from the top centre, radially masked, behind the first screen | static |

Rules: lines about 9% and dots about 11% of the text colour; rings fainter; nothing in the column except the seams, which fall in the whitespace between sections. Rails, margin dots, "+" marks and numbers only where the margins exist (from about 1280px wide; numbers from 1360px); on phones only the seams and rings remain. `forced-colors` hides the layer. A full-bleed band (the testimonial marquee) interrupts the frame: give that section `position:relative; z-index:1` and its solid background so rails and margin dots stop at it instead of showing through edge-faded cards. Do not add a second layer per page: if a page needs a stronger moment, tune that page's hero glow, not the shared layer. Mount it inside `<Suspense fallback={null}>`: it reads the pathname (`usePathname`) to re-measure seams, and under Cache Components a pathname read outside a Suspense boundary suspends the whole layout, so dynamic `[id]` routes prerender an empty shell (and lose the site-wide JSON-LD). Before reporting, run the project's own tests and schema check, not only the build. Reference implementation: `components/backdrop/` in the Luma landing project (mounted in `app/layout.tsx`).
