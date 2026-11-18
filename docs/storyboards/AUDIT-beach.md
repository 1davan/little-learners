# Audit: Beach world (patterns, where, more, body, sink)

Audited against `docs/storyboards/README.md` (the seven checks), `docs/FEEL-BRIEF.md`, `docs/SATISFACTION.md` and `docs/QUALITY-BRIEF.md`. I checked every storyboard claim that matters against `app/src/lessons/<id>*.js`, `app/src/engine/lesson.js`, `app/src/engine/speech.js` and `app/assets/voice/index.json`. Voice status was checked with the same key function the app uses (`voiceKey`: lower case, everything except `a-z 0-9 '` and spaces is stripped, so emoji vanish from the key).

The test throughout: would a 2-year-old know what to do, hear the word she is learning at the moment it happens, do the action with her own finger, and see what she made at the end?

Beat references are `L<level> #<row>` from the storyboard tables. "All" means every row of that kind.

| Game | Verdict | In one line |
|---|---|---|
| patterns | **needs work** (2 blockers) | The tune is a good learning device, but the captions are emoji strings, one voiced clip says "That's the shell. Find!", choices sit visible but dead during the pre-roll, and the parade the child built marches away before the finale. |
| where | **needs work** (closest to good) | The thought-bubble picture and real drag are strong. But a wrong drop is silent (the 30 s repeat rule eats the redirect), she never hears "Under!" when she gets it right, and every friend walks off. |
| more | **poor** | Her only act is one tap, then about 7 s of automatic show. "Fewer" is an adult word, L3 asks her to tell 4 from 5, and the finale has nothing she made. |
| body | **needs work** (close to good) | Concrete, fully voiced prompts and gear that builds up. But 40 of 42 wrong lines are silent and ungrammatical ("Find nose!"), the right word is never spoken, a toy shower buries each round, and the gear disappears when friends swap. |
| sink | **needs work** | The physics is lovely. But "Drop the duck" is really a tap that flies it in for her, "sink tub" collides with the kitchen sink, the guess prompt doesn't say what to tap, and there is a 6.5-8 s dead wait. In L3 the ball is always the answer and always on the left. |

---

