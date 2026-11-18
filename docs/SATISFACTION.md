# Satisfaction: making the games feel good without more effects

Read `docs/FEEL-BRIEF.md` first. Everything there still applies. This document is the next step.

## The problem, in one paragraph

The parent says the games give little satisfaction, and that more effects and boings do not fix it. The code shows why. In almost every game the child makes **one small choice** (a tap), and then the game **performs a reward at the child** (confetti, chime, Pip cartwheel, a praise caption, a gag, a shower of treats), and then **removes what the child just made** (`popOut`, shrink to 0.001, "eaten", toppled by Bear, swept into a box) so the next round starts clean. The child is a spectator of rewards for work that keeps disappearing. Satisfaction comes from the opposite: the child's finger does the thing, the thing changes and stays changed, and the level ends with something they made.

## Seven rules (the test for every change)

1. **The finger does it.** If the payoff is an animation that plays after a tap, move the payoff under the finger (drag, rub, hold, pour, pull, press). Tap stays as the easy fallback, but the object must still visibly respond to the touch itself.
2. **It changes and stays changed.** Dirty to clean, empty to full, pieces to whole, bare to dressed. Never undo it in the same round.
3. **One thing grows all level.** Every game names one "build-up object" (a basket, a house, a band, a soup) that is visibly bigger or fuller after every round and is what the finale shows.
4. **A beat before the release.** 0.3 to 0.6 s of stillness, squash or held breath before every reveal. Sound drops out in the beat.
5. **A character reacts, not the screen.** The reward is a friend in the scene reacting in character to what the child did (leans in, gasps, eats, wobbles, falls asleep). No confetti, no floating hearts, no praise word.
6. **Then nothing happens for a moment.** After every payoff, at least 1 s where nothing moves except breathing. The child looks at what they did.
7. **One soft sound per action,** made by the material (tok, plop, glug, click), pitched so a level's sounds add up to a tune.

Two quick checks for any game: **mute test** (with sound off, is the round still satisfying?) and **end-frame test** (pause at the end of the level: can you see what the child made?).

---

## Part 1: engine changes (do these first; every game benefits)

Ranked by impact. E1 to E4 are the core; most per-game items depend on them.

### E1. Quiet success: remove the stock reward from every round
`engine/lesson.js` `success()` currently fires `fx.confetti` + `sfx.chime` + `celebrate()` (Pip dances, hops, giggles or cartwheels) + a praise caption on every round of every game, on top of each game's own payoff. `nextRound()` adds `sfx.roundStart()`. This is the "special effects instead of satisfaction" layer.
- `success(pos, line, opts)`: make quiet the default. No confetti, no chime, no praise word. Keep the record-keeping, `clearHints`, and the caption for `line` only (caption-only unless it is an instruction).
- Replace `celebrate()` with `pipWatch()`: Pip turns to look at `pos`, small nod or one clap, `joy` face for 1 s. Pip is an audience, not the show.
- Delete `sfx.roundStart()` from `nextRound()`.
- Replace the fixed `await this.wait(1.6)` with: wait for the game's payoff promise (see E6), then `await this.wait(1.0)` of stillness (rule 6).
- `redirect()`: drop `sfx.boop`. The wrong object itself says no (a small head-shake or a soft wobble back) with one soft sound. Keep the caption.
- Confetti (`fx.confetti`, `fx.rain`) is allowed once per level, in the finale only, and not in games that end quietly (myday bedtime).

### E2. Grab feel: every dragged object has weight and squish
`engine/input.js` `onDown`/`onMove`/`onUp` set `obj.position` straight to the finger and play `sfx.pick()` on every pick. Add a shared spring so no game has to do this itself:
- **Pick:** a 0.12 s squash-and-lift (scale y 0.9 then 1.06, rise 0.15), soft material sound instead of `sfx.pick` (pass `sound` in `addDrag` opts; default a quiet "pup").
- **Carry:** the object follows the finger through a critically damped spring (about 12 Hz, so it lags by a few pixels and settles), keeps the existing lean, and stretches slightly along the direction of travel (max 8%).
- **Near a valid zone:** `onMove` already gives the zone. Add a default magnet: within 1.2x the zone radius, blend 30% toward the zone centre, and call `zone.obj.userData.onNear?.(k)` so targets can open, lean or light up.
- **Drop:** settle with one overshoot (0.25 s), squash on landing proportional to fall speed. A drop on nothing returns home on an arc at walking pace (0.5 s), no sound.
- **Tap targets (`addTap`):** add a default 0.1 s press-in (scale 0.94) on down and spring back on up, so a tapped thing feels pressed, not just triggered.

