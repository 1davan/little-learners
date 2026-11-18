// Roll & push: the 34 puzzles (10 / 12 / 12; docs/design/roll.md section 4, as shipped) as data. Each course lists the ten columns c1..c10:
//   '4'    a flat top 4 steps high          '4\\'  a slope cap from 4 (left edge) down to 3 (right edge)
//   '[2]'  a hole: a column 2 steps high    'L'    a lift column (heights from its piece)
//   'S'    a column under the see-saw       'D'    a flat column carrying a door (as high as its left neighbour)
//   'W1'   a water pool: a hole 1 step high, full of water (a crate floats in it, a stone sinks)
// c10 is always a slope down to the chute. Pieces (col = 1..10):
//   pop    { col, n }        yellow block standing on the track (n = 2: two stacked, tap twice)
//   up     { col }           yellow block sunk in a hole: tap and it rises flush
//   plank  { col }           yellow plank standing at the right edge of col: tap and it falls across the gap
//   box    { col, goal }     blue box: push it into the hole at goal
//   ramp   { col, goal }     blue ramp: push it to goal, against the step on its right
//   cart   { col, goal }     a wooden cart on a slope, held by the next piece (a pop or a door); rolls into goal by itself
//   door   { col, color, btn, at }  a door over col (at 'left': at its left edge), its dome button under column btn
//   button { col, color }    a decoy button (3-3: the red one opens the snail hatch)
//   lift   { col, a, b }     a lift column starting at height a, gliding to b and back
//   seesaw { col, box }      a see-saw over col..col+2 (pivot on col+1); box: a box on its right end (goal: box)
//   cookie { col }           a yellow cookie stack in the way: each tap, the hoglet eats one cookie (3 taps)
//   jelly  { col }           a yellow jelly in a pit: the hoglet drops onto it; tap it and it bounces the hoglet up
//   balloon { col }          a yellow balloon tied to a peg on col: tap, it ties on and floats the hoglet up the step;
//                            tap again and it pops softly, the hoglet floats down
//   crate  { col, goal }     a blue wooden crate: pushed into water it floats (a bridge); stone { col, goal } sinks
// say.first: the instruction for this puzzle's first stop (otherwise it comes from the piece kind).
export const LEVELS = [
  // ---------------- Level 1: Tap ----------------
  [
    { name: 'First roll', cols: ['6', '6', '6\\', '5\\', '4\\', '3\\', '2', '2', '2', '2\\'], pieces: [{ k: 'pop', col: 2 }], acts: 1 },
    { name: 'Roll, then stop', cols: ['5', '5\\', '4', '4', '4', '4\\', '3', '3\\', '2', '2\\'], pieces: [{ k: 'pop', col: 5 }], acts: 1 },
    { name: 'Two blocks', cols: ['5', '5', '5\\', '4', '4', '4\\', '3', '3', '3\\', '2\\'], pieces: [{ k: 'pop', col: 5 }, { k: 'pop', col: 8 }], acts: 2 },
    { name: 'Tall block', cols: ['4', '4', '4', '4', '3', '3', '3', '2', '2', '2\\'], pieces: [{ k: 'pop', col: 3, n: 2 }], acts: 2 },
    { name: 'The door', cols: ['5', '5\\', '4', '4', '4', '4', '4\\', '3\\', '2', '2\\'], pieces: [{ k: 'door', col: 5, color: 'red' }], acts: 1 },
    { name: 'Door, then block', cols: ['5', '5\\', '4', '4', '4', '4\\', '3', '3', '3\\', '2\\'], pieces: [{ k: 'door', col: 4, color: 'red' }, { k: 'pop', col: 8 }], acts: 2 },
    { name: 'The hole', cols: ['4', '4', '4', '4', '[2]', '4', '4\\', '3\\', '2', '2\\'], pieces: [{ k: 'up', col: 5 }], acts: 1 },
    { name: 'Hole and door', cols: ['5', '5\\', '4', '4', '[2]', '4', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'up', col: 5 }, { k: 'door', col: 7, color: 'red' }], acts: 2 },
    { name: 'Three in a row', cols: ['4', '4', '4', '[2]', '4', '4', '4', '3', '2', '2\\'], pieces: [{ k: 'pop', col: 2 }, { k: 'up', col: 4 }, { k: 'door', col: 6, color: 'red' }], acts: 3 },
    { name: 'The big slide', cols: ['6', '6', '6', '6', '6\\', '5\\', '4\\', '3\\', '2', '2\\'], pieces: [{ k: 'pop', col: 2, n: 2 }, { k: 'door', col: 4, color: 'red' }], acts: 3 },
  ],
  // ---------------- Level 2: Push ----------------
  [
    { name: 'Box in the hole', cols: ['4', '4', '4', '4', '[2]', '4', '4\\', '3\\', '2', '2\\'], pieces: [{ k: 'box', col: 4, goal: 5 }], acts: 1 },
    { name: 'Push the other way', cols: ['5', '5\\', '4', '4', '[2]', '4', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'box', col: 7, goal: 5 }], acts: 1 },
    { name: 'The ramp', cols: ['3', '3', '3', '3', '3', '4', '4\\', '3\\', '2', '2\\'], pieces: [{ k: 'ramp', col: 3, goal: 5 }], acts: 1 },
    { name: 'Box, then block', cols: ['5', '5\\', '4', '4', '4', '[2]', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'box', col: 4, goal: 6 }, { k: 'pop', col: 7 }], acts: 2 },
    { name: 'Cookie wall', cols: ['5', '5\\', '4', '4', '4', '4\\', '3', '3', '3\\', '2\\'], pieces: [{ k: 'cookie', col: 5 }], acts: 3 },
    { name: 'Ramp, then door', cols: ['3', '3', '3', '3', '4', '4', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'ramp', col: 2, goal: 4 }, { k: 'door', col: 7, color: 'red' }], acts: 2 },
    { name: 'Floaty crate', cols: ['4', '4', '4', '4', 'W1', '4', '4\\', '3\\', '2', '2\\'], pieces: [{ k: 'crate', col: 4, goal: 5 }], acts: 1 },
    { name: 'The bridge', cols: ['4', '4', '4', '4', '[0]', '[0]', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'plank', col: 4 }], acts: 1 },
    { name: 'The cart', cols: ['5', '5', '5', '5\\', '4', '[2]', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'cart', col: 4, goal: 6 }, { k: 'pop', col: 5, holds: true }], acts: 1 },
    { name: 'Jelly jump', cols: ['4', '4', '4', '[2]', '6', '6\\', '5\\', '4\\', '3\\', '2\\'], pieces: [{ k: 'jelly', col: 4 }], acts: 1 },
    { name: 'Up and over', cols: ['2', '2', '2', '3', '3', '3', '4', '4', '3', '2\\'], pieces: [{ k: 'ramp', col: 2, goal: 3 }, { k: 'ramp', col: 5, goal: 6 }], acts: 2 },
    { name: 'All together', cols: ['3', '3', '3', '[1]', '3', '3', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'pop', col: 2 }, { k: 'box', col: 3, goal: 4 }, { k: 'ramp', col: 5, goal: 6 }], acts: 3 },
  ],
  // ---------------- Level 3: Think ----------------
  [
    { name: 'The lift down', cols: ['6', '6', '6', 'L', '3', '3', '3\\', '2', '2', '2\\'], pieces: [{ k: 'lift', col: 4, a: 6, b: 3 }], acts: 1 },
    { name: 'The lift up', cols: ['3', '3', '3', 'L', '6', '6\\', '5\\', '4\\', '3\\', '2\\'], pieces: [{ k: 'lift', col: 4, a: 3, b: 6 }], acts: 1 },
    { name: 'Which button?', cols: ['5', '5\\', '4', '4', '4', '4', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'door', col: 6, color: 'green', btn: 7 }, { k: 'button', col: 5, color: 'red' }], acts: 1 },
    { name: 'Door first', cols: ['4', '4', '4', '[2]', '4', 'D', '4', '4', '3', '2\\'], pieces: [{ k: 'door', col: 6, color: 'red' }, { k: 'box', col: 7, goal: 4 }], acts: 2 },
    { name: 'Balloon lift', cols: ['4', '4', '4', '4', '6', '6\\', '5\\', '4\\', '3\\', '2\\'], pieces: [{ k: 'balloon', col: 4 }], acts: 2 },
    { name: 'The see-saw', cols: ['5', '5', 'S', 'S', 'S', '4', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'pop', col: 2 }, { k: 'seesaw', col: 3 }], acts: 1 },
    { name: 'Box on the see-saw', cols: ['5', '5', 'S', 'S', 'S', '4', '[2]', '4', '3', '2\\'], pieces: [{ k: 'seesaw', col: 3, box: true }, { k: 'box', col: 5, goal: 7, onSeesaw: true }], acts: 1 },
    { name: 'Sink or float', cols: ['4', '4', '4', '4', 'W0', '4', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'stone', col: 6, goal: 5 }, { k: 'crate', col: 7, goal: 5 }], acts: 2 },
    { name: 'Door and cart', cols: ['5', '5', '5', '5\\', '4', '[2]', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'cart', col: 4, goal: 6 }, { k: 'door', col: 5, color: 'red', at: 'left', holds: true }, { k: 'pop', col: 7 }], acts: 2 },
    { name: 'Ramp pushes box', cols: ['3', '3', '3', '3', '[1]', '3', '4', '4\\', '3\\', '2\\'], pieces: [{ k: 'ramp', col: 2, goal: 6 }, { k: 'box', col: 4, goal: 5 }], acts: 2 },
    { name: 'Cookie and jelly', cols: ['3', '3', '3', '[1]', '5', '5', '5\\', '4\\', '3\\', '2\\'], pieces: [{ k: 'cookie', col: 3 }, { k: 'jelly', col: 4 }], acts: 4 },
    { name: 'The long way home', cols: ['3', '3', '[1]', '3', '3', '4', '4', 'L', '2', '2\\'], pieces: [{ k: 'box', col: 2, goal: 3 }, { k: 'ramp', col: 4, goal: 5 }, { k: 'door', col: 7, color: 'red' }, { k: 'lift', col: 8, a: 4, b: 2 }], acts: 4 },
  ],
];

// The level's tune: one note per planned child action (18, 19 and 23).
export const ACTIONS = LEVELS.map((L) => L.reduce((s, c) => s + c.acts, 0));

// Parse a column code into { h (top height in steps at the left edge), slope, hole, lift, seesaw, door }.
export function parseCols(course) {
  const out = [];
  let prev = 4;
  course.cols.forEach((code, i) => {
    const c = { i: i + 1, code };
    if (code === 'L') {
      const lift = course.pieces.find((p) => p.k === 'lift' && p.col === i + 1);
      c.lift = true; c.h = lift ? lift.a : prev;
    } else if (code === 'S') { c.seesaw = true; c.h = 2; }
    else if (code === 'D') { c.door = true; c.h = prev; }
    else if (code.startsWith('[')) { c.hole = true; c.h = parseInt(code.slice(1), 10); }
    else if (code.startsWith('W')) { c.hole = true; c.water = true; c.h = parseInt(code.slice(1), 10); }
    else { c.h = parseInt(code, 10); c.slope = code.endsWith('\\'); }
    if (i === 9) c.slope = true;   // c10 always runs down to the chute
    out.push(c);
    prev = c.slope ? c.h - 1 : c.h;
  });
  return out;
}
