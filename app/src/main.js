// App entry: boot, router between home and lessons, first-touch audio unlock.
import { setCamera } from './engine/stage.js';
import { input } from './engine/input.js';
import { cursor } from './engine/cursor.js';
cursor.init();
import { speech } from './engine/speech.js';
import { resumeAudio, setVolume } from './engine/audio.js';
import { store } from './engine/store.js';
import { fadeTo, setMode, setHomeHandler, setResetHandler, renderShelf } from './engine/ui.js';
import { Home } from './home.js';
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

const LESSONS = {
  colours: ColoursLesson, counting: CountingLesson, shapes: ShapesLesson, feelings: FeelingsLesson, sizes: SizesLesson,
  patterns: PatternsLesson, where: WhereLesson, more: MoreLesson, body: BodyLesson, wash: WashLesson,
  moo: MooLesson, grow: GrowLesson, share: ShareLesson, band: BandLesson, pots: PotsLesson,
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
    if (name !== 'home' && !LESSONS[name]) { switching = false; return router.go('home'); }
    current = name === 'home' ? new Home(router, opts) : new LESSONS[name](router, META[name]);
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
  await speech.init();
  document.getElementById('boot')?.remove();
  router.go('home');
})();

// Dev hook for automated testing in the browser.
window.__ll = { router, get current() { return current; }, get switching() { return switching; } };
