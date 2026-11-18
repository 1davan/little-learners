# 🎨 Paint & mix (`paint`)

Design for a builder agent. Read `docs/design/BRIEF.md` and the docs it lists first. Nothing here needs an engine change except the two small requests in section 8.7.

- **World:** Meadow (`meadow`), beside Colour tubes. It reuses the meadow palette and the meadow toy set's paint pot and brush as its starting point.
- **Registration:** id `paint`, title `Paint & mix`, name `Painting!`, icon `🖌️` (Colour tubes already uses 🎨, so this game takes the brush), colour `#4a90ff`, intro `Let's paint!`.
- **Files:** `app/src/lessons/paint.js` (lesson), `paint-canvas.js` (paint surface), `paint-shapes.js` (loads the shape data), `paint-studio.js` (table, wall, pots), `paint-sound.js` (three sounds), `app/assets/paint-shapes.json` (2D shape data shared with Blender), `tools/blender/creatures/prop_paint.py` (all models).

---

## 1. The pitch

A calm little painting table: touch a pot and the brush dips itself, rub the wooden toy and real paint goes on under her finger, then she hangs it on the wall with the others.
Level by level it grows from "make any mark" to "paint the duck yellow, like Duck" to "there is no green pot, so make green": she mixes two paints in a dish with her own stirring.

**Reference games and what we take**

| Game | What we take | What we leave |
|---|---|---|
| Pok Pok (Drawing, Marble Run) | One quiet table, a handful of tools, no score, material sounds only. The paint itself is the reward. | Its open-endedness without any goal: we add gentle goals from Level 2. |
| Toca Hair Salon / Toca Kitchen | The tool does what the finger does, immediately, and the result stays exactly as she left it, messy or not. | The busy tool rack: we never show more than one brush and one stamp. |
| Sago Mini (Doodlecast, World) | A friend who reacts in character to what she made (Duck sees a yellow duck). | Recording, prompts on a timer. |
| Busy Shapes (Edoki) | One new idea per round, added to a scene that otherwise does not change. Difficulty moves in very small steps. | Abstract shapes: our things are animals and food she can name. |
| Real wooden peg puzzles and poster paint | Chunky plywood cut-outs with burnt-in lines; thick opaque paint; a dish to mix in. | Mud: mixing is a lookup, never RGB arithmetic, so colours stay clean. |

---

## 2. Learning goals

| Goal | Taxonomy id | Where |
|---|---|---|
| Make marks on purpose: start, move and stop a tool; dab versus stroke; reload the brush | `mt_6msyXavNJf` Making and controlling marks | Every round; Level 1 is only this |
| Mix two paints to get a new colour, and choose which two for a colour she wants | `mt_-STxLMqeqF` Mixing and adjusting paint colours (earliest step of a 6+ topic: three fixed recipes plus pink, discovered by doing) | Level 3 |
| Choose colours and parts to make a picture of something (yellow duck, orange beak; red apple, green leaf) | `mt_2Kn5ianVWN` Composing visual artwork | Level 2 and 3 |
| Listen to a one-step spoken instruction and carry it out | `mt_r-BgS-lqTe` Giving and following instructions | Level 2 and 3 |
| Know and name common animals | `mt_zVLOm6U7bh` Naming Common Animals | Level 2 (the toy is named; the real friend stands beside it) |
| Count three with one touch per number | `mt_WcfaSfVT33` One-to-one counting | Level 2 rounds 7 and 8 (three stamped spots) |
| Predict, test and see what two paints make | `mt_Wa44s-f8Ws` Simple tests and experiments | Level 3 rounds 4, 5 and 7 |

`meta.js` topics (keep to four): `mt_6msyXavNJf`, `mt_-STxLMqeqF`, `mt_2Kn5ianVWN`, `mt_r-BgS-lqTe`.

Goal text for `meta.js`: "Dips a brush and paints wooden toys with her own strokes and dabs, then hangs each one on the wall. Later paints the thing the colour asked for (a yellow duck, a red apple with a green leaf, three spots on a mushroom), then makes the colour she needs by mixing two paints in a dish: orange, green, purple and pink."

Colour naming is incidental: each colour is named aloud the first time she dips it in a level.

---

## 3. The core loop, moment by moment

### 3.0 What is on the table

All positions are in world units, table top at y = 0, x to the right, z toward the child.

| Thing | Where | Size |
|---|---|---|
| **Easel** (backing board, peg, ledge) | Level 1 and 2: centre (0, 0, −0.6). Level 3: (0.75, 0, −0.6) | Board 2.0 wide × 1.75 high, leaning back 12° |
| **Toy** (the wooden cut-out being painted) | Hangs by its string loop on the easel peg; its centre is 0.95 above the table | Fits a 1.3 × 1.3 square, 0.14 thick |
| **Pot row** | Along the front edge, z = 0.95. Up to four pots at x = −2.3, −1.65, −1.0, −0.35 (Level 3) or centred with 0.7 spacing (Level 1 and 2, up to five pots) | Pot radius 0.27, height 0.42 |
| **Tool block** | Right end of the pot row, (2.45, 0, 0.9) | Holds the brush and, when present, the dot stamp, standing upright |
| **Mixing dish** (Level 3 only) | (−1.25, 0, 0.0), tipped 20° toward the camera | Radius 0.5 |
| **Recipe saucers** (Level 3 only) | Front row, right of the pots: x = 0.5, 1.1, 1.7 (orange, green, purple) and the pink one at 0.5 on a second row z = 0.45 once it exists | Radius 0.27 |
| **Gallery wall** | Behind the table, z = −1.7, two rows of four pegs: y = 2.25 and 3.75, x = −2.25, −0.75, 0.75, 2.25 | Hidden behind the easel board while painting |

### 3.1 "The brush comes to her finger"

There is no pick-up step. A two-year-old lifts her finger constantly; if the brush went home each time, painting would be mostly fetching.

- **Touch down** anywhere on the pots, dish or toy: the active tool lifts off wherever it is resting and glides to the finger in 0.3 s (ease-out, always visible on the way, never a jump). Its bristle tip sits **0.42 above the touch point** (about 45 px on screen), so the mark appears just above her fingertip where she can see it.
- **Finger moves:** the tool follows through the engine's carry spring (E2). The handle leans 15° away from the direction of travel.
- **Finger lifts:** the tool sets itself down within 0.45 s on the nearest rest: the easel ledge directly below where it was (the ledge runs the full width of the board), or the table in front of the pot it was over. It lies down, tip to the left, resting on a real surface. It never hovers.
- **Which tool:** the brush is active by default. Touching the stamp on the tool block makes the stamp active (it bobs once, the brush stands itself back in the block, 0.5 s). Touching the brush swaps back. The inactive tool always stands in the block.

No paint is laid during the 0.3 s glide. The first mark lands when the tip arrives, at the finger's position at that moment.

### 3.2 Dip

