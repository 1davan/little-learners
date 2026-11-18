// Word world: the word table (docs/design/words.md section 7.5, reconciled with the canonical 300-noun list in
// docs/design/VOCAB.md by words.md 8.7: VOCAB.md decides which words exist, their spelling and the model that shows
// them; words.md gives the places, nooks and the three lines per word). Pure data + tiny helpers, no scene code, so
// the planner (words-plan.js) can import it in node for the unit test.
//
// A row: [id, nook, model, size, react, sound, about, opts]
//   id     the word id (VOCAB.md model id without prop_word_; also the memory key)
//   model  a model kind, or a list of kinds (first one built wins), or a compose id ('@blocks') or a body part
//          ('bear#nose' = the bear's anchor 'nose'). A word is offered only when its model exists (8.6 rule 1).
//   size   S (stands on the nook's stand), M or L (on the ground): words.md 6.2
//   react  a reaction kind from words-scene.js (8.3)
//   sound  a signature sound for the about tap and listen rounds ('' = none)
//   opts   { f: 'pl'|'mass'|'the'|'pn'|'own', w: display word, own: owner for body words, a: 'a'|'an' }
export const PLACES = [
  // id, place line (voiced on arrival), nooks in book order, first-turn pair, sortable group (Level 3 homes)
  { id: 'animals', name: 'Animals', line: "Let's find animals!", nooks: ['yard', 'garden', 'wood', 'zoo', 'sea', 'far'], first: ['yard', 'garden'], group: 'animals' },
  { id: 'home', name: 'Home', line: "Let's go home!", nooks: ['kitchen', 'bath', 'bedroom', 'living', 'cupboard', 'house'], first: ['kitchen', 'bath'] },
  { id: 'food', name: 'Food', line: "Let's find some food!", nooks: ['fruit', 'meal', 'veg', 'dinner', 'treat', 'market'], first: ['fruit', 'meal'], group: 'food' },
  { id: 'toys', name: 'Playroom', line: "Let's go and play!", nooks: ['rug', 'park', 'music', 'make'], first: ['rug', 'park'], group: 'toys' },
  { id: 'vehicles', name: 'Things that go', line: "Let's find things that go!", nooks: ['road', 'far2'], first: ['road', 'far2'], group: 'vehicles' },
  { id: 'clothes', name: 'Clothes', line: "Let's find clothes!", nooks: ['rail', 'feet', 'out'], first: ['feet', 'out'], group: 'clothes' },
  { id: 'body', name: 'Me', line: 'Hello, Bear!', nooks: ['face', 'close', 'body', 'friends'], first: ['face', 'close'] },
  { id: 'outdoors', name: 'Outside', line: "Let's go outside!", nooks: ['sky', 'grow', 'walk', 'places'], first: ['sky', 'grow'] },
  { id: 'people', name: 'People', line: "Let's say hello!", nooks: ['family', 'town'], first: ['family', 'town'] },
];
// The order places take turns on a tie (words.md 8.6 rule 2).
export const PLACE_ORDER = ['animals', 'home', 'food', 'toys', 'vehicles', 'clothes', 'body', 'outdoors', 'people'];

