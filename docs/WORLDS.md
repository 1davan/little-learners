# Worlds and games

There are five worlds and 21 games. Every game teaches real topics from the Marble os-taxonomy. Where it fits, a game combines more than one concept, the way Brick letters joins letters with counting.

| # | World (id) | Theme | Games |
|---|---|---|---|
| 1 | 🌼 Meadow (`meadow`) | Outdoors: colour, number, shape, feelings, size | Colours, **Paint & mix** (new), Counting, Shapes, Feelings, Big & small |
| 2 | 🏖️ Beach (`beach`) | Water and seaside play | Patterns, Where's Crab, Which has more, Bear's nose, **Sink or float lab** (new) |
| 3 | 🚜 Farm (`farm`) | Animals, food and growing | Who says moo, Share the snacks, Barn band, Peekaboo pots, **What happens next?** (new), **Word world** (new) |
| 4 | 🏠 Home (`dressup`; the id is unchanged, the name and icon are new) | Me and my day | Dress Monkey, **My day** (new; replaces Splash wash), **Snack chef** (new), **Cook a soup** (new), **Candy beats** (new) |
| 5 | 🏗️ Building site (`build`) | Making and measuring | Brick letters, **Block builder** (new), **Fill & balance** (new), **Letter friends** (new), **Roll & push** (new), **Shape puzzles** (new) |

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
  - L1: the narrator tells cards 1 and 2; she picks the ending (two choices).
  - L2: the narrator tells card 1; she puts cards 2 and 3 in order.
  - L3: she puts all 3 cards in order.
  - Every level: she then tells the finished story by tapping each card, and its ending card stays on the story shelf.

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

**🍭 Candy beats** (`candy`, home)
- **Topics:** Creating and shaping musical sound `mt_2mb17lUCPD`, Pitch `mt_KTSoXcO7OL`, Rhythm in rhymes and songs `mt_OTFABm2xdf`, Patterns & sequences `mt_WXW0hjNhph`
- **Play:** call and response on a row of singing candies (Blender, with faces). Each candy is one fixed note and colour, low to high: red bean C, orange sweet D, yellow drop E, green gummy F, blue lollipop G, purple gumdrop A. Pip plays a phrase (candies light up in time, their twins pop onto short / long sugar tiles on the music board), then the child copies it. A wrong candy still sings, then the right one plays again ("This one!"). Long notes are press-and-hold (the long tile fills while she holds; letting go early still counts). Each phrase ends with a sparkle run and a sweet flying into the jar, which keeps them all game. No confetti or boings; the world music pauses so the candies are the music. Phrases come from a library of nursery-tune fragments and rhythm patterns (`candy-tunes.js`), never repeated in a game.
- **Levels:**
  - L1: two candies, then three; two- and three-note calls, slow.
  - L2: four candies; three to five notes with long and short notes.
  - L3: five candies, then the purple one joins (so Twinkle, Baa Baa, Old MacDonald and London Bridge fit); two lines per tune, then the whole song plays back with a soft band, and she can play along (the next candy glows early, no wrong notes).
  - Ending: "Look what you made!" frames the candy row and the jar of sweets; poking a candy plays it, the jar clinks.

**⚖️ Fill & balance** (`balance`, building site)
- **Topics:** Comparing capacity `mt_zkFbMLpu3U`, Measuring mass and weight `mt_-P1kdZhHbL`, Early maths vocabulary `mt_lMz9nAs7VO`
- **Play:** pour sand or water to make buckets full, half full or empty; a see-saw shows which side is heavier.
- **Levels:**
  - L1: fill it up, and empty.
  - L2: full / half / empty, and heavy vs light.
  - L3: make the see-saw balance, and "which holds more?"

**🎢 Roll & push** (`roll`, building site; design `docs/design/roll.md`)
- **Topics:** Pushes & pulls `mt_B3W5EfimJw`, Gravity & falling objects `mt_AvrQauS_zX`, Actions and their consequences `mt_UHQfb-n-w3`, Hands-on problem solving `mt_20WfHhnL39`, Predicting what happens next `mt_8-POYyg7GJ`, Positional language `mt_qeZYF6HZ4o`, Planning a task `mt_QR3vxbN1o4` (Level 3), plus one-to-one counting `mt_WcfaSfVT33`
- **Play:** a baby hedgehog rolls home to Mummy along a wooden toy track; something is in the way and the child taps a yellow block, pushes a blue box or ramp, or presses a dome button, and real physics does the rest. Every baby stays in the nest (Mummy counts them).
- **Levels:**
  - L1: tap (10 puzzles: blocks, tall blocks, up-blocks, the red door).
  - L2: push (14 puzzles: boxes into holes, ramps to steps, a bridge, a cart that rolls by itself, a cookie wall to nibble, a crate that floats, a green jelly that bounces).
  - L3: think (14 puzzles: lifts, coloured doors, a see-saw, a balloon that lifts the baby, crate or stone in the water, what comes first).
  - From the second puzzle on she picks which of two babies (each one different) rolls next; the babies she brings home are kept.

