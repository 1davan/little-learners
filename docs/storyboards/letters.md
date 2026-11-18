# Letter friends (id: `letters`)

- **World:** the building site (World 5; home tile "Letter train!", coral). Its own scene: a little railway station (platform, striped rug, a blue box (the station trunk) in front and to the right of the rug, never over a carriage; a toy train with an engine on the left and four carriages). Pip is the station porter, small (0.5x), beside the box and always inside the frame.
- **Learning goal:** know the capital letters by name and sound. Meet each letter friend and its things, sort things to the letter they start with, find a named letter, and pick the thing that starts with a friend's sound ("mmm... moon!").
- **Levels:** 3 (chosen by the parent).
  - L1 "Meet the letters": **4 rounds**, one per letter. Each round is one tap on the box, then three drags.
  - L2 "Which letter?": **6 rounds**, one action each.
  - L3 "First sounds": **6 rounds**, one action each.
  - About 1 to 1.5 minutes per level (see "Timings").
- **Sets:** each level plays one set of four letters. A level's first play is **set 1 = A, B, M, S**. The next set comes when a level is **finished** (its finale, store `lettersSet[level]`), so a quit or a "Bye bye!" replays the same set. This file storyboards set 1 in full.
- **Source:** `app/src/lessons/letters.js` (with `letters-data.js`, `letters-stage.js`, `letters-sound.js`); engine `app/src/engine/lesson.js`, `speech.js`. This loop is the rebuilt core proposed in `AUDIT-letters.md` section 3.

## How to read the tags

- `[voiced]` means the exact line has a recorded clip in `app/assets/voice/index.json`. Only three lines in this game have one: "Try the other one!", "You did it! A sticker!" and "Bye bye! See you soon!".
- `[pending voice]` means the line is queued in `tools/voice/new-lines.txt` but not generated yet. Until then it shows as a silent caption of about `max(1.4 s, 0.085 s per character + 0.6 s)`.
- **Letter names** are queued with spoken forms ("Ay", "Bee", "Em", "Ess").
- **Letter sounds** are lower case in the captions ("a, a, a!", "b, b, b!", "mmm!", "sss!"), so a grown-up reading them aloud says the sound, not the name.
  - The 16 stop and vowel sounds, and their sound-word lines, are queued with spoken forms that cannot be read as a name: "aa", "eh", "ih", "aw", "uh", "buh", "kuh", "duh"…
  - Each has a note naming its anchor word and forbidding the letter name.
  - Before `index.json` takes these clips, someone listens to all 16 sound clips and their sound-word clips. Any that fail get spliced: the onset cut from the word clip three times, then the word.
- A line already spoken in the last 30 s is caption only, except lines she asks for herself (names and sounds on a tap or pick-up).

## Behaviour shared by every round