### E3. "Look what you made": a real ending for every level
`Lesson.finale()` plays `sfx.fanfare` + `fx.rain` + double Pip dance, shows the sticker after 0.8 s and leaves for home. The scene the child built is on screen for under 4 s, covered by a sticker overlay.
New sequence in `finale()`:
1. `await this.showOff()` (new override point). Default: `setCamera` glides (0.9 s) to `this.creationView()` (the game returns a position and look-at framing its build-up object), all sound effects stop, the music carries on.
2. **Admire, 4 s minimum.** Input stays live for pokes only: the child can touch the creation and it responds (jiggle, light, sound its note). The game's character admires it in character. Caption only: "Look what you made!" (voiced once per session).
3. **Photo.** A soft shutter sound, a white frame closes around the view (CSS, 0.4 s), the frame shrinks toward the home button. Save the picture (E4).
4. Then the sticker (`awardSticker`), with no fanfare stacked on top. `fx.rain` only here, and only if the game's ending is lively.
`onFinale()` stays as the game's hook but must not start automatic shows that the child cannot affect (see per-game notes).

### E4. Creation gallery: the work persists after the level
- `engine/store.js`: add `creations: { [id]: [dataURL, ...] }`, `store.addCreation(id, url)` keeping the last 3 per game. Capture with `renderer.domElement.toDataURL('image/jpeg', 0.7)` after rendering one frame at 320 px wide (about 15 KB each; 22 games x 3 fits localStorage comfortably). The renderer lives in `engine/stage.js`; add `snapshot(w)` there.
- `home.js`: each game's pedestal shows its latest photo in a small standing frame beside the icon. Tapping the frame enlarges it for 3 s ("You made this!"). `ui.js` `renderShelf` gets a photo strip under the stickers.
- Returning to home after a level: the new photo flies from the corner onto its frame (replaces the "new sticker" sparkle line in `home.js`).

### E5. Keepsake tray: visible progress for pick-the-answer games
New `engine/keepsake.js`: `makeTray(root, n, pos)` builds a low wooden shelf or rug with `n` empty spots **in the 3D scene** (not a HUD bar). `tray.add(obj)` walks or arcs the round's thing to the next spot, where it stays, breathing, pokeable. Used by games whose rounds have no natural build-up (sizes, moo, pots, more, feelings). The tray is what `creationView()` frames in the finale.

### E6. Beat helper and payoff promise
- `Lesson.beat(obj, dur = 0.45)`: squash down 10%, hold, duck the music 30% for `dur`, then release. Call before every reveal (lid lifts, last brick, plop, first bite).
- Standardise the ad-hoc promises (`payP`, `fitP`, `fixP`, `tuneP`, `gobP`, `gagP`, `crashP`, `payoff`, `react`) as `this.payoffP`. `success()` awaits it (capped at 6 s), then the 1 s of stillness.

### E7. Sound: one tactile sound per action, and a tune per level
`engine/audio.js`:
- Add `sfx.step(i, n)`: plays note `i` of a pentatonic scale in the key of the world's music. Each game's main action (place, plop, click) calls it with the running count, so a level's actions climb and the finale resolves on the top note. `bricks.js` already does this for clicks; make it universal and remove separate chimes.
- Remove from routine use: `sfx.chime`, `sfx.roundStart`, `sfx.boop`, `sfx.pick`, `sfx.fanfare` (replace with a 3-note resolve), `sfx.giggle` on mash, `sfx.twinkle` in `nudge()`.
- Material sounds get small random pitch and volume variation (5%) so repeats never sound identical.
- Hold the existing limits (boing cooldown, 4 effects per 0.7 s) and add: no effect may start within 0.25 s of another at the same or higher volume.

