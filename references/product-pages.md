# Product pages (owner review 11)

Luma has three kinds of page. **Service pages** (`/service/*`) show commodity tools every AI company has: image, edit, video, audio, chat. **Content pages** hold information (docs, help, blog, legal). **Product pages** (`/product/*`, header menu «محصولات») show Luma's own crafted products: Luma Agents, My Teacher (معلم من), Smart Assistant (website chatbot), Workflows and Mini-Apps. The owner wants product pages to go "much further and much deeper with creative design and motion" and to look clearly different from service pages, while staying unmistakably Luma.

> A service page shows a tool in a window. A product page is a stage where the product performs and the visitor takes part.

Creative direction for product pages is drafted with an adviser model (owner choice: Claude Fable 5.2) before planning; the builder still owns the plan, the self-score and the proof gate.

## 1. Rules (bind only `/product/*`)

1. **Classify a third kind: product page.** Every rule here binds only product pages. *Why: unscoped rules leak onto the wrong pages (review 09).*
2. **The visitor does the product once per page.** At least one scene takes real input (pick, drag, answer, confirm) and its outcome depends on that input. *Why: products are sold by use; hover replays are the service tier.*
3. **Attract, then hand over.** Every interactive scene plays itself until touched, then gives control, and resumes about 8s after the last input. *Why: keeps rule 15 (the UI plays itself) while adding depth.*
4. **One object travels the whole page.** Pick a through-line (a task card, a question, a data packet, an app) and show the same object in every section. *Why: a narrative separates a product from a feature list.*
5. **Sections hand off; they do not just reveal.** The through-line leaves section N toward the next and is the first thing to arrive in N+1, each inside its own clipped stage. *Why: the owner asked for agents carrying the transition, not a transition.*
6. **One stage per screen, full column width.** No "copy beside a studio window" hero and no card grid as a main section. *Why: that skeleton is the service template (review 06).*
7. **Motion has beats.** Staged actions are anticipation (120ms), action (`--lm-ease-move`), settle (`--lm-ease-out`). Ordinary content keeps the 600ms entrance. *Why: service motion is legato; products need rhythm without new curves.*
8. **At most two scenes carry weight.** One hero scene and one pinned scroll scene are "loud"; everything else is home-bento calm. *Why: five loud scenes read as a theme park.*
9. **Everything staged is the real product.** Real node types, real agent fields, real copy, labelled sample data («نمونه»). *Why: `EXPLAINER_SPARSE` and the abstract-doodle rejection (review 08).*
10. **Never changes:** tokens, fonts, neutral chrome, gradient discipline (at most 2 animated gradient words in view), glass levels, the shared background layer, the page grid, no accent lines, no clipped text, transform/opacity only, zero idle layout shift, the proof gate. *Why: different staging, same brand.*

Retired shapes: the old `/service/workflow` (nodes dropping in on scroll) and `/service/assistant` (a chat studio beside copy) go into the page-shape ledger as taken; product pages must not reuse them. The old URLs redirect permanently to the product pages.

## 2. The character system: «لومک» (little Luma agents)

