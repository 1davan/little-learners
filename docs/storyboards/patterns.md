# Pattern parade (id: `patterns`)

- **World:** Beach (world id `beach`), "Patterns!" (icon 🔴). Source: app/src/lessons/patterns.js and patterns-stage.js.
- **Learning goal:** picks what comes next (or what is missing) in a repeating pattern of beach things.
- **Levels:** 3 (chosen by the parent), 6 rounds each. Each level has its own stage: L1 boardwalk, L2 toy train, L3 striped podiums.
- Meta intro line: "Let's make a pattern!" [voiced]
- **No emoji anywhere in this game's captions.** The pattern is captioned in words ("Shell, star, shell, star, ...?"). The two bad clips that said "That's the shell. Find!" were removed from the voice index (fix pass, 19 Nov).

## Engine behaviour that applies to every round (engine/lesson.js)

- **Go! gate:** taps open as soon as the round is laid out (the choices exist). The "Go!" badge waits for the demo hand (max 2.5 s) and is forced at 3 s.
- **One hand demo per game:** at the start of the first round the hand shows the move once (2.5 s; a touch ends it). Here every level uses the same demo: the hand drags the right thing into the "?" (the old L3 scan over all the choices looked like "tap all of these").
- **Idle ladder (resets on every touch):** 5 s prompt again + nudge 1 (the answer hops); 8 s prompt again (voiced again) + nudge 2 (hop + 3 s halo) + the hand demo again; 20 s errorless (wrong choices shrink and go dead) + prompt; 90 s "Bye bye! See you soon!" then Home.
- **Voice:** a line is voiced only if its text is in assets/voice/index.json; the same line at most once per 30 s unless the game asks for a repeat.
- **Success** (quiet): caption only, Pip turns and nods or claps, the game's payoff (the tune), then 1 s of stillness, then the round change.

## How a patterns round works (all levels)

- Camera 3.2 high, 12.4 back, looking at the row (y 1.95). Pip stands in front of the stage's left end (x -5.3, whole on screen, hat brim included). The finale view pulls back on narrower (4:3) screens so the engine, podium ends and Pip stay in the photo. The choices sit big on a striped towel at the bottom, on its white stripes (x = -2.2 / +2.2, or -2.2 / 0 / +2.2). The towel colour changes every round; the order of the choices is shuffled.
- Each kind has a note: shell 0, starfish 2, crab 4, beach ball 5, bucket 7. Every arrival of a thing in the row plays its note, so the arrival IS the tune.
- Every thing sits exactly on its surface (measured from its own bounds) with a soft contact shadow.
- **The empty slot:** a white ring with a dark rim (reads on the planks) and a round "?" badge. It appears only once the row is complete; it pulses on every "tick" and swells when a dragged thing comes near.
- **Rule 0 (no waiting):** the "?" and the choices appear the moment the round starts and take touches at once (round-start to input-ready: 0-15 ms at every level). The parade arrives underneath while she can already drag; if she places the answer before the parade has finished arriving, the piece waits on its spot until the row is complete, then the finished tune plays. The ring under the "?" shows once its wagon / podium is there.
- **Caption at round start (caption only):** the pattern in words, e.g. "Shell, star, shell, star, ...?" (the missing-middle round: "Star, ...?, star, crab, star, crab").
- **Prompt (voiced):** "Tap the one that comes next!" / "Tap the one that's missing!" (L3 round 5).
- **What she does:** drags the thing from the towel into the "?" (magnet near the ring). A plain tap still works: the thing then hops to the gap at walking pace (about 4.5 units/s, never a throw). A drop anywhere else sends it home on a low arc.
- **Wrong (tap, or a drag onto the "?"):** the thing shakes its head with a soft off-note and goes home; after 0.6 s the bit of the parade just before the gap sings again with a tick on the "?". Two short voiced lines, one after the other: "That's the starfish!" then "Find the shell!" (the second is voiced even if heard in the last 30 s). 2nd wrong: errorless (no extra prompt on top of "Find the ...").
- **Right:** the other choices shrink away slowly (0.5 s); the "?" closes; the leader waves its flag (the engine gives a bump on the train). The whole parade sings its pattern left to right while the piece travels (one pass, at most 1.5 s, beat = min(0.3 s, 1.5 s / length)), timed so the new thing's own note sounds as it lands, and it hops highest. If she answered before the parade had finished arriving, the rest of it arrives 5x faster (the gap's podium rises at once; on the train the piece hops onto its rolling wagon) and that arrival is the tune. Caption (caption only): the chant, e.g. "Shell, star, shell, star, shell!". No gag, no confetti, no floating notes.
- **Rule 0 between rounds:** from her answer to the next choices on the towel: 1.0-1.75 s at every level (measured). Nothing after the payoff is waited for: the parade hops to the back, the train leaves / the podiums sink, and the next round (choices live at once) arrives at the same time.
- **Poking:** tapping any parade thing (in the row or waiting at the back) sings its note and it hops. Never an answer.
- **Round change (rounds 1-5):** the finished parade hops, left to right, over the back of its stage to a spot at the back of the beach (small, 0.55), where it stays all level in its order: three parades in a row at z -3.7, then three more at z -5.2. From the front they peek out under / between the stage. The next round starts at the same time (on the boardwalk its things begin popping on 0.5 s later, once the old ones have hopped clear; the new podiums rise 0.75 s later, once the old ones have sunk).
- **The hand demo** (round 1) and the hand on the "?" (missing-middle round) wait until the whole row is there.
- **Ending (all levels):** the 6th parade stays on its stage. The leader waves; the five parades from the back hop forward over the stage onto the sand in front of it (two rows of two plus one on the towel), one parade after another. The camera glides up a little to frame all six. "Look what you made!" (voiced once per session) for 4 s: every thing sings its note when poked. Photo, sticker, Home.

