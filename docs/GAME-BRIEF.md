# Game quality brief (for the game design pass)

Little Learners is 15 touchscreen learning games for a 2-year-old. It uses Three.js r170 and runs in Electron, with no build step. Start by reading:
- `README.md`
- `docs/DESIGN-WORLD3.md`, which includes Fable's per-game quality review ("not built yet")
- `app/src/engine/lesson.js`, the base class with the round flow, `success`, `redirect`, the one-time demo and the hint ladder
- your game file(s) in `app/src/lessons/`

## The parent's feedback
- "Things are really basic, not really nice looking. Movements not that great. Not enough sound effects. Too many long pauses."
- "Crab in bucket, crab on stool… over and over. Not good enough. Make the games better quality."
- No computer voice: captions only. Do not reintroduce speech; `say()` only shows a caption bubble.
- Only one hint per game. Do not add more hand demos (`fx.ghostPath`) outside `showHint`/`demoL3`. The base class already plays the demo once at game start for at most 2.5 s.

## Your job
Make each of your games noticeably better and more fun, while keeping the same learning goal and taxonomy topic.
- **Variety between rounds.** No two rounds should feel the same. Change the props, theme, objects or a small twist each round, and keep the "same task, new surprise" feel.
- **Payoffs.** Each correct answer gets a short, delightful payoff of at most about 0.9 s, in the form of a character reaction or a gag. Use Fable's review ideas.
- **Juice.** Squash and stretch, anticipation, overshoot, and a sound on every meaningful event.
  - Sounds: `sfx.*` in `app/src/engine/audio.js`. There are about 60, including tap, pick, land, thunk, bloop, swoosh, twinkle, boing, pop, chime, the animal calls, drums, pour, crunch, splash and cheep.
  - Effects: `fx.confetti(pos, n)`, `fx.float(pos, text, { color, size })`, `fx.halo`.
- **Readable without a voice.** The child cannot read, so show the answer through visuals: pictures, numbers and animations.
- **Pacing.** No dead waits longer than about 0.4 s. The next round's prompt should start within about 1.2 s of a correct answer.
- **Characters.** Characters come from `makeAnimal(kind)` (`engine/actors.js`), `makeFarmAnimal` (`engine/farm.js`) and `makeCrab`, `makeDuck` and `makeGull` (`engine/beach.js`). Other agents are redesigning those model files right now; use them through their functions and `userData` (head, face, body, arms, wings, claws). Do not edit them.

## Hard rules
- **Edit only your assigned lesson files.** You may add new helper files named `app/src/lessons/<yourgame>-*.js`.
- Do not edit the engine, models, meta, main or home. If you truly need an engine change, describe it in your report instead.
- **Keep the autoplay test hooks for each game working.** The test calls these methods and fields directly:

| Game | Hooks |
|---|---|
| colours | `target`, `zones()` (z.tube.userData.color), `item.userData.color`, `drop(zone, {tapped})` |
| counting | `fruits` (f.userData.counted, f.userData.tap), `tapFruit(f)` |
| shapes | `target`, `zones()` (z.hole.userData.kind), `piece.userData.kind`, `drop(zone, {tapped})` |
| feelings | `friends` (f.userData.feeling), `emo`, `tapFriend(f)` |
| sizes | `things` (t.userData.role), `ask`, `tapThing(t)` |
| patterns | `choices` (x.userData.kind), `answer()`, `pick(x)` |
| where | `drag`, `zones()` (z.id, z.prop), `target()`, `drop(zone, {tapped})` |
| more | `pick(side)`, `rightSide()` |
| body | `part`, `touch(partName, anchorName)` with anchors nose/eyeL/earL/mouth/tummy/handL/footL |
| myday | `phase` ('step' when waiting), `want()` (key of the thing this step needs), `act(key)` (right key plays the step, wrong key redirects), `items` |
| moo | `animals` (a.userData.kind), `target`, `tapAnimal(a)` |
| grow | `step`, `use(k)` |
| share | `carrot.userData.drag`, `bunnies` (b.userData.n), `min()`, `valid()`, `drop({bunny})` |
| band | `listening`, `pat`, `i`, `hit(k)` |
| pots | `hidePot` (userData.tap.enabled), `pots`, `tapPot(p)` |

  If you must change a hook, say exactly how in your report.
- Keep the 6 rounds per level and the level `PLANS`. You may add per-round theme data to the plans.

## Checking your work
`tools/snap.js` drives the app in Electron and takes screenshots. Write a steps JSON to a folder under `$TMPDIR`, then run:

```
UD=$TMPDIR/ud-<name> npx electron tools/snap.js <outdir> <steps.json>
```

- **Steps** are objects such as `{"wait": ms, "js": "...", "shot": "name"}`.
- **Set the level:** `localStorage.setItem('ll.v1', JSON.stringify({settings:{level:0}})); location.reload()`, where the level is 0, 1 or 2.
- **Start a game:** `__ll.router.go('<id>')`.
- **Read the current lesson:** `__ll.current`. Call the hook methods above to advance rounds, then take a screenshot.
- **Errors:** register `window.addEventListener('error', e => console.error('UNCAUGHT', e.message, e.filename, e.lineno))` first, then read `<outdir>/log.txt` for errors.
- Look at the screenshots with the Read tool. Play through all 6 rounds at each level and make sure every round finishes and there are no errors.

## Report back (short)
- Per game: what changed.
- Any bug you fixed.
- Any hook change.
- Any engine change you would want.
