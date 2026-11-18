# 🎢 Roll & push (`roll`): design

World: 🏗️ Building site (`build`). Files to create: `app/src/lessons/roll.js`, `roll-courses.js` (the 34 puzzle specs as data), `roll-pieces.js` (piece factories and their physics), `roll-sound.js`, `tools/blender/creatures/prop_roll.py`.

---

## 1. The pitch

**A baby hedgehog curls into a ball and rolls home to Mummy along a wooden toy track. The track has a block, a hole, a step or a door in the way; the child taps, pushes or presses one chunky piece, and real physics does the rest.**
**34 tiny puzzles, one new idea at a time, and every baby she brings home stays snuggled in the nest, so the level ends with a nest full of hoglets she rolled there herself.**

| Reference | What we take | What we leave |
|---|---|---|
| **Thinkrolls** (Avokiddo) | A round friend who rolls; obstacles as physical objects with one obvious property each; each new piece is taught by a puzzle that contains only that piece; later puzzles combine pieces; no fail state. | Dragging the character, timing, multi-floor mazes, gimmick pieces (fire, ice, jelly). Too hard and too busy for 2. |
| **Busy Shapes** (Edoki) | Nothing is explained in words that the scene does not already show; the next puzzle forms out of the last one without a menu; difficulty creeps up in steps so small the child never notices. | Adaptive difficulty engine (our fixed order plus the hint ladder is enough). |
| **Pok Pok** (marble run, busy board) | Wooden-toy look, chunky pieces, one soft material sound per action, long quiet moments of just watching a ball roll. | Pure free play (we keep a goal: home). |
| **Sago Mini** | The warm payoff is a character: Mummy nuzzles the baby. Faces carry the feedback. | Random gags. |
| **Toca Boca** | No failing, anything you touch responds, your result stays. | Open-ended mess. |

The house rule that makes it ours: **colour tells you the verb.** Yellow things are tapped. Blue things are pushed. Round dome buttons are pressed. A 2-year-old learns three rules and can then read every puzzle in the game.

---

## 2. Learning goals

| Topic (os-taxonomy id) | How the game teaches it |
|---|---|
| **Pushes & pulls** `mt_B3W5EfimJw` | The child pushes a box, a ramp and a cart with her finger and sees them move, stop against things, and push each other. |
| **Gravity & falling objects** `mt_AvrQauS_zX` | Take away the support and the thing falls: a box over a hole drops in, a bridge plank falls flat, a ball rolls downhill, a cart rolls down a slope on its own. |
| **Actions and their consequences** `mt_UHQfb-n-w3` | Every puzzle is one cause and one visible effect; Level 3 chains two (press the button, the door opens, the cart rolls out, the hole is filled). |
| **Hands-on problem solving** `mt_20WfHhnL39` | "Something is in the way. What can I use?" The hoglet stops and looks at the problem; the child finds the piece that fixes it. |
| **Predicting what happens next** `mt_8-POYyg7GJ` | A held beat before every release lets her guess; the same pieces always behave the same way. |
| **Positional language** `mt_qeZYF6HZ4o` | Short spoken words on the real event: down, up, over, under, in. |
| **Planning a task** `mt_QR3vxbN1o4` (Level 3 only) | Two-step puzzles where one thing must come first (open the door, then push the box). |
| **One-to-one counting** `mt_WcfaSfVT33` (combined concept) | Mummy counts each baby into the nest: "One!" up to "Twelve!". |

`meta.js` entry: `id: 'roll', world: 'build', title: 'Roll & push', name: 'Roll home!', icon: '🎢', color: '#ffb020', intro: "Let's roll home!"`, topics = the first six rows above plus counting; `goal: 'Helps a baby hedgehog roll home by tapping blocks out of the way, pushing boxes into holes and ramps up to steps, and pressing buttons that open doors and move lifts; later works out which thing to do first.'`

---

## 3. The core loop, moment by moment

### 3.1 The stage (the same in every puzzle)

Side-on view. Everything that rolls moves in the plane z = 0, left to right.

