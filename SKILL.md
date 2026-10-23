---
name: luma-taste
description: Luma's design taste for building, restyling or animating any page, section, component, modal or menu of LUMA (lumai.ir / لوما). Covers the visual identity (dark premium, purple-magenta-orange gradient, Persian RTL), the motion system (calm scroll-driven entrances, animated gradient title words, hover-reactive cards, living explainer stories, lens testimonial marquee, morphing navigation menus, circular theme switch, liquid-fill buttons, blur+low-opacity materials), the page grid, readable cards, media loading, and the performance and evidence rules that keep all of that fast. Includes the owner's review log so earlier mistakes are not repeated. Make sure to use this skill whenever the user mentions Luma, لوما, the landing page, home page, any Luma page, hero, navigation, menus, services, showcase, gallery, testimonials, bento or explainer sections, redesign or restyle, hover or scroll animation, gradient titles, marquee, theme switching, buttons, modals or menus, or asks for a "better looking" Luma page, even if they never say "taste" or "skill".
---

# Luma Taste

Luma is a Persian-first AI creativity platform. Its pages must feel **alive, premium and playful**, and they must **load fast on a phone**. These two demands do not trade against each other here: the job of this skill is to make both true at once.

> Motion is part of Luma's identity. Never delete signature motion to hit a performance number.
> Performance is a budget. Never ship motion without evidence that it is cheap and that it works.
> When they conflict, change *how* the motion is built (cheaper technique, gating, lazy loading), not *whether* it exists. If that is impossible, stop and escalate with numbers.

## When you are invoked

Run these steps in order. Do not skip step 0, step 5 or step 6.

0. **Audit what exists.** Read the target page's code. If the project has an earlier version of the page (git history or `main`), find the motion and interactions it used to have and list what is missing now. A previous performance pass may have removed signature motion; restoring it, cheaply, is part of the job. Record the shared components and styles the page uses so that changes do not leak onto other pages.
1. **Read the owner review log** (`references/owner-review-log.md`). Every entry there is a mistake the owner already rejected on a real page. Treat each one as a rule for the page you are building, not as history.
2. **Plan** (see `references/design-process.md`): write a compact plan with tokens, grid, a section list, and the **motion matrix** (below). Critique the plan against the generic defaults and the review log, revise, then build.
3. **Build on existing primitives.** Reuse the project's components, tokens and motion helpers. Do not create a competing system. Starter assets are in `assets/`; proven recipes for Luma's signature interactions are in `references/signature-patterns.md`. Adapt them to the project's architecture.
4. **Motion and layout pass.** Fill the motion matrix for every section with the tool ladder and loop rules in `references/motion-system.md`. Snap everything to the grid, remove dead space, and make sure no text is cut off (`references/layout-and-components.md`).
5. **Prove it.** Run `scripts/motion-audit.mjs`, check budgets, inspect rendered pages at 375px and 1440px in dark and light, and write the evidence report (`references/performance-and-verification.md`). Never claim "animation works" from reading code.
6. **Review-log check.** Walk the checklist at the end of `references/owner-review-log.md` against the rendered page and state the result per line in the report.

## Luma's non-negotiables

These come from the owner's reviews of the site. They override generic design advice.

1. **Rich motion everywhere**, from micro-interactions to section-level choreography. A static Luma page is a regression.
2. **Animated gradient on the main word of big titles.** The gradient flows slowly through the Luma colors on the key word of each large heading. It runs only while the title is in view (`.lm-gradient-word`).
3. **Interactive UI reacts on hover with an animation related to what the element is.** A scissors icon snips; a waveform moves; an upscale icon pushes outward. Generic "lift and shadow" alone is not enough. See the hover vocabulary in `references/layout-and-components.md`.
4. **The page grid is law, and space is used.** Every block snaps to the 12-column container grid. Two-column compositions balance their heights: no column may leave a large empty area beside a tall neighbour (see "Dead space" in `layout-and-components.md`).
5. **Card text is never cut off.** No ellipsis, no line-clamp on descriptive copy; give the text more lines and let rows grow equally.
6. **Entrances are calm and scroll-driven.** Each element reveals when *it* scrolls into view (not the whole page at load), with Luma's entrance timing: about 600ms, `cubic-bezier(.16,1,.3,1)`, 24px rise, 70ms stagger. Hidden states are staged before the element reaches the viewport so a reveal never blinks. Exact tokens: `references/motion-system.md` section 4 (this overrides the 100ms default of the bundled entrance contract).
7. **The hero shows the breadth of Luma.** The hero visual is a living product demo that cycles through several tools (create image, edit, video, try-on, assistant…) with real results. A hero that shows a single tool is wrong.
8. **Navigation feels like one object.** Active page = a pill around the item (never underlines). Dropdowns open on hover intent and close when the pointer leaves; one shared glass panel morphs and slides (ease-in-out) between triggers; items have icons and stagger in. The mobile menu stands out from the page (dim scrim + dense glass) and shows every item without an inner scrollbar.
9. **Explainers tell a story you can read.** Bento and explainer cards play a legible, meaningful animation (1.2 to 3s) when they enter the view and gently repeat while in view; hover replays it. No "replay" buttons, no 300ms twitches nobody notices.
10. **Testimonials are a lens marquee.** Infinite marquee, edges fade out, and cards grow and turn toward the viewer near the edges (concave "lens" effect). Pauses on hover/focus; static and swipeable under reduced motion.
11. **Materials: backdrop blur plus LOW opacity** for the header, menus, popovers and image lightbox. Never opaque, never blur alone. Menus use the strong glass (about 24px blur). Recipes in `assets/luma-motion.css`.
12. **Interactions have craft.** Primary buttons fill with a liquid wave of the inverse color on hover (not an instant color swap). Theme switching reveals the new theme in a circle growing from the toggle. Before/after comparisons follow the pointer on hover (drag on touch, arrow keys on keyboard); never a range slider under the image.
13. **Media never pops.** Every image and video tile shows a skeleton shimmer while loading and reveals smoothly when decoded. Failures show a quiet fallback with retry.
14. **Loop animations need extra care and proof.** Every loop is gated to the viewport, seamless, cheap, reduced-motion safe, and verified with the audit script.
15. **Persian first.** RTL, logical properties, no letter-spacing on Persian text, readable line-height 1.8, real Persian copy.

