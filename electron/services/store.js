import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export class Store {
  constructor(opts) {
    const userDataPath = app.getPath('userData');
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = parseDataFile(this.path, opts.defaults);
  }

  get(key) {
    return this.data[key];
  }

  async set(key, val) {
    this.data[key] = val;
    await fs.promises.writeFile(this.path, JSON.stringify(this.data, null, 2));
  }

  async setAll(newVal) {
    this.data = { ...this.data, ...newVal };
    await fs.promises.writeFile(this.path, JSON.stringify(this.data, null, 2));
  }

  getAll() {
    return this.data;
  }
}

function parseDataFile(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    return defaults;
  }
}
