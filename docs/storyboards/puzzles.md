# Storyboard: Shape puzzles (id: `puzzles`)

- **Game:** "Puzzles!" (title "Shape puzzles", icon 🔷, teal `#3fb6a8`).
- **World:** Build (`build`). One fixed picture board fills the screen. A toy cupboard sits in the board's lower band. Pip stands on the ledge to the left of the cupboard (his top is at y 2.2 or lower) and only watches: he nods at a fit and tilts his head at a wrong try.
- **Learning goal:** 2-D shapes pressed into their matching holes on a picture board, one piece per puzzle, until the picture is whole.
  - Shapes: circle, square and triangle, then rectangle, star and heart; later big and small.
  - From puzzle to puzzle the shape gets harder to reach (lid, box, cup, plug in the hole, string, key, peg), so she also plans "what first?".
- **Levels:** 3 (chosen by the parent), 10 puzzles each.
  - L1, the sunny garden: circle, square, triangle; every puzzle is a fit.
  - L2, the rocket night: adds rectangle and star; lids, boxes, plugs.
  - L3, the robot's party: adds heart, big and small; string, cups, key, peg.
- **Source:**
  - `app/src/lessons/puzzles.js`, `puzzles-plan.js` (the 30 puzzles as data), `puzzles-parts.js`, `puzzles-art.js`, `puzzles-sound.js`, `puzzles-layout.json` (the hole shapes and positions);
  - engine `app/src/engine/lesson.js`.
- **Audit:** this storyboard reflects the fixes from `AUDIT-puzzles.md`.

## How to read the tags

- `[pending voice]`: the line is in `tools/voice/new-lines.txt` and will be spoken once its clip exists.
  - Until then it is a silent caption: the speech engine has TTS switched off.
  - Lines marked "once" are voiced the first time in a level, then shown as a caption only.
- `[caption only]`: said with `voice:false`. Only the picture words ("The sun!", "A crate!" and so on) are caption only, on purpose.

## Behaviour shared by every puzzle (all levels)

### The scene

- The whole board is always in view. One fixed camera is fitted to the board's real size and the window shape.
  - The view fits inside the band below the caption, the Go! badge and the buttons.
  - Checked at 1366x768, 1280x800 and 1920x1080.
  - The camera never moves.
- **Holes:**
  - A **closed** hole is a flush wooden shape with a faint dotted outline.
  - An **open** hole has its floor sunk 0.16 and drawn as a darker recess.
  - In L1, puzzles 1 to 6, an open floor also takes its piece's colour.
  - A filled hole loses its dotted outline.
- **The cupboard** (x -2.3 to 3.7) holds the current puzzle's set on its floor:
  - slots A, B, C and D from left to right;
  - a tidy tray at its right end.
  - Every resting piece, stand and box keeps 0.2 clear of the cupboard's left wall and of the tray. Pip stands at x -3.4, clear of the opening.
  - Every tool she handles is about 70 to 100 px at 1366x768:
    - the key is 1.38 long with a bow 0.8 across;
    - the padlock is 0.92 x 0.7, lying on its side;
    - the peg is 1.09 tall with a head 0.62 across;
    - the pull ring is 0.78 across;
    - the boxes are 1.7 x 1.5;
    - the cups are 1.1 to 1.5 wide.
  - Nothing in the cupboard ever reaches past the line of its roll-up door.
- **Lids** are a clear sky blue with a red knob, so they stand out from the cream holes on every board.
  - A lid always lies inside the picture frame: a top-row lid sits a touch lower rather than over the rim.
- **Scenery** that would peek out cut off behind the board (the sun, the digger, a cloud whose drift would cross it) is hidden for the level.

### Picking up and carrying

- The piece lifts out of the cupboard (at most 0.6 s) and follows her finger in front of everything.
- Near the right open hole, the piece turns to the hole's angle. The hole's floor warms (45%) and opens up 4%.

### Tapping

- **Tap the piece:**
  - When only one clear hole is open, the piece glides there itself (0.6 to 1.2 s) and fits.
  - Otherwise it presses in and the hand shows the drag.
- **Tap an open hole:** the piece travels there itself and tries to fit.

