# Luma identity and tokens

Starter CSS: `assets/luma-tokens.css`. If the project has its own token system, map to it rather than adding a parallel one.

## The feel in one paragraph

Midnight canvas, hairline-precise structure, one warm spark. Linear's dark precision, ElevenLabs's soft pill-and-hairline restraint, and OpenAI's content-first calm, all lit by the Luma gradient (purple, magenta, orange) taken from the logo. Results (generated images, product UI) are the hero. Chrome stays neutral so the gradient and the product visuals carry the color.

## Color

Brand (sampled from the logo): purple `#8B1BAD`, magenta `#ED457B`, orange `#FF9024`.

| Token | Dark (default) | Role |
|---|---|---|
| `--bg` | `#07070A` | page canvas |
| `--surface-1` / `-2` | `#0E0E12` / `#15151B` | cards / elevated, hovered, inputs |
| `--border` / `--border-strong` | `#23232B` / `#34343F` | hairlines |
| `--text` / `-2` / `-3` | `#F5F5F7` / `#B4B4BE` / `#8A8A96` | headlines / body / captions (keep 4.5:1) |
| `--focus` | `#ED457B` | focus ring, 2px with 2px offset |

Light theme tokens exist in `luma-tokens.css`; dark is primary and light must still look right.

## Gradient rules (revised)

The gradient is Luma's signature, so it is **animated and recurring**, but disciplined:

- **Title word:** the main word or phrase of each large heading uses `.lm-gradient-word` (animated, in-view only). One per heading.
- **Concurrency:** at most 2 animated gradient elements in a viewport. The audit warns on more than 4 running loops of any kind on mobile.
- **Elsewhere:** thin accent lines, glows (one static radial gradient per hero/CTA), progress fills, and one "brand CTA" border. Never gradient fills on buttons, cards, nav, body text or icons.
- **Text ramp:** on dark backgrounds use the lighter text ramp (`--luma-text-*`); the raw brand purple fails contrast as text.
- **Glow:** a static `radial-gradient(60% 50% at 50% 0%, rgb(139 27 173 / .35), transparent 70%)`. No full-screen blur filters and no animated canvas/WebGL.

## UI chrome stays neutral

Buttons, cards, tabs, nav, inputs: white / gray / near-black. Color lives in the gradient moments and in product visuals. Monochrome 1.5px line icons (Lucide or the set already in use); icons may animate on hover but are not colored.

## Typography (Persian-first)

| Role | Family | Notes |
|---|---|---|
| Persian + UI | Vazirmatn (OFL) or the project's licensed Persian font | one variable file, self-hosted |
| Latin / numerals | Inter (OFL) | Latin subset only |
| Mono | system `ui-monospace` | no mono webfont |

Never ship proprietary fonts named in reference files (Waldenburg, Söhne, Lausanne, Berkeley Mono, Geist).

Persian rules:
- **No letter-spacing, ever** (it breaks joining). Tight tracking is for Latin display only.
- **No weight 300** for Persian display on dark. Hero 600, headings 500, body 400.
- Line-height: body 1.8, headings 1.3. Use `text-wrap: balance` for headings and `pretty` for paragraphs.
- Pick ONE numeral style per surface (Persian or Latin digits) and keep it.
- Logical properties only (`margin-inline-start`, `padding-inline`, `text-align: start`, `inset-inline`). Exceptions must be commented (the marquee track is physical on purpose).

Scale (fluid, via `clamp()`): display 34 to 60px/600, h2 26 to 40px/500, h3 18 to 22px/500, body 15 to 16px/400, small 13 to 14px, **minimum 12px**. Line length under about 70 characters for paragraphs.

## Shape, depth and materials

- Radii: pill for buttons/chips/tabs; cards 20px (16 on mobile); large bento 24px; media 16px; inputs 12px.
- Depth is a 1px hairline plus one surface step, not stacked shadows. Only the inset top-light `0 1px 0 rgb(255 255 255 / .04) inset` is allowed.
- **Blur surfaces = blur + low opacity** (`.lm-glass`: about 55% opacity background, `blur(16px) saturate(1.4)`, 1px translucent border). Lightbox and modal backdrop (`.lm-scrim`): about 45% black with `blur(10px)`. Use on small fixed layers (header, menus, popovers, lightbox). Never stack a light translucent surface on another. Text over glass: higher contrast than normal and no flat gray.
- **Material levels (owner review 01: the dropdown blur was too weak, the mobile menu blended into the page):**

  | Level | Background | Blur | Use |
  |---|---|---|---|
  | Thin | `--bg` 55-60% | `blur(16px) saturate(1.4)` | header bar |
  | Strong | `--surface-1` 68% | `blur(24px) saturate(1.6)` + `0 24px 64px -24px rgb(0 0 0 / .55)` | dropdowns, popovers |
  | Sheet | `--surface-1` 82% | `blur(24px) saturate(1.6)` over a scrim of `rgb(0 0 0 / .5)` + `blur(4px)` | mobile menu, dialogs |
  | Scrim (lightbox) | 45% black | `blur(10px)` | lightbox, modal backdrops |

  Light theme uses the same opacities on the light surfaces with a softer shadow (`rgb(20 16 30 / .18)`).
- A bigger surface reads as thicker: more blur and a deeper shadow than a chip.
- Materialize: surfaces animate scale/opacity (and optionally blur radius) together on enter, rather than a plain fade, when the cost is acceptable.
- Provide a fallback for browsers without `backdrop-filter` (higher-opacity solid), included in `luma-motion.css`.

## Imagery

- Real product outputs are the hero visuals. Use existing repo/gallery assets; never invent assets or use anything without clear rights.
- AVIF/WebP, explicit width/height or aspect-ratio, responsive `sizes`, lazy below the fold, poster-first video with tap-to-play.
- Ecosystem/orbit diagrams are inline SVG with CSS transforms, not JS-driven canvases.
