// Candy beats. Topics mt_2mb17lUCPD "Creating and shaping musical sound", mt_KTSoXcO7OL "Pitch" and
// mt_OTFABm2xdf "Rhythm in rhymes and songs" (plus mt_WXW0hjNhph "Patterns & sequences").
// A row of singing candies stands on a strawberry-cake stage. Every candy is one note, always the same colour for the
// same pitch, low to high from left to right: red jelly bean C, orange sweet D, yellow drop E, green gummy F,
// blue lollipop G, purple gumdrop A. Tapping one squishes it with a jelly wobble, it glows, opens its mouth and sings.
// Call and response: Pip plays a phrase (each candy lights up in time and its little twin pops onto the phrase track
// above, on a short or long sugar tile for short and long notes), then the child copies it. A right note fills its
// tile; a wrong one still sings, then the right candy gently plays its note again ("Listen again!").
// Each finished phrase ends with a little sparkle run up the candies and a sweet that flies into the jar (it stays
// there all game). Phrases come from a library of nursery-tune fragments and rhythm patterns (candy-tunes.js).
//   Level 1: two candies, then three; two- and three-note calls, slow.
//   Level 2: four candies; three to five notes with long and short notes (ta, ti-ti, ta-a).
//   Level 3: five candies, then the purple one joins; real tunes in two lines, and at the end of each round the child's
//            lines play back together as the whole song with a soft band.
// The music is the reward: no confetti, no boings; the world's background music is paused while the candies play.
import { voiceIdle } from '../engine/speech.js';
import * as T from '../three.js';
import { Lesson } from '../engine/lesson.js';
import { setFace, popIn, popOut, hop } from '../engine/actors.js';
import { input } from '../engine/input.js';
import { setMusic } from '../engine/audio.js';
import { fx } from '../engine/fx.js';
import { setCamera, camera, project } from '../engine/stage.js';
import { Ease } from '../engine/tween.js';
import { toonUnique } from '../engine/toon.js';
import { scProp } from '../engine/scenery.js';
import { disposeTree } from '../engine/toon.js';
import { prop } from './view-tools.js';
import { makePlan } from './candy-tunes.js';
import { note as playNote, flourish, clink, backing, now as audioNow, stopBacking } from './candy-sound.js';

const KINDS = ['prop_cd_bean', 'prop_cd_wrap', 'prop_cd_drop', 'prop_cd_gummy', 'prop_cd_lolly', 'prop_cd_grape'];
const LAYERS = [{}, { wrap: {} }, {}, {}, { stick: {}, base: {} }, {}];
const HEIGHT = [0.72, 0.86, 1.12, 0.86, 1.55, 0.86];        // model heights
const WIDTH = [1.2, 1.64, 1.04, 0.92, 1.1, 1.04];
const FOOT = [1.64, 1.71, 1.01, 0.92, 1.08, 1.02];
const DEPTH = [0.85, 0.77, 0.81, 0.67, 0.51, 1.02];       // measured model widths (outline included), for the row spacing
const COL = [0xff3d57, 0xff9420, 0xffd21f, 0x36c24c, 0x3f8cff, 0xa258ef];
const CSS = ['#ff3d57', '#ff9420', '#f5b800', '#2fb545', '#3f8cff', '#a258ef'];
const TOP = 0.61;                 // the stage's icing top
const ROW_Z = 0.62;               // where the candies stand
const CKS = [1.3, 1.3, 1.15];     // candy size per level (Level 3's row holds six)
const JAR = new T.Vector3(3.75, 2.865, -0.5), JK = 0.82;   // on the shelf at the music board's right end
const TILE_Y = 1.45;              // tiles are drawn taller than the model (the board has the room): bigger twins at L3
const TRACK_Y = 3.48, TRACK_Z = -0.98, TRACK_X = -0.85;   // on the music board between the canes
const PIP_AT = new T.Vector3(-3.75, 0, -2.45);
const BEAT = [0.78, 0.6, 0.5];
const LOOKS = [
  { body: 0xff8cbc, icing: 0xffbcd8 },   // strawberry
  { body: 0x5fcfae, icing: 0xc4f5e2 },   // mint
  { body: 0xa98cff, icing: 0xdccdff },   // blueberry
];
const SAY = { listen: 'Listen!', turn: 'Your turn!', again: 'Listen again!', thisOne: 'This one!', song: 'Now the whole song!', newCandy: 'A new candy!' };