## 1. Pattern parade (`patterns`): needs work

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| P1 | All levels, every round (#2-#7) | **blocker** | **Emoji in captions**, which breaks the parent's rule: the round-start caption (`"🐚 ⭐ 🐚 ⭐ ❓"`), the prompt (`"What comes next? ❓"`), the success caption (`"🐚 ⭐ 🐚 ⭐ 🐚!"`) and the wrong line (`"Find 🐚!"`). Source: `ICON` in `patterns.js`, used in `startRound`, `promptText`, `pick`, `pick→redirect`. | Delete `ICON` from every caption. Add `const SAY = { shell: 'shell', star: 'star', crab: 'crab', ball: 'ball', bucket: 'bucket' }`. Round-start caption (caption only): `p.seq.map((k, i) => i === gap ? '...?' : SAY[k]).join(', ')`, e.g. "Shell, star, shell, star, ...?". Success caption (caption only): the finished chant, e.g. "Shell, star, shell, star, shell!". `promptText()` returns "Tap the one that comes next!" or, for `gap` rounds, "Tap the one that's missing!" |
| P2 | All, wrong tap | **blocker** | **A voiced clip says nonsense.** The storyboard says no wrong line is voiced, but that is wrong. `"That's the shell. Find ⭐!"` and `"That's the starfish. Find 🐚!"` were generated with the emoji stripped, so the index holds the keys `that's the shell find` and `that's the starfish find`. Every wrong tap on a shell or starfish plays "That's the shell. Find!", whatever the answer is. The crab, ball and bucket versions are silent. | Replace the redirect with two short voiced lines: `this.redirect(\`That's the ${NAME[k]}!\`)`, then `this.say(\`Find the ${NAME[ans]}!\`)` (the engine queues the second after the first). Remove the two bad keys (`that's the shell find`, `that's the starfish find`) from `assets/voice/index.json`. |
| P3 | All, prompt | major | "What comes next?" doesn't name an action, and "next" is abstract to a 2-year-old. She has to infer that "next" means "tap something on the towel". | "Tap the one that comes next!" / "Tap the one that's missing!" (see P1). Keep the tune playing first, so "next" means "the next note" before she is asked. |
| P4 | L2 all rounds | major | **Visible but dead choices.** In L2 the choices pop onto the towel and then the tune plays for 2.0-2.4 s while `busy` is true. Her taps on the shiny new choices do nothing, and in round 1 the Go! badge has not shown yet either. | In `startRound`, for the train stage `await this.playTune(...)` **before** the choices pop in, so nothing tappable appears until it can be tapped. |
| P5 | L3 all rounds | major | **6.6-7.4 s pre-roll, and Go! flashes before the choices exist.** `checkGo` forces the badge at 6 s while `arrivePodiums` is still throwing, and no choices are visible yet. That breaks the brief's 3 s cap on pre-roll and is a false "your turn". | Shorten the arrival: drop the 1.4 s walk-in (the leader is already standing there), throw at 0.3 s per item and play the podium tune while the last throws land, for at most about 3.5 s. Separately, in `engine/lesson.js` `checkGo`, never force Go! while `this.busy` is true (or raise the force to 9 s). |
| P6 | All, right tap | major (satisfaction) | **The answer is thrown into place for her** (`landAt` toss). Her finger does a tap, and then the payoff happens to her. | SATISFACTION 6.1: drag the choice into the gap (the `marker` already pulses; add a drag with a zone at `slotPos`, magnet radius 1.2x). Keep tap as the fallback, but make the piece hop there at walking pace (0.8 s), not a 1.8-high throw. |
| P7 | All, after success; Ending | major (satisfaction) | **What she built marches away.** `afterSuccess→leave()` removes every finished parade. The finale sends the last one off too, so the 4 s "Look what you made!" and the gallery photo show an **empty stage with Pip**. That fails the end-frame test. | SATISFACTION 6.3: `leave()` moves the finished line to the back (z -3.5, scale 0.6) and keeps it. Delete the `leave(2.4, 16)` in `onFinale`. Add `creationView()` framing all parades, and `creationObjects()` returning every kept item, so the admire pokes play their notes. |
| P8 | L1 #5, L2 #5, L3 #5 (gag 3) | minor | `payoff()` gag 3 fires `fx.confetti` mid-round, which breaks E1 (confetti only in the finale). Gag 1 adds a row of ✦ floats on top of the tune. | Delete the gag table. The tune with the new piece hopping bigger is the payoff (rule 5: one reaction). |
| P9 | L3 #2 (demo) | minor | The L3 "scan" demo sweeps over the "?" and all three choices. To a 2-year-old that looks like "tap all of these". | For patterns, use the L1 demo at L3 too (hand taps the answer once), or skip the L3 demo. She has already learned the action. |
| P10 | L3 #7 | minor | The first missing-middle round is the last round of the game, with no demo. Her habit from 17 rounds is "the gap is at the end". | When the gap is not at the end, run `fx.ghostPath([marker], {mode:'tap'})` on the "?" once before Go!. Make it L3 R5 instead of R6, so she meets it with a round to spare. |
| P11 | L1 arrival | minor | The leader plays a quack or gull sound and the items each sing a ♪ float while landing, and then the tune plays again on success. That is a lot of notes before she acts. | Remove the ♪ floats on landing. Keep the notes. |

**Rewritten captions (patterns)**
- Round start (caption only, no emoji): "Shell, star, shell, star, ...?" (built from `SAY`)
- Prompt (voiced): "Tap the one that comes next!" / "Tap the one that's missing!"
- Wrong (voiced, two lines): "That's the starfish!" then "Find the shell!"
- Right (caption only): "Shell, star, shell, star, shell!"

---

## 2. Where's Crab? (`where`): needs work (closest to good)

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| W1 | L2 and L3, every "wrong" cell | **major** | **A wrong drop is silent.** The redirect line is the prompt text (`this.redirect(this.promptText())`). That prompt was voiced a few seconds earlier, so the 30 s repeat rule shows it as caption only. She hears nothing, so the place she chose is never contrasted with the place asked for. | `drop()`: `this.redirect(\`Oops, that's ${zone.id.toUpperCase()}!\`)`, then `this.say(this.promptText(), { repeat: true })`. That gives her the contrast ("Oops, that's ON!" ... "Put the duck UNDER the umbrella!"). |
| W2 | All, every "If right" cell | **major** (learning) | **The word she is learning is never heard when it happens.** "In!" / "On!" / "Under!" are caption only and not in the index. | `success(..., \`${WORD[want]} the ${PROP_NAME[prop]}!\`, { voice: true })`, e.g. "Under the umbrella!". Voice the 17 lines listed below. |
| W3 | L3 all rounds | major (learning) | The thought bubble shows the mini friend going to the right place **at every level**. So at L3 the task is "copy the picture", not "understand the word". This also contradicts the L3 demo, which deliberately does not show where. | At `this.level === 2`, don't call `showThought` in `startRound`. Show it from `nudge(1)` (6 s idle) or the first wrong drop instead. |
| W4 | All, after success | major (satisfaction) | **Friends walk off** to the left every round, and `setProps` pops the props away. The beach never fills up, and the finale shows one friend touring the places automatically. | SATISFACTION 7.1: one prop set per level, and friends stay where she put them (skip the hop-out and walk-off in `afterSuccess`, except where the next round needs that prop). |
| W5 | Ending (all levels) | major (satisfaction) | `onFinale` resets the covers, pulls the friend out of its spot and plays an automatic tour while "Look what you made!" shows. The photo is mid-tour, not her placement. | SATISFACTION 7.4: 10 s of free play (drag Crab anywhere, and each place says its word: the 17 "In the ..." lines), then `creationView()` over the full beach and the photo. |
| W6 | All, "If right" | minor | Too many payoffs stack per round: gag, `bumpBits`, `palJoins`, `storyPayoff`, a random hop of the loose bits, and a ✨ or ♪ float. That is 4-6 s of watching. | Keep the gag and the story payoff. Drop `bumpBits`' jump and the random bit hop, and give `palJoins` only to rounds whose story needs it. |
| W7 | L1 #3, L2 #4, L3 #3 ("look"); L1 #7, L2 #5 ("sun") | minor | Story payoffs are floating emoji glyphs with no link to her act: a ⛵ "in the distance" after putting the gull ON the chest, or a 😎. A 2-year-old can't connect them. The 💦, ☀️, 🙈, 🥱, 🍉, 💰, ⚽ and 👀 floats also render as system emoji, below the art bar. | "look": the friend on top shades its eyes and a real boat model sails past. "sun": the friend under the chair stops sweating (no emoji). Use model props or nothing instead of emoji floats. |
| W8 | L2 #4, L3 #4 | minor | "chest" sits next to a "box" in the same round (L2 R3). It is also a body word. | Say "treasure chest": "Put the gull ON the treasure chest!" / "Put the baby crab IN the treasure chest!" (new voice lines). |
| W9 | L2 #1, L3 #1 | minor | The intro "Let's play with Crab!" plays at L2, where Duck comes first. | Intro: "Let's play on the beach!" (new voice line), or a per-level intro. |
| W10 | L1, wrong place | minor (OK) | At L1 a drop on a non-asked place just hops home with no words. That's fine (errorless level). | No change. |

**Rewritten captions (where)**
- Wrong (voiced): "Oops, that's IN!" / "Oops, that's ON!" / "Oops, that's UNDER!", then the round's prompt again with `repeat: true`.
- Right (voiced): "In the bucket!", "On the castle!", "In the ring!", "On the towel!", "In the basket!", "On the chair!", "Under the umbrella!", "In the boat!", "On the chest!" (or "On the treasure chest!"), "Under the chair!", "In the box!", "Under the hat!", "Under the bucket!", "On the umbrella!", "In the chest!" (or "In the treasure chest!"), "Under the box!", "On the hat!"
- Intro: "Let's play on the beach!"

---

## 3. Which has more? (`more`): poor

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| M1 | All, "If right" | **major** (satisfaction) | **One tap, then about 7 s of show.** Pairing, extras, counts, links shrinking, the other row dropping, gobbling, a heart and the walk home all play automatically. She is a spectator. | SATISFACTION 8.1-8.3: after the pairing, stop and wait for her to **tap Gull** (a voiced "Feed Gull! Tap Gull!" the first time, then caption only). Each tap gulps one item, so she feeds Gull herself. Slow the links to one every 0.4 s, each a `sfx.step` note. |
| M2 | L3 #5, #6 and every wrong line | **major** | "**Fewer**" is an adult word (children usually understand it around age 4). It is in two L3 prompts and in **every** wrong line ("That one has fewer. Find more!"). | Remove the two "fewer" rounds. Replace them with "more" rounds: `[2, 5, 'fish']`, `[4, 2, 'icecream']`. Wrong line: "Not that one! Find more!" (voiced). If the parent wants "fewer" later, it belongs in a 3-year-old pack. |
| M3 | L3 #2, #3, #7 | **major** (learning) | **Differences of one at 4-5 items** (3 v 4, 5 v 4, 4 v 5) are beyond what most 2-year-olds can see at a glance. She will guess, and the 6 s nudge then hands her the answer. | L3 keeps the size and spacing traps but at a clear ratio: `[2, 5, 'cookie']`, `[6, 3, 'star']`, `[3, 6, 'ball', 'more', {scale:[1.35,0.7]}]`, `[2, 5, 'fish']`, `[4, 2, 'icecream']`, `[3, 6, 'shell', 'more', {spread:[1.35,0.75]}]`. |
| M4 | All, prompt | major | "More! Which has more fish?" starts with an exclamation that sounds like an answer, and doesn't name the action. Rounds over 30 characters silently drop the "More!" (L1 #5), so the wording changes from round to round. | `promptText()` returns "Tap the one with more fish!" (the same form every round). |
| M5 | All, "If right" | major (learning) | The red "+1", "+2" floats and the digit counts ("1", "4") are symbols a 2-year-old can't read. The word "more" is never spoken at the moment the extras stand out ("More!" is caption only, though the clip exists). | Delete the `+n` and digit floats. Let the extras wiggle and glow. `success(..., 'More!', { voice: true })`, timed to the extras' wiggle. |
| M6 | All, after success | major (satisfaction) | Nothing persists: the chosen row is eaten, the other row is dumped on the sand and popped next round, and Gull shrinks back to normal size in `afterSuccess`. | SATISFACTION 8.2 and 8.4: Gull's belly grows 6% per round and stays. The not-chosen group stays in its holder and is carried off at walking pace. |
| M7 | Ending (all levels) | major | "Look what you made!" plays over Gull dancing a circle. There is no creation and nothing to poke. | `onFinale`: a too-full Gull tries one flap, sits, burps softly and dozes. `creationView()` frames the round Gull. Admire pokes give a soft burp. |
| M8 | All, idle | minor | With only two choices, the 6 s nudge hops the right holder, so waiting gives the answer away. | Override `nudge(1)` for more: the eater looks from one holder to the other (no hop). Keep the hop for 12 s. |
| M9 | All, wrong | minor | On a wrong tap the eater looks at the **wrong** holder with a "?". | The eater looks at the wrong holder, shakes its head, then looks at the right one. |

**Rewritten captions (more)**
- Prompt (voiced): "Tap the one with more fish!" / "... more shells!" / "... more stars!" / "... more ice creams!" / "... more balls!" / "... more cookies!"
- Wrong (voiced): "Not that one! Find more!"
- Right (voiced, already in index): "More!"
- First feeding (voiced, once per game): "Feed Gull! Tap Gull!" (per level: "Feed Duck! Tap Duck!", "Feed Crab! Tap Crab!")

---

## 4. Bear's nose (`body`): needs work (close to good)

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| B1 | All, every "wrong" cell | **major** | Wrong line `"That's the <part>. Find <part>!"`: only tummy→nose and tummy→eyes are voiced, so the other **40 combinations are silent**. It is also ungrammatical ("Find nose!", "That's the eyes"). This is exactly where hearing the word teaches. | Split it into two voiced lines (14 clips instead of 42): `this.redirect(THAT[name])`, then `this.say(\`Touch the ${PARTS[this.part].word}!\`)`. `THAT = { nose: "That's the nose!", eyes: 'Those are the eyes!', ears: 'Those are the ears!', mouth: "That's the mouth!", tummy: "That's the tummy!", hands: 'Those are the hands!', feet: 'Those are the feet!' }`. |
| B2 | All, every "If right" cell | **major** (learning) | "Nose!", "Tummy!" and so on are caption only (and not in the index), so the word is not spoken at the moment of success. | `success(this.wp(a), \`${cap(w)}!\`, { voice: true })`. Voice the 7 single words. |
| B3 | All, "If right" | **major** (satisfaction) | **Toy shower** after every right answer: 3 flowers after a nose, 3 rubber ducks after a tummy. It has no link to the body part and buries the gear, which is the real reward. | SATISFACTION 9.1: delete `toyShower` except the feet (kick a ball) and hands (bat a ball) cases, which practise the part. |
| B4 | L2 #5, L3 #4, L3 #6 (friend change) | major (satisfaction) | The old friend shrinks to nothing, **taking its gear with it**. The build-up resets mid-level, so at the end only the last friend is kitted out. | The old friend walks to the back-left (scale 0.7) and keeps its gear. The finale `creationView()` frames all the friends of the level in their gear. |
| B5 | All levels #1 | minor | The intro "Hello Bear! Let's find nose and toes!" plays at L2 (Bunny) and L3 (Froggy), where Bear isn't there. Round 1 never says hello to the real friend (`if (r > 0)`). | meta intro: "Let's find nose and toes!" In `startRound`, say `Hello ${NAME[kind]}!` (voiced) for every new friend including round 1. Voice "Hello Bunny!" and "Hello Froggy!" ("Hello Bear!" and "Hello Kitty!" exist). |
| B6 | L1 all rounds | minor | **Storyboard is wrong here:** taps on non-live parts (Bear's eyes, mouth, hands at L1) do **nothing**. `pokeAt` excludes the friend from the generic poke. She pokes Bear's eye and gets no response. | At L1, register taps for all seven parts. Non-live parts call `react()` only, with no redirect line. |
| B7 | L2 #4, L3 #3 (mouth, tier 1) | minor | A first mouth touch shows a **scared** face, which reads as "no" on a correct answer. Nose tier 3 also goes scared before the sneeze. | Mouth tier 1: the `joy` face. Keep the sneeze's scared face only for wrong-answer touches. |
| B8 | L3 #2 (demo) | minor | The L3 scan demo touches three parts top to bottom. A 2-year-old copies it by tapping the first part. | Use the L1 demo (tap the target once), or no demo at L3. |
| B9 | All, fast taps | minor | While a reaction runs, every extra tap gives a bloop and a ✨. That makes sound spam. | Make extra taps silent during `animUntil`. |
| B10 | Ending | minor | The finale is automatic (the friend touches ears, tummy and feet while Pip hops). The title says "toes" but the part is "feet". | SATISFACTION 9.5: her taps on ears, tummy and feet drive the "head, tummy, toes" dance. Keep "feet" in all lines. |

**Rewritten captions (body)**
- Wrong (voiced, two lines): "That's the tummy!" / "Those are the ears!" (and so on), then "Touch the nose!" (one for each part)
- Right (voiced): "Nose!", "Eyes!", "Ears!", "Mouth!", "Tummy!", "Hands!", "Feet!"
- Intro: "Let's find nose and toes!"; per friend (voiced): "Hello Bunny!", "Hello Froggy!"

---

## 5. Sink or float lab (`sink`): needs work

| # | Beat | Severity | Issue | Exact fix |
|---|---|---|---|---|
| S1 | L1 #2, #4, #6, #8, #10, #12; L2 and L3 "drop" rows | **major** | **The word and the action don't match.** "Drop the duck in the water!" asks for a drop, but the action is a tap, and `dropIn` then flies the duck over for her. She doesn't do the experiment. | SATISFACTION 10.1: make the item a drag (`input.addDrag`, zone = the tank's water surface). On release over the tank it lets go at the finger's x. Crab covers its eyes while she holds it above the water (the beat). Tap stays as the fallback (the current arc). The voiced prompt then matches. |
| S2 | All "sort" rows, all wrong-sort cells | **major** | "**Sink tub**": to a 2-year-old a sink is the kitchen sink, and "float tub" is jargon. "Put it in the sink tub!" names a thing she can't picture. | Name the tubs by colour and pair the word with the result. L1 sort prompt: "It floats! Put it in the blue tub!" / "It sinks! Put it in the orange tub!" Wrong: "It floats! The blue tub!" / "It sinks! The orange tub!" Success caption: "In the blue tub!" / "In the orange tub!" Make sure the sink tub reads clearly orange (`0xff8a2a`, not coral). |
| S3 | L2 and L3 every "guess" row | **major** | "The apple! Float or sink?" doesn't say what to tap. The two signs are abstract (a ball on a wave, a **down arrow**), and predicting is the hardest idea in the game. | After the voiced item line, add the voiced "Tap a tub!". Replace the sink sign's arrow with a picture of a stone resting on the tank floor, and the float sign with a duck on water. |
| S4 | L2 and L3 guess "If right" | **major** | The code hard-codes "You think it floats!" / "You think it sinks!" as `voice: false` (`guess()`), even though both lines are queued in `new-lines.txt`, so they will never play. Hearing her own choice said back is what makes "were you right?" mean anything. | `this.say(..., { voice: true })`. Storyboard fix: the line shows for every guess, not "if right". |
| S5 | L2 and L3 every "sort" row | major | "Which tub does it go in?" is an abstract question with no action named. | "Where does it go? Tap a tub!" (voiced) |
| S6 | All, between drop and sort | **major** (pacing) | **About 6.5-8 s with nothing to do:** watch, the result line, 1.6 s look, lift out, drip, carry back to the crate, then the camera glides. The return trip to the crate is a pointless round trip. | SATISFACTION 10.2-10.3: after the result, the item stays in the water. She plays with it for up to 4 s (dunk; `dunk` already exists) and then **drags it out of the water straight to a tub** (the camera widens to tank plus tubs). Delete the `liftOut` return to the crate. |
| S7 | L3 #5, #9 | **major** (learning) | Both tests have the **same answer (the beach ball)**, and it is **always on the left**: `placeOnCrate(it, i ? 0.95 : -0.95)` with the ball at index 0. Two rounds teach "tap the ball on the left". | Shuffle the pair's sides. Bounce test: rubber ball versus a sponge (or rock), and make the rubber ball look different from the beach ball. Or make the roll test orange versus block, so the answers differ. |
| S8 | L3 #5, #9 | minor | The prompts "Which one rolls?" / "Which one bounces?" don't name the action. The wrong lines are stiff ("does not"). | "Which one rolls? Tap one!" / "Which one bounces? Tap one!"; wrong: "The block can't roll! Try the other one!" / "Thud! The rock can't bounce! Try the other one!" |
| S9 | All, idle | minor | Two hint systems stack. The engine ladder gives the prompt at 6 s, the prompt plus the hand at 12 s, and errorless at 20 s. The game's own demo plays at 8 s, then every 14 s. Result: the hand at 8 s and again at 12 s. | Set `this.showHint = null` for the engine ladder's 12 s step in sink (keep only the game's 8 s/14 s demo), or skip the engine's level-2 hint when `this.taught` is in use. |
| S10 | L2 and L3 result, wrong guess | minor | A wrong guess gives Pip a **scared** face and a gasp. "Surprise!" should be delight, not fear. | `setFace(pf, 'joy')` plus the gasp for "Surprise!". |
| S11 | All, result | minor | The ⬆ / ⬇ arrow floats over the tank are abstract symbols. | Remove them. The thing bobbing or lying on the floor is the result. |
| S12 | L3 #4 | minor | The big log shrinks in mid-air to fit the tub (visible magic). | Give the float tub room for the log (a wider tub at L3), or let the log lie across the tub's rim with a static rest. |
| S13 | Ending | OK | The tubs stay full and in frame. This is the one beach game whose end frame shows her work. | Add `creationView()` across both tubs (SATISFACTION 10.5) so the photo is framed on purpose. |

**Rewritten captions (sink)**
- L1 drop (voiced, keep): "Drop the duck in the water!" (valid once S1 makes it a real drop)
- L1 sort (voiced): "It floats! Put it in the blue tub!" / "It sinks! Put it in the orange tub!"
- Wrong sort (voiced): "It floats! The blue tub!" / "It sinks! The orange tub!"
- Right sort (caption only): "In the blue tub!" / "In the orange tub!"
- L2 and L3 guess (voiced): keep "The apple! Float or sink?" and similar, then "Tap a tub!"; her guess (voiced): "You think it floats!" / "You think it sinks!"
- L2 and L3 sort (voiced): "Where does it go? Tap a tub!"
- L3 tests (voiced): "Which one rolls? Tap one!", "Which one bounces? Tap one!", "The block can't roll! Try the other one!", "Thud! The rock can't bounce! Try the other one!"

---

## Storyboard corrections (the storyboards were wrong here)

- **patterns.md**, wrong-tap rows and line 8: "none of these lines is in the voice index" is false. The shell and starfish versions hit the keys `that's the shell find` / `that's the starfish find` and play a clip that says "That's the shell. Find!" (P2).
- **body.md**, every "If wrong" cell: "Touching a part that is not live in this level just gives the general poke" is false. The friend is filtered out of `pokeAt`, so nothing happens (B6).
- **sink.md**, L2 and L3 line lists: "You think it floats!" (her guess, **if right**). It shows for every guess, and it is `voice: false` in code (S4).
- **All five**, engine section: "Look what you made!" is described as never voiced. The code voices it once per session as soon as a clip exists. It is queued in `new-lines.txt` (lines 32 and 371, a duplicate).

---

## Lines that need voicing

Add these to `tools/voice/new-lines.txt` when the fixes land. None is in `assets/voice/index.json` yet. Wrong-answer and feedback lines are included wherever hearing them helps her learn.

**patterns**
- Tap the one that comes next!
- Tap the one that's missing!
- That's the shell!
- That's the starfish!
- That's the crab!
- That's the beach ball!
- That's the bucket!
- Find the shell!
- Find the starfish!
- Find the crab!
- Find the beach ball!
- Find the bucket!

**where**
- Oops, that's IN!
- Oops, that's ON!
- Oops, that's UNDER!
- In the bucket!
- On the castle!
- In the ring!
- On the towel!
- In the basket!
- On the chair!
- Under the umbrella!
- In the boat!
- On the chest!
- Under the chair!
- In the box!
- Under the hat!
- Under the bucket!
- On the umbrella!
- In the chest!
- Under the box!
- On the hat!
- Let's play on the beach!
- (if W8 is taken) Put the gull ON the treasure chest! / Put the baby crab IN the treasure chest! / On the treasure chest! / In the treasure chest!

**more**
- Tap the one with more fish!
- Tap the one with more shells!
- Tap the one with more stars!
- Tap the one with more ice creams!
- Tap the one with more balls!
- Tap the one with more cookies!
- Not that one! Find more!
- Feed Gull! Tap Gull!
- Feed Duck! Tap Duck!
- Feed Crab! Tap Crab!

**body**
- Let's find nose and toes!
- Hello Bunny!
- Hello Froggy!
- Nose!
- Eyes!
- Ears!
- Mouth!
- Tummy!
- Hands!
- Feet!
- That's the nose!
- Those are the eyes!
- Those are the ears!
- That's the mouth!
- That's the tummy!
- Those are the hands!
- Those are the feet!
- Touch the nose!
- Touch the eyes!
- Touch the ears!
- Touch the mouth!
- Touch the tummy!
- Touch the hands!
- Touch the feet!

**sink**
- It floats! Put it in the blue tub!
- It sinks! Put it in the orange tub!
- It floats! The blue tub!
- It sinks! The orange tub!
- Tap a tub!
- Where does it go? Tap a tub!
- Which one rolls? Tap one!
- Which one bounces? Tap one!
- The block can't roll! Try the other one!
- Thud! The rock can't bounce! Try the other one!
- (already queued, but the code must stop forcing `voice: false`) You think it floats! / You think it sinks!

Lines already voiced that the fixes reuse: "More!", "Hello Bear!", "Hello Kitty!", "Drop the duck in the water!" (and the other L1 drop lines), every current where/body/sink prompt, and "Look what you made!" (queued).

Remove from the voice index: `that's the shell find` and `that's the starfish find` (nonsense clips, see P2).

---

## Top 5 issues across the beach world

1. **Emoji captions and a nonsense voiced line in patterns (blocker).** Every patterns caption is an emoji string ("🐚 ⭐ 🐚 ⭐ ❓", "What comes next? ❓", "Find 🐚!"). The wrong-tap clip for a shell or starfish says "That's the shell. Find!", the same "Bubbles in" class of failure. (P1, P2)
2. **She doesn't hear the word at the moment it matters.** A wrong drop in where is silent (the repeated prompt is eaten by the 30 s rule). 40 of 42 body wrong lines are unvoiced and ungrammatical. The right-answer words ("Under!", "Nose!", "More!") are all caption only. (W1, W2, B1, B2, M5)
3. **She watches instead of doing.** more is one tap, then about 7 s of automatic show. In sink, "Drop the duck" is a tap that flies it in, followed by a 6.5-8 s dead wait. patterns throws the answer for her and leaves visible-but-dead choices during a pre-roll of up to 7 s. (M1, S1, S6, P4, P5, P6)
4. **Her work vanishes before "Look what you made!".** The patterns parade marches off, leaving the finale photo an empty stage. where's friends walk away. In more, nothing is made at all. body's gear disappears with each friend swap. Only sink's end frame shows her work. (P7, W4, W5, M6, M7, B4)
5. **Adult words and too-hard steps for a 2-year-old.** "Fewer" (two L3 rounds plus every more wrong line), "sink tub" (the kitchen sink), "Which tub does it go in?" and "Float or sink?" with no action named, more L3 asking 4 v 5, and sink L3 where both tests are "the ball, on the left". (M2, M3, S2, S3, S5, S7)
