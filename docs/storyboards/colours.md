# Colour tubes (id: `colours`)

- **World:** Meadow (the app's "Colours!" tile, red).
- **Learning goal:** sort things by colour: drag each item into the container of the same colour (red, blue, yellow, green).
- **Levels:** 3 (chosen by the parent; 6 rounds each). L1 bouncy toys into glass tubes, L2 fruit into wicker baskets, L3 craft things into toy buckets.
- Source: `app/src/lessons/colours.js` (+ `colours-items.js`, `view-tools.js`), engine `app/src/engine/lesson.js`.
- Updated for the fix pass (AUDIT-meadow C1–C10, QA colours 1–23).

## How to read the tags

- `[voiced]` = the line has a recorded clip.
- `[to record]` = the line is new and listed in `tools/voice/new-lines.txt`. Until it is recorded it is **silent (caption only)**: `speech.js` has no system-voice fallback.
- `[caption only]` = shown as text on purpose, never spoken (praise).
- A voiced line repeated within 30 s shows as a caption only. The stuck re-prompt at 8 s is spoken again (`repeat`).

## Behaviour shared by every round

- **Camera:** fixed. L1 and L3: (0, 3.2, 12.6) looking at (0, 1.9, 0). L2 (short baskets): closer and lower, (0, 2.6, 10.3) looking at (0, 1.0, 0); all four baskets, the item and the friend fit at 1280x800. There's a cream mat under the play area. No trees or flowers sit near the containers, and nothing (snowman, pumpkins, mushrooms) at |x| > 8.5 in the foreground. Pip stands at the far left (L2 at -7.35, clear of the frame edge and the red basket) and only turns, nods or claps.
- **Containers** have faces and a soft contact shadow. Their pupils follow the item. While she carries the item, every container's mouth opens a little as it comes near (`onNear`), wide over the right one, and the container leans slightly toward it. A closed mouth is hidden, so there's no hairline over the smile. Tapping a container makes it giggle and the pile inside jumps.
- **Layout for the next round** starts at her right drop (`prepNext`): a new colour's container pops up at the right end once the others have slid apart, L3's buckets shuffle, or the next round's friend walks in to its spot. The round itself moves on as soon as the item is lifted over the mouth (it is swallowed while the next item arrives). While containers move, drops on them are off (the item floats home), and the prompt waits until the layout is done.
- **Item arrival (0.9–1.5 s):** roll in, fall from the sky with physics, drop from the tree, bounce in (three hops), whirl up, drive in, or thrown by the waiting friend. The item cannot be grabbed and no Go! shows until it has landed (`busy` during `enter`).
- **The demo (round 1, and again when she is stuck for 8 s):** the ghost hand presses under the item and carries it, and the real item rides along: it lifts, floats to above the right container (whose mouth opens), hovers and floats back. A touch anywhere ends the demo and the item floats home, unless she picked it up.
- **Right container:** the item lifts over the mouth (mouth wide) and there's a held breath (`beat`, 0.35 s). Then it falls in with real physics onto the pile with one soft note, the level's rising `sfx.step`. One reaction: a swallow, with a bulge travelling down the wall and a gentle squash, while the face stays unsquashed. A watching friend hops once. Pip nods or claps. Caption `{Colour}!` `[caption only]`. Then about 0.5 s of stillness and the next round is laid out.
- **Wrong container:** that container closes its mouth and shakes "no no" with one soft "nope". The redirect line plays and the item bounces back to its spot (about 1 s). After the 2nd wrong drop in a round, the other containers close their eyes and stop accepting (errorless).
- **Dropped in empty space:** the item floats home (no sound). A plain tap on it makes it do a little silent jump.
- **Stuck ladder (no touch):** 5 s, the prompt again plus a hop. 8 s, the prompt spoken again, a glow, and the demo again. 20 s, errorless. 90 s, home.

## Opening (all levels)

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 0 | Pip waves; the level's containers stand on the mat (L1 two tubes, L2 three baskets, L3 four buckets). | "Let's sort colours!" `[voiced]` | none | none | n/a | n/a | Round 1 starts 0.75 s later. |

## Level 1: bouncy toys into glass tubes (start: red, blue)

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | A red ball rolls in from the right (1.0 s). | "Red! Put it in the red one!" `[to record]` | Drag the ball into the red tube. | Demo: hand and ball ride to the red tube and back; Go! | Swallow, the step note. "Red!" `[caption only]`. | Blue: "That's blue. Find red!" `[voiced]`. | Bunny walks in to the front right (3.1, z 5.2, scale 0.55, standing on the mat; below every tube in the picture). |
| 2 | A blue beach ball falls from the sky and bounces (0.9 s). | "Blue! Put it in the blue one!" `[to record]` | Drag it to the blue tube. | Go!; it hops at 5 s, glows at 8 s. | Swallow. "Blue!" | Red: "That's red. Find blue!" `[to record]`. | Round 3. |
| 3 | The waiting bunny leans back and throws a red smiley ball onto the grass (about 1.5 s). | "Red! Put it in the red one!" | Drag the smiley into the red tube. | Go! once it has landed. | Swallow; the bunny hops once. | Blue: "That's blue. Find red!" `[voiced]`. | The bunny walks off; the yellow tube pops up at the right end after the others slide apart. |
| 4 | A yellow pompom bounces in from the left in three hops (1.4 s). | "Yellow! Put it in the yellow one!" `[to record]` | Drag it to the yellow tube (new, right end). | Go! | Swallow. | Red / blue: "That's red. Find yellow!" / "That's blue. Find yellow!" `[to record]`. | Froggy walks in. |
| 5 | Froggy throws a blue dotty ball. | "Blue! Put it in the blue one!" | Drag it to the blue tube. | Go! | Swallow; Froggy hops. | Red / yellow: "That's {x}. Find blue!" `[to record]`. | Froggy walks off. |
| 6 | A yellow star whirls up out of the ground (0.9 s). | "Yellow! Put it in the yellow one!" | Drag it to the yellow tube. | Go! | Swallow. | Red / blue: "That's {x}. Find yellow!". | Finale. |

## Level 2: fruit into wicker baskets (start: red, blue, yellow)

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | A red apple drops from the tree (rustle) and bounces (1.4 s). | "Red! Put it in the red one!" | Drag the apple to the red basket. | Demo with the apple riding along; Go! | Swallow, step note. | Blue: "That's blue. Find red!" `[voiced]`; yellow: "That's yellow. Find red!" `[to record]`. | Round 2. |
| 2 | A blueberry rolls in (1.0 s). | "Blue! Put it in the blue one!" | Drag it to the blue basket. | Go! | Swallow. | "That's {x}. Find blue!". | Hedgehog walks in (front right, 2.4, z 4.6, scale 0.5). |
| 3 | Hedgehog throws a banana. | "Yellow! Put it in the yellow one!" | Drag it to the yellow basket. | Go! | Swallow; Hedgehog hops. | "That's {x}. Find yellow!". | Hedgehog walks off; the green basket pops up at the right end. |
| 4 | A pear drops from the tree (1.4 s). | "Green! Put it in the green one!" `[to record]` | Drag it to the green basket. | Go! | Swallow. | Red: "That's red. Find green!" `[voiced]`; others `[to record]`. | Round 5. |
| 5 | A blueberry bounces in from the left (1.4 s). It used to be a plum, which is purple, not blue. | "Blue! Put it in the blue one!" | Drag it to the blue basket. | Go! | Swallow. | "That's {x}. Find blue!". | Elephant walks in. |
| 6 | Elephant throws grapes. | "Green! Put it in the green one!" | Drag them to the green basket. | Go! | Swallow; Elephant hops. | "That's {x}. Find green!". | Finale. |

## Level 3: craft things into toy buckets (start: red, blue, yellow, green)

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | A green block falls from the sky (0.9 s). | "Green! Put it in the green one!" | Drag it to the green bucket. | Demo with the block riding along; Go! | Swallow, step note. | "That's {x}. Find green!". | Round 2. |
| 2 | A red crayon rolls in (1.0 s). | "Red! Put it in the red one!" | Drag it to the red bucket. | Go! | Swallow. | "That's {x}. Find red!". | Kitty walks in. |
| 3 | Kitty throws a yellow paint pot. | "Yellow! Put it in the yellow one!" | Drag it to the yellow bucket. | Go! | Swallow; Kitty hops. | "That's {x}. Find yellow!". | Kitty walks off. |
| 4 | A blue toy car drives in from the left (1.3 s). | "Blue! Put it in the blue one!" | Drag it to the blue bucket. | Go! | Swallow. | "That's {x}. Find blue!". | The shuffle: every bucket steps one place right and the right-most walks round the BACK to the left end (1.1 s). No two buckets pass through each other. |
| 5 | A green brush whirls up (0.9 s). The green bucket has moved. The cue is spoken only now, after the shuffle. | "Green! Put it in the green one!" | Drag it to the green bucket. | Go! | Swallow. | "That's {x}. Find green!". | Piggy walks in. |
| 6 | Piggy throws a red button. | "Red! Put it in the red one!" | Drag it to the red bucket. | Go! | Swallow; Piggy hops. | "That's {x}. Find red!". | Finale. |

## Ending (all levels)

- The friend walks off. The camera glides a little higher (`creationView`, fitted to the 4:3 photo) so the piles show over the rims and every container is in the picture.
- About 0.9 s in, the fullest container giggles and its pile jumps: "Look! So much {colour}!" (red, blue and green `[voiced]`, yellow `[to record]`).
- Admire, at least 4 s: "Look what you made!" `[to record]`. Each container is pokeable (`creationObjects`): it giggles and its pile jumps.
- Photo (shutter, frame to the home button, saved to the gallery), then "You did it! A sticker!" `[voiced]`, the sticker, and Home.

## Timings (measured, autoplay, round start → input open)

- L1: 1.02, 1.24, 1.47, 1.46, 1.47 s (real pointer run at 1366x768). L2: 1.52, 1.03, 1.47, 1.52, 1.46, 1.45 s. L3: 1.22, 1.03, 1.48, 1.31, 0.92, 1.50 s.
- After a right drop: about 1.3 s for the swallow and landing, 0.5 s still, then about 0.5–1.6 s of next-round layout (friend walking in or a new container), which she can watch. She can tickle the containers meanwhile.

## Every narrator line

- Intro: "Let's sort colours!" `[voiced]`.
- Prompts: "{Colour}! Put it in the {colour} one!" ×4 `[to record]`.
- Redirects: "That's {x}. Find {y}!" for all 12 pairs. "That's blue. Find red!" and "That's red. Find green!" are `[voiced]`; the other 10 are `[to record]`.
- Captions: "Red!", "Blue!", "Yellow!", "Green!" `[caption only]`.
- Ending: "Look! So much {colour}!", "Look what you made!", "You did it! A sticker!".

## Timing after the release review (rule: her last action → the next thing she can answer ≤ 2 s)

- Her right drop → the next item she can drag (measured, autoplay, all levels): L1 1.42–1.96 s, L2 1.30–1.96 s, L3 1.32–1.98 s.
