// Letter friends (the Alphabet Train): every letter's name, sound, colour and face spot, its things (words), and the
// four-letter sets each level plays. Design: docs/design/letters.md. Words and models: docs/design/VOCAB.md wins
// wherever it has the word (its spelling and its model); the rest are this game's own Blender models (prop_lt_*).
//
// A thing: { w: word, cap: 'Apple!', kinds: [model kinds, first built one wins], creature: true (a rigged animal that
// walks), show: its silent tap show, round: true (high angular damping in the toss), nameOnly: never used for first
// sounds (Level 3), fit: size tweak, call: its animal call in the finale admire, own: this game's own model even
// where a VOCAB word card exists (the ant), lie: rests on its side on the rug (the sock) }. Its model: prop_word_<word> when built (VOCAB.md), else the first built of kinds.

// Vowels coral; consonants blue, green, orange, purple, teal, so no two letters in one set share a colour.
const CORAL = 0xff6b5e, BLUE = 0x4a8cff, GREEN = 0x3fbf5a, ORANGE = 0xff9a2e, PURPLE = 0xa77bff, TEAL = 0x22b8b0;
export const LETTER_COL = {
  A: CORAL, B: BLUE, C: BLUE, D: GREEN, E: CORAL, F: BLUE, G: PURPLE, H: ORANGE, I: CORAL, J: PURPLE, K: BLUE, L: GREEN,
  M: GREEN, N: GREEN, O: CORAL, P: PURPLE, Q: PURPLE, R: BLUE, S: ORANGE, T: ORANGE, U: CORAL, V: GREEN, W: TEAL,
  X: TEAL, Y: ORANGE, Z: GREEN,
};

// The letter's name (caption; the voice line has its own spoken form, see SPOKEN_NAME) and its pure sound.
// Held sounds are written "mmm!", stop sounds "b, b, b!", in lower case so a grown-up reading the caption aloud says
// the sound, not the name (voiceKey lower-cases anyway, so the clip keys are unchanged). Q and X have no sound line.
// Rule (audit LF1): the NAME says who a friend is (its arrival, "Where is S?", a poke); the SOUND links it to its
// things (every placement, every clue): linkWord().
export const NAME = (L) => `${L}!`;
export const SOUND = {
  A: 'a, a, a!', B: 'b, b, b!', C: 'c, c, c!', D: 'd, d, d!', E: 'e, e, e!', F: 'fff!', G: 'g, g, g!', H: 'h, h, h!',
  I: 'i, i, i!', J: 'j, j, j!', K: 'k, k, k!', L: 'lll!', M: 'mmm!', N: 'nnn!', O: 'o, o, o!', P: 'p, p, p!',
  R: 'rrr!', S: 'sss!', T: 't, t, t!', U: 'u, u, u!', V: 'vvv!', W: 'w, w, w!', Y: 'y, y, y!', Z: 'zzz!',
};
export const HELD = new Set(['F', 'L', 'M', 'N', 'R', 'S', 'V', 'Z']);   // long sounds: the body shivers while it sounds
// "mmm... moon!"
export const soundWord = (L, t) => `${SOUND[L].replace(/!$/, '')}... ${t.w.toLowerCase()}!`;
// what a friend says about one of its things: its sound-word; the name and the word only where there is no first
// sound to hear (Q, X, ice cream, owl). The lesson speaks the name-only form as two queued lines ("O!", "Owl!").
export const linkWord = (L, def) => (SOUND[L] && !def.nameOnly ? soundWord(L, def) : `${NAME(L)} ${def.cap}`);

// What the voice must say for the letter-name and letter-sound lines (tools/voice/gen.py "caption => spoken / note").
export const SPOKEN_NAME = {
  A: 'Ay', B: 'Bee', C: 'See', D: 'Dee', E: 'Ee', F: 'Eff', G: 'Jee', H: 'Aitch', I: 'Eye', J: 'Jay', K: 'Kay', L: 'El',
  M: 'Em', N: 'En', O: 'Oh', P: 'Pee', Q: 'Cue', R: 'Ar', S: 'Ess', T: 'Tee', U: 'You', V: 'Vee', W: 'Double-you',
  X: 'Ex', Y: 'Why', Z: 'Zed',
};
export const SOUND_NOTE = {
  A: 'short a as in apple, three times', B: 'b as in ball, three short', C: 'k sound as in cat', D: 'd as in duck',
  E: 'short e as in egg', F: 'held f', G: 'hard g as in goat', H: 'breathy h', I: 'short i as in igloo', J: 'j as in jar',
  K: 'k as in kite', L: 'held l', M: 'held m', N: 'held n', O: 'short o as in octopus', P: 'p as in pig, whispered',
  R: 'held r', S: 'held s', T: 't as in tap, whispered', U: 'short u as in umbrella', V: 'held v', W: 'w as in worm',
  Y: 'y as in yo-yo', Z: 'held z',
};

