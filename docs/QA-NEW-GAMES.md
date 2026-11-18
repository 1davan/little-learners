# QA — the five new games: roll, paint, puzzles, letters, words (19 Nov 2026)

Independent, strict visual review of the five new games at every level, in the format and severity scale of `docs/QA-ISSUES.md`. Nothing was fixed and no code was changed; this is the defect list for the builders.

## How this was reviewed

- **Standard captures.** `tools/qa-shots.sh <game> <level> $TMPDIR/qa-new 12 2500` (with the TELEPORT monitor) for 5 games × 3 levels, one Electron of mine at a time: 180 frames at the tool's 1280×800 window. Twelve shots 2.5 s apart cover the whole level for letters, most of it for words, about seven puzzles for puzzles and only two for roll and paint.
- **Full-length captures.** Because 30 s does not reach the last round, every level was also played to the finale by a copy of the snap driver kept outside the project (`$TMPDIR/qa-new/tools/long.js`): 1366×768 window, a shot every 4 s, plus 1920×1080 frames in the first and last round (`big…-first`, `big…-last`), the same TELEPORT monitor and a 50 ms monitor that logs every round change and every state held longer than 2 s. 15 runs, 423 frames plus 45 at 1920×1080. Twelve more runs forced content a first play does not reach: six other word places (with a seeded word memory so the Level 3 sorting train appears) and the six other letter sets (164 more frames).
- **Reading the frames.** Every standard frame was opened at full size in 2×2 montages; full-length frames were read on contact sheets and the frames with contact points (wheels on slopes, babies in the nest, pieces in holes, tools in the cupboard, things in carriages, the easel, the train) were cropped from the originals and enlarged.
- **Models.** All 140 model files of the five games (`prop_rl_*` 32, `prop_pt_*` 37, `prop_pz_*` 20, `prop_lt_*` 38, `prop_wg_*` 13) were opened in the dev viewer (`__ll.router.go('viewer', { kind })`: front, three-quarter and side from a slightly raised camera, like the games'), normalised to one size, and judged one by one (Part 3). The viewer shows them untinted; tints were judged in game.
- **Shot references.** `roll-L0/shot03` is `$TMPDIR/qa-new/roll-L0/shot03.png` (standard capture; `L0` is Level 1). `long/roll-L0/shot31` is `$TMPDIR/qa-new/long/roll-L0/shot31.png` (full-length capture, 1366×768). `$TMPDIR` on the capture machine is `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/`; the folder is temporary, so re-capture with the commands above if it has been cleaned.

## Read this before acting on an item

- **The engine moved while this ran.** The five games' own files and models did not change during capture (newest: `paint.js` 00:19; captures 00:24–01:26), but `tools/autoplay.js` (00:48), `app/src/engine/fx.js` (01:00) and `app/src/engine/lesson.js` (01:03) were edited by other builders part-way through. Engine-owned items (the "Go!" badge, caption bubble, sticker badge, finale photo) should be re-verified on a fresh capture.
- **Other Electrons were running.** Other agents' captures shared the machine, so absolute timings may be a little slow; the timing findings are far outside that noise (seconds, not frames).
- **The autoplayer is not a child.** It calls the games' hooks directly, plays without mistakes after the first round, never taps a baby in roll and paints in straight rows. Stuck states from early or repeated taps were not exercised.
- **Fix numbers are starting points.** File, function and constant names were read from the code; suggested values were not tested. Where the cause was not traced the item says so.
- **The teleport monitor only tracks creature rigs.** Props (the rolling hoglet ball, pieces, things, photos, the train) were checked from the frames.
- **The white glove** in some 1280×800 frames and in the viewer sheets is the app's own `#cursor` following the capture machine's mouse. Ignored.
- **1366×768 against 1920×1080.** Both are 16:9 and frame the 3-D scene identically; no defect was found at one size and not the other. Differences against the 1280×800 (16:10) captures are called out in the items (the "Go!" badge sits in the top-right corner at 16:9 and under the caption at 16:10).

## Severity

Same scale as `docs/QA-ISSUES.md`: **P1** must fix, visible to a parent (obvious clipping, snaps, placeholder-looking models in the play area, hidden or cut-off targets, wrong or unclear prompts, rule 0 waits, the game playing for her); **P2** noticeable; **P3** polish.

## Counts

One item is one distinct defect; a defect seen at several levels is one item at its highest severity.

| World | Game | P1 | P2 | P3 | Total |
|---|---|---:|---:|---:|---:|
| build | roll | 7 | 12 | 4 | 23 |
| meadow | paint | 2 | 14 | 3 | 19 |
| build | puzzles | 2 | 7 | 3 | 12 |
| build | letters | 3 | 9 | 3 | 15 |
| farm | words | 1 | 9 | 2 | 12 |
| | **All 5 games** | **15** | **51** | **15** | **81** |

Model verdicts (Part 3): 5 rebuild, 38 touch up, 97 passed, out of 140.

| Game | Models | Rebuild | Touch up | Passed |
|---|---:|---:|---:|---:|
| roll (`prop_rl_*`) | 32 | 1 | 9 | 22 |
| paint (`prop_pt_*`) | 37 | 1 | 12 | 24 |
| puzzles (`prop_pz_*`) | 20 | 1 | 4 | 15 |
| letters (`prop_lt_*`) | 38 | 2 | 12 | 24 |
| words (`prop_wg_*`) | 13 | 0 | 1 | 12 |

Teleports: 0 TELEPORT events in all 42 runs (15 standard, 15 full-length, 12 extra). No character snaps or zips in any of the five games.

# Part 1 — What matters most

## Top 10 P1s

1. **roll, all levels — she taps once and then watches for 10–15 s, every puzzle.** Input stays closed (`busy`) from the tap that opens the gate through the roll home, the slide into the nest, Mummy's nuzzle and the count: 13.8 s, 12.9 s and 13.7 s in the first puzzles of Level 2. The game's own "ROUND READY 550 ms" log starts counting after that wait. `roll.js` `landHome()`, `settleHoglet()`.
2. **roll, all levels — the instruction for a yellow block says "Pop the balloon!".** A duplicate `pop` key in `roll.js` `INSTR` overwrites "Tap the yellow block!" (`roll-L0/shot03`, `shot12`; `long/roll-L0/shot31`, `shot47`).
3. **roll, all levels — the game takes her turn.** If she has not tapped a baby in 3 s the game picks one; a cookie eats itself after 4 s; three taps push a piece for her. `roll.js` `startChoice()`, `eatCookie`, `autoPush`.
4. **paint, all levels — "Hang it up!" is played from far away.** The toy shrinks to 11% of the screen height, the pots are cut off, and the peg is at the top edge beside the caption, a full-screen drag (`paint-L0/shot05`, `paint-L1/shot06`, `paint-L2/shot10`). `paint.js` `hangView()`.
5. **letters L1 — three-second gaps with nothing to touch** in rounds 3 and 4 of the first letter set (first touch at 1.9 s; `LT_GAP` 3,018 ms and 3,000 ms), and once in Level 2 (3,419 ms). `letters.js` `startRound()`.
6. **words, all levels — prompts arrive before the camera.** "Tap a picture!" with two of three photos out of frame, "Where's the bird?" with the bird cut by the edge: input opens at once but the camera glides for up to 2.2 s (`words-L0/shot09`, `words-L2/shot10`). `words.js` `glideTime()`.
7. **roll, all levels — "Tap a baby!" while the log is off-screen** (`roll-L0/shot09`, `roll-L1/shot08`): the camera is still crossing from the nest. `roll.js` `updateCamera()`, `startChoice()`.
8. **letters L2 — a target carriage is hidden in the first sorting round:** S is cut by the frame edge, behind the trunk and under the "Go!" badge (`letters-L1/shot01`, `long/letters-L1/big01-first`). `letters.js` `viewFor()`.
9. **puzzles L3 — the tools are too small:** a 30 px peg, a 45 px key and a 25 px lock, with the hint hand covering the key (`puzzles-L2/shot12`, `long/puzzles-L2/shot09`, `shot11`); and the lockbox's piece and key clip through the box and the cupboard floor (`long/puzzles-L2/shot08`). `puzzles-parts.js` `KEY_K`, `PEG_K`, `LOCK`.
10. **roll L2–L3 — things to press that cannot be seen:** the yellow bridge stands edge-on as a 25 px strip (`long/roll-L1/shot41`); on Level 3's red track at sunset the red button and red door are red on red (`long/roll-L2/shot17–20`); the lift button rides out of the bottom of the frame (`roll-L2/shot03`).

Close behind: paint's 45–85 px gallery sign, the only way to finish a toy (`paint-L1/shot05`); the letters "ant" that reads as a tomato on a stool (`letters-L0/shot02`).

## Problems that repeat across the five games

- **The camera is late or far.** Prompts are given while the camera is still travelling (roll, words); several views leave a third to a half of the screen empty with the subject small (roll nest, letters Level 2 and every finale, words Level 2, paint's hang view, the fixed puzzle board).
- **Captions and the "Go!" badge over the subject** at 1280×800: Mummy's head, a letter's face, the top of the toy, Pip, the newest photo. At 16:9 the badge is clear; the caption still covers finale subjects.
- **Finale photos are not composed.** Leftovers stay in shot (puzzles' open box and tools, letters' unchosen things, paint's caption over the top row), the subject is small (letters' train at 20% of the height, words' six photos in an empty book) or cropped (roll's Mummy).
- **Sunset palettes eat the controls** in the later levels: roll Level 3 (red on red), puzzles Level 2 (cream on orange), letters Level 3 (lanterns and orange floor around an orange S).
- **Small controls:** paint's gallery sign, puzzles' key, peg and hook, letters' carriage tags, small paint parts (leaf, beak).
- **Pip is hidden or cropped** in four of the five games: behind the log and under the Home button (roll), cut by the right edge (letters), under the badge (words), cut at the left in finales (roll, words).
- **Low-contrast pairs:** cream blanks on a cream card (paint), white stands on a white floor (words), blue box in front of a blue cabin (roll), red ant on a red carriage (letters).
- **Comb and stair-step edges on painted areas** (paint strokes, the first blob on the dish) and stray dashed ink on large flat faces (roll columns, the letter engine and carriages).

## Rule 0 (touch within 1.5 s, never more than 2 s with nothing to touch)

| Game | Measured | Verdict |
|---|---|---|
| roll | Babies tappable 550–670 ms after the round counter ticks, but the counter ticks after a 10.2–14.6 s closed stretch each puzzle; after choosing, the baby rolls about 3–4 s to the first obstacle | Fails (P1 #1, item 2) |
| paint | First touch 15–530 ms after a round starts; 1,517–1,550 ms after the last toy is hung (1,835 ms for the pick-a-toy round) | Passes, one round late (P2) |
| puzzles | Next piece live about 1 s after the last click; two 2.7 s animation locks in Level 3 | Passes, two locks (P2) |
| letters | 301–317 ms in most rounds; Level 1 rounds 3–4 of the first set 1.9 s, with 3.0 s gaps; one 3.4 s gap in Level 2 | Fails in the first set (P1) |
| words | Rounds take a touch at once; the camera is up to 2.2 s behind | Passes by the clock, fails by sight (P1) |

# Part 2 — Items by game

Worlds and names as in `docs/WORLDS.md`. Each item: severity, level(s), shot reference(s), what is wrong, **Fix** with the file and function to change.

## build · roll — Roll & push

Captures: `roll-L0`, `roll-L1`, `roll-L2` (12 shots each, two puzzles) and `long/roll-L0` (59 shots, 10 puzzles), `long/roll-L1` (70 shots, 12 puzzles), `long/roll-L2` (75 shots, 12 puzzles). The autoplayer never taps a baby, so every round in these captures used the game's own 3 s auto-choice (item 4).

1. **[P1]** L1–L3 · `roll-L0/shot03`, `roll-L0/shot12`, `long/roll-L0/shot31`, `long/roll-L0/shot47`, `long/roll-L2/shot49` — the instruction for a yellow block reads and says "Pop the balloon!" with no balloon anywhere; the right line ("Tap the yellow block!") only shows for the sunken up-block (`long/roll-L0/shot36`). **Fix:** `app/src/lessons/roll.js` `INSTR` (l.56–62) has the key `pop` twice (`pop: 'Tap the yellow block!'` then `pop: 'Pop the balloon!'`), and the second wins. Rename the balloon line's key (e.g. `burst`) and use it in the balloon branch at l.1059–1060 (`this.cueKey = 'pop'; this.say(INSTR.pop …)`).
2. **[P1]** L1–L3 · rule 0, measured on `long/roll-L0`, `long/roll-L1`, `long/roll-L2` logs — after her one tap she watches for 10–15 s with nothing to touch, every puzzle: `busy` stays true from `onGo()` through the roll down the chute, `landHome()`, `settleHoglet()` and Mummy's nuzzle (13.8 s, 12.9 s, 13.7 s in `long/roll-L1` r1–r3; 10.2–14.6 s in `long/roll-L0`). The log line "ROUND READY 550–670 ms" only measures from the round counter, which ticks at the end of that wait. **Fix:** `roll.js` `landHome()` / `settleHoglet()` — call `startChoice()` (and swing `camMode` back to `'log'`) the moment the hoglet leaves the last gate, and let the slide, cushion roll, nuzzle and count play in the background (they already resolve on their own); cut `moveHog` times (1.4 and 2.2 units/s → about 3) and the `still: 0.8` in `success()`.
3. **[P1]** L1–L3 · `roll-L0/shot09`, `roll-L1/shot08` — "Tap a baby!" is spoken and the babies are tappable 0.55 s into the round while the camera is still at the nest: the log is off-screen (`roll-L0/shot09`) or cut in half by the left edge (`roll-L1/shot08`). **Fix:** `roll.js` `updateCamera()` — the critically damped follow (`w = 3.2`) needs about 1.5 s to cross the table; set `camMode = 'log'` at `landHome()` (see item 2) or use `w ≈ 7` for the return leg, and hold the "Tap a baby!" line in `startChoice()` until the log's projected box is inside the viewport.
4. **[P1]** L1–L3 · from code, seen in every capture — the game does her turn for her: `startChoice()` picks a baby by itself after 3.0 s (`this.choiceTimer = this.s.wait(3.0)`, l.661), a half-eaten cookie eats itself after 4 s (`eatCookie`, l.963), and three taps on a push piece push it for her (`autoPush`, l.1173). **Fix:** remove the 3 s and 4 s timers and rely on the engine's help ladder (bob at 5 s, hand at 8 s, errorless at 20 s) like every other piece; keep the tap fallback but make it nudge one column, not finish the push.
5. **[P1]** L3 · `roll-L2/shot03`, `long/roll-L2/shot12`, `long/roll-L2/shot13` — controls leave the frame: the purple lift button rides down with the lift and is cut by the bottom edge while its hint ring is showing; with two doors the second button and the little door tag under it are cut by the bottom edge. **Fix:** `roll.js` `neededPts()` — add the button's own box (its world position ± 0.5) for doors and lifts, at both ends of a lift's travel; `frame()` — keep 12% of the height free below the lowest needed point.
6. **[P1]** L2–L3 · `long/roll-L1/shot41`, `long/roll-L1/shot42` — the yellow bridge stands edge-on to the camera before it is tapped: she sees a 25 px yellow strip, and its white tap ring is foreshortened to a sliver on the side face. **Fix:** `app/src/lessons/roll-pieces.js` `makePlank()` / `tools/blender/creatures/prop_roll.py` (`prop_rl_plank`) — stand the plank leaning back about 20° with its broad face (and the ring) towards the camera, or put the ring on the front edge as a round yellow button.
7. **[P1]** L3 · `long/roll-L2/shot17–20`, `long/roll-L2/shot23–25`, `long/roll-L2/shot29–31`, `long/roll-L2/shot66–68` — Level 3's red track under the orange sunset hides the things to press: red button and red door on red columns, orange see-saw and yellow balloon against orange hills. **Fix:** `roll-pieces.js` `WOOD_TINT[2]` — use a cool tint (teal or lilac wood) for Level 3, or `roll.js` `build()` `setSky('build', 1)` → the midday look; keep red, yellow and orange for the pieces only.
8. **[P2]** L1–L3 · `roll-L0/shot02`, `roll-L1/shot01`, `roll-L2/shot01`, `roll-L2/shot09`, `long/roll-L0/big01-first` — Pip sits behind the log: only his eyes show over it, and at the round start the Home button covers his head. **Fix:** `roll.js` `build()` — `this.pip.position.set(-7.5, stumpTop, -3.0)` → stand him beside the log (x ≈ -8.6, z ≈ -1.2) or on top of it, clear of the top-left 130 px.
9. **[P2]** L2–L3 · `roll-L1/shot02`, `roll-L1/shot09`, `roll-L1/shot10`, `long/roll-L1/shot35–37` — the blue push box and blue crate sit exactly in front of the blue site cabin; blue on blue. **Fix:** `roll.js` `build()` — hide the cabin with the other scenery (`o.position.z > -3.2` test → include the cabin) or recolour it in `engine/scenery.js` for this game.
10. **[P2]** L1–L3 · `long/roll-L0/shot56`, `long/roll-L0/shot58`, `long/roll-L1/shot61–69`, `long/roll-L2/shot57–58` — the nest is too small for the family: from the fifth baby on, babies overlap each other, front rows hide the faces behind and Mummy's mouth and tummy. **Fix:** `roll-pieces.js` `NEST_ROWS` / `NEST_COLS` — widen the pitch to at least 2.2 × `R`, raise each back row by 0.25, and lift Mummy's mound (`roll.js` `mound.scale 1.6`, `mum.position`) so her whole face clears the back row.
11. **[P2]** L1–L3 · `long/roll-L0/shot57–59`, `long/roll-L1/shot69` — finale photo: the caption sits on Mummy's head, her spikes are cut by the top edge, and Pip pops in at the left edge, cut in half with his eyes shut. **Fix:** `roll.js` finale view (where `finaleOn` is set; the `camTarget()` home points are `NEST_X - 2.5 … NEST_X + 3.4`, `moundTop + 1.9`) — add Mummy's head top + 0.6 to the framed points and leave 110 px at the top; stand Pip at `NEST_X - 3.2` inside the frame.
12. **[P2]** L1–L3 · `roll-L0/shot06–08`, `roll-L1/shot05–07`, `roll-L2/shot07–08` — in the nest view the bottom third of the screen is blank plinth, the digger's arm grows out of Mummy's back and (L3) a brick stack lies at her feet. **Fix:** `roll.js` `camTarget()` home branch — drop the `(NEST_X - 2.5, 0.1)` point to the nest's front rim and tighten the `7.2` distance; hide the digger and bricks with the other scenery in `build()`.
13. **[P2]** L1–L3 · `roll-L0/shot01`, `roll-L0/shot10–12`, `roll-L1/shot01` — on the track the thing to act on is about 20% of the screen height and the plain column faces fill the lower half. **Fix:** `roll.js` `frame()` — default distance for a single gate so the piece is 40% of the height; aim the look-at 0.4 lower on the piece, not on the column face.
14. **[P2]** L1–L3 · `roll-L0/shot09–11`, `roll-L1/shot01`, `roll-L1/shot09`, `roll-L2/shot01` — dashed ink strokes ("— — —") and dotted hairlines run along the bottom of the column fronts and plinth. **Fix:** `tools/blender/creatures/prop_roll.py` (`prop_rl_column`, `prop_rl_plinth`) — the wood-grain stripe is breaking into dashes on coarse triangles; make it a separate thin `layer()` or delete it.
15. **[P2]** L1–L3 · `long/roll-L0/shot23–24`, `long/roll-L0/shot47–48`, `long/roll-L0/shot53–54`, `long/roll-L1/shot31–33` — the door house's roof is cut off by the top of the frame while she presses its button. **Fix:** `roll.js` `neededPts()` door branch — include the roof apex (`top + 2.4`).
16. **[P2]** L3 · `roll-L2/shot12` — the hoglet hangs in the air over the lift with its head under the caption "Press the purple button!". **Fix:** `roll.js` lift ride — clamp the camera so the hoglet's top stays below y = 110 px, and clear the instruction when the lift starts to move.
17. **[P2]** L1 · `long/roll-L0/shot36`, `long/roll-L0/shot35` — the sunken yellow up-block sits at the very bottom of the frame and its hint ring is cut by the bottom edge. **Fix:** as item 5 (`frame()` bottom margin).
18. **[P2]** L3 · `long/roll-L2/shot55`, `long/roll-L2/shot56` — the ramp and the box end up jammed inside each other in the hole. **Fix:** `roll.js` push bodies (`MOVE` / `BOXY` sets, `autoPush()`) — cause not traced in code; check that the ramp's collider is its wedge hull, not a smaller box, and that a ramp can never share a hole with a box.
19. **[P2]** L1–L3 · `roll-L1/shot06`, `roll-L0/shot08`, `long/roll-L0/shot27` — Mummy's nuzzle: she swings round through the babies beside her and the new baby is pressed into her tummy. **Fix:** `roll.js` `nuzzle()` — lean the head down (`head.rotation.x`) instead of yawing the whole body; keep 0.1 clear of the baby.
20. **[P3]** L2–L3 · `roll-L1/shot03`, `roll-L1/shot12` — a red sliver shows along the top of the box once it is in the hole (the barrier fence seen through the gap). **Fix:** `roll.js` box seat — seat the box 0.02 proud or close the gap with the column cap.
21. **[P3]** L2 · `long/roll-L1/shot47` — the cart's corner touches into the yellow block that holds it, with a stray ink wedge at the contact. **Fix:** `roll-courses.js` cart start x — 0.08 further from the block.
22. **[P3]** L3 · `roll-L2/shot01–04` — the arrows on the purple lift dome are almost invisible. **Fix:** `prop_roll.py` (`prop_rl_lifttop` / button) — white arrows, twice the size.
23. **[P3]** L1–L3 · every track shot — the site cabin behind the track is a flat-shaded box with a slab roof. **Fix:** engine scenery (`engine/scenery.js` 'build' set) — a proper cabin model, or hide it (see item 9).

Teleports: 0 events at all three levels (the monitor follows Pip, Mummy and the babies' creature rigs only; the rolling ball is a prop and was checked from the shots: no snaps seen).

## meadow · paint — Paint & mix

Captures: `paint-L0`, `paint-L1`, `paint-L2` (12 shots each, first two toys) and `long/paint-L0` (29 shots), `long/paint-L1` (35 shots), `long/paint-L2` (61 shots), all eight toys each. The autoplayer paints through `act()` in straight rows, so stroke shapes are the autoplayer's, not a child's; the paint texture itself is the game's.

1. **[P1]** L1–L3 · `paint-L0/shot05`, `paint-L1/shot06`, `paint-L2/shot10`, `long/paint-L0/shot03`, `long/paint-L1/shot04`, `long/paint-L2/shot06` — "Hang it up!" pulls the camera far back: the toy she just painted shrinks to about 11% of the screen height, the pots and dish are cut by the bottom edge, and the peg she must reach is at the very top of the screen beside the caption bubble — a full-screen-height drag for a two-year-old. **Fix:** `app/src/lessons/paint.js` `hangView()` (`this.fit(V(0, 0.8, 8.4), …, pts, 60)`) — do not frame the whole wall: lower the next peg to the easel instead (a short rail or hook 1.2 above the card) or frame only the card plus the target peg row; keep the drag under a third of the screen height and the toy at 30% or more.
2. **[P1]** L1–L3 · `paint-L1/shot05`, `long/paint-L0/shot12`, `long/paint-L1/shot27`, `long/paint-L2/shot05` — the control that ends her painting, the little gallery sign, is 45–85 px tall and tucked into a corner of the card; in `paint-L0/shot04` and `paint-L2/shot09` it is not visible at all under the caption and "Go!" badge. **Fix:** `paint.js` `showSign()` (`this.sign.scale.set(0.75, 0.75, 0.4)`) and `signPose()` / `pickSignSpot()` — scale about 1.6, park it on the ledge beside the brush (never in the top 130 px), and make `signAt()`'s hit radius at least 0.5.
3. **[P2]** L3 · `paint-L2/shot01` — the first mixing demo: the ghost hand sits at the left edge of the screen, cut in half and pointing at nothing, while the caption says "Let's make orange!" (at 1366×768 it is on the plate stack, `long/paint-L2/shot01`). **Fix:** `paint.js` `teach()` (the mixing demo; branch not traced) — start the `fx.ghostPath` on the stack's projected centre after `views()` has run for the current aspect; say what to do ("Take a plate!") rather than the goal.
4. **[P2]** L1–L3 · `paint-L0/shot01`, `paint-L1/shot01`, `long/paint-L0/shot01`, `long/paint-L0/shot08`, `long/paint-L2/shot07`, `paint-L2/shot09` — the caption bubble covers the top of the toy and its peg, and the "Go!" badge lands on the toy (or on Pip and the pot being dipped in L3). **Fix:** `paint.js` `views()` paint view — reserve the top 130 px (`fit(…, 32)` margin → top margin 130); the badge is the engine's `showGo` — anchor it bottom-centre for this game.
5. **[P2]** L1–L3 · `paint-L0/shot04`, `paint-L1/shot10`, `long/paint-L0/shot27`, `long/paint-L1/shot33` — paint edges show comb stripes ("venetian blind" gaps a few pixels apart) wherever a stroke ends, and they survive on the hung toys and in the finale. **Fix:** `app/src/lessons/paint-canvas.js` stamp spacing / brush mask — overlap successive stamps by half the brush radius and feather the mask edge by 2 px.
6. **[P2]** L3 · `paint-L2/shot03` — the first blob of paint on the mixing dish has stair-stepped pixel edges. **Fix:** `paint-canvas.js` dish surface — draw the blob at twice the texture size or with a smoothed alpha edge.
7. **[P2]** L1 · `paint-L0/shot01–04`, `long/paint-L0/shot27` — the ball toy is a plain disc with one curved seam that reads as a frown. **Fix:** `app/src/lessons/paint-shapes.js` ball lines — two or three beach-ball panel seams meeting at a button, or a star; no single downward arc.
8. **[P2]** L2–L3 · `long/paint-L1/shot14`, `long/paint-L1/shot20`, `long/paint-L2/shot49` — unpainted toys (apple, flower, carrot) are cream on a cream card and almost disappear. **Fix:** `paint.js` easel card colour or `prop_paint.py` blank tint — card a mid blue-grey, or blank wood a shade darker with the 0.02 ink outline at 0.035.
9. **[P2]** L2 · `long/paint-L1/shot18`, `long/paint-L1/shot22`, `long/paint-L1/shot30` — "Green!" for the apple leaf, the flower centre and "Now the beak. Orange!" ask her to paint parts about 40–50 px across at the wider Level 2 camera. **Fix:** `paint.js` `views()` — the Level 2 paint view is wider once the model card stands beside the easel; zoom to the part (`fit` on the part's box, 1.6×) while a small part is the step.
10. **[P2]** L2 · `paint-L1/shot05`, `paint-L1/shot06`, `paint-L1/shot11` — the friend walks in front of the easel to admire the toy and covers its right side just as she is asked to hang it. **Fix:** `paint.js` `react()` — stop the friend 0.5 to the side of the card (its lane is z -0.45), turning only the head.
11. **[P2]** L1–L2 · `paint-L0/shot02`, `paint-L1/shot03`, `long/paint-L1/shot02` — painting the top of the toy sends the brush handle out through the top of the frame. **Fix:** `paint.js` brush pose — tilt the handle towards the bottom-right when the tip is in the top third.
12. **[P2]** L3 · `paint-L2/shot01`, `paint-L2/shot08`, `long/paint-L2/shot25–28`, `long/paint-L2/shot33–36` — crockery clutter and cut-offs: in the mixing view a large idle plate stack fills the left third and the toy is cut by the right edge; in the paint view the red pot is cut by the left edge, the dish by the bottom, and three or four used dishes pile up along the bottom (some cut by the right edge). **Fix:** `paint.js` `views()` — include every open pot and the dish in the paint view's `pts`; mixing view `this.fit(V(0.15, 2.2, 3.6), …, mp, 56)` — add the toy card to `mp` or leave it wholly out; stack used dishes in one pile behind the plate stack.
13. **[P2]** L1 · `long/paint-L0/shot24`, `long/paint-L0/shot25`, `long/paint-L0/shot26` — after she picks a toy, the two she did not pick stay on the table half hidden behind the easel and the pink pot. **Fix:** `paint.js` pick-toy round — walk the unpicked blanks back to the wall (or off the table) before the paint view.
14. **[P2]** L1–L3 · `long/paint-L2/shot60`, `long/paint-L1/shot33`, `long/paint-L0/shot27` — in the finale the caption bubble sits on the top row of her toys (the frog's eyes in L3). **Fix:** `paint.js` finale wall view (`this.fit(V(0, 0.15, 8.4), V(0, WALL_Y + 2.35, WALL_Z), pts, 64)`) — top margin 130 px.
15. **[P2]** L1–L3 · every paint view — the table is a flat cream slab filling the bottom 35% of the screen and the pots are plain white tubs with a broken, uneven outline. **Fix:** `tools/blender/creatures/prop_paint.py` (`prop_pt_table`, `prop_pt_pot`) — see model verdicts; `views()` paint view look-at 0.2 lower so the table takes under 25%.
16. **[P2]** L2 · rule 0, `long/paint-L1` log — the pick-a-toy round opens 1,835 ms after the last toy was hung (the other rounds 1,517–1,550 ms; first touch 200–530 ms after the round starts). **Fix:** `paint.js` pick-toy arrival — bring the three blanks down while the hang arc is still playing.
17. **[P3]** L3 · `paint-L2/shot12`, `long/paint-L2/shot07` — the used dish from the last mix is dropped at the right with its smear showing, like a face. **Fix:** as item 12 (one tidy pile).
18. **[P3]** L1 · `long/paint-L0/shot23` — in the pick-a-toy round the stamp tool stands in front of the bird blank. **Fix:** `paint.js` stamp rest position — 0.4 further right.
19. **[P3]** L1–L3 · `paint-L0/shot01`, `paint-L1/shot01` — a bare wooden wall post stands in the foreground at the left edge, beside Pip. **Fix:** `app/src/lessons/paint-studio.js` wall posts — move the post behind Pip's line or frame it out.

Teleports: 0 events at all three levels (Pip and the friends walk; the friend swap in `paint-L1/shot08` is a walk, not a snap).

## build · puzzles — Shape puzzles

Captures: `puzzles-L0`, `puzzles-L1`, `puzzles-L2` (12 shots each, about seven puzzles) and `long/puzzles-L0` (11 shots), `long/puzzles-L1` (14 shots), `long/puzzles-L2` (16 shots), all ten puzzles each. Rule 0 is met apart from two animation locks in Level 3 (item 9): with the autoplayer every puzzle takes 3–8 s and the next piece is live about a second after the last one clicks in.

1. **[P1]** L3 · `puzzles-L2/shot12`, `long/puzzles-L2/shot09`, `long/puzzles-L2/shot11` — the Level 3 tools are too small to see or hold: the red peg she must pull is about 30 px wide (4% of the screen height), the key about 45 px with a 25 px lock, the marble track is two thin green rails, and the hint hand in `puzzles-L2/shot12` covers the key completely. **Fix:** `app/src/lessons/puzzles-parts.js` `KEY_K = 1.0`, `PEG_K = 1.15`, `HOOK_K = 1.4`, `LOCK.K = 1.4` — the cupboard band limits them; give the tool step its own camera (the design's one fixed camera is the cause): glide to the cupboard so it fills 60% of the height while a tool step is current, then back to the board. `puzzles.js` hint — rest the ghost finger below the key (`fx.ghostPath` offset).
2. **[P1]** L3 · `long/puzzles-L2/shot08`, `long/puzzles-L2/shot11` — lockbox clipping: the circle piece is bigger than the box and passes through its frame and the cupboard floor; the key's ring is cut by the floor and then hangs below the ledge when the door swings open. **Fix:** `puzzles-parts.js` `LOCK = { W: 0.95, H: 1.38, D: 0.33, … }` — make the box at least 0.15 wider and taller than the largest piece it holds and raise `lockAt` so the key ring clears `FLOOR_OPEN`.
3. **[P2]** L1–L3 · `puzzles-L0/shot01`, `long/puzzles-L0/shot01`, `long/puzzles-L0/big01-first` — one fixed camera fitted to the whole board: holes and pieces are 100–117 px (13–15% of the screen height) with 28% of the screen empty sky above and 22% empty ground below; the small star and small circle of Level 3 are about 60 px (`puzzles-L2/shot10`). **Fix:** `app/src/lessons/puzzles.js` camera (fitted to the board width) — crop the fit to the board plus the cupboard only (drop the bench and sky margins), and scale the two "small" holes to at least 0.75 of the big ones.
4. **[P2]** L2–L3 · `puzzles-L1/shot01`, `puzzles-L1/shot05`, `puzzles-L2/shot01–04`, `long/puzzles-L2/shot01` — the lid over the top-row hole sits crooked and pokes out over the board's top frame. **Fix:** `puzzles.js` lid placement on the hole (`makeLid()` in `puzzles-parts.js`) — seat it square inside the frame (cap its top at the frame's inner edge) or scale that lid 0.85.
5. **[P2]** L2–L3 · `puzzles-L1/shot09–12`, `puzzles-L2/shot03–04`, `long/puzzles-L1/shot05–07` — the box reads as a flat red rectangle: closed it has no visible depth, open it is a tall red sheet with its flap lying out over the bench edge. **Fix:** `tools/blender/creatures/prop_puzzles.py` (`prop_pz_box`) — show the top face (tilt the box 12° towards the camera or give it a lighter lid plane), darker inside, and hinge the lid backwards so nothing leaves the cupboard; `puzzles-parts.js` `BOX = { H: 1.46, D: 0.27, W: 0.8 }` — depth 0.27 is too thin to read.
6. **[P2]** L2–L3 · `puzzles-L2/shot02`, `long/puzzles-L2/shot10` — the roll-up door comes down through things that stick out of the cupboard: the open box's flap, the key. **Fix:** `puzzles.js` round change — close boxes and lift tools inside `FRONT` before the shutter starts (`SHUTTER_RISE`).
7. **[P2]** L2–L3 · `long/puzzles-L1/shot12–14`, `long/puzzles-L2/shot13–16` — the finished picture is photographed with leftovers in the cupboard band: the open red box with its flap over the ledge and a lid on the tray (L2); the glass case, the hook and a lid (L3); an empty brown cupboard in L1 (`long/puzzles-L0/shot09`). **Fix:** `puzzles.js` finale — roll the door down (it is part of the board) before "You made a …!".
8. **[P2]** L2 · `puzzles-L1/shot01–12` — under the sunset the whole Level 2 scene is orange: cream lids, cream holes and tan wood on an orange ground; lids and open holes are hard to tell apart. **Fix:** `puzzles.js` level look — keep the midday sky for Level 2, or tint lids a clear colour (they all share the red knob).
9. **[P2]** L3 · rule 0, `long/puzzles-L2` log — two animation locks of 2.7 s in puzzles 7 and 9 (`step|anim=1` held 2,699 ms and 2,701 ms) during which nothing can be touched. **Fix:** `puzzles.js` `autoPull()` (`slow ? 1.8 : 1.2`) and the lockbox door swing — cap at 1.2 s and take input as soon as the piece is free.
10. **[P3]** L1–L3 · `puzzles-L0/shot05`, `puzzles-L0/shot07`, `long/puzzles-L0/shot08` — a piece on its stand overlaps the blue lid tray, the cupboard wall or Pip's wing. **Fix:** `puzzles.js` `TRAY = { x: 2.83, … }` / `STAND_Z` — keep 0.2 between the stand positions and the tray and the left wall.
11. **[P3]** L2 · `puzzles-L1/shot06` — after the lid is put on the tray the hint hand and glow stay on the tray. **Fix:** `puzzles.js` lid step — `fx.clearHands()` when the lid lands.
12. **[P3]** L1–L3 · every shot — the engine's sun, a cloud and the digger are cut off behind the board's top and right edges. **Fix:** `puzzles.js` `build()` — hide scenery that overlaps the board's box.

Teleports: 0 events at all three levels (Pip stands still; pieces glide).

## build · letters — Letter friends

Captures: `letters-L0`, `letters-L1`, `letters-L2` (12 shots each; each covers the whole level and the finale) and `long/letters-L0` (9 shots), `long/letters-L1` (7 shots), `long/letters-L2` (7 shots); extra sets `long/letters-set1` … `long/letters-set6` (`window.__ltSet`) for the other letters and their things. The game writes its own readiness log (`LT_READY`, `LT_GAP`).

1. **[P1]** L1 · rule 0, `letters-L0` and `long/letters-L0` logs — rounds 3 and 4 (M and S) are not touchable until 1,885–1,916 ms after the round starts, and the game logs a 2,990–3,018 ms gap with nothing live in each (`LT_GAP L1 r3 3018ms`, `LT_GAP L1 r4 3000ms`); the same 3.4 s gap is logged once in Level 2 (`LT_GAP L2 r4 3419ms`, `letters-L1`). Rounds 1 and 2 are live in 315 ms. Only the first letter set (A, B, M, S — the one a new player gets) shows it; the extra sets logged 313–317 ms for every round. **Fix:** `app/src/lessons/letters.js` `startRound()` — it waits `Math.min(1.0, Math.max(0.6, rollDur - 1.2))` and nothing is live until the carriage is in (cause not traced further than this wait and `rollTo()`); enable `trunkTap` at once (the trunk does not move) and let `boxOut()` run while the carriage pulls in, or keep all four carriages in view (see item 2) so the train never has to roll.
2. **[P1]** L2 · `letters-L1/shot01`, `letters-L1/shot02`, `long/letters-L1/big01-first` — in the first sorting round the S carriage, one of the four places a thing can go, is cut by the right edge and hidden behind the trunk; S's face is under the "Go!" badge; from round 3 the camera shows all four (`letters-L1/shot05`). **Fix:** `letters.js` `viewFor()` / `stationX()` — Level 2 uses the `'two'` and `'three'` views for the first rounds; use `'four'` for every sort round, and stand the trunk left of the engine or in front of the rug (it stands in front of the carriage two places right of `STATION_X`; `PITCH = 2.2`).
3. **[P1]** L1–L3 · `letters-L0/shot02`, `letters-L1/shot02`, `letters-L2/shot05`, `long/letters-L0/shot01` — the ant is a red ball with four table legs and a green stripe: it reads as a tomato on a stool, and on the red Level 1 carriage it nearly disappears. **Fix:** `tools/blender/creatures/prop_lt_things.py` (`prop_lt_insect`) — three clear body segments, six legs, dark brown or black; see model verdicts.
4. **[P2]** L1–L3 · `letters-L0/shot01–02`, `letters-L2/shot02–05`, `long/letters-L0/shot01` — the trunk and its raised lid cover the carriage to the right of the active one and the lower half of its letter friend all level; the inside of the trunk and lid is a flat black slab. **Fix:** as item 2 (move the trunk); `tools/blender/creatures/prop_lt_stage.py` (`prop_lt_trunk`, `prop_lt_trunklid`) — a warm lining colour with a visible rim instead of black.
5. **[P2]** L1–L3 · `letters-L0/shot01–10`, `letters-L1/shot01`, `letters-L1/shot03`, `long/letters-L1/big01-first` — Pip is cut in half by the right edge of the frame in every round, or hidden behind the trunk. **Fix:** `letters.js` `PIP_HOME = V(4.55, PY, 0.1)` — bring him inside the framed width (x ≈ 3.4) or include him in the view points.
6. **[P2]** L1–L3 · `letters-L0/shot01`, `letters-L0/shot03`, `letters-L0/shot06`, `letters-L1/shot04`, `letters-L2/shot03–04` — the "Go!" badge covers a letter friend's face (B, M or S) at the start of rounds. **Fix:** engine `showGo` position for this game — below the caption only when nothing is there; here bottom-centre over the rug.
7. **[P2]** L2–L3 · `letters-L1/shot01–08`, `long/letters-L1/shot01–04` — Level 2 is framed from far away: the train sits in the top half, the things in the carriages are 40–50 px, and the bottom 45% of the screen is empty floor. **Fix:** `letters.js` `'four'` view — raise the look-at so the rug's far edge is at 80% of the height and dolly in until the four carriages span 92% of the width.
8. **[P2]** L1–L3 · `letters-L0/shot12`, `letters-L1/shot08–11`, `letters-L2/shot08–12`, `long/letters-L0/shot07–09` — the finale photo: the train is about 20–25% of the screen height with the bottom half empty, the rug is cut by the right edge, and in L3 a lamp post stands between B and M with its lantern against M's face. **Fix:** `letters.js` finale view — frame the train's box (engine to last carriage, letter tops) at 85% of the width; hide the Level 3 lamp posts for the photo.
9. **[P2]** L3 · `letters-L2/shot07–12` — the two things she did not choose (sun, banana) are left lying on the rug through "All aboard!" and the finale photo. **Fix:** `letters.js` end of the last `sound` round — send leftovers back into the trunk (`boxOut` in reverse) before "All aboard!".
10. **[P2]** L1 · `letters-L0/shot05`, `long/letters-L0/shot03` — the teddy stands on the carriage sill with its feet through the yellow rail and its head over B's feet. **Fix:** `letters.js` seat positions (`bayPos()`) / thing scale in the bay — seat tall things at 0.8 scale behind the sill.
11. **[P2]** L2–L3 · `letters-L1/shot01`, `letters-L2/shot01` — the hint is three overlapping glow rings plus a hand over the carriage and the thing. **Fix:** `letters.js` hint ladder — one halo on the thing, the hand path to the carriage; no second and third ring.
12. **[P2]** L1–L3 · `long/letters-L1/big01-first`, `letters-L0/shot03` — the engine's boiler carries scratchy dark ink strokes and the carriages' lower skirts end in ragged scribbles over the wheels. **Fix:** `prop_lt_stage.py` (`prop_lt_carriage`, engine) — see model verdicts.
13. **[P3]** L1–L3 · every shot — the lower-case tag on each carriage is about 20 px. **Fix:** `letters-stage.js` tag — twice the size, on the sill centre.
14. **[P3]** L3 · `letters-L2/shot03` — the sock stands bolt upright on the rug like a striped post. **Fix:** `letters.js` rug pose for the sock — lay it on its side with the foot showing.
15. **[P3]** L2–L3 · `letters-L1/shot05–06`, `letters-L2/shot05` — the station sign at the right is cut by the frame edge. **Fix:** `letters-stage.js` sign x — inside the `'four'` view or out of it.

Teleports: 0 events at all three levels and in the six extra sets.

## farm · words — Word world

Captures: `words-L0`, `words-L1`, `words-L2` (12 shots each) and `long/words-L0` (9 shots), `long/words-L1` (11 shots), `long/words-L2` (10 shots): on a fresh install all three levels visit the animals (farmyard and garden) and none reaches the sorting train. Extra runs forced other places with `window.__wordsForce` and a seeded word memory so the Level 3 train appears: `long/words-toys`, `long/words-clothes`, `long/words-vehicles` (Level 3 with sorting), `long/words-food`, `long/words-home`, `long/words-body` (Level 2). The white glove in the 1280×800 shots is the app's own `#cursor` following the capture machine's mouse, not a defect. Rule 0 is met by the clock (rounds open every 2–3 s and take a touch at once), but see item 1.

1. **[P1]** L1–L3 · `words-L0/shot09`, `words-L2/shot10`, `words-L1/shot11`, `long/words-L1/shot08`, `long/words-clothes/shot11` — prompts arrive before the camera does. The game opens input at once and lets the camera glide for up to 2.2 s (`glideTime()`: 0.8 s, 1.6 s, up to 2.2 s), so she is asked about things she cannot see: "Tap a picture!" with two of the three photos cut off above the frame or hidden under the caption and the hold button (`words-L0/shot09`); "Where's the bird?" with the bird cut in half by the right edge (`words-L2/shot10`); the book and the animals cut by both edges while the photos fly (`long/words-L1/shot08`). **Fix:** `app/src/lessons/words.js` `glideTime()` — cap every glide at 0.8 s (`d < 14 ? 1.6` and `Math.min(2.2, d / 11)` are the long ones) and hold the question line until `glide()` resolves; for the book phase start the glide to `lineView(0)` during the last find's payoff so "Tap a picture!" is said with all photos in frame.
2. **[P2]** L1–L3 · `words-L0/shot02`, `words-L1/shot06`, `words-L1/shot10–11`, `words-L2/shot06`, `words-L2/shot09–10` — at 1280×800 the "Go!" badge covers Pip's head and the newest photo on the line; at 16:9 it moves to the top-right corner and is clear (`long/words-L1/shot04`). **Fix:** engine `showGo` — use the 16:9 corner position at every aspect.
3. **[P2]** L1–L3 · `words-L1/shot05`, `words-L1/shot06`, `words-L1/shot09`, `words-L2/shot05`, `long/words-L1/shot03–04` — when Pip takes a photo the red camera sits inside his face, over one eye (and on his hat brim in `words-L2/shot05`); it reads as a red blotch. **Fix:** `app/src/lessons/words-scene.js` `makePipCamera()` and the photo pose in `words.js` — hold it in both wings 0.25 in front of the beak, below the eyes, at 1.4× size.
4. **[P2]** L1–L3 · `words-L0/shot07`, `words-L0/shot01`, `words-L1/shot09` — a foreground gate post and rails fill the right third of the farmyard close-up and are cut by the frame. **Fix:** `words-scene.js` `makeNookSet()` yard dressing — move the gate behind the mat or drop it for the close view.
5. **[P2]** L1–L3 · `words-L0/shot03`, `words-L1/shot03–07`, `long/words-L1/shot02–04` — the bee is a yellow ball with two white lumps and no stripes, sitting on a stump like a smiley; the hedge it sits in front of is a green slab with dots. **Fix:** bee model (`tools/blender/creatures/prop_words_animals*.py`) — two dark stripes and a waist; `prop_wordgame.py` (`prop_wg_hedge`) — see model verdicts.
6. **[P2]** L1–L3 · `words-L0/shot08`, `words-L0/shot09` — a new photo flies to the top-right and ends under the hold button; others hang half above the top edge. **Fix:** `words-scene.js` `makeLine()` / `LINE.y` — lower the line 0.5 or keep `lineView` framing on while photos land.
7. **[P2]** L2–L3 · `words-L1/shot01–08`, `long/words-L1/shot01–06` — with three things per nook the camera pulls back: animals are about 25% of the screen height and the bottom 30% is empty ground. **Fix:** `words.js` round view (`view(…)` distance for three-thing nooks) — fit to the three things' boxes at 90% of the width.
8. **[P2]** L1–L3 · `long/words-L1/shot09`, `long/words-clothes/shot12`, `words-L0/shot12` — the finale shows a huge, mostly empty book: on a first visit six 70 px photos sit in the top corners of two blank pages of dashed boxes; Pip is cut by the left edge. **Fix:** `words.js` `bookView()` (`view(S.EASEL_X, …, 4.25, 0.3)`) — for the finale fit to the filled places only (first row), so her photos are 20% of the height.
9. **[P2]** L1–L3 · `long/words-toys/shot01–05`, `long/words-clothes/shot01–06` — indoor nooks are a flat pastel wall panel standing alone on the meadow with a disc floor; the white stands on the white floor show only as thin black outlines, like wire. **Fix:** `words-scene.js` `makeNookSet()` indoor branch (`slab(10.2, 6.2, 0.3, …)` wall, `geo.box` floor) — a room corner model with skirting and a rug; tint the stands (`makeStand()`).
10. **[P2]** L3 · `long/words-toys/shot07–10`, `long/words-clothes/shot07–10` — in the sorting round the train does not fit: the engine is cut by the right edge and the first cart by the left; things already put away are tiny (about 75 px) and overlap inside the homes. **Fix:** `words-scene.js` `makeTrain()` / the sort view in `words.js` — three carts and the engine inside 92% of the width; stand stored things in a row on the two shelves without overlap.
11. **[P3]** L1–L3 · `words-L0/shot01`, `words-L1/shot05` — Pip balances on the fence rail or walks along the top of the hedge. **Fix:** `words-scene.js` `makeLedgeRun()` — give him a plank or a low wall to stand on in the outdoor nooks.
12. **[P3]** L1–L3 · `words-L0/shot03–06` — the white bunny has a white outline on the pale green mat and its edge breaks up. **Fix:** as `docs/QA-ISSUES.md` (bunny outline on white fur).

Teleports: 0 events in all nine runs (Pip hops along the ledge; things fly on arcs).

# Part 3 — Model verdicts

Every model file of the five games, judged in the viewer (front, three-quarter, side; untinted) and again where it appears in the captures. **Rebuild** = not acceptable in the play area; **touch up** = a specific flaw to fix; **pass** = no change needed. Scripts: `tools/blender/creatures/prop_roll.py`, `prop_paint.py`, `prop_puzzles.py`, `prop_letters.py`, `prop_lt_stage.py`, `prop_lt_things.py`, `prop_wordgame.py`.

### roll — `prop_rl_*` (32: 1 rebuild, 9 touch up, 22 pass)

| Model | Verdict | What is wrong / what premium looks like |
|---|---|---|
| `prop_rl_pivot` | Rebuild | Crumpled block with a torn, stepped top; reads as a paper bag. A chunky wooden trestle with a rounded saddle. |
| `prop_rl_plank` | Touch up | Tap ring is on the broad face only, so standing up it shows the camera a thin edge (P1, roll item 6). Ring or button on the edge it presents. |
| `prop_rl_hogball` | Touch up | Spikes are flat faceted shards with ragged outlines; from the side they read as torn paper. Rounded cone spikes in two neat rings. |
| `prop_rl_column` | Touch up | Wood-grain stripe breaks into stray dashes on the faces (roll item 14). Clean stripe layer or none. |
| `prop_rl_button` | Touch up | Arrows on the dome are faint and broken into short ink ticks. Bold white arrows. |
| `prop_rl_cart` | Touch up | A plain cream box on four pegs; wheels barely show. A cart shape with visible red wheels and a rim. |
| `prop_rl_jelly` | Touch up | A white sliver sticker on one end and stray ink along the edges; reads as a butter block. A wobbly dome with one round shine. |
| `prop_rl_crumb` | Touch up | The black outline is thicker than the crumb's detail. Thin outline, two chocolate chips. |
| `prop_rl_cushion` | Touch up | A stray ink arc across the ring. Clean inner seam. |
| `prop_rl_water` | Touch up | A flat cyan cube with no outline or surface in the viewer; in game the ripple ring carries it. A darker rim and a wavy top edge. |
| `prop_rl_balloon`, `prop_rl_box`, `prop_rl_cable`, `prop_rl_chute`, `prop_rl_cookie`, `prop_rl_cookie_bit`, `prop_rl_crate`, `prop_rl_door`, `prop_rl_doorframe`, `prop_rl_hatch`, `prop_rl_hogface`, `prop_rl_lifttop`, `prop_rl_log`, `prop_rl_nest`, `prop_rl_peg`, `prop_rl_plinth`, `prop_rl_pop`, `prop_rl_ramp`, `prop_rl_seesaw`, `prop_rl_slope`, `prop_rl_stone`, `prop_rl_wheel` | Pass | The log, cookies, hoglet face and stone are the best of the set. `prop_rl_door` is plain but reads. |

### paint — `prop_pt_*` (37: 1 rebuild, 12 touch up, 24 pass)

| Model | Verdict | What is wrong / what premium looks like |
|---|---|---|
| `prop_pt_dot` | Rebuild | A white disc inside a thick, broken black ring with a stray stroke. A soft paint dot with a thin even outline. |
| `prop_pt_pot` | Touch up | Plain white tub; outline heavy at the sides and missing along the bottom; no rim. A rolled rim, a paint drip, even outline. |
| `prop_pt_table` | Touch up | A thin slab on stick legs; in game a flat cream plane over a third of the screen. Rounded top with an apron and a few paint splats. |
| `prop_pt_ball` | Touch up | A plain disc; the game's single seam line reads as a frown (paint item 7). Panel seams or a star. |
| `prop_pt_apple` | Touch up | The leaf is a blob welded to the hanging ring; cream on a cream card. Leaf clear of the ring, small stalk. |
| `prop_pt_bird` | Touch up | Silhouette is a round body with a stub beak and a paddle tail; hard to read as a bird. Clear head, wing notch, forked tail. |
| `prop_pt_butterfly` | Touch up | Reads as a cloud or a pig's head. Four distinct wings, a waist and antennae. |
| `prop_pt_heart` | Touch up | The top is nearly flat; reads as a shield or gem. Two round lobes with a clear dip. |
| `prop_pt_pig` | Touch up | Pointed cat ears. Folded, rounded pig ears. |
| `prop_pt_crab` | Touch up | Doubled, scratchy outline round the claws. One clean outline. |
| `prop_pt_dish` | Touch up | Stray ink streaks inside the bowl. Clean inner rim line only. |
| `prop_pt_rainbow` | Touch up | Faceted, creased surface like folded paper. Smooth arch with three shallow grooves. |
| `prop_pt_stampcup` | Touch up | Lumpy bowl with a ragged outline. Round turned-wood cup. |
| `prop_pt_block`, `prop_pt_boat`, `prop_pt_brush`, `prop_pt_bunny`, `prop_pt_car`, `prop_pt_cardstand`, `prop_pt_carrot`, `prop_pt_cat`, `prop_pt_duck`, `prop_pt_easel`, `prop_pt_fish`, `prop_pt_flower`, `prop_pt_frog`, `prop_pt_goldfish`, `prop_pt_grapes`, `prop_pt_hangsign`, `prop_pt_lid`, `prop_pt_mushroom`, `prop_pt_pip`, `prop_pt_pumpkin`, `prop_pt_stamp`, `prop_pt_star`, `prop_pt_turtle`, `prop_pt_wall` | Pass | `prop_pt_hangsign` is a good model shown far too small (paint item 2). |

### puzzles — `prop_pz_*` (20: 1 rebuild, 4 touch up, 15 pass)

| Model | Verdict | What is wrong / what premium looks like |
|---|---|---|
| `prop_pz_box` | Rebuild | Flat-fronted and only 0.27 deep: closed it is a rectangle, open a tall sheet with a flap (puzzles item 5). A toy chest seen slightly from above, lid hinged back, dark inside. |
| `prop_pz_lockbox` | Touch up | Smaller than the piece it holds; the key ring hangs through the floor (puzzles item 2). Bigger box, key at mid-height. |
| `prop_pz_peg` | Touch up | A plain 30 px pin in game. Fat mushroom-head peg in a bright colour. |
| `prop_pz_ramp` | Touch up | Two hairline rails and a glass tube; the marble track does not read at game size. Chunky wooden gutter. |
| `prop_pz_hook` | Touch up | Thin post with a tiny grey hook. Thicker stem, big coloured hook. |
| `prop_pz_board1`, `prop_pz_board2`, `prop_pz_board3`, `prop_pz_case`, `prop_pz_circle`, `prop_pz_cup`, `prop_pz_heart`, `prop_pz_lid`, `prop_pz_plug`, `prop_pz_rect`, `prop_pz_square`, `prop_pz_stand`, `prop_pz_star`, `prop_pz_tray`, `prop_pz_triangle` | Pass | The shape pieces are clean, chunky and well bevelled. |

### letters — `prop_lt_*` (38: 2 rebuild, 12 touch up, 24 pass)

| Model | Verdict | What is wrong / what premium looks like |
|---|---|---|
| `prop_lt_insect` | Rebuild | A ball body on four thick legs with a stripe; as the "ant" it reads as a tomato on a stool (P1, letters item 3). Three segments, six thin legs, feelers, dark colour. |
| `prop_lt_shoe` | Rebuild | A shapeless white lump inside a very thick outline; no sole, laces or opening. A chunky trainer with a toe cap, sole stripe and two lace loops. |
| `prop_lt_carriage` | Touch up | The lower skirt ends in ragged scribble strokes over the wheels. One clean valance edge. |
| `prop_lt_trunk` | Touch up | The inside (and the lid's underside in game) is flat black. Warm lining with a rim. |
| `prop_lt_envelope` | Touch up | The flap's painted edge is feathered and uneven. Crisp triangle flap. |
| `prop_lt_underpants` | Touch up | Spots are jagged polygons. Round spots. |
| `prop_lt_rug` | Touch up | A flat oval disc. Soft rim or fringe, slight thickness. |
| `prop_lt_A`, `prop_lt_D`, `prop_lt_H`, `prop_lt_K` | Touch up | A stray ink tick inside the letter (in the counter of A and D, at the crossbar of H, at the joint of K). |
| `prop_lt_B`, `prop_lt_P`, `prop_lt_R` | Touch up | The counters are almost closed; B's two bowls are dots. Open them to a third of the stroke width. |
| `prop_lt_C`, `prop_lt_E`, `prop_lt_F`, `prop_lt_G`, `prop_lt_I`, `prop_lt_J`, `prop_lt_L`, `prop_lt_M`, `prop_lt_N`, `prop_lt_O`, `prop_lt_Q`, `prop_lt_S`, `prop_lt_T`, `prop_lt_U`, `prop_lt_V`, `prop_lt_W`, `prop_lt_X`, `prop_lt_Y`, `prop_lt_Z`, `prop_lt_flap`, `prop_lt_platform`, `prop_lt_sign`, `prop_lt_track`, `prop_lt_trunklid` | Pass | The balloon letters are clean and friendly; the trunk's outside is one of the best props in the five games. |

### words — `prop_wg_*` (13: 0 rebuild, 1 touch up, 12 pass)

| Model | Verdict | What is wrong / what premium looks like |
|---|---|---|
| `prop_wg_hedge` | Touch up | A rounded green slab with dots. Lumpy clipped-hedge top, leaf clusters, a few flowers. |
| `prop_wg_barn`, `prop_wg_book`, `prop_wg_camera`, `prop_wg_easel`, `prop_wg_garage`, `prop_wg_hamper`, `prop_wg_peg`, `prop_wg_rail`, `prop_wg_sideboard`, `prop_wg_toybox`, `prop_wg_wall`, `prop_wg_wardrobe` | Pass | `prop_wg_camera` is a good model held badly (words item 3). The homes read well with their picture signs. |

### Not model files, but failed in game

| Thing | Built by | Seen in | What is wrong |
|---|---|---|---|
| Indoor nook wall and floor | `words-scene.js` `makeNookSet()` (`slab`, `geo.box`) | `long/words-toys`, `long/words-home`, `long/words-clothes` | A flat wall panel and disc floor standing alone in the meadow |
| White stands on the white floor | `words-scene.js` `makeStand()` | `long/words-toys/shot01–05` | Only the ink outlines show; they read as wire |
| Bee | words animal models (`prop_words_animals*.py`) | `words-L0/shot03`, `words-L1/shot03` | A yellow ball without stripes |
| Paint stroke and dish blob | `paint-canvas.js` | `paint-L0/shot04`, `paint-L2/shot03` | Comb-striped edges; stair-stepped blob |
| Site cabin, digger, brick stack | engine scenery ('build' set) | every roll shot | Flat-shaded boxes behind and beside the play area |
