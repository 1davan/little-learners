# Barn band (`band`, shown as "Drums!")

- **World:** Farm (`farm`). A plank stage (hay-bale stage L1, red-curtain theatre L2, evening concert on a round stage with fairy lights L3). Pip stands at the left with a drumstick in his right wing and a little copy of the round's instrument in front of him. The big (loud) instrument stands centre-left, the little (quiet) one centre-right (L2/L3 only). A wooden **beat board** (one dot per beat, big red = loud, smaller blue = quiet; always the three-dot board size) stands high up behind everything. At the back is the **band riser** (a wooden platform 1.5 high with a fabric skirt in the level's colour and three steps down at its right end) with six empty spots. Three farm friends stand in the audience at the right of the stage, turned toward the band.
- **Goal (meta):** Copies Pip's drum beats: how many, then loud or quiet.
- **Build-up object:** the band. After every round the friend who cheered walks up the steps onto the riser, a little instrument of that round pops in front of it, and it stays there (keepsake tray, `engine/keepsake.js`). By the end there are six band members; the finale photographs them.
- **Levels:** 3 (L1 = how many beats on one big drum; L2 = all-loud or all-quiet patterns on a big and a little instrument; L3 = mixed loud/quiet, at most three beats). Six rounds each.
- **Source:** `app/src/lessons/band.js`, `band-props.js`, `band-sound.js`; Blender `tools/blender/creatures/prop_bandkit.py` (drumstick, riser, pumpkin drum, A-frame cowbell, fairy lights, round stage, theatre) and `prop_farmkit.py` `beatboard()`; engine `lesson.js`, `keepsake.js`.

## Common behaviour

