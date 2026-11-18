# Audit: Shape puzzles (`puzzles`)

I checked `puzzles.md` beat by beat against:
- the seven audit checks in `README.md`;
- `FEEL-BRIEF.md`, including **rule 0, no waiting** (act within 1.5 s, never wait more than 2 s with nothing to touch);
- `SATISFACTION.md` and `QUALITY-BRIEF.md`;
- the code: `app/src/lessons/puzzles.js`, `puzzles-plan.js`, `puzzles-parts.js`, `puzzles-art.js`, `puzzles-sound.js`, `puzzles-layout.json`, and in the engine `lesson.js`, `speech.js`, `fx.js`, `stage.js`;
- the design in `docs/design/puzzles.md`;
- the latest QA captures of all three levels (`qa-shots`, 1280x720) and their `PZTIMING` logs.

Beat numbers refer to the storyboard: "L2 6" is Level 2, puzzle 6. Timings marked *measured* come from the `PZTIMING` log. Timings marked *code* are worked out from the tween durations and path lengths in `puzzles.js`.

Missing voice clips are **not** counted as design issues, because they are waiting to be generated. A `voice:false` on a line that should be heard **is** counted.

Severity:
- **blocker:** she can get stuck, the game can't go on, or it breaks rule 0.
- **major:** she will notice it hurting understanding, learning or satisfaction.
- **minor:** polish.

## Verdict

| Game | Verdict | Blocker | Major | Minor |
|---|---|---|---|---|
| Shape puzzles (`puzzles`) | **needs work** (the core loop is excellent; the hiding, the prep steps and the lock-outs need fixing) | 1 | 9 | 12 |

**What already works, and must survive the fixes:**
- **The build-up object.** The picture fills piece by piece, and nothing she places is ever removed. The finale frames the whole board, and every piece can be poked to play its note. The end-frame test and the mute test both pass.
- **The press-fit.** The piece turns to the hole, hovers for a beat, sinks, and plays one rising wooden note. The sun, moon or robot beams. There is no confetti, no praise word and no boing.
- **The gaps between puzzles.** These meet rule 0. *Measured* from the moment the door starts dropping to the next touch: L1 0.98–1.06 s, L2 0.98–1.27 s, L3 0.98–1.55 s. From her release that is about 1.6–2.1 s, and the picture stays still the whole time.
- **The help.** The hand demo plays the first time each step appears in a level. If she is stuck, the demo comes again at 8 s. At 20 s (or after two wrong tries) only the right hole stays open. At 30 s the preparing step does itself, but the game never does the final fit for her. Two puzzles in a row that needed help make the next one open only its own hole.
- **The art and the level looks.** Garden, night sky and robot party are clearly different (QA sheets). The pieces are chunky, inked and charming.

**Why it still needs work:**
- Inside a puzzle she is locked out for 2–4.3 s at a time:
  - after every lid or block;
  - after the peg;
  - while the key unlocks;
  - after every wrong hole;
  - after every drop on nothing.
- Every "watch where it goes" moment happens **while the cupboard door is still rolling up**. She sees the star in the box, or under the cup, for about 0.3 s. The memory puzzles become guesses.
- The very first puzzle is harder than it looks, for three reasons:
  - she has to drag about 450 px diagonally to the far corner;
  - five coloured "holes" show, but only one is open;
  - tapping the piece does nothing useful.
- New prep steps are "shown" by a hand that moves while the object stays still. Some steps are named with words that don't match the object ("block" for a round bung, "Use the key"), and L3 P3 teaches two new steps at once.
- The words that should be heard are silenced:
  - the 30 s voice rule mutes most shape names, which are the learning words;
  - every stuck re-prompt;
  - `voice:false` on "Try another hole!" and the bump lines.

### Top 8 issues

1. **Rule 0 lock-outs inside puzzles (PZ1, blocker).** *Code* timings; during each of these every target is switched off (`hold()` → `refreshTargets`):
   - **Peg (L3 8):** 4.3 s (lift 0.25, tray flight 2.0, beat 0.3, roll 1.25, rock 0.5).
   - **Tapped key:** 3.2 s from tap to free piece. A dragged key takes 2.15 s.
   - **Lid or block to the tray:** about 2.0 s each, because the flight hits its 2.0 s cap on every board position. L3 P3 has two of these back to back.
   - **Wrong hole:** 2.3–2.8 s.
   - **Bump on a lid or block:** 1.9–2.4 s.
   - **Drop on nothing:** 1.2–2.0 s, during which she cannot grab the piece again. Toddlers drop pieces all the time.