### Forgiving drop

- When only one clear hole is open (or the errorless help is on), she can let go anywhere above the cupboard. The piece glides to the hole and fits.

### The fit

- The piece glides in, turning to fit (0.25 s). It hovers 0.15 s, then sinks flush (0.18 s) with one rising wooden note (`sfx.step(n, 10)`).
- The face friend beams (the sun in L1, the moon in L2, the robot head in L3). Pip nods.
- Captions:
  - the shape name, always spoken (`repeat:true`; it is the learning word), e.g. "Circle!" `[pending voice]`;
  - the picture word 0.9 s later (0.6 s after the last fit of a level), e.g. "The sun!" `[caption only]`.
- Nothing is ever taken away.

### Between puzzles

The change runs inside the fit's payoff:
1. A lid or peg still gliding into the tray lands first. Nothing needs folding back: box doors and lock-box fronts slide up into the cupboard's hidden top.
2. The roll-up door drops (0.35 s).
3. The next set is loaded out of sight, and the next holes sink and darken.
4. The door rolls up (0.4 s).
5. The new puzzle is now in view: its "round start".

- If the puzzle has a **hiding move**, it plays now, with the door fully up:
  - **Look (0.5 s):** the piece (or key) wiggles and Pip turns to it.
  - **Hide:**
    - a box door slides down (0.5 s);
    - with two boxes, the empty one shuts first (0.35 s), then a 0.15 s pause, then the one with the piece (0.45 s);
    - cups lower (0.45 s);
    - a cup lowers over the key (0.45 s).
- Measured from round start to "she can touch":
  - 0 s for a plain set;
  - 1.0 to 1.5 s for a hiding move.
- Measured from her fit to her next touch: about 1.0 to 1.4 s, or 2.0 to 2.4 s with a hiding move.

### Wrong tries

- **Wrong hole:**
  - The piece glides there (0.25 s), stops against the rim (0.15 s), plays `nope` and rocks once (0.3 s). Pip tilts his head.
  - It then walks home quickly (8 units/s, at most 0.8 s). She can grab it on the way.
  - Touches are off for about 0.7 s only.
  - What she hears:
    - "Try another hole!" `[pending voice]` (once).
    - "Too big!" `[pending voice]` (once) if the hole is the same shape but smaller.
    - If the right hole is under a lid or plug: that lid or plug rattles and glows, and "Take the lid off!" or "Pull the plug out!" (once).
- **Bump** (the piece is pushed at a lidded or plugged hole):
  - It bumps, plays `nope`, the cover rattles and glows for 1.5 s, and "Take the lid off!" or "Pull the plug out!" (once).
  - Then it walks home, and she can grab it on the way.
- **Counting:**
  - Each wrong try counts. The 2nd wrong in a puzzle starts the errorless help.
  - There is no engine touch lock after a wrong.

### Lids, plugs and the peg

- When a lid, plug or peg leaves its place, the step is done at once.
  - The hole is free, and the rest of the puzzle is touchable immediately.
- The flying thing goes to the tidy tray in 0.6 to 1.5 s (6 units/s at most). It is the only thing that is not touchable while it flies.
- Every waiting lid or plug on the board answers a touch before its own puzzle with a soft rattle (no caption).

### The piece shut away, and she touches it

- **Glass:** a tink and a glint, and "Pull the string down!" (once).
- **Lock:** a tink, the padlock rattles, and "Put the key in the lock!" (once).
- The hand demo for the key rests its finger under the key, so the key stays in view.
- **Peg:** `nope`, the peg rattles, and "Pull the peg up!" (once).
- None of these counts as wrong.

### Boxes and cups

- A box is a deep toy chest: cream lip and edges, a dark inside, and a front door that slides up into the cupboard's hidden top (tap it, or push the door up).

- "Here it is!" and "Not in here!" are `[pending voice]` (once).
- An empty box or cup counts as a wrong try.
- Boxes carry no picture on them, so a box never suggests what is inside.

### The Go! badge and the hand demo