// Nooks: the corner's look. kind: 'out' (outdoor: the farm sky behind, a ground mat) or 'in' (a wall and a floor).
// ground/wall: colours. stand: the stand small things sit on. ledge: what Pip sits on. dress: set pieces behind
// (model, x offset, z, scale, y). char: a Me nook whose words are parts of ONE big character (words.md 8.4).
export const NOOKS = {
  // ---- animals ----
  yard: { place: 'animals', name: 'Farmyard', kind: 'out', ground: 0xe3c88f, ledge: 'fence', stand: 'prop_hayroll', dress: [['prop_barn', -2.6, -6.2, 0.9], ['prop_hay', 3.4, -4.2, 0.8]] },
  garden: { place: 'animals', name: 'Garden', kind: 'out', ground: 0x9fd77a, ledge: 'hedge', stand: 'prop_m_stump', dress: [['prop_scene_flower', -3.4, -3.4, 1.0], ['prop_scene_flower', 3.3, -3.6, 0.9]] },
  wood: { place: 'animals', name: 'Wild wood', kind: 'out', ground: 0x8cc96a, ledge: 'log', stand: 'prop_m_stump', dress: [['prop_scene_pine', -3.2, -4.6, 1.1], ['prop_scene_tree', 3.4, -4.8, 1.0]] },
  zoo: { place: 'animals', name: 'Zoo', kind: 'out', ground: 0xe8d39a, ledge: 'fence', stand: 'prop_rock', dress: [['prop_palm', -3.6, -4.4, 0.9], ['prop_palm', 3.6, -4.6, 0.8]] },
  sea: { place: 'animals', name: 'Rock pool', kind: 'out', ground: 0xf3dfa6, ledge: 'boardwalk', stand: 'prop_rock', dress: [['prop_palm', -3.5, -4.4, 0.85], ['prop_seastar', 3.4, -3.4, 1.0]] },
  far: { place: 'animals', name: 'Far away', kind: 'out', ground: 0xe9d49b, ledge: 'fence', stand: 'prop_rock', dress: [['prop_palm', 3.5, -4.6, 0.9]] },
  // ---- food ----
  fruit: { place: 'food', name: 'Fruit stall', kind: 'out', ground: 0xf0d9a8, ledge: 'shelf', stand: 'prop_crate', dress: [['prop_stall', 0, -5.6, 0.9]] },
  meal: { place: 'food', name: 'Breakfast', kind: 'in', wall: 0xfff0d2, ground: 0xe9c9a0, ledge: 'shelf', stand: 'prop_md_stool', dress: [['prop_window', 0, -3.25, 1.0, 1.9]] },
  veg: { place: 'food', name: 'Veg patch', kind: 'out', ground: 0xb58a5a, ledge: 'fence', stand: 'prop_crate', dress: [['prop_scarecrow', 3.6, -4.4, 0.9], ['prop_planterbox', -3.4, -3.8, 0.9]] },
  dinner: { place: 'food', name: 'Dinner time', kind: 'in', wall: 0xffe2c4, ground: 0xd9b48a, ledge: 'shelf', stand: 'prop_md_stool', dress: [['prop_frame', 0, -3.25, 1.0, 2.2]] },
  treat: { place: 'food', name: 'Picnic', kind: 'out', ground: 0xa9dc84, ledge: 'hedge', stand: 'prop_cakestand', dress: [['prop_scene_tree', 3.6, -4.8, 1.0]] },
  market: { place: 'food', name: 'Market', kind: 'out', ground: 0xf0d9a8, ledge: 'shelf', stand: 'prop_crate', dress: [['prop_stall', 0, -5.6, 0.9]] },
  // ---- playroom ----
  rug: { place: 'toys', name: 'Play rug', kind: 'in', wall: 0xdcecff, ground: 0xf3c6d8, ledge: 'shelf', stand: 'prop_blk_cube', dress: [['prop_window', 0, -3.25, 1.0, 1.9]] },
  park: { place: 'toys', name: 'Playground', kind: 'out', ground: 0xf3dfa6, ledge: 'fence', stand: 'prop_m_stump', dress: [['prop_scene_tree', -3.6, -4.8, 1.0]] },
  music: { place: 'toys', name: 'Music corner', kind: 'in', wall: 0xf1e2ff, ground: 0xe8d2b4, ledge: 'shelf', stand: 'prop_md_stool', dress: [['prop_frame', 0, -3.25, 1.0, 2.2]] },
  make: { place: 'toys', name: 'Art table', kind: 'in', wall: 0xfff3c9, ground: 0xe8d2b4, ledge: 'shelf', stand: 'prop_md_stool', dress: [['prop_frame', 0, -3.25, 1.0, 2.2]] },
  // ---- things that go ----
  road: { place: 'vehicles', name: 'The street', kind: 'out', ground: 0xb9c0c9, ledge: 'wall', stand: null, dress: [['prop_shop', -3.4, -5.6, 0.75], ['prop_streetlamp', 3.6, -3.6, 0.9]] },
  far2: { place: 'vehicles', name: 'Station and sky', kind: 'out', ground: 0xa9dc84, ledge: 'wall', stand: null, dress: [['prop_scene_cloud', -3, -6, 1.0, 4.2]] },
  // ---- clothes ----
  rail: { place: 'clothes', name: 'Clothes rail', kind: 'in', wall: 0xe6f4ff, ground: 0xe8d2b4, ledge: 'shelf', stand: null, dress: [['prop_coatpegs', 0, -3.3, 1.0, 2.6]] },
  feet: { place: 'clothes', name: 'Shoe bench', kind: 'in', wall: 0xfff0d2, ground: 0xe8d2b4, ledge: 'shelf', stand: 'prop_md_stool', dress: [['prop_coatpegs', 0, -3.25, 1.0, 1.9]] },
  out: { place: 'clothes', name: 'By the door', kind: 'in', wall: 0xffe6ee, ground: 0xe8d2b4, ledge: 'shelf', stand: 'prop_md_stool', dress: [['prop_hatstand', 3.4, -2.9, 0.9]] },
  // ---- me: one big character per nook (bear), or things in slots ----
  face: { place: 'body', name: 'Bear', kind: 'in', wall: 0xfff0d2, ground: 0xe8d2b4, ledge: 'shelf', stand: null, char: 'bear', frame: 'face' },
  body: { place: 'body', name: 'Bear', kind: 'in', wall: 0xe6f4ff, ground: 0xe8d2b4, ledge: 'shelf', stand: null, char: 'bear', frame: 'body' },
  close: { place: 'body', name: 'Hands and feet', kind: 'in', wall: 0xffe6ee, ground: 0xe8d2b4, ledge: 'shelf', stand: 'prop_md_stool', dress: [] },
  friends: { place: 'body', name: 'Friends', kind: 'in', wall: 0xf1e2ff, ground: 0xe8d2b4, ledge: 'shelf', stand: null, dress: [] },
  // ---- home ----
  kitchen: { place: 'home', name: 'Kitchen', kind: 'in', wall: 0xfff0d2, ground: 0xe9c9a0, ledge: 'shelf', stand: 'prop_md_stool', dress: [['prop_window', 0, -3.25, 1.0, 1.9]] },
  bath: { place: 'home', name: 'Bathroom', kind: 'in', wall: 0xdff3ff, ground: 0xcfe6f2, ledge: 'shelf', stand: 'prop_md_stool', dress: [['prop_md_drape', 0, -3.2, 1.0]] },
  bedroom: { place: 'home', name: 'Bedroom', kind: 'in', wall: 0xe9e1ff, ground: 0xd9c6e8, ledge: 'shelf', stand: 'prop_md_table', dress: [['prop_window', 0, -3.25, 1.0, 1.9]] },
  living: { place: 'home', name: 'Living room', kind: 'in', wall: 0xffe8d0, ground: 0xe8d2b4, ledge: 'shelf', stand: 'prop_md_stool', dress: [['prop_frame', 0, -3.25, 1.0, 2.2]] },
  cupboard: { place: 'home', name: 'Cupboard', kind: 'in', wall: 0xeef3e2, ground: 0xe8d2b4, ledge: 'shelf', stand: 'prop_md_stool', dress: [] },
  house: { place: 'home', name: 'Front door', kind: 'out', ground: 0xa9dc84, ledge: 'fence', stand: null, dress: [['prop_scene_tree', 3.8, -4.8, 0.9]] },
  // ---- outside ----
  sky: { place: 'outdoors', name: 'The sky', kind: 'out', ground: 0xa9dc84, ledge: 'hedge', stand: null, sky: true, dress: [] },
  grow: { place: 'outdoors', name: 'Under the tree', kind: 'out', ground: 0x9fd77a, ledge: 'log', stand: 'prop_m_stump', dress: [['prop_scene_tree', -3.6, -4.8, 1.1]] },
  walk: { place: 'outdoors', name: 'A walk', kind: 'out', ground: 0xc6d98a, ledge: 'fence', stand: 'prop_m_mound', dress: [['prop_scene_tree', 3.8, -4.8, 1.0], ['prop_scene_pine', -3.8, -4.6, 1.0]] },
  places: { place: 'outdoors', name: 'Places', kind: 'out', ground: 0xa9dc84, ledge: 'wall', stand: null, dress: [] },
  // ---- people ----
  family: { place: 'people', name: 'At home', kind: 'out', ground: 0xa9dc84, ledge: 'wall', stand: null, dress: [['prop_flowerbox', -3.6, -2.9, 0.9], ['prop_flowerbox', 3.6, -2.9, 0.9]] },
  town: { place: 'people', name: 'In town', kind: 'out', ground: 0xb9c0c9, ledge: 'wall', stand: null, dress: [['prop_streetlamp', 3.6, -3.6, 0.9]] },
};

