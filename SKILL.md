---
name: luma-taste
description: Luma's design taste for building, restyling or animating any page, section, component, modal or menu of LUMA (lumai.ir / لوما). Covers the visual identity (dark premium, purple-magenta-orange gradient, Persian RTL), the motion system (calm scroll-driven entrances, animated gradient title words, hover-reactive cards, living explainer stories, lens testimonial marquee, morphing navigation menus, circular theme switch, liquid-fill buttons, blur+low-opacity materials), the page grid, readable cards, media loading, and the performance and evidence rules that keep all of that fast. Includes the owner's review log so earlier mistakes are not repeated. Make sure to use this skill whenever the user mentions Luma, لوما, the landing page, home page, any Luma page, hero, navigation, menus, services, showcase, gallery, testimonials, bento or explainer sections, redesign or restyle, hover or scroll animation, gradient titles, marquee, theme switching, buttons, modals or menus, or asks for a "better looking" Luma page, even if they never say "taste" or "skill". It separates service pages (rich motion, scroll scenes, explainers) from content pages (docs, help center and articles, blog and posts, about, contact, legal), which follow the standard layout for their kind.
---

# Luma Taste

Luma is a Persian-first AI creativity platform. Its pages must feel **alive, premium and playful**, and they must **load fast on a phone**. These two demands do not trade against each other here: the job of this skill is to make both true at once.

> Motion is part of Luma's identity. Never delete signature motion to hit a performance number.
> Performance is a budget. Never ship motion without evidence that it is cheap and that it works.
> When they conflict, change *how* the motion is built (cheaper technique, gating, lazy loading), not *whether* it exists. If that is impossible, stop and escalate with numbers.

## When you are invoked

Run these steps in order. Do not skip step 0, step 5, step 6 or step 7.

**Before step 0: classify the page (owner review 09).** Decide whether the page is a *service page* (it explains or sells a Luma service or product: image generation, video, assistant, try-on, workflows, pricing, plans, the home page) or a *content page* (it holds information the visitor reads, looks up or acts on: technical docs, the help center and **each help article**, the blog index and **each post**, about, contact, legal, terms of use, privacy, security, changelog, careers). Write the classification and one sentence of reasoning at the top of the plan. Content pages follow "Content pages" below; every rule written for service pages is then scoped as that section says. When a page is mixed (a docs page with one product explainer), the page is a content page and the explainer is one section of it.

0. **Audit what exists.** Read the target page's code. If the project has an earlier version of the page (git history or `main`), find the motion and interactions it used to have and list what is missing now. A previous performance pass may have removed signature motion; restoring it, cheaply, is part of the job. Record the shared components and styles the page uses so that changes do not leak onto other pages.
1. **Read the owner review log** (`references/owner-review-log.md`). Every entry there is a mistake the owner already rejected on a real page. Treat each one as a rule for the page you are building, not as history.
2. **Plan** (see `references/design-process.md`): write a compact plan with tokens, grid, a section list, and the **motion matrix** (below). For every row of cards, write the cards per row and the resulting card width at 375, 1024 and 1440 and check them against the floors in `references/layout-and-components.md` §7 (a five-column row of 200px cards failed review 04). Critique the plan against the generic defaults and the review log, revise, then build.
3. **Build on existing primitives.** Reuse the project's components, tokens and motion helpers. Do not create a competing system. Starter assets are in `assets/`; proven recipes for Luma's signature interactions are in `references/signature-patterns.md`. Adapt them to the project's architecture.
4. **Motion and layout pass.** Fill the motion matrix for every section with the tool ladder and loop rules in `references/motion-system.md`. Snap everything to the grid, remove dead space, and make sure no text is cut off (`references/layout-and-components.md`).
5. **Prove it.** Run `scripts/motion-audit.mjs`, check budgets, inspect rendered pages at 375px and 1440px in dark and light, and write the evidence report (`references/performance-and-verification.md`). Never claim "animation works" from reading code, and never treat a clean audit as "it looks right": the audit measures behaviour, not composition.
6. **Section critique.** Look at every section alone, at native size, at rest and mid-motion (the audit writes these frames to `<out>/sections/`), answer the questions in "Section critique" in `references/owner-review-log.md`, and give each section a binary verdict: ship or fix. Then have a reviewer who did not build the page (a separate agent, or the owner) look at the same frames and name the three weakest things per section; fix or report all of it. Anything you notice and do not fix goes to the owner as a known issue, never "close enough".
7. **Review-log check.** Walk the checklist at the end of `references/owner-review-log.md` against the rendered page and state the result per line in the report.