- **Opening (all levels):** Pip waves, `sfx.hello`, "Let's play drums!" `[voiced]` (not awaited), round 1 after 0.6 s.
- **Round setup:** the old instruments, Pip's little one and the old board pop out first (0.18 s), then the new pair and Pip's little one pop in (the little one is placed exactly where Pip's stick tip comes down) and the new beat board pops in. Little things (corn, peas, apples, berries, eggs, buttons; a new kind each round) drop onto the instruments with real physics (4 on a big one, 2 on a little drum or pot, 1 on a little lid; none on a bell; buttons use their flat shape so they lie flat). Pip's turn starts at once.
- **Pip's turn (`prompt()`), at most 2.5 s from its start to "Your turn":** the line before Pip plays starts at once (spoken; a caption only if the narrator is still talking), and Pip starts the moment the voice is quiet (beats never play over the narrator). Each beat: his wing lifts the stick and it lands on his little instrument 0.26 s later (it squashes, its sound plays), then the real instrument to copy glows on its playing surface only (head, lid, rim or bell; max 0.35) and squashes, its little things jump, the beat's dot lights with its number, the audience reacts softly and the band members nod. Beat spacing is 0.85 s (L1, L2) or 1.0 s (L3), closed up (never under 0.5 s) when a spoken line leaves less room, so line + beats always fit in 2.5 s. Taps open 0.12 s after the last beat lands; then the line after Pip plays and the playable instruments squash once on the spot (no hop: the little things stay on). Idle time does not count and the Go! badge cannot show while Pip plays (`update()` resets `idle` and `goT0` while `listening`).
- **Pokes during Pip's phrase:** she can touch the instruments while Pip plays (even before the first Go!): the instrument gives a small silent wobble and squash. No sound, no bits jumping, it never counts as a beat and never stops or restarts Pip's pattern.
- **Round 1 only:** if the opening line ("Let's play drums!") is still queued or playing when the round is laid out, Pip's turn waits for it, but never more than 1.5 s after the round started; then his before-line shows as a caption and his beats wait for the voice only while his 2.5 s phrase allows (after that the cap wins). Meanwhile pokes already wobble the instruments.
- **Lines before Pip:** L1 and L3 "Listen to Pip!" `[voiced]`; L2 names the object and the concept: "Big pot! Loud!", "Little bell! Quiet!", "Big milk can! Loud!", "Little pot! Quiet!" `[voiced]`.
- **Lines after Pip:** L1 the count: "Your turn! One bang!" / "Your turn! Two bangs!" / "Your turn! Three bangs!" `[voiced]` (they differ by round, so the 30 s rule rarely silences them). L2 and L3 "Your turn!" `[voiced]` (caption only when repeated within 30 s).
- **Demo:** only at the first round of the game, after Pip's beats: slow ghost-hand tap on the first instrument needed (L1/L2), L3 a scan hand over both instruments (2.5 s; a touch ends it).
- **Child taps the right instrument for the next beat:** its own sound (loud/quiet), squash, head glow, little things jump, the audience nods/hops in character, band members nod, the next dot fills with its number. No spoken praise. The next dot to fill breathes.
- **Last beat copied:** the dots flash in order (0.25 s + 0.18 s each); **one** audience friend (seat `round % 3`) cheers in character with its own call; caption "What a band!" `[caption only]`; Pip watches. Then **free jam** (it counts as her playing): it opens when the win's 0.7 s input lock ends; every tap on either instrument plays (no right or wrong), the little things jump, the other fans and the band nod along. It ends 1.5 s after her last jam tap, or 1.5 s after it opens if she doesn't tap, and never lasts more than 3.5 s (so 2.2-4.2 s after the winning tap). Pip's next phrase starts about 0.2 s after the jam ends (the old instruments pop out, the new ones pop in as he begins). 1.8 s after the last beat the friend who cheered walks off: to the foot of the riser steps, hops up the three steps, walks along the riser top to the next free spot (spots fill from the far left, so it never passes a member already standing), turns to face the child, shrinks a little on the way (x 0.76), and a little instrument of the round pops in front of it (half size; a milk can or bell smaller still, so even the chick's face stays clear). It stays there all level and plays along (taps on it play its instrument quietly). A new friend walks in from the right edge to the empty seat (rounds 1-3 only; after that the audience thins out as the band fills). The next round never waits for the walker (it finishes its walk in the background, behind the instruments); only after the last round does it reach the riser before the finale starts (at most 5 s).
- **Child taps the wrong instrument (only possible in L2/L3):** it still sounds, every audience friend reacts (too loud: eyes wide, arms to ears, a little cower; too quiet: leans in), the needed dot shakes, caption "Too loud! Tap the little one!" `[voiced]` (tapped big) or "Too quiet! Tap the big one!" `[voiced]` (tapped little). Her progress is kept. Two wrong taps trigger errorless.
- **If she stops part-way:** the idle ladder never wipes her dots: at 5 s idle "One more!" (one beat left) or "More!" `[voiced]` and the needed instrument squashes twice; at 8 s the same line again (voiced even inside 30 s), a halo on the needed instrument and the hand demo.
- **Idle ladder before her first tap:** 5 s = Pip plays the pattern again + the needed instrument squashes; 8 s = again, plus halo and hand demo; 20 s = errorless (only instruments still needed stay tappable) + Pip plays again; 90 s = "Bye bye! See you soon!" and home.
- **Mash:** Pip scared face + wiggle. No line.
- **Finale (all levels):** the beat board settles away (0.6 s); the camera glides up and back to look down on the band riser with the big instrument in front (`creationView`: pos (-0.5, 6.45, 8.9), look (-0.5, 1.75, -2.4)). It is steep enough that even the big bell's A-frame (the tallest big instrument) stays below the band's instruments and feet, and Pip plus the whole band sit inside the middle 75% of the width, so the saved photo (a centre 4:3 crop) shows them all. "Look what you made!" (voiced once per session), >= 4 s: she can poke any band member (it plays its little instrument) or the big instrument (it booms and every band member plays one beat after it, a little ripple across the band). Photo of the band, rain + resolve, "You did it! A sticker!", sticker, home. No automatic show.

## Level 1: hay-bale stage, one big drum, count the beats

Only the big instrument is on stage; wrong taps are impossible. Audience: cow, hen, pig (then sheep, horse, chick walk in).

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 0 | Plank stage on the grass, Pip waves; empty riser at the back. | "Let's play drums!" | none | n/a | n/a | n/a | Round 1 |
| 1 | Big drum, corn on it. Board: 1 big red dot. | "Listen to Pip!", then "Your turn! One bang!" | Pip hits once; tap the drum once. | Pip's stick lands, dot 1 and the drum light; first-ever round: hand taps the drum; Go!. | Boom, corn jumps, dot 1 fills; the cow cheers, jam, the cow walks up onto the riser with a little drum. | Idle: Pip plays again at 5 s. | Round 2 |
| 2 | Pumpkin drum (sculpted pumpkin with a lashed-on skin), peas. 2 dots. | "Listen to Pip!" / "Your turn! Two bangs!" | Tap twice. | 2 numbered dots light in turn. | Two thocks; the hen joins the band with a little pumpkin drum. | Stops after one: "One more!" at 5 s. | Round 3 |
| 3 | Bucket drum (upturned pail with a cream skin), apples. 2 dots. | same, "Two bangs" | Tap twice. | Same. | The pig joins with a little bucket drum. | Same. | Round 4 |
| 4 | Drum, berries. 3 dots. | "Your turn! Three bangs!" | Tap three times. | Same. | The friend in seat 1 joins. | "More!" at 5 s if she stops with two left. | Round 5 |
| 5 | Pumpkin drum, eggs. 1 dot. | "Your turn! One bang!" | Tap once. | Same. | Joins. | Same. | Round 6 |
| 6 | Bucket drum, buttons. 3 dots. | "Your turn! Three bangs!" | Tap three times. | Same. | The sixth friend joins; the band is full. | Same. | Finale |