### E8. Rule for implementers: never `popOut` the child's work
Search each game's `afterSuccess`, `clearRound`, `clear*` for `popOut`, `scale` to `0.001`, `root.remove`. Anything the child placed, filled, fed, built or found must leave in one of three ways only: it **stays**, it is **carried off by a character** at walking pace to somewhere still visible, or the **child removes it** themselves. Props the child did not make may still fade out, but slowly (0.5 s) and after the stillness.

---

## Part 2: the 22 games

Each game lists its **build-up object**, what currently **undermines** satisfaction, and changes ranked by impact. Function names refer to `app/src/lessons/<id>.js` unless stated.

### Meadow

#### 1. colours
**Build-up:** the tubes filling to the brim. **Undermines:** one item per round over 6 rounds leaves tubes nearly empty; long arrival shows (`enter`, `friendThrow`) the child only watches; stock success on top of `gulp` + `payoff`.
1. **Fill the tubes.** In `startRound`, bring 2 items per round (same or mixed colours, one at a time) and size tube capacity so each ends 3/4 to full. `payoff(tube, fresh)` should show the level rising, not a new effect.
2. **Gulp under the finger.** Use E2 `onNear` in `onHover`: the tube leans toward the item and opens wider the closer it gets. In `gulp`: `beat()` with the mouth held wide, then one swallow with a bulge travelling down the tube and one "glup" (`sfx.step`). Remove the `squint`/star extras.
3. **Shorten arrivals** to 0.8 s or let the child start them (tap the friend to make it throw). Keep one arrival style per level, not a new one per round.
4. **Finale** (`onFinale`): no star burp. Camera along the full tubes; the child pokes a tube and its pile jiggles (`tickle`). Photo.
5. `bounceBack` on a wrong tube: tube closes its mouth and shakes its head; item slides back to hand. No boop.

#### 2. counting
**Build-up:** the basket getting fuller all level. **Undermines:** the friend eats the whole pile every round (`payoff`, `clearLeftovers`), so the count is destroyed; `wormGag` steals the child's fruit; payoff rotation (trot, leap, roll, juggle, dance) is a show unrelated to counting.
1. **Keep the pile.** Remove `clearLeftovers` and the eat-everything payoffs. The basket keeps every fruit across rounds; later rounds add to it (bigger basket model per level if needed).
2. **Child feeds one.** After the count, the friend looks at the basket, then at the child. The child drags one fruit to it (or taps the friend): `chomp` with two visible bites, tummy pat. That is the whole payoff. Delete `wormGag`.
3. **Pluck feel** in `tapFruit`: on press the fruit stretches on its stem and the branch bends; on release it snaps off, the branch recoils, the fruit drops with weight into the basket (`release`). One pluck sound on `sfx.step(count)`.
4. **Recount as the beat:** keep the pile jumping once per number, slowed to 0.5 s per number, numeral big, nothing else moving.
5. **Finale:** the friend carries the full basket to a blanket and sits beside it. Photo of the basket.

#### 3. shapes
**Build-up:** the house (train, castle) being completed and lit window by window. **Undermines:** `spill` showers random goodies from each window; `bonk` flings a wrong piece away across the grass; worst, `onFinale` **spits every fitted shape back out of its window**, undoing the level.
1. **Fitted pieces stay** as lit windows. Check `setHoles` does not replace filled holes; new holes are added beside old ones so the building fills up. `this.fitted` already tracks them.
2. **Rewrite `onFinale`:** dusk falls (dim `setSky`), the windows light one at a time in the order the child fitted them (`lightWindow`, one `sfx.step` each), the door opens, the friend steps out and waves. No tumbling shapes. Photo of the lit house.
3. **Press-fit feel** in `fit`: `pull(z)` already magnetises; add rotation aligning to the hole as it nears, then the piece sinks in 0.15 s with a wooden "tok" and the wall flexes slightly. Drop `spill`; keep `peek` (someone looks out of that window and waves) as the only payoff.
4. **Gentle wrong:** `bonk` becomes a soft bump and slide back to hand (`goHome`), not a tumble the child must chase.
5. One entrance style per level in `enter`; drop the `antic` gags before the child has acted.