| Step | What happens |
|---|---|
| Finger touches a pot (touch or drag-through, hit radius 0.45) | The pot's rim lights (`onNear`, 8% brighter). The brush tip lowers 0.18 into the pot over 0.25 s, holds 0.15 s, rises 0.2 s. |
| On the lowest point | One soft `plip` (paint-sound). The paint surface in the pot dips and recovers (a 6% squash of the surface disc, 0.3 s). |
| On the way up | The tip's material colour is now the pot's colour and the tip is 15% fatter (loaded). A single drop hangs and falls back into the pot (a 0.05 sphere on a 0.3 s drop, no sound). |
| Voice | The colour's name, once per colour per level: "Red!" Afterwards caption only. |
| Touching the same pot with a loaded brush | It dips again and tops up. Nothing is refused. |
| Touching a different pot | The tip colour changes to the new colour (the old paint is simply replaced; pots never get dirty). |

**Load.** A dip holds enough paint to cover 45% of the toy (Level 1) or 60% (Level 2 and 3). The tip thins back to bare cream bristles as it empties. In the last 15% of the load the dabs come out at 60% size with visible bristle gaps. When it is empty the brush makes no mark, and the last pot she used starts a slow bob (0.06 up and down, 1.6 s period) until she dips. The first time this happens in a level: "More paint!" (voiced once per level).

### 3.3 Paint

| Her action | Result on the toy | Sound |
|---|---|---|
| **Rub / drag** across the toy | A continuous stroke of thick opaque paint follows the tip: round dabs 0.17 wide (22% of load per toy-width of travel), one every 0.035 of travel, with fine lighter bristle streaks along the direction of travel. New paint covers old paint completely. | One quiet `swish` at the start of a stroke, never more than once every 0.8 s |
| **Tap** on the toy (down and up within 0.25 s, under 0.08 of travel) | One splat: a rounder blob 0.26 wide with 3 to 5 small satellite drops around it (one of four splat shapes, random rotation). Costs 8% of the load. The toy presses in 3% and springs back. | One soft wet `pat` |
| Tap with the **dot stamp** (loaded the same way) | A crisp disc 0.2 wide with a faintly speckled sponge edge. Costs nothing: a stamp holds 6 prints per dip. | `pat`, pitched a fourth lower |
| Rub or tap **off** the toy (on the board) | Nothing is painted. The brush still moves. No sound, no "no". | none |

- The toy's burnt-in lines and its two dot eyes and small smile are redrawn on top of every mark, so the animal's face and outline are never lost.
- In **directed rounds with two parts** (Level 2 rounds 5 to 8, Level 3 round 7) a stroke stays inside the part it started in, like a good colouring book, so the leaf stays green when she scrubs the apple. In free rounds there is no clipping at all.
- On the **butterfly** every mark is mirrored onto the other wing as she makes it.

### 3.4 "Done" (no button)

A round can end only while her finger is up.

| Level | The toy is done when | Then |
|---|---|---|
| 1 (free) | At least 35% of the toy is covered **and** she has not touched anything for 2.0 s. She can keep painting as long as she likes; touching resets the 2 s. | 3.5 |
| 2 and 3 (directed) | At least 60% of the asked part shows the asked colour (latest paint wins), her finger is up, and 1.2 s pass. Other colours elsewhere are fine and stay. | The friend reacts (3.6), then the next instruction or 3.5 |

Never interrupt a stroke. Never clean up or "correct" her painting.

### 3.5 Hang it up

1. **Beat.** `await this.beat(toy, 0.45)`: the toy squashes 10% on its peg and holds, the music dips.
2. The camera glides back (0.9 s) to the **hang view** (section 6), so the wall and its next empty peg come into view above the easel. The peg glows softly and bobs 0.04.
3. Caption and voice, first round of a level only: "Hang it up!" Later rounds: caption only.
4. **She drags the toy to the peg.** The toy lifts off the easel peg with the normal grab feel. Within 1.2× the peg's radius (radius 0.7) the magnet pulls it in and the peg's glow brightens (`onNear`). On drop it slides onto the peg (0.3 s), settles with one small overshoot and is then perfectly still. Sound: `sfx.step(round, totalRounds)`, the level's rising tune. Nothing else.
   - **Tap fallback:** a tap on the toy or on the glowing peg carries the toy to the peg on a slow arc (0.9 s).
   - A drop anywhere else: the toy walks home to the easel peg (`autoHome`).
5. `this.payoffP` = the settle plus the friend's reaction. `this.success(pegPos, '')`. One second of stillness.
6. While the camera is still on the wall, the next blank toy is hung on the easel and the pots for the next round are set (the easel is in the lower part of the hang view, so this is seen: the new blank toy rises from behind the easel board and settles onto the peg over 0.7 s, and any pot that opens or closes gets or loses its lid in view). The camera glides back down to the paint view (0.9 s).

### 3.6 Who reacts

- **Level 1:** Pip only: `pipWatch(peg)` (a turn, one nod, joy face 1 s).
- **Level 2 and 3, rounds with a friend:** when the asked part is done the friend takes two walking steps toward the easel (staying outside the board, section 6), looks at the toy, then at the child, `setFace(face, 'joy')`, and makes its one call (`sfx.quack`, `ribbit`, `oink`; the crab has no call and clacks its claws once, silent). Then it walks back. When the toy is hung, it only turns its head to watch it go up.
- **Wrong colour in a directed round** (she painted the duck blue): nothing is refused and nothing is removed. When her finger lifts after the first wrong-colour mark, `this.redirect('Duck is yellow!', { obj: friend })`: the friend gives one small head-shake with a calm face and the right pot bobs. This happens once per round; after that the pot simply keeps bobbing. Painting over in yellow is how it is fixed, and that is satisfying in itself.

### 3.7 Mixing (Level 3)

| Step | Her action | Feedback |
|---|---|---|
| 1. First paint | Dips a pot, then touches the dish (hit radius 0.6) | The brush tip presses into the dish (0.25 s) and a puddle of that colour spreads over the left half of the dish in 0.4 s. One `plip`. The brush comes up empty. |
| 2. Second paint | Dips a **different** pot, touches the dish | A puddle of the second colour spreads over the right half. The two meet in a wobbly line down the middle. One `plip`. |
| (same colour twice) | | The puddle gets 10% bigger for a moment and settles. No voice. The dish waits. |
| 3. Stir | Rubs round and round, or back and forth, inside the dish. Demo the first time: a slow circle. Caption and voice: "Stir!" | The two colours smear into each other under the brush in real swirls (section 8.4). Progress = distance rubbed inside the dish; a full mix needs 3.2 units (about two and a half circles). **Tap fallback:** each tap in the dish makes the brush stir one slow half-circle by itself (0.6 s) and adds 20%. No sound while stirring. |
| 4. Beat | At 85% progress | `beat(dish, 0.45)`: the dish squashes, the music dips, the swirls hold still. |
| 5. The new colour | On release | The last streaks melt and the whole dish is the new colour. `sfx.step`. Voice: "Red and yellow make orange!" The brush tip is loaded with the new colour. Two small dots in the parent colours appear on the dish's rim: its recipe, there for the rest of the level. |
| 6. Paint | She paints the toy from the dish (the dish works exactly like a pot) | As 3.3 |
| 7. After the toy is hung | | The dish glides (0.7 s, ease in-out) to its home in the saucer row and stays there all level, holding a smear of its colour and its two recipe dots. A fresh dish glides from the dish stack (three spare dishes stacked at (−2.55, 0, 0.0)) to the mixing spot. |

