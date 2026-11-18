# Audit: Meadow world (colours, counting, shapes, feelings, sizes)

Audited against `docs/storyboards/README.md` (the seven checks), `docs/FEEL-BRIEF.md`, `docs/SATISFACTION.md` and `docs/QUALITY-BRIEF.md`, with the storyboards checked against the code as it is now (`app/src/lessons/<id>*.js`, `app/src/engine/lesson.js`, `speech.js`, `fx.js`) and every line checked against `app/assets/voice/index.json`, `tools/voice/new-lines.txt` and `pending-lines.txt`. This is a code-reading audit: nothing was run. Items marked *verify* need a `tools/qa-shots.sh` capture.

| Game | Verdict | Biggest problem |
|---|---|---|
| colours | needs work | Go! shows before she can grab; most wrong-answer lines are silent; tubes end nearly empty |
| counting | needs work (learning blocker) | The total is never said, and the friend or a worm eats the whole count every round |
| shapes | needs work | "Where does it go?"; ~7 effects per fit; the finale spits every shape back out |
| feelings | needs work | "Who else?"; she taps once and then watches the comforting happen by itself |
| sizes | needs work | "BIG" among three is ambiguous and "middle" is a position word; the loudest payoffs in the app |

---

## Things that apply to all five games (engine)

These are in the engine, so fix them once.