#### 4. feelings
**Build-up:** Pip's hill filling with the things that got put right, and friends who stay. **Undermines:** the story is watched, the answer is one tap, then `fixFeeling` plays the hug, pat or breath **by itself**. The child never comforts anyone. Hearts float from `fx.float`.
1. **The child does the comforting.** Split `fixFeeling(a, move)` into a prompt and an input step. Hug/cuddle: drag the friend onto Pip; while held together they squeeze (scale under the finger), release ends it. Pat: stroke Pip's head, each stroke lowers the brow a step. Breath (angry): press and hold on Pip, he inflates slowly; release, he exhales and deflates. Auto-complete after 5 s idle.
2. **The face changes gradually under the finger** (sad, then neutral, then smile over 3 strokes or 1.5 s of holding), not a single `setFace` swap at the end (`cheer`).
3. **The child gives the fix:** `this.fix()` (new balloon, rebuilt tower) becomes an object the child drags to Pip.
4. **Fixed things stay** behind Pip (`clearProps` must skip them); the comforting friend sits down beside Pip and stays for the level. Finale: everyone on the hill together, calm. Photo.
5. Remove `hearts()`; the squeeze and the changed face are the reward.

#### 5. sizes
**Build-up:** a line-up from smallest to biggest at the back of the scene (E5 tray). **Undermines:** the lesson is one tap; the payoffs (`bigPayoff`, `smallPayoff`, `topple`, `burst`, `puffs`, `drops`, `shake`, `jolt`) are the loudest in the app; `clearRound` pops everything out after 0.4 s.
1. **Let the child feel size.** After the right tap, both things become squishy for 4 s: pressing the big one makes a slow heavy stomp with a low thud and the small props hop; pressing the small one makes a quick light bounce with a squeak. The child causes the contrast. Replace the automatic payoff chains with this.
2. **One payoff, with a beat:** big thing crouches (`beat`), then one stomp, one ground jolt. Remove `burst`, `puffs`, `drops` and the stacked BOOM.
3. **Line-up instead of `clearRound`:** the picked thing walks to its place in the size line (ordered), the other walks off. `onFinale` then parades the whole level's line, biggest to smallest (it currently only has the last round's things).
4. `magicSwap` and the many `arrive` modes: keep two calm ones per level (walk in, peekaboo).

### Beach

#### 6. patterns
**Build-up:** one parade that gets longer all level. **Undermines:** long pre-roll (arrival plus `playTune`) before the child can act; the answer is thrown into place for the child; each finished line marches away (`leave`).
1. **The child places the piece:** drag the choice into the gap (the `marker` pulses, magnet from E2); tap still works but the piece hops there at walking pace. It lands with its own note.
2. **The child plays the tune.** After completion, 4 s of free play: tapping any item in the row sounds its note and it hops; sliding a finger along the row plays the run. Then the automatic `playTune` once, slowly.
3. **Growing parade:** in `afterSuccess`, the finished line does not `leave`; it marches to the back (smaller, further z) and waits. `onFinale`: the whole parade passes the camera playing each tune in turn. Photo mid-parade.
4. **Train stage:** the child taps the engine to make it leave (whistle, chuff). The release is theirs.
5. Cap pre-roll at 3 s; `wrong(c)` is a soft off-note and the piece settles back.

#### 7. where
**Build-up:** the beach filling with friends, each left where the child put it. **Undermines:** `afterSuccess` hops everyone out, resets the covers and walks them off; `setProps` rebuilds the set each round; `onFinale` has Crab show off every spot automatically.
1. **Friends stay put.** Use one prop set per level (3 or 4 props, built once) so a friend can stay in its bucket or under its umbrella while the next friend arrives. Skip the hop-out in `afterSuccess`.
2. **Props respond on approach** (`onHover` + E2 `onNear`): the bucket tilts toward the friend, the towel corner lifts, the lid opens. On drop, `squash` with weight and the prop rocks.
3. **The story pays off because of the child:** in `storyPayoff`, the rain should start only after Crab is under the umbrella and visibly bounce off it; the sleepy friend closes its eyes only once in the box. One payoff per round: drop `bumpBits` and `palJoins` on top.
4. **Finale is free play,** not a show: 10 s where the child drags Crab to any spot and each says its word ("in", "on", "under"). Then photo of the full beach.