const W = (id) => `prop_word_${id}`;
// [id, nook, model, size, react, sound, about, opts]
export const ROWS = [
  // ------------------------------------------------------------------ Animals (60)
  ['dog', 'yard', W('dog'), 'M', 'figure', 'woof', 'The dog says woof.'],
  ['cat', 'yard', 'cat', 'M', 'creature', 'meow', 'The cat says miaow.'],
  ['cow', 'yard', 'cow', 'L', 'creature', 'moo', 'The cow says moo.'],
  ['duck', 'yard', 'duck', 'M', 'creature', 'quack', 'The duck says quack.'],
  ['pig', 'yard', 'pig', 'M', 'creature', 'oink', 'The pig says oink.'],
  ['sheep', 'yard', 'sheep', 'M', 'creature', 'baa', 'The sheep says baa.'],
  ['horse', 'yard', 'horse', 'L', 'creature', 'neigh', 'The horse says neigh.'],
  ['hen', 'yard', 'hen', 'M', 'creature', 'cluck', 'The hen says cluck.'],
  ['chick', 'yard', 'chick', 'S', 'creature', 'cheep', 'Cheep, cheep!'],
  ['goat', 'yard', W('goat'), 'M', 'figure', '', 'The goat has horns.'],
  ['donkey', 'yard', W('donkey'), 'L', 'figure', '', 'Hee-haw!'],
  ['goose', 'yard', W('goose'), 'M', 'figure', '', 'Honk, honk!'],
  ['bird', 'garden', W('bird'), 'S', 'flutter', 'tweet', 'Tweet, tweet!'],
  ['bunny', 'garden', 'bunny', 'M', 'creature', '', 'Hop, hop, hop!'],
  ['bee', 'garden', ['prop_m_bee', 'prop_farmbee'], 'S', 'flutter', 'buzz', 'Buzz, buzz!'],
  ['butterfly', 'garden', 'prop_m_butterfly', 'S', 'flutter', '', 'Flutter, flutter!'],
  ['frog', 'garden', 'frog', 'M', 'creature', 'ribbit', 'Ribbit!'],
  ['ladybug', 'garden', 'prop_m_ladybug', 'S', 'flutter', '', 'Red with black spots.'],
  ['snail', 'garden', 'prop_farmsnail', 'S', 'wriggle', '', 'Slow, slow snail.'],
  ['worm', 'garden', 'prop_m_worm', 'S', 'wriggle', '', 'Wiggle, wiggle!'],
  ['mouse', 'garden', W('mouse'), 'S', 'figure', 'squeak', 'Squeak, squeak!'],
  ['spider', 'garden', 'prop_m_spider', 'S', 'hop', '', 'Eight little legs.'],
  ['caterpillar', 'garden', 'prop_st_caterpillar', 'S', 'wriggle', '', 'Munch, munch!'],
  ['ant', 'garden', W('ant'), 'S', 'hop', '', 'A tiny, tiny ant.', { a: 'an' }],
  ['bear', 'wood', 'bear', 'L', 'creature', '', 'A big, soft bear.'],
  ['owl', 'wood', W('owl'), 'M', 'figure', 'hoot', 'Twit-twoo!'],
  ['squirrel', 'wood', W('squirrel'), 'M', 'figure', '', 'Up the tree!'],
  ['fox', 'wood', W('fox'), 'M', 'figure', '', 'A bushy tail.'],
  ['deer', 'wood', W('deer'), 'M', 'figure', '', 'Little antlers.'],
  ['hedgehog', 'wood', 'hedgehog', 'M', 'creature', '', 'Prickly, prickly!'],
  ['snake', 'wood', W('snake'), 'M', 'wriggle', '', 'Hiss!'],
  ['turkey', 'wood', W('turkey'), 'M', 'figure', '', 'Gobble, gobble!'],
  ['elephant', 'zoo', 'elephant', 'L', 'creature', 'trumpet', 'A long, long trunk.'],
  ['monkey', 'zoo', 'monkey', 'M', 'creature', 'monkey', 'Ooh, ooh, aah!'],
  ['lion', 'zoo', W('lion'), 'L', 'figure', '', 'Roar!'],
  ['tiger', 'zoo', W('tiger'), 'L', 'figure', '', 'Stripy tiger!'],
  ['zebra', 'zoo', W('zebra'), 'L', 'figure', '', 'Black and white stripes.'],
  ['giraffe', 'zoo', W('giraffe'), 'L', 'sway', '', 'A long, long neck.'],
  ['hippo', 'zoo', W('hippo'), 'L', 'figure', '', 'A great big mouth.'],
  ['penguin', 'zoo', W('penguin'), 'M', 'figure', '', 'Waddle, waddle!'],
  ['kangaroo', 'zoo', W('kangaroo'), 'L', 'figure', '', 'Jump, jump!'],
  ['koala', 'zoo', W('koala'), 'M', 'figure', '', 'Hug the tree.'],
  ['panda', 'zoo', W('panda'), 'M', 'figure', '', 'Munch the bamboo.'],
  ['crocodile', 'zoo', W('crocodile'), 'L', 'open', '', 'Snap, snap!'],
  ['fish', 'sea', 'prop_fish', 'S', 'wriggle', '', 'Swim, swim, swim!'],
  ['crab', 'sea', 'crab', 'M', 'creature', '', 'Snip, snap!'],
  ['turtle', 'sea', W('turtle'), 'M', 'figure', '', 'A hard, round shell.'],
  ['whale', 'sea', W('whale'), 'L', 'splash', 'splash', 'A great big whale.'],
  ['dolphin', 'sea', W('dolphin'), 'M', 'hop', '', 'Jump and splash!'],
  ['shark', 'sea', W('shark'), 'L', 'wriggle', '', 'Swish, swish!'],
  ['octopus', 'sea', W('octopus'), 'M', 'figure', '', 'Eight wiggly arms.', { a: 'an' }],
  ['seal', 'sea', W('seal'), 'M', 'figure', '', 'Clap your flippers!'],
  ['jellyfish', 'sea', W('jellyfish'), 'M', 'float', '', 'Float, float!'],
  ['starfish', 'sea', 'prop_starfish', 'S', 'spin', '', 'Five little arms.'],
  ['parrot', 'far', W('parrot'), 'M', 'figure', 'tweet', 'Hello, hello!'],
  ['flamingo', 'far', W('flamingo'), 'L', 'sway', '', 'Stand on one leg.'],
  ['camel', 'far', W('camel'), 'L', 'figure', '', 'Two big humps.'],
  ['yak', 'far', W('yak'), 'L', 'figure', '', 'A shaggy coat.'],
  ['dinosaur', 'far', W('dinosaur'), 'L', 'figure', '', 'Stomp, stomp!'],
  ['unicorn', 'far', W('unicorn'), 'L', 'figure', '', 'A magic horn.', { a: 'a' }],
  // ------------------------------------------------------------------ Food (60)
  ['apple', 'fruit', W('apple'), 'S', 'nibble', 'crunch', 'Crunch, crunch!'],
  ['banana', 'fruit', 'prop_m_banana', 'S', 'nibble', '', 'Peel the banana.'],
  ['orange', 'fruit', 'prop_m_orange', 'S', 'roll', '', 'A juicy orange.'],
  ['strawberry', 'fruit', 'prop_m_strawberry', 'S', 'nibble', '', 'Sweet and red.'],
  ['grapes', 'fruit', W('grapes'), 'S', 'hop', '', 'Lots of little grapes.', { f: 'pl' }],
  ['pear', 'fruit', 'prop_m_pear', 'S', 'nibble', '', 'A soft, sweet pear.'],
  ['blueberry', 'fruit', '@blueberry', 'S', 'roll', '', 'Tiny and blue.'],
  ['watermelon', 'fruit', 'prop_m_watermelon', 'S', 'nibble', '', 'Big and green.'],
  ['cherry', 'fruit', 'prop_m_cherry', 'S', 'sway', '', 'Red and round.'],
  ['lemon', 'fruit', 'prop_m_lemon', 'S', 'roll', '', 'Ooh, sour!'],
  ['plum', 'fruit', 'prop_m_plum', 'S', 'roll', '', 'A purple plum.'],
  ['peach', 'fruit', W('peach'), 'S', 'roll', '', 'Soft and fuzzy.'],
  ['milk', 'meal', 'prop_k_milk', 'S', 'tip', 'pour', 'Glug, glug, glug!', { f: 'mass' }],
  ['bread', 'meal', 'prop_bread', 'S', 'squish', '', 'Soft, warm bread.', { f: 'mass' }],
  ['egg', 'meal', W('egg'), 'S', 'roll', '', 'Tap, tap, crack!'],
  ['cheese', 'meal', 'prop_k_cheese', 'S', 'nibble', '', 'Yellow cheese.', { f: 'mass' }],
  ['juice', 'meal', W('juice'), 'S', 'tip', 'pour', 'Sip, sip, sip!', { f: 'mass' }],
  ['water', 'meal', W('water'), 'S', 'tip', 'pour', 'A drink of water.', { f: 'mass' }],
  ['yogurt', 'meal', 'prop_k_yogurt', 'S', 'hop', '', 'Creamy yogurt.', { f: 'mass' }],
  ['cereal', 'meal', W('cereal'), 'S', 'hop', '', 'Crunchy breakfast.', { f: 'mass' }],
  ['toast', 'meal', W('toast'), 'S', 'nibble', 'crunch', 'Warm and crunchy.', { f: 'mass' }],
  ['jam', 'meal', W('jam'), 'S', 'hop', '', 'Red jam on toast.', { f: 'mass' }],
  ['honey', 'meal', W('honey'), 'S', 'tip', '', 'Sticky, sweet honey.', { f: 'mass' }],
  ['pancake', 'meal', W('pancake'), 'S', 'squish', '', 'Flip the pancake!'],
  ['carrot', 'veg', 'prop_carrot', 'S', 'nibble', 'crunch', 'Crunchy carrot!'],
  ['peas', 'veg', 'prop_k_peapod', 'S', 'hop', '', 'Little green peas.', { f: 'pl' }],
  ['tomato', 'veg', 'prop_ck_tomato', 'S', 'roll', '', 'Round and red.'],
  ['potato', 'veg', 'prop_ck_potato', 'S', 'roll', '', 'A lumpy potato.'],
  ['corn', 'veg', 'prop_corn', 'S', 'nibble', '', 'Yellow corn.', { f: 'mass' }],
  ['broccoli', 'veg', 'prop_k_broccoli', 'S', 'sway', '', 'Like a little tree.', { f: 'mass' }],
  ['cucumber', 'veg', 'prop_k_cucumber', 'S', 'roll', '', 'Long and green.'],
  ['pumpkin', 'veg', 'prop_m_pumpkin', 'S', 'squish', '', 'Big and orange.'],
  ['mushroom', 'veg', 'prop_m_mushroom', 'S', 'squish', '', 'Like a little umbrella.'],
  ['onion', 'veg', 'prop_ck_onion', 'S', 'roll', '', 'Lots of layers.'],
  ['pepper', 'veg', 'prop_ck_pepper', 'S', 'hop', '', 'A shiny pepper.'],
  ['cabbage', 'veg', 'prop_farmcabbage', 'S', 'squish', '', 'Leafy and green.'],
  ['pasta', 'dinner', W('pasta'), 'S', 'hop', '', 'Yummy pasta.', { f: 'mass' }],
  ['pizza', 'dinner', W('pizza'), 'S', 'nibble', '', 'A slice of pizza.', { f: 'mass' }],
  ['soup', 'dinner', W('soup'), 'S', 'puff', '', 'Hot soup. Blow!', { f: 'mass' }],
  ['sandwich', 'dinner', 'prop_sandwich', 'S', 'nibble', '', 'Bread and cheese.'],
  ['sausage', 'dinner', W('sausage'), 'S', 'hop', '', 'Sizzle, sizzle!'],
  ['chips', 'dinner', W('chips'), 'S', 'hop', '', 'Hot, yummy chips.', { f: 'pl' }],
  ['noodles', 'dinner', W('noodles'), 'S', 'hop', '', 'Long, long noodles.', { f: 'pl' }],
  ['rice', 'dinner', W('rice'), 'S', 'hop', '', 'A bowl of rice.', { f: 'mass' }],
  ['ice', 'dinner', W('ice'), 'S', 'hop', '', 'Cold, cold ice.', { f: 'mass' }],
  ['cookie', 'treat', 'prop_cookie', 'S', 'nibble', 'crunch', 'Snap!'],
  ['cake', 'treat', W('cake'), 'S', 'squish', '', 'Happy birthday cake.'],
  ['icecream', 'treat', W('icecream'), 'S', 'nibble', '', 'Cold, cold, lick!', { w: 'ice cream', a: 'an' }],
  ['cracker', 'treat', 'prop_k_cracker', 'S', 'nibble', 'crunch', 'Crunch!'],
  ['lolly', 'treat', 'prop_lolly', 'S', 'spin', '', 'Lick, lick!'],
  ['chocolate', 'treat', W('chocolate'), 'S', 'nibble', '', 'Yummy chocolate.', { f: 'mass' }],
  ['doughnut', 'treat', 'prop_m_donut', 'S', 'roll', '', 'Round with a hole.'],
  ['popcorn', 'treat', W('popcorn'), 'S', 'hop', '', 'Crunchy popcorn.', { f: 'mass' }],
  ['jelly', 'treat', W('jelly'), 'S', 'squish', '', 'Wibble, wobble!', { f: 'mass' }],
  ['pineapple', 'market', W('pineapple'), 'S', 'sway', '', 'Spiky leaves on top.'],
  ['kiwi', 'market', W('kiwi'), 'S', 'roll', '', 'Green inside.'],
  ['raspberry', 'market', W('raspberry'), 'S', 'nibble', '', 'Bumpy and pink.'],
  ['avocado', 'market', W('avocado'), 'S', 'roll', '', 'A big round stone.', { a: 'an' }],
  ['lettuce', 'market', W('lettuce'), 'S', 'squish', '', 'Crunchy leaves.', { f: 'mass' }],
  ['vegetables', 'market', W('vegetables'), 'S', 'hop', '', 'Yummy and good.', { f: 'pl' }],
  // ------------------------------------------------------------------ Playroom (30)
  ['ball', 'rug', W('ball'), 'S', 'roll', '', 'Roll the ball.'],
  ['teddy', 'rug', W('teddy'), 'M', 'squish', '', 'Cuddle teddy.'],
  ['blocks', 'rug', '@blocks', 'S', 'hop', '', 'Build them up high.', { f: 'pl' }],
  ['doll', 'rug', W('doll'), 'M', 'sway', '', 'Rock-a-bye, dolly.'],
  ['puzzle', 'rug', W('puzzle'), 'S', 'open', '', 'The pieces fit.'],
  ['robot', 'rug', W('robot'), 'M', 'spin', '', 'Beep, boop!'],
  ['top', 'rug', W('top'), 'S', 'spin', '', 'Spin, spin, spin!'],
  ['yoyo', 'rug', W('yoyo'), 'S', 'hop', '', 'Down and up again.', { w: 'yo-yo' }],
  ['rattle', 'rug', W('rattle'), 'S', 'ring', 'rattle', 'Shake, shake!'],
  ['present', 'rug', '@present', 'S', 'open', '', "What's inside?"],
  ['rocket', 'rug', W('rocket'), 'M', 'float', '', 'Whoosh, up high!'],
  ['balloon', 'park', 'prop_m_balloon', 'M', 'float', '', 'Up, up, up!'],
  ['slide', 'park', W('slide'), 'L', 'hop', '', 'Whee, down we go!'],
  ['swing', 'park', W('swing'), 'L', 'sway', '', 'Back and forth.'],
  ['bucket', 'park', 'prop_bucket', 'S', 'tip', '', 'Fill it up.'],
  ['spade', 'park', 'prop_spade', 'S', 'hop', '', 'Dig, dig, dig!'],
  ['kite', 'park', W('kite'), 'M', 'float', '', 'High in the sky.'],
  ['seesaw', 'park', 'prop_bal_seesaw', 'L', 'sway', '', 'Up and down.'],
  ['castle', 'park', 'prop_castle', 'M', 'squish', '', 'Made of sand.'],
  ['tent', 'park', W('tent'), 'L', 'open', '', 'Peep inside!'],
  ['drum', 'music', 'prop_drum', 'S', 'hop', 'drumSoft', 'Bang, bang!'],
  ['bell', 'music', W('bell'), 'S', 'ring', 'bell', 'Ding, ding!'],
  ['xylophone', 'music', W('xylophone'), 'S', 'hop', 'tune', 'Tap the bars.'],
  ['piano', 'music', W('piano'), 'M', 'hop', 'tune', 'Play a tune.'],
  ['guitar', 'music', W('guitar'), 'M', 'sway', 'tune', 'Strum, strum!'],
  ['violin', 'music', W('violin'), 'S', 'sway', 'tune', 'Play it with a bow.'],
  ['book', 'make', W('book'), 'S', 'open', '', 'Turn the page.'],
  ['crayon', 'make', 'prop_m_crayon', 'S', 'hop', '', 'Scribble, scribble!'],
  ['paint', 'make', '@paint', 'S', 'tip', '', 'Splish, splosh!', { f: 'mass' }],
  ['pencil', 'make', W('pencil'), 'S', 'hop', '', 'Draw a line.'],
  // ------------------------------------------------------------------ Clothes (21)
  ['coat', 'rail', W('coat'), 'M', 'sway', '', 'Warm and cosy.'],
  ['tshirt', 'rail', W('tshirt'), 'M', 'sway', '', 'Arms in!', { w: 'T-shirt' }],
  ['trousers', 'rail', W('trousers'), 'M', 'sway', '', 'One leg, two legs.', { f: 'pl' }],
  ['dress', 'rail', W('dress'), 'M', 'spin', '', 'Twirl, twirl!'],
  ['jumper', 'rail', W('jumper'), 'M', 'squish', '', 'Soft and woolly.'],
  ['pyjamas', 'rail', W('pyjamas'), 'M', 'sway', '', 'Time for bed.', { f: 'pl' }],
  ['nappy', 'rail', W('nappy'), 'S', 'squish', '', 'A clean, dry nappy.'],
  ['shorts', 'rail', W('shorts'), 'M', 'sway', '', 'For sunny days.', { f: 'pl' }],
  ['bib', 'rail', W('bib'), 'S', 'sway', '', 'Catch the crumbs.'],
  ['shoe', 'feet', W('shoe'), 'S', 'hop', '', 'On your foot.'],
  ['sock', 'feet', 'prop_farmsock', 'S', 'hop', '', 'Pull it on.'],
  ['boots', 'feet', 'prop_wellies', 'S', 'hop', '', 'Splash in puddles!', { f: 'pl' }],
  ['hat', 'out', 'prop_hat', 'S', 'squish', '', 'On your head.'],
  ['bag', 'out', W('bag'), 'S', 'open', '', 'Put things in.'],
  ['gloves', 'out', W('gloves'), 'S', 'sway', '', 'Warm fingers.', { f: 'pl' }],
  ['scarf', 'out', W('scarf'), 'S', 'sway', '', 'Round and round.'],
  ['umbrella', 'out', 'prop_umbrella', 'M', 'open', '', 'Pop it open!', { a: 'an' }],
  ['glasses', 'out', 'prop_m_glasses', 'S', 'hop', '', 'Help us see.', { f: 'pl' }],
  ['button', 'out', 'prop_m_button', 'S', 'spin', '', 'Push it through.'],
  ['zip', 'out', W('zip'), 'S', 'open', '', 'Zip it up. Zzzip!'],
  ['necklace', 'out', W('necklace'), 'S', 'sway', '', 'Pretty beads.'],
  // ------------------------------------------------------------------ Me (18): VOCAB.md character anchors + models
  ['nose', 'face', 'bear#nose', 'P', 'part', '', 'Sniff, sniff!', { f: 'own', own: 'Bear' }],
  ['eye', 'face', 'bear#eyeL', 'P', 'part', '', 'Blink, blink!', { f: 'own', own: 'Bear' }],
  ['cheek', 'face', 'bear#cheek', 'P', 'part', '', 'Puff!', { f: 'own', own: 'Bear' }],
  ['head', 'face', 'bear#head', 'P', 'part', '', 'Nod, nod.', { f: 'own', own: 'Bear' }],
  ['tummy', 'body', 'bear#tummy', 'P', 'part', '', 'Pat, pat!', { f: 'own', own: 'Bear' }],
  ['arm', 'body', 'bear#armL', 'P', 'part', '', 'Up high!', { f: 'own', own: 'Bear' }],
  ['leg', 'body', 'bear#legL', 'P', 'part', '', 'Kick, kick!', { f: 'own', own: 'Bear' }],
  ['hand', 'close', W('hand'), 'S', 'wave', '', 'Wave hello!'],
  ['foot', 'close', W('foot'), 'S', 'hop', '', 'Stamp, stamp!'],
  ['mouth', 'close', W('mouth'), 'S', 'open', '', 'Open wide!'],
  ['finger', 'close', W('hand') + '#finger', 'S', 'wave', '', 'Wiggle your finger.'],
  ['toes', 'close', W('foot') + '#toes', 'S', 'hop', '', 'Wiggle your toes.', { f: 'pl' }],
  ['teeth', 'close', W('mouth') + '#teeth', 'S', 'open', '', 'Brush your teeth.', { f: 'pl' }],
  ['tongue', 'close', W('mouth') + '#tongue', 'S', 'open', '', 'Aah!'],
  ['ear', 'friends', 'bunny#earL', 'M', 'part', '', 'Flop, flop!', { f: 'own', own: 'Bunny' }],
  ['hair', 'friends', W('girl') + '#hair', 'M', 'part', '', 'Bouncy bunches!', { f: 'own', own: 'the girl' }],
  ['elbow', 'friends', W('boy') + '#elbowL', 'M', 'part', '', 'Bend, bend.', { f: 'own', own: 'the boy' }],
  ['knee', 'friends', W('boy') + '#kneeL', 'M', 'part', '', 'Bend your knee.', { f: 'own', own: 'the boy' }],
  // ------------------------------------------------------------------ Home (57)
  ['cup', 'kitchen', 'prop_m_cup', 'S', 'tip', '', 'Have a drink.'],
  ['spoon', 'kitchen', W('spoon'), 'S', 'hop', '', 'Scoop it up.'],
  ['bowl', 'kitchen', 'prop_bowl', 'S', 'spin', '', 'A round bowl.'],
  ['plate', 'kitchen', 'prop_m_plate', 'S', 'spin', '', 'Food goes on top.'],
  ['bottle', 'kitchen', W('bottle'), 'S', 'tip', '', 'Milk for baby.'],
  ['fork', 'kitchen', W('fork'), 'S', 'hop', '', 'Poke, poke!'],
  ['fridge', 'kitchen', 'prop_k_fridge', 'L', 'open', '', "Brrr, it's cold!"],
  ['oven', 'kitchen', W('oven'), 'L', 'open', '', "Hot! Don't touch.", { a: 'an' }],
  ['kettle', 'kitchen', W('kettle'), 'S', 'puff', '', 'Whistle, whistle!'],
  ['pot', 'kitchen', 'prop_cookpot', 'S', 'puff', '', 'Stir, stir, stir!'],
  ['jug', 'kitchen', 'prop_bal_jug', 'S', 'tip', 'pour', 'Pour it out.'],
  ['teapot', 'kitchen', W('teapot'), 'S', 'tip', '', 'Tea for two.'],
  ['bath', 'bath', 'prop_md_bath', 'L', 'splash', 'splash', 'Splish, splash!'],
  ['soap', 'bath', 'prop_md_soap', 'S', 'puff', '', 'Rub, rub, bubbles!', { f: 'mass' }],
  ['towel', 'bath', 'prop_md_towel', 'M', 'sway', '', 'Rub-a-dub dry.'],
  ['toothbrush', 'bath', 'prop_md_brush', 'S', 'wriggle', '', 'Brush, brush, brush!'],
  ['potty', 'bath', W('potty'), 'M', 'hop', '', 'Sit on the potty.'],
  ['sink', 'bath', 'prop_md_sink', 'L', 'splash', 'splash', 'Wash your hands.'],
  ['toilet', 'bath', W('toilet'), 'L', 'open', '', 'Flush! Whoosh!'],
  ['toothpaste', 'bath', 'prop_md_paste', 'S', 'squish', '', 'Squeeze a little.', { f: 'mass' }],
  ['sponge', 'bath', 'prop_sponge', 'S', 'squish', '', 'Squeeze the sponge.'],
  ['comb', 'bath', W('comb'), 'S', 'wriggle', '', 'Comb your hair.'],
  ['brush', 'bath', 'prop_md_hairbrush', 'S', 'wriggle', '', 'Brush your hair.'],
  ['bubbles', 'bath', W('bubbles'), 'S', 'puff', '', 'Pop, pop, pop!', { f: 'pl' }],
  ['bed', 'bedroom', '@bed', 'L', 'squish', '', 'Night night!'],
  ['blanket', 'bedroom', W('blanket'), 'S', 'squish', '', 'Snuggle up warm.'],
  ['pillow', 'bedroom', W('pillow'), 'S', 'squish', '', 'Soft for your head.'],
  ['lamp', 'bedroom', 'prop_md_lamp', 'S', 'glow', '', 'Click! Light on.'],
  ['clock', 'bedroom', 'prop_md_clock', 'S', 'ring', 'tick', 'Tick, tock!'],
  ['quilt', 'bedroom', W('quilt'), 'M', 'sway', '', 'Lots of colours.'],
  ['mirror', 'bedroom', 'prop_mirror', 'M', 'glow', '', 'Who can you see?'],
  ['tissue', 'bedroom', 'prop_md_tissues', 'S', 'puff', '', 'Atishoo! Blow.'],
  ['plaster', 'bedroom', W('plaster'), 'S', 'hop', '', 'Better now.'],
  ['watch', 'bedroom', W('watch'), 'S', 'ring', 'tick', 'On your wrist.'],
  ['chair', 'living', 'prop_chair', 'L', 'hop', '', 'Sit down.'],
  ['table', 'living', 'prop_md_table', 'M', 'hop', '', 'Things go on top.'],
  ['sofa', 'living', W('sofa'), 'L', 'squish', '', 'A comfy sofa.'],
  ['phone', 'living', W('phone'), 'S', 'ring', 'ring', 'Ring, ring! Hello?'],
  ['tv', 'living', W('tv'), 'M', 'glow', '', "Click! It's on.", { w: 'TV' }],
  ['box', 'living', 'prop_box', 'S', 'open', '', "What's in the box?"],
  ['basket', 'living', 'prop_wicker', 'S', 'sway', '', 'Carry it along.'],
  ['picture', 'living', '@picture', 'S', 'sway', '', 'Hang it on the wall.'],
  ['vase', 'living', W('vase'), 'S', 'sway', '', 'Flowers go in.'],
  ['candle', 'living', W('candle'), 'S', 'glow', '', 'Blow it out!'],
  ['key', 'living', 'prop_sinkkey', 'S', 'ring', '', 'Open the door.'],
  ['torch', 'living', W('torch'), 'S', 'glow', '', 'Shine the light.'],
  ['broom', 'cupboard', W('broom'), 'M', 'sway', '', 'Sweep, sweep!'],
  ['vacuum', 'cupboard', W('vacuum'), 'M', 'drive', '', 'Vroom, vroom!'],
  ['bin', 'cupboard', '@bin', 'M', 'open', '', 'Rubbish goes in.'],
  ['jar', 'cupboard', 'prop_jar', 'S', 'hop', '', 'Lid on, lid off.'],
  ['scissors', 'cupboard', W('scissors'), 'S', 'open', '', 'Snip, snip!', { f: 'pl' }],
  ['hammer', 'cupboard', W('hammer'), 'S', 'hop', '', 'Tap, tap, tap!'],
  ['money', 'cupboard', '@money', 'S', 'hop', '', 'Clink, clink!', { f: 'mass' }],
  ['knife', 'cupboard', 'prop_ck_knife', 'S', 'hop', '', 'Chop, chop!'],
  ['door', 'house', 'prop_m_door', 'L', 'open', '', 'Knock, knock!'],
  ['window', 'house', 'prop_window', 'M', 'open', '', 'Look outside.'],
  ['stairs', 'house', W('stairs'), 'L', 'hop', '', 'Step, step, step!', { f: 'pl' }],
  // ------------------------------------------------------------------ Things that go (15)
  ['car', 'road', 'prop_m_car', 'M', 'drive', 'honk', 'Beep, beep!'],
  ['bus', 'road', W('bus'), 'L', 'drive', '', 'The wheels go round.'],
  ['bike', 'road', W('bike'), 'M', 'drive', '', 'Pedal, pedal!'],
  ['truck', 'road', W('truck'), 'L', 'drive', '', 'A big load.'],
  ['tractor', 'road', W('tractor'), 'L', 'drive', '', 'Chug, chug, chug!'],
  ['fireengine', 'road', W('fireengine'), 'L', 'drive', 'neenaw', 'Nee-naw, nee-naw!', { w: 'fire engine' }],
  ['digger', 'road', W('digger'), 'L', 'open', '', 'Scoop and dump.'],
  ['ambulance', 'road', W('ambulance'), 'L', 'drive', '', 'It helps poorly people.', { a: 'an' }],
  ['van', 'road', W('van'), 'L', 'drive', '', 'Parcels for you!'],
  ['scooter', 'road', W('scooter'), 'M', 'drive', '', 'Push and go!'],
  ['pushchair', 'road', W('pushchair'), 'M', 'drive', '', 'Push the baby.'],
  ['train', 'far2', ['prop_word_engine', '@train'], 'L', 'drive', 'choo', 'Choo, choo!'],
  ['plane', 'far2', W('plane'), 'L', 'float', '', 'Zoom, up high!'],
  ['boat', 'far2', 'prop_sailboat', 'L', 'sway', '', 'Bobbing on the water.'],
  ['helicopter', 'far2', W('helicopter'), 'L', 'float', '', 'Whirr, whirr!'],
  // ------------------------------------------------------------------ Outside (29)
  ['sun', 'sky', W('sun'), 'M', 'glow', '', 'Warm and bright.', { f: 'the' }],
  ['moon', 'sky', W('moon'), 'M', 'glow', '', 'Night night, moon.', { f: 'the' }],
  ['star', 'sky', 'prop_m_puffstar', 'M', 'glow', '', 'Twinkle, twinkle!'],
  ['cloud', 'sky', 'prop_cloud', 'M', 'float', '', 'Fluffy white cloud.'],
  ['rain', 'sky', '@rain', 'M', 'splash', 'splash', 'Pitter, patter!', { f: 'mass' }],
  ['rainbow', 'sky', 'prop_rainbow', 'M', 'glow', '', 'So many colours.'],
  ['tree', 'grow', W('tree'), 'L', 'sway', '', 'Tall, tall tree.'],
  ['flower', 'grow', ['prop_word_daisy', 'prop_bloom_daisy'], 'S', 'sway', '', 'Sniff. Mmm!'],
  ['leaf', 'grow', W('leaf'), 'S', 'float', '', 'It floats down.'],
  ['grass', 'grow', W('grass'), 'S', 'sway', 'rustle', 'Green and tickly.', { f: 'mass' }],
  ['stone', 'grow', 'prop_rock', 'S', 'hop', '', 'Hard and heavy.'],
  ['stick', 'grow', W('stick'), 'S', 'hop', '', 'A long, thin stick.'],
  ['nest', 'grow', W('nest'), 'S', 'hop', '', 'A bed for birds.'],
  ['wateringcan', 'grow', W('wateringcan'), 'S', 'tip', 'pour', 'Sprinkle, sprinkle!', { w: 'watering can' }],
  ['ladder', 'grow', W('ladder'), 'L', 'hop', '', 'Climb up, up.'],
  ['puddle', 'walk', 'prop_icon_puddle', 'M', 'splash', 'splash', 'Splash!'],
  ['mud', 'walk', 'prop_mud', 'M', 'squish', '', 'Squelch, squelch!', { f: 'mass' }],
  ['sand', 'walk', 'prop_sandpile', 'M', 'squish', '', 'Dig in the sand.', { f: 'mass' }],
  ['shell', 'walk', 'prop_seashell', 'S', 'spin', '', 'Listen. Swoosh!'],
  ['snowman', 'walk', 'prop_scene_snowman', 'M', 'hop', '', 'Brrr! Hello, snowman.'],
  ['mountain', 'walk', W('mountain'), 'L', 'hop', '', 'Very, very high.'],
  ['fire', 'walk', 'prop_bonfire', 'M', 'glow', '', 'Hot! Stay back.'],
  ['house', 'places', 'prop_house', 'L', 'glow', '', 'Home, sweet home.'],
  ['shop', 'places', 'prop_shop', 'L', 'hop', '', "Let's buy some food."],
  ['barn', 'places', 'prop_barn', 'L', 'hop', '', 'Animals sleep here.'],
  ['bridge', 'places', 'prop_m_bridge', 'L', 'hop', '', 'Over we go.'],
  ['zoo', 'places', W('zoo'), 'L', 'hop', '', 'Lots of animals!'],
  ['igloo', 'places', W('igloo'), 'L', 'hop', '', 'A house of snow.', { a: 'an' }],
  ['island', 'places', 'prop_map_island', 'L', 'hop', '', 'Water all around.', { a: 'an' }],
  // ------------------------------------------------------------------ People (10): VOCAB.md figurines
  ['mummy', 'family', W('mummy'), 'L', 'wave', '', 'Mummy gives a cuddle.', { f: 'pn', w: 'Mummy' }],
  ['daddy', 'family', W('daddy'), 'L', 'wave', '', 'Daddy waves hello.', { f: 'pn', w: 'Daddy' }],
  ['baby', 'family', W('baby'), 'M', 'wave', '', 'Shh. Baby is little.'],
  ['grandma', 'family', W('grandma'), 'L', 'wave', '', 'Grandma reads a story.', { f: 'pn', w: 'Grandma' }],
  ['grandpa', 'family', W('grandpa'), 'L', 'wave', '', 'Grandpa has a hat.', { f: 'pn', w: 'Grandpa' }],
  ['girl', 'family', W('girl'), 'L', 'wave', '', 'She likes to jump.'],
  ['boy', 'family', W('boy'), 'L', 'wave', '', 'He likes to run.'],
  ['doctor', 'town', W('doctor'), 'L', 'wave', '', 'The doctor helps us.'],
  ['queen', 'town', W('queen'), 'L', 'wave', '', 'A big gold crown.'],
  ['xray', 'town', W('xray'), 'M', 'glow', '', 'See the bones!', { w: 'X-ray', a: 'an' }],
];

