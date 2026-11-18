# Audit: Building site world (`bricks`, `blocks`, `balance`)

Checked against `docs/storyboards/README.md` (audit list), `docs/FEEL-BRIEF.md`, `docs/SATISFACTION.md` and `docs/QUALITY-BRIEF.md`. Storyboards: `bricks.md`, `blocks.md`, `balance.md`. Code spot-checked: `app/src/lessons/bricks*.js`, `blocks*.js`, `balance*.js`, `app/src/engine/lesson.js`, `input.js`, `speech.js`, `fx.js`. Voice status was checked line by line against `app/assets/voice/index.json`, `tools/voice/new-lines.txt` and `tools/voice/pending-lines.txt`.

| Game | Verdict | One-line reason |
|---|---|---|
| Brick letters (`bricks`) | **needs work** | The tap-a-brick action is clear and calm. But the counting and the letter word are never heard, L2 and L3 ask her to count to 20, and every letter is torn down a second after she finishes it. |
| Block builder (`blocks`) | **needs work** | This is the best-made action in the world (drag, ghost glow, physics drop, slow demos, camera stations). But Bear knocks her build down and sweeps it away every round, and the finale admires an empty mat. |
| Fill & balance (`balance`) | **needs work** | The pouring and the see-saw are lovely, and the castles persist. But pouring needs a 2 s hold that is never shown, the L3 "holds more/less" rounds are a conservation quiz a 2-year-old cannot answer, and over-pouring at L3 is a dead end. |

---

## World-wide issues (fix once, all three games benefit)

| ID | Where | Severity | Issue | Exact fix |
|---|---|---|---|---|
| X1 | every success line | **major** | The lines that carry the learning are caption only, so a child who cannot read never hears them: "A is for Apple!", "Heavy goes down!", "Half full!", "It balances!", "The ball rolls!", "The cube stacks!". `success()` voices a line only with `opts.voice`, and `blocks.js`/`balance.js` `feelInit()` also set `this.voiceLines = false`, which blocks `voice: true` even when passed. The FEEL brief makes *praise* caption only; these lines are not praise, they are the lesson. | `blocks.js` `feelInit()` and `balance.js` `feelInit()`: delete `this.voiceLines = false;` (it only gates `opts.voice`, so praise stays silent). Pass `{ voice: true }` on the teaching lines listed per game below (B2, K2, F6). The 30 s repeat rule already stops nagging. |
| X2 | Ending, all levels | **major** | None of the three games defines `creationView()` or `creationObjects()`. The finale says "Look what you made!" over whatever is left on screen: an empty letter board (bricks), an empty mat (blocks), and an unframed yard (balance). The photo on the home screen shows nothing she made. This fails the end-frame test. | Per game: B1, K1, F4. Each game must return `creationView()` (camera on the build-up object) and `creationObjects()` (the pokeable things). |
| X3 | idle ladder at 6 s, 12 s and 20 s | **major** | The engine's idle ladder repeats `promptText()`. In bricks and blocks that is the round's *intro* ("Now F! 6 bricks!", "Now a house!"), which never says what to do. A stuck child hears the name of the thing, not the action. | Split the intro from the action. Say the intro once in `startRound`. Make `promptText()` return the action line once the intro has been said (B4, K3). |
| X4 | every reveal | minor | `beat()` is never called in any of the three games (SATISFACTION rule 4). Before the last brick, the last block and the see-saw levelling there is no held breath. | Bricks: `await this.beat(null, 0.4)` at the top of `complete()` (make it async). Blocks: the same in `complete()` before the xylophone run. Balance: `await this.beat(this.ss.g, 0.4)` in `checkBalance` before `success`. |

---

## 1. Brick letters (`bricks`): needs work

What works: one action (tap) is used all game, and every tap counts (a brick, the outline or empty space near a brick). There is a slow tap demo in round 1, the next slot breathes, and the idle ladder is good. Each brick's flight is 0.75 s and readable. The picture "show" is a nice reward in character.

