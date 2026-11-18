# Audit: Home world (dress, myday, snack, cook, candy)

I checked the storyboards `dress.md`, `myday.md`, `snack.md`, `cook.md` and `candy.md` beat by beat against the seven audit checks in `README.md`, against `FEEL-BRIEF.md` and `SATISFACTION.md`, and against the code (`app/src/lessons/<id>*.js`, `app/src/engine/lesson.js`, `speech.js`, `input.js`). Beat numbers refer to the storyboards. Missing voice clips are **not** counted as design issues. They are listed at the end.

Severity:
- **blocker:** she can get stuck, or the game can't go on.
- **major:** it hurts understanding, learning or satisfaction in a way she will notice.
- **minor:** polish.

## Verdicts

| Game | Verdict | Blocker | Major | Minor |
|---|---|---|---|---|
| Dress Monkey (`dress`) | **good** | 0 | 1 | 6 |
| My day (`myday`) | **needs work** | 0 | 3 | 6 |
| Snack chef (`snack`) | **needs work** | 0 | 5 | 6 |
| Cook a soup (`cook`) | **good** | 0 | 2 | 8 |
| Candy beats (`candy`) | **needs work** | 1 | 3 | 5 |

### Top 5 issues across the world
1. **Candy: the errorless dead end is real (blocker, C1).** After errorless mode, only the candy that was next at that moment stays tappable, and the row is never refreshed. When the next note is on a different candy, she can't go on. She is sent Home at 45 s, or, if she keeps tapping, she is stuck forever, because every touch resets the idle ladder. The fix is one line.
2. **My day Level 3 shows every answer after 2.5 s (major, M1).** The "first time" demo plays on almost every Level 3 step because `shown` starts empty in each lesson. It carries the right item to the right place, so "What comes next?" is never really her choice.
3. **Snack: she watches more than she does, and nothing she makes stays (major, S1 + S2).**
   - On Level 1 a wash round is one tap, then 10 s of watching the friend wash itself.
   - Every finished plate is eaten at once, and the friend walks off screen.
   - "Look what you made!" then shows an empty kitchen.
4. **Cook: the scoop and stove steps don't say what to do (major, K1 + K2).**
   - "Time to scoop it up!" never says *hold*. The line that does ("Hold to scoop it up!") only comes after 6 s idle.
   - "Turn on the stove!" never names the knob, and the knob is the smallest tap target in the world (radius 0.45).
5. **Snack: the counting is silent (major, S3).** The goal is "counts each piece onto it", but the numbers 1, 2, 3 only float up as glyphs. Nobody says them. The clips "One!", "Two!", "Three!" and "Four!" already exist.

Next after these: myday L3 plays rain, a chime and a loud "You did it! A sticker!" over the sleeping Bunny (M2), and candy L2's long and short notes are never under her finger (C3).

### Are the new My day captions clear?
**Yes, with three exceptions.** "Bubbles in!" and the other shorthand lines are gone. Every Level 1–2 step caption now names the action, the thing, and where it goes:
- "Tap the tap for water!"
- "Rub the soap on Bunny's paws!"
- "Put the tissue in the bin!"
- "Pour the bubbles in the bath!" (the glowing bottle and the demo make "the bubbles" concrete)
- "Put Teddy on the pillow!"
- "Tap the lamp! Lights off!"

These still need changes:
- **"Rub the brush on Bunny's teeth!"** is unnatural. She knows "brush teeth". Rewrite: **"Brush Bunny's teeth!"** (M4)
- **"Wash your paws!"** (L2 R3 intro) says *your* (hers) about Bunny's paws, and the paws are clean, so there is nothing to wash. (M5)
- **"Messy fur!"** (L1 R6, L2 R6) names a mess she can't see; nothing on Bunny is messy. (M3)

"What comes next?" on Level 3 is a fair challenge line for the top level, but only once M1 stops the demo from giving the answer.

---

## 1. Dress Monkey (`dress`): good