// Words in one clash group never share a nook in one visit (lv1: only at Level 1).
export const CLASH = [
  ['lion', 'tiger'], ['horse', 'donkey', 'unicorn'], { lv1: true, w: ['hen', 'chick', 'duck', 'goose'] }, ['worm', 'caterpillar', 'snake'],
  ['bear', 'panda', 'koala'], ['whale', 'dolphin', 'shark'], ['bird', 'parrot'], ['cat', 'fox'],
  { lv1: true, w: ['orange', 'peach', 'lemon', 'plum'] }, ['strawberry', 'raspberry'], ['cabbage', 'lettuce'], ['tomato', 'pepper'],
  { lv1: true, w: ['water', 'juice', 'milk'] }, ['bread', 'toast'], ['pasta', 'noodles'], ['cereal', 'soup', 'rice'], ['cookie', 'cracker'], ['cake', 'doughnut'],
  ['crayon', 'pencil'], { lv1: true, w: ['teddy', 'doll'] }, ['guitar', 'violin'], ['bell', 'rattle'],
  { lv1: true, w: ['coat', 'jumper'] }, ['shorts', 'trousers'],
  ['hand', 'finger'], ['foot', 'toes'], ['mouth', 'teeth', 'tongue'], ['elbow', 'knee'],
  { lv1: true, w: ['bowl', 'plate'] }, { lv1: true, w: ['spoon', 'fork'] }, ['bath', 'sink'], ['toothbrush', 'brush', 'comb'], ['quilt', 'blanket'],
  ['clock', 'watch'], ['potty', 'toilet'], ['picture', 'tv'], ['torch', 'candle'], ['chair', 'sofa'], { lv1: true, w: ['kettle', 'teapot', 'pot', 'jug'] },
  ['truck', 'van'], { lv1: true, w: ['ambulance', 'fireengine'] }, ['bike', 'scooter'], { lv1: true, w: ['plane', 'helicopter'] },
  { lv1: true, w: ['sun', 'moon', 'star'] }, ['rain', 'cloud'], ['mud', 'puddle', 'sand'], ['igloo', 'house'], ['stick', 'stone'],
  { lv1: true, w: ['mummy', 'daddy'] }, { lv1: true, w: ['grandma', 'grandpa'] }, ['girl', 'boy'],
];
// Never sort a toy that could belong to both homes on show (words.md 4.3 sortClash).
export const SORT_CLASH = { animals: ['teddy', 'robot', 'rocket'], toys: ['dinosaur', 'unicorn', 'scooter', 'bike', 'pushchair'], vehicles: ['rocket'] };
// Level 3 sorting: the home for each group (models in tools/blender/creatures/prop_wordgame.py) and its lines.
export const HOMES = {
  animals: { model: 'prop_wg_barn', line: 'Animals go in the barn.', ask: 'Where do animals go?' },
  food: { model: 'prop_wg_hamper', line: 'Food goes in the basket.', ask: 'Where does food go?' },
  toys: { model: 'prop_wg_toybox', line: 'Toys go in the toy box.', ask: 'Where do toys go?' },
  clothes: { model: 'prop_wg_wardrobe', line: 'Clothes go in the wardrobe.', ask: 'Where do clothes go?' },
  vehicles: { model: 'prop_wg_garage', line: 'The garage is for things that go!', ask: 'Where does it go?' },
};
// Sort stage 1 uses only "very different" pairs (words.md 4.3).
export const STAGE1_PAIRS = [['animals', 'food'], ['animals', 'clothes'], ['food', 'vehicles'], ['clothes', 'vehicles']];

