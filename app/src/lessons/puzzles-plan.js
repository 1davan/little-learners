// Shape puzzles: the three levels as data (docs/design/puzzles.md section 4).
// Each puzzle: the piece (shape, size [w, h], colour, decal), its hole (an id in puzzles-layout.json), the holes whose
// floors are down when the turn starts (`open`: the target and any lures; an opened hole stays open until filled), what
// is in the toy cupboard (slots A..D; `cx` is the design doc's old cart position, kept for reference only), and the steps (a little dependency graph: a step is live once its `needs` are done).
//   at:      the slot the piece's stand is in (A, B, C, D = cx -1.5, -0.5, 0.5, 1.5), or null when a fitting holds it
//   rot:     how the piece sits at the start (degrees; it turns itself to the hole's angle as it nears)
//   say:     the instruction spoken when the turn starts (only for a puzzle with a new action)
//   teach:   the step kinds that get a slow hand demo here (the first time each appears in the level)
//   name:    the voiced shape word at the fit;  word: the caption-only picture word 0.9 s later
//   fit:     extra fittings on the cart: box, cups, cup, case, lock, ramp (see puzzles-parts.js)
//   steps:   [{ id, kind, needs }] kinds: fit, lid, plug, box, cup, ring, key, peg
// Level-wide lids and plugs sit on the board from the start (level.lids / level.plugs).
export const SLOT = { A: -1.5, B: -0.5, C: 0.5, D: 1.5 };

const fitOnly = [{ id: 'fit', kind: 'fit' }];

