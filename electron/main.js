import { app, BrowserWindow } from 'electron';
import { WindowManager } from './windowManager.js';
import { TelemetryService } from './services/telemetry.js';
import { Store } from './services/store.js';

let windowManager;

app.whenReady().then(() => {
  const store = new Store({
    configName: 'user-preferences',
    defaults: {
      overlays: {
        standings: { enabled: false, x: 100, y: 100, width: 400, height: 600, clickThrough: false },
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

  const telemetry = new TelemetryService((channel, data) => {
    if (windowManager) {
      windowManager.broadcast(channel, data);
    }
  });
  telemetry.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createDashboard();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
