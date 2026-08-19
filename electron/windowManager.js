import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { widgetRegistry } from '../src/core/widgets/index.js';
import log from 'electron-log/main.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WindowManager {
  constructor(store) {
    this.windows = new Map();
    this.store = store;
    this.boundsTimeout = new Map();
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
      const senderWin = BrowserWindow.fromWebContents(event.sender);
      let senderId = null;
      for (const [id, w] of this.windows.entries()) {
        if (w === senderWin) {
          senderId = id;
          break;
        }
      }

      if (senderId !== 'dashboard' && senderId !== windowId) {
        log.warn(`Unauthorized window action: ${senderId} attempting to control ${windowId}`);
        return;
      }

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
        case 'maximize':
          if (win.isMaximized()) {
            win.unmaximize();
          } else {
            win.maximize();
          }
          break;
        case 'move':
          win.setPosition(payload.x, payload.y);
          break;
        case 'resize':
          win.setSize(payload.width, payload.height);
          this.saveBounds(windowId, win);
          break;
      }
    });

    // Handle settings
    ipcMain.handle('get-settings', () => {
      return this.store.getAll();
    });

    ipcMain.on('update-overlay-setting', (event, { id, settings, senderId }) => {
      const overlays = this.store.get('overlays') || {};
      overlays[id] = { ...overlays[id], ...settings };
      this.store.set('overlays', overlays);
      
      // If clickThrough was changed and window is open, update it
      const win = this.windows.get(`overlay-${id}`);
      if (win && settings.clickThrough !== undefined) {
        win.setIgnoreMouseEvents(Boolean(settings.clickThrough));
      }
      
      // Broadcast settings update to all windows so Dashboard updates UI
      this.broadcast('settings-updated', this.store.getAll(), false, senderId);
    });

    ipcMain.on('toggle-overlay', (event, id, state, senderId) => {
      this.toggleOverlay(id, state, senderId);
    });
  }

  toggleOverlay(id, state, senderId = null) {
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
    
    this.broadcast('settings-updated', this.store.getAll(), false, senderId);
  }

  createWindow(id, options = {}, queryParams = {}) {
    if (this.windows.has(id)) {
      this.windows.get(id).focus();
      return this.windows.get(id);
    }

    const iconPath = path.join(__dirname, process.env.VITE_DEV_SERVER_URL ? '../public/app_icon.ico' : '../dist/app_icon.ico');

    const win = new BrowserWindow({
      ...options,
      icon: iconPath,
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
    win.on('maximize', () => win.webContents.send('maximize-state', true));
    win.on('unmaximize', () => win.webContents.send('maximize-state', false));

    win.on('closed', () => {
      this.windows.delete(id);
    });

    this.windows.set(id, win);
    return win;
  }
  
  saveBounds(id, win) {
    if (!id.startsWith('overlay-')) return;
    
    if (this.boundsTimeout.has(id)) {
      clearTimeout(this.boundsTimeout.get(id));
    }
    
    this.boundsTimeout.set(id, setTimeout(() => {
      if (win.isDestroyed()) return;
      
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
    }, 300));
  }

  createDashboard() {
    const win = this.createWindow('dashboard', {
      width: 900,
      height: 650,
      frame: false,
      transparent: true,
      hasShadow: false,
    }, { window: 'dashboard' });

    win.on('closed', () => {
      app.quit();
    });

    return win;
  }

  ensureVisibleBounds(x, y, width, height) {
    if (x === undefined || y === undefined) return { x, y };
    
    const displays = screen.getAllDisplays();
    const isVisible = displays.some(display => {
      const bounds = display.bounds;
      return (
        x < bounds.x + bounds.width &&
        x + width > bounds.x &&
        y < bounds.y + bounds.height &&
        y + height > bounds.y
      );
    });

    if (!isVisible) {
      const primary = screen.getPrimaryDisplay().workArea;
      return {
        x: Math.round(primary.x + (primary.width - width) / 2),
        y: Math.round(primary.y + (primary.height - height) / 2)
      };
    }
    
    return { x, y };
  }

  createOverlay(overlayId, savedSettings = {}) {
    const widgetDef = widgetRegistry.get(overlayId);
    if (!widgetDef) {
      log.error(`Attempted to create unknown overlay: ${overlayId}`);
      return null;
    }

    const { dimensions } = widgetDef;

    const width = savedSettings.width || dimensions.defaultWidth;
    const height = savedSettings.height || dimensions.defaultHeight;
    const safeBounds = this.ensureVisibleBounds(savedSettings.x, savedSettings.y, width, height);

    const win = this.createWindow(`overlay-${overlayId}`, {
      width,
      height,
      minWidth: dimensions.minWidth,
      minHeight: dimensions.minHeight,
      x: safeBounds.x,
      y: safeBounds.y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      hasShadow: false,
      skipTaskbar: true,
    }, { window: 'overlay', type: overlayId, id: `overlay-${overlayId}` });
    
    if (savedSettings.clickThrough) {
      win.setIgnoreMouseEvents(true);
    }
    
    return win;
  }

  getAllWindows() {
    return Array.from(this.windows.values());
  }

  broadcast(channel, data, overlayOnly = false, senderId = null) {
    this.windows.forEach((win, id) => {
      if (!win.isDestroyed()) {
        if (overlayOnly && !id.startsWith('overlay-')) return;
        win.webContents.send(channel, data, senderId);
      }
    });
  }
}
