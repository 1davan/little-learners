# Peekaboo pots (`pots`, shown as "Peekaboo!")

- **World:** Farm (`farm`). A row of covers (flowerpots, baskets, buckets, hay bales, boxes, barrels or hollow pumpkins) stands in a level-specific set; behind them is the **watching bench** (a thick plank on three farm crates, seat at y 1.45). **The camera is close on the covers** (`frameCovers()`: computed from the screen's shape so every cover, also held up and mid-swap, the friend's hello spot and the bench friends stay in frame, clear of the home button and the gear). Measured cover height at 1366x768: L1 41-46%, L2 36-40%, L3 36-38% of the screen (same at 1280x800 and 1920x1080, nothing cut). Pip waits just off to the left during play and walks in to stand by the bench for the finale.
- **Goal (meta):** Remembers which pot the chick hid under, even after the pots move.
- **Levels:** 3 (L1 garden bed, **2 covers every round**, no shuffling; L2 straw farmyard pen, 3 covers, 0-2 swaps; L3 vegetable patch with a scarecrow, 3 covers, 2 swaps every round and a frog decoy in rounds 3 and 6). Six rounds each.
- **Build-up object (keepsake tray):** the watching bench. Every friend she finds walks back to it and sits there for the rest of the level, in view above the covers; the finale photo is the bench full of the friends she found, with Pip.
- **Source:** `app/src/lessons/pots.js`, `pots-props.js`; models `tools/blender/creatures/prop_potskit.py` (bench, hollow pumpkin, basket, garden bed, seedling, straw bedding, pen fence, vegetable patch); engine `lesson.js`, `keepsake.js`.

## Sets
- **L1 garden bed:** a soil bed framed by chunky timber boards with round corner posts, a row of seedlings along the front (in frame) and at the far ends, stones on the grass in front.
- **L2 farmyard pen:** straw bedding with straw tufts round its edge, a post-and-rail fence with a cross-braced gate behind the bench.
- **L3 vegetable patch:** soil with raised rounded rows at the back and one at the front (cabbages and carrots on it, in frame), the scarecrow on the back row at the right.
- Falling leaves, rain and butterflies are kept out of the play area (`calmBackdrop`).

## Common behaviour

- **Opening (all levels):** Pip waves (off to the left), `sfx.hello`, "Peekaboo! Who is hiding?" `[voiced]` (wait capped at 2.2 s), round 1 after 0.6 s.
- **The round's show (round start → covers take a finger in 1.3 s with no swaps, 2.3 s with one, 3.3-3.4 s with two; never more than 3.5 s):**
  1. The covers appear together, held up in the air over their spots (0.35 s, one soft sound). At the same moment the round's friend (Chick, Bunny, Piglet, Kitten or Hedgehog) pops in on the grass in front of its cover and calls (L3 rounds 3 and 6: a frog pops in too, ribbit).
  2. At 0.3 s the friend hops straight back under its raised cover (0.5 s, facing her; its head stays under the rim); the frog does the same under another one.
  3. At 0.85 s all the covers come down together (0.45 s, soft thunk/rustle/bloop) and the narrator says "**<Name> is hiding!**" `[voiced]`. The friend keeps its full size inside its cover (every friend fits inside every cover) and travels with it in swaps.
  4. Rounds with a "peek" flag (L1 rounds 1, 2, 4) leave a little tail peeking out beside the friend's cover.
  5. Swaps: "Watch!" `[voiced]`, then neighbours swap one at a time, 0.95 s each with 0.1 s between: one cover arcs round the front, the other round the back (their centres stay at least 2.78 apart, so they never touch; the front one is biggest in the middle of the row, never at its ends).
  6. Covers take a finger, the Go! timer starts, `cue()` runs.
  - **Pokes stay live all through the show:** the friends on the bench answer a poke (their own call and a little hop), and scenery reacts. Only the covers wait. The friend hiding under a cover, the frog and a friend on its way to the bench can't be poked.
  - The friend found last round may still be hopping up onto its seat during the next show (it is already clear of the cover row when the round starts).
