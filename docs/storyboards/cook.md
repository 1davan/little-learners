# Storyboard: Cook a soup (`cook`)

- **World:** Home (`dressup`), the Snack kitchen re-dressed for cooking: a low table-top hob with a pot at the left (a big coral-red dial on the hob's top, front right), the chopping board at the back of the worktop in the middle, a low wooden knife rest with the knife lying flat on it (blade pointing away from Bear, handle toward him) to the right of the board, the veg bowl at the right. **Bear stands on his long wooden kitchen step behind the counter and does the cooking with his own paws**: he is already in place when the game opens (no walk-in). Pip watches from off-screen. Code: `app/src/lessons/cook.js`, `cook-bear.js` (Bear's paws), `cook-veg.js`, `cook-kitchen.js`, `cook-slice.js`, `cook-sound.js`. Models: `tools/blender/creatures/prop_cook.py` (`prop_ck_*`: hob, flame, knife, block, ladle, spoon, step, card, tick, veg).
- **Learning goal:** makes a vegetable soup step by step (put a veggie on the board, knife, chop, hold the board, carry it to the pot, knob on); L2 picks the veg by its colour word; L3 follows a picture recipe card (1 carrot, 2 tomatoes, stir, serve a bowl to Bear), counting two tomatoes.
- **Levels:** 3. Rounds: L1 = 2 (carrot, tomato, in either order), L2 = 3 (carrot, broccoli, corn), L3 = 4 (carrot, two tomatoes, stir, serve). Kitchen light: L1 morning, L2 noon, L3 evening.

## Held things are always held