// Where the code face sits on each friend (letter-local x from the middle, y from the bottom, R the face radius) and
// a smaller face / no cheeks on narrow strokes. Every eye must sit on the letter (checked in the viewer for all 26).
export const FACE = {
  A: { x: 0, y: 0.82, R: 0.25 }, B: { x: -0.25, y: 0.64, R: 0.25 }, C: { x: -0.3, y: 0.54, R: 0.25 },
  D: { x: -0.28, y: 0.56, R: 0.25 }, E: { x: -0.17, y: 0.54, R: 0.26 }, F: { x: -0.16, y: 0.56, R: 0.26 },
  G: { x: -0.33, y: 0.5, R: 0.24 }, H: { x: 0, y: 0.54, R: 0.29, cheeks: true }, I: { x: 0, y: 0.56, R: 0.28 },
  J: { x: 0.0, y: 0.64, R: 0.26 }, K: { x: -0.27, y: 0.52, R: 0.25 }, L: { x: -0.16, y: 0.58, R: 0.27 },
  M: { x: 0, y: 0.5, R: 0.25 }, N: { x: 0, y: 0.54, R: 0.25 }, O: { x: 0, y: 0.91, R: 0.27, cheeks: true },
  P: { x: -0.23, y: 0.64, R: 0.25 }, Q: { x: 0, y: 0.91, R: 0.27, cheeks: true }, R: { x: -0.25, y: 0.62, R: 0.25 },
  S: { x: 0, y: 0.55, R: 0.25 }, T: { x: 0, y: 0.58, R: 0.27 }, U: { x: 0, y: 0.17, R: 0.27, cheeks: true },
  V: { x: 0, y: 0.3, R: 0.23 }, W: { x: 0, y: 0.58, R: 0.23 }, X: { x: 0, y: 0.54, R: 0.27, cheeks: true },
  Y: { x: 0, y: 0.5, R: 0.25 }, Z: { x: 0, y: 0.54, R: 0.24 },
};

// Words and models follow docs/design/VOCAB.md (the shared first-words list; its spelling and its prop_word_* models).
// letters.md section 7.3 reconciled against it: VOCAB wins wherever its word meets this game's rules (concrete, the
// letter's primary first sound, no digraph), so alligator -> Ambulance, net -> Nappy, rock -> Rocket, teacup -> Teapot,
// yarn -> Yak, ladybird -> Ladybug, donut -> Doughnut, the queen is VOCAB's own figure. Three letters words have no VOCAB
// word that fits and are this game's own models: envelope (E), insect (I), underpants (U) (prop_lt_things.py).
const P = (n) => ['prop_' + n];                       // an existing or VOCAB.md model
const W_ = (n) => ['prop_word_' + n];                 // a VOCAB.md model (prop_word_*)
const LT = (n) => ['prop_lt_' + n];                   // this game's own model (tools/blender/creatures/prop_lt_things.py)
const WP = (n, old) => ['prop_word_' + n, 'prop_' + old]; // a VOCAB reuse that the word agents may re-make as prop_word_*
const t = (w, kinds, show, o = {}) => ({ w, cap: `${w[0].toUpperCase()}${w.slice(1)}!`, kinds, show, ...o });

