# Audit: Word world (`words`)

I checked `wordworld.md` beat by beat against the seven audit checks in `README.md`, against `FEEL-BRIEF.md`, `SATISFACTION.md` and `QUALITY-BRIEF.md`, and against the code: `app/src/lessons/words.js`, `words-list.js`, `words-plan.js`, `words-scene.js`, `app/src/engine/lesson.js`, `input.js` and `audio.js`. I also compared it with the design in `docs/design/words.md`.

Beat numbers refer to the storyboard: "L1 6" is Level 1, row 6.

Missing voice clips are **not** counted as design issues, because they are waiting to be generated.

Severity:
- **blocker:** she can get stuck, or the game can't go on.
- **major:** it hurts understanding, learning or satisfaction in a way she will notice.
- **minor:** polish.

## Verdict

| Game | Verdict | Blocker | Major | Minor |
|---|---|---|---|---|
| Word world (`words`) | **needs work** | 0 | 10 | 12 |

**What already works.** The core loop is the strongest in the app.
- Her tap takes the photo, behind a real beat (squash, viewfinder, shutter).
- The card hangs on a peg above the very thing she photographed. At the end she taps each card into her own book, and the book is what the finale shows.
- A wrong tap names the thing she touched. There is no "no" and no buzzer.
- The idle ladder goes bob, then ring and hand, then errorless.
- Nothing she makes is taken away. Photos stay on the line, sorted toys stay on their shelves, and the book fills up over many visits.
- The mute test and the end-frame test both pass at L1 and L2.

**What needs work:**
- Level 3's Tidy stage is under-built: long dead waits, no spoken instruction, nudges that do nothing, a demo shown once ever, and toys she may never have met.
- Round 0's state leaks from the Meet phase into the Find phase.
- The word memory is told she "knows" words she only got right by elimination, or that she was shown, or that were shown with the wrong model.

### Top 8 issues

1. **Round 0 leaks state from Meet into Find (W1, major).**
   - Round 0 covers Meet A, the walk, Meet B and Find 1, and `errorlessOn` and `cur` are never reset inside it.
   - If she idled into errorless in nook A, nook B's errorless step is dead. A passive child gets one hand tap in nook B and is then sent Home at 45 s.
   - Find 1 is also recorded as "hinted", so a right first tap *lowers* that word's box, and Find 1 has no errorless step either.
2. **Level 3 dead time (W3, major).**
   - The walk to Tidy is **6.7 s**, not 3.5 s, because L3 finds always end in nook A, 23 units from the rug. Pip zips at 5.7 u/s (`walkTo` caps at 4 s) while the camera trails behind him.
   - The train then arrives for 5.2 s, and the first-ever demo adds 4 s: about 12–16 s before she can touch anything.
   - Between loads she waits about 12.4 s with empty carts. The design asked for a 1.8 s glide and a train round trip of about 5 s.
3. **Tidy says nothing and helps with nothing (W4 + W5, major).**
   - After the first-ever demo, no sort round has a spoken instruction.
   - The 6 s and 12 s nudges try to bob a home, but homes have no `pose`, so nothing moves.
   - Errorless "closes" the wrong homes by only 0.5 rad, so their doors still look open, and a drop on them still counts as wrong.
   - The 8 s demo timer ignores her touches: line 106 resets `this.stuckT`, a variable nothing reads. The engine's 12 s hint adds a second demo on top.
4. **Elimination counts as knowing (W6, major).**
   - In L1 rounds 2, 3 and 6, and in L2 rounds 3 and 6, the decoys already have photos hanging above them, so "tap the one without a photo" always wins.
   - These finds, and the first find that the hand demo answers for her, raise the word's box, so the spacing schedule treats untested words as known.
5. **The Go! badge is wrong in three places (W2, major).**
   - No Go! before Meet B.
   - No Go! before Find 1, the first time she is asked a question.
   - In the first Tidy round the badge is forced at 6 s, in the middle of the walk, before the train has even arrived.
