# Product pages (owner reviews 11 and 12)

Luma has three kinds of page:
- **Service pages** (`/service/*`) show commodity tools every AI company has: image, edit, video, audio, chat.
- **Content pages** hold information: docs, help, blog, legal.
- **Product pages** (`/product/*`, header menu «محصولات») show Luma's own crafted products: Agents (ایجنت‌ها), My Teacher (معلم من), Smart Assistant (دستیار هوشمند), Workflows (ورک‌فلوها) and Mini-Apps (مینی‌اپ‌ها).

They are the flagship. The owner judges them from the visitor's seat: is it professional, detailed, memorable? Would someone remember it tomorrow?

> A service page shows a tool in a window. A product page stages **how the product works inside**, in a form only that product could have, and the visitor's hand changes the ending.

Review 12 rejected the first build of all five pages as "AI slop". The pages were the same object five times over: a pill eyebrow, a centred H2, a dark rounded box with small redrawn dashboard parts inside. Nothing was bigger than a card. The characters were crude grey capsules and the icons were off-family. Creative direction is drafted with an adviser model (owner choice: Claude Fable 5.2, effort xhigh) before planning. Brief it with the owner's review in full. The builder still owns the plan, the self-score (aim for 9 on creativity) and the proof gate.

## 1. Principles (each with its test)

| # | Principle | Test |
|---|---|---|
| 1 | **Meaning first.** Write the sentence the visitor should be able to say, then design the scene. | Cover the heading: can a stranger state the claim from the picture alone? |
| 2 | **Stage the mechanism, not the screen.** Do not redraw dashboard panels. Show how the product works inside (retrieval, delegation, certainty, branching), drawn in a way only this product could be. | If the scene could be traced from a dashboard screenshot, it fails ("stop copying the dashboard; think in the user's shoes"). |
| 3 | **One nameable image per page.** | The owner can name it the next day in three words. |
| 4 | **Each page has its own spatial model and layout signature.** At most one «eyebrow + centred H2 + boxed stage» per page. | Greyscale two pages' section silhouettes: can you tell which is which? |
| 5 | **Every motion is a verb of the product:** summon, check, remember, find, branch, build. | If the only verb is floats, glows or pulses, cut it. |
| 6 | **Three reading distances.** A silhouette at three metres, content at arm's length, small true details up close: file names, «روند کار · ۶ قدم · ۵۳ لوم», dates. | Crop any 300×300 px of a stage: is something designed in it? |
| 7 | **Characters are large and in the product's own style, or absent.** | At least 120px on desktop and 88px on a phone, recognisable as the dashboard's own avatars in silhouette. |
| 8 | **The visitor's hand changes the ending.** The page ends on its own object in the state the visitor left it. | Two visitors who chose differently see different final frames. |
| 9 | **Lead with use-cases, not feature lists.** Capabilities are reached through a job the visitor picks (a preset lights only the switches that job needs). | Does any section read like a spec sheet? |
| 10 | **Everything staged is true.** Real node names, field names, plan figures and copy, word for word. Samples are labelled «نمونه». Maths is checked. No competitor names. Claims missing from the fact files are not made. | Every string traces to the dashboard, the knowledge files or a labelled sample. |

Still binding from review 11:
- Attract then hand over: self-play until touched, resume about 8–15 seconds after the last input, pause off-screen.
- At most two loud scenes per page: the hero and one pinned scene.
- Standard scroll entrances on every section (`data-reveal`), including inside client components.
- Tokens, fonts, neutral chrome and gradient discipline.
- Transform and opacity motion only, with zero layout shift.
- The proof gate.

## 2. Shared pieces

- **Product icons:** the five are drawn in the ServiceIcon family.
  - The spec: 24 viewBox, 1.5 stroke, round caps, a `data-piece` that plays the product's verb on hover or focus. The rest state is the complete drawing.
  - They live in `ServiceIcon` as `product-agents|teacher|assistant|workflows|mini-apps` and are used by the header menu, the home line-up and the ending dock.
  - Never use characters or emoji as menu icons.
- **The ending, «پردهٔ آخر»** (`ProductEnding`), replaces the generic CTA box (title, text, two buttons and a next-product card). It has:
  - the page's own object in its final state (face-maker, the lit brain, the shelf with empty slots, a blank canvas, the prompt box again);
  - one sentence;
  - one button carrying the product's real first action;
  - «تعرفه‌ها» as a quiet link;
  - the five-product dock, where the current product is the pill and the next one loops its icon piece.
- **No beta flags.** «آزمایشی» was removed everywhere on owner instruction.
- **No emoji as icons**, even where the dashboard uses them. Use line icons, or a tiny live preview that is itself the icon.

## 3. The five pages as built (review 12)

