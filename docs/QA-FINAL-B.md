# Final release review B

Games: band, pots, story, words, dress, myday, snack, cook, candy, bricks, blocks, balance, roll, puzzles, letters.
No code was changed.

## What was run
- `tools/qa-shots.sh <game> <level> $TMPDIR/final-b 12 2500` for all 15 games at levels 0, 1 and 2 (45 runs, 540 frames).
  No TELEPORT, UNCAUGHT, REJECT or AUTOERR line in any run.
- One level of every game played to its finale with a scratchpad driver (admire, photo flash, sticker and the saved
  gallery photo captured; caption timeline and "nothing she can act on" spans logged). All 15 reached the finale.
- World map and the Farm, Home and Building site pages: every tile and icon of these 15 games is present and readable.
- Shots are under `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/` (`<game>-L<level>/shotNN.png`) and finales under `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/<game>-L<level>/`.

Limits: everything was captured at 1280x800 only (not 1366x768 or 1920x1080). Timings come from autoplay, which
acts once a second, so they are good to about 1 s. Autoplay never taps during Story's "tell it back" step
(`complete()` holds `busy`), so that step was only seen in its untouched form.

## Counts

| Game | P1 | P2 |
|---|---|---|
| band | 0 | 1 |
| pots | 0 | 0 |
| story | 0 | 1 |
| words | 0 | 1 |
| dress | 0 | 1 |
| myday | 1 | 2 |
| snack | 1 | 1 |
| cook | 0 | 1 |
| candy | 1 | 1 |
| bricks | 0 | 1 |
| blocks | 0 | 2 |
| balance | 1 | 0 |
| roll | 0 | 1 |
| puzzles | 0 | 0 |
| letters | 0 | 1 |
| engine (finale photo; hits puzzles, snack, story) | 1 | 0 |
| **Total** | **5** | **14** |

## P1: must fix before release

### P1-1 myday, Level 3 bath: Bunny's foot pokes through the side of the tub
- Shot: `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/myday-L2/shot12.png` (pink toe pad on the outside of the blue tub wall, lower right, about x 805, y 575).
  The bath model has no pink decal (`tools/blender/creatures/prop_myday.py`, `bath()`), and the mark is only there while Bunny is in.
- Fix: `app/src/lessons/myday.js`, the `spot === 'bath'` branch of the walk (around line 470) and `bathSpot` (line 134).
  Bunny stands on the tub floor with its feet forward of the inner wall. Tuck the legs the way `tuckTail(true)` hides
  the tail (scale `legL`/`legR` or swing them back) while in the bath, or move `bathSpot` back in z until the toes
  are inside the wall. Check from the bath camera at all three levels.

### P1-2 balance, Levels 1 and 2, first round: the scoop rests inside the see-saw's pivot brick
- Shots: `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/balance-L0/shot02.png`, `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/balance-L1/shot02.png` (zooms `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/z-bal0-scoop.jpg`, `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/z-bal1-scoop.jpg`).
  The scoop's bowl shows through the front of the red brick and its handle goes behind the brick's edge. This is the
  thing she has to drag, on the first step of the game, and the demo hand points at it.
- Fix: `app/src/lessons/balance.js`, `bringPourer()` (line 288): `x = pailX - side * 2.1` lands on the fulcrum
  (x about 0) for a pail on either end. Park it clear of the brick, for example `pailX - side * 1.2` with |x| kept
  above the brick's half width plus the pourer's radius, or bring `READY_Z` forward so the whole scoop is in front.

### P1-3 candy, all levels: 12 s before her first note, and candies switched off for 4 to 10 s before every phrase
- Measured at Level 2 (`/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/candy-L1/log.txt`): game opens 13.4 s, "Listen!" 16.0 s, "Your turn!" 25.5 s.
  Later phrases: 4.0, 9.6, 3.9, 5.2 and 7.7 s from "Listen!" to "Your turn!". Level 1 is the same shape:
  `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/candy-L0/shot02.png` to `shot04.png` are all "Listen!".
- During that time `startPhrase()` sets `tap.enabled = false` on every candy, so the only things on stage do nothing.
  This breaks rule 0 (2 s from opening, never more than 2 s with nothing to touch). Band already solves the same case.
- Fix: `app/src/lessons/candy.js`, `startPhrase()` (line 356) and `hit()` (line 393): leave the candies tappable
  while Pip plays and treat a tap in phase `'listen'` as a soft play-along (`this.sing(i, { soft: true, float: false })`,
  as `jam()` does) that does not count. Also cut the pre-roll (0.45 s wait, "Listen!" 0.9 s, `voiceIdle`) for the
  first phrase by starting it under the opening line.

### P1-4 snack, all levels: "Tap the tap / soap!" is said about 5 s before the friend can do it (friends 2 and 3)
- Measured at Level 2 (`/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/snack-L1/log.txt`): prompt 38.0 s, soap happens 43.8 s; prompt 63.2 s, soap 68.8 s.
  From finishing a plate to the next action being possible is about 10 s (33.3 to 43.6 s, and 58.5 to 68.6 s).
- Shots: `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/snack-L0/shot12.png`, `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/snack-L1/shot11.png`, `shot12.png` (prompt up, old friend still walking off in
  the foreground, new friend not at the sink).
- A tap in that time is only queued (`snack.js` line 841). At Level 1 the water starts, but at Levels 2 and 3 a tap
  on the soap shows nothing at all until the friend arrives.