### Issues

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| B1 | c, d (every round), Ending | **blocker** (satisfaction) | `afterSuccess` waits 1.0 s, then `tumble()` takes the letter apart. She never keeps a letter. The finale photo shows an empty board and the last picture. The storyboard is right about this. | In `afterSuccess()`, before `tumble()`: clone the placed bricks (`b.clone()` shares geometry) into a group, scale it about 0.22, and slide it over 0.8 s (`Ease.inOut`) onto a sign strip above the board, at y ≈ `BOARD.y1 + 0.7`, x = `BX - 3.0 + 0.95 * round`. It stays all level. Hold the full letter for 2.5 s first (`await this.wait(2.5)` instead of 1.0). Let `tapPlaced` lift a brick in phase `'done'` too (remove the early return), so the hold can be poked. Add `creationView()` framing the sign, and `creationObjects()` returning the mini letters; each poke plays its note (the engine default). Slow the hop back to the stand from 0.6 to 0.8 s. |
| B2 | b (every brick) | **major** (learning) | The goal is one-to-one counting, but the count is only a floating numeral (`fx.float`). Nothing is spoken, and a 2-year-old cannot read "7". At mash speed (`GAP = 0.4` s) a spoken count could not keep up anyway. | In `click()`: `this.say(NUMS[n - 1], { voice: true, repeat: true, max: 0.6 })`, with `NUMS = ['One!', … 'Ten!']` (same as `roll.js`). `repeat: true` is needed or the 30 s rule silences "Three!" in the next letter. Raise `GAP` from 0.4 to 0.75 so each number is heard before the next brick lands. Keep the numeral. |
| B3 | L2, L3 (all rounds) | **major** (learning, pacing) | `bricksFor = max(5, letter position)` gives 8 to 14 bricks in L2 and 15 to 20 in L3. Counting past 10 is not a 2-year-old goal. At L3 the stand bricks shrink to 0.8 long, so the letter becomes 20 bricks of mashing, and "Now T! 20 bricks!" means nothing to her. | `bricks-letters.js`: replace `bricksFor` with a table capped at 10: A–G 5, H–J 6, K–L 7, M–P 8, Q–R 9, S–T 10. Raise L3 `pl` back toward 1.1 now that 10 bricks fit a row. Check every letter's layout with `tools/qa-shots.sh bricks <level>`. Progression now comes from the new letters, not bigger numbers. |
| B4 | a (rounds 2+), idle ladder | **major** (prompt) | "Now F! 6 bricks!" names a number she cannot use and no action. It is also what the idle ladder repeats (X3). | Round 1 of a level: keep "Let's make A! Tap the bricks!". Later rounds: "Let's make B!" (the letter is the key word). `promptText()` returns "Tap a brick!" once the round's intro has been said (set `this.saidAt = this.round` in `startRound`), so the 6/12/20 s reminders name the action. |
| B5 | c | **major** (voice) | "X is for Word!" is caption only (no `voice` in `success()`), and only "A is for Apple!" has a clip. The letter-to-word link is never heard. | `complete()`: `this.success(pos, line, { voice: true })`. Voice all 20 lines (see the voice list). |
| B6 | c (O, Q) | minor (learning) | "O is for Owl" teaches the wrong O sound (/aʊ/). "Q is for Queen's crown" is long and possessive. `prop_word_octopus.glb` and `prop_word_queen.glb` both exist. | `bricks-words.js`: `O: { word: 'Octopus', kind: 'prop_word_octopus', … }`, `Q: { word: 'Queen', kind: 'prop_word_queen', … }`. Pick a calm show (wobble) and check the framing. |
| B7 | Mashing | minor (sound) | `mash()` plays `sfx.giggle()` on every mash burst, and mashing is the normal play here. That is a routine sound (SATISFACTION E7). | Delete `sfx.giggle()` from `mash()`; keep Pip's joy face and hop. |
| B8 | c | minor | The ta-da, the letter wiggle, Bear's cheer and hop, and the picture show all start within 0.6 s: four things at once ("one celebratory effect at a time"). | Order them: beat (X4), ta-da and wiggle, then 0.6 s later the picture. Drop Bear's hop (keep the joy face and arms). |