2. **The hiding happens while the door is still rising, too fast to see (PZ2, major).** `swapSet` starts `hideMoves` 0.05 s into the 0.3 s door rise. The flap closes in 0.4 s, the cups drop in 0.3 s and swap in 0.75 s (the design said 1.2 s). L2 P7 (which box?) and L3 P6 (which cup?) become coin flips. "Where did it go?" asks about something she never saw go.
3. **The first puzzles are not easy enough (PZ3, major).**
   - In P1 and P2 the piece must travel 4.9 and 5.1 units (about 450 px), up and left to the far corner. The design had the piece right under its hole.
   - All five tinted floors are coloured from the first frame, so P1 shows five pastel shapes, and the one open hole looks almost the same as the closed ones.
   - Dropping on a closed one sends the piece silently home.
   - A tap on the piece only pops it out and back.
   - The line "Put the shape in its hole!" uses the category word "shape".
4. **Prep steps are not really shown, and some are named wrongly (PZ4, major).**
   - The ghost hand is DOM-only: the lid, string, key and peg never move during the demo, so she never sees what will happen.
   - L3 P3 brings in lid *and* block in one puzzle, which breaks the design's own "one new step per puzzle" rule.
   - L2 P5 hides the right hole under a lid, and a wrong try says "Try another hole!", which points away from the lid.
   - "Take the block out!" names a round grey bung. "Use the key!" and "Open the lid!" don't name the movement.
5. **The voice that teaches is silenced (PZ5, major).**
   - Shape names repeat every three puzzles, so for a fluent child they fall inside the 30 s rule and become captions.
   - Every stuck re-prompt (6 s, about 22 s, errorless) comes within 30 s of the start line, so all of them are silent.
   - "Try another hole!" and the bump lines are `voice:false`, although they are instructions.
   - Wordless puzzles have no stuck words at all.
   - L3 P9 keeps saying "Where is the key?" after the key has been found.
6. **The cupboard's fittings are too small to read in the fixed whole-board view (PZ6, major).** At 1280–1366 px wide, 1 world unit is about 86–92 px. In the L3 QA shots the key and padlock are about 35 px, and the peg and ramp are thin lines. The parent asked for things to be zoomed in on. A camera zoom would push the picture off screen (FEEL rule 3), so the fix is to make the fittings bigger.
7. **Two lines at once (PZ7, major).** L2 P6 says `['Where did it go?', 'Open the box!']`. The opening says "Let's make a picture!", then 0.75 s later "Put the shape in its hole!". The finale says "You made a garden!", then 0.2 s later "Look what you made!". Each time the second caption replaces the first while the first clip is still speaking.
8. **Difficulty spikes at the start of L2 and L3, and the cup swap (PZ8, major).**
   - L2 P1 and L3 P1 open two holes, although the design says "every level opens with a plain fit".
   - In L3 P1 the lure is a 1.4 x 0.9 rectangle under a 1.0 square: a 10% near miss.
   - L3 P6 adds an invisible-displacement swap on top of the too-fast hide.

---

## 1. Rule 0: every lock-out over 2 s, and the borderline ones

| Where | What she waits through | Now (*code*) | Fix target |
|---|---|---|---|
| L3 8 peg | lift 0.25 + tray flight 2.0 + beat 0.3 + roll 1.25 + rock 0.5 | **4.3 s** | ≤ 1.8 s |
| L3 7, 9 key tapped | unpark 0.25 + flight 0.8 + slide 0.6 + turn 0.4 + beat 0.35 + shackle 0.2 + door 0.6 | **3.2 s** | ≤ 1.8 s |
| L3 7, 9 key dragged | slide 0.6 + turn 0.4 + beat 0.35 + shackle 0.2 + door 0.6 | **2.15 s** | ≤ 1.3 s |
| wrong hole (all) | glide 0.25 + stop 0.18 + rock 0.4 + `goHome` 1.5–2.0 (path out to z 1.55 and back into the cupboard at 4 u/s) | **2.3–2.8 s** | ≤ 1.5 s, grabbable on the way home |
| bump on lid or block | glide 0.25 + 0.15 + `goHome` 1.5–2.0 | **1.9–2.4 s** | ≤ 1.3 s |
| drop on nothing | `goHome` 1.2–2.0 s, every target off | **1.2–2.0 s** | ≤ 0.8 s, grabbable |
| lid or block to the tray (L2 4, 5, 8, 9, 10; L3 3 ×2, 10) | path through z 0.65 → 1.55 → tray ≈ 8–10.5 units at 4 u/s, capped at 2.0 | **≈ 2.0 s** each (L3 3: 2.0 + 2.0) | hole free at once, flight ≤ 1.0 s |
| L3 6 cups (between puzzles) | door + cups + swap | 1.55 s *measured* (2.1 s from release) | ≤ 1.2 s after door-up, with the hide visible (PZ2) |
| between puzzles (all others) | fit 0.58 + door 0.65 | 0.98–1.32 s *measured* | fine |
| box tap 0.85, cup tap 0.95, string tap 1.5, opening to P1 0.75 | | fine | fine |

