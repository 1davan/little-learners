// Unit test for the Word world planner and memory (docs/design/words.md 8.6 and acceptance criteria 22-28).
// usage: node tools/words-plan-test.mjs [visits=10000]
// Simulates a child playing visit after visit (always right, or answering at random) and checks the rotation rules.
import { readFileSync } from 'fs';
import { WORDS, BY_ID, NOOKS, clashes } from '../app/src/lessons/words-list.js';
import * as P from '../app/src/lessons/words-plan.js';

let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; if (fails < 30) console.log('FAIL', msg); } };
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

// availability: everything (the full 300), or only what is built now (index.json), as the game sees it
const built = new Set(JSON.parse(readFileSync(new URL('../app/assets/models/index.json', import.meta.url))));
const COMPOSE = { '@blocks': 'prop_m_block', '@blueberry': 'prop_m_blueberry', '@present': 'prop_m_giftbox', '@paint': 'prop_m_paintpot', '@bed': 'prop_md_bed', '@bin': 'prop_md_bin', '@money': 'prop_coin', '@picture': 'prop_frame', '@train': 'prop_engine', '@rain': 'prop_cloud' };
// (anchor checks need the live models; in node a part counts as available when its model exists)
const availNow = (id) => BY_ID[id].models.some((m) => { const k = COMPOSE[m] || m.split('#')[0]; return built.has(k); });
const availAll = () => true;

function play(mem, { level, avail, p = 1, day }) {
  const plan = P.planVisit(mem, { level, avail, today: day });
  if (!plan) return null;
  plan._met = new Set(Object.keys(mem.w).filter((id) => P.box(mem, id) > 0));
  const all = [...plan.slots.A, ...plan.slots.B];
  for (const id of all) P.heard(mem, id, plan.turn);
  P.beginVisit(mem, plan);
  const missed = new Set();
  let firsts = 0, n = 0;
  const asked = new Set();
  for (const f of plan.finds) {
    let id = f.word;
    if (f.again) {
      const slots = plan.slots[f.nook];
      id = slots.find((x) => missed.has(x)) || slots.slice().sort((a, b) => P.box(mem, a) - P.box(mem, b))[0];
    }
    const first = rnd() < p;
    if (!first) missed.add(id);
    P.found(mem, id, first, plan.turn, day);
    asked.add(id); n++; if (first) firsts++;
  }
  for (const id of all) if (!asked.has(id)) P.practised(mem, id, plan.turn);
  let sortFirst = 0, sorts = 0;
  if (plan.sort) for (const l of plan.sort.loads) for (const t of l) { sorts++; if (rnd() < p) sortFirst++; P.heard(mem, t.id, plan.turn); }
  P.endVisit(mem, plan, { firsts, finds: n, sortFirst, sorts, sortMisses: sorts - sortFirst });
  return plan;
}

function checkPlan(plan, prev, level) {
  const all = [...plan.slots.A, ...plan.slots.B];
  ok(all.length === 6 && new Set(all).size === 6, 'six different things ' + all);
  for (const k of ['A', 'B']) {
    const s = plan.slots[k];
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) ok(!clashes(s[i], s[j], level), `clash ${s[i]} ${s[j]}`);
    for (const id of s) ok(BY_ID[id].nook === plan.nooks[k === 'A' ? 0 : 1], 'word in its nook ' + id);
  }
  ok(!prev || plan.place !== prev.place, 'same place twice running ' + plan.place);
  // Level 3 sorts only toys she has met (a box, or today's six); without enough of them it is a Level 2 style visit
  const want = level === 0 ? 6 : level === 1 ? 8 : plan.sort ? 4 : 8;
  if (plan.sort) for (const l of plan.sort.loads) for (const t of l) ok(plan._met.has(t.id) || [...plan.slots.A, ...plan.slots.B].includes(t.id), 'sort toy not met ' + t.id);
  ok(plan.finds.length === want, 'finds ' + plan.finds.length);
  if (level === 0) {
    const t = plan.finds.map((f) => f.word);
    ok(new Set(t).size === 6, 'L1: each word a target once');
  }
}

