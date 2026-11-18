# Who says moo? (`moo`)

- **World:** Farm (`farm`). Pip sits on a hay bale at back-left; a speech-bubble sprite hangs beside Pip; the animals stand in a row in front, each on its own farm spot. Behind them, in front of the farm fence, a hay stack (square `prop_hay` bales: a one-bale step and a two-bale top, 9 wide, right of Pip): every animal she finds climbs up and stays on top (the keepsake tray): the farm chorus, standing above the row's heads so it never peeks out from behind the animals she is choosing between. Pip's feed bowl (`prop_woodbowl`) sits on the grass in front of the middle of the row. The farm's dirt path across the front is hidden (it showed as a flat tan band along the bottom of the screen); an invisible low kerb in front of the row stops the hen's egg.
- **Camera:** close on the row, per row size: 2 animals `(-1.2, 3.05, 9.7) -> (-1.2, 1.95, 0)`, 3 animals `(-0.8, 3.15, 10.5) -> (-0.8, 2.0, 0)`, 4 animals (Level 3 rounds 3-6) glides back to `(-0.6, 3.4, 11.6) -> (-0.6, 2.1, 0)`. Pip, the bubble, every animal and the bowl are in frame at 1280x800, 1366x768 and 1920x1080.
- **Goal (meta):** Hears an animal sound and taps the animal that makes it.
- **Levels:** 3 (chosen by the parent in settings; L1 = level 0). Six rounds each.
- **Build-up object:** the farm chorus on the hay stack: one more animal every round, all six there in the finale.
- **Source:** `app/src/lessons/moo.js`, `moo-farm.js`; models `tools/blender/creatures/prop_moospots.py` (pond, straw patch, straw bed), `prop_farmkit.py` (barn door, pen, trough), `pig.py` (hidden mud layers); engine `app/src/engine/lesson.js`, `keepsake.js`.

## Common behaviour (applies to every round of every level)

- **Opening (all levels):** Pip waves, `sfx.hello`, "Listen! Farm animals!" `[voiced]`, then round 1 after 0.6 s.
- **Round setup (`startRound`):** last round's leftovers are already gone (they faded or walked off at the end of the last round). New farm spots pop in (0.35 s) and the animals pop in staggered (0.1 s + 0.15 s each). Answer position shuffled (never the same slot twice running, ~85%); no spot from last round comes back; the barn door and the tree never stand in slot 0 (beside Pip's bale); no tree in four-animal rows. The sound bubble pops up beside Pip at once, silent. After 0.3 s the round is live and `cue()` runs. **Round start -> input ready: 300-350 ms (measured, every round, every level).**
- **The call:** `prompt()` says the question (wait capped at 1.5 s), then **waits until the narrator has finished** (`voiceIdle`) before the call plays: the bubble swells for a held breath (0.38 s, silent), then the animal's call plays while the bubble wobbles in time and Pip wiggles. The call is never spoken over. Tapping the bubble plays it again at any time. In round 1 the call comes after the intro and the question (about 6 s in); in later rounds about 2.5 s in. She can tap animals at any time.
- **Bubble picture:** L1 the animal's face in its colour; **L2 a plain blue note** (she listens), and the face comes back as the hint at the first idle step; L3 always just the note.
- **Demo:** first round of the session only, 2.5 s (L1/L2 the hand taps the answer; L3 scans all animals). A touch ends it.
- **Tap a WRONG animal:** that animal answers first in its own voice (its call, a `♪` beside its head, a happy open "joy" face, a little wiggle and head tilt), then 0.7 s later the caption/voice "<Animal> says <word>!" (`redirect`), then once the narrator is quiet the call to find plays again. Two wrong taps in a round turn on errorless.
- **Tap the RIGHT animal:** the bubble pops; the animal calls in its own voice (joy face, no floating word, no extra notes); the other animals only turn their heads to watch (no hops). It does its **signature move** (the one reaction, table below). Pip watches (small turn, nod or clap). 0.6 s of stillness.
- **She feeds it:** its favourite treat pops up in Pip's feed bowl (cow and sheep clover, pig an apple, hen corn, horse a carrot, duck a bread roll). **She drags it to the animal's mouth**: the animal opens its mouth wide and leans as the treat comes near (`onNear`), takes it and chews three times with its head down (one `sfx.chomp`), the treat going in bites. A **tap** on the treat makes it hop over at walking pace by itself; a drop elsewhere sends it back to the bowl. Stuck: after 3 s the hand shows the drag; after 8 s the treat hops over by itself. Then 0.7 s of looking at the happy animal.
- **Then (overlapped, rule 0):** the moment the treat lands at the mouth, the animals she did not pick, the spots and the move's bits fade away (0.5 s, props she did not make). The animal takes its first bite in place, facing her (0.45 s), then **walks straight back to the lane behind the row, still chewing** (the other two bites on the way). As soon as it is in the lane the next row comes in, so the next animals are tappable **about 1.7 s after the treat landed** (measured 1.67-1.72 s). Meanwhile it walks along the lane behind the new row (every spot prop stays in front of the lane, z > -1.95), hops up the step and onto the top, turns to face her and takes its place in the chorus, where it stays all level (breathing). A poke on a chorus animal during play only presses it and wiggles it (no call: a call there would sound like an answer); in the finale each one calls. In the last round the climb finishes before the finale.
- **Timings (measured):** round start -> input ready 0.30-0.32 s; right tap -> treat in the bowl 1.6-2.3 s; treat landed -> next row tappable 1.67-1.72 s.
- **Idle ladder (engine LADDER 5/8/20/90 s):** 5 s = the question and the call again (at L2 the face comes into the bubble), no hop; 8 s = the question again, the right animal hops and glows, and the hand shows the tap; 20 s = errorless (wrong animals shrink to 70% and stop answering); 90 s = "Bye bye! See you soon!" and home.
- **Mash:** Pip's scared face and a wiggle. No line.