- **Drawing:** one inline SVG `<symbol>`, 24×32 units, rendered 32–48px tall, never taller than an H2 line. Body: a capsule in `--surface-2` with a 1.5px `--border-strong` hairline. Face: one visor slot holding a single spark dot; no mouth, no eyebrows, no hands. Two 2px line legs; two line arms that exist only while carrying. The spark is the only colour, one brand stop per character (purple, magenta or orange), which keeps "neutral chrome, one warm spark".
- **Personality:** a stagehand: competent, quick, quiet. Emotion comes only from posture: lean into the walk, a 2px squash on landing, the spark sliding toward what it looks at, one blink every 4–7s.
- **Movement:** three nested transform-only CSS keyframe layers. Track wrapper: `translate3d` along the path, linear, about 140px/s. Body: 2px bob at twice the step rate. Legs: alternate `rotate(±22deg)`, 320ms ease-in-out. Carry: arms fade in, the object lifts 6px and tilts 3° (the 120ms grab beat), then shares the carrier's timing. Hand-off: the giver stops, the object slides 12px, the receiver's spark flashes, the giver leaves the way it came.
- **Word swap (Agents hero):** all candidate words stacked in one grid cell sized to the widest (no shift); each word its own compositor layer, never re-laid out; the real sentence with every word is in the heading for screen readers, the animated copy is `aria-hidden`.
- **RTL:** characters face their travel direction with `scaleX(var(--dir))`; outgoing objects exit toward inline-start, incoming enter from inline-end. The track is physical and commented as an exception, like the marquee.
- **Taste limits:** at most 3 on screen (1 moving on a phone). They never wave, celebrate, speak in bubbles or look at the visitor (one exception: the Workflows runner turns to ask the visitor a question). They only do jobs the product really does.
- **Where they appear:** Agents: the full cast (they are the product). Workflows: one runner (personifies a run). Mini-Apps: one inspector cameo (the safety review is a real actor). **Not** on My Teacher (a mascot makes a learning product read as a children's app; its language is ink and paper) or Smart Assistant (the widget itself is the character).

## 3. Product concepts (starting points; the page plan may refine them)

**Agents: «گروه» (the crew).** Through-line: a task card. (1) Hero, word couriers: «یک همکار هوشمند برای [پژوهش | پشتیبانی | فروش | محتوا]»; a لومک walks in, takes the word off-stage, another brings the next. (2) Assemble, pinned scroll scene: an empty agent card; scrolling sends couriers with role, model, tools, skills, knowledge, memory, each docking as a chip; afterwards the visitor swaps the role and the tools re-dock. (3) A day at work: the task card relayed through three stations (read a knowledge file, call a tool, write a result), ending as a real deliverable. (4) Memory: the visitor picks a preference on «شنبه»; on «چهارشنبه» the agent applies it unprompted. (5) Store shelf: agents in a line, the hovered or focused one steps forward and presents its card. (6) CTA: the crew carries the button label in. Remembered: the spark lighting when the sixth part docks.

**My Teacher: «دفترِ زنده» (the living notebook).** Ruled paper inside glass, an ink line that draws (small SVG strokes, `data-diagram`); no characters. Through-line: one real question in every format. (1) Hero: pick one of three questions; it types word by word and the lesson opens. (2) Step-by-step, pinned: each scroll step writes the next line of working; «چرا؟» on a line expands the reason. (3) A real quiz: four options; a wrong answer gets a calm explanation, a right one lights a node in the next section. (4) Concept map grows from that node; hover/focus traces prerequisites. (5) Flashcards: flip (`rotateY`), rate «بلد بودم» / «سخت بود», the card flies to «فردا», «۳ روز بعد» or «هفته بعد». (6) Progress panel with what the visitor did on the page, beside a lesson player that highlights the sentence being read. Remembered: the rated card landing on its future day.

**Smart Assistant: «صفحه خودش دمو است».** Through-line: a scripted demo widget docked on the page, labelled «نمونه نمایشی»; on phones an inline stage, never a floating overlay. (1) Hero: a miniature "your site" frame; the widget wakes and greets. (2) Knowledge, scroll scene: files and a sitemap flow into it; an answer appears with citation chips; focusing a chip lights its source. (3) Guided tour: the widget proposes «ببرمت به بخش نصب؟»; only on confirmation does the page scroll there and a spotlight ring lands on the target; the beats پیشنهاد → تأیید شما → انجام are visible. (4) Three ways in: plain site snippet, WordPress plugin, `@luma-ai/react`, code typed word by word with copy. (5) Make it yours: colour, position and greeting controls restyle the page's own widget live. Remembered: it asks permission, then really takes you somewhere.

**Workflows: «خودت اجرا کن».** Through-line: a data packet carried by one runner. (1) Hero canvas with one wire missing; the visitor drags or taps to connect it and the run starts (attract mode connects it itself after 6s). (2) Camera, pinned: one large workflow; scroll moves a single transformed camera layer node → flow → branch → pause. (3) Branch and pause: a condition toggle chooses the branch; at the ask-the-user node the runner stops, turns, and asks a real question; the answer changes the output. (4) Templates and store: each card unfolds into its mini canvas on hover/focus. (5) Publish: the canvas folds into one endpoint card with a typed request; a runs history fills with labelled sample rows. Remembered: the workflow stops and waits for you.

**Mini-Apps: «بگو، بازی کن».** Through-line: one app, born and then played. (1) Hero: pick one of three prompts; the app assembles in a device frame and is really playable (an original DOM micro-game or tool), with a «بتا» badge. (2) Versions, scroll scene (also draggable): v1 → v4, one feature per chat message. (3) Remix wall: directory tiles with CSS-only previews; «ریمیکس» peels a copy into "your" tray with a change applied. (4) Safety review: the inspector لومک walks the checklist, items tick, the app is stamped «تأیید شد». (5) Store by kind: games, learning tools, prototypes; only one playable mounted at a time. Remembered: playing something built in front of you ten seconds earlier.

## 4. Guardrails

**Budgets** (on top of `performance-and-verification.md`): the character sheet ≤ 4 KB gzip SVG + 3 KB CSS, shared by all product pages; each interactive scene is a lazy island ≤ 12 KB gzip, mounted on approach or idle, never on the critical path; at most 2 islands live at once, off-screen ones paused or unmounted; the H1 stays the LCP element, server-rendered with its first word in place; characters count toward the 3–4 loops per mobile viewport; no new dependencies (no Lottie, Rive, GSAP, canvas or WebGL).

**Cheap character animation:** CSS keyframes on three nested transforms, state in `data-*` attributes, a timeout scheduler (like the hero studio; no `requestAnimationFrame`), geometry measured once on resize, `will-change` only while walking.

**Reduced motion and no JS:** every scene rests on its finished frame with all steps as text; word slots show the first word plus a static list of the others; characters stand still or are hidden.

**Touch and keyboard:** every drag has a tap equivalent, every hover a focus and in-view equivalent; targets ≥ 44px; scenes use `touch-action: pan-y`; custom controls have roles and arrow keys; outcomes are announced in a polite live region.

**Proof** (beyond the gate): a filmstrip of each character sequence (enter, grab, carry, hand-off, exit) at 375 and 1440; before/after frames of each interaction driven by real input; the pinned screen on phone, laptop and tall monitor; a 12s idle and an input-driven layout-shift run; a 4× CPU trace with no long task from any scene; a reduced-motion walk. The fresh-eyes brief adds: "After ten seconds, can you say what the product does?"

## 5. Forbidden on product pages

A gimmick that explains nothing about the product; characters with mouths, speech bubbles, celebrations or confetti; a character taller than 56px or more than three on screen; characters on My Teacher or Smart Assistant; a scene that needs input before it shows anything; scroll-jacking or navigation without the visitor's confirmation; fake live chat presented as real; invented metrics; a product page built on a service skeleton or on another product's scenes; sound effects.
