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

  set(key, val) {
    this.data[key] = val;
    fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
  }

  setAll(newVal) {
    this.data = { ...this.data, ...newVal };
    fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
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