- **Her last tap to the next thing that answers her:** jam taps work 0.7 s after the win; after her last jam tap the jam ends 1.5 s later, Pip's phrase starts 0.2 s after that (instruments pokeable), and her counted turn opens when it ends.
- **Timings (measured, autoplay, 1280x800, real tree, no jam taps):** winning tap to jam end 2.2 s; jam end to Pip's next phrase 0.2 s; Pip's phrase 0.43 s (1 beat), 1.28 s (2 beats), 2.13-2.14 s (3 beats); winning tap to her next counted turn 2.85-4.56 s. Round 1: round start to Pip's first phrase 1.5 s, to taps open 3.3-4.0 s. With jam taps every 0.5 s (real pointer): the jam ends at its 3.5 s cap, and her last jam tap to her next counted turn is 1.97 s.

## Level 2: red-curtain theatre, a big (loud) and a little (quiet) instrument

A deep red back cloth, draped red curtains with gold tie-backs at the sides and a scalloped valance with a gold fringe. Every pattern is all loud (big) or all quiet (little).

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | Pot pair (a wooden spoon resting on each rim), berries. 2 big red dots. | "Big pot! Loud!", "Your turn!" | Tap the big pot twice. | Big pot glows with each beat (its spoon lifts and taps); hand on the first-ever round. | Clang x2; a friend joins with a little pot. | Little pot: "Too quiet! Tap the big one!", audience leans in. | 2 |
| 2 | A-frame cowbell pair, corn (none on the bells). 2 small blue dots. | "Little bell! Quiet!" | Tap the little bell twice. | Same. | Joins with a little bell. | Big bell: "Too loud! Tap the little one!", audience cowers. | 3 |
| 3 | Milk-can pair, buttons. 1 red dot. | "Big milk can! Loud!" | Tap the big can once. | Same. | Joins. | As round 1. | 4 |
| 4 | Pot pair, peas. 3 blue dots. | "Little pot! Quiet!" | Little pot 3 times. | Same. | Joins. | As round 2. | 5 |
| 5 | Milk-can pair, apples. 3 red dots. | "Big milk can! Loud!" | Big can 3 times. | Same. | Joins. | Same. | 6 |
| 6 | Cowbell pair, eggs. 2 blue dots. | "Little bell! Quiet!" | Little bell twice. | Same. | Band full. | Same. | Finale |

- **Timings (measured):** winning tap to jam end 2.2 s; jam end to phrase 0.2 s; Pip's phrase 0.41-2.13 s (round 1: 2.44 s, the opening line still sounding); winning tap to next counted turn 2.83-4.54 s; round 1 phrase start 1.5 s, taps open 3.9 s.

## Level 3: evening concert (round stage, fairy lights, light pools), mixed loud and quiet

Both instruments on stage; beats are 1.0 s apart; patterns have at most three beats: Bs, sB, BBs, ssB, BsB, sBs. "Listen to Pip!" before, "Your turn!" after. The first-ever demo is a scan hand over both instruments.

| # | Instruments, bits | Pattern | If wrong |
|---|---|---|---|
| 1 | Milk cans, buttons | big, little | "Too loud! Tap the little one!" / "Too quiet! Tap the big one!" (progress kept) |
| 2 | Drums, apples | little, big | same |
| 3 | Cowbells, corn | big, big, little | same |
| 4 | Pumpkin drums, eggs | little, little, big | same |
| 5 | Pots, berries | big, little, big | same |
| 6 | Bucket drums, peas | little, big, little | same |

- **Timings (measured):** winning tap to jam end 2.2 s; jam end to phrase 0.2 s; Pip's phrase 1.43 s (2 beats), 2.42-2.43 s (3 beats at 1.0 s); winning tap to next counted turn 3.84-4.85 s; round 1 phrase start 1.5 s, phrase 2.44 s, taps open 3.9 s. With a voiced before-line (about 1 s), three beats close up to about 0.53 s apart to stay inside 2.5 s.

## Every narrator line

"Let's play drums!"; "Listen to Pip!"; "Big pot! Loud!"; "Little pot! Quiet!"; "Little bell! Quiet!"; "Big milk can! Loud!"; "Your turn!"; "Your turn! One bang!"; "Your turn! Two bangs!"; "Your turn! Three bangs!"; "Too loud! Tap the little one!"; "Too quiet! Tap the big one!"; "One more!"; "More!"; "What a band!" (caption); "Bye bye! See you soon!"; "Look what you made!"; "You did it! A sticker!".
