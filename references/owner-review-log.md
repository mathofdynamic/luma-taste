# Owner review log

Every entry is something the owner rejected on a real Luma page. They are not page-specific: the same mistake on any other page is the same defect. Read this before planning, and walk the checklist at the end before reporting.

Format: **what was shipped → why it was rejected → the rule → how to check it.**

## Review 01 — Home page (2026-10-22)

### Hero
1. **Hero demo showed one tool (ساخت تصویر only).** The hero must represent a big portion of the product.
   - Rule: the hero visual is a *studio* demo that cycles through several tools with real results (create image, edit image, make video, virtual try-on, assistant chat, …), a tool rail that highlights the active tool, prompt → processing → result for each. See `signature-patterns.md` §4.
   - Check: watch the hero for one full cycle; at least 4 different tools appear; the reduced-motion and no-JS frame still names several tools.
2. **Hero animation was a forgettable 600ms one-shot.** The hero is where attention is won.
   - Rule: the hero demo is a gated loop (runs only in view, pauses when the tab is hidden, never under reduced motion), compositor-only properties, images lazy-loaded one scene ahead.
   - Check: audit shows the loop paused off-screen; trace shows no long tasks from it.

### Navigation
3. **Active page shown with two stacked underlines** (`text-decoration` plus a pseudo-element underline). It looked broken and did not read as "you are here".
   - Rule: the active item is a **pill** (surface fill + hairline border) around the label. Never combine `text-decoration` with a drawn underline; never use underlines for the active state.
   - Check: screenshot the header on every page state; exactly one indicator, a pill.
4. **Dropdown had weak blur**, content behind was distracting.
   - Root cause found later: the production CSS kept only `-webkit-backdrop-filter`, so Chrome showed no blur at all (see the declaration-order rule in `identity-and-tokens.md`).
   - Rule: menus use the strong glass: about 80% surface opacity + `blur(28px) saturate(1.6)`, verified in a production build.
5. **Dropdown stayed open after the pointer left.**
   - Rule: hover intent. Open after about 80ms of hover on fine pointers, close about 160ms after the pointer leaves the trigger *and* the panel. Click, Enter/Space and Escape still work; touch uses click.
6. **Dropdown items were plain text.**
   - Rule: every menu item has an icon (reuse the service icons, which also play their hover story) and, where space allows, a one-line description.
7. **Dropdown items appeared all at once.**
   - Rule: items stagger in (rise 8px + opacity, about 200ms each, 25-35ms lead).
8. **Moving from one dropdown to another closed one and opened the other.**
   - Rule: one shared panel that **morphs** (size) and **slides** (position) to the new trigger with ease-in-out (`--lm-ease-move`), while the content cross-fades with a small directional shift. See `signature-patterns.md` §1.
9. **Mobile menu opened badly and blended into the page** (translucent sheet over busy content, cut-off buttons, inner scrollbar).
   - Rule: the mobile menu is a sheet that **stands out**: dim + blur scrim behind, dense glass (about 80% surface opacity), materializes from the menu button (scale .96 → 1 + opacity from the trigger corner), items stagger in, every item and both buttons visible without an inner scrollbar on a 375×667 screen, sub-menus as accordions with icons.
   - Check: screenshots at 375×667 and 375×812 with the menu open; no scrollbar, scrim visible, contrast of every label ≥ 4.5:1.

### Theme
10. **Theme switch was an instant flip.**
    - Rule: the new theme is revealed by a circle that grows from the toggle button over the whole page (View Transitions API, `clip-path: circle()` on the new snapshot, about 500ms ease-in-out). Fallback: instant switch. Reduced motion: instant switch. See `signature-patterns.md` §2.

### Buttons
11. **Primary button hover just inverted the colors.** Too cheap.
    - Rule: keep the inversion concept but make it physical: a layer of the inverse color rises from the bottom as a curved liquid wave and fills the button while the label color flips. Leaving drains it back. See `signature-patterns.md` §3.

### Entrance motion
12. **Entrances were too fast (100ms) and "worked really badly sometimes"**: elements were visible, then jumped to hidden when the reveal started (blink), and several sections fired at load.
    - Rule: Luma entrance timing (about 600ms, 24px rise, 70ms stagger), per element on scroll (15% visible, bottom root margin -10%), hidden state staged before the element reaches the viewport, elements already on screen when JS boots are not re-hidden. See `motion-system.md` §4.
    - Check: audit `PREMATURE_REVEAL` and `REVEAL_NOT_STAGED` are clean; record a scroll and watch for blinks.
    - Found while verifying the fix: with the shrunken bottom margin, the footer's last row could never reveal (it stays inside the bottom 12% even at maximum scroll). Rule: every reveal runtime has the end-of-page fallback; audit `REVEAL_NEVER_FIRES` is clean.

