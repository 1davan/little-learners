# Audit: Paint & mix (`paint`, Meadow)

I checked `docs/storyboards/paint.md` beat by beat against:
- the seven audit checks in `README.md`;
- `FEEL-BRIEF.md`, `SATISFACTION.md` and `QUALITY-BRIEF.md`;
- the design (`docs/design/paint.md`);
- the code (`app/src/lessons/paint.js`, `paint-canvas.js`, `paint-shapes.js`, `paint-studio.js`; engine `lesson.js`, `input.js`, `stage.js`).

I measured the camera framing with a copy of the game's own `fit()` (`views()`, FOV 40°) for the real fit points at 1366×768, 1280×800, 1920×1080 and 1024×768. The code was not run on screen, so the framing numbers still need a check with `tools/qa-shots.sh`.

Missing voice clips (`[pending voice]`) are **not** counted as issues. The 90 s idle timeout is the engine default and is **not** an issue.

Severity:
- **blocker:** she can get stuck, or the game can't go on.
- **major:** it hurts understanding, learning or satisfaction in a way she will notice.
- **minor:** polish.

## Verdict: **needs work** (1 blocker, 7 major, 11 minor)

The core idea is right, and the parent's main rule holds. I checked every path:
- `helpOnce()` is dead code.
- Every demo and hint runs with `real = false`, so it is a ghost hand only.
- `act()` is autoplay only.

So nothing paints by itself. Paint appears only under her finger, the toy stays painted, and the wall of eight is a real end frame.

What lets it down:
- The toy is far too small.
- Three hints point at the wrong thing:
  - In the L2 stamp step, the hint teaches the brush.
  - In L3, when the brush runs empty, the hint points to a pot instead of the dish.
  - In L1 round 8, no hint shows at all.
- Mixing does not visibly follow her stirring.
- Every wrong-colour message is silent text.

### Top 8 issues
1. **The toy is about 31% of the screen height, and wide toys only 16–23% (major, P1).** The target is 45–55%. Two things fix it: the layout in the "Toy size" section below (measured at 49–50%), and scaling the wide toys up.
2. **L2 round 7, "Add three white spots!", is a dead end (blocker, P2).** There is no stamp demo. When she is stuck:
   - the hand taps the white pot, which dips the brush;
   - then the hand rubs a zigzag over the whole mushroom, which leads her to brush white over her red top;
   - brush taps never count as spots.
3. **In L3, when the brush runs dry, the last pot used bobs and the dip hand taps it, instead of the dish (major, P3).** This happens in nearly every L3 round. It teaches her to paint the fish yellow.
4. **Mixing isn't visibly hers (major, P4).** About 1 s into rubbing, the dish already looks fully mixed. The game still wants about 2.7 world units of rubbing, and nothing shows that progress. If she lifts when it looks done, nothing happens. Rubbing straight on after the second dab doesn't stir.
5. **Wrong colour: a silent caption, and the "2 wrongs → lids" help never fires (major, P5).** The redirect runs once per round, so `cur.wrong` never reaches 2. The help then comes only after 20 s of no touching, which never happens while she is busy painting the wrong colour.
6. **L1 round 8 ("Which one?") has no help of any kind (major, P6).** The storyboard says Pip hops, but he doesn't: the game's `nudge()` override returns early. At 20 s the errorless step bobs a *pot*, not a toy.
7. **Painting feel (major, P7).**
   - The stroke (0.17 world units, about 32 px) is narrower than her fingertip (about 45 px), and it sits exactly under the finger, so the fresh paint is hidden.
   - The colours are pastel, and yellow barely shows on birch wood.
   - A tap must be under 0.25 s, so her slower taps make a small dab instead of a splat.
8. **The L3 round 8 refill (major, P8).**
   - Pip spends about 28 s walking to and fro behind the easel while she paints.
   - Dishes appear from nowhere.
   - Touching an empty saucer only shows silent text.

Next after these: the instant "Hang it up!" in L2 round 8 (P9), the "No orange!" lines (P10), and the friend swap that may clip (P15).

---

## The storyboard's broken list: confirmed or refuted

