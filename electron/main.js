import { app, BrowserWindow, session } from 'electron';
import { WindowManager } from './windowManager.js';
import { TelemetryService } from './services/telemetry.js';
import { Store } from './services/store.js';

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let windowManager;
let telemetry;
let store;

app.setName('Cold Mirror');

app.whenReady().then(() => {
  // Content Security Policy
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const cspDirectives = [
    "default-src 'self'",
    devServerUrl
      ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${new URL(devServerUrl).origin}`
      : "script-src 'self'",
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'" + (devServerUrl ? ` ${new URL(devServerUrl).origin} ws:` : ''),
  ].join('; ');

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspDirectives],
      },
    });
  });

  store = new Store({
    configName: 'user-preferences',
    defaults: {
      overlays: {
        standings: { 
          enabled: false, 
          x: 100, y: 100, width: 400, height: 600, clickThrough: false,
          columns: { pos: true, num: true, driver: true, carName: false, carClass: true, classPos: true, srating: true, irating: true, gap: true, bestLap: false, lastLap: true, trackPct: false, laps: false }
        },
        relative: { enabled: false, x: 500, y: 100, width: 400, height: 600, clickThrough: false },
        fuel: { enabled: false, x: 100, y: 750, width: 250, height: 150, clickThrough: false },
        inputs: { enabled: false, x: 400, y: 750, width: 300, height: 150, clickThrough: false },
      }
    }
  });

  windowManager = new WindowManager(store);
  
  // Create the main dashboard window
  windowManager.createDashboard();

  // Restore any active overlays
  const overlays = store.get('overlays') || {};
  Object.keys(overlays).forEach(id => {
    if (overlays[id].enabled) {
      windowManager.createOverlay(id, overlays[id]);
    }
  });

  telemetry = new TelemetryService((channel, data) => {
    if (windowManager) {
      windowManager.broadcast(channel, data, true); // send only to overlays
    }
  });
  telemetry.start();
});

app.on('before-quit', async () => {
  if (telemetry) telemetry.stop();
  if (store) await store.flush();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
