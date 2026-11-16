// App entry: boot, router between home and lessons, first-touch audio unlock.
import { setCamera } from './engine/stage.js';
import { input } from './engine/input.js';
import { cursor } from './engine/cursor.js';
cursor.init();
import { speech } from './engine/speech.js';
import { resumeAudio, setVolume, loadSamples, setMusicVolume } from './engine/audio.js';
import { store } from './engine/store.js';
import { fadeTo, setMode, setHomeHandler, setResetHandler, renderShelf } from './engine/ui.js';
import { Home } from './home.js';
import { loadCreatures } from './engine/creature.js';
import { physics } from './engine/physics.js';
import { Viewer } from './viewer.js';
import { META, worldIndex } from './lessons/meta.js';
import ColoursLesson from './lessons/colours.js';
import CountingLesson from './lessons/counting.js';
import ShapesLesson from './lessons/shapes.js';
import FeelingsLesson from './lessons/feelings.js';
import SizesLesson from './lessons/sizes.js';
import PatternsLesson from './lessons/patterns.js';
import WhereLesson from './lessons/where.js';
import MoreLesson from './lessons/more.js';
import BodyLesson from './lessons/body.js';
import WashLesson from './lessons/wash.js';
import MooLesson from './lessons/moo.js';
import GrowLesson from './lessons/grow.js';
import ShareLesson from './lessons/share.js';
import BandLesson from './lessons/band.js';
import PotsLesson from './lessons/pots.js';
import DressLesson from './lessons/dress.js';
import BricksLesson from './lessons/bricks.js';

const LESSONS = {
  colours: ColoursLesson, counting: CountingLesson, shapes: ShapesLesson, feelings: FeelingsLesson, sizes: SizesLesson,
  patterns: PatternsLesson, where: WhereLesson, more: MoreLesson, body: BodyLesson, wash: WashLesson,
  moo: MooLesson, grow: GrowLesson, share: ShareLesson, band: BandLesson, pots: PotsLesson, dress: DressLesson, bricks: BricksLesson,
};

let current = null;
let switching = false;
let currentName = null;
let lastPage = 0; // which world the home screen shows

export const router = {
  async go(name, opts = {}) {
    if (switching) return;
    switching = true;
    const slide = !!opts.from; // world-to-world swipes slide instead of fading
    if (!slide) await fadeTo(true);
    if (current) current.dispose();
    input.clear();
    input.unlock();
    setCamera();
    currentName = name;
    if (name === 'home') { if (opts.page !== undefined) lastPage = opts.page; opts = { ...opts, page: lastPage }; }
    else lastPage = worldIndex(name);
    if (name !== 'home' && name !== 'viewer' && !LESSONS[name]) { switching = false; return router.go('home'); }
    current = name === 'home' ? new Home(router, opts) : name === 'viewer' ? new Viewer(router, opts) : new LESSONS[name](router, META[name]);
    setMode(name);
    current.start().catch((e) => console.error(e));
    await new Promise((r) => setTimeout(r, 120));
    if (!slide) await fadeTo(false);
    switching = false;
  },
};

setHomeHandler(() => { if (currentName !== 'home') router.go('home'); });
setResetHandler(() => { if (currentName === 'home') router.go('home'); });

// Unlock audio + speech on the very first touch (needed in browsers; Electron allows autoplay anyway).
let unlocked = false;
window.addEventListener('pointerdown', () => {
  if (unlocked) return;
  unlocked = true;
  resumeAudio();
  speech.warm();
}, { capture: true });

(async function boot() {
  setVolume(store.get().settings.volume ?? 0.6);
  setMusicVolume(store.get().settings.music ?? 0.5);
  await speech.init();
  // sounds load in the background (synth versions play until they're ready); never block boot for long
  loadSamples();
  await Promise.race([Promise.all([loadCreatures(), physics.ready()]), new Promise((r) => setTimeout(r, 30000))]);
  document.getElementById('boot')?.remove();
  router.go('home');
})();

// Dev hook for automated testing in the browser.
window.__ll = { router, physics, get current() { return current; }, get switching() { return switching; } };
