// Word world: the word memory (words.md 8.5) and the planner (8.6). Pure functions, no scene or DOM code, so the
// whole rotation can be unit-tested in node (tools/words-plan-test.mjs) with a simulated child.
//
// Memory (saved under its own key 'll.words.v1', separate from 'll.v1'):
//   { v: 1, visit, last: [newest, older], turn: { place: n }, at: { place: visit }, newPer, good, sortStage, sortGood,
//     w: { id: [box, turnSeen, dayPromoted, heard, okFirstTry, misses] } }
// Box 0 never met · 1 met · ... · 4-5 known. A word is due when (its place's next turn) - turnSeen >= GAP[box].
import { WORDS, BY_ID, NOOK_WORDS, NOOKS, PLACES, PLACE_ORDER, PLACE_BY_ID, clashes, SORT_CLASH, STAGE1_PAIRS } from './words-list.js';

export const KEY = 'll.words.v1';
export const GAP = [0, 1, 1, 2, 3, 5];
const B = 0, V = 1, D = 2, N = 3, OK = 4, NO = 5;

export function blankMemory() {
  return { v: 1, visit: 0, last: [], turn: {}, at: {}, nt: {}, newPer: 2, good: 0, sortStage: 1, sortGood: 0, w: {} };
}
export function loadMemory(storage) {
  try {
    const raw = storage && storage.getItem(KEY);
    if (raw) { const m = JSON.parse(raw); if (m && m.v === 1) return { ...blankMemory(), ...m, w: m.w || {} }; }
  } catch (e) { /* unreadable: start fresh */ }
  return blankMemory();
}
export function saveMemory(storage, mem) { try { storage && storage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* full */ } }

const rec = (mem, id) => mem.w[id] || [0, 0, 0, 0, 0, 0];
export const box = (mem, id) => rec(mem, id)[B];
export function dayNumber(t = Date.now()) { const d = new Date(t); return Math.floor((t - d.getTimezoneOffset() * 60000) / 86400000); }

// ---------------------------------------------------------------- events (words.md 8.5 table)
// She hears the word's name line (meet tap, wrong tap in Find, picking up a toy, the book).
export function heard(mem, id, turn) {
  const r = rec(mem, id).slice();
  r[N]++;
  if (r[B] === 0) { r[B] = 1; r[V] = turn; }
  mem.w[id] = r;
}
// A Find round finished. firstTry: found with no miss, hint or errorless help.
export function found(mem, id, firstTry, turn, today) {
  const r = rec(mem, id).slice();
  if (r[B] === 0) r[B] = 1;
  r[V] = turn;
  if (firstTry) { r[OK]++; if (r[D] !== today) { r[B] = Math.min(5, r[B] + 1); r[D] = today; } }
  else { r[NO]++; r[B] = Math.max(1, r[B] - 1); }
  mem.w[id] = r;
}
// In the visit but never a Find target: it was practised, its box is unchanged.
export function practised(mem, id, turn) { const r = rec(mem, id).slice(); if (r[B] > 0) { r[V] = turn; mem.w[id] = r; } }

export function isDue(mem, id, nextTurn) { const r = mem.w[id]; return !!r && r[B] > 0 && nextTurn - r[V] >= GAP[r[B]]; }
export function stats(mem, ids = WORDS.map((w) => w.id)) {
  let met = 0, known = 0;
  const byPlace = {};
  for (const id of ids) {
    const b = box(mem, id);
    if (b >= 1) { met++; const p = BY_ID[id].place; byPlace[p] = (byPlace[p] || 0) + 1; }
    if (b >= 4) known++;
  }
  return { met, known, total: ids.length, byPlace };
}