---

## 2. All issues

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| **PZ1** | every lid, block, peg, key; every wrong, bump or drop | **blocker** (rule 0) | Lock-outs as in section 1. The storyboard's "walks home (0.6 s)" and "about 1.5 s" are wrong: `goHome` and `toTray` use `max(dur, min(2.0, len / 4))`, and every path detours out to z 1.55 and back into the cupboard, so most trips hit the 2.0 s cap. `hold(1)` disables every target until the trip ends. | **`toTray`:** set `h.lid`/`h.plug = null` (already done), then call `stepDone(st.id)` **before** the flight, not after it. Don't `hold(1)`; only the flying object's own target goes off (`u.used = true`). Make the flight `Math.max(0.5, Math.min(1.0, len / 9))`. **`goHome`:** speed 4 → 8 u/s, cap 2.0 → 0.8 s. For the piece, don't `hold`. Store the anim and cancel it in `pick()` if she grabs the piece mid-flight (`if (u.homing) { u.homeAnim.stop(); u.homing = false; }`). **`wrongHole`:** rock 0.4 → 0.3. **`pullPeg`:** after the 0.25 lift, start `toTray(peg, 'peg')` without awaiting it. Then `beat(null, 0.25)`, then `rollBall()`. In `rollBall` set `u.free = true` and `u.home` before the cradle rock, and cut the rock to 0.3. **`unlock`:** slide 0.35 + 0.25 → 0.3 total, turn 0.4 → 0.3, beat 0.35 → 0.2, shackle and door together in 0.45. **`keyToLock`:** flight 0.8 → 0.5. Log every lock-out with `PZTIMING` (`{ lock: kind, s }`) and re-run all three levels. |
| **PZ2** | L2 6, 7, 10; L3 2, 6, 9 (the hiding moves) | **major** (logic, learning) | `swapSet` starts `hideMoves` 0.05 s after the 0.3 s door rise begins. The flap shuts in 0.4 s (both flaps at once in L2 7); the cups drop in 0.3 s and swap in 0.75 s; the cup drops over the key in 0.35 s. The roll-up door uncovers the cupboard from the bottom, so she sees the hidden thing for about 0.3 s, half covered. "Remembering visual forms" is the goal of these puzzles, and it can't be met. | `swapSet`: `await this.moveShutter(1, 0.35)` **first**, then `this.hideP = this.hideMoves(next)`. `hideMoves`: **look**, then **hide**, with `busy` kept on throughout. **Look (0.5 s):** the piece (or key) does one 0.35 s wiggle, and Pip turns to it (`pipWatch(piece pos)`). **Hide**, by fitting: <br>• **Box:** the flap closes in 0.5 s, `Ease.inOut`. <br>• **Two boxes (L2 7):** first the empty red one closes (0.4 s), 0.2 s pause, then the blue one (0.5 s), so her eye stays on the blue box last. <br>• **Cups:** they lower in 0.45 s; the swap is removed (PZ8). <br>• **Cup over the key:** it lowers in 0.45 s. <br>From door-up to touch this is 1.0–1.3 s, inside rule 0. |
| **PZ3** | L1 1–3 (and every one-hole puzzle) | **major** (easy start) | (a) P1 sun (-5.6, 4.2) and P2 crate (-4.4, 3.0) are the farthest holes from the fixed cupboard (piece at x -1.5 / 0.5, y ≈ 1.5): drags of 4.9 and 5.1 units. (b) `build()` tints all five floors at once, so at P1 the board shows five pastel shapes (QA L1 shot 1). From the front, the 0.16 recess of the one open hole is only a thin shadow. (c) Dropping on a closed hole gives no zone, so the piece walks home with no word. (d) A tap on the piece pops it out and back; the drag demo only plays on the 2nd tap. (e) "shape" is a category word. | (a, c) **Forgiving drop when only one hole is open** (`pieceZones()` has one entry, or `errorlessOn`): in `dropPiece`, if there is no zone and the piece's y is above 2.4, call `this.travelTo(p, h).then(() => this.tryFit(h))`. Wherever she lets go above the cupboard, it glides to the hole and fits. (b) Tint a floor only when its hole opens: move the `tintFloor` call from `build()` into `openHole()` for the five tinted ids. Make every **open** floor visibly a hole: in `openHole` lerp the floor colour 25% toward `0x7a5434` (a dark recess); in `closeHole` restore `baseCol`. A closed hole is then only its faint dotted outline. (d) In `dropPiece`'s tap branch: if exactly one clear hole is open, `this.tapHole(h)` (the piece glides in; she caused it). Otherwise keep the press-in, and show the demo after the **first** tap. (e) New P1 lines, see the captions table. |
| **PZ4** | L2 4, 5, 8; L3 3, 4, 7, 8 (first time each prep step appears) | **major** (showing how) | (a) `fx.ghostPath` is DOM-only: the hand drags while the lid, ring, key and peg stay still, so she never sees the result (lid off, glass up, ball rolls). (b) L3 3 is lid **then** block **then** fit: two new kinds in one puzzle, which breaks the design's own rule. A child who plays L3 cold meets both at puzzle 3. (c) L2 5: the only open hole is the star (a lure); the right hole is fully under a flat lid. Finding it needs reasoning by exclusion, which is a stretch at 2. A wrong try says "Try another hole!" and nothing points at the lid. (d) The names: "Take the block out!" for a round grey-blue bung with a red knob; "Open the lid!" for a cover she lifts off and drags away; "Use the key!" has no movement in it; "Pull the peg out!" for a demo that goes up. | (a) Add `demoMove(kind)`, which runs with the hand on its first press (0.35 s in) and moves the **real** object part of the way, then eases it back over 0.4 s. <br>• **Lid / block:** lifts 0.15 toward the camera and slides 0.5 toward the tray, then back. <br>• **Ring:** `setPull(cs, 0.35, true)` and back, so the glass visibly rises a little. <br>• **Key:** 40% of the way to the padlock and back. <br>• **Peg:** up 0.2 and back. <br>• **Box flap:** down 30% and back, without showing the piece. <br>Never during a stuck demo while she is touching. (b) `puzzles-plan.js` L3: `plugs: []`; P3 `teach: ['lid']`, delete `sayLater`, steps `[lid, fit]`. (c) In `tryFit`, when `!right` and the right hole has a lid or block: after `wrongHole`, `this.rattle(t.lid ?? t.plug)` and `this.sayOnce(t.lid ? 'Take the lid off!' : 'Pull the plug out!')` instead of "Try another hole!". (d) New step lines (captions table); update `SAY_STEP` and the `say` fields to match. |
| **PZ5** | every fit; stuck ladder; wrong/bump; L3 9 | **major** (voice, learning) | (a) `success(hp, pz.name, { voice: true })` follows the 30 s rule. L1 says Circle / Square / Triangle every 3 puzzles (about 15–30 s apart), so most shape names after the first three become silent captions. This is the word she is meant to learn. (b) `prompt()` uses `say(t)`: the 6 s cue, the engine's 12 s cue (which really fires at about 22 s, see S4) and the errorless re-prompt all fall within 30 s of the start line, so all are silent. (c) "Try another hole!" and the bump lines ("Open the lid!", "Take the block out!") are `voice:false`, though each tells her what to do. (d) `promptText()` returns `''` for any puzzle without `say` (L2 5, 9, 10; L3 10), so a stuck child in a two- or three-step wordless puzzle gets no words, ever. (e) L3 9: once the cup is up and the key shows, `promptText()` still returns "Where is the key?". (f) `puzzles.nudge()` is empty, so the 6 s cue has no visual either, and `bob()` moves only 0.05 (about 5 px). | (a) `fit()`: `this.success(hp, '', { still: 0 }); this.say(pz.name, { repeat: true });`. A one-word name at her own click is never nagging. (b) Override `prompt()`: `const t = this.promptText(); if (!t) return; const now = performance.now(); const rep = now - (this.promptAt ?? 0) > 10000; this.promptAt = now; this.say(t, { repeat: rep });`. (c) `wrongHole`: `this.sayOnce('Try another hole!')`. `bump`: `this.sayOnce(line)` (`sayOnce` voices the first time in the level). (d, e) `promptText()`: if `w.kind !== 'fit'` return `SAY_STEP[w.kind]`. If `w.kind === 'fit'`, return the P1 fit line only in a puzzle whose `say` is that line, otherwise `''`. (f) `nudge(step)`: `if (step === 1) this.bob(this.want()?.obj)`; bob amplitude 0.05 → 0.15. |
| **PZ6** | L3 4, 7, 8, 9, 10; L2 8, 9 (cupboard fittings, plugs) | **major** (camera, FEEL rule 3) | `fitView()` frames the whole 14-unit board (width-bound): about 86–92 px per unit, and the cupboard opening is only about 19% of the screen height. In QA L3 shot 6 the key and padlock are about 35 px, the hook a thin post, and the ring about 40 px; the peg and ramp read as lines (shot 7). A zoom to the cupboard (which the design asked for) would push the picture she is making off screen, which rule 3 forbids, so keep the fixed view. | Scale the small fittings in `puzzles-parts.js` (and their hit radii in `puzzles.js`): key `KEY_K` 0.75 → 1.1; padlock (`lock`, `shackle`) ×1.4 with the keyhole zone radius 0.45 → 0.6; ring ×1.4 with `radius` 0.5 → 0.65; peg ×1.5 with `radius` 0.45 → 0.6; the hook and the knobs on lids and plugs ×1.4. Check the cupboard and lid clearances (lids on a 0.07 foot rule) and Pip's line of sight with `tools/qa-shots.sh puzzles 2` at 1366x768, 1280x800 and 1920x1080. |
| **PZ7** | L2 6; opening (all levels); finale (all levels) | **major** (voice) | Two lines in a row: the second caption replaces the first at once while the first clip speaks (`speech.say` captions immediately; the voice queues "latest wins"). L2 6: `say: ['Where did it go?', 'Open the box!']`. Opening: the engine's intro "Let's make a picture!" (not awaited) plus P1's line 0.75 s later. Finale: `onFinale` says "You made a garden!" and `admire()` says "Look what you made!" 0.2 s later. That is also two "made" lines in a row. | L2 6: one line, "Where's the star? Open the box!". Opening: in `startRound`, when `r === 0` delay only the line and the demo, `this.s.wait(1.4).then(() => { say; demo })`. Touches stay open, so rule 0 holds. Finale: engine `admire()` uses `this.admireLine ?? 'Look what you made!'` (engine change); puzzles sets `this.admireLine = this.L.finale` and `onFinale` says nothing. |
| **PZ8** | L2 1; L3 1, 6 | **major** (difficulty) | L2 1 opens moon + starA, and L3 1 opens head + body, so a level played cold starts with a choice. In L3 1 the lure (body, 1.4 x 0.9) sits right under the 1.0 square: it "nearly fits" by 0.1, which is a frustrating near miss for a first move. L3 6: the cups swap once (0.75 s, the design said 1.2 s). Following a hidden thing as it moves is the hardest kind of object permanence, and here it comes on top of PZ2. | `puzzles-plan.js`: L2 P1 `open: ['moon']`; L3 P1 `open: ['head']`. L2 P2 and L3 2 then bring in the first lure. L3 P6: drop `swap: true`. The star goes under one of two cups while she watches (PZ2 timings), and she lifts that cup. |
| PZ9 | L1 4–9 (choosing) | **major** (showing how) | The storyboard calls this a "weak choosing cue". The scan hand is the right demo for a choice, but the feedback near the holes is weak. Near the right hole the floor warms only 15% (`nearHole`); the turn-to-fit does nothing for circles (P4, P7); a wrong hole gives no preview. From P6 on the colour cue is gone, in the same puzzle the triangle is first upside down. | `nearHole`: warmth 0.15 → 0.45 of `0xffc47a`, and scale the right hole's floor up to 1.04 at `m = 1` (it "opens" to her). Keep the floor tints one puzzle longer (P1–P6), so the first upside-down piece still has its colour cue. |
| PZ10 | L2 6, 7, 10; L3 2 (boxes) | minor (logic) | Every box has a white star decal on its front flap (`makeBox` tints a `star` node; QA L2 shots 4–5). In L2 6 the hidden star is in a box with a star on it; in L2 7 the empty red box shows a star while the triangle is in the blue one. A toddler reads a picture on a box as "what's inside". | `makeBox`: `if (P.star) P.star.visible = false` (or remove the node in `prop_puzzles.py`). Keep the knob. |
| PZ11 | L2 1–3, L3 1–2 | minor (logic) | The level's lids and blocks sit on the board from the start, each with a bright red knob, but touching one before its puzzle does nothing (no target). These are dead touches on the most tempting thing on screen. | In `build()`, make each lid and plug `pokeable`: a 0.3 s 4-degree rattle and `psfx.lidLift()`, no caption, no wrong count. `setupSteps` replaces this with the real drag in its puzzle. |
| PZ12 | L2 3–4, 9–10; L3 1–2 | minor (voice) | Repeated picture words (the storyboard is right): "A rocket!" twice, "A satellite!" twice, "A robot!" twice. "Satellite" is also not a toddler word. | L2 4 "A rocket nose!"; L2 10 "A wing!"; L3 2 "A robot tummy!" (caption only, as now). |
| PZ13 | L3 10 | minor (learning) | "A small square!": no big square is in play at that point, so "small" has nothing to compare with. | `name: 'Square!'`. |
| PZ14 | L3 4, 7, 8 (touching a locked piece) | minor (prompt) | "It is behind the glass!" and "It is locked!" are adult phrasing, and they say what is wrong instead of what to do. The peg case says nothing. | Glass: `sayOnce('Pull the string down!')`; lock: `sayOnce('Put the key in the lock!')`; peg: `sayOnce('Pull the peg up!')`. Delete the two old lines from the voice queue. |
| PZ15 | L2 6, 7, 10; L3 2, 6, 9 | minor (voice) | "Here it is!" (the peekaboo payoff) and "Not in here!" are `voice:false`. This is the emotional high point of a find, and it is silent. | `sayOnce('Here it is!')`, `sayOnce('Not in here!')` (voiced the first time in a level, then caption only). |
| PZ16 | every puzzle (demo) | minor | `puzzles.demo()` does not end on a touch, unlike the engine's `playDemo`. The hand keeps moving under her finger unless she starts a drag (`pick()` clears it), and the Go! badge waits for the full 2.5 s. | In `demo()`: `const off = input.onAny(() => { off(); fx.clearHands(); this.demoing = false; }); this.offs.push(off);`. |
| PZ17 | between puzzles | minor (pacing) | The door drops in 0.25 s and rises in 0.3 s, a snap every 5–10 s (rule 1 asks for 0.5–0.9 s). | 0.35 s down, 0.4 s up. This adds 0.2 s; the measured round-ready time stays under 1.6 s. |
| PZ18 | finale | minor | The last fit's picture word ("A ball!") is replaced about 0.3 s later by the finale line. | `fit()`: if `this.round === this.totalRounds`, say the picture word at 0.6 s and have `afterSuccess` wait 0.9 s before the finale. |
| PZ19 | L3 7 and finale | minor (check) | QA L3 shot 6: the seated big orange ball shows a pale crescent of its recess on the right. Either the piece is seated off-centre or it is perspective from the recess wall. | Check `fit()` seats at `(h.x, h.y)` against the board cut-out for `bigball` in `puzzles-layout.json` (the 0.05 dev check in design section 8). |
| PZ20 | engine comment | minor (docs) | `lesson.js` header: "still: … default 1.0; rule 6: never less than 1". The code default is 0.5, and rule 0 now governs. | Update the comment: "still: default 0.5; may be 0 when the payoff already holds the finished thing still for about 1 s (rule 0)". |
| PZ21 | L2 9 | minor (logic) | The optional panel lid can be taken off a puzzle early, which opens a rectangle lure for the square. The design intends this, but it is a third object in a wordless puzzle. | Keep it. With PZ5(d) a stuck child now hears "Pull the plug out!", which points at the right first step. |
| PZ22 | stuck ladder | minor (docs) | The real ladder differs from the storyboard. `demo()` sets the engine's `idle` back to ≤ 0.5 when its 8 s demo ends, so the engine's 12 s step fires at about 22 s and replays the hand (`showHint`: the last demo was 14 s earlier). "Bye bye" comes at about 57 s, not 45 s. Nothing here is harmful. | No change; correct the storyboard (S4). |

