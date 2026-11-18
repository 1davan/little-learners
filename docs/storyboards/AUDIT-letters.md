# Audit: Letter friends (`letters`)

I checked `letters.md` beat by beat against:
- the seven audit checks in `README.md`;
- `FEEL-BRIEF.md`, including its new **rule 0, no waiting**;
- `SATISFACTION.md` and `QUALITY-BRIEF.md`;
- the code: `app/src/lessons/letters.js`, `letters-data.js`, `letters-stage.js`, `letters-sound.js`, and in the engine `lesson.js` (after the latest change: taps open about 0.3 s into a round, a touch ends the demo, and `success()` caps the payoff at 3 s plus 0.5 s still), `input.js` and `speech.js`;
- the queued lines in `tools/voice/new-lines.txt`;
- the design in `docs/design/letters.md`.

**The parent, after playing it:** "the letter game sucks. Takes forever. Don't even know what to do. The hints are not obvious. 'Tap A' — and what does that do..." This audit starts from that.

Beat numbers refer to the storyboard: "L1 3" is Level 1, row 3; "(cont.)" is the second row of that round.

Missing voice clips are **not** counted as design issues, because they are waiting to be generated. The *instructions* queued for generating them are checked (LF2).

Severity:
- **blocker:** she can get stuck, or the game can't go on. This includes breaking FEEL **rule 0**, which the brief makes a hard rule, and a prompt she cannot act on.
- **major:** it hurts understanding, learning or satisfaction in a way she will notice.
- **minor:** polish.

## Verdict

| Game | Verdict | Blocker | Major | Minor |
|---|---|---|---|---|
| Letter friends (`letters`) | **poor** (the core loop is too long and too wordy for age 2; rebuild it as below) | 2 | 11 | 11 |

**What already works, and should survive any rebuild:**
- The build-up object. The train fills carriage by carriage, nothing she packs ever leaves, and the finale shows the whole train with everything pokeable. The mute test and the end-frame test both pass.
- Wrong answers are gentle and informative. In L3 the wrong thing says its own sound and word ("b, b, b... ball!"). There is no buzzer.
- The art direction: chunky letter friends with faces, a toy train, a trunk that things tumble out of.
- Errorless after two misses.

**Why the parent is right:**
- **It takes forever.** I measured the code: at most round starts she waits **5–13 s** before she can touch anything, and **7–9 s** when a level opens. Inside rounds there are 3–8 s blocks of watching: the friend walks in, the trunk reveal, the recap, boarding, train rolls, Pip's pennant walk, and the lines read out one after another. Rule 0 allows 1.5 s at a round start and 2 s anywhere. The game breaks it about **50 times** in one pass of the three levels (B1).
- **She doesn't know what to do.** Most prompts name an action on a word she doesn't know ("trunk", "lid", "A") or no object at all ("Tap them!", "All aboard!", "Knock, knock, knock!"). None says what will happen. "Tap A!" asks her to tap a letter she can't name yet, only so that it makes a sound before a second, abstract question ("Who starts like this?"). That is two steps of grown-up logic for one answer (B2).
- **The hints are not obvious.** Every stuck re-prompt is caption-only (`prompt()` passes `voice: false`), so a non-reader gets silence. The 6 s nudge is a hop of 0.07–0.14 units or a 7° lid twitch. The hand demo plays once per game, and with a 1.4 s input lock that the new engine's "a touch ends the demo" doesn't reach (LF-H).
- **It is too complicated.**
  - Per letter, L1 asks for 7–10 actions in 4 different gestures, in about 45 s.
  - L3 asks a 2-year-old to do phonological matching through a gate she can't make sense of.
  - The game also mixes letter **names** and **sounds** in a way that teaches the wrong link (LF1).

### Top 8 issues

1. **Rule 0 is broken almost everywhere (B1, blocker).**
   - **Level openings:** L1 about 7 s (a 4.3 s walk-in, about 2 s of it off screen, then a rock and the name). L2 about 8.6 s (a 7.5 s roll-in). L3 about 12 s (a 7 s roll-in plus the trunk).
   - **Round starts:** L1 Meet 6.3 s; L2 round 3 2.9 s; L3 rounds 2–8 5–13 s.
   - **Inside rounds:** the trunk reveal is 5 s; the recap 7 s; boarding plus the roll 6–8 s; each L2 thing 5 s from trunk tap to drag; the L3 "Tap A!" chain 5.7 s; the pennant walk 6–10 s.
   - The fix is the **simpler core** below: everything already in place, things live the moment they land, lines never block input. That gives about 0.5 s to the first touch and no wait over 1.5 s.