#### 8. more
**Build-up:** Gull getting rounder with every round. **Undermines:** one tap, then pairing, gobbling and the other row dropping all play automatically; what is left vanishes.
1. **The child feeds Gull:** after the pairing, the child taps Gull (or drags the row) to start `gobble`; each item goes down as a visible lump in the neck with one gulp sound.
2. **Gull's belly grows** about 6% per round (store on `gull.userData`). Finale: too full to fly, tries one flap, sits down, burps softly, dozes on the post. Replace the swooping loop in `onFinale`.
3. **Pairing is the lesson:** slow the links to one per 0.4 s, one click each on `sfx.step`, then the extras wiggle alone. Hold 1 s before any eating.
4. The not-picked group stays in its holder and is carried off, instead of dropping and bouncing on the sand.

#### 9. body
**Build-up:** Bear getting fully kitted out (`addGear` already accumulates; this is the best existing arc). **Undermines:** `toyShower` rains physics toys after every right answer and buries it.
1. **Remove `toyShower`** as a reward (keep a single ball for feet and hands rounds, which the child can kick or bat by tapping). The gear is the reward.
2. **The child puts the gear on:** the item appears beside Pip; the child drags it to the body part (this practises the part a second time); it goes on with a small tug and Bear admires it. Tap fallback: it floats over slowly.
3. **Touch is squishy** in `react`: press and hold the tummy and it dents under the finger, jiggling on release; the nose squashes; an ear folds and flicks back. Reactions scale with hold time rather than with repeat count.
4. `selfTouch` (Bear touches its own part) stays as the confirmation; slow to 0.8 s.
5. **Finale:** fully kitted Bear strikes a pose; "head, tummy, toes" stays but driven by the child's taps on Bear. Photo.

#### 10. sink
**Build-up:** the two tubs filling (already persists in `putAway`). **Undermines:** `tapItem` auto-flies the thing into the tank, so the experiment is watched, not done; the result is sorted away quickly.
1. **The child drops it:** drag the item over the tank and let go (`dunk`/`dropIn` take the release point). While held above the water, Crab covers its eyes and peeks (`crabLook`): that is the beat. Tap fallback keeps the current flight.
2. **Play with the result** before sorting, 4 s: push the duck under and it pops back up; push the rock and it stays down; poke makes ripples. Add taps on wet items in `result`; the buoyancy code already supports it.
3. **Lift out by drag** to a tub (`liftOut`/`sort`), dripping (`drips`), landing with a "bloop".
4. One `splash` per drop, sized by the object. Quiet the bubbles.
5. **Finale:** camera across both full tubs; Crab points at each. Level 3 tests: `clearTest` should roll the items aside, not pop them.

### Farm

#### 11. moo
**Build-up:** the farm chorus assembling at the fence (E5 tray as a fence line). **Undermines:** `giveTreats` rains treats the child did not give, and `afterSuccess` makes them shrink away; the signature move and treats stack.
1. **The child feeds the animal:** one treat appears in the trough or in Pip's hands; the child drags it over; the animal opens its mouth as it nears (`onNear`), takes it, chews three times with its head down. Replaces `giveTreats` and the shrink in `afterSuccess`.
2. **One payoff:** the signature move (cow chews, pig rolls) plays first, a 1 s rest, then feeding. Never both at once.
3. **Fed animals walk to the fence and stay.** `onFinale`'s chorus then uses the animals the child actually found, and the child conducts: tap an animal and it calls.
4. **Beat before the call** in `playCall`: the sound bubble swells for 0.4 s in silence, then the call.
5. Every animal squashes slightly under a tap and answers in its own voice (`voice`), right or wrong; wrong gets a friendly call and a head tilt, no boop.