### Rewritten captions

| Old | New | Where | Voice |
|---|---|---|---|
| "Put the shape in its hole!" | L1 "Put the sun in its hole!" · L2 "Put the moon in its hole!" · L3 "Put the robot in its hole!" | P1 of each level, its 6 s cue | voiced (new) |
| "Which hole fits?" | "Find its hole!" | L1 4 | voiced (new) |
| "Open the lid!" | "Take the lid off!" | L2 4, L3 3, bump, 6 s cue, PZ4(c) | voiced (new) |
| "Take the block out!" | "Pull the plug out!" | L2 8, bump, 6 s cue | voiced (new) |
| ["Where did it go?", "Open the box!"] | "Where's the star? Open the box!" | L2 6 | voiced (new) |
| "Where did it go?" | "Where's the triangle? Open a box!" | L2 7 | voiced (new) |
| "Open the box!" | unchanged | L3 2, box 6 s cue | voiced |
| "Pull the string!" | "Pull the string down!" | L3 4, glass touch, 6 s cue | voiced (new) |
| "Where did it go?" | "Where's the star? Lift a cup!" | L3 6 | voiced (new) |
| "Use the key!" / "It is locked!" | "Put the key in the lock!" | L3 7, lock touch, 6 s cue | voiced (new) |
| "Pull the peg out!" | "Pull the peg up!" | L3 8, peg touch, 6 s cue | voiced (new) |
| "Where is the key?" | "Where's the key? Lift the cup!" | L3 9 (then "Put the key in the lock!" as the cue) | voiced (new) |
| (cup cue, one cup) | "Lift the cup!" | `SAY_STEP.cup` | voiced (new) |
| "It is behind the glass!" | delete (replaced by "Pull the string down!") | | |
| "Try another hole!" | unchanged | wrong hole | now voiced once per level |
| "Here it is!" / "Not in here!" | unchanged | boxes, cups | now voiced once per level |
| "A rocket!" (2nd) / "A satellite!" (2nd) / "A robot!" (2nd) | "A rocket nose!" / "A wing!" / "A robot tummy!" | L2 4, L2 10, L3 2 | caption only |
| "A small square!" | "Square!" | L3 10 | voiced |
| "You made a garden / rocket / robot!" + "Look what you made!" | the level line alone, as the admire line | finale | voiced |

