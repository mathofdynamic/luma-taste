# Layout, components, hover vocabulary

## 1. The page grid is law

- One container: `.lt-container` (max 1200px, side padding 20 / 32 / 48px by breakpoint). Every section's content sits inside it. Full-bleed backgrounds are allowed; **content** is not.
- 12-column grid (`.lt-grid`, gutter 16 to 24px). Mobile: 4 effective columns (cards span 6 of 12 for 2-up, or 12 for 1-up). Tablet: 8. Desktop: 12.
- Cards, media and text blocks start and end on column edges. Do not nudge elements by arbitrary pixels, and do not center one block inside a left-aligned flow unless it is a short headline block.
- Equal-height rows: `align-items: stretch`; cards in one row share height by the grid, never by a fixed `height`.
- Vertical rhythm: sections use `--space-section` (64px mobile to 112px desktop); inside a section use the 4px scale (8, 12, 16, 24, 32, 48).
- RTL: reading starts at the right. Use logical properties; check that icons that imply direction (arrows) are mirrored.
- **Dead space (owner review 01).** In any two-column composition, compare the two column heights at 1024px and 1440px. If one column is more than about 25% taller than the other, fix it: give the shorter column real structure (use-case cards with descriptions, a feature list, a stat strip that is true), change the media aspect ratio (4/5 to 4/3 or 1/1), or stack the composition. Centering a short text block vertically beside tall media is not a fix. Empty space must be intentional breathing room around a focal element, never a hole beside one.
- **Verify with an overlay.** During review add a temporary 12-column overlay (a fixed pseudo-element using the same container and `repeating-linear-gradient`), take screenshots at 375px and 1440px, and confirm edges align. Remove it before committing.

## 2. Text must be fully readable in cards

The old pattern (descriptions ending in "…" or cut at the card edge) is a defect.
- **Never** use `text-overflow: ellipsis`, `-webkit-line-clamp`, or a fixed card `height` on descriptive copy.
- Let descriptions wrap to as many lines as needed (a services card usually needs 3 to 4). Cards in the same row grow together.
- Use `min-height`, not `height`. Use `text-wrap: pretty` for body and `balance` for titles.
- Keep line length under about 38 to 45 characters in narrow cards by widening the card or reducing columns, not by cutting text.
- If copy is genuinely too long for the design, shorten the copy only with the owner's approval; report it.
- The audit flags clipped text, ellipsis and line-clamp as FAIL.

## 3. Components

Build once, reuse everywhere. Same tokens as `identity-and-tokens.md`.

| Component | Spec |
|---|---|
| Button, primary | `--text` fill, `--bg` label, pill, min height 44px, 500 weight; one primary per view. Hover: **liquid fill** of the inverse color rising from the bottom as a curved wave (450ms `--lm-ease-move`) while the label flips color; leaving drains it. Press scale .97 (`.lm-press`). Recipe: `signature-patterns.md` section 3 |
| Button, secondary | transparent, 1px `--border-strong`, pill; hover: the same liquid fill in `--surface-2` (subtler), border to `--text-3` |
| Card (`.lm-card`) | `--surface-1`, 1px `--border`, 20px radius, 20 to 24px padding; hover raises border and surface by one step, plus the card's own icon story |
| Badge / eyebrow | pill, `--surface-1`, 1px border, 12px minimum; use only when it carries information |
| Nav | sticky glass header (blur + low opacity), 56px mobile / 64px desktop; **active item = pill** (`--surface-2` fill + 1px `--border-strong`, `--text` label), hover = lighter pill, **no underlines**; dropdowns: hover intent, one morphing glass panel sliding between triggers, icon + label (+ one-line description) items that stagger in; mobile menu: standout sheet with scrim (`signature-patterns.md` sections 1 and 9) |
| Theme toggle | 44px round icon button showing sun/moon (not a glyph character); switching reveals the new theme in a circle from the button (`signature-patterns.md` section 2) |
| Media tile | 16px radius, fixed aspect ratio, poster-first video with a play badge, tap to play; **skeleton shimmer while loading, reveal on decode** (opacity + scale 1.03 to 1, 500ms), quiet fallback on error (`signature-patterns.md` section 6) |
| Lightbox | glass scrim (`.lm-scrim`) + image surface (open 320ms with scale .96 to 1, close 160ms); Escape and outside click close; focus returns to the trigger |
| Before/after comparison | the divider follows the pointer while hovering (fine pointers), drags on touch, arrow keys move it when the stage is focused (`role="slider"` with `aria-valuenow`); labels on the two halves; **never a range input under the image** (`signature-patterns.md` section 5) |
| Marquee card | same as Card, 3-line quote allowed to wrap fully, 32px avatar, stars in `--text-2` |

## 4. Hover vocabulary: each element reacts as what it is

The baseline is a neutral border/surface change. On top of it, the icon or illustration plays a short story tied to the service. All CSS transforms on SVG parts or the icon plate, 180 to 400ms, gated to real hover plus `:focus-visible`; on touch, play once on enter-view or on tap.