1. **"Caption only" means silent. The storyboards are wrong about this.** All five storyboards say an unrecorded line "falls back to the browser's system speech voice". It does not. `speech.js` has `const VOICE = false`, so `synth` is `null` and a line with no clip is on-screen text only. She cannot read, so for her every unrecorded instruction or redirect does not exist. The storyboards should say "silent (caption only)". Severity: **major**, because it hides how many wrong-answer lines she never hears (see each game's voice list).
2. **Stuck re-prompts are never voiced.** The ladder re-prompts at 6, 12 and 20 s (`Lesson.tick`) all come within 30 s of the first prompt, so the 30 s rule in `speech.js` turns each one into a caption. A stuck child gets a hop and a hand but no words. Fix in `Lesson.tick`: at `lvl === 2`, call `this.say(this.promptText(), { repeat: true })` instead of `this.prompt()`. Severity: **major**.
3. **The hand demo replays too late.** FEEL-BRIEF rule 2 says to show it again after about 8 s; `LADDER = [6, 12, 20, 45]` waits 12 s. Change to `LADDER = [5, 8, 20, 45]`. Severity: **minor**.
4. **Drag demos only move a hand.** `fx.ghostPath` draws a DOM hand and squeezes the whole demo into 2.4 s (about 0.6 to 1.3 s of actual travel). The item itself does not move, so a 2-year-old sees a hand slide over things. Fix: let `playDemo` use `this.demoDur ?? 2.5` for its lock and wait, and pass `maxDur: 3.5` through `fx.ghostHand(from, to, { maxDur })`. In colours and shapes, have the real item ride along under the hand (see C3 and S6). Severity: **major** for the drag games.
5. **None of the five uses the satisfaction API.** No `creationView`, `creationObjects`, `payoffP`, `beat()` or keepsake tray. So the finale shows "Look what you made!" over a static wide shot. In counting, sizes and feelings there is nothing she made on screen, so the line is untrue. Fixes are per game below. Severity: **major**.
6. **Going home after 45 s idle.** "Bye bye! See you soon!" sends her home in the middle of a level if she stops to look or chat. Suggest 90 s, or a pause card ("Tap to play!") instead of leaving. Severity: **minor** (the parent's call).
7. **The Go! badge plays `sfx.twinkle` every round** (`ui.js showGo`). That is one more routine sound. Drop it or make it very soft. Severity: **minor**.

---

## 1. Colour tubes (`colours`): needs work

What works: one clear action (drag), a demo on round 1, containers that watch and open their mouths, gentle errorless mode, and a sensible progression (2, then 3, then 4 containers, and a shuffle at L3).

### Issues

**C1. All rounds: Prompt. Minor.** "Red! Put it with red." "With red" is abstract and does not name where it goes.
- Fix: `promptText()` returns `` `${cap(c)}! Put it in the ${c} one!` ``.
- New lines: "Red! Put it in the red one!", "Blue! Put it in the blue one!", "Yellow! Put it in the yellow one!", "Green! Put it in the green one!"

**C2. Wrong container, every round: Voice and Learning. Major.** Only "That's blue. Find red!" and "That's red. Find green!" are recorded. The other 10 pairings are silent text, so hearing "that's blue" (which teaches the colour) almost never happens.
- Fix: record the 10 lines in the voice list. Keep the wording so the two existing clips still work.
- Also, a wrong drop makes no sound at all. `redirect()` gets no object, so `sayNo` never runs, although the storyboard claims a "nope". Add `sfx.nope()` at the start of the tube's head-shake in `drop()`.

**C3. L1 #1, L2 #1, L3 #1 (the demo): Showing how. Major.** The demo is a DOM hand sliding from the item to the tube in under 2.4 s, while the item stays where it is.
- Fix: when `showHint(false)` runs from the demo, also tween the item along the hand: lift it at 0.4 s, travel 1.2 s to above the right mouth with `u.forceOpen = 1`, hold 0.4 s, float back home 0.6 s (it never drops in).
- Use `demoDur = 3.5` (see engine item 4).

**C4. Friend-throw rounds (L1 #3 and #5, L2 #3 and #6, L3 #3 and #6), plus the roll, bounce and drive arrivals: Logic. Major.**
- The problem:
  - `busy` is false while `enter()` runs, so Go! shows as soon as the prompt clip ends, often while the item is still in the air (the throw lands about 3.3 s in).
  - Drags before `addDrag` are silently ignored, so Go! tells her to act when nothing will respond.
- Fix: in `startRound`, set `this.busy = true` just before `await this.enter(item, R)` and `this.busy = false` just after it, before `addDrag`.

**C5. Friend-throw rounds: Pacing and Satisfaction. Minor.**
- The problem:
  - She watches a 3.3 s show (1.5 s hop-in, wind-up, throw).
  - `friendThrow` then calls `this.afterSuccess()` straight away, so the friend has already left and the "hop with joy" in `payoff()` never happens. The storyboard is wrong here.
- Fix:
  - Cut the hop-in to 0.8 s (`s.anim(0.8, ...)`).
  - Delete the `this.afterSuccess()` call in `friendThrow`. Instead, walk the friend to the side (x = 6.8, z = 1.5) to watch, so it is not in front of a container. Let it hop once when the item lands, then leave in `afterSuccess` as now.

**C6. Every right drop: Satisfaction. Minor.**
- The problem: `payoff()` floats ♥, ♪, ★ or 😋 and rotates gulp, hiccup, twirl and wink (SATISFACTION rule 5).
- Fix:
  - Keep one reaction, the gulp, with the bulge travelling down.
  - Delete the four `fx.float` calls.
  - Add `await this.beat(tube.userData.body, 0.35)` before the drop in `gulp()`.
  - Make the landing sound `sfx.step(this.round, 6)` instead of `sfx.pop()`.

**C7. Ending: Satisfaction. Major.**
- The problem:
  - Six items spread over 2 to 4 containers leaves 1 or 2 in each, so the tubes look nearly empty at the end.
  - There is no `creationView`.
  - Only the fullest container tickles; the storyboard says "every container giggles", which is wrong.
- Fix:
  - Add `creationView()`, returning `{ pos: [0, 3.0, 9.8], look: [0, 2.0, -1] }`.
  - Add `creationObjects()`, returning `this.tubes.map(t => t.userData.glass)`, and `onAdmirePoke(obj)`, which calls `this.tickle(...)` for the matching tube.
  - Optional (SATISFACTION 1): bring a second item of the same colour after the first goes in (no new prompt), so each tube ends 3/4 full.

**C8. Ending: Voice. Minor.** "Look! So much red!" is sent with `voice:false`, although clips exist for red, blue and green.
- Fix: send it with `{ voice: true }` and record "Look! So much yellow!". It names the colour once more, which is the learning goal.

**C9. L2 #5: Learning. Minor.** A plum tinted blue goes in the blue basket. Real plums are purple, so this teaches a wrong colour.
- Fix: replace that round with `{ color: 'blue', item: 'blueberry', twist: 'bounce' }`, or a blue item that is truly blue.

**C10. L3 #5: Logic. Minor.** `cue()` runs at the top of `startRound`, so "Green! Put it with green." is spoken while the buckets are still dancing to their new places.
- Fix: for `R.shuffle` rounds, call `this.cue()` after `await this.placeTubes()`.
- Keep the early cue for new-container rounds. Hearing "Yellow!" while the yellow tube hops in is good.

### Lines to voice (colours)

Wrong-answer lines (wording unchanged):
- "That's yellow. Find red!"
- "That's green. Find red!"
- "That's red. Find blue!"
- "That's yellow. Find blue!"
- "That's green. Find blue!"
- "That's red. Find yellow!"
- "That's blue. Find yellow!"
- "That's green. Find yellow!"
- "That's blue. Find green!"
- "That's yellow. Find green!"

Other lines:
- "Look! So much yellow!"
- The four rewritten prompts in C1.
- Already queued in `new-lines.txt`: "Look what you made!"

---

## 2. Apple count (`counting`): needs work (the learning goal is not met)

What works: the camera glides to each host and frames it, there is no wrong answer, the numerals are big and coloured, notes rise with the count, plucking has a little stretch, and the counts progress (up to 3, 4, then 5).

### Issues

**K1. Every round, the last tap: Learning. Blocker.** The total is never spoken. The last number goes to `success()` as a silent caption. Cardinality ("the last number is how many") is half of the stated goal, and she never hears it.
- Fix:
  - On the last tap, voice the number like the others.
  - After the recount, say the total with the noun: `this.say(\`${WORDS[n-1]} ${n === 1 ? R.item : PLURAL[R.item]}!\`, { repeat: true })`, for example "Three apples!".
  - Pass `''` as the `success()` caption so the number is not shown twice.

**K2. Every tap: Voice and Learning. Major.** Count words go through the 30 s rule. "One!" and "Two!" are voiced in round 2, silent in rounds 3 and 4, and voiced again around round 5. So one tap, one spoken number only happens now and then.
- Fix:
  - `this.say(\`${WORDS[i]}!\`, { repeat: true })`: she asked for each word herself by tapping.
  - So that fast taps never skip a number (the voice queue keeps only the latest waiting line), add `input.lock(650)` after each tap in `tapFruit`. This also sets the counting pace.

**K3. After the last tap (the payoffs, rotating): Satisfaction and Learning. Major.**
- The problem:
  - The friend eats the whole pile (`chomp`), or a worm eats it (`wormGag`) while the friend gasps.
  - In juggle rounds there is no recount, and the leftovers are eaten in `clearLeftovers` at the next round.
  - So the basket is empty at the start of every round, and the finale says "Look what you made!" over an empty basket.
- Fix (SATISFACTION 2):
  - Delete `wormGag`, the juggle, spin, roll and leap variants, and `clearLeftovers`' gobble.
  - After the recount, the friend looks at the pile and then at her. **She taps the friend, or drags one fruit to it,** and it eats one with two bites and a tummy pat.
  - The rest of the round's pile moves at walking pace onto a keepsake shelf (`makeTray(this, 6, [0, 0, -2.5], { style: 'shelf' })`): one small bowl per round, with that round's numeral on a tag.
  - `creationView() { return this.tray.view(); }`. Each bowl can be poked during the admire: it says its own total (`repeat: true`).
  - The shelf of bowls (1, 2, 3, 2, 3, 3) is the build-up, and it teaches.

**K4. After the last tap: Logic and Sound. Minor (likely, verify).**
- The problem:
  - In trot, leap and roll rounds without a frog, `payoff()` resolves as soon as `chomp()` starts. `afterSuccess` then waits only 0.5 s.
  - `clearLeftovers` in the next `startRound` picks up fruit still mid-shrink (scale above 0.05) and chomps them a second time: a second `sfx.chomp`, `sfx.mmm` and a hop, with two animations fighting over the same fruit.
- Fix: K3 removes this. Otherwise, have `chomp()` return a promise that resolves after `(n-1)*0.15 + 0.5` s, await it in `payoff()`, and mark eaten fruit (`q.userData.eaten = true`) so that `clearLeftovers` skips them.

**K5. Recount (after the last tap): Learning. Minor.** The pile jumps with notes but shows and says nothing, so it is decoration rather than a recount.
- Fix:
  - Slow it to one jump every 0.5 s.
  - On each jump, float a small numeral (size 7) over the pile.
  - Speak the total (K1) only after the last jump. The jumps stay silent.

**K6. L1 #1: Prompt. Minor.** "Count the apples!" for one apple.
- Fix: when `R.n === 1`, `promptText()` returns "Tap the apple!".
- Keep the other prompts. They are recorded, and the demo shows the tap.

**K7. Every tap: Feel. Minor.**
- The problem:
  - A balloon pop sets off confetti on every tap.
  - The golden one adds a sparkle, confetti and a ★.
  - The friend's "ooh" uses the `scared` face, which reads as fear.
- Fix:
  - Remove `fx.confetti` from `release()` and `tapFruit()`.
  - Keep the golden sparkle at round start only.
  - Use `setFace(face, 'joy')` for 0.35 s instead of `scared`.

**K8. After the last tap: Pacing. Minor.** About 3.2 to 5 s of watching (recount, walk, eat), with no stillness before the next host springs up. K3 turns most of this into her action. Then make `afterSuccess` end with `await this.wait(1.0)` (SATISFACTION rule 6).

### Lines to voice (counting)

- Already queued in `new-lines.txt`: "Five!"
- Totals (K1):
  - Level 1: "One apple!", "Two apples!", "Three apples!", "Three pears!", "Two oranges!", "Three plums!"
  - Level 2: "Two strawberries!", "Four strawberries!", "Three blueberries!", "Three cherries!", "Three lemons!"
  - Level 3: "Three cookies!", "Four cookies!", "Four cupcakes!", "Five cupcakes!", "Three donuts!", "Four sweets!"
- K6: "Tap the apple!"

---

## 3. Shape house (`shapes`): needs work

What works: there is a real build-up (windows light and lamps light one per round), the magnet only helps near the right window, pieces turn to fit, and the variety teaches well (small, tilted and upside-down pieces).

### Issues

**S1. All rounds: Prompt. Major.** "Circle! Where does it go?" is a question. It names neither the action nor the target, the same kind of failure as "Bubbles in".
- Fix: `promptText()` returns `` `${Cap(k)}! Put it in the ${NAME[k]} window!` ``.
- New lines: "Circle! Put it in the circle window!", "Square! Put it in the square window!", "Triangle! Put it in the triangle window!", "Rectangle! Put it in the rectangle window!"

**S2. Every right drop: Pacing and Satisfaction. Major.** One fit fires about seven things inside 3.5 s:
- the thunk
- the window lights
- the lamp pops
- an accessory pops on
- the window spins, bounces or flashes four colours
- the facade cheers (clouds)
- three goodies spill and then pop away
- a friend peeks, with a sound, a hop and a wave

Fix: in `fit()`:
- Delete `this.spill(...)`, `this.windowPayoff(...)` and `this.th.hooray(s)` (keep `hooray` for the finale).
- Keep the window light and the lamp. The lamp lights with `sfx.step(this.round, 6)` and no separate sound.
- Keep the accessory (it stays, so it is build-up), but on the same beat as the lamp.
- Keep `peek()` as the one character reaction, with no extra sound if the step note has just played.
- Add `await this.beat(hole, 0.35)` before the piece sinks in.
- End `afterSuccess` with 1 s of stillness.

**S3. Every right drop: Satisfaction (E8). Major.**
- The problem: `fit()` shrinks the fitted piece to 0.001 and removes it, so the shape she placed vanishes and only a lit hole is left.
- Fix: leave the piece seated in the window. Tween it to `z: wp.z + 0.05` at window scale, with its happy face, then stop. Delete the shrink and the `root.remove`. Remove its drag target (already done).

**S4. Ending: Satisfaction. Major.** `onFinale` shoots every fitted shape back out of its window onto the grass. That undoes the level, and the last thing she sees is her work tumbling out.
- Fix: rewrite `onFinale` as SATISFACTION shapes 2 describes:
  - dusk (`setSky` dimmed)
  - the windows glow one at a time in fitting order, each with `sfx.step(i, n)`
  - the door opens and one friend steps out and waves
- Add `creationView()`, returning `{ pos: [0, 3.4, 10.5], look: [0, 3.0, -2] }`, and `creationObjects()`, returning the seated pieces.
- Remove the Bunny and Bear pop-ins.

**S5. Wrong window, every round: Feel, Voice, Logic. Major.**
- The problem:
  - BONK is about 2.3 s: the piece flies at the window, splats, stars circle, it goes dizzy, tumbles on the grass and hops back.
  - Only "That's the square. Find the circle!" is recorded; the other 11 redirects are silent.
- Fix:
  - Replace `bonk()` with a soft bump: tween to 0.4 short of the frame, a 0.3 s wobble of the window (`shake(s, hole, 0.05)`), one `sfx.thunk` at low volume, then `goHome(p)`.
  - No stars, no dizzy face, no physics.
  - Record the 11 lines in the voice list (wording unchanged).

**S6. L1 #1, L2 #1, L3 #1 (the demo): Showing how. Major.** This is the same DOM-only hand as C3.
- Fix: during the demo the piece rides under the hand. It lifts, resizes to fit (`fitScale`), turns to fit at the window, hovers 0.4 s, and floats back. Use `demoDur = 3.5`.

**S7. Every round (Pip toss, roll, spout, drop): Logic. Major.** Go! shows before the piece has landed (`busy` is false during `enter()`), and drags are ignored until then.
- Fix: set `this.busy = true` around `await this.enter(p, R.enter, R.s)` in `startRound`, as in C4.

**S8. Every round after it arrives: Feel. Minor.**
- The problem: antics (sneeze with a giggle sound and a squash, wink, glasses bob) play before she acts (SATISFACTION shapes 5). The sneeze changes the piece's scale just as she may grab it. `onPick` also plays `sfx.pick`, which E7 retired.
- Fix: delete `antic()`, the piece gags (`addGag` for sneeze, wink and glasses) and `sfx.pick()` in `onPick`.

**S9. L1 #3, L2 #3, L3 #3 (a new window) and L3 #4 (windows reverse): Logic. Minor.**
- The problem: the cue is spoken at the top of `startRound`, before `setHoles` has popped the new window in (0.4 s wait + 0.6 s) or finished the reversal. "Triangle!" is said for a window she cannot see yet.
- Fix:
  - In rounds where `this.holeKinds[r]` exists, move `if (this.demoDone) this.cue();` after a `await this.wait(1.0)` that follows `setHoles`.
  - Add a 1 s halo on the new window (`fx.halo(h, 1.3)`).

**S10. L3 overall: Learning. Minor.** L3 uses the same four shapes as L2, and the only new thing is the castle and one reversal at round 4. Reverse the windows again at round 6 (add `5: ALL` to the L3 holes, and `r >= 3` already reverses). Or make L3's pieces smaller and more tilted (s 0.6, rot 0.8).

### Lines to voice (shapes)

Wrong-answer lines (wording unchanged):
- "That's the triangle. Find the circle!"
- "That's the rectangle. Find the circle!"
- "That's the circle. Find the square!"
- "That's the triangle. Find the square!"
- "That's the rectangle. Find the square!"
- "That's the circle. Find the triangle!"
- "That's the square. Find the triangle!"
- "That's the rectangle. Find the triangle!"
- "That's the circle. Find the rectangle!"
- "That's the square. Find the rectangle!"
- "That's the triangle. Find the rectangle!"

Also the four rewritten prompts in S1.

---

## 4. Feelings (`feelings`): needs work

What works: the stories are clear and visual, Pip keeps the feeling face while she chooses, the levels progress well (2 friends with opposite feelings, then 3), the L3 demo scans so it does not give the answer away, and wrong friends voice their own feeling sound.

### Issues

**F1. All rounds: Prompt and Pacing. Major.**
- The problem:
  - "Pip is sad 😢. Who else?" "Who else?" names no action and no object.
  - The feeling word arrives 5 to 8 s after the moment she saw the feeling. The story plays silently while she cannot act.
- Fix: split the line.
  - At the end of `feel()` (the feeling peak), voice "Pip is sad." That labels the feeling at the moment she sees it, which is how toddlers learn emotion words.
  - After the friends arrive, the prompt is `promptText()`, which returns `` `Find a ${SAY_FEEL[this.emo]} friend!` ``. That is the line the 6 and 12 s re-prompts repeat.
  - Say "friend" rather than "face", because Pip has the same face and is not a choice.

**F2. Every right answer: Satisfaction. Major.** She taps once and then watches `fixFeeling` play the hug, pat, breath or dance by itself. She never comforts anyone (SATISFACTION feelings 1).
- Fix: after the friend hops over, the comforting is her action, with only two gestures:
  - **Sad or scared:** "Give Pip a hug!" Press and hold on Pip. While she holds, Pip and the friend squeeze together, and Pip's face moves from sad to calm to happy over 1.5 s. Let go to end it.
  - **Angry:** "Big breath with Pip!" Press and hold: Pip and the friend slowly puff up. Let go: they breathe out, with a whoosh, and calm down.
  - **Happy:** "Tap Pip! Happy dance!" Each tap is one spin-hop together.
- Show a slow hold demo the first time each gesture appears in a game: `fx.ghostPath([pipHead], { mode: 'tap' })` with a 1.5 s press. Repeat it at 8 s. If nothing happens for 5 s, finish it automatically.
- Set `this.payoffP` to this step.

**F3. Every right answer: Voice. Major.** Seven of the eight fix lines are recorded ("Sad. Big hug!", "Scared! It's okay. Cuddle!" and so on), but `this.voiceLines = false` mutes them. The storyboard lists them as having no clip, which is wrong.
- Fix:
  - If F2 is not done yet: delete `this.voiceLines = false` and call `this.success(pos, line, { voice: true })`. Record "Angry! 😠 Big breath…" (its key "angry big breath" is missing; only praise-prefixed copies sit in `pending-lines.txt`).
  - With F2, the three instruction lines replace them and the fix lines stay caption-only.

**F4. Wrong friend, every round: Prompt and Voice. Major.**
- The problem:
  - "Kitty is happy 😊. Find sad 😢!" "Find sad" is not something a 2-year-old can follow.
  - Every animal and feeling combination is its own line, and only 3 of 84 are recorded.
- Fix: drop the animal name. `` this.redirect(`That one is ${SAY_FEEL[f]}. Find a ${SAY_FEEL[this.emo]} friend!`) `` gives 12 lines, all in the voice list. Keep the floating feeling icon and the friend's own sound; they teach.

**F5. Every right answer: Feel. Minor.**
- The problem: `fixFeeling` starts `this.fix()` (the story put right: new scoop, rebuilt tower) at the same moment as the comfort move. The two compete with the hearts, ✨, ⭐ and 💨 floats.
- Fix:
  - Await the comfort move, wait 0.4 s, then run `this.fix()`.
  - Delete `hearts()` and the `fx.float` calls in `fixFeeling`. The face change is the reward.

**F6. Round start and Ending: Satisfaction. Major.**
- The problem:
  - `clearProps()` pops away the story that was just put right, and the friends `popOut` every round.
  - The finale shows only the last round's friends hopping, under "Look what you made!".
- Fix (SATISFACTION feelings 4):
  - The comforting friend walks (`this.walkTo`) to a spot on the hill behind Pip and stays for the level, sitting or breathing. The spots are six slots in an arc at z = -5.
  - Mark fixed props `userData.keep = true`, and have `clearProps` move them to the back (`walkTo`, scaled 0.6) instead of popping them.
  - `creationView()` frames the hill; `creationObjects()` returns the friends who stayed (a poke gives the happy giggle).

**F7. Every round: Camera. Minor (verify).** The camera is high and wide (0, 4.7, 13.2). The friends stand near the screen edges (x ±4.4 to ±4.7), with heads scaled 1.22. Sad and scared faces must be readable at tablet size. Capture all four faces with `qa-shots` and, if needed, frame tighter (FEEL rule 3).

### Lines to voice (feelings)

- F1 feeling labels: "Pip is happy.", "Pip is sad.", "Pip is angry.", "Pip is scared."
- F1 prompts: "Find a happy friend!", "Find a sad friend!", "Find an angry friend!", "Find a scared friend!" (in code, use "an" before angry: `SAY_FEEL[e] === 'angry' ? 'an' : 'a'`)
- F2 instructions: "Give Pip a hug!", "Big breath with Pip!", "Tap Pip! Happy dance!"
- F4 redirects (12):
  - "That one is happy. Find a sad friend!"
  - "That one is happy. Find an angry friend!"
  - "That one is happy. Find a scared friend!"
  - "That one is sad. Find a happy friend!"
  - "That one is sad. Find an angry friend!"
  - "That one is sad. Find a scared friend!"
  - "That one is angry. Find a happy friend!"
  - "That one is angry. Find a sad friend!"
  - "That one is angry. Find a scared friend!"
  - "That one is scared. Find a happy friend!"
  - "That one is scared. Find a sad friend!"
  - "That one is scared. Find an angry friend!"
- Only if F2 is postponed: "Angry! Big breath…"

---

## 5. Big and small (`sizes`): needs work

What works: the prompts are good ("Find the BIG elephant!" names the attribute and the object, and every prompt is recorded), size contrasts are strong in two-thing rounds, the L3 demo scans, and the tap sounds carry the size (low and deep for big, high for small).

### Issues

**Z1. Three-thing rounds (L1 #6, L2 #5 and #6, L3 #2 to #6): Learning and Logic. Major.**
- The problem:
  - "Find the BIG kitty!" among sizes 1.35, 0.9 and 0.5: the middle one is also big compared with the small one, so the question has two defensible answers for a 2-year-old. "Biggest" is a later concept.
  - The redirect "That's the middle kitty" uses a position word, but the order is shuffled. The "middle" kitty is often at the left or right edge.
- Fix: make three-thing rounds odd-one-out by size, so "big" and "small" stay unambiguous:
  - BIG asks get two small and one big: L1 #6 `[1.45, 0.65, 0.55]`, L2 #6 `[1.45, 0.65, 0.55]`, L3 #2 `[1.4, 0.65, 0.55]`, L3 #4 `[1.35, 0.65, 0.55]`.
  - small asks get two big and one small: L2 #5 `[1.35, 1.2, 0.5]`, L3 #3 `[1.4, 1.25, 0.55]`, L3 #5 `[1.4, 1.25, 0.6]`, L3 #6 `[1.5, 1.3, 0.6]`.
  - In `setRoles`, give every non-answer the opposite role.

**Z2. Wrong thing, every round: Voice. Major.** Only 3 of about 30 "That's the {size} {thing}. Find the {size} one!" lines are recorded; the rest are silent.
- Fix: drop the noun, and with Z1, drop "middle". In `tapThing`: `` this.redirect(this.ask === 'big' ? 'That one is small. Find the BIG one!' : 'That one is big. Find the small one!') ``. Two lines cover the whole game.

**Z3. Every right tap: Feel and Satisfaction. Major.** These are the loudest payoffs in the app, all automatic:
- camera shake (`shake`)
- every loose prop jolts (`jolt`)
- dust puffs (`puffs`)
- floating "BOOM" twice or "ROAR"/"BIG!"
- the other things pull scared faces (`startle`)
- props blown away
- a tower toppled, or five balls bursting out of a present

Fix (SATISFACTION sizes 1 and 2):
- One payoff with a beat: `await this.beat(t, 0.4)`, then the big one does one stomp (one `sfx.thunk`, one small `jolt(0.4)`), and the small one does one hop with a squeak.
- Delete `shake`, `puffs`, `startle`, every `fx.float` text, `burst`'s ball shower and `topple`. For the tower: the top block wobbles.
- Then 4 s of play: pressing the big one gives a slow heavy stomp and a low thud; pressing the small one gives a quick light bounce and a squeak. Use `this.pokeable(thing, { fn })` so she makes the contrast herself.

**Z4. Round start, then Ending: Satisfaction. Major.** `clearRound()` pops out every thing and prop 0.4 s into the next round. The finale only has the last round's things and still says "Look what you made!".
- Fix (SATISFACTION sizes 3):
  - `this.tray = makeTray(this, 6, [0, 0, -4], { style: 'rug' })`.
  - In `afterSuccess`, the picked thing walks (`walk: true` for animals) to its place in a size-ordered line on the rug, scaled 0.5, and the other things walk off.
  - `creationView() { return this.tray.view(); }`. `onFinale` makes the line hop from biggest to smallest, each with its own `voice(t)` sound.

**Z5. Swap rounds (L1 #5, L2 #4, L3 #2 and #4): Pacing and Learning. Minor.**
- The problem: the magic size swap adds about 1.9 s before she can act, four times. In L1 a frog that changes size is a trick, not a size lesson.
- Fix: remove `swap` from L1 #5 and L2 #4, and keep it only on L3 #4.

**Z6. Round start: Pacing. Minor.**
- The problem: 3 to 5 s of arrivals plus raining props (`rain`) plus a visitor walking in before the question. Six loose props on the grass each round are pokeable, so they pull her away from the task.
- Fix:
  - Keep two arrival styles per level (walk, peek).
  - Delete `rain`.
  - Cut `spawnProps` to 3 props, placed behind the line, not in front.

**Z7. Captions: minor.** ⚽ is used for a plain blue ball and 🏐 (volleyball) for a beach ball. Use 🔵 and 🏖️.

### Lines to voice (sizes)

- "That one is small. Find the BIG one!"
- "That one is big. Find the small one!"

These two replace every existing redirect. The three recorded redirect clips become unused.

---

## Corrections to the storyboards

- **All five:** "falls back to the browser's system speech voice" is wrong. `VOICE = false` in `speech.js`, so unrecorded lines are silent captions.
- **colours:**
  - The friend never "hops with joy". `friendThrow` calls `afterSuccess()`, which sends it off before the drop.
  - In the finale only the fullest container tickles, not all of them.
  - A wrong drop plays no "nope" sound.
- **counting:**
  - "Five!" is queued in `new-lines.txt`; it is not simply missing.
  - There is a likely double chomp when the next round starts (K4).
- **feelings:** seven of the eight fix lines do have clips. They are muted by `this.voiceLines = false`, not unrecorded.
- **sizes:**
  - Payoffs last about 1.2 to 1.8 s, not 0.7 to 1.3 s.
  - The success caption only appears after the payoff (`tapThing` awaits the payoff, then calls `success()`).

## All lines to add to `tools/voice/new-lines.txt`

Wording for each line is in the game sections above.
- colours: 10 redirects, "Look! So much yellow!", and 4 prompts.
- counting: 17 totals and "Tap the apple!".
- shapes: 11 redirects and 4 prompts.
- feelings: 4 labels, 4 prompts, 3 comfort instructions and 12 redirects.
- sizes: 2 redirects.

That is 73 lines in all. Already queued and not repeated here: "Look what you made!" and "Five!".