## Luma's non-negotiables

These come from the owner's reviews of the site. They override generic design advice. Rules marked *(service pages)* do not bind content pages; see "Content pages".

1. *(service pages)* **Rich motion everywhere**, from micro-interactions to section-level choreography. A static Luma page is a regression.
2. **Animated gradient on the main word of big titles.** The gradient flows slowly through the Luma colors on the key word of each large heading. It runs only while the title is in view (`.lm-gradient-word`).
3. **Interactive UI reacts on hover with an animation related to what the element is.** A scissors icon snips; a waveform moves; an upscale icon pushes outward. Generic "lift and shadow" alone is not enough. See the hover vocabulary in `references/layout-and-components.md`.
4. **The page grid is law, and space is used.** Every block snaps to the 12-column container grid (measure the edges at 375/768/1024/1440; a masonry built on CSS `columns` broke it at runtime). Two-column compositions balance their heights: no column may leave a large empty area beside a tall neighbour (see "Dead space" in `layout-and-components.md`).
5. **Card text is never cut off.** No ellipsis, no line-clamp on descriptive copy; give the text more lines and let rows grow equally.
6. **Entrances are calm and scroll-driven.** Each element reveals when *it* scrolls into view (not the whole page at load), with Luma's entrance timing: about 600ms, `cubic-bezier(.16,1,.3,1)`, 24px rise, 70ms stagger. Hidden states are staged before the element reaches the viewport so a reveal never blinks. Exact tokens: `references/motion-system.md` section 4 (this overrides the 100ms default of the bundled entrance contract).
7. *(service pages)* **The hero shows the breadth of Luma.** The hero visual is a living product demo that cycles through several tools (create image, edit, video, try-on, assistant…) with real results. A hero that shows a single tool is wrong.
8. **Navigation feels like one object.** Active page = a pill around the item (never underlines). Dropdowns open on hover intent and close when the pointer leaves; one shared glass panel morphs and slides (ease-in-out) between triggers; items have icons and stagger in. The mobile menu stands out from the page (dim scrim + dense glass) and shows every item without an inner scrollbar.
9. *(service pages)* **Explainers tell a story you can read.** Bento and explainer cards play a legible, meaningful animation (1.2 to 3s) when they enter the view and gently repeat while in view; hover replays it. No "replay" buttons, no 300ms twitches nobody notices.
10. **Testimonials are a full-bleed lens marquee.** Infinite marquee running edge to edge of the viewport (the one content exception to the container), edges fade out, and cards grow and turn toward the viewer near the edges (concave "lens" effect). Pauses on hover/focus with no visible pause button; static and swipeable under reduced motion.
11. **Materials: backdrop blur plus LOW opacity** for the header, menus, popovers and image lightbox. Never opaque, never blur alone. Menus use the strong glass (about 24px blur). Recipes in `assets/luma-motion.css`.
12. **Interactions have craft.** Primary buttons fill with a liquid wave of the inverse color on hover (not an instant color swap). Theme switching reveals the new theme in a circle growing from the toggle. Before/after comparisons follow the pointer on hover (drag on touch, arrow keys on keyboard); never a range slider under the image.
13. **Media never pops.** Every image and video tile shows a skeleton shimmer while loading and reveals smoothly when decoded. Failures show a quiet fallback with retry.
14. **Loop animations need extra care and proof.** Every loop is gated to the viewport, seamless, cheap, reduced-motion safe, and verified with the audit script.
15. *(service pages)* **The UI plays itself.** A showcase, a set of cases or scenes never waits for a click: it cycles on its own (pausing on hover/focus, off-screen and under reduced motion). Typed text appears word by word in reading order, never one wipe over several lines. (`signature-patterns.md` sections 4 and 10.)
16. **No accent lines; the brand has three colors.** No gradient or colored bars on card edges, active items or titles anywhere ("AI slop"); state is surface, border and motion. Card hover glows rotate purple, magenta and orange, never one color. (`signature-patterns.md` section 11.)
17. **Nothing moves the page by itself.** Autoplay, lazy sections, loading media and sweeps must cause no layout shift while idle or scrolling: reserve real heights, stack changing labels in one cell, move with `transform`, shimmer with `background-position`. (`performance-and-verification.md` section 2.)
18. *(service pages)* **The bento explainers on the home page are the benchmark** for micro-animation on every new page (owner review 02).
19. **Persian first.** RTL, logical properties, no letter-spacing on Persian text, readable line-height 1.8, real Persian copy.
20. **Card rows are sized by their content, not by their item count (owner review 04).** Text-and-demo cards are at least 280px wide with demo stages of at least 220px, at most four per row; five or more items become 2 + 3 rows or a list beside one shared stage. Titles, text and demos share lines across a row, nothing inside a card is a hole, and a still frame of any story section looks finished. (`layout-and-components.md` §7.)
21. **Two columns fill the row together (owner review 05).** A list of steps, tabs or cases beside a taller stage stretches to the stage (`align-items:stretch`, `grid-auto-rows:1fr`) or the stage gets shorter; a desktop grid list fills its span (`grid-template-columns:minmax(0,1fr)`, never a leftover `justify-content:center`); inactive items keep a border. No empty band above, below or beside a column. (`layout-and-components.md` §8.)
22. *(service pages)* **Every page has its own shape (owner review 06).** Service pages must not share one template (hero + studio, list-beside-stage board, card grid, catalog, FAQ, repeated). Before building, write the section-shape ledger of the last pages and choose different shapes, rhythm and layouts for this one, inside Luma's tokens and rules. Explain with small, quiet home-bento-style animations, keep one outstanding attention moment, and give every service page **at least one scroll-driven scene** whose progress follows the scroll position (`NO_SCROLL_SCENE`; `design-process.md` "Page shape", `signature-patterns.md` §12). **A pinned scene is a whole screen (owner review 07):** its heading pins with it, the stage is as tall as its capped frame and pins centred under the header on every monitor, and you look at the pinned screen on a phone, a laptop and a tall monitor before reporting (`PINNED_SCENE_*`).
23. **No page is reported without passing the proof gate (owner review 08).** The audit proves behaviour; `scripts/proof.mjs` proves what the visitor sees. Run it on the built page, look at every image it writes (the viewport walk at 375, 768, 1440 and a 1870x1880 monitor, and every explainer as a five-frame filmstrip), have a fresh-eyes reviewer that did not build the page judge the same images, record both verdicts in `REVIEW.md`, and only report when `proof.mjs --verify` passes. Its geometry checks fail content that leaves the page column (`GRID_ESCAPE`; no bleeding images unless the owner asked for one and it is marked `[data-bleed]`), a column half empty beside its neighbour in any frame, pinned scenes included (`COLUMN_DEAD_SPACE`), and an explainer that is a small drawing in a big empty box (`EXPLAINER_SPARSE`). Explainers must look as good as the home bento in every frame of their filmstrip, not only at rest; build them from the real subject (real outputs, real model names from the catalog, product-UI cards) rather than abstract doodles (rings of squares, generic hills).

