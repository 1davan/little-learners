// Dress Monkey: the clothes catalogue (every garment is a layer on the Blender monkey: cloth_<slot>_<name>),
// the body part each slot goes on, and the level plans.

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

// Each round: ask (slot), want (a specific garment, Level 3 / late Level 2), right (correct choices offered),
// wrong (other choices), weather (window + reason), say (the caption), mood (the monkey's wanting gesture).
// Any garment of the asked slot is right unless `want` names one.
export const PLANS = [
  // Level 1: hats. 3 choices: two hats + one thing that goes somewhere else. Free choice of hat.
  [
    { ask: 'head', right: ['beanie', 'party'], wrong: ['sneakers'], weather: 'snowy', say: 'Brr! Chilly head! Find a hat!' },
    { ask: 'head', right: ['crown', 'cap'], wrong: ['mittens'], weather: 'sunny', say: 'Monkey wants a hat!' },
    { ask: 'head', right: ['sunhat', 'chef'], wrong: ['tshirt'], weather: 'sunny', say: 'So sunny! Find a hat!' },
    { ask: 'head', right: ['pirate', 'bunny'], wrong: ['wellies'], weather: 'windy', say: 'Hat time! Put a hat on Monkey!' },
    { ask: 'head', right: ['flowers', 'beanie'], wrong: ['sunglasses'], weather: 'rainy', say: 'Find a hat for Monkey\'s head!' },
    { ask: 'head', right: ['party', 'crown'], wrong: ['scarf'], weather: 'party', say: 'Party time! Find a hat!' },
  ],
  // Level 2: tops. 4 choices: two tops + two others. Free choice, then two named ones.
  [
    { ask: 'body', right: ['tshirt', 'jumper'], wrong: ['beanie', 'sneakers'], weather: 'snowy', say: 'Brr! Cold tummy! Find a top!' },
    { ask: 'body', right: ['hoodie', 'dungarees'], wrong: ['crown', 'mittens'], weather: 'windy', say: 'Find a top for Monkey\'s body!' },
    { ask: 'body', right: ['dress', 'raincoat'], wrong: ['sunhat', 'wellies'], weather: 'sunny', say: 'A new top for Monkey!' },
    { ask: 'body', right: ['jumper', 'tshirt'], wrong: ['pirate', 'shorts'], weather: 'rainy', say: 'Monkey wants a top!' },
    { ask: 'body', want: 'pyjamas', right: ['pyjamas'], wrong: ['hoodie', 'cap', 'sneakers'], weather: 'night', say: 'Sleepy time! Find the pyjamas!' },
    { ask: 'body', want: 'cape', right: ['cape'], wrong: ['dress', 'chef', 'mittens'], weather: 'sunny', say: 'Superhero time! Find the cape!' },
  ],
  // Level 3: feet, legs, eyes, neck, hands — dressing for the weather. 4 choices, the outfit builds up.
  [
    { ask: 'feet', want: 'wellies', right: ['wellies'], wrong: ['sneakers', 'sunglasses', 'mittens'], weather: 'rainy', say: 'Raining! Find the wellies!', why: { sneakers: 'Sneakers get soggy!' } },
    { ask: 'eyes', want: 'sunglasses', right: ['sunglasses'], wrong: ['hearts', 'scarf', 'shorts'], weather: 'sunny', say: 'So sunny! Find the sunglasses!', why: { hearts: 'Those are party glasses!' } },
    { ask: 'hands', want: 'mittens', right: ['mittens'], wrong: ['tutu', 'bowtie', 'sneakers'], weather: 'snowy', say: 'Snow! Find the mittens!' },
    { ask: 'neck', want: 'scarf', right: ['scarf'], wrong: ['bowtie', 'hearts', 'tutu'], weather: 'windy', say: 'So windy! Find the scarf!', why: { bowtie: 'A bow tie is not cosy!', lei: 'Flowers are not cosy!' } },
    { ask: 'legs', want: 'shorts', right: ['shorts'], wrong: ['tutu', 'mittens', 'lei'], weather: 'sunny', say: "Hot hot sun! Find the shorts!", why: { tutu: 'A tutu is for dancing!' } },
    { ask: 'legs', want: 'tutu', right: ['tutu'], wrong: ['sneakers', 'lei', 'hearts'], weather: 'party', say: 'Party time! Find the tutu!' },
  ],
];
