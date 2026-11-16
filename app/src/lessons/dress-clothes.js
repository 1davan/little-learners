// Dress Monkey: the clothes catalogue (every garment is a layer on the Blender monkey: cloth_<slot>_<name>),
// the body part each slot goes on, and the level plans (one whole outfit per level).

// slot -> where it goes (words + the anchor on the monkey model + the picture-bubble emoji)
export const SLOTS = {
  head: { part: 'head', kind: 'a hat', go: 'Hats go on heads!', anchors: ['top'], icon: '👒' },
  body: { part: 'body', kind: 'a top', go: 'Tops go on the body!', anchors: ['chest'], icon: '👕' },
  feet: { part: 'feet', kind: 'shoes', go: 'Shoes go on feet!', anchors: ['footL', 'footR'], icon: '👟' },
  legs: { part: 'legs', kind: 'something for legs', go: 'That goes round the legs!', anchors: ['legs'], icon: '🩳' },
  eyes: { part: 'eyes', kind: 'glasses', go: 'Glasses go on eyes!', anchors: ['eyeL', 'eyeR'], icon: '🕶️' },
  neck: { part: 'neck', kind: 'something for the neck', go: 'That goes round the neck!', anchors: ['neck'], icon: '🧣' },
  hands: { part: 'hands', kind: 'mittens', go: 'Mittens go on hands!', anchors: ['handL', 'handR'], icon: '🧤' },
};

// name -> { slot, word (caption name), col (caption colour), move (the monkey's reaction), go (custom redirect) }
export const CLOTHES = {
  // ---- hats ----
  party: { slot: 'head', word: 'party hat', col: '#ff6fa8', move: 'party' },
  crown: { slot: 'head', word: 'crown', col: '#e0a400', move: 'royal' },
  cap: { slot: 'head', word: 'cap', col: '#ff4b4b', move: 'cool' },
  sunhat: { slot: 'head', word: 'sun hat', col: '#e0a400', move: 'tip' },
  beanie: { slot: 'head', word: 'woolly hat', col: '#4a90ff', move: 'cosy' },
  pirate: { slot: 'head', word: 'pirate hat', col: '#5a4a80', move: 'pirate' },
  flowers: { slot: 'head', word: 'flower crown', col: '#3fae4a', move: 'twirl' },
  bunny: { slot: 'head', word: 'bunny ears', col: '#ff6fa8', move: 'hop' },
  chef: { slot: 'head', word: 'chef hat', col: '#9a8cc0', move: 'yum' },
  // ---- tops ----
  tshirt: { slot: 'body', word: 'stripy T-shirt', col: '#ff4b4b', move: 'flex' },
  raincoat: { slot: 'body', word: 'raincoat', col: '#e0a400', move: 'splash' },
  dress: { slot: 'body', word: 'party dress', col: '#ff6fa8', move: 'twirl' },
  jumper: { slot: 'body', word: 'cosy jumper', col: '#a77bff', move: 'cosy' },
  cape: { slot: 'body', word: 'super cape', col: '#ff3d4a', move: 'hero' },
  dungarees: { slot: 'body', word: 'dungarees', col: '#4a90ff', move: 'hop' },
  pyjamas: { slot: 'body', word: 'pyjamas', col: '#3fa0e0', move: 'yawn' },
  hoodie: { slot: 'body', word: 'hoodie', col: '#3fae4a', move: 'cool' },
  // ---- feet, legs, eyes, neck, hands ----
  wellies: { slot: 'feet', word: 'wellies', col: '#3fae4a', move: 'stomp' },
  sneakers: { slot: 'feet', word: 'sneakers', col: '#ff4b4b', move: 'run' },
  shorts: { slot: 'legs', word: 'shorts', col: '#ff8a1f', move: 'wiggle', go: 'Shorts go on legs!' },
  tutu: { slot: 'legs', word: 'tutu', col: '#ff6fa8', move: 'ballet', go: 'A tutu goes round the middle!' },
  sunglasses: { slot: 'eyes', word: 'sunglasses', col: '#5a4a80', move: 'shades' },
  hearts: { slot: 'eyes', word: 'heart glasses', col: '#ff3d7f', move: 'love' },
  scarf: { slot: 'neck', word: 'scarf', col: '#ff4b4b', move: 'cosy', go: 'Scarves go round necks!' },
  bowtie: { slot: 'neck', word: 'bow tie', col: '#a77bff', move: 'bow', go: 'A bow tie goes on the neck!' },
  lei: { slot: 'neck', word: 'flower necklace', col: '#ff6fa8', move: 'hula', go: 'Necklaces go round necks!' },
  mittens: { slot: 'hands', word: 'mittens', col: '#4a90ff', move: 'clap' },
};
export const layerOf = (name) => `cloth_${CLOTHES[name].slot}_${name}`;

