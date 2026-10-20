# Luma motion system

Sources distilled here: the entrance-motion contract (owner's skill), Emil Kowalski's animation principles, and Apple's fluid-interface principles (WWDC "Designing Fluid Interfaces"), adapted to a marketing site where **delight is in the budget** (a landing page is a "rare / first-visit" surface, not a 100-times-a-day tool).

Starter code: `assets/luma-motion.css` and `assets/luma-motion.js` (tested in headless Chromium: entrance timing, once-only reveal, surface open/close/reopen, loop gating, seams).

## 1. Six layers of motion

| Layer | What | Tool | Governed by |
|---|---|---|---|
| L1 Entrance | page and section reveal, staggered | CSS transitions + IntersectionObserver | entrance contract |
| L2 Transient surfaces | menus, popovers, dialogs, drawers, lightbox open and close | CSS state machine (`open / closing / closed`) | entrance contract |
| L3 Interactive response | hover, press, focus, drag | CSS transitions; springs only for drag/momentum | sections 4 and 7 |
| L4 Scroll-playful | things fill, draw, count, trigger as they enter | CSS scroll timelines with fallback, or one-shot IO triggers | section 5 |
| L5 Ambient loops | animated gradient word, marquee, orbit, gentle pulse | CSS keyframes, gated to viewport | section 6 |
| L6 Gesture physics | swipe, draggable before/after, sheets | springs (Motion or WAAPI) in a lazy island | section 7 |

Every section must declare which layers it uses (the motion matrix in `SKILL.md`).

## 2. Decision gate for each animation

1. **Frequency tier.** Landing page elements are occasional or first-visit, so rich motion is allowed. If an interaction is used constantly in a product (keyboard shortcuts, command palettes, dense list navigation), do not animate it.
2. **Name the purpose** in one word: feedback, spatial consistency, state indication, preventing a jarring change, explanation, or delight. Delight is allowed on the landing page; it must still be named. If you cannot name it, do not build it.
3. **Function check.** Data the user is reading or acting on (prices, numbers in a table) does not move for style.
4. **Cost check.** Pick the cheapest tool that works (section 3) and state the properties and the gating.

## 3. Tool ladder (cheapest that works)

| Need | Tool |
|---|---|
| Hover, press, color, state toggled by class or attribute | CSS transition |
| Mount-time entry without JS state | `@starting-style` or the reveal system |
| Predetermined motion that must stay smooth while the page is busy | CSS animation (compositor, off the main thread) |
| Programmatic control with CSS-grade performance | WAAPI `element.animate()` |
| Springs, layout animation, exit animation, gesture-driven values | Motion (motion.dev), **only in a lazily loaded island, never on the critical path** |
| Scroll-linked progress | CSS `animation-timeline: view()/scroll()` guarded by `@supports`; IO one-shot fallback |

If the task needs a component (dialog, dropdown, toast), use the project's accessible primitive instead of hand-rolling focus management.

## 4. Properties, easing, duration

- **Animate `transform` and `opacity` only.** `clip-path` is acceptable for reveals; SVG `stroke-dashoffset` for line draws on small SVGs. Never `width/height/margin/padding/top/left`. The one sanctioned paint-only loop is the gradient word's `background-position`, because it is a single small element, in view only.
- Never `scale(0)`: start from `scale(.9 to .97)` plus opacity 0.
- Set `transform-origin` at the trigger for popovers and menus (modals stay centered).
- Never drive a child's transform from a parent CSS variable (restyles every child).
- Name transitioned properties; never `transition: all`.

| Situation | Easing |
|---|---|
| Entrance / exit contract | `cubic-bezier(.16,1,.3,1)` open, `cubic-bezier(.4,0,1,1)` close (from the contract) |
| Hover, press, color | `cubic-bezier(.23,1,.32,1)` (`--lm-ease-ui`) |
| On-screen movement or morph | `cubic-bezier(.77,0,.175,1)` (`--lm-ease-move`) |
| Constant motion (marquee, gradient flow, orbit) | `linear` |

Never `ease-in` on UI (it delays the exact moment the user is watching). Do not invent curves.

| Element | Duration |
|---|---|
| Press feedback | 100 to 160ms |
| Hover | 150 to 250ms |
| Small popovers, tooltips | 125 to 200ms |
| Entrances and surface opens | **100ms** (contract) |
| Surface close | **66ms** (contract) |
| Explanatory / illustrative sequences (one-shot) | up to about 800ms total, only for explainers |
| Loops | seconds (gradient flow 6s, orbit 40 to 80s, marquee 40 to 80s per set) |

UI feedback stays under 300ms. Stagger siblings by 30 to 80ms (entrance uses duration/3 per the contract).

## 5. Interactive response, scroll-playful beats

### Hover and press
- **Respond on pointer-down**, not on release: `:active` scale about .97 over 100 to 160ms.
- Gate hover motion with `@media (hover: hover) and (pointer: fine)`; touch fires false hovers.
- A hover shows **what the element is** (see the hover vocabulary in `layout-and-components.md`). Neutral border/background change is the baseline; the icon or illustration story is the delight.
- Touch equivalent: never hide information behind hover. On touch, play the card's story once when it enters view, or on tap.
- Keyboard: `:focus-visible` triggers the same story as hover.

### Scroll-playful beats (plan at least one per ~1.5 screens)
Ideas that fit Luma: a progress line that fills as a section enters; orbit connectors that draw; numbers that count up once; the before/after reveal that follows scroll; a product visual that responds to scroll position; cards that "complete" (a skeleton resolves into the result) when they enter.
- Prefer CSS scroll timelines (`animation-timeline: view()`) inside `@supports`, with the **final state as the default** so unsupported browsers show finished content. Browser support differs; verify in the browsers you target.
- Otherwise use a one-shot IntersectionObserver that adds a class once.
- Transform, opacity, clip-path, and small-SVG stroke only. No scroll-jacking. No continuous per-pixel JS scroll handlers.

## 6. Loop animations (extra care, with proof)

Loops are where pages go wrong. Every loop must satisfy **all** of these, and the audit script checks them:

1. **Gated to the viewport.** The loop element carries `data-loop`; the runtime sets `data-in-view`; CSS reads `--lm-loop-state` (`paused` by default). A loop never runs off-screen. With JS off, loops stay paused and content stays readable.
2. **Seamless.** The first and last frames are visually identical (gradient: first stop = last stop and shift exactly one tile; marquee: two identical sets, translate exactly 50% when every item carries the same trailing margin). Verify with `motion-audit.mjs --seam` and look at the frames.
3. **Cheap.** Compositor properties only (exception above). No loops on large blurred layers. At most 3 to 4 loops running in a mobile viewport.
4. **Interruptible by the user.** Marquee pauses on hover and focus-within. Nothing auto-moving blocks reading or focus.
5. **Reduced-motion safe.** Gradient becomes a static gradient; marquee becomes a swipeable scroller with the duplicate set hidden; orbit stops.
6. **Accessible.** The duplicate set is `aria-hidden` and `inert`/not focusable; moving content has a pause path; no flashing.
7. **Clean lifecycle.** Observers disconnect on unmount; no JS animation loops (`requestAnimationFrame`) unless unavoidable, and then a single shared ticker that stops off-screen and when the tab is hidden.
8. **Proven.** Evidence per loop in the report: selector, properties, period, running state in and out of view, seam frames, reduced-motion result.

### Recipes
- **Gradient word:** `.lm-gradient-word` (6s, symmetric five-stop gradient, `background-size: 200%`, shift 200%). Period tunable with `--lm-gradient-period`.
- **Marquee:** `.lm-marquee > .lm-marquee__track > [set A][set B aria-hidden data-dup]`; period with `--lm-marquee-period` (about 30s per 3 cards). Second row: `--lm-marquee-direction: reverse`. The track is `direction: ltr` and each card `direction: rtl`.
- **Orbit / ecosystem diagram:** inline SVG; rings rotate with `transform: rotate()` at 40 to 80s linear (counter-rotate the labels so text stays upright); nodes pulse with scale 1 to 1.04; hovering a node raises that connector's opacity. Gated like any loop.
- **Glow breathing (optional):** opacity .8 to 1 on a static radial-gradient layer, 6 to 8s ease-in-out alternate, gated.

## 7. Gesture physics (Apple principles, only where a user touches and drags)

Use for the before/after slider, swipeable testimonials on touch, and any sheet.
- **Interruptible.** The user can grab a moving element and redirect it at any moment. Start every new motion from the current on-screen value, not the target. Avoid keyframes and fixed-duration transitions for gesture-driven motion.
- **Direct manipulation.** 1:1 tracking with Pointer Events and `setPointerCapture`; keep the grab offset; require about 10px before committing to a direction.
- **Springs, not timelines**, for touch-driven motion. Default critically damped (no bounce); add a little bounce only when the gesture carried momentum (a flick). Keep bounce 0.1 to 0.3.
- **Velocity handoff and momentum projection.** At release continue at the finger's velocity and snap to the target nearest the projected resting point (exponential-decay projection, decelerationRate about 0.998).
- **Rubber-banding** at boundaries instead of hard stops.
- **Spatial consistency.** Enter and exit along the same path; anchor popovers to their trigger; a surface leaves the way it arrived.
- Hint in the direction of the gesture: intermediate frames should telegraph the outcome.
- Load spring code in a lazy island. Do not ship a motion library for a fade.

## 8. Materials in motion

Glass and scrims animate with the entrance contract (opacity for backdrops, never translated with the panel). Optionally animate blur radius and scale together so the surface "materializes", only when frame time stays comfortable on mid-range phones. Dim to focus for modal tasks (scrim); separate without a scrim for parallel, non-blocking panels.

## 9. Reduced motion and hover gating (ship with every animation)

- `prefers-reduced-motion: reduce`: entrance without translation or stagger; loops off; marquee swipeable; keep short opacity changes that aid comprehension. Reduced means fewer and gentler, not silent.
- Hover motion only under `(hover: hover) and (pointer: fine)`.
- Content is readable with JavaScript off.

## 10. Feel checks (a script cannot judge feel)

Play important animations at 2 to 5x duration or in the DevTools animation inspector; step frame by frame; test drag and swipe on a real phone; look again the next day. If feel cannot be settled from code, say so in the report rather than guessing values.
