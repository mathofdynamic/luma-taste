# Layout, components, hover vocabulary

## 1. The page grid is law

- One container: `.lt-container` (max 1200px, side padding 20 / 32 / 48px by breakpoint). Every section's content sits inside it. Full-bleed backgrounds are allowed; **content** is not.
- 12-column grid (`.lt-grid`, gutter 16 to 24px). Mobile: 4 effective columns (cards span 6 of 12 for 2-up, or 12 for 1-up). Tablet: 8. Desktop: 12.
- Cards, media and text blocks start and end on column edges. Do not nudge elements by arbitrary pixels, and do not center one block inside a left-aligned flow unless it is a short headline block.
- Equal-height rows: `align-items: stretch`; cards in one row share height by the grid, never by a fixed `height`.
- Vertical rhythm: sections use `--space-section` (64px mobile to 112px desktop); inside a section use the 4px scale (8, 12, 16, 24, 32, 48).
- RTL: reading starts at the right. Use logical properties; check that icons that imply direction (arrows) are mirrored.
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
| Button, primary | white fill, near-black text, pill, min height 44px, 500 weight; one primary per view. Press scale .97 (`.lm-press`) |
| Button, secondary | transparent, 1px `--border-strong`, pill; hover fills `--surface-2` |
| Card (`.lm-card`) | `--surface-1`, 1px `--border`, 20px radius, 20 to 24px padding; hover raises border and surface by one step, plus the card's own icon story |
| Badge / eyebrow | pill, `--surface-1`, 1px border, 12px minimum; use only when it carries information |
| Nav | sticky glass header (blur + low opacity), 56px mobile / 64px desktop; active item = white text plus underline draw; mobile sheet uses the surface contract |
| Media tile | 16px radius, fixed aspect ratio, poster-first video with a play badge, tap to play |
| Lightbox | glass scrim (`.lm-scrim`) + image surface following the surface contract (open 100ms, close 66ms); Escape and outside click close; focus returns to the trigger |
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
| Testimonial marquee | pauses; the focused card lifts 2px |

Starter implementations (waveform, scissors snip, push-out, with hover, focus, touch and reduced-motion paths) are in `assets/luma-hover-stories.css`. For a new service, ask: what does this tool physically do, and what is the smallest motion that shows it? Keep each story under 400ms and replayable.

## 5. Explainer sections are never static

| Explainer | Story |
|---|---|
| Ecosystem / orbit | rings rotate slowly in view (gated loop); hovering a node highlights its connector and dims the rest |
| Document assistant (RAG) | document chips slide down an arrow into the answer; the answer highlights |
| Fair-pay model | an infinity stroke draws on view; a "pay per use" chip counts |
| Prompt enhancer | a short idea expands into a detailed prompt (two lines cross-fade/translate; no height animation) |
| API / code card | code lines reveal in sequence (opacity + translate, 33ms lead) and a cursor blinks (gated) |
| Showcase (before/after) | slider follows pointer/touch 1:1 with spring release; on scroll the reveal advances |

Plain text-only explainers get one minimal playful touch: an underline that draws under the key phrase, an icon that settles into place, or a line that fills as the section enters.

## 6. Section recipes (what a good Luma section looks like)

- **Hero:** headline (H1 with the animated gradient word) sequenced in by the entrance contract; one primary and one secondary CTA; a populated product visual (prompt plus a real result), not an empty mock; one static glow behind. The H1 text is the LCP element: server-rendered, no animation delaying it, no large media as LCP. Height at most 100svh on mobile.
- **Services grid:** 2 columns on mobile, 4 on desktop; icon plate, title, full description; whole card is the link; all service links stay in the server-rendered HTML; extra services behind "مشاهده همه".
- **Gallery:** 2-column masonry on mobile, 3 to 4 on desktop; 12 tiles first, then load more; poster-first video.
- **Bento / explainer:** different card sizes for hierarchy; each card has its story (section 5).
- **Testimonials:** marquee, two rows on desktop (opposite directions), one row on mobile; reduced motion becomes a swipeable scroller.
- **Final CTA:** one headline with the gradient word, supporting line, primary and secondary pills, one static glow; floating decoration only on desktop and static or gated.
- **Footer:** accordion link groups on mobile (all links in server HTML), fixed-size lazy trust badges, 44px touch targets.
