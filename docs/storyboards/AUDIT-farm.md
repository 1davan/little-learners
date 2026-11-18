# Audit: Farm world (moo, share, band, pots, story)

Audited against `docs/storyboards/README.md` (audit checklist), `docs/FEEL-BRIEF.md`, `docs/SATISFACTION.md` and `docs/QUALITY-BRIEF.md`, from a 2-year-old's point of view. Storyboard claims that mattered were checked against `app/src/lessons/<id>*.js` and `app/src/engine/lesson.js` / `speech.js`. Voice status was checked against `app/assets/voice/index.json`, `tools/voice/new-lines.txt` and `pending-lines.txt` (script, not by hand).

Severity: **blocker** = breaks the game for her or fails a hard rule; **major** = she will be confused, bored or rushed, or the goal is not taught; **minor** = polish.

## Verdicts

| Game | Verdict | One line |
|---|---|---|
| Who says moo? (`moo`) | **needs work** | The listening task is clear, but the call she has to recognise plays on top of the narrator. The reward is a busy show of treats she never gives, and nothing she finds stays. |
| Share the snacks (`share`) | **needs work** | The best mechanic in the world: she drags each snack, and the dotted spots show how many. But the wrong-drop line points at the wrong friend, the prompts have no verb, and four payoffs are stacked on one moment. |
| Barn band (`band`) | **needs work** | Good audience reactions. "Copy Pip!" means nothing to her, the 6 s nudge wipes beats she has already tapped, and the band never grows. |
| Peekaboo pots (`pots`) | **needs work** | Peekaboo is a perfect fit for her age. But the Go! badge pops up in the middle of the shuffle, L3 is too hard, and the friends she finds shrink to nothing. The finale shows five friends she never found. |
| What happens next? (`story`) | **poor** | Nobody tells the story, and the L1 set-up runs past in under 2 s. L2 and L3 ask for more sequencing than a 2-year-old can do. Every finished story flies away, so the finale photo is of empty stands. |

## Cross-cutting (all five games)

| # | Issue | Severity | Fix |
|---|---|---|---|
| X1 | **Nothing she does persists, and no game defines `creationView()` or `creationObjects()`.** Every finale has the camera stay put and photographs whatever is left: the last round's animals, friends or covers, or nothing (story). This fails the SATISFACTION end-frame test in all five games. `engine/keepsake.js` (E5) exists and is meant for exactly these games, but none of them uses it. | major (blocker for story) | Per game below. In each, add `this.tray = makeTray(this, 6, [x, 0, z], { style })` in `build()` and `await this.tray.add(...)` in `afterSuccess()`, plus `creationView() { return this.tray.view(); }` and `creationObjects() { return this.tray.items(); }`. |
| X2 | **Several rewards are stacked on every right answer.** Examples: a floating word plus ♪ plus a signature move plus the others hopping plus treats plus a chomp (moo); gold plates plus "=" plus juggle/spin plus a chomp plus hearts (share); popcorn, a note fountain or a spin, plus a cheer (band). FEEL rule 1 allows "no more than one celebratory effect at a time"; SATISFACTION rule 5 asks for one character reaction. | major | Per game: keep the one in-character reaction and delete the rest (the exact lists are below). |
| X3 | **`onFinale()` starts an automatic show the child cannot affect** in moo, band and pots. lesson.js forbids this (E3). | major | Replace each with "the child pokes a tray item and it answers" (`onAdmirePoke`). |

---

## 1. Who says moo? (`moo`): needs work

**What works:** "Who says moo?" is concrete. The wrong animal answering in its own voice ("Duck says quack!") is excellent teaching. The bubble can be tapped to replay the call, there are never more than 4 animals, and errorless kicks in after two wrong taps.