#### 12. share
**Build-up:** the bin emptying and the plates filling; fed friends resting at the back. **Undermines:** `payoff` stacks juggle or spin, chomp, floating hearts and `shimmer`; every snack is eaten at once in 0.5 s.
1. **Friends react to each snack,** not just the end: all heads follow the carried snack (`reach`), the one with fewer leans forward, and bounces when served. The one with more looks at its neighbour's plate.
2. **Equal is a moment:** when the plates match, everything stops (`beat`), the friends look at each other's plates, then at the child, then eat. One payoff: remove `juggle`, `spin`, hearts and `shimmer`.
3. **Eating in turn,** left to right, two bites each (the bite code in `payoff` exists), 0.6 s apart, one munch sound each.
4. **Fed friends move to a rug at the back** and lie down with round tummies; new friends arrive. Finale: everyone on the rug. Photo.
5. `drop`: the snack lands on its dotted spot with a soft pat and the plate dips.

#### 13. band
**Build-up:** the band itself growing by one player per round. **Undermines:** `swapFan` replaces the audience friend each round; `payoff` (popcorn, note fountain, twirl) is decoration; `onFinale` plays six beats by itself.
1. **The friend joins the band.** After each round the audience friend picks up the instrument just played and takes a place on stage; it plays along quietly in later rounds. Replaces `swapFan`.
2. **Free jam after copying,** 5 s: every tap lands on the beat (quantise to the music), fans nod in time (`react`), bits jump (`jumpBits`). Remove `payoff`.
3. **The drum feels hit:** skin dents where touched, depth by loud or quiet, rim wobble on release (`squash`, `strike`).
4. **Finale:** the whole band plays and the child leads on the drum; the band follows the child's tempo. No automatic sequence. Photo of the band.
5. Beat dots (`popDot`) fill left to right like a row of lamps; the last one gets the `beat()`.

#### 14. pots
**Build-up:** found friends sitting on the fence watching (E5). **Undermines:** `afterSuccess` shrinks the friend and all covers to 0.001; `clearRound` deletes them; `onFinale` spawns fresh copies of every hider, not the ones the child found.
1. **The child lifts the cover.** Drag up on a pot to raise it (the cover follows the finger, creaks, and peeking under shows a tail or eyes before it is fully up); let go early and it drops back. Tap fallback: a slow 0.5 s `lift` with a `beat()` first. This puts the anticipation in the child's hand.
2. **Found friends stay:** after `jumpToPip`, the friend goes to the fence and watches later rounds, gasping when the child's finger nears the right pot. `onFinale` uses these same friends.
3. **Covers leave properly:** the found friend pushes them off to the side, or they are stacked. No shrinking.
4. **Slow `swap`** to 0.9 s per swap with a 0.3 s rest between; keep `placeTail` so the child can track.
5. Silly surprises under wrong pots stay (they are character comedy), one soft sound each.

#### 15. story
**Build-up:** the farmyard filling with story endings (a chick, a flower, a butterfly). **Undermines:** `complete()` plays the whole story automatically; `clearRound` throws the finished cards up and away 0.8 s later.
1. **The child tells the story:** in `complete`, card 1 plays, then each next card waits for a tap (auto after 3 s). `tapPlaced` exists; route it to `c.userData.act()`. The egg cracks because the child touched it.
2. **The ending steps out of the card:** the last card's subject leaves the frame into the scene and stays for the level (the chick pecks about, the flower stands by the fence).
3. **Cards are kept:** in `clearRound`, the finished row shrinks and hangs on a line at the back, in order, instead of flying off. Finale: camera along the line and the yard. Photo.
4. **Placement feel:** drag-to-stand snaps with a wooden clack, and the stand's dice dots light. `flyTo` for taps is fine at 0.85 s.
5. `wrong(c)`: the card tilts its "head" and walks back; no hop-and-boing.

### Home