**What two paints make** (a fixed table, see 8.4): red + yellow = orange, blue + yellow = green, red + blue = purple, red + white = pink. Only the pots that are open in a round can go in the dish, and the rounds are set up so that no other pair is ever possible.

**A different colour than the one asked for** (rounds 4, 5 and 7): it is made honestly. "Red and yellow make orange!" The friend looks at it, calm face. Caption only: "We need green." The orange dish glides to the saucer row (nesting on top of the orange saucer if there is one: the dishes are made to nest, 0.05 apart), a fresh dish glides in, and she tries again. There is no limit and no penalty; the third time the hint ladder steps in (4.4).

**Used-up saucers.** A saucer from an earlier round holds only a smear, so it cannot fill the brush: the brush touches it and comes up bare, and its two recipe dots pulse once. Caption only: "All gone. Make more!" The saucers are the recipe book, not a shortcut.

### 3.8 Showing how

Every new kind of action gets a slow hand demo on the real objects (`fx.ghostPath`), then the "Go!" badge (`showGo`), then her turn. The demo repeats after 8 s without the right action.

| Action | First appears | Demo |
|---|---|---|
| Touch a pot (dip) | L1 round 1 | Hand taps the pot; the brush really dips |
| Rub the toy | L1 round 1 | Hand drags a slow zigzag across the toy (2.2 s); the brush really paints a short stroke, which stays |
| Hang it up | L1 round 1 | Hand drags from the toy to the peg |
| Tap for a splat | L1 round 4 | Hand taps twice, slowly; two real splats stay |
| The dot stamp | L1 round 6 | Hand taps the stamp, a pot, then the toy |
| Dab into the dish | L3 round 1 | Hand taps pot, then dish |
| Stir | L3 round 1 | Hand draws one slow circle in the dish |

Demos run once per session per action when the level is replayed (store the shown set on the lesson, as `myday.js` does).

---

## 4. Progression

Eight rounds per level. One round is one toy. A round takes 30 to 60 s, a level about 6 minutes. The gallery wall has eight pegs, so the level ends with the wall full.

### 4.1 Level 1: free painting ("Paint it!")

No right or wrong. She learns dip, rub, re-dip, splat, stamp and hang. One new thing per round.

| # | Toy | Pots open | New this round | Instruction (voiced) | Done at |
|---|---|---|---|---|---|
| 1 | **Ball** (a plain disc with one curved seam) | red | Dip, rub, hang (three demos, one after another, each followed by her doing it) | "Touch the paint!" then "Rub the ball!" then "Hang it up!" | 30% |
| 2 | **Star** | red, yellow | A second colour to choose | "Paint the star!" | 35% |
| 3 | **Heart** | yellow, blue | Blue | "Paint the heart!" | 35% |
| 4 | **Fish** (body, tail fin line, eye) | red, yellow, blue | Tap = splat | "Tap, tap, tap!" (after the demo) | 35%, of which at least 2 splats |
| 5 | **Boat** (hull and sail, two parts) | red, yellow, blue | A toy with two parts (no rule about them) | "Paint the boat!" | 35% |
| 6 | **Car** (body, two wheels, window) | red, yellow, blue, green | Green; the dot stamp | "Try the stamp!" | 35%, or 25% plus 3 stamps |
| 7 | **Butterfly** | red, yellow, blue, green | Mirror painting: both wings at once | "Paint the butterfly!" | 30% (counted on one wing) |
| 8 | **Her choice:** three blank toys stand on the easel ledge (cat, bunny, bird). She taps one; it hops onto the peg (0.6 s arc) and the other two walk off to the left edge and wait there on the table, visible. | red, yellow, blue, green, pink | Choosing what to paint | "Which one?" then "Paint it!" | 40% |

### 4.2 Level 2: paint it the right colour ("Paint the duck yellow!")

The colour is said, shown by the real friend standing beside the easel (rounds 1 to 4 and 8), or shown on a picture card (rounds 5 to 7). Pots that are not the answer are real distractors.

| # | Toy and parts | Friend / card | Pots open (answer in bold) | Instruction(s) | Notes |
|---|---|---|---|---|---|
| 1 | **Duck** (one part) | Duck stands right of the easel | **yellow**, blue | "Paint the duck yellow!" | Two pots only |
| 2 | **Frog** (one part) | Frog | red, **green** | "Paint the frog green!" | Answer on the other side |
| 3 | **Pig** (one part) | Pig | **pink**, yellow, blue | "Paint the pig pink!" | Three pots |
| 4 | **Crab** (one part) | Crab | green, yellow, **red** | "Paint the crab red!" | |
| 5 | **Apple** (apple, leaf) | Picture card on a stand, right of the easel: a red apple with a green leaf | **red**, **green**, yellow | "Paint the apple red!" then "Now the leaf. Green!" | First two-step round. The asked part's outline pulses once when asked. Strokes stay inside the part. |
| 6 | **Flower** (bloom, stem with leaf) | Card: pink bloom, green stem | **pink**, **green**, blue, yellow | "Paint the flower pink!" then "Now the stem. Green!" | Four pots |
| 7 | **Mushroom** (cap, stalk; three faint rings burnt into the cap) | Card: red cap with three white spots | **red**, **white**, blue | "Paint the top red!" then "Add three white spots!" | The stamp bobs. Each stamp snaps to the nearest empty ring (magnet) and is counted: "One." "Two." "Three!" The stalk is left as wood, or she may paint it. |
| 8 | **Pip** (the chick: body, beak) | Pip himself hops onto a low stool right of the easel and sits for his portrait | **yellow**, **orange**, blue, green, red | "Paint Pip yellow!" then "Now the beak. Orange!" then caption only "Add some spots!" | After the beak she may stamp or paint anything for as long as she likes; done 2 s after her last touch (minimum 0, so she may also just stop). |

### 4.3 Level 3: make the colour ("No green! Let's make green.")

The ready-made green, orange and pink pots are gone. Recipes are taught one at a time (rounds 1 to 3, with only the two right pots open), then chosen (4, 5), then extended (6), then combined (7), then enjoyed (8).

| # | Toy | Friend | Pots open | What is asked | Flow |
|---|---|---|---|---|---|
| 1 | **Goldfish** | none | red, yellow | Orange | "The fish is orange. No orange!" (Pip looks along the pots.) "Let's make orange." Demo: dab red, dab yellow, stir. "Red and yellow make orange!" then "Paint the fish orange!" |
| 2 | **Frog** | Frog | blue, yellow (red has its lid on) | Green | "No green! Let's make green." No demo unless stuck. "Blue and yellow make green!" then "Paint the frog green!" |
| 3 | **Grapes** | none; card with purple grapes | red, blue (yellow lidded) | Purple | "Let's make purple." "Red and blue make purple!" then "Paint the grapes purple!" |
| 4 | **Turtle** | card with a green turtle | red, yellow, blue | Green, her choice of two pots | "Make green!" The green saucer from round 2 sits in the row with its blue and yellow dots: the recipe is there to read. Any other mix is made honestly (3.7). |
| 5 | **Pumpkin** | card with an orange pumpkin | red, yellow, blue | Orange, her choice | "Make orange!" |
| 6 | **Pig** | Pig | red, white (yellow and blue lidded) | Pink: a new idea, white makes it lighter | "No pink! Let's make pink." "Red and white make pink!" then "Paint the pig pink!" |
| 7 | **Carrot** (root, leafy top) | card with an orange carrot and green top | red, yellow, blue | Two mixes in a row | "Make orange!" then "Paint the carrot orange!" then "Now the top. Make green!" then "Paint the top green!" The first dish goes to the saucer row before the second dish arrives. |
| 8 | **Rainbow** (six bands) | none | red, yellow, blue, and the orange, green and purple saucers **full again** | Free. Her rainbow, any order. | "Paint a rainbow!" While the camera was on the wall, Pip carried a full dish to each saucer (three slow trips at the back edge of the table are already under way when the camera returns: the last one arrives in view). Each band keeps its strokes inside itself. Done when four of the six bands are 50% covered and she pauses 2 s. |