### Rewritten captions (bricks)

| Old | New | Voice |
|---|---|---|
| "Now B! 5 bricks!" … "Now T! 20 bricks!" (18 lines) | "Let's make B!" … "Let's make T!" (one per letter except A, H and O, which keep "Let's make X! Tap the bricks!") | needs voicing |
| idle repeat of the intro | "Tap a brick!" | needs voicing |
| (silent numeral) | "One!" … "Ten!" on each click | One–Four voiced; Five–Ten in new-lines |
| "O is for Owl!" / "Q is for Queen's crown!" | "O is for Octopus!" / "Q is for Queen!" | needs voicing |
| "X is for Word!" | unchanged, now `voice: true` | 19 need voicing |

**Storyboard accuracy:** the storyboard matches the code (timings, idle ladder, the queueing, `tapPlaced`, tumble, the finale). No corrections.

---

## 2. Block builder (`blocks`): needs work

What works: drag-to-ghost with the carried shape pulsing in its own colour; a physics drop with a rising "tok"; a slow hand demo the first time each action appears (build, roll, stack), replayed when she is stuck; camera stations (model, then mat). L1 is forgiving, L2 adds a spare block, and L3 adds real physics experiments (roll, stack). The progression is sensible.

### Issues

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| K1 | Build #5, Stack #1, Ending | **blocker** (satisfaction) | `complete()` sets `this.crashP = this.s.wait(2.0).then(() => this.topple())`: Bear stomps and knocks down her build 2 s after she finishes, then `sweep()` throws everything into the toy box. This is the clearest "game destroys the child's work" case in the app (SATISFACTION #21). The finale photo shows an empty mat. | Replace `crashP` with a child-driven ending. After the success stillness, give 3 s of admiring (Bear turns to look, one clap). Then add `input.addTap` on each placed block: a tap calls `topple()` from that block (impulse away from the touch, the crash sound once). If untouched for 8 s, Bear says "Knock it down?" and leans toward it; at 14 s the round moves on with the build left standing, then swept gently (blocks hop to the box at 0.25 s apart, one knock each). `afterSuccess` awaits that promise instead of `crashP`. **Keepsake:** in `sweep()`, do not `popOut` the minis. Move the `this.mini` model to a back shelf (a plank at about z = −3.3, y = 1.1, one slot per round, x from −3 to +5) where it stays. `creationView()` frames the shelf; `creationObjects()` returns the shelf models. |
| K2 | Build #3 (pick-up) | **major** (learning, voice) | The goal is naming 3-D shapes, but the name on pick-up ("A cube!", "A cylinder!") is `voice: false`. She only hears shape names inside error lines. | `onPick()`: `voice: true` (the 30 s rule throttles repeats). Voice the missing clips (see the voice list). |
| K3 | Build #1 and #3, idle ladder | **major** (prompt) | "Let's build a tree! Copy it!": "copy" is an adult abstraction. In later rounds the only line is "Now a house!", said over the model before the camera leaves. At Go! nothing says what to do, and the idle ladder repeats "Now a house!" (X3). | Split it: `introText()` (said over the model) and `promptText()` (the action, said at `cue()` on the first build round of each level and by the idle ladder). Intro: R1 "Let's build a tree like this!", later rounds keep "Now a house!". Action: "Put the blocks on the white shapes!". |
| K4 | Build #3 (L1) | **major** (logic) | At L1 a toddler often grabs the bright top piece (cone, roof) first. That gives "Bottom first!" and the block flies back. "Bottom first" is abstract, and at L1 this is the commonest error. `place()` can already wait for a support (`await Promise.all(slot.sup.map(q => q.ready))`). | `drop()`: at `this.level === 0` skip the `isOpen` refusal. In `place()`, if the slot is not open, fly to `p + (0, 1.5, 0)` (clear of the base's own 0.55 lift) and bob gently until `sup.ready`, then drop as now. At L2 and L3 keep the refusal, but name the block that goes first: `this.redirect(\`First the ${name(lowest unfilled support's shape)}!\`)`. |
| K5 | Build #3 (L2, L3 wrong ghost) | minor (prompt) | "Find the cone shape!" uses "shape" (abstract), and it only has a clip for cone. | `this.redirect(\`The ${nm} goes there!\`)` while the matching ghosts flash (already done). Voice all seven. |
| K6 | Build #1–#2 | **major** (pacing) | Set-up is 5.9 s (2 blocks) to 7.1 s (5 + spare) with no possible action: model hold 2.2 s, glide 0.95 s, then blocks hop in 0.3 s apart. Go! is forced at 6 s while blocks are still landing and cannot be dragged. | Model hold 2.2 → 1.4 s. Call `showGhosts()` and `fromBox(this.loose, 0)` at the *start* of the glide to the mat (not after it), and set `wait = 0.3 + n * 0.3`. Target: under 4.5 s for every build. |
| K7 | Stack #1 | **major** (prompt) | "Which one stacks? Put it on top!": "stacks" is not a 2-year-old word, and the question asks her to predict. The ball rolling off is the real lesson, but it is treated as an error (`redirect` counts `cur.wrong`, so two tries switch on errorless mode). | Prompt: "Put a block on the tower!". Ball: `this.say('Oops! The ball rolls off!')` instead of `redirect` (no wrong count), then it hops back. Success caption "The cube stacks!" with `voice: true` (clip exists). |
| K8 | Roll #1 | minor (voice) | "The ball rolls!" and "The cylinder rolls!" are caption only (X1), and "The cylinder rolls!" has no clip. | `success(…, { voice: true })`; voice the cylinder line. |
| K9 | Build #4 (gags) | minor | `bridge` and `temple` have `gag: 'bounce'`, which `gag()` does not implement (confirmed). `tree` and `hometree` float three green hearts (`fx.float '♥'`), which SATISFACTION rule 5 forbids. All gags fire by themselves. | Implement `bounce`: a second xylophone run with a 0.3 lift, one note per block. Use it for tree and hometree too and delete the hearts branch. Better still (SATISFACTION #21.4), raise the flag only when she taps the top block. |
| K10 | Build #5 | minor (pacing) | After the last block about 4.7 s pass with no input possible (xylophone, gag, Bear cheer, topple, sweep). | Fixed by K1, because the knockdown becomes hers. |

