# Little Learners

Twenty-one touchscreen learning games for a 2-year-old, in five worlds (meadow, beach, farm, home, building site), each with Levels 1–3 that also change how every world looks. The app opens on a world map: five toy islands, one per world. The plan for the worlds is in docs/WORLDS.md. Built with Three.js; every character and prop is sculpted and rigged in Blender (tools/blender). Everything runs offline; the app makes no network requests.

## Running it

**Windows:** copy the folder `dist/Little Learners-win32-x64` to the PC (or unzip `dist/Little Learners-win32-x64.zip`). Then double-click `Little Learners.exe`. It opens fullscreen.

**Mac:** open `dist/Little Learners-darwin-arm64/Little Learners.app`, which is for Apple Silicon. The app isn't code-signed, so the first launch needs a right-click and **Open**.

**Developer mode:** run `npm install` once, then `npm start`.

## For grown-ups

| What | How |
|---|---|
| **Pick a level** | The **Level 1 · 2 · 3** buttons, bottom-left of the map and of each world's page. The level applies to every game. |
| **Pick a world** | The app opens on the **world map**. Tap an island (or its label) to fly into that world. Each label shows the world's games. |
| **More games** | On a world's page, **swipe** left or right or tap the ◀ ▶ arrows for the next world, or tap a world's dot (bottom right) to jump to it. The **🗺️** button next to the dots goes back to the map. |
| Open the parent panel (and **Quit**) | Hold the **⚙️ gear button** in the top-right corner for 1.5 seconds. The panel has the quit button, sound and music volume, sticker reset and recent results. |
| Quit from the keyboard | Ctrl+Shift+Q (⌘⇧Q on a Mac) |
| Go back to the world's page (the child can do this) | Hold the 🏠 button for about 1 second |

**How each round starts.** A speech bubble at the top of the screen shows Pip's words for you to read aloud, and a 👆 hand demonstrates the move straight away. A drag leaves a dotted trail. You can then do it together with your child. On Level 3 the hand shows the kind of move without giving the answer away. If nothing happens for a while, the cue plays again.

**No computer voice.** There is no synthesized speech. The words appear on screen for a grown-up to read, and the games carry themselves with sound effects, animal calls, numbers that pop up and the pointing hand.

**Play extras:**
- The pointer is a cartoon hand that squishes and sparkles on every press.
- Tapping Pip or any animal that isn't part of the answer makes it giggle, hop, moo or wobble. It is never counted as wrong.

**Tip for Windows touch laptops:** swipes from the screen edge open Windows menus. You can turn edge swipes off in Windows settings, or use Assigned Access (kiosk mode), so little fingers can't leave the app.

## The games

Games marked **new** are still being built (see docs/WORLDS.md). 🌞 My day has replaced 🧽 Splash wash, in the Home world.

**Music:** one gentle instrumental loop per world (made with Suno for personal use), plus CC0 sound effects (see app/assets/sfx/CREDITS.md).

**Tapping animals:** they react in ~15 different ways, getting sillier; after 15 quick taps they nap for a few seconds (3 taps wake them).

