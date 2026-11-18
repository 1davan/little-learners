# Brick letters (`bricks`) — storyboard

- **World:** Building site (`build`). Bear (hard hat) is the builder, Pip watches beside him. No other creatures except the picture animals.
- **Learning goal:** one-to-one counting to ten as she taps bricks one at a time into a capital letter, and "this letter is for this word" (both spoken).
- **Levels:** 3. L1 = A to G (7 rounds, 5 bricks each). L2 = H to N (7 rounds: H, I, J 6; K, L 7; M, N 8). L3 = O to T (6 rounds: O, P 8; Q, R 9; S, T 10). Never more than ten bricks: the progression comes from new letters, not bigger numbers. Brick size L1 1.0, L2 and L3 0.9; letter height 4.5 / 4.75 / 5.0.
- Source: `app/src/lessons/bricks.js`, `bricks-letters.js` (stroke shapes and the per-letter count table), `bricks-pieces.js`, `bricks-words.js`, `bricks-sound.js`; engine `app/src/engine/lesson.js`.

## Fixed scene (all levels)

Camera is fixed (no moves until the finale), a little above the board's middle so the sign row on top of the board stays clear of the caption. Letter board at centre-right with the faint dashed outline of the letter. On top of the board's yellow header is the **sign**: every finished letter of the level stands there in a row, small (0.18 size), for the whole level. A low two-step grey stand at the front holds the letter's bricks in two rows. Bear stands at the left behind the stand, Pip beside him further left (they never overlap). The picture spot is right of the board (the scenery digger and, at night, the right work light are moved aside so nothing stands behind the picture).

## Engine behaviours that apply to every beat

- **Game open:** Pip waves, caption "Let's build letters with bricks!" `[voiced]`, then round 1 starts.
- **Go! badge:** once the round is ready (taps are already open; the badge never blocks).
- **Idle ladder (no touch):** 5 s = "Tap a brick!" + the next brick hops; 8 s = "Tap a brick!" again + hop + halo + the tap demo; 20 s = errorless (halo on that brick); 90 s = "Bye bye! See you soon!" and Home. A repeat within 30 s is caption only, except the counting numbers, which are always spoken.
- **There is no "wrong" in this game:** every brick, every tap on the letter's outline (that place's brick comes) and every tap near a brick sends a brick.
- **Mashing:** fast tapping is the intended play. Taps queue: one brick lands every 1.15 s so each number is heard before the next. Pip makes a joy face and a small hop (no sound).

## Round template (identical for every letter)

| # | What the child sees | Narrator says | Prompt: what she must do | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| a | The previous picture fades away (0.5 s). The new letter's outline fades in, slot by slot. Bear throws in exactly this letter's bricks, one after another; **each brick is already the length of its place in the letter** (bricks never stretch or shrink). They land on the stand, shared over the two rows and evenly spaced. The first one lands about 0.85 s after the round starts and is tappable at once. | Intro, said once: R1 of a level "Let's make A! Tap the bricks!" (A, H, O); later "Let's make B!" `[voiced when generated: in new-lines]` | Tap a brick (any brick, any order), drag a brick up onto the board, or tap a place in the outline. | The next place (in writing order) breathes softly; its brick is the hint target. R1 of the game: a slow ghost-hand tap demo on that brick (any touch ends it). | n/a | Idle ladder ("Tap a brick!"). | b |
| b | She taps a brick (or drags it up, or taps its outline place). | The count, out loud on every click: "One!" … "Ten!" `[One–Four voiced; Five–Ten in new-lines]` | Tap the next brick. | Same breathing place. | The brick hops up (short bricks turn over once in a plane in front of the board), arrives in front of its own place and presses straight in with a plastic click whose pitch climbs with the count; its two neighbours in the letter give a tiny knock. The number shows beside the board, always in the same spot, with a white outline. Bear nods. Dropping a dragged brick anywhere else sends it back to its spot. | Tap a placed brick: it lifts toward her, clicks back and its number is said again. | b until all places are filled |
| c | The last brick clicks in. A held breath (0.4 s, sound and music dip). Then the ta-da, the letter wiggles and grows 7% with a soft glow lying flat on the board behind it; Bear's joy face and arms up (no hop). 0.6 s later the picture pops out beside the board and does its short show. | "X is for Word!" `[spoken: voice: true; A voiced, the others in new-lines]` | none (she may tap the letter's bricks: each lifts and its number is said) | n/a | n/a | n/a | d |
| d | As the last brick clicks in Bear throws in the next letter's bricks (they land about 0.9 s after the last click and can be tapped once the round turns, about 1.1 s). The finished letter wiggles, then shrinks and glides up (0.85 s, out toward her and back so it never passes through the header) onto its place on the sign, where it stays for the rest of the level; the next letter's outline fades in as it goes. The picture does its show and fades once it is over. On the **last** letter a copy goes up and the real letter stays on the board. | none | none | n/a | n/a | n/a | next letter |

## Per-letter rounds

| Level | Letters (bricks) | Pictures and shows |
|---|---|---|
| 1 | A 5, B 5, C 5, D 5, E 5, F 5, G 5 | Apple (bounce), Ball (bounce), Cat (meow, hop), Duck (quack), Egg (wobble), Fish (flip, floating low), Grapes (jiggle) |
| 2 | H 6, I 6, J 6, K 7, L 7, M 8, N 8 | Hat (spin), Ice cream (wobble), Jellyfish (float), Kite (fly), Leaf (flutter), Moon (rock), Nest (wobble) |
| 3 | O 8, P 8, Q 9, R 9, S 10, T 10 | Octopus (wobble), Pig (oink), Queen (wobble), Rabbit (hops), Sun (spin), Tree (sway) |

## Ending (all levels)

After the last letter, `finale()`: the camera glides back a little to frame the board with the last letter, the sign of every letter of the level on top, and the last picture. "Look what you made!" (voiced once per session when its clip exists). The mini letters on the sign are pokeable (a press and a note each); the last letter's bricks still say their numbers when tapped. Bear makes a joy face. Then the photo (it shows the sign and the last letter), rain and the resolve, "You did it! A sticker!", sticker, Home.

## Timings (measured, 1280x800, real taps)

- Round start → first brick tappable: about 0.9 s (later rounds), 1.2 s (round 1).
- Each brick: 0.75 s flight; queued taps land 1.15 s apart (so each number is heard).
- Last click → next letter's first brick tappable: about 1.1 s (the next letter's bricks are thrown in during the held breath).

## Every narrator line

1. "Let's build letters with bricks!" (game open)
2. Intros: "Let's make A! Tap the bricks!", "Let's make H! Tap the bricks!", "Let's make O! Tap the bricks!", "Let's make B!" … "Let's make T!"
3. Reminder: "Tap a brick!"
4. Counting: "One!" … "Ten!" (always spoken, repeat allowed)
5. "X is for Word!" for A–T (O is for Octopus, Q is for Queen), spoken.
6. Idle: "Bye bye! See you soon!". Finale: "Look what you made!", "You did it! A sticker!".