| Card / element | Story on hover |
|---|---|
| ساخت تصویر (image creation) | frame tilts 4deg, a small sparkle scales in at the corner |
| حذف پسزمینه (background removal) | scissor blades snip: each blade rotates about 12deg in opposite directions, twice |
| ویرایش تصویر (image editing) | pencil nudges diagonally and draws a short underline (stroke-dashoffset) |
| دستیار هوشمند (assistant) | bot head bobs up 2px and the eyes blink once |
| افزایش کیفیت تصویر (image upscale) | expand arrows push outward (translate along their axis) and the frame scales 1.06 |
| تبدیل متن به گفتار (text to speech) | waveform bars animate `scaleY` with a stagger, like a live voice |
| افزایش کیفیت ویدیو (video upscale) | film frame ticks: sprocket marks slide one step |
| ساخت ویدیو (video creation) | camera slides slightly and a play triangle pulses |
| Primary CTA | arrow slides toward the reading direction by 4px; press scale .97 |
| Nav link | underline draws from the reading start (scaleX with `transform-origin` at start) |
| Gallery tile | image scales 1.04 in a clipped frame; play badge scales in |
| Testimonial marquee | pauses (eases to a stop); the focused card lifts 2px |
| Menu item (dropdown or mobile) | icon plays the service's hover story; highlight pill under the pointer |

Starter implementations (waveform, scissors snip, push-out, with hover, focus, touch and reduced-motion paths) are in `assets/luma-hover-stories.css`. For a new service, ask: what does this tool physically do, and what is the smallest motion that shows it? Keep each story under 400ms and replayable.

## 5. Explainer sections tell a story you can read

The owner rejected short twitches (300ms) and "replay" buttons. Every explainer card is a tiny film:

- **Legible:** 1.2 to 3s per story, with clear beats (input, transformation, result). A visitor who glances for two seconds understands what the feature does.
- **Automatic:** the story plays when the card enters the view, then repeats gently while the card stays in view (rest 1.5 to 3s between plays), and stops off-screen and when the tab is hidden.
- **Responsive:** hover and `:focus-visible` replay it from the start immediately.
- **Settled frame = final frame:** with no JS or reduced motion, the card shows the completed result.
- **Cheap:** transform, opacity, clip-path and small-SVG strokes only, driven by CSS keyframes keyed off `data-story-playing="true"`.
- No replay buttons.

| Explainer | Story |
|---|---|
| Ecosystem / orbit | rings rotate slowly (gated loop); signals (small dots) travel from each tool node into the Luma core one after another, the core pulses when hit; hovering a node lights its connector and dims the rest |
| Document assistant (RAG) | document chips slide into the core one by one, a scan line passes, the answer types in line by line with a source chip |
| Fair-pay model | the infinity stroke draws, a credit dot travels the loop, the "no expiry" chip pops, a usage meter fills only as far as used |
| Prompt enhancer | a short idea chip, a wand sweep, then the detailed prompt appears as tags (style, light, lens, mood) popping in one by one |
| API / code card | code lines type in sequence with a blinking cursor (gated), then a response line slides in |
| Showcase (before/after) | the divider sweeps once on view to invite interaction, then follows the pointer |

Plain text-only explainers get one playful touch: an underline that draws under the key phrase, an icon that settles into place, or a line that fills as the section enters.

## 6. Section recipes (what a good Luma section looks like)

- **Hero:** headline (H1 with the animated gradient word) in the CSS-only load sequence (transform-only rise for the H1 so LCP is not delayed); one primary (liquid fill) and one secondary CTA; a **studio demo that cycles through several tools** with real results (`signature-patterns.md` section 4), not a single-tool card and not an empty mock; one static glow behind. The H1 text is the LCP element: server-rendered, no large media as LCP. Height at most 100svh on mobile (the demo may start below the fold on phones).
- **Services grid:** 2 columns on mobile, 4 on desktop; icon plate, title, full description; whole card is the link; all service links stay in the server-rendered HTML; extra services behind "مشاهده همه".
- **Gallery:** 2-column masonry on mobile, 3 to 4 on desktop; 12 tiles first, then load more; poster-first video; skeleton tiles in masonry shapes while loading; tiles reveal as each image decodes.
- **Bento / explainer:** different card sizes for hierarchy; each card has its story (section 5).
- **Testimonials:** lens marquee with edge fades (`signature-patterns.md` section 8), two rows on desktop (opposite directions), one row on mobile; reduced motion becomes a swipeable scroller.
- **Showcase (before/after):** text column with the use cases as selectable cards (title + one-line description) so it balances the media column; media 4/3 or 1/1 on desktop; pointer-following comparison.
- **Final CTA:** one headline with the gradient word, supporting line, primary and secondary pills, one static glow; floating decoration only on desktop and static or gated.
- **Footer:** accordion link groups on mobile (all links in server HTML), fixed-size lazy trust badges, 44px touch targets.