- **Go!:** touches open as soon as the puzzle can take one; Go! follows when the demo hand has had its time, or at 3 s at most.
- **Hand demo:**
  - A slow ghost hand moves on the real objects for up to 2.4 s, with a 0.55 halo.
  - The object it shows **moves a little and eases back**, so she sees what will happen:
    - a lid lifts 0.15 and slides 0.5 toward the tray;
    - a plug pulls out 0.32 and slides;
    - the string pulls 35%, so the glass rises a little;
    - the key comes forward and 30% of the way to the padlock;
    - the peg lifts 0.08;
    - a box door lifts a little (the hidden piece stays hidden).
  - Cups never move in a demo, because that would give the answer away.
  - Any touch ends the demo at once and puts everything back.
  - It plays the first time each kind of step appears in a level, and again after 8 s stuck.
  - A level never teaches two new kinds of step in one puzzle.

### Stuck ladder

The game keeps its own clock, and any touch resets it.
- **6 s:** the current step's object bobs 0.12, and the cue line is spoken.
  - The cue is the current step's own words ("Take the lid off!", "Open the box!", "Lift the cup!", "Pull the string down!", "Put the key in the lock!", "Pull the peg up!", "Pull the plug out!"), wordless puzzles included.
  - For the first fit of a level, the cue is "Put the sun / moon / robot in its hole!".
  - A spoken reminder is fresh at most every 10 s.
- **8 s:** the hand demo plays again.
- **About 22 s:** the engine's cue repeats.
- **20 s: errorless.** Every other open hole closes, the right hole glows, and in a puzzle with several steps only the current step's object can be touched.
- **30 s:** the preparing step does itself, slowly. The game never does the final fit for her.
- **About 57 s:** "Bye bye! See you soon!", then Home.
- **Quiet adapting:** after two puzzles in a row that needed help, the next puzzle opens only its own hole.

### Opening (all levels)

- Pip waves. Caption "Let's make a picture!" `[pending voice]`.
- Puzzle 1 can be touched about 0.75 s after the game opens. Its set is in the cupboard and its hole is already sunk.
- Its own line and hand demo wait 1.4 s, so the two lines never talk over each other.

### Finale (all levels)

- The face friend beams. The camera stays on the board, and the cupboard's roll-up door comes down (0.45 s), so the photo shows only the finished picture.
- The level's own line, "You made a garden!" / "You made a rocket!" / "You made a robot!" `[pending voice]`, is the admire line. It plays for 5 s while she can poke any piece (each plays its note; the friend blinks) and Pip.
- Then the photo flash and "You did it! A sticker!", then Home. There is no rain.

## Level 1: the sunny garden (circle, square, triangle; every puzzle is a fit)

| # | Piece and holes | Narrator | What she does | How she knows | If right | If wrong |
|---|---|---|---|---|---|---|
| 1 | Yellow circle (sun, face) at slot A. One hole open: the sun (dark yellow recess). | "Put the sun in its hole!" (at 1.4 s) | Drag the sun up to its hole. A tap on the sun, or letting go anywhere above the cupboard, also sends it. | The hand drag demo, a halo, Go!. | "Circle!", then "The sun!" | There is no wrong hole. |
| 2 | Blue square (crate) at slot C. One hole open: the crate. | none | Drag it, tap it, or let go above the cupboard. | Go!; the demo at 8 s. | "Square!", then "A crate!" | none |
| 3 | Orange triangle (tent), turned 35°, at slot A. One hole open: the tent. | none | As above; it turns to fit. | Go! | "Triangle!", then "A tent!" | none |
| 4 | Green circle (tree, 1.4) at slot B. Two holes open: tree and bird house (both coloured recesses). | "Find its hole!" | Choose the circle's hole. | A scan hand over both holes; near the right one the floor warms and grows. | "Circle!", then "A tree!" | Square hole: "Try another hole!" |
| 5 | Red square (bird house) at slot D. Open: house and roof. | none | The square hole. | The colour cue. | "Square!", then "A bird house!" | "Try another hole!" |
| 6 | Blue triangle (roof), upside down, at slot A. Open: roof and ladybird. The roof floor still has its blue cue. | none | The triangle hole (the piece flips as she nears). | The colour cue (the last one). | "Triangle!", then "A roof!" | "Try another hole!" |
| 7 | Red circle (ladybird) at slot C. Open: ladybird and kite. | none | The circle hole. | Go! | "Circle!", then "A ladybird!" | "Try another hole!" |
| 8 | Purple square (kite) at slot A. Open: kite (diamond), sail and ball. | none | The diamond (the square turns 45°). | Go! | "Square!", then "A kite!" | "Try another hole!" |
| 9 | White triangle (sail) at slot D. Open: sail and ball. | none | The triangle hole. | Go! | "Triangle!", then "A sail!" | "Try another hole!" |
| 10 | Beach ball at slot A. One hole open: ball. | none | Drag, tap or let go: it is the only hole. | Go! | "Circle!", then "A ball!" The picture is whole. | none |