6. **"finger", "toes", "teeth" and "tongue" use the hand, foot and mouth models (W7, major).** "Where are the toes?" is answered by tapping a whole foot, and the book stores a hand labelled "finger". This teaches the wrong meaning.
7. **The Level 3 book has holes (W8, major).**
   - Two of today's six words are never asked.
   - Today's words are left out of the background old-photo drawing.
   - So the book shows dotted empty places for words she met today, including words whose photos she earned on earlier visits.
8. **Sorting starts with strangers and is shown once ever (W9 + W10, major).**
   - On the first L3 visit the train brings words she has never met (coat, T-shirt, trousers in the worked example), so she is asked to sort things she can't yet name.
   - The drag demo plays once in her life, moves only a ghost hand (the toy stays in its cart), and doesn't replay when stage 3 adds a third home.

---

## Issues

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| W1 | L1 3–6; L2 2–5; L3 1–6 | **major** (logic, showing how, learning) | Round 0 runs Meet A, the walk, Meet B and Find 1 without a `nextRound()` in between, so `this.cur` and `this.errorlessOn` carry over. **(a)** After errorless in nook A, the engine's `errorless()` returns early in nook B (`if (this.errorlessOn) return`). Ladder: 12 s, the hand taps one thing; 20 s, nothing; 45 s, "Bye bye!" and Home. **(b)** In Find 1 the 3rd wrong tap and the 20 s idle errorless do nothing (no dimming, no hand). **(c)** The Meet's `cur.hints++` (ladder step 3) and `errorlessOn` make `found()` record Find 1 as not first try, so `P.found` lowers the box of a word she just got right. | In `meetNook(n)`, after `this.idle = 0; this.ladder = 0;` add `this.errorlessOn = false;`. At the top of `findRound(r)`, after `this.busy = true;` add `if (r === 0) { this.cur = { wrong: 0, hints: 0, t0: performance.now() }; this.errorlessOn = false; }`. |
| W2 | L1 5, L1 6; L2 4, 5; L3 5, 6, 10–12 | **major** (showing how) | **Go! is missing or misleading.** The single Go! of round 0 is used up when nook A opens, so there is none before Meet B or Find 1. `checkGo()` also forces the badge after 6 s whatever is happening. In the first Tidy round (6.7 s walk, 5.2 s train, first-ever 4 s demo) it flashes mid-walk, before any toy can be dragged. Rounds with a crossing plus a question (about 6.1 s) are borderline. | Add to `words.js`: `holdGo() { this.goPending = true; this.goT0 = Infinity; }` and `armGo() { this.goT0 = performance.now(); }`. With `goT0 = Infinity` taps wait and the 6 s force never fires; `checkGo()` shows Go! once `busy`, `demoing` and the voice are done. Call `holdGo()` at the top of `findRound` and `sortRound`, and in `meetPhase` just before `this.speak(LINES.come)`. Call `armGo()` wherever those set `this.busy = false`: the end of `findRound`, the end of `sortRound`, and in `meetNook` (all nooks). |
| W3 | L3 10, 11, 16, 20 | **major** (pacing) | **Dead waits.** The L3 finds are `least(slotsB)` then `least(slotsA)`, so Pip always leaves for Tidy from nook A (x 1.2): 22.8 units. The glide is `dist / 3.4` = **6.7 s**, while Pip's `walkTo` caps at 4 s, so he zips at 5.7 u/s and runs ahead of the camera. Then `trainIn` adds 5.2 s (12.5 units at 2.4 u/s), plus 4 s for the first-ever demo. Between loads: 1 s of stillness, 1 s wait, 5.2 s out and 5.2 s in, about 12.4 s with empty carts and nothing to do. `words.md` 3.6 asked for a 1.8 s glide and a round trip of about 5 s. | (1) In `sortRound`, first time: start the first train while Pip travels: `await Promise.all([this.pipTo(this.tidyPipX, { speed: 3.4, z: -3.3 }), this.glide(to, Math.min(3.2, Math.max(1.8, dist / 3.4))), this.trainIn(sort.loads[0])]);`, and skip `trainIn` below when `i === 0`. (2) In `trainIn` and `afterSortLoad`, use `S.TIDY_X + 11` instead of `+ 16`. Check in the tidy view that the last cart starts out of frame. That is 7.5 units, about 3.1 s each way. (3) In `afterSortLoad`, let the child send the train: the engine gets an `input.addTap` and breathes; her tap gives `S.toot()` and the train rolls out. Auto after 3 s. The release is hers (SATISFACTION rule 1). The first load is then ready about 3.5 s after the last find, and the gap between loads drops to about 6.5 s. |
| W4 | L3 13–19 (every sort) | **major** (prompt, voice) | **No spoken instruction per toy.** `sortRound` says nothing after the first-ever demo. The idle prompt (6 s and 12 s) is caption-only, because `prompt()` voices only Meet lines. The category question is voiced only after a wrong drop. She has to work out from the scene that she should pick up a toy. | At the end of `sortRound`, after enabling the drags: bob `this.curToy`'s `userData.pose` (0.7 s, the same anim as `nudge`), then `await this.speak(BY_ID[this.curToy.userData.toy.id].name, { max: 1.6 }); this.speak(LINES.take, { voice: this.res.sorts < 2 });`. In `promptText()` the sort phase returns `LINES.take`; keep the group `ask` line for wrong drops only. `pickToy` saying the name again within 4 s is caption-only already. |
| W5 | L3 13 (wrong / nothing) | **major** (showing how) | **Nudges, errorless and the demo timer are broken.** (a) `nudgeTarget()` returns the *home*, which has no `userData.pose`, so the 6 s and 12 s bob does nothing; the ring and halo branch is limited to `phase === 'find'`. (b) Errorless `homeNear(h, -1)` turns the wrong homes' doors by only 0.5 rad from about 1.6–1.75 rad open, so they still look open. `zones()` still includes them, so a drop there is another wrong drop. (c) Line 106 resets `this.stuckT`, which nothing reads, so `sortStuck` counts every second she isn't dragging and the 8 s demo plays while she is busy trying. The engine's 12 s `showHint` adds a second `sortDemo` about 8 s later. | (a) `nudgeTarget()`, sort branch: `return this.curToy;` (the toy bobs: "pick me"). In `nudge(step)`, add `if (step >= 2 && this.phase === 'sort') { const h = this.homeOf(this.curToy); if (h) { S.homeNear(h, 1); const stop = fx.halo(h, 1.6); this.s.wait(3).then(() => { stop(); if (!h.userData.shut) S.homeNear(h, 0); }); } }`. (b) In `makeHome`, store each door's closed rotation (`d.userData.closed`: the Blender rest rotation, or `0` for the fallback hinge). In `makeErrorless` (sort), tween the wrong homes' doors to `closed` over 0.4 s. In `zones: () => this.homes.filter((h) => !h.userData.shut).map(...)`, so a drop on a closed home walks back silently. (c) Line 106: `this.stuckT = 0` becomes `this.sortStuck = 0`. In `showHint()`, drop the sort branch (the lesson's own 8 s timer owns the sort demo). |
| W6 | L1 7, 8, 11; L2 7, 10; L1 6 / L3 6 (first find ever) | **major** (learning) | **Elimination and demos count as knowing.** In a pair round, or the third round of a trio, every decoy already has its photo hanging above it on the line (visible in the trio view), and the one just found is often the decoy. "Not the one with a photo" answers L1 rounds 2, 3 and 6 and L2 rounds 3 and 6 without knowing the word. The first-ever find demo taps the answer, then sets `cur.hints = 0`. All of these call `P.found(..., firstTry=true)` and raise the box, so the planner spaces out words she was never really tested on. | In `found()`: `const elim = !this.photos.has(u.word) && this.choices.every((c) => c === t \|\| this.photos.has(c.userData.word));` and `if (firstTry && (elim \|\| this.cur.shown)) P.practised(this.mem, w.id, this.plan.turn); else P.found(this.mem, w.id, firstTry, this.plan.turn, this.today);`. In `findRound`, replace `this.cur.hints = 0` after the demo with `this.cur.shown = true;`. Optional, to get 4 real tests out of 6 instead of 3: L1 `finds` in `words-plan.js` become B `[0,1]→0, [1,2]→2, [1,2]→1`, A `[1,2]→2, [0,1]→0, [0,1]→1`. The most familiar word (middle) comes last, where elimination makes it easy anyway. |
| W7 | Me visits (nook `close`) | **major** (learning) | `finger`, `toes`, `teeth` and `tongue` have no `prop_word_*` model (not in `assets/models/index.json`), so `modelOf` falls back to the whole hand, foot or mouth. "Where are the toes?" is answered by tapping a foot; the reaction and the photo are the foot's; the book stores a hand captioned "finger". It teaches the wrong meaning. | In `words-list.js` rows 270–273, set the model to the word's own card only: `'prop_word_finger'`, `'prop_word_toes'`, `'prop_word_teeth'`, `'prop_word_tongue'`. `available()` is then false until they are built (VOCAB.md). Nook `close` keeps hand, foot and mouth: still three usable words that don't clash. |
| W8 | L3 20, Ending | **major** (satisfaction, logic) | **Book holes at L3.** Only 4 of the 6 words are found. `queueOldPhotos()` excludes all six of today's words (`today = slots.A + slots.B`), so: (a) the 2 unasked words, which she met and heard today, show dotted squares; (b) if either already had a photo from an earlier visit, it disappears today. The end frame shows a book with holes for words she just learned. | In `queueOldPhotos()`, exclude only the words that will be asked: `const asked = new Set(this.plan.finds.map((f) => f.word).filter(Boolean));`, filtering `!asked.has(id)`. L1 and L2 ask all six, so they are unchanged. Factor the render code into `renderPlace(id)`. In `bookPhase()`, before the cover opens: `for (const t of this.things) { const id = t.userData.word; if (!this.photos.has(id) && !this.places.get(id)?.photo) this.renderPlace(id); }`. Every word met today is then in the book. |
| W9 | L3 11–19 | **major** (learning) | **The first sorts use words she has never met.** `planSort` queues met words first, then box-0 words. On an early L3 visit nearly every toy is box 0: coat, T-shirt and trousers in the worked example. The first time she hears "coat" is when she picks it up, and she is asked to put it in a category at the same moment. (`words.md` 3.6 says the toys are "a word she already knows".) | (1) In `planSort`, stage 1: before the seed pick, sort `pairs` by the number of met words (box ≥ 1) in both groups, most first. (2) In `trainIn`, when the train stops: each toy whose box is 0 hops in turn, 0.9 s apart, and says its name (`this.speak(BY_ID[id].name)`), so it is introduced before she has to sort it. This uses time that is otherwise dead (W3). |
| W10 | L3 12; all meets on return visits | **major** (showing how) | **Demos are once ever.** `mem.taught.meet`, `.find`, `.sort` and `.book` are each set once for life. Tap (Meet) is easy and the 12 s ladder hand covers it. Drag is the game's only drag action, and its demo (a) plays once ever, (b) moves only a DOM hand while the toy stays in its cart, and (c) doesn't replay when stage 3 brings a third home. FEEL-BRIEF rule 2 and the parent ("show how to do it more") ask for more than this. | `taught.sort` becomes a count: play `sortDemo(true)` on the first sort of a visit while `(this.mem.taught.sort \|\| 0) < 3`, or when `plan.sort.stage > (this.mem.taught.sortStage \|\| 0)`. In `takePhoto()`, after `endVisit`: `if (this.res.sorts && this.res.sortFirst >= this.res.sorts - 1) this.mem.taught.sort = (this.mem.taught.sort \|\| 0) + 1; this.mem.taught.sortStage = Math.max(this.mem.taught.sortStage \|\| 0, this.plan.sort?.stage \|\| 0);`. Give `hand()` an `onCarry(m)` callback (0..1 over the carry segment). In `sortDemo`, the toy rides with the hand for the first 60% of the path, then floats back to its cart (`input.sendHome`) as the hand fades: "your turn". Meet: the same counter pattern, demo for the first 3 visits (nook A only). |
| W11 | L1 1 (every visit) | minor (logic, prompt) | **Wrong place lines.** "Let's go to the farm!" plays for every Animals visit, including the Wild wood, Zoo, Rock pool and Far away. "Let's get dressed!" (Clothes): nobody gets dressed. "Let's see what goes!" is abstract. Me says "Hello, Bear!" whenever *either* nook has the bear, even when nook A, on screen, shows hands and feet. | `PLACES` lines: animals **"Let's find animals!"**, clothes **"Let's find clothes!"**, vehicles **"Let's find things that go!"**. In `meetPhase`: `const line = this.place.id === 'body' ? (nkA.N.char ? 'Hello, Bear!' : "Let's look at me!") : this.place.line;`. |
| W12 | L1 1 | minor (voice) | **Two greetings back to back.** The engine's intro "Let's find some words!" ("words" is abstract to a 2-year-old) and 0.8 s later the place line, with Pip waving twice (the engine's `wave` and then `waveOnce`). | In `build()`, after the plan: `this.meta = { ...this.meta, intro: <the place line from W11> };` (a copy, not the shared meta). In `meetPhase`, delete `this.speak(line)` and `await this.waveOnce()`; keep the 0.8 s settle. |
| W13 | L1 12, L2 13, L3 20 | minor (prompt) | **"Pop them in your book!"** names neither the action (tap) nor the object ("them"); "pop" is an idiom. The book phase has no idle prompt (`promptText` returns ''). | `LINES.book = 'Tap a picture!'` (voiced). `promptText()`: `if (this.phase === 'book') return LINES.book;`. |
| W14 | L3 11 | minor (voice) | "Here comes the train!" is narration the visuals carry (FEEL rule 4), and it lands on top of "Tidy-up time!" once W3 overlaps the train with the walk. | `this.speak(LINES.train, { voice: false })`. |
| W15 | L3 (vehicles home) | minor (prompt) | "Things that go, go in the garage." and "Where do things that go, go?" are tongue-twisters. | `HOMES.vehicles.line = 'The garage is for things that go!'`; `HOMES.vehicles.ask = 'Where does it go?'`. |
| W16 | L1 3, 5; L2 2, 4 | minor (pacing, logic) | The nook ends only after **4 s with no touch at all**. `input.onAny` resets `lastTouch` on every tap, including scenery. A child who keeps tapping, which is the point of Meet, never moves on, and nothing tells her the nook is done. | In `checkMeet()`: record `this.allMetAt` the first time every thing in the nook is met. Also finish when `performance.now() - this.allMetAt > 15000` and no reaction is playing. One frame before `done()`, Pip turns toward nook B. |
| W17 | L2 11, 12 | minor (pacing, learning) | The order B×3, A×3, B-again, A-again crosses between the nooks three times (rounds 4, 7, 8; about 3.5 s each). The A "again" target (lowest box) can be the word found 2 rounds earlier. The B "again" round is 4–6 rounds later, which is fine. | `words-plan.js` L2: `…A×3, { nook: 'A', again: true }, { nook: 'B', again: true }` (2 crossings). In `findRound`'s again branch, skip any word found in the previous two rounds: keep `this.foundLog` (push `u.word` in `found()`), and filter `!this.foundLog.slice(-2).includes(t.userData.word)` before the box sort, unless that leaves nothing. |
| W18 | L1 12 (book) | minor (logic) | A tap on a second photo while one is flying (0.7 s, `busyCard`) is dropped with no response. Toddlers tap in quick runs. | In `bookTap`: if `this.busyCard && !demo`, push the card to `this.bookQueue` (if it isn't there already) and return. In the flight's `.then`, after `this.busyCard = false`: `const nx = this.bookQueue?.shift(); if (nx) this.bookTap(nx);`. |
| W19 | any Find / Tidy (45 s idle) | minor (logic) | The 45 s idle exit (engine `timeout()`) still saves the word memory: `dispose` runs `offs`, which includes `saveMem`. What it loses is `P.endVisit` (the visit counter, the new-word pace, the sort stage), the session records and the sticker. The quit visit still counts the place as visited (`beginVisit`), so review timing drifts. | Add `this.offs.push(() => { if (this.metDone && !this.ended) { this.ended = true; P.endVisit(this.mem, this.plan, this.res); this.saveMem(); } })`, pushed **before** the existing `saveMem` off. No sticker; that stays a finale reward. |
| W20 | L2 5, 7 (listen rounds) | minor (learning) | Listen rounds use any word with a sound, including `crunch` (apple), `pour` (milk), `splash` (bath), `tick` (clock), `rustle` (grass) and `tune` (piano). A 2-year-old can't link a generic crunch or splash to one object, so the round is a 1.1 s pause, and it uses up one of the two listen slots. | In `findRound`: `const LISTEN = new Set(['woof','meow','moo','quack','oink','baa','neigh','cluck','cheep','tweet','buzz','ribbit','hoot','trumpet','monkey','ring','choo','neenaw','honk','bell'])` and test `LISTEN.has(w.sound)` instead of `w.sound`. |
| W21 | all Find rounds, wrong tap | minor (voice) | The design says the first question repeat after a wrong tap is spoken. A wrong tap within about 2.6 s of the question puts the repeat inside `SAME_GAP` (4 s), so it is caption-only. | Add `force` to `speak()` (skip the `SAME_GAP` test when true). In `findTap`: `this.speak(this.target.userData.w.where, { voice: n === 1, force: n === 1 })`. |
| W22 | L2 2, 4 (returning visits) | minor (prompt) | When there is no demo (every visit after the first), nook A opens in silence. "What's that?" comes only at 6 s idle. Rings are the only cue. | In `meetNook(0)`, when no demo plays: `if (!this.whatSaid) { this.whatSaid = true; this.speak(LINES.what); }`. Voiced once per visit, as now. |

### Rewritten captions

- **Voiced instructions:**
  - "Tap a picture!" (book; replaces "Pop them in your book!")
  - "Where does it go?" (vehicles ask)
- **Place lines** (each also used as the game intro, W12):
  - "Let's find animals!"
  - "Let's find clothes!"
  - "Let's find things that go!"
  - Me picks "Hello, Bear!" or "Let's look at me!" by nook A.
- **Success line:** "The garage is for things that go!" (voiced the first time per visit, as the other home lines are).
- **Made caption-only:** "Here comes the train!"
- **Reused at new moments, no new clips needed:**
  - Each toy's name line ("A duck!"): on its round, and on arrival when it's new.
  - "Take it home!": voiced on the first two sorts of a visit.
  - "What's that?": at nook A when there is no demo.

---

## The storyboard's "Looked broken" list, checked

| # | Claim | Verdict |
|---|---|---|
| 1 | Almost nothing is voiced | Correct, but clips are pending generation. Not a design issue. |
| 2 | `woof`, `monkey`, `rattle`, `bell` and `honk` are silent | **Refuted.** `app/assets/sfx/manifest.json` lists `woof_1.ogg`, `monkey_1-3`, `rattle_1-3`, `bell_1-8` and `honk_1`. All the files exist, and `loadSamples()` (called from `src/main.js`) registers every manifest event as `sfx.<name>`, so `S.signature()` plays them. The storyboard only searched code. |
| 3 | Place line says "farm" for every Animals visit | **Confirmed**, and it also affects Clothes and Me (W11). |
| 4 | Go! used up at the start of Meet | **Confirmed**. It also missed the forced early Go! in the first Tidy round (W2). |
| 5 | Meet demo only at the first nook ever | Confirmed. The nook-B case is harmless (the same action, and the 12 s hand covers it). The real problem is the once-ever drag demo in Tidy (W10). |
| 6 | L3 dead waits | **Confirmed and understated.** The Tidy move is 6.7 s, not 3.5 s, because L3 finds always end in nook A. Pip's `walkTo` caps at 4 s, so he zips at 5.7 u/s ahead of the camera (W3). |
| 7 | Sort nudges do nothing; errorless only closes doors | **Confirmed and worse.** The doors close by only 0.5 rad, so they still look open. Closed homes still accept a (wrong) drop. The `stuckT` typo means the 8 s demo ignores touches, and the engine's 12 s hint adds a second demo (W5). |
| 8 | L3 leaves two words without photos | **Confirmed**, including the loss of photos she earned earlier (W8). |
| 9 | Known words re-met with no sign; the 4 s quiet gate | Re-meeting known words is the spaced review working as designed, so it is **not a fault**; keep it. The 4 s gate is confirmed (minor, W16). |
| 10 | "Again" rounds: recent words, three crossings | Partly. Three crossings is confirmed. "2–3 rounds earlier" applies only to the A "again" round; the B "again" round is 4–6 rounds after its find (W17). |
| 11 | Review-cycle comment is wrong | Comment only. After the first cycle the code does run fresh, fresh, review (visits 4, 7, 10…). Not child-facing; no issue. |
| 12 | Body words reuse models | **Confirmed, major** (W7). |
| 13 | Book taps ignored mid-flight | Confirmed, minor (W18). |
| 14 | 45 s idle exit loses results | **Partly refuted.** The word memory (boxes from `found` and `heard`, plus `beginVisit`) is saved on exit through the `saveMem` off. Lost: `endVisit` (visit counter, new-word pace, sort stage), session records and the sticker (W19). |

### What the storyboard missed

- **W1:** `errorlessOn` and `cur` leak through round 0. A passive child is sent Home from nook B, and Find 1 is mis-recorded.
- **W2:** the forced Go! at 6 s in Tidy.
- **W4:** no spoken instruction in any sort round.
- **W6:** elimination rounds and the demo-answered first find raise word boxes.
- **W9:** early L3 visits sort never-met toys.
- **The book is not the photos she took.** `buildPages()` and `queueOldPhotos()` rebuild every visit's pages from fresh renders of any word with box ≥ 1. A word she only *heard* (a toy picked up in Tidy, from another place) later shows a "photo" she never took. This is acceptable for a 2-year-old, but "photos stay in the book for good" in the storyboard is only true in that sense.
- **Parent stats are inflated.** The 6 Meet records are all `firstTry: true` (`meetPhase`), so `store.record` inflates the parent's numbers for this game. This is parent-facing only. Consider leaving Meet out of `records`.

---

## Voice clips (not counted as design issues)

Almost every line in the game is still waiting for a clip (all of them are in `tools/voice/new-lines.txt`).

**New lines this audit introduces** (add them to `new-lines.txt` when the fixes go in):
- "Tap a picture!"
- "Where does it go?"
- "Let's find animals!"
- "Let's find clothes!"
- "Let's find things that go!"
- "The garage is for things that go!"

**Lines these fixes retire:**
- "Pop them in your book!"
- "Let's get dressed!"
- "Let's see what goes!"
- "Things that go, go in the garage."
- "Where do things that go, go?"
- "Let's find some words!" (the intro becomes the place line)
- "Let's go to the farm!" (no longer used)

**Kept, but caption-only:** "Here comes the train!"
