# Final release review A

Games: colours, counting, shapes, feelings, sizes, paint, patterns, where, more, body, sink, moo, share.
Reviewed against `docs/FEEL-BRIEF.md` (rule 0 first) and `docs/QUALITY-BRIEF.md`. No code was changed.

## What was run

- `tools/qa-shots.sh <game> <level> $TMPDIR/final-a 12 2500` for all 13 games at levels 0, 1 and 2 (39 runs, 468 frames). Every frame was looked at; contact points, faces and captions were cropped and zoomed.
- One full play to the finale per game at level 1 (45 frames every 3 s), with a probe that logs every stretch longer than 1.4 s in which no answer target is enabled, and with the saved finale photo extracted from `ll.creations.v1`.
- Three dense captures (a frame every 0.35–0.5 s) to confirm suspects: paint level 2 opening, paint level 2 hang step, where level 1 opening.

All shots are under `S = /var/folders/2b/zdd2m80d2d50_6s0s78dr47c0000gn/T/final-a/`. Shot files are named `.png` but contain JPEG data. Level folders are `<game>-L<n>/`, finale runs are `<game>-L1-fin/` (frames, `log.txt`, `fin.jpg` = two finale frames plus the saved photo, `photo-<game>-0.jpg`).

### Limits of this review

- Timings come from autoplay at level 1 only. Levels 0 and 2 were not timed.
- A second Electron (the other reviewer's `final-b` runs) was running at the same time for most of the session, so measured times may be a little long. Every timing P1 below is also supported by adding up the waits in the code.
- The probe counts only answer targets (`input.addTap` / `addDrag`). Poking characters still works during those stretches. Paint and the feelings comfort step use their own pointer listeners, so the probe does not apply to them; those were judged from code and frames.
- Only 1280x772 was captured. 1366x768 and 1920x1080 were not checked.
- The TELEPORT flags in patterns (duck, crab, gull) and where (duck 0.77–1.35, crab 0.77) are false positives: hidden row items being placed before they are shown, and the tiny creature icons inside the thought bubble (world scale 0.01–0.3). No real teleport was found in these 13 games.

## Counts

| Game | P1 | P2 |
|---|---|---|
| colours | 0 | 5 |
| counting | 1 | 4 |
| shapes | 1 | 2 |
| feelings | 2 | 4 |
| sizes | 1 | 3 |
| paint | 1 | 3 |
| patterns | 1 | 3 |
| where | 3 | 3 |
| more | 1 | 4 |
| body | 1 | 3 |
| sink | 2 | 3 |
| moo | 2 | 4 |
| share | 1 | 3 |
| **Total** | **17** | **44** |

## Two causes behind most of the P1s

**A. Long waits after a correct answer (rule 0).** Eight games leave her 5–16 s between her last action and the next thing she can answer. The pattern is the same everywhere: `success()` waits for the payoff (up to 3 s) plus stillness, then `afterSuccess()` awaits the keepsake move, and only then does `startRound()` begin its own arrival animation. The brief asks for the next round to be laid out while the celebration plays.

| Game (level 1) | Measured wait per round, last action to next answer target | Log |
|---|---|---|
| patterns (train) | 7.3–13.4 s, then a 1.4 s engine-tap window, then 2.1 s more | `S/patterns-L1-fin/log.txt` |
| feelings | 9.5–11.6 s between friend taps, including her comfort gesture | `S/feelings-L1-fin/log.txt` |
| sizes | 7.1–8.3 s | `S/sizes-L1-fin/log.txt` |
| where | 6.8–7.7 s | `S/where-L1-fin/log.txt` |
| share | 6.05–6.95 s | `S/share-L1-fin/log.txt` |
| moo | 4.95–7.45 s after feeding, plus 1.7–2.3 s from tap to treat | `S/moo-L1-fin/log.txt` |
| shapes | 5.2–6.8 s | `S/shapes-L1-fin/log.txt` |
| counting | 4.15–4.9 s, twice per round | `S/counting-L1-fin/log.txt` |

For comparison: colours 1.45–2.2 s, more 2.05–3.65 s, body one 3.85 s gap, sink one 2.15 s gap.

**B. Demo hands drawn in the wrong place after a camera move.** `fx.ghostPath()` in `app/src/engine/fx.js` projects its world points to the screen once, when it is called (`const pts = points3.map((p) => project(p))`). Any demo that starts while the camera is still gliding keeps pointing at the old screen position. This hits paint level 3 and sink.
Fix in the engine: keep `points3` and re-project every frame inside `ghostPath`. Until then, each game must wait for its glide to finish before starting a demo, and call `fx.clearHands()` on every phase or camera change.

---

## P1: must fix before release

### counting
**P1-1. Two dead waits of 4.2–4.9 s in every round.**
- Evidence: `S/counting-L1-fin/log.txt` (11 gaps, 4.15–4.90 s).
- Cause: after the last fruit, `recount()` runs 1.25 s + 0.5 s per fruit + 1.0 s before the friend can be tapped. After the friend is tapped, the sniff (1.1 s), `toShelf()` (1.1 s or more), `await this.wait(1.0)` and the next host's arrival (0.7 s + 0.15 s per item) all run in series.
- Fix in `app/src/lessons/counting.js`: add the friend/basket tap targets in `tapFruit()` as soon as the last fruit is counted, and let the recount play underneath. In `afterSuccess()`, do not await `toShelf()`, drop the 1.0 s wait, and start the next host while the bowl flies.

### shapes
**P1-2. 5.2–6.8 s with nothing to answer after every correct window.**
- Evidence: `S/shapes-L1-fin/log.txt`.
- Cause: `fit()` then `peek()` (0.5 + 1.0 + 0.4 s) as the payoff, then 0.5 s, then `afterSuccess()` awaits `prepNext()` plus another 0.5 s, then the next piece's arrival.
- Fix in `app/src/lessons/shapes.js`: resolve `payoffP` when the piece is seated and let `peek()` run without being awaited. Start `prepNext()` and the next piece's entrance during the peek. Remove `await this.wait(0.5)` in `afterSuccess()`.

### feelings
**P1-3. Long waits on both sides of the comfort step.**
- Evidence: `S/feelings-L1-fin/log.txt` (9.45–11.6 s between friend taps).
- Cause: in `tapFriend()` the payoff is the friend's walk to the stage plus a 1.0 s hop and 0.3 s turn, about 3.3 s before she can comfort Pip. After comforting, `afterSuccess()` waits 0.4 s, `fix()` (up to 3 s), 1.0 s, and then the new friends step in.
- Fix in `app/src/lessons/feelings.js`: call `comfort(a)` as soon as the friend starts walking (the gesture is on Pip, who is already there). After the comfort, run `fix()` and `toSlot()` without awaiting and call `nextRound()` straight away.

**P1-4. The finale shows the friends as a tiny overlapping clump with the back row hidden.**
- Evidence: `S/feelings-L1-fin/fin.jpg`, `S/feelings-L1-fin/photo-feelings-0.jpg`. Four friends can be made out at about 35 px each; the lower half of the frame is empty ground.
- Fix in `app/src/lessons/feelings.js`: spread `SLOTS` into one row with at least 1.6 units between friends, turn them to the camera in `onFinale()`, and compute `creationView()` from the bounding box of Pip's stage plus `this.stayed` so it fills about 60% of the height.

### sizes
**P1-5. 7.1–8.3 s between rounds.**
- Evidence: `S/sizes-L1-fin/log.txt`.
- Cause: `payoff()` (beat, stomp or bounce, jump), then `afterSuccess()` holds a fixed `await this.wait(3.0)` poke-play window, then awaits `toLine()`, then `arrive()` takes another 1.0–1.3 s.
- Fix in `app/src/lessons/sizes.js`: cut the 3.0 s to 1.0 s at most, do not await `toLine()`, and start the next `arrive()` while the found thing travels to the rug.

### paint
**P1-6. Level 3: the demo hand points at the wrong place three times in the first round.**
- Evidence: `S/paint-L2-start/grid.jpg` (frames 2–4: with "Let's make orange!" the hand taps beside and on the stack of spare plates, then the bare table, never the red pot or the mixing dish). `S/paint-L2-hang/grid.jpg` (frames 5–6: the hand taps about 250 px left of the "hang it up" sign; frames 9–12: the drag hand runs up a line about 300 px right of both the toy and the hook). Also `S/paint-L2/shot01.png` and `S/paint-L2/shot10.png`.
- Cause: cause B. Level 3 switches between the table camera and the easel camera, and `demo()` starts during the glide.
- Fix: the engine fix under cause B, or in `app/src/lessons/paint.js` `demo()` wait for the camera glide to finish before each `fx.ghostPath` call for `dish`, `done` and `hang`.

### patterns
**P1-7. 10–16 s between rounds on the train level.**
- Evidence: `S/patterns-L1-fin/log.txt` (7.3, 9.8, 12.7, 9.7, 13.35 s gaps, each followed by 2.1 s more).
- Cause: `place()` hop (0.9 s), tune payoff (up to 3 s), 1.0 s still, then `afterSuccess()` awaits `toBack()`, `engineLeaves()` (up to 1.4 s waiting for an optional tap), 0.8 s and 1.0 s. `place()` also awaits `this.arrival` when she answers before the train has finished rolling in. Levels 1 and 3 share everything except the engine part, about 6.5 s by the code.
- Fix in `app/src/lessons/patterns.js` `afterSuccess()`: start `toBack()`, the engine leaving and the next `rollIn()` without awaiting, and return at once so the next choices are on the towel within 1.5 s. Shorten the tune payoff to one pass capped at 1.5 s.

### where
**P1-8. 6.8–7.7 s between rounds.**
- Evidence: `S/where-L1-fin/log.txt`.
- Cause: `storyPayoff()` plus gag (up to 3 s), 1.0 s still, `afterSuccess()` 0.3 s plus a 1.5 s keepsake move, then the next character walks in for 1.0 s or more.
- Fix in `app/src/lessons/where.js`: run the keepsake move and the next character's walk-in during the payoff, and do not await the 1.5 s move.

**P1-9. The finale hides what she made.**
- Evidence: `S/where-L1-fin/shot17.png`, `S/where-L1-fin/photo-where-0.jpg`. The distractor picnic basket stands in front of the umbrella-and-duck and boat-and-crab keepsakes, and the hovering sun hat covers the deck chair. No caption is on screen in that frame either.
- Fix in `app/src/lessons/where.js`: in `onFinale()` fade the round's distractor prop, send the last station to its keepsake slot, and compute `creationView()` from the bounding box of the keepsake row instead of the fixed `[0, 5.6, 13.2]`.

**P1-10. Level 3 "Put the gull ON the umbrella!": the gull's face goes behind the caption.**
- Evidence: `S/where-L2/shot06.png` (gull's head hidden behind the prompt bubble as it lands), `S/where-L2/shot07.png` (resting gull's head at caption height).
- Fix in `app/src/lessons/where.js`: lower the umbrella station (scale about 0.8) or raise the camera look for that station so the ON spot plus the gull's height projects below about 130 px from the top.

### more
**P1-11. Captions cover the snacks being compared and fed.**
- Evidence: `S/more-L1/shot06.png` ("More!" hides the third of five ice creams), `S/more-L1/shot07.png` ("Feed Duck! Tap Duck!" covers the tops of three of the five), `S/more-L1/shot11.png`, `S/more-L0/shot06.png`, `S/more-L2/shot07.png`, `S/more-L2/shot12.png`.
- Fix in `app/src/lessons/more.js`: lower `this.L.rows[0]` (the upper row used by `matchUp()`) by about 0.8 units on every level, or pull the camera back so the upper row projects below 130 px.

### body
**P1-12. Broken dark streaks down the body whenever a friend raises a paw to its face.**
- Evidence: `S/body-L0/shot02.png` and `shot10.png` (bear), `S/body-L1/shot02.png` (bunny), `S/body-L1/shot12.png` (cat), `S/body-L2/shot02.png` (frog). Crops in `S/body-L0/cc.jpg` and `S/body-L1/cc.jpg`.
- Cause: the reach in `app/src/lessons/body.js` (the block starting "Reach by ROTATING each arm about its shoulder") swings the arm across the chest, where the arm's ink outline breaks up against the torso.
- Fix: clamp the rotation so the paw stops in front of the cheek on its own side and let the head bow do the rest, or turn off the arm's outline pass while `k > 0`. Re-check all four animals in the pose viewer.

### sink
**P1-13. The thing she has to drag out of the tank is tiny and faint.**
- Evidence: `S/sink-L0/shot11.png` (the stone is about 60 x 25 px, grey-blue behind tinted glass, with "It sinks! Put it in the orange tub!"), `S/sink-L1/shot07.png` (key).
- Fix in `app/src/lessons/sink.js`: bring `CAMS.lab` closer (distance 12.4 to about 10, look y about 1.2) so the tank and tubs fill the width, and give the item a halo or bob while `phase === 'sort'`. The lower third of that view is empty sand.

**P1-14. Levels 2 and 3: the demo hand points at Crab or the tank rim instead of the tub or the item.**
- Evidence: `S/sink-L1/shot07.png`, `shot08.png`, `shot11.png` (hand on Crab with "Tap a tub!" / "In the orange tub!"), `S/sink-L1/shot09.png`, `shot10.png` (hand at the tank's bottom rim with "Drop it in!"). The hand sits at one fixed screen position in all five frames, which is where the blue tub is in the tubs camera.
- Cause: cause B, plus hands are not cleared when the phase changes.
- Fix: the engine fix under cause B, and call `fx.clearHands()` at every phase change in `app/src/lessons/sink.js`. Autoplay never sends a real touch, so this needs a manual check after the fix.

### moo
**P1-15. A flat tan or brown band runs across the bottom of the screen in every frame.**
- Evidence: every moo shot, for example `S/moo-L0/shot06.png` (about 38 px), `S/moo-L1/shot01.png`, `S/moo-L2/shot10.png` (about 90 px with four animals). An egg rolls onto it and is cut by the frame in `S/moo-L2/shot08.png`.
- Cause: the camera in `VIEWS` sees past the front edge of the farm ground.
- Fix in `app/src/lessons/moo.js` / `moo-farm.js`: extend the ground patch towards the camera by at least 6 units, or raise each `VIEWS[n].look.y` until the edge is out of frame at all three sizes.

**P1-16. 5–7.5 s after feeding before the next animals can be tapped.**
- Evidence: `S/moo-L1-fin/log.txt`.
- Fix in `app/src/lessons/moo.js` `afterSuccess()`: walk the fed animal to the straw bed without awaiting and bring the next row in at the same time.

### share
**P1-17. 6–7 s between rounds.**
- Evidence: `S/share-L1-fin/log.txt` (6.05–6.95 s, five rounds).
- Cause: `afterSuccess()` awaits the whole eating payoff, 0.6 s, then the walks to the bench, before the next friends and plates come in.
- Fix in `app/src/lessons/share.js`: bring the next friends and plates in while the fed ones walk to the bench; do not await the walks.

---

## P2: should fix

### colours
1. The throwing friend's feet are cut by the bottom edge (`S/colours-L0/shot07.png`, `S/colours-L2/shot06.png`, `shot12.png`). Fix: `FRIEND_AT` z 5.6 to about 4.9 in `colours.js`.
2. Level 2: Pip is cut by the left edge and half hidden by the red basket (`S/colours-L1/shot06.png`). Fix: the basket branch of `this.pip.position.set(...)` in `build()`.
3. Finale: baskets are about a quarter of the frame height with the lower half empty, and the 4:3 photo crops the green basket and Pip (`S/colours-L1-fin/fin.jpg`). Fix: `creationView()` closer and fitted to 4:3.
4. First touch 2.3 s after opening, and 2.2 s on friend-throw rounds (`S/colours-L1-fin/log.txt`). Fix: shorten the wind-up in `friendThrow()`.
5. The hedgehog friend looks half sunk into the mat with a ragged cream edge on its belly (`S/colours-L1/cc.jpg`). Fix: check the model's foot height at scale 0.5 in `friendIn()`.

### counting
1. On bush and table hosts the keepsake shelf is hidden; the bowl flies behind the host and vanishes (`S/counting-L0/shot08.png`, `S/counting-L1/shot09.png`, `S/counting-L2/shot05.png`). Fix: move `SHELF` or shrink those hosts in `counting-hosts.js`.
2. The frog visitor stands on top of Pip (`S/counting-L2/shot11.png`). Fix: the frog's spot in `counting.js`.
3. Cupcakes land upside-down and pass through each other in the bowl (`S/counting-L2/shot09.png`). Fix: lower centre of mass or upright constraint in `counting-items.js`.
4. Finale photo: the empty bucket fills the lower half and its handle crosses the shelf (`S/counting-L1-fin/fin.jpg`). Fix: `fadeAway(this.box.obj)` in `onFinale()`.

### shapes
1. Castle with four windows: the two middle ledges cut across the door arch (`S/shapes-L2/cc.jpg`, from `shot09.png` and `shot11.png`). Fix: raise the window row or lower the door in `castle()` in `shapes-themes.js`.
2. Finale photo crops the engine and catches a friend walking across the wheels (`S/shapes-L1-fin/fin.jpg`). Fix: fit `creationView()` to 4:3 and hold the walk-on until after `takePhoto()`.

### feelings
1. After the present opens, the box hovers in the air beside Pip (`S/feelings-L0/shot03.png`, `shot05.png`). Fix: rest it on the blanket in `feelings-stories.js`.
2. The friend on the stage stands in the picnic basket (`S/feelings-L0/shot06.png`, `shot07.png`). Fix: `ON_STAGE` offset or move the basket in `feelings-props.js`.
3. Friends who stayed overlap each other and the flowers, and the next round's choices stand in front of them (`S/feelings-L0/shot12.png`, `S/feelings-L1/shot10.png`). Fix: `SLOTS`.
4. The hop down from the stump throws the bear a full body height into the sky (`S/feelings-L2/shot09.png`). Fix: arc 0.6 to about 0.25 in `toSlot()`.

### sizes
1. Rug keepsakes sit behind the left choice and peek out round it (`S/sizes-L0/shot06.png`, `shot09.png`; `S/sizes-L1/shot08.png`, `shot11.png`; `S/sizes-L2/shot05.png`, `shot12.png`). Fix: move `RUG` away from `XS2`/`XS3`.
2. In the peek round the kept elephant looks over the bush like the hider (`S/sizes-L0/shot12.png`). Same fix.
3. Finale: the rug line is small with the lower 40% empty (`S/sizes-L1-fin/fin.jpg`). Fix: `tray.view(0.8)` and a lower look.

### paint
1. "Hang it up!" covers the top of her painting and its ring, and sits on the hook's ropes (`S/paint-L1/shot11.png`, `S/paint-L1-fin/shot17.png`, `S/paint-L0/shot11.png`). Fix: lower `HOOK_UP` or raise the hang camera in `paint.js`.
2. In the hang view the toy's bottom is cut by the frame and the brush lies across it (`S/paint-L1-fin/shot42.png`, `S/paint-L0/shot11.png`). Fix: the hang camera; park the brush at `BRUSH_TIP[0]`.
3. Finale photo crops the first and last painting in each row (`S/paint-L1-fin/photo-paint-0.jpg`). Fix: fit `creationView()` to 4:3.

### patterns
1. Level 1: Pip's hat brim is cut by the left edge in every frame (`S/patterns-L0/shot01.png`). Fix: `this.pip.position.set(-5.9, ...)` to about -5.3.
2. Level 3: the "?" hangs over the sea until its podium rises, and the demo hand shows the answer when only two of five things are up (`S/patterns-L2/shot01.png`). Fix: hold the demo in `startRound()` until `this.arrival` resolves.
3. Finale photo crops the engine and Pip (`S/patterns-L1-fin/fin.jpg`). Fix: `creationView()` for 4:3.

### where
1. The cardboard box's flap pokes into Pip (`S/where-L1/shot09.png`, crop in `S/where-L1/cc.jpg`); the umbrella canopy touches Pip's lantern (`S/where-L2/shot06.png`). Fix: left station x in `where.js`.
2. The active station stands in front of the keepsake row: a second crab's eyes over the big crab's head, the kept bucket apparently under the chair (`S/where-L0/shot11.png`, `S/where-L2/shot09.png`, `S/where-L1/shot08.png`). Fix: keepsake row z further back or off to the side.
3. "Under" props hover in mid-air while idle: bucket, box, sun hat (`S/where-L2/shot01.png`, `shot12.png`, `S/where-L1-fin/shot17.png`). Fix: rest them on the sand and lift only while the character is carried.

### more
1. Pip is half hidden behind the eater on levels 1 and 2 and in the finale photo (`S/more-L0/shot01.png`, `S/more-L1/shot01.png`, `S/more-L1-fin/fin.jpg`). Fix: `this.pip.position.set(px, ...)` further left.
2. Level 3: the lower line-up row runs across Pip's hat (`S/more-L2/shot04.png`, `shot11.png`). Fix: with P1-11, `this.L.rowZ` or Pip's position.
3. 2.05–2.35 s from round start to choosing and 2.8–3.65 s from choosing to feeding (`S/more-L1-fin/log.txt`). Fix: shorten `dropGroup()` and `matchUp()`.
4. The finale shows nothing she made: a sleepy eater and leftover snacks (`S/more-L1-fin/fin.jpg`). Fix: add a keepsake tray of what was fed.

### body
1. Gear appears on top of the waiting friends or behind the beach balls (`S/body-L1/shot04.png`, `shot12.png`; `S/body-L2/shot02.png`, `shot04.png`). Fix: move the gear spot to open sand in `body.js` / `body-gear.js`.
2. Finished friends crowd over Pip and the waiting cat and bear overlap each other (`S/body-L2/shot01.png`, `shot06.png`, `shot11.png`). Fix: `PIP_AT[2]` and the queue spacing.
3. 3.85 s with nothing to do when the friend changes (`S/body-L1-fin/log.txt`). Fix: enable the first gear while the next friend walks in.

### sink
1. The tap fallback's arc passes behind the caption (`S/sink-L0/shot10.png`, `S/sink-L2/shot09.png`). Fix: lower the arc apex in `dropIn()`.
2. Things that sank are almost invisible inside the orange tub (`S/sink-L0/shot11.png`). Fix: raise the sand bed or lower the rim in `sink-items.js`.
3. 2.15 s from guess to drop (`S/sink-L1-fin/log.txt`). Fix: enable the drag when the glide starts.

### moo
1. The feed bowl is at the bottom-left, up to about 1000 px from the animal it feeds (`S/moo-L1/shot09.png`). Fix: `BOWL_AT` under the row centre.
2. The bowl is sunk into the grass with a green patch over its rim (`S/moo-L0/a.jpg`, from `shot06.png`). Fix: bowl y in `build()`.
3. The hen's egg rolls off the ground and is cut by the frame (`S/moo-L2/shot07.png`, `shot08.png`). Fix: stop it with a collider.
4. Kept animals peek out from behind the choices, and the arriving pig walks in front of Pip (`S/moo-L1/shot05.png`, `shot09.png`, `S/moo-L2/shot09.png`). Fix: `TRAY_AT` and the walk-in path.

### share
1. The food crate or basket is cut by the bottom edge in two-friend rounds (`S/share-L0/shot01.png`, `S/share-L1/shot01.png`, `S/share-L2/shot01.png`). Fix: `CRATE` z 3.9 to about 3.3 in `share.js`.
2. With three friends the left one overlaps Pip and hides the bench keepsakes (`S/share-L2/shot07.png`, `S/share-L1/shot05.png`). Fix: `this.pip.position.set(-6.5, ...)` and the first bench spot.
3. Finale photo cuts Pip in half (`S/share-L1-fin/photo-share-0.jpg`). Fix: `creationView()` x offset.

## Passed

- No uncaught errors, rejections or autoplay errors in any of the 52 runs.
- No real teleport or snap found.
- No game completes her action for her; paint demos are hand-only (`demo(key, false)` everywhere).
- Finales that show the creation well: paint (gallery wall), body, sink, moo, share, shapes, patterns.