- **Prompt:** "Where's <Name>?" (no swaps) or "Where's <Name> now?" (swaps), all `[voiced]`. First round of the game only: a demo hand (L1 taps the right cover; L2/L3 scans across all the covers). A touch ends the demo at once.
- **Her finger lifts the cover:** she can **drag a cover up**: it follows her finger, tipping its front edge up, and she can peek underneath. Let go early and it drops back down (no answer). Past half way it comes right up by itself. A plain **tap** also lifts it. Covers lift to 1.7 (clear of every friend and every surprise).
- **The RIGHT cover:** a tap gets a 0.4 s held breath first (a drag already held the breath in her finger), then the cover lifts and there is the friend, full size: its own call, a joy face, and "**Peekaboo!**" `[voiced]` (about every other round, 30 s rule). The friend hops out to the front (0.6 s), **the friends already on the bench cheer** (one small hop each, no sound), the friend gives a happy bounce while its cover goes back down, then all the covers go quietly (0.5 s) and the friend walks straight back (never faster than 3.4 units/s) to its seat on the bench, turns, crouches and hops up; it lands with the level's rising note and stays there, breathing, for the rest of the level. The next round starts as soon as the friend is clear of the cover row.
- **A WRONG cover:** the cover lifts and shows a silly surprise (ball, worm, sock, snail or the frog) with one sound and a little show; the narrator names it: "A ball!" / "A worm!" / "A sock!" / "A snail!" / "Frog!" `[voiced]`. After 1.3 s the cover goes back down over it, then the round's own question again. Two wrong tries turn on errorless.
- **Idle (engine ladder: 5 s, 8 s, 20 s, 90 s):** 5 s = the question again + every cover gives a tiny wiggle (no answer given away); 8 s = the question again + the right cover hops, the friend's call comes from under it, a halo rings the cover, and a tap hand points at it; 20 s = errorless (the other covers shrink to 80% and take no finger, the tail peeks out, the right cover wiggles every 3 s) + the question; 90 s = "Bye bye! See you soon!" `[voiced]` and home. A tap clears any hint hand and halo at once.
- **Mash:** Pip scared face + wiggle. No line.
- **Finale (all levels):** no automatic show. Pip walks in from the left to stand at the end of the bench while the camera glides to the bench full of the six friends she found (all of them and Pip in frame). "Look what you made!" (voiced once per session) for >= 4 s; she can poke each friend (its call + a hop). Shutter, photo (the bench), rain + resolve, "You did it! A sticker!" `[voiced]`, sticker, home.

## Level 1: garden bed. 2 big covers every round, no shuffling

Gags (rotating through ball, worm, sock, snail, starting at random).

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 0 | Garden bed, Pip waves. | "Peekaboo! Who is hiding?" `[voiced]` | none | n/a | n/a | n/a | Round 1 |
| 1 | 2 flowerpots; Chick pops in, cheeps, hides under one; its tail peeks out. | "Chick is hiding!" then "Where's Chick?" `[voiced]` | Lift (drag or tap) the pot Chick is under. | Demo hand taps the right pot (first-ever round); the tail peeks; Go!. | Peekaboo; Chick hops out, then sits on the bench (seat 1). | Gag + its name (`[voiced]`), then "Where's Chick?" again. | Round 2 |
| 2 | 2 baskets; Bunny hides (peek flag). | "Bunny is hiding!" / "Where's Bunny?" | Same. | Tail peeks; Go!. | Bunny to the bench, seat 2. | Gag name, then the question. | Round 3 |
| 3 | 2 buckets; Piglet hides (no peek). | "Piglet is hiding!" / "Where's Piglet?" | Same. | She must have watched. | Piglet to the bench, seat 3. | Same. | Round 4 |
| 4 | 2 baskets; Chick hides (peek). | "Chick is hiding!" / "Where's Chick?" | Same. | Tail peeks. | Seat 4. | Same. | Round 5 |
| 5 | 2 pots; Bunny hides (no peek). | "Bunny is hiding!" / "Where's Bunny?" | Same. | Go!. | Seat 5. | Same. | Round 6 |
| 6 | 2 buckets; Piglet hides (no peek). | "Piglet is hiding!" / "Where's Piglet?" | Same. | Go!. | Seat 6. | Same. | Finale |

