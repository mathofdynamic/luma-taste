---
name: luma-taste
description: Luma's design taste for building, restyling or animating any page, section, component, modal or menu of LUMA (lumai.ir / لوما). Covers the visual identity (dark premium, purple-magenta-orange gradient, Persian RTL), the motion system (animated gradient title words, hover-reactive explainer cards, scroll-triggered playful beats, infinite testimonial marquee, blur+low-opacity materials, the entrance-motion contract), the page grid, readable cards, and the performance and evidence rules that keep all of that fast. Make sure to use this skill whenever the user mentions Luma, لوما, the landing page, home page, hero, services, gallery, testimonials, bento or explainer sections, redesign or restyle, hover or scroll animation, gradient titles, marquee, modals or menus, or asks for a "better looking" Luma page, even if they never say "taste" or "skill".
---

# Luma Taste

Luma is a Persian-first AI creativity platform. Its pages must feel **alive, premium and playful**, and they must **load fast on a phone**. These two demands do not trade against each other here: the job of this skill is to make both true at once.

> Motion is part of Luma's identity. Never delete signature motion to hit a performance number.
> Performance is a budget. Never ship motion without evidence that it is cheap and that it works.
> When they conflict, change *how* the motion is built (cheaper technique, gating, lazy loading), not *whether* it exists. If that is impossible, stop and escalate with numbers.

## When you are invoked

Run these steps in order. Do not skip step 0 or step 5.

0. **Audit what exists.** Read the target page's code. If the project has an earlier version of the page (git history or `main`), find the motion and interactions it used to have and list what is missing now. A previous performance pass may have removed signature motion; restoring it, cheaply, is part of the job. Record the shared components and styles the page uses so that changes do not leak onto other pages.
1. **Plan** (see `references/design-process.md`): write a compact plan with tokens, grid, a section list, and the **motion matrix** (below). Critique the plan against the generic defaults, revise, then build.
2. **Build on existing primitives.** Reuse the project's components, tokens and motion helpers. Do not create a competing system. Starter assets are in `assets/` (tokens, motion CSS, motion runtime); adapt them to the project's architecture.
3. **Motion pass.** Fill the motion matrix for every section. Implement each animation using the tool ladder and the loop rules in `references/motion-system.md`.
4. **Layout pass.** Snap everything to the grid; make sure no text is cut off (`references/layout-and-components.md`).
5. **Prove it.** Run `scripts/motion-audit.mjs`, check budgets, inspect rendered pages at 375px and 1440px in dark and light, and write the evidence report (`references/performance-and-verification.md`). Never claim "animation works" from reading code.

## Luma's non-negotiables

These come from the owner's review of the site. They override generic design advice.

1. **Rich motion everywhere**, from micro-interactions to section-level choreography. A static Luma page is a regression.
2. **Animated gradient on the main word of big titles.** The gradient flows slowly through the Luma colors on the key word of each large heading. It runs only while the title is in view (`.lm-gradient-word`).
3. **Interactive UI that reacts on hover with an animation related to what the element is.** A scissors icon snips; a waveform moves; an upscale icon pushes outward. Generic "lift and shadow" alone is not enough. See the hover vocabulary in `references/layout-and-components.md`.
4. **The page grid is law.** Every block snaps to the 12-column container grid and aligned edges.
5. **Card text is never cut off.** No ellipsis, no line-clamp on descriptive copy; give the text more lines and let rows grow equally.
6. **Entrance motion follows the entrance-motion contract on every page and on every surface that pops open** (menus, popovers, dialogs, drawers, lightbox). Exact tokens: `references/entrance-motion-contract.md`.
7. **Explainer sections are not static.** Cards animate on hover; plain explainers get a minimal playful animation, triggered on view.
8. **Scrolling must never be boring.** Plan playful beats along the page: things that fill, draw, count or trigger as they enter. Roughly one beat every 1.5 screens.
9. **Testimonials are an infinite-scroll marquee** (two rows allowed, opposite directions), not a static wall. Pauses on hover/focus, static and swipeable under reduced motion.
10. **Materials: backdrop blur plus LOW opacity** for the header, menus, popovers and image lightbox. Never opaque, never blur alone. Recipes in `assets/luma-motion.css`.
11. **Loop animations need extra care and proof.** Every loop is gated to the viewport, seamless, cheap, reduced-motion safe, and verified with the audit script.
12. **Persian first.** RTL, logical properties, no letter-spacing on Persian text, readable line-height 1.8, real Persian copy.

