# 🔷 Shape puzzles (`puzzles`): design

Suggested registration: `id: 'puzzles'`, title "Shape puzzles", name "Puzzles!", icon 🔷, colour `#3fb6a8`, world `build` (Building site, "making") unless the integrator has a new world for the five deep games. 10 puzzles per level (override `totalRounds` to 10).

## 1. Pitch and references

**Pitch.** Pip rolls up on a little cart with one wooden shape; the child presses it into its hole on a long wooden picture board, and the picture grows left to right, one piece per puzzle, until she has made a whole garden, a rocket night or a robot.
From puzzle to puzzle the shape gets a little harder to *get to* or the hole a little harder to *find*: more holes, a lid over the hole, the shape shut in a box, a block sitting in the hole, then real tools (a string, a key, a peg).

| Reference | What we take |
|---|---|
| **Busy Shapes (Edoki)** | One object, one hole, no words needed; then holes among other holes, lids, containers, an obstacle to move first; many very short puzzles; the game quietly eases when the child struggles. |
| **Piaget (the theory behind it)** | The ladder itself: means-end (remove the obstacle, pull the string), object permanence (hole under a lid, shape in a box, shape under a cup that then moves), tool use (key, peg). |
| **Pok Pok** | Wooden-toy look, almost silent, nothing flashes, nothing times out. |
| **Thinkrolls** | "Something is in the way: move it first", and one gravity puzzle (ball rolls when the peg is pulled). |
| **Sago Mini / Toca** | A friend who watches and reacts (Pip, and the sun / moon / robot the child herself put in the picture); nothing the child made is ever taken away. |
| **Wooden lift-out peg puzzles** | The press-fit: the piece turns to match, sinks in with one wooden note and stays as part of a picture. |

**How it differs from Shape house (`shapes`, meadow).** Shape house is a *matching* game: one piece, 2 to 4 windows, six rounds, physics gags and goodies. Shape puzzles is a *problem-solving* game: from Level 1 puzzle 4 the question is "which hole?", from Level 2 it is "what must I do first?". It is calm (no gags, no spills), close-up, 30 puzzles long, uses six shapes and two sizes, and ends with a picture the child built.

## 2. Learning goals

| Goal | Topic id | Where |
|---|---|---|
| Recognise and name circle, square, triangle (L1), rectangle, star (L2), heart (L3); a turned shape is the same shape | `mt_KJeEeTutJI` 2-D shapes | every fit; the name is spoken at the moment it clicks in |
| When it does not work, try something else (another hole; open, move, pull) | `mt_95zxYqpP7m` Trying a new approach | from L1 P4; the core of L2 and L3 |
| What do I need to do first? Two- to four-step plans | `mt_QR3vxbN1o4` Planning a task | L2 P4 onward |
| Something hidden is still there: remember where the hole or shape went, even after it moved | `mt_AzNSWFgtxC` Remembering visual forms | L2 P4 to P7, P10; L3 P2, P6, P9 |
| Shapes join to make things (square + triangle = bird house) | `mt_XjwUlmxdCT` Combining simple shapes | the picture; finale |
| Big and small; "Too big!" | `mt_NtJYlJdUe9` Measurable attributes of objects | L3 P5 to P8 |
| Use a thing to get a thing (string, key, peg) | `mt_20WfHhnL39` Hands-on problem solving (stretch; listed for age 5+, so keep out of `meta.js` if the integrator wants age-true ids only) | L3 P4, P7 to P10 |

`meta.js` topics: the first four rows, plus `mt_XjwUlmxdCT`.

## 3. The scene and the core loop

### 3.1 The fixed stage (same in every level)

All coordinates are world units. The board face is the plane z = 0; +z is toward the camera.

