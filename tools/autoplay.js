window.addEventListener('error', e => console.error('UNCAUGHT', e.message, e.filename, e.lineno));
window.addEventListener('unhandledrejection', e => console.error('REJECT', e.reason && (e.reason.stack || e.reason)));
const origErr = console.error; 
window.__seq = ['colours','counting','shapes','feelings','sizes','patterns','where','more','body','moo','share','band','pots','story','dress','myday','snack','cook','candy','bricks','blocks','sink','balance','roll','puzzles','letters','words','paint']; window.__i = 0; window.__done = [];
const BODYA = {nose:'nose',eyes:'eyeL',ears:'earL',mouth:'mouth',tummy:'tummy',hands:'handL',feet:'footL'};
window.__auto = setInterval(() => {
  const c = __ll.current; if (!c || c.dead) return;
  const n = c.constructor.name;
  if (n === 'Home' || n === 'WorldMap') { if (!__ll.switching && performance.now() - (window.__t || 0) > 3000) { window.__t = performance.now(); if (__i < __seq.length) __ll.router.go(__seq[__i++]); } return; }
  if (n === 'MooLesson' && c.feedTap && c.treat && c.treat.userData.feedable && !c.treat.userData.dragging) { c.feedTap(); return; }
  // Block builder: the finished build is hers to knock down (every other round; the others are left standing)
  if (n === 'BlocksLesson' && c.phase === 'admire' && c.round % 2 === 1 && c.knock) { c.knock(); return; }
  // Meadow: her action inside a round's ending (counting: tap the friend; feelings: comfort Pip) — c.endStep()
  if (c.endStep && c.endWaiting) { c.endStep(); return; }
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
    if (c.stage === 'train' && c.arrived === false) return;   // like a child: answers once the train has stopped
    const x = c.choices.find(x => (x.userData.kind === c.answer()) !== wrongFirst); if (x) c.pick(x);
  } else if (n === 'WhereLesson') {
    if (!c.drag) return;
    const zs = c.zones(); const right = zs.find(z => z.id === c.target());
    if (wrongFirst && zs.length > 1) { const w = zs.find(z => z.prop !== (c.target()==='in'?'bucket':'stool')); if (w) { c.drop(w, {tapped:false}); return; } }
    c.drop(right, { tapped: false });
  } else if (n === 'MoreLesson') {
    // choose (round 1 tries the wrong holder first), then feed the friend one snack a tick
    if (c.phase === 'feed') { c.feedNext(); return; }
    if (c.phase === 'choose') c.pick(wrongFirst ? 1 - c.rightSide() : c.rightSide());
  } else if (n === 'BodyLesson') {
    if (wrongFirst) { c.touch(c.part === 'tummy' ? 'feet' : 'tummy', c.part === 'tummy' ? 'footL' : 'tummy'); return; }
    c.touch(c.part, BODYA[c.part]);
  } else if (n === 'MooLesson') {
    const a = c.animals.find(a => (a.userData.kind === c.target) !== wrongFirst); if (a) c.tapAnimal(a);
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
  } else if (n === 'StoryLesson') {
    if (c.phase === 'tell' && c.tellNext) { c.tapPlaced(c.tellNext); return; } // she tells the finished story, card by card
    if (c.phase !== 'pick' || !c.cards.length) return;
    const right = c.cards.find(x => x.userData.step === c.want());
    if (wrongFirst) { const w = c.cards.find(x => x !== right); if (w) { c.choose(w); return; } }
    if (right) c.choose(right);
  } else if (n === 'MydayLesson') {
    // one step at a time; on the first round (Level 3: the child chooses) try a wrong thing first
    if (c.phase !== 'step') return;
    const k = c.want();
    if (wrongFirst && c.level === 2) { const w = c.items.find(x => x !== k && ['soap', 'towel', 'cup', 'brush'].includes(x)); if (w) { c.act(w); return; } }
    c.act(k);
  } else if (n === 'SnackLesson') {
    // wash hands: do the current step (tap / soap / rub / rinse / dry); on the first round try the tap too early
    if (c.phase === 'wash') { if (wrongFirst && c.step === 'soap') { c.wash('rinse'); return; } c.wash(c.step); return; }
    if (c.phase !== 'plate') return;
    const left = c.foods.filter(f => !f.userData.placed && !f.userData.busy);
    // on the first plate a second food of a group already on the plate is gently refused
    const bad = left.find(f => !c.fits(f) && f.userData.where !== 'fridge');
    if (c.round === 1 && c.cur.wrong === 0 && c.onPlate.length && bad) { c.put(bad); return; }
    const f = c.bestFood(); if (!f) return;
    if (f.userData.where === 'fridge' && !c.fridgeOpen) { c.openFridge(); return; }
    if (c.needsWash(f)) { c.rinseFood(f); return; }
    c.put(f);
  } else if (n === 'CookLesson') {
    // one step a tick: pick a veggie (round 1 tries a wrong one first where the level asks for one), take the
    // knife, chop a dozen times, scoop it into the pot, turn the stove on, stir, serve
    if (c.phase === 'pick') { const v = (wrongFirst && c.wrongVeg()) || c.wantVeg(); if (v) c.pickVeg(v); }
    else if (c.phase === 'knife') c.takeKnife();
    else if (c.phase === 'chop') { if (c.chops < 12) c.chopAuto(3); else c.finishChop(); }
    else if (c.phase === 'scoop' || c.phase === 'carry') c.scoopToPot();
    else if (c.phase === 'knob') c.turnKnob();
    else if (c.phase === 'stir') c.stirAuto();
    else if (c.phase === 'serve') c.serve();
  } else if (n === 'CandyLesson') {
    // one note a tick on the child's turn; round 1 plays a wrong candy first (it sings, then the right one is shown)
    if (c.phase !== 'play') return;
    const k = c.want(); if (k === null) return;
    if (wrongFirst && c.i === 0) { const w = c.row.find(x => x !== k); if (w !== undefined) { c.hit(w); return; } }
    c.hit(k);
  } else if (n === 'DressLesson') {
    if (c.phase === 'closed') { c.open(); return; }
    if (c.phase !== 'open' || !c.choices.length) return;
    // one garment per round; Level 3 wants the right body part, so try a wrong part first there
    const x = c.choices[0];
    if (wrongFirst && c.parts) { c.put(x, c.wrongPart()); return; }
    c.put(x);
  } else if (n === 'SinkLesson') {
    // guess (a wrong guess is a prediction, not a mistake), drop it in, then sort it (wrong tub first on round 1)
    const it = c.item, f = it && it.userData.floats;
    if (c.phase === 'guess') c.guess(wrongFirst ? !f : f);
    else if (c.phase === 'drop') c.dropIn();
    else if (c.phase === 'sort') c.sort(wrongFirst ? !f : f);
    else if (c.phase === 'pick') { const x = c.choices.find(x => !!x.userData.right !== wrongFirst); if (x) c.pick(x); }
  } else if (n === 'BlocksLesson') {
    // roll rounds: tap a block that stays first, then the one that rolls; stack rounds: the ball first (it rolls off);
    // builds: one block a tick onto an open ghost of its shape (round 1: the spare/wrong shape first where there is one)
    const tryWrong = c.cur && c.cur.wrong === 0 && (c.round === 0 || c.kind !== 'build');
    if (c.kind === 'roll') { const x = c.choices.find(b => b.userData.state === 'ramp' && (b.userData.shape === c.answer) !== tryWrong) || c.choices.find(b => b.userData.state === 'ramp' && b.userData.shape === c.answer); if (x) c.tapChoice(x); return; }
    const zs = c.zones().filter(z => z.open), bs = c.blocks;
    if (!zs.length || !bs.length) return;
    if (c.kind === 'stack') { const b = bs.find(b => (b.userData.shape === c.answer) !== tryWrong) || bs.find(b => b.userData.shape === c.answer); if (b) c.drop(b, zs[0]); return; }
    if (tryWrong) { for (const z of zs) { const b = bs.find(b => b.userData.shape !== z.shape); if (b) { c.drop(b, z); return; } } }
    for (const z of zs) { const b = bs.find(b => b.userData.shape === z.shape); if (b) { c.drop(b, z); return; } }
  } else if (n === 'RollLesson') {
    // whenever the hoglet waits, do the piece that helps (a tap, a press, or a push to where it goes)
    if (c.push || c.demoing) return;
    const p = c.nextPiece(); if (p) c.doPiece(p);
  } else if (n === 'BalanceLesson') {
    // pour tasks pour the target to its goal level; tap tasks try the other pail first on the first round
    if (c.phase !== 'play') return;
    if (c.task === 'fill' || c.task === 'balance') { c.pourInto(c.target(), c.goal()); return; }
    const right = c.target(), wrong = c.pails.find(p => p !== right);
    if (wrongFirst && wrong) { c.tapPail(wrong); return; }
    if (right) c.tapPail(right);
  } else if (n === 'PuzzlesLesson') {
    // one step a tick: want() is the current step; a fit drops the piece on the right hole (on the first puzzle that
    // offers a lure, and on "which hole?", the lure first); other steps act() on their object the tap-fallback way
    if (c.phase !== 'step' || c.animN > 0) return;
    const w = c.want(); if (!w) return;
    if (w.kind !== 'fit') { c.act(w.obj); return; }
    const zs = c.zones(), right = zs.find(z => z.right), bad = zs.find(z => !z.right && z.hole.userData.open && !z.h.lid && !z.h.plug);
    if (bad && c.cur.wrong === 0 && (c.round === 0 || c.round === 3)) { c.drop(bad, { tapped: false }); return; }
    if (right) c.drop(right, { tapped: false });
  } else if (n === 'PaintLesson') {
    // one step at a time, as a child would: act(want()). Level 2 round 1 dips the wrong pot first (one stroke, the redirect)
    if (c.auto || c.demoing || c.toolBusy || c.phase === 'busy') return;
    const k = c.want(); if (!k) return;
    if (c.level === 1 && c.round === 0 && !c.redirected && c.phase === 'dip') { const w = c.pots.find(p => p.obj.visible && p.open && p.key !== k); if (w) { c.act(w.key); return; } }
    c.act(k);
  } else if (n === 'BricksLesson') {
    // every tap on any heap brick clicks it into the next slot; two taps a tick keeps the long letters moving
    for (let k = 0; k < 2 && c.placed + k < c.need; k++) { const b = c.bricks[0]; if (b) c.tapBrick(b); }
  } else if (n === 'LettersLesson') {
    // one step a tick (open the box, pack each thing, sort, find, choose); the first round
    // of Levels 2 and 3 tries a wrong carriage / friend / thing first
    c.autoStep(wrongFirst);
  } else if (n === 'WordsLesson') {
    // meet: tap each thing in turn; find: round 1 taps a wrong thing first (it says its own name), then the right
    // one; sort: the first toy tries a wrong home first; book: one photo a tick
    if (c.phase === 'meet') c.meetAll();
    else if (c.phase === 'find') { if (wrongFirst) c.findWrong(); else c.findRight(); }
    else if (c.phase === 'sort') { if (c.cur && c.cur.wrong === 0 && c.round === c.plan.finds.length) c.sortWrong(); else c.sortRight(); }
    else if (c.phase === 'book') c.bookAll();
  }
  } catch (e) { console.error('AUTOERR', n, e.stack); }
}, 1000);
'started'
