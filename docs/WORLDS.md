# Worlds and games

There are five worlds and 21 games. Every game teaches real topics from the Marble os-taxonomy. Where it fits, a game combines more than one concept, the way Brick letters joins letters with counting.

| # | World (id) | Theme | Games |
|---|---|---|---|
| 1 | 🌼 Meadow (`meadow`) | Outdoors: colour, number, shape, feelings, size | Colours, Counting, Shapes, Feelings, Big & small |
| 2 | 🏖️ Beach (`beach`) | Water and seaside play | Patterns, Where's Crab, Which has more, Bear's nose, **Sink or float lab** (new) |
| 3 | 🚜 Farm (`farm`) | Animals, food and growing | Who says moo, Share the snacks, Barn band, Peekaboo pots, **What happens next?** (new) |
| 4 | 🏠 Home (`dressup`; the id is unchanged, the name and icon are new) | Me and my day | Dress Monkey, **My day** (new; replaces Splash wash), **Snack chef** (new) |
| 5 | 🏗️ Building site (`build`) | Making and measuring | Brick letters, **Block builder** (new), **Fill & balance** (new) |

## New games

**🧪 Sink or float lab** (`sink`, beach)
- **Topics:** Describing material properties `mt_auVZZEuXjs`, Simple tests and experiments `mt_Wa44s-f8Ws`, Did it happen as predicted? `mt_MRQcEvyPJv`
- **Play:** guess sink or float, drop the object in the water tank, watch what happens, then sort it into the matching tub.
- **Levels:**
  - L1: obvious objects (rock, duck).
  - L2: a guess first (tap 🙂 float / ⬇️ sink), then test, with "Did it happen?" feedback.
  - L3: surprises (a big log floats, a small coin sinks), plus "which rolls / which bounces".

**📖 What happens next?** (`story`, farm)
- **Topics:** Story sequence and central message `mt_VEwM7ClYYE`, Ordering events in time `mt_-vvVxpOHG2`, Predicting what happens next `mt_8-POYyg7GJ`
- **Play:** short 3D picture stories, such as egg → crack → chick, seed → sprout → flower, or caterpillar → cocoon → butterfly.
- **Levels:**
  - L1: tap what comes next (two choices).
  - L2: put 3 cards in order.
  - L3: 4 cards, then predict the ending.

**🌞 My day** (`myday`, home; replaces Splash wash)
- **Topics:** Keeping clean and healthy `mt_vbbxnY7ZDT`, Keeping up a healthy routine `mt_2eVg4Tt5r0`, Ordering events in time `mt_-vvVxpOHG2`
- **Play:** act out real routines on a character: wash hands with soap and rinse, brush teeth, bath with bubbles, cover a sneeze.
- **Levels:**
  - L1: one routine, step by step.
  - L2: a short morning routine.
  - L3: pick the next step yourself, including bedtime.

**🍓 Snack chef** (`snack`, home)
- **Topics:** Preparing simple healthy snacks `mt_F62VTeHB4-`, Balanced diet and food groups `mt_QhLAeAlHI0`, Keeping food safe and clean `mt_EWiY8-opdd`, plus one-to-one counting `mt_WcfaSfVT33`
- **Play:** wash hands first, then build a plate, counting the pieces onto it.
- **Levels:**
  - L1: put the 3 strawberries on the plate.
  - L2: one fruit and one veg.
  - L3: one food from each group, and wash the fruit too.

**⚖️ Fill & balance** (`balance`, building site)
- **Topics:** Comparing capacity `mt_zkFbMLpu3U`, Measuring mass and weight `mt_-P1kdZhHbL`, Early maths vocabulary `mt_lMz9nAs7VO`
- **Play:** pour sand or water to make buckets full, half full or empty; a see-saw shows which side is heavier.
- **Levels:**
  - L1: fill it up, and empty.
  - L2: full / half / empty, and heavy vs light.
  - L3: make the see-saw balance, and "which holds more?"

**🧊 Block builder** (`blocks`, building site)
- **Topics:** 3-D shapes `mt_Qcp2d_kuta`, Combining simple shapes `mt_XjwUlmxdCT`
- **Play:** stack cubes, cylinders, cones and arches to copy a little model; find which shape rolls.
- **Levels:**
  - L1: 2–3 blocks.
  - L2: 4–5 blocks with a roof.
  - L3: a model with a "which one rolls / stacks?" twist.

## Rules for building a game
1. Read `docs/QUALITY-BRIEF.md` and `docs/GAME-BRIEF.md`. Study `app/src/lessons/bricks.js` and `dress.js` as recent examples of game structure.
2. **Quality:**
   - Blender models only for every object (`tools/blender`, `prop_*`).
   - No clipping and no swaying props.
   - Real physics where it adds something.
   - Characters walk.
   - Every target is visible and tappable.
3. **Level 1 / 2 / 3** each feel clearly different, both visually and in difficulty.
4. **Captions are spoken aloud** by a voice. Keep each one short, simple and natural, with no emoji in sentences, for example "Put the crab ON the bucket!".
5. **Pacing:** snappy, with one demo per game (`showHint`), and `nudgeTarget()` implemented.
6. **Registration** (small exact additions only; other games are being added at the same time):
   - a `meta.js` `LESSON_LIST` entry with the world id above and the real topic ids
   - the import and `LESSONS` entry in `main.js`
   - in `home.js`, the icon in `ICONS`, plus `CENTER_Y`
   - the autoplay hooks in `tools/autoplay.js`
7. **Testing:**
   - `tools/snap.js`, one Electron at a time.
   - Test each level once. Re-test a scene only when you change something that affects it. Never re-run passes that are already verified.