2. **Prompts don't say what to do or what happens, and "Tap A!" is meaningless to her (B2, blocker).** Every prompt is rewritten as action + object + result, with the result visible on a glowing real object and a hand demo on that object in each level's first round. "Tap A!" and "Who starts like this?" are removed: the friend speaks by itself, then asks "Put mine on the train!"
3. **Letter names are put in front of words, so the "alliteration" teaches the wrong first sound (LF1, major).** "Ay! Apple!", and in later sets "See! Cat!", "Aitch! Hat!", "Jee! Goat!". This hits 13 of 26 letters. The name says who the friend is; the **sound** links it to its things.
4. **The hints are invisible and silent (LF-H, major).**
   - Re-prompts are captions only. The nudges are tiny. The demo plays once per game and locks input for 1.4 s.
   - The lesson's own 8 s demo timer ignores her touches, so it fires while she is busy.
   - The fix is a voiced re-prompt at 4 s, the target glowing from the start, a demo on the first round of every level, and a touch that ends the demo.
5. **The loop is too long and has too many kinds of step for age 2 (LF-S, major).**
   - Per letter: watch a walk-in, open the trunk one of four ways, tap three things, watch a recap, drag three things, maybe carry the friend, watch it board and the train roll.
   - **Proposal:** one round per letter, with **one tap plus three drags** in L1. L2 and L3 have 6 rounds each with one action per round. Each level takes about 1–1.5 min, not 3–4 min.
6. **The queued voice instructions will produce letter names, not sounds (LF2, major).** `C, c, c! => c, c, c` will be read "see, see, see". This affects the 16 stop and vowel sounds and their sound-word lines.
7. **L3 asks before it tells (LF3, LF4, major).**
   - Things land without names, so she is asked to match "a, a, a!" to objects nobody has named.
   - In the match rounds, the clue comes only after she picks the thing up.
8. **L2 gives her nothing to sort by, and the first sort is a trap (LF6, major).**
   - Placements and hints say letter names. The clue things in the carriages are silent.
   - Banana comes out next to **apple** in A and ball in B, so the visible category points her to the wrong carriage.

---

## 1. Rule 0: every wait over 2 s (or over 1.5 s at a round start)

These are measured from the code. `busy` is true for the whole wait, so the new engine's `canGo()` keeps every tap closed; even pokes are silent. Set 1 (A, B, M, S).

| Where | What she waits for | Time with nothing to touch | Fix (in the simpler core, section 3, unless marked "path B") |
|---|---|---|---|
| L1 opening and Meet rounds 3, 5, 7 | The friend walks in from x 9 (`WALK` 1.8 u/s, about 2 s off screen), an awaited rock, then "A!" | **6.3 s** (opening about 7 s) | No walk-ins. All four friends ride on their decks from the start (as in L2 and L3), and the carriage is at the station when the round begins. The friend rocks and says its name *while* the box already glows (not awaited). |
| L1 Meet: tap-open | Beat 0.45, lid 0.6, three tumbles 0.9 s apart (rise 0.4, toss up to 1.1, ease 0.45), zoom back 0.6 | **≈5.4 s** | Things leave 0.25 s apart, and each becomes live (draggable) the moment it lands (`landed()` enables its drag). The first is touchable about 1.2 s after her tap. |
| L1 Meet: knock | Each knock is busy for 2.1 s; taps in between are dropped | 2.1 s × 3 | Knock round removed (path B: LF11). |
| L1 Meet: lift | The three things come out in the last 17% of the lift, then the tumbles are awaited | ≈2.5 s | Lift round removed (path B: LF8). |
| L1 Meet: peek | A 0.35 + 0.6 hop, a 0.4 wait, a 0.6 rise before the next peek is tappable | ≈2 s × 2 | Peek round removed (path B: LF14). |
| L1 Meet: recap | `voiceIdle(0.6)`, then the friend's name and three words, each awaited | **≈7 s** | No recap. Each thing is named as she picks it up, and the friend says its sound-word as it lands in the carriage. That spreads the same alliteration over her own actions. |
| L1 Aboard: glide | `setView('one', 0.85)` awaited | 0.9 s | Not needed: one view per letter (`one`, framing the box, the rug and the carriage). |
| L1 Aboard: boarding and roll | After the last drag: a 1.0 wait, 0.6, `board()` 2.9, flap 0.5, beat 0.45, roll 1.76, still 0.5 (carried friends: about 6.1 s) | **≈7.7 s** | The friend is already aboard. After the last thing: the flap shuts (0.4 s), and the train rolls one carriage (1.76 s) **during** the success beat, with the next box glowing. The next round opens with the carriage already arriving: input is open at 0.3 s and the box is tappable at once. |
| L2 opening | Roll-in from x 11.5 at 1.9 u/s | **7.5 s** (+0.3) | The train is at the station when the level opens (no roll-in). The two clue things already sit in their carriages. |
| L2 sort: trunk to drag | Open 1.05, tumble about 1.95, zoom back 0.6, name 1.4 (round 5: +0.9 and +1.4) | **≈5 s** (round 5: 7.3 s) | No trunk step in L2. The round's thing is already on the rug: it hopped out of the box during the last success beat. It says its name as the round opens, without blocking, and it is draggable at 0.3 s. |
| L2 round 3, round 11 (path B: also L3 round 11) | Train rolls two carriages | 2.9 s | The pair changes during the previous success beat (the roll is the payoff, capped at 3 s by the engine), and the next thing is already out. |
| L2 after a right drop | Arc 0.55, then "B!" and "Banana!" awaited (2.8 s) | **≈3.4 s** | One sound-word ("b, b, b... banana!") said *as* it lands, without blocking; `win()` straight away. |
| L2 find rounds | Name 1.4, then Pip's pennant walk (6.3 s in round 6, **about 10 s** in round 11, cut at 3 s by the new `success()` cap, so Pip is still walking into the next round or the finale) | **≈5 s** and a mess | The found friend hoists its own pennant (about 1 s, LF9 d). Keep one find round per level, at the end. |
| L3 opening | Roll-in 7.0 s, then the trunk and two tumbles | **≈12 s** | The train is in place, and the round's two things are already on the rug (laid out while the level opened). |
| L3 rounds 2–8: arrival | Roll 1.8 (round 5: 4.1), trunk, 1–2 tumbles, zoom | **≈5.4 s** (round 5: about 9 s) | The next carriage rolls in and the next things hop onto the rug **during** the success beat, so the round opens ready. |
| L3 rounds 1–4: "Tap A!" chain | After her tap: sound 1.4, 0.5, "Who starts like this?" 2.4, sound again 1.4 | **≈5.7 s** | No "Tap A!". As the round opens the friend says its sound and "Put mine on the train!" while the things are already draggable. Nothing waits for the voice. |
| L3 rounds 5–8 | Friend sound, question, sound, all awaited | ≈5.2 s | As above. |
| L3 wrong choice | `input.lock(900)`, then the thing's sound-word and the friend's sound, awaited (≈3.5 s before that thing is live again) | ≈3.5 s for that thing | Not awaited, and no lock: the wrong thing wobbles and speaks; from the first miss only the right thing stays draggable and glows. |
| L3 match rounds 9–12 (path B) | Trunk tap, tumble, zoom, sound-word | ≈6 s | Match rounds removed from L3. |
| L1 game open | `meta.intro` plus round 0 at 0.75 s, then the walk-in | ≈7 s | With the core: about 1.2 s (intro caption, box glowing at 0.75 s). |