| # | Storyboard claim | Finding |
|---|---|---|
| 1 | Fixed 25% finish may block the splat and stamp rounds | **Partly confirmed, not a blocker.** `free`, `splats`, `orStamps` and `choice` are never read, and every free round ends at 25% (`updateDone`).<br>Measured on the coverage grid:<br>• A splat covers about 8% of the fish, so about 4 splats with no overlap reach 25%.<br>• A stamp dot covers about 4% of the car, so about 7 dots are needed. A dip holds only 6 prints, so she needs a second dip.<br>With real toddler overlap that is about 6–8 taps, or 10–14 dots. That is slow, but she can't get stuck. Minor (P11). |
| 2 | Silent wrong-colour caption | **Confirmed, and worse.** `afterGesture()` calls `redirect('')` and then `say(cap, { voice: false })`. The storyboard also says that 2 wrong colours put the lids on. That never happens (P5). |
| 3 | Stamp demo missing in L2 | **Confirmed, and worse.** The stuck hint actively teaches the wrong tool, and brush taps never count (P2). |
| 4 | L1 round 8 has no hints | **Confirmed.** The storyboard's "Pip hops" is wrong: the game's `nudge()` override returns early when `nudgeTarget()` is null, so nothing moves. At 20 s, `makeErrorless()` bobs a pot (P6). |
| 5 | L2 round 8 step 3 finishes at once | **Confirmed.** `st.tail` means `ok = true`, and the finger has already been up for 1.2 s, so `readyToHang()` fires on the first frame. "Hang it up!" replaces "Add some spots!" (P9). |
| 6 | L3 saucers never refilled until round 8 | **Refuted as a bug.** It is true that `saucersFull()` is never called, but the design wants it that way. Design 3.7 says: "The saucers are the recipe book, not a shortcut". Remixing each time is what L3 teaches. The real problem is that touching a used saucer gives only the silent "All gone. Make more!" (P8). |
| 7 | "No orange!" is odd | **Confirmed.** So are "No green!" and "No pink!" (P10). |
| 8 | Pip refills off camera | **Mostly refuted.** Only the start of the first trip happens while the camera is on the wall. All three trips (about 9.5 s each, about 28 s in total) then play in the paint view. Pip crosses behind the easel and puts the dish down about 25 px from the right edge of the screen. The real problems are the 28 s of background walking, the slow arrival of the colours, and dishes appearing out of nowhere (P8). |
| 10 | The Go! badge does not gate her | Not an issue. This is the engine's rule 0: taps never wait. |

The storyboard also missed these: P1 (measured size), P3, P4, P5 (no errorless), P7, P12, P13, P14, P15, P16, P17, P18 and P19.

---