### Rewritten captions (blocks)

| Old | New | Voice |
|---|---|---|
| "Let's build a tree! Copy it!" (also big house, bridge with towers) | "Let's build a tree like this!" / "Let's build a big house like this!" / "Let's build a bridge with towers like this!" | needs voicing |
| (none at Go!; idle repeated "Now a house!") | "Put the blocks on the white shapes!" | needs voicing |
| "Bottom first!" | L1: no line (the block hovers and waits). L2–3: "First the cube!" / "First the long block!" / "First the cylinder!" / "First the arch!" | needs voicing |
| "Find the X shape!" | "The cube goes there!" (and long block, cylinder, cone, roof, arch, ball) | needs voicing |
| "Which one stacks? Put it on top!" | "Put a block on the tower!" | needs voicing |
| (new, K1) | "Knock it down?" | needs voicing |
| "We don't need a Y!" | unchanged; 6 of 7 lack clips | needs voicing |

**Storyboard accuracy:**
- "Wrong: `redirect()` = a soft sound": not true here. `redirect` plays `sfx.nope` only when given an object, and `blocks.js` never passes one, so a wrong drop is silent except for the block's flight home.
- All hand demos are DOM-only ghost hands (`fx.ghostPath`). The block itself does not move during a demo. This is worth stating, because the storyboard's "hand … lifts it, carries it" can read as if the block moves.

Everything else (timings, Go! at 6 s, L1 forgiveness, the bounce gag gap) matches.

---

## 3. Fill & balance (`balance`): needs work

What works: a real pour under the finger, with a stream, a rising level and HALF/FULL dings; a spring see-saw that bumps and throws Chick; sand castles that stay all level (the best persistence in this world); scoop/jug brought beside the pail so the close-up holds everything; slow demos per new action. L1 to L2 is a good progression (full/empty, then half/heavy/light).