// ---------------------------------------------------------------- the planner
// avail(id) -> true when the word's model exists. opts.off: place ids the parent switched off.
function fillNook(mem, nook, quota, level, avail, nextTurn, exclude = new Set()) {
  const list = (NOOK_WORDS[nook] || []).filter((id) => avail(id) && !exclude.has(id));
  const pick = [];
  const ok = (id) => !pick.includes(id) && pick.every((p) => !clashes(p, id, level));
  const add = (ids, max = 3) => { for (const id of ids) { if (pick.length >= 3 || max <= 0) break; if (ok(id)) { pick.push(id); max--; } } };
  const fresh = list.filter((id) => box(mem, id) === 0);
  add(fresh, quota);
  const due = list.filter((id) => isDue(mem, id, nextTurn)).sort((a, b) => box(mem, a) - box(mem, b) || rec(mem, a)[V] - rec(mem, b)[V]);
  add(due);
  const met = list.filter((id) => box(mem, id) > 0).sort((a, b) => rec(mem, a)[V] - rec(mem, b)[V] || box(mem, a) - box(mem, b));
  add(met);
  add(fresh);
  return pick;
}
export function nookUsable(nook, level, avail) { return fillNook(blankMemory(), nook, 3, level, avail, 1).length === 3; }
function placeOk(p, level, avail) {
  const n = p.nooks.filter((k) => nookUsable(k, level, avail));
  return n.length >= 2 ? n : null;
}
function dueYoung(mem, place, avail) {
  const next = (mem.turn[place] || 0) + 1;
  let n = 0;
  for (const w of WORDS) if (w.place === place && avail(w.id) && box(mem, w.id) >= 1 && box(mem, w.id) <= 2 && isDue(mem, w.id, next)) n++;
  return n;
}

// The places' rotation (words.md 4.4, 8.6 rule 2): fresh, fresh, review; never the same place twice running.
export function choosePlace(mem, { level = 0, avail, off = [] }) {
  const ord = (a, b) => PLACE_ORDER.indexOf(a) - PLACE_ORDER.indexOf(b);
  let cands = PLACES.filter((p) => !off.includes(p.id) && placeOk(p, level, avail)).map((p) => p.id);
  if (!cands.length) return null;
  if (cands.length > 1) cands = cands.filter((p) => p !== mem.last[0]);
  const waited = (p) => (mem.at[p] === undefined ? Infinity : mem.visit - mem.at[p]);
  // nobody waits more than 14 visits
  const over = cands.filter((p) => mem.at[p] !== undefined && waited(p) >= 13).sort((a, b) => waited(b) - waited(a) || ord(a, b));
  if (over.length) return { place: over[0], review: false };
  if (mem.visit > 0 && mem.visit % 3 === 0) {
    const scored = cands.map((p) => [p, dueYoung(mem, p, avail)]).filter(([, n]) => n > 0);
    scored.sort((a, b) => b[1] - a[1] || waited(b[0]) - waited(a[0]) || ord(a[0], b[0]));
    if (scored.length) return { place: scored[0][0], review: true };
  }
  const fresh = cands.slice().sort((a, b) => waited(b) - waited(a) || ord(a, b));
  return { place: fresh[0], review: false };
}