- **Picture board.** Wooden board, x from -6.8 to 6.8, y from 0.8 to 5.2, 0.3 thick, with a 0.12 rim and two A-frame feet. The **skirt band** (y 0.8 to 2.4) is plain wood. The **picture band** (y 2.4 to 5.2) carries a pale painted scene and ten shape-shaped **recesses** (0.16 deep), one per puzzle.
- **Recess floor.** Each recess has a floor tile (the same shape). **Closed** = floor flush with the board face (the hole does not exist yet, only a faint dotted outline). **Open** = the floor sinks 0.16 over 0.4 s. This is how holes appear, and how extra holes are taken away when the game eases.
- **Ledge.** A shelf along the bottom of the board, top at y = 0.8, z from 0 to 1.2.
- **Cart.** A low wooden cart on the ledge: deck from cx-2.0 to cx+2.0, deck top y = 1.0. Four slots on the deck at cx-1.5 (A), cx-0.5 (B), cx+0.5 (C), cx+1.5 (D). Pip rides on a step at the left end (cx-2.45). A shallow **tidy tray** is at the right end (cx+2.45). Everything on the cart stays below y = 2.4, so the cart can never cover a hole.
- **Shed.** A small toy shed at the right end of the ledge (x 7.6 to 9.4). The cart lives there; it drives in and out of the shed door between puzzles, off-frame, so nothing ever pops in or out.
- **Drag plane.** Every draggable sits and moves at z = 0.5 (the engine drags in x and y at the object's z). Pieces are 0.22 thick; a seated piece stands 0.06 proud of the board.

### 3.2 One puzzle, moment by moment

| t | What happens | Feedback |
|---|---|---|
| 0.0 | Camera is already gliding to this station (0.9 s). The cart rolls in from the right at walking pace (1.8 units/s), wheels turning, Pip riding, carrying the piece and this puzzle's fittings. | Silent. Pip looks at the piece. |
| ~1.2 | Cart stops. The puzzle's holes open (floors sink, 0.4 s). Any "watch this" hiding happens now (piece sinks into the box, cup lowers). | One soft wooden `lidLift` for a hiding move; nothing for holes. |
| ~1.8 | Only if this puzzle has a **new** action: the voice line, then a slow ghost-hand demo on the real objects (max 2.4 s, touches ignored). | Voice once. The thing to use bobs 0.05 once. |
| then | **Go!** badge. Her turn. No timer, ever. | - |
| play | See 3.3 for every interaction. | - |
| fit | Right piece released over its hole. | See "fit" row in 3.3. `payoffP` = seat + friend reaction (about 1.2 s). |
| +1.2 | `success(holePos, '<Shape>!', { voice: true })`, then 1 s of stillness. After 0.9 s the caption changes to the picture word ("The sun!", caption only). | Pip: one nod (`pipWatch`). |
| +2.2 | Cart rolls off right into the shed (about 1 s), camera glides to the next station, cart rolls back in with the next puzzle. | Silent. |

Typical puzzle: 8 to 25 s of play plus 4 s of calm transition. A level is 4 to 6 minutes.

### 3.3 Every interaction and its exact feedback

| Action | Visual / animation | Sound | Voice / caption |
|---|---|---|---|
| **Pick up a piece** | Engine grab feel (squash-lift, spring carry). The stand it left stays. | `sfx.pup` (engine default) | none |
| **Carry near the right hole** (`onNear k`) | Engine magnet 30%. The piece turns toward the hole's angle in proportion to k (fully aligned at k = 0.7). The hole's floor glows 15% warmer. | none | none |
| **Fit** (release on the right hole) | Piece hovers 0.15 s (the beat), then sinks in over 0.18 s to 0.06 proud; the hole rim dips 2% and returns (0.25 s). The face friend (sun / moon / robot) does `joy` for 1 s; Pip nods. The piece stays for the whole level. | `sfx.step(i, 10)`, i = pieces placed so far: the level is a rising tune, the tenth piece lands on the top note. This is the only sound. | Voiced shape name, e.g. "Circle!"; 0.9 s later caption-only picture word. |
| **Wrong hole** (wrong shape or too big) | The piece goes to the hole, stops against the rim (z = 0.2), rocks 6 degrees once, and walks home to its stand on a low arc (0.5 s). `redirect(line, { obj: piece })`. No face goes sad. | `sfx.nope`, soft | Caption only: "Try another hole!". Too big: "Too big!" (voiced the first time). |
| **Drop on nothing** | `autoHome`: walks back to the stand, 0.5 s arc. | none | none |
| **Tap a hole while a free piece waits** (tap fallback) | The piece travels to that hole by itself on a 0.8 s arc and tries to fit (same right / wrong results). | as above | as above |
| **Tap the piece** | Press-in only; after two taps in a row the ghost hand shows the drag again. | none | none |
| **Lid** (drag its knob off, or tap it) | The lid lifts 0.15 off its feet and follows the finger. Release anywhere but back on its hole and it travels to the tidy tray on a 0.6 s arc and stays there. Release back on the hole and it covers it again (she may play peekaboo). The uncovered hole's floor is already down. | `lidLift` on lift; engine landing sound in the tray | none |
| **Piece pushed at a covered or plugged hole** | Piece bumps and walks home; the lid / plug rattles 4 degrees twice and its knob glows for 1.5 s. | `sfx.nope` | Caption only: "Open the lid!" / "Take the block out!" |
| **Plug** (the block sitting in a hole) | Same as a lid: drag it out, it goes to the tidy tray. Tap: it wiggles, then the ghost hand shows the drag. | `sfx.pup`, tray landing | none |
| **Box** (tap the box, or drag its lid knob up) | `beat(box, 0.45)`, then the hinged lid swings back 110 degrees over 0.5 s and stays; an inner lift raises the piece until 70% shows above the rim. The piece is now draggable. | `boxOpen` | Caption only "Here it is!" (or "Not in here!" for the empty box; it stays open) |
| **Cup** (tap, or drag up) | `beat(cup)`, then the cup tilts back on its arm (0.5 s) and stays up. | `lidLift` | as box |
| **Glass case + string** (drag the ring down) | The ring moves only down (0.8 travel); the glass pane rises 1.25 in proportion, so her finger is lifting the glass. Let go early: the ring and glass ease back over 0.6 s. Pull to the end: 0.3 s beat, the latch clicks, the glass stays up, the ring stays down. | `ratchet` tick every 0.2 of travel; `latch` at the end | none |
| **Piece touched behind glass** | The piece wiggles, the glass shows a white glint for 0.4 s, the ring bobs. | `glassTink` | "It is behind the glass!" (voiced once per level) |
| **Lock box + key** (drag the key to the padlock) | Near the lock (`onNear`) the key turns to point at the keyhole. On release it slides in, turns 90 degrees (0.4 s), `beat`, the padlock swings open and the glass door swings aside 110 degrees (0.6 s). The key stays in the lock. | `sfx.tick` on the turn, `latch` | none |
| **Locked piece touched** | Piece wiggles, padlock rattles and glows. | `glassTink` | "It is locked!" (voiced once per level) |
| **Peg** (drag it 0.4 in any direction, or tap) | The peg pops out and goes to the tidy tray; after a 0.3 s beat the ball rolls out of the clear tube, down the ramp (about 1.2 s) and settles in the cradle. | `sfx.pup`; `roll` while rolling | none |
| **Poke Pip, the cart, a placed piece** | Soft press; a placed piece sounds its own note. | its note | none |

### 3.4 Showing how, and never being stuck

- **Demo** (`showHint`): a slow ghost-hand drag or tap on the real objects the first time each action appears **in the level being played** (levels are self-contained), then "Go!".
- **Stuck 8 s:** the demo for the *current step* plays again (the game always knows the current step: `want()`), and that step's object bobs.
- **Stuck 20 s, or two wrong holes** (`makeErrorless`): every open hole except the right one closes (floor rises, 0.4 s), the right one gets a soft halo, and for chain puzzles only the current step's object is touchable.
- **Stuck 30 s:** the *preparing* step does itself slowly (the lid lifts and goes to the tray, the box opens). The game never does the final fit for her.
- **Quiet adapting (Busy Shapes style):** if two puzzles in a row needed the 20 s help, the next puzzle opens only its own hole. One clean puzzle restores the plan.
- `nudgeTarget()` returns the current step's object (lid, plug, box, cup, ring, key, peg, or the piece).

## 4. Progression: all 30 puzzles

Notation. Hole = centre (x, y) of the recess. Size = width (w x h for rectangles and triangles). "Open" = holes whose floors are down when the turn starts (the target plus lures; an opened hole stays open until filled). cx = cart centre; slot letters as in 3.1. The piece always starts on a stand on the cart unless a fitting holds it.

Lure rule (applies everywhere): a wrong hole is only ever open if the piece **cannot geometrically go into it**. A small piece is never offered while a bigger hole of a shape it would slip into is open.

### Level 1: "The sunny garden" (circle, square, triangle)

Pale sky-blue board, green painted hill. One step per puzzle: fit. The only question that grows is "which hole?". Holes for P1 to P5 have their floor tinted in the piece's colour; from P6 the floors are plain wood.

| # | Piece (shape, colour, size) | Picture part and hole | Open holes | Cart | What is new / harder | Solution |
|---|---|---|---|---|---|---|
| 1 | Circle, yellow, 1.2, with a face | The sun (-5.6, 4.2) | sun | cx -4.1, piece at A (right under the hole) | First fit. Demo. Voice: "Put the shape in its hole!" | Drag straight up. |
| 2 | Square, blue, 1.1 | A toy crate on the grass (-4.4, 3.0) | crate | cx -4.1, piece at C | Diagonal, short drag. | Drag up and left. |
| 3 | Triangle, orange, 1.4 x 1.2 | A tent (-2.8, 3.05) | tent | cx -2.8, piece at A, **tilted 35 degrees** | The piece turns itself as it nears the hole. | Drag up and right. |
| 4 | Circle, green, 1.5 | A tree top on a painted trunk (-1.1, 4.0) | tree, bird-house body (square) | cx -0.3, piece at B | **First choice: two holes.** Colour helps. Voice: "Which hole fits?" | Circle into the round green hole. |
| 5 | Square, red, 1.0 | Bird-house body on a painted post (0.6, 3.4) | body, roof (triangle) | cx 0.6, piece at D | Two holes; the wrong one is directly above the right one. | Square into the lower hole. |
| 6 | Triangle, blue, 1.4 x 0.9 | Bird-house roof (0.6, 4.45) | roof, ladybird (circle) | cx 1.2, piece at A, **upside down** | Colour hints end. The piece turns 180 degrees as it nears. | Triangle onto the square: a little house. |
| 7 | Circle, red with painted spots, 1.1 | A ladybird on a leaf (2.2, 3.0) | ladybird, kite (square turned 45 degrees) | cx 2.4, piece at C | The nearer-looking hole above the piece is the wrong one. | Circle into the low hole. |
| 8 | Square, purple, 1.0 | A kite, a diamond hole (3.3, 4.2), painted tail | kite, sail (triangle), ball (circle) | cx 4.1, piece at A | **Three holes**, and a square that must turn to a diamond. | Square into the diamond; it turns 45 degrees. |
| 9 | Triangle, white with a red stripe, 1.1 x 1.3 | A sail above a painted boat (4.7, 3.5) | sail, ball | cx 4.1, piece at D, **right under the wrong hole** | Must pass the near hole and choose the far one. | Triangle up and left to the sail. |
| 10 | Circle, striped beach ball, 1.0 | A ball on the grass (5.9, 2.95) | ball | cx 4.1, piece at A | Easy last one; the longest drag (3.3 across). | Drag right. The tune reaches its top note. |

### Level 2: "The rocket night" (adds rectangle and star; hidden things)

Navy board with painted dots of starlight. Fits are easy; the thinking is **finding**: the hole is under a lid, the shape is in a box, a block sits in the hole. The three lids (P4, P5, P10) and two plugs (P8, P9) are on the board from the start of the level.

| # | Piece | Picture part and hole | Open holes | Cart and fittings | Steps (what is new in bold) | Solution |
|---|---|---|---|---|---|---|
| 1 | Circle, cream, 1.3, with a sleepy face | The moon (-5.6, 4.1) | moon, star A | cx -4.1, piece at B | Fit. Demo. Voice: "Put the shape in its hole!" | Circle to the round hole. |
| 2 | **Star**, yellow, 1.25 | Star A (-4.1, 3.1) | star A, rocket body (rectangle) | cx -3.4, piece at D | New shape. Fit names it: "Star!" | Star to the star hole. |
| 3 | **Rectangle**, white with a painted window, 1.1 x 1.3 | Rocket body (-2.5, 3.35) | body | cx -2.5, piece at A, **lying on its side** | New shape; it stands up as it nears. "Rectangle!" | Drag up and right. |
| 4 | Triangle, red, 1.0 x 0.75 | Rocket nose (-2.5, 4.5) | nose, **under a lid that sits crooked so a corner of the hole shows** | cx -2.5, piece at C | **Lid.** Voice: "Open the lid!" Demo: drag the lid to the tray. | Lid off, then triangle in: a rocket. |
| 5 | Circle, blue and green, 1.3 | The Earth (-0.7, 3.9) | Earth **under a flat lid, nothing showing**; star B open and empty | cx -0.7, piece at A | No words. The only visible hole is a star: her hole must be under the lid. | Lid off, circle in. |
| 6 | Star, pale yellow, 0.9 | Star B (0.9, 4.4) | star B, flag (triangle) | cx 0.9, red **box** at B, lid open, star showing | **Box.** She watches the star sink in and the lid close. Voice: "Where did it go?", then "Open the box!" Demo: tap the box. | Tap box, drag star to its hole. |
| 7 | Triangle, green, 1.0 x 0.9 | A flag on a painted pole, hole points right (2.0, 3.2) | flag; planet hole visible but plugged | cx 2.0, red box at A, blue box at C; the piece is seen in the **blue** one, then both close | Two boxes: remember which. Voice: "Where did it go?" The piece turns 90 degrees as it nears. | Open blue, drag flag in. (Red first is fine: "Not in here!") |
| 8 | Circle, purple, painted ring on the board, 1.2 | A planet (3.3, 4.2) | planet, **with a grey plug in it** | cx 3.3, piece at B | **Obstacle.** Voice: "Take the block out!" Demo: drag the plug to the tray. | Plug out, circle in. |
| 9 | Square, silver-grey, 0.9 | A satellite (4.5, 3.2) | satellite (plugged); panel hole under a lid | cx 4.1, piece at A | No words. Two closed things: one hides the wrong hole. Opening the lid first is fine (rectangle hole: bump, try again). | Plug out, square in. |
| 10 | Rectangle, blue with painted lines, 1.3 x 0.7 | The satellite's panel (5.75, 3.2) | panel (under its lid, unless she already removed it in P9) | cx 4.1, red box at B; she watches the piece sink in, standing upright | **Three steps, all known:** box, lid, fit. The piece lies down as it nears. | Open box, lid off (either order), rectangle in. |

### Level 3: "The robot's party" (adds heart, big and small; tools)

Warm cream board, painted bunting. Known hides return in combination, then three tools: a string that lifts glass, a key, a peg that frees a ball.

| # | Piece | Picture part and hole | Open holes | Cart and fittings | Steps (new in bold) | Solution |
|---|---|---|---|---|---|---|
| 1 | Square, teal, 1.0, with a robot face | Robot's head (-4.9, 3.95) | head, body | cx -4.1, piece at C | Fit. Demo. Voice: "Put the shape in its hole!" | Square to the upper hole. |
| 2 | Rectangle, teal with painted buttons, 1.4 x 0.9 | Robot's body (-4.9, 2.9) | body | cx -4.1, red box at C; watched going in | Box again. Voice: "Open the box!" Demo. | Open box, rectangle in. |
| 3 | Triangle, yellow, 0.9 x 0.6 | Party hat (-4.9, 4.72) | hat, **under a lid, and under the lid a plug** | cx -4.1, piece at D | Lid then obstacle: one surprise behind another. Voice: "Open the lid!"; when the plug shows: "Take the block out!" | Lid off, plug out, triangle in. |
| 4 | **Heart**, red, 1.1 | A heart balloon on a painted string to the robot's hand (-3.2, 4.2) | heart | cx -3.2, **glass case** over B and C with the heart inside, ring at D | **Tool: pull the string.** Voice: "Pull the string!" Demo: drag the ring down. New shape: "Heart!" | Pull ring to the end, take heart, fit. |
| 5 | Star, yellow, **1.3** | A big star (-1.5, 4.2) | big star, small star | cx -1.2, piece at A | **Big and small.** The small hole refuses it: "Too big!" | Big star to the big hole. "A big star!" |
| 6 | Star, yellow, **0.8** | A small star (-0.2, 3.3) | small star | cx -0.2, piece on the deck at B, cups on arms behind B and C | Cups lower over the star and the empty spot, then **slowly swap places once** (1.2 s). Voice: "Where did it go?" | Lift the cup now at C, star in. "A small star!" |
| 7 | Circle, orange, **1.2** | A big ball (1.3, 3.1) | big ball, small ball | cx 1.5, **lock box** over A and B with the ball inside, key on a hook post at D | **Tool: key.** Voice: "Use the key!" Demo: drag key to padlock. Small hole: "Too big!" | Key to lock, take ball, big hole. "A big circle!" |
| 8 | Circle, green, **0.75** | A small ball (2.7, 2.85) | small ball | cx 2.7, **ramp**: ball in a clear tube at A behind a red peg, slope down to a cradle at D | **Tool: peg.** Voice: "Pull the peg out!" Demo. The ball rolls by itself (gravity). | Peg out, wait, take ball from the cradle, fit. "A small circle!" |
| 9 | Rectangle, orange, painted wheels on the board, 1.5 x 0.8 | A wagon (4.2, 3.1) | wagon | cx 4.1, wide lock box over A and B; the key lies on the deck at D and a **cup lowers over it** while she watches | Four steps: find the tool, use the tool. Voice: "Where is the key?" | Cup up, key to lock, take rectangle, fit. |
| 10 | Square, pink with a painted bow, **0.8** | A present (5.7, 2.9) | present, under a lid | cx 4.1, glass case over B and C, ring at D | No words. String again, plus a hidden hole. | Pull ring, lid off (either order), square in. "A small square!" |

### Variety (why no two puzzles feel the same)

- The camera moves on after every puzzle, and each one adds a different named thing to the picture.
- Start slot, drag direction and distance change every time (see the tables).
- Six shapes, two sizes, ten colours, four ways a piece turns to fit (35, 45, 90, 180 degrees).
- Nine kinds of step (fit, choose, lid, box, which-box, plug, cup, string, key, peg), never more than one new kind per puzzle, and each new kind is followed by a puzzle that uses it without words.
- Every level opens with a plain fit and ends on a short, sure success.

## 5. Satisfaction beats and the ending

- **Build-up object:** the picture. Ten pieces, each placed by her own hand, none ever removed. End-frame test: the finished picture is the frame.
- **The finger does it:** every lid, plug, ring, key, peg and piece moves under her finger; the glass rises exactly as far as she pulls.
- **Beats:** 0.15 s hover before a piece sinks; `beat()` before a box or cup reveals, before the latch, and before the ball rolls.
- **A friend reacts:** the first piece of each level is a face (sun, moon, robot head). From then on it is the one who beams (`joy`, 1 s) at each new piece. Pip only nods.
- **Stillness:** 1 s after every fit with nothing moving.
- **Sound:** one rising note per piece; the ten notes are the level's tune. Mute test: the turn-and-sink press-fit carries the round.
- **Finale ("look what you made")**
  1. `onFinale()`: the cart rolls to cx = 0 and stops; the face friend holds `joy`; say "You made a garden!" / "You made a rocket!" / "You made a robot!" (voiced).
  2. `showOff()`: camera glides back over 1.2 s to the whole board (`creationView`: pos (0, 3.4, 11.6), look (0, 2.95, 0), the board fills the width).
  3. Admire, 5 s (`admireTime = 5`): the ten pieces are `creationObjects()`. Poking a piece presses it in and plays its note, so the picture is a ten-note instrument, low on the left to high on the right. Poking the face friend also makes it blink.
  4. Engine photo, sticker, home. `finaleRain = false` (calm ending).

## 6. Characters and staging

- **Pip** rides the step at the left end of the cart, facing the board, at z = 0.6. He never leaves the cart, never stands in the picture band and is never between a piece and a hole (holes are all above y = 2.4; Pip and everything on the cart are below it). He looks at the finger (engine look-at), nods at a fit, and tilts his head at a wrong hole. Scale Pip so his top is at or below y = 2.2.
- **Face friends:** sun (L1), moon (L2), robot head (L3): a code-drawn face on the piece with `calm`, `joy` and a blink.
- **No other characters.** The level stays quiet.
- **Camera**
  - Level start: the whole board for 1.5 s ("Let's make a picture!"), then a 0.9 s glide to station 1.
  - Station view: frame the box that contains the cart (cx - 2.8 to cx + 2.8, y 0.6 to 2.4) and every open or lidded hole of this puzzle, plus a 0.35 margin; never less than 3.6 tall. Camera 0.5 above the box centre, looking at it, so the top of the ledge shows. This gives a view 3.6 to 4.8 units tall: the cart-to-hole work area fills 70 to 85% of the screen height.
  - The view does not move during a puzzle. Between puzzles one 0.9 s glide (`glideCamera`).
  - Finale: as in section 5.
- **Targets stay unblocked:** the cart is capped at y = 2.4; lids stand on feet 0.07 proud so they never cut into a neighbouring piece; a lid is sized to its hole plus 0.12 and must not overlap an already-filled recess by more than its margin; removed lids and plugs go to the tidy tray, never onto the board; the ghost hand is DOM-only.

## 7. Assets

### 7.1 Blender models (new script `tools/blender/creatures/prop_puzzles.py`; all white-paintable so code can tint)

| Model | Description |
|---|---|
| `prop_pz_board1`, `_board2`, `_board3` | The board for each level: 13.6 x 4.4 x 0.3, rounded rim, two A-frame feet, the ledge with three brackets, and the ten recesses cut through the face (0.16 deep, 0.04 clearance, slightly rounded lips). Hole positions come from `app/src/lessons/puzzles-layout.json`, which the game reads too. Front face UV-mapped flat for the painted scene. |
| `prop_pz_circle`, `_square`, `_triangle`, `_rect`, `_star`, `_heart` | Chunky wooden pieces, 1.0 nominal, 0.22 thick, generous bevel, soft rounded corners (star and heart especially plump). Also used, tinted board colour, as recess floors. |
| `prop_pz_cart` | Low wooden cart: deck 4.0 x 0.9, four small wheels as separate nodes (`wheel1..4`) so they turn, a step-seat for Pip at the left end, a shallow tidy tray at the right end. |
| `prop_pz_shed` | Small toy shed with an open doorway the cart fits through, pitched roof. |
| `prop_pz_stand` | A low cradle with a soft notch that any piece leans in. |
| `prop_pz_lid` | Rounded-square wooden cover, four tiny feet, a round red knob. Scaled per hole. |
| `prop_pz_plug` | Grey-blue round bung, 0.6 across, red knob. |
| `prop_pz_box` | Toy box, inner 1.5 wide x 1.15 tall; hinged lid (node `lid`), inner lift platform (node `lift`). Tinted red or blue. |
| `prop_pz_cup` | Upturned cup with a knob, on a hinged arm (node `arm`) fixed behind the slot. |
| `prop_pz_case` | Glass case: wooden frame 2.1 x 1.35, sliding pane (node `glass`), pulley arm, cord, ring (node `ring`, big, red). |
| `prop_pz_lockbox` | Glass-front box: frame 1.9 x 1.3, door (node `door`, hinged left), chunky padlock (nodes `lock`, `shackle`) with a clear keyhole. |
| `prop_pz_hook` | Short post with a hook for the key. |
| `prop_pz_ramp` | Sloping track 3.4 long (8 degrees), a clear tube section at the high end (node `tube`), a cradle at the low end. |
| `prop_pz_peg` | Red peg with a round knob. |
| Reuse | `prop_sinkkey` (the key, tinted gold), `pip`. |

Code-made canvas textures (allowed): the three painted board scenes; the small decals on pieces (faces, ladybird spots, ball stripes, sail stripe, rocket window, panel lines, robot buttons, bow); glass is a transparent toon material with a white edge line.

### 7.2 Sounds

| Sound | Use | Source |
|---|---|---|
| `sfx.step(i, 10)` | every fit | engine |
| `sfx.pup` | pick up piece, plug, peg | engine |
| `sfx.nope` | wrong hole, bump on lid or plug | engine |
| `sfx.tick` | key turn | engine |
| landing thunk | lid / plug / peg into the tidy tray | engine physics |
| `lidLift` | lid lifts, cup lifts, piece sinks into box | new CC0: soft wooden knock |
| `boxOpen` | box lid opens | new CC0: soft wooden hinge and knock |
| `ratchet` | string pull, one tick per 0.2 travel | new CC0: soft wooden click |
| `latch` | glass latched, padlock opens | new CC0: one clean click |
| `glassTink` | touching the piece behind glass or lock | new CC0: quiet glass tink |
| `roll` | ball on the ramp (about 1.2 s) | new CC0: wooden ball rolling |

No boings, no chimes, no confetti. The cart, holes opening and the camera are silent. New sounds go in `puzzles-sound.js` and respect `effectsHushed()`.

### 7.3 Voice lines (exact text; V = spoken, C = caption only)

Instructions (V, each spoken only when its action first appears in the level, and again only through the 6 s cue):
1. Let's make a picture!
2. Put the shape in its hole!
3. Which hole fits?
4. Open the lid!
5. Where did it go?
6. Open the box!
7. Take the block out!
8. Pull the string!
9. Use the key!
10. Where is the key?
11. Pull the peg out!

Shape names at the fit (V):
12. Circle!
13. Square!
14. Triangle!
15. Rectangle!
16. Star!
17. Heart!
18. A big star!
19. A small star!
20. A big circle!
21. A small circle!
22. A small square!

Feedback (V the first time in a level, then C):
23. Too big!
24. It is behind the glass!
25. It is locked!

Feedback (C):
26. Try another hole!
27. Not in here!
28. Here it is!

Picture words (C, 0.9 s after the shape name):
29. The sun!
30. A crate!
31. A tent!
32. A tree!
33. A bird house!
34. A roof!
35. A ladybird!
36. A kite!
37. A sail!
38. A ball!
39. The moon!
40. A rocket!
41. The Earth!
42. A flag!
43. A planet!
44. A satellite!
45. A robot!
46. A party hat!
47. A balloon!
48. A big ball!
49. A small ball!
50. A wagon!
51. A present!

Finale (V):
52. You made a garden!
53. You made a rocket!
54. You made a robot!

("Look what you made!" is the engine's line.) Add all 54 to `tools/voice/new-lines.txt`.

## 8. Technical notes and risks

**Files:** `puzzles.js` (lesson), `puzzles-plan.js` (the three tables above as data), `puzzles-layout.json` (hole shapes, positions, sizes, angles; shared with Blender), `puzzles-parts.js` (cart, fittings, step logic), `puzzles-art.js` (canvas scenes and decals), `puzzles-sound.js`.

**Step machine.** Each puzzle is a list of steps; a step has `kind` (`fit`, `lid`, `plug`, `box`, `cup`, `ring`, `key`, `peg`), its object, and `needs` (steps that must be done first). Steps with no unmet needs are live; `want()` returns the first live step. Steps marked "either order" in the tables have no dependency on each other.

**Autoplay hooks** (add to `tools/autoplay.js` and the hooks table): `phase` (`'step'` when waiting), `want()` (returns `{ kind, obj }`), `act(obj)` (performs that step the tap-fallback way; a wrong object redirects), `piece`, `zones()` (`z.hole.userData.kind`, `.size`, `.open`), `drop(zone, { tapped })`.

**Physics (small and safe).**
- Pieces, lids on the board, the box lift, cups, glass and door are tweened, not simulated. A fit is a tween to the recess, so a piece can never jam, tilt or fall.
- Tidy tray: `physics.container` at the tray; removed lids, plugs and pegs go in with `physics.toss` and settle. Remove their bodies when the cart enters the shed.
- Ramp ball: `physics.add(ball, { shape: 'ball', planar: true })` on a static box for the slope, with end stops. If it has not reached the cradle in 2.5 s, tween it there along the slope. Remove the body once it rests, then make it draggable.
- No physics on the board face; never `physics.clear()` between puzzles.

**Faking things.**
- Glass: transparent toon material (opacity 0.22), white edge line, a glint sprite that slides across when touched.
- Cord: a thin tube whose length is set from the ring's y each frame; the pane's y = ring travel x 1.56.
- Holes opening: move the floor tile in z; no geometry changes.
- Turn-to-fit: in `onNear`, blend the piece's rotation.z toward the hole's angle by `min(1, k / 0.7)`, choosing the nearest equivalent angle for the shape's symmetry (square 90, triangle 360, rectangle 180, star 72, circle none).
- Constrained drags (ring: down only; box lid and cup: up only): `addDrag` with `magnet: 0, feel: false`, and clamp the object's position in `onMove`.

**Risks and how to avoid them.**

| Risk | Avoidance |
|---|---|
| The engine drags only on a vertical plane (`screenToPlaneZ`), so a table-top board would need an engine change | The board stands upright; everything draggable shares z = 0.5. No engine change needed. |
| Board cut-outs drift from the game's hole positions | One shared `puzzles-layout.json`; a dev check that each floor tile sits inside its cut-out within 0.05. |
| A piece looks as if it should fit a wrong hole | The lure rule in section 4; a unit test over the plan checks every open wrong hole against the piece's size at all its symmetric angles. |
| Clipping (lid against a neighbouring piece, piece through a lid, Pip through the cart) | Lids on 0.07 feet; carried pieces at z = 0.5, in front of every board fitting (all at most 0.3 proud); cart parts capped at y = 2.4; check all 30 stations with `tools/qa-shots.sh`. |
| A lid or the glass pane covers a filled neighbour while moving | Lids travel toward the camera first (z + 0.3) and then to the tray; the pane is transparent. |
| Chain puzzles confuse a 2-year-old | One new step kind per puzzle; a wordless repeat after each; the 8 s re-demo is always for the current step; the 30 s self-help. |
| Ten rounds is long for some days | Each puzzle is 10 to 25 s; leaving early is fine; the 45 s engine ladder still goes home. |
| The ramp ball sticks or flies off | Planar body, end stops, 2.5 s tween fallback. |
| Modest laptop | One board, at most 25 props on screen, one or two rigid bodies at a time, three 2048 x 664 canvas textures made once per level. |
| Voice fatigue | Most puzzles have no instruction line at all; shape names are one or two words; picture words are caption only. |

Engine requests: none required. Nice to have: an `axis` option on `addDrag` for the ring.

## 9. Acceptance criteria

1. Each level has exactly the ten puzzles in section 4, in order, with the listed pieces, holes, open holes, fittings and steps; `autoplay` completes all 30 with no console errors.
2. A first-time player sees a ghost-hand demo before "Go!" for every action marked **new** in the level being played, and again after 8 s without touching, always for the current step.
3. No puzzle can be left unsolvable: by 20 s idle or two wrong holes only the right hole is open; by 30 s every preparing step has done itself; the game never performs the final fit.
4. No wrong hole that the piece could geometrically enter is ever open (checked by test over the plan).
5. Every placed piece is still in its recess at the finale; nothing the child placed is popped, faded or removed. Lids, plugs and pegs leave only on the cart.
6. Nothing appears or disappears on screen: the cart always drives in and out; holes open by sinking; no object's position jumps between frames (except off-frame in the shed).
7. In every station view the cart-to-hole area fills at least 70% of the screen height, the view does not move during a puzzle, and nothing on the cart (Pip included) is above y = 2.4 or overlaps any hole on screen.
8. Screenshots of all 30 stations and the three finales show no clipping: lids, plugs, pieces, glass, door, Pip, cart and board never intersect.
9. Sound: a fit plays exactly one sound (`sfx.step`), rising through the level and ending on the top note; no boing, chime or confetti anywhere; the cart, camera and holes are silent; at most one sound per child action.
10. Voice: no instruction is spoken in a puzzle that has no new action (unless the 6 s cue fires); every caption is one of the 54 lines in 7.3.
11. Pace: no tween shorter than 0.15 s or faster than walking pace for the cart (about 1.8 units/s); at least 1 s of stillness after every fit; at least 3.5 s between a fit and the next "Go!".
12. The string moves the glass in proportion to the finger and lets it back down if released early; the key turns visibly before the lock opens; the ball rolls only after the peg is out.
13. Finale: the whole board is in frame for at least 5 s, each piece can be poked and plays its own note (left low, right high), the face friend shows `joy`, the photo saved to the gallery shows the complete picture.
14. Levels look clearly different (sky-blue garden, navy space, cream party) and each can be played cold: each begins with a plain fit and its own demos.
15. Every visible object is a Blender model from 7.1 (plus code-made canvas paint); 60 fps on the target laptop with the level loaded.