export const LEVELS = [
  // ---------------------------------------------------------------- Level 1: the sunny garden
  {
    id: 'garden', board: 1, finale: 'You made a garden!', friend: 'sun',
    tint: true,          // P1-P5 floors are tinted in the piece's colour
    lids: [], plugs: [],
    puzzles: [
      { hole: 'sun', shape: 'circle', size: [1.2, 1.2], color: 0xffd23f, deco: 'sun', open: ['sun'], cx: -4.1, at: 'A', say: 'Put the sun in its hole!', teach: ['fit'], name: 'Circle!', word: 'The sun!', steps: fitOnly },
      { hole: 'crate', shape: 'square', size: [1.1, 1.1], color: 0x4a90ff, deco: 'crate', open: ['crate'], cx: -4.1, at: 'C', name: 'Square!', word: 'A crate!', steps: fitOnly },
      { hole: 'tent', shape: 'triangle', size: [1.4, 1.2], color: 0xff9f3f, deco: 'tent', open: ['tent'], cx: -2.8, at: 'A', rot: 35, name: 'Triangle!', word: 'A tent!', steps: fitOnly },
      { hole: 'tree', shape: 'circle', size: [1.4, 1.4], color: 0x5fd068, deco: 'tree', open: ['tree', 'house'], cx: -0.3, at: 'B', say: 'Find its hole!', teach: ['choose'], name: 'Circle!', word: 'A tree!', steps: fitOnly },
      { hole: 'house', shape: 'square', size: [1.0, 1.0], color: 0xff5a5a, deco: 'house', open: ['house', 'roof'], cx: 0.6, at: 'D', name: 'Square!', word: 'A bird house!', steps: fitOnly },
      { hole: 'roof', shape: 'triangle', size: [1.4, 0.9], color: 0x4a90ff, deco: 'roof', open: ['roof', 'ladybird'], cx: 1.2, at: 'A', rot: 180, name: 'Triangle!', word: 'A roof!', steps: fitOnly },
      { hole: 'ladybird', shape: 'circle', size: [1.1, 1.1], color: 0xff4a4a, deco: 'ladybird', open: ['ladybird', 'kite'], cx: 2.4, at: 'C', name: 'Circle!', word: 'A ladybird!', steps: fitOnly },
      { hole: 'kite', shape: 'square', size: [1.0, 1.0], color: 0xa77bff, deco: 'kite', open: ['kite', 'sail', 'ball'], cx: 4.1, at: 'A', name: 'Square!', word: 'A kite!', steps: fitOnly },
      { hole: 'sail', shape: 'triangle', size: [1.1, 1.3], color: 0xfaf6ee, deco: 'sail', open: ['sail', 'ball'], cx: 4.1, at: 'D', name: 'Triangle!', word: 'A sail!', steps: fitOnly },
      { hole: 'ball', shape: 'circle', size: [1.0, 1.0], color: 0xffffff, deco: 'ball', open: ['ball'], cx: 4.1, at: 'A', name: 'Circle!', word: 'A ball!', steps: fitOnly },
    ],
  },
  // ---------------------------------------------------------------- Level 2: the rocket night
  {
    id: 'rocket', board: 2, finale: 'You made a rocket!', friend: 'moon',
    lids: [{ hole: 'nose', crooked: [0.16, 0.1, 12] }, { hole: 'earth' }, { hole: 'panel' }],
    plugs: [{ hole: 'planet' }, { hole: 'satellite' }],
    puzzles: [
      { hole: 'moon', shape: 'circle', size: [1.3, 1.3], color: 0xfff1c4, deco: 'moon', open: ['moon'], cx: -4.1, at: 'B', say: 'Put the moon in its hole!', teach: ['fit'], name: 'Circle!', word: 'The moon!', steps: fitOnly },
      { hole: 'starA', shape: 'star', size: [1.25, 1.25], color: 0xffd23f, open: ['starA', 'body'], cx: -3.4, at: 'D', name: 'Star!', word: '', steps: fitOnly },
      { hole: 'body', shape: 'rect', size: [1.1, 1.3], color: 0xf4f1ea, deco: 'rocket', open: ['body'], cx: -2.5, at: 'A', rot: 90, name: 'Rectangle!', word: 'A rocket!', steps: fitOnly },
      { hole: 'nose', shape: 'triangle', size: [1.0, 0.75], color: 0xff5a5a, open: ['nose'], cx: -2.5, at: 'C', say: 'Take the lid off!', teach: ['lid'], name: 'Triangle!', word: 'A rocket nose!',
        steps: [{ id: 'lid', kind: 'lid', hole: 'nose' }, { id: 'fit', kind: 'fit', needs: ['lid'] }] },
      { hole: 'earth', shape: 'circle', size: [1.3, 1.3], color: 0x4a90ff, deco: 'earth', open: ['earth', 'starB'], cx: -0.7, at: 'A', name: 'Circle!', word: 'The Earth!',
        steps: [{ id: 'lid', kind: 'lid', hole: 'earth' }, { id: 'fit', kind: 'fit', needs: ['lid'] }] },
      { hole: 'starB', shape: 'star', size: [0.9, 0.9], color: 0xfff08a, open: ['starB', 'flag'], cx: 0.9, at: null, say: "Where's the star? Open the box!", teach: ['box'], name: 'Star!', word: '',
        fit: [{ kind: 'box', id: 'box', at: 'B', color: 0xff5a5a, piece: true, watch: true }],
        steps: [{ id: 'box', kind: 'box', obj: 'box' }, { id: 'fit', kind: 'fit', needs: ['box'] }] },
      { hole: 'flag', shape: 'triangle', size: [1.0, 0.9], color: 0x5fd068, open: ['flag'], show: ['planet'], cx: 2.0, at: null, say: "Where's the triangle? Open a box!", name: 'Triangle!', word: 'A flag!',
        fit: [{ kind: 'box', id: 'red', at: 'A', color: 0xff5a5a, piece: false }, { kind: 'box', id: 'blue', at: 'C', color: 0x4a90ff, piece: true, watch: true }],
        steps: [{ id: 'box', kind: 'box', obj: 'blue' }, { id: 'fit', kind: 'fit', needs: ['box'] }] },
      { hole: 'planet', shape: 'circle', size: [1.2, 1.2], color: 0xa77bff, open: ['planet'], cx: 3.3, at: 'B', say: 'Pull the plug out!', teach: ['plug'], name: 'Circle!', word: 'A planet!',
        steps: [{ id: 'plug', kind: 'plug', hole: 'planet' }, { id: 'fit', kind: 'fit', needs: ['plug'] }] },
      { hole: 'satellite', shape: 'square', size: [0.9, 0.9], color: 0xc4ccd8, deco: 'satellite', open: ['satellite'], show: ['panel'], cx: 4.1, at: 'A', name: 'Square!', word: 'A satellite!',
        steps: [{ id: 'plug', kind: 'plug', hole: 'satellite' }, { id: 'fit', kind: 'fit', needs: ['plug'] }], extra: [{ kind: 'lid', hole: 'panel' }] },
      { hole: 'panel', shape: 'rect', size: [1.3, 0.7], color: 0x4a90ff, deco: 'panel', open: ['panel'], cx: 4.1, at: null, name: 'Rectangle!', word: 'A wing!',
        fit: [{ kind: 'box', id: 'box', at: 'B', color: 0xff5a5a, piece: true, watch: true, rot: 90 }],
        steps: [{ id: 'box', kind: 'box', obj: 'box' }, { id: 'lid', kind: 'lid', hole: 'panel' }, { id: 'fit', kind: 'fit', needs: ['box', 'lid'] }] },
    ],
  },
  // ---------------------------------------------------------------- Level 3: the robot's party
  {
    id: 'robot', board: 3, finale: 'You made a robot!', friend: 'head',
    lids: [{ hole: 'hat' }, { hole: 'present' }],
    plugs: [],
    puzzles: [
      { hole: 'head', shape: 'square', size: [1.0, 1.0], color: 0x3fc6b8, deco: 'robot', open: ['head'], cx: -4.1, at: 'C', say: 'Put the robot in its hole!', teach: ['fit'], name: 'Square!', word: 'A robot!', steps: fitOnly },
      { hole: 'body', shape: 'rect', size: [1.4, 0.9], color: 0x3fc6b8, deco: 'buttons', open: ['body', 'heart'], cx: -3.7, at: null, say: 'Open the box!', teach: ['box'], name: 'Rectangle!', word: 'A robot tummy!',
        fit: [{ kind: 'box', id: 'box', at: 'C', color: 0xff5a5a, piece: true, watch: true }],
        steps: [{ id: 'box', kind: 'box', obj: 'box' }, { id: 'fit', kind: 'fit', needs: ['box'] }] },
      { hole: 'hat', shape: 'triangle', size: [0.9, 0.6], color: 0xffd23f, deco: 'hat', open: ['hat'], cx: -4.1, at: 'D', say: 'Take the lid off!', teach: ['lid'], name: 'Triangle!', word: 'A party hat!',
        steps: [{ id: 'lid', kind: 'lid', hole: 'hat' }, { id: 'fit', kind: 'fit', needs: ['lid'] }] },
      { hole: 'heart', shape: 'heart', size: [1.1, 1.1], color: 0xff4a6a, open: ['heart'], cx: -3.2, at: null, say: 'Pull the string down!', teach: ['ring'], name: 'Heart!', word: 'A balloon!',
        fit: [{ kind: 'case', id: 'case' }],
        steps: [{ id: 'ring', kind: 'ring', obj: 'case' }, { id: 'fit', kind: 'fit', needs: ['ring'] }] },
      { hole: 'bigstar', shape: 'star', size: [1.25, 1.25], color: 0xffd23f, open: ['bigstar', 'smallstar'], cx: -1.2, at: 'A', name: 'A big star!', word: '', steps: fitOnly },
      { hole: 'smallstar', shape: 'star', size: [0.95, 0.95], color: 0xffd23f, open: ['smallstar'], cx: -0.2, at: null, say: "Where's the star? Lift a cup!", teach: ['cup'], name: 'A small star!', word: '',
        fit: [{ kind: 'cups', id: 'cups', at: ['B', 'C'], piece: 'B', watch: true }],
        steps: [{ id: 'cup', kind: 'cup', obj: 'cupC' }, { id: 'fit', kind: 'fit', needs: ['cup'] }] },
      { hole: 'bigball', shape: 'circle', size: [1.2, 1.2], color: 0xff9f3f, open: ['bigball', 'smallball'], cx: 1.5, at: null, say: 'Put the key in the lock!', teach: ['key'], name: 'A big circle!', word: 'A big ball!',
        fit: [{ kind: 'lock', id: 'lock', key: 'hook' }],
        steps: [{ id: 'key', kind: 'key', obj: 'lock' }, { id: 'fit', kind: 'fit', needs: ['key'] }] },
      { hole: 'smallball', shape: 'circle', size: [0.9, 0.9], color: 0x5fd068, open: ['smallball'], cx: 2.7, at: null, say: 'Pull the peg up!', teach: ['peg'], name: 'A small circle!', word: 'A small ball!',
        fit: [{ kind: 'ramp', id: 'ramp' }],
        steps: [{ id: 'peg', kind: 'peg', obj: 'ramp' }, { id: 'fit', kind: 'fit', needs: ['peg'] }] },
      { hole: 'wagon', shape: 'rect', size: [1.5, 0.8], color: 0xff9f3f, open: ['wagon'], cx: 4.1, at: null, say: "Where's the key? Lift the cup!", name: 'Rectangle!', word: 'A wagon!',
        fit: [{ kind: 'lock', id: 'lock', key: 'deck', wide: true }, { kind: 'cup', id: 'cupD', at: 'D', over: 'key', watch: true }],
        steps: [{ id: 'cup', kind: 'cup', obj: 'cupD' }, { id: 'key', kind: 'key', obj: 'lock', needs: ['cup'] }, { id: 'fit', kind: 'fit', needs: ['key'] }] },
      { hole: 'present', shape: 'square', size: [0.8, 0.8], color: 0xff8fc0, deco: 'bow', open: ['present'], cx: 4.1, at: null, name: 'Square!', word: 'A present!',
        fit: [{ kind: 'case', id: 'case' }],
        steps: [{ id: 'ring', kind: 'ring', obj: 'case' }, { id: 'lid', kind: 'lid', hole: 'present' }, { id: 'fit', kind: 'fit', needs: ['ring', 'lid'] }] },
    ],
  },
];

// symmetry of each shape (degrees): the piece turns to the nearest equivalent angle of its hole
export const SYM = { circle: 0, square: 90, rect: 180, triangle: 360, star: 72, heart: 360 };
// instruction for each kind of step (spoken only when it is new in the level, and by the 6 s cue)
export const SAY_STEP = { lid: 'Take the lid off!', plug: 'Pull the plug out!', box: 'Open the box!', cup: 'Lift the cup!', ring: 'Pull the string down!', key: 'Put the key in the lock!', peg: 'Pull the peg up!' };