24. **A content page is designed as the standard pattern for its kind, not as a service page (owner review 09).** Docs, help center, help articles, blog, posts, about, contact and legal pages use the proven, conventional layout for what they are (see "Content pages"), in Luma's identity. No service-page devices are forced on them: no required pinned or scroll-driven scene, no explainer bento, no self-playing studio, no "own shape" race. Reading, finding and acting come first; motion is quiet.

## Content pages (owner review 09)

A content page is judged by how fast a visitor finds, reads or does what they came for. Design it the way the best sites design that kind of page (Stripe and Vercel docs, Linear and Notion help centers, good editorial blogs), then dress it in Luma's identity. Logic first; a conventional layout is a feature here, not a failure of creativity.

**Standard shapes** (start from these; deviate only with a reason written in the plan):

| Page | Standard shape |
|---|---|
| Technical docs | sidebar navigation + content + on-page outline; code blocks with copy; reference tables; search |
| Help center (index) | short hero with a prominent search; topic categories as a card grid (icon, title, one line, article count); popular or recent articles; a contact or support exit. Topics are independent: never numbered, ordered or framed as a course |
| Help article | its own URL; breadcrumb; title, updated date, reading time; readable column (60-75 characters) with an outline beside it on wide screens; related articles in the same topic; "was this helpful" / contact exit |
| Blog index | one featured post, then a grid or list of posts with cover, title, excerpt, date; category filter; pagination or load more |
| Blog post | its own URL; cover, title, author, date, reading time; readable column; outline on wide screens for long posts; share; related posts |
| About | story, mission, numbers only if real, team or values, a CTA |
| Contact | channels (support, sales, email, phone, social) beside a form; response time; FAQ link |
| Legal, terms, privacy, security | title, effective date, outline / table of contents, numbered sections in a readable column, anchor links; nothing decorative inside the text |

