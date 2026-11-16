window.addEventListener('error', e => console.error('UNCAUGHT', e.message, e.filename, e.lineno));
window.addEventListener('unhandledrejection', e => console.error('REJECT', e.reason && (e.reason.stack || e.reason)));
const origErr = console.error; 
window.__seq = ['colours','counting','shapes','feelings','sizes','patterns','where','more','body','wash','moo','grow','share','band','pots','dress','bricks']; window.__i = 0; window.__done = [];
const BODYA = {nose:'nose',eyes:'eyeL',ears:'earL',mouth:'mouth',tummy:'tummy',hands:'handL',feet:'footL'};
window.__auto = setInterval(() => {
  const c = __ll.current; if (!c || c.dead) return;
  const n = c.constructor.name;
  if (n === 'Home') { if (!__ll.switching && performance.now() - (window.__t || 0) > 3000) { window.__t = performance.now(); if (__i < __seq.length) __ll.router.go(__seq[__i++]); } return; }
  if (c.busy) return;
  const wrongFirst = c.round === 0 && c.cur && c.cur.wrong === 0;
  try {
  if (n === 'ColoursLesson') {
    if (!c.target) return;
    const zs = c.zones(); const right = zs.find(z => z.tube.userData.color === c.item.userData.color);
    if (wrongFirst && zs.length > 1) { c.drop(zs.find(z => z !== right), { tapped: false }); return; }
    c.drop(right, { tapped: false });
  } else if (n === 'CountingLesson') {
    const f = (c.fruits || []).find(f => !f.userData.counted); if (f && f.userData.tap) c.tapFruit(f);
  } else if (n === 'ShapesLesson') {
    if (!c.target) return;
    const zs = c.zones(); const right = zs.find(z => z.hole.userData.kind === c.piece.userData.kind);
    if (wrongFirst) { c.drop(zs.find(z => z !== right), { tapped: false }); return; }
    c.drop(right, { tapped: false });
  } else if (n === 'FeelingsLesson') {
    const a = c.friends.find(f => (f.userData.feeling === c.emo) !== wrongFirst); if (a) c.tapFriend(a);
  } else if (n === 'SizesLesson') {
    const t = c.things.find(t => (t.userData.role === c.ask) !== wrongFirst); if (t) c.tapThing(t);
  } else if (n === 'PatternsLesson') {
    const x = c.choices.find(x => (x.userData.kind === c.answer()) !== wrongFirst); if (x) c.pick(x);
  } else if (n === 'WhereLesson') {
    if (!c.drag) return;
    const zs = c.zones(); const right = zs.find(z => z.id === c.target());
    if (wrongFirst && zs.length > 1) { const w = zs.find(z => z.prop !== (c.target()==='in'?'bucket':'stool')); if (w) { c.drop(w, {tapped:false}); return; } }
    c.drop(right, { tapped: false });
  } else if (n === 'MoreLesson') {
    c.pick(wrongFirst ? 1 - c.rightSide() : c.rightSide());
  } else if (n === 'BodyLesson') {
    if (wrongFirst) { c.touch(c.part === 'tummy' ? 'feet' : 'tummy', c.part === 'tummy' ? 'footL' : 'tummy'); return; }
    c.touch(c.part, BODYA[c.part]);
  } else if (n === 'MooLesson') {
    const a = c.animals.find(a => (a.userData.kind === c.target) !== wrongFirst); if (a) c.tapAnimal(a);
  } else if (n === 'GrowLesson') {
    const st = c.step; if (!st) return;
    if (wrongFirst) { c.use(st === 'seed' ? 'water' : 'seed'); return; }
    c.use(st);
  } else if (n === 'ShareLesson') {
    if (!c.carrot || !c.carrot.userData.drag) return;
    const bad = c.bunnies.find(b => b.userData.n > c.min());
    if (wrongFirst && bad) { c.drop({ bunny: bad }); return; }
    c.drop({ bunny: c.valid()[0] });
  } else if (n === 'BandLesson') {
    if (c.listening) return;
    const k = c.pat[c.i]; if (!k) return;
    if (wrongFirst && c.level > 0 && c.i === 0) { c.hit(k === 'B' ? 's' : 'B'); return; }
    c.hit(k);
  } else if (n === 'PotsLesson') {
    if (!c.hidePot || !c.hidePot.userData.tap.enabled) return;
    const o = c.pots.find(p => p !== c.hidePot);
    if (wrongFirst && o) { c.tapPot(o); return; }
    c.tapPot(c.hidePot);
  } else if (n === 'DressLesson') {
    if (c.phase === 'closed') { c.open(); return; }
    if (c.phase !== 'open' || !c.choices.length) return;
    const ok = (x) => x.userData.slot === c.slot && (!c.want || x.userData.name === c.want);
    const x = c.choices.find((x) => ok(x) !== wrongFirst); if (x) c.put(x);
  } else if (n === 'BricksLesson') {
    // every tap on any heap brick clicks it into the next slot; two taps a tick keeps the long letters moving
    for (let k = 0; k < 2 && c.placed + k < c.need; k++) { const b = c.bricks[0]; if (b) c.tapBrick(b); }
  } else if (n === 'WashLesson') {
    if (c.level === 2 && !c.wet) c.setWet(true);
    const s = c.dirty()[0]; if (s) c.scrub(s, 1);
  }
  } catch (e) { console.error('AUTOERR', n, e.stack); }
}, 1000);
'started'