- **The table**: a row of 10 wooden **columns** (index c1..c10, centres at x = −4.5 … +4.5, each 1.0 wide, 1.4 deep). A column's height is a whole number of **steps** (1 step = 0.4). Columns rise out of, and sink into, a fixed plinth. The track is the tops of the columns: a shallow groove with two low rails.
- **Slope caps**: a column written `5\` has a wedge top that goes from height 5 at its left edge to height 4 at its right edge (21.8°).
- **The log** (start): a hollow log lying on column c0 (x = −5.5), which always matches the height of c1. Hoglets roll out of its dark mouth.
- **The chute and nest** (home): c10 is always a slope cap `2\` that runs onto a short chute and into the nest at x = 5.2 … 8.6. The nest is an open leaf-lined bed, two tiers, with one cushion per puzzle (10 or 12). **Mummy hedgehog** stands behind the nest (z = −1.7). **Pip** sits on a stump behind the log (x = −6.2, z = −2.2).
- **The hoglet**: a ball of radius 0.42. A ring of quills spins as it rolls; its face stays upright in the middle (section 8.2). Each hoglet wears one small thing on its head (leaf, berry, flower…) so all of them look different in the nest.

### 3.2 A round, step by step

| # | Moment | What the child does | Feedback: visual and animation | Sound | Voice / caption |
|---|---|---|---|---|---|
| 1 | **The table re-forms** (0.9 s, skipped on puzzle 1 where it rises from flat) | watches | Columns glide to their new heights, left to right, 40 ms apart, eased; pieces ride up on them from inside the plinth. Camera glides to the log. | One soft wooden run (`rollSound.reform`, 5 quiet toks, falling). | none |
| 2 | **A hoglet appears** | watches (may poke it) | Two eyes blink in the log mouth (0.4 s), then the hoglet rolls out at 1.3 units/s and keeps rolling until the first thing in its way. Quill ring spins, face upright and `happy`. | Quiet wooden roll, volume tied to speed. | none |
| 3 | **It stops and looks** | watches | It brakes over the last 0.6 units and stops 0.15 clear of the obstacle (never touching, never overlapping it). Face: a short `scared` "oh!" (0.5 s) for a hole or big drop, otherwise `calm`; pupils turn to the piece that will help, then to the child, then back, every 4 s. | none | The "uh-oh" caption for that obstacle (spoken the first time in a level, caption-only after). |
| 4 | **Show how** (only the first time a verb or piece appears, and again if stuck 8 s) | watches | `fx.ghostPath` on the real piece: a slow tap, or a slow drag along the track to where it goes. The piece glows softly and bobs 3 cm. Then the "Go!" badge. | none | The instruction line, spoken once. |
| 5a | **Tap a yellow block** | tap | Presses in under the finger (engine press), `beat()` 0.3 s, then sinks into its column over 0.5 s until its top is flush with the track (or, for an up-block in a hole, rises until flush). It stays there. | `sfx.step(i, n)` with the wood timbre: the level's rising tune. | none |
| 5b | **Push a blue box / ramp / cart** | drag sideways | The piece follows the finger along the track only, at up to 2.5 units/s, with weight (it lags slightly, leans 4° into the push). Real contact: it stops against a step, pushes another piece ahead of it, and when a box is fully over a hole it drops in under the finger. Chevrons on its face point the way it can go. | A low wooden slide while it moves; one "thock" from the physics landing. `sfx.step` on the landing or lock. | Narration caption only ("In it goes!"). |
| 5c | **Press a button** | tap | Dome sinks 4 cm and stays down, its cable lights up along the plinth to the door, `beat()` 0.35 s, the door slides up into its frame over 0.7 s and stays. A lift glides 1.2 s. | One click, then a soft wooden slide. `sfx.step`. | none |
| 6 | **The path is clear** | watches | The hoglet's face goes `happy`, it leans and rolls on. Real physics: speeds up a little on slopes (capped at 2.2), drops off 1-step ledges with a small squash, climbs a ramp, tips a see-saw. The camera follows. | Roll sound; tiny "tok" on each ledge. | A position word once per puzzle at most ("Down!", "Up the ramp!"), caption-only after its first voicing in the level. |
| 7 | **Home** | watches | Camera glides to the nest. Down the chute, a `beat()` at the lip (0.4 s), it plops onto the landing pad, uncurls its face to `joy`, shuffles to its own cushion (0.6 s) and settles. Mummy leans in and nuzzles it once, `joy` face 1 s. Pip does `pipWatch`. | One soft "pup" on landing. | Mummy counts: "One!" (spoken; the number of babies now home). |
| 8 | **Stillness** | looks | 1 s where only breathing moves. | none | none |

Then the table re-forms for the next puzzle (step 1). `success()` is called at step 7 with `payoffP` = the promise that resolves when the hoglet is settled on its cushion.

### 3.3 Things that are not the answer

There is no wrong answer and no `redirect()` in normal play. Every touch gets a true, quiet response:

- **Poke the hoglet**: it blinks, wiggles and looks at the helpful piece. No sound.
- **Poke Mummy / Pip / a hoglet in the nest**: their normal tap reaction; nest hoglets peek and play their note.
- **Push a blue piece the wrong way**: it moves until its rail stop, bumps softly and stays. Nothing is lost; it can always be pushed back.
- **Push a ramp toward an open hole**: it stops at the edge (rail stop), wobbles once; the hoglet looks at the box. Caption: "Fill the hole first!"
- **Press a lift button when the hoglet is not on it**: the lift moves anyway. The hoglet waits at the edge and looks at the button; pressing again brings it back.
- **Press the red button when the door is green (3-3)**: a little red hatch in the plinth opens and a snail waves. The hatch stays open. Caption: "Hello, snail! Try the green one!"
- **Mashing**: taps on empty space do nothing. The hint ladder is unchanged (6 s cue, 12 s glow and ghost hand, 20 s errorless, 45 s home). **Errorless step (20 s)**: the next piece does its job by itself at walking pace (the block sinks, the box slides to the hole, the button presses) with the ghost hand on it, so she sees how and the round still completes.
- **Tap fallback for pushes**: two taps on a blue piece without a drag replay the drag demo; a third tap slides it one column toward its goal.

---

## 4. Progression

### 4.1 Notation

Each puzzle lists 10 columns, c1 to c10, left to right.

- `4` flat top at height 4 steps. `4\` slope cap from 4 down to 3. `[2]` a hole: a column 2 steps lower than its neighbours (holes two columns wide are written twice; `[0]` is a deep gap).
- A flat `4` followed by a flat `3` is a **1-step ledge**: the hoglet rolls off it by itself (a little drop, "tok"). A step **up**, or a drop of 2 or more, stops it.
- c10 is always `2\` (the chute). The hoglet only ever stops on a flat column.

Pieces:

| Code | Piece | Verb | Behaviour |
|---|---|---|---|
| `Y↓` | yellow block (1.0 tall) | tap | sinks flush into its column |
| `Y↓↓` | tall yellow block (two stacked) | tap twice | each tap sinks it by one block |
| `Y↑` | yellow block sitting in a hole | tap | rises until flush: the hole is gone |
| `PLANK` | yellow plank standing upright at a gap's edge | tap | falls flat across the gap: a bridge |
| `BOX` | blue box (0.96 wide, 0.8 = 2 steps tall) | push | slides; dropped into a hole it fills it flush |
| `RAMP` | blue wedge (1.0 long, 1 step high) | push | stops against a step; the hoglet rolls up it |
| `CART` | blue box on four wheels | (rolls by itself) | rolls downhill when released; fills a hole like a box |
| `DOOR(colour)` | door in a frame, with a dome button of the same colour on the front face of the plinth under it, joined by a cable | press | door slides up and stays up |
| `LIFT(a↔b)` | purple column with a purple arrow button on the plinth under it | press | glides between heights a and b |
| `SEESAW` | plank on a pivot over three columns | (physics) | tips under weight |

### 4.2 Level 1: Tap (10 puzzles). Yellow blocks and one red button.

Look: morning light, pale birch columns, home nest with 10 cushions. Verbs: tap only.

| # | Name | Columns c1…c10 | Pieces | What happens / solution | New idea |
|---|---|---|---|---|---|
| 1-1 | First roll | `6 6 6\ 5\ 4\ 3\ 2 2 2 2\` | `Y↓` on c2 | Hoglet comes out and stops at once. **Tap the block.** It sinks; the hoglet rolls down the long four-column slide and home. Demo: tap. | Tap yellow; things roll down. |
| 1-2 | Roll, then stop | `5 5\ 4 4 4 4\ 3 3\ 2 2\` | `Y↓` on c5 | It rolls three columns first, then stops on c4. **Tap.** | The hoglet goes by itself until something is in the way. |
| 1-3 | Two blocks | `5 5 5\ 4 4 4\ 3 3 3\ 2\` | `Y↓` on c5 and c8 | **Tap** c5; it rolls and stops again; **tap** c8. | One after another. |
| 1-4 | Tall block | `4 4 4 4 3 3 3 2 2 2\` | `Y↓↓` on c3 | **Tap, tap.** Then two little ledges: tok, tok. | Tap again; ledges. |
| 1-5 | The door | `5 5\ 4 4 4 4 4\ 3\ 2 2\` | `DOOR(red)` on c5 | Stops on c4 at a shut door. **Press the red button** under it. Demo: tap the button. It rolls under the door. | A button works something else. |
| 1-6 | Door, then block | `5 5\ 4 4 4 4\ 3 3 3\ 2\` | `DOOR(red)` on c4, `Y↓` on c8 | **Press**, roll, **tap**. | Two different pieces. |
| 1-7 | The hole | `4 4 4 4 [2] 4 4\ 3\ 2 2\` | `Y↑` in c5 | Stops on c4, peers down. **Tap the yellow block in the hole**: it rises and fills it. Demo: tap. | Yellow can also come up; holes. |
| 1-8 | Hole and door | `5 5\ 4 4 [2] 4 4 4\ 3\ 2\` | `Y↑` in c5, `DOOR(red)` on c7 | **Tap**, roll over, **press**. | Mix. |
| 1-9 | Three in a row | `4 4 4 [2] 4 4 4 3 2 2\` | `Y↓` on c2, `Y↑` in c4, `DOOR(red)` on c6 | **Tap, tap, press**, in the order the hoglet meets them (any order works: all three can be done at once). Then two ledges. | Three steps. |
| 1-10 | The big slide | `6 6 6 6 6\ 5\ 4\ 3\ 2 2\` | `Y↓↓` on c2, `DOOR(red)` on c4 | **Tap, tap, press**, then the longest slide of the level. | Reward run. |

### 4.3 Level 2: Push (12 puzzles). Blue things, real weight.

Look: bright midday, honey-oak columns, nest with 12 cushions. New verb: push (drag). Tap pieces return in combinations.

| # | Name | Columns c1…c10 | Pieces | What happens / solution | New idea |
|---|---|---|---|---|---|
| 2-1 | Box in the hole | `4 4 4 4 [2] 4 4\ 3\ 2 2\` | `BOX` on c4 | Hoglet stops on c3 behind the box. **Push the box right** one column: it drops into c5, flush. Demo: drag. | Push; a box fills a hole. |
| 2-2 | Push the other way | `5 5\ 4 4 [2] 4 4 4\ 3\ 2\` | `BOX` on c7 | Stops on c4 at the hole. The box is on the far side. **Push it left** two columns. | Direction: either way. |
| 2-3 | The ramp | `3 3 3 3 3 4 4\ 3\ 2 2\` | `RAMP` on c3 | Stops on c2. A step up at c6 is too high. **Push the ramp right** until it bumps the step (c5). It rolls up, over, and down. Demo: drag. | Ramp; up. |
| 2-4 | Box, then block | `5 5\ 4 4 4 [2] 4 4\ 3\ 2\` | `BOX` on c4, `Y↓` on c7 | **Push** the box two columns into c6, **tap** the block. | Blue and yellow together. |
| 2-5 | Ramp, then door | `3 3 3 3 4 4 4 4\ 3\ 2\` | `RAMP` on c2, `DOOR(red)` on c7 | **Push** the ramp to c4, **press**. | Blue and button. |
| 2-6 | The deep hole | `5 5 5 [2] 4 4 4\ 3\ 2 2\` | `BOX` on c3 | Stops on c2. **Push** the box: it falls three steps with a real thock. The hoglet drops one step onto it and rolls on. | Things fall further. |
| 2-7 | The bridge | `4 4 4 4 [0] [0] 4 4\ 3\ 2\` | `PLANK` upright at the right edge of c4 | Stops on c3 at a wide gap. **Tap the yellow plank**: held breath, it falls flat across both columns. Demo: tap. "Over the bridge!" | Something falls and becomes a bridge. |
| 2-8 | The cart | `5 5 5 5\ 4 [2] 4 4\ 3\ 2\` | `CART` on the slope c4, held by `Y↓` on c5 | Stops on c3. **Tap the block**: the cart rolls down by itself and drops into c6. The child did not push it: wheels and a slope did. "Wheels roll!" | Gravity does the pushing. |
| 2-9 | Two holes | `4 4 4 [2] 4 4 [2] 4 3 2\` | `BOX` on c3, `BOX` on c8 | Stops on c2. **Push** the first box right into c4; rolls to c6; **push** the second box left into c7. | Two pushes, two directions. |
| 2-10 | Up and over | `2 2 2 3 3 3 4 4 3 2\` | `RAMP` on c2, `RAMP` on c5 | **Push** ramp 1 to c3; it rolls up and stops on c4; **push** ramp 2 to c6; up again; then two ledges down: tok, tok. | Two ramps; up then down. |
| 2-11 | The long push | `4 4 4 4 4 [2] 4 4 3 2\` | `BOX` on c3, `DOOR(red)` on c8 | **Push** the box three columns to c6 (a long, weighty slide), **press**. | Keep pushing. |
| 2-12 | All together | `3 3 3 [1] 3 3 4 4\ 3\ 2\` | `Y↓` on c2, `BOX` on c3, `RAMP` on c5 | **Tap**, **push** the box into c4, **push** the ramp to c6, then the slide. | Three verbs in one course. |

### 4.4 Level 3: Think (12 puzzles). What comes first?

Look: golden late afternoon, warm cherry columns, lanterns by the nest, 12 cushions. New pieces: lift, coloured doors, see-saw. New thinking: order, and one action with two effects.

| # | Name | Columns c1…c10 | Pieces | What happens / solution | New idea |
|---|---|---|---|---|---|
| 3-1 | The lift down | `6 6 6 L 3 3 3\ 2 2 2\` | `LIFT(6↔3)` on c4, up | It rolls onto the lift and stops in the middle. **Press the purple button**: the lift glides down, it rolls off. Demo: tap. (If she pressed early, the hoglet waits at the edge; press again.) | A lift; press when the friend is on. |
| 3-2 | The lift up | `3 3 3 L 6 6\ 5\ 4\ 3\ 2\` | `LIFT(3↔6)` on c4, down | Rolls on, **press**, rides up, then a four-column slide. | Up. |
| 3-3 | Which button? | `5 5\ 4 4 4 4 4 4\ 3\ 2\` | `DOOR(green)` on c6; a red button under c5 and a green button under c7, no cables | **Press green.** Red opens the snail hatch instead (harmless). | Match the colour. |
| 3-4 | Door first | `4 4 4 [2] 4 D 4 4 3 2\` | `DOOR(red)` on c6, `BOX` on c7 | Stops on c3 at the hole. The box is behind the door. **Press** (door opens), then **push the box left** under the door, two more columns, into c4. If she pushes first, the box bumps the door and stops. | Order: open, then push. |
| 3-5 | The see-saw | `5 5 S S S 4 4 4\ 3\ 2\` | `Y↓` on c2, `SEESAW` over c3–c5 | **Tap** the block. The hoglet rolls onto the see-saw; as it passes the middle the plank tips down under its weight and it rolls off. No second action: a physics treat. "The see-saw tips!" | Weight tips things. |
| 3-6 | Box on the see-saw | `5 5 S S S 4 [2] 4 3 2\` | `SEESAW` over c3–c5 with a `BOX` on its right end | The box holds the right end down, so the left end is too high. **Push the box right**: off the plank (the plank tips back with a clonk), across c6 and into the hole c7. One push fixes two things. | One action, two effects. |
| 3-7 | Door and cart | `5 5 5 5\ 4 [2] 4 4\ 3\ 2\` | `CART` on slope c4 held by `DOOR(red)` at the left edge of c5; `Y↓` on c7 | **Press**: the door rises, the cart rolls out, down and into c6. Then **tap** the block. | A chain: button, door, cart, hole. |
| 3-8 | Ramp pushes box | `3 3 3 3 [1] 3 4 4\ 3\ 2\` | `RAMP` on c2, `BOX` on c4 | Either **push the box** into c5 then **push the ramp** to c6, or just **push the ramp**: it pushes the box ahead of it into the hole and carries on over it to the step. | Things push things. |
| 3-9 | Red, lift, green | `6 6 D 6 L 3 D 3 3\ 2\` | `DOOR(red)` on c3, `LIFT(6↔3)` on c5, `DOOR(green)` on c7; three buttons (red, purple, green), each under its own piece | **Press red**, roll, **press purple** on the lift, roll, **press green**. Doors can be opened early; the lift needs the friend on it. | Three buttons, read by colour. |
| 3-10 | The wide hole | `4 4 4 4 [2] [2] 4 4\ 3\ 2\` | `BOX` on c3, `BOX` on c4 | **Push** the near box (c3): it pushes the other one in, rides over it and drops in beside it. Or push them one at a time. | Two boxes fill a wide hole. |
| 3-11 | Bridge and lift | `5 5 5 [1] [1] 5 L 2 2 2\` | `Y↓` on c2, `PLANK` at the right edge of c3, `LIFT(5↔2)` on c7 | **Tap** block, **tap** plank, roll over, onto the lift, **press**. | Three pieces, three kinds. |
| 3-12 | The long way home | `3 3 [1] 3 3 4 4 L 2 2\` | `BOX` on c2, `RAMP` on c4, `DOOR(red)` on c7, `LIFT(4↔2)` on c8, `Y↓` on c9 | **Push** box into c3, **push** ramp to c5, **press** red, ride: **press** purple, **tap** the last block. Five actions, every piece she has learned. | Finale course. |

### 4.4b As shipped (after the parent's additions and the audit)

- **Level 2 (12):** Box in the hole · Push the other way · The ramp · Box, then block · **Cookie wall** (`Y` cookie stack on c5, 3 taps) · Ramp, then door · **Floaty crate** (`4 4 4 4 W1 4 4\ 3\ 2 2\`, blue crate c4 → pool c5) · The bridge · The cart (the cart is wooden and rolls by itself) · **Jelly jump** (`4 4 4 [2] 6 6\ 5\ 4\ 3\ 2\`, yellow jelly in c4: tap it with the baby on it) · Up and over · All together. 19 notes.
- **Level 3 (12):** The lift down · The lift up · Which button? · Door first · **Balloon lift** (`4 4 4 4 6 6\ 5\ 4\ 3\ 2\`, yellow balloon on c4: tap to tie on and float up, tap to pop) · The see-saw · Box on the see-saw · **Sink or float** (`4 4 4 4 W0 4 4 4\ 3\ 2\`, blue-banded stone c6 sinks, blue crate c7 floats) · Door and cart · Ramp pushes box · **Cookie and jelly** (`3 3 3 [1] 5 5 5\ 4\ 3\ 2\`, cookies c3, jelly c4) · The long way home (box, ramp, red door, lift; 4 actions). 23 notes.
- Removed for length: 2 "The deep hole", 2 "Two holes", 3 "The wide hole", 3 "Bridge and lift", 3 "Red, lift, green".
- Buttons sit on the front face of the block they work, with a lit cable to the door; tapping the door or lift itself works it too.
- From the 2nd puzzle on she may tap which of two babies (peeking from the log's windows) rolls next; the babies she brings home are kept (`store.rollHogs`).

### 4.5 Why no two rounds feel the same

- Every puzzle has its own skyline (start height 3 to 6, long slides, ledge staircases, deep gaps), so the rolling itself looks different each time.
- A new piece is always alone first, then paired with one known piece, then mixed.
- Push direction alternates (2-1 right, 2-2 left); drops vary (flush, deep, wide); payoffs vary (slide, stairs, lift ride, see-saw tip).
- Each hoglet has its own head-thing and quill tint (12 variants, section 7), drawn without repeats per level.
- Mummy's welcome cycles through three animations (nuzzle, pat with her nose, a slow happy sway).
- Replays: three alternative skylines per puzzle are not needed; instead the per-level look changes with the world look of the day and the hoglet order is shuffled. The puzzle order is fixed (the difficulty curve is the product).

---

## 5. Satisfaction beats and the ending

**Build-up object: the nest.** Empty at the start, one more baby after every puzzle, each on its own cushion, each different. It is always the last thing the camera shows in a round.

Beats (all use `beat()`; nothing explodes, nothing chimes):

1. **Under the finger**: a block sinks as she taps; a box has weight as she pushes and drops the instant it is over the hole.
2. **Before the release** (0.3–0.4 s): block pressed in before it sinks; plank leaning before it falls; door button down before the door rises; hoglet at the chute lip before the plop.
3. **The roll itself** is the reward: an unbroken, calm run from the obstacle to home. Nothing else moves while it rolls.
4. **Mummy reacts, not the screen**: one nuzzle, one number.
5. **Stillness** (1 s) on the nest.
6. **The level's tune**: every child action plays the next note of `sfx.step(i, n)` (n = the level's action count from section 4: 18, 19 and 24; where a Level 3 puzzle is solved in fewer actions, skip the spare notes at the next puzzle start so the count stays in step). The last action of the level lands on the top tonic.

**End of level: "Everyone is home!"**

- `onFinale()`: the last hoglet settles; Mummy walks two steps to the front corner of the nest (never in front of a cushion) and lies down; Pip walks over from the stump to the nest's left side. In Level 3 the lanterns glow.
- `creationView()`: tight on the nest: `pos (6.9, 2.3, 6.2)`, `look (6.9, 0.75, 0)`; the nest fills about 60% of the screen height.
- `creationObjects()`: the hoglets. During the admire, poking one makes it open its eyes, wiggle and play its note (`sfx.step(i, n)` in nest order, so poking along the rows plays the scale); Mummy's ears follow the poke.
- Caption: "Everyone is home!" (spoken), then the engine's "Look what you made!" rule applies.
- Photo: the full nest with Mummy and Pip. That is the gallery picture.
- `finaleRain = false` (leaves and confetti would hide the nest). `sfx.resolve()` once.
- End-frame test: pause at the end and you see 10 or 12 different hoglets she brought home. Mute test: sinking, dropping and rolling all read without sound.

---

## 6. Characters and staging

| Who | Where | Does | Never |
|---|---|---|---|
| **Hoglet** (one per puzzle) | On the track, z = 0. | Rolls, stops 0.15 clear of obstacles, looks at the helpful piece and at the child. | Never overlaps a tappable piece: every stop point is at least 0.57 from the piece's centre line edge, and buttons are on the plinth's front face, below the track, where the hoglet cannot be. |
| **Mummy hedgehog** (existing `hedgehog`, scale 1.25) | Behind the nest, x = 7.6, z = −1.7, facing the track. | Watches the hoglet (look-at), leans in to nuzzle each arrival, counts. | Never walks onto the track or in front of the cushions. |
| **Nest hoglets** | On their cushions: front row at z = +0.45, back row at z = −0.45 and 0.35 higher, so both rows are fully visible. | Sleep-breathe; peek when poked. | |
| **Pip** | On a stump behind the log, x = −6.2, z = −2.2. | `pipWatch` toward the action. Wears the hard hat (`dressPip`). | Never in front of the track. |
| **Snail** (3-3 only) | Inside the plinth hatch. | Waves an eye-stalk. | |

**Camera.** One follow camera for play, one fixed frame for home.

- Play frame: about 6.5 units of track visible across the screen; the hoglet is about 13% of screen width; the piece she must use is always in frame. Focus point `f` = 40% hoglet + 60% the next unsolved piece (clamped to x −3.2 … +2.6; y = track height there). Camera `pos (f.x, f.y + 1.5, 8.6)`, `look (f.x, f.y + 0.25, 0)`. Glide to a new focus with `glideCamera` over 0.9 s only when the focus moves more than 0.5; while the hoglet rolls, track it smoothly (critically damped, never snapping).
- The slight downward tilt (about 8°) shows the track tops and the plinth front where the buttons are.
- Home frame: `pos (6.6, 2.4, 7.4)`, `look (6.4, 0.9, 0)`: chute lip, nest and Mummy.
- Establishing: none. Puzzle 1 opens already on the log.
- Dragging: the camera does not move while a finger is down.

**Targets stay unblocked: the rules.**

1. Buttons live on the plinth's front face (z = +0.75), 0.55 in diameter, with a hit radius of 0.6.
2. Yellow and blue pieces sit on the track; the hoglet's stop point keeps a visible 0.15 gap; hit areas are the piece's box grown by 0.25 on every side, and never extend over the hoglet.
3. Nothing in the foreground (z > 0.9). Scenery (crane, cones, trees) only at z < −2.5.
4. The caption bar and the "Go!" badge sit above the track; check at every puzzle that no piece is under them (highest piece top is 6 steps + door frame = 4.5 units; if needed the camera's `f.y` drops 0.3 on courses starting at height 6).

---

## 7. Asset list

### 7.1 Blender models (new, all in `tools/blender/creatures/prop_roll.py`, built with `props/kit.py`)

| Model | Description | Triangles (aim) |
|---|---|---|
| `prop_rl_hogball` | The hoglet's rolling body: a sphere r 0.42. A cream centre band facing ±z and a ring of 14 short rounded brown quill-cones around the equator of the rolling axis, alternating two browns so the spin is clearly visible. Vertex-colour layer `quill` so code can tint the ring per hoglet. | 1,200 |
| `prop_rl_hogface` | The upright face cap: a shallow cream dome (r 0.27) with a tiny pointed snout, two round ears on top and a pink nose. Sits at the front pole of the ball. The code face (eyes, mouth) is drawn on it. An empty `head` at the top for the accessory. | 500 |
| `prop_rl_column` | One track column: a rounded wooden block 1.0 × 3.2 × 1.4 with visible plank lines, a grooved top (two rails 0.06 high at z = ±0.6) and a 2 cm chamfer so neighbours read as separate blocks. Layer `wood` for the per-level tint. | 300 |
| `prop_rl_slope` | The wedge cap: same footprint, 0.4 drop, grooved the same way. | 250 |
| `prop_rl_plinth` | The table base: 11.2 × 0.5 × 2.0, with 11 square slots, a front face with shallow round sockets for buttons under every slot, and a cable groove. | 900 |
| `prop_rl_log` | Hollow log, 1.4 long, opening 1.0 across, dark inside (no back face visible), moss patch and one leaf. | 1,200 |
| `prop_rl_chute` | A short curved wooden slide from height 1 step to the nest pad. | 400 |
| `prop_rl_nest` | Open two-tier bed, 3.4 × 1.9, woven twig rim 0.25 high at the front (low enough to see every hoglet), leaf lining. | 2,500 |
| `prop_rl_cushion` | Small round leaf cushion, r 0.4, dished. 12 instances. Layer `cush` for colour. | 200 |
| `prop_rl_pop` | Yellow block 0.9 × 1.0 × 1.2, heavily rounded, a white ring on the front face (the "tap me" mark). | 250 |
| `prop_rl_plank` | Yellow plank 2.3 × 0.12 × 1.1 with a round hinge barrel on one end and a white ring mark. | 250 |
| `prop_rl_box` | Blue box 0.96 × 0.8 × 1.2, rounded, white double chevrons ‹‹ ›› on the front face. | 250 |
| `prop_rl_ramp` | Blue wedge 1.0 × 0.4 × 1.2, grooved top to match the track, chevrons on the front. | 250 |
| `prop_rl_cart` | Blue box body 0.96 × 0.6 on a 0.2 chassis (total 0.8), flat top, four separate wheel objects (`wheel_fl` …) so code can spin them. | 700 |
| `prop_rl_doorframe` | Wooden frame straddling the track: two posts and a hood, opening 1.0 wide × 0.95 high, hood 1.1 tall (the door hides inside it). | 500 |
| `prop_rl_door` | Door leaf 0.2 × 0.95 × 1.1, one round window. Layer `tint` (red, green). | 200 |
| `prop_rl_button` | Dome button: dome r 0.26 on a ring base. Separate `dome` object so it can sink. Layer `tint` (red, green, purple). The purple one carries a white up/down arrow decal. | 300 |
| `prop_rl_cable` | A flat cable segment 1.0 long for the plinth groove (tiled by code, tinted). | 40 |
| `prop_rl_lifttop` | Purple cap for a lift column: same top groove, white arrow decals on the front. | 250 |
| `prop_rl_seesaw` | Plank 3.0 × 0.12 × 1.1 with a centre barrel, plus a separate `prop_rl_pivot` post (0.3 wide) with a cradle. | 400 |
| `prop_rl_hatch` | Little red door (0.5 × 0.4) for the plinth front, hinged at the side. | 120 |
| `prop_rl_stump` | Pip's seat. (Reuse `prop_m_stump` if its top is flat enough; then no new model.) | — |

### 7.2 Reused models

`hedgehog` (Mummy), `pip` + `prop_hardhat`, `prop_farmsnail`, `prop_lantern` (Level 3), `prop_crane`, `prop_m_cone`, `prop_scene_tree`, `prop_scene_cloud`, `prop_m_bush` (background only).
Hoglet head-things (scaled to about 0.22, attached to the face cap's `head` empty, so they never roll): `prop_m_leaf`, `prop_m_cherry`, `prop_m_flower`, `prop_m_acorn`, `prop_m_bow`, `prop_m_strawberry`, `prop_m_blueberry`, `prop_m_mushroom`, `prop_m_petal`, `prop_m_pompom`, `prop_bloom_daisy`, `prop_clover`. Quill tints: six browns and greys from chestnut to oat.

### 7.3 Sounds

Few, soft, wooden. No boings, no chimes, no squeaks.

| Sound | When | Source |
|---|---|---|
| `sfx.step(i, n)` | Each child action (block sinks, box lands or ramp locks, button pressed) | engine |
| `rollSound.roll(speed)` | While a hoglet, cart or helper rolls: a very quiet low wooden rumble, volume 0 to 0.18 with speed, silent when stopped | synthesised (filtered noise), in `roll-sound.js`; respects `effectsHushed()` |
| `rollSound.slide()` | Box or ramp being pushed; door or lift moving: a soft wood-on-wood slide, 0.4 s, volume 0.2 | CC0 sample or synthesised |
| `rollSound.click()` | Button dome going down | CC0 |
| physics `thunk` / `land` | Box into hole, plank landing, ledge drops (automatic, throttled) | engine |
| `sfx.pup` | Hoglet lands in the nest | engine |
| `rollSound.reform()` | Table re-forming: five quiet toks | synthesised |
| `sfx.resolve()` | Finale, once | engine |

The block sinking has no extra sound: its `sfx.step` note is its sound. Never more than one sound per action.

### 7.4 Voice lines (exact text; add to `tools/voice/new-lines.txt`)

Spoken = voiced the first time it applies in a level; later it is caption-only (`voice: false`).

**Intro and instructions (spoken)**
1. Let's roll home!
2. Help the baby roll home!
3. Tap the yellow block!
4. Tap it again!
5. Press the red button!
6. Push the box into the hole!
7. Push the ramp to the step!
8. Tap the yellow bridge!
9. Tap the block. Watch the cart!
10. Press the purple button!
11. Press the green button!
12. Open the door first!
13. Push the box off the see-saw!
14. Push the ramp. It pushes the box!

**The hoglet stops (spoken once per level, then caption)**
15. Uh-oh! A block is in the way.
16. Uh-oh! A hole!
17. Uh-oh! The door is shut.
18. Uh-oh! Too high!
19. Uh-oh! A long way down!

**What happened: position and force words (spoken the first time in a level, then caption)**
20. Down it rolls!
21. Up the ramp!
22. Over the bridge!
23. Under the door!
24. In it goes!
25. Down goes the lift!
26. Up goes the lift!
27. Wheels roll!
28. The see-saw tips!

**Hints (spoken, from the hint ladder only)**
29. Try the yellow one!
30. Try the blue one!
31. Try the button!
32. Fill the hole first!
33. Hello, snail! Try the green one!

**Home (spoken)**
34–45. One! Two! Three! Four! Five! Six! Seven! Eight! Nine! Ten! Eleven! Twelve! (reuse existing clips where the text matches)
46. Everyone is home!

Per puzzle the child hears at most: one "uh-oh", one instruction (new pieces only), one position word, one number. From the third puzzle of a level most rounds speak only the number.

---

## 8. Technical notes

### 8.1 Physics setup

- **World**: `physics.ground(-2)` far below (nothing should reach it). Gravity as the engine default.
- **Columns**: one static cuboid each (`physics.box`), moved with `physics.moveStatic` during the re-form (no dynamic body is on the track then). Slope caps need a collider tilted about z, which `physics.box` cannot do (rotY only): add a small `physics.slab(pos, size, quat)` helper (static cuboid with a full quaternion) or a static convex hull of the wedge.
- **Hoglet**: `physics.add(ball, { shape: 'ball', r: 0.42, planar: true, bounce: 0.05, friction: 1.0, sleep: false })`, then `body.setAngularDamping(0.2)`. Planar keeps it on z = 0 and lets it spin only about z.
- **Drive ("it wants to go home")**: each physics step, compute a target speed `v*` along the track: 1.3 on flats and ramps, up to 2.2 on down slopes, easing to 0 over the last 0.6 units before the next closed **gate**. Apply torque toward `ω* = −v*/r` (clamped), and brake if faster. So the pace is always calm, the hoglet never stalls, never slams into anything, and still visibly obeys gravity on slopes, ledges, the see-saw and the lift.
- **Gates**: each course spec lists gates in order: `{ stopX, open: () => boolean }`. Examples: a `Y↓` is open when its top is flush; a hole when a box, cart or up-block fills it (top within 0.03 of track level and at rest); a step when a ramp is locked against it; a door when its leaf is up; a lift when its top is flush with the side the hoglet is leaving and, to roll off, with the far side; a see-saw when the near end is within 0.05 of the track. All gates are checked every frame, so pieces can be done in any order.
- **Yellow blocks, doors, lifts**: kinematic position-based bodies moved with eased tweens. `physics.js` has no kinematic helper yet: add `physics.kinematic(obj, { size })` and `physics.moveKinematic(obj, pos)` (Rapier `kinematicPositionBased` + `setNextKinematicTranslation`). A lift carrying the hoglet: move at 0.8 units/s at most; friction carries the ball; the drive holds `v* = 0` while it moves.
- **Boxes and ramps (pushed)**: dynamic cuboid / wedge hull, planar, rotations locked (`spin: false`), friction 0.6, mass 3. While a finger is on it: every step set `vx = clamp((fingerX − x) × 8, −2.5, 2.5)` and leave `vy` to gravity. That is why the box drops into the hole the moment it is fully over it, pushes the other box (3-10) and why the ramp pushes the box (3-8): no scripting. When released: `vx = 0`. Rail stops are static invisible walls (thin cuboids in a collision group that only blue pieces collide with) at the limits of each piece's travel, including a stop at an unfilled hole's edge for ramps. When a box is at rest in a hole, or a ramp is within 0.05 of its step: swap it to a fixed body (`physics.remove` + `physics.box`), snap the last few millimetres over 0.1 s, play the step note.
- **Cart**: as a box, but its collider's friction is 0 with the combine rule set to `Min`, so it slides freely down a slope and reads as rolling; the four wheel meshes are spun in code from `vx`. Linear damping 0.3. Fixed once in the hole.
- **Plank bridge**: preferred: a dynamic slab on a Rapier revolute joint at its hinge (add `physics.hinge(obj, anchor)`), held upright by a tiny kinematic latch that the tap removes; give it a 2° lean so gravity takes it; angular damping 1.5 so it falls in about 0.7 s and lands with the automatic thunk. Then swap to fixed. Fallback if joints misbehave: a kinematic rotation with an ease-in curve (slow start, fast end) of 0.7 s plus the thunk; visually identical.
- **See-saw**: dynamic slab on a revolute joint at the pivot (same helper), angular damping 2.0, two static stop blocks hidden in the pivot post that limit it to 4° left-down (the waiting pose, left end flush with the left track at height 5) and 19° right-down (right end flush with the right track at height 4); pivot height 2.1. A small hidden mass on the left arm biases the empty plank to the waiting pose. Fallback: drive the angle kinematically from the hoglet's x (and the box's presence), eased; the hoglet still rides it physically.
- **Nest**: the hoglet lands on a static pad (real physics for the plop), then the body is removed and it is moved kinematically to its cushion along a short arc on the nest floor while its ring keeps turning (it is seen to roll there). It then sits fixed. No physics pile, so no jitter and no clipping.
- **Watchdog**: if a hoglet has not advanced for 5 s while its next gate reports open, or is below its column, it is eased back along the track to the last stop point (visible roll, 0.6 s) and the drive restarts. Log this in dev builds: it should never fire.

### 8.2 Faking things

- **Upright face on a rolling ball**: the hoglet group follows the body's position only. Child 1, `prop_rl_hogball`, copies the body's rotation (about z). Child 2, `prop_rl_hogface`, sits at local z = +0.36 and never rotates. Because the ball spins about the z axis and the face sits on that axis, the quills turn around the face like a wheel around a hub and nothing can intersect. The face leans up to 6° into the direction of travel and squashes 6% on landings (visual only).
- **Coming out of the log**: the hoglet is created inside the log, hidden by the log's dark interior, and rolls out. Nothing ever pops in.
- **Between puzzles**: columns and pieces only move vertically, into and out of the plinth slots. Old pieces sink with their column; new ones rise on theirs. Up-blocks, boxes in holes and lowered blocks all go down with the table. No `popOut`, no fades.
- **Cables**: flat tinted strips in the plinth groove; "lighting up" is an emissive tint travelling along them over 0.3 s.
- **Door into its hood**: the leaf slides up inside the hollow hood, which is 5 mm wider than the leaf on each side.

### 8.3 Code structure

- `roll-courses.js`: `LEVELS = [[...10], [...12], [...12]]`; each course `{ name, cols: ['6','6','6\\',…], pieces: [{ kind, col, … }], say: {...} }`. Gates are derived from the pieces, not hand-written.
- `roll.js`: `totalRounds` = course count; `nextRound()` re-forms the table, spawns the hoglet; `currentCue()` returns the instruction; `showHint()` runs the ghost tap or ghost drag on `nextPiece()`; `nudgeTarget()` returns `nextPiece().obj`.
- `nextPiece()`: the piece that opens the first closed gate ahead of the hoglet (for 3-4 the door before the box; for 3-8 the ramp).
- Autoplay hooks (`tools/autoplay.js`): `lesson.nextPiece()` → `{ kind: 'tap' | 'drag', obj, toX }`, and `lesson.doPiece(p)` which performs it through the same code path as the finger.
- Registration: `meta.js` entry (section 2), `main.js` import and `LESSONS`, `home.js` icon and `CENTER_Y`, the world table in `docs/WORLDS.md`.

### 8.4 Risks and how to avoid them

| Risk | Avoidance |
|---|---|
| The hoglet jitters or creeps while "stopped" | Stops only on flat columns; when `v* = 0` and speed < 0.05, set angular velocity to 0 each step. |
| A box wedges half in a hole | Rotations locked; box 0.96 wide in a 1.0 hole; holes have 2 cm chamfered mouths; a box resting above the hole floor for 1 s is eased down. |
| Dragging flings something | Speed capped at 2.5; mass 3 against the hoglet's 1, but rail stops keep every blue piece at least 0.6 from the hoglet. |
| A blue piece ends somewhere unwinnable | Rail stops per piece per course; ramps cannot enter holes; boxes can only fall into holes meant for them (each course is checked: every hole a box can reach is one it should fill). |
| Slope looks too fast | Drive brakes to 2.2; test the 4-column slides in 1-1, 1-10, 3-2 for calm. |
| Kinematic lift launches the ball | Eased, 0.8 units/s max, restitution 0.05. |
| See-saw or hinge unstable | Fallbacks in 8.1; decide once, early, by testing 2-7 and 3-5 first. |
| Camera motion sickness | Track with critical damping; no camera moves during a drag; glides ≥ 0.9 s. |
| Too many words | Line budget in 7.4; all narration caption-only after first use. |
| Level length | Target 25–35 s per puzzle, 5–7 minutes per level. If Level 3 runs past 8 minutes in testing, drop 3-10 and 3-11 (the nest then shows 10 cushions). |
| Low-end laptop | At most 14 dynamic bodies alive; one hoglet simulated at a time; 12 static nest hoglets are plain meshes. |

---

## 9. Acceptance criteria

A strict reviewer checks each of these on every level (`tools/qa-shots.sh roll <level> …`, one Electron at a time).

**Clarity**
1. Every yellow piece is tappable, every blue piece is pushable, every dome is pressable, and nothing else is. No exceptions.
2. The first use of tap (1-1), button (1-5), up-block (1-7), push box (2-1), push ramp (2-3), plank (2-7), lift (3-1) shows a slow ghost-hand demo on the real piece, followed by "Go!". The demo repeats after 8 s of no progress.
3. When the hoglet stops, it is looking at the piece that helps within 1 s.
4. All 34 puzzles are solvable with exactly the actions listed in section 4, and by `tools/autoplay.js`, with zero watchdog rescues.
5. No puzzle can be put into an unwinnable state by any order of taps and drags (reviewer tries: every piece first, every push to both rail stops, lift pressed 5 times).

**Polish**
6. No clipping at any frame: hoglet vs. pieces (0.15 gap when stopped), face cap vs. quills, door vs. hood, box vs. hole walls, nest hoglets vs. each other and vs. Mummy.
7. No teleporting: nothing appears, disappears or jumps. Hoglets come from the log; pieces and columns enter and leave through the plinth; arrivals roll to their cushions.
8. No character or caption ever covers a piece the child needs. Buttons are always fully visible.
9. The hoglet's face is upright in every frame while the quill ring visibly turns.
10. The piece in use fills a comfortable share of the frame: about 6.5 units of track across the screen; the hoglet is at least 12% of screen width; the nest is at least 55% of screen height in the finale.

**Feel**
11. Hoglet speed never exceeds 2.2 units/s; no camera cut; every glide is at least 0.9 s.
12. One sound per child action; no boing, chime, squeak or fanfare anywhere before the finale's single `sfx.resolve()`. With sound muted, every puzzle still reads and still satisfies.
13. A box pushed over a hole falls while the finger is still down; a pushed ramp really pushes the box in 3-8; the cart in 2-8 is moved by the slope alone.
14. There is at least 1 s of stillness on the nest after every arrival, and a held beat before every sink, fall, door and plop.
15. No more than four spoken lines in any one puzzle, and from the third puzzle of a level most puzzles speak only the number.

**Learning and ending**
16. Each level introduces at most one new piece per puzzle, and never a new piece together with another new piece.
17. Mummy's count always equals the number of hoglets in the nest.
18. End-frame test: the finale photo shows every hoglet (10, 12, 12), each visibly different, with Mummy and Pip, none hidden. Poking each hoglet plays its note and makes it peek.
19. Nothing the child did is undone: sunk blocks stay sunk and boxes stay in holes until the whole table re-forms; no hoglet ever leaves the nest.
20. Runs at a steady frame rate on the target laptop with all 12 hoglets in the nest.