| Beat | Issue | Severity | Exact fix |
|---|---|---|---|
| Common, `prompt()` | **The animal call plays 0.25 s into the narrator's question**, so "Who says moo?" or "Listen! Who is it?" is spoken over the very sound she must recognise. At L3 the call is the whole task. (`moo.js` `prompt()`: `this.s.wait(0.25).then(() => playCall())`.) Band already solves this with `voiceIdle`. | major | `import { voiceIdle } from '../engine/speech.js'`; in `prompt()` replace the 0.25 s wait with `this.say(this.promptText(), { max: 1.5 }); voiceIdle(0.2).then(() => { if (t === this.target && !this.solved) this.playCall(); });` |
| Common, wrong tap | The wrong animal's own call (`this.voice(a)`) and the narrator's "Duck says quack!" start in the same frame and talk over each other. The target call then comes back at a fixed 1.6 s, which can land while the narrator is still speaking. | major | In `tapAnimal` (wrong branch): the animal calls first, then `this.wait(0.7).then(() => this.redirect(...))`; replace the fixed `wait(1.6)` replay with `voiceIdle(0.4).then(() => playCall())` (keep the round and target guard). |
| Common, wrong tap | `voice()` sets the animal's face to `scared` for 0.6 s, so an animal she taps looks frightened of her. | minor | In `voice()` use `setFace(f, 'joy')` (an open, happy calling face), not `'scared'`. |
| Common, right tap | **Everything happens at once, and none of it is her doing:** the bubble pops, the call plays, the word "Moo!" floats, a ♪ floats, the animal does its signature move, the other animals turn and hop in turn, then treats are thrown or rain down (swoosh or whoosh, 3-5 bodies) and are chomped away (shrunk to 0.001). She only watches. | major | (1) Delete `giveTreats` and the chomp in `afterSuccess`. (2) Keep the signature move only; drop the other animals' hops (keep their head-turn). (3) After the move and 1 s of stillness, **she feeds it**: one treat appears in Pip's basket next to the bale and gets `input.addDrag`, with a zone on the animal's mouth and `onNear` opening the mouth. The animal takes it and chews three times with its head down (`sfx.chomp` once). If she taps the treat instead, it hops over at walking pace. Put that promise in `this.payoffP` before `success()`. |
| Common, `afterSuccess` / `startRound` | The animal she found pops out at the next round (`popOut` 0.18 s), so after six rounds nothing is left. | major | `this.tray = makeTray(this, 6, [1.0, 0, -3.4], { style: 'shelf' })` styled as a fence line. In `afterSuccess`: `await this.tray.add(a, { walk: true })`. Only the animals she did *not* pick `fadeAway(…, 0.5)`. |
| Ending | `onFinale` makes the last round's animals call in turn by themselves; there is no `creationView`. | major | Delete `onFinale`. Add `creationView() { return this.tray.view(); }`, `creationObjects() { return this.tray.items(); }` and `onAdmirePoke(a) { input.press(a, 140); this.voice(a); }`. She "conducts" the fence choir by tapping. |
| Common, idle 6 s | At 6 s the right animal already hops, which gives the answer away in a listening game (worst at L3). | minor | Override `nudge(step)`: at step 1, just `playCall()` again (no hop, no line); at step 2, call the base nudge (hop and halo), plus the hand. |
| L2, all rounds | **L2 teaches nothing new except a third animal.** The bubble still shows the target animal's face in its colour, so she can match the picture and ignore the sound. | major (learning) | L2: `setBubble(..., noteOnly = true)` (the blue note, as at L3) for the first 6 s. At idle step 1, swap the face into the bubble as the hint. L1 keeps the face; L3 never shows it. |
| L3, all rounds | "Listen! Who is it?" is the same line every round, so after round 1 it is mostly caption-only (30 s rule). That is acceptable once the call stops being masked (fix above). | minor | No change needed once the call plays after the line. |
| Common, timings | After the right tap she watches about 3.6-4.3 s (by the code; the storyboard says 5-6 s) with nothing to do. | minor | The feeding step above turns this watching time into doing. |