## Issues

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| **P1** | All levels, paint view | major (camera, rule 3) | **The toy is too small.** The measured toy height as a share of the screen at 1366×768:<br>• ball, star and pig: 31%;<br>• duck: 23%;<br>• fish, goldfish and car: 17–18%;<br>• rainbow: 15.6%.<br>1280×800 and 1920×1080 are within ±1 point of these. The number of pots makes no difference, because the height is what limits the fit: the sign's headroom points (y 2.15 and 2.45) at the top and the pot row at z 0.95 at the bottom. Wide toys are scaled by width to 1.26, so the fish is only 0.70 tall. In L3 the dish is 17% of the screen width (the design says at least 22%). | See **Toy size: the layout** below. |
| **P2** | L2 R7 step 2 | **blocker** (showing how, logic) | "Add three white spots!" needs the stamp, but:<br>• `teachFor()` teaches the stamp only when `rd.teach === 'stamp'`, which is L1 R6 only.<br>• `actionKey()` returns `'dip'`, so the hand taps the white pot and the brush loads white.<br>• Then it returns `'rub'`. `this.ask` is null in the spots step, so the zigzag crosses the whole mushroom, red top included.<br>• At 20 s, the lids go on the red and blue pots, but she still has no stamp.<br>• Brush taps make white splats that never count. Only `tool === this.stamp` snaps to a ring.<br>• The ring snap radius is 0.12 in toy units (about 30 px at today's framing). | 1. `beginStep()`: when `st.spots`, `bobThing(this.stamp.obj, 3)` as now, then `if (!this.shown.has('stamp')) this.teach('stamp')`. The `stamp` demo already goes block → `demoPot()` (white) → toy.<br>2. `actionKey()`: first line `const s = this.stepNow(); if (s && s.spots) return 'stamp';`<br>3. `nudgeTarget()`: `if (s && s.spots && this.tool !== this.stamp) return this.stamp.obj;`<br>4. `makeErrorless()`: in a spots step, `this.swapTo('stamp')` (a tool swap, not painting), then put lids on the wrong pots.<br>5. `tapToy()`: in a spots step, a white brush splat whose centre is on the cap also snaps to the nearest empty ring and counts (draw `stamp()` there instead of `splat()`). Widen the snap: `let bd = 0.35;`, so any print on the cap snaps.<br>6. Caption: **"Stamp three white spots!"** (replaces "Add three white spots!"). |
| **P3** | L3 R1–R7 painting step | major (logic) | After the mix, the brush is loaded straight from the dish by `loadTool()`, so `lastPot` is still the last pot she dipped (yellow, say). When the load runs out:<br>• `emptyBrush()` sets `bobPot = lastPot`, so the yellow pot bobs;<br>• the stuck `dip` demo uses `demoPot()`, which falls back to `lastPot`, so the hand taps yellow;<br>• `nudgeTarget()` does the same.<br>All three send her to the wrong colour, then she gets the head-shake. Only `want()` (autoplay) knows to say `'dish'`. | Add `paintSource()`: `if (this.level === 2 && this.dish?.made && this.ask && this.dish.res === this.ask.col) return this.dish;`<br>• `emptyBrush()`: if `paintSource()`, bob the dish (`bobThing(this.dish.obj, 2)` and repeat in `update()` the way `bobPot` does) instead of setting `bobPot`.<br>• `demo('dip')`: when `paintSource()`, `ghostPath([dish centre], { mode: 'tap' })`.<br>• `nudgeTarget()`, `'dip'` case: `return this.paintSource()?.obj ?? …`<br>• `revealMix()`: set `this.lastPot = null`. |
| **P4** | L3 mixing (R1–R7) | major (satisfaction: is it hers?) | **The colour doesn't follow her stirring.**<br>• `addStir()` fills the well with the result colour at alpha 0.05 on *every frame the finger moves*, so after about 1 s (60 frames) the dish is about 95% the result colour.<br>• `prog` still needs 0.85 × 3.2 ≈ 2.7 units of rubbing (about 2–4 s more), and nothing shows that progress.<br>• If she lifts when it *looks* done, `stirRelease()` does nothing.<br>• After the second dab with her finger still down, `stirring` stays false, so rubbing straight on does nothing until she lifts and touches again.<br>• The tap fallback (`stirTap()`) makes the brush go round half a circle by itself. That is acceptable as a fallback, but it should not be the easy path. | In `addStir(d, dth, at)`:<br>• `st.prog += d / 2.0` (the beat comes at 1.7 units, about one slow circle);<br>• replace the 0.05 fill with `c.globalAlpha = Math.min(0.2, 1.5 * d);`, so the colour depends on distance, not frames, and about 5% of the parent colours is left at 2 units;<br>• draw the parent streak dabs with radius `5 * (1 - st.prog)`, so the streaks visibly thin out as she stirs.<br>At the end of `touchDish()`: `if (st.b && this.g?.down) { this.stirring = true; st.last = null; }`.<br>`stirTap()`: add 12% per tap, not 20% (8 taps), so rubbing stays the quicker way. |
| **P5** | L2 R1–R8 and L3 painting, wrong colour | major (voice, showing how) | `afterGesture()` gives one silent caption ("Duck is yellow!") per round. `redirect()` counts `cur.wrong`, but it is called only once per round, so `cur.wrong >= 2 → errorless()` never fires. The idle ladder's 20 s errorless step never comes while she is painting. She can scrub blue on the duck for minutes, and the only cue is the yellow pot bobbing (only while her brush holds another colour). | In `afterGesture()`, count the wrong lifts: `this.wrongLifts = (this.wrongLifts \|\| 0) + 1` (reset in `beginStep()`).<br>• First wrong lift: as now, but `this.say(cap, { voice: true })`, and the right pot (or the dish in L3) bobs.<br>• Second wrong lift: `this.errorless()` (lids on the wrong pots; L3 already has `mixErrorless()`).<br>The redirect lines stay as written and become voiced (see captions). |
| **P6** | L1 R8 (Which one?) | major (showing how) | A new action (choosing by tapping a toy) has no hand, no glow and no bob. `actionKey()` and `nudgeTarget()` both return null for `'pickToy'`. The game's own `nudge()` override returns early, so Pip does not even hop. At 20 s, `makeErrorless()` takes the free-round path and `bobThing(demoPot())` bobs a *pot*. | `actionKey()`: `case 'pickToy': return 'pick';`<br>`demo('pick')`: `fx.ghostPath(this.choices.map(t => toyCentreWorld(t)), { mode: 'scan', maxDur: 2.4 })`. `startChoose()`: `if (!this.shown.has('pick')) this.teach('pick');`.<br>`nudge()` in `'pickToy'`: bob the three toys one after another (`bobThing(t.group, 1, 0.08)` at 0.35 s spacing).<br>`makeErrorless()` in `'pickToy'`: put a halo on all three toys and replay the scan. Never choose for her. |
| **P7** | Every painting beat | major (feel) | See **Painting feel** below:<br>• the stroke is narrower than her finger and hidden under it;<br>• the colours are pastel;<br>• `TAP_T = 0.25` turns her taps into dabs, which also makes the L1 R4 splat hint replay (`surface.splats < 2`). | Dab 0.17 → **0.22** world. Deeper colours. `TAP_T` 0.25 → **0.4**, `TAP_D` 0.08 → **0.12**. Details below. |
| **P8** | L3 R8 (rainbow), L3 saucers | major (pacing, logic) | `pipRefills()` makes three trips of about 9.5 s each, so Pip walks for about 28 s behind the easel while she paints. The first full saucer arrives about 9 s in.<br>The visible stack of six dishes runs out by about round 5 (each level needs nine or more). After that:<br>• `takeDish()` makes new dishes that pop up at the stack spot;<br>• `pipRefills()` makes a dish at the world origin (0, 0, 0), in front of the easel, which then flies to Pip.<br>Touching a used saucer (R1–R8) says the silent "All gone. Make more!" | • In `onPeg()` before round 8 (camera on the wall), fill the orange, green and purple saucers in place: `saucersFull()` plus `fillWell(sc.st, sc.col)`. Delete `pipRefills()`.<br>• When round 8 starts, the three full saucers bob once in turn, 0.35 s apart, with one `plip` each. That is the cue.<br>• `makeDishes()`: build 10 dishes in the stack (0.03 step), or have a new dish rise out from under the stack (0.4 s). Never use `S.makeDish()` without a position.<br>• `touchSaucer()` on a smear: its dots pulse, and the game speaks that saucer's **recipe line** (voiced; it is the instruction for how to get the colour back) instead of "All gone. Make more!". |
| **P9** | L2 R8 step 3 | minor (logic, voice) | "Add some spots!" is caption-only and has no goal. The sign rises in the same breath, and the stamp is never offered. | Delete the `{ tail: true, say: 'Add some spots!' }` step from `L2[7].steps`. The beak finishes the round. The stamp is still in the block, and she can decorate before she taps the sign. Remove the line from `tools/voice/new-lines.txt`. |
| **P10** | L3 R1, R2, R4, R5, R6 intros | minor (voice) | "The fish is orange. No orange!", "No green! Let's make green.", "No pink! Let's make pink." say "no" right next to the colour she is meant to make. "Make green!" and "Let's make green." say the same thing two ways. | One form for every intro: **"Let's make orange!"**, **"Let's make green!"**, **"Let's make purple!"**, **"Let's make pink!"**. Pip looking along the pots (`look: true`) shows that the pot is missing. |
| **P11** | L1 R4, R6 | minor (pacing) | The `splats` and `orStamps` thresholds in the round table are dead config. "Tap, tap, tap!" and "Try the stamp!" need 25% coverage, which is 6–8 splats or 10–14 dots plus a second dip. Also, "Paint it all!" at 6 s is the wrong nudge in a tapping round. | `updateDone()`:<br>`if (rd.splats) ok = sf.splats >= 3 \|\| sf.coverage() >= 0.25;`<br>`if (rd.orStamps) ok = sf.stamps >= 4 \|\| sf.coverage() >= 0.25;`<br>In those rounds the 6 s line is the round's own line ("Tap, tap, tap!" or "Stamp, stamp, stamp!"), caption only. |
| **P12** | L1 R6 | minor (prompt, showing how) | "Try the stamp!" is abstract ("try"). The stamp is not bobbed in L1. | Caption: **"Tap the stamp!"** (voiced). At step start `bobThing(this.stamp.obj, 3)`, as in L2. After her first stamp dip: **"Stamp, stamp, stamp!"** (voiced once). |
| **P13** | L3 R1 (and every first-mix round) | minor (voice) | There are up to 7 voiced lines in about 20 s: the 2 intro lines, "Red!", "Yellow!", "Stir!", the recipe line and "Paint the fish orange!". The engine queues lines rather than cutting them, so "Stir!" can arrive after she has already started stirring. | In L3, colour names on dips are caption only: `loadTool(..., { voice: first && this.level < 2 })`. The recipe line already names both colours. |
| **P14** | L3 wrong mix (R4, R5, R7) | minor (logic) | `revealMix()` loads the brush with the wrong colour, then awaits the recipe line (up to 3 s) before it checks `want`. During those 3 s she can paint orange onto the green turtle. | Check `want` before `loadTool()`. A wrong mix never loads the brush. Replace "We need green." (silent) with the voiced **"Let's make green!"** (the same clip as the intro). |
| **P15** | L2 R2–R4, R6→R8 friend swaps | minor (clipping, rule 6) | `setFriend()` runs the old friend's `friendLeave()` and the new friend's `friendArrive()` at the same time, on the same back-edge lane (z −1.05). The duck hops down to (4.3, meadow) while the frog hops up to (3.0, 0), so they very likely pass through each other. The new model also arrives about 3 s after the instruction. | The leaver walks out along z −1.05. The new friend waits on the table at (3.0, 0, −0.45), out of frame to the right, and walks in on lane z −0.45, starting 0.3 s after the leaver. With the P1 friend spot (1.6), the walk is 1.4 units, about 0.95 s. Check with `qa-shots` at the swap. |
| **P16** | L1 R8 | minor (framing) | The two toys she didn't choose stand at (−1.38, −0.22) and (−2.0, −0.22), in front of Pip (−1.52, −0.85), and hide his lower half. | Send them to the right of the easel on the table at (1.3, 0, −0.7) and (1.85, 0, −0.7). L1 has no friend there. |
| **P17** | Every hang | minor (satisfaction, rule 6) | The toy lands on its peg, and in the same 0.3 s the next blank toy rises and the pots move. The camera leaves about 0.65 s later. There is no moment to look at the wall. | `success(..., { still: 1.0 })`, and start `setupRound(next)` 0.6 s after `onPeg()`. Her next chance to act stays under 1.5 s after the hang. |
| **P18** | L1 R1–R8, L2 | minor (pacing) | Every round ends with two taps: the sign, then the toy or peg. This is the parent's rule, so keep it, but the sign is what forces the headroom in P1. | Move the sign as in the layout below, onto the board's top-right corner. Same rule, no headroom needed. |
| **P19** | L3 mixing | minor (sound, rule 7) | Stirring has no sound, so the mute test and the sound test disagree with the brief's "one soft sound per action". | Optional: a very quiet wet "squish" whose volume follows the finger's speed in the dish (`psfx`, 0.08, 400–900 Hz low-pass noise), stopped at the beat. |

---

## Toy size: the layout (P1)

**Why it is small today.**
- The fit is limited by height:
  - at the top, the sign's headroom (y 2.45) and the brush headroom (y 2.15);
  - at the bottom, the front of the pot row (z 0.95 + 0.27 at y 0).
- The camera rises steeply (dir 0, 2.05, 5.0, about 22°), so the pot row sits a long way below the toy on screen.
- Removing pots changes nothing.
- Wide toys are normalised to 1.26 wide, so they are short.

**Level 1 and 2 (one station).**

| Thing | Now | New |
|---|---|---|
| Easel | (0, 0, −0.6) | (0, **0.15**, −0.6), on a low wooden riser (part of the `prop_pt_easel` legs) |
| Pot row | z 0.95, gap 0.64 | z **0.35**, gap **0.60**, centred (5 pots = ±1.47) |
| Tool block | in the front row at x up to 2.37 | **Gone from the row.** The brush rests on the easel ledge's left end (as now). The stamp stands in a small cup on the ledge's right end (x 0.88). The ledge corner is free: square toys are round at the bottom, and wide toys hang high. Tap the stamp to swap. |
| "Hang it up!" sign | rises above the board's top edge (y up to 2.45) | Drops into the board's **top-right corner, in front of the board** (s 1.45–1.72, x 0.62–0.95), 0.32 across. The hit radius stays at `minSide × 0.08`. |
| Pip | (−1.52, 0, −0.85) | (−1.6, 0, −0.85) |
| Friend or card | (1.82, 0, −0.75) | (1.6, 0, −0.75). Its edge is still outside the board by more than 0.15. |
| Fit points | board corners plus headroom 2.15 and sign 2.45, margin 42 | Board window x ±0.8, s 0.2–1.75; pot row; Pip; friend. **No headroom points.** Margin 32. |
| Camera | dir (0, 2.05, 5.0), look (0, 0.8, −0.25) | dir **(0, 1.25, 5.0)** (about 14°), look (0, 0.95, −0.3). It fits to about pos (0, 1.54, 3.04) and look (0, 0.72, −0.24). |
| Toy scale | max 1.26 by width | Per toy: `toy.group.scale.setScalar(Math.min(1.55 / w, 1.3 / h))`, which scales the fish, duck, car, bird and rainbow ×1.23. `screenToToy` and `toyWorld` already go through the group matrix. |

**Measured with the game's `fit()`** (5 pots, worst case):

| Screen | Square toy (1.26–1.3 tall) | Wide toy (fish ×1.23) | Pots to toy-bottom gap |
|---|---|---|---|
| 1366×768 | 49% height (was 31%) | 33% height, 33% width (was 17.5%) | 82 px, no overlap |
| 1280×800 | 49% (was 31%) | 32% height, 36% width | 84 px |
| 1920×1080 | 50% (was 32%) | 33% height, 34% width | 118 px |
| 1024×768 (not in the brief) | 42% | 28% | 68 px |

The brush handle can leave the top of the frame while she paints the toy's top edge. That is acceptable: the handle is not a target.

**Level 3 (two stations; FEEL rule 3: glide between stations).**
- **Mix view:** keep `view.mix`. The dish and the open pots fill the frame.
- **Paint view:** easel at (0.55, 0.15, −0.6). The mixing dish moves to (−0.95, 0, 0.35), just left of the easel's front: it is the paint source in this step. Friend or card at (1.95, 0, −0.75).
  - The pots, the dish stack and the saucer row sit further left and back, and are framed only by the mix view.
  - The glide to the mix view starts on her first dab (as now). The glide back starts 0.2 s after the colour appears (as now).
  - Measured:
    - 1366×768: toy **45%** of the height, dish **23%** of the width (was toy 17–31%, dish 17%);
    - 1280×800: 45% and 26%;
    - 1920×1080: 46% and 24%.
- **Rainbow (R8):** the three pots and the three full saucers stand in one front row (6 items, gap 0.6), framed with the L1 layout. The rainbow is scaled ×1.23. That gives about 43% for a square toy and about 30% for the short rainbow; the rainbow is short by nature.

**Small targets that grow with this:**
- Pip's beak (0.35 × 0.28 world) goes from about 55 × 45 px to about 105 × 85 px.
- The apple leaf (0.43 × 0.30) grows the same way.
- The mushroom rings go from about 30 px snap radius to about 47 px (and to the whole cap with P2).
- Rainbow bands (0.08 world) go from about 15 px to about 30 px. Still thin: band 4 should be merged so the arch has 4 bands. In `prop_paint.py`, use `six equal bands` → 4 bands of 0.12, and done at 3 of 4.

---

## Painting feel (P7): does it feel great to a 2-year-old?

**What is good.**
- Paint is opaque, laid at every pointer sample (coalesced events) with dabs every 9 px, so there are no gaps.
- Speed changes the width by ±12%. A dry brush shows bristle gaps. Mirror painting on the butterfly is a lovely surprise.
- Burnt lines and the face always stay on top.
- One dip covers 4–6 toy widths, so re-dipping is rare but real.
- One soft `swish` per stroke, and `pat` for splats.
- The strokes stay on the toy, and the toy is frozen to its own texture and hung.
- The mute test passes.

**What isn't.**
1. **Brush size.** The dab is 0.17 world, about 32 px at today's framing. A toddler's fingertip covers about 45 px. With `TIP_PX = 0` (the parent's rule: paint exactly under the finger), the fresh paint is under her finger and narrower than it, so she sees the trail only after her finger has moved on. The fix:
   - Make the `strokeTo` default `world = 0.22`. With P1 framing that is about 66 px, wider than her finger, so colour shows on both sides as she rubs.
   - Keep the cost per area the same: `rate *= 0.17 / 0.22` in `paintTo()`.
   - Grow the splat to 0.32 and the stamp to 0.24 world.
2. **Colour richness.** `COLOURS` are light pastels: red `#ff5a5a` (coral), blue `#4a90ff`, green `#5fd068`, purple `#9b6bff`. Yellow `#ffd23f` on birch `#f3e0bd` shows very little change. Use thick poster-paint values in `paint-shapes.js`. The pots, dish and L3 mixes all read this one table, so "the mixed colour is the pot colour" still holds:
   - red `#e8302a`
   - yellow `#ffbf00`
   - blue `#1f66e5`
   - green `#1fae4b`
   - orange `#ff8000`
   - purple `#8a3fdc`
   - pink `#ff6fae`
   - white `#ffffff`

   Check the toy under toon shading in a mid-stroke screenshot. If the gradient map greys it, give the toy material `emissive` 0x202020.
3. **Taps.** `TAP_T = 0.25 s` is short for a 2-year-old, whose taps take 0.2–0.45 s. A slower tap leaves one small dab instead of a splat. Set `TAP_T = 0.4` and `TAP_D = 0.12`.
4. **Texture sharpness.** At 50% height the toy is about 380–540 px on screen against a 512 working canvas, and about 2× that on HiDPI screens, so it will look soft. Try `N = 768` in `paint-canvas.js` and keep the 20 ms frame check (design 8.6).

---

## Mixing (P4, P13, P14): is it clearly hers?

**Partly.**

What is hers:
- She dips a pot and touches the dish: two dabs, two puddles.
- She rubs, and the swirl follows her `dθ`.
- The new colour appears when **she lifts**, after a beat.
- Nothing is dabbed or stirred for her. The demos and errorless steps are ghost hands or lids only.

What breaks the ownership:
- **The transformation is time-driven, not motion-driven.** The dish looks finished after about 1 s of any rubbing, and then it is a dead wait with no visible progress. If she lifts at the moment it looks done, nothing happens.
- After the second dab, she has to lift and touch again before stirring counts.
- The tap fallback (`stirTap()`) stirs half a circle by itself for 20% a tap, so 5 taps finish it. That is the lazy path, and it is the robot's motion, not hers.
- With the P4 fix:
  - the colour turns in proportion to the distance she rubs;
  - the streaks thin as she goes;
  - one slow circle (about 1.7 units) is enough;
  - stirring carries on straight after the second dab;
  - taps add 12% each.

  Then every bit of colour change on screen comes from her finger.
- Keep the camera glide to the mix view on her first dab and the beat before the reveal. Both are good.

---

## Rewritten captions

| Where | Now | New | Voice |
|---|---|---|---|
| L1 R6 | "Try the stamp!" | **"Tap the stamp!"** | voiced |
| L1 R6 after her first stamp dip; L1 R6 stop-early line | (none) / "Paint it all!" | **"Stamp, stamp, stamp!"** | voiced once, then caption |
| L1 R4 stop-early line | "Paint it all!" | **"Tap, tap, tap!"** (existing clip) | caption |
| L2 R7 step 2 | "Add three white spots!" | **"Stamp three white spots!"** | voiced |
| L2 R8 step 3 | "Add some spots!" | delete the step | n/a |
| L2 and L3 wrong colour | "Duck is yellow!", "Frog is green!", "Pig is pink!", "Crab is red!", "The apple is red!", "The leaf is green!", "The flower is pink!", "The stem is green!", "The top is red!", "Pip is yellow!", "The beak is orange!", "The fish is orange!", "The grapes are purple!", "The turtle is green!", "The pumpkin is orange!", "The carrot is orange!" | same words | **voiced** once per round (was silent) |
| L3 R1 intro | "The fish is orange. No orange!" + "Let's make orange." | **"Let's make orange!"** | voiced |
| L3 R2 intro | "No green! Let's make green." | **"Let's make green!"** | voiced |
| L3 R3 intro | "Let's make purple." | **"Let's make purple!"** | voiced |
| L3 R4 intro | "Make green!" | **"Let's make green!"** | voiced |
| L3 R5 intro; R7 step 1 | "Make orange!" | **"Let's make orange!"** | voiced |
| L3 R6 intro | "No pink! Let's make pink." | **"Let's make pink!"** | voiced |
| L3 wrong mix | "We need green." / "We need orange." / "We need purple." / "We need pink." (silent) | **"Let's make green!"** etc. (the intro clips) | voiced |
| L3 used saucer | "All gone. Make more!" (silent) | that saucer's recipe line, e.g. **"Red and yellow make orange!"** | voiced |
| L3 colour names on dips | "Red!", "Yellow!"… voiced once per level | same | **caption only in L3** |

`tools/voice/new-lines.txt`:
- **Add:**
  - "Tap the stamp!"
  - "Stamp, stamp, stamp!"
  - "Stamp three white spots!"
  - "Let's make orange!"
  - "Let's make green!"
  - "Let's make purple!"
  - "Let's make pink!"
- **Remove:**
  - "Try the stamp!"
  - "Add three white spots!"
  - "Add some spots!"
  - "The fish is orange. No orange!"
  - "Let's make orange."
  - "No green! Let's make green."
  - "Let's make purple."
  - "No pink! Let's make pink."
  - "Make green!"
  - "Make orange!"
  - "We need green."
  - "We need orange."
  - "We need purple."
  - "We need pink."
  - "All gone. Make more!"
  - "The spots are white!" (never used)

All other lines stay.

---

## Pacing check (rule 0)

**Round start to first possible touch.**
- About 0.3 s at level start.
- About 0.65 s after each hang: the next toy rises during the 0.3 s settle, and `startRound` waits at most 1.2 s for it.
- With P17 this becomes about 1.25 s. That is still within the 1.5 s rule.

**Waits with nothing to touch.**
- The beat and the hang-view glide: about 1.15 s.
- L1 R8 toy drop: 1.2 s. She can already tap a toy that has landed.
- A wrong mix (0.8 + 0.9 + 0.8 s) does not block her: she can dip pots meanwhile.

**Long background motion.**
- L3 R8 Pip trips: about 28 s, removed by P8.
- Friend swaps: about 6 s, overlapping her painting, shortened by P15.

Nothing exceeds 2 s of forced waiting.

## Learning and progression

- **L1** teaches the marks (dip, rub, splat, stamp, mirror, choice) one idea at a time. Good.
- **L2** moves from one-part toys with a living model, to two parts with a card, to counting three. Good. Its weak points are the stamp step (P2) and the silent correction (P5).
- **L3** goes from recipes taught with only the right two pots open, to choosing the pair, to a new recipe (pink), to two mixes, to free play. Good. Its weak points:
  - the empty-brush hint points away from the dish (P3);
  - the stirring doesn't show the change happening (P4).
- Saucers that keep their recipe dots are a good "recipe book". With the voiced recipe on touch (P8), they actively teach.