## Level 1 - Boardwalk parade

- The boardwalk is 12 wide. **The leader (Duck with a red flag planted beside it) stands at the head of the parade all level** and walks along the planks when a row is longer or shorter.
- **Arrival:** the things pop onto the planks one per 0.3 s, left to right (a short 0.3 s drop from just above their spot), each singing its note as it lands; the empty spot gives a tick (about 1.4-1.7 s, while the choices are already live). The far islet and its palm were moved out from behind the leader.

| # | Pattern (gap last) | Choices | Answer | Caption at start | Caption when right |
|---|---|---|---|---|---|
| R1 | shell star shell star _ | shell, star | shell | "Shell, star, shell, star, ...?" | "Shell, star, shell, star, shell!" |
| R2 | crab ball crab ball _ | crab, ball | crab | "Crab, ball, crab, ball, ...?" | "Crab, ball, crab, ball, crab!" |
| R3 | star shell star shell star _ | shell, star | shell | "Star, shell, star, shell, star, ...?" | "Star, shell, star, shell, star, shell!" |
| R4 | bucket crab bucket crab _ | bucket, crab | bucket | "Bucket, crab, bucket, crab, ...?" | "Bucket, crab, bucket, crab, bucket!" |
| R5 | ball shell ball shell ball _ | shell, ball | shell | "Ball, shell, ball, shell, ball, ...?" | "Ball, shell, ball, shell, ball, shell!" |
| R6 | shell crab shell crab _ | shell, crab | shell | "Shell, crab, shell, crab, ...?" | "Shell, crab, shell, crab, shell!" |

Every round: prompt "Tap the one that comes next!" [voiced]; wrong: "That's the <name>!" then "Find the <name>!" [voiced, queued].

## Level 2 - Toy train

- The track is a little shorter (0.93). Wagons are low open flatbeds in cream and teal (never the colour of the bucket riding in them); the cargo rides on top of the floor, fully visible. Crabs are smaller here (0.34) so their claws stay inside a wagon. The driver (Duck or Gull, by round) sits up in the open cab. The low sunset sun has been raised clear of the train and the near sailboat moved out of the way.
- **Arrival:** the first train is already standing on the track when the game opens. From round 2 on, each new train starts rolling in from the left (3.0 s, eased, under 15 units/s) right behind the old one, which has just left to the right; the next round (choices live) begins 1 s later while it rolls. As it stops, the wagons bump one by one left to right (0.28 s each) and each thing sings its note (the empty wagon ticks).
- **Round change:** the cargo hops out to the back of the beach (1.6 s) while the empty train toots and leaves (3.0 s, eased) and the next train rolls in right behind it; the next round's choices are live at once. (Answering while a train is still rolling in: the piece hops onto its wagon and rides; that train finishes arriving before it leaves.)

| # | Pattern (gap last) | Choices | Answer |
|---|---|---|---|
| R1 | shell star shell star shell _ | star, shell, crab | star |
| R2 | crab bucket crab bucket _ | crab, bucket, ball | crab |
| R3 | ball star ball star ball _ | star, ball, shell | star |
| R4 | shell crab shell crab _ | shell, crab, bucket | shell |
| R5 | star star crab star star _ | crab, star, ball | crab |
| R6 | bucket ball ball bucket ball _ | ball, bucket, shell | ball |

Captions as Level 1 ("Shell, star, shell, star, shell, ...?" / "..., star!"); prompt "Tap the one that comes next!"; wrong lines as Level 1.

## Level 3 - Striped circus podiums

- **Gull (yellow flag) stands in front of the right end all level** (clear of the campfire) and bobs along as the podiums arrive. The jellyfish that floated between the podiums are hidden for this game. The podium's own bunting ink line is hidden (it showed as a stray tick).
- **Arrival:** the podiums rise out of the sand one per 0.3 s, left to right, each carrying its thing up like a stage lift; each thing sings its note as it arrives (the empty podium ticks). No throws. About 2.1-2.4 s, with the choices already live.
- **Missing-middle round (R5):** before Go! the hand taps the "?" once to show where the gap is this time.
- **Round change:** the parade hops off the back of the podiums to the back of the beach; the empty podiums sink back into the sand (0.6 s).

| # | Pattern | Choices | Answer |
|---|---|---|---|
| R1 | shell shell star shell shell _ | star, shell, crab | star |
| R2 | crab ball ball crab ball _ | ball, crab, star | ball |
| R3 | shell star crab shell star _ | crab, shell, star | crab |
| R4 | bucket bucket ball bucket bucket ball _ | bucket, ball, crab | bucket |
| R5 | star _ star crab star crab (gap 2nd) | crab, star, bucket | crab |
| R6 | ball crab shell ball crab shell _ | ball, crab, shell | ball |

R5 prompt: "Tap the one that's missing!" [voiced]; caption "Star, ...?, star, crab, star, crab". Wrong lines as Level 1.

## Every narrator line

1. "Let's make a pattern!" [voiced]
2. Round start: the pattern in words ending "...?" [caption only]
3. "Tap the one that comes next!" / "Tap the one that's missing!" [voiced once queued]
4. Wrong: "That's the shell!" / "That's the starfish!" / "That's the crab!" / "That's the beach ball!" / "That's the bucket!", then "Find the shell!" / "Find the starfish!" / "Find the crab!" / "Find the beach ball!" / "Find the bucket!" [voiced once queued]
5. Right: the finished chant, e.g. "Shell, star, shell, star, shell!" [caption only]
6. Idle repeats of the prompt; "Bye bye! See you soon!" [voiced]
7. Finale: "Look what you made!" (voiced once per session); "You did it! A sticker!" [voiced]

All new lines are queued in tools/voice/new-lines.txt.