// Fixed lines (words.md 7.4).
export const LINES = {
  what: "What's that?", come: 'Come and see!', pictures: "Let's take pictures!", tidy: 'Tidy-up time!', train: 'Here comes the train!',
  take: 'Take it home!', book: 'Tap a picture!',
};

// ---------------------------------------------------------------- the word objects
const VOWEL = /^[aeiou]/i;
function article(w, o) { return o.a || (VOWEL.test(w) ? 'an' : 'a'); }
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function makeWord(r, i) {
  const [id, nook, model, size, react, sound, about, o = {}] = r;
  const w = o.w || id;
  const f = o.f || 'a';
  let name, where;
  if (f === 'pl') { name = `${cap(w)}!`; where = `Where are the ${w}?`; }
  else if (f === 'mass') { name = `${cap(w)}!`; where = `Where's the ${w}?`; }
  else if (f === 'the') { name = `The ${w}!`; where = `Where's the ${w}?`; }
  else if (f === 'pn') { name = `${w}!`; where = `Where's ${w}?`; }
  else if (f === 'own') { name = `${cap(o.own)}'s ${w}!`; where = `Where's ${o.own}'s ${w}?`; }
  else { name = `${cap(article(w, o))} ${w}!`; where = `Where's the ${w}?`; }
  const place = NOOKS[nook].place;
  const models = (Array.isArray(model) ? model : [model]).slice();
  // a word card model built for this word (VOCAB.md prop_word_<id>) always wins over a reused one
  if (!models[0].includes('#') && models[0] !== `prop_word_${id}`) models.unshift(`prop_word_${id}`);
  return { id, i, nook, place, word: w, name, about, where, models, size, react, sound, group: PLACES.find((p) => p.id === place).group || null };
}
export const WORDS = ROWS.map(makeWord);
export const BY_ID = Object.fromEntries(WORDS.map((w) => [w.id, w]));
export const NOOK_WORDS = {};
for (const w of WORDS) (NOOK_WORDS[w.nook] = NOOK_WORDS[w.nook] || []).push(w.id);
export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p]));

// clash test: do a and b clash at this level (0..2)?
const CLASH_SETS = CLASH.map((c) => (Array.isArray(c) ? { lv1: false, w: new Set(c) } : { lv1: c.lv1, w: new Set(c.w) }));
export function clashes(a, b, level = 0) {
  if (a === b) return true;
  const A = BY_ID[a], B = BY_ID[b];
  // two words shown by the same model (hand / finger, mouth / teeth) can never share a nook
  if (A && B && A.models[0] === B.models[0] && !A.models[0].includes('#')) return true;
  for (const c of CLASH_SETS) if ((!c.lv1 || level === 0) && c.w.has(a) && c.w.has(b)) return true;
  return false;
}

// Every voice line of the game (for tools/voice): the fixed lines, the place lines, the home lines, three per word.
export function allLines() {
  const out = new Set([...Object.values(LINES), ...PLACES.map((p) => p.line), "Let's look at me!"]);
  for (const h of Object.values(HOMES)) { out.add(h.line); out.add(h.ask); }
  for (const w of WORDS) { out.add(w.name); out.add(w.about); out.add(w.where); }
  return [...out];
}