**Still required on content pages:** the identity (tokens, typography, Persian RTL, colors, materials, dark/light), the shared header, navigation and footer, buttons with their hover craft, the page grid and container (`GRID_ESCAPE`), no clipped text, no dead space in what is there, readable measure and line height, media loading states, no layout shift, performance budgets, accessibility, real copy and no invented numbers, the calm scroll entrances (lighter: a few blocks, not every line of prose), and the proof gate (walk images, a fresh-eyes reviewer, `--verify`).

**Relaxed on content pages:** the gradient word appears at most on the page's main title (index pages; never inside an article, post or legal text). Motion is quiet and functional: entrances, hover states, a reading progress bar, an outline that follows the scroll, search results appearing, a copy-button confirmation. A small illustrative loop is allowed in a hero; it is not required.

**Not applied to content pages:** a required scroll-driven or pinned scene (do not add one to satisfy a rule; run the audit without `--service`), explainer bento stories and filmstrips, the multi-tool hero studio, "the UI plays itself", the page-shape ledger against the service pages. Content pages of the same kind should look **consistent with each other** (every help article, every post, every legal page on one template); that consistency is the goal, not a defect.

**Fresh-eyes brief for a content page:** judge findability (can I find an article in two clicks or one search?), readability (measure, hierarchy, contrast), and whether the layout is the familiar one for its kind, plus the grid and dead-space questions. Do not ask the reviewer to grade it against the home bento.

## The motion matrix (required deliverable)

Before building, fill this table for the page (content pages: fill only Entrance and Hover / interactive, and write "quiet by design" in the other columns). Every row needs at least an entrance, and every non-trivial section needs at least one of the other three. Include it in the evidence report.

| Section | Entrance (scroll-driven) | Hover / interactive | Scroll-playful | Ambient loop (gated) |
|---|---|---|---|---|
| Nav / header | load sequence; menus per surface tokens | active pill, hover pill, hover-intent morphing dropdown, circular theme switch | glass deepens on scroll | none |
| Hero | sequenced headline, subline, CTAs, demo | liquid-fill CTA, tool rail is clickable | none | multi-tool studio demo, gradient word |
| Services grid | cards in DOM order as they enter | icon-specific hover story per card, pointer glow | none | none |
| Showcase (before/after) | scroll-driven | comparison follows pointer / drag / arrows (pauses autoplay) | divider sweeps at each case | cycles through its cases by itself |
| Gallery | tiles as they enter, after decode | tile hover zoom + play badge | skeleton → image reveal | skeleton shimmer while loading |
| Explainer / bento | scroll-driven | each card replays its story on hover | stories play on view | stories repeat gently while in view |
| Testimonials | scroll-driven | pause on hover/focus | none | full-bleed lens marquee |
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
| `references/owner-review-log.md` | **Always.** Rejected patterns, the rule each one became, the section critique, and the pre-delivery checklist |
| `references/identity-and-tokens.md` | Any visual work: colors, gradient rules, typography, Persian rules, materials, shape |
| `references/motion-system.md` | Any animation: timing tokens, decision gate, tool ladder, easing, hover, scroll, loops, gestures |
| `references/signature-patterns.md` | Building nav menus, theme switch, buttons, hero studio, comparison, media loading, explainer stories, lens marquee, mobile menu |
| `references/entrance-motion-contract.md` | Progressive enhancement and surface state handling (its timing tokens are overridden by Luma) |
| `references/layout-and-components.md` | Grid, dead space, cards, card rows and demo stages (§7), components, hover vocabulary, section recipes, no-clipped-text rule |
| `references/performance-and-verification.md` | Budgets, how to keep rich motion cheap, the audit, the evidence report |
| `references/design-process.md` | Planning, avoiding generic output, writing Persian UI copy, self-critique |