### Issues

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| F1 | L1 R1/R3/R5, L2 R1/R3 | **major** (showing how, logic) | Pouring only happens while she holds the scoop over the pail (~2 s for a full pail). The demo is a DOM hand that glides there and lifts after 0.25 s (`ghostPath` drag). It never shows holding, and the scoop does not move. If she lets go early in a fill round, the tool hops home with no line, and she has to start again without knowing why. | `release()`: in a `fill` task, if `wasOver === this.target()` and `level < goal`, call `this.autoPour(P, wasOver, this.goal(), { rate: RATE })` (the tool stays tipped and finishes), then `afterPour`. Letting go over the bucket finishes the pour. Demo: in `showHint`, append `to.clone().add(V(0.05, 0, 0))` and `to.clone().add(V(-0.05, 0, 0))` to the drag path so the hand stays pressed over the mouth about 1.2 s longer. Keep hold-to-pour only in L3 balance rounds (stopping in time is the skill there). |
| F2 | L3 R2, R4, R6 ("more" rounds) | **major** (logic, learning) | "Which one holds more?" shows a small pail *full* of sand beside a big *empty* one, so the pail with "more" in it is the wrong answer. R4 (tall-thin full vs wide-short empty) is Piaget's conservation task, which children fail until about age 6. R6 asks "less", which toddlers commonly treat as "more". A wrong tap gets a caption-only "Hmm, let's look again!" and no proof. Only the right tap shows the pour-across. | Make all three rounds a pour she triggers, with no wrong answer. Tapping *either* pail (or dragging the full one) runs `pourAcross()` from the full one into the empty one. R2: prompt "Pour the little one in the big one!", result (voiced) "The big one holds more!". R4: "Pour the tall one in the wide one!", then "The wide one holds more!". R6: pre-fill the **big** orange pail instead (in `setup`, `fullI = ask === 'less' ? bigI : smallI`), prompt "Pour the big one in the little one!". In `pourAcross`, stop filling the small one at 1.0 and let the rest run over its rim onto the sand (stream aimed past the rim, a `puff`, a small sand heap that stays). Result: "The little one holds less!". `target()` for `more` returns the full pail; delete the two "Hmm…" redirects. |
| F3 | L3 R3, R5 (balance) | **major** (logic) | If she keeps pouring to the brim, `goalReached` calls `afterPour`, then `checkBalance(false)`, which says nothing. `this.reached = true` stops further pouring, yet `nudgeTarget()` (with `over` still false) bobs the scoop/jug and the 8 s demo re-shows *pouring*. Every hint points at an action that now does nothing. The storyboard notes the silence; the wrong hint is worse. | `afterPour()`: `else if (this.task === 'balance') this.checkBalance(this.reached);`. A brim stop then counts as a release: "Too much!", `over = true`, and the tip demo. The idle hints then target the pail. |
| F4 | L3 R3, R5 setup, Ending | **major** (satisfaction, pacing) | `dumpAll()` flips her balanced pails clean with no input from her, then `autoPour` pre-fills: about 4.5 s of watching that undoes her work. L3 leaves nothing behind, and the finale has no `creationView`. | R3/R5 setup: the prompt "Tip them out!" makes each plank pail tappable (`tipOut`, so sand makes castles in `SPOTS` and water makes puddles). After both are tipped, the auto pre-pour runs (keep it, 1 s). `creationView()`: `{ pos: [1.4, 3.4, 8.8], look: [1.4, 0.7, 1.8] }` (the castle row and the see-saw; tune with qa-shots). `creationObjects()`: `this.castles`. Patting a castle squashes it a little (the default poke). |
| F5 | L3 R1, R3, R5 prompts | **major** (prompt) | "Make the see-saw balance!", "Balance it with water!" and "Make it balance again!" ask for a word she is only now learning. The concrete picture is a flat see-saw. | Prompts: "Make the see-saw flat!", "Make it flat with water!", "Make it flat again!". The voiced success "It balances!" (X1) then names what she did. |
| F6 | every success | **major** (voice) | Teaching lines are caption only (X1), though clips exist for all of them. | `voice: true` on: "It's full!", "All empty!", "Half full!", "Full right up!", "Heavy goes down!", "Light goes up!", "That one is full!", "Now it's empty!", "It balances!", and the three "holds more/less" results. Leave "A sand castle!" caption only. |
| F7 | L3 R3/R5 (too much), tip-out | **major** (prompt, voice) | "Too much! Tap it to tip some out." has 8 words, no clip, and names a new action. "A bit more out!" does not say what to do. | "Too much! Tap the bucket!" (voiced). After each tip that is still too much: "Tap it again!" (in new-lines). |
| F8 | L2 R2, R6 (wrong pail) | minor (voice) | "That one is light! Heavy goes down." and "That one is heavy! Light goes up." have no clips, are two sentences long, and give away the success line. | "That's the light one!" / "That's the heavy one!" (voiced), with the right pail hopping (`hopPail(this.target())` in the `pick` branch). The success line then teaches the rule. |
| F9 | L2 R1, R3 | minor (prompt) | "Fill this bucket half way!": "half way" is abstract, and the pour stops by itself at the line, so the prompt asks for nothing she controls. | R1: "Fill it half way! To the line!". R3: "Fill it to the star!" (the FULL line has the star). The voiced "Half full!" / "Full right up!" teach the words. |
| F10 | L1 R5 | minor (logic) | "Fill the big bucket up!", but the yellow pail is only 1.1× the red one, which is not visibly big. | `pail: [YELLOW, 1.35]` (check the castle spot and plank clearance in qa-shots), or keep 1.1 and say "Fill the yellow bucket!". |
| F11 | L1 R6 | minor | The caption "Empty!" plays while a second castle appears. | "Another sand castle!" (caption only). |
| F12 | L3 balance (drag to the wrong pail) | minor | Dropping the tool on the wrong pail in a balance round says "This one!", or "A little bit more!" if she has already poured (the `checkBalance(true)` branch wins). Tapping the wrong pail says "Pour in this one!". | `release()`: test `!wasOver && zone && !zone.ok` *before* the balance branch, and use "Pour in this one!" for both. |
| F13 | L3 (spirit level) | minor (check) | The "bubble" is a 0.05-radius sphere (`balance-props.js`). At `CAMS.main` (about 9 units away) it is likely too small to read. | Check in qa-shots. If it can't be read, scale the bubble and vial to about 2.5×, or drop it from "how she knows". |

