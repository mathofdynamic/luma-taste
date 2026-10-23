# Signature patterns

Luma's recurring interactions, specified precisely enough that every page builds them the same way. Each one exists because the owner rejected a weaker version (see `owner-review-log.md`). The first implementation lives on the home page (`components/landing-v2/` in luma-landing); reuse and generalise it rather than re-inventing it per page.

All patterns: transform / opacity / clip-path only (exceptions named), gated hover (`(hover: hover) and (pointer: fine)`), keyboard parity, reduced-motion fallback, readable without JS.

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
- Scenes: at least 4 tools (create image, edit image before→after, make video, virtual try-on garment→result, assistant chat). Each scene: `type` (prompt reveals with a clip-path wipe in reading direction + caret, about 1.1s) → `process` (generate button presses, progress line fills, skeleton shimmer, about 0.9s) → `reveal` (result wipes/scales in, 600ms) → `hold` (about 1.8s). 4 to 5s per scene.
- The tool rail is real buttons: the active pill slides (`transform`) to the current tool; clicking a tool jumps to it and pauses auto-advance for 8s.
- State lives in `data-scene` / `data-phase` on the root; CSS does every motion. A tiny scheduler (timeouts, not rAF) advances phases only while the studio is in view, the tab is visible, and reduced motion is off.
- SSR / no-JS / reduced motion: the first scene in its settled `hold` frame, and the rail still lists every tool.
- Media: local optimized WebP (≤ 50 KB each) from real results with provenance; only the first scene's media in the initial HTML, the next scene's media preloaded during the current scene.
- The H1 stays the LCP element; the studio never blocks it.

## 5. Pointer-following comparison (before / after)

- Stage: `role="slider"`, `tabindex="0"`, `aria-valuemin=0 aria-valuemax=100 aria-valuenow`, `aria-label`. Two layers; the result layer is clipped with `clip-path: inset(0 0 0 var(--pos))` (physical left/right chosen so the divider matches the labels), plus a 2px divider with a round handle at `--pos`.
- Fine pointer: `pointermove` over the stage sets `--pos` (rAF-throttled, one CSS variable write). No click needed.
- Touch: `pointerdown` + `setPointerCapture` drag; `touch-action: pan-y` keeps vertical scrolling.
- Keyboard: ArrowLeft/Right ±5, Home/End.
- On first view the divider sweeps once (50 → 70 → 50, 1.2s `--lm-ease-move`) to invite interaction, unless the user already moved it.
- No range input under the image.

## 6. Media loading: skeleton then reveal

- Every media tile renders a skeleton in its final shape (fixed aspect ratio) with a shimmer: a pseudo-element with a soft diagonal highlight translating across (1.6s linear loop, `transform` only), **gated**: it only exists while `data-loading="true"` and runs only while the tile is in view.
- When the image's `load` fires (or `img.complete` at mount), `data-loading` flips to `false`; the image transitions `opacity 0 → 1` and `scale(1.03) → 1` over 500ms `--lm-ease-out`; the skeleton fades out.
- Batches stagger by tile (40ms lead, capped).
- Error: keep the skeleton shape, stop the shimmer, show a small quiet icon and the title; never a broken-image glyph.
- Without JS: no `data-loading` attribute, so images are simply visible.

## 7. Explainer stories

- Card root carries `data-story-card`, `data-story="<name>"`, and `data-story-ms` (its length). The runtime sets `data-story-playing="true"` to play; CSS keyframes keyed on that attribute do the motion.
- Plays when the card enters the view (once at least 35% visible), then repeats while in view with a rest (`data-story-ms` + 2s); hover / focus restarts it immediately; stops off-screen, tab hidden, reduced motion.
- The default (non-playing) state is the **finished** frame.
- Story beats per card: see `layout-and-components.md` section 5.

## 8. Lens marquee (testimonials)

- Edge fade: `mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)` on the viewport.
- Lens: each card's transform depends on its horizontal distance `d` from the viewport center (normalized −1…1): `perspective(1200px) rotateY(d * -28deg) scale(1 + |d| * .14)` and `opacity: 1 - smoothstep(.72, 1.05, |d|)`. Cards near the edges are larger, turned toward the viewer (concave cylinder) and fade away.
- Implementation: one shared rAF ticker per section, running only while the section is in view and the tab is visible. It advances the track offset (`translate3d`) and writes each card's transform/opacity from cached geometry (card centers measured on resize, never per frame). Hover/focus eases the speed to 0 over about 400ms (no abrupt stop); a pause button toggles it.
- Two identical sets for the seamless wrap; the duplicate set is `aria-hidden` and `inert`.
- Reduced motion / Save-Data: no ticker, no lens; a swipeable static row with the edge fade.

## 9. Mobile menu sheet

- Scrim: `rgb(0 0 0 / .5)` + `backdrop-filter: blur(4px)`, opacity 240ms.
- Sheet: `.lm-glass-sheet`, 24px radius, 12px from the screen edges, max height `calc(100dvh - 24px)`; content laid out to fit 375×667 without an inner scrollbar (sub-menus collapsed as accordions).
- Open: from the menu button corner (`transform-origin` there), `scale(.96) translateY(-8px)` + opacity → none, 320ms `--lm-ease-out`; items stagger (200ms, 30ms lead). Close 160ms.
- Items: icon plate + label rows, 48px tall; active page row shows the pill; accordions rotate their chevron and reveal sub-items (with icons) using the same stagger.
- Header row: logo, theme toggle, close button (44px each). Footer row: sign-in (secondary) and sign-up (primary liquid button), always visible.
- Focus is trapped by `<dialog>.showModal()`; Escape, scrim click and close button close it; focus returns to the menu button.