**Acceptance:** log round start to the first touchable target (`canGo()` true *and* a target enabled) on a full play of each level, as rule 0 asks. Every value should be at most 1.5 s. Log every interval over 2 s in which no target is enabled; there should be none, except the finale's photo flash.

## 2. Every prompt: action + object + result, in toddler terms

The test (the parent's point): does the line say **what to do, to what, and what will happen**, using words a 2-year-old knows, with the thing she must touch visibly glowing, and a hand demo on that real object the first time in each level? "Tap A" fails all three: she doesn't know which thing is "A", and nothing tells her what tapping does.

| Current line (where) | Action? | Object she knows? | Result? | Verdict | New line (and what the scene does) |
|---|---|---|---|---|---|
| "Tap the trunk!" (L1 1; L2 every sort; L3 9, 10) | yes | **no** ("trunk" is not a toddler word; in the UK it is the elephant's nose) | **no** | fail | **"Open the box!"** The verb is the result. The box's knob is big, glows and bobs from the round start. The hand taps the knob in the first round of each level. Called "box" everywhere. |
| "Knock, knock, knock!" (L1 3) | half | **no** | no | fail | Removed (core). Path B: "Knock on the box!" |
| "Lift the lid!" (L1 5) | yes | half | no | fail | Removed (core). Path B: "Open the box!" with the glowing knob. |
| "Peekaboo! Who is it?" (L1 7) | **no** | no | no | fail | Removed (core). Path B: "Peekaboo! Tap it!" |
| "Tap them!" (L1 Meet) | yes | **no** ("them") | **no** | fail | Removed. A thing says its name when she picks it up, so naming happens inside the drag. |
| "All aboard!" (L1 Aboard) | **no** | **no** | half | fail | **"Put them on the train!"** The things bob in turn; the hand drags the first to the carriage in round 1 of each level. "All aboard!" is kept for the finale only. |
| "M goes too!" (L1 6, 8) | **no** | half | half | fail | Removed: friends ride aboard from the start. Path B: "Take M to the train!" |
| "Put it on the train!" (L2) | yes | yes (the one bobbing thing) | yes | **pass** | Keep. Two things: "Put them on the train!" |
| "Where is S?" (L2 6, 11) | implied | it is the test | no | weak | Keep **one**, at the end of L2, as the recognition test. Voice the re-prompt; the hand scans over the friends; the flag going up is the result. |
| "Tap A!" (L3 1–4) | yes | **no** (she can't yet tell which friend is A; the screen shows 2–3) | **no** (it only makes a sound so that a question can follow) | **fail** (the parent's quote) | **Removed.** The friend at the station speaks by itself as the round opens: "mmm!" |
| "Who starts like this?" (L3 1–8) | **no** | **no** | **no** | fail | **"Put mine on the train!"**, said by the friend right after its sound. That is action (put), object (mine: the friend owns the carriage, and "mine" is a 2-year-old's word) and result (on the train). The two things bob. |
| "Which letter?" (L3 9–12) | **no** | **no** | **no** | fail | Match rounds removed (core). Path B: "Put it on the train!", after the sound-word is heard (LF4). |
| "Try the other one!" (L2 wrong) | yes | yes with 2 carriages | implied | pass with 2; **fail with 3–4** | 2 carriages: keep. 3–4: the wrong friend shakes its head and says **"Not me!"** (LF13). |
| Stuck re-prompts (all) | — | — | — | **fail** (caption only: `prompt()` passes `voice: false`; she can't read) | The first stuck re-prompt of a round is **voiced** (LF-H). |
| "All aboard the letter train!" (intro) | narration | — | — | ok (caption) | Keep, `max: 1.2` so it never holds the first round. |

## 3. Proposal: a much simpler, faster core

**What a round is.** Something is already in place, and one thing glows. Her finger does it, the friend reacts, and the next thing is already arriving. Same world, same models, same train finale.

**Shared rules (all levels):**
- **Nothing walks or rolls in from far away.** All four friends ride on their decks from the level start. The train is at the station when the level opens.
- **The next round is laid out during this round's success beat.** The roll of one carriage (1.76 s) is the payoff, inside the engine's 3 s cap. The next things hop out of the box during it.
- **Things are live the moment they land.** `landed()` turns on the drag. No `busy` while tumbling, speaking or rolling.
- **Lines never hold input.** No `await this.say(...)` before enabling targets. Speech plays over play.
- **The target glows and bobs from the round start**, not after 12 s. The hand demo runs on the real object in the **first round of each level** and when stuck. A touch ends it, with no `input.lock`.
- **Names for who it is, sounds for what it has** (LF1).

**L1 "Meet the letters": 4 rounds (one per letter), about 15–20 s each, about 1.2 min in all.**

| Step | She does | The scene | Voice |
|---|---|---|---|
| 0 s | — | Carriage A at the station, **A on its deck**; A rocks. The box knob glows and bobs. Round 1 only: the hand taps the knob. | A: "A!" (its name, not awaited) · "Open the box!" |
| ≈0.5 s | **Taps the box** | Beat 0.3 s, latch, lid up. Apple, ant and ambulance pop out 0.25 s apart and land on the rug; each is draggable on landing. | — |
| ≈1.5 s | **Drags each thing to the carriage** (any order; tapping a thing just names it) | Pick-up: it says its name ("Apple!"). The flap lowers as it nears; it lands on a seat (clonk and a rising note); A smiles. | On landing A says "a, a, a... apple!" (one clip, `repeat`, not awaited). Round 1 only: the hand drags the first thing. "Put them on the train!" after the box opens. |
| last drop | — | Flap shuts. The train chuffs one carriage on (the payoff). Carriage B arrives with B on its deck, and the box closes. | — |

- **Removed:** the walk-in; the knock, lift and peek variants (variety now comes from the things themselves: animals hop out and walk, props tumble); "Tap them!" and the recap; carrying friends 3 and 4; boarding.
- **What she does per letter:** 1 tap and 3 drags, instead of 7–10 actions in 4 gestures.
- If the parent misses the trunk tricks, bring back **one** per level later as a bonus: "Knock on the box!" in round 3, with the knock queue (LF11).

**L2 "Which letter?": 6 rounds, about 8–10 s each, about 1 min.**
- Two carriages (A and B) at the station from the start, each with one clue thing in it.
- Opening: the clue things hop in turn as their friend says the sound-word ("a, a, a... ambulance!", "b, b, b... ball!"; LF6). Input is open during this.
- Rounds 1–4 (pairs A/B, then M/S; the train rolls two carriages during round 2's success beat):
  - The round's thing is already on the rug, says its name and bobs: "Put it on the train!" Drag to a carriage.
  - **Right:** the friend says the sound-word as it lands.
  - **Wrong:** the friend shakes its head ("Try the other one!"); from the first miss only the right flap opens.
- Round 5: one thing, three carriages (B, M, S) after a one-carriage roll. The wrong friend says "Not me!"
- Round 6: "Where is S?" Tap the friend; it hoists its own flag. Finale.
- **Removed:** the trunk tap per round, the two-at-once round, the second find round, and Pip's walks.

**L3 "First sounds": 6 rounds, about 8–10 s each, about 1 min.**
- One carriage at the station. Its two things (target and one distractor) are already on the rug and **were named as they landed** (LF3).
- Round opens: the friend says its sound ("mmm!") and "Put mine on the train!" Both things bob; nothing blocks.
- **Right:** "mmm... moon!" as it lands; the carriage rolls on during the success beat, and the next two things hop out.
- **Wrong:** it wobbles and says its own sound-word ("sss... sock!"); the friend says "mmm!" again; from the first miss only the right one is draggable and it glows.
- Rounds 1–4 have A, B, M, S with two choices; rounds 5–6 have A and M with three choices.
- **Removed:** "Tap A!", "Who starts like this?", the sound-to-letter match rounds (they need a step of reasoning a 2-year-old doesn't have; keep them for a later "age 3" level if wanted), and the 4.1 s roll back.

**Code plan for the core** (`letters.js`; data and stage unchanged except the lines):
- `planL1` returns `[{ k: 'letter', L, i }]` × 4.
- `planL2` returns `[sort A/B ×2, sort M/S ×2, sort B/M/S, find S]`, using the LF6 anchors.
- `planL3` returns `[sound A, B, M, S (2 choices), sound A, M (3 choices)]`.
- `build()`, all levels: `seatFriend` for every friend, and the train at the round-0 station x with no roll-in.
- `startRound` lays out nothing that blocks:
  - For `letter`: `enableTrunkTap(true)`, the knob glow (`addHalo(trunk.userData.knobO, 0.4)` plus `lidBob` every 1.4 s), then `instruct(SAY.open)`.
  - For `sort` and `sound`: `ensureOnRug(defs, { zoom: false, live: true })` was already called in the previous round's `afterSuccess`, so the round only calls `instruct`.
- `afterSuccess()` (engine hook; runs inside the success beat): roll to the next station x and pre-tumble the next round's things (not awaited beyond the engine's 3 s payoff cap). The next round enables whatever has landed, and `landed()` enables drags as things arrive.
- Delete:
  - `startMeet`, `afterOut`, `heardThing`, `recap`, `knock`, `enableLift`, `liftTo`, `liftRelease`, `peekNext`, `peekOut`;
  - `afterPacked`'s board branch, `makeDragFriend`, `dropFriend`, `startMatch`, `matchOut`, `heardSound`;
  - the `tapL` and `match` phases, and the `await`s on speech before enabling targets.
- `afterPlace`, L1 to L3: `speakFriend(f, linkWord(L, def))` without `await`; `win()` when the round's things are all seated.
- `win(pos)`: `this.payoffP = this.rollTo(next)` when the station changes.

**Acceptance for the core:**
- Rule 0 log as in section 1.
- One level takes 60–90 s.
- Every round's first action is possible at ≤ 0.5 s.
- A tester who has never seen the game, with sound on and captions hidden, knows what to touch in every round within 2 s.

---

## 4. All issues

**Path** says whether an issue still applies if the core in section 3 is built ("both") or only if the current loop is kept ("B").

| # | Beat | Severity | Path | Issue | Exact fix |
|---|---|---|---|---|---|
| B1 | see section 1 | **blocker** (rule 0, pacing) | both | **Waits everywhere:** about 50 waits over 2 s in one pass, level openings of 7–12 s, round starts of 5–13 s. Under the new engine `canGo()` requires `!this.busy`, and this game holds `busy` through every walk, roll, tumble and line, so even pokes are silent. | Build the core (section 3). If path B: apply every row of section 1 marked "path B", plus LF9. Never `await` speech or tumbles before enabling targets; move rolls and tumbles into `afterSuccess()`. |
| B2 | see section 2 | **blocker** (prompt, logic) | both | **She can't tell what to do or what happens.** "Tap A!", "Tap the trunk!", "Tap them!", "All aboard!", "Knock, knock, knock!", "Who starts like this?" and "Which letter?" fail the action + object + result test. The L3 "Tap A!" gate gives a sound she didn't ask for, followed by an abstract question. | Use the section 2 lines. Delete the `tapL` phase. `startSound` makes the friend say `SOUND[L]` and then `SAY.mine = 'Put mine on the train!'`, both through `speakFriend` without `await`, and enables the choices at once. `SAY.open = 'Open the box!'`, `SAY.packThem = 'Put them on the train!'`, `SAY.notMe = 'Not me!'`. |
| LF-H | all stuck states | **major** (showing how) | both | **The hints are not obvious.** (a) The game's `prompt()` passes `voice: false`, so every stuck re-prompt is caption-only and silent to a non-reader. (b) The 6 s nudge is a 0.07–0.14 hop or a 0.12 rad lid twitch; a glow comes only at 12 s. (c) `teach()` demos each action **once per game** (a `taught` set per lesson instance). (d) The game's `demo()` still calls `input.lock(1400)`, so the new engine's "a touch ends the demo" doesn't apply here. (e) The lesson's own 8 s timer (`this.stuck`) is not reset by taps, knocks, lifts or peeks, so the demo fires while she is busy and locks her next tap. | (a) `prompt() { const t = this.promptText(); if (!t) return; const v = !this.cur.reprompted; this.cur.reprompted = true; this.say(t, { voice: v, repeat: v }); }`: the first re-prompt of a round is voiced. (b) The round's target glows and bobs from the round start (`addHalo` in `instruct`; `nudge` doubles the hop to 0.3 and adds the halo at step 1). (c) `teach(kind)` keys on `kind + ':' + this.lv` and also runs on round 0 of every level. (d) In `demo()`, delete `input.lock(1400)` and add `const off = input.onAny(() => { off(); fx.clearHands(); this.demoing = false; }); this.offs.push(off);`. (e) In `build()`: `this.offs.push(input.onAny(() => { this.stuck = 0; }));` and set `STUCK_DEMO = 5` (with a voiced re-prompt at 4 s). |
| LF-S | whole game | **major** (learning, pacing) | — | **The loop is too long and too complicated** (7–10 actions in 4 gestures per letter; L3 two-step reasoning; 3–4 min levels). | Section 3. Change `docs/design/letters.md` §4 and its acceptance criteria 14 and 17 to: L1 4 rounds, L2 6, L3 6; 1–1.5 min per level. |
| LF1 | L1 recap; L2 right drop; L2 6 s nudge | **major** (learning) | both | **Names before words.** The friend says `NAME(L)` (spoken Ay, See, Ee, Jee, Aitch, Eye, Oh, You, Double-you, Why, Ex, Cue) right before its words. For 13 of 26 letters the name doesn't start with the words' sound: "See! Cat!", "Jee! Goat!", "Ee! Egg!" teach the wrong first sound. Set 1 hides it except for A ("Ay... apple"). | Rule: **name = who it is** (on arrival, "Where is A?", friend pokes in L1/L2); **sound = what it has** (every placement, every clue). In `letters-data.js`: `export const linkWord = (L, def) => (SOUND[L] && !def.nameOnly ? soundWord(L, def) : \`${NAME(L)} ${def.cap}\`);`. Every placement (L1–L3) says `linkWord(L, def)` through `speakFriend`. Path B: `recap` says `SOUND[L]` (if no name-only thing is on the rug, otherwise `NAME`), and L2 `afterPlace` and `nudge` use `linkWord`. Uses only lines already queued. |
| LF2 | every sound line | **major** (learning) | both | **The queued spoken forms invite letter names.** `new-lines.txt` 112–135 and 286–353 send `a, a, a`, `c, c, c`, `g, g, g`, `y, y, y`; the sound-word notes say "the pure sound c". TTS reads a bare letter as its name, which would give "see, see, see... cat!". | Rewrite the 16 stop and vowel entries (the sound line and its sound-word lines) so the spoken text is never a bare letter with a name reading, and the note names the anchor word and forbids the name. **C:** `C, c, c! => k, k, k / The hard k sound at the start of "cat", three times, no "uh". Never the letter name "see".` Do the same for **A** (`/æ/` as in apple, never "ay"), **E** (`/ɛ/` as in egg, never "ee"), **G** (hard g as in goat, never "jee"), **H** (breathy h, never "aitch"), **I** (`/ɪ/` as in igloo, never "eye"), **O** (`/ɒ/` as in octopus, never "oh"), **U** (`/ʌ/` as in umbrella, never "you"), **W** (as in worm, never "double-you"), **Y** (as in yo-yo, never "why"), and **B, D, J, K, P, T** (no "uh", never the name). **Acceptance:** a person listens to all 16 sound clips and their sound-word clips before `index.json` takes them. Failures are spliced instead: the onset cut from the word clip (`ffmpeg atrim`) three times with 0.25 s gaps, then 0.35 s of silence, then the word clip. |
| LF3 | L3 1–8 | **major** (learning) | both | **Things arrive unnamed.** `ensureOnRug` tumbles silently, so she is asked to match a sound to objects nobody has named (later sets: envelope, igloo, insect, nappy, yak, teapot). | As each tumbled thing lands: `this.hopThing(o, 0.18); this.say(d.cap, { repeat: true });` (not awaited, 0.9 s apart in step with the tumbles). Use the name, not the sound-word. |
| LF4 | L3 11, 12 (9, 10 before pick-up) | **major** (learning) | B | The match clue ("a, a, a... ambulance!") plays only in `pickThing`, after "Which letter?" has been asked. | In `startMatch`'s on-rug branch: `this.say(soundWord(rd.L, rd.target), { repeat: true }); o.userData.heardMatch = true;` before `instruct(SAY.put, 'drag')`. (In the core, match rounds are removed.) |
| LF6 | L2 opening, 1, 2 | **major** (learning) | both | **Nothing to sort by, and a trap.** The clue things are silent. Hints and placements say names (LF1). Round 1 brings banana while A holds **apple** and B holds ball, so "fruit with fruit" points to A. | (1) The clues speak once at the level start: each hops while its friend says `soundWord` (input open). (2) In `planL2`: `const aAnchor = t(A, 2) \|\| t(A, 0), aLast = t(A, 2) ? t(A, 0) : null; this.anchors = [[A, aAnchor], [B, t(B, 0)]];`. The A thing sorted later becomes `aLast`. For set 1 that is ambulance in A and ball in B. (3) LF1 on every placement. |
| LF7 | — | — | — | (Merged into LF-H (e).) | — |
| LF8 | L1 5 | **major** (satisfaction) | B | **Lift: a second grab has a dead zone.** `onPick` sets `liftY0 = knob().y`. After a half lift the knob has risen about 0.67, so the lid doesn't move again until her finger is about 0.6 above it. `lidBob` returns once the lid is open at all. | `onPick: () => { this.liftY0 = this.trunk.userData.knob().y - this.liftA * 1.2; }`. Let `lidBob` bob around the current angle in the lift round, and halo the knob at step ≥ 1. |
| LF9 | L2 6, 11 (and B1 rows) | **major** (pacing) | both | **The pennant walk** is about 6.3 s and **about 10 s** (Pip 7.1 units each way). The new 3 s payoff cap means Pip is still walking into the next round or the finale ("nothing moves unless poked"). Path B also keeps the 7.5 s roll-in and the 4.3 s walk-in. | `plantPennant`: Pip doesn't walk. `car.attach(pen)` at `V(0.86, 1.0, -0.48)`; scale y 0.2 to 1 and y up to 1.42 over 0.8 s with `Ease.out` (the flag is hoisted); the found friend hops. Path B only: the train starts at `x0 + 2 * PITCH`, using `viewFor(n)` and not `'wideIn'` (2.9 s); the friend walks in from x 6.2 (2.7 s) with the rock not awaited; `startSound` runs the roll and `ensureOnRug(..., { zoom: false })` together. |
| LF10 | L1 1, 3, 5, 7; L2 and L3 openings | **major** (showing how) | both | **Go! twinkles while she can't act, then again.** The new engine forces Go! at 3 s even while `busy` (walk-in, roll-in). `instruct()` re-arms `goPending` and `goT0`, so Go! shows a second time after each prompt. | In `instruct()`, delete `this.goPending = true; this.goT0 = performance.now();`: one Go! per round, from the engine. The core removes the busy openings, so the engine's Go! then lands as she can act. (Don't hold `goT0 = Infinity`: under the new `canGo()` that would also keep taps closed.) |
| LF11 | L1 3 | **major** (satisfaction) | B | **Knocks are dropped.** `tapTrunk` returns while `busyTrunk` is set (about 2.1 s), and there is a 0.9 s gate. Quick knock-knock-knock opens one thing. | In `tapTrunk`, while busy in the knock round, queue the knock: `input.press(this.trunk, 140); this.knockQ = Math.min((this.knockQ \|\| 0) + 1, this.meetQueue.length); return;`. At the end of `knock()`: `if (this.knockQ > 0 && this.meetQueue.length) { this.knockQ--; this.lastKnock = 0; return this.knock(); }`. Cycle about 1.6 s; gate 400 ms. |
| LF13 | L2 7–10 | minor (prompt) | both | "Try the other one!" with 3–4 carriages (confirmed). | With more than 2 carriages, the wrong friend says `SAY.notMe` ("Not me!") through `speakFriend`; with 2, keep "Try the other one!". |
| LF14 | L1 7 | minor (logic) | B | The peek taps are forgotten: `afterOut()` resets `this.heard`, so "Tap them!" repeats all three (confirmed). | `afterOut()`: `if (this.openMode !== 'peek') this.heard = new Set();` If every rug thing has been heard, go straight to the recap. |
| LF15 | L1 recap | minor (logic) | B | The recap can be talked over: taps stay on, `pokeThing` answers, and her name clips push out the recap's ("latest wins"). | At the recap start, `makeTapThing(x, false)` for each; `pokeThing`: `if (this.phase === 'recap') { input.press(o, 140); return; }`. |
| LF16 | L1 recap order | minor | B | Confirmed but harmless: the recap goes left to right, while things arrive centre, left, right. | `freeSpot(order = this.lv === 0 ? [0, 1, 2] : [1, 0, 2])`. Also used in the core, so things land left to right. |
| LF17 | L3 set 6 | minor (learning) | both | `SETS_L3[5] = 'VYIU'` has two vowels, both coral. That breaks design rules 4.0 and 7.1, and I against U (short i, short u) is the hardest contrast for age 2. | `SETS_L3 = ['ABMS', 'CDHP', 'FLTG', 'RNEJ', 'WKOZ', 'IVYB', 'UKPS']`. |
| LF18 | L2, L3 | minor (voice) | both | The same instruction is voiced every round (about 9 times in 3 minutes). | Voice each instruction in a level's first two rounds and when stuck; caption-only otherwise: `instruct(line, kind, { voice: this.said(line) < 2 })`. |
| LF19 | all (20 s step) | minor (logic) | both | Errorless does one sub-step; a multi-thing round then idles to the 45 s "Bye bye!". | In `errorless()` when `auto`: `if ((this.cur.autos = (this.cur.autos \|\| 0) + 1) < 4) { this.ladder = 2; this.idle = 14; }`. |
| LF20 | header | minor (logic) | both | Confirmed: the set advances when a level starts, so a quit or idle exit skips a set. | Move the `store.update` from `pickSet` into `onFinale`. |
| LF22 | sound captions | minor (learning) | both | Until clips exist, a grown-up reads captions aloud, and "A, a, a!" will be read "ay, ay, ay". | Lower-case the `SOUND` captions ("a, a, a!", "mmm!"). `voiceKey` lower-cases anyway, so the clip keys don't change. |
| LF23 | — | minor | both | **Partly confirmed:** `SAY.tapLetter` is dead. "Listen!" is used by `candy.js` (and listed twice in `new-lines.txt`). | Delete `tapLetter`, `listen`, `which`, `starts` and `tapL` from `letters-data.js`; delete the second "Listen!" (line 85) and the retired lines below. |
| LF24 | home map | minor (parent-facing) | both | Brick letters and Letter friends are both named "Letters!" in the same world. | `meta.js` `letters`: `name: 'Letter train!'`. |

### Rewritten captions

- **Voiced instructions:**
  - "Open the box!" (replaces "Tap the trunk!", "Knock, knock, knock!", "Lift the lid!")
  - "Put them on the train!" (replaces "All aboard!" as an instruction, and "Tap them!")
  - "Put it on the train!" (kept)
  - "Put mine on the train!" (said by the friend; replaces "Tap A!" and "Who starts like this?")
  - "Where is S?" (kept, once per L2)
- **Said by a friend:**
  - "Not me!" (wrong carriage with 3 or more carriages)
  - Its name "A!" on arrival or at the round start
  - Its sound "mmm!" (L3 round start)
- **On every placement:** the sound-word, "a, a, a... apple!" (`linkWord`; the name plus word only for Q, X and name-only things).
- **Sound captions in lower case** (same keys): "a, a, a!", "mmm!", "a, a, a... apple!".
- **Finale only:** "All aboard!"

---

## 5. The storyboard's "looks broken" list, checked

| # | Claim | Verdict |
|---|---|---|
| 1 | "Try the other one!" with 3–4 carriages | **Confirmed** (LF13). |
| 2 | Dead lines `tapLetter`, `listen` | **Partly refuted:** "Listen!" is used by `candy.js` (LF23). |
| 3 | Recap order | **Confirmed as fact, not a fault**; make arrivals match it (LF16). The core has no recap. |
| 4 | Peek taps not counted | **Confirmed** (LF14). The core has no peek round. |
| 5 | Long rolls and walks | **Confirmed and badly understated.** The roll-in is 7.5 s, not "about 7.5 s, fine". The walk-in starts about 2 s off screen. The pennant takes about 10 s and now overruns the engine's 3 s payoff cap. The storyboard also lists only 4 of the roughly 50 rule-0 breaks (section 1). |
| 6 | Early Go! | **Confirmed;** with the new engine it fires at 3 s, and a second time from `instruct()` (LF10). |
| 7 | Dropped knock taps | **Confirmed** (LF11). |
| 8 | Lift-round stall | **Confirmed, and the real cause is the re-grab dead zone** (LF8). |
| 9 | Set advances on level start | **Confirmed** (LF20). |
| 10 | Silent captions | Clips are pending; not a design issue. The voice *spec* is (LF2). |

### What the storyboard missed

- **B1:** rule 0, measured.
- **B2:** the prompts fail action + object + result; "Tap A!" is a dead gate.
- **LF-H:** caption-only re-prompts, tiny nudges, once-per-game demos, the 1.4 s demo lock, and the 8 s timer that ignores touches.
- **LF-S:** the loop is too long.
- **LF1:** names in front of words teach the wrong first sound for 13 letters.
- **LF2:** the TTS spec.
- **LF3:** unnamed L3 things.
- **LF6:** no sort cue, and the apple/banana trap.
- **LF17, LF19, LF22, LF24.**
- **Storyboard corrections (no fix needed):**
  - **L3 1:** tapping a thing during "Tap A!" says its sound-word, not its name.
  - **L1 6:** the 12 s nudge on a carried friend only rocks it; there is no glow.
  - **L2 10:** the design's "alligator" is "ambulance" in code.

---

## Voice clips (not counted as design issues)

**Fix before generating (LF2):**
- Rewrite the spoken text and notes for the 16 stop and vowel sounds and their sound-word lines.
- Check every clip by ear; splice the onset from the word clip for any that fail.

**New lines** (add them to `new-lines.txt` when the fixes go in):
- "Open the box!"
- "Put them on the train!"
- "Put mine on the train!"
- "Not me!"
- Path B only: "Knock on the box!", "Peekaboo! Tap it!", and "Take <L> to the train!" (13 letters, each with its spoken name)

**Lines the core retires:**
- "Tap the trunk!"
- "Knock, knock, knock!"
- "Lift the lid!"
- "Peekaboo! Who is it?"
- "Tap them!"
- "Who starts like this?"
- "Which letter?"
- "Tap the letter!"
- the duplicate "Listen!"
- "Tap <L>!" (24 lines)
- "<L> goes too!" (26 lines)
- the 25 "Where is <L>?" lines that L2's single find round doesn't use, if only S is kept. Keep the template if find rounds rotate with the sets.

**Kept, used differently:**
- "All aboard!": finale only.
- The sound and sound-word lines: now on every placement in all levels (LF1).
- The word lines: on pick-up (L1, L2) and on landing (L3).
