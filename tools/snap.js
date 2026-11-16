// Dev tool: launches the app in Electron, runs a script of steps, saves screenshots.
// usage: npx electron tools/snap.js <outdir> <stepsfile.json>
const { app, BrowserWindow, protocol, net } = require('electron');
const { pathToFileURL } = require('url');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
const path = require('path');
const fs = require('fs');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
if (process.env.UD) app.setPath('userData', process.env.UD);
const out = process.argv[2] || 'shots';
const steps = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
app.whenReady().then(async () => {
  const APP_DIR = process.env.APP_INDEX ? path.dirname(process.env.APP_INDEX) : path.join(__dirname, '..', 'app');
  protocol.handle('app', async (req) => {
    const f = path.join(APP_DIR, decodeURIComponent(new URL(req.url).pathname));
    try { return await net.fetch(pathToFileURL(f).toString()); } catch (e) { console.error('MISSING', f); return new Response('missing', { status: 404 }); }
  });
  fs.mkdirSync(out, { recursive: true });
  const win = new BrowserWindow({ width: 1280, height: 800, show: true, webPreferences: { backgroundThrottling: false } });
  const logs = [];
  win.webContents.on('console-message', (_e, level, msg, line, src) => logs.push(`[${level}] ${msg} (${src}:${line})`));
  await win.loadURL('app://local/index.html');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (const s of steps) {
    if (s.wait) await sleep(s.wait);
    if (s.js) { try { const r = await win.webContents.executeJavaScript(s.js); if (r !== undefined) logs.push('JS> ' + JSON.stringify(r)); } catch (e) { logs.push('JSERR ' + e.message); } }
    if (s.tap) {
      const [x, y] = s.tap;
      win.webContents.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 });
      await sleep(60);
      win.webContents.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 });
    }
    if (s.shot) { const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(out, s.shot + '.png'), img.toJPEG(70)); }
  }
  fs.writeFileSync(path.join(out, 'log.txt'), logs.join('\n'));
  app.quit();
});