Add the new lines to `tools/voice/new-lines.txt`. Remove "Which hole fits?", "Open the lid!", "Take the block out!", "Use the key!", "Where is the key?", "Pull the peg out!", "Pull the string!", "It is behind the glass!", "It is locked!" and "A small square!" if nothing else uses them.

---

## 3. Is each level truly easy enough at the start, and is every prep step shown and named first?

| Step | First met | Named before she must do it? | Shown before she must do it? | Verdict after fixes |
|---|---|---|---|---|
| fit | L1 1, L2 1, L3 1 | "shape" is abstract (PZ3) | hand drag; the piece doesn't move | OK with PZ3: forgiving drop, tap sends it, the piece named |
| choose | L1 4 | "Which hole fits?" is abstract | scan hand ✓ | OK with "Find its hole!" + PZ9 |
| lid | L2 4 (crooked, a corner of the hole shows ✓), L3 3 | "Open the lid!" doesn't match the movement | the hand moves, the lid doesn't | OK with "Take the lid off!" + `demoMove` |
| lid, wordless, hole fully hidden | L2 5 | no | no (8 s) | hard; OK with PZ4(c) + PZ5(d) |
| block (plug) | L2 8; L3 3 together with the lid | "block" ≠ round bung | the hand only | L3 3 lid only; "Pull the plug out!" + `demoMove` |
| box | L2 6, L3 2 | ✓ (in a two-line clash) | tap hand ✓; but the hide is unwatchable (PZ2) and the box shows a star decal | OK with PZ2, PZ7, PZ10 |
| two boxes | L2 7 | "Where did it go?" | the hide is unwatchable | OK with PZ2 (empty box closes first) |
| string | L3 4 | ✓ | the hand only; the glass doesn't rise | OK with `demoMove` (glass lifts 35%) |
| cups | L3 6 | "cup" never said | scan hand ✓; the hide plus swap is unwatchable | OK with PZ2 and no swap |
| key | L3 7 | "Use" has no movement | the hand only; key and padlock about 35 px | OK with the new line, `demoMove`, PZ6 |
| peg | L3 8 | "out" vs an upward demo | the hand only; peg tiny | OK with the new line, `demoMove`, PZ6, PZ1 |
| cup over key, then key | L3 9 | the cue says "Where is the key?" even after it is found | 8 s only | OK with PZ5(e) |
| string + lid, wordless | L3 10 | no | 8 s only | OK with PZ5(d) |