### Showcase (before / after)
13. **Large dead space under the text column** next to a tall image.
    - Rule: two-column sections balance heights (text column carries enough structure: use-case cards with descriptions, or the media column shrinks/changes ratio). See "Dead space" in `layout-and-components.md`.
14. **Comparison needed a range slider under the image.**
    - Rule: the divider follows the pointer while hovering the image (fine pointers), drags on touch, and the stage is focusable with arrow keys. No slider control below the media.

### Gallery
15. **Images popped in with no loading state.**
    - Rule: skeleton shimmer in the exact tile shape while loading; on decode the image reveals (opacity + slight scale settle, about 500ms); staggered by tile. See `signature-patterns.md` §6.

### Bento / explainers
16. **All bento animations were weak**: tiny twitches on hover, a "replay" button on every card.
    - Rule: each card tells its story legibly (orbit with traveling signals, documents feeding an answer, infinity drawing with a credit dot, code typing with a response, a short idea expanding into a rich prompt). Stories start when the card enters the view and repeat gently while in view; hover replays. No replay buttons. See `signature-patterns.md` §7.

### Testimonials
17. **Flat marquee with hard edges.**
    - Rule: edge fade masks plus a lens effect: cards near the edges are larger, turned toward the viewer (concave cylinder) and fade away. See `signature-patterns.md` §8.

### Found while verifying review 01 (not raised by the owner, same class of mistake)
18. **The hero demo moved the page.** During the typing phase the caret wrapped onto a third line, the studio grew 20px and the centered hero copy jumped on every scene change.
    - Rule: an auto-playing demo reserves the largest space any of its scenes/phases needs; carets and badges never add a line (flex row, not inline wrap).
    - Check: audit `IDLE_LAYOUT_SHIFT` is clean.
19. **Testimonial lens at 375px showed one swinging card.** The lens was normalized by half the viewport (about one card at 375px).
    - Rule: lens radius `max(viewport / 2, 1.5 × card width)`; check the lens in a 375px viewport screenshot.

## Review 02 (home page, screenshots)

20. **Typed prompt revealed both lines at once.** The hero composer wiped the whole prompt block with one `clip-path`, so a two-line prompt appeared on both lines simultaneously. The skill itself prescribed that wipe.
    - Rule: type word by word in reading order; words keep their layout (opacity only); caret on the word being written. See `signature-patterns.md` §4.
    - Check: audit `MULTILINE_WIPE`.
21. **Gradient line on the active showcase card.** "Adding lines in the cards is so AI slop": banned in the entire UI.
    - Rule: no decorative accent lines; state is surface, border, text color and motion. See `signature-patterns.md` §11.
    - Check: audit `DECORATIVE_ACCENT_BAR`.
22. **The showcase waited for clicks.** "The UI itself must act in a loop, not wait for us to play through."
    - Rule: any set of cases/scenes plays itself (pause on hover/focus, off-screen, reduced motion). See `signature-patterns.md` §10.
    - Check: audit `SHOWCASE_WAITS_FOR_CLICK` (genuine filters carry `data-user-choice`).
23. **The gallery did not respect the page grid.** CSS `columns` left a column empty when a batch came back short, so the masonry stopped at three of four columns.
    - Rule: JS-distributed grid columns on the page grid; measure container edges at 4 widths. See `signature-patterns.md` §6 and `layout-and-components.md` §1.
24. **Hover glow was always one color (read as purple).** Luma has three brand colors.
    - Rule: each card entered glows purple, magenta or orange at random, never the same twice in a row. See `signature-patterns.md` §11.
25. **Lens marquee had no room, and a pause button looked temporary.**
    - Rule: the marquee runs full bleed (the one content exception to the container); no pause button, rows stop on hover/focus. See `signature-patterns.md` §8.
26. **Praise: the bento micro-animations ("تجربه نهایت قدرت")** are the benchmark for every other page. See `layout-and-components.md` §6 "Motion benchmark".