// Weather for the window (and the Level 3 reasons). sky: window colours; fx: what falls / blows past.
export const WEATHER = {
  sunny: { sky: ['#5fc2ff', '#bfe9ff'], fx: 'sun', icon: '☀️' },
  rainy: { sky: ['#8a9bb5', '#c4cfdd'], fx: 'rain', icon: '🌧️' },
  snowy: { sky: ['#a9c3e0', '#e8f2ff'], fx: 'snow', icon: '❄️' },
  windy: { sky: ['#7cc0f0', '#d4ecff'], fx: 'wind', icon: '💨' },
  night: { sky: ['#2a2f6b', '#5a5aa8'], fx: 'stars', icon: '🌙' },
  party: { sky: ['#ff9ecb', '#ffe0f0'], fx: 'balloons', icon: '🎉' },
};

// A level = ONE whole outfit, put on one garment at a time (one round per garment, so the rounds per level are
// items.length). Each item: name (a CLOTHES key), part (where it goes on Monkey, if not its own slot: the dungarees
// are bottoms here), say (the caption when it comes out of the wardrobe), done (the praise line once it is on),
// where (Level 3's gentle redirect when it lands on the wrong body part). Captions will be spoken later: short,
// natural, kid-friendly.
export const PLANS = [
  // Level 1: a sunny day. 4 items; drop anywhere on Monkey.
  {
    weather: 'sunny', look: 'Sunny day!',
    items: [
      { name: 'tshirt', say: 'A T-shirt! Put it on Monkey!', done: 'T-shirt on!' },
      { name: 'shorts', say: 'Shorts! Put them on Monkey!', done: 'Shorts on!' },
      { name: 'sneakers', say: 'Sneakers! Put them on Monkey!', done: 'Sneakers on!' },
      { name: 'sunhat', say: 'A sun hat! Put it on Monkey!', done: 'Hat on!' },
    ],
  },
  // Level 2: a party. 5 items; drop anywhere on Monkey.
  {
    weather: 'party', look: 'Party time!',
    items: [
      { name: 'dress', say: 'A party dress! Put it on Monkey!', done: 'So pretty!' },
      { name: 'tutu', say: 'A tutu! Put it on Monkey!', done: 'Twirl twirl!' },
      { name: 'bowtie', say: 'A bow tie! Put it on Monkey!', done: 'Bow tie on!' },
      { name: 'hearts', say: 'Heart glasses! Put them on Monkey!', done: 'Glasses on!' },
      { name: 'party', say: 'A party hat! Put it on Monkey!', done: 'Party hat on!' },
    ],
  },
  // Level 3: a snowy day. 6 items, and each one must go on the right body part.
  {
    weather: 'snowy', look: 'Snowy day!', parts: true,
    items: [
      { name: 'dungarees', part: 'legs', say: "Dungarees! Put them on Monkey's legs!", done: 'Dungarees on!', where: "On Monkey's legs!" },
      { name: 'jumper', say: "A cosy jumper! Put it on Monkey's tummy!", done: 'Nice and cosy!', where: "On Monkey's tummy!" },
      { name: 'wellies', say: "Wellies! Put them on Monkey's feet!", done: 'Stomp stomp!', where: "On Monkey's feet!" },
      { name: 'scarf', say: "A scarf! Put it round Monkey's neck!", done: 'Scarf on!', where: "Round Monkey's neck!" },
      { name: 'beanie', say: "A woolly hat! Put it on Monkey's head!", done: 'Warm head!', where: "On Monkey's head!" },
      { name: 'mittens', say: "Mittens! Put them on Monkey's hands!", done: 'Warm hands!', where: "On Monkey's hands!" },
    ],
  },
];