## The motion matrix (required deliverable)

Before building, fill this table for the page. Every row needs at least an entrance, and every non-trivial section needs at least one of the other three. Include it in the evidence report.

| Section | Entrance (contract) | Hover / interactive | Scroll-playful | Ambient loop (gated) |
|---|---|---|---|---|
| Nav / header | surfaces open per contract | link underline draw, glass blur on scroll | none | none |
| Hero | sequenced headline, subline, CTAs | CTA press + hover | product visual reacts to scroll | gradient word |
| Services grid | cards in DOM order | icon-specific hover per card | none | none |
| Showcase (before/after) | contract | draggable or hover reveal | reveal follows scroll | none |
| Gallery | tiles in batches | tile hover zoom + play badge | batch reveal | none |
| Explainer / bento | contract | each card has its own hover story | connectors draw on view | orbit / pulse, gated |
| Testimonials | contract | pause on hover/focus | none | marquee, gated |
| Final CTA | contract | CTA hover | glow follows scroll | gradient word |
| Footer | contract | link hover | none | none |
| Modals, lightbox, menus | open 100ms / close 66ms | focus return | none | none |

## Priority order when guidance conflicts

1. The user's explicit request in this task.
2. The non-negotiables above.
3. The entrance-motion contract (entrance, exit, transient surfaces). It governs only entrance and open/close motion; it does not forbid hover, scroll or loop motion, which are governed by `references/motion-system.md`.
4. Performance budgets and the evidence rules.
5. Motion principles (Emil Kowalski's animation rules, Apple's fluid-interface rules), distilled in `references/motion-system.md`.
6. Anthropic's frontend-design guidance for the axes Luma has not pinned (composition, hierarchy, copy, restraint). Where it warns against a pattern that Luma has explicitly chosen (accented single title word, fade-and-rise entrances, near-black plus gradient), **the Luma choice wins**; use the guidance to execute it with more care, not to remove it.

## Reference map (read only what the task needs)

| Read | When |
|---|---|
| `references/identity-and-tokens.md` | Any visual work: colors, gradient rules, typography, Persian rules, materials, shape |
| `references/motion-system.md` | Any animation: decision gate, tool ladder, easing, durations, hover, scroll, loops, gestures, springs |
| `references/entrance-motion-contract.md` | Entrances, menus, popups, dialogs, drawers, lightbox |
| `references/layout-and-components.md` | Grid, cards, hover vocabulary, section recipes, no-clipped-text rule |
| `references/performance-and-verification.md` | Budgets, how to keep rich motion cheap, the audit, the evidence report |
| `references/design-process.md` | Planning, avoiding generic output, writing Persian UI copy, self-critique |

Assets: `assets/luma-tokens.css`, `assets/luma-motion.css`, `assets/luma-motion.js`, `assets/luma-hover-stories.css` (starter hover stories). Script: `scripts/motion-audit.mjs`. All were tested in headless Chromium; adapt them to the project, do not paste blindly.

## Never ship

- A page or section with no motion plan, or with its signature motion removed for performance.
- A loop that is not gated to the viewport, not seamless, or not reduced-motion safe.
- `transition: all`; animating `width`, `height`, `margin`, `top`, `left`; `scale(0)` entrances; `ease-in` on UI.
- Text that is truncated, clipped, under 12px, or letter-spaced in Persian.
- A blur surface that is opaque or blur-only; a large full-screen `backdrop-filter` on mobile.
- Hover-only information that touch users cannot reach.
- A claim of "verified" without rendered-page evidence. If browser checks cannot run, say exactly which ones.
- Changes to other pages when the task is scoped to one page.

## Reporting

End every task with: what changed and why, the motion matrix as built, files touched, the audit result (FAIL/WARN counts and anything accepted), budget numbers vs targets, screenshots for 375px and 1440px in dark and light, and a clear list of what is verified in a browser versus what is not.
