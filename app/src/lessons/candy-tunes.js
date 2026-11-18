// Candy beats: the library of phrases. Fragments of well-known public-domain nursery tunes plus rhythm patterns.
// Notes are candy letters (C red, D orange, E yellow, F green, G blue, A purple); ':n' is the length in beats
// (default 1 = "ta", 0.5 = "ti", 2 = a long "ta-a").
//   L1: two or three candies, two- and three-note calls, all even and slow
//   L2: four candies (C D E G), three to five notes with simple long / short rhythms
//   L3: five candies, then six (purple joins), tunes in two lines; the whole tune plays back with a band
import { shuffle } from '../engine/lesson.js';

const IDX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5 };
export function parse(s) {
  return s.trim().split(/\s+/).map((t) => { const [l, d] = t.split(':'); return { n: IDX[l], d: d ? +d : 1 }; });
}

const L1_TWO = [ // red and blue only
  { name: 'Up!', p: ['C G'] }, { name: 'Down!', p: ['G C'] }, { name: 'Ding ding dong', p: ['C C G'] },
  { name: 'Dong dong ding', p: ['G G C'] }, { name: 'Hop, hop', p: ['C G:2'] },
];
const L1_THREE = [ // red, yellow, blue
  { name: 'Cuckoo!', p: ['G E:2'] }, { name: 'Cuckoo, cuckoo!', p: ['G E G'] }, { name: 'Up the stairs', p: ['C E G'] },
  { name: 'Down the stairs', p: ['G E C'] }, { name: 'Peekaboo', p: ['E E G'] },
  { name: 'Bounce, bounce', p: ['C E C'] }, { name: 'Hello!', p: ['E G'] },
];
const L2 = [ // red, orange, yellow, blue
  { name: 'Hot cross buns', p: ['E D C:2'] },
  { name: 'Mary had a little lamb', p: ['E D C D'] },
  { name: 'Little lamb', p: ['E E E:2'] },
  { name: 'Rain, rain, go away', p: ['G E G:0.5 G:0.5 E'] },
  { name: 'Jingle bells', p: ['E G C:1.5 D:0.5 E:2'] },
  { name: 'Twinkle, twinkle', p: ['C C G G'] },
  { name: 'Frère Jacques', p: ['C D E C'] },
  { name: 'E-I-E-I-O', p: ['E E D D C:2'] },
  { name: 'Row, row, row', p: ['C C C:0.5 D:0.5 E:2'] },
  { name: 'Ta, ta, ti-ti, ta', p: ['C C C:0.5 C:0.5 C'] },
  { name: 'Ta, ta, ti-ti, ta', p: ['G G E:0.5 E:0.5 G'] },
  { name: 'Long, short, short', p: ['C:2 G G'] },
  { name: 'Ti-ti, ti-ti, ta-a', p: ['E:0.5 E:0.5 D:0.5 D:0.5 C:2'] },
  { name: 'Ti-ti, ta', p: ['D:0.5 D:0.5 E'] },
];
const L3_FIVE = [ // C D E F G
  { name: 'Mary had a little lamb', p: ['E D C D E E E:2', 'D D D:2 E G G:2'] },
  { name: 'Row, row, row your boat', p: ['C C C:0.75 D:0.25 E:2', 'E:0.75 D:0.25 E:0.75 F:0.25 G:2'] },
  { name: 'Frère Jacques', p: ['C D E C', 'E F G:2'], full: [0, 0, 1, 1] },
  { name: 'Ode to joy', p: ['E E F G', 'G F E D'] },
  { name: 'Jingle bells', p: ['E E E:2 E E E:2', 'E G C:1.5 D:0.5 E:2'] },
];
const L3_SIX = [ // C D E F G A (purple joins)
  { name: 'Twinkle, twinkle, little star', p: ['C C G G A A G:2', 'F F E E D D C:2'] },
  { name: 'Baa, baa, black sheep', p: ['C C G G', 'A:0.5 A:0.5 A:0.5 A:0.5 G:2'] },
  { name: 'Old MacDonald', p: ['C C C G A A G:2', 'E E D D C:2'] },
  { name: 'London Bridge', p: ['G:1.5 A:0.5 G F E F G:2', 'D E F:2 E F G:2'] },
];

// The plan for one game: rounds [{ name, phrases: [[{n, d}]], full: [phrase indices], set: [candy indices] }].
// Never the same tune twice in a row (none repeats within a game).
export function makePlan(level) {
  const rounds = [];
  const add = (t, set) => rounds.push({ name: t.name, phrases: t.p.map(parse), full: t.full || t.p.map((_, i) => i), set });
  if (level === 0) {
    shuffle(L1_TWO).slice(0, 2).forEach((t) => add(t, [0, 4]));
    shuffle(L1_THREE).slice(0, 4).forEach((t) => add(t, [0, 2, 4]));
  } else if (level === 1) {
    // rhythm and tune fragments alternate, so long / short keeps coming back
    // (one of the two "Ta, ta, ti-ti, ta" patterns at most, so no name shows twice in a game)
    const r = shuffle(L2.filter((t) => /Ta|Ti|Long/.test(t.name))).filter((t, k, a) => a.findIndex((x) => x.name === t.name) === k);
    const m = shuffle(L2.filter((t) => !/Ta|Ti|Long/.test(t.name)));
    for (let i = 0; i < 6; i++) add(i % 2 ? r[(i / 2) | 0] : m[(i / 2) | 0], [0, 1, 2, 4]);
  } else {
    shuffle(L3_FIVE).slice(0, 2).forEach((t) => add(t, [0, 1, 2, 3, 4]));
    shuffle(L3_SIX).slice(0, 3).forEach((t) => add(t, [0, 1, 2, 3, 4, 5]));
  }
  return rounds;
}
