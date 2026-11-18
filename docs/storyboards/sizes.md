# Big and small (id: `sizes`)

- **World:** Meadow.
- **Learning goal:** compare sizes. Find the BIG one or the small one among two (later three) of the same thing. With three it is always odd-one-out by size: two small and one big, or two big and one small.
- **Levels:** 3 (6 rounds each). L1 meadow animals, L2 a toy room, L3 the snowy garden.
- Source: `app/src/lessons/sizes.js` (+ `sizes-things.js`), engine `keepsake.js`.
- Updated for the fix pass (AUDIT-meadow Z1–Z7, QA sizes 1–30).
- Tags: `[voiced]` has a clip; `[to record]` is in `tools/voice/new-lines.txt` and silent until recorded; `[caption only]` is never spoken.

## Behaviour shared by every round

- **Camera:** (0, 3.2, 12.4) looking at (0, 2.4, 0). Pip is at the back left (-8.3, 0, -4.6), with no stage bush in front of him. The things stand on one ground line at x -3.0 and 3.5 (two), or -3.2, 0.8 and 4.8 (three). The **line-up rug** (`makeTray`, rug style, six spots, items at 0.4 scale) lies at the **front** (0.4, 0, 4.0); from the camera it sits below the choices' feet, so a kept thing never peeks out behind a choice. L2: one soft rounded play rug and the toy box inside the frame. L3: a wood-coloured fence behind Pip and the rug (z -6.3).
- **Arrival, two calm styles per level (about 0.8–1.5 s), with taps open from the start (a tap on a peekaboo bush counts as the thing behind it; a tap during the L3 swap hurries it to its end):** L1 walk in or peekaboo. L2 pop in or peekaboo. L3 grow or peekaboo. Peekaboo bushes are small, and the scenery bushes step aside meanwhile. Three small props (apples, acorns, balls…) sit on the grass **behind** the line. Nothing drops from the sky, and nothing rains.
- **Prompt:** "Find the BIG {thing}!" (deep voice) or "Find the small {thing}!" (high voice) `[voiced]`.
- **Wrong one:** it makes its own sound (low and deep for big, high for small) and hops. "That one is small. Find the BIG one!" / "That one is big. Find the small one!" `[to record]`. After 2 wrong taps the others stop answering (errorless).
- **Right one:** a held breath (`beat`, 0.4 s). Then **one** payoff: the big one does one stomp (one thud, the props behind jump a little, the others sway), or the small one does one hop with its squeak. Caption "BIG {thing}!" / "Small {thing}!" `[caption only]`. No camera shake, no dust, no BOOM, no scared faces, nothing toppled or burst.
- **Play (0.45 s, pokes live until they leave):** pressing the big one gives a slow heavy stomp with a low thud; pressing the small one gives a quick light bounce and a squeak.
- **Line-up (not awaited: the next round starts as it goes):** the others settle away on the spot (so they never cross the next things walking in). The one she found walks (animals, with their gait) or arcs (things) to the rug. If it is bigger than some already there, it steps out behind the line and walks along to its place while the ones it passes shuffle one spot right. Nobody passes through anybody, and the line stays biggest to smallest. The others walk off (animals) or settle away (things). Poking a thing in the line plays its own big or small sound.
- **Stuck ladder:** 5 s, the prompt plus the right one hops. 8 s, spoken again, a glow, and the hand demo. L3 uses a scan. 20 s, errorless. 90 s, home.

## Level 1: meadow animals

| # | Things | Ask | Sizes | Arrival |
|---|---|---|---|---|
| 1 | elephant | BIG | 1.5, 0.6 | walk |
| 2 | bunny | small | 1.5, 0.6 | peekaboo |
| 3 | bear | BIG | 1.5, 0.6 | walk |
| 4 | hedgehog | BIG | 1.4, 0.85 | peekaboo |
| 5 | frog | small | 1.4, 0.7 (no swap) | walk |
| 6 | kitty | BIG | 1.45, 0.65, 0.55 | peekaboo |

## Level 2: toy room

| # | Things | Ask | Sizes | Arrival |
|---|---|---|---|---|
| 1 | ball 🔵 | small | 1.4, 0.7 | pop |
| 2 | tower | BIG | 1.35, 0.85 | peekaboo |
| 3 | present | small | 1.3, 0.8 | pop |
| 4 | duck | BIG | 1.5, 0.9 (no swap) | peekaboo |
| 5 | drum | small | 1.35, 1.2, 0.5 | pop |
| 6 | beach ball 🏖️ | BIG | 1.45, 0.65, 0.55 | peekaboo |

## Level 3: snowy garden

| # | Things | Ask | Sizes | Arrival |
|---|---|---|---|---|
| 1 | tree | small | 1.3, 0.85 | grow |
| 2 | pumpkin | BIG | 1.4, 0.65, 0.55 | peekaboo |
| 3 | mushroom | small | 1.4, 1.25, 0.55 | grow |
| 4 | melon | BIG | 1.35, 0.65, 0.55, then a magic swap (the only one; taps are open during it and count the swapped sizes) | peekaboo |
| 5 | flower | small | 1.4, 1.25, 0.6 | grow |
| 6 | carrot | small | 1.5, 1.3, 0.6 (only the carrot hops; its soil mound stays) | grow |

## Ending (all levels)

- The falling-leaf weather is hidden. The camera glides to the rug line (`tray.view(0.8)`, a slightly lower look). Starting 1.2 s in, the line hops from biggest to smallest, each with its own sound.
- Admire, about 5 s: "Look what you made!" `[to record]`. Each thing in the line is pokeable.
- Photo, "You did it! A sticker!" `[voiced]`, the sticker, Home.

## Timings (measured, autoplay, round start → input open)

- L1: 1.45, 1.27, 1.45, 1.27, 1.45, 1.27 s. L2: 0.80, 1.28, 0.80, 1.28, 0.96, 1.29 s. L3: 1.08, 1.28, 1.25, 1.28 s (the swap round: taps open as the swap starts), 1.23, 1.21 s.
- After the right tap: 0.4 s beat, about 0.7 s payoff, 0.5 s still, 3 s of play, then about 1–2 s for the line-up.

## Every narrator line

- Intro "Let's find big and small!" `[voiced]`. Prompts `[voiced]`.
- Redirects `[to record]`: "That one is small. Find the BIG one!", "That one is big. Find the small one!".
- Captions `[caption only]`: "BIG {thing}!" / "Small {thing}!".
- Ending: "Look what you made!", "You did it! A sticker!".
- Not used any more: the visitor friends (they stood in front of Pip and walked in during the question). The props raining down, the drops from plants, the camera shake and dust puffs are gone too.

## Timing after the release review (rule: her last action → the next thing she can answer ≤ 2 s)

- Her right tap → the next things can be tapped (measured, autoplay): L1 1.21–1.66 s, L2 1.18–2.06 s, L3 1.21–2.35 s (the 2.35 s is the swap round, tapped while the swap was still playing).