## The motion matrix (required deliverable)

Before building, fill this table for the page. Every row needs at least an entrance, and every non-trivial section needs at least one of the other three. Include it in the evidence report.

| Section | Entrance (scroll-driven) | Hover / interactive | Scroll-playful | Ambient loop (gated) |
|---|---|---|---|---|
| Nav / header | load sequence; menus per surface tokens | active pill, hover pill, hover-intent morphing dropdown, circular theme switch | glass deepens on scroll | none |
| Hero | sequenced headline, subline, CTAs, demo | liquid-fill CTA, tool rail is clickable | none | multi-tool studio demo, gradient word |
| Services grid | cards in DOM order as they enter | icon-specific hover story per card, pointer glow | none | none |
| Showcase (before/after) | scroll-driven | comparison follows pointer / drag / arrows | reveal sweeps once on view | none |
| Gallery | tiles as they enter, after decode | tile hover zoom + play badge | skeleton → image reveal | skeleton shimmer while loading |
| Explainer / bento | scroll-driven | each card replays its story on hover | stories play on view | stories repeat gently while in view |
| Testimonials | scroll-driven | pause on hover/focus | none | lens marquee |
| Final CTA | scroll-driven | liquid-fill CTA | glow follows scroll | gradient word |
| Footer | scroll-driven | link hover | none | none |
| Modals, lightbox, menus | surface tokens (open 240-320ms, close 160ms) | focus return | none | none |

## Priority order when guidance conflicts

1. The user's explicit request in this task.
2. The owner review log and the non-negotiables above.
3. Luma's motion tokens (`motion-system.md`), then the entrance-motion contract for everything Luma does not override (progressive enhancement, once-only reveal, DOM order, surface state handling, focus return).
4. Performance budgets and the evidence rules.
5. Motion principles (Emil Kowalski's animation rules, Apple's fluid-interface rules), distilled in `references/motion-system.md`.
6. Anthropic's frontend-design guidance for the axes Luma has not pinned (composition, hierarchy, copy, restraint). Where it warns against a pattern that Luma has explicitly chosen (accented single title word, fade-and-rise entrances, near-black plus gradient), **the Luma choice wins**; use the guidance to execute it with more care, not to remove it.

## Reference map (read only what the task needs)

| Read | When |
|---|---|
| `references/owner-review-log.md` | **Always.** Rejected patterns, the rule each one became, and the pre-delivery checklist |
| `references/identity-and-tokens.md` | Any visual work: colors, gradient rules, typography, Persian rules, materials, shape |
| `references/motion-system.md` | Any animation: timing tokens, decision gate, tool ladder, easing, hover, scroll, loops, gestures |
| `references/signature-patterns.md` | Building nav menus, theme switch, buttons, hero studio, comparison, media loading, explainer stories, lens marquee, mobile menu |
| `references/entrance-motion-contract.md` | Progressive enhancement and surface state handling (its timing tokens are overridden by Luma) |
| `references/layout-and-components.md` | Grid, dead space, cards, components, hover vocabulary, section recipes, no-clipped-text rule |
| `references/performance-and-verification.md` | Budgets, how to keep rich motion cheap, the audit, the evidence report |
| `references/design-process.md` | Planning, avoiding generic output, writing Persian UI copy, self-critique |

Assets: `assets/luma-tokens.css`, `assets/luma-motion.css`, `assets/luma-motion.js`, `assets/luma-hover-stories.css` (starter hover stories). Script: `scripts/motion-audit.mjs`. All were tested in headless Chromium; adapt them to the project, do not paste blindly.

## Never ship

- A page or section with no motion plan, or with its signature motion removed for performance.
- Anything listed as rejected in `references/owner-review-log.md`.
- Entrances that fire for the whole page at load, that blink (visible, then hidden, then animated), or that are so fast nobody sees them (under 400ms for content reveals).
- A loop that is not gated to the viewport, not seamless, or not reduced-motion safe.
- `transition: all`; animating `margin`, `top`, `left`; `scale(0)` entrances; `ease-in` on UI. (`width`/`height` only for the sanctioned morphing menu panel, see `signature-patterns.md`.)
- Text that is truncated, clipped, under 12px, or letter-spaced in Persian.
- A blur surface that is opaque or blur-only; a large full-screen `backdrop-filter` on mobile.
- Hover-only information that touch users cannot reach.
- A claim of "verified" without rendered-page evidence. If browser checks cannot run, say exactly which ones.
- Changes to other pages when the task is scoped to one page.

## Reporting

End every task with: what changed and why, the motion matrix as built, files touched, the audit result (FAIL/WARN counts and anything accepted), budget numbers vs targets, screenshots for 375px and 1440px in dark and light, the review-log checklist result, and a clear list of what is verified in a browser versus what is not.