**L1** becomes a true errorless start once PZ3 is in: one dark open hole, a drop anywhere above the cupboard finishes the fit, and a tap works. **L2 and L3** each open with a single-hole fit (PZ8) and then add one new thing per puzzle. **L3 stays the stretch level.** Even after the fixes it asks for string, cups, key and peg in seven puzzles. That suits a child who already plays L2 with ease, and the help ladder keeps it from becoming a dead end.

---

## 4. The storyboard's "things that look off", checked

| # | Storyboard claim | Finding |
|---|---|---|
| 1 | `voice:false` on lines in the voice queue | **Partly confirmed.** "Try another hole!" and the bump lines are instructions and must be heard (PZ5c). "Here it is!" and "Not in here!" should be voiced once per level (PZ15). **Refuted for the picture words**: keeping them caption only is right for the voice budget (two voiced lines per fit, 30 per level, would bring back the "repeats so often" complaint). |
| 2 | Two instruction lines at once (L2 6) | **Confirmed**, and it also happens at the opening and at the finale (PZ7). |
| 3 | Wordless prep steps | **Confirmed** (L2 5, 9, 10; L3 10), and worse than stated: the 6 s cue is empty in those puzzles. The storyboard also missed L3 9's cue, which says "Where is the key?" after the key is found (PZ5d, e). |
| 4 | Weak choosing cue (L1 4) | **Partly confirmed.** The scan hand is the right demo. The weak parts are the near-hole feedback (15% warmth) and the open and closed holes looking alike (PZ3b, PZ9). |
| 5 | Repeated picture words | **Confirmed**, minor (PZ12). |
| 6 | Go! can show during the hiding moves | **Refuted.** `canGo()` needs `!this.busy`, and `startRound` keeps `busy` true until `hideP` ends. `goT0` is set only after the door is up, and the longest leftover hide is about 0.9 s, well under the 3 s cap. The *measured* L3 6 ready time of 1.55 s includes the whole hide. The real problem is that the hide is too fast to see (PZ2). |
| 7 | L3 8: 3.5–4.5 s she cannot act | **Confirmed**: 4.3 s by the code. The storyboard missed the other lock-outs: key 2.15–3.2 s, every lid or block about 2 s, wrong hole 2.3–2.8 s, drop on nothing 1.2–2.0 s (PZ1). |
| 8 | `still: 0` against the engine's 1 s comment | **Refuted as a defect.** The comment is stale (the code default is 0.5, and rule 0 now governs). The fit's payoff already holds the finished picture still for about 1.2 s while the friend beams and the door changes below. Keep `still: 0`; fix the comment (PZ20). |