## Level 2: the rocket night (adds rectangle and star; lids, boxes, plugs)

On the board from the start:
- a crooked lid over the nose hole (a corner of the hole shows);
- lids over the Earth hole and the panel hole;
- plugs (grey-blue bungs with red knobs) in the planet and satellite holes.

| # | Piece and holes | Narrator | What she does | If right | If wrong |
|---|---|---|---|---|---|
| 1 | Moon (sleepy face) at slot B. One hole open: the moon. | "Put the moon in its hole!" (at 1.4 s) | Drag, tap, or let go above the cupboard. | "Circle!", then "The moon!" | none |
| 2 | Yellow star at slot D. Open: star A and the rocket body (the first lure). | none | The star hole. | "Star!" | "Try another hole!" |
| 3 | White rectangle (rocket), lying on its side, at slot A. One hole open: body. | none | The body hole (it stands up as she nears). | "Rectangle!", then "A rocket!" | none |
| 4 | Red triangle at slot C. The nose hole is under its crooked lid. | "Take the lid off!" | Drag the lid away (the demo really lifts it), then fit. | "Triangle!", then "A rocket nose!" | Piece on the lid: bump, "Take the lid off!" |
| 5 | Earth at slot A. The Earth hole is under a flat lid; star B is open. | none (6 s cue: "Take the lid off!") | Lid off, then fit. | "Circle!", then "The Earth!" | Star hole: the lid rattles and glows, "Take the lid off!" |
| 6 | The door is up. The red box (door up) shows the small star. Look (0.5 s), then its door slides down (0.5 s). Open: star B and flag. | "Where's the star? Open the box!" | Tap the box or push its door up, then fit the star. | "Here it is!", then "Star!" | A short push lets the door slide down again. |
| 7 | Two boxes (0.9 wide scale), red at A and blue at C. The triangle is seen in the blue one. The red shuts first, a pause, then the blue. Open: flag. The planet hole is visible but plugged. | "Where's the triangle? Open a box!" | Open the blue box and fit the triangle (it turns 90°). | "Here it is!", then "Triangle!", then "A flag!" | Red box: "Not in here!". Planet: "Pull the plug out!" |
| 8 | Purple circle at slot B. The planet hole holds a plug. | "Pull the plug out!" | Drag the plug out (the demo pulls it), then fit. | "Circle!", then "A planet!" | Bump: "Pull the plug out!". A tap on the plug wiggles it and shows the hand. |
| 9 | Grey square at slot A. The satellite hole is plugged; the panel hole has a lid (optional). | none (6 s cue: "Pull the plug out!") | Plug out, then fit. | "Square!", then "A satellite!" | Panel lid off: rectangle hole, "Try another hole!" |
| 10 | The rectangle is seen standing in the red box, which shuts. The panel lid is on, unless it came off in puzzle 9. | none (cues: "Open the box!", then "Take the lid off!") | Box, lid (either order), fit (it lies down as she nears). | "Rectangle!", then "A wing!" The picture is whole. | Bump: "Take the lid off!" |

## Level 3: the robot's party (adds heart, big and small; string, cups, key, peg)

On the board from the start: lids over the hat hole and the present hole. There are no plugs in this level.