Lids: a pot with its lid on is closed. Touching it makes the lid wobble once with a soft wooden `tok` (`sfx.thunk` at 40% volume); the brush does not dip. No voice.

### 4.4 The hint ladder in this game

The engine's ladder (6, 12, 20, 45 s without touching) maps to:

| Step | Free rounds | Directed rounds | Mixing |
|---|---|---|---|
| 6 s: cue again | Caption of the last instruction; the next useful thing bobs (a pot if the brush is empty, else the toy's outline pulses) | Same; the right pot bobs | The next thing bobs: pot, dish, or the brush circles once above the dish |
| 12 s: hand | The demo for the current action again, on the real object | Same | Same |
| 20 s: errorless | The game does one dip and one slow stroke for her, which stays, then waits | Lids go onto the wrong pots (they are carried in from behind the pot row, 0.6 s each), leaving only the right one open | Lids go onto the pot that is not in the recipe; if both paints are in, the brush stirs by itself |
| Three wrong mixes in one round | | | As the 20 s step |
| 45 s | Engine default | Engine default | Engine default |

`nudgeTarget()` returns: the bobbing pot when the brush is empty or the wrong colour, the dish when a paint is still needed there, the peg when the toy is done, else the toy.

### 4.5 Variety

- **24 rounds, 24 toy shapes, 22 of them painted in a full play-through** (Level 1 round 8 offers three and she picks one; frog and pig return in Level 3 with a new problem: the pot is missing).
- **Each round changes something real:** the number of pots, which side the answer is on, one part or two, friend or card, dab or stroke or stamp, mirror painting, a choice of toy, one mix or two.
- **Her own marks are never the same twice:** four splat shapes, random rotation, stroke width varying ±12% with speed.
- **Blank toys differ in wood:** three wood tones (birch `#f3e0bd`, beech `#ecd0a4`, maple `#f6e6cc`) chosen per round, grain lines seeded by the round number.
- **Friends differ in reaction:** Duck waddles and quacks, Frog hops once and ribbits, Pig trots and oinks, Crab scuttles sideways and clacks, Pip fluffs up.
- **Pot order is shuffled per session** within the "pots open" list, except where the table above fixes the side of the answer.

---

## 5. Satisfaction beats and "look what you made"

**Per round (the seven rules):**

| Rule | In this game |
|---|---|
| The finger does it | Paint appears at the brush tip the moment the tip moves. Stirring is her rubbing. Hanging is her drag. |
| It changes and stays changed | Bare wood to painted, for good. Nothing she paints is ever cleaned, corrected or reset. |
| One thing grows all level | The gallery wall: one more toy after every round. In Level 3 the row of recipe saucers grows as well. |
| A beat before the release | Before the toy leaves the easel (3.5 step 1) and before the mixed colour appears (3.7 step 4). |
| A character reacts | The friend who sat for the portrait sees itself in its own colour. Pip watches otherwise. |
| Then nothing happens | One second of stillness after every hang, before the camera moves back. |
| One soft sound per action | `plip` (dip), `swish` (stroke start), `pat` (splat or stamp), `sfx.step` (new colour; toy on its peg). Five sounds in the whole game, plus the friend's one call. |

**Mute test:** paint going on under the finger and the wall filling up carry the round with no sound. **End-frame test:** the wall of eight painted toys.

**Finale**

- `onFinale()`: the brush and stamp stand themselves in the block. Pip hops to the left end of the table and turns to face the wall. In Level 2 and 3 the friends who sat walk in from the right and stand in a row at the right end of the table, facing the wall.
- `creationView()`: `{ pos: [0, 3.0, 8.4], look: [0, 3.0, -1.7], dur: 1.2 }`: the whole wall, two rows of four, filling about 70% of the screen height, the easel and table out of frame below.
- `creationObjects()`: the eight hung toys, in the order she made them.
- `onAdmirePoke(toy, i, n)`: the toy presses in against the wall and springs back, and sounds `sfx.step(i, n)`. Poking them left to right, top row then bottom row, plays the level's tune. In Level 2 and 3 the friend whose portrait it is turns its head to it and makes its call (at most one call per 1.5 s).
- `admireTime = 5`.
- Photo: the wall (engine). The home pedestal for this game then shows her latest wall.
- `finaleRain = false`. The ending is calm: no confetti; the engine's three-note resolve and the sticker only.

---

## 6. Characters and staging

### 6.1 Who is where

| Who | Where | Rule |
|---|---|---|
| **Pip** | Left end of the table, standing on the table top at (−2.9, 0, −0.5) in Level 1 and 2; on a low stool right of the easel in Level 2 round 8; at (−2.95, 0, −0.9) in Level 3 (behind the dish stack) | Never in front of the pot row, never overlapping the board |
| **The friend** (Level 2 and 3) | On the table right of the easel at (2.1, 0, −0.7) (Level 3: (2.55, 0, −0.8)), scaled so its head is below the top of the board | Its reaction walk is at most 0.45 toward the easel; it never crosses the board's edge and never comes forward of z = −0.2 |
| **Picture card** | On a small wooden card stand in the friend's spot when there is no friend | Tappable: it presses in, nothing else |
| **Pots, dish, saucers, tool block** | Front of the table, nearest the child | Nothing ever stands between them and the camera |

Friends walk in and out along the back edge of the table from the right, at 1.5 units/s, while the camera is on the wall. They are standing still by the time the camera comes back.

### 6.2 Camera

Give these as starting values; tune the distance so that the stated framing holds at 16:9 and at 4:3.

| View | Camera | Framing rule (what a reviewer checks) |
|---|---|---|
| **Paint view**, Level 1 and 2 | pos (0, 2.35, 4.9), look (0, 0.8, −0.25) | The toy is 45 to 55% of the screen height. The whole pot row and the tool block are inside the bottom 30% with at least 40 px of margin on every side. |
| **Paint view**, Level 3 | pos (0, 2.5, 5.4), look (0, 0.7, −0.2) | The toy is at least 40% of the screen height. The dish is at least 22% of the screen width. Pots, saucers and tool block all visible with 40 px margins. |
| **Mix close-up**, Level 3, from the first dab until the new colour appears | Glide 0.8 s to pos (−0.9, 2.3, 3.9), look (−1.1, 0.25, 0.3) | The dish is 35 to 45% of the screen width; every open pot is still on screen. Glide back to the paint view 1 s after the new colour appears. |
| **Hang view** | Glide 0.9 s to pos (0, 2.9, 7.2), look (0, 2.1, −1.2) | The easel with its toy at the bottom, the glowing peg in view, and at least the row of pegs that contains it. |
| **Establishing** | None. The level opens directly in the paint view. | |
| **Finale** | `creationView()` above | All eight toys in frame. |

### 6.3 Keeping targets clear

- The brush is held 0.42 **above** the finger and leans away from the travel direction, so the brush itself never covers the pot she is reaching for or the patch she is painting.
- The resting brush lies on the easel ledge (below the toy) or on the table between pot row and easel, never across a pot.
- The friend and the card are outside the board's rectangle by at least 0.15 at all times.
- The easel board hides the gallery wall during painting, so finished toys never sit behind the one being painted.
- Clearances to check for clipping: toy against board (the toy hangs 0.03 proud of the board), toy loop against peg, brush tip against pot rim during the dip (the tip goes down the pot's centre line), lids against pots, dishes when nested, hung toys against each other (1.5 between peg centres, toys at most 1.3 wide) and the top row against the bottom row (1.5 between rows, toys at most 1.3 tall plus the 0.15 loop).

---

## 7. Assets

### 7.1 Blender models (all in `tools/blender/creatures/prop_paint.py`, prefix `prop_pt_`)

**The toys.** One model per shape, all made the same way from `app/assets/paint-shapes.json`: `SProp.prism(outline, 0, 0.14, bevel=0.035)` in birch white (the colour comes from the canvas, section 8.1), plus a `loop` layer: a twine ring (tube radius 0.012, ring radius 0.07, colour `#c9a877`) at the shape's `hang` point, its top 0.15 above the outline. Under 1,200 triangles each. `extras['outline'] = 0.02`. `extras['paint'] = 1` so the loader knows to give it a canvas.

Each shape fits a 1.3 × 1.3 square and is drawn chunky: no neck or limb thinner than 0.16, no inward corner sharper than 60°.

| Model | Outline | Parts (regions) | Burnt lines and face |
|---|---|---|---|
| `prop_pt_ball` | Disc, radius 0.62 | 1 | One curved seam |
| `prop_pt_star` | Five fat rounded points | 1 | none |
| `prop_pt_heart` | Rounded heart | 1 | none |
| `prop_pt_fish` | Oval body, fan tail, facing left | 1 | Tail line, gill curve, eye, smile |
| `prop_pt_boat` | Hull with one triangular sail on a short mast | hull, sail | Line between them, one porthole |
| `prop_pt_car` | Rounded car, two wheels | 1 | Wheel circles, window |
| `prop_pt_butterfly` | Two rounded wings each side, symmetric | 1 (mirrored) | Body, wing split, eyes, smile |
| `prop_pt_cat` | Sitting cat, front view, two ears, tail curled to one side | 1 | Eyes, nose, whiskers, smile |
| `prop_pt_bunny` | Sitting bunny, two tall ears | 1 | Eyes, nose, smile |
| `prop_pt_bird` | Round bird, side view, small tail | 1 | Wing curve, beak line, eye |
| `prop_pt_duck` | Duck, side view, facing left | 1 | Wing curve, beak line, eye |
| `prop_pt_frog` | Sitting frog, front view, two eye bumps | 1 | Eyes, wide smile, two toes each foot |
| `prop_pt_pig` | Round pig, front view, two ears | 1 | Snout oval with nostrils, eyes |
| `prop_pt_crab` | Wide body, two raised claws | 1 | Eyes, smile, claw lines |
| `prop_pt_apple` | Apple with one leaf | apple, leaf | Leaf vein, stalk |
| `prop_pt_flower` | Six-petal bloom on a stem with one leaf | bloom, stem | Centre circle, leaf vein |
| `prop_pt_mushroom` | Domed cap on a fat stalk | cap, stalk | Three rings on the cap (radius 0.1), eyes and smile on the stalk |
| `prop_pt_pip` | Pip, front view | body, beak | Eyes, wing curves, feet |
| `prop_pt_turtle` | Side view, domed shell | 1 | Shell pattern, eye, smile |
| `prop_pt_grapes` | Bunch of nine round grapes with a stalk | 1 | Grape circles |
| `prop_pt_pumpkin` | Wide pumpkin with a stub stalk | 1 | Three rib curves, eyes, smile |
| `prop_pt_carrot` | Fat carrot, point down, leafy top | root, top | Three short cross lines |
| `prop_pt_rainbow` | Semicircular arch, outer radius 0.65, inner radius 0.17 | six equal bands | Band lines |

(`prop_pt_goldfish` is `prop_pt_fish` with a second, rounder tail in the shape data: build it as its own shape so Level 3 round 1 is not Level 1 round 4 again.)

**The studio**

| Model | Description |
|---|---|
| `prop_pt_table` | A low, chunky wooden play table top, 6.6 × 2.6, rounded edge, pale wood with a white-painted apron. Only the top and front apron are ever seen. |
| `prop_pt_easel` | Cream backing board 2.0 × 1.75, leaning back 12° on two short legs; a round wooden peg at top centre (radius 0.05, 0.12 long); a ledge along the bottom (0.16 deep, a lip at the front) for the resting brush. Anchors: `peg`, `ledgeL`, `ledgeR`. |
| `prop_pt_pot` | A squat, wide-mouthed paint pot (radius 0.27, height 0.42), white with a thick rounded rim, rounder and lower than `prop_m_paintpot`, no drips, no face. Layers: `skin` (white), `paint` (a slightly domed disc 0.05 below the rim, white vertex colour, tinted by material colour in game). Bone `paint` so the surface can dip. |
| `prop_pt_lid` | A flat wooden lid with a round knob, sits on the pot rim with a 0.02 overlap lip. |
| `prop_pt_brush` | A fat toddler's brush, 0.95 long: short thick wooden handle with a red-painted end, a silver ferrule, and a round bristle head. Layers: `skin`, `ferrule`, `tip` (bristles, white vertex colour, tinted in game; bare colour `#f6e7c8`). Bones: `body`, `tip` (scales for loaded / empty). Anchor: `tip`. |
| `prop_pt_stamp` | A round wooden knob handle on a short neck with a flat sponge disc (radius 0.1) underneath. Layers: `skin`, `sponge` (tinted in game; bare `#f3e6a8`). Anchor: `face`. |
| `prop_pt_block` | The tool block: a rounded wooden block 0.7 × 0.3 × 0.4 with two holes; the brush and the stamp stand in them. Anchors: `holeA`, `holeB`. |
| `prop_pt_dish` | A shallow white mixing dish, radius 0.5, rim 0.09 high, made to nest (a stack of dishes steps up 0.05 each). Layers: `skin`, `well` (a flat disc 0.03 above the floor, given the swirl canvas in game). Anchors: `dotA`, `dotB` on the rim nearest the camera for the two recipe dots. |
| `prop_pt_dot` | A small flat blob of paint (radius 0.045), tinted: the recipe dots. |
| `prop_pt_wall` | The gallery wall: wide cream boards, 6.4 × 3.6, with eight round wooden pegs in two rows (positions in 3.0) and a thin rail under each row. Anchors `peg0` to `peg7`. |
| `prop_pt_cardstand` | A small wooden stand with a slot holding a rounded card 0.8 × 0.8. Layers: `skin`, `card` (white; given a small canvas showing the finished toy, drawn by the same code that draws the toys, so cards need no models of their own). |
| `prop_pt_stool` | A low round stool, 0.35 high, for Pip in Level 2 round 8. Reuse `prop_md_stool` if it fits the scale and style; build this only if it does not. |

**Reused as they are:** `pip`, `duck`, `frog`, `pig`, `crab` (rigged friends); meadow scenery from `makeScenery` behind the wall, out of focus of the camera.

### 7.2 Sounds

| Sound | Source | When | Notes |
|---|---|---|---|
| `plip` | New, `paint-sound.js` (synthesised: a short sine drop 520 → 300 Hz, 90 ms, with a 30 ms noise tick), or a CC0 single water drop in `app/assets/sfx/` | Brush or stamp into a pot; a dab into the dish | Volume 0.3 |
| `swish` | New, synthesised: band-passed noise (1.5 to 4 kHz), 180 ms, soft attack | Start of a stroke, at most once per 0.8 s | Volume 0.15. Must be nearly subliminal. |
| `pat` | New, synthesised: low-passed noise burst (below 900 Hz), 70 ms, plus a 140 Hz thump at low level | Splat; stamp (pitched down a fourth) | Volume 0.3 |
| `sfx.step(i, n)` | Engine | Toy settles on its gallery peg (`i` = round); the mixed colour appears (use `i` = round as well, soft: `{ soft: true }`); finale pokes | The level's tune |
| `sfx.thunk` at 0.4 | Engine | A closed pot's lid wobbles; a lid is put on | |
| `sfx.nope` | Engine, through `redirect()` | Wrong colour, once per round | |
| `sfx.quack`, `sfx.ribbit`, `sfx.oink`, `sfx.cheep` | Engine | The friend's single call when its portrait is done | |
| `sfx.shutter`, `sfx.resolve` | Engine | Finale | |
| Music | The Meadow loop | Throughout; dipped by `beat()` | |

`paint-sound.js` follows `cook-sound.js`: `sharedCtx()`, `cueOut()`, and it checks `effectsHushed()` before every sound. There is no stirring sound, no sound when the brush moves without painting, and no boing anywhere.

### 7.3 Voice lines (Sulafat)

Add every line to `tools/voice/new-lines.txt`, one per line, exactly as written. "Voiced" lines are spoken (the engine still limits a repeat to once per 30 s); "caption" lines use `say(text, { voice: false })` but are recorded anyway so that a later change needs no new recording.

**Shared**

| Line | Use |
|---|---|
| Let's paint! | Intro |
| Touch the paint! | L1 r1, first demo. Voiced |
| Rub the ball! | L1 r1. Voiced |
| Hang it up! | Voiced in the first round of each level, then caption |
| More paint! | Brush empty, voiced once per level |
| Tap, tap, tap! | L1 r4. Voiced |
| Try the stamp! | L1 r6. Voiced |
| Which one? | L1 r8. Voiced |
| Paint it! | L1 r8. Voiced |
| Red! | First dip of each colour in a level. Voiced |
| Yellow! | |
| Blue! | |
| Green! | |
| Pink! | |
| Orange! | |
| White! | |
| Purple! | |
| Look what you made! | Engine line, already recorded |

**Level 1 instructions (voiced)**

- Paint the star!
- Paint the heart!
- Paint the boat!
- Paint the butterfly!

**Level 2 instructions (voiced)**

- Paint the duck yellow!
- Paint the frog green!
- Paint the pig pink!
- Paint the crab red!
- Paint the apple red!
- Now the leaf. Green!
- Paint the flower pink!
- Now the stem. Green!
- Paint the top red!
- Add three white spots!
- One.
- Two.
- Three!
- Paint Pip yellow!
- Now the beak. Orange!

**Level 2 captions**

- Add some spots!
- Duck is yellow!
- Frog is green!
- Pig is pink!
- Crab is red!
- The apple is red!
- The leaf is green!
- The flower is pink!
- The stem is green!
- The top is red!
- The spots are white!
- Pip is yellow!
- The beak is orange!

**Level 3 instructions (voiced)**

- The fish is orange. No orange!
- Let's make orange.
- No green! Let's make green.
- Let's make purple.
- No pink! Let's make pink.
- Stir!
- Red and yellow make orange!
- Blue and yellow make green!
- Red and blue make purple!
- Red and white make pink!
- Paint the fish orange!
- Paint the grapes purple!
- Make green!
- Make orange!
- Paint the turtle green!
- Paint the pumpkin orange!
- Paint the carrot orange!
- Now the top. Make green!
- Paint the top green!
- Paint a rainbow!

**Level 3 captions**

- We need green.
- We need orange.
- We need purple.
- We need pink.
- All gone. Make more!
- The fish is orange!
- The grapes are purple!
- The turtle is green!
- The pumpkin is orange!
- The carrot is orange!
- The top is green!

("Paint the frog green!", "Paint the pig pink!", "Frog is green!" and "Pig is pink!" are shared with Level 2.)

---

## 8. Technical notes

### 8.1 Painting onto a model: the paint surface (`paint-canvas.js`)

The toys are **flat cut-outs facing the camera**, so a straight-on planar projection has no stretching and needs no UV unwrapping in Blender.

1. **UVs in JS at load.** For a model with `extras.paint`, take the `skin` mesh's geometry and write a `uv` attribute from the model-space position: `u = (x − cx) / S + 0.5`, `v = (y − cy) / S + 0.5`, where `(cx, cy)` is the centre of the geometry's bounding box and `S = 1.04 × max(width, height)`. The 2D shape data is normalised with the same formula from the outline's bounding box, so canvas and mesh agree by construction. The side walls of the cut-out share the edge pixels, so paint wraps round the edge like real paint.
2. **Material.** Replace the toy's shared vertex-colour material with `toonUnique(0xffffff, { map: tex })`. The engine's `gradientMap` still gives toon shading and the ink hull outline is untouched. The `loop` layer keeps its normal material. `tex` is a `CanvasTexture`, `colorSpace = SRGBColorSpace`, `flipY` as needed to match step 1, `minFilter = LinearFilter`, `generateMipmaps = false` while it is being painted.
3. **Three canvases, 512 × 512, one working set for the whole game:**
   - `wood`: drawn once per toy. The wood tone, then 6 long, slightly curved grain lines 4% darker, 3 px wide, seeded by the round.
   - `paint`: transparent at first. Every mark is drawn here.
   - `lines`: drawn once per toy from the shape data. Part boundaries and details in burnt brown `#8a5a3a`, 5 px, round caps; eyes and smile in the engine's ink `#3a2838`.
   - The **visible** canvas (the texture's image) is `wood`, then `paint`, then `lines`, recomposed only inside the dirty rectangle of the new marks, then `tex.needsUpdate = true`. At most one upload per rendered frame, and none when nothing changed.
4. **Finger to canvas.** The toy is a plane: intersect the camera ray through the brush tip's screen position with the toy's front plane (the easel's plane, a `T.Plane` built once per round), convert the hit to the toy's local x, y, then to canvas pixels with the formula in step 1. No mesh raycast is needed.
5. **Marks.**
   - *Dab sprites*: per colour, pre-render one 64 px dab (a slightly irregular disc in the colour, with five 1 px streaks 10% lighter) and four splat sprites (128 px: a lumpy blob plus 3 to 5 satellite discs). Cache per colour.
   - *Stroke*: between the previous and the current tip position, draw a dab every 9 px, rotated to the direction of travel, scaled by the load (3.2) and ±12% with speed.
   - *Splat*: one splat sprite at a random multiple of 90° plus ±20°.
   - *Stamp*: a filled disc with 20 one-pixel notches round the edge.
   - *Clipping*: in the rounds that keep strokes inside a part, set a canvas clip path of that part's polygon (grown by 3 px) for the duration of the stroke. On the butterfly, draw each mark a second time mirrored in x.
   - Paint is opaque: `globalAlpha = 1`, normal compositing. There is no blending of colours on the toy.
6. **Coverage without reading pixels.** Per toy, a 48 × 48 grid over the canvas: `part[cell]` (which part the cell's centre is in, or none; filled once with point-in-polygon tests) and `colour[cell]` (index of the latest colour, or none). Each mark writes its colour index into the cells within its radius (respecting the clip). "Covered" and "this part is yellow" are counts over these arrays. Never call `getImageData`.
7. **When the toy is hung.** Draw the visible canvas into a fresh 256 × 256 canvas, make that the toy's own texture with mipmaps (`generateMipmaps = true`, `LinearMipmapLinearFilter`), and reuse the 512 working set for the next toy. Eight hung toys cost 8 × 256² × 4 bytes, about 2 MB.
8. **Picture cards** use the same drawing code: wood, then each part flood-filled with flat colour from the round's data, then lines, on a 256 canvas.

### 8.2 Shape data (`app/assets/paint-shapes.json`)

One entry per toy, in a unit square (0 to 1, y up):

```
"duck": {
  "outline": [[x, y], ...],            // closed polygon, 60 to 120 points, already rounded
  "parts":   { "body": [[x, y], ...] },// closed polygons; for a one-part toy, the outline itself
  "lines":   [ [[x, y], ...], ... ],   // open polylines: burnt details
  "eyes":    [[x, y, r], ...], "smile": [[x, y], ...],
  "rings":   [[x, y, r], ...],         // stamp targets (mushroom only)
  "hang":    [x, y],                   // where the twine loop attaches (top of the outline, above the centre of mass)
  "size":    [w, h]                    // world size, at most 1.3 each
}
```

`prop_paint.py` reads the same file for the prism outline and the loop position, so the model and its canvas cannot drift apart. Author the polygons in Python with the kit's `rounded()`, `circle_poly()` and `arc()` helpers and write the JSON from the same script (`build.sh prop_paint` writes both the `.glb` files and the JSON).

### 8.3 Tool handling

- Register one **finger proxy**: an empty `Object3D` at the centre of the play area with `input.addDrag(proxy, { radius: 3.4, feel: false, magnet: 0, sound: false, zones, onPick, onMove, onDrop })`. `onPick` / `onMove` give the finger's world position on the play plane; the lesson moves the active tool toward it with its own spring (12 Hz, critically damped) and the 0.3 s arrival glide. `onDrop` starts the set-down.
- Zones are the open pots, the dish, the toy and the tool block. Hit tests for pots and dish use the **finger** position; the mark position on the toy uses the **tip**.
- A tap is detected in the lesson (down and up within 0.25 s, less than 0.08 of travel), because the proxy is a drag target.
- The toy itself becomes a normal `addDrag` target (radius 0.8, `autoHome: true`, zone = the next peg) only in the hang phase, when the proxy is disabled. The friends and Pip keep their normal pokes.
- Set-down positions come from the easel's `ledgeL` / `ledgeR` anchors (clamp x between them) and from a line 0.35 behind the pot row. The lying brush is rotated flat on that surface with its ferrule touching it; check it at both ends of the ledge.

### 8.4 Faking the paint

- **Pot surface:** a tinted disc with a `paint` bone; the dip is a 6% scale squash. No fluid.
- **Loaded tip:** the `tip` layer's material colour, plus the `tip` bone's scale (1.15 loaded, 1.0 empty, interpolated with the load). Bare bristles are the cream base colour.
- **Mixing table** (a lookup, no colour arithmetic):

| A | B | Result | Hex |
|---|---|---|---|
| red `#ff5a5a` | yellow `#ffd23f` | orange | `#ff9a3d` |
| blue `#4a90ff` | yellow | green | `#5fd068` |
| red | blue | purple | `#9b6bff` |
| red | white `#ffffff` | pink | `#ff9ec4` |

  Ready-made pots in Level 1 and 2 use the same green, orange and pink, so the colour she mixes in Level 3 is exactly the colour she knew from the pot.
- **The dish swirl:** the dish's `well` layer gets a 128 × 128 canvas texture.
  - *One paint*: a lumpy filled shape covering the left 55%.
  - *Two paints*: the second covers the right 55%, drawn second, with a wavy edge.
  - *Stirring*: on each frame in which the tip moved inside the dish by angle `dθ` about the dish centre (or, for back-and-forth rubbing, by distance `d`, treated as `dθ = d / 0.3`), draw the canvas onto itself rotated by `dθ × 0.6` about the centre with `globalAlpha = 0.9` (this smears the two colours into spiral streaks), then draw a 10 px dab of each parent colour at the tip position (so there are always fresh streaks under the brush), then fill the whole well with the result colour at `globalAlpha = 0.05`. Progress is the sum of travel divided by 3.2.
  - *Release* (after the beat): fill with the result colour over 0.3 s (alpha steps), leaving three faint lighter streaks so it still looks stirred.
  - Upload this texture only on frames where it changed.
- **A used-up saucer:** the same dish with its well canvas redrawn as a thin smear (a crescent of the colour at 70% opacity over white).
- **Physics:** none needed. Nothing here falls or rolls, and Rapier adds nothing to paint. Everything rests on a surface by construction and moves on eased tweens. Do not call `physics.add` in this game.

### 8.5 Autoplay and QA hooks

| Hook | Meaning |
|---|---|
| `phase` | `'dip'`, `'paint'`, `'mixA'`, `'mixB'`, `'stir'`, `'hang'`, `'pickToy'`, or `'busy'` |
| `want()` | The key of the thing the current step needs: a colour key (`'red'`…), `'dish'`, `'toy'`, `'peg'`, or a toy key in `'pickToy'` |
| `act(key)` | Do that step as a child would, start to finish: `act('yellow')` dips, `act('dish')` dabs or stirs to completion, `act('toy')` paints the asked part (or 45% of the toy in a free round) with slow scripted strokes, `act('peg')` hangs it. A wrong colour key dips and paints one stroke, so the redirect can be tested. |
| `pots` | Array of `{ key, open, obj }` |
| `coverage(part?)` | 0..1, and `coverage(part, colourKey)` for the asked colour |

Add `'paint'` to `window.__seq` in `tools/autoplay.js` with a driver that loops `act(want())`.

### 8.6 Risks and how to avoid them

| Risk | Avoidance |
|---|---|
| Texture upload stutters on a modest laptop | One 512² texture is uploaded at most once per frame and only on frames with new marks. If `tools/qa-shots` timing shows frames over 20 ms while stroking, drop the working canvases to 384². The dish texture is 128². |
| Canvas and mesh do not line up (Blender's bevel and remesh shrink the outline slightly) | Both are normalised from their own bounding boxes with the same formula. Burnt lines are kept at least 0.03 inside the outline in the shape data. Check each toy in the viewer with a test canvas showing the part polygons in flat colours. |
| The finger proxy steals taps from Pip, the friend, or the hang-phase toy | Register it with the smallest radius that covers pots, dish, toy and tool block; disable it (`t.enabled = false`) in the hang and finale phases. If the engine picks the nearest target by distance to centre and that still misfires, see 8.7. |
| The brush hides the mark or the pot | Tip offset above the finger; handle leans away from travel; check with screenshots taken mid-stroke at the four corners of the toy and at each pot. |
| Paint looks like a flat sticker | Bristle streaks in the dab, the speed-varying width, paint wrapping the cut-out's edge, and the burnt lines staying on top. Compare a mid-stroke screenshot against the bar before building the levels. |
| White paint is invisible | It is only used on a red mushroom cap (stamped spots) and in the dish against red. White on bare wood is visible but dull, which is honest; the white pot is never open in a free round. |
| A child paints for five minutes and the level never moves on | That is fine and intended in Level 1. The 2 s pause rule ends the round the moment she stops. |
| A child never pauses with her finger up (rests a hand on the screen) | If a touch is held without moving for 4 s, treat it as up for the "done" timer. |
| She fills the duck with blue and will not change it | After the single redirect the right pot keeps bobbing; at the 20 s step the wrong pots get lids. Whatever blue remains outside the 60% stays on her duck. |
| The hang drag crosses depth (table to wall) and the toy clips the easel board | During the hang phase the toy is dragged on a plane 0.3 in front of the board; it eases back in z to the wall only in the last 0.3 s, once it is above the top edge of the board (pegs are all above y = 2.2; the board's top is at 1.75). |
| Stirring feels like a progress bar | The swirl is drawn from her actual motion (rotation follows her `dθ`, fresh streaks appear under her tip), so slow stirring looks slow and fast stirring looks fast. There is no meter. |
| Lines of the level's tune pile up with the friend's call | The call starts 0.3 s after the friend arrives, which is before the hang; the `sfx.step` belongs to the hang. They cannot overlap. |
| Too many voice lines in the mixing rounds | At most two voiced lines between her actions; the recipe line ("Red and yellow make orange!") is the one that must always be heard, so it is spoken after the beat with nothing else queued. |

### 8.7 Engine requests (small)

1. `creature.js` / `prop-models.js`: when a model has `extras.paint`, expose its `skin` mesh as `w.userData.skin` un-shared (its own geometry clone), so `paint-canvas.js` can add the `uv` attribute and swap the material without touching other instances. If that is already how `userData.skin` works for tinted props, nothing is needed.
2. Optional: `input.addSurface(obj, { radius, onDown, onMove, onUp })`, a target that reports the finger position without owning an object. The finger proxy in 8.3 works without it; this would only make it tidier.

---

## 9. Acceptance criteria

A strict reviewer checks these with `tools/qa-shots.sh paint <level> ...` and by playing.

**Painting**
1. A mark appears at the brush tip within one frame of the tip moving on the toy, and is visible above the fingertip (not under it) at every point on the toy.
2. A drag leaves a continuous stroke with no gaps at a finger speed of 3 units/s. A tap leaves one splat. A stamp leaves one crisp disc.
3. Paint never appears on the board, the wall or another toy, and never floats off the toy's surface. Paint reaches the cut-out's edge and wraps onto its side.
4. Eyes, smile and burnt lines are visible on top of any amount of paint.
5. In two-part directed rounds a stroke begun in one part does not colour the other.
6. Nothing the child painted is ever removed, faded, cleaned or changed by the game, in any level.
7. With the brush empty, no mark is made and the last-used pot bobs; a dip restores painting.
8. Frame time while stroking stays under 20 ms on the target laptop (no visible stutter).

**Tools and feel**
9. The brush is never seen hovering at rest: 0.5 s after any finger lift it is lying on the ledge or the table, or standing in the block, touching the surface without sinking into it.
10. The brush never jumps: every move between two places is a visible glide of at least 0.25 s.
11. No screenshot shows the brush, Pip, a friend or a card covering any part of a pot, the dish, a saucer or the toy from the camera's view (the brush tip over the thing being touched excepted).
12. No clipping in any screenshot: toy and board, loop and peg, tip and pot rim, lids, nested dishes, neighbouring toys on the wall.

**Flow**
13. Level 1 round 1 can be finished using taps only (tap pot, tap toy a few times, tap toy to hang).
14. A round never ends while a finger is down, and never sooner than the pause stated in 3.4.
15. Each action in table 3.8 gets a hand demo on the real object the first time, followed by the "Go!" badge, and again after 8 s without that action.
16. The toy is hung by the child's drag or tap; it travels the whole way in view and stays on its peg, still, for the rest of the level.
17. After every hang there is at least 1 s in which nothing moves but breathing.
18. The camera framing rules in 6.2 hold at 16:9 and 4:3 in every view.

**Learning**
19. Level 2: the round does not complete with the asked part in the wrong colour; it does complete at 60% of the asked colour whatever else is painted. A wrong colour produces exactly one head-shake per round and no blocked action.
20. Level 2 round 7: exactly three stamps are counted, each on its ring, with "One.", "Two.", "Three!" in order; a fourth stamp is allowed and not counted.
21. Level 3: each pair in the table in 8.4 gives exactly the listed colour, the same hex as the Level 2 pot of that name. No other pair can be made in any round.
22. Level 3: the new colour appears only after the child's own stirring (or stir taps), preceded by a beat; the recipe line is spoken in full every time a colour is mixed for the first time in the level.
23. Level 3 rounds 4, 5 and 7: mixing the "other" colour produces that colour truthfully, the dish joins the saucer row, a fresh dish arrives, and the round carries on.
24. Each recipe saucer shows its two parent dots and stays in place to the end of the level.

**Sound and voice**
25. The only game sounds are `plip`, `swish`, `pat`, `sfx.step`, the lid `tok`, `sfx.nope`, one call per friend reaction, and the engine's finale sounds. No boing, chime, fanfare, confetti or praise word in any round.
26. With the sound muted the round is still clear and satisfying (mute test).
27. Every line in 7.3 exists in `tools/voice/new-lines.txt` exactly as written, and no spoken line appears in the game that is not in 7.3.
28. No voiced line repeats within a round; colour names are spoken once per colour per level.

**Ending**
29. The finale frames all eight toys on the wall with nothing in front of them; each can be poked and sounds its note; the admire lasts at least 5 s; the photo saved to the gallery shows the wall.
30. Levels 1, 2 and 3 look different at a glance in their first screenshot: one pot and a ball; two pots, a duck and Duck; a dish, a dish stack and no green pot.
31. All 24 rounds complete under autoplay (`act(want())`) with no console errors, and `physics` is never used.