function radialTex(inner) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const r = x.createRadialGradient(32, 32, 1, 32, 32, 32);
  r.addColorStop(0, inner); r.addColorStop(0.45, inner.replace(/[\d.]+\)$/, '0.45)')); r.addColorStop(1, inner.replace(/[\d.]+\)$/, '0)'));
  x.fillStyle = r; x.fillRect(0, 0, 64, 64);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  return t;
}
const rgba = (hex, a) => `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;

export default class CandyLesson extends Lesson {
  get totalRounds() { return this.plan ? this.plan.length : 6; }

  build() {
    this.voiceLines = false;
    this.plan = makePlan(this.level);
    this.beat = BEAT[this.level];
    this.ck = CKS[this.level];
    setMusic(null);                    // the candies are the music: pause the world's loop (home brings it back)
    this.offs.push(() => stopBacking());
    const look = LOOKS[this.level];
    const st = scProp('prop_cd_stage', { icing: { tint: look.icing }, sprinkles: { tint: 0xffffff }, canes: { tint: 0xffffff }, board: { tint: 0xffffff, ink: 0.02 }, frame: { tint: look.body } }, { tint: look.body, ink: 0.03 });
    if (st) this.root.add(st);
    // keep the backdrop calm: nothing of the room stands in front of the stage
    this.pip.position.copy(PIP_AT);
    this.pip.rotation.y = 0.3;
    this.pip.userData.noWalk = true;
    this.makeJar();
    this.candies = [];                 // by note index (made when first needed)
    this.row = [];                     // the note indices on stage now
    this.track = null;
    this.events = [];
    this.sweets = 0;
    this.phase = 'intro';
    this.cam = null;
    // long notes are press-and-hold: the note ends when the finger lifts (anywhere)
    const up = () => this.releaseHold();
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
    this.offs.push(() => { removeEventListener('pointerup', up); removeEventListener('pointercancel', up); });
    // "Look what you made!": the finale locks answers, so pokes on the candies and the jar are caught here
    this.offs.push(input.onAny((e) => { if (this.admiring && e && e.clientX !== undefined) this.pokeAtPokeable(e.clientX, e.clientY); }));
  }

  // ---------------- the scene ----------------
  makeJar() {
    const j = scProp('prop_cd_jar', { glass: { ink: 0 }, lid: false, shine: { ink: 0 } }, { ink: 0.02 });
    if (!j) return;
    const glass = j.userData.parts.glass;
    if (glass) {
      glass.material = toonUnique(0xd4ecff, { vertexColors: true, transparent: true, opacity: 0.42, depthWrite: false });
      glass.renderOrder = 3;
    }
    j.position.copy(JAR);
    j.scale.setScalar(JK);
    this.root.add(j);
    this.jar = j;
    // An open sweet jar (no lid layer): sweets drop straight in through its mouth, and nothing has to float aside.
  }

  makeCandy(i) {
    if (this.candies[i]) return this.candies[i];
    const w = prop(KINDS[i]);
    if (!w) return null;
    const u = w.userData, mu = u.model.userData;
    // a glow we can turn up: the candy's own colour, emissive
    if (mu.skin) { mu.skin.material = toonUnique(0xffffff, { vertexColors: true, emissive: COL[i], emissiveIntensity: 0 }); u.glowMat = mu.skin.material; }
    for (const [name, l] of Object.entries(u.layers)) if (/^shine/.test(name)) l.outline.visible = false;
    // a soft pool of coloured light on the icing under the candy
    const pad = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: radialTex(rgba(COL[i], 0.9)), transparent: true, depthWrite: false, opacity: 0, fog: false }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.012;
    pad.scale.setScalar(1.9);
    pad.renderOrder = 1;
    w.add(pad);
    Object.assign(u, { note: i, pad, glow: 0, h: HEIGHT[i] * this.ck, baseScale: this.ck });
    w.scale.setScalar(this.ck);
    w.visible = false;
    this.root.add(w);
    u.tap = input.addTap(w, { radius: 0.95, offset: new T.Vector3(0, HEIGHT[i] * this.ck * 0.5, 0.2), onTap: () => this.hit(i, { held: true }) });
    u.tap.enabled = false;
    this.candies[i] = w;
    return w;
  }

  spacing(n) { return n <= 2 ? 2.8 : n === 3 ? 2.5 : n === 4 ? 2.25 : n === 5 ? 1.98 : 1.72; }
  // Centres along the row: the outer centres keep the nominal span; the gaps between neighbours are equal and
  // measured from the real widths (the jelly bean and the wrapped sweet are wide), so no two candies ever touch.
  slotX(set, i) {
    const n = set.length, k = set.indexOf(i);
    if (n < 2) return 0;
    const w = set.map((j) => FOOT[j] * this.ck), span = this.spacing(n) * (n - 1);
    const inner = w.reduce((a, b) => a + b, 0) - w[0] / 2 - w[n - 1] / 2;
    const gap = Math.max(0.3, (span - inner) / (n - 1));
    let x = 0;
    for (let j = 1; j <= k; j++) x += w[j - 1] / 2 + gap + w[j] / 2;
    const total = inner + gap * (n - 1);
    return x - total / 2;
  }

  // camera: close on the candy row, wide enough for Pip and the jar at its ends
  viewFor(set) {
    const sp = this.spacing(set.length), rowW = sp * (set.length - 1) + 1.6;
    const W = Math.max(11.2, rowW + 2.4);   // the canes at the stage ends stay in the picture
    const aspect = camera.aspect || 1.6;
    const d = Math.max(8.6, W / (0.728 * aspect)) + 0.3;
    const el = 0.16;
    const look = new T.Vector3(0, 2.3, 0);
    return { look, pos: look.clone().add(new T.Vector3(0, Math.sin(el) * d, Math.cos(el) * d)) };
  }
  view(set, dur = 0.85) {
    const v = this.viewFor(set);
    if (!this.cam) { this.cam = { pos: v.pos.clone(), look: v.look.clone() }; setCamera(this.cam.pos, this.cam.look); return Promise.resolve(); }
    const p0 = this.cam.pos.clone(), l0 = this.cam.look.clone();
    return this.s.anim(dur, (e) => {
      this.cam.pos.lerpVectors(p0, v.pos, e); this.cam.look.lerpVectors(l0, v.look, e);
      setCamera(this.cam.pos, this.cam.look);
    }, Ease.inOut);
  }

  // Put this round's candies on the stage: new ones pop in singing their note (low to high), the others glide over.
  async setRow(set) {
    const same = set.length === this.row.length && set.every((x, k) => this.row[k] === x);
    if (same) return;
    const first = !this.row.length;
    const fresh = set.filter((i) => !this.row.includes(i));
    for (const i of this.row) if (!set.includes(i)) { const c = this.candies[i]; c.userData.tap.enabled = false; popOut(this.s, c, 0.25); }
    this.view(set);
    // the ones staying glide to their new spots with a little hop
    for (const i of set) if (this.row.includes(i)) {
      const c = this.candies[i], x0 = c.position.x, x1 = this.slotX(set, i);
      if (Math.abs(x1 - x0) > 0.01) this.s.anim(0.8, (e, p) => { c.position.x = x0 + (x1 - x0) * e; c.position.y = TOP + Math.sin(p * Math.PI) * 0.35; }, Ease.inOut).then(() => { c.position.y = TOP; });
    }
    this.row = set.slice();
    if (!first && fresh.length) { await this.wait(0.5); this.say(SAY.newCandy, { max: 1.2 }); }
    await this.wait(first ? 0.15 : 0.35);
    for (const i of fresh) {
      const c = this.makeCandy(i);
      if (!c) continue;
      c.position.set(this.slotX(set, i), TOP, ROW_Z);
      popIn(this.s, c, this.ck, 0.5, { sound: false });
      c.userData.tap.enabled = true;               // live at once (a tap now is a soft play-along)
      this.s.wait(0.18).then(() => this.sing(i, { soft: false, float: true }));
      await this.wait(first ? 0.32 : 0.6);
    }
    await this.wait(first ? 0.25 : 0.5);
  }

  // ---------------- a candy plays ----------------
  // sound + jelly wobble + glow + singing face + a floating note
  sing(i, { soft = false, float = true, long = false, mute = false } = {}) {
    const c = this.candies[i];
    if (!c) return;
    if (!mute) playNote(i, { soft, long });
    const u = c.userData, m = u.model;
    u.glow = 1;
    u.wob = (u.wob || 0) + 1;
    const id = u.wob, amp = soft ? 0.12 : 0.2;
    this.s.anim(0.75, (_, p) => {
      if (u.wob !== id) return;
      const k = 1 - amp * Math.exp(-5 * p) * Math.cos(p * 16);
      m.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
    }).then(() => { if (u.wob === id) m.scale.setScalar(1); });
    if (u.face) {
      setFace(u.face, 'joy');
      this.s.wait(long ? 0.75 : 0.42).then(() => { if (u.wob === id && !u.holding) setFace(u.face, 'happy'); });
    }
    if (float) fx.float(c.position.clone().add(new T.Vector3(0, u.h + 0.35, 0.3)), long ? '♩' : '♪', { color: CSS[i], size: soft ? 4 : 5 });
  }

  // a run of timed events on the audio clock (so phrases keep perfect time); resolves after the last one
  schedule(list) {
    const t0 = audioNow() + 0.12;
    return new Promise((res) => {
      const token = (this.schedTok = (this.schedTok || 0) + 1);
      list.forEach(({ at, fn }, k) => this.events.push({ t: t0 + at, fn, token, last: k === list.length - 1 ? res : null }));
      if (!list.length) res();
    });
  }
  cancelSchedule() { this.schedTok = (this.schedTok || 0) + 1; this.events = []; }

  // Pip plays a phrase: every candy lights and sings in time; its twin pops onto the track
  playPhrase(ph, { reveal = true } = {}) {
    const ev = [];
    let at = 0;
    ph.forEach((nt, k) => {
      ev.push({ at, fn: () => { this.sing(nt.n, { long: nt.d >= 1.5 }); this.pipPlays(nt.n); if (reveal) this.showTile(k); } });
      at += nt.d * this.beat;
    });
    ev.push({ at: Math.max(at, 0.6), fn: () => {} });
    return this.schedule(ev);
  }
  pipPlays(i) {
    const pip = this.pip, c = this.candies[i];
    if (!c) return;
    const want = Math.atan2(c.position.x - pip.position.x, c.position.z - pip.position.z) * 0.6;
    const r0 = pip.rotation.y;
    this.s.anim(0.25, (e) => { pip.rotation.y = r0 + (want - r0) * e; });
    const w = pip.userData.wings?.[pip.position.x < c.position.x ? 1 : 0];
    if (w) {
      const s = w === pip.userData.wings[1] ? 1 : -1, z0 = w.userData.z0 ?? (w.userData.z0 = w.rotation.z);
      this.s.anim(0.36, (_, p) => { w.rotation.z = z0 - s * Math.sin(p * Math.PI) * 0.8; }).then(() => { w.rotation.z = z0; });
    }
    hop(this.s, pip, 0.12, 0.3);
  }

  // ---------------- the phrase track (sugar tiles above the stage) ----------------
  makeTrack(ph) {
    this.dropTrack();
    const g = new T.Group();
    const items = ph.map((nt) => {
      const long = nt.d >= 1.5, w = long ? 1.3 : nt.d <= 0.5 ? 0.42 : 0.56;
      const tile = scProp(long ? 'prop_cd_pill2' : 'prop_cd_pill', {}, { ink: 0.016 });
      const mat = toonUnique(0xfff2f6, { vertexColors: true });
      if (tile) { tile.traverse((o) => { if (o.isMesh && !o.userData.outline) o.material = mat; }); if (!long && nt.d <= 0.5) tile.scale.x = 0.75; tile.scale.y = TILE_Y; }
      const it = new T.Group();
      if (tile) it.add(tile);
      const mini = scProp(KINDS[nt.n], { shine: { ink: 0 }, ...LAYERS[nt.n] }, { ink: 0.02 });
      const ms = (0.29 * TILE_Y / Math.max(HEIGHT[nt.n], FOOT[nt.n])) * (nt.d <= 0.5 ? 0.86 : 1);   // every twin the same size, inside its tile
      if (mini) {
        mini.scale.setScalar(ms);
        mini.position.set(0, -HEIGHT[nt.n] * ms * 0.5, 0.16);
        mini.visible = false;
        it.add(mini);
      }
      it.userData = { w, tile, mat, mini, ms, n: nt.n, state: 'wait', long };
      g.add(it);
      return it;
    });
    const gap = 0.1, total = items.reduce((s, it) => s + it.userData.w, 0) + gap * (items.length - 1);
    let x = -total / 2;
    for (const it of items) { it.position.x = x + it.userData.w / 2; x += it.userData.w + gap; }
    const k = Math.min(1.7, 6.6 / total);
    g.scale.setScalar(k);
    g.position.set(TRACK_X, TRACK_Y, TRACK_Z);
    g.userData.items = items;
    this.root.add(g);
    this.track = g;
    items.forEach((it, j) => { it.visible = false; this.s.wait(j * 0.06).then(() => popIn(this.s, it, 1, 0.35, { sound: false })); });
  }
  dropTrack() {
    const g = this.track;
    if (!g) return;
    this.track = null;
    popOut(this.s, g, 0.25).then(() => { this.root.remove(g); disposeTree(g); });
  }
  tileState(k, state) {
    const it = this.track?.userData.items[k];
    if (!it) return;
    const u = it.userData;
    u.state = state;
    const c = new T.Color(COL[u.n]);
    if (state === 'shown') u.mat.color.setHex(0xfff2f6);
    if (state === 'done') u.mat.color.copy(c.lerp(new T.Color(0xffffff), 0.45));
  }
  showTile(k) {
    const it = this.track?.userData.items[k];
    if (!it) return;
    const u = it.userData;
    if (u.mini && !u.mini.visible) popIn(this.s, u.mini, u.ms, 0.4, { sound: false });
    if (u.state === 'wait') this.tileState(k, 'shown');
  }
  // a long tile fills from left to right while its note is held (p: 0..1), in the colour the finished tile takes
  fillBar(k, p) {
    const it = this.track?.userData.items[k];
    if (!it) return;
    const u = it.userData, W = 1.14, H = 0.22 * TILE_Y, w = Math.max(0.002, W * Math.min(1, p)), r = Math.min(H / 2, w / 2);
    if (!u.bar) {
      u.bar = new T.Mesh(new T.BufferGeometry(), new T.MeshBasicMaterial({ color: new T.Color(COL[u.n]).lerp(new T.Color(0xffffff), 0.45), transparent: true, depthWrite: false }));
      u.bar.position.set(-W / 2, 0, 0.074);
      u.bar.renderOrder = 2;
      it.add(u.bar);
    }
    const sh = new T.Shape(), h = H / 2;
    sh.moveTo(r, -h); sh.lineTo(w - r, -h); sh.quadraticCurveTo(w, -h, w, -h + r); sh.lineTo(w, h - r); sh.quadraticCurveTo(w, h, w - r, h);
    sh.lineTo(r, h); sh.quadraticCurveTo(0, h, 0, h - r); sh.lineTo(0, -h + r); sh.quadraticCurveTo(0, -h, r, -h);
    u.bar.geometry.dispose();
    u.bar.geometry = new T.ShapeGeometry(sh, 4);
  }
  dropBar(u) { if (u.bar) { u.bar.parent?.remove(u.bar); u.bar.geometry.dispose(); u.bar.material.dispose(); u.bar = null; } }
  fillTile(k) {
    const it = this.track?.userData.items[k];
    if (!it) return;
    const u = it.userData;
    this.dropBar(u);
    if (u.mini && !u.mini.visible) popIn(this.s, u.mini, u.ms, 0.3, { sound: false });
    this.tileState(k, 'done');
    it.scale.setScalar(1);
    const y0 = it.position.y;
    this.s.anim(0.4, (_, p) => { it.position.y = y0 + Math.sin(p * Math.PI) * 0.22; }).then(() => { it.position.y = y0; });
  }

  // ---------------- rounds and phrases ----------------
  async startRound(r) {
    this.busy = true;
    this.goPending = false;            // no Go! while the candies pop in (it comes with "Your turn!")
    this.rd = this.plan[r];
    this.pi = 0;
    await this.setRow(this.rd.set);
    if (this.dead) return;
    this.startPhrase();
  }

  async startPhrase() {
    const ph = (this.ph = this.rd.phrases[this.pi]);
    this.i = 0;
    this.busy = true;
    this.phase = 'listen';
    this.goPending = false;            // Go! comes right after "Your turn!" (yourTurn), never while Pip plays
    // the candies stay live while Pip plays: a tap now is a soft play-along that doesn't count (rule 0: she can
    // always touch something)
    for (const c of this.rowCandies()) { c.userData.tap.enabled = true; c.userData.off = false; this.dim(c, false); }
    this.makeTrack(ph);
    await this.wait(this.firstPhraseDone ? 0.2 : 0.05);
    this.firstPhraseDone = true;
    await this.say(SAY.listen, { max: 0.9 });
    await Promise.race([voiceIdle(0.1), this.wait(1.3)]); // the tune waits for the narrator (but never long)
    await this.playPhrase(ph);
    if (this.dead) return;
    await this.wait(0.35);
    this.yourTurn();
  }

  yourTurn() {
    if (this.dead) return;
    this.phase = 'play';
    this.busy = false;
    this.idle = 0;
    this.lastHit = performance.now();
    for (const c of this.rowCandies()) c.userData.tap.enabled = !c.userData.off;
    this.goPending = true; this.goT0 = performance.now() - 400;   // the badge comes now; taps are open at once
    this.say(SAY.turn, { max: 0.6 });
    const pf = this.pip.userData.face;
    if (pf) setFace(pf, 'happy');
    if (!this.demoDone) { this.demoDone = true; this.s.wait(0.5).then(() => { if (this.phase === 'play' && !this.dead) this.playDemo(); }); }
    else this.maybeHoldDemo();
  }

  rowCandies() { return this.row.map((i) => this.candies[i]).filter(Boolean); }
  want() { return this.ph && this.ph[this.i] ? this.ph[this.i].n : null; }

  // the child taps a candy (held: a real finger is down, so a long note lasts until it lifts)
  hit(i, { held = false } = {}) {
    if (this.dead) return;
    if (this.phase === 'song') { this.jam(i); return; }
    // not her turn yet (Pip is playing, a replay, the sweet flying, between rounds): a soft play-along, not counted
    if (this.phase !== 'play' || this.replaying) { this.playAlong(i); return; }
    if (this.busy) return;
    const want = this.want();
    if (want === null) return;
    this.idle = 0;
    this.lastHit = performance.now();
    if (i === want) {
      const k = this.i, nt = this.ph[k];
      this.clearHints();
      fx.clearHands();
      if (nt.d >= 1.5) { this.startHold(i, k, nt, held); return; }
      this.sing(i);
      this.fillTile(k);
      this.advance(i);
      return;
    }
    // a wrong candy still sings (it's music!), then the right one gently plays its note: "This one!"
    this.sing(i, { soft: true });
    this.cur.wrong++;
    this.busy = true;
    input.lock(900);
    const it = this.track?.userData.items[this.i];
    if (it) { const x0 = it.position.x; this.s.anim(0.45, (_, p) => { it.position.x = x0 + Math.sin(p * Math.PI * 5) * 0.08 * (1 - p); }).then(() => { it.position.x = x0; }); }
    this.s.wait(0.5).then(() => {
      if (this.dead || this.phase !== 'play') return;
      this.say(SAY.thisOne, { max: 0.8 });
      this.sing(want, { long: this.ph[this.i].d >= 1.5 });
      this.pipPlays(want);
      const stop = fx.halo(this.candies[want], 1.2);
      this.stopHints.push(stop);
      this.s.wait(1.4).then(stop);
      this.busy = false;
      if (this.cur.wrong >= 2) this.errorless();
    });
  }
  // on to the next note of the phrase
  advance(i) {
    this.i++;
    if (this.i >= this.ph.length) { this.phraseDone(i); return; }
    // errorless: move the one playable candy on to the next note (otherwise she'd be stuck)
    if (this.errorlessOn) this.makeErrorless();
    this.maybeHoldDemo();
  }

  // ---------------- long notes: press and hold ----------------
  // The candy keeps singing with its mouth open and the tile fills while the finger stays down. Letting go early
  // still counts (never a fail): the candy finishes the note itself and the tile fills the rest of the way.
  startHold(i, k, nt, held) {
    this.busy = true;
    const u = this.candies[i].userData;
    u.holding = true;
    this.sing(i, { long: true });
    if (u.face) setFace(u.face, 'joy');
    this.hold = { i, k, t: 0, dur: Math.max(0.6, nt.d * this.beat), released: false, speed: 1 };
    this.fillBar(k, 0);
    if (!held) this.releaseHold();
  }
  releaseHold() {
    const h = this.hold;
    if (!h || h.released) return;
    h.released = true;
    h.speed = Math.max(1, (h.dur - h.t) / 0.4);
  }
  holdTick(dt) {
    const h = this.hold, u = this.candies[h.i].userData;
    if (!h.released) u.glow = 1;
    h.t += dt * (h.released ? h.speed : 1);
    this.fillBar(h.k, h.t / h.dur);
    if (h.t >= h.dur) this.endHold();
  }
  endHold() {
    const h = this.hold;
    this.hold = null;
    const u = this.candies[h.i].userData;
    u.holding = false;
    if (u.face) setFace(u.face, 'happy');
    this.fillTile(h.k);
    if (this.dead || this.phase !== 'play') return;
    this.busy = false;
    this.idle = 0;
    this.advance(h.i);
  }
  // the first long note of the game: a slow hand presses and holds on its candy
  maybeHoldDemo() {
    if (this.holdDemoDone || this.phase !== 'play') return;
    const nt = this.ph && this.ph[this.i];
    if (!nt || nt.d < 1.5) return;
    this.holdDemoDone = true;
    const k = this.i;
    this.s.wait(0.35).then(() => { if (this.phase === 'play' && !this.busy && this.i === k && !this.dead) this.showHint(false); });
  }

  async phraseDone(lastI) {
    this.phase = 'done';
    this.busy = true;
    this.clearHints();
    fx.clearHands();
    for (const c of this.rowCandies()) { c.userData.tap.enabled = true; this.dim(c, false); c.userData.off = false; }
    this.errorlessOn = false;
    const last = this.ph[this.ph.length - 1];   // (a held long note has already rung out in full)
    await this.wait(last.d >= 1.5 ? 0.45 : Math.max(0.5, last.d * this.beat));
    if (this.dead) return;
    // a sparkle run up the row, each candy bobbing as its note plays
    const run = this.row.slice();
    flourish(run);
    run.forEach((n, k) => this.s.wait(0.12 + k * 0.085).then(() => { this.sing(n, { soft: true, float: false, mute: true }); }));
    const pf = this.pip.userData.face;
    if (pf) { setFace(pf, 'joy'); this.s.wait(1.2).then(() => setFace(pf, 'happy')); }
    hop(this.s, this.pip, 0.35, 0.45);
    await this.wait(0.35 + run.length * 0.085);
    await this.sweetToJar(lastI);
    if (this.dead) return;
    this.pi++;
    if (this.pi < this.rd.phrases.length) { await this.wait(0.4); this.startPhrase(); return; }
    if (this.level === 2) await this.wholeSong();
    if (this.dead) return;
    this.roundDone();
  }

  // Where the next sweet settles in the jar: it drops straight down at the spot (on a few rings round the middle)
  // that lets it sit lowest, resting on the glass floor or on top of the sweets under it, never inside them.
  jarSpot(i, ms, lie) {
    const placed = (this.jarSweets = this.jarSweets || []);
    // footprint circle (any turn) and height; a lollipop lies on its side (stick across, swirl to the front)
    const r = 0.5 * (lie ? HEIGHT[i] : Math.max(FOOT[i], DEPTH[i])) * ms, h = (lie ? FOOT[i] : HEIGHT[i]) * ms;
    const floor = JAR.y + 0.08 * JK, wall = 0.54 * JK;   // the glass narrows to 0.58 at its foot
    let best = null;
    for (let x = -wall; x <= wall; x += 0.03) for (let z = -wall; z <= wall; z += 0.03) {
      const rr = Math.hypot(x, z);
      if (rr + r > wall) continue;
      let y = floor;
      for (const o of placed) if (Math.hypot(o.x - x, o.z - z) < o.r + r) y = Math.max(y, o.y + o.h);
      const score = y - rr * 0.02;                     // lowest first; on a tie, out toward the glass
      if (!best || score < best.score - 1e-9) best = { x, z, y, score };
    }
    const top = placed.reduce((m, o) => Math.max(m, o.y + o.h), floor);
    placed.push({ x: best.x, z: best.z, y: best.y, r, h });
    return { end: new T.Vector3(JAR.x + best.x, best.y, JAR.z + best.z), top };
  }
  // a little twin of the candy flies up into the sweet jar and stays there
  async sweetToJar(i) {
    if (!this.jar) return;
    const k = this.sweets++;
    const s = scProp(KINDS[i], { shine: { ink: 0 }, ...LAYERS[i] }, { ink: 0.02 });
    if (!s) return;
    const ms = 0.2 * 1.25 / Math.max(1, WIDTH[i]);     // small enough that ten always fit below the neck
    const lie = i === 4 ? (k % 2 ? 1 : -1) : 0;          // lollipops lie down in the jar (never stand on each other)
    const { end: spot, top } = this.jarSpot(i, ms, lie);
    // the model's origin is the stick's foot: shift it so the lying lollipop's middle sits on the spot
    const off = lie ? new T.Vector3(lie * 0.5 * HEIGHT[i] * ms, 0.5 * FOOT[i] * ms, 0) : new T.Vector3();
    const end = spot.clone().add(off);
    const c = this.candies[i];
    const start = c.position.clone().add(new T.Vector3(0, c.userData.h * 0.6, 0));
    const over = new T.Vector3(JAR.x, JAR.y + 2.3 * JK, JAR.z).add(off);
    s.position.copy(start);
    s.scale.setScalar(ms);
    s.rotation.y = lie ? 0 : (k * 1.7) % (Math.PI * 2) - 0.6;
    this.root.add(s);
    const mid = start.clone().lerp(over, 0.5); mid.y = Math.max(start.y, over.y) + 0.9;
    await this.s.anim(0.75, (e) => {
      const q = 1 - e;
      s.position.set(q * q * start.x + 2 * q * e * mid.x + e * e * over.x, q * q * start.y + 2 * q * e * mid.y + e * e * over.y, q * q * start.z + 2 * q * e * mid.z + e * e * over.z);
      s.rotation.z = lie ? lie * e * Math.PI / 2 : Math.sin(e * Math.PI) * 0.6;
    }, Ease.inOut);
    // down through the open mouth in the middle, over to its spot inside the jar (above the pile), then straight down
    const neck = new T.Vector3(JAR.x, JAR.y + 1.18 * JK, JAR.z).add(off), above = new T.Vector3(end.x, Math.min(JAR.y + 1.12 * JK, Math.max(spot.y, top + 0.02)) + off.y, end.z);
    const legs = [[over, neck], [neck, above], [above, end]], lens = legs.map(([p, q]) => p.distanceTo(q)), tot = lens.reduce((a, b) => a + b, 0) || 1;
    await this.s.anim(0.42, (e) => {
      let d = e * tot, j = 0;
      while (j < 2 && d > lens[j]) { d -= lens[j]; j++; }
      s.position.lerpVectors(legs[j][0], legs[j][1], lens[j] ? Math.min(1, d / lens[j]) : 1);
      if (!lie) s.rotation.z *= 0.85;
    }, Ease.in);
    s.position.copy(end);
    s.rotation.z = lie ? lie * Math.PI / 2 : 0;
    clink();
    if (!lie) this.s.anim(0.3, (_, p) => { const q = 1 - 0.25 * Math.sin(p * Math.PI) * (1 - p); s.scale.set(ms / Math.sqrt(q), ms * q, ms / Math.sqrt(q)); }).then(() => s.scale.setScalar(ms));
    await this.wait(0.3);
  }

  // Level 3: the child's lines play back together as the whole song, with a soft band
  async wholeSong() {
    this.dropTrack();
    await this.wait(0.3);
    await this.say(SAY.song, { max: 1.3 });
    this.say(this.rd.name + '!', { voice: false });
    const notes = this.rd.full.flatMap((p) => this.rd.phrases[p]);
    const beat = this.beat * 1.05;
    const mel = [];
    let at = 0;
    for (const nt of notes) { mel.push({ n: nt.n, at, dur: nt.d * beat }); at += nt.d * beat; }
    backing(mel, beat, { at: 0.12 });
    // she can play along: every candy is live, the one that comes next glows half a beat early, and there is
    // no wrong note (any tap sings softly in key with a sparkle)
    this.phase = 'song';
    for (const c of this.rowCandies()) { c.userData.off = false; this.dim(c, false); c.userData.tap.enabled = true; }
    const ev = [];
    for (const m of mel) {
      ev.push({ at: Math.max(0, m.at - beat * 0.5), fn: () => this.preGlow(m.n, beat * 0.5) });
      ev.push({ at: m.at, fn: () => { this.sing(m.n, { long: m.dur >= 1.5 * beat }); this.pipBob(); } });
    }
    ev.sort((a, b) => a.at - b.at);
    ev.push({ at: at + beat * 1.2, fn: () => {} });
    await this.schedule(ev);
    if (this.phase === 'song') this.phase = 'done';
  }
  preGlow(n, sec) { const u = this.candies[n]?.userData; if (u) u.preUntil = performance.now() + sec * 1000; }
  // a tap while it isn't her turn: the candy sings softly (it's music); nothing is counted
  playAlong(i) {
    const c = this.candies[i];
    if (!c || !c.visible || this.hold) return;
    this.sing(i, { soft: true, float: false });
  }
  // a play-along tap during the whole song
  jam(i) {
    const c = this.candies[i];
    if (!c) return;
    this.sing(i, { soft: true, float: false });
    const p = project(c.position.clone().add(new T.Vector3(0, c.userData.h * 0.75, 0.2)));
    fx.sparkle(p.x, p.y);
  }
  pipBob() {
    const pip = this.pip, r0 = 0.3;
    hop(this.s, pip, 0.18, 0.32);
    this.s.anim(0.3, (e) => { pip.rotation.y = pip.rotation.y + (r0 - pip.rotation.y) * e; });
  }

  // the round is done: no confetti or fanfare, the music was the reward; a caption names the tune
  roundDone() {
    this.records.push({ firstTry: this.cur.wrong === 0 && this.cur.hints === 0, wrong: this.cur.wrong, hints: this.cur.hints, ms: performance.now() - this.cur.t0 });
    this.round++;
    if (this.level < 2) this.say(this.rd.name, { voice: false });
    this.phase = 'between';
    this.wait(1.2).then(() => { if (!this.dead) this.nextRound(); });
  }

  // ---------------- hints ----------------
  // the ladder (6 s, 12 s without a touch) replays the phrase; the child's filled tiles stay filled
  async prompt(opts = {}) {
    if (this.phase !== 'play' || this.busy || this.replaying) return;
    // stuck ~8 s (the ladder's second step): no replay; the next candy sings its note while the engine's hop,
    // halo and hand show it (a replay would switch the candies off under the hand)
    if (opts.repeat) {
      const w = this.want();
      if (w !== null) { this.sing(w, { soft: true, long: this.ph[this.i].d >= 1.5 }); this.pipPlays(w); }
      return;
    }
    this.replaying = true;
    this.busy = true;
    await this.say(SAY.again, { max: 0.8 });
    await this.playPhrase(this.ph, { reveal: false });
    if (this.dead) return;
    this.replaying = false;
    this.busy = false;
    this.idle = 0;
    for (const c of this.rowCandies()) c.userData.tap.enabled = !c.userData.off;
  }
  hint() { this.prompt(); }
  nudgeTarget() { const w = this.want(); return this.phase === 'play' && w !== null ? this.candies[w] : null; }
  showHint(glow = true) {
    const w = this.want();
    const c = w !== null ? this.candies[w] : null;
    if (!c) return;
    if (glow) this.addHalo(c, 1.2);
    const p = c.position.clone().add(new T.Vector3(0, c.userData.h * 0.5, 0.3));
    // a long note: the hand presses and holds (about 1.2 s) instead of tapping
    if (this.ph[this.i].d >= 1.5) { this.holdDemoDone = true; fx.ghostPath([p, p.clone()], { mode: 'drag', maxDur: 2.2 }); }
    else fx.ghostPath([p], { mode: 'tap' });
  }
  demoL3() { this.showHint(false); }
  choicePoints() { return this.rowCandies().map((c) => c.position.clone().add(new T.Vector3(0, c.userData.h * 0.5, 0.3))); }
  // after two wrong notes: only the candy that comes next can be played (the others go quiet and pale)
  makeErrorless() {
    const w = this.want();
    for (const c of this.rowCandies()) {
      c.userData.off = c.userData.note !== w;
      c.userData.tap.enabled = !c.userData.off;
      this.dim(c, c.userData.off);
    }
  }
  // a candy that can't be played right now goes pale (washed out toward white, never darker or muddy)
  dim(c, on) {
    const u = c.userData, m = u.glowMat;
    u.dimmed = on;
    if (!m) return;
    m.color.setHex(on ? 0xe4dee6 : 0xffffff);
    m.emissive.setHex(on ? 0xffffff : COL[u.note]);
  }

  update(dt, t) {
    // timed events (phrases) on the audio clock
    if (this.events.length) {
      const nowT = audioNow();
      const due = this.events.filter((e) => e.t <= nowT);
      if (due.length) {
        this.events = this.events.filter((e) => e.t > nowT);
        for (const e of due) { if (e.token !== this.schedTok) continue; e.fn(); if (e.last) e.last(); }
      }
    }
    // glow fades after each note
    for (const c of this.candies) {
      if (!c) continue;
      const u = c.userData;
      u.glow = Math.max(0, u.glow - dt * 1.6);
      if (u.preUntil && performance.now() < u.preUntil) u.glow = Math.max(u.glow, 0.5);   // play-along: next up
      const g = u.glow * u.glow * (3 - 2 * u.glow);
      if (u.glowMat) u.glowMat.emissiveIntensity = u.dimmed ? 0.5 : g * 0.55;
      u.pad.material.opacity = g * 0.85;
    }
    // the next tile breathes on the child's turn
    if (this.track && this.phase === 'play') {
      this.track.userData.items.forEach((it, k) => it.scale.setScalar(k === this.i && !this.busy ? 1 + Math.max(0, Math.sin(t * 3)) * 0.12 : 1));
    }
    // a held long note (press and hold)
    if (this.hold) this.holdTick(dt);
    // (stuck: the engine's ladder replays the phrase at 5 s and shows the hand on the next candy at 8 s; every touch
    // restarts it, so the hand comes back for each new note)
  }

  // "Look what you made!": the candy row and the jar of sweets; a poke on a candy plays it, on the jar it clinks
  creationView() { return this.row.length ? this.viewFor(this.row) : null; }
  creationObjects() { return [...this.rowCandies(), this.jar].filter(Boolean); }
  async admire() {
    this.admiring = true;
    try { await super.admire(); } finally { this.admiring = false; }
  }
  onAdmirePoke(obj) {
    const t = performance.now();
    if (this.lastPoke && this.lastPoke.obj === obj && t - this.lastPoke.t < 150) return;   // one poke, one sound
    this.lastPoke = { obj, t };
    if (obj === this.jar) {
      clink();
      input.press(this.jar, 140);   // the jar gives a little squash with its clink
      return;
    }
    if (obj.userData && obj.userData.note !== undefined) this.sing(obj.userData.note, { soft: true });
  }

  // the whole stage plays one last happy run while the sticker comes
  onFinale() {
    // Level 3 cleared the board for the whole song: put her last line back up, every tile filled, for the photo
    if (!this.track && this.ph) {
      this.makeTrack(this.ph);
      this.ph.forEach((_, k) => this.s.wait(0.45 + k * 0.06).then(() => { if (!this.dead) this.fillTile(k); }));
    }
    const run = this.row.slice();
    flourish(run, { at: 0.3 });
    run.forEach((n, k) => this.s.wait(0.42 + k * 0.085).then(() => this.sing(n, { soft: true, mute: true })));
  }
  // the next lesson / home resumes the world music
  dispose() { this.cancelSchedule(); super.dispose(); }
}
