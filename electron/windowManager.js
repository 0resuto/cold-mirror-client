import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WindowManager {
  constructor(store) {
    this.windows = new Map();
    this.store = store;
    this.setupIpc();
  }

  setupIpc() {
    ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        win.setIgnoreMouseEvents(ignore, options);
      }
    });

    // Handle generic window actions
    ipcMain.on('window-action', (event, { windowId, action, payload }) => {
      const win = this.windows.get(windowId);
      if (!win) return;

      switch (action) {
        case 'close':
          if (windowId.startsWith('overlay-')) {
            const id = windowId.replace('overlay-', '');
            this.toggleOverlay(id, false);
          } else {
            win.close();
          }
          break;
        case 'minimize':
          win.minimize();
          break;
        case 'move':
          win.setPosition(payload.x, payload.y);
          break;
        case 'resize':
          win.setSize(payload.width, payload.height);
          // Save new bounds to store
          if (windowId.startsWith('overlay-')) {
            const id = windowId.replace('overlay-', '');
            const overlays = this.store.get('overlays') || {};
            if (overlays[id]) {
              overlays[id].width = payload.width;
              overlays[id].height = payload.height;
              this.store.set('overlays', overlays);
            }
          }
          break;
      }
    });

    // Handle settings
    ipcMain.handle('get-settings', () => {
      return this.store.getAll();
    });

    ipcMain.on('update-overlay-setting', (event, { id, settings }) => {
      const overlays = this.store.get('overlays') || {};
      overlays[id] = { ...overlays[id], ...settings };
      this.store.set('overlays', overlays);
      
      // If clickThrough was changed and window is open, update it
      const win = this.windows.get(`overlay-${id}`);
      if (win && settings.clickThrough !== undefined) {
        win.setIgnoreMouseEvents(settings.clickThrough, { forward: true });
      }
      
      // Broadcast settings update to all windows so Dashboard updates UI
      this.broadcast('settings-updated', this.store.getAll());
    });

    ipcMain.on('toggle-overlay', (event, id, state) => {
      this.toggleOverlay(id, state);
    });
  }

  toggleOverlay(id, state) {
    const overlays = this.store.get('overlays') || {};
    if (!overlays[id]) overlays[id] = {};
    
    // Toggle state if undefined
    const newState = state !== undefined ? state : !overlays[id].enabled;
    overlays[id].enabled = newState;
    this.store.set('overlays', overlays);

    if (newState) {
      this.createOverlay(id, overlays[id]);
    } else {
      const win = this.windows.get(`overlay-${id}`);
      if (win && !win.isDestroyed()) {
        win.close();
      }
    }
    
    this.broadcast('settings-updated', this.store.getAll());
  }

  createWindow(id, options = {}, queryParams = {}) {
    if (this.windows.has(id)) {
      this.windows.get(id).focus();
      return this.windows.get(id);
    }

    const win = new BrowserWindow({
      ...options,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        nodeIntegration: false,
        contextIsolation: true,
        ...options.webPreferences,
      },
    });

    const queryString = new URLSearchParams(queryParams).toString();

    if (process.env.VITE_DEV_SERVER_URL) {
      win.loadURL(`${process.env.VITE_DEV_SERVER_URL}?${queryString}`);
    } else {
      win.loadFile(path.join(__dirname, '../dist/index.html'), { query: queryParams });
    }

    // Save bounds on move/resize native events
    win.on('resized', () => this.saveBounds(id, win));
    win.on('moved', () => this.saveBounds(id, win));

    win.on('closed', () => {
      this.windows.delete(id);
    });

    this.windows.set(id, win);
    return win;
  }
  
  saveBounds(id, win) {
    if (!id.startsWith('overlay-')) return;
    const overlayId = id.replace('overlay-', '');
    const bounds = win.getBounds();
    const overlays = this.store.get('overlays') || {};
    if (overlays[overlayId]) {
       overlays[overlayId].x = bounds.x;
       overlays[overlayId].y = bounds.y;
       overlays[overlayId].width = bounds.width;
       overlays[overlayId].height = bounds.height;
       this.store.set('overlays', overlays);
    }
  }

  createDashboard() {
    return this.createWindow('dashboard', {
      width: 900,
      height: 650,
      frame: false,
      transparent: true,
      hasShadow: false,
    }, { window: 'dashboard' });
  }

  createOverlay(overlayId, savedSettings = {}) {
    const minWidths = {
      'inputs': 300,
      'radar': 100,
      'trackmap': 400,
    };
    const minHeights = {
      'inputs': 120,
      'radar': 150,
      'trackmap': 80,
    };

    const win = this.createWindow(`overlay-${overlayId}`, {
      width: savedSettings.width || (overlayId === 'trackmap' ? 800 : 400),
      height: savedSettings.height || (overlayId === 'trackmap' ? 80 : 600),
      minWidth: minWidths[overlayId] || 150,
      minHeight: minHeights[overlayId] || 150,
      x: savedSettings.x,
      y: savedSettings.y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      hasShadow: false,
      skipTaskbar: true,
    }, { window: 'overlay', type: overlayId, id: `overlay-${overlayId}` });
    
    if (savedSettings.clickThrough) {
      win.setIgnoreMouseEvents(true, { forward: true });
    }
    
    return win;
  }

  getAllWindows() {
    return Array.from(this.windows.values());
  }

  broadcast(channel, data) {
    this.windows.forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    });
  }
}