- **Rule 0 (no waiting).** Nothing walks or rolls in from far away. The friends ride on their decks from the start, and the train is at the station when a level opens. The next round is laid out during this round's success beat. Things are live (draggable) the moment they land. No line, roll, tumble or demo ever holds input.
  - Taps open 0.3 s into every round.
  - The "Go!" badge shows once per round, from the engine, at 0.3 s (or after the first demo, at most 2.5 s). In this game it sits at the bottom centre, over the empty floor band (never over a letter friend's face).
- **Camera.** Low, at about 21–22°. Every view is fitted at run time to the real camera and the window's aspect, so at 1280x800, 1366x768 and 1920x1080 everything it needs is whole on screen: the top 15% is kept for the caption, and the bottom 13% for the Go! badge.
  - L1 and L3 use one fixed view: the station carriage with its friend, the rug, the box and Pip. The train rolls through it.
  - L2 uses one fixed view of **all four carriages** (the train never moves in L2), with the rug, the box and Pip.
- **The letter friend.** A chunky capital with a face, two shoes and its own colour (A coral, B blue, M green, S orange). It sways a hair when idle.
  - A tap (not as an answer): it rocks and says who it is, its **name** in L1 and L2 ("M!") or its **sound** in L3 ("mmm!").
  - A held sound (M, S) shivers the body. A stop sound (A, B) nods three times.
  - The friend on the carriage a thing comes near leans in, and its flap lowers. Each flap carries a big lower-case tag (a, b, m, s) at its centre.
- **Names and sounds (one rule everywhere).**
  - The **name** says who a friend is: at its round start in L1, in "Where is S?", and on a poke.
  - The **sound** links it to its things. Every placement is the friend saying the sound-word ("a, a, a... apple!"). Things with no clean first sound (Q, X, ice cream, owl) get the name and then the word: "O!", then "Owl!".
- **Things.** A model about 0.8 tall.
  - **Out of the box:** each thing rises straight up out of the box (0.3 s), then makes one arc to its rug spot (0.75 s). Props turn once on the way; animals hop. A soft landing squash.
  - Things leave 0.35 s apart. The farthest spot fills first, so nothing ever flies through a thing on the rug.
  - **Picked up:** a thing says its name ("Apple!"), unless it has just said it.
  - **Tapped without dragging:** its own silent show (bounce, rock, wobble, spin…) and its name. In L3 a tap chooses it.
  - **The sock** lies on its side on the rug (it stands up as it flies to its seat).
  - **Animals** (bear, monkey) are never lifted. They walk after the finger and hop up onto their seat.
- **Placing a thing.**
  - It arcs into the next free seat (0.5 s), shrinking to 0.69x (tall things such as the teddy 0.57x, and deep things set back, so nothing pokes through the sill or reaches the friend's feet). If the carriage is still rolling in, the arc follows it, so nothing jumps.
  - A wooden clonk and the next note of a rising run. The last placement of the level lands on the top note.
  - The friend smiles, rocks and says the sound-word. Nothing placed ever comes out again.
- **Instructions.** Every instruction is action + object + result in toddler words.
  - Each line is voiced in the level's first two rounds. After that it is caption only, unless she is stuck.
  - **The target glows or bobs from the round start:**
    - The box knob has a glow and the lid bobs every 1.4 s.
    - Live things hop in turn every 1.4 s.
    - The L2 thing has a halo.
- **Hand demos.** These are slow and use the real object. Each kind of action is shown the first time it comes up in a level (so in round 1):
  - a tap on the box knob;
  - a drag of a thing to its carriage (in L2 and L3 the right flap also glows, so round 1 shows the answer);
  - a scan over the friends for "Where is S?".
  - A demo plays again after **8 s with no touch**. Any touch of hers resets that clock, and any touch ends a demo at once. There is no input lock.
- **Stuck ladder (no touch).**
  - **6 s:** the prompt again, **voiced** (the first re-prompt of a round), and the target hops high and glows for 3 s. In L2 the right friend also rocks and its clue thing hops.
  - **8 s:** the hand demo.
  - **12 s:** the prompt again (caption) and hop + glow. In L2 the right friend says its clue's sound-word.
  - **16 s:** the demo again.
  - **20 s:** errorless. The step does itself. In L1 it keeps going, one thing every 6 s, up to four steps.
  - **45 s:** "Bye bye! See you soon!" `[voiced]`, home. The set does not advance.
- **Wrong answers.** These are gentle and never lock.
  - **L2:** the wrong friend shakes its head and the thing goes home. With all four carriages in play, that friend says "Not me!" `[pending voice]` ("Try the other one!" `[voiced]` is kept for a two-carriage choice). From the first miss only the right flap opens and that friend rocks.
  - **One ring at a time:** the round's target has one halo; the hand shows the way to the carriage; no second or third ring.
  - **L3:** the thing wobbles and says its own sound-word ("b, b, b... ball!"), then the friend says its sound again. From the first miss only the right thing stays draggable, and it glows and hops.
  - **"Where is S?":** the wrong friend says its name and shakes its head. The right one rocks and glows.
- **Right answer.** No praise word, no confetti. The friend's sound-word, the rising note, and Pip nods or claps once.
  - The payoff is the train chuffing on and the next things popping out.
  - The next round starts after 0.6–1.0 s of payoff plus 0.5 s still, while the next carriage is still pulling in.
- **Opening of every level.** Pip waves, a hello jingle, and the caption "All aboard the letter train!" `[pending voice]` (never waited for). Round 1 starts 0.75 s after the game opens.

## Level 1: Meet the letters (morning sky, red and yellow train, cream rug)

The level looks like this at the start:
- The train stands at the station with **carriage A** at the station spot (left of centre). All four friends are aboard.
- The box is shut at the right, with its knob glowing.
- The sign shows A B M S.
- The rug is empty.

| # | What the child sees | Narrator says | Prompt: what she must do | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 A | Carriage A at the station; A on its deck rocks. The box knob glows; the lid bobs every 1.4 s. | A: "A!" `[pending voice]` (its name; not awaited) | **Open the box** (tap). Live at 0.3 s. | "Open the box!" `[pending voice]` after the name. Hand demo (round 1 only) taps the knob. Go!. | A held-breath squash (0.3 s), a latch click, and the lid swings open. Apple, ant and ambulance pop out 0.35 s apart, landing left, middle and right. The first is draggable about 1.3 s after her tap. | 6 s: voiced "Open the box!", lid bob and knob glow. 8 s: hand. 20 s: it opens itself. | Next beat. |
| 1 (cont.) | The things on the rug hop in turn. | "Put them on the train!" `[pending voice]` (at the first landing) | **Drag each thing into carriage A** (any order). | Hand demo (round 1 only) drags the first thing into the carriage. A's flap lowers as a thing nears. | Picked up: "Apple!" `[pending voice]`. Landing: clonk + note; A smiles, rocks and says "a, a, a... apple!" `[pending voice]`. After the **last** one: the flap shuts, the box closes, and the train chuffs one carriage on (1.76 s). | Dropped on nothing: it slides home (an animal walks home). 6 s: voiced prompt, the next thing hops high and glows. 8 s: hand. 20 s: one thing goes in by itself every 6 s. | Round 2 opens 1.1 s after the last landing; carriage B is still pulling in. |
| 2 B | Carriage B arrives; B rocks. | "B!" | Open the box, then drag ball, banana and bear (the bear walks after her finger and hops onto its seat). | Prompts voiced (2nd round); no hand demo unless stuck. | "Ball!" / "b, b, b... ball!", "Banana!" / "b, b, b... banana!", "Bear!" / "b, b, b... bear!". Train on. | As round 1. | Round 3. |
| 3 M | Carriage M; M rocks. | "M!" | Open the box; moon, milk, monkey. | Prompts now caption only (voiced again when stuck). | "mmm... moon!" etc. Train on. | As round 1. | Round 4. |
| 4 S | Carriage S; S rocks. | "S!" | Open the box; sun, sock, snail. | Captions. | "sss... sun!" etc. The train does **not** roll after the last letter. | As round 1. | Finale. |

- **Ending:** the finale.
  - Caption "All aboard!" `[pending voice]` (voiced once).
  - The train chuffs to its photo spot, centred over the rug; the box shrinks away and Pip walks out of the shot. The camera glides 0.9 s to the whole train (fitted: engine to last carriage at about 90% of the width, the rug whole beneath it): engine and four carriages, each with its friend and its three things.
  - 6 s of admiring with "Look what you made!": she can poke anything. A friend rocks and says its name; a thing hops with its note and its sound-word; the engine toots and rolls back 0.4.
  - Shutter, photo, "You did it! A sticker!" `[voiced]`, home. The set advances.
- **Per letter:** 1 tap and 3 drags (was 7 to 10 actions in 4 gestures).
- **Every narrator line (L1, in order):** "All aboard the letter train!" · "A!" · "Open the box!" · "Put them on the train!" · "Apple!" · "a, a, a... apple!" · "Ant!" · "a, a, a... ant!" · "Ambulance!" · "a, a, a... ambulance!" · "B!" · … · finale: "All aboard!" · "Look what you made!" · "You did it! A sticker!" `[voiced]`.

## Level 2: Which letter? (midday sky, green and cream train, striped blue rug)

The level looks like this at the start:
- The whole train is at the station, all four carriages in view, the last one ending left of the box. Every friend is on its deck.
- **A clue thing rides in every carriage:** ambulance in A (A's third thing, so banana never sits beside apple), ball in B, moon in M, sun in S.
- The round's thing already stands in the middle of the rug.

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | All four carriages. Banana on the rug, with one halo, bobbing. | "Banana!" (it hops), then "Put it on the train!" `[pending voice]`. Then the four clues introduce themselves, each hopping as its friend says the sound-word ("a, a, a... ambulance!", "b, b, b... ball!", "mmm... moon!", "sss... sun!"; input open; stops once she places it). | **Drag the banana to B's carriage.** Live at 0.3 s. | Hand demo (round 1) drags it to B (the answer is shown). The nearest flap lowers and its friend leans in. | Clonk + note; B rocks and says "b, b, b... banana!". During the beat the box pops out the **ant** to the middle of the rug. | Any other carriage: that friend shakes its head and says "Not me!"; the banana slides home; from now on only B's flap opens and B rocks. 6 s: voiced prompt; banana hops high; B rocks and the ball hops. 12 s: B says "b, b, b... ball!". | Round 2 opens 1.1 s after the landing. |
| 2 | Same view. Ant on the rug. | "Ant!", "Put it on the train!" (voiced, 2nd round) | Drag the **ant** to A. | Halo and bobs. | "a, a, a... ant!"; the **sock** pops out. | As round 1. | Round 3. |
| 3 | Same view. Sock on the rug. | "Sock!", "Put it on the train!" (caption) | Drag the **sock** to S. | | "sss... sock!"; **milk** pops out. | As round 1. | Round 4. |
| 4 | Same view. Milk on the rug. | "Milk!", "Put it on the train!" | Drag the **milk** to M. | | "mmm... milk!"; the **bear** hops out. | As round 1. | Round 5. |
| 5 | Same view. The bear on the rug. | "Bear!", "Put it on the train!" | Drag the **bear** (it walks after her finger and hops up) to B. | | "b, b, b... bear!". | As round 1. | Round 6. |
| 6 | Same view. No thing. | "Where is S?" `[pending voice]` ("Where is Ess?") | **Tap S.** | Hand scan over the four friends (first time). Go!. When stuck, the hand taps S. | S hops, rocks and says "S!"; **it hoists its own yellow flag** on its carriage's corner post (0.8 s; it stays). | Wrong friend: says its name, shakes its head, "Where is S?" caption; S rocks and glows. 20 s: S answers itself. | Finale. |

- **Ending:** the same finale as L1. The S carriage keeps its flag.
- **Every narrator line (L2, in order):** "All aboard the letter train!" · "Banana!" · "Put it on the train!" · "a, a, a... ambulance!" · "b, b, b... ball!" · "b, b, b... banana!" · "Ant!" · "a, a, a... ant!" · "Sock!" · "mmm... moon!" · "sss... sun!" · "sss... sock!" · "Milk!" · "mmm... milk!" · "Bear!" · "b, b, b... bear!" · "Where is S?" · "S!" · finale lines. Wrong: "Try the other one!" `[voiced]` (2 carriages) or "Not me!" (3).

## Level 3: First sounds (golden afternoon, blue and white train, green rug, two lanterns)

The level looks like this at the start:
- Camera `letter`, with carriage A at the station; every friend is aboard.
- **Apple and ball already stand on the rug** (left and right).
- Each round's wrong choice is the next round's answer. So only one or two new things pop out per round, and the train never rolls more than two carriages.

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 A | Apple and ball on the rug, both bobbing. | Tells first: the apple hops "Apple!", the ball hops "Ball!". Then A nods "a, a, a!" `[pending voice]` and says "Put mine on the train!" `[pending voice]`. | **Drag (or tap) the thing that starts like A.** Live at 0.3 s (nothing waits for the lines). | Hand demo (round 1) drags the apple into A's carriage, with A's flap glowing. | Apple arcs in; A rocks and says "a, a, a... apple!". During the beat the train rolls one carriage to B (1.76 s), and the **moon** pops out to the left spot and says "Moon!" as it lands. | Ball: it wobbles, says "b, b, b... ball!", and A says "a, a, a!" again. Only the apple stays draggable; it glows and hops. 6 s: voiced "a, a, a!" + "Put mine on the train!"; the apple hops high and glows. 20 s: it goes in by itself. | Round 2. |
| 2 B | Ball and moon. | (after "Moon!") B: "b, b, b!", "Put mine on the train!" (voiced, 2nd round) | Choose the **ball**. | | "b, b, b... ball!"; roll to M; **sock** pops out ("Sock!"). | Moon: "mmm... moon!", then B "b, b, b!". | Round 3. |
| 3 M | Moon and sock. | M: "mmm!" (body shivers), "Put mine on the train!" (caption) | Choose the **moon**. | | "mmm... moon!"; roll to S; **milk** pops out. | Sock: "sss... sock!", then "mmm!". | Round 4. |
| 4 S | Sock and milk. | S: "sss!" | Choose the **sock**. | | "sss... sock!"; the train rolls **back** one carriage to M; **ant** and **banana** pop out ("Ant!", "Banana!"). | Milk: "mmm... milk!", then "sss!". | Round 5. |
| 5 M | Milk, ant, banana (three choices). | M: "mmm!" | Choose the **milk**. | | "mmm... milk!"; the train rolls back two carriages to A (2.9 s); the **sun** pops out. | Ant or banana: its sound-word, then "mmm!". | Round 6 opens 1.5 s after the landing; A is still pulling in (about 1.4 s more). |
| 6 A | Ant, banana, sun. | A: "a, a, a!" | Choose the **ant**. | | "a, a, a... ant!". | Banana or sun: its sound-word, then "a, a, a!". | The two things she did not choose (banana, sun) hop back into the box (1.6 s), then the finale. |

- **Ending:** the finale.
  - The train chuffs to the same photo spot as the other levels (about 1.4 s, under "All aboard!"). The two lamp posts shrink away.
  - Pokes: a thing says its sound-word; the engine toots.
- **Every narrator line (L3, in order):** "All aboard the letter train!" · "Apple!" · "Ball!" · "a, a, a!" · "Put mine on the train!" · "a, a, a... apple!" · "Moon!" · "b, b, b!" · "b, b, b... ball!" · "Sock!" · "mmm!" · "mmm... moon!" · "Milk!" · "sss!" · "sss... sock!" · "Ant!" · "Banana!" · "mmm... milk!" · "Sun!" · "a, a, a... ant!" · finale lines. Wrong answers add the wrong thing's sound-word and the friend's sound.

## Timings (measured, set 1, real pointer events)

Measured by playing every level with real pointer events (Electron `sendInputEvent`, a driver that taps or drags like a child) and logging `window.__lt` in the lesson: round start to the first moment taps are open and a target is live, and every stretch over 2 s with nothing live.

- **Round start to first touch: 0.30 to 0.32 s in every round.** 58 rounds in all: set 1 L1, L2 and L3 three times each at two speeds, plus L1 set CDHP and L3 set FLTG. The 0.3 s is the engine's tap gate.
- **Waits over 2 s with nothing live: none.** The longest are:
  - the L1 box tap to its first landing, about 1.3 s;
  - a success beat, 1.1 s (1.5 s after a two-carriage roll), plus 0.3 s.
- **Level length, game open to finale, set 1.** The finale adds about 9 s.

| Level | Quick child (acts 0.7 s after a target is live) | Slower child (acts after 2 s) | Rounds × actions |
|---|---|---|---|
| L1 | 44 s | 63 s (73 s with a deliberate 10 s stuck pause in round 2) | 4 × (1 tap + 3 drags) |
| L2 | 25 s | 33 s | 6 × 1 (with one wrong try in round 1) |
| L3 | 25 s | 34 s | 6 × 1 (with one wrong try in round 1) |

- **With looking, pokes and misses:** a real 2-year-old who stops to look, pokes friends and misses a drop lands in the 1 to 1.5 minute target. Before the rebuild, a level took about 3 to 4 minutes and had about 50 waits over 2 s.
- **Stuck test (L1 round 2, no touch):**
  - "Open the box!" is voiced again at 6 s.
  - The hand taps the glowing knob at 8 s.
  - Her first touch ends the demo, with no lock.

## How the other sets differ

- **Order of sets:**
  - L1 and L2 play CDHP, FLTG, RNEJ, WKOZ, IVYB and UQXS after ABMS.
  - L3 plays CDHP, FLTG, RNEJ, WKOZ, **IVYB** and **UKPS**: one vowel per set, and no Q or X, which have no sound.
  - A set with a letter that has fewer than two ready things is skipped.
- **Same skeleton:** the rounds are built from letter *positions* 1 to 4.
  - **L2:** clues are the third thing of letter 1 and the first thing of letters 2 to 4. The sorts are the second things, B, A, D, C. Round 5 is the first available of B3, C3, D3, or A's first thing.
  - **L3:** first things, then second things, with each round's distractor as the next round's answer.
- **Letters with two things** (U, Q, X, Z): their L1 round is one tap and two drags. In L2, round 5 picks another letter's thing.
- **Name-only things** (ice cream, owl, xylophone, x-ray): L1 and L2 only. The friend says its name and then the word ("O!", "Owl!") instead of a sound-word.
- **Always the same:** the shared behaviour, the three level looks, the finale, and all the fixed prompt lines.

## Known limits

- **Voice clips are still pending**, apart from three lines. Until they are generated every instruction is a silent caption, so the hand demo, glow and bobs carry the "what to do". The stop and vowel sound clips must be checked by ear before they go in.
- **One two-carriage roll** (L3 before round 6) takes 2.9 s. To keep rule 0, the round opens after 1.0 s of it, while the carriage is still pulling in. Her thing is live and follows the carriage if dropped early. (L2 never rolls.)
- **L2 is a four-way choice from round 1** (all four carriages are in view and take a drop, so no carriage is ever hidden or cut). The round-1 demo shows the answer, and from the first miss only the right flap opens.
- **The shared engine model (`prop_engine`)** still has its scratchy boiler strokes; it is shared with patterns and words, so it was left to its owner.