The best-built game in the world. One garment per round, the outfit stays on all level, the actions are concrete and every prompt has a clip. What's left is level progression and the ending.

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| D1 | L2 all; L3 all | major (learning) | **Progression gap.** On L1 and L2 a drop *anywhere* on Monkey (or a tap) puts the garment on the right part by itself. L3 suddenly wants the named part with no glow and no tap. L2 teaches nothing about *where* that L1 didn't. | Give L2 a middle step. Set `partsGlow: true` on `PLANS[1]` in `dress-clothes.js` and add `where` lines like L3's. In `dress.js` `drop()`: `const judge = this.parts \|\| this.plan.partsGlow;` and judge the part with `partAt()` when `judge`. Keep the L2 body-part glow and bubble icon. On L2 a tap no longer puts it on: it glides back and plays the hand demo, as L3 does now. L1 is unchanged. |
| D2 | L1–L3 Ending | minor (satisfaction, pacing) | About 15 s with no action: the mirror dance is automatic, then `onFinale` adds a second 2.4 s spin dance. There is no `creationView` or `creationObjects`. | Delete the dance in `onFinale()`. In `mirrorDance()`, after the glass clears, give her 6 s: each tap on Monkey plays the next of up to 4 `MOVES` of the garments he wears, and the reflection copies it. Add `creationView()` framing Monkey and the mirror, and `creationObjects() { return [this.monkey]; }` with `onAdmirePoke = () => this.tickleMonkey()`. |
| D3 | L3 1 (dungarees) | minor (logic) | Dungarees have a bib on the tummy, but the line says legs. A drop on the bib can be judged "body" and get "Oops! On Monkey's legs!" for a sensible drop. | In `PLANS[2]` give dungarees `alsoOk: ['body']`. In `drop()`: `if (part !== this.slot && !(this.spec.alsoOk \|\| []).includes(part))`. |
| D4 | L1 3 | minor (caption) | "Sneakers" is the odd one out next to jumper, wellies and dungarees. The core word a 2-year-old needs is "shoes". | `say: 'Shoes! Put them on Monkey!'`, `done: 'Shoes on!'` |
| D5 | L3 every round | minor (learning) | Tapping the garment on L3 glides it back and plays the hand demo to the right part after 0.6 s, so a tap is a shortcut to the answer. | On L3, a tap only wiggles the garment and repeats the prompt. The hand demo stays on the 8 s / 12 s ladder and after a wrong drop. |
| D6 | L2 4, L2 5, Ending | minor (character) | Heart glasses: Monkey's "need" gesture uses an `angry` squint for 0.9 s. The party hat and the mirror reveal use the `scared` face as a gasp. To a 2-year-old, angry and scared read as upset. | Use `calm` for the squint and `joy` for the gasp. |
| D7 | every right drop | minor (sound, feel) | The garment snaps on with a puff, a sparkle sound and a kick (SATISFACTION 16.1). | Remove `puff()` and `msfx.puff()` from `drop()`. Stretch the 0.55 s fly-on into a 0.6 s pull-on (squash down for a hat, push through for a sleeve) with one soft cloth sound. |

Rewritten captions: "Shoes! Put them on Monkey!", "Shoes on!" (caption only). Only if D1 is done: "Oops! On Monkey's eyes!" for L2; the other L2 "Oops" lines reuse L3's.

---

## 2. My day (`myday`): needs work