### Found while verifying review 02 (not raised by the owner, same class of mistake: things that move the page)
27. **Lazy sections collapsed and jumped.** `next/dynamic` with `ssr: false` renders null while loading (not the Suspense fallback), so the reserved block went to 0px and back: CLS 0.25 for anyone scrolling. The reserves were also 100 to 1,400px shorter than the real sections.
    - Rule: pass a `loading` placeholder; reserve each lazy section's real height per breakpoint (base + percent padding fitted to measured heights, slightly under). See `performance-and-verification.md` §2.
    - Check: audit `SCROLL_LAYOUT_SHIFT`.
28. **Loading shimmer and comparison sweep counted as layout shift.** A translated highlight box and a divider animated with `left` both registered as shifts every pass.
    - Rule: shimmer animates `background-position` on a fixed layer; the divider moves with `transform`. See `signature-patterns.md` §5 and §6.

## Review 03 (home page)

29. **"The section below has no entrance at all."** On desktop the services header (and on 1920px the first card row) is visible at load. The scroll reveal marks visible content as revealed without animating it, so the whole section looked static while every other section animated.
    - Rule: content visible at load continues the hero's CSS load cascade; the scroll reveal handles the rest. See `motion-system.md` §4.
    - Check: audit `FIRST_SCREEN_STATIC`; look at 1440×900 and 1920×1080, not only 375.

### Found while verifying review 03 (things that move the page)
30. **`content-visibility: auto` jumped the page.** The bento's `contain-intrinsic-size: auto 1600px` was 900px short at 375px; when it rendered during a fast scroll the page moved (CLS 0.04 to 0.06).
    - Rule: no `content-visibility` estimates on sections. See `performance-and-verification.md` §2 item 8.
31. **Lazy section reserves were 15 to 85px off.** Heights change with each line wrap, so no CSS formula matches them, and the error shows when a slow chunk mounts the section in view.
    - Rule: mount lazy sections at idle after load as well as on approach. See `performance-and-verification.md` §2.
    - Check: audit `SCROLL_LAYOUT_SHIFT`; repeat the fast scroll several times, because it is timing-dependent (it failed 2 of 5 runs).

## Pre-delivery checklist (state the result of each line in the report)

- [ ] Hero demo cycles through at least 4 tools with real results; paused off-screen; static frame names several tools.
- [ ] Header: single pill active state; hover pill; no underline anywhere in the nav.
- [ ] Glass verified in production: `backdrop-filter` computed (not `none`) on header, menus, sheet; audit has no `BACKDROP_PREFIX_ONLY`.
- [ ] Dropdowns: hover intent open/close, strong glass, icons, staggered items, one morphing panel sliding between triggers, Escape and focus return work.
- [ ] Mobile menu stands out (scrim + dense glass), materializes from the trigger, no inner scrollbar at 375×667.
- [ ] Theme switch reveals in a circle from the toggle; instant under reduced motion.
- [ ] Primary buttons use the liquid fill hover; press scale on all buttons.
- [ ] Entrances: about 600ms, per element on scroll, no blink, nothing below the fold revealed at load, and nothing still hidden at the very bottom (footer included).
- [ ] Everything visible in the first screen animates in, at 1440×900 and 1920×1080 too (`FIRST_SCREEN_STATIC` clean).
- [ ] No dead space in two-column sections at 1024 and 1440.
- [ ] Comparisons follow the pointer; no slider under media; keyboard arrows work.
- [ ] Media tiles: skeleton while loading, smooth reveal on decode, fallback on error.
- [ ] Explainer stories are legible, play on view, repeat while in view, no replay buttons.
- [ ] Testimonials: edge fade and lens effect (also at 375px: neighbors peek, the centered card is flat); pause on hover/focus; reduced motion = swipeable static row.
- [ ] Idle at the top for 12s: nothing moves the layout (`IDLE_LAYOUT_SHIFT` clean).
- [ ] Fast scroll from top to bottom at 375 and 1440: total layout shift 0.01 or less (`SCROLL_LAYOUT_SHIFT` clean), including lazy sections and loading media.
- [ ] Typed text appears word by word in reading order (`MULTILINE_WIPE` clean).
- [ ] No decorative accent lines anywhere (`DECORATIVE_ACCENT_BAR` clean); card glows rotate the three brand colors.
- [ ] Every showcase / scene set plays itself (`SHOWCASE_WAITS_FOR_CLICK` clean).
- [ ] Every section's content edges equal the container edges at 375, 768, 1024, 1440 (the full-bleed marquee excepted).
- [ ] Explainer sections reach the bento benchmark (playing films, not twitches).
