// My day: the routines and the level plans.
// A routine is a few real steps the child does for the bunny, in order. Each step uses ONE thing:
//   how 'tap'  - tap it (the tap, the bath tap, the clock, the curtains, the lamp)
//   how 'drop' - drag it onto a spot (`at`) and let go
//   how 'rub'  - drag it onto a spot and rub back and forth until done
// say: the caption at Levels 1-2. hint: what a gentle redirect says when another thing is tried first.
// act: the lesson method that plays the step; then: an extra move after it (the bunny hops into the bath...).
export const ROUTINES = {
  hands: {
    room: 'bath', spot: 'sink', ask: 'Wash your hands! What comes first?', done: 'Clean paws!',
    steps: [
      { use: 'tap', how: 'tap', say: 'Turn on the tap!', hint: 'The tap first!', act: 'wet' },
      { use: 'soap', how: 'rub', at: 'hands', say: 'Soap on! Rub rub rub!', hint: 'Now the soap!', act: 'lather' },
      { use: 'tap', how: 'tap', say: 'Rinse the bubbles off!', hint: 'Rinse them off!', act: 'rinse' },
      { use: 'towel', how: 'rub', at: 'hands', say: 'Dry with the towel!', hint: 'Now the towel!', act: 'dry' },
    ],
  },
  teeth: {
    room: 'bath', spot: 'sink', ask: 'Teeth time! What comes first?', done: 'Shiny teeth!',
    steps: [
      { use: 'paste', how: 'drop', at: 'brush', say: 'Toothpaste on the brush!', hint: 'Toothpaste first!', act: 'squeeze' },
      { use: 'brush', how: 'rub', at: 'mouth', say: 'Brush brush brush!', hint: 'Now brush!', act: 'scrub' },
      { use: 'cup', how: 'drop', at: 'mouth', say: 'Rinse with water!', hint: 'Now the cup!', act: 'gargle' },
    ],
  },
  sneeze: {
    room: 'bath', spot: 'sink', ask: 'Ah... ah... What do we need?', done: 'Bless you!', pre: 'ahh',
    steps: [
      { use: 'tissue', how: 'drop', at: 'nose', say: 'Quick! A tissue!', hint: 'A tissue first!', act: 'atchoo' },
      { use: 'tissue', how: 'drop', at: 'bin', say: 'Tissue in the bin!', hint: 'In the bin!', act: 'binIt' },
      { use: 'soap', how: 'rub', at: 'hands', say: 'Now wash your hands!', hint: 'Now wash your hands!', act: 'lather', then: 'autoRinse' },
    ],
  },
  bath: {
    room: 'bath', spot: 'mat', ask: 'Bath time! What comes first?', done: 'All clean!',
    steps: [
      { use: 'bathtap', how: 'tap', say: 'Turn on the bath!', hint: 'Water first!', act: 'fill' },
      { use: 'bottle', how: 'drop', at: 'bath', say: 'Bubbles in!', hint: 'Bubbles next!', act: 'pourBubbles', then: 'hopIn' },
      { use: 'sponge', how: 'rub', at: 'head', say: 'Wash with the sponge!', hint: 'Now the sponge!', act: 'soapy', then: 'hopOut' },
      { use: 'bigtowel', how: 'rub', at: 'body', say: 'Dry with the towel!', hint: 'Now the towel!', act: 'dryBody' },
    ],
  },
  hair: {
    room: 'bath', spot: 'sink', ask: 'Fluffy fur time!', done: 'So fluffy!',
    steps: [
      { use: 'hairbrush', how: 'rub', at: 'earR', say: 'Brush your ears!', hint: 'The brush!', act: 'fluff' },
      { use: 'hairbrush', how: 'rub', at: 'earL', say: 'Now the other ear!', hint: 'The other ear!', act: 'fluff' },
    ],
  },
  wake: {
    room: 'bed', spot: 'inBed', ask: 'Ring ring! Wake up!', done: 'Good morning!',
    steps: [
      { use: 'clock', how: 'tap', say: 'Ring ring! Tap the clock!', hint: 'The clock!', act: 'wakeUp' },
      { use: 'drapes', how: 'tap', say: 'Open the curtains!', hint: 'The curtains!', act: 'openDrapes', then: 'getUp' },
    ],
  },
  makebed: {
    room: 'bed', spot: 'rug', ask: 'Make the bed!', done: 'Nice and tidy!',
    steps: [
      { use: 'duvet', how: 'drop', at: 'bed', say: 'Duvet on the bed!', hint: 'The duvet first!', act: 'spreadDuvet' },
      { use: 'teddy', how: 'drop', at: 'pillow', say: 'Teddy on the pillow!', hint: 'Now Teddy!', act: 'teddyPillow' },
    ],
  },
  bedtime: {
    room: 'bed', spot: 'bedside', ask: 'Bedtime! What comes first?', done: 'So cosy!',
    steps: [
      { use: 'drapes', how: 'tap', say: 'Close the curtains!', hint: 'Curtains first!', act: 'closeDrapes', then: 'intoBed' },
      { use: 'teddy', how: 'drop', at: 'bunny', say: 'Teddy for a cuddle!', hint: 'Now Teddy!', act: 'cuddle' },
    ],
  },
  night: {
    room: 'bed', spot: 'inBed', ask: 'Sleepy time! What comes next?', done: 'Night night!',
    steps: [
      { use: 'duvet', how: 'drop', at: 'bunny', say: 'Tuck Bunny in!', hint: 'Tuck in first!', act: 'tuckIn' },
      { use: 'lamp', how: 'tap', say: 'Lights off!', hint: 'Now lights off!', act: 'lightsOff' },
    ],
  },
};

// One routine per round. mess: what is on the paws when the round starts. intro: the line that sets it up.
// Level 1: the bathroom on a sunny day, one routine at a time, each step shown (the thing to use glows).
// Level 2: a morning in order - wake up, make the bed, then the bathroom (only a nudge when stuck).
// Level 3: the evening - the child picks what comes next (nothing glows), ending with bedtime and lights off.
export const PLANS = [
  [
    { r: 'hands', mess: 'paint', intro: 'Painty paws!' },
    { r: 'teeth', intro: 'Teeth time!' },
    { r: 'sneeze' },
    { r: 'bath', intro: 'Bath time!' },
    { r: 'hands', mess: 'mud', intro: 'Muddy paws!' },
    { r: 'hair', intro: 'Messy fur!' },
  ],
  [
    { r: 'wake' },
    { r: 'makebed' },
    { r: 'hands', intro: 'Wash your paws!' },
    { r: 'teeth', intro: 'Teeth time!' },
    { r: 'sneeze' },
    { r: 'hair', intro: 'Messy fur!' },
  ],
  [
    { r: 'hands', mess: 'jam', intro: 'Sticky jam paws!' },
    { r: 'bath' },
    { r: 'teeth' },
    { r: 'sneeze' },
    { r: 'bedtime' },
    { r: 'night' },
  ],
];
export const NEED = [0.4, 0.55, 0.65];  // how much rubbing a rub step takes (fraction of the screen travelled)