The captions are now clear (see above). Levels 1 and 2 are well shown: a halo on the item and a slow demo for each new action. Each routine is a sensible chain of steps, and dirty to clean happens under her finger. The problems are Level 3's learning, the bedtime ending, and one routine with no visible goal.

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| M1 | L3 1.1–6.2 (every step) | major (learning) | `shown` is per lesson instance, so on L3 every action key is new. After 2.5 s idle, `update()` calls `demo()`, which carries the right item to the right place (`showHint`). About 16 of 18 L3 steps give the answer away, and "What comes next?" stops being a choice. `choicePoints()` (a scan that doesn't give the answer away) exists but is never called. | In `update()`, at Level 3 swap the first-time demo for the scan: `if (key && !this.shown.has(key) && this.idle >= (this.level === 2 ? 4 : 0.7)) { this.shown.add(key); if (this.level === 2) fx.ghostPath(this.choicePoints(), { mode: 'scan' }); else this.demo(); }`. The demo that gives the answer stays on the stuck path (`STUCK` 8 s, `reshown`) and on the engine's 12 s ladder. |
| M2 | L3 Ending | major (satisfaction, calm) | `quietEnding` is not set. Over a sleeping Bunny in the dark, the finale plays rain, a resolve chime and a spoken "You did it! A sticker!", and voices "Look what you made!" the first time. | In `myday.js`: `get quietEnding() { return this.sleeping; }`. Add `async showOff() { hushEffects(0.5, { cut: true }); if (this.sleeping) await this.glideCamera(<room pulled back 1.5 units>, <bed>, 2.5); }`. In `lesson.js` `admire()`: `this.say('Look what you made!', { voice: first && !this.quietEnding })`. |
| M3 | L1 R6 / 6.1–6.2, L2 R6 | major (logic, satisfaction) | The caption says "Messy fur!", but nothing on Bunny is messy. Brushing makes the ear spring and a sparkle, and nothing visibly changes and stays changed (rule 2). | Add a `tufts` mess in `myday-fx.js`: 3 ruffled tufts per ear in Bunny's fur colour. In `startRound`, `if (spec.r === 'hair') this.addMess('tufts')`. `fluffTick` flattens the tuft nearest the brush, one per third of the rub. The ears end smooth and stay smooth. If that's not done: change the intro to **"Brush time!"** so it doesn't promise a mess. |
| M4 | L1 2.2, L2 4.2 | minor (caption) | "Rub the brush on Bunny's teeth!" is adult phrasing for "brush teeth". | `say: "Brush Bunny's teeth!"` (the hint "Now the brush!" stays). |
| M5 | L2 R3 | minor (logic, caption) | The intro "Wash your paws!" says *your* (the child's), and Bunny's paws are clean, so washing changes nothing. | `PLANS[1][2] = { r: 'hands', mess: 'mud', intro: 'Muddy paws!' }` (the caption already exists and is caption only). |
| M6 | L1 1.3, L2 3.3 | minor (pacing) | Rinse plays its own 2 s demo of the same "tap the tap" gesture two steps after "wet", because the action key includes `act`. | `actionKey()` returns `` `${st.how}:${st.use}:${st.at \|\| ''}` `` (no `act`). |
| M7 | end of every hands/bath round | minor (satisfaction) | `afterSuccess` pops all but 4 bubbles straight away (SATISFACTION 17.3: bubbles belong to the child). | Delete the `popBubble` loop in `afterSuccess()`. The bubbles already float up and expire by themselves (`life`), and she can pop them meanwhile. |
| M8 | every round start | minor (Go!) | `goT0` starts at round start and again at each step. A walk or camera glide over 6 s shows Go! while Bunny is still walking, then shows it again. | In `startRound()` set `this.goPending = false` before `goTo()`. `startStep()` already re-arms it. |
| M9 | L1, L2 Ending | minor (satisfaction) | No `creationView` or `creationObjects`, so the photo is taken from the default camera and clean Bunny isn't framed. | `creationView()` frames Bunny where he stands (sink or mat), about 50% of the height. `creationObjects() { return [this.bunny]; }`, and a poke makes him giggle. |

Rewritten captions: "Brush Bunny's teeth!" (voiced instruction). "Muddy paws!" (L2 R3, caption only). "Brush time!" (only if the tufts are not built; caption only).

---

## 3. Snack chef (`snack`): needs work

The prompts are almost all clipped and mostly concrete ("Put 3 strawberries on the plate!", "Wash the fruit first!"). The structure works against her, though: on L1 she taps once and watches, her plates are eaten and carried off, and the counting is never spoken.

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| S1 | L1 1, 3, 5 (wash) | major (satisfaction, pacing) | One tap, then about 10 s of the friend washing by itself (`washAll`). There are also 5 s walk-ins. The wash round is mostly watching. | Make the L1 wash plan `['tap', 'rub']`: she taps the tap, the friend soaps itself (`doSoap`, 1.5 s, caption "Soap!"), then she rubs the paws (3 taps or a rub, the same code as L2). Then the rinse plays automatically. `washAll()` keeps only the soap and the rinse. |
| S2 | L1–L3 plate rounds, Ending | major (satisfaction, persistence) | When the plate is complete, `afterSuccess` → `eatAndGo` eats everything at once, floats "Yum!" and walks the friend off at the left. "Look what you made!" then shows an empty kitchen and plate. | As in SATISFACTION 18.1–3: on complete, `beat()`, then the friend leans in and eats two bites per food, leaving crumbs (no "Yum!"). Then the friend carries the plate to a small table at the right edge (inside the plate view) and sits there. The next friend walks in during the eating. `creationView()` frames the table with its 3 friends and plates; `creationObjects()` = those plates. |
| S3 | L1 2, 4, 6; L2 and L3 plate rounds | major (learning) | The count isn't spoken; only a number glyph floats. One-to-one counting needs the number word as each piece lands. | In `placeOnPlate()` after `sfx.note(n - 1)`: `this.say(['One!', 'Two!', 'Three!', 'Four!'][n - 1], { repeat: true, max: 0.8 })`. All four clips exist. Then "3 strawberries!" stays caption only. |
| S4 | L2 1.2, L3 1.2 (rub) | major (prompt, showing how) | "Rub rub rub!" doesn't name what to rub. During the rub step nothing marks the hands: only the tap, soap and towel breathe (`update()`, line ~965). | Prompt: `SAY.rub = 'Rub the hands!'`. Show "Rub rub rub!" as `voice:false` chatter on each rub. In `update()`, while `this.step === 'rub'`, add the friend's paws (a halo at `handsMid()`, radius 0.6) as the breathing target. |
| S5 | every round (walk-ins, eating) | major (pacing) | A level is 6 walk-ins of about 5 s, 3 eat-and-leaves of about 8 s, and on L1 3 auto-washes of 10 s. About 70 s of watching in a 2.5 min level. | S1 and S2 remove most of it. Also start the next friend's walk-in when eating begins (not after the leaver passes Pip). Cap any wait with no action at 3 s. |
| S6 | L2 1.2 / L3 1.2 redirect | minor (caption) | `EARLY.rub` = "Rub the soap first!", but at this step she has to rub the *hands*. | `EARLY.rub = 'Rub the hands first!'` |
| S7 | L3 1.4 (dry) | minor (caption) | "Dry with the towel!" and the redirect "Dry hands now!" don't say the action, which is a tap. She may try to drag the towel. | `SAY.dry = 'Tap the towel!'`, `EARLY.dry = 'Tap the towel!'` |
| S8 | L3 2, 4, 6 | minor (caption) | "One of each, please!" is abstract ("each" what?). The plate's section pictures are the real cue. | `plateText()` for 4 groups: **"Fill up the plate!"**. Halo the empty section's picture after each placement (see S10). |
| S9 | L3 redirect | minor (caption) | `HAVE.dairy = 'dairy'` gives "We have dairy! Now a fruit!": an adult word. | Drop the "We have …!" half. Redirect with the existing clip for what is missing: `this.redirect(this.promptText())` → "Now a fruit!" / "Now a veg!" / "Now bread!" / "Now milk or cheese! Look in the fridge!". The calm face and the food flying home already say "not that". |
| S10 | L2 2, L3 2 between pieces | minor (showing how) | After the first piece there is no cue for what's missing until 6 s idle. | After each placement, `addHalo()` the empty section(s) of the plate for 2 s. Still no voice. |
| S11 | L1 wash | minor (feedback) | On L1, tapping the soap, the hands or the towel does nothing at all. | Make the object bob (`nudge`-style hop, no sound). That keeps "every touch does something". |

Rewritten captions: "Rub the hands!", "Rub the hands first!", "Tap the towel!", "Fill up the plate!" (voiced instructions). "Rub rub rub!" becomes caption-only chatter during rubbing.

---

## 4. Cook a soup (`cook`): good

A real build-up object: the soup changes colour and level and stays. Every action is under the finger (chop, hold, carry, tip, stir), there is a first-time demo per action, and the levels progress clearly (any veg, then a colour word, then a picture card plus counting two). Two prompts don't name their action, and a few endings are flat.

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| K1 | L1 1.4, every scoop | major (prompt) | "Time to scoop it up!" doesn't say *hold*. "Hold to scoop it up!" only comes after 6 s idle, and the demo only plays the first time. A tap does nothing visible. | One line for both: `SAY.scoopNow = SAY.scoop = 'Hold the board!'`. While the finger is down and the pile is gathering, show "Scoop!" caption only. |
| K2 | L1 1.6 (stove) | major (prompt, target size) | "Turn on the stove!" doesn't name the knob, and the knob is a 0.45 radius target, the only precise tap in the game. | `SAY.knob = 'Tap the knob! Stove on!'` (the same shape as myday's "Tap the lamp! Lights off!"). Set `knobTap` radius 0.9 with the offset over the knob, and make the knob breathe like snack's stations while `phase === 'knob'`. |
| K3 | every chop → scoop | minor (pacing) | Chopping only ends after 5 s with no chop, a dead wait she can't end herself. | `IDLE_SCOOP = 3`. Also end after 2 s once every piece has been cut 3 or more times. |
| K4 | L1 1.1, L1 2 | minor (caption) | "Pick a veggie!" is ambiguous (pick = choose?) and doesn't say where. "Now add another veggie!" is vague when only one veg is left. | 1.1: **"Put a veggie on the board!"**. Round 2: `` `Now the ${V.name}!` `` → **"Now the carrot!"** / **"Now the tomato!"** |
| K5 | L2 1 | minor (caption) | "Now the orange one!" opens the level ("Now" after nothing). The prompt and the redirect are two lines that mean the same. | Use **"Find the orange one!"** (green, yellow) as both the prompt and the redirect. Drop the three "Now the … one!" lines. |
| K6 | L3 3 (stir) | minor (stuck path) | `makeErrorless()` has no `stir` case, and there's no tap fallback. (Scribbles do count: `stirAdd(Math.abs(da))` adds any angle travel round the pot centre.) | In `makeErrorless()`: `else if (this.phase === 'stir') this.stirErrorless = true;`. In the pointer-down handler, `if (this.phase === 'stir' && this.stirErrorless) this.stirAuto();`. |
| K7 | L3 4 (serve) | minor (caption, voice) | "Fill a bowl for Bear!" doesn't say the action. Bear's "Mmm! Yummy soup!" (voiced) is followed by the success caption "Yummy soup!", the same line twice. | Prompt: **"Take the bowl to the pot!"**. Bear's line becomes `voice:false` (`sfx.mmm` already says it). Call `success(..., '')` with no caption for the serve round. |
| K8 | 1.7 (cook) | minor (voice) | "It's cooking!" is narration the steam already shows, but it's spoken the first time (FEEL-BRIEF rule 4). | `this.say("It's cooking!", { voice: false, max: 1.4 })`. |
| K9 | every step after pick | minor (Go!) | Go! shows once per round. The 5 later steps rely on glow and demo only. | Optional: re-arm `goPending` and `goT0` at each step once the camera glide ends, as myday does. |
| K10 | L3 4, Ending | minor (satisfaction) | The taste is a heart, a chomp and a hop. The finale has no `creationView`, and the pot can't be poked. | In `taste`: a blow, a sip, eyes close, shoulders drop; remove the heart and the hop. `creationView()` frames the pot and Bear (and the bowl on L3). `creationObjects() = [pot, bowl]`, and a poke makes a slosh. |

Rewritten captions: "Put a veggie on the board!", "Now the carrot!", "Now the tomato!", "Hold the board!", "Tap the knob! Stove on!", "Take the bowl to the pot!" (voiced instructions). "Scoop!" (caption only). "It's cooking!" and "Mmm! Yummy soup!" become caption only.

---

## 5. Candy beats (`candy`): needs work

Lovely idea and well paced at L1: a clear listen, then copy, a sweet jar that fills and stays, and the colour tiles as an answer key she can match. It has one real dead end, a Go! badge that lies, and Levels 2–3 ask for things her finger can't express or simply make her wait.

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| C1 | every copy beat after errorless (2 wrong taps in a round, or 20 s idle) | **blocker** | **Confirmed in code.** `makeErrorless()` disables every candy except the one that is `want()` at that moment, and nothing refreshes it. In `hit()`, a right tap does `this.i++` and leaves the old flags. Once the next note is on another candy:<br>- That candy can't be tapped (`tap.enabled = false`).<br>- Tapping the one live candy counts as wrong.<br>- A further `errorless()` does nothing, because `errorlessOn` is already true.<br>- The ladder replays (`prompt()`) keep the stale `off` flags.<br>- The 8 s hand demo points at the disabled candy.<br>Because `input.onAny` resets `idle` and `ladder` on every touch (`lesson.js` line 173), a child who keeps tapping never reaches the 45 s timeout: a permanent lock. A child who stops is sent Home. Only `phraseDone` clears it. | In `hit()`, right branch: `this.i++; if (this.i >= this.ph.length) this.phraseDone(i); else if (this.errorlessOn) this.makeErrorless();`. Also reset `this.stuckShown = false` there, so the 8 s hand can show the new next candy. |
| C2 | every 1a / first phrase of each round | major (Go!) | Go! is timed from round start, and the engine shows it at 6 s regardless. On the first phrase of a round (candy pop-in + "Listen!" + Pip playing is longer than 6 s) Go! appears while Pip is still playing and the candies are disabled. | In `startPhrase()`: `this.goPending = false;`. In `yourTurn()`: `this.goPending = true; this.goT0 = performance.now();`. Go! then shows each phrase, right after "Your turn!". |
| C3 | L2 1–6 | major (learning, satisfaction) | Long and short notes are never under her finger: one tap per tile whatever its length. The rhythm rounds ("Ta, ta, ti-ti, ta" = C C C C C) come down to "tap red 5 times". | Long tiles (`d >= 1.5`) become press-and-hold. Add `press` and `onRelease` to the candy `addTap` (supported by `input.addTap`). While held, the candy keeps singing and its mouth stays open, and the tile fills from left to right. Release after 0.35 s or more counts. An earlier release still counts (never a fail): the candy finishes the note itself and the tile fills. First long tile of the game: a hand demo that holds. |
| C4 | L3 1c, 2, 3–5 (whole song) | major (pacing) | Each L3 round ends with 10–20 s of whole-song playback with no action, five times, after two 6–8 note lines. | Let her play along: during `wholeSong()`, enable the candies. The candy whose note is next glows half a beat early. Any tap sings softly in key and adds a sparkle on that candy. No wrong. |
| C5 | every wrong tap | minor (voice) | After a wrong tap the line is "Listen again!", but only one note follows (the right candy plus a halo), not the tune. | On a wrong tap say **"This one!"** (the clip exists) as the right candy sings. Keep "Listen again!" for the idle replay of the whole phrase. |
| C6 | 1b, every copy | minor (showing how) | The 8 s stuck hand shows once per phrase (`stuckShown`). After it she gets no hand for the rest of the phrase. | Covered by C1's `stuckShown = false` on each right tap. |
| C7 | Ending (all levels) | minor (satisfaction) | During "Look what you made!" the candies can't be played and the jar isn't framed or pokeable. | `creationObjects() { return [...this.rowCandies(), this.jar]; }`. `onAdmirePoke(obj) { if (obj === this.jar) clink(); else this.sing(obj.userData.note); }`. |
| C8 | L2 rhythm rounds | minor (data) | Both "Ta, ta, ti-ti, ta" variants can be drawn in one game, so the same name shows twice. | In `makePlan()`, keep only one of the two variants with the same name, or rename the second **"Ta, ta, ti-ti, ta, high"**. |
| C9 | intro of L1, L2 | minor (pacing) | At L1 round 1 and L3 round 3 the set-up pop-in plus "Listen!" plus the phrase leaves 6–8 s before her first tap. That's acceptable; just don't add to it. | No change; keep C2 so Go! is honest. |

Rewritten captions: "This one!" (already has a clip). No other new lines.

Not a design issue, but worth knowing: while "Listen!" and "Listen again!" fall back to browser text-to-speech, `voiceIdle()` doesn't cover it, so the tune can start over the robotic voice. This goes away once the clips exist.

---

## Storyboard corrections (where a storyboard is wrong or understates)
- **candy.md**, "Probable dead end": confirmed, and worse than written. Any touch resets the idle ladder (`input.onAny`), so a child who keeps tapping never reaches the 45 s Home timeout. The 8 s hand points at the disabled candy, and the 20 s errorless step does nothing.
- **myday.md**: "L3's first demo gives the answer" is true for almost every L3 step, not just the first, because `shown` is empty at the start of L3. The storyboard also doesn't note that "Messy fur!" has no visible mess.
- **cook.md**: "Stir needs two full circles" is too strict. `stirAdd(Math.abs(da))` counts any angle travel round the pot centre, so a back-and-forth scribble across the middle also stirs. "No tap fallback" is correct.
- **snack.md**: the floating count is never spoken (the storyboard implies counting). During the rub step the hands don't breathe or glow (only the tap, soap and towel do). The "We have dairy! Now milk or cheese!" combination can't happen.
- **dress.md**: accurate.

---

## Voice clips needed (not counted as design issues)

These are lines spoken as instructions, prompts, redirects or intros that currently have **no clip** in `app/assets/voice/index.json`, so they fall back to the browser's robotic text-to-speech. I checked them with the engine's own key normalisation (`voiceKey`).

**Not yet in `tools/voice/new-lines.txt` (add them):**
- dress (L3 redirects): "Oops! On Monkey's tummy!", "Oops! On Monkey's feet!", "Oops! Round Monkey's neck!", "Oops! On Monkey's head!", "Oops! On Monkey's hands!"

**Already listed in `new-lines.txt` but still unrecorded:**
- **myday (32):**
  - Intro and L3 ask: "Wash Bunny's paws! What comes first?"
  - Hands: "Tap the tap for water!", "Rub the soap on Bunny's paws!", "Tap the tap to rinse!", "The tap again!", "Rub the towel on Bunny's paws!"
  - Teeth: "Put the toothpaste on the brush!", "The toothpaste first!", "Rub the brush on Bunny's teeth!" (replace with "Brush Bunny's teeth!", M4), "Now the brush!", "Give Bunny the cup of water!"
  - Sneeze: "Put the tissue on Bunny's nose!", "The tissue first!", "Put the tissue in the bin!", "The tissue in the bin!"
  - Bath: "Tap the tap to fill the bath!", "The bath tap first!", "Pour the bubbles in the bath!", "Now the bubbles!", "Rub the sponge on Bunny's head!", "Rub the big towel on Bunny!", "Now the big towel!"
  - Hair: "Brush Bunny's ear!", "Brush the other ear!"
  - Bedroom: "Tap the curtains to open them!", "Put the duvet on the bed!", "Put Teddy on the pillow!", "Tap the curtains to close them!", "The curtains first!", "Give Teddy to Bunny!", "Put the duvet on Bunny!", "Tap the lamp! Lights off!", "Now the lamp!"
- **cook (23):**
  - Intro: "Let's cook a soup!"
  - Pick: "Pick a veggie!", "Now add another veggie!", "Now the orange one!", "Now the green one!", "Now the yellow one!", "Find the orange one!", "Find the green one!", "Find the yellow one!"
  - Steps: "Pick up the knife!", "Tap to chop!", "Time to scoop it up!", "Hold to scoop it up!", "Take it to the pot!", "Turn on the stove!", "It's cooking!", "Stir the soup!", "Fill a bowl for Bear!"
  - Card: "Look at the card!", "Look at the card! A carrot!", "Now two tomatoes!", "One more tomato!", "Mmm! Yummy soup!"
- **candy (5):** "Let's make candy music!", "Listen!", "Listen again!", "Now the whole song!", "A new candy!"
- **engine (all games):** "Look what you made!"
- **snack:** none missing (every reachable prompt and redirect has a clip).

**New lines this audit introduces (add to `new-lines.txt` when the fixes go in):**
- "Brush Bunny's teeth!"
- "Rub the hands!"
- "Rub the hands first!"
- "Tap the towel!"
- "Fill up the plate!"
- "Put a veggie on the board!"
- "Now the carrot!"
- "Now the tomato!"
- "Hold the board!"
- "Tap the knob! Stove on!"
- "Take the bowl to the pot!"
- "Shoes! Put them on Monkey!" (D4)
- "Oops! On Monkey's eyes!" (only with D1)

**Lines these fixes retire or make caption-only (no clip needed):**
- Replaced:
  - "Rub the brush on Bunny's teeth!"
  - "Pick a veggie!"
  - "Now add another veggie!"
  - "Now the orange one!", "Now the green one!", "Now the yellow one!"
  - "Time to scoop it up!"
  - "Hold to scoop it up!"
  - "Turn on the stove!"
  - "Fill a bowl for Bear!"
- Kept, but caption-only:
  - "It's cooking!"
  - "Mmm! Yummy soup!"
  - "Rub rub rub!" (snack chatter; it has a clip anyway)
