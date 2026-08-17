import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import log from 'electron-log/main.js';

const WRITE_DEBOUNCE_MS = 300;

export class Store {
  constructor(opts) {
    const userDataPath = app.getPath('userData');
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = parseDataFile(this.path, opts.defaults);
    this._writeTimer = null;
    this._writing = false;
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    this._scheduleSave();
  }

  setAll(newVal) {
    this.data = { ...this.data, ...newVal };
    this._scheduleSave();
  }

  getAll() {
    return this.data;
  }

  /**
   * Debounced save. Batches rapid mutations into a single
   * disk write after WRITE_DEBOUNCE_MS of inactivity.
   */
  _scheduleSave() {
    if (this._writeTimer) clearTimeout(this._writeTimer);
    this._writeTimer = setTimeout(() => {
      this._writeTimer = null;
      this._atomicSave();
    }, WRITE_DEBOUNCE_MS);
  }

  /**
   * Atomic write: serialize to a temp file in the same directory,
   * then rename over the target. fs.rename on the same volume is
   * atomic on both Windows (NTFS) and POSIX, preventing corruption
   * if the process crashes mid-write.
   */
  async _atomicSave() {
    if (this._writing) {
      // Another save is in flight — reschedule so the latest data
      // is persisted after the current write completes.
      this._scheduleSave();
      return;
    }
    this._writing = true;
    const tmpPath = this.path + '.tmp';
    try {
      const json = JSON.stringify(this.data, null, 2);
      await fs.promises.writeFile(tmpPath, json, 'utf-8');
      await fs.promises.rename(tmpPath, this.path);
    } catch (error) {
      log.error('Failed to save config:', error);
      // Clean up temp file on failure
      try { await fs.promises.unlink(tmpPath); } catch { /* ignore */ }
    } finally {
      this._writing = false;
    }
  }

  /**
   * Flush any pending writes immediately (e.g. before app quit).
   */
  async flush() {
    if (this._writeTimer) {
      clearTimeout(this._writeTimer);
      this._writeTimer = null;
    }
    await this._atomicSave();
  }
}

function parseDataFile(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    return defaults;
  }
}