**🔷 Shape puzzles** (`puzzles`, building site; design `docs/design/puzzles.md`)
- **Topics:** 2-D shapes `mt_KJeEeTutJI`, Trying a new approach `mt_95zxYqpP7m`, Planning a task `mt_QR3vxbN1o4`, Remembering visual forms `mt_AzNSWFgtxC`, Combining simple shapes `mt_XjwUlmxdCT`
- **Play:** a toy cupboard under the picture opens with one wooden shape (and later a lid, box, cup, string, key or peg to deal with first); the child presses it into its hole on a long wooden picture board, and the picture grows left to right, one piece a puzzle. Ten puzzles a level; each level ends on the finished picture (a ten-note instrument to poke).
- **Levels:**
  - L1: the sunny garden: circle, square, triangle; one hole, then "which hole fits?" among two or three.
  - L2: the rocket night: + rectangle, star; hidden things: a lid over the hole, the shape in a box, a block in the hole.
  - L3: the robot's party: + heart, big and small; tools: pull a string to lift the glass, a key, a peg that frees a rolling ball.

**🧊 Block builder** (`blocks`, building site)
- **Topics:** 3-D shapes `mt_Qcp2d_kuta`, Combining simple shapes `mt_XjwUlmxdCT`
- **Play:** stack cubes, cylinders, cones and arches to copy a little model; find which shape rolls.
- **Levels:**
  - L1: 2–3 blocks.
  - L2: 4–5 blocks with a roof.
  - L3: a model with a "which one rolls / stacks?" twist.

**🔤 Letter friends** (`letters`, building site; design `docs/design/letters.md`, words from `docs/design/VOCAB.md`)
- **Topics:** Knowing all letters `mt_frDIaXzWbx`, Single Letter Sounds `mt_F978c32kDr`, Spotting and making alliteration `mt_j89i4u2fKr`, Using New Vocabulary `mt_NP101Zl-4g`
- **Play:** the Alphabet Train stops at a station; a chunky letter friend arrives, the trunk opens and its things tumble out (apple, ant, ambulance); tap each to hear it, then pack them into that letter's carriage. Four letters per play; each replay brings the next set (all 26 letters).
- **Levels:**
  - L1: meet the letters (open the trunk four ways, tap to hear, pack the carriage, the train rolls on).
  - L2: which letter? (sort each thing to its letter's carriage; "Where is S?").
  - L3: first sounds ("Mmm!" Who starts like this? then "Sss... snail!" to its letter).

**🗣️ Word world** (`words`, farm; design `docs/design/words.md` (same file as WORDS.md on this disk), words from `docs/design/VOCAB.md`)
- **Topics:** Using New Vocabulary `mt_NP101Zl-4g`, Listening and responding `mt_mB7DVai-Uf`, Sorting & Categorising Words `mt_oL9s_bufDp` (also `mt_6-MYToNZ39`, `mt_6lHBTwQPrS`, `mt_yBJyCfhtem`, `mt_xppl18avyY`, `mt_zVLOm6U7bh`, `mt_83gRQ9OPkc`)
- **Play:** Pip visits two little corners of one place (farmyard, kitchen, bathroom, the street...). Tapping a thing names it ("A cup!"), a second tap says a little more ("Have a drink."). Then "Where's the cup?": her tap takes its photo for the photo line; at the end she pops the photos into her word book, which keeps them for ever. 300 words in 9 places; the planner (`words-plan.js`) brings 2–4 new words a visit and brings each back at widening gaps; a word appears only once its model is built.
- **Levels:**
  - L1: meet six things, then find each out of two.
  - L2: find out of three, with listen rounds and two "again" rounds.
  - L3: find out of three, then a toy train brings toys she knows and she drags each to its home (barn, basket, toy box, wardrobe, garage).

**🖌️ Paint & mix** (`paint`, meadow; design `docs/design/paint.md`)
- **Topics:** Making and controlling marks `mt_6msyXavNJf`, Mixing and adjusting paint colours `mt_-STxLMqeqF`, Composing visual artwork `mt_2Kn5ianVWN`, Giving and following instructions `mt_r-BgS-lqTe`
- **Play:** touch a pot and the fat brush dips itself; rub a wooden cut-out toy and real paint goes on just above her finger (strokes, tap splats, a dot stamp); then she hangs it on the gallery wall, which fills up all level (the finale is the wall of eight).
- **Levels:**
  - L1: free painting, one new thing per round (dip, rub, hang; colours; splat; two parts; stamp; mirror butterfly; choose a toy).
  - L2: paint it the colour asked (Duck, Frog, Pig, Crab sit for their portraits; picture cards; two-part toys stay inside each part; three white spots; Pip's portrait).
  - L3: no green pot, so make green: dab two paints into the dish and stir; orange, green, purple and pink; then a rainbow.

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