export function planVisit(mem, { level = 0, avail = () => true, off = [], today = dayNumber(), force = null } = {}) {
  let place, review = false;
  if (force && force.place) place = force.place;
  else { const c = choosePlace(mem, { level, avail, off }); if (!c) return null; place = c.place; review = c.review; }
  const P = PLACE_BY_ID[place];
  const turn = (mem.turn[place] || 0) + 1; // the turn this visit will be
  const usable = P.nooks.filter((k) => nookUsable(k, level, avail));
  // ---- two nooks (rule 3)
  let A, Bk;
  if (force && force.nooks) [A, Bk] = force.nooks;
  else if (turn === 1 && P.first.every((k) => usable.includes(k))) [A, Bk] = P.first;
  else {
    const due = (k) => (NOOK_WORDS[k] || []).filter((id) => avail(id) && isDue(mem, id, turn)).length;
    const young = (k) => (NOOK_WORDS[k] || []).filter((id) => avail(id) && box(mem, id) <= 2 && isDue(mem, id, turn)).length;
    const fresh = (k) => (NOOK_WORDS[k] || []).filter((id) => avail(id) && box(mem, id) === 0).length;
    // words.md's 3 x due + min(fresh, 2), plus: brand-new words come back first, and a nook left out for a while
    // gets a growing pull, so no nook (and none of its words) is starved by busier neighbours
    const since = (k) => turn - ((mem.nt || {})[k] || 0);
    const score = (k) => 3 * Math.min(due(k), 3) + 2 * Math.min(young(k), 3) + Math.min(fresh(k), 2) + (fresh(k) || due(k) ? 3 * Math.max(0, since(k) - 2) : 0);
    const top = usable.slice().sort((a, b) => score(b) - score(a) || P.nooks.indexOf(a) - P.nooks.indexOf(b)).slice(0, 2);
    top.sort((a, b) => due(b) - due(a) || P.nooks.indexOf(a) - P.nooks.indexOf(b));
    [A, Bk] = top;
  }
  if (!A || !Bk) return null;
  // ---- the words (rule 4)
  const nNew = Math.max(1, Math.min(4, level === 1 ? mem.newPer + 1 : mem.newPer));
  const freshIn = (k) => (NOOK_WORDS[k] || []).filter((id) => avail(id) && box(mem, id) === 0).length;
  let qA = Math.floor(nNew / 2), qB = nNew - qA;
  if (nNew % 2 && freshIn(A) > freshIn(Bk)) { qA++; qB--; }
  let wa, wb;
  if (force && force.words) { wa = force.words.slice(0, 3); wb = force.words.slice(3, 6); }
  else { wa = fillNook(mem, A, qA, level, avail, turn); wb = fillNook(mem, Bk, qB, level, avail, turn); }
  // ---- seat them (rule 5): the most familiar in the middle; tall things at the sides
  const seat = (ids) => {
    if (NOOKS[BY_ID[ids[0]].nook].char) return charOrder(ids);
    const fam = (id) => box(mem, id) * 1000 + Math.min(999, rec(mem, id)[N]);
    const list = ids.slice().sort((a, b) => BY_ID[a].i - BY_ID[b].i);
    const notL = list.filter((id) => BY_ID[id].size !== 'L');
    const pool = notL.length ? notL : list;
    const mid = pool.slice().sort((a, b) => fam(b) - fam(a) || BY_ID[a].i - BY_ID[b].i)[0];
    const rest = list.filter((id) => id !== mid);
    return [rest[0], mid, rest[1]];
  };
  const slotsA = seat(wa), slotsB = seat(wb);
  const isNew = [...wa, ...wb].filter((id) => box(mem, id) === 0);
  // ---- Find rounds (rule 6; words.md 4.1-4.3). slot 0 L, 1 M, 2 R; pair = the two slots in view.
  // Level 1: the pairs are chosen so that 4 of the 6 finds are real tests (in the others the decoy already has its
  // photo, so "the one without a photo" would answer it); the most familiar word (middle) comes last.
  const trioFinds = () => [1, 0, 2].map((t) => ({ nook: 'B', target: t })).concat([2, 0, 1].map((t) => ({ nook: 'A', target: t })), [{ nook: 'A', again: true }, { nook: 'B', again: true }]);
  let finds;
  if (level === 0) {
    finds = [
      { nook: 'B', pair: [0, 1], target: 0 }, { nook: 'B', pair: [1, 2], target: 2 }, { nook: 'B', pair: [1, 2], target: 1 },
      { nook: 'A', pair: [1, 2], target: 2 }, { nook: 'A', pair: [0, 1], target: 0 }, { nook: 'A', pair: [0, 1], target: 1 },
    ];
  } else if (level === 1) {
    finds = trioFinds();
  } else {
    // nook A first, so the walk to the tidy rug starts from nook B, next door to it
    const least = (slots) => [0, 1, 2].sort((a, b) => box(mem, slots[a]) - box(mem, slots[b]) || BY_ID[slots[b]].i - BY_ID[slots[a]].i).slice(0, 2);
    finds = least(slotsA).map((t) => ({ nook: 'A', target: t })).concat(least(slotsB).map((t) => ({ nook: 'B', target: t })));
  }
  const plan = { place, review, turn, today, level, nooks: [A, Bk], slots: { A: slotsA, B: slotsB }, finds, isNew };
  if (level === 2) {
    plan.sort = planSort(mem, plan, avail);
    // not yet enough words she has met to sort: a Level 2 style visit (every word asked), the train comes later
    if (!plan.sort) plan.finds = finds = trioFinds();
  }
  for (const f of finds) f.word = f.again ? null : (f.nook === 'A' ? slotsA : slotsB)[f.target];
  return plan;
}
// body nooks: the parts sit where the character has them; keep a fixed left-to-right order
const CHAR_ORDER = ['eye', 'nose', 'cheek', 'head', 'arm', 'tummy', 'leg', 'ear', 'hair', 'elbow', 'knee'];
function charOrder(ids) { return ids.slice().sort((a, b) => CHAR_ORDER.indexOf(a) - CHAR_ORDER.indexOf(b)); }