- **Timings (measured, full autoplay, 1366x768):** round start → covers take a finger: 1.30-1.34 s every round. Cover height 319-352 px of 768 (41-46%).

## Level 2: straw farmyard pen. 3 covers, 0-2 swaps

Gags: sock, ball, frog, worm (random start, rotating). Round 1 has no swap.

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | 3 hay bales; Kitten hides; no swaps. | "Kitten is hiding!" / "Where's Kitten?" `[voiced]` | Lift the bale Kitten is under. | First-ever round: scan hand over the bales; Go!. | Kitten mews, sits on the bench. | Gag name, then the question. | 2 |
| 2 | 3 boxes (flaps pressed shut); Piglet hides; 1 swap. | "Piglet is hiding!", "Watch!", "Where's Piglet now?" `[voiced]` | Lift the box Piglet is now under. | The swap shows which two moved; Go! only once the covers are live. | Same. | Same. | 3 |
| 3 | 3 buckets; Chick hides; 1 swap. | Same pattern. | Same. | Same. | Same. | Same. | 4 |
| 4 | 3 boxes; Kitten hides; 2 swaps. | Same. | Same. | Same. | Same. | Same. | 5 |
| 5 | 3 hay bales; Piglet hides; 1 swap. | Same. | Same. | Same. | Same. | Same. | 6 |
| 6 | 3 buckets; Chick hides; 2 swaps. | Same. | Same. | Same. | Same. | Same. | Finale |

- **Timings (measured, full autoplay, 1366x768):** round start → covers take a finger: 1.34 s (no swap), 2.29 s (1 swap), 3.34-3.38 s (2 swaps). Cover height 275-309 px of 768 (36-40%).

## Level 3: vegetable patch with a scarecrow. 3 covers, 2 swaps every round

Swaps are the same as L2 (0.95 s each). The step up from L2 is two swaps every round plus the frog decoy in rounds 3 and 6. Gags: snail, ball, worm, sock, frog.

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | 3 hollow pumpkins; Hedgehog hides; 2 swaps. | "Hedgehog is hiding!", "Watch!", "Where's Hedgehog now?" `[voiced]` | Lift the pumpkin Hedgehog is now under. | First-ever round: scan hand. | Hedgehog squeaks, sits on the bench. | Gag name, then the question. | 2 |
| 2 | 3 barrels; Bunny hides; 2 swaps. | Same pattern. | Same. | Same. | Same. | Same. | 3 |
| 3 | 3 baskets; Kitten hides; a frog hides under another; 2 swaps. | Same. | Same (not the frog's basket). | Same. | Same. | "Frog!" then the question. | 4 |
| 4 | 3 barrels; Hedgehog hides; 2 swaps. | Same. | Same. | Same. | Same. | Same. | 5 |
| 5 | 3 pumpkins; Chick hides; 2 swaps. | Same. | Same. | Same. | Same. | Same. | 6 |
| 6 | 3 baskets; Bunny hides; a frog too; 2 swaps. | Same. | Same. | Same. | Same. | Same. | Finale |

- **Timings (measured, full autoplay, 1366x768):** round start → covers take a finger: 3.30-3.34 s (two 0.95 s swaps). Cover height 274-294 px of 768 (36-38%).

## Every narrator line
"Peekaboo! Who is hiding?"; "Chick is hiding!"; "Bunny is hiding!"; "Piglet is hiding!"; "Kitten is hiding!"; "Hedgehog is hiding!"; "Watch!"; "Where's <Name>?"; "Where's <Name> now?"; "A ball!"; "A worm!"; "A sock!"; "A snail!"; "Frog!"; "Peekaboo!"; "Bye bye! See you soon!"; "Look what you made!"; "You did it! A sticker!". The five "<Name> is hiding!" lines are in `tools/voice/new-lines.txt` (no clip yet; caption until voiced).