export const THINGS = {
  A: [t('apple', W_('apple'), 'bounce', { round: true }), t('ant', LT('ant'), 'jiggle', { own: true }), t('ambulance', W_('ambulance'), 'rock')],
  B: [t('ball', W_('ball'), 'bounce', { round: true }), t('banana', P('m_banana'), 'rock'), t('bear', ['bear'], 'creature', { creature: true })],
  C: [t('cat', ['cat'], 'creature', { creature: true, call: 'meow' }), t('car', P('m_car'), 'rock'), t('cup', P('m_cup'), 'wobble')],
  D: [t('duck', ['duck'], 'creature', { creature: true, call: 'quack' }), t('dog', W_('dog'), 'hop'), t('doughnut', P('m_donut'), 'spin')],
  E: [t('egg', W_('egg'), 'wobble'), t('elephant', ['elephant'], 'creature', { creature: true, call: 'trumpet' }), t('envelope', LT('envelope'), 'flip')],
  F: [t('fish', P('fish'), 'flip'), t('frog', ['frog'], 'creature', { creature: true, call: 'ribbit' }), t('flower', P('bloom_daisy'), 'sway')],
  G: [t('grapes', W_('grapes'), 'jiggle'), t('goat', W_('goat'), 'hop'), t('glasses', P('m_glasses'), 'spin')],
  H: [t('hat', P('hat'), 'spin'), t('horse', ['horse'], 'creature', { creature: true, call: 'neigh' }), t('house', P('house'), 'jiggle')],
  I: [t('igloo', W_('igloo'), 'jiggle'), t('insect', LT('insect'), 'jiggle'), t('ice cream', W_('icecream'), 'wobble', { nameOnly: true })],
  J: [t('jellyfish', W_('jellyfish'), 'float'), t('jar', P('jar'), 'wobble'), t('juice', W_('juice'), 'rock')],
  K: [t('kite', W_('kite'), 'fly'), t('key', P('sinkkey'), 'spin'), t('kangaroo', W_('kangaroo'), 'hop')],
  L: [t('leaf', W_('leaf'), 'flutter'), t('lemon', P('m_lemon'), 'rock', { round: true }), t('ladybug', P('m_ladybug'), 'jiggle')],
  // M's order moon, milk, monkey: the design's set-1 tables pair milk with sock and leave the monkey for later
  M: [t('moon', W_('moon'), 'rock'), t('milk', P('k_milk'), 'wobble'), t('monkey', ['monkey'], 'creature', { creature: true })],
  N: [t('nest', W_('nest'), 'wobble'), t('noodles', W_('noodles'), 'jiggle'), t('nappy', W_('nappy'), 'sway')],
  O: [t('octopus', W_('octopus'), 'jiggle'), t('orange', WP('orange', 'm_orange'), 'bounce', { round: true }), t('owl', W_('owl'), 'hop', { nameOnly: true })],
  P: [t('pig', ['pig'], 'creature', { creature: true, call: 'oink' }), t('pear', WP('pear', 'm_pear'), 'rock'), t('pumpkin', P('m_pumpkin'), 'jiggle')],
  Q: [t('queen', W_('queen'), 'hop'), t('quilt', W_('quilt'), 'jiggle')],
  R: [t('rabbit', ['bunny'], 'creature', { creature: true }), t('rainbow', P('rainbow'), 'rock'), t('rocket', W_('rocket'), 'fly')],
  S: [t('sun', W_('sun'), 'spin'), t('sock', P('farmsock'), 'sway', { lie: true }), t('snail', P('farmsnail'), 'jiggle')],
  T: [t('tomato', WP('tomato', 'ck_tomato'), 'bounce', { round: true }), t('teapot', W_('teapot'), 'wobble'), t('turtle', W_('turtle'), 'jiggle')],
  U: [t('umbrella', P('umbrella'), 'spin'), t('underpants', LT('underpants'), 'sway')],
  V: [t('van', W_('van'), 'rock'), t('vase', W_('vase'), 'wobble'), t('vegetables', W_('vegetables'), 'jiggle')],
  W: [t('watermelon', WP('watermelon', 'm_watermelon'), 'rock'), t('worm', P('m_worm'), 'jiggle'), t('window', P('window'), 'jiggle')],
  X: [t('xylophone', W_('xylophone'), 'jiggle', { nameOnly: true }), t('x-ray', W_('xray'), 'flip', { nameOnly: true, cap: 'X-ray!' })],
  Y: [t('yogurt', P('k_yogurt'), 'wobble'), t('yo-yo', W_('yoyo'), 'spin', { round: true, cap: 'Yo-yo!' }), t('yak', W_('yak'), 'hop')],
  Z: [t('zebra', W_('zebra'), 'hop'), t('zip', W_('zip'), 'rock')],
};

// Sets: train order, front to back. Levels 1 and 2 play sets 1-7; Level 3 plays sets 1-5 and its own last two (no
// Q or X, which have no sound; one vowel per set, so I never meets U).
export const SETS = ['ABMS', 'CDHP', 'FLTG', 'RNEJ', 'WKOZ', 'IVYB', 'UQXS'];
export const SETS_L3 = ['ABMS', 'CDHP', 'FLTG', 'RNEJ', 'WKOZ', 'IVYB', 'UKPS'];

// The fixed lines (exact captions). Every instruction is action + object + result in toddler words.
export const SAY = {
  intro: 'All aboard the letter train!',
  open: 'Open the box!',                 // Level 1: the box knob glows
  packThem: 'Put them on the train!',    // Level 1: the things on the rug
  put: 'Put it on the train!',           // Level 2: the one thing on the rug
  mine: 'Put mine on the train!',        // Level 3: said by the friend, right after its sound
  other: 'Try the other one!',           // Level 2, two carriages: the wrong one
  notMe: 'Not me!',                      // Level 2, three or more carriages: said by the wrong friend
  aboard: 'All aboard!',                 // the finale only
};
export const whereIs = (L) => `Where is ${L}?`;