// ---- Level 3: the homes and the train loads (rule 7; words.md 4.3)
const ALL_GROUPS = ['animals', 'food', 'toys', 'clothes', 'vehicles'];
// Only toys she has met: words with a box, or today's six (she meets them all before the train comes).
export function planSort(mem, plan, avail) {
  let stage = mem.sortStage || 1;
  const seed = (mem.visit * 7 + 3) >>> 0;
  const today = PLACE_BY_ID[plan.place].group;
  const todays = new Set([...plan.slots.A, ...plan.slots.B]);
  const met = (id) => box(mem, id) > 0 || todays.has(id);
  const groupWords = (g, homes, used) => WORDS.filter((w) => w.group === g && avail(w.id) && met(w.id) && !used.has(w.id) && !homes.some((h) => (SORT_CLASH[h] || []).includes(w.id)));
  const enough = (g) => groupWords(g, [], new Set()).length >= 3;
  const metN = (g) => groupWords(g, [], new Set()).length;
  let groups;
  if (stage === 1) {
    let pairs = STAGE1_PAIRS.filter((p) => p.every(enough));
    if (today && pairs.some((p) => p.includes(today))) pairs = pairs.filter((p) => p.includes(today));
    if (!pairs.length) return null;
    // the pair whose groups she knows most words of (ties: the visit's seed)
    const score = (p) => Math.min(metN(p[0]), 6) + Math.min(metN(p[1]), 6);
    const best = Math.max(...pairs.map(score));
    pairs = pairs.filter((p) => score(p) === best);
    groups = pairs[seed % pairs.length].slice();
  } else {
    const gs = ALL_GROUPS.filter(enough);
    if (gs.length < 2) return null;
    if (stage >= 3 && gs.length < 3) stage = 2;   // a third home only once she knows three kinds of things
    const n = stage >= 3 ? 3 : 2;
    const order = gs.slice().sort((a, b) => ((ALL_GROUPS.indexOf(a) * 5 + seed) % 7) - ((ALL_GROUPS.indexOf(b) * 5 + seed) % 7));
    groups = order.slice(0, n);
    if (today && gs.includes(today) && !groups.includes(today)) groups[n - 1] = today;
  }
  // the left-hand home's group goes first (its first toy gets the hand demo)
  if (today && groups.includes(today)) groups = [today, ...groups.filter((g) => g !== today)];
  const pattern = stage === 1 ? [[0, 0, 1], [1, 0, 1]] : stage === 2 ? [[0, 1, 0], [1, 1, 0]] : [[0, 1, 2], [2, 0, 1], [1, 2, 0]];
  const used = new Set();
  const queue = {};
  for (const g of groups) {
    // the words she knows best first; today's new words last
    const list = groupWords(g, groups, used).sort((a, b) => box(mem, b.id) - box(mem, a.id) || a.i - b.i);
    queue[g] = list.map((w) => w.id);
  }
  const loads = pattern.map((row) => row.map((gi) => { const g = groups[gi]; const id = queue[g].shift(); used.add(id); return { id, group: g }; }));
  if (loads.some((l) => l.some((t) => !t.id))) return null;
  return { stage, groups, loads };
}

// ---------------------------------------------------------------- the visit's book-keeping
// When the Meet phase ends (she has really started the visit): the place's turn is counted.
export function beginVisit(mem, plan) {
  mem.turn[plan.place] = plan.turn;
  mem.at[plan.place] = mem.visit;
  mem.last = [plan.place, ...mem.last.filter((p) => p !== plan.place)].slice(0, 2);
  mem.nt = mem.nt || {};
  for (const k of plan.nooks) mem.nt[k] = plan.turn;
}
// At the end: results = { firsts: number of first-try finds, finds: number of finds, sortFirst, sorts, sortMisses }
export function endVisit(mem, plan, res) {
  const frac = res.finds ? res.firsts / res.finds : 1;
  // (a place's first turn is six top-of-list words, all new: it does not count toward more new words)
  if (frac < 0.5) { mem.newPer = Math.max(1, mem.newPer - 1); mem.good = 0; }
  else if (plan.turn === 1) { /* keep */ }
  else if (res.finds && res.firsts >= res.finds - 1 && res.finds >= 4) {
    mem.good = (mem.good || 0) + 1;
    if (mem.good >= 2) { mem.newPer = Math.min(4, mem.newPer + 1); mem.good = 0; }
  } else mem.good = 0;
  if (plan.level === 2 && res.sorts) {
    const st = mem.sortStage || 1;
    const goodSort = res.sortFirst >= res.sorts - 1;
    if (st >= 2 && res.sortMisses >= 2) { mem.sortStage = st - 1; mem.sortGood = 0; }
    else if (goodSort && st < 3) {
      mem.sortGood = (mem.sortGood || 0) + 1;
      if (mem.sortGood >= (st === 1 ? 2 : 3)) { mem.sortStage = st + 1; mem.sortGood = 0; }
    } else if (!goodSort) mem.sortGood = 0;
  }
  mem.visit++;
}