Assets: `assets/luma-tokens.css`, `assets/luma-motion.css`, `assets/luma-motion.js`, `assets/luma-hover-stories.css` (starter hover stories). Script: `scripts/motion-audit.mjs`. All were tested in headless Chromium; adapt them to the project, do not paste blindly.

## Never ship

- A page or section with no motion plan, or with its signature motion removed for performance.
- Anything listed as rejected in `references/owner-review-log.md`.
- Entrances that fire for the whole page at load, that blink (visible, then hidden, then animated), or that are so fast nobody sees them (under 400ms for content reveals).
- A loop that is not gated to the viewport, not seamless, or not reduced-motion safe.
- `transition: all`; animating `margin`, `top`, `left`; `scale(0)` entrances; `ease-in` on UI. (`width`/`height` only for the sanctioned morphing menu panel, see `signature-patterns.md`.)
- Text that is truncated, clipped, under 12px, or letter-spaced in Persian; paragraphs squeezed under about 20 characters per line.
- A row of five or more equal text-and-demo cards; demo stages under 220px; rows whose titles, text or demos start at different heights; holes inside cards (`DEMO_TOO_SMALL`, `RAGGED_CARD_ROW`, `CARD_DEAD_GAP`); a column floating beside a taller one with empty bands around it (`DEAD_SPACE_BESIDE`).
- A section judged only from a downscaled full-page capture, or a section critique verdict other than ship or fix.
- A service page built on the previous page's section skeleton, or with no scroll-driven scene (`NO_SCROLL_SCENE`).
- A content page (docs, help, article, blog, post, about, contact, legal) dressed as a service page: a pinned scene, explainer bento or self-playing demo forced onto it, ordered "lessons" for independent topics, or all articles rendered inline instead of each on its own page.
- A pinned scroll scene that shows a strip of content over an empty screen, or pins without its heading (`PINNED_SCENE_EMPTY`, `PINNED_SCENE_NO_HEADING`).
- Anything without a passing proof gate (`proof.mjs --verify`): content outside the page column, a half-empty column beside a stage, sparse or abstract explainers, or images the fresh-eyes reviewer did not judge.
- Decorative accent lines in cards; a hover glow in a single color; a showcase that waits for clicks; a visible pause button on the marquee; multi-line text revealed by one wipe.
- Layout shift without input, idle or while scrolling (`IDLE_LAYOUT_SHIFT`, `SCROLL_LAYOUT_SHIFT`).
- A blur surface that is opaque or blur-only; a large full-screen `backdrop-filter` on mobile.
- Hover-only information that touch users cannot reach.
- A claim of "verified" without rendered-page evidence. If browser checks cannot run, say exactly which ones.
- Changes to other pages when the task is scoped to one page.

## Reporting

End every task with: what changed and why, the motion matrix as built, files touched, the audit result (FAIL/WARN counts and anything accepted), budget numbers vs targets, screenshots for 375px and 1440px in dark and light, **the section critique table (your verdicts and the fresh-eyes reviewer's findings, with what changed)**, **the proof gate result (`proof.mjs --verify` output) with the key walk frames and explainer filmstrips embedded**, the review-log checklist result, and a clear list of what is verified in a browser versus what is not.
