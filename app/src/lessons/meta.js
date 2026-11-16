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
    intro: "Let's play with Crab!",
    topics: [{ id: 'mt_qeZYF6HZ4o', name: 'Positional language' }, { id: 'mt_VY3rBq8RyP', name: 'Prepositions' }],
    goal: 'Puts Crab in, on or under the bucket when asked.',
  },
  {
    id: 'more', world: 'beach', title: 'Which has more?', name: 'More!', icon: '🐚', color: '#3fb6e0',
    intro: "Let's find more!",
    topics: [{ id: 'mt__h7hvT4tEb', name: 'Comparing groups: more or fewer' }],
    goal: 'Taps the group that has more (later: fewer).',
  },
  {
    id: 'body', world: 'beach', title: "Bear's nose", name: 'Nose and toes!', icon: '👃', color: '#ffb020',
    intro: "Hello Bear! Let's find nose and toes!",
    topics: [{ id: 'mt_83gRQ9OPkc', name: 'Body parts & senses' }],
    goal: 'Touches the named body part: nose, eyes, ears, mouth, tummy, hands, feet.',
  },
  {
    id: 'wash', world: 'beach', title: 'Splash wash', name: 'Wash time!', icon: '🧽', color: '#5fd068',
    intro: 'Oh no! Everyone is sandy!',
    topics: [{ id: 'mt_vbbxnY7ZDT', name: 'Keeping clean and healthy' }],
    goal: 'Scrubs the dirty spots clean with a sponge, then rinses.',
  },
  // ---- World 3: the farm ----
  {
    id: 'moo', world: 'farm', title: 'Who says moo?', name: 'Who says moo?', icon: '🐮', color: '#ff8fc0',
    intro: 'Listen! Farm animals!',
    topics: [{ id: 'mt_ppENoD8vf1', name: 'Local plants & animals' }],
    goal: 'Hears an animal sound and taps the animal that makes it.',
  },
  {
    id: 'grow', world: 'farm', title: 'Grow a flower', name: 'Grow a flower!', icon: '🌱', color: '#5fd068',
    intro: "Let's grow flowers!",
    topics: [{ id: 'mt_0B64gfJf7j', name: 'Seeds & plant growth' }, { id: 'mt_L1469gt34A', name: 'What living things need' }],
    goal: 'Plants a seed, waters it and lets the sun shine, in order; later picks what a plant needs.',
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
    intro: "Chick wants to hide!",
    topics: [{ id: 'mt_AzNSWFgtxC', name: 'Remembering visual forms' }],
    goal: 'Remembers which pot the chick hid under, even after the pots move.',
  },
  {
    id: 'dress', world: 'dressup', title: 'Dress Monkey', name: 'Dress up!', icon: '🐒', color: '#ff8fc0',
    intro: "Monkey wants to get dressed!",
    topics: [{ id: 'mt_83gRQ9OPkc', name: 'Body parts & senses' }, { id: 'mt_Dj2xr8CoI0', name: 'Dressing for the weather' }],
    goal: 'Puts each piece of clothing on the right body part (hat on head, top on body, shoes on feet); later picks clothes for the weather.',
  },
  // ---- World 5: the building site ----
  {
    id: 'bricks', world: 'build', title: 'Brick letters', name: 'Letters!', icon: '🧱', color: '#ff7a3d',
    intro: "Let's build letters with bricks!",
    topics: [{ id: 'mt_frDIaXzWbx', name: 'Knowing all letters' }, { id: 'mt_WcfaSfVT33', name: 'One-to-one counting' }, { id: 'mt_yqAL6O5i_v', name: 'Counting objects to 20' }],
    goal: 'Taps bricks one at a time, counting each one as it clicks into a capital letter (A–T, 5 to 20 bricks); hears what the letter is for (A is for Apple).',
  },
];
export const META = Object.fromEntries(LESSON_LIST.map((l) => [l.id, l]));

export const WORLDS = [
  { id: 'meadow', icon: '🌼', name: 'Meadow', lessons: LESSON_LIST.filter((l) => l.world === 'meadow') },
  { id: 'beach', icon: '🏖️', name: 'Beach', lessons: LESSON_LIST.filter((l) => l.world === 'beach') },
  { id: 'farm', icon: '🚜', name: 'Farm', lessons: LESSON_LIST.filter((l) => l.world === 'farm') },
  { id: 'dressup', icon: '👗', name: 'Dress up', lessons: LESSON_LIST.filter((l) => l.world === 'dressup') },
  { id: 'build', icon: '🏗️', name: 'Building site', lessons: LESSON_LIST.filter((l) => l.world === 'build') },
];
export const worldIndex = (id) => Math.max(0, WORLDS.findIndex((w) => w.id === (META[id]?.world || id)));