#### 16. dress
**Build-up:** Monkey's outfit (already a whole-level arc; the model for the others). **Undermines:** garments snap on with a puff in `drop`; the mirror dance is automatic; `onFinale` adds a second dance and "ooh" after `mirrorDance`.
1. **Pull-on, not snap-on:** 0.6 s per garment in `drop`: the hat squashes down and the ears pop out; an arm pushes through a sleeve; a foot wiggles into a boot. Cloth sound. No puff.
2. **The child leads the mirror:** in `mirrorDance`, 6 s where tapping Monkey strikes a pose (cycle 4) and the reflection copies; then the photo is taken **in the mirror frame**. This is the gallery's showcase.
3. Remove the extra dance in `onFinale`; the mirror moment is the ending.
4. **Wardrobe beat:** on tap, `wobbleWardrobe` for 0.4 s in silence, then the doors creak open (`open`).
5. Level 3: before the right garment, Monkey shivers or fans itself; after, visibly comfortable. The clothes solve something.

#### 17. myday
**Build-up:** Bunny going from messy to clean and the day moving from morning to night. **Undermines:** `afterSuccess` clears the foam and pops the child's bubbles; the engine finale plays fanfare and confetti over a sleeping bunny at Level 3.
1. **Dirty to clean under the finger:** `addMess` exists. Make `rub`/`latherTick` remove the mess patch nearest the finger and leave foam there; `rinse` washes foam off where the water touches. Progress is what the paws look like, not a counter (`need`).
2. **A quiet ending:** when `this.sleeping`, `showOff()` is a slow pull-back from the dark room with a night light; no fanfare, no rain, the sticker arrives silently.
3. **Bubbles belong to the child:** after the bath, 4 s to pop them (`popAt` exists) before the game clears any. Do not auto-pop in `afterSuccess`.
4. **The house stays done:** the made bed, hung towel and open curtains persist across rounds; the window light moves from morning to evening over the level.
5. `cheer`: replace the twirl with a contented look at clean paws or a sniff of the towel.

#### 18. snack
**Build-up:** three fed friends sitting at a table, three clean plates. **Undermines:** the finished plate is eaten the moment it is complete (`afterSuccess` to `eatAndGo`), foods shrink into the mouth, and the friend walks off screen. Level 1 washing is "tap the tap and watch".
1. **Admire, then serve.** When `complete()` is true: `beat()`, camera pushes in on the plate, the friend gasps and looks at the child. The child slides the plate to the friend; only then does eating start.
2. **Real eating** in `eatAndGo`: two bites per food with bite marks, 0.7 s apart, crumbs left on the plate, a tummy pat. Remove the floating "Yum!".
3. **Friends stay:** walk to a small table in view instead of `EXIT`, sit, and watch the next friend. Finale: three friends at the table. Photo.
4. **Level 1 washing has one real action:** hold on the paws to rub and foam builds (`doRub`/`rubAnim` driven by the finger); the rest stays automatic.
5. `placeOnPlate`: food lands with a soft plop and the plate tilts slightly; the count number is caption-size, not giant.

#### 19. cook
**Build-up:** the soup (level, colour, steam) and finally the bowls on the table. **Undermines:** mostly strong already. The weak points are the ends of things: `taste` is a heart, a chomp and a hop; `onFinale` only stops the simmer.
1. **The soup shows every vegetable:** after each `tip`, the soup level rises a step and its colour shifts toward that veg (`updateSoupPieces`); steam thickens once the knob is on. End-frame test: the pot looks full and mixed.
2. **Stirring mixes:** in `stirAt`/`stirAdd`, pieces are dragged round with the spoon and the colour blends as the progress; `stirDone` when blended, not on a count.
3. **Tasting with a beat:** in `taste`, the friend blows on the spoon (0.5 s), sips, eyes close, shoulders drop, "Mmm". Remove the heart and the hop.
4. **Chop with weight** in `doChop`/`impact`: a 0.08 s lift before the blade drops, the board dips, one "tok". Limit `juice` to the first cut of each piece.
5. **Finale:** `showOff` frames the served bowls with the friends eating. Photo.

### Building site