### Rewritten captions (balance)

| Old | New | Voice |
|---|---|---|
| "Make the see-saw balance!" / "Balance it with water!" / "Make it balance again!" | "Make the see-saw flat!" / "Make it flat with water!" / "Make it flat again!" | needs voicing |
| "Which one holds more?" (R2) | "Pour the little one in the big one!" | needs voicing |
| "Which one holds more?" (R4) | "Pour the tall one in the wide one!" | needs voicing |
| "Which one holds less?" (R6) | "Pour the big one in the little one!" | needs voicing |
| "The small one holds less!" | "The little one holds less!" | needs voicing |
| "Hmm, let's look again!" / "Hmm, that one holds lots! Try again." | deleted (no wrong answer) | n/a |
| "Too much! Tap it to tip some out." | "Too much! Tap the bucket!" | needs voicing |
| "A bit more out!" | "Tap it again!" | in new-lines |
| "That one is light! Heavy goes down." / "That one is heavy! Light goes up." | "That's the light one!" / "That's the heavy one!" | needs voicing |
| "Fill this bucket half way!" / "Fill this one right up!" | "Fill it half way! To the line!" / "Fill it to the star!" | needs voicing |
| (new, F4) | "Tip them out!" | needs voicing |
| "Empty!" (L1 R6) | "Another sand castle!" | caption only |

**Storyboard accuracy:**
- L3 R1: "Let go too far: Too much!…" cannot happen in R1. The balance point there is the brim (left pail full, pails identical), so the pour auto-stops exactly level. Over-pouring applies to R3 and R5 only.
- Dragging the tool onto the wrong pail in a balance round says "This one!" (or "A little bit more!"), not "Pour in this one!" (see F12).
- Go! in round 1 is forced at 6 s while the 4.4 s pour demo (started about 2.7 s in) is still running, so it shows mid-demo, not after it.
- The pour demo is a DOM ghost hand. The scoop/jug does not move with it, and the hand does not hold over the pail.