Every game uses topics from the [Marble os-taxonomy](https://github.com/withmarbleapp/os-taxonomy). The taxonomy rates these topics for ages 3 and up, so for a 2-year-old they are early exposures.

### World 1: Meadow 🌼

| Game | Taxonomy topic | What your child does |
|---|---|---|
| 🎨 Colour tubes | `mt_xppl18avyY` Sorting into categories | Drags each object into the tube of the same colour |
| 🍎 Apple count | `mt_WcfaSfVT33` One-to-one counting, `mt_dmNvjroCPT` How many in total? | Taps each fruit once and hears one number per tap, then the total |
| 🔺 Shape house | `mt_KJeEeTutJI` 2-D shapes | Drags shapes into the matching holes, including small and tilted ones |
| 😊 Feelings | `mt_LhkP_KKIRS` Naming basic emotions | Watches a mini story, then finds the friend who feels the same |
| 🐘 Big and small | `mt_NtJYlJdUe9`, `mt_uhuxX8sg9f` Comparing sizes | Taps the big one or the small one |

### World 2: Beach 🏖️

| Game | Taxonomy topic | What your child does |
|---|---|---|
| 🔴 Pattern parade | `mt_ZjIFGc6zPW` Finding the repeating unit, `mt_WXW0hjNhph` Patterns | Hears "shell, star, shell, star…" and taps what comes next. Level 3 adds AAB and ABC patterns and a missing-middle pattern. |
| 🦀 Where's Crab? | `mt_qeZYF6HZ4o` Positional language, `mt_VY3rBq8RyP` Prepositions | Drags Crab in the bucket, on the stool or under the stool |
| 🐚 Which has more? | `mt__h7hvT4tEb` Comparing groups: more or fewer | Taps the group with more. The groups pair up one-to-one so the extras stand out, then she feeds them to a hungry friend who gets rounder all level. |
| 👃 Bear's nose | `mt_83gRQ9OPkc` Body parts & senses | Touches the named body part. Level 3 gives clues like "We smell with our nose!" |
| 🧪 Sink or float lab (**new**) | `mt_auVZZEuXjs` Describing material properties, `mt_Wa44s-f8Ws` Simple tests and experiments, `mt_MRQcEvyPJv` Did it happen as predicted? | Guesses sink or float, drops the object in the water tank, watches, then sorts it into the matching tub. Level 3 has surprises: a big log floats, a small coin sinks. |

### World 3: Farm 🚜

| Game | Taxonomy topic | What your child does |
|---|---|---|
| 🐮 Who says moo? | `mt_ppENoD8vf1` Local plants & animals | Hears an animal call and taps the animal that made it. Level 3 gives the sound only. |
| 🥕 Share the snacks | `mt_FwI7q7DSIx` Taking turns and sharing, `mt_LpSuPgL31x` Equal sharing | Gives carrots one at a time until every bunny has the same. |
| 🥁 Barn band | `mt_2mb17lUCPD` Creating musical sound | Copies Pip's drum beats. Level 2 adds loud vs quiet, and Level 3 mixes them. |
| 🐥 Peekaboo pots | `mt_AzNSWFgtxC` Remembering visual forms | Finds the chick under the right flowerpot. From Level 2 the pots swap places. |
| 📖 What happens next? (**new**) | `mt_VEwM7ClYYE` Story sequence, `mt_-vvVxpOHG2` Ordering events in time, `mt_8-POYyg7GJ` Predicting what happens next | Short picture stories (egg → chick, seed → flower). Taps what comes next, then puts 3, later 4, cards in order. |

### World 4: Home 🏠

| Game | Taxonomy topic | What your child does |
|---|---|---|
| 🐒 Dress Monkey | `mt_83gRQ9OPkc` Body parts & senses, `mt_Dj2xr8CoI0` Dressing for the weather | Drags clothes from the wardrobe onto Monkey. Level 1 hats, Level 2 tops, Level 3 dressing for the weather. |
| 🌞 My day | `mt_vbbxnY7ZDT` Keeping clean and healthy, `mt_2eVg4Tt5r0` Keeping up a healthy routine, `mt_-vvVxpOHG2` Ordering events in time | Does Bunny's routines in a little bathroom and bedroom, one real step at a time: tap on, soap and rub, rinse, towel; toothpaste, brush, rinse; a tissue for a sneeze, then the bin; a bubble bath; brushing fluffy ears. Level 2 is a whole morning (wake up, open the curtains, make the bed, then the bathroom). Level 3 is the evening: nothing glows, the child picks what comes next, through to bedtime and lights off. |
| 🍓 Snack chef (**new**) | `mt_F62VTeHB4-` Preparing simple healthy snacks, `mt_QhLAeAlHI0` Balanced diet and food groups, `mt_EWiY8-opdd` Keeping food safe and clean, `mt_WcfaSfVT33` One-to-one counting | Washes hands, then builds a plate, counting the pieces onto it. Level 3 takes one food from each group. |
| 🍲 Cook a soup (**new**) | `mt_F62VTeHB4-` Preparing simple healthy snacks, `mt_QhLAeAlHI0` Balanced diet and food groups, `mt_QR3vxbN1o4` Planning a task, `mt_WcfaSfVT33` One-to-one counting | Picks a veggie, picks up the knife and chops it into lots of pieces (really sliced: carrot coins, tomato wedges, onion rings), holds the board to scoop them up and tips them into the pot, then turns on the stove. Level 2 asks for a colour ("Now the orange one!"); Level 3 follows a picture recipe card (1 carrot, 2 tomatoes), stirs, and serves Bear a bowl. |
| 🍭 Candy beats (**new**) | `mt_2mb17lUCPD` Creating and shaping musical sound, `mt_KTSoXcO7OL` Pitch, `mt_OTFABm2xdf` Rhythm in rhymes and songs, `mt_WXW0hjNhph` Patterns & sequences | Singing candies on a cake stage, one note each and always the same colour (red C up to purple A, low to high). Pip plays a little tune, the child copies it back; every finished phrase drops a sweet into the jar. Level 1: two or three candies, two- and three-note calls. Level 2: four candies, long and short notes (ta, ti-ti, ta-a). Level 3: two lines of a nursery tune (Twinkle Twinkle, Mary Had a Little Lamb, Old MacDonald, London Bridge...) that then play back together as the whole song with a soft band. |

### World 5: Building site 🏗️

| Game | Taxonomy topic | What your child does |
|---|---|---|
| 🧱 Brick letters | `mt_frDIaXzWbx` Knowing all letters, `mt_WcfaSfVT33` One-to-one counting, `mt_yqAL6O5i_v` Counting objects to 20 | Taps bricks to build a capital letter, counting each brick (5 per letter, rising to 20). Level 1 A–G, Level 2 H–N, Level 3 O–T. |
| 🧊 Block builder (**new**) | `mt_Qcp2d_kuta` 3-D shapes, `mt_XjwUlmxdCT` Combining simple shapes | Stacks cubes, cylinders, cones and arches to copy a little model, and finds which shape rolls. |
| ⚖️ Fill & balance (**new**) | `mt_zkFbMLpu3U` Comparing capacity, `mt_-P1kdZhHbL` Measuring mass and weight, `mt_lMz9nAs7VO` Early maths vocabulary | Pours sand or water to make buckets full, half full or empty; a see-saw shows which side is heavier. |

### What the levels change

| | Level 1 ★ | Level 2 ★★ | Level 3 ★★★ |
|---|---|---|---|
| Choices | 2, very different from each other | 3, closer together | Trickier: patterns with a twist, "fewer", near-equal groups |
| The hand at the start of a round | Shows the exact answer | Shows the exact answer | Shows how to move, not the answer |
| Examples | Sort 2–3 colours, count to 3, "in" or "on" with one prop | 4 colours, count to 4, in/on/under | Count to 5, AAB/ABC patterns, near-equal groups, a wet sponge first |

**Rewards:**
- Every correct answer gets confetti, a chime and a celebration move from Pip.
- Finishing a game earns a sticker for that world's shelf on the home screen.
- Three stickers in one game put a crown on that game's object.

**No failing:** a wrong choice gets a soft "boop" and a gentle redirect in the speech bubble, such as "That's blue. Find red!", and then the hand shows the move again. If your child gets stuck, the help comes in steps:
1. After 6 s the cue plays again.
2. After 12 s the answer glows.
3. After 20 s, or after two wrong tries, only the right answer still works.

## Project layout

```
app/main.js            Electron shell: fullscreen, blocks reload/zoom keys, keeps the screen awake
app/index.html, style.css
app/vendor/three.module.js   Three.js r170, stored locally
app/src/engine/        stage, toon shading and outlines, touch input, synthesized audio, speech, tweens, effects, lesson base class, storage, UI
app/src/lessons/       the games and meta.js (worlds and the taxonomy mapping)
app/src/worldmap.js    the world map the app opens on (five islands; tap one to fly into that world)
app/src/home.js        each world's page (its 3–5 games; swipe between worlds, 🗺️ back to the map)
app/src/engine/beach.js  beach props: crab, bucket, ball, shell, sponge, gull, body-part anchors
tools/snap.js          dev tool: drives the app and saves screenshots
tools/viewmodel.sh     renders one character model (front, 3/4, side, close-up)
tools/autoplay.js      plays every game automatically (inject with snap.js) for testing
app/src/models/        old code-built models (fallbacks)
tools/blender/         Blender scripts that sculpt, paint and rig every character and prop (build.sh → app/assets/models/*.glb)
app/assets/            models, sound effects and music
docs/DESIGN.md         the design plan for the original five games
docs/DESIGN-WORLD2.md  the design for the beach world and the level tables
docs/DESIGN-WORLD3.md  the farm world, the polish pass and the quality review
docs/WORLDS.md         the five worlds and 21 games, and the rules for building a new game
app/src/engine/farm.js   farm animals and props; cursor.js is the hand cursor
```

## Rebuilding

```bash
npm install
npm run package:win    # → dist/Little Learners-win32-x64/Little Learners.exe
npm run package:mac    # → dist/Little Learners-darwin-arm64/Little Learners.app
```

For an Intel Mac, change `--arch=arm64` to `--arch=x64` in `package.json`.