**Rewritten captions:** keep every "Who says …?" line, "Listen! Who is it?" and the "<Animal> says <word>!" lines unchanged; they are good. No new lines are needed.

**Storyboard corrections:** the post-tap watch is about 3.6-4.3 s, not 5-6 s. L1 round 5 "Who says moo?" *can* be caption-only for a quick child: rounds 1-4 can total under 30 s (about 8 s for round 1 with its demo, then about 6.5 s each).

---

## 2. Share the snacks (`share`): needs work

**What works:** her finger carries every snack, and the dotted spots on each plate show how many each friend gets. The friends reach and lean in as she carries a snack, and the plate bounces when it lands. The wrong-drop correction (the friend with more shakes its head, the waiting friend hops) is exactly the lesson. Pacing between drops (0.7 s arc + 1.2 s) is calm.

| Beat | Issue | Severity | Exact fix |
|---|---|---|---|
| Common, wrong drop | **"This one is waiting!" is said straight after she drops on a friend, about a *different* friend.** For a 2-year-old, "this one" means the one her finger is on, which is the wrong one. | major | Name the waiting friend and point with the hop: `this.redirect(\`That ${this.friend.name} is waiting!\`)` (for the cookie party: "That friend is waiting!"). Also `this.addHalo(wait.userData.plate, 1.2)` for 2 s. |
| L1 #1-6 (prompt) | "One for each bunny!" has no verb and no object she can act on. "Each" is a quantifier word she does not have yet. | major | `promptText()` at L1 and for each = 1: `Give each ${name} ${article} ${snack}!`. See the rewritten captions below. |
| L2 #1-6, L3 #1-6 (prompt) | "Share the apples!": to a 2-year-old, "share" means "let someone else have yours". It tells her neither the action nor how many. | major | For each ≥ 2: `${N} ${plural} each!` ("Two apples each!"). The dotted spots carry the rest. |
| Common, last snack | **The learning moment is caption-only.** "Same for everyone!" is suppressed by `this.voiceLines = false`, so the word *same*, which is the concept, is never heard. Then four effects pile on: gold plates, "=" signs, juggle or spin, hearts. | major | Delete `this.voiceLines = false` in `build()` (success is its only consumer) and call `this.success(pos, SAME[this.each - 1], { voice: true })` with `SAME = ['The same! One each!', 'The same! Two each!', 'The same! Three each!']`. Keep the gold plates lighting one by one (it *shows* "same"). Delete the "=" floats, the hearts, and the `juggle` / `spin` payoffs (`PAYOFFS` all → `'munch'`). |
| Common, payoff | Every snack shrinks to nothing in 0.55 s, all together. | major | Rewrite `payoff('munch')`: friends eat **in turn, left to right, 0.6 s apart**, with two visible bites each (scale 0.6, then gone) and one `sfx.chomp` per friend, then a tummy-pat lean back. Set `this.payoffP` to that promise before `success()`. |
| Common, round change | The fed friends and their plates `popOut` (0.18 s) at the next round, so nothing builds up. | major | `this.tray = makeTray(this, 6, [0, 0, -3.6], { style: 'rug' })`. In `afterSuccess`, the first friend of the round walks to the rug and sits (`await this.tray.add(this.bunnies[0], { walk: true })`); the others walk off left at walking pace (`walkTo`) rather than popping. Add `creationView`/`creationObjects` from the tray. Delete `onFinale` (an automatic hop show). |
| L3 #1 (first-ever round at L3) | The base `playDemo` shows a **scan** hand at L3, so a child who starts at L3 never sees the drag gesture until she has been stuck for 12 s. A drag demo gives nothing away here (every friend with the fewest is a right answer). | major | Delete `demoL3()` from `share.js` and override `playDemo()` to always call `this.showHint(false)` (the drag). |
| Common, drop | Each right drop has two sounds (`sfx.land`, then the friend's call 0.75 s later), and each new snack adds `sfx.pop` plus a Pip hop. | minor | Keep the land sound plus the friend's call; drop `sfx.pop()` and Pip's hop in `spawnCarrot`. |
| L3 #2, #4 | One friend already has a snack (pre-filled), with no explanation. | minor | When the round starts, that friend pats its plate and looks at the others (a small `wiggle` and a head turn). There is no line; the hidden dot already shows it. |

**Rewritten captions:**

| Where | Old | New |
|---|---|---|
| prompt, each = 1, carrot | One for each bunny! | Give each bunny a carrot! |
| prompt, each = 1, apple | One for each piggy! | Give each piggy an apple! |
| prompt, each = 1, corn | One for each hen! | Give each hen some corn! |
| prompt, each = 1, fish | One for each kitty! | Give each kitty a fish! |
| prompt, cookie | A cookie for each friend! | Give each friend a cookie! |
| prompt, each = 2 | Share the apples! / carrots / fish / corn | Two apples each! / Two carrots each! / Two fish each! / Two corn each! |
| prompt, each = 3 | Share the carrots! / fish | Three carrots each! / Three fish each! |
| wrong drop | This one is waiting! | That bunny is waiting! / That piggy is waiting! / That hen is waiting! / That kitty is waiting! / That friend is waiting! |
| all equal (voiced) | Same for everyone! (caption) | The same! One each! / The same! Two each! / The same! Three each! |
| per drop (caption only, keep) | One for you! / And one for you! | unchanged |

---

## 3. Barn band (`band`): needs work

**What works:** Pip never plays over the narrator (`voiceIdle`). The numbered beat dots and the breathing next dot show how many beats are left. The audience reacts in character (cowering at too loud, leaning in at too quiet), which is a lovely, wordless way to teach loud and quiet. Progress is kept after a wrong tap.

| Beat | Issue | Severity | Exact fix |
|---|---|---|---|
| L1 #1-6, L2 (prompt) | **"Copy Pip!" is an abstract verb.** It is also said *before* Pip plays, so it cannot mean "do what you just saw". After round 1 it is mostly caption-only (30 s rule). "Your turn!" then carries no count. | major | Split the lines into before and after. Before Pip plays: L1 and L3 "Listen to Pip!"; L2 names the object and the concept: "Big pot! Loud!" / "Little bell! Quiet!" / "Big milk can! Loud!" / "Little pot! Quiet!". After Pip plays, at L1 the count: "Your turn! One bang!" / "Your turn! Two bangs!" / "Your turn! Three bangs!". At L2 and L3, keep "Your turn!". The count lines differ by round, so they are not silenced by the 30 s rule. |
| Common, idle 6 s | **The idle nudge wipes her progress.** The engine tick calls `this.prompt()`, which sets `this.i = 0`, resets every dot and replays the whole pattern. A child who tapped 2 of 3 and paused to look sees her dots vanish 2 s after "More!". | major | At the top of `band.prompt()`: `if (this.i > 0 && !this.listening && !this.busy) { this.nudge(1); this.say(this.pat.length - this.i === 1 ? 'One more!' : 'More!', { max: 0.6 }); return; }`. The full replay only happens from `cue()` (with `i === 0`) or after a wrong tap. |
| Common, Pip's turn | The idle timer keeps running while Pip plays (the engine `tick()` guard does not check `listening`). The storyboard says it does not. On the longest pattern (L3 #6: about 1.9 s line + 4 × 0.85 s) Pip finishes about 5.6 s in, just under the 6 s nudge that would restart him mid-pattern. The Go! badge is likewise forced at 6 s and can appear while taps are still off. | minor | In `band.update()`: `if (this.listening) { this.idle = 0; this.goT0 = performance.now(); }` |
| L2/L3 wrong tap | "That's loud. Tap quiet!" is caption-only (no clip). Both lines also use concept words with no object. | major | "Too loud! Tap the little one!" / "Too quiet! Tap the big one!". The object (big or little) is what she can act on; the concept word comes first. |
| L2 (learning) | Loud and quiet are fixed to big and small instruments, so she can succeed by choosing by size, and how she taps changes nothing (SATISFACTION rule 1). | minor | Accept the big = loud scaffold, but say both words every time (the L2 lines above do). Optional later: a long press on the big one makes a quiet tap, so the finger controls the volume. |
| L3 #6 | "BBss", four mixed beats, is beyond most 2-year-olds' working memory, and the patterns play 0.85 s apart. | major | `PLANS[2] = ['Bs', 'sB', 'BBs', 'ssB', 'BsB', 'sBs']` (at most 3 beats), and at L3 `BEAT = 1.0`. |
| Common, last beat | Payoff stack: the dots flash, the audience cheers (one calls), then popcorn bits, a note fountain or a twirling instrument. | major | Delete `payoff()`. Keep the dots flashing in order plus **one** audience friend's in-character cheer. Then **free jam for 4 s**: every tap sounds and the fans nod, with no right or wrong (set `this.payoffP = this.wait(4)` and let `hit()` accept any tap while `this.jam` is set). |
| Common, round change | `swapFan` replaces an audience friend every round, so the band never grows. | major | Replace `swapFan`: after each round, the friend who cheered walks up onto the stage behind the instruments with a mini instrument (`makeInstrument(kind, false)` at scale 0.5) and stays. Use `makeTray(this, 6, [1.0, 0, -2.4], { style: 'shelf' })` as the stage riser. In later rounds the band members nod on Pip's beats. |
| Ending | `onFinale` plays six beats and the cheers automatically. | major | Delete it. `creationView()` frames the stage, and `creationObjects()` returns the band members plus the big drum; poking the drum makes every band member play one beat (`onAdmirePoke`). |
| L1 #1 | "Let's play drums!" plus "Copy Pip!" plus "Your turn!" is three lines in about 4 s before her first tap. | minor | With the rewrite it becomes "Listen to Pip!" → one beat → "Your turn! One bang!". Drop the intro's 2.2 s wait to 1.5 s. |

**Rewritten captions:**

| Where | Old | New |
|---|---|---|
| L1 and L3, before Pip | Copy Pip! / Listen… now you! | Listen to Pip! |
| L1, after Pip | Your turn! | Your turn! One bang! / Your turn! Two bangs! / Your turn! Three bangs! |
| L2, before Pip | Loud pot! Copy Pip! (etc.) | Big pot! Loud! / Little pot! Quiet! / Little bell! Quiet! / Big milk can! Loud! |
| L2 and L3, after Pip | Your turn! | unchanged |
| wrong, tapped big | That's loud. Tap quiet! | Too loud! Tap the little one! |
| wrong, tapped small | That's quiet. Tap loud! | Too quiet! Tap the big one! |
| stopped part-way | One more! / More! | unchanged |
| success (caption) | What a band! | unchanged |

**Storyboard correction:** "Idle time does not count while Pip is playing" is wrong. The idle timer runs during Pip's turn and is only reset to 0 when he finishes (`prompt()` end).

---

## 4. Peekaboo pots (`pots`): needs work

**What works:** "Where's Chick?" is the perfect toddler question. At L1 the friend walks under the cover slowly while she watches, and the tail peeks out. The silly surprises are real character comedy. The hug with Pip is warm, and swaps go one in front and one behind, so the covers never pass through each other.

| Beat | Issue | Severity | Exact fix |
|---|---|---|---|
| L2 #4, #6; L3 #1-6 | **The Go! badge appears in the middle of the shuffle.** The engine forces Go! at 6 s after `nextRound()`, but setup plus hide plus 2-3 swaps takes about 7-8 s. So Go! (with its twinkle) pulls her eyes off the cover she is tracking at the exact moment that matters, and it promises a turn while the covers are still untappable. | major | In `startRound`, right before `this.busy = false; this.cue();`: `this.goT0 = performance.now();` (`goPending` is still true, so Go! shows once the voice is quiet). |
| L3 (all) | 3 swaps at 0.9 s each (quicker than L2) is a shell game beyond a 2-year-old, and quicker motion breaks the FEEL "calm" rule. | major | `SWAP_DUR = [1.1, 1.1, 1.1]`. `PLANS[2] = [[3,2,0],[3,2,0],[3,2,0,1],[3,2,0],[3,2,0],[3,2,0,1]]`, so L3's step up is 2 swaps every round plus the frog decoy twice, not more swaps. |
| Common, hide | About 4.5 s of silent watching. Nothing names what she is supposed to remember. | minor | When the cover starts to come down in `hideUnder` (friend only, not the frog): `this.say(\`${this.name()} is hiding!\`, { max: 1.2 })`. |
| Common, wrong tap | The combined line ("A ball! Where's Bunny?") has no clip for 22 of the 25 combinations, so most wrong taps are silent text. It also drops "now" in swap rounds. | major | Split it: `this.redirect(gl)` (voiced clips exist: "A ball!", "A worm!", "A sock!", "A snail!", "Frog!"), then after the cover sets down (`await this.lift(p, false)`) call `this.prompt()`. That reuses the voiced "Where's X?" / "Where's X now?". No new clips are needed. |
| Common, right tap | No beat before the reveal (rule 4), and "Peekaboo!" is caption-only (`voiceLines = false`) although a clip exists. That word *is* the game's payoff for her; it is not praise. | minor | Before `const up = this.lift(p)`: `await this.beat(p, 0.4)`. Delete `this.voiceLines = false` and call `this.success(…, 'Peekaboo!', { voice: true })`. The 30 s rule voices it about every other round. |
| Common, `afterSuccess` | **The friend she found shrinks to 0.001 while sitting in Pip's arms**, together with every cover. That breaks E8 (never remove what the child found). | major | After the hug, the friend walks to a fence tray at the back: `this.tray = makeTray(this, 6, [1.5, 0, -2.8], { style: 'shelf' })`, then `pip.remove(c)` / `this.root.attach(c)` and `await this.tray.add(c, { walk: true })`. Covers (props she did not make) go with `fadeAway(q, 0.5)` after the stillness. Found friends then gasp or lean when her finger nears the right cover in later rounds (optional). |
| Ending | `onFinale` spawns **fresh copies of all five friends**, including ones never seen at that level (Kitten and Hedgehog at L1), and makes them call and hop by themselves. | major | Delete `onFinale`. `creationView()` returns `this.tray.view()`; `creationObjects()` returns `this.tray.items()`; `onAdmirePoke(c)` plays that friend's call and a small hop. |
| Common, idle 6 s | At 6 s the right cover hops, which gives the answer away in a memory game (L2/L3). | minor | Override `nudge(step)`: at step 1, every cover gives a tiny wiggle (no answer); at step 2, the right cover hops and the friend's call plays from under it (`this.call()`). |
| Common, right tap | Hearts float beside Pip after the hug (rule 5). | minor | Delete the `fx.float('♥')` in `jumpToPip`; the wing-wrap and squish are the reward. |

**Rewritten captions:**

| Where | Old | New |
|---|---|---|
| hide (new) | (none) | Chick is hiding! / Bunny is hiding! / Piglet is hiding! / Kitten is hiding! / Hedgehog is hiding! |
| wrong tap | A sock! Where's Kitten? (combined) | "A sock!" then the round's own prompt ("Where's Kitten now?") |
| right tap | Peekaboo! (caption) | Peekaboo! (voiced) |

---

## 5. What happens next? (`story`): poor

**What works:** the cards are chunky and readable, all in one frame colour. Tapping a placed card replays it. The first "pick a card" has a slow 3.8 s demo with a halo, and when she is stuck it is shown again at 8 s. The wrong card wiggles "no" and goes home on its own. The wrong choice is the same moment from a different story, which makes it a fair choice.

| Beat | Issue | Severity | Exact fix |
|---|---|---|---|
| Ending (all levels) | **The finale photographs empty stands.** `clearRound()` throws every finished story up and off screen (`e * 9` on y), the last story included, and there is no `creationView`. The end-frame test fails outright, and the gallery photo is of nothing. | **blocker** | `build()`: `this.tray = makeTray(this, 6, [XC, 0, -3.4], { style: 'shelf', spacing: 1.4 })`. `clearRound()`: the story's **last card** (the ending: chick, flower, butterfly…) goes onto the tray with `await this.tray.add(last)` (the arc, about 1 s), and is still tappable to replay its act (`this.pokeable(last, { fn: () => last.userData.act() })`). The other placed cards slide down into a neat stack behind the stands (`walkTo` to `[XC + 2.6, 0.1 + i*0.08, STAND_Z - 0.6]`, scale 0.6) rather than flying off. Add `creationView() { return this.tray.view(); }` and `creationObjects() { return this.tray.items(); }`. |
| L1 #1-6, set-up | **Nobody tells the story, and it runs past too fast.** Cards 1 and 2 land 0.5 s apart, their acts (about 0.45 s each) fire 0.5 s apart, and the choice cards pop in at about 1.6 s, while card 2 is still acting. A 2-year-old has not taken in "egg, then crack" before she is asked what happens next. | major | `startRound` L1: drop card 1, `await` its act, say its line (below), `await this.wait(0.8)`; then card 2 the same way; only then `deal()`. That makes about 5 s of set-up, which is the story itself. |
| L1 (prompt) | "What happens next?" is an abstract question that is the same every round, so after round 1 it is caption-only roughly every other round. | major | One concrete question per story, voiced (different per story, so the 30 s rule never silences it). See the table below. Set it via `tale.ask` in `story-tales.js` and return it from `promptText()` at L1 and for the L3 prediction. |
| Common, finished story | **The story's message is caption-only** (`voiceLines = false` in `feelInit`), though every ending line has a clip ("The chick hatched!" and so on). Playback is automatic (5 s she just watches). | major | Delete `this.voiceLines = false`; call `this.success(pos, this.tale.line, { voice: true })`. **She tells it:** in `complete()`, card 1 acts, then each next card waits for her tap on it, with a soft pulse and the hand after 3 s, or auto-plays after 4 s. Route the taps through `tapPlaced`. |
| L2 (all) | Putting three shuffled cards in order from empty stands ("What happens first?") is a 3-4-year-old task. | major | L2: card 1 is placed and acted out for her (with its line); she places card 2 and then card 3 from the two left (no decoy). Prompts: "What happens next?" then the story's own question for the last card. |
| L3 (all) | Three in order **plus** predicting a fourth card from long versions, about 25-30 s per round. | major | L3 becomes today's L2 (three in order, short versions, no prediction). If the 4-card prediction is kept, use it only in rounds 5-6. |
| Common, idle | Hand demos stack up: the story's own demo at 8 s (3.8 s long), the engine's hand at 12 s, then the story's again at 22 s. That is three hands in about 25 s. | minor | In `story.js` override `nudge(step)` so step 2 only adds the halo (the story's `stuckCheck` already owns the hand). Or set `this.demoAt = 12` so the two coincide. |
| Common, `place()` | After her card lands she watches 0.35 s + act + 0.9 s, which is fine. The finished-story camera move, playback, 1.6 s still wait and fly-off add up to about 8 s of watching. | minor | The tap-to-tell fix above makes that time hers; the fly-off goes (tray instead). |

