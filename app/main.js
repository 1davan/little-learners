const { app, BrowserWindow, globalShortcut, powerSaveBlocker, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// Serve the app from app://local/ so fetch() can load models and sounds (file:// can't be fetched).
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

// Let sound and the narrator's voice start without a prior click (toddlers won't click "enable sound").
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Only one copy of the app at a time.
if (!app.requestSingleInstanceLock()) app.quit();

let win = null;

function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#bfe8ff',
    title: 'Little Learners',
    webPreferences: { contextIsolation: true, nodeIntegration: false, spellcheck: false, backgroundThrottling: false },
  });
  win.setMenuBarVisibility(false);
  win.loadURL('app://local/index.html');
  // Block pinch-zoom inside the app.
  win.webContents.setVisualZoomLevelLimits(1, 1);
  // Never open new windows or navigate away.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  // Swallow keys a toddler might mash on a keyboard: reload, close tab, leave fullscreen, zoom, devtools.
  win.webContents.on('before-input-event', (e, input) => {
    const k = (input.key || '').toLowerCase();
    const mod = input.control || input.meta;
    if (k === 'f5' || k === 'f11' || k === 'f12' || k === 'escape') e.preventDefault();
    if (mod && ['r', 'w', '=', '+', '-', '0', 'i'].includes(k) && !input.shift) e.preventDefault();
    if (mod && input.shift && k === 'i') e.preventDefault();
  });
  win.on('leave-full-screen', () => win.setFullScreen(true));
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '');
    const file = path.normalize(path.join(__dirname, rel));
    if (!file.startsWith(__dirname)) return new Response('no', { status: 403 });
    return net.fetch(pathToFileURL(file).toString()).catch(() => new Response('missing', { status: 404 }));
  });
  createWindow();
  // Keep the screen awake while playing.
  powerSaveBlocker.start('prevent-display-sleep');
  // Parent escape hatch from the keyboard: Ctrl+Shift+Q (Cmd+Shift+Q on Mac) quits.
  globalShortcut.register('CommandOrControl+Shift+Q', () => app.quit());
});
app.on('second-instance', () => { if (win) { win.show(); win.focus(); } });
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