Bear's arms are single bones, so a paw can only be where his arm reaches. Every frame, after the engine's motion layer, `cook-bear.js` shuffles Bear along his step and leans him in so the paw can reach, aims each holding arm at its goal and stretches it a touch (0.88 to 1.18), then the game moves the held thing by the last tiny error, so the paw is always on it:
- **Knife:** from the moment Bear lifts it off its rest until it is back on it, his right paw is on the handle. The knife is always below his chin and pointing away from him: the blade lies along the cut, edge down toward the board, its handle toward him; it hovers just above the pieces (never higher than his chest), lifts a little, comes down onto the board (cutting what is under it) and rises again. When pieces lie between the cut and his paw, the knife rocks (tip on the board, handle up) so the handle passes over them; a stroke with nothing to cut rests on the pieces, never through them. While the knife is out Bear keeps his head up and leans in only a little. Everything on the board lies low (the broccoli on its side) so the knife never needs to come up high. Between strokes the whole edge hovers level, just above the tallest piece, so the blade is never inside a vegetable except during the cut itself; a tall piece (a whole tomato, a broccoli) is cut through its middle so both halves lie down flat.
- **Pieces:** they never sit inside each other: they are pushed apart (mostly along the board's length); when there is no room left a piece lies on top of a low flat piece, one layer only, never on a tall piece; and once the pieces would cover most of the board, the knife only taps (no new pieces). Gathering draws them into a low heap, not a tower.
- **Board:** Bear takes its back corners in both paws, lifts it (low, well below his chin, while he walks), raises it over the pot's rim as he gets there, tips it so the pieces slide off the front into the soup, and carries it home again.
- **Ladle (L3):** rests in the pot, handle back; Bear's paw holds the handle while stirring (up above the rim, where it shows) and ladling. To fill the bowl he steps over to the pot, dips (soup shows in the cup), lifts it just clear of the rim and walks it over to the bowl with the cup out in front of his right shoulder, so his paw stays low and away from his face, then pours.
- **Tasting spoon (L3):** Bear holds it from the side of his face, its bowl at his mouth.

## The loop of a vegetable round (all levels)

Camera: each step glides (0.85 s) to a view framed from the real extents of the bowl, board, block, pot and Bear's head, at any window shape, clear of the caption bubble: bowl (pick), board (knife, chop, scoop), carry (board to pot), pot (tip, knob, cook, stir), serve. The Go! badge appears once per round at the round start. The first time each kind of step comes up a slow ghost-hand demo plays (about 2.5 s; a touch after 0.9 s ends it) and the thing glows.

| Step | The child sees | Narrator says | She must | How she knows | If right | If wrong or nothing |
|---|---|---|---|---|---|---|
| Pick | Bowl, board and Bear. Veg in the bowl are grabbable. | L1: "Put a veggie on the board!" (first round) / "Now the carrot!" or "Now the tomato!" (second). L2: "Find the orange / green / yellow one!". L3: see below. | Drag a veg onto the chopping board (or tap it). | Hand demo the first time (veg goes to board, halo). L1 rounds after the first: every veg in the bowl glows. | The veg arcs onto the board (0.75 s), a swoosh then a knock; Bear watches it land and sidles toward his knife block. | L2: a wrong veg wobbles and hops back, Bear makes a calm face, "Find the orange one!" (same line as the prompt). L3: wrong veg hops back, "Look at the card!" and the card's row glows. L1: any veg is accepted. |
| Knife | Camera on the board; the knife lies on its rest. | "Pick up the knife!" | Tap the knife (or its rest). | Hand demo the first time; the knife glows. | Bear reaches for the handle, lifts the knife off its rest and holds it over the vegetable (about 1 s). | Stuck ladder (glow, demo again at about 8 s). |
| Chop | Bear holds the knife over the veg; it follows her finger. | "Tap to chop!" | Tap (or swipe) on or near the board. | Hand demo the first time. | A tiny lift, then Bear's knife comes down: one chop sound, the board dips, the veg really splits; thin slices flop over to show their rings; juicy bits only on the first cut of each piece. "Chop, chop, chop!" caption at the 3rd chop. | A tap far from the board does nothing (L1 forgives 3 units, L2/L3 0.6). |
| Put away | 3 s without a chop (or 2 s after everything is cut three times, or 100 chops) | | | | Bear puts the knife back on its rest (0.6 s). | |
| Scoop | The board with the pieces. | "Hold the board!" | Press and hold on the board. | Hand demo the first time. | "Scoop!" caption; the pieces slide together into a pile (0.9 s). Bear takes the board's back corners in both paws and lifts it. | Release early: the pile slowly relaxes. Errorless: the pile is gathered 60 %. |
| Carry | Bear holds the board low in front of him. | "Take it to the pot!" | Keep dragging toward the pot and let go. | Hand demo the first time (from board to pot). | Bear walks with the board where the finger leads, raising it over the pot's rim as he gets there. Let go over the pot: a held breath (0.3 s), he tips it, the pieces slide off one by one and plop into the soup (about 1 s); the soup rises and takes the veg's colour. Bear takes the board home while she goes on. | Let go away from the pot: the line and demo repeat; after two such drops (or errorless) he goes to the pot and tips it himself. |
| Knob (first veg only) | The pot and the coral dial, which breathes. | "Tap the knob! Stove on!" | Tap the dial (a big target, radius 0.9). | Hand demo the first time with glow. | Click, the dial turns, the lamp lights, a soft whoomp, a ring of orange cartoon fire tongues (yellow cores) grows round the pot's bottom and keeps flickering, each tongue on its own; steam and bubbles. | Stuck ladder. |
| Cook | Soup simmers, Bear beams. | "It's cooking!" (caption only) | (1.6 s) | | "Into the soup!" / "Yummy soup!" (last veg round of L1, L2), caption only; Pip watches. | |

Stuck ladder: about 5 s the prompt again and the target bobs; about 8 s the hand demo again (every 20 s after); 20 s errorless (halo, 60 % gather, auto tip, a tap stirs); 90 s "Bye bye! See you soon!" and Home.

## Level 1: a morning soup (2 rounds)

| # | What the child sees | Narrator says | Then |
|---|---|---|---|
| Intro | Pip's "Let's cook a soup!" while the bowl view is already up; Bear is already behind the board. Taps open at once. | "Let's cook a soup!" | Round 1 |
| 1 | The bowl holds a carrot and a tomato. "Put a veggie on the board!" Either one is accepted; the round becomes that veggie's round. Then knife, chop, hold, carry, knob, cook as in the loop. "Into the soup!" | | Round 2 |
| 2 | Only the other veg is left and glows. "Now the tomato!" (or "Now the carrot!"). Loop without the knob (the stove is on). "Yummy soup!" | | Finale |

## Level 2: a noon soup, pick by colour (3 rounds)

The bowl holds a carrot, broccoli, corn, a tomato and a potato. "Find the orange one!", "Find the green one!", "Find the yellow one!" are both prompt and redirect. After two wrongs: errorless (halo on the right veg). Corn slices show a small pale cob and two rings of kernels in a two-yellow checker; tomato slices a small pink core, red flesh and four soft chambers a shade lighter.

## Level 3: an evening soup, a recipe card (4 rounds)

A picture recipe card (1 carrot, 2 tomatoes, a ladle, a bowl) is pinned in a top corner of the view, small: top right at the bowl and the board, top left at the pot (Bear stands right of it there); it slides across when the camera moves. A row gets a green tick when it is done. Bear's ladle rests in the pot all level.

| # | What the child sees | Narrator says | She must | If right | If wrong or nothing |
|---|---|---|---|---|---|
| 1 | Card row 1 glows. | "Look at the card! A carrot!" | Drag the carrot to the board. | Tick on row 1; the loop. | Other veg: hops back, "Look at the card!". |
| 2 | Row 2 glows. | "Now two tomatoes!" | Drag a tomato, then another. | Each lands with "One!" / "Two!" and a rising note; then the loop (both are chopped, carried and tipped together). | "One more tomato!" after 6 s idle. |
| 3 stir | Camera on the pot. Bear is already back at the pot (he went straight there after putting the board down) and takes his ladle; she can start circling at once (the ladle moves only once his paw is on it, then catches up with her finger). Row 3. | "Stir the soup!" | Draw circles (or scribble) in the pot. | The ladle's cup follows her finger, Bear's paw on its handle, he shuffles round with it; the pieces are pushed round, the soup swirls and its colours blend into one warm soup; a slosh each half-turn. After two turns: tick, Bear beams, "Stir, stir, stir!" (caption). | Errorless (20 s): one tap stirs a full turn by itself. |
| 4 serve | An empty bowl pops onto the board. Row 4. | "Take the bowl to the pot!" | Drag the bowl toward the pot. | The bowl settles on the board's end by the pot. Bear ladles soup into it twice (a domed soup surface rises, with real little pieces from the pot on top), puts the ladle back, takes the little spoon from the bowl, blows on it (puffs of steam), sips: eyes close, "Mmm!" (caption only), his shoulders drop. Tick on row 4. No success caption. | Any drop serves. |

## Ending (all levels)

The simmer sound stops; Bear lets go of whatever he holds and stands between his pot and his board. "Look what you made!" over the pot, Bear, the board (and the served bowl on L3, `creationView()`), all fully in frame, at least 4 s. The soup shows every vegetable she added (when there are too many pieces, the most plentiful kind sinks first). The pot and the bowl can be poked (`creationObjects()`): a poke sloshes the soup and Bear beams. Photo, sticker, Home.

## Timing (FEEL-BRIEF rule 0)

Measured with real pointer events (`COOKT` log lines): pick ready 0 ms after a round starts; knife ready about 1.05 to 1.2 s after the veg lands; chopping ready about 1.03 s after the knife tap (Bear draws it out and brings it over); "Hold the board!" ready 0.6 s after the last chop; carrying ready about 0.9 s after the pile is gathered; the knob ready the moment the last piece is in the soup; stir ready 0.4 s and serve 0.5 s after their round starts. Nothing she does waits more than about 1.2 s.

## Known engine notes

- The Go! badge sits just under the caption, which in this game's views is over Bear's head; at the start of rounds 2 to 4 it can cover his face for a moment.