| # | Piece and holes | Narrator | What she does | If right | If wrong |
|---|---|---|---|---|---|
| 1 | Robot head (teal square, face) at slot C. One hole open: head. | "Put the robot in its hole!" (at 1.4 s) | Drag, tap, or let go above. | "Square!", then "A robot!" | none |
| 2 | The body rectangle is seen in the red box, which shuts. Open: body and heart (the first lure). | "Open the box!" | Open the box, then fit. | "Here it is!", then "Rectangle!", then "A robot tummy!" | Heart hole: "Try another hole!" |
| 3 | Yellow triangle (party hat) at slot D. The hat hole has a lid. | "Take the lid off!" | Lid off, then fit. | "Triangle!", then "A party hat!" | Bump: "Take the lid off!" |
| 4 | The heart is behind the glass of the case; a big red pull ring hangs to the right. Open: heart. | "Pull the string down!" | Pull the ring down: the glass rises as far as she pulls; let go early and it sinks back; at the end it latches. A tap pulls it for her. Then fit. | "Heart!", then "A balloon!" | Touching the heart: tink, glint, "Pull the string down!" |
| 5 | Big star (1.25) at slot A. Open: big star and small star (0.95). | none | The big star hole. | "A big star!" | Small hole: "Too big!" |
| 6 | The small star (0.95) stands on the cupboard floor at B. Look (0.5 s), then two big cups lower over B and C (0.45 s). There is no swap. Open: small star. | "Where's the star? Lift a cup!" | Lift the cup over the star (tap or drag up), then fit. | "Here it is!", then "A small star!" | Empty cup: "Not in here!" |
| 7 | The big orange circle (1.2) is in the glass lock box (1.56 x 1.52, 0.18 bigger than the ball each way). A big padlock lies on its side at the box's right, keyhole facing right. The big key hangs by its bow on the red hook peg at the right. Open: big ball and small ball (0.9). | "Put the key in the lock!" | Drag the key to the padlock (the demo carries it partway); it slides off the peg forward. It lies flat as it nears, glides from where she let go into the keyhole from the right (0.3 to 0.5 s), turns a quarter (0.2 s), the shackle pops (0.1 s) and the glass front slides up into the cupboard's top (0.32 s). Then fit. | "A big circle!", then "A big ball!" | Touching the ball: tink, "Put the key in the lock!". Small hole: "Too big!" |
| 8 | The small green ball is held in the clear tube by the peg. Open: small ball. | "Pull the peg up!" | Pull the fat red peg up (0.2 s): it flies to the tray while the ball rolls down the chunky wooden gutter (0.1 s beat, 0.95 s roll) into the cradle, where it can be grabbed at once. Then fit. | "A small circle!", then "A small ball!" | Touching the ball: `nope`, "Pull the peg up!" |
| 9 | The wagon rectangle is in the wide lock box (1.84 x 1.12). The key lies on its side on a little rest at the right and is seen, then a wide cup lowers over it. Open: wagon. | "Where's the key? Lift the cup!" (the cue becomes "Put the key in the lock!" once the key shows) | Cup up, key in the lock, then fit. | "Here it is!", then "Rectangle!", then "A wagon!" | Touching the wagon: "Put the key in the lock!" |
| 10 | The present is behind the glass; the present hole has a lid. | none (cues: "Pull the string down!", then "Take the lid off!") | String and lid (either order), then fit. | "Square!", then "A present!" The picture is whole. | Bump: "Take the lid off!" |

## Measured (autoplay, `PZTIMING`)

- **From her fit to her next touch:** about 1.0 to 1.4 s in plain rounds, about 2.0 to 2.4 s with a hiding move.
- **From round start (the door up) to touch:**
  - 0 s in plain rounds;
  - with a hiding move: about 1.0 s for one box or cup, about 1.5 s for the two-box puzzle (L2 7).
- **Lock-outs inside a puzzle** (logged as `{ lock, s }`):
  - wrong hole: about 0.7 s;
  - bump: about 0.4 s;
  - key: about 0.8 to 1.2 s from letting go at the lock to the piece being free (a tap on the key: about 1.2 s);
  - peg: about 1.3 s, pull to the ball in the cradle;
  - lid, plug and dropped-piece returns: no lock at all.