// ---- 1. the first ten visits of an always-right child (words.md 4.4 table, with this list's nooks)
{
  const mem = P.blankMemory();
  const got = [];
  for (let v = 0; v < 12; v++) { const plan = play(mem, { level: 0, avail: availAll, p: 1, day: 100 + v }); got.push(plan); }
  const places = got.map((g) => g.place);
  console.log('first 12 places:', places.join(' '));
  ok(places.slice(0, 12).join(' ') === 'animals home food animals toys vehicles home clothes body food outdoors people', 'rotation of the first 12 visits');
  console.log('visit 1:', got[0].slots.A.join(','), '|', got[0].slots.B.join(','));
  console.log('visit 2:', got[1].slots.A.join(','), '|', got[1].slots.B.join(','));
  console.log('visit 4:', got[3].slots.A.join(','), '|', got[3].slots.B.join(','), 'new', got[3].isNew.join(','));
  console.log('visit 7:', got[6].slots.A.join(','), '|', got[6].slots.B.join(','), 'new', got[6].isNew.join(','));
  ok(new Set(places.slice(0, 12)).size === 9, 'all nine places within 12 visits');
}

// ---- 2. a met word comes back at its place's next turn; a missed first try comes back too
{
  const mem = P.blankMemory();
  const p1 = play(mem, { level: 0, avail: availAll, p: 0, day: 10 }); // misses everything
  const metIds = [...p1.slots.A, ...p1.slots.B];
  let next = null;
  for (let v = 0; v < 20 && !next; v++) { const pl = play(mem, { level: 0, avail: availAll, p: 1, day: 11 + v }); if (pl.place === p1.place) next = pl; }
  const back = [...next.slots.A, ...next.slots.B];
  const kept = metIds.filter((id) => back.includes(id));
  console.log('missed words back at the next turn:', kept.length, 'of', metIds.length);
  ok(kept.length >= 4, 'missed words come back at the next turn');
}

// ---- 3. long runs: random child and always-right child, all three levels, full list and built-only
for (const [label, avail] of [['all 300', availAll], ['built now', availNow]]) {
  const nAvail = WORDS.filter((w) => avail(w.id)).length;
  for (const p of [1, 0.5]) for (const level of [0, 1, 2]) {
    const mem = P.blankMemory();
    let prev = null, metAt = null, maxWait = 0;
    const lastAt = {};
    const visits = Number(process.argv[2] || 10000) / 6 | 0;
    for (let v = 0; v < visits; v++) {
      const plan = play(mem, { level, avail, p, day: 1000 + v });
      if (!plan) { ok(false, `${label}: no plan at visit ${v}`); break; }
      checkPlan(plan, prev, level);
      if (lastAt[plan.place] !== undefined) maxWait = Math.max(maxWait, v - lastAt[plan.place]);
      lastAt[plan.place] = v;
      prev = plan;
      if (metAt === null && P.stats(mem).met >= nAvail) metAt = v + 1;
    }
    const st = P.stats(mem);
    console.log(`${label} (${nAvail} words) p=${p} L${level + 1}: all met after ${metAt ?? 'never'} visits; longest wait ${maxWait}; met ${st.met}, known ${st.known}; newPer ${mem.newPer}; sortStage ${mem.sortStage}`);
    ok(maxWait <= 14, `${label} L${level + 1}: a place waited ${maxWait} visits`);
    if (label === 'all 300' && p === 1) ok(metAt !== null && metAt <= 160, `${label} p=${p} L${level + 1}: every word met (at ${metAt})`);
  }
}

// ---- 4. memory survives a save / load (quitting and reopening the app)
{
  const store = { m: {}, getItem(k) { return this.m[k] ?? null; }, setItem(k, v) { this.m[k] = v; } };
  const mem = P.blankMemory();
  play(mem, { level: 0, avail: availAll, p: 1, day: 5 });
  P.saveMemory(store, mem);
  const back = P.loadMemory(store);
  ok(JSON.stringify(back) === JSON.stringify(mem), 'memory round-trips through storage');
  mem.w.someRemovedWord = [3, 1, 0, 2, 1, 0];
  P.saveMemory(store, mem);
  ok(P.loadMemory(store).w.someRemovedWord, 'unknown ids are kept');
}
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
