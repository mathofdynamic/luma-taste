# Design process (distilled from Anthropic's frontend-design guidance, adapted to Luma)

Luma's visual direction is **pinned** by the brand (dark, gradient, Persian, premium). Use this process on the axes that are **free**: composition, hierarchy, the hero concept, copy, rhythm, and restraint. Where the brand explicitly pins something, follow it exactly and spend your care on execution.

## Plan, critique, build

1. **Ground in the subject.** Name the page's audience and its one primary job (for the landing page: a visitor understands what Luma does in five seconds and starts). Build with Luma's real content: real services, real generated outputs, real Persian copy.
2. **Write a compact plan:** 4 to 6 named colors (the Luma tokens), type roles, a layout concept in one-sentence prose plus an ASCII wireframe per section (alignment decided: RTL, start-aligned by default, centered only for short headline blocks), and 3 to 5 principles that make *this* page distinct. For every row of cards add the numbers: cards per row and the card width at 375, 1024 and 1440 (container content width minus gutters, divided by columns), checked against `layout-and-components.md` §7. Choose the layout from what one card needs (its text, its demo), never from the item count or the motion idea alone: "five steps, so five columns for a left-to-right pipeline" is how review 04 went wrong.
3. **Critique the plan against the generic defaults** and revise what reads as default. The defaults to avoid on free axes: identical rounded cards with the same soft shadow everywhere, decorative gradient washes, a tracked all-caps eyebrow above every heading, middle-dot meta strings, "→" appended to every link, numbered 01/02/03 markers when the content is not a sequence, a big-number-plus-label hero as the default hero.
4. **Build**, then **critique the rendered result** section by section from the audit's native-size section frames (rest and mid-motion), using the questions in "Section critique" (`owner-review-log.md`), then hand the same frames to a reviewer who did not build the page. Chanel's rule: before leaving the house, remove one accessory. Cut the decoration that does not serve the brief.
5. **Distrust your own "looks fine".** The builder sees the design they intended. If you catch yourself writing "close enough", "roughly aligned" or "minor" about something in a screenshot, that is a defect you have already found: fix it or report it.

## Page shape: every page its own (owner review 06)

Service pages share tokens, materials, motion timing and components, not a skeleton. Before the plan:

1. **Write the ledger.** For the last three pages built, list each section's shape in a few words (for example: "hero copy + phase studio", "list beside one stage", "4-card grid with demos", "live catalog grid", "sticky FAQ + list"). Put it in the plan.
2. **Choose from what the service has to explain**, not from the previous page's parts. A voice service can be read as a waveform you scroll along; a try-on as a figure that dresses itself; a workflow as a canvas whose nodes connect as you scroll. Then pick shapes that differ from the ledger: at most one section may share a shape with the previous page, and the hero must not repeat the previous hero's composition.
3. **Shape vocabulary** (mix, do not default): full-width scroll scene (pinned stage whose state follows scroll progress); split hero with an object instead of an app window; asymmetric bento of mini explainers (the home bento is the benchmark); horizontal strip or timeline; a single large interactive object; editorial text with inline media; numbered story told down the page; compact comparison table; quote or statement band; spec sheet.
4. **One outstanding moment, many quiet ones.** One section per page earns attention (often the scroll scene); the rest explain with small looping or hover stories like the home bento (an orbit, a document being read, an infinity line, prompt chips, a few lines of typed code).
5. **At least one scroll-driven scene** (`signature-patterns.md` §12). It replaces a self-playing board where the story is a sequence; do not add both for the same story.
6. In the report, show the ledger next to this page's shapes.

## Luma's pinned choices vs generic-design tells

| Generic-design warning | Luma decision |
|---|---|
| Accenting a single word in a headline is a tell | **Keep.** The animated gradient word is a Luma signature. Execute it well: one word, meaningful, never on every heading line |
| Fade-and-rise entrances on every section read as generated | **Keep, with Luma timing.** Entrance motion is mandated; make it calm and scroll-driven (600ms, 70ms stagger, per element as it enters) so it feels intentional, not decorative. The owner rejected 100ms reveals as invisible and glitchy |
| Near-black plus a bright accent is common | **Keep.** It is the brand; differentiate through the gradient, the product visuals, and the motion |
| Hover transitions on every card are generic | **Keep, but make each hover specific** to the card (icon story), not a generic lift |
| SaaS card kit (identical cards) | Vary scale and hierarchy: hero visual large, services in a tight grid, bento with different card sizes, testimonials as a moving band |

Spend boldness in one place per page: the memorable element is the animated gradient headline together with living product visuals. Keep everything around it quiet and disciplined.

## Quality floor (ship without announcing it)

Responsive down to mobile, visible keyboard focus, reduced motion respected, contrast 4.5:1, touch targets at least 44px, no horizontal overflow, no layout shift.

## Writing for the interface

Words exist to help people understand and act. Persian UI copy:
- Plain, direct verbs; name things by what users understand, not how the system is built.
- CTAs say what happens (شروع رایگان, مشاهده نمونه‌کارها). The same action keeps the same name through the flow.
- Keep existing copy meaning on restyles. Do not invent claims, numbers or testimonials.
- Errors say what happened and how to fix it; empty states invite an action.
- One job per element: a heading names, a subline explains, a button acts.

## CSS hygiene

Watch selector specificity so section and component rules do not cancel each other (especially padding and margin between sections). Prefer one spacing mechanism (section padding from `--space-section`), not nested competing margins.
