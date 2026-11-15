# World 3 (Farm), polish pass and quality review

Fable 5.2 wrote the design and the quality review. These notes record what was built and what is still open.

## Changes across all fifteen games

- **No computer voice.** Narration appears as caption bubbles only, so a grown-up reads it aloud. To bring the OS voice back, set `VOICE = true` in `app/src/engine/speech.js`.
- **Pacing.**
  - The next round starts about 1 s after a correct answer. Praise no longer blocks the game.
  - `say(text, { max })` caps how long the game waits for a line.
  - The lesson intro, the redirect re-demo, the colour and shape reveals, and the story beats were all shortened.
  - **Counting's last apple:** the total, the recount and the hedgehog's trot all happen together, in about 1.5 s instead of 6 s.
- **Hand cursor** (`engine/cursor.js`).
  - A cartoon glove follows the mouse. On touch it appears under the finger.
  - Pressing squishes it and throws a ring of coloured stars. Dragging closes it into a fist. With a mouse, it grows when it is over something tappable.
- **Pokeable characters.** Tapping Pip or any animal that isn't the answer gives a reaction: its own sound, a face change, and a hop, wobble, curl or rear. This never counts as a wrong answer. The table is `POKE` in `engine/actors.js`.
- **Idle life.** Every character blinks, breathes and sways. Pip's wings flutter.
- **Motion.**
  - Hops have anticipation, stretch and a squashy landing.
  - Pop-ins overshoot with an elastic settle.
  - Dragged things lean into the direction of travel.
  - Pip rotates through four celebrations: dance, double hop, wing clap and backflip.
- **Visuals.**
  - Warm key light and a cool rim light.
  - A 4-step toon ramp and soft gradient blob shadows.
  - Per-world fog and a vignette.
  - A sun halo, instanced grass tufts, ground patches, petalled flowers and a far tree line.
- **Sound.**
  - About 30 new synthesized sounds: animal calls, drums, pour, crunch, bloop, land, pick-up, round start and more.
  - Each sound has random pitch variation and a repeat limit.
  - Sound effects duck under speech, and the success chime rotates through 4 variants.
- **Numbers on screen.** Counting floats each numeral up as the fruit is tapped, then the total. Drums show 1, 2, 3 as they are hit.

## World 3: Farm 🚜

The scenery has:
- a barn, silo and turning windmill
- a fence, haybales, rows of wheat and sunflowers
- a pond with ripples
- two butterflies and a dirt path

Pip wears a straw hat.

| Game | Taxonomy topics | How it plays | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|---|
| 🐮 Who says moo? | `mt_ppENoD8vf1` Local plants & animals | A sound plays and the child taps the animal that made it. Every animal answers with its own call. | 2 animals | 3 animals | Sound only, with no word; 3–4 animals |
| 🌱 Grow a flower | `mt_0B64gfJf7j` Seeds & plant growth; `mt_L1469gt34A` What living things need | Drag the seed onto the soil, drag the watering can to water it, then tap the cloud to let the sun out. The plant grows a stage each time, and finished flowers line up at the back. | One step at a time, and only the tool needed is shown | All three steps, in order | "It's thirsty!"-style clues, a silly distractor (a rock, sock or ball), and the step order changes in the last two rounds |
| 🥕 Share the snacks | `mt_FwI7q7DSIx` Taking turns and sharing; `mt_LpSuPgL31x` Division as equal sharing | Drag carrots to the bunnies one at a time. A bunny that already has more shakes its head, and the bunny still waiting hops. | 2–3 bunnies, 1 carrot each | Up to 2 each | Up to 3 each; some bunnies start with a carrot; 4 bunnies |
| 🥁 Barn band | `mt_2mb17lUCPD` Creating and shaping musical sound | Pip plays the beats, then the child copies them. A farm audience bounces along. | Big drum, 1–3 beats | Loud drum vs quiet drum | Mixed sequences such as loud-quiet-loud |
| 🐥 Peekaboo pots | `mt_AzNSWFgtxC` Remembering visual forms | Chick hides under a flowerpot and the child taps to find it. | 2–3 pots; sometimes a tail feather peeks out | Pots swap 1–2 times | 3–4 pots, faster swaps, and a frog decoy in the last round |

The exact round data for every game is in `PLANS` at the top of each file in `app/src/lessons/`.

## Fable's quality review: not built yet

These are the highest-value ideas from the review that are not in this build:

| Game | Ideas |
|---|---|
| Colour tubes | Tubes with faces that gulp; the item theme changes each round |
| Shape house | Animals peek out of the finished windows; a magnetic snap near the right hole |
| Feelings | A short "fix the feeling" moment after each match, such as a hug for sad or a breath for angry; several stories per emotion |
| Pattern parade | The parade marches off as the round transition; the finished pattern plays back as a tune |
| Bear's nose | Bigger reactions on repeat touches; Bear touches its own part afterwards; accessories on the parts |
| Splash wash | Foam that builds up and bubbles you can pop; a different mess each round |
| Across all games | A streak reward (Pip gets sunglasses); one rare surprise per session; 3 s of free play before the sticker; stickers you can poke |