### What the storyboard got wrong or missed

- **S1. The opening.** "Waits at most 2.2 s, then 0.6 s": the engine does not await the intro line, so puzzle 1 is live about 0.75 s after the game opens. This is good for rule 0, but it is what causes the opening double line (PZ7).
- **S2. Wrong hole, bump and drop timings.** These are 1.2–2.8 s with every target off, not "0.6 s" and "about 1.5 s" (PZ1).
- **S3. Lid and block flights.** These take about 2.0 s almost every time (the cap), not "0.6 to 2 s".
- **S4. The stuck ladder.** The engine's "12 s" step really comes at about 22 s and **does** replay the hand, and "Bye bye" comes at about 57 s (PZ22). Every spoken re-prompt within 30 s is silent (PZ5b). The 6 s step has no visual, because `nudge()` is empty.
- **S5. "Box flap closes 0.4 s… while she watches" / "Go! during the closing move".** The flap closes while the door is rising, so she barely sees it, and Go! comes after the move (PZ2, item 6 above).
- **S6. "The picture paints itself in over the hole".** The scene is fully painted from the start (`boardTexture`); a fit only removes that hole's dotted outline.
- **S7. "A tap on a piece presses it in".** It lifts out of the cupboard to the front plane and glides back (about 0.6 s). It never helps her.
- **S8. Things the storyboard does not mention at all:**
  - the five pre-tinted floors that read as holes (PZ3b);
  - the star decal on every box (PZ10);
  - the dead red knobs on the waiting lids (PZ11);
  - the 30 s rule muting shape names (PZ5a);
  - the far first drags (PZ3a);
  - the tiny fittings in the fixed view (PZ6).

## Voice clips (not counted as design issues)

All lines except "Bye bye! See you soon!" and "You did it! A sticker!" are waiting for clips. Until then every instruction is a silent caption, so this game depends heavily on its hand demos; PZ4's `demoMove` matters most while that is true.