- Fix: `app/src/lessons/snack.js`, `startRound()` (line 388) and `toSink()` (line 434). Start the next friend's walk
  to the sink during the plate payoff so it is in place when the round starts (the `near()` wait of up to 2.5 s plus
  walk, turn, arms and step is what takes the time), and call `prompt()`/`teach()` only once it is there. Give a
  queued soap tap an immediate response (pump squish and a blob waiting on the nozzle).

### P1-5 engine, finale photo: the saved photo cuts the sides off wide creations (puzzles, snack, story)
- `takeSnaps()` in `app/src/engine/stage.js` (line 85) centre-crops the canvas to 4:3. At 1280x800 that removes 8% from
  each side, and at 16:9 it removes 12.5%.
- Shots: `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/puzzles-L1/gallery-photo.jpg` (the moon, her first piece, cut in half; the last piece cut),
  `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/snack-L1/gallery-photo.jpg` (first plate cut), `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/story-L1/gallery-photo.jpg` (last story card and Pip cut).
  The same crop is what the photo flash shows and what the home shelf keeps as "You made this!".
- Fix: in `takeSnaps()`, render one extra frame for the photo with the camera at 4:3 and the vertical FOV widened so
  the horizontal extent is unchanged, then restore the camera. Otherwise each wide `creationView()` (puzzles
  `fitView()`, snack `viewFor('table')`, story line 458) has to keep its creation inside the middle 75% of the width.

## P2: should fix

- **story: the game tells the story for her.** In the tell-back step the hand shows at 3 s and the card plays itself
  at 4 s (`story.js` `waitTell()`, line 394). Untouched timeline: 22.3, 27.9, 33.5 s (`/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/story-L1/log.txt`).
  Give her time: hand at 3 s, self-play no sooner than 8 s.
- **band finale: the big bell's frame crosses the band's instruments and paws.** `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/band-L1/fin2-admire.jpg`.
  `band.js` `creationView()` (line 620) says the frame stays below the band's feet; with the big bell it does not.
  Raise the camera or lower/shift the big instrument for the finale.
- **blocks finale: her builds are tiny and the empty mat fills the picture; Bear is cut by the right edge.**
  `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/blocks-L2/fin2-admire.jpg`. `blocks.js` `creationView()` (line 1043): when nothing stands on the mat, frame the shelf only.
- **blocks: the "like this" model is very small at Level 1** (about 25x45 px), `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/blocks-L0/shot01.png`; and the
  roll round's camera cuts Bear and the tray at the frame edge, `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/blocks-L2/shot06.png`.
- **letters finale: the train is a thin strip** (about 12% of the height) and the things she packed are a few
  pixels each. `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/letters-L2/fin2-admire.jpg`, `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/letters-L1/shot08.png`. Bring `creationView()` in so the train spans about 90% of the width.
- **roll finale: babies on the top row cover Mummy's mouth; Pip has his back to the camera during the admire.**
  `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/roll-L0/fin2-admire.jpg`, `gallery-photo.jpg`. `roll.js` `onFinale()` (line 2062): seat Mummy higher or to the side.
- **dress: cloth.** Monkey's shoulder shows through the party dress with a ragged edge in the "So pretty!" pose,
  `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/dress-L1/shot02.png` (zoom `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/z-dress1-pretty.jpg`); small ink ticks at the jumper collar and T-shirt shoulder,
  `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/dress-L2/shot05.png`, `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/dress-L0/shot03.png`. `dress-moves.js` pose limits and the garment layers in `dress-clothes.js`.
- **myday: the hand towel in use is a flat green card with one stripe** (slab cloth), `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/myday-L0/shot07.png`
  (zoom `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/z-md0-b7.jpg`). Use the wrapped towel model (`prop_md_towelwrap`) for the rub.
- **myday Level 2: the duvet she has to drag is cut by the bottom of the screen**, `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/myday-L1/shot03.png`.
  `myday.js` `viewFor()`: include the duvet's box in the bedroom framing.
- **snack: model flaws at the sink and plate.** Heavy doubled ink lines down Bear's arms at the sink,
  `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/snack-L0/shot03.png`; Cat's ear folds into a dark crease when the head turns, `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/snack-L1/shot08.png`
  (zoom `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/z-sn1-cat.jpg`). Limit the head turn in `snack-reach.js` or fix the ear weights.
- **cook: the demo hand is left behind when the camera moves.** After the board is held the view glides to the pot
  and the hand, still at its old screen spot, sits on the stove knob while the caption says "Hold the board!":
  `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/cook-L1/shot07.png`, `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/cook-L2/shot07.png`. Seen under autoplay; a real hold inside the 2.2 s demo would do the
  same. Call `fx.clearHands()` at the start of `lift()` (`cook.js` line 981) and `tip()`.
- **words, photo book: the photos to tap are small (about 5% of the width), Pip's hat covers the cow photo, and the
  last photo touches the right edge under the Go! badge.** `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/words-L2/shot11.png`. `words.js` `lineView()` (line 475)
  and `PIP_BOOK_X`.
- **candy Level 3: the phrase tiles are very small** (seven tiles of about 40x25 px), `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/candy-L2/shot06.png`.
- **bricks: about 5 s between finishing a letter and the next brick being tappable** ("A is for Apple!" 19.5 s,
  first brick of B about 24.5 s; `/var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-b/fin/bricks-L0/log.txt`). The finished letter can be poked meanwhile. Lay the
  next heap out during the picture payoff (`bricks.js` around lines 490 to 560).

## Checked and clean
- pots and puzzles: nothing to report in play at any level.
- Paws in the basin (myday, snack), knife and chopping (cook), walking and hopping (no snaps flagged or seen),
  Go! badge and captions (never over a face or a target in a settled frame), and the finale showing the creation on
  screen in all 15 games.