### Signature moves (right animal)

| Animal | Move | Stays |
|---|---|---|
| Cow | munches a tuft of grass, head shaking (1.3 s, crunch) | |
| Pig | a calm sideways roll in a mud puddle (1.7 s, splash), mud bits fly | comes up **muddy** (pig's `cloth_mud` + `cloth_mud_head` layers) and stays muddy on the straw bed |
| Sheep | squashes, wool balls POOF out, then puffs up | |
| Hen | squats and lays an egg that rolls a little way (pop) | the egg until the round ends |
| Horse | clip-clops four times with dust, then rears | |
| Duck | dunks in a puddle and splashes | |

Puddles are the sculpted `prop_mud` / `prop_farmpond` (none when the animal already stands in mud or water).

## Level 1: sunny meadow (rainbow), 2 animals per round

Spots: flowers, tree (with an apple), pond, hay. Bubble shows the target animal's face in its colour.

| # | Animals (target first) | Narrator | If wrong |
|---|---|---|---|
| 1 | Cow, Duck | "Who says moo?" `[voiced]` | "Duck says quack!" `[voiced]` |
| 2 | Duck, Cow | "Who says quack?" `[voiced]` | "Cow says moo!" (clip pending) |
| 3 | Pig, Sheep | "Who says oink?" `[voiced]` | "Sheep says baa!" `[voiced]` |
| 4 | Sheep, Hen | "Who says baa?" `[voiced]` | "Hen says cluck cluck!" (clip pending) |
| 5 | Cow, Pig | "Who says moo?" (caption only if within 30 s of round 1; a quick child can get there in under 30 s) | "Pig says oink!" `[voiced]` |
| 6 | Hen, Horse | "Who says cluck cluck?" `[voiced]` | "Horse says neigh!" (clip pending) |

## Level 2: the barnyard (dirt yard, cart wheel), 3 animals per round

Spots: pen (wide enough for wings and hooves), trough, barn door (open doors, dark doorway), mud, hay, pond. Bubble: a plain note first; the face comes back as the hint when she is stuck.

| # | Animals (target first) | Narrator |
|---|---|---|
| 1 | Cow, Pig, Duck | "Who says moo?" |
| 2 | Sheep, Hen, Cow | "Who says baa?" |
| 3 | Horse, Duck, Pig | "Who says neigh?" |
| 4 | Pig, Sheep, Horse | "Who says oink?" |
| 5 | Hen, Duck, Cow | "Who says cluck cluck?" |
| 6 | Duck, Hen, Sheep | "Who says quack?" |

## Level 3: the garden (hedge with lanterns behind the fence), 3 then 4 animals, call heard with no picture

Spots: pumpkins, cart, tree (not in 4-rows), flowers, pond, barn, trough (the hedge spot is gone: it vanished against the garden hedge). Two lantern posts stand either side of the hay stack, the hedge behind the fence. Bubble: a plain blue note, no colour clue. Prompt "Listen! Who is it?" every round (caption only within 30 s of its last voicing; the call itself, which is the task, now always plays after it, unmasked). Rounds 3-6 have four animals (spots at 72%), and the camera glides back a little.

| # | Animals (target first) |
|---|---|
| 1 | Horse, Cow, Sheep |
| 2 | Hen, Duck, Pig |
| 3 | Sheep, Cow, Horse, Pig |
| 4 | Duck, Hen, Sheep, Cow |
| 5 | Pig, Horse, Hen, Duck |
| 6 | Cow, Sheep, Pig, Horse |

## Ending (all levels)

No automatic show. The camera glides (0.9 s) close on the top of the hay stack so the six animals she found fill the width of the screen; "Look what you made!" (voiced once per session); she **conducts the chorus**: each animal she pokes presses in and calls in its own voice (`onAdmirePoke`). Photo of the chorus, sticker, home.

## Every narrator line

"Listen! Farm animals!"; "Who says moo/quack/oink/baa/cluck cluck/neigh?"; "Listen! Who is it?"; "Pig says oink!", "Sheep says baa!", "Duck says quack!", "Cow says moo!", "Hen says cluck cluck!", "Horse says neigh!" (the last three are in `tools/voice/new-lines.txt`); "Bye bye! See you soon!" (timeout); "Look what you made!"; "You did it! A sticker!". No new lines were added by the fix pass.
