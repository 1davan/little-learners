# Block builder (`blocks`) — storyboard

- **World:** Building site (`build`). Bear (hard hat) stands at the back right by the shelf's end and the toy box, Pip at the back left beside the model stand.
- **Learning goal:** copy a little model by matching 3-D shapes (cube, long block, cylinder, cone, roof, arch, ball) to their outlines; the shape names are spoken as she picks blocks up. L3 adds "which shape rolls" and "which shape stacks".
- **Levels:** 3, six rounds each. L1 = 6 models of 2 to 3 blocks (short tray). L2 = 6 models of 4 to 5 blocks plus one spare. L3 = three 5-block builds, two "which rolls?" rounds and one "put a block on the tower" round.
- Source: `app/src/lessons/blocks.js`, `blocks-pieces.js` (MODELS, PLANS, tray / shelf / flag), `blocks-sound.js`; models `tools/blender/creatures/prop_blocks.py`.

## Fixed scene

A blueprint mat in the middle, the round model stand at the left, a wooden tray in front (L1 a short 6.2 tray, L2/L3 the long 11.0 one), the toy box at the right, and behind the mat a low **keepsake shelf**: every finished model goes there and stays all level. The camera opens wide, then every build round uses one view holding the model stand, the mat, the tray and the toy box together (framed so the whole tray and the finished build, with room for its flag, are on screen). The model, the ghosts and the blocks all arrive at once, so she can take a block within about 0.9 s.

## Engine behaviours

- **Game open:** Pip waves, "Let's build with blocks!" `[voiced]`.
- **Hand demos:** the first time each action comes up (build, roll, stack) a slow ghost-hand demo plays (any touch ends it); again when she is stuck about 8 s, then every 14 s.
- **Idle ladder:** 5 s / 8 s = the action line again ("Put the blocks on the white shapes!", "Which one rolls? Tap it!", "Put a block on the tower!") + the block to use bobs; 20 s = errorless (spare / wrong blocks switch off, small halo on the answer); 90 s = home.
- **Picking up a block** says its name: "A cube!", "A long block!", "A cylinder!", "A cone!", "A roof!", "An arch!", "A ball!" (spoken; a repeat within 30 s is caption only).

## Build round template

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | All at once: the mini blocks pop in on the stand bottom first and the stand turns once (the model stays there all round; small models are shown bigger, up to 0.7 size, so a two-block tree reads from the corner view); the white ghosts fade in on the mat; the blocks hop out of the toy box into the tray (0.3 s apart). The camera settles on the whole corner (0.9 s first round, 0.6 s later). The first block lands about 0.85 s in and can be dragged at once. Tapping the little model makes it wiggle: "Like this!". | Intro: R1 "Let's build a tree like this!" / "…a big house like this!" / "…a bridge with towers like this!"; later rounds "Now a house!" etc. | (see 2) | The model on its stand. | n/a | n/a | 2 |
| 2 | She builds. | First build of a level: "Put the blocks on the white shapes!" | Drag a block onto a white shape. | Ghosts glow; while she carries a block every ghost of that shape lights in the block's colour, brightest under her finger. First build of the game: slow drag demo. | The block flies over its place and drops in with physics (tok rising with each block, a squash). Its twin on the stand hops, carrying the minis above it. If the same shape has two colours, the copy follows her: the minis swap colours. **L1:** a block whose base isn't in yet hovers 1.5 above its place, bobbing gently, and drops once the base lands. | Dropped on nothing: hops back to the tray, no line. Wrong shape L1: it goes to its own place anyway. Wrong shape L2/L3: back to the tray, matching ghosts flash, "The cone goes there!". Spare block: "We don't need a ball!". Upper block before its base, L2/L3: "First the cube!" (the lowest missing block under it) and that ghost flashes. Two wrongs: errorless. | 2 until all placed |
| 3 | Last block lands: a held breath (0.4 s), a xylophone run up the build (each block hops carrying what stands on it), a soft glow, then the gag: flag pops up on top (its colour never matches the top block), the rocket lifts off a little in puffs, tree / bridge / gate / house-and-tree bounce up again with one note per block. Bear: joy face, arms up. | "You built a house!" `[caption only]` | none | n/a | n/a | n/a | 4 |
| 4 | **The build is hers.** Bear turns to look at it and claps once. Every block is live: a tap on any block knocks the whole build down from that block (real physics, blocks tumble away sideways from her finger, the flag goes first, one crash sound), Bear makes a joy face and hops a little. Left alone: at 8 s Bear asks and leans toward it; at 14 s the round moves on with the build still standing. | 8 s: "Knock it down?" | Tap the build (optional). | Bear's lean. | n/a | n/a | 5 |
| 5 | The model on the stand flies to the keepsake shelf (1.0 s) and stays. The blocks hop into the toy box one at a time, 0.25 s apart, a wooden knock each (nearest the box first); the ghosts fade. On the **last round**, if she didn't knock it down, the build stays standing for the finale. | none | none | n/a | n/a | n/a | next round |

## Level 3 twists

- **Roll round (R2, R6):** the ramp (yellow slope, lane rails, blue sides with an orange trim) is turned so it runs down toward the front left; the camera keeps the same whole-corner view as the builds (Bear, Pip, stand, tray and box all whole). The ramp and the three blocks arrive together (about 1.15 s to the first tap). "Which one rolls? Tap it!" (cue). Tap the one that rolls: it rolls down (physics), "The ball rolls!" / "The cylinder rolls!" (spoken). Tap another: a little push, it stays put, "The cube stays still!" / "The cone stays still!". Then the ramp folds away and the blocks hop into the box.
- **Stack round (R4):** the model shows the two-cube tower with a cube on top. "Put a block on the tower!". The ball on top really rolls off: "Oops! The ball rolls off!" (no wrong counted: that's what balls do) and it hops back. The cube stacks: "The cube stacks!" (spoken), flag, then the same knock-down-or-leave step and the tower's model goes to the shelf.

## Ending (all levels)

`finale()`: the camera frames the keepsake shelf, low and straight on with Pip and Bear whole at its right end (or, when the last build is still standing, the build on the mat with the shelf behind it). "Look what you made!" The shelf models (and the standing build) are pokeable: a press and a note each. Bear claps. Photo, sticker, Home.

## Timings (measured, real drags)

- Build and stack rounds: round start → first block draggable about 0.9 s (see the re-test numbers in the fix report).
- Roll rounds: about 1.2 s.
- After the last block: beat + run + gag about 2.3 s, then the build is touchable (knock it down) for up to 14 s.

## Every narrator line

Intros ("Let's build a tree like this!", "Now a house!" …), "Like this!" (tapping the model), "Put the blocks on the white shapes!", shape names on pick-up, "The cube goes there!" (and the other six), "First the cube!" / "First the long block!" / "First the cylinder!" / "First the arch!", "We don't need a …!", "You built …!" (caption), "Knock it down?", "Which one rolls? Tap it!", "The ball rolls!", "The cylinder rolls!", "The cube stays still!", "The cone stays still!", "Put a block on the tower!", "Oops! The ball rolls off!", "The cube stacks!", "Look what you made!", "You did it! A sticker!".