#### 20. bricks
**Build-up:** a sign that collects every finished letter. **Undermines:** `afterSuccess` waits 1 s and then `tumble()` takes the letter apart; any tap anywhere advances the build, so the child's choice of brick barely matters.
1. **Keep each letter:** before `tumble`, a small copy of the finished letter (clone the placed bricks into a group, scale about 0.25) slides up onto a sign above the board. The row of letters grows all level; the finale reads them one by one. Photo of the sign.
2. **Hold the finished letter** 2.5 s before `tumble`, pokeable (`tapPlaced`), then the bricks walk back rather than rattle off.
3. **The child's brick is the one that goes,** with choice: drag a brick to any open slot (magnet, stud click); tap still sends that brick. On pick-up it squashes; on `click` the neighbours nudge.
4. **Last-brick beat:** with one slot left, the outline pulses slowly and the music thins; the final click lights the letter. `bsfx.tada` becomes the scale's top note.
5. Keep the climbing click scale (`click`); remove other sounds in the round.

#### 21. blocks
**Build-up:** a shelf of the child's finished builds. **Undermines:** the clearest case in the app. `complete()` schedules `topple()` 2 s later: **Bear knocks the child's build down**, then `sweep()` throws it all in the toy box. The gag (flag, rocket) also fires by itself.
1. **The child decides when it falls.** Replace `this.crashP = wait(2.0).then(topple)` with: 3 s of admiring (Bear walks round it, claps once), then the build is live: a tap or swipe on it topples it from the touch point (`unfreeze` + `physics.impulse`). If untouched for 8 s, Bear asks "Knock it down?" and waits; at 14 s the round moves on with the build left standing.
2. **Photo before the fall,** and a keepsake: the mini on the display stand (`showMini`) moves to a shelf at the back and stays. A row of builds grows over the level.
3. **Placing is the child's drop:** the block follows the finger, the matching ghost brightens (`onHover`), and on release it falls the last 0.3 units with physics, a "tok" and a `squash`. At Level 1, a block dropped on the wrong ghost should slide across visibly, slowly, not fly.
4. **The gag is the child's:** the flag goes up when the child taps the top block. Drop the rocket (it removes the build).
5. `sweep`: blocks hop to the box one at a time at 0.25 s spacing with a wooden knock each.

#### 22. balance
**Build-up:** sandcastles left in the sandpit. **Undermines:** `dumpAll` flips the pails clean between rounds without the child; the stock success plays over a see-saw that is satisfying by itself.
1. **Pouring you can hear and steer:** in `pourStep`, the pour sound's pitch rises as the pail fills (as a real container does); the stream thins when the finger drifts off the pail and stops at once on release. The marks (`marksCrossed`) get one soft ding each.
2. **Chick is the comedy:** as its end rises it looks down, flaps, clings; on `bump` it bounces and resettles; when its end comes down it sighs. No other reward.
3. **Castles stay** (`tipOut`): each one remains in the sandpit, in a row. Replace `dumpAll` with the child tipping the pail (tap it, it tips with a `beat`), or carry leftovers over into the next round's start.
4. **Balance is stillness:** at Level 3 when level (`checkBalance`), everything stops for 1.5 s, the bubble centres, a single held note. `tipLittle` stays as the gentle correction.
5. **Finale:** camera over the sandpit and castles; the child may pat one flat. Photo.

---

## Part 3: order of work and acceptance

**Order.** (1) E1, E2, E3, E4. (2) Games where work is destroyed: blocks, counting, shapes, pots, story, bricks. (3) Games where the payoff is automatic: feelings, moo, more, snack, sink, sizes. (4) E5 to E7 and the remaining games.

**New caption lines** (short; add to `tools/voice/new-lines.txt` when implemented): "Look what you made!", "Knock it down?", "You made this!". Everything else in this document is caption-free.

**A game is done when:**
- Mute test and end-frame test both pass.
- No `fx.confetti`, `sfx.chime` or praise word during rounds; at most one sound per child action.
- Nothing the child placed, filled, fed, built or found is removed by the game within the round (E8).
- Every reveal has a beat before it and at least 1 s of stillness after it.
- The level ends on `showOff()` with the build-up object in frame for 4 s or more, and a photo appears on the home screen.
- A full level still takes about the same time as before: time moved from watching rewards to doing and looking.
