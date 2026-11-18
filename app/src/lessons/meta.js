// The games, grouped into worlds (swipe between worlds on the home screen),
// and the os-taxonomy topics each one introduces (as early exposure for a 2-year-old).
export const LESSON_LIST = [
  // ---- World 1: the meadow ----
  {
    id: 'colours', world: 'meadow', title: 'Colour tubes', name: 'Colours!', icon: '🎨', color: '#ff5a5a',
    intro: "Let's sort colours!",
    topics: [{ id: 'mt_xppl18avyY', name: 'Sorting into categories' }],
    goal: 'Puts an object with others of the same colour.',
  },
  {
    id: 'paint', world: 'meadow', title: 'Paint & mix', name: 'Painting!', icon: '🖌️', color: '#4a90ff',
    intro: "Let's paint!",
    topics: [{ id: 'mt_6msyXavNJf', name: 'Making and controlling marks' }, { id: 'mt_-STxLMqeqF', name: 'Mixing and adjusting paint colours' }, { id: 'mt_2Kn5ianVWN', name: 'Composing visual artwork' }, { id: 'mt_r-BgS-lqTe', name: 'Giving and following instructions' }],
    goal: 'Dips a brush and paints wooden toys with her own strokes and dabs, then hangs each one on the wall. Later paints the thing the colour asked for (a yellow duck, a red apple with a green leaf, three spots on a mushroom), then makes the colour she needs by mixing two paints in a dish: orange, green, purple and pink.',
  },
  {
    id: 'counting', world: 'meadow', title: 'Apple count', name: 'Counting!', icon: '🍎', color: '#5fd068',
    intro: "Someone's hungry! Let's count!",
    topics: [{ id: 'mt_WcfaSfVT33', name: 'One-to-one counting' }, { id: 'mt_dmNvjroCPT', name: 'How many in total? (cardinality)' }],
    goal: 'Touches each of 1–5 objects once, one number per touch; hears the last number as the total.',
  },
  {
    id: 'shapes', world: 'meadow', title: 'Shape house', name: 'Shapes!', icon: '🔺', color: '#4a90ff',
    intro: "Let's find shapes!",
    topics: [{ id: 'mt_KJeEeTutJI', name: '2-D shapes' }],
    goal: 'Matches circle, square and triangle to their holes — even when small or turned.',
  },
  {
    id: 'feelings', world: 'meadow', title: 'Feelings', name: 'Feelings!', icon: '😊', color: '#ffb020',
    intro: 'How does Pip feel?',
    topics: [{ id: 'mt_LhkP_KKIRS', name: 'Naming basic emotions' }],
    goal: 'Taps the face that shows the named feeling: happy, sad, angry, scared.',
  },
  {
    id: 'sizes', world: 'meadow', title: 'Big and small', name: 'Big and small!', icon: '🐘', color: '#a77bff',
    intro: "Let's find big and small!",
    topics: [{ id: 'mt_NtJYlJdUe9', name: 'Measurable attributes of objects' }, { id: 'mt_uhuxX8sg9f', name: 'Comparing lengths & heights' }],
    goal: 'Taps the big or the small one of a pair standing on the same ground line.',
  },
  // ---- World 2: the beach ----
  {
    id: 'patterns', world: 'beach', title: 'Pattern parade', name: 'Patterns!', icon: '🔴', color: '#ff7a59',
    intro: "Let's make a pattern!",
    topics: [{ id: 'mt_ZjIFGc6zPW', name: 'Finding the repeating unit' }, { id: 'mt_WXW0hjNhph', name: 'Patterns & sequences' }],
    goal: 'Picks what comes next in a repeating pattern (red, blue, red, blue…).',
  },
  {
    id: 'where', world: 'beach', title: "Where's Crab?", name: 'In, on, under!', icon: '🦀', color: '#ff5a5a',
    intro: "Let's play on the beach!",
    topics: [{ id: 'mt_qeZYF6HZ4o', name: 'Positional language' }, { id: 'mt_VY3rBq8RyP', name: 'Prepositions' }],
    goal: 'Puts Crab in, on or under the bucket when asked.',
  },
  {
    id: 'more', world: 'beach', title: 'Which has more?', name: 'More!', icon: '🐚', color: '#3fb6e0',
    intro: "Let's find more!",
    topics: [{ id: 'mt__h7hvT4tEb', name: 'Comparing groups: more or fewer' }],
    goal: 'Taps the group that has more, sees the extras left over when the two groups pair up, then feeds them to a hungry friend.',
  },
  {
    id: 'body', world: 'beach', title: "Bear's nose", name: 'Nose and toes!', icon: '👃', color: '#ffb020',
    intro: "Let's find nose and toes!",
    topics: [{ id: 'mt_83gRQ9OPkc', name: 'Body parts & senses' }],
    goal: 'Touches the named body part: nose, eyes, ears, mouth, tummy, hands, feet.',
  },
  {
    id: 'sink', world: 'beach', title: 'Sink or float lab', name: 'Sink or float?', icon: '🧪', color: '#3fb6e0',
    intro: "Let's see what floats!",
    topics: [{ id: 'mt_auVZZEuXjs', name: 'Describing material properties' }, { id: 'mt_Wa44s-f8Ws', name: 'Simple tests and experiments' }, { id: 'mt_MRQcEvyPJv', name: 'Did it happen as predicted?' }],
    goal: 'Drops things into a water tank to see if they float or sink, then sorts them into the float tub or the sink tub; later guesses first and checks the guess, and tests which things roll and bounce.',
  },
  // ---- World 3: the farm ----
  {
    id: 'moo', world: 'farm', title: 'Who says moo?', name: 'Who says moo?', icon: '🐮', color: '#ff8fc0',
    intro: 'Listen! Farm animals!',
    topics: [{ id: 'mt_ppENoD8vf1', name: 'Local plants & animals' }],
    goal: 'Hears an animal sound and taps the animal that makes it.',
  },
  {
    id: 'share', world: 'farm', title: 'Share the snacks', name: 'Sharing!', icon: '🥕', color: '#ff9f3f',
    intro: 'The bunnies are hungry!',
    topics: [{ id: 'mt_FwI7q7DSIx', name: 'Taking turns and sharing' }, { id: 'mt_LpSuPgL31x', name: 'Division as equal sharing' }],
    goal: 'Gives carrots one at a time so every bunny gets the same.',
  },
  {
    id: 'band', world: 'farm', title: 'Barn band', name: 'Drums!', icon: '🥁', color: '#ff5a5a',
    intro: "Let's play drums!",
    topics: [{ id: 'mt_2mb17lUCPD', name: 'Creating and shaping musical sound' }],
    goal: "Copies Pip's drum beats: how many, then loud or quiet.",
  },
  {
    id: 'pots', world: 'farm', title: 'Peekaboo pots', name: 'Peekaboo!', icon: '🐥', color: '#ffd23f',
    intro: "Peekaboo! Who is hiding?",
    topics: [{ id: 'mt_AzNSWFgtxC', name: 'Remembering visual forms' }],
    goal: 'Remembers which pot the chick hid under, even after the pots move.',
  },
  {
    id: 'story', world: 'farm', title: 'What happens next?', name: 'What happens next?', icon: '📖', color: '#a98cff',
    intro: "Let's tell a story!",
    topics: [{ id: 'mt_VEwM7ClYYE', name: 'Story sequence and central message' }, { id: 'mt_-vvVxpOHG2', name: 'Ordering events in time' }, { id: 'mt_8-POYyg7GJ', name: 'Predicting what happens next' }],
    goal: 'Hears a little picture story told card by card (egg, crack…) and picks how it ends; later puts the story cards in order and tells the finished story.',
  },
  {
    // also: mt_6-MYToNZ39 Discussing and Questioning New Words, mt_6lHBTwQPrS Question Words, mt_yBJyCfhtem Basic Nouns
    // & Verbs, mt_xppl18avyY Sorting into categories, mt_zVLOm6U7bh Naming Common Animals, mt_83gRQ9OPkc Body Parts & Senses
    id: 'words', world: 'farm', title: 'Word world', name: 'Words!', icon: '🗣️', color: '#4cc7a0',
    intro: "Let's find some words!",
    topics: [{ id: 'mt_NP101Zl-4g', name: 'Using New Vocabulary' }, { id: 'mt_mB7DVai-Uf', name: 'Listening and responding' }, { id: 'mt_oL9s_bufDp', name: 'Sorting & Categorising Words' }],
    goal: 'Touches the named thing out of 2, then 3; meets about 300 first words over many visits; sorts things into groups.',
  },
  {
    id: 'dress', world: 'dressup', title: 'Dress Monkey', name: 'Dress up!', icon: '🐒', color: '#ff8fc0',
    intro: "Monkey wants to get dressed!",
    topics: [{ id: 'mt_83gRQ9OPkc', name: 'Body parts & senses' }, { id: 'mt_Dj2xr8CoI0', name: 'Dressing for the weather' }],
    goal: 'Puts each piece of clothing on the right body part (hat on head, top on body, shoes on feet); later picks clothes for the weather.',
  },
  {
    id: 'myday', world: 'dressup', title: 'My day', name: 'My day!', icon: '🌞', color: '#ffb020',
    intro: "Let's help Bunny!",
    topics: [{ id: 'mt_vbbxnY7ZDT', name: 'Keeping clean and healthy' }, { id: 'mt_2eVg4Tt5r0', name: 'Keeping up a healthy routine' }, { id: 'mt_-vvVxpOHG2', name: 'Ordering events in time' }],
    goal: "Does Bunny's routines step by step, in order: tap on, soap and rub, rinse, towel; toothpaste, brush, rinse; a tissue for a sneeze, then the bin; a bubble bath. Later a whole morning (wake up, make the bed), then picks the next step without help, through to bedtime and lights off.",
  },
  {
    id: 'snack', world: 'dressup', title: 'Snack chef', name: 'Snack time!', icon: '🍓', color: '#ff5a7a',
    intro: 'Who is hungry? Snack time!',
    topics: [{ id: 'mt_F62VTeHB4-', name: 'Preparing simple healthy snacks' }, { id: 'mt_QhLAeAlHI0', name: 'Balanced diet and food groups' }, { id: 'mt_EWiY8-opdd', name: 'Keeping food safe and clean' }, { id: 'mt_WcfaSfVT33', name: 'One-to-one counting' }],
    goal: 'Washes hands before food (soap, rub, rinse, dry), then builds a snack plate, counting each piece onto it: three of one fruit, then a fruit and a veg, then one food from each group with the fruit washed first.',
  },
  {
    id: 'cook', world: 'dressup', title: 'Cook a soup', name: 'Soup time!', icon: '🍲', color: '#ff8a3d',
    intro: "Let's cook a soup!",
    topics: [{ id: 'mt_F62VTeHB4-', name: 'Preparing simple healthy snacks' }, { id: 'mt_QhLAeAlHI0', name: 'Balanced diet and food groups' }, { id: 'mt_QR3vxbN1o4', name: 'Planning a task' }, { id: 'mt_WcfaSfVT33', name: 'One-to-one counting' }],
    goal: 'Makes a vegetable soup step by step: picks a veggie (later the one asked for by colour, then from a picture recipe card), picks up the knife and chops it into lots of pieces, scoops them up and tips them into the pot, turns on the stove; at Level 3 also counts two tomatoes, stirs and serves a bowl to Bear.',
  },
  {
    id: 'candy', world: 'dressup', title: 'Candy beats', name: 'Candy music!', icon: '🍭', color: '#ff6fae',
    intro: "Let's make candy music!",
    topics: [{ id: 'mt_2mb17lUCPD', name: 'Creating and shaping musical sound' }, { id: 'mt_KTSoXcO7OL', name: 'Pitch' }, { id: 'mt_OTFABm2xdf', name: 'Rhythm in rhymes and songs' }, { id: 'mt_WXW0hjNhph', name: 'Patterns & sequences' }],
    goal: 'Listens to a little tune played on singing candies (each colour always the same note, low to high) and copies it back: two- and three-note calls, then short phrases with long and short notes, then two lines of a nursery tune (Twinkle Twinkle, Mary Had a Little Lamb, Old MacDonald...) that play back together as the whole song.',
  },
  // ---- World 5: the building site ----
  {
    id: 'bricks', world: 'build', title: 'Brick letters', name: 'Letters!', icon: '🧱', color: '#ff7a3d',
    intro: "Let's build letters with bricks!",
    topics: [{ id: 'mt_frDIaXzWbx', name: 'Knowing all letters' }, { id: 'mt_WcfaSfVT33', name: 'One-to-one counting' }, { id: 'mt_yqAL6O5i_v', name: 'Counting objects to 20' }],
    goal: 'Taps bricks one at a time, counting each one as it clicks into a capital letter (A–T, 5 to 20 bricks); hears what the letter is for (A is for Apple).',
  },
  {
    id: 'blocks', world: 'build', title: 'Block builder', name: 'Blocks!', icon: '🧊', color: '#3f8cff',
    intro: "Let's build with blocks!",
    topics: [{ id: 'mt_Qcp2d_kuta', name: '3-D shapes' }, { id: 'mt_XjwUlmxdCT', name: 'Combining simple shapes' }],
    goal: 'Copies a little model by putting cubes, cylinders, cones, roofs and arches on their matching shapes; finds which shape rolls and which one stacks.',
  },
  {
    id: 'balance', world: 'build', title: 'Fill & balance', name: 'Fill it up!', icon: '⚖️', color: '#ffb020',
    intro: "Let's fill the buckets!",
    topics: [{ id: 'mt_zkFbMLpu3U', name: 'Comparing capacity' }, { id: 'mt_-P1kdZhHbL', name: 'Measuring mass and weight' }, { id: 'mt_lMz9nAs7VO', name: 'Early maths vocabulary' }],
    goal: 'Pours sand or water to make a bucket full, half full or empty; sees the heavy end of a see-saw go down; pours just enough to make it balance; finds which one holds more.',
  },
  {
    id: 'roll', world: 'build', title: 'Roll & push', name: 'Roll home!', icon: '🎢', color: '#ffb020',
    intro: "Let's roll home!",
    topics: [{ id: 'mt_B3W5EfimJw', name: 'Pushes & pulls' }, { id: 'mt_AvrQauS_zX', name: 'Gravity & falling objects' }, { id: 'mt_UHQfb-n-w3', name: 'Actions and their consequences' }, { id: 'mt_20WfHhnL39', name: 'Hands-on problem solving' }, { id: 'mt_8-POYyg7GJ', name: 'Predicting what happens next' }, { id: 'mt_qeZYF6HZ4o', name: 'Positional language' }, { id: 'mt_WcfaSfVT33', name: 'One-to-one counting' }, { id: 'mt_QR3vxbN1o4', name: 'Planning a task' }],
    goal: 'Helps a baby hedgehog roll home by tapping blocks out of the way, pushing boxes into holes and ramps up to steps, and pressing buttons that open doors and move lifts; later works out which thing to do first.',
  },
  {
    id: 'puzzles', world: 'build', title: 'Shape puzzles', name: 'Puzzles!', icon: '🔷', color: '#3fb6a8',
    intro: "Let's make a picture!",
    topics: [{ id: 'mt_KJeEeTutJI', name: '2-D shapes' }, { id: 'mt_95zxYqpP7m', name: 'Trying a new approach' }, { id: 'mt_QR3vxbN1o4', name: 'Planning a task' }, { id: 'mt_AzNSWFgtxC', name: 'Remembering visual forms' }, { id: 'mt_XjwUlmxdCT', name: 'Combining simple shapes' }],
    goal: 'Presses wooden shapes into their holes on a picture board, one piece a puzzle, until the picture is whole: picks the right hole among several (turned shapes too), then first opens a lid, a box or a cup, takes out a block, pulls a string, uses a key or pulls a peg to get to the shape; big and small.',
  },
  {
    id: 'letters', world: 'build', title: 'Letter friends', name: 'Letter train!', icon: '🔤', color: '#ff6b5e',
    intro: 'All aboard the letter train!',
    topics: [{ id: 'mt_frDIaXzWbx', name: 'Knowing all letters' }, { id: 'mt_F978c32kDr', name: 'Single Letter Sounds' }, { id: 'mt_j89i4u2fKr', name: 'Spotting and making alliteration' }, { id: 'mt_NP101Zl-4g', name: 'Using New Vocabulary' }],
    goal: 'Meets a letter friend and its things (apple, ant, ambulance): opens the box and packs them into that letter\'s carriage of the Alphabet Train, hearing each one\'s first sound ("a, a, a... apple!"); later sorts each thing to the letter it starts with, finds a named letter, and picks the thing that starts with a friend\'s sound ("mmm... moon!").',
  },
];
export const META = Object.fromEntries(LESSON_LIST.map((l) => [l.id, l]));

export const WORLDS = [
  { id: 'meadow', icon: '🌼', name: 'Meadow', lessons: LESSON_LIST.filter((l) => l.world === 'meadow') },
  { id: 'beach', icon: '🏖️', name: 'Beach', lessons: LESSON_LIST.filter((l) => l.world === 'beach') },
  { id: 'farm', icon: '🚜', name: 'Farm', lessons: LESSON_LIST.filter((l) => l.world === 'farm') },
  { id: 'dressup', icon: '🏠', name: 'Home', lessons: LESSON_LIST.filter((l) => l.world === 'dressup') },
  { id: 'build', icon: '🏗️', name: 'Building site', lessons: LESSON_LIST.filter((l) => l.world === 'build') },
];
export const worldIndex = (id) => Math.max(0, WORLDS.findIndex((w) => w.id === (META[id]?.world || id)));