| Page | Spatial model | Remembered image | Hero | Pinned scene | Ending object |
|---|---|---|---|---|---|
| Agents «اتاق کار» | a room (live 3D) | a chat message leaves the chat and becomes a task card in a robot's hands; the lead summons helpers and checks their work | messenger panel beside the 3D room; four real suggestions; the file comes back with «روند کار» | sub-agents: hand over → split → summon a helper and a temporary agent → check (one sent back) → deliver | face-maker |
| Teacher «مغزِ تو» | a brain | a brain that lights up by how sure you were | the three real doors map the lesson onto the brain | (the brain rides in a sticky rail beside three chapters) | the brain as lit |
| Assistant «برشِ یک پاسخ» | a cross-section | one sentence lights in a file and travels into the answer | widget with a fan of the business's files | descent through «سایت شما / دانش / رفتار» | a shelf with empty slots |
| Workflows «تخته‌رسم» | a drafting board | catalogue tiles march along the grid into a machine | a symmetric diamond; two inputs take two lanes | the 24-node table; five tiles travel on right angles into a row | the blank canvas |
| Mini-Apps «بگو، ساخته می‌شود» | a workbench | the prompt's words fly out and become the app's parts | prompt → device grows → passes (اسکلت · چیدمان · ظاهر · کارکرد) → a working app | a filmstrip of versions | the prompt box again |

**Teacher's three owner ideas must always show:**
1. Learning is personal: weak parts rise, strong ones fold.
2. No scores: answer, then «چقدر مطمئنی؟». Right and sure = solid, right and guessed = half, wrong and sure = review first.
3. Interactive components instead of walls of text.

**Smart Assistant is RAG:** a person asks, it searches the files, finds the passage, and answers by its instructions. Knowledge says *what*; behaviour says *how*.

## 4. Characters: 3D agents (Agents page only)

- **Stack:** plain `three`, one imperative world class in a lazy client island (`components/product-v2/agents/world/`). No r3f and no model files.
- **Bodies:** one superquadric reshaped per kind: orange squircle (the lead), blue diamond (a helper), purple sphere with a sparkle (the temporary agent).
  - Shading: a runtime-painted `MeshMatcapMaterial`. Convert `THREE.Color` to sRGB before painting a canvas; a linear-space colour paints the bodies too dark.
  - Details: white eyes with pupils that follow, an antenna with a yellow ball on a spring, mitts only while carrying, and a blob shadow.
- **Moves:** hop-glide (320ms per hop with squash and stretch), carry overhead (the face stays visible), hand-over arc, summon ring arriving at .6 → 1.08 → 1, check-lean with a pupil sweep, then a nod or a head tilt.
- **Performance:**
  - Import `three` only when the stage is within one screen; dispose it far away.
  - Run the loop only on screen and with the tab visible; idle at 30fps.
  - Cap DPR at 2 (1.5 on phones), dropping to 1 on slow frames.
  - An SVG poster of the same avatars sits under the canvas; with no WebGL or a lost context, the poster stays.
  - Reduced motion renders still frames.
- **Elsewhere:** no WebGL on the other product pages. Characters there are absent (Workflows uses a light pulse; Teacher uses the brain) or 2D avatars of the same set.

## 5. Implementation lessons

- **Writing modes:** with `writing-mode: vertical-rl`, `inline-size` and `block-size` swap axes. Size vertical spines with physical `width` and `height`.
- **`translate` and `transform` in one element's transition** did not reset reliably. Put the X leg on a wrapper and the Y leg on the element for L-shaped (orthogonal) travel.
- **Geometry module names:** never pair `brain.ts` with `Brain.tsx`. Windows is case-insensitive and TypeScript refuses it.
- **Layout shift:**
  - Reorder lists by transform (absolute rows at `translateY(order × row)`), never by DOM order.
  - Stack alternative messages in one grid cell and toggle visibility.
  - Move travelling chips by transform with `cqh` offsets, not `top`.
- **Dead space beside a tall stage:** stretch the side column (rows `1fr`, `align-content: space-between`, or a panel that fills the row).
- **HomeMotion under dev StrictMode:** re-observe elements already staged `data-revealed="false"`. The late-hydrating footer allows attribute differences (`suppressHydrationWarning`).

## 6. Guardrails

**Budgets** (on top of `performance-and-verification.md`):
- `three` loads only on `/product/agents`, never on the critical path; scene code ≤ 20 KB gzip, ≤ 24 draw calls, no shadow maps.
- Other islands ≤ 15 KB gzip, with at most 2 live.
- The H1 is the LCP element.
- Stages reserve their box.
- At most 4 loops per phone viewport, all paused off-screen.

**Reduced motion and no JS:** every scene rests on its finished frame with its steps as text.

**Touch and keyboard:** every hover has a focus and in-view equivalent; custom controls have roles; outcomes are announced in polite live regions.

**Proof:** the gate, plus frames of each interaction at 375 and 1440 px, the pinned scene on phone, laptop and tall monitor, and a fresh-eyes read that asks "After ten seconds, can you say what the product does, and what will you remember?"

## 7. Forbidden on product pages

- A redrawn dashboard screen as the main idea.
- The same section skeleton repeated across sections or pages.
- Small grey capsule mascots.
- Emoji icons.
- «آزمایشی».
- A generic CTA box.
- A capability list without use-cases.
- A gimmick that explains nothing about the product.
- Characters with mouths, speech bubbles, confetti or celebrations.
- A scene that needs input before it shows anything.
- Scroll-jacking.
- Fake live chat presented as real.
- Invented metrics.
- Sound.