**Rewritten captions (L1 set-up lines and the question; all new):**

| Story | Card 1 line | Card 2 line | Question (L1, and the L3 prediction) | Ending (exists, now voiced) |
|---|---|---|---|---|
| Chick | An egg! | Crack, crack! | Who comes out? | The chick hatched! |
| Flower | A little seed! | A tiny sprout! | What grows? | The flower grew! |
| Caterpillar | A caterpillar! | It goes to sleep! | Who comes out? | A butterfly! |
| Apple | An apple tree! | The apple falls! | Who eats it? | Yum! Bunny ate the apple! |
| Rain | Sunny day! | Rain! | What comes now? | A rainbow! |
| Piggy | A mud puddle! | Muddy piggy! | What does piggy need? | Piggy is clean! |

L2 and L3 card lines: say the same card line as each card lands (her placement), so the story is told as she builds it. Keep "Not yet! What comes first?", "Not yet! What comes next?", "Hmm, not that one!" and "Look again!" unchanged.

---

## Top 5 issues (world-wide, by impact)

1. **Nothing she makes or finds stays, and every finale is an empty or automatic show** (X1; story's photo of empty stands is the blocker). Use the existing keepsake tray in all five games: a fence of found animals (moo), fed friends on a rug (share), a growing band (band), found friends on the fence (pots), and story endings on a shelf (story).
2. **Moo: the call she must recognise plays on top of the narrator's question**, and the wrong animal's call plays on top of "Duck says quack!". Play the call after `voiceIdle()`, as band already does.
3. **Pots: the Go! badge pops up in the middle of the shuffle** (forced at 6 s; the shuffle runs 7-8 s). Fix: reset `goT0` when the covers go live. Also cap L3 at 2 calm swaps.
4. **Band: "Copy Pip!" is abstract, and the 6 s nudge wipes beats she already tapped.** Use "Listen to Pip!" → "Your turn! Two bangs!", and make the nudge a "One more!" hop rather than a full replay.
5. **Story and share prompts are adult words with no action.** "What happens next?" has no story told; "Share the apples!" and "One for each bunny!" have no verb; "This one is waiting!" points at the wrong friend. Replace them with the concrete lines above, and voice the learning moments ("The same! One each!", "The chick hatched!").

## Lines that need voicing

Existing lines with no clip that the code says today (not in `new-lines.txt`):
- Cow says moo!
- Hen says cluck cluck!
- Horse says neigh!
- That's loud. Tap quiet! (superseded by "Too loud! Tap the little one!" if the band fix lands)
- 22 pots combinations "<Gag>! Where's <Name>?" (not needed if the pots split-line fix lands; skip them)

Already waiting in `tools/voice/new-lines.txt` (no action): Look what you made!

New lines from this audit (add to `tools/voice/new-lines.txt` when implemented):

```
Give each bunny a carrot!
Give each piggy an apple!
Give each hen some corn!
Give each kitty a fish!
Give each friend a cookie!
Two apples each!
Two carrots each!
Two fish each!
Two corn each!
Three carrots each!
Three fish each!
That bunny is waiting!
That piggy is waiting!
That hen is waiting!
That kitty is waiting!
That friend is waiting!
The same! One each!
The same! Two each!
The same! Three each!
Listen to Pip!
Your turn! One bang!
Your turn! Two bangs!
Your turn! Three bangs!
Big pot! Loud!
Little pot! Quiet!
Little bell! Quiet!
Big milk can! Loud!
Too loud! Tap the little one!
Too quiet! Tap the big one!
Chick is hiding!
Bunny is hiding!
Piglet is hiding!
Kitten is hiding!
Hedgehog is hiding!
An egg!
Crack, crack!
Who comes out?
A little seed!
A tiny sprout!
What grows?
A caterpillar!
It goes to sleep!
An apple tree!
The apple falls!
Who eats it?
What comes now?
A mud puddle!
Muddy piggy!
What does piggy need?
```

("Sunny day!" and "Rain!" already have clips, so they are left out of this list.)