---

## Lines that need voicing

Only lines in use now, or created by the fixes above. Lines already waiting in `tools/voice/new-lines.txt` are listed separately and were not counted as faults.

**Already waiting in new-lines.txt (no action):** "Look what you made!", "A roof!", "Tap it again!", "Five!", "Six!", "Seven!", "Eight!", "Nine!", "Ten!".

**Existing lines with no clip (add to new-lines.txt):**
- Bricks: "B is for Ball!", "C is for Cat!", "D is for Duck!", "E is for Egg!", "F is for Fish!", "G is for Grapes!", "H is for Hat!", "I is for Ice cream!", "J is for Jellyfish!", "K is for Kite!", "L is for Leaf!", "M is for Moon!", "N is for Nest!", "P is for Pig!", "R is for Rabbit!", "S is for Sun!", "T is for Tree!"
- Blocks: "A cube!", "A long block!", "A cylinder!", "A cone!", "An arch!", "We don't need a cube!", "We don't need a long block!", "We don't need a cone!", "We don't need a roof!", "We don't need an arch!", "We don't need a ball!", "The cylinder rolls!"

**New lines from this audit:**
- Bricks: "Tap a brick!", "Let's make B!", "Let's make C!", "Let's make D!", "Let's make E!", "Let's make F!", "Let's make G!", "Let's make I!", "Let's make J!", "Let's make K!", "Let's make L!", "Let's make M!", "Let's make N!", "Let's make P!", "Let's make Q!", "Let's make R!", "Let's make S!", "Let's make T!", "O is for Octopus!", "Q is for Queen!"
- Blocks: "Let's build a tree like this!", "Let's build a big house like this!", "Let's build a bridge with towers like this!", "Put the blocks on the white shapes!", "First the cube!", "First the long block!", "First the cylinder!", "First the arch!", "The cube goes there!", "The long block goes there!", "The cylinder goes there!", "The cone goes there!", "The roof goes there!", "The arch goes there!", "The ball goes there!", "Put a block on the tower!", "Knock it down?"
- Balance: "Make the see-saw flat!", "Make it flat with water!", "Make it flat again!", "Pour the little one in the big one!", "Pour the tall one in the wide one!", "Pour the big one in the little one!", "The little one holds less!", "Too much! Tap the bucket!", "That's the light one!", "That's the heavy one!", "Fill it half way! To the line!", "Fill it to the star!", "Tip them out!"

---

## Top 5 for this world (in order of impact)

1. **Her work is destroyed and the ending admires nothing** (B1, K1, F4, X2). Bricks tumbles each letter after 1 s, Bear knocks down every block build after 2 s, and L3 balance auto-dumps her pails. No game defines `creationView`, so "Look what you made!" plays over an empty board or mat.
2. **The learning is never heard** (X1, B2, B5, K2, F6). Counts are silent numerals; "A is for Apple", shape names, "Heavy goes down!" and "It balances!" are caption only, and `voiceLines = false` blocks them even when asked. For a child who can't read, the vocabulary goal is missing.
3. **Balance L3 "holds more/less" is a quiz she cannot win** (F2). The full small pail looks like "more", tall vs wide is a conservation task, and the proof only plays for the right answer. Make each round a pour she triggers.
4. **Pouring needs a hold that is never shown, and over-pouring is a dead end** (F1, F3). Letting go early is silent, and at L3 a brim pour leaves hints pointing at a scoop that can no longer pour.
5. **Prompts and reminders don't name the action, and the numbers are too big** (X3, B3, B4, K3, K4, K7, F5, F7). "Copy it!", "Now F! 6 bricks!" and "Now N! 14 bricks!" (counting to 20), "Bottom first!", "Which one stacks?", "Make the see-saw balance!", and an unvoiced "Too much! Tap it to tip some out.". Replace them with the short, concrete, voiced lines above.
