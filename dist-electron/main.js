var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { ipcMain, BrowserWindow, app } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { error, warn, log } from "node:console";
import { join, dirname } from "node:path";
import { fileURLToPath as fileURLToPath$1 } from "node:url";
import fs from "fs";
import require$$2 from "os";
import http from "node:http";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
class WindowManager {
  constructor(store) {
    this.windows = /* @__PURE__ */ new Map();
    this.store = store;
    this.setupIpc();
  }
  setupIpc() {
    ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        win.setIgnoreMouseEvents(ignore, options);
      }
    });
    ipcMain.on("window-action", (event, { windowId, action, payload }) => {
      const win = this.windows.get(windowId);
      if (!win) return;
      switch (action) {
        case "close":
          if (windowId.startsWith("overlay-")) {
            const id = windowId.replace("overlay-", "");
            this.toggleOverlay(id, false);
          } else {
            win.close();
          }
          break;
        case "minimize":
          win.minimize();
          break;
        case "move":
          win.setPosition(payload.x, payload.y);
          break;
        case "resize":
          win.setSize(payload.width, payload.height);
          if (windowId.startsWith("overlay-")) {
            const id = windowId.replace("overlay-", "");
            const overlays = this.store.get("overlays") || {};
            if (overlays[id]) {
              overlays[id].width = payload.width;
              overlays[id].height = payload.height;
              this.store.set("overlays", overlays);
            }
          }
          break;
      }
    });
    ipcMain.handle("get-settings", () => {
      return this.store.getAll();
    });
    ipcMain.on("update-overlay-setting", (event, { id, settings }) => {
      const overlays = this.store.get("overlays") || {};
      overlays[id] = { ...overlays[id], ...settings };
      this.store.set("overlays", overlays);
      const win = this.windows.get(`overlay-${id}`);
      if (win && settings.clickThrough !== void 0) {
        win.setIgnoreMouseEvents(settings.clickThrough, { forward: true });
      }
      this.broadcast("settings-updated", this.store.getAll());
    });
    ipcMain.on("toggle-overlay", (event, id, state) => {
      this.toggleOverlay(id, state);
    });
  }
  toggleOverlay(id, state) {
    const overlays = this.store.get("overlays") || {};
    if (!overlays[id]) overlays[id] = {};
    const newState = state !== void 0 ? state : !overlays[id].enabled;
    overlays[id].enabled = newState;
    this.store.set("overlays", overlays);
    if (newState) {
      this.createOverlay(id, overlays[id]);
    } else {
      const win = this.windows.get(`overlay-${id}`);
      if (win && !win.isDestroyed()) {
        win.close();
      }
    }
    this.broadcast("settings-updated", this.store.getAll());
  }
  createWindow(id, options = {}, queryParams = {}) {
    if (this.windows.has(id)) {
      this.windows.get(id).focus();
      return this.windows.get(id);
    }
    const win = new BrowserWindow({
      ...options,
      webPreferences: {
        preload: path.join(__dirname$1, "preload.mjs"),
        nodeIntegration: false,
        contextIsolation: true,
        ...options.webPreferences
      }
    });
    const queryString = new URLSearchParams(queryParams).toString();
    if (process.env.VITE_DEV_SERVER_URL) {
      win.loadURL(`${process.env.VITE_DEV_SERVER_URL}?${queryString}`);
    } else {
      win.loadFile(path.join(__dirname$1, "../dist/index.html"), { query: queryParams });
    }
    win.on("resized", () => this.saveBounds(id, win));
    win.on("moved", () => this.saveBounds(id, win));
    win.on("closed", () => {
      this.windows.delete(id);
    });
    this.windows.set(id, win);
    return win;
  }
  saveBounds(id, win) {
    if (!id.startsWith("overlay-")) return;
    const overlayId = id.replace("overlay-", "");
    const bounds = win.getBounds();
    const overlays = this.store.get("overlays") || {};
    if (overlays[overlayId]) {
      overlays[overlayId].x = bounds.x;
      overlays[overlayId].y = bounds.y;
      overlays[overlayId].width = bounds.width;
      overlays[overlayId].height = bounds.height;
      this.store.set("overlays", overlays);
    }
  }
  createDashboard() {
    return this.createWindow("dashboard", {
      width: 900,
      height: 650,
      frame: false,
      transparent: true,
      hasShadow: false
    }, { window: "dashboard" });
  }
  createOverlay(overlayId, savedSettings = {}) {
    const win = this.createWindow(`overlay-${overlayId}`, {
      width: savedSettings.width || 400,
      height: savedSettings.height || 600,
      x: savedSettings.x,
      y: savedSettings.y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      hasShadow: false,
      skipTaskbar: true
    }, { window: "overlay", type: overlayId, id: `overlay-${overlayId}` });
    if (savedSettings.clickThrough) {
      win.setIgnoreMouseEvents(true, { forward: true });
    }
    return win;
  }
  getAllWindows() {
    return Array.from(this.windows.values());
  }
  broadcast(channel, data) {
    this.windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    });
  }
}
function getDefaultExportFromCjs$1(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function commonjsRequire(path2) {
  throw new Error('Could not dynamically require "' + path2 + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var nodeGypBuild$1 = { exports: {} };
var nodeGypBuild;
var hasRequiredNodeGypBuild$1;
function requireNodeGypBuild$1() {
  if (hasRequiredNodeGypBuild$1) return nodeGypBuild;
  hasRequiredNodeGypBuild$1 = 1;
  var fs$1 = fs;
  var path$1 = path;
  var os = require$$2;
  var runtimeRequire = typeof __webpack_require__ === "function" ? __non_webpack_require__ : commonjsRequire;
  var vars = process.config && process.config.variables || {};
  var prebuildsOnly = !!process.env.PREBUILDS_ONLY;
  var abi = process.versions.modules;
  var runtime = isElectron() ? "electron" : isNwjs() ? "node-webkit" : "node";
  var arch = process.env.npm_config_arch || os.arch();
  var platform = process.env.npm_config_platform || os.platform();
  var libc = process.env.LIBC || (isAlpine(platform) ? "musl" : "glibc");
  var armv = process.env.ARM_VERSION || (arch === "arm64" ? "8" : vars.arm_version) || "";
  var uv = (process.versions.uv || "").split(".")[0];
  nodeGypBuild = load2;
  function load2(dir) {
    return runtimeRequire(load2.resolve(dir));
  }
  load2.resolve = load2.path = function(dir) {
    dir = path$1.resolve(dir || ".");
    try {
      var name = runtimeRequire(path$1.join(dir, "package.json")).name.toUpperCase().replace(/-/g, "_");
      if (process.env[name + "_PREBUILD"]) dir = process.env[name + "_PREBUILD"];
    } catch (err) {
    }
    if (!prebuildsOnly) {
      var release = getFirst(path$1.join(dir, "build/Release"), matchBuild);
      if (release) return release;
      var debug = getFirst(path$1.join(dir, "build/Debug"), matchBuild);
      if (debug) return debug;
    }
    var prebuild = resolve(dir);
    if (prebuild) return prebuild;
    var nearby = resolve(path$1.dirname(process.execPath));
    if (nearby) return nearby;
    var target = [
      "platform=" + platform,
      "arch=" + arch,
      "runtime=" + runtime,
      "abi=" + abi,
      "uv=" + uv,
      armv ? "armv=" + armv : "",
      "libc=" + libc,
      "node=" + process.versions.node,
      process.versions.electron ? "electron=" + process.versions.electron : "",
      typeof __webpack_require__ === "function" ? "webpack=true" : ""
      // eslint-disable-line
    ].filter(Boolean).join(" ");
    throw new Error("No native build was found for " + target + "\n    loaded from: " + dir + "\n");
    function resolve(dir2) {
      var tuples = readdirSync(path$1.join(dir2, "prebuilds")).map(parseTuple);
      var tuple = tuples.filter(matchTuple(platform, arch)).sort(compareTuples)[0];
      if (!tuple) return;
      var prebuilds = path$1.join(dir2, "prebuilds", tuple.name);
      var parsed = readdirSync(prebuilds).map(parseTags);
      var candidates = parsed.filter(matchTags(runtime, abi));
      var winner = candidates.sort(compareTags(runtime))[0];
      if (winner) return path$1.join(prebuilds, winner.file);
    }
  };
  function readdirSync(dir) {
    try {
      return fs$1.readdirSync(dir);
    } catch (err) {
      return [];
    }
  }
  function getFirst(dir, filter) {
    var files = readdirSync(dir).filter(filter);
    return files[0] && path$1.join(dir, files[0]);
  }
  function matchBuild(name) {
    return /\.node$/.test(name);
  }
  function parseTuple(name) {
    var arr = name.split("-");
    if (arr.length !== 2) return;
    var platform2 = arr[0];
    var architectures = arr[1].split("+");
    if (!platform2) return;
    if (!architectures.length) return;
    if (!architectures.every(Boolean)) return;
    return { name, platform: platform2, architectures };
  }
  function matchTuple(platform2, arch2) {
    return function(tuple) {
      if (tuple == null) return false;
      if (tuple.platform !== platform2) return false;
      return tuple.architectures.includes(arch2);
    };
  }
  function compareTuples(a, b) {
    return a.architectures.length - b.architectures.length;
  }
  function parseTags(file) {
    var arr = file.split(".");
    var extension = arr.pop();
    var tags = { file, specificity: 0 };
    if (extension !== "node") return;
    for (var i = 0; i < arr.length; i++) {
      var tag = arr[i];
      if (tag === "node" || tag === "electron" || tag === "node-webkit") {
        tags.runtime = tag;
      } else if (tag === "napi") {
        tags.napi = true;
      } else if (tag.slice(0, 3) === "abi") {
        tags.abi = tag.slice(3);
      } else if (tag.slice(0, 2) === "uv") {
        tags.uv = tag.slice(2);
      } else if (tag.slice(0, 4) === "armv") {
        tags.armv = tag.slice(4);
      } else if (tag === "glibc" || tag === "musl") {
        tags.libc = tag;
      } else {
        continue;
      }
      tags.specificity++;
    }
    return tags;
  }
  function matchTags(runtime2, abi2) {
    return function(tags) {
      if (tags == null) return false;
      if (tags.runtime && tags.runtime !== runtime2 && !runtimeAgnostic(tags)) return false;
      if (tags.abi && tags.abi !== abi2 && !tags.napi) return false;
      if (tags.uv && tags.uv !== uv) return false;
      if (tags.armv && tags.armv !== armv) return false;
      if (tags.libc && tags.libc !== libc) return false;
      return true;
    };
  }
  function runtimeAgnostic(tags) {
    return tags.runtime === "node" && tags.napi;
  }
  function compareTags(runtime2) {
    return function(a, b) {
      if (a.runtime !== b.runtime) {
        return a.runtime === runtime2 ? -1 : 1;
      } else if (a.abi !== b.abi) {
        return a.abi ? -1 : 1;
      } else if (a.specificity !== b.specificity) {
        return a.specificity > b.specificity ? -1 : 1;
      } else {
        return 0;
      }
    };
  }
  function isNwjs() {
    return !!(process.versions && process.versions.nw);
  }
  function isElectron() {
    if (process.versions && process.versions.electron) return true;
    if (process.env.ELECTRON_RUN_AS_NODE) return true;
    return typeof window !== "undefined" && window.process && window.process.type === "renderer";
  }
  function isAlpine(platform2) {
    return platform2 === "linux" && fs$1.existsSync("/etc/alpine-release");
  }
  load2.parseTags = parseTags;
  load2.matchTags = matchTags;
  load2.compareTags = compareTags;
  load2.parseTuple = parseTuple;
  load2.matchTuple = matchTuple;
  load2.compareTuples = compareTuples;
  return nodeGypBuild;
}
var hasRequiredNodeGypBuild;
function requireNodeGypBuild() {
  if (hasRequiredNodeGypBuild) return nodeGypBuild$1.exports;
  hasRequiredNodeGypBuild = 1;
  const runtimeRequire = typeof __webpack_require__ === "function" ? __non_webpack_require__ : commonjsRequire;
  if (typeof runtimeRequire.addon === "function") {
    nodeGypBuild$1.exports = runtimeRequire.addon.bind(runtimeRequire);
  } else {
    nodeGypBuild$1.exports = requireNodeGypBuild$1();
  }
  return nodeGypBuild$1.exports;
}
var nodeGypBuildExports = requireNodeGypBuild();
const importNativeModule = /* @__PURE__ */ getDefaultExportFromCjs$1(nodeGypBuildExports);
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var jsYaml = {};
var loader = {};
var common = {};
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function isNothing(subject) {
    return typeof subject === "undefined" || subject === null;
  }
  function isObject(subject) {
    return typeof subject === "object" && subject !== null;
  }
  function toArray(sequence) {
    if (Array.isArray(sequence)) return sequence;
    else if (isNothing(sequence)) return [];
    return [sequence];
  }
  function extend(target, source) {
    if (source) {
      const sourceKeys = Object.keys(source);
      for (let index = 0, length = sourceKeys.length; index < length; index += 1) {
        const key = sourceKeys[index];
        target[key] = source[key];
      }
    }
    return target;
  }
  function repeat(string, count) {
    let result = "";
    for (let cycle = 0; cycle < count; cycle += 1) {
      result += string;
    }
    return result;
  }
  function isNegativeZero(number) {
    return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
  }
  common.isNothing = isNothing;
  common.isObject = isObject;
  common.toArray = toArray;
  common.repeat = repeat;
  common.isNegativeZero = isNegativeZero;
  common.extend = extend;
  return common;
}
var exception;
var hasRequiredException;
function requireException() {
  if (hasRequiredException) return exception;
  hasRequiredException = 1;
  function formatError(exception2, compact) {
    let where = "";
    const message = exception2.reason || "(unknown reason)";
    if (!exception2.mark) return message;
    if (exception2.mark.name) {
      where += 'in "' + exception2.mark.name + '" ';
    }
    where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
    if (!compact && exception2.mark.snippet) {
      where += "\n\n" + exception2.mark.snippet;
    }
    return message + " " + where;
  }
  function YAMLException2(reason, mark) {
    Error.call(this);
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = formatError(this, false);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack || "";
    }
  }
  YAMLException2.prototype = Object.create(Error.prototype);
  YAMLException2.prototype.constructor = YAMLException2;
  YAMLException2.prototype.toString = function toString(compact) {
    return this.name + ": " + formatError(this, compact);
  };
  exception = YAMLException2;
  return exception;
}
var snippet;
var hasRequiredSnippet;
function requireSnippet() {
  if (hasRequiredSnippet) return snippet;
  hasRequiredSnippet = 1;
  const common2 = requireCommon();
  function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
    let head = "";
    let tail = "";
    const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
    if (position - lineStart > maxHalfLength) {
      head = " ... ";
      lineStart = position - maxHalfLength + head.length;
    }
    if (lineEnd - position > maxHalfLength) {
      tail = " ...";
      lineEnd = position + maxHalfLength - tail.length;
    }
    return {
      str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
      pos: position - lineStart + head.length
      // relative position
    };
  }
  function padStart(string, max) {
    return common2.repeat(" ", max - string.length) + string;
  }
  function makeSnippet(mark, options) {
    options = Object.create(options || null);
    if (!mark.buffer) return null;
    if (!options.maxLength) options.maxLength = 79;
    if (typeof options.indent !== "number") options.indent = 1;
    if (typeof options.linesBefore !== "number") options.linesBefore = 3;
    if (typeof options.linesAfter !== "number") options.linesAfter = 2;
    const re = /\r?\n|\r|\0/g;
    const lineStarts = [0];
    const lineEnds = [];
    let match;
    let foundLineNo = -1;
    while (match = re.exec(mark.buffer)) {
      lineEnds.push(match.index);
      lineStarts.push(match.index + match[0].length);
      if (mark.position <= match.index && foundLineNo < 0) {
        foundLineNo = lineStarts.length - 2;
      }
    }
    if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
    let result = "";
    const lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
    const maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
    for (let i = 1; i <= options.linesBefore; i++) {
      if (foundLineNo - i < 0) break;
      const line2 = getLine(
        mark.buffer,
        lineStarts[foundLineNo - i],
        lineEnds[foundLineNo - i],
        mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
        maxLineLength
      );
      result = common2.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line2.str + "\n" + result;
    }
    const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
    result += common2.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
    result += common2.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
    for (let i = 1; i <= options.linesAfter; i++) {
      if (foundLineNo + i >= lineEnds.length) break;
      const line2 = getLine(
        mark.buffer,
        lineStarts[foundLineNo + i],
        lineEnds[foundLineNo + i],
        mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
        maxLineLength
      );
      result += common2.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line2.str + "\n";
    }
    return result.replace(/\n$/, "");
  }
  snippet = makeSnippet;
  return snippet;
}
var type;
var hasRequiredType;
function requireType() {
  if (hasRequiredType) return type;
  hasRequiredType = 1;
  const YAMLException2 = requireException();
  const TYPE_CONSTRUCTOR_OPTIONS = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ];
  const YAML_NODE_KINDS = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function compileStyleAliases(map2) {
    const result = {};
    if (map2 !== null) {
      Object.keys(map2).forEach(function(style) {
        map2[style].forEach(function(alias) {
          result[String(alias)] = style;
        });
      });
    }
    return result;
  }
  function Type2(tag, options) {
    options = options || {};
    Object.keys(options).forEach(function(name) {
      if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
        throw new YAMLException2('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
      }
    });
    this.options = options;
    this.tag = tag;
    this.kind = options["kind"] || null;
    this.resolve = options["resolve"] || function() {
      return true;
    };
    this.construct = options["construct"] || function(data) {
      return data;
    };
    this.instanceOf = options["instanceOf"] || null;
    this.predicate = options["predicate"] || null;
    this.represent = options["represent"] || null;
    this.representName = options["representName"] || null;
    this.defaultStyle = options["defaultStyle"] || null;
    this.multi = options["multi"] || false;
    this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
    if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
      throw new YAMLException2('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
    }
  }
  type = Type2;
  return type;
}
var schema;
var hasRequiredSchema;
function requireSchema() {
  if (hasRequiredSchema) return schema;
  hasRequiredSchema = 1;
  const YAMLException2 = requireException();
  const Type2 = requireType();
  function compileList(schema2, name) {
    const result = [];
    schema2[name].forEach(function(currentType) {
      let newIndex = result.length;
      result.forEach(function(previousType, previousIndex) {
        if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
          newIndex = previousIndex;
        }
      });
      result[newIndex] = currentType;
    });
    return result;
  }
  function compileMap() {
    const result = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    };
    function collectType(type2) {
      if (type2.multi) {
        result.multi[type2.kind].push(type2);
        result.multi["fallback"].push(type2);
      } else {
        result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
      }
    }
    for (let index = 0, length = arguments.length; index < length; index += 1) {
      arguments[index].forEach(collectType);
    }
    return result;
  }
  function Schema2(definition) {
    return this.extend(definition);
  }
  Schema2.prototype.extend = function extend(definition) {
    let implicit = [];
    let explicit = [];
    if (definition instanceof Type2) {
      explicit.push(definition);
    } else if (Array.isArray(definition)) {
      explicit = explicit.concat(definition);
    } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
      if (definition.implicit) implicit = implicit.concat(definition.implicit);
      if (definition.explicit) explicit = explicit.concat(definition.explicit);
    } else {
      throw new YAMLException2("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    }
    implicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      if (type2.loadKind && type2.loadKind !== "scalar") {
        throw new YAMLException2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      }
      if (type2.multi) {
        throw new YAMLException2("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
      }
    });
    explicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
    });
    const result = Object.create(Schema2.prototype);
    result.implicit = (this.implicit || []).concat(implicit);
    result.explicit = (this.explicit || []).concat(explicit);
    result.compiledImplicit = compileList(result, "implicit");
    result.compiledExplicit = compileList(result, "explicit");
    result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
    return result;
  };
  schema = Schema2;
  return schema;
}
var str;
var hasRequiredStr;
function requireStr() {
  if (hasRequiredStr) return str;
  hasRequiredStr = 1;
  const Type2 = requireType();
  str = new Type2("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(data) {
      return data !== null ? data : "";
    }
  });
  return str;
}
var seq;
var hasRequiredSeq;
function requireSeq() {
  if (hasRequiredSeq) return seq;
  hasRequiredSeq = 1;
  const Type2 = requireType();
  seq = new Type2("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(data) {
      return data !== null ? data : [];
    }
  });
  return seq;
}
var map;
var hasRequiredMap;
function requireMap() {
  if (hasRequiredMap) return map;
  hasRequiredMap = 1;
  const Type2 = requireType();
  map = new Type2("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(data) {
      return data !== null ? data : {};
    }
  });
  return map;
}
var failsafe;
var hasRequiredFailsafe;
function requireFailsafe() {
  if (hasRequiredFailsafe) return failsafe;
  hasRequiredFailsafe = 1;
  const Schema2 = requireSchema();
  failsafe = new Schema2({
    explicit: [
      requireStr(),
      requireSeq(),
      requireMap()
    ]
  });
  return failsafe;
}
var _null;
var hasRequired_null;
function require_null() {
  if (hasRequired_null) return _null;
  hasRequired_null = 1;
  const Type2 = requireType();
  function resolveYamlNull(data) {
    if (data === null) return true;
    const max = data.length;
    return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
  }
  function constructYamlNull() {
    return null;
  }
  function isNull(object) {
    return object === null;
  }
  _null = new Type2("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  });
  return _null;
}
var bool;
var hasRequiredBool;
function requireBool() {
  if (hasRequiredBool) return bool;
  hasRequiredBool = 1;
  const Type2 = requireType();
  function resolveYamlBoolean(data) {
    if (data === null) return false;
    const max = data.length;
    return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
  }
  function constructYamlBoolean(data) {
    return data === "true" || data === "True" || data === "TRUE";
  }
  function isBoolean(object) {
    return Object.prototype.toString.call(object) === "[object Boolean]";
  }
  bool = new Type2("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    represent: {
      lowercase: function(object) {
        return object ? "true" : "false";
      },
      uppercase: function(object) {
        return object ? "TRUE" : "FALSE";
      },
      camelcase: function(object) {
        return object ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  });
  return bool;
}
var int;
var hasRequiredInt;
function requireInt() {
  if (hasRequiredInt) return int;
  hasRequiredInt = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  function isHexCode(c) {
    return c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
  }
  function isOctCode(c) {
    return c >= 48 && c <= 55;
  }
  function isDecCode(c) {
    return c >= 48 && c <= 57;
  }
  function resolveYamlInteger(data) {
    if (data === null) return false;
    const max = data.length;
    let index = 0;
    let hasDigits = false;
    if (!max) return false;
    let ch = data[index];
    if (ch === "-" || ch === "+") {
      ch = data[++index];
    }
    if (ch === "0") {
      if (index + 1 === max) return true;
      ch = data[++index];
      if (ch === "b") {
        index++;
        for (; index < max; index++) {
          ch = data[index];
          if (ch !== "0" && ch !== "1") return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "x") {
        index++;
        for (; index < max; index++) {
          if (!isHexCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "o") {
        index++;
        for (; index < max; index++) {
          if (!isOctCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
    }
    for (; index < max; index++) {
      if (!isDecCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }
    if (!hasDigits) return false;
    return isFinite(parseYamlInteger(data));
  }
  function parseYamlInteger(data) {
    let value = data;
    let sign = 1;
    let ch = value[0];
    if (ch === "-" || ch === "+") {
      if (ch === "-") sign = -1;
      value = value.slice(1);
      ch = value[0];
    }
    if (value === "0") return 0;
    if (ch === "0") {
      if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
      if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
      if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
    }
    return sign * parseInt(value, 10);
  }
  function constructYamlInteger(data) {
    return parseYamlInteger(data);
  }
  function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common2.isNegativeZero(object));
  }
  int = new Type2("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    represent: {
      binary: function(obj) {
        return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
      },
      octal: function(obj) {
        return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
      },
      decimal: function(obj) {
        return obj.toString(10);
      },
      hexadecimal: function(obj) {
        return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  });
  return int;
}
var float;
var hasRequiredFloat;
function requireFloat() {
  if (hasRequiredFloat) return float;
  hasRequiredFloat = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  const YAML_FLOAT_PATTERN = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  const YAML_FLOAT_SPECIAL_PATTERN = new RegExp(
    "^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function resolveYamlFloat(data) {
    if (data === null) return false;
    if (!YAML_FLOAT_PATTERN.test(data)) {
      return false;
    }
    if (isFinite(parseFloat(data, 10))) {
      return true;
    }
    return YAML_FLOAT_SPECIAL_PATTERN.test(data);
  }
  function constructYamlFloat(data) {
    let value = data.toLowerCase();
    const sign = value[0] === "-" ? -1 : 1;
    if ("+-".indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }
    if (value === ".inf") {
      return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else if (value === ".nan") {
      return NaN;
    }
    return sign * parseFloat(value, 10);
  }
  const SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
  function representYamlFloat(object, style) {
    if (isNaN(object)) {
      switch (style) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    } else if (Number.POSITIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    } else if (Number.NEGATIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    } else if (common2.isNegativeZero(object)) {
      return "-0.0";
    }
    const res = object.toString(10);
    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
  }
  function isFloat(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common2.isNegativeZero(object));
  }
  float = new Type2("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    represent: representYamlFloat,
    defaultStyle: "lowercase"
  });
  return float;
}
var json;
var hasRequiredJson;
function requireJson() {
  if (hasRequiredJson) return json;
  hasRequiredJson = 1;
  json = requireFailsafe().extend({
    implicit: [
      require_null(),
      requireBool(),
      requireInt(),
      requireFloat()
    ]
  });
  return json;
}
var core;
var hasRequiredCore;
function requireCore() {
  if (hasRequiredCore) return core;
  hasRequiredCore = 1;
  core = requireJson();
  return core;
}
var timestamp;
var hasRequiredTimestamp;
function requireTimestamp() {
  if (hasRequiredTimestamp) return timestamp;
  hasRequiredTimestamp = 1;
  const Type2 = requireType();
  const YAML_DATE_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  );
  const YAML_TIMESTAMP_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function resolveYamlTimestamp(data) {
    if (data === null) return false;
    if (YAML_DATE_REGEXP.exec(data) !== null) return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
    return false;
  }
  function constructYamlTimestamp(data) {
    let fraction = 0;
    let delta = null;
    let match = YAML_DATE_REGEXP.exec(data);
    if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
    if (match === null) throw new Error("Date resolve error");
    const year = +match[1];
    const month = +match[2] - 1;
    const day = +match[3];
    if (!match[4]) {
      return new Date(Date.UTC(year, month, day));
    }
    const hour = +match[4];
    const minute = +match[5];
    const second = +match[6];
    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) {
        fraction += "0";
      }
      fraction = +fraction;
    }
    if (match[9]) {
      const tzHour = +match[10];
      const tzMinute = +(match[11] || 0);
      delta = (tzHour * 60 + tzMinute) * 6e4;
      if (match[9] === "-") delta = -delta;
    }
    const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (delta) date.setTime(date.getTime() - delta);
    return date;
  }
  function representYamlTimestamp(object) {
    return object.toISOString();
  }
  timestamp = new Type2("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
    represent: representYamlTimestamp
  });
  return timestamp;
}
var merge;
var hasRequiredMerge;
function requireMerge() {
  if (hasRequiredMerge) return merge;
  hasRequiredMerge = 1;
  const Type2 = requireType();
  function resolveYamlMerge(data) {
    return data === "<<" || data === null;
  }
  merge = new Type2("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: resolveYamlMerge
  });
  return merge;
}
var binary;
var hasRequiredBinary;
function requireBinary() {
  if (hasRequiredBinary) return binary;
  hasRequiredBinary = 1;
  const Type2 = requireType();
  const BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
  function resolveYamlBinary(data) {
    if (data === null) return false;
    let bitlen = 0;
    const max = data.length;
    const map2 = BASE64_MAP;
    for (let idx = 0; idx < max; idx++) {
      const code = map2.indexOf(data.charAt(idx));
      if (code > 64) continue;
      if (code < 0) return false;
      bitlen += 6;
    }
    return bitlen % 8 === 0;
  }
  function constructYamlBinary(data) {
    const input = data.replace(/[\r\n=]/g, "");
    const max = input.length;
    const map2 = BASE64_MAP;
    let bits = 0;
    const result = [];
    for (let idx = 0; idx < max; idx++) {
      if (idx % 4 === 0 && idx) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      }
      bits = bits << 6 | map2.indexOf(input.charAt(idx));
    }
    const tailbits = max % 4 * 6;
    if (tailbits === 0) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    } else if (tailbits === 18) {
      result.push(bits >> 10 & 255);
      result.push(bits >> 2 & 255);
    } else if (tailbits === 12) {
      result.push(bits >> 4 & 255);
    }
    return new Uint8Array(result);
  }
  function representYamlBinary(object) {
    let result = "";
    let bits = 0;
    const max = object.length;
    const map2 = BASE64_MAP;
    for (let idx = 0; idx < max; idx++) {
      if (idx % 3 === 0 && idx) {
        result += map2[bits >> 18 & 63];
        result += map2[bits >> 12 & 63];
        result += map2[bits >> 6 & 63];
        result += map2[bits & 63];
      }
      bits = (bits << 8) + object[idx];
    }
    const tail = max % 3;
    if (tail === 0) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    } else if (tail === 2) {
      result += map2[bits >> 10 & 63];
      result += map2[bits >> 4 & 63];
      result += map2[bits << 2 & 63];
      result += map2[64];
    } else if (tail === 1) {
      result += map2[bits >> 2 & 63];
      result += map2[bits << 4 & 63];
      result += map2[64];
      result += map2[64];
    }
    return result;
  }
  function isBinary(obj) {
    return Object.prototype.toString.call(obj) === "[object Uint8Array]";
  }
  binary = new Type2("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
    represent: representYamlBinary
  });
  return binary;
}
var omap;
var hasRequiredOmap;
function requireOmap() {
  if (hasRequiredOmap) return omap;
  hasRequiredOmap = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const _toString = Object.prototype.toString;
  function resolveYamlOmap(data) {
    if (data === null) return true;
    const objectKeys = {};
    const object = data;
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      let pairHasKey = false;
      if (_toString.call(pair) !== "[object Object]") return false;
      let pairKey;
      for (pairKey in pair) {
        if (_hasOwnProperty.call(pair, pairKey)) {
          if (!pairHasKey) pairHasKey = true;
          else return false;
        }
      }
      if (!pairHasKey) return false;
      if (_hasOwnProperty.call(objectKeys, pairKey)) return false;
      Object.defineProperty(objectKeys, pairKey, { value: true });
    }
    return true;
  }
  function constructYamlOmap(data) {
    return data !== null ? data : [];
  }
  omap = new Type2("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
  });
  return omap;
}
var pairs;
var hasRequiredPairs;
function requirePairs() {
  if (hasRequiredPairs) return pairs;
  hasRequiredPairs = 1;
  const Type2 = requireType();
  const _toString = Object.prototype.toString;
  function resolveYamlPairs(data) {
    if (data === null) return true;
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      if (_toString.call(pair) !== "[object Object]") return false;
      const keys = Object.keys(pair);
      if (keys.length !== 1) return false;
      result[index] = [keys[0], pair[keys[0]]];
    }
    return true;
  }
  function constructYamlPairs(data) {
    if (data === null) return [];
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      const keys = Object.keys(pair);
      result[index] = [keys[0], pair[keys[0]]];
    }
    return result;
  }
  pairs = new Type2("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
  });
  return pairs;
}
var set;
var hasRequiredSet;
function requireSet() {
  if (hasRequiredSet) return set;
  hasRequiredSet = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  function resolveYamlSet(data) {
    if (data === null) return true;
    const object = data;
    for (const key in object) {
      if (_hasOwnProperty.call(object, key)) {
        if (object[key] !== null) return false;
      }
    }
    return true;
  }
  function constructYamlSet(data) {
    return data !== null ? data : {};
  }
  set = new Type2("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: resolveYamlSet,
    construct: constructYamlSet
  });
  return set;
}
var _default;
var hasRequired_default;
function require_default() {
  if (hasRequired_default) return _default;
  hasRequired_default = 1;
  _default = requireCore().extend({
    implicit: [
      requireTimestamp(),
      requireMerge()
    ],
    explicit: [
      requireBinary(),
      requireOmap(),
      requirePairs(),
      requireSet()
    ]
  });
  return _default;
}
var hasRequiredLoader;
function requireLoader() {
  if (hasRequiredLoader) return loader;
  hasRequiredLoader = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const makeSnippet = requireSnippet();
  const DEFAULT_SCHEMA2 = require_default();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CONTEXT_FLOW_IN = 1;
  const CONTEXT_FLOW_OUT = 2;
  const CONTEXT_BLOCK_IN = 3;
  const CONTEXT_BLOCK_OUT = 4;
  const CHOMPING_CLIP = 1;
  const CHOMPING_STRIP = 2;
  const CHOMPING_KEEP = 3;
  const PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
  const PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
  const PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
  const PATTERN_TAG_URI = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }
  function isEol(c) {
    return c === 10 || c === 13;
  }
  function isWhiteSpace(c) {
    return c === 9 || c === 32;
  }
  function isWsOrEol(c) {
    return c === 9 || c === 32 || c === 10 || c === 13;
  }
  function isFlowIndicator(c) {
    return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
  }
  function fromHexCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    const lc = c | 32;
    if (lc >= 97 && lc <= 102) {
      return lc - 97 + 10;
    }
    return -1;
  }
  function escapedHexLen(c) {
    if (c === 120) {
      return 2;
    }
    if (c === 117) {
      return 4;
    }
    if (c === 85) {
      return 8;
    }
    return 0;
  }
  function fromDecimalCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    return -1;
  }
  function simpleEscapeSequence(c) {
    switch (c) {
      case 48:
        return "\0";
      case 97:
        return "\x07";
      case 98:
        return "\b";
      case 116:
        return "	";
      case 9:
        return "	";
      case 110:
        return "\n";
      case 118:
        return "\v";
      case 102:
        return "\f";
      case 114:
        return "\r";
      case 101:
        return "\x1B";
      case 32:
        return " ";
      case 34:
        return '"';
      case 47:
        return "/";
      case 92:
        return "\\";
      case 78:
        return "";
      case 95:
        return " ";
      case 76:
        return "\u2028";
      case 80:
        return "\u2029";
      default:
        return "";
    }
  }
  function charFromCodepoint(c) {
    if (c <= 65535) {
      return String.fromCharCode(c);
    }
    return String.fromCharCode(
      (c - 65536 >> 10) + 55296,
      (c - 65536 & 1023) + 56320
    );
  }
  function setProperty(object, key, value) {
    if (key === "__proto__") {
      Object.defineProperty(object, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value
      });
    } else {
      object[key] = value;
    }
  }
  const simpleEscapeCheck = new Array(256);
  const simpleEscapeMap = new Array(256);
  for (let i = 0; i < 256; i++) {
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
  }
  function State(input, options) {
    this.input = input;
    this.filename = options["filename"] || null;
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.onWarning = options["onWarning"] || null;
    this.legacy = options["legacy"] || false;
    this.json = options["json"] || false;
    this.listener = options["listener"] || null;
    this.maxDepth = typeof options["maxDepth"] === "number" ? options["maxDepth"] : 100;
    this.maxTotalMergeKeys = typeof options["maxTotalMergeKeys"] === "number" ? options["maxTotalMergeKeys"] : 1e4;
    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap = this.schema.compiledTypeMap;
    this.length = input.length;
    this.position = 0;
    this.line = 0;
    this.lineStart = 0;
    this.lineIndent = 0;
    this.depth = 0;
    this.totalMergeKeys = 0;
    this.firstTabInLine = -1;
    this.documents = [];
    this.anchorMapTransactions = [];
  }
  function generateError(state, message) {
    const mark = {
      name: state.filename,
      buffer: state.input.slice(0, -1),
      // omit trailing \0
      position: state.position,
      line: state.line,
      column: state.position - state.lineStart
    };
    mark.snippet = makeSnippet(mark);
    return new YAMLException2(message, mark);
  }
  function throwError(state, message) {
    throw generateError(state, message);
  }
  function throwWarning(state, message) {
    if (state.onWarning) {
      state.onWarning.call(null, generateError(state, message));
    }
  }
  function storeAnchor(state, name, value) {
    const transactions = state.anchorMapTransactions;
    if (transactions.length !== 0) {
      const transaction = transactions[transactions.length - 1];
      if (!_hasOwnProperty.call(transaction, name)) {
        transaction[name] = {
          existed: _hasOwnProperty.call(state.anchorMap, name),
          value: state.anchorMap[name]
        };
      }
    }
    state.anchorMap[name] = value;
  }
  function beginAnchorTransaction(state) {
    state.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
  }
  function commitAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const transactions = state.anchorMapTransactions;
    if (transactions.length === 0) return;
    const parent = transactions[transactions.length - 1];
    const names = Object.keys(transaction);
    for (let index = 0, length = names.length; index < length; index += 1) {
      const name = names[index];
      if (!_hasOwnProperty.call(parent, name)) {
        parent[name] = transaction[name];
      }
    }
  }
  function rollbackAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const names = Object.keys(transaction);
    for (let index = names.length - 1; index >= 0; index -= 1) {
      const entry = transaction[names[index]];
      if (entry.existed) {
        state.anchorMap[names[index]] = entry.value;
      } else {
        delete state.anchorMap[names[index]];
      }
    }
  }
  function snapshotState(state) {
    return {
      position: state.position,
      line: state.line,
      lineStart: state.lineStart,
      lineIndent: state.lineIndent,
      firstTabInLine: state.firstTabInLine,
      tag: state.tag,
      anchor: state.anchor,
      kind: state.kind,
      result: state.result
    };
  }
  function restoreState(state, snapshot) {
    state.position = snapshot.position;
    state.line = snapshot.line;
    state.lineStart = snapshot.lineStart;
    state.lineIndent = snapshot.lineIndent;
    state.firstTabInLine = snapshot.firstTabInLine;
    state.tag = snapshot.tag;
    state.anchor = snapshot.anchor;
    state.kind = snapshot.kind;
    state.result = snapshot.result;
  }
  const directiveHandlers = {
    YAML: function handleYamlDirective(state, name, args) {
      if (state.version !== null) {
        throwError(state, "duplication of %YAML directive");
      }
      if (args.length !== 1) {
        throwError(state, "YAML directive accepts exactly one argument");
      }
      const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
      if (match === null) {
        throwError(state, "ill-formed argument of the YAML directive");
      }
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major !== 1) {
        throwError(state, "unacceptable YAML version of the document");
      }
      state.version = args[0];
      state.checkLineBreaks = minor < 2;
      if (minor !== 1 && minor !== 2) {
        throwWarning(state, "unsupported YAML version of the document");
      }
    },
    TAG: function handleTagDirective(state, name, args) {
      let prefix;
      if (args.length !== 2) {
        throwError(state, "TAG directive accepts exactly two arguments");
      }
      const handle = args[0];
      prefix = args[1];
      if (!PATTERN_TAG_HANDLE.test(handle)) {
        throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
      }
      if (_hasOwnProperty.call(state.tagMap, handle)) {
        throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
      }
      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
      }
      try {
        prefix = decodeURIComponent(prefix);
      } catch (err) {
        throwError(state, "tag prefix is malformed: " + prefix);
      }
      state.tagMap[handle] = prefix;
    }
  };
  function captureSegment(state, start, end, checkJson) {
    if (start < end) {
      const _result = state.input.slice(start, end);
      if (checkJson) {
        for (let _position = 0, _length = _result.length; _position < _length; _position += 1) {
          const _character = _result.charCodeAt(_position);
          if (!(_character === 9 || _character >= 32 && _character <= 1114111)) {
            throwError(state, "expected valid JSON character");
          }
        }
      } else if (PATTERN_NON_PRINTABLE.test(_result)) {
        throwError(state, "the stream contains non-printable characters");
      }
      state.result += _result;
    }
  }
  function mergeMappings(state, destination, source, overridableKeys) {
    if (!common2.isObject(source)) {
      throwError(state, "cannot merge mappings; the provided source object is unacceptable");
    }
    const sourceKeys = Object.keys(source);
    for (let index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
      const key = sourceKeys[index];
      if (state.maxTotalMergeKeys !== -1 && ++state.totalMergeKeys > state.maxTotalMergeKeys) {
        throwError(state, "merge keys exceeded maxTotalMergeKeys (" + state.maxTotalMergeKeys + ")");
      }
      if (!_hasOwnProperty.call(destination, key)) {
        setProperty(destination, key, source[key]);
        overridableKeys[key] = true;
      }
    }
  }
  function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
    if (Array.isArray(keyNode)) {
      keyNode = Array.prototype.slice.call(keyNode);
      for (let index = 0, quantity = keyNode.length; index < quantity; index += 1) {
        if (Array.isArray(keyNode[index])) {
          throwError(state, "nested arrays are not supported inside keys");
        }
        if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
          keyNode[index] = "[object Object]";
        }
      }
    }
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
      keyNode = "[object Object]";
    }
    keyNode = String(keyNode);
    if (_result === null) {
      _result = {};
    }
    if (keyTag === "tag:yaml.org,2002:merge") {
      if (Array.isArray(valueNode)) {
        for (let index = 0, quantity = valueNode.length; index < quantity; index += 1) {
          mergeMappings(state, _result, valueNode[index], overridableKeys);
        }
      } else {
        mergeMappings(state, _result, valueNode, overridableKeys);
      }
    } else {
      if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
        state.line = startLine || state.line;
        state.lineStart = startLineStart || state.lineStart;
        state.position = startPos || state.position;
        throwError(state, "duplicated mapping key");
      }
      setProperty(_result, keyNode, valueNode);
      delete overridableKeys[keyNode];
    }
    return _result;
  }
  function readLineBreak(state) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 10) {
      state.position++;
    } else if (ch === 13) {
      state.position++;
      if (state.input.charCodeAt(state.position) === 10) {
        state.position++;
      }
    } else {
      throwError(state, "a line break is expected");
    }
    state.line += 1;
    state.lineStart = state.position;
    state.firstTabInLine = -1;
  }
  function skipSeparationSpace(state, allowComments, checkIndent) {
    let lineBreaks = 0;
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      while (isWhiteSpace(ch)) {
        if (ch === 9 && state.firstTabInLine === -1) {
          state.firstTabInLine = state.position;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      if (allowComments && ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 10 && ch !== 13 && ch !== 0);
      }
      if (isEol(ch)) {
        readLineBreak(state);
        ch = state.input.charCodeAt(state.position);
        lineBreaks++;
        state.lineIndent = 0;
        while (ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
      } else {
        break;
      }
    }
    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
      throwWarning(state, "deficient indentation");
    }
    return lineBreaks;
  }
  function testDocumentSeparator(state) {
    let _position = state.position;
    let ch = state.input.charCodeAt(_position);
    if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
      _position += 3;
      ch = state.input.charCodeAt(_position);
      if (ch === 0 || isWsOrEol(ch)) {
        return true;
      }
    }
    return false;
  }
  function writeFoldedLines(state, count) {
    if (count === 1) {
      state.result += " ";
    } else if (count > 1) {
      state.result += common2.repeat("\n", count - 1);
    }
  }
  function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    let captureStart;
    let captureEnd;
    let hasPendingContent;
    let _line;
    let _lineStart;
    let _lineIndent;
    const _kind = state.kind;
    const _result = state.result;
    let ch = state.input.charCodeAt(state.position);
    if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
      return false;
    }
    if (ch === 63 || ch === 45) {
      const following = state.input.charCodeAt(state.position + 1);
      if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
        return false;
      }
    }
    state.kind = "scalar";
    state.result = "";
    captureStart = captureEnd = state.position;
    hasPendingContent = false;
    while (ch !== 0) {
      if (ch === 58) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
          break;
        }
      } else if (ch === 35) {
        const preceding = state.input.charCodeAt(state.position - 1);
        if (isWsOrEol(preceding)) {
          break;
        }
      } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch)) {
        break;
      } else if (isEol(ch)) {
        _line = state.line;
        _lineStart = state.lineStart;
        _lineIndent = state.lineIndent;
        skipSeparationSpace(state, false, -1);
        if (state.lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = state.input.charCodeAt(state.position);
          continue;
        } else {
          state.position = captureEnd;
          state.line = _line;
          state.lineStart = _lineStart;
          state.lineIndent = _lineIndent;
          break;
        }
      }
      if (hasPendingContent) {
        captureSegment(state, captureStart, captureEnd, false);
        writeFoldedLines(state, state.line - _line);
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
      }
      if (!isWhiteSpace(ch)) {
        captureEnd = state.position + 1;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, captureEnd, false);
    if (state.result) {
      return true;
    }
    state.kind = _kind;
    state.result = _result;
    return false;
  }
  function readSingleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 39) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 39) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (ch === 39) {
          captureStart = state.position;
          state.position++;
          captureEnd = state.position;
        } else {
          return true;
        }
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a single quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a single quoted scalar");
  }
  function readDoubleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 34) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 34) {
        captureSegment(state, captureStart, state.position, true);
        state.position++;
        return true;
      } else if (ch === 92) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (isEol(ch)) {
          skipSeparationSpace(state, false, nodeIndent);
        } else if (ch < 256 && simpleEscapeCheck[ch]) {
          state.result += simpleEscapeMap[ch];
          state.position++;
        } else if ((tmp = escapedHexLen(ch)) > 0) {
          let hexLength = tmp;
          let hexResult = 0;
          for (; hexLength > 0; hexLength--) {
            ch = state.input.charCodeAt(++state.position);
            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;
            } else {
              throwError(state, "expected hexadecimal character");
            }
          }
          state.result += charFromCodepoint(hexResult);
          state.position++;
        } else {
          throwError(state, "unknown escape sequence");
        }
        captureStart = captureEnd = state.position;
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a double quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a double quoted scalar");
  }
  function readFlowCollection(state, nodeIndent) {
    let readNext = true;
    let _line;
    let _lineStart;
    let _pos;
    const _tag = state.tag;
    let _result;
    const _anchor = state.anchor;
    let terminator;
    let isPair;
    let isExplicitPair;
    let isMapping;
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyNode;
    let keyTag;
    let valueNode;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 91) {
      terminator = 93;
      isMapping = false;
      _result = [];
    } else if (ch === 123) {
      terminator = 125;
      isMapping = true;
      _result = {};
    } else {
      return false;
    }
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    ch = state.input.charCodeAt(++state.position);
    while (ch !== 0) {
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === terminator) {
        state.position++;
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = isMapping ? "mapping" : "sequence";
        state.result = _result;
        return true;
      } else if (!readNext) {
        throwError(state, "missed comma between flow collection entries");
      } else if (ch === 44) {
        throwError(state, "expected the node content, but found ','");
      }
      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;
      if (ch === 63) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following)) {
          isPair = isExplicitPair = true;
          state.position++;
          skipSeparationSpace(state, true, nodeIndent);
        }
      }
      _line = state.line;
      _lineStart = state.lineStart;
      _pos = state.position;
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = state.tag;
      keyNode = state.result;
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if ((isExplicitPair || state.line === _line) && ch === 58) {
        isPair = true;
        ch = state.input.charCodeAt(++state.position);
        skipSeparationSpace(state, true, nodeIndent);
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = state.result;
      }
      if (isMapping) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
      } else if (isPair) {
        _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
      } else {
        _result.push(keyNode);
      }
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === 44) {
        readNext = true;
        ch = state.input.charCodeAt(++state.position);
      } else {
        readNext = false;
      }
    }
    throwError(state, "unexpected end of the stream within a flow collection");
  }
  function readBlockScalar(state, nodeIndent) {
    let folding;
    let chomping = CHOMPING_CLIP;
    let didReadContent = false;
    let detectedIndent = false;
    let textIndent = nodeIndent;
    let emptyLines = 0;
    let atMoreIndented = false;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 124) {
      folding = false;
    } else if (ch === 62) {
      folding = true;
    } else {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    while (ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
      if (ch === 43 || ch === 45) {
        if (CHOMPING_CLIP === chomping) {
          chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwError(state, "repeat of a chomping mode identifier");
        }
      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          throwError(state, "repeat of an indentation width identifier");
        }
      } else {
        break;
      }
    }
    if (isWhiteSpace(ch)) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (isWhiteSpace(ch));
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (!isEol(ch) && ch !== 0);
      }
    }
    while (ch !== 0) {
      readLineBreak(state);
      state.lineIndent = 0;
      ch = state.input.charCodeAt(state.position);
      while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
      if (!detectedIndent && state.lineIndent > textIndent) {
        textIndent = state.lineIndent;
      }
      if (isEol(ch)) {
        emptyLines++;
        continue;
      }
      if (!detectedIndent && textIndent === 0) {
        throwError(state, "missing indentation for block scalar");
      }
      if (state.lineIndent < textIndent) {
        if (chomping === CHOMPING_KEEP) {
          state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) {
            state.result += "\n";
          }
        }
        break;
      }
      if (folding) {
        if (isWhiteSpace(ch)) {
          atMoreIndented = true;
          state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        } else if (atMoreIndented) {
          atMoreIndented = false;
          state.result += common2.repeat("\n", emptyLines + 1);
        } else if (emptyLines === 0) {
          if (didReadContent) {
            state.result += " ";
          }
        } else {
          state.result += common2.repeat("\n", emptyLines);
        }
      } else {
        state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      }
      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      const captureStart = state.position;
      while (!isEol(ch) && ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, state.position, false);
    }
    return true;
  }
  function readBlockSequence(state, nodeIndent) {
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = [];
    let detected = false;
    if (state.firstTabInLine !== -1) return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      if (ch !== 45) {
        break;
      }
      const following = state.input.charCodeAt(state.position + 1);
      if (!isWsOrEol(following)) {
        break;
      }
      detected = true;
      state.position++;
      if (skipSeparationSpace(state, true, -1)) {
        if (state.lineIndent <= nodeIndent) {
          _result.push(null);
          ch = state.input.charCodeAt(state.position);
          continue;
        }
      }
      const _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(state.result);
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a sequence entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "sequence";
      state.result = _result;
      return true;
    }
    return false;
  }
  function readBlockMapping(state, nodeIndent, flowIndent) {
    let allowCompact;
    let _keyLine;
    let _keyLineStart;
    let _keyPos;
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = {};
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyTag = null;
    let keyNode = null;
    let valueNode = null;
    let atExplicitKey = false;
    let detected = false;
    if (state.firstTabInLine !== -1) return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (!atExplicitKey && state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      const following = state.input.charCodeAt(state.position + 1);
      const _line = state.line;
      if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
        if (ch === 63) {
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = true;
          allowCompact = true;
        } else if (atExplicitKey) {
          atExplicitKey = false;
          allowCompact = true;
        } else {
          throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
        }
        state.position += 1;
        ch = following;
      } else {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
        if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          break;
        }
        if (state.line === _line) {
          ch = state.input.charCodeAt(state.position);
          while (isWhiteSpace(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 58) {
            ch = state.input.charCodeAt(++state.position);
            if (!isWsOrEol(ch)) {
              throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
            }
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = state.tag;
            keyNode = state.result;
          } else if (detected) {
            throwError(state, "can not read an implicit mapping pair; a colon is missed");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else if (detected) {
          throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      }
      if (state.line === _line || state.lineIndent > nodeIndent) {
        if (atExplicitKey) {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
        }
        if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = state.result;
          } else {
            valueNode = state.result;
          }
        }
        if (!atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
      }
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a mapping entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (atExplicitKey) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "mapping";
      state.result = _result;
    }
    return detected;
  }
  function readTagProperty(state) {
    let isVerbatim = false;
    let isNamed = false;
    let tagHandle;
    let tagName;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 33) return false;
    if (state.tag !== null) {
      throwError(state, "duplication of a tag property");
    }
    ch = state.input.charCodeAt(++state.position);
    if (ch === 60) {
      isVerbatim = true;
      ch = state.input.charCodeAt(++state.position);
    } else if (ch === 33) {
      isNamed = true;
      tagHandle = "!!";
      ch = state.input.charCodeAt(++state.position);
    } else {
      tagHandle = "!";
    }
    let _position = state.position;
    if (isVerbatim) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0 && ch !== 62);
      if (state.position < state.length) {
        tagName = state.input.slice(_position, state.position);
        ch = state.input.charCodeAt(++state.position);
      } else {
        throwError(state, "unexpected end of the stream within a verbatim tag");
      }
    } else {
      while (ch !== 0 && !isWsOrEol(ch)) {
        if (ch === 33) {
          if (!isNamed) {
            tagHandle = state.input.slice(_position - 1, state.position + 1);
            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              throwError(state, "named tag handle cannot contain such characters");
            }
            isNamed = true;
            _position = state.position + 1;
          } else {
            throwError(state, "tag suffix cannot contain exclamation marks");
          }
        }
        ch = state.input.charCodeAt(++state.position);
      }
      tagName = state.input.slice(_position, state.position);
      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        throwError(state, "tag suffix cannot contain flow indicator characters");
      }
    }
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      throwError(state, "tag name cannot contain such characters: " + tagName);
    }
    try {
      tagName = decodeURIComponent(tagName);
    } catch (err) {
      throwError(state, "tag name is malformed: " + tagName);
    }
    if (isVerbatim) {
      state.tag = tagName;
    } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
      state.tag = state.tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
      state.tag = "!" + tagName;
    } else if (tagHandle === "!!") {
      state.tag = "tag:yaml.org,2002:" + tagName;
    } else {
      throwError(state, 'undeclared tag handle "' + tagHandle + '"');
    }
    return true;
  }
  function readAnchorProperty(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 38) return false;
    if (state.anchor !== null) {
      throwError(state, "duplication of an anchor property");
    }
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an anchor node must contain at least one character");
    }
    state.anchor = state.input.slice(_position, state.position);
    return true;
  }
  function readAlias(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 42) return false;
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an alias node must contain at least one character");
    }
    const alias = state.input.slice(_position, state.position);
    if (!_hasOwnProperty.call(state.anchorMap, alias)) {
      throwError(state, 'unidentified alias "' + alias + '"');
    }
    state.result = state.anchorMap[alias];
    skipSeparationSpace(state, true, -1);
    return true;
  }
  function tryReadBlockMappingFromProperty(state, propertyStart, nodeIndent, flowIndent) {
    const fallbackState = snapshotState(state);
    beginAnchorTransaction(state);
    restoreState(state, propertyStart);
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    if (readBlockMapping(state, nodeIndent, flowIndent) && state.kind === "mapping") {
      commitAnchorTransaction(state);
      return true;
    }
    rollbackAnchorTransaction(state);
    restoreState(state, fallbackState);
    return false;
  }
  function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    let allowBlockScalars;
    let allowBlockCollections;
    let indentStatus = 1;
    let atNewLine = false;
    let hasContent = false;
    let propertyStart = null;
    let type2;
    let flowIndent;
    let blockIndent;
    if (state.depth >= state.maxDepth) {
      throwError(state, "nesting exceeded maxDepth (" + state.maxDepth + ")");
    }
    state.depth += 1;
    if (state.listener !== null) {
      state.listener("open", state);
    }
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
    if (allowToSeek) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }
    if (indentStatus === 1) {
      while (true) {
        const ch = state.input.charCodeAt(state.position);
        const propertyState = snapshotState(state);
        if (atNewLine && (ch === 33 && state.tag !== null || ch === 38 && state.anchor !== null)) {
          break;
        }
        if (!readTagProperty(state) && !readAnchorProperty(state)) {
          break;
        }
        if (propertyStart === null) {
          propertyStart = propertyState;
        }
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }
    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }
    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }
      blockIndent = state.position - state.lineStart;
      if (indentStatus === 1) {
        if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
          hasContent = true;
        } else {
          const ch = state.input.charCodeAt(state.position);
          if (propertyStart !== null && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62 && tryReadBlockMappingFromProperty(
            state,
            propertyStart,
            propertyStart.position - propertyStart.lineStart,
            flowIndent
          )) {
            hasContent = true;
          } else if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
            hasContent = true;
          } else if (readAlias(state)) {
            hasContent = true;
            if (state.tag !== null || state.anchor !== null) {
              throwError(state, "alias node should not have any properties");
            }
          } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;
            if (state.tag === null) {
              state.tag = "?";
            }
          }
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
        }
      } else if (indentStatus === 0) {
        hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
      }
    }
    if (state.tag === null) {
      if (state.anchor !== null) {
        storeAnchor(state, state.anchor, state.result);
      }
    } else if (state.tag === "?") {
      if (state.result !== null && state.kind !== "scalar") {
        throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
      }
      for (let typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
        type2 = state.implicitTypes[typeIndex];
        if (type2.resolve(state.result)) {
          state.result = type2.construct(state.result);
          state.tag = type2.tag;
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
          break;
        }
      }
    } else if (state.tag !== "!") {
      if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
        type2 = state.typeMap[state.kind || "fallback"][state.tag];
      } else {
        type2 = null;
        const typeList = state.typeMap.multi[state.kind || "fallback"];
        for (let typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
          if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
            type2 = typeList[typeIndex];
            break;
          }
        }
      }
      if (!type2) {
        throwError(state, "unknown tag !<" + state.tag + ">");
      }
      if (state.result !== null && type2.kind !== state.kind) {
        throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
      }
      if (!type2.resolve(state.result, state.tag)) {
        throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
      } else {
        state.result = type2.construct(state.result, state.tag);
        if (state.anchor !== null) {
          storeAnchor(state, state.anchor, state.result);
        }
      }
    }
    if (state.listener !== null) {
      state.listener("close", state);
    }
    state.depth -= 1;
    return state.tag !== null || state.anchor !== null || hasContent;
  }
  function readDocument(state) {
    const documentStart = state.position;
    let hasDirectives = false;
    let ch;
    state.version = null;
    state.checkLineBreaks = state.legacy;
    state.tagMap = /* @__PURE__ */ Object.create(null);
    state.anchorMap = /* @__PURE__ */ Object.create(null);
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if (state.lineIndent > 0 || ch !== 37) {
        break;
      }
      hasDirectives = true;
      ch = state.input.charCodeAt(++state.position);
      let _position = state.position;
      while (ch !== 0 && !isWsOrEol(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      const directiveName = state.input.slice(_position, state.position);
      const directiveArgs = [];
      if (directiveName.length < 1) {
        throwError(state, "directive name must not be less than one character in length");
      }
      while (ch !== 0) {
        while (isWhiteSpace(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 0 && !isEol(ch));
          break;
        }
        if (isEol(ch)) break;
        _position = state.position;
        while (ch !== 0 && !isWsOrEol(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveArgs.push(state.input.slice(_position, state.position));
      }
      if (ch !== 0) readLineBreak(state);
      if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](state, directiveName, directiveArgs);
      } else {
        throwWarning(state, 'unknown document directive "' + directiveName + '"');
      }
    }
    skipSeparationSpace(state, true, -1);
    if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    } else if (hasDirectives) {
      throwError(state, "directives end mark is expected");
    }
    composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(state, true, -1);
    if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
      throwWarning(state, "non-ASCII line breaks are interpreted as content");
    }
    state.documents.push(state.result);
    if (state.position === state.lineStart && testDocumentSeparator(state)) {
      if (state.input.charCodeAt(state.position) === 46) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      }
      return;
    }
    if (state.position < state.length - 1) {
      throwError(state, "end of the stream or a document separator is expected");
    }
  }
  function loadDocuments(input, options) {
    input = String(input);
    options = options || {};
    if (input.length !== 0) {
      if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
        input += "\n";
      }
      if (input.charCodeAt(0) === 65279) {
        input = input.slice(1);
      }
    }
    const state = new State(input, options);
    const nullpos = input.indexOf("\0");
    if (nullpos !== -1) {
      state.position = nullpos;
      throwError(state, "null byte is not allowed in input");
    }
    state.input += "\0";
    while (state.input.charCodeAt(state.position) === 32) {
      state.lineIndent += 1;
      state.position += 1;
    }
    while (state.position < state.length - 1) {
      readDocument(state);
    }
    return state.documents;
  }
  function loadAll2(input, iterator, options) {
    if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
      options = iterator;
      iterator = null;
    }
    const documents = loadDocuments(input, options);
    if (typeof iterator !== "function") {
      return documents;
    }
    for (let index = 0, length = documents.length; index < length; index += 1) {
      iterator(documents[index]);
    }
  }
  function load2(input, options) {
    const documents = loadDocuments(input, options);
    if (documents.length === 0) {
      return void 0;
    } else if (documents.length === 1) {
      return documents[0];
    }
    throw new YAMLException2("expected a single document in the stream, but found more");
  }
  loader.loadAll = loadAll2;
  loader.load = load2;
  return loader;
}
var dumper = {};
var hasRequiredDumper;
function requireDumper() {
  if (hasRequiredDumper) return dumper;
  hasRequiredDumper = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const DEFAULT_SCHEMA2 = require_default();
  const _toString = Object.prototype.toString;
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CHAR_BOM = 65279;
  const CHAR_TAB = 9;
  const CHAR_LINE_FEED = 10;
  const CHAR_CARRIAGE_RETURN = 13;
  const CHAR_SPACE = 32;
  const CHAR_EXCLAMATION = 33;
  const CHAR_DOUBLE_QUOTE = 34;
  const CHAR_SHARP = 35;
  const CHAR_PERCENT = 37;
  const CHAR_AMPERSAND = 38;
  const CHAR_SINGLE_QUOTE = 39;
  const CHAR_ASTERISK = 42;
  const CHAR_COMMA = 44;
  const CHAR_MINUS = 45;
  const CHAR_COLON = 58;
  const CHAR_EQUALS = 61;
  const CHAR_GREATER_THAN = 62;
  const CHAR_QUESTION = 63;
  const CHAR_COMMERCIAL_AT = 64;
  const CHAR_LEFT_SQUARE_BRACKET = 91;
  const CHAR_RIGHT_SQUARE_BRACKET = 93;
  const CHAR_GRAVE_ACCENT = 96;
  const CHAR_LEFT_CURLY_BRACKET = 123;
  const CHAR_VERTICAL_LINE = 124;
  const CHAR_RIGHT_CURLY_BRACKET = 125;
  const ESCAPE_SEQUENCES = {};
  ESCAPE_SEQUENCES[0] = "\\0";
  ESCAPE_SEQUENCES[7] = "\\a";
  ESCAPE_SEQUENCES[8] = "\\b";
  ESCAPE_SEQUENCES[9] = "\\t";
  ESCAPE_SEQUENCES[10] = "\\n";
  ESCAPE_SEQUENCES[11] = "\\v";
  ESCAPE_SEQUENCES[12] = "\\f";
  ESCAPE_SEQUENCES[13] = "\\r";
  ESCAPE_SEQUENCES[27] = "\\e";
  ESCAPE_SEQUENCES[34] = '\\"';
  ESCAPE_SEQUENCES[92] = "\\\\";
  ESCAPE_SEQUENCES[133] = "\\N";
  ESCAPE_SEQUENCES[160] = "\\_";
  ESCAPE_SEQUENCES[8232] = "\\L";
  ESCAPE_SEQUENCES[8233] = "\\P";
  const DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ];
  const DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function compileStyleMap(schema2, map2) {
    if (map2 === null) return {};
    const result = {};
    const keys = Object.keys(map2);
    for (let index = 0, length = keys.length; index < length; index += 1) {
      let tag = keys[index];
      let style = String(map2[tag]);
      if (tag.slice(0, 2) === "!!") {
        tag = "tag:yaml.org,2002:" + tag.slice(2);
      }
      const type2 = schema2.compiledTypeMap["fallback"][tag];
      if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
        style = type2.styleAliases[style];
      }
      result[tag] = style;
    }
    return result;
  }
  function encodeHex(character) {
    let handle;
    let length;
    const string = character.toString(16).toUpperCase();
    if (character <= 255) {
      handle = "x";
      length = 2;
    } else if (character <= 65535) {
      handle = "u";
      length = 4;
    } else if (character <= 4294967295) {
      handle = "U";
      length = 8;
    } else {
      throw new YAMLException2("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return "\\" + handle + common2.repeat("0", length - string.length) + string;
  }
  const QUOTING_TYPE_SINGLE = 1;
  const QUOTING_TYPE_DOUBLE = 2;
  function State(options) {
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.indent = Math.max(1, options["indent"] || 2);
    this.noArrayIndent = options["noArrayIndent"] || false;
    this.skipInvalid = options["skipInvalid"] || false;
    this.flowLevel = common2.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
    this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
    this.sortKeys = options["sortKeys"] || false;
    this.lineWidth = options["lineWidth"] || 80;
    this.noRefs = options["noRefs"] || false;
    this.noCompatMode = options["noCompatMode"] || false;
    this.condenseFlow = options["condenseFlow"] || false;
    this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
    this.forceQuotes = options["forceQuotes"] || false;
    this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
    this.implicitTypes = this.schema.compiledImplicit;
    this.explicitTypes = this.schema.compiledExplicit;
    this.tag = null;
    this.result = "";
    this.duplicates = [];
    this.usedDuplicates = null;
  }
  function indentString(string, spaces) {
    const ind = common2.repeat(" ", spaces);
    let position = 0;
    let result = "";
    const length = string.length;
    while (position < length) {
      let line;
      const next = string.indexOf("\n", position);
      if (next === -1) {
        line = string.slice(position);
        position = length;
      } else {
        line = string.slice(position, next + 1);
        position = next + 1;
      }
      if (line.length && line !== "\n") result += ind;
      result += line;
    }
    return result;
  }
  function generateNextLine(state, level) {
    return "\n" + common2.repeat(" ", state.indent * level);
  }
  function testImplicitResolving(state, str2) {
    for (let index = 0, length = state.implicitTypes.length; index < length; index += 1) {
      const type2 = state.implicitTypes[index];
      if (type2.resolve(str2)) {
        return true;
      }
    }
    return false;
  }
  function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
  }
  function isPrintable(c) {
    return c >= 32 && c <= 126 || c >= 161 && c <= 55295 && c !== 8232 && c !== 8233 || c >= 57344 && c <= 65533 && c !== CHAR_BOM || c >= 65536 && c <= 1114111;
  }
  function isNsCharOrWhitespace(c) {
    return isPrintable(c) && c !== CHAR_BOM && // - b-char
    c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
  }
  function isPlainSafe(c, prev, inblock) {
    const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
    const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
    return (
      // ns-plain-safe
      (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && // - c-flow-indicator
      c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && // ns-plain-char
      c !== CHAR_SHARP && // false on '#'
      !(prev === CHAR_COLON && !cIsNsChar) || // false on ': '
      isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || // change to true on '[^ ]#'
      prev === CHAR_COLON && cIsNsChar
    );
  }
  function isPlainSafeFirst(c) {
    return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && // | “%” | “@” | “`”)
    c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
  }
  function isPlainSafeLast(c) {
    return !isWhitespace(c) && c !== CHAR_COLON;
  }
  function codePointAt(string, pos) {
    const first = string.charCodeAt(pos);
    let second;
    if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
      second = string.charCodeAt(pos + 1);
      if (second >= 56320 && second <= 57343) {
        return (first - 55296) * 1024 + second - 56320 + 65536;
      }
    }
    return first;
  }
  function needIndentIndicator(string) {
    const leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
  }
  const STYLE_PLAIN = 1;
  const STYLE_SINGLE = 2;
  const STYLE_LITERAL = 3;
  const STYLE_FOLDED = 4;
  const STYLE_DOUBLE = 5;
  function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
    let i;
    let char = 0;
    let prevChar = null;
    let hasLineBreak = false;
    let hasFoldableLine = false;
    const shouldTrackWidth = lineWidth !== -1;
    let previousLineBreak = -1;
    let plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
    if (singleLineOnly || forceQuotes) {
      for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
    } else {
      for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (char === CHAR_LINE_FEED) {
          hasLineBreak = true;
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
            i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
            previousLineBreak = i;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
      hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
    }
    if (!hasLineBreak && !hasFoldableLine) {
      if (plain && !forceQuotes && !testAmbiguousType(string)) {
        return STYLE_PLAIN;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    if (!forceQuotes) {
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  function writeScalar(state, string, level, iskey, inblock) {
    state.dump = (function() {
      if (string.length === 0) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
      }
      if (!state.noCompatMode) {
        if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
        }
      }
      const indent = state.indent * Math.max(1, level);
      const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
      const singleLineOnly = iskey || // No block styles in flow mode.
      state.flowLevel > -1 && level >= state.flowLevel;
      function testAmbiguity(string2) {
        return testImplicitResolving(state, string2);
      }
      switch (chooseScalarStyle(
        string,
        singleLineOnly,
        state.indent,
        lineWidth,
        testAmbiguity,
        state.quotingType,
        state.forceQuotes && !iskey,
        inblock
      )) {
        case STYLE_PLAIN:
          return string;
        case STYLE_SINGLE:
          return "'" + string.replace(/'/g, "''") + "'";
        case STYLE_LITERAL:
          return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
        case STYLE_FOLDED:
          return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
        case STYLE_DOUBLE:
          return '"' + escapeString(string) + '"';
        default:
          throw new YAMLException2("impossible error: invalid scalar style");
      }
    })();
  }
  function blockHeader(string, indentPerLevel) {
    const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    const clip = string[string.length - 1] === "\n";
    const keep = clip && (string[string.length - 2] === "\n" || string === "\n");
    const chomp = keep ? "+" : clip ? "" : "-";
    return indentIndicator + chomp + "\n";
  }
  function dropEndingNewline(string) {
    return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
  }
  function foldString(string, width) {
    const lineRe = /(\n+)([^\n]*)/g;
    let result = (function() {
      let nextLF = string.indexOf("\n");
      nextLF = nextLF !== -1 ? nextLF : string.length;
      lineRe.lastIndex = nextLF;
      return foldLine(string.slice(0, nextLF), width);
    })();
    let prevMoreIndented = string[0] === "\n" || string[0] === " ";
    let moreIndented;
    let match;
    while (match = lineRe.exec(string)) {
      const prefix = match[1];
      const line = match[2];
      moreIndented = line[0] === " ";
      result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
      prevMoreIndented = moreIndented;
    }
    return result;
  }
  function foldLine(line, width) {
    if (line === "" || line[0] === " ") return line;
    const breakRe = / [^ ]/g;
    let match;
    let start = 0;
    let end;
    let curr = 0;
    let next = 0;
    let result = "";
    while (match = breakRe.exec(line)) {
      next = match.index;
      if (next - start > width) {
        end = curr > start ? curr : next;
        result += "\n" + line.slice(start, end);
        start = end + 1;
      }
      curr = next;
    }
    result += "\n";
    if (line.length - start > width && curr > start) {
      result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
    } else {
      result += line.slice(start);
    }
    return result.slice(1);
  }
  function escapeString(string) {
    let result = "";
    let char = 0;
    for (let i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      const escapeSeq = ESCAPE_SEQUENCES[char];
      if (!escapeSeq && isPrintable(char)) {
        result += string[i];
        if (char >= 65536) result += string[i + 1];
      } else {
        result += escapeSeq || encodeHex(char);
      }
    }
    return result;
  }
  function writeFlowSequence(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length; index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
        if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = "[" + _result + "]";
  }
  function writeBlockSequence(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length; index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
        if (!compact || _result !== "") {
          _result += generateNextLine(state, level);
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          _result += "-";
        } else {
          _result += "- ";
        }
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = _result || "[]";
  }
  function writeFlowMapping(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
      let pairBuffer = "";
      if (_result !== "") pairBuffer += ", ";
      if (state.condenseFlow) pairBuffer += '"';
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level, objectKey, false, false)) {
        continue;
      }
      if (state.dump.length > 1024) pairBuffer += "? ";
      pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
      if (!writeNode(state, level, objectValue, false, false)) {
        continue;
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = "{" + _result + "}";
  }
  function writeBlockMapping(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    if (state.sortKeys === true) {
      objectKeyList.sort();
    } else if (typeof state.sortKeys === "function") {
      objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
      throw new YAMLException2("sortKeys must be a boolean or a function");
    }
    for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
      let pairBuffer = "";
      if (!compact || _result !== "") {
        pairBuffer += generateNextLine(state, level);
      }
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level + 1, objectKey, true, true, true)) {
        continue;
      }
      const explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += "?";
        } else {
          pairBuffer += "? ";
        }
      }
      pairBuffer += state.dump;
      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }
      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue;
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ":";
      } else {
        pairBuffer += ": ";
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}";
  }
  function detectType(state, object, explicit) {
    const typeList = explicit ? state.explicitTypes : state.implicitTypes;
    for (let index = 0, length = typeList.length; index < length; index += 1) {
      const type2 = typeList[index];
      if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
        if (explicit) {
          if (type2.multi && type2.representName) {
            state.tag = type2.representName(object);
          } else {
            state.tag = type2.tag;
          }
        } else {
          state.tag = "?";
        }
        if (type2.represent) {
          const style = state.styleMap[type2.tag] || type2.defaultStyle;
          let _result;
          if (_toString.call(type2.represent) === "[object Function]") {
            _result = type2.represent(object, style);
          } else if (_hasOwnProperty.call(type2.represent, style)) {
            _result = type2.represent[style](object, style);
          } else {
            throw new YAMLException2("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
          }
          state.dump = _result;
        }
        return true;
      }
    }
    return false;
  }
  function writeNode(state, level, object, block, compact, iskey, isblockseq) {
    state.tag = null;
    state.dump = object;
    if (!detectType(state, object, false)) {
      detectType(state, object, true);
    }
    const type2 = _toString.call(state.dump);
    const inblock = block;
    if (block) {
      block = state.flowLevel < 0 || state.flowLevel > level;
    }
    const objectOrArray = type2 === "[object Object]" || type2 === "[object Array]";
    let duplicateIndex;
    let duplicate;
    if (objectOrArray) {
      duplicateIndex = state.duplicates.indexOf(object);
      duplicate = duplicateIndex !== -1;
    }
    if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
      compact = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
      state.dump = "*ref_" + duplicateIndex;
    } else {
      if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
        state.usedDuplicates[duplicateIndex] = true;
      }
      if (type2 === "[object Object]") {
        if (block && Object.keys(state.dump).length !== 0) {
          writeBlockMapping(state, level, state.dump, compact);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowMapping(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object Array]") {
        if (block && state.dump.length !== 0) {
          if (state.noArrayIndent && !isblockseq && level > 0) {
            writeBlockSequence(state, level - 1, state.dump, compact);
          } else {
            writeBlockSequence(state, level, state.dump, compact);
          }
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowSequence(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object String]") {
        if (state.tag !== "?") {
          writeScalar(state, state.dump, level, iskey, inblock);
        }
      } else if (type2 === "[object Undefined]") {
        return false;
      } else {
        if (state.skipInvalid) return false;
        throw new YAMLException2("unacceptable kind of an object to dump " + type2);
      }
      if (state.tag !== null && state.tag !== "?") {
        let tagStr = encodeURI(
          state.tag[0] === "!" ? state.tag.slice(1) : state.tag
        ).replace(/!/g, "%21");
        if (state.tag[0] === "!") {
          tagStr = "!" + tagStr;
        } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
          tagStr = "!!" + tagStr.slice(18);
        } else {
          tagStr = "!<" + tagStr + ">";
        }
        state.dump = tagStr + " " + state.dump;
      }
    }
    return true;
  }
  function getDuplicateReferences(object, state) {
    const objects = [];
    const duplicatesIndexes = [];
    inspectNode(object, objects, duplicatesIndexes);
    const length = duplicatesIndexes.length;
    for (let index = 0; index < length; index += 1) {
      state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
  }
  function inspectNode(object, objects, duplicatesIndexes) {
    if (object !== null && typeof object === "object") {
      const index = objects.indexOf(object);
      if (index !== -1) {
        if (duplicatesIndexes.indexOf(index) === -1) {
          duplicatesIndexes.push(index);
        }
      } else {
        objects.push(object);
        if (Array.isArray(object)) {
          for (let i = 0, length = object.length; i < length; i += 1) {
            inspectNode(object[i], objects, duplicatesIndexes);
          }
        } else {
          const objectKeyList = Object.keys(object);
          for (let i = 0, length = objectKeyList.length; i < length; i += 1) {
            inspectNode(object[objectKeyList[i]], objects, duplicatesIndexes);
          }
        }
      }
    }
  }
  function dump2(input, options) {
    options = options || {};
    const state = new State(options);
    if (!state.noRefs) getDuplicateReferences(input, state);
    let value = input;
    if (state.replacer) {
      value = state.replacer.call({ "": value }, "", value);
    }
    if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
    return "";
  }
  dumper.dump = dump2;
  return dumper;
}
var hasRequiredJsYaml;
function requireJsYaml() {
  if (hasRequiredJsYaml) return jsYaml;
  hasRequiredJsYaml = 1;
  const loader2 = requireLoader();
  const dumper2 = requireDumper();
  function renamed(from, to) {
    return function() {
      throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
    };
  }
  jsYaml.Type = requireType();
  jsYaml.Schema = requireSchema();
  jsYaml.FAILSAFE_SCHEMA = requireFailsafe();
  jsYaml.JSON_SCHEMA = requireJson();
  jsYaml.CORE_SCHEMA = requireCore();
  jsYaml.DEFAULT_SCHEMA = require_default();
  jsYaml.load = loader2.load;
  jsYaml.loadAll = loader2.loadAll;
  jsYaml.dump = dumper2.dump;
  jsYaml.YAMLException = requireException();
  jsYaml.types = {
    binary: requireBinary(),
    float: requireFloat(),
    map: requireMap(),
    null: require_null(),
    pairs: requirePairs(),
    set: requireSet(),
    timestamp: requireTimestamp(),
    bool: requireBool(),
    int: requireInt(),
    merge: requireMerge(),
    omap: requireOmap(),
    seq: requireSeq(),
    str: requireStr()
  };
  jsYaml.safeLoad = renamed("safeLoad", "load");
  jsYaml.safeLoadAll = renamed("safeLoadAll", "loadAll");
  jsYaml.safeDump = renamed("safeDump", "dump");
  return jsYaml;
}
var jsYamlExports = requireJsYaml();
const yaml = /* @__PURE__ */ getDefaultExportFromCjs(jsYamlExports);
const {
  Type,
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SCHEMA,
  load,
  loadAll,
  dump,
  YAMLException,
  types,
  safeLoad,
  safeLoadAll,
  safeDump
} = yaml;
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  __defProp2(target, "default", { value: mod, enumerable: true }),
  mod
));
var require_session = __commonJS({
  "src/mock-data/session.json"(exports, module) {
    module.exports = {
      WeekendInfo: {
        TrackName: "summit summit raceway",
        TrackID: 9,
        TrackLength: "3.20 km",
        TrackDisplayName: "Summit Point Raceway",
        TrackDisplayShortName: "Summit",
        TrackConfigName: null,
        TrackCity: "Summit Point",
        TrackCountry: "USA",
        TrackAltitude: "191.90 m",
        TrackLatitude: "39.235223 m",
        TrackLongitude: "-77.969038 m",
        TrackNorthOffset: "0.2629 rad",
        TrackNumTurns: 10,
        TrackPitSpeedLimit: "72.00 kph",
        TrackType: "road course",
        TrackDirection: "neutral",
        TrackWeatherType: "Specified / Dynamic Sky",
        TrackSkies: "Partly Cloudy",
        TrackSurfaceTemp: "39.84 C",
        TrackAirTemp: "25.59 C",
        TrackAirPressure: "29.25 Hg",
        TrackWindVel: "0.89 m/s",
        TrackWindDir: "0.00 rad",
        TrackRelativeHumidity: "55 %",
        TrackFogLevel: "0 %",
        TrackCleanup: 1,
        TrackDynamicTrack: 1,
        TrackVersion: "2021.11.23.01",
        SeriesID: 139,
        SeasonID: 3472,
        SessionID: 168514551,
        SubSessionID: 43774550,
        LeagueID: 0,
        Official: 1,
        RaceWeek: 3,
        EventType: "Practice",
        Category: "Road",
        SimMode: "full",
        TeamRacing: 0,
        MinDrivers: 0,
        MaxDrivers: 1,
        DCRuleSet: "None",
        QualifierMustStartRace: 0,
        NumCarClasses: 1,
        NumCarTypes: 1,
        HeatRacing: 0,
        BuildType: "Release",
        BuildTarget: "Members",
        BuildVersion: "2021.12.13.01",
        WeekendOptions: {
          NumStarters: 12,
          StartingGrid: "2x2 inline pole on left",
          QualifyScoring: "best lap",
          CourseCautions: "off",
          StandingStart: 1,
          ShortParadeLap: 0,
          Restarts: "single file",
          WeatherType: "Specified / Dynamic Sky",
          Skies: "Partly Cloudy",
          WindDirection: "N",
          WindSpeed: "3.22 km/h",
          WeatherTemp: "25.56 C",
          RelativeHumidity: "55 %",
          FogLevel: "0 %",
          TimeOfDay: "1:00 pm",
          Date: "2022-03-01T00:00:00.000Z",
          EarthRotationSpeedupFactor: 1,
          Unofficial: 0,
          CommercialMode: "consumer",
          NightMode: "variable",
          IsFixedSetup: 1,
          StrictLapsChecking: "default",
          HasOpenRegistration: 1,
          HardcoreLevel: 1,
          NumJokerLaps: 0,
          IncidentLimit: "unlimited",
          FastRepairsLimit: 1,
          GreenWhiteCheckeredLimit: 0
        },
        TelemetryOptions: {
          TelemetryDiskFile: ""
        }
      },
      SessionInfo: {
        Sessions: [
          {
            SessionNum: 0,
            SessionLaps: "unlimited",
            SessionTime: "3600.0000 sec",
            SessionNumLapsToAvg: 0,
            SessionType: "Practice",
            SessionTrackRubberState: "moderate usage",
            SessionName: "PRACTICE",
            SessionSubType: null,
            SessionSkipped: 0,
            SessionRunGroupsUsed: 1,
            ResultsPositions: [
              {
                Position: 1,
                ClassPosition: 0,
                CarIdx: 32,
                Lap: 2,
                Time: 82.1089,
                FastestLap: 2,
                FastestTime: 82.1089,
                LastTime: 82.1089,
                LapsLed: 0,
                LapsComplete: 2,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 2,
                ClassPosition: 1,
                CarIdx: 39,
                Lap: 4,
                Time: 82.1781,
                FastestLap: 4,
                FastestTime: 82.1781,
                LastTime: 83.1204,
                LapsLed: 0,
                LapsComplete: 9,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 3,
                ClassPosition: 2,
                CarIdx: 9,
                Lap: 17,
                Time: 82.2969,
                FastestLap: 17,
                FastestTime: 82.2969,
                LastTime: 83.0484,
                LapsLed: 0,
                LapsComplete: 20,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 4,
                ClassPosition: 3,
                CarIdx: 43,
                Lap: 6,
                Time: 82.3555,
                FastestLap: 6,
                FastestTime: 82.3555,
                LastTime: 83.0428,
                LapsLed: 0,
                LapsComplete: 8,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 5,
                ClassPosition: 4,
                CarIdx: 25,
                Lap: 3,
                Time: 82.3997,
                FastestLap: 3,
                FastestTime: 82.3997,
                LastTime: 82.3997,
                LapsLed: 0,
                LapsComplete: 3,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 6,
                ClassPosition: 5,
                CarIdx: 5,
                Lap: 6,
                Time: 82.4232,
                FastestLap: 6,
                FastestTime: 82.4232,
                LastTime: 82.4232,
                LapsLed: 0,
                LapsComplete: 6,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 7,
                ClassPosition: 6,
                CarIdx: 1,
                Lap: 11,
                Time: 82.4978,
                FastestLap: 11,
                FastestTime: 82.4978,
                LastTime: 82.4978,
                LapsLed: 0,
                LapsComplete: 11,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 8,
                ClassPosition: 7,
                CarIdx: 22,
                Lap: 3,
                Time: 82.5084,
                FastestLap: 3,
                FastestTime: 82.5084,
                LastTime: -1,
                LapsLed: 0,
                LapsComplete: 11,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 9,
                ClassPosition: 8,
                CarIdx: 49,
                Lap: 4,
                Time: 82.6358,
                FastestLap: 4,
                FastestTime: 82.6358,
                LastTime: 83.0616,
                LapsLed: 0,
                LapsComplete: 7,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 10,
                ClassPosition: 9,
                CarIdx: 58,
                Lap: 2,
                Time: 82.845,
                FastestLap: 2,
                FastestTime: 82.845,
                LastTime: 83.6944,
                LapsLed: 0,
                LapsComplete: 4,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 11,
                ClassPosition: 10,
                CarIdx: 34,
                Lap: 3,
                Time: 82.8479,
                FastestLap: 3,
                FastestTime: 82.8479,
                LastTime: 84.4439,
                LapsLed: 0,
                LapsComplete: 6,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 12,
                ClassPosition: 11,
                CarIdx: 28,
                Lap: 6,
                Time: 82.8564,
                FastestLap: 6,
                FastestTime: 82.8564,
                LastTime: 83.3548,
                LapsLed: 0,
                LapsComplete: 8,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 13,
                ClassPosition: 12,
                CarIdx: 44,
                Lap: 2,
                Time: 82.9008,
                FastestLap: 2,
                FastestTime: 82.9008,
                LastTime: 85.9723,
                LapsLed: 0,
                LapsComplete: 8,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 14,
                ClassPosition: 13,
                CarIdx: 35,
                Lap: 10,
                Time: 82.9107,
                FastestLap: 10,
                FastestTime: 82.9107,
                LastTime: 84.6202,
                LapsLed: 0,
                LapsComplete: 11,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 15,
                ClassPosition: 14,
                CarIdx: 48,
                Lap: 3,
                Time: 83.0072,
                FastestLap: 3,
                FastestTime: 83.0072,
                LastTime: 84.072,
                LapsLed: 0,
                LapsComplete: 5,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 16,
                ClassPosition: 15,
                CarIdx: 7,
                Lap: 4,
                Time: 83.0836,
                FastestLap: 4,
                FastestTime: 83.0836,
                LastTime: 84.0239,
                LapsLed: 0,
                LapsComplete: 14,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 17,
                ClassPosition: 16,
                CarIdx: 38,
                Lap: 7,
                Time: 83.3481,
                FastestLap: 7,
                FastestTime: 83.3481,
                LastTime: 87.1419,
                LapsLed: 0,
                LapsComplete: 9,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 18,
                ClassPosition: 17,
                CarIdx: 2,
                Lap: 14,
                Time: 83.3491,
                FastestLap: 14,
                FastestTime: 83.3491,
                LastTime: 83.8275,
                LapsLed: 0,
                LapsComplete: 20,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 19,
                ClassPosition: 18,
                CarIdx: 41,
                Lap: 5,
                Time: 83.5168,
                FastestLap: 5,
                FastestTime: 83.5168,
                LastTime: 84.7073,
                LapsLed: 0,
                LapsComplete: 6,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 20,
                ClassPosition: 19,
                CarIdx: 19,
                Lap: 5,
                Time: 83.5744,
                FastestLap: 5,
                FastestTime: 83.5744,
                LastTime: 83.5964,
                LapsLed: 0,
                LapsComplete: 14,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 21,
                ClassPosition: 20,
                CarIdx: 40,
                Lap: 4,
                Time: 83.5744,
                FastestLap: 4,
                FastestTime: 83.5744,
                LastTime: 84.1106,
                LapsLed: 0,
                LapsComplete: 8,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 22,
                ClassPosition: 21,
                CarIdx: 11,
                Lap: 2,
                Time: 83.6628,
                FastestLap: 2,
                FastestTime: 83.6628,
                LastTime: 83.8433,
                LapsLed: 0,
                LapsComplete: 5,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 23,
                ClassPosition: 22,
                CarIdx: 29,
                Lap: 7,
                Time: 83.6908,
                FastestLap: 7,
                FastestTime: 83.6908,
                LastTime: 85.4311,
                LapsLed: 0,
                LapsComplete: 10,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 24,
                ClassPosition: 23,
                CarIdx: 24,
                Lap: 9,
                Time: 83.7735,
                FastestLap: 9,
                FastestTime: 83.7735,
                LastTime: 84.3539,
                LapsLed: 0,
                LapsComplete: 14,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 25,
                ClassPosition: 24,
                CarIdx: 50,
                Lap: 3,
                Time: 83.7838,
                FastestLap: 3,
                FastestTime: 83.7838,
                LastTime: 84.0927,
                LapsLed: 0,
                LapsComplete: 4,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 26,
                ClassPosition: 25,
                CarIdx: 15,
                Lap: 15,
                Time: 84.2387,
                FastestLap: 15,
                FastestTime: 84.2387,
                LastTime: 85.2745,
                LapsLed: 0,
                LapsComplete: 16,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 27,
                ClassPosition: 26,
                CarIdx: 31,
                Lap: 13,
                Time: 84.399,
                FastestLap: 13,
                FastestTime: 84.399,
                LastTime: 84.399,
                LapsLed: 0,
                LapsComplete: 13,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 28,
                ClassPosition: 27,
                CarIdx: 37,
                Lap: 5,
                Time: 84.445,
                FastestLap: 5,
                FastestTime: 84.445,
                LastTime: 84.9906,
                LapsLed: 0,
                LapsComplete: 8,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 29,
                ClassPosition: 28,
                CarIdx: 21,
                Lap: 6,
                Time: 84.5562,
                FastestLap: 6,
                FastestTime: 84.5562,
                LastTime: 84.5562,
                LapsLed: 0,
                LapsComplete: 6,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 30,
                ClassPosition: 29,
                CarIdx: 20,
                Lap: 2,
                Time: 84.7841,
                FastestLap: 2,
                FastestTime: 84.7841,
                LastTime: 85.0973,
                LapsLed: 0,
                LapsComplete: 4,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 31,
                ClassPosition: 30,
                CarIdx: 27,
                Lap: 5,
                Time: 84.9025,
                FastestLap: 5,
                FastestTime: 84.9025,
                LastTime: 84.9025,
                LapsLed: 0,
                LapsComplete: 5,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 32,
                ClassPosition: 31,
                CarIdx: 14,
                Lap: 4,
                Time: 85.075,
                FastestLap: 4,
                FastestTime: 85.075,
                LastTime: 95.3923,
                LapsLed: 0,
                LapsComplete: 15,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 33,
                ClassPosition: 32,
                CarIdx: 23,
                Lap: 2,
                Time: 85.1831,
                FastestLap: 2,
                FastestTime: 85.1831,
                LastTime: 85.1831,
                LapsLed: 0,
                LapsComplete: 2,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 34,
                ClassPosition: 33,
                CarIdx: 42,
                Lap: 7,
                Time: 85.2518,
                FastestLap: 7,
                FastestTime: 85.2518,
                LastTime: -1,
                LapsLed: 0,
                LapsComplete: 9,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 35,
                ClassPosition: 34,
                CarIdx: 30,
                Lap: 8,
                Time: 85.4542,
                FastestLap: 8,
                FastestTime: 85.4542,
                LastTime: 85.4542,
                LapsLed: 0,
                LapsComplete: 8,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 36,
                ClassPosition: 35,
                CarIdx: 10,
                Lap: 8,
                Time: 85.6686,
                FastestLap: 8,
                FastestTime: 85.6686,
                LastTime: 85.6686,
                LapsLed: 0,
                LapsComplete: 8,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 37,
                ClassPosition: 36,
                CarIdx: 0,
                Lap: 14,
                Time: 86.4834,
                FastestLap: 14,
                FastestTime: 86.4834,
                LastTime: 87.6193,
                LapsLed: 0,
                LapsComplete: 17,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 38,
                ClassPosition: 37,
                CarIdx: 57,
                Lap: 3,
                Time: 86.9174,
                FastestLap: 3,
                FastestTime: 86.9174,
                LastTime: 86.9174,
                LapsLed: 0,
                LapsComplete: 3,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 39,
                ClassPosition: 38,
                CarIdx: 56,
                Lap: 2,
                Time: 89.3987,
                FastestLap: 2,
                FastestTime: 89.3987,
                LastTime: 89.3987,
                LapsLed: 0,
                LapsComplete: 2,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 40,
                ClassPosition: 39,
                CarIdx: 51,
                Lap: 1,
                Time: 92.4342,
                FastestLap: 1,
                FastestTime: 92.4342,
                LastTime: 92.4342,
                LapsLed: 0,
                LapsComplete: 1,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 41,
                ClassPosition: 40,
                CarIdx: 16,
                Lap: 1,
                Time: 92.7628,
                FastestLap: 1,
                FastestTime: 92.7628,
                LastTime: 194.0017,
                LapsLed: 0,
                LapsComplete: 2,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              },
              {
                Position: 42,
                ClassPosition: 41,
                CarIdx: 36,
                Lap: 1,
                Time: 94.4501,
                FastestLap: 1,
                FastestTime: 94.4501,
                LastTime: 103.4856,
                LapsLed: 0,
                LapsComplete: 4,
                JokerLapsComplete: 0,
                LapsDriven: 0,
                Incidents: 0,
                ReasonOutId: 0,
                ReasonOutStr: "Running"
              }
            ],
            ResultsFastestLap: [
              {
                CarIdx: 32,
                FastestLap: 2,
                FastestTime: 82.1089
              }
            ],
            ResultsAverageLapTime: -1,
            ResultsNumCautionFlags: 0,
            ResultsNumCautionLaps: 0,
            ResultsNumLeadChanges: 0,
            ResultsLapsComplete: -1,
            ResultsOfficial: 0
          }
        ]
      },
      CameraInfo: {
        Groups: [
          {
            GroupNum: 1,
            GroupName: "Nose",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamNose"
              }
            ]
          },
          {
            GroupNum: 2,
            GroupName: "Gearbox",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamGearbox"
              }
            ]
          },
          {
            GroupNum: 3,
            GroupName: "Roll Bar",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamRoll Bar"
              }
            ]
          },
          {
            GroupNum: 4,
            GroupName: "LF Susp",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamLF Susp"
              }
            ]
          },
          {
            GroupNum: 5,
            GroupName: "LR Susp",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamLR Susp"
              }
            ]
          },
          {
            GroupNum: 6,
            GroupName: "Gyro",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamGyro"
              }
            ]
          },
          {
            GroupNum: 7,
            GroupName: "RF Susp",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamRF Susp"
              }
            ]
          },
          {
            GroupNum: 8,
            GroupName: "RR Susp",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamRR Susp"
              }
            ]
          },
          {
            GroupNum: 9,
            GroupName: "Cockpit",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamCockpit"
              }
            ]
          },
          {
            GroupNum: 10,
            GroupName: "Scenic",
            IsScenic: true,
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "Scenic_01"
              },
              {
                CameraNum: 2,
                CameraName: "Scenic_02"
              },
              {
                CameraNum: 3,
                CameraName: "Scenic_03"
              },
              {
                CameraNum: 4,
                CameraName: "Scenic_08"
              },
              {
                CameraNum: 5,
                CameraName: "Scenic_09"
              },
              {
                CameraNum: 6,
                CameraName: "Scenic_07"
              },
              {
                CameraNum: 7,
                CameraName: "Scenic_04"
              },
              {
                CameraNum: 8,
                CameraName: "Scenic_05"
              }
            ]
          },
          {
            GroupNum: 11,
            GroupName: "TV1",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamTV1_00"
              },
              {
                CameraNum: 2,
                CameraName: "CamTV1_00b"
              },
              {
                CameraNum: 3,
                CameraName: "CamTV1_01"
              },
              {
                CameraNum: 4,
                CameraName: "CamTV1_02b"
              },
              {
                CameraNum: 5,
                CameraName: "CamTV1_02"
              },
              {
                CameraNum: 6,
                CameraName: "CamTV1_04"
              },
              {
                CameraNum: 7,
                CameraName: "CamTV1_05"
              },
              {
                CameraNum: 8,
                CameraName: "CamTV1_06"
              },
              {
                CameraNum: 9,
                CameraName: "CamTV1_07"
              },
              {
                CameraNum: 10,
                CameraName: "CamTV1_07b"
              },
              {
                CameraNum: 11,
                CameraName: "CamTV1_03"
              },
              {
                CameraNum: 12,
                CameraName: "CamTV1_01b"
              }
            ]
          },
          {
            GroupNum: 12,
            GroupName: "TV2",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamTV2_00"
              },
              {
                CameraNum: 2,
                CameraName: "CamTV2_01b"
              },
              {
                CameraNum: 3,
                CameraName: "CamTV2_02b"
              },
              {
                CameraNum: 4,
                CameraName: "CamTV2_02"
              },
              {
                CameraNum: 5,
                CameraName: "CamTV2_03"
              },
              {
                CameraNum: 6,
                CameraName: "CamTV2_06"
              },
              {
                CameraNum: 7,
                CameraName: "CamTV2_04b"
              },
              {
                CameraNum: 8,
                CameraName: "CamTV2_04"
              },
              {
                CameraNum: 9,
                CameraName: "CamTV2_05"
              },
              {
                CameraNum: 10,
                CameraName: "CamTV2_08"
              },
              {
                CameraNum: 11,
                CameraName: "CamTV2_09"
              },
              {
                CameraNum: 12,
                CameraName: "CamTV2_09b"
              },
              {
                CameraNum: 13,
                CameraName: "CamTV2_07"
              },
              {
                CameraNum: 14,
                CameraName: "CamTV2_07b"
              },
              {
                CameraNum: 15,
                CameraName: "CamTV2_01"
              }
            ]
          },
          {
            GroupNum: 13,
            GroupName: "TV3",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamTV3_00"
              },
              {
                CameraNum: 2,
                CameraName: "CamTV3_02"
              },
              {
                CameraNum: 3,
                CameraName: "CamTV3_01"
              },
              {
                CameraNum: 4,
                CameraName: "CamTV3_02b"
              },
              {
                CameraNum: 5,
                CameraName: "CamTV3_03"
              },
              {
                CameraNum: 6,
                CameraName: "CamTV3_04"
              },
              {
                CameraNum: 7,
                CameraName: "CamTV3_06"
              },
              {
                CameraNum: 8,
                CameraName: "CamTV3_07"
              },
              {
                CameraNum: 9,
                CameraName: "CamTV3_08"
              },
              {
                CameraNum: 10,
                CameraName: "CamTV3_05"
              }
            ]
          },
          {
            GroupNum: 14,
            GroupName: "TV Static",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamTV4_01"
              },
              {
                CameraNum: 2,
                CameraName: "CamTV4_02"
              },
              {
                CameraNum: 3,
                CameraName: "CamTV4_03"
              },
              {
                CameraNum: 4,
                CameraName: "CamTV4_04"
              },
              {
                CameraNum: 5,
                CameraName: "CamTV4_05"
              },
              {
                CameraNum: 6,
                CameraName: "CamTV4_06"
              },
              {
                CameraNum: 7,
                CameraName: "CamTV4_07"
              },
              {
                CameraNum: 8,
                CameraName: "CamTV4_08"
              },
              {
                CameraNum: 9,
                CameraName: "CamTV4_09"
              },
              {
                CameraNum: 10,
                CameraName: "CamTV4_10"
              },
              {
                CameraNum: 11,
                CameraName: "CamTV4_11"
              },
              {
                CameraNum: 12,
                CameraName: "CamTV4_12"
              },
              {
                CameraNum: 13,
                CameraName: "CamTV4_13"
              },
              {
                CameraNum: 14,
                CameraName: "CamTV4_14"
              },
              {
                CameraNum: 15,
                CameraName: "CamTV4_15"
              },
              {
                CameraNum: 16,
                CameraName: "CamTV4_16"
              },
              {
                CameraNum: 17,
                CameraName: "CamTV4_13b"
              },
              {
                CameraNum: 18,
                CameraName: "CamTV4_00"
              }
            ]
          },
          {
            GroupNum: 15,
            GroupName: "TV Mixed",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamTV3_06"
              },
              {
                CameraNum: 2,
                CameraName: "CamTV1_00"
              },
              {
                CameraNum: 3,
                CameraName: "CamTV1_01"
              },
              {
                CameraNum: 4,
                CameraName: "CamTV2_01"
              },
              {
                CameraNum: 5,
                CameraName: "CamTV3_05"
              },
              {
                CameraNum: 6,
                CameraName: "CamTV1_05"
              },
              {
                CameraNum: 7,
                CameraName: "CamTV1_06"
              },
              {
                CameraNum: 8,
                CameraName: "CamTV1_07"
              },
              {
                CameraNum: 9,
                CameraName: "CamTV1_02b"
              },
              {
                CameraNum: 10,
                CameraName: "CamTV1_04"
              },
              {
                CameraNum: 11,
                CameraName: "CamTV2_00"
              },
              {
                CameraNum: 12,
                CameraName: "CamTV2_01b"
              },
              {
                CameraNum: 13,
                CameraName: "CamTV1_01b"
              },
              {
                CameraNum: 14,
                CameraName: "CamTV2_03"
              },
              {
                CameraNum: 15,
                CameraName: "CamTV2_06"
              },
              {
                CameraNum: 16,
                CameraName: "CamTV2_08"
              },
              {
                CameraNum: 17,
                CameraName: "CamTV2_09"
              },
              {
                CameraNum: 18,
                CameraName: "CamTV2_07"
              },
              {
                CameraNum: 19,
                CameraName: "CamTV2_02b"
              },
              {
                CameraNum: 20,
                CameraName: "CamTV2_02"
              },
              {
                CameraNum: 21,
                CameraName: "CamTV2_05"
              },
              {
                CameraNum: 22,
                CameraName: "CamTV2_04b"
              },
              {
                CameraNum: 23,
                CameraName: "CamTV3_00"
              },
              {
                CameraNum: 24,
                CameraName: "CamTV3_02"
              },
              {
                CameraNum: 25,
                CameraName: "CamTV3_02b"
              },
              {
                CameraNum: 26,
                CameraName: "CamTV1_03"
              },
              {
                CameraNum: 27,
                CameraName: "CamTV3_01"
              },
              {
                CameraNum: 28,
                CameraName: "CamTV3_08"
              },
              {
                CameraNum: 29,
                CameraName: "CamTV1_07b"
              },
              {
                CameraNum: 30,
                CameraName: "CamTV3_11"
              },
              {
                CameraNum: 31,
                CameraName: "CamTV2_04"
              },
              {
                CameraNum: 32,
                CameraName: "CamTV2_09b"
              },
              {
                CameraNum: 33,
                CameraName: "CamTV3_03"
              },
              {
                CameraNum: 34,
                CameraName: "CamTV3_04"
              },
              {
                CameraNum: 35,
                CameraName: "CamTV3_07"
              },
              {
                CameraNum: 36,
                CameraName: "CamRoll Bar"
              },
              {
                CameraNum: 37,
                CameraName: "CamTV1_00b"
              },
              {
                CameraNum: 38,
                CameraName: "CamTV4_10"
              },
              {
                CameraNum: 39,
                CameraName: "CamTV4_11"
              },
              {
                CameraNum: 40,
                CameraName: "CamTV4_00"
              }
            ]
          },
          {
            GroupNum: 16,
            GroupName: "Pit Lane 1",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamPit Lane Exit"
              },
              {
                CameraNum: 2,
                CameraName: "CamPit Lane Entry"
              }
            ]
          },
          {
            GroupNum: 17,
            GroupName: "Pit Lane 2",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamPit Lane 2"
              }
            ]
          },
          {
            GroupNum: 18,
            GroupName: "Blimp",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamBlimp"
              }
            ]
          },
          {
            GroupNum: 19,
            GroupName: "Chopper",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamChopper"
              }
            ]
          },
          {
            GroupNum: 20,
            GroupName: "Chase",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamChase"
              }
            ]
          },
          {
            GroupNum: 21,
            GroupName: "Far Chase",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamFar Chase"
              }
            ]
          },
          {
            GroupNum: 22,
            GroupName: "Rear Chase",
            Cameras: [
              {
                CameraNum: 1,
                CameraName: "CamRear Chase"
              }
            ]
          }
        ]
      },
      RadioInfo: {
        SelectedRadioNum: 0,
        Radios: [
          {
            RadioNum: 0,
            HopCount: 2,
            NumFrequencies: 6,
            TunedToFrequencyNum: 0,
            ScanningIsOn: 1,
            Frequencies: [
              {
                FrequencyNum: 0,
                FrequencyName: "@ALLTEAMS",
                Priority: 12,
                CarIdx: -1,
                EntryIdx: -1,
                ClubID: 0,
                CanScan: 1,
                CanSquawk: 1,
                Muted: 0,
                IsMutable: 1,
                IsDeletable: 0
              },
              {
                FrequencyNum: 1,
                FrequencyName: "@DRIVERS",
                Priority: 15,
                CarIdx: -1,
                EntryIdx: -1,
                ClubID: 0,
                CanScan: 1,
                CanSquawk: 1,
                Muted: 0,
                IsMutable: 1,
                IsDeletable: 0
              },
              {
                FrequencyNum: 2,
                FrequencyName: "@TEAM",
                Priority: 60,
                CarIdx: 51,
                EntryIdx: -1,
                ClubID: 0,
                CanScan: 1,
                CanSquawk: 1,
                Muted: 0,
                IsMutable: 0,
                IsDeletable: 0
              },
              {
                FrequencyNum: 3,
                FrequencyName: "@CLUB",
                Priority: 20,
                CarIdx: -1,
                EntryIdx: -1,
                ClubID: 44,
                CanScan: 1,
                CanSquawk: 1,
                Muted: 0,
                IsMutable: 1,
                IsDeletable: 0
              },
              {
                FrequencyNum: 4,
                FrequencyName: "@RACECONTROL",
                Priority: 80,
                CarIdx: -1,
                EntryIdx: -1,
                ClubID: 0,
                CanScan: 1,
                CanSquawk: 0,
                Muted: 0,
                IsMutable: 0,
                IsDeletable: 0
              },
              {
                FrequencyNum: 5,
                FrequencyName: "@PRIVATE",
                Priority: 70,
                CarIdx: -1,
                EntryIdx: 51,
                ClubID: 0,
                CanScan: 1,
                CanSquawk: 1,
                Muted: 0,
                IsMutable: 0,
                IsDeletable: 0
              }
            ]
          }
        ]
      },
      DriverInfo: {
        DriverCarIdx: 51,
        DriverUserID: 682111,
        PaceCarIdx: -1,
        DriverHeadPosX: -0.416,
        DriverHeadPosY: 0.344,
        DriverHeadPosZ: 0.66,
        DriverCarIdleRPM: 875,
        DriverCarRedLine: 7525,
        DriverCarEngCylinderCount: 4,
        DriverCarFuelKgPerLtr: 0.75,
        DriverCarFuelMaxLtr: 44.987,
        DriverCarMaxFuelPct: 1,
        DriverCarGearNumForward: 6,
        DriverCarGearNeutral: 1,
        DriverCarGearReverse: 1,
        DriverCarSLFirstRPM: 5600,
        DriverCarSLShiftRPM: 7200,
        DriverCarSLLastRPM: 7200,
        DriverCarSLBlinkRPM: 7700,
        DriverCarVersion: "2021.12.13.01",
        DriverPitTrkPct: 0.943749,
        DriverCarEstLapTime: 78.8351,
        DriverSetupName: "baseline.sto",
        DriverSetupIsModified: 0,
        DriverSetupLoadTypeName: "fixed",
        DriverSetupPassedTech: 1,
        DriverIncidentCount: 2,
        Drivers: [
          {
            CarIdx: 0,
            UserName: "Younghyun Lim",
            AbbrevName: "Lim, Y",
            Initials: "YL",
            UserID: 731711,
            TeamID: 0,
            TeamName: "Younghyun Lim",
            CarNumber: "1",
            CarNumberRaw: 1,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1350,
            LicLevel: 2,
            LicSubLevel: 250,
            LicString: "R 2.50",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,013990,ffffff,4bd3fd",
            HelmetDesignStr: "1,013990,ffffff,4bd3fd",
            SuitDesignStr: "1,013990,ffffff,4bd3fd",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Asia",
            ClubID: 47,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 1,
            UserName: "Tae Ho Yoon",
            AbbrevName: "Yoon, T",
            Initials: "TY",
            UserID: 698055,
            TeamID: 0,
            TeamName: "Tae Ho Yoon",
            CarNumber: "2",
            CarNumberRaw: 2,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1345,
            LicLevel: 6,
            LicSubLevel: 254,
            LicString: "D 2.54",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "1,111111,fc0706,ffffff",
            HelmetDesignStr: "1,111111,fc0706,ffffff",
            SuitDesignStr: "1,111111,fc0706,ffffff",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "California",
            ClubID: 6,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 2,
            UserName: "Ryan Stephenson",
            AbbrevName: "Stephenson, R",
            Initials: "RS",
            UserID: 686325,
            TeamID: 0,
            TeamName: "Ryan Stephenson",
            CarNumber: "3",
            CarNumberRaw: 3,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 985,
            LicLevel: 2,
            LicSubLevel: 222,
            LicString: "R 2.22",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,ed1c24,cccccc,111111",
            HelmetDesignStr: "1,ed1c24,cccccc,111111",
            SuitDesignStr: "1,ed1c24,cccccc,111111",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Northwest",
            ClubID: 33,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 3,
            UserName: "Ahmed Wardian",
            AbbrevName: "Wardian, A",
            Initials: "AW",
            UserID: 729378,
            TeamID: 0,
            TeamName: "Ahmed Wardian",
            CarNumber: "4",
            CarNumberRaw: 4,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1230,
            LicLevel: 2,
            LicSubLevel: 299,
            LicString: "R 2.99",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "10,e64c4c,1f2892,ffffff",
            HelmetDesignStr: "60,ee4c11,1f2892,ffffff",
            SuitDesignStr: "9,fa2f0b,fa0909,ffffff",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Canada",
            ClubID: 15,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 4,
            UserName: "Jeremy Charles",
            AbbrevName: "Charles, J",
            Initials: "JC",
            UserID: 705800,
            TeamID: 0,
            TeamName: "Jeremy Charles",
            CarNumber: "5",
            CarNumberRaw: 5,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 975,
            LicLevel: 6,
            LicSubLevel: 231,
            LicString: "D 2.31",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "11,db0808,41b8bf,000000",
            HelmetDesignStr: "45,000000,0fd6e3,910a0a",
            SuitDesignStr: "16,7b0f0f,111111,53fcf7",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "West",
            ClubID: 32,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 5,
            UserName: "Lautaro Espinosa",
            AbbrevName: "Espinosa, L",
            Initials: "LE",
            UserID: 719528,
            TeamID: 0,
            TeamName: "Lautaro Espinosa",
            CarNumber: "6",
            CarNumberRaw: 6,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 905,
            LicLevel: 6,
            LicSubLevel: 293,
            LicString: "D 2.93",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "15,949494,1c00ff,000000",
            HelmetDesignStr: "6,1c00ff,8d8d8d,000000",
            SuitDesignStr: "22,000000,868686,000aff",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Hispanoam�rica",
            ClubID: 24,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 6,
            UserName: "Ignacio Biondelli",
            AbbrevName: "Biondelli, I",
            Initials: "IB",
            UserID: 541718,
            TeamID: 0,
            TeamName: "Ignacio Biondelli",
            CarNumber: "12",
            CarNumberRaw: 12,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1253,
            LicLevel: 6,
            LicSubLevel: 217,
            LicString: "D 2.17",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "23,ffffff,ffffff,ffffff.000000",
            HelmetDesignStr: "36,0021ff,787878,ffffff",
            SuitDesignStr: "6,0079ff,ffffff,ffffff",
            CarNumberDesignStr: "0,0,000000,ffffff,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Hispanoam�rica",
            ClubID: 24,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 7,
            UserName: "Mart�n Pacheco",
            AbbrevName: "Pacheco, M",
            Initials: "MP",
            UserID: 700670,
            TeamID: 0,
            TeamName: "Mart�n Pacheco",
            CarNumber: "73",
            CarNumberRaw: 73,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1261,
            LicLevel: 6,
            LicSubLevel: 274,
            LicString: "D 2.74",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "12,ffffff,d70000,111111,ffffff",
            HelmetDesignStr: "30,ffffff,cd0000,111111",
            SuitDesignStr: "19,ffffff,cd0000,000000",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 142,
            CarSponsor_2: 130,
            ClubName: "Hispanoam�rica",
            ClubID: 24,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 8,
            UserName: "Rubens Silva",
            AbbrevName: "Silva, R",
            Initials: "RS",
            UserID: 675299,
            TeamID: 0,
            TeamName: "Rubens Silva",
            CarNumber: "9",
            CarNumberRaw: 9,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1129,
            LicLevel: 2,
            LicSubLevel: 293,
            LicString: "R 2.93",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "9,ff0000,000000,ffffff",
            HelmetDesignStr: "46,ff0000,000000,ffffff",
            SuitDesignStr: "22,ff0000,000000,ffffff",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Brazil",
            ClubID: 45,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 9,
            UserName: "Alexander Prentice",
            AbbrevName: "Prentice, A",
            Initials: "AP",
            UserID: 718469,
            TeamID: 0,
            TeamName: "Alexander Prentice",
            CarNumber: "10",
            CarNumberRaw: 10,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1518,
            LicLevel: 2,
            LicSubLevel: 286,
            LicString: "R 2.86",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "22,105ee3,63647c,f30f23",
            HelmetDesignStr: "37,1770e6,e84a4a,60616d",
            SuitDesignStr: "11,756767,e80f0f,142ccf",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Canada",
            ClubID: 15,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 10,
            UserName: "Dmitri Kuznetsov",
            AbbrevName: "Kuznetsov, D",
            Initials: "DK",
            UserID: 730368,
            TeamID: 0,
            TeamName: "Dmitri Kuznetsov",
            CarNumber: "11",
            CarNumberRaw: 11,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1359,
            LicLevel: 2,
            LicSubLevel: 298,
            LicString: "R 2.98",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,7de54c,1f2892,ffffff",
            HelmetDesignStr: "1,7de54c,1f2892,ffffff",
            SuitDesignStr: "1,7de54c,1f2892,ffffff",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Canada",
            ClubID: 15,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 11,
            UserName: "Austin Derosa",
            AbbrevName: "Derosa, A",
            Initials: "AD",
            UserID: 707793,
            TeamID: 0,
            TeamName: "Austin Derosa",
            CarNumber: "13",
            CarNumberRaw: 13,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1440,
            LicLevel: 6,
            LicSubLevel: 253,
            LicString: "D 2.53",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "13,686868,000000,ffffff",
            HelmetDesignStr: "18,ffffff,111111,ffffff",
            SuitDesignStr: "5,ffffff,111111,000000",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Florida",
            ClubID: 22,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 12,
            UserName: "Ren Bissonnette",
            AbbrevName: "Bissonnette, R",
            Initials: "RB",
            UserID: 698615,
            TeamID: 0,
            TeamName: "Ren Bissonnette",
            CarNumber: "14",
            CarNumberRaw: 14,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1246,
            LicLevel: 2,
            LicSubLevel: 284,
            LicString: "R 2.84",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "15,ffe604,330000,fd0000",
            HelmetDesignStr: "30,000000,000000,ff1f00",
            SuitDesignStr: "22,000000,ff4d00,f9f9f9",
            CarNumberDesignStr: "0,0,000000,ffffff,ffffff",
            CarSponsor_1: 10,
            CarSponsor_2: 97,
            ClubName: "Canada",
            ClubID: 15,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 13,
            UserName: "Dylan Ozturk",
            AbbrevName: "Ozturk, D",
            Initials: "DO",
            UserID: 714368,
            TeamID: 0,
            TeamName: "Dylan Ozturk",
            CarNumber: "15",
            CarNumberRaw: 15,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 770,
            LicLevel: 2,
            LicSubLevel: 245,
            LicString: "R 2.45",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,403738,cccccc,111111",
            HelmetDesignStr: "1,ed1c24,cccccc,111111",
            SuitDesignStr: "1,ed1c24,cccccc,111111",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Atlantic",
            ClubID: 18,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 14,
            UserName: "Morgan Raynal",
            AbbrevName: "Raynal, M",
            Initials: "MR",
            UserID: 731706,
            TeamID: 0,
            TeamName: "Morgan Raynal",
            CarNumber: "16",
            CarNumberRaw: 16,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1350,
            LicLevel: 2,
            LicSubLevel: 250,
            LicString: "R 2.50",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,d7162d,efd600,111111",
            HelmetDesignStr: "1,d7162d,efd600,111111",
            SuitDesignStr: "1,d7162d,efd600,111111",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "California",
            ClubID: 6,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 15,
            UserName: "Garrett Sandridge",
            AbbrevName: "Sandridge, G",
            Initials: "GS",
            UserID: 726274,
            TeamID: 0,
            TeamName: "Garrett Sandridge",
            CarNumber: "30",
            CarNumberRaw: 30,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 945,
            LicLevel: 2,
            LicSubLevel: 226,
            LicString: "R 2.26",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "12,0012ff,1800de,447ac0;0b00e5",
            HelmetDesignStr: "38,0019ff,ffe500,d4ff00",
            SuitDesignStr: "9,ee3442,ffffff,447ac0",
            CarNumberDesignStr: "0,0,ffe500,fffc00,f2ff00",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "California",
            ClubID: 6,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 16,
            UserName: "Richard Seguancia",
            AbbrevName: "Seguancia, R",
            Initials: "RS",
            UserID: 731145,
            TeamID: 0,
            TeamName: "Richard Seguancia",
            CarNumber: "17",
            CarNumberRaw: 17,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1261,
            LicLevel: 2,
            LicSubLevel: 263,
            LicString: "R 2.63",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,111111,284a94,b82f37",
            HelmetDesignStr: "1,111111,284a94,b82f37",
            SuitDesignStr: "1,111111,284a94,b82f37",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "West",
            ClubID: 32,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 17,
            UserName: "Davin Nolan",
            AbbrevName: "Nolan, D",
            Initials: "DN",
            UserID: 692646,
            TeamID: 0,
            TeamName: "Davin Nolan",
            CarNumber: "18",
            CarNumberRaw: 18,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1391,
            LicLevel: 5,
            LicSubLevel: 187,
            LicString: "D 1.87",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "15,00c3ff,000000,00abff",
            HelmetDesignStr: "18,ff0000,0022ff,000000",
            SuitDesignStr: "18,ff0000,0c00ff,000000",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Texas",
            ClubID: 30,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 18,
            UserName: "Chase McIntyre",
            AbbrevName: "McIntyre, C",
            Initials: "CM",
            UserID: 550740,
            TeamID: 0,
            TeamName: "Chase McIntyre",
            CarNumber: "19",
            CarNumberRaw: 19,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 880,
            LicLevel: 6,
            LicSubLevel: 253,
            LicString: "D 2.53",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "18,1773fc,c4ff00,c5ff03,000000",
            HelmetDesignStr: "63,1dffae,00ff9c,ffffff",
            SuitDesignStr: "22,ffffff,0decb0,fcfcfc",
            CarNumberDesignStr: "0,0,000000,ff0ff5,ffffff",
            CarSponsor_1: 190,
            CarSponsor_2: 106,
            ClubName: "Ohio",
            ClubID: 20,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 19,
            UserName: "Mason Best",
            AbbrevName: "Best, M",
            Initials: "MB",
            UserID: 729724,
            TeamID: 0,
            TeamName: "Mason Best",
            CarNumber: "20",
            CarNumberRaw: 20,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1229,
            LicLevel: 2,
            LicSubLevel: 225,
            LicString: "R 2.25",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,efd600,111111,d7162d",
            HelmetDesignStr: "1,efd600,111111,d7162d",
            SuitDesignStr: "1,efd600,111111,d7162d",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "West",
            ClubID: 32,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 20,
            UserName: "Michael Hill27",
            AbbrevName: "Hill27, M",
            Initials: "MH",
            UserID: 705850,
            TeamID: 0,
            TeamName: "Michael Hill27",
            CarNumber: "23",
            CarNumberRaw: 23,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 826,
            LicLevel: 7,
            LicSubLevel: 399,
            LicString: "D 3.99",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "8,ffffff,000000,ff0000",
            HelmetDesignStr: "36,ffffff,000000,ff0000",
            SuitDesignStr: "2,000000,ff0000,ffffff",
            CarNumberDesignStr: "0,0,000000,ffffff,ff0000",
            CarSponsor_1: 173,
            CarSponsor_2: 174,
            ClubName: "Pennsylvania",
            ClubID: 16,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 21,
            UserName: "Jacob Jang",
            AbbrevName: "Jang, J",
            Initials: "JJ",
            UserID: 723882,
            TeamID: 0,
            TeamName: "Jacob Jang",
            CarNumber: "22",
            CarNumberRaw: 22,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1350,
            LicLevel: 2,
            LicSubLevel: 250,
            LicString: "R 2.50",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "8,e1cfbb,000000,ffffff",
            HelmetDesignStr: "22,e1cfbb,000000,ffffff",
            SuitDesignStr: "1,000000,ffffff,e1cfbb",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Northwest",
            ClubID: 33,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 22,
            UserName: "Daniel Zhang3",
            AbbrevName: "Zhang3, D",
            Initials: "DZ",
            UserID: 726911,
            TeamID: 0,
            TeamName: "Daniel Zhang3",
            CarNumber: "95",
            CarNumberRaw: 95,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1349,
            LicLevel: 7,
            LicSubLevel: 382,
            LicString: "D 3.82",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "5,00fff7,ffffff,000000",
            HelmetDesignStr: "10,00ffb3,ffffff,000000",
            SuitDesignStr: "1,ffffff,000000,00ffd9",
            CarNumberDesignStr: "0,0,000000,ffffff,777777",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "California",
            ClubID: 6,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 23,
            UserName: "Marshall Dokuchie",
            AbbrevName: "Dokuchie, M",
            Initials: "MD",
            UserID: 728284,
            TeamID: 0,
            TeamName: "Marshall Dokuchie",
            CarNumber: "24",
            CarNumberRaw: 24,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1365,
            LicLevel: 7,
            LicSubLevel: 345,
            LicString: "D 3.45",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "1,135324,111111,5e5e5e",
            HelmetDesignStr: "32,f9f6f6,f90505,fa0404",
            SuitDesignStr: "13,ff0800,f7f5f5,ff0000",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Canada",
            ClubID: 15,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 24,
            UserName: "Libin Sun3",
            AbbrevName: "Sun3, L",
            Initials: "LS",
            UserID: 716634,
            TeamID: 0,
            TeamName: "Libin Sun3",
            CarNumber: "25",
            CarNumberRaw: 25,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1222,
            LicLevel: 8,
            LicSubLevel: 419,
            LicString: "D 4.19",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "1,bae11d,1d1fcf,4c2512",
            HelmetDesignStr: "32,e0c618,431ed7,b1541f",
            SuitDesignStr: "26,5cbe27,4fc138,3036b7",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Japan",
            ClubID: 48,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 25,
            UserName: "Lance Cameron",
            AbbrevName: "Cameron, L",
            Initials: "LC",
            UserID: 322402,
            TeamID: 0,
            TeamName: "Lance Cameron",
            CarNumber: "33",
            CarNumberRaw: 33,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1456,
            LicLevel: 10,
            LicSubLevel: 223,
            LicString: "C 2.23",
            LicColor: 16706564,
            IsSpectator: 0,
            CarDesignStr: "12,111111,00f40a,13eb00;1ee526",
            HelmetDesignStr: "1,ed1c24,111111,cccccc",
            SuitDesignStr: "1,ed1c24,111111,cccccc",
            CarNumberDesignStr: "0,0,0eec3f,000000,000000",
            CarSponsor_1: 141,
            CarSponsor_2: 141,
            ClubName: "Carolina",
            ClubID: 25,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 26,
            UserName: "Robert Jones8",
            AbbrevName: null,
            Initials: null,
            UserID: 128108,
            TeamID: 0,
            TeamName: "Robert Jones8",
            CarNumber: "27",
            CarNumberRaw: 27,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1202,
            LicLevel: 10,
            LicSubLevel: 245,
            LicString: "C 2.45",
            LicColor: 16706564,
            IsSpectator: 0,
            CarDesignStr: "5,e37edc,000000,e37edc,a91a97",
            HelmetDesignStr: "24,d3cd36,0f0b43,666666",
            SuitDesignStr: "21,666666,0f0b43,d3cd36",
            CarNumberDesignStr: "0,0,ffffff,ffffff,520707",
            CarSponsor_1: 209,
            CarSponsor_2: 209,
            ClubName: "Northwest",
            ClubID: 33,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 27,
            UserName: "Aaron Peters5",
            AbbrevName: "Peters5, A",
            Initials: "AP",
            UserID: 719768,
            TeamID: 0,
            TeamName: "Aaron Peters5",
            CarNumber: "28",
            CarNumberRaw: 28,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1440,
            LicLevel: 2,
            LicSubLevel: 262,
            LicString: "R 2.62",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,ed2129,ffffff,2a3795",
            HelmetDesignStr: "35,000000,800303,86681b",
            SuitDesignStr: "26,000000,000000,947c29",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Canada",
            ClubID: 15,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 28,
            UserName: "Dave Grey",
            AbbrevName: "Grey, D",
            Initials: "DG",
            UserID: 35581,
            TeamID: 0,
            TeamName: "Dave Grey",
            CarNumber: "72",
            CarNumberRaw: 72,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1234,
            LicLevel: 12,
            LicSubLevel: 434,
            LicString: "C 4.34",
            LicColor: 16706564,
            IsSpectator: 0,
            CarDesignStr: "1,f8e007,066ff9,066ff9",
            HelmetDesignStr: "22,e5d601,055ff3,055ff3",
            SuitDesignStr: "1,055ff3,222222,feec04",
            CarNumberDesignStr: "0,0,f8e007,066ff9,066ff9",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Midwest",
            ClubID: 29,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 29,
            UserName: "Ryan Delane",
            AbbrevName: "Delane, R",
            Initials: "RD",
            UserID: 730992,
            TeamID: 0,
            TeamName: "Ryan Delane",
            CarNumber: "31",
            CarNumberRaw: 31,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1274,
            LicLevel: 2,
            LicSubLevel: 265,
            LicString: "R 2.65",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,efd600,d7162d,111111",
            HelmetDesignStr: "2,efd600,d7162d,111111",
            SuitDesignStr: "2,efd600,d7162d,111111",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Northwest",
            ClubID: 33,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 30,
            UserName: "Zak Miston",
            AbbrevName: "Miston, Z",
            Initials: "ZM",
            UserID: 548346,
            TeamID: 0,
            TeamName: "Zak Miston",
            CarNumber: "761",
            CarNumberRaw: 761,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 865,
            LicLevel: 2,
            LicSubLevel: 263,
            LicString: "R 2.63",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "0,1c1c1c,f1edee,4e9c35,000000",
            HelmetDesignStr: "43,191b19,1c9d25,ced2d5",
            SuitDesignStr: "1,1c1d1c,0a0a0a,24d120",
            CarNumberDesignStr: "0,0,1c1c1c,4e9c35,f1eeee",
            CarSponsor_1: 11,
            CarSponsor_2: 51,
            ClubName: "Michigan",
            ClubID: 28,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 31,
            UserName: "David Dhamers",
            AbbrevName: "Dhamers, D",
            Initials: "DD",
            UserID: 628550,
            TeamID: 0,
            TeamName: "David Dhamers",
            CarNumber: "32",
            CarNumberRaw: 32,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1114,
            LicLevel: 6,
            LicSubLevel: 266,
            LicString: "D 2.66",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "21,ffffff,013990,ff0000",
            HelmetDesignStr: "4,ffffff,013990,4bd3fd",
            SuitDesignStr: "21,0500fd,ffffff,4bd3fd",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Northwest",
            ClubID: 33,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 32,
            UserName: "Suzuki Shun2",
            AbbrevName: "Shun2, S",
            Initials: "SS",
            UserID: 727185,
            TeamID: 0,
            TeamName: "Suzuki Shun2",
            CarNumber: "34",
            CarNumberRaw: 34,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1380,
            LicLevel: 2,
            LicSubLevel: 255,
            LicString: "R 2.55",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "23,f4f4f4,de7feb,000000",
            HelmetDesignStr: "40,a6a987,680264,ffffff",
            SuitDesignStr: "7,54034f,ffffff,bcba0b",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Japan",
            ClubID: 48,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 33,
            UserName: "Fernando Martinez6",
            AbbrevName: "Martinez6, F",
            Initials: "FM",
            UserID: 727021,
            TeamID: 0,
            TeamName: "Fernando Martinez6",
            CarNumber: "35",
            CarNumberRaw: 35,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 920,
            LicLevel: 2,
            LicSubLevel: 275,
            LicString: "R 2.75",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,ffffff,5481fc,111111",
            HelmetDesignStr: "1,ffffff,5481fc,111111",
            SuitDesignStr: "1,ffffff,5481fc,111111",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Illinois",
            ClubID: 26,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 34,
            UserName: "Ted Grupp",
            AbbrevName: "Grupp, T",
            Initials: "TG",
            UserID: 702266,
            TeamID: 0,
            TeamName: "Ted Grupp",
            CarNumber: "36",
            CarNumberRaw: 36,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1271,
            LicLevel: 7,
            LicSubLevel: 348,
            LicString: "D 3.48",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "1,ffffff,fc0706,111111",
            HelmetDesignStr: "1,ffffff,fc0706,111111",
            SuitDesignStr: "1,ffffff,fc0706,111111",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Pennsylvania",
            ClubID: 16,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 35,
            UserName: "Caleb Shaw2",
            AbbrevName: "Shaw2, C",
            Initials: "CS",
            UserID: 523767,
            TeamID: 0,
            TeamName: "Caleb Shaw2",
            CarNumber: "7",
            CarNumberRaw: 7,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1287,
            LicLevel: 7,
            LicSubLevel: 320,
            LicString: "D 3.20",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "18,ffffff,2a3795,ed2129",
            HelmetDesignStr: "35,891111,ffffff,fff5bc",
            SuitDesignStr: "30,000000,85baf5,8d1515",
            CarNumberDesignStr: "0,0,000000,ffffff,ffffff",
            CarSponsor_1: 7,
            CarSponsor_2: 151,
            ClubName: "Plains",
            ClubID: 31,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 36,
            UserName: "Brandon Lin2",
            AbbrevName: "Lin2, B",
            Initials: "BL",
            UserID: 707340,
            TeamID: 0,
            TeamName: "Brandon Lin2",
            CarNumber: "37",
            CarNumberRaw: 37,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1342,
            LicLevel: 2,
            LicSubLevel: 248,
            LicString: "R 2.48",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,5e5e5e,111111,135324",
            HelmetDesignStr: "2,ff0000,05ff00,faff00",
            SuitDesignStr: "1,5e5e5e,111111,135324",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Canada",
            ClubID: 15,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 37,
            UserName: "Clay Pollard",
            AbbrevName: "Pollard, C",
            Initials: "CP",
            UserID: 448744,
            TeamID: 0,
            TeamName: "Clay Pollard",
            CarNumber: "38",
            CarNumberRaw: 38,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1096,
            LicLevel: 6,
            LicSubLevel: 260,
            LicString: "D 2.60",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "1,f5f3ea,bb5207,f5f3ea,000000",
            HelmetDesignStr: "66,c85c09,ffffff,ffffff",
            SuitDesignStr: "4,ffffff,bd5705,ffffff",
            CarNumberDesignStr: "0,0,4f3b3b,000000,25221d",
            CarSponsor_1: 47,
            CarSponsor_2: 50,
            ClubName: "Texas",
            ClubID: 30,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 38,
            UserName: "Steven Brander",
            AbbrevName: "Brander, S",
            Initials: "SB",
            UserID: 724279,
            TeamID: 0,
            TeamName: "Steven Brander",
            CarNumber: "39",
            CarNumberRaw: 39,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1219,
            LicLevel: 2,
            LicSubLevel: 276,
            LicString: "R 2.76",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "15,111111,ee0505,080808",
            HelmetDesignStr: "61,111111,470cf2,1425f4",
            SuitDesignStr: "1,111111,070707,000000",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 107,
            CarSponsor_2: 147,
            ClubName: "Canada",
            ClubID: 15,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 39,
            UserName: "Dakota White",
            AbbrevName: "White, D",
            Initials: "DW",
            UserID: 389942,
            TeamID: 0,
            TeamName: "Dakota White",
            CarNumber: "40",
            CarNumberRaw: 40,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1657,
            LicLevel: 6,
            LicSubLevel: 229,
            LicString: "D 2.29",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "1,fc0706,ffffff,111111",
            HelmetDesignStr: "1,fc0706,ffffff,111111",
            SuitDesignStr: "1,fc0706,ffffff,111111",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Texas",
            ClubID: 30,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 40,
            UserName: "Taner Peterson",
            AbbrevName: "Peterson, T",
            Initials: "TP",
            UserID: 701890,
            TeamID: 0,
            TeamName: "Taner Peterson",
            CarNumber: "44",
            CarNumberRaw: 44,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 733,
            LicLevel: 7,
            LicSubLevel: 343,
            LicString: "D 3.43",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "10,000000,214375,ff7a00;dbdbdb",
            HelmetDesignStr: "62,131657,ffffff,ff0000",
            SuitDesignStr: "26,171f84,ffffff,ff0000",
            CarNumberDesignStr: "0,0,ffffff,080808,ed2229",
            CarSponsor_1: 98,
            CarSponsor_2: 1,
            ClubName: "Northwest",
            ClubID: 33,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 41,
            UserName: "James Mcbride4",
            AbbrevName: "Mcbride4, J",
            Initials: "JM",
            UserID: 679895,
            TeamID: 0,
            TeamName: "James Mcbride4",
            CarNumber: "234",
            CarNumberRaw: 234,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1350,
            LicLevel: 2,
            LicSubLevel: 294,
            LicString: "R 2.94",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "15,dddddd,542597,757575,9a9a9a",
            HelmetDesignStr: "64,dddddd,757575,542597",
            SuitDesignStr: "13,dddddd,542597,757575",
            CarNumberDesignStr: "0,0,ffffff,4e3981,9a9a9a",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Georgia",
            ClubID: 21,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 42,
            UserName: "Yizhou Wei",
            AbbrevName: "Wei, Y",
            Initials: "YW",
            UserID: 600242,
            TeamID: 0,
            TeamName: "Yizhou Wei",
            CarNumber: "43",
            CarNumberRaw: 43,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1265,
            LicLevel: 2,
            LicSubLevel: 229,
            LicString: "R 2.29",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,111111,ffffff,0ada00",
            HelmetDesignStr: "1,111111,ffffff,0ada00",
            SuitDesignStr: "1,111111,ffffff,0ada00",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "California",
            ClubID: 6,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 43,
            UserName: "Aaron Bockover",
            AbbrevName: "Bockover, A",
            Initials: "AB",
            UserID: 304136,
            TeamID: 0,
            TeamName: "Aaron Bockover",
            CarNumber: "45",
            CarNumberRaw: 45,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 2172,
            LicLevel: 12,
            LicSubLevel: 415,
            LicString: "C 4.15",
            LicColor: 16706564,
            IsSpectator: 0,
            CarDesignStr: "0,000000,000000,000000;ffffff",
            HelmetDesignStr: "47,ff0518,ffffff,000000",
            SuitDesignStr: "9,ffffff,e60000,000000",
            CarNumberDesignStr: "0,0,000000,fffafa,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Ohio",
            ClubID: 20,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 44,
            UserName: "Michel Mueller",
            AbbrevName: "Mueller, M",
            Initials: "MM",
            UserID: 729835,
            TeamID: 0,
            TeamName: "Michel Mueller",
            CarNumber: "46",
            CarNumberRaw: 46,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1247,
            LicLevel: 2,
            LicSubLevel: 255,
            LicString: "R 2.55",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,f26522,0a0a0a,00aeef",
            HelmetDesignStr: "59,f26522,0a0a0a,00aeef",
            SuitDesignStr: "1,f26522,0a0a0a,00aeef",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Canada",
            ClubID: 15,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 45,
            UserName: "Jonathan Covington",
            AbbrevName: "Covington, J",
            Initials: "JC",
            UserID: 378691,
            TeamID: 0,
            TeamName: "Jonathan Covington",
            CarNumber: "47",
            CarNumberRaw: 47,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 900,
            LicLevel: 10,
            LicSubLevel: 221,
            LicString: "C 2.21",
            LicColor: 16706564,
            IsSpectator: 0,
            CarDesignStr: "15,6cb14b,000000,d6eb1d;1c401e",
            HelmetDesignStr: "35,000000,a1db24,000000",
            SuitDesignStr: "25,8fcc38,000000,93a549",
            CarNumberDesignStr: "0,0,000000,f3ea19,ffffff",
            CarSponsor_1: 124,
            CarSponsor_2: 49,
            ClubName: "Atlantic",
            ClubID: 18,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 46,
            UserName: "Tony Patterson2",
            AbbrevName: "Patterson2, T",
            Initials: "TP",
            UserID: 712897,
            TeamID: 0,
            TeamName: "Tony Patterson2",
            CarNumber: "41",
            CarNumberRaw: 41,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1153,
            LicLevel: 6,
            LicSubLevel: 217,
            LicString: "D 2.17",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "0,fad1d1,000000,ffffff,ffffff",
            HelmetDesignStr: "60,111111,d809a4,7b00a6",
            SuitDesignStr: "2,111111,3ae5ee,f7f7f7",
            CarNumberDesignStr: "0,0,f4f4f4,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Indiana",
            ClubID: 27,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 47,
            UserName: "Andrius Juskevicius",
            AbbrevName: "Juskevicius, A",
            Initials: "AJ",
            UserID: 731088,
            TeamID: 0,
            TeamName: "Andrius Juskevicius",
            CarNumber: "48",
            CarNumberRaw: 48,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1247,
            LicLevel: 2,
            LicSubLevel: 258,
            LicString: "R 2.58",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,284a94,b82f37,111111",
            HelmetDesignStr: "1,284a94,b82f37,111111",
            SuitDesignStr: "1,284a94,b82f37,111111",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "West",
            ClubID: 32,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 48,
            UserName: "Ric Rocamora",
            AbbrevName: "Rocamora, R",
            Initials: "RR",
            UserID: 467022,
            TeamID: 0,
            TeamName: "Ric Rocamora",
            CarNumber: "49",
            CarNumberRaw: 49,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 696,
            LicLevel: 11,
            LicSubLevel: 314,
            LicString: "C 3.14",
            LicColor: 16706564,
            IsSpectator: 0,
            CarDesignStr: "21,722ed1,ffcf00,000000,722ed1",
            HelmetDesignStr: "1,722ed1,000000,ffffff",
            SuitDesignStr: "8,722ed1,000000,ffffff",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "West",
            ClubID: 32,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 49,
            UserName: "Michael Ross",
            AbbrevName: "Ross, M",
            Initials: "MR",
            UserID: 41276,
            TeamID: 0,
            TeamName: "Michael Ross",
            CarNumber: "420",
            CarNumberRaw: 420,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1462,
            LicLevel: 8,
            LicSubLevel: 477,
            LicString: "D 4.77",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "20,fefbfb,ee1e1b,000000",
            HelmetDesignStr: "1,020202,feb405,c75b00",
            SuitDesignStr: "5,000000,d59810,000000",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "California",
            ClubID: 6,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 50,
            UserName: "Gilbert Witchel",
            AbbrevName: "Witchel, G",
            Initials: "GW",
            UserID: 503154,
            TeamID: 0,
            TeamName: "Gilbert Witchel",
            CarNumber: "51",
            CarNumberRaw: 51,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1355,
            LicLevel: 19,
            LicSubLevel: 355,
            LicString: "A 3.55",
            LicColor: 87003,
            IsSpectator: 0,
            CarDesignStr: "8,0487f3,fd001e,f6f6f6;f1a025",
            HelmetDesignStr: "61,07b8f9,ef0629,ebd407",
            SuitDesignStr: "30,0ca8f5,ec0202,f4ecec",
            CarNumberDesignStr: "0,0,f4f411,171616,444040",
            CarSponsor_1: 131,
            CarSponsor_2: 131,
            ClubName: "Florida",
            ClubID: 22,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 51,
            UserName: "Matthew Bengston2",
            AbbrevName: "Bengston2, M",
            Initials: "MB",
            UserID: 682111,
            TeamID: 0,
            TeamName: "Matthew Bengston2",
            CarNumber: "64",
            CarNumberRaw: 64,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1937,
            LicLevel: 11,
            LicSubLevel: 356,
            LicString: "C 3.56",
            LicColor: 16706564,
            IsSpectator: 0,
            CarDesignStr: "0,000000,173768,23486a,ffffff",
            HelmetDesignStr: "10,061e60,7284f9,000000",
            SuitDesignStr: "14,000000,0c024f,5174cf",
            CarNumberDesignStr: "0,0,000000,7aadef,000000",
            CarSponsor_1: 165,
            CarSponsor_2: 1,
            ClubName: "Finland",
            ClubID: 44,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: 2,
            TeamIncidentCount: 2
          },
          {
            CarIdx: 52,
            UserName: "Nathan Belch",
            AbbrevName: "Belch, N",
            Initials: "NB",
            UserID: 608056,
            TeamID: 0,
            TeamName: "Nathan Belch",
            CarNumber: "53",
            CarNumberRaw: 53,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 339,
            LicLevel: 14,
            LicSubLevel: 202,
            LicString: "B 2.02",
            LicColor: 50946,
            IsSpectator: 0,
            CarDesignStr: "10,f70f0f,090909,0feb13",
            HelmetDesignStr: "28,2a3795,ffffff,ed2129",
            SuitDesignStr: "25,2a3795,ffffff,ed2129",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 145,
            CarSponsor_2: 208,
            ClubName: "California",
            ClubID: 6,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 53,
            UserName: "Sammy Oudghiri-Michaud",
            AbbrevName: "Oudghiri-Michaud, S",
            Initials: "SO",
            UserID: 722130,
            TeamID: 0,
            TeamName: "Sammy Oudghiri-Michaud",
            CarNumber: "54",
            CarNumberRaw: 54,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1508,
            LicLevel: 7,
            LicSubLevel: 336,
            LicString: "D 3.36",
            LicColor: 16550439,
            IsSpectator: 0,
            CarDesignStr: "1,ffffff,2a3795,ed2129,079572",
            HelmetDesignStr: "1,ffffff,2a3795,ed2129",
            SuitDesignStr: "1,ffffff,2a3795,ed2129",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Canada",
            ClubID: 15,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 54,
            UserName: "Josh Dills",
            AbbrevName: "Dills, J",
            Initials: "JD",
            UserID: 439559,
            TeamID: 0,
            TeamName: "Josh Dills",
            CarNumber: "55",
            CarNumberRaw: 55,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1078,
            LicLevel: 15,
            LicSubLevel: 332,
            LicString: "B 3.32",
            LicColor: 50946,
            IsSpectator: 0,
            CarDesignStr: "16,181616,32eba3,cf24de;1de6c2",
            HelmetDesignStr: "35,848484,6e6e6e,950000",
            SuitDesignStr: "26,000000,686868,b00000",
            CarNumberDesignStr: "0,0,181616,25934f,ede931",
            CarSponsor_1: 175,
            CarSponsor_2: 98,
            ClubName: "Indiana",
            ClubID: 27,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 55,
            UserName: "Joshua Cooper7",
            AbbrevName: "Cooper7, J",
            Initials: "JC",
            UserID: 672950,
            TeamID: 0,
            TeamName: "Joshua Cooper7",
            CarNumber: "719",
            CarNumberRaw: 719,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1197,
            LicLevel: 11,
            LicSubLevel: 323,
            LicString: "C 3.23",
            LicColor: 16706564,
            IsSpectator: 0,
            CarDesignStr: "2,ffffff,7a7bde,00c9ff,000000",
            HelmetDesignStr: "39,000000,ff0303,910000",
            SuitDesignStr: "28,000000,000000,bd0000",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 106,
            CarSponsor_2: 97,
            ClubName: "Indiana",
            ClubID: 27,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 56,
            UserName: "Richard Poulin",
            AbbrevName: "Poulin, R",
            Initials: "RP",
            UserID: 358924,
            TeamID: 0,
            TeamName: "Richard Poulin",
            CarNumber: "57",
            CarNumberRaw: 57,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1214,
            LicLevel: 17,
            LicSubLevel: 163,
            LicString: "A 1.63",
            LicColor: 87003,
            IsSpectator: 0,
            CarDesignStr: "15,ffffff,ffffff,fcf4f7;ae1840",
            HelmetDesignStr: "24,338f9b,2f3d3d,000000",
            SuitDesignStr: "3,338f9b,e7f8f9,000000",
            CarNumberDesignStr: "0,0,b5505f,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Canada",
            ClubID: 15,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 57,
            UserName: "Lucas Rombola",
            AbbrevName: "Rombola, L",
            Initials: "LR",
            UserID: 408355,
            TeamID: 0,
            TeamName: "Lucas Rombola",
            CarNumber: "58",
            CarNumberRaw: 58,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 1350,
            LicLevel: 2,
            LicSubLevel: 250,
            LicString: "R 2.50",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,0300c2,111111,ffee47",
            HelmetDesignStr: "35,59f8fc,ff38fe,ff33fe",
            SuitDesignStr: "3,000000,000000,1ffffb",
            CarNumberDesignStr: "0,0,ffffff,777777,000000",
            CarSponsor_1: 0,
            CarSponsor_2: 0,
            ClubName: "Hispanoam�rica",
            ClubID: 24,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          },
          {
            CarIdx: 58,
            UserName: "Aaron Braverman",
            AbbrevName: "Braverman, A",
            Initials: "AB",
            UserID: 49974,
            TeamID: 0,
            TeamName: "Aaron Braverman",
            CarNumber: "59",
            CarNumberRaw: 59,
            CarPath: "mx5 mx52016",
            CarClassID: 74,
            CarID: 67,
            CarIsPaceCar: 0,
            CarIsAI: 0,
            CarScreenName: "Mazda MX-5 Cup",
            CarScreenNameShort: "MX-5 Cup",
            CarClassShortName: "MX5 Cup 2016",
            CarClassRelSpeed: 35,
            CarClassLicenseLevel: 0,
            CarClassMaxFuelPct: "1.000 %",
            CarClassWeightPenalty: "0.000 kg",
            CarClassPowerAdjust: "0.000 %",
            CarClassDryTireSetLimit: "0 %",
            CarClassColor: 16777215,
            CarClassEstLapTime: 78.8351,
            IRating: 420,
            LicLevel: 2,
            LicSubLevel: 233,
            LicString: "R 2.33",
            LicColor: 16516870,
            IsSpectator: 0,
            CarDesignStr: "1,da2525,000000,345acb,000000",
            HelmetDesignStr: "9,3553f0,111111,ffffff",
            SuitDesignStr: "18,3569f0,080505,ffffff",
            CarNumberDesignStr: "0,0,003180,ffffff,000000",
            CarSponsor_1: 97,
            CarSponsor_2: 2,
            ClubName: "California",
            ClubID: 6,
            DivisionName: "Division 1",
            DivisionID: 0,
            CurDriverIncidentCount: -1,
            TeamIncidentCount: -1
          }
        ]
      },
      SplitTimeInfo: {
        Sectors: [
          {
            SectorNum: 0,
            SectorStartPct: 0
          },
          {
            SectorNum: 1,
            SectorStartPct: 0.4672
          },
          {
            SectorNum: 2,
            SectorStartPct: 0.803916
          }
        ]
      },
      CarSetup: {
        UpdateCount: 1,
        Suspension: {
          Front: {
            ToeIn: "-1 mm",
            CrossWeight: "50.0%",
            AntiRollBar: "Med"
          },
          LeftFront: {
            ColdPressure: "207 kPa",
            LastHotPressure: "207 kPa",
            LastTempsOMI: "39C, 39C, 39C",
            TreadRemaining: "100%, 100%, 100%",
            CornerWeight: "2692 N",
            RideHeight: "123 mm",
            SpringPerchOffset: "65 mm",
            BumpStiffness: "+3 clicks",
            ReboundStiffness: "+8 clicks",
            Camber: "-2.8 deg"
          },
          LeftRear: {
            ColdPressure: "207 kPa",
            LastHotPressure: "207 kPa",
            LastTempsOMI: "39C, 39C, 39C",
            TreadRemaining: "100%, 100%, 100%",
            CornerWeight: "2441 N",
            RideHeight: "123 mm",
            SpringPerchOffset: "40 mm",
            BumpStiffness: "+1 clicks",
            ReboundStiffness: "+9 clicks",
            Camber: "-2.8 deg"
          },
          RightFront: {
            ColdPressure: "207 kPa",
            LastHotPressure: "207 kPa",
            LastTempsIMO: "39C, 39C, 39C",
            TreadRemaining: "100%, 100%, 100%",
            CornerWeight: "2463 N",
            RideHeight: "123 mm",
            SpringPerchOffset: "70 mm",
            BumpStiffness: "+3 clicks",
            ReboundStiffness: "+8 clicks",
            Camber: "-2.8 deg"
          },
          RightRear: {
            ColdPressure: "207 kPa",
            LastHotPressure: "207 kPa",
            LastTempsIMO: "39C, 39C, 39C",
            TreadRemaining: "100%, 100%, 100%",
            CornerWeight: "2206 N",
            RideHeight: "124 mm",
            SpringPerchOffset: "46 mm",
            BumpStiffness: "+1 clicks",
            ReboundStiffness: "+9 clicks",
            Camber: "-2.8 deg"
          },
          Rear: {
            FuelLevel: "31.4 L",
            ToeIn: "+4 mm",
            AntiRollBar: "Unhooked"
          }
        }
      }
    };
  }
});
var require_telemetry = __commonJS({
  "src/mock-data/telemetry.json"(exports, module) {
    module.exports = {
      SessionTime: {
        countAsTime: false,
        length: 1,
        name: "SessionTime",
        description: "Seconds since session start",
        unit: "s",
        varType: 5,
        value: [
          2128.8999593106078
        ]
      },
      SessionTick: {
        countAsTime: false,
        length: 1,
        name: "SessionTick",
        description: "Current update number",
        unit: "",
        varType: 2,
        value: [
          85735
        ]
      },
      SessionNum: {
        countAsTime: false,
        length: 1,
        name: "SessionNum",
        description: "Session number",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      SessionState: {
        countAsTime: false,
        length: 1,
        name: "SessionState",
        description: "Session state",
        unit: "irsdk_SessionState",
        varType: 2,
        value: [
          4
        ]
      },
      SessionUniqueID: {
        countAsTime: false,
        length: 1,
        name: "SessionUniqueID",
        description: "Session ID",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      SessionFlags: {
        countAsTime: false,
        length: 1,
        name: "SessionFlags",
        description: "Session flags",
        unit: "irsdk_Flags",
        varType: 3,
        value: [
          268697600
        ]
      },
      SessionTimeRemain: {
        countAsTime: false,
        length: 1,
        name: "SessionTimeRemain",
        description: "Seconds left till session ends",
        unit: "s",
        varType: 5,
        value: [
          1471.1167073560591
        ]
      },
      SessionLapsRemain: {
        countAsTime: false,
        length: 1,
        name: "SessionLapsRemain",
        description: "Old laps left till session ends use SessionLapsRemainEx",
        unit: "",
        varType: 2,
        value: [
          32767
        ]
      },
      SessionLapsRemainEx: {
        countAsTime: false,
        length: 1,
        name: "SessionLapsRemainEx",
        description: "New improved laps left till session ends",
        unit: "",
        varType: 2,
        value: [
          32767
        ]
      },
      SessionTimeTotal: {
        countAsTime: false,
        length: 1,
        name: "SessionTimeTotal",
        description: "Total number of seconds in session",
        unit: "s",
        varType: 5,
        value: [
          3600
        ]
      },
      SessionLapsTotal: {
        countAsTime: false,
        length: 1,
        name: "SessionLapsTotal",
        description: "Total number of laps in session",
        unit: "",
        varType: 2,
        value: [
          32767
        ]
      },
      SessionJokerLapsRemain: {
        countAsTime: false,
        length: 1,
        name: "SessionJokerLapsRemain",
        description: "Joker laps remaining to be taken",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      SessionOnJokerLap: {
        countAsTime: false,
        length: 1,
        name: "SessionOnJokerLap",
        description: "Player is currently completing a joker lap",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      SessionTimeOfDay: {
        countAsTime: false,
        length: 1,
        name: "SessionTimeOfDay",
        description: "Time of day in seconds",
        unit: "s",
        varType: 4,
        value: [
          48928
        ]
      },
      RadioTransmitCarIdx: {
        countAsTime: false,
        length: 1,
        name: "RadioTransmitCarIdx",
        description: "The car index of the current person speaking on the radio",
        unit: "",
        varType: 2,
        value: [
          -1
        ]
      },
      RadioTransmitRadioIdx: {
        countAsTime: false,
        length: 1,
        name: "RadioTransmitRadioIdx",
        description: "The radio index of the current person speaking on the radio",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      RadioTransmitFrequencyIdx: {
        countAsTime: false,
        length: 1,
        name: "RadioTransmitFrequencyIdx",
        description: "The frequency index of the current person speaking on the radio",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      DisplayUnits: {
        countAsTime: false,
        length: 1,
        name: "DisplayUnits",
        description: "Default units for the user interface 0 = english 1 = metric",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      DriverMarker: {
        countAsTime: false,
        length: 1,
        name: "DriverMarker",
        description: "Driver activated flag",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      PushToPass: {
        countAsTime: false,
        length: 1,
        name: "PushToPass",
        description: "Push to pass button state",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      ManualBoost: {
        countAsTime: false,
        length: 1,
        name: "ManualBoost",
        description: "Hybrid manual boost state",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      ManualNoBoost: {
        countAsTime: false,
        length: 1,
        name: "ManualNoBoost",
        description: "Hybrid manual no boost state",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      IsOnTrack: {
        countAsTime: false,
        length: 1,
        name: "IsOnTrack",
        description: "1=Car on track physics running with player in car",
        unit: "",
        varType: 1,
        value: [
          true
        ]
      },
      IsReplayPlaying: {
        countAsTime: false,
        length: 1,
        name: "IsReplayPlaying",
        description: "0=replay not playing  1=replay playing",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      ReplayFrameNum: {
        countAsTime: false,
        length: 1,
        name: "ReplayFrameNum",
        description: "Integer replay frame number (60 per second)",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      ReplayFrameNumEnd: {
        countAsTime: false,
        length: 1,
        name: "ReplayFrameNumEnd",
        description: "Integer replay frame number from end of tape",
        unit: "",
        varType: 2,
        value: [
          26465
        ]
      },
      IsDiskLoggingEnabled: {
        countAsTime: false,
        length: 1,
        name: "IsDiskLoggingEnabled",
        description: "0=disk based telemetry turned off  1=turned on",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      IsDiskLoggingActive: {
        countAsTime: false,
        length: 1,
        name: "IsDiskLoggingActive",
        description: "0=disk based telemetry file not being written  1=being written",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      FrameRate: {
        countAsTime: false,
        length: 1,
        name: "FrameRate",
        description: "Average frames per second",
        unit: "fps",
        varType: 4,
        value: [
          111.19877624511719
        ]
      },
      CpuUsageFG: {
        countAsTime: false,
        length: 1,
        name: "CpuUsageFG",
        description: "Percent of available tim fg thread took with a 1 sec avg",
        unit: "%",
        varType: 4,
        value: [
          0.5374245643615723
        ]
      },
      GpuUsage: {
        countAsTime: false,
        length: 1,
        name: "GpuUsage",
        description: "Percent of available tim gpu took with a 1 sec avg",
        unit: "%",
        varType: 4,
        value: [
          0.3938755691051483
        ]
      },
      ChanAvgLatency: {
        countAsTime: false,
        length: 1,
        name: "ChanAvgLatency",
        description: "Communications average latency",
        unit: "s",
        varType: 4,
        value: [
          0
        ]
      },
      ChanLatency: {
        countAsTime: false,
        length: 1,
        name: "ChanLatency",
        description: "Communications latency",
        unit: "s",
        varType: 4,
        value: [
          0
        ]
      },
      ChanQuality: {
        countAsTime: false,
        length: 1,
        name: "ChanQuality",
        description: "Communications quality",
        unit: "%",
        varType: 4,
        value: [
          0
        ]
      },
      ChanPartnerQuality: {
        countAsTime: false,
        length: 1,
        name: "ChanPartnerQuality",
        description: "Partner communications quality",
        unit: "%",
        varType: 4,
        value: [
          0
        ]
      },
      CpuUsageBG: {
        countAsTime: false,
        length: 1,
        name: "CpuUsageBG",
        description: "Percent of available tim bg thread took with a 1 sec avg",
        unit: "%",
        varType: 4,
        value: [
          0.2590002417564392
        ]
      },
      ChanClockSkew: {
        countAsTime: false,
        length: 1,
        name: "ChanClockSkew",
        description: "Communications server clock skew",
        unit: "s",
        varType: 4,
        value: [
          0
        ]
      },
      MemPageFaultSec: {
        countAsTime: false,
        length: 1,
        name: "MemPageFaultSec",
        description: "Memory page faults per second",
        unit: "",
        varType: 4,
        value: [
          0
        ]
      },
      PlayerCarPosition: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarPosition",
        description: "Players position in race",
        unit: "",
        varType: 2,
        value: [
          40
        ]
      },
      PlayerCarClassPosition: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarClassPosition",
        description: "Players class position in race",
        unit: "",
        varType: 2,
        value: [
          40
        ]
      },
      PlayerCarClass: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarClass",
        description: "Player car class id",
        unit: "",
        varType: 2,
        value: [
          74
        ]
      },
      PlayerTrackSurface: {
        countAsTime: false,
        length: 1,
        name: "PlayerTrackSurface",
        description: "Players car track surface type",
        unit: "irsdk_TrkLoc",
        varType: 2,
        value: [
          3
        ]
      },
      PlayerTrackSurfaceMaterial: {
        countAsTime: false,
        length: 1,
        name: "PlayerTrackSurfaceMaterial",
        description: "Players car track surface material type",
        unit: "irsdk_TrkSurf",
        varType: 2,
        value: [
          1
        ]
      },
      PlayerCarIdx: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarIdx",
        description: "Players carIdx",
        unit: "",
        varType: 2,
        value: [
          51
        ]
      },
      PlayerCarTeamIncidentCount: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarTeamIncidentCount",
        description: "Players team incident count for this session",
        unit: "",
        varType: 2,
        value: [
          2
        ]
      },
      PlayerCarMyIncidentCount: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarMyIncidentCount",
        description: "Players own incident count for this session",
        unit: "",
        varType: 2,
        value: [
          2
        ]
      },
      PlayerCarDriverIncidentCount: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarDriverIncidentCount",
        description: "Teams current drivers incident count for this session",
        unit: "",
        varType: 2,
        value: [
          2
        ]
      },
      PlayerCarWeightPenalty: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarWeightPenalty",
        description: "Players weight penalty",
        unit: "kg",
        varType: 4,
        value: [
          0
        ]
      },
      PlayerCarPowerAdjust: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarPowerAdjust",
        description: "Players power adjust",
        unit: "%",
        varType: 4,
        value: [
          0
        ]
      },
      PlayerCarDryTireSetLimit: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarDryTireSetLimit",
        description: "Players dry tire set limit",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      PlayerCarTowTime: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarTowTime",
        description: "Players car is being towed if time is greater than zero",
        unit: "s",
        varType: 4,
        value: [
          0
        ]
      },
      PlayerCarInPitStall: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarInPitStall",
        description: "Players car is properly in there pitstall",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      PlayerCarPitSvStatus: {
        countAsTime: false,
        length: 1,
        name: "PlayerCarPitSvStatus",
        description: "Players car pit service status bits",
        unit: "irsdk_PitSvStatus",
        varType: 2,
        value: [
          0
        ]
      },
      PlayerTireCompound: {
        countAsTime: false,
        length: 1,
        name: "PlayerTireCompound",
        description: "Players car current tire compound",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      PlayerFastRepairsUsed: {
        countAsTime: false,
        length: 1,
        name: "PlayerFastRepairsUsed",
        description: "Players car number of fast repairs used",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      CarIdxLap: {
        countAsTime: false,
        length: 64,
        name: "CarIdxLap",
        description: "Laps started by car index",
        unit: "",
        varType: 2,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          2,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          5,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxLapCompleted: {
        countAsTime: false,
        length: 64,
        name: "CarIdxLapCompleted",
        description: "Laps completed by car index",
        unit: "",
        varType: 2,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          4,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxLapDistPct: {
        countAsTime: false,
        length: 64,
        name: "CarIdxLapDistPct",
        description: "Percentage distance around lap by car index",
        unit: "%",
        varType: 4,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          0.6695664525032043,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          0.5726780295372009,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxTrackSurface: {
        countAsTime: false,
        length: 64,
        name: "CarIdxTrackSurface",
        description: "Track surface type by car index",
        unit: "irsdk_TrkLoc",
        varType: 2,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          3,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          0,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxTrackSurfaceMaterial: {
        countAsTime: false,
        length: 64,
        name: "CarIdxTrackSurfaceMaterial",
        description: "Track surface material type by car index",
        unit: "irsdk_TrkSurf",
        varType: 2,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          19,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxOnPitRoad: {
        countAsTime: false,
        length: 64,
        name: "CarIdxOnPitRoad",
        description: "On pit road between the cones by car index",
        unit: "",
        varType: 1,
        value: [
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false
        ]
      },
      CarIdxPosition: {
        countAsTime: false,
        length: 64,
        name: "CarIdxPosition",
        description: "Cars position in race by car index",
        unit: "",
        varType: 2,
        value: [
          37,
          7,
          18,
          0,
          0,
          6,
          0,
          16,
          0,
          3,
          36,
          22,
          0,
          0,
          32,
          26,
          41,
          0,
          0,
          20,
          30,
          29,
          8,
          33,
          24,
          5,
          0,
          31,
          12,
          23,
          35,
          27,
          1,
          0,
          11,
          14,
          42,
          28,
          17,
          2,
          21,
          19,
          34,
          4,
          13,
          0,
          0,
          0,
          15,
          9,
          25,
          40,
          0,
          0,
          0,
          0,
          39,
          38,
          10,
          0,
          0,
          0,
          0,
          0
        ]
      },
      CarIdxClassPosition: {
        countAsTime: false,
        length: 64,
        name: "CarIdxClassPosition",
        description: "Cars class position in race by car index",
        unit: "",
        varType: 2,
        value: [
          37,
          7,
          18,
          0,
          0,
          6,
          0,
          16,
          0,
          3,
          36,
          22,
          0,
          0,
          32,
          26,
          41,
          0,
          0,
          20,
          30,
          29,
          8,
          33,
          24,
          5,
          0,
          31,
          12,
          23,
          35,
          27,
          1,
          0,
          11,
          14,
          42,
          28,
          17,
          2,
          21,
          19,
          34,
          4,
          13,
          0,
          0,
          0,
          15,
          9,
          25,
          40,
          0,
          0,
          0,
          0,
          39,
          38,
          10,
          0,
          0,
          0,
          0,
          0
        ]
      },
      CarIdxClass: {
        countAsTime: false,
        length: 64,
        name: "CarIdxClass",
        description: "Cars class id by car index",
        unit: "",
        varType: 2,
        value: [
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          74,
          -1,
          -1,
          -1,
          -1,
          74
        ]
      },
      CarIdxF2Time: {
        countAsTime: false,
        length: 64,
        name: "CarIdxF2Time",
        description: "Race time behind leader or fastest lap time otherwise",
        unit: "s",
        varType: 4,
        value: [
          86.4833984375,
          82.497802734375,
          83.3490982055664,
          0,
          0,
          82.42320251464844,
          0,
          83.08360290527344,
          0,
          82.2968978881836,
          85.6686019897461,
          83.66280364990234,
          0,
          0,
          85.07499694824219,
          84.23870086669922,
          92.76280212402344,
          0,
          0,
          83.57440185546875,
          84.78410339355469,
          84.55619812011719,
          82.5083999633789,
          85.18309783935547,
          83.77349853515625,
          82.39969635009766,
          0,
          84.90249633789062,
          82.85639953613281,
          83.69080352783203,
          85.4542007446289,
          84.39900207519531,
          82.10890197753906,
          0,
          82.847900390625,
          82.91069793701172,
          94.45010375976562,
          84.44499969482422,
          83.34809875488281,
          82.1781005859375,
          83.57440185546875,
          83.51679992675781,
          85.25180053710938,
          82.35549926757812,
          82.90080261230469,
          0,
          0,
          0,
          83.0072021484375,
          82.63580322265625,
          83.78379821777344,
          92.43419647216797,
          0,
          0,
          0,
          0,
          89.39869689941406,
          86.91739654541016,
          82.84500122070312,
          0,
          0,
          0,
          0,
          0
        ]
      },
      CarIdxEstTime: {
        countAsTime: false,
        length: 64,
        name: "CarIdxEstTime",
        description: "Estimated time to reach current location on track",
        unit: "s",
        varType: 4,
        value: [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          54.892845153808594,
          0,
          0,
          0,
          0,
          0,
          0,
          45.19312286376953,
          0,
          0,
          0,
          0,
          0
        ]
      },
      CarIdxLastLapTime: {
        countAsTime: false,
        length: 64,
        name: "CarIdxLastLapTime",
        description: "Cars last lap time",
        unit: "s",
        varType: 4,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          92.43419647216797,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          83.69439697265625,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxBestLapTime: {
        countAsTime: false,
        length: 64,
        name: "CarIdxBestLapTime",
        description: "Cars best lap time",
        unit: "s",
        varType: 4,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          92.43419647216797,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          82.84500122070312,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxBestLapNum: {
        countAsTime: false,
        length: 64,
        name: "CarIdxBestLapNum",
        description: "Cars best lap number",
        unit: "",
        varType: 2,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          2,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxTireCompound: {
        countAsTime: false,
        length: 64,
        name: "CarIdxTireCompound",
        description: "Cars current tire compound",
        unit: "",
        varType: 2,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          0,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          0,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxQualTireCompound: {
        countAsTime: false,
        length: 64,
        name: "CarIdxQualTireCompound",
        description: "Cars Qual tire compound",
        unit: "",
        varType: 2,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxQualTireCompoundLocked: {
        countAsTime: false,
        length: 64,
        name: "CarIdxQualTireCompoundLocked",
        description: "Cars Qual tire compound is locked-in",
        unit: "",
        varType: 1,
        value: [
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false
        ]
      },
      CarIdxFastRepairsUsed: {
        countAsTime: false,
        length: 64,
        name: "CarIdxFastRepairsUsed",
        description: "How many fast repairs each car has used",
        unit: "",
        varType: 2,
        value: [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      PaceMode: {
        countAsTime: false,
        length: 1,
        name: "PaceMode",
        description: "Are we pacing or not",
        unit: "irsdk_PaceMode",
        varType: 2,
        value: [
          4
        ]
      },
      CarIdxPaceLine: {
        countAsTime: false,
        length: 64,
        name: "CarIdxPaceLine",
        description: "What line cars are pacing in  or -1 if not pacing",
        unit: "",
        varType: 2,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxPaceRow: {
        countAsTime: false,
        length: 64,
        name: "CarIdxPaceRow",
        description: "What row cars are pacing in  or -1 if not pacing",
        unit: "",
        varType: 2,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxPaceFlags: {
        countAsTime: false,
        length: 64,
        name: "CarIdxPaceFlags",
        description: "Pacing status flags for each car",
        unit: "irsdk_PaceFlags",
        varType: 2,
        value: [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      OnPitRoad: {
        countAsTime: false,
        length: 1,
        name: "OnPitRoad",
        description: "Is the player car on pit road between the cones",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      CarIdxSteer: {
        countAsTime: false,
        length: 64,
        name: "CarIdxSteer",
        description: "Steering wheel angle by car index",
        unit: "rad",
        varType: 4,
        value: [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          -0.9681287407875061,
          0,
          0,
          0,
          0,
          0,
          0,
          -2.016707181930542,
          0,
          0,
          0,
          0,
          0
        ]
      },
      CarIdxRPM: {
        countAsTime: false,
        length: 64,
        name: "CarIdxRPM",
        description: "Engine rpm by car index",
        unit: "revs/min",
        varType: 4,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          6705.1787109375,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          6399.41455078125,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      CarIdxGear: {
        countAsTime: false,
        length: 64,
        name: "CarIdxGear",
        description: "-1=reverse  0=neutral  1..n=current gear by car index",
        unit: "",
        varType: 2,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          2,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          2,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      SteeringWheelAngle: {
        countAsTime: false,
        length: 1,
        name: "SteeringWheelAngle",
        description: "Steering wheel angle",
        unit: "rad",
        varType: 4,
        value: [
          -0.9681287407875061
        ]
      },
      Throttle: {
        countAsTime: false,
        length: 1,
        name: "Throttle",
        description: "0=off throttle to 1=full throttle",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      Brake: {
        countAsTime: false,
        length: 1,
        name: "Brake",
        description: "0=brake released to 1=max pedal force",
        unit: "%",
        varType: 4,
        value: [
          0
        ]
      },
      Clutch: {
        countAsTime: false,
        length: 1,
        name: "Clutch",
        description: "0=disengaged to 1=fully engaged",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      Gear: {
        countAsTime: false,
        length: 1,
        name: "Gear",
        description: "-1=reverse  0=neutral  1..n=current gear",
        unit: "",
        varType: 2,
        value: [
          2
        ]
      },
      RPM: {
        countAsTime: false,
        length: 1,
        name: "RPM",
        description: "Engine rpm",
        unit: "revs/min",
        varType: 4,
        value: [
          6705.1787109375
        ]
      },
      Lap: {
        countAsTime: false,
        length: 1,
        name: "Lap",
        description: "Laps started count",
        unit: "",
        varType: 2,
        value: [
          2
        ]
      },
      LapCompleted: {
        countAsTime: false,
        length: 1,
        name: "LapCompleted",
        description: "Laps completed count",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      LapDist: {
        countAsTime: false,
        length: 1,
        name: "LapDist",
        description: "Meters traveled from S/F this lap",
        unit: "m",
        varType: 4,
        value: [
          2140.6865234375
        ]
      },
      LapDistPct: {
        countAsTime: false,
        length: 1,
        name: "LapDistPct",
        description: "Percentage distance around lap",
        unit: "%",
        varType: 4,
        value: [
          0.6695664525032043
        ]
      },
      RaceLaps: {
        countAsTime: false,
        length: 1,
        name: "RaceLaps",
        description: "Laps completed in race",
        unit: "",
        varType: 2,
        value: [
          21
        ]
      },
      LapBestLap: {
        countAsTime: false,
        length: 1,
        name: "LapBestLap",
        description: "Players best lap number",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      LapBestLapTime: {
        countAsTime: false,
        length: 1,
        name: "LapBestLapTime",
        description: "Players best lap time",
        unit: "s",
        varType: 4,
        value: [
          92.43419647216797
        ]
      },
      LapLastLapTime: {
        countAsTime: false,
        length: 1,
        name: "LapLastLapTime",
        description: "Players last lap time",
        unit: "s",
        varType: 4,
        value: [
          92.43419647216797
        ]
      },
      LapCurrentLapTime: {
        countAsTime: false,
        length: 1,
        name: "LapCurrentLapTime",
        description: "Estimate of players current lap time as shown in F3 box",
        unit: "s",
        varType: 4,
        value: [
          63.324058532714844
        ]
      },
      LapLasNLapSeq: {
        countAsTime: false,
        length: 1,
        name: "LapLasNLapSeq",
        description: "Player num consecutive clean laps completed for N average",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      LapLastNLapTime: {
        countAsTime: false,
        length: 1,
        name: "LapLastNLapTime",
        description: "Player last N average lap time",
        unit: "s",
        varType: 4,
        value: [
          0
        ]
      },
      LapBestNLapLap: {
        countAsTime: false,
        length: 1,
        name: "LapBestNLapLap",
        description: "Player last lap in best N average lap time",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      LapBestNLapTime: {
        countAsTime: false,
        length: 1,
        name: "LapBestNLapTime",
        description: "Player best N average lap time",
        unit: "s",
        varType: 4,
        value: [
          0
        ]
      },
      LapDeltaToBestLap: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToBestLap",
        description: "Delta time for best lap",
        unit: "s",
        varType: 4,
        value: [
          4.627002239227295
        ]
      },
      LapDeltaToBestLap_DD: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToBestLap_DD",
        description: "Rate of change of delta time for best lap",
        unit: "s/s",
        varType: 4,
        value: [
          0.12807655334472656
        ]
      },
      LapDeltaToBestLap_OK: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToBestLap_OK",
        description: "Delta time for best lap is valid",
        unit: "",
        varType: 1,
        value: [
          true
        ]
      },
      LapDeltaToOptimalLap: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToOptimalLap",
        description: "Delta time for optimal lap",
        unit: "s",
        varType: 4,
        value: [
          5.176210880279541
        ]
      },
      LapDeltaToOptimalLap_DD: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToOptimalLap_DD",
        description: "Rate of change of delta time for optimal lap",
        unit: "s/s",
        varType: 4,
        value: [
          0.14091801643371582
        ]
      },
      LapDeltaToOptimalLap_OK: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToOptimalLap_OK",
        description: "Delta time for optimal lap is valid",
        unit: "",
        varType: 1,
        value: [
          true
        ]
      },
      LapDeltaToSessionBestLap: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToSessionBestLap",
        description: "Delta time for session best lap",
        unit: "s",
        varType: 4,
        value: [
          0
        ]
      },
      LapDeltaToSessionBestLap_DD: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToSessionBestLap_DD",
        description: "Rate of change of delta time for session best lap",
        unit: "s/s",
        varType: 4,
        value: [
          0
        ]
      },
      LapDeltaToSessionBestLap_OK: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToSessionBestLap_OK",
        description: "Delta time for session best lap is valid",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      LapDeltaToSessionOptimalLap: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToSessionOptimalLap",
        description: "Delta time for session optimal lap",
        unit: "s",
        varType: 4,
        value: [
          0
        ]
      },
      LapDeltaToSessionOptimalLap_DD: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToSessionOptimalLap_DD",
        description: "Rate of change of delta time for session optimal lap",
        unit: "s/s",
        varType: 4,
        value: [
          0
        ]
      },
      LapDeltaToSessionOptimalLap_OK: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToSessionOptimalLap_OK",
        description: "Delta time for session optimal lap is valid",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      LapDeltaToSessionLastlLap: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToSessionLastlLap",
        description: "Delta time for session last lap",
        unit: "s",
        varType: 4,
        value: [
          0
        ]
      },
      LapDeltaToSessionLastlLap_DD: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToSessionLastlLap_DD",
        description: "Rate of change of delta time for session last lap",
        unit: "s/s",
        varType: 4,
        value: [
          0
        ]
      },
      LapDeltaToSessionLastlLap_OK: {
        countAsTime: false,
        length: 1,
        name: "LapDeltaToSessionLastlLap_OK",
        description: "Delta time for session last lap is valid",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      Speed: {
        countAsTime: false,
        length: 1,
        name: "Speed",
        description: "GPS vehicle speed",
        unit: "m/s",
        varType: 4,
        value: [
          32.81691360473633
        ]
      },
      Yaw: {
        countAsTime: false,
        length: 1,
        name: "Yaw",
        description: "Yaw orientation",
        unit: "rad",
        varType: 4,
        value: [
          -0.22976428270339966
        ]
      },
      YawNorth: {
        countAsTime: false,
        length: 1,
        name: "YawNorth",
        description: "Yaw orientation relative to north",
        unit: "rad",
        varType: 4,
        value: [
          0.4926230311393738
        ]
      },
      Pitch: {
        countAsTime: false,
        length: 1,
        name: "Pitch",
        description: "Pitch orientation",
        unit: "rad",
        varType: 4,
        value: [
          -0.012292647734284401
        ]
      },
      Roll: {
        countAsTime: false,
        length: 1,
        name: "Roll",
        description: "Roll orientation",
        unit: "rad",
        varType: 4,
        value: [
          0.010911899618804455
        ]
      },
      EnterExitReset: {
        countAsTime: false,
        length: 1,
        name: "EnterExitReset",
        description: "Indicate action the reset key will take 0 enter 1 exit 2 reset",
        unit: "",
        varType: 2,
        value: [
          2
        ]
      },
      TrackTemp: {
        countAsTime: false,
        length: 1,
        name: "TrackTemp",
        description: "Deprecated  set to TrackTempCrew",
        unit: "C",
        varType: 4,
        value: [
          35
        ]
      },
      TrackTempCrew: {
        countAsTime: false,
        length: 1,
        name: "TrackTempCrew",
        description: "Temperature of track measured by crew around track",
        unit: "C",
        varType: 4,
        value: [
          35
        ]
      },
      AirTemp: {
        countAsTime: false,
        length: 1,
        name: "AirTemp",
        description: "Temperature of air at start/finish line",
        unit: "C",
        varType: 4,
        value: [
          25.5975284576416
        ]
      },
      WeatherType: {
        countAsTime: false,
        length: 1,
        name: "WeatherType",
        description: "Weather type (0=constant  1=dynamic)",
        unit: "",
        varType: 2,
        value: [
          3
        ]
      },
      Skies: {
        countAsTime: false,
        length: 1,
        name: "Skies",
        description: "Skies (0=clear/1=p cloudy/2=m cloudy/3=overcast)",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      AirDensity: {
        countAsTime: false,
        length: 1,
        name: "AirDensity",
        description: "Density of air at start/finish line",
        unit: "kg/m^3",
        varType: 4,
        value: [
          1.202965259552002
        ]
      },
      AirPressure: {
        countAsTime: false,
        length: 1,
        name: "AirPressure",
        description: "Pressure of air at start/finish line",
        unit: "Hg",
        varType: 4,
        value: [
          29.24552345275879
        ]
      },
      WindVel: {
        countAsTime: false,
        length: 1,
        name: "WindVel",
        description: "Wind velocity at start/finish line",
        unit: "m/s",
        varType: 4,
        value: [
          0.8940799832344055
        ]
      },
      WindDir: {
        countAsTime: false,
        length: 1,
        name: "WindDir",
        description: "Wind direction at start/finish line",
        unit: "rad",
        varType: 4,
        value: [
          29802322387695312e-24
        ]
      },
      RelativeHumidity: {
        countAsTime: false,
        length: 1,
        name: "RelativeHumidity",
        description: "Relative Humidity",
        unit: "%",
        varType: 4,
        value: [
          0.548566460609436
        ]
      },
      FogLevel: {
        countAsTime: false,
        length: 1,
        name: "FogLevel",
        description: "Fog level",
        unit: "%",
        varType: 4,
        value: [
          0
        ]
      },
      DCLapStatus: {
        countAsTime: false,
        length: 1,
        name: "DCLapStatus",
        description: "Status of driver change lap requirements",
        unit: "",
        varType: 2,
        value: [
          2
        ]
      },
      DCDriversSoFar: {
        countAsTime: false,
        length: 1,
        name: "DCDriversSoFar",
        description: "Number of team drivers who have run a stint",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      OkToReloadTextures: {
        countAsTime: false,
        length: 1,
        name: "OkToReloadTextures",
        description: "True if it is ok to reload car textures at this time",
        unit: "",
        varType: 1,
        value: [
          true
        ]
      },
      LoadNumTextures: {
        countAsTime: false,
        length: 1,
        name: "LoadNumTextures",
        description: "True if the car_num texture will be loaded",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      CarLeftRight: {
        countAsTime: false,
        length: 1,
        name: "CarLeftRight",
        description: "Notify if car is to the left or right of driver",
        unit: "irsdk_CarLeftRight",
        varType: 3,
        value: [
          1
        ]
      },
      PitsOpen: {
        countAsTime: false,
        length: 1,
        name: "PitsOpen",
        description: "True if pit stop is allowed for the current player",
        unit: "",
        varType: 1,
        value: [
          true
        ]
      },
      VidCapEnabled: {
        countAsTime: false,
        length: 1,
        name: "VidCapEnabled",
        description: "True if video capture system is enabled",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      VidCapActive: {
        countAsTime: false,
        length: 1,
        name: "VidCapActive",
        description: "True if video currently being captured",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      PitRepairLeft: {
        countAsTime: false,
        length: 1,
        name: "PitRepairLeft",
        description: "Time left for mandatory pit repairs if repairs are active",
        unit: "s",
        varType: 4,
        value: [
          0
        ]
      },
      PitOptRepairLeft: {
        countAsTime: false,
        length: 1,
        name: "PitOptRepairLeft",
        description: "Time left for optional repairs if repairs are active",
        unit: "s",
        varType: 4,
        value: [
          0
        ]
      },
      PitstopActive: {
        countAsTime: false,
        length: 1,
        name: "PitstopActive",
        description: "Is the player getting pit stop service",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      FastRepairUsed: {
        countAsTime: false,
        length: 1,
        name: "FastRepairUsed",
        description: "How many fast repairs used so far",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      FastRepairAvailable: {
        countAsTime: false,
        length: 1,
        name: "FastRepairAvailable",
        description: "How many fast repairs left  255 is unlimited",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      LFTiresUsed: {
        countAsTime: false,
        length: 1,
        name: "LFTiresUsed",
        description: "How many left front tires used so far",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      RFTiresUsed: {
        countAsTime: false,
        length: 1,
        name: "RFTiresUsed",
        description: "How many right front tires used so far",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      LRTiresUsed: {
        countAsTime: false,
        length: 1,
        name: "LRTiresUsed",
        description: "How many left rear tires used so far",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      RRTiresUsed: {
        countAsTime: false,
        length: 1,
        name: "RRTiresUsed",
        description: "How many right rear tires used so far",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      LeftTireSetsUsed: {
        countAsTime: false,
        length: 1,
        name: "LeftTireSetsUsed",
        description: "How many left tire sets used so far",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      RightTireSetsUsed: {
        countAsTime: false,
        length: 1,
        name: "RightTireSetsUsed",
        description: "How many right tire sets used so far",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      FrontTireSetsUsed: {
        countAsTime: false,
        length: 1,
        name: "FrontTireSetsUsed",
        description: "How many front tire sets used so far",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      RearTireSetsUsed: {
        countAsTime: false,
        length: 1,
        name: "RearTireSetsUsed",
        description: "How many rear tire sets used so far",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      TireSetsUsed: {
        countAsTime: false,
        length: 1,
        name: "TireSetsUsed",
        description: "How many tire sets used so far",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      LFTiresAvailable: {
        countAsTime: false,
        length: 1,
        name: "LFTiresAvailable",
        description: "How many left front tires are remaining  255 is unlimited",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      RFTiresAvailable: {
        countAsTime: false,
        length: 1,
        name: "RFTiresAvailable",
        description: "How many right front tires are remaining  255 is unlimited",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      LRTiresAvailable: {
        countAsTime: false,
        length: 1,
        name: "LRTiresAvailable",
        description: "How many left rear tires are remaining  255 is unlimited",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      RRTiresAvailable: {
        countAsTime: false,
        length: 1,
        name: "RRTiresAvailable",
        description: "How many right rear tires are remaining  255 is unlimited",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      LeftTireSetsAvailable: {
        countAsTime: false,
        length: 1,
        name: "LeftTireSetsAvailable",
        description: "How many left tire sets are remaining  255 is unlimited",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      RightTireSetsAvailable: {
        countAsTime: false,
        length: 1,
        name: "RightTireSetsAvailable",
        description: "How many right tire sets are remaining  255 is unlimited",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      FrontTireSetsAvailable: {
        countAsTime: false,
        length: 1,
        name: "FrontTireSetsAvailable",
        description: "How many front tire sets are remaining  255 is unlimited",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      RearTireSetsAvailable: {
        countAsTime: false,
        length: 1,
        name: "RearTireSetsAvailable",
        description: "How many rear tire sets are remaining  255 is unlimited",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      TireSetsAvailable: {
        countAsTime: false,
        length: 1,
        name: "TireSetsAvailable",
        description: "How many tire sets are remaining  255 is unlimited",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      CamCarIdx: {
        countAsTime: false,
        length: 1,
        name: "CamCarIdx",
        description: "Active camera's focus car index",
        unit: "",
        varType: 2,
        value: [
          51
        ]
      },
      CamCameraNumber: {
        countAsTime: false,
        length: 1,
        name: "CamCameraNumber",
        description: "Active camera number",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      CamGroupNumber: {
        countAsTime: false,
        length: 1,
        name: "CamGroupNumber",
        description: "Active camera group number",
        unit: "",
        varType: 2,
        value: [
          9
        ]
      },
      CamCameraState: {
        countAsTime: false,
        length: 1,
        name: "CamCameraState",
        description: "State of camera system",
        unit: "irsdk_CameraState",
        varType: 3,
        value: [
          80
        ]
      },
      IsOnTrackCar: {
        countAsTime: false,
        length: 1,
        name: "IsOnTrackCar",
        description: "1=Car on track physics running",
        unit: "",
        varType: 1,
        value: [
          true
        ]
      },
      IsInGarage: {
        countAsTime: false,
        length: 1,
        name: "IsInGarage",
        description: "1=Car in garage physics running",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      SteeringWheelPctTorque: {
        countAsTime: false,
        length: 1,
        name: "SteeringWheelPctTorque",
        description: "Force feedback % max torque on steering shaft unsigned",
        unit: "%",
        varType: 4,
        value: [
          0.6664298176765442
        ]
      },
      SteeringWheelPctTorqueSign: {
        countAsTime: false,
        length: 1,
        name: "SteeringWheelPctTorqueSign",
        description: "Force feedback % max torque on steering shaft signed",
        unit: "%",
        varType: 4,
        value: [
          0.6664298176765442
        ]
      },
      SteeringWheelPctTorqueSignStops: {
        countAsTime: false,
        length: 1,
        name: "SteeringWheelPctTorqueSignStops",
        description: "Force feedback % max torque on steering shaft signed stops",
        unit: "%",
        varType: 4,
        value: [
          0.6677641272544861
        ]
      },
      SteeringWheelPctDamper: {
        countAsTime: false,
        length: 1,
        name: "SteeringWheelPctDamper",
        description: "Force feedback % max damping",
        unit: "%",
        varType: 4,
        value: [
          0
        ]
      },
      SteeringWheelAngleMax: {
        countAsTime: false,
        length: 1,
        name: "SteeringWheelAngleMax",
        description: "Steering wheel max angle",
        unit: "rad",
        varType: 4,
        value: [
          17.278644561767578
        ]
      },
      SteeringWheelLimiter: {
        countAsTime: false,
        length: 1,
        name: "SteeringWheelLimiter",
        description: "Force feedback limiter strength limits impacts and oscillation",
        unit: "%",
        varType: 4,
        value: [
          0
        ]
      },
      ShiftIndicatorPct: {
        countAsTime: false,
        length: 1,
        name: "ShiftIndicatorPct",
        description: "DEPRECATED use DriverCarSLBlinkRPM instead",
        unit: "%",
        varType: 4,
        value: [
          0.5262767672538757
        ]
      },
      ShiftPowerPct: {
        countAsTime: false,
        length: 1,
        name: "ShiftPowerPct",
        description: "Friction torque applied to gears when shifting or grinding",
        unit: "%",
        varType: 4,
        value: [
          0
        ]
      },
      ShiftGrindRPM: {
        countAsTime: false,
        length: 1,
        name: "ShiftGrindRPM",
        description: "RPM of shifter grinding noise",
        unit: "RPM",
        varType: 4,
        value: [
          0
        ]
      },
      ThrottleRaw: {
        countAsTime: false,
        length: 1,
        name: "ThrottleRaw",
        description: "Raw throttle input 0=off throttle to 1=full throttle",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      BrakeRaw: {
        countAsTime: false,
        length: 1,
        name: "BrakeRaw",
        description: "Raw brake input 0=brake released to 1=max pedal force",
        unit: "%",
        varType: 4,
        value: [
          0
        ]
      },
      HandbrakeRaw: {
        countAsTime: false,
        length: 1,
        name: "HandbrakeRaw",
        description: "Raw handbrake input 0=handbrake released to 1=max force",
        unit: "%",
        varType: 4,
        value: [
          0
        ]
      },
      SteeringWheelPeakForceNm: {
        countAsTime: false,
        length: 1,
        name: "SteeringWheelPeakForceNm",
        description: "Peak torque mapping to direct input units for FFB",
        unit: "N*m",
        varType: 4,
        value: [
          -1
        ]
      },
      SteeringWheelMaxForceNm: {
        countAsTime: false,
        length: 1,
        name: "SteeringWheelMaxForceNm",
        description: "Value of strength or max force slider in Nm for FFB",
        unit: "N*m",
        varType: 4,
        value: [
          19
        ]
      },
      SteeringWheelUseLinear: {
        countAsTime: false,
        length: 1,
        name: "SteeringWheelUseLinear",
        description: "True if steering wheel force is using linear mode",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      BrakeABSactive: {
        countAsTime: false,
        length: 1,
        name: "BrakeABSactive",
        description: "true if abs is currently reducing brake force pressure",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      EngineWarnings: {
        countAsTime: false,
        length: 1,
        name: "EngineWarnings",
        description: "Bitfield for warning lights",
        unit: "irsdk_EngineWarnings",
        varType: 3,
        value: [
          0
        ]
      },
      FuelLevel: {
        countAsTime: false,
        length: 1,
        name: "FuelLevel",
        description: "Liters of fuel remaining",
        unit: "l",
        varType: 4,
        value: [
          29.833730697631836
        ]
      },
      FuelLevelPct: {
        countAsTime: false,
        length: 1,
        name: "FuelLevelPct",
        description: "Percent fuel remaining",
        unit: "%",
        varType: 4,
        value: [
          0.6631683111190796
        ]
      },
      PitSvFlags: {
        countAsTime: false,
        length: 1,
        name: "PitSvFlags",
        description: "Bitfield of pit service checkboxes",
        unit: "irsdk_PitSvFlags",
        varType: 3,
        value: [
          63
        ]
      },
      PitSvLFP: {
        countAsTime: false,
        length: 1,
        name: "PitSvLFP",
        description: "Pit service left front tire pressure",
        unit: "kPa",
        varType: 4,
        value: [
          206.8427276611328
        ]
      },
      PitSvRFP: {
        countAsTime: false,
        length: 1,
        name: "PitSvRFP",
        description: "Pit service right front tire pressure",
        unit: "kPa",
        varType: 4,
        value: [
          206.8427276611328
        ]
      },
      PitSvLRP: {
        countAsTime: false,
        length: 1,
        name: "PitSvLRP",
        description: "Pit service left rear tire pressure",
        unit: "kPa",
        varType: 4,
        value: [
          206.8427276611328
        ]
      },
      PitSvRRP: {
        countAsTime: false,
        length: 1,
        name: "PitSvRRP",
        description: "Pit service right rear tire pressure",
        unit: "kPa",
        varType: 4,
        value: [
          206.8427276611328
        ]
      },
      PitSvFuel: {
        countAsTime: false,
        length: 1,
        name: "PitSvFuel",
        description: "Pit service fuel add amount",
        unit: "l",
        varType: 4,
        value: [
          44.986663818359375
        ]
      },
      PitSvTireCompound: {
        countAsTime: false,
        length: 1,
        name: "PitSvTireCompound",
        description: "Pit service pending tire compound",
        unit: "",
        varType: 2,
        value: [
          0
        ]
      },
      CarIdxP2P_Status: {
        countAsTime: false,
        length: 64,
        name: "CarIdxP2P_Status",
        description: "Push2Pass active or not",
        unit: "",
        varType: 1,
        value: [
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false
        ]
      },
      CarIdxP2P_Count: {
        countAsTime: false,
        length: 64,
        name: "CarIdxP2P_Count",
        description: "Push2Pass count of usage (or remaining in Race)",
        unit: "",
        varType: 2,
        value: [
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1,
          -1
        ]
      },
      ReplayPlaySpeed: {
        countAsTime: false,
        length: 1,
        name: "ReplayPlaySpeed",
        description: "Replay playback speed",
        unit: "",
        varType: 2,
        value: [
          1
        ]
      },
      ReplayPlaySlowMotion: {
        countAsTime: false,
        length: 1,
        name: "ReplayPlaySlowMotion",
        description: "0=not slow motion  1=replay is in slow motion",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      ReplaySessionTime: {
        countAsTime: false,
        length: 1,
        name: "ReplaySessionTime",
        description: "Seconds since replay session start",
        unit: "s",
        varType: 5,
        value: [
          0
        ]
      },
      ReplaySessionNum: {
        countAsTime: false,
        length: 1,
        name: "ReplaySessionNum",
        description: "Replay session number",
        unit: "",
        varType: 2,
        value: [
          -1
        ]
      },
      TireLF_RumblePitch: {
        countAsTime: false,
        length: 1,
        name: "TireLF_RumblePitch",
        description: "Players LF Tire Sound rumblestrip pitch",
        unit: "Hz",
        varType: 4,
        value: [
          0
        ]
      },
      TireRF_RumblePitch: {
        countAsTime: false,
        length: 1,
        name: "TireRF_RumblePitch",
        description: "Players RF Tire Sound rumblestrip pitch",
        unit: "Hz",
        varType: 4,
        value: [
          0
        ]
      },
      TireLR_RumblePitch: {
        countAsTime: false,
        length: 1,
        name: "TireLR_RumblePitch",
        description: "Players LR Tire Sound rumblestrip pitch",
        unit: "Hz",
        varType: 4,
        value: [
          0
        ]
      },
      TireRR_RumblePitch: {
        countAsTime: false,
        length: 1,
        name: "TireRR_RumblePitch",
        description: "Players RR Tire Sound rumblestrip pitch",
        unit: "Hz",
        varType: 4,
        value: [
          0
        ]
      },
      SteeringWheelTorque_ST: {
        countAsTime: true,
        length: 6,
        name: "SteeringWheelTorque_ST",
        description: "Output torque on steering shaft at 360 Hz",
        unit: "N*m",
        varType: 4,
        value: [
          10.717019081115723,
          10.853043556213379,
          11.153368949890137,
          11.37777328491211,
          11.468843460083008,
          11.510481834411621
        ]
      },
      SteeringWheelTorque: {
        countAsTime: false,
        length: 1,
        name: "SteeringWheelTorque",
        description: "Output torque on steering shaft",
        unit: "N*m",
        varType: 4,
        value: [
          11.510481834411621
        ]
      },
      VelocityZ_ST: {
        countAsTime: true,
        length: 6,
        name: "VelocityZ_ST",
        description: "Z velocity",
        unit: "m/s at 360 Hz",
        varType: 4,
        value: [
          -0.10196784138679504,
          -0.10358759760856628,
          -0.10523685812950134,
          -0.10701584815979004,
          -0.1088140606880188,
          -0.11056402325630188
        ]
      },
      VelocityY_ST: {
        countAsTime: true,
        length: 6,
        name: "VelocityY_ST",
        description: "Y velocity",
        unit: "m/s at 360 Hz",
        varType: 4,
        value: [
          -0.4015786349773407,
          -0.38359901309013367,
          -0.3653615415096283,
          -0.3468185365200043,
          -0.3280704617500305,
          -0.30929315090179443
        ]
      },
      VelocityX_ST: {
        countAsTime: true,
        length: 6,
        name: "VelocityX_ST",
        description: "X velocity",
        unit: "m/s at 360 Hz",
        varType: 4,
        value: [
          32.78310775756836,
          32.78990936279297,
          32.796573638916016,
          32.803016662597656,
          32.80925369262695,
          32.81545639038086
        ]
      },
      VelocityZ: {
        countAsTime: false,
        length: 1,
        name: "VelocityZ",
        description: "Z velocity",
        unit: "m/s",
        varType: 4,
        value: [
          -0.11056402325630188
        ]
      },
      VelocityY: {
        countAsTime: false,
        length: 1,
        name: "VelocityY",
        description: "Y velocity",
        unit: "m/s",
        varType: 4,
        value: [
          -0.30929315090179443
        ]
      },
      VelocityX: {
        countAsTime: false,
        length: 1,
        name: "VelocityX",
        description: "X velocity",
        unit: "m/s",
        varType: 4,
        value: [
          32.81545639038086
        ]
      },
      YawRate_ST: {
        countAsTime: true,
        length: 6,
        name: "YawRate_ST",
        description: "Yaw rate at 360 Hz",
        unit: "rad/s",
        varType: 4,
        value: [
          -0.2951936423778534,
          -0.3020528554916382,
          -0.30879589915275574,
          -0.3153848648071289,
          -0.321804940700531,
          -0.32802334427833557
        ]
      },
      PitchRate_ST: {
        countAsTime: true,
        length: 6,
        name: "PitchRate_ST",
        description: "Pitch rate at 360 Hz",
        unit: "rad/s",
        varType: 4,
        value: [
          -0.024382177740335464,
          -0.026231329888105392,
          -0.027911784127354622,
          -0.029414216056466103,
          -0.030834611505270004,
          -0.03212951496243477
        ]
      },
      RollRate_ST: {
        countAsTime: true,
        length: 6,
        name: "RollRate_ST",
        description: "Roll rate at 360 Hz",
        unit: "rad/s",
        varType: 4,
        value: [
          -0.17961275577545166,
          -0.1837361603975296,
          -0.18821895122528076,
          -0.19301989674568176,
          -0.19865694642066956,
          -0.20528380572795868
        ]
      },
      YawRate: {
        countAsTime: false,
        length: 1,
        name: "YawRate",
        description: "Yaw rate",
        unit: "rad/s",
        varType: 4,
        value: [
          -0.32802334427833557
        ]
      },
      PitchRate: {
        countAsTime: false,
        length: 1,
        name: "PitchRate",
        description: "Pitch rate",
        unit: "rad/s",
        varType: 4,
        value: [
          -0.03212951496243477
        ]
      },
      RollRate: {
        countAsTime: false,
        length: 1,
        name: "RollRate",
        description: "Roll rate",
        unit: "rad/s",
        varType: 4,
        value: [
          -0.20528380572795868
        ]
      },
      VertAccel_ST: {
        countAsTime: true,
        length: 6,
        name: "VertAccel_ST",
        description: "Vertical acceleration (including gravity) at 360 Hz",
        unit: "m/s^2",
        varType: 4,
        value: [
          10.055245399475098,
          10.123611450195312,
          10.169025421142578,
          10.17286205291748,
          10.211880683898926,
          10.272781372070312
        ]
      },
      LatAccel_ST: {
        countAsTime: true,
        length: 6,
        name: "LatAccel_ST",
        description: "Lateral acceleration (including gravity) at 360 Hz",
        unit: "m/s^2",
        varType: 4,
        value: [
          -3.050381898880005,
          -3.208136796951294,
          -3.346548080444336,
          -3.463557243347168,
          -3.611429452896118,
          -3.8170790672302246
        ]
      },
      LongAccel_ST: {
        countAsTime: true,
        length: 6,
        name: "LongAccel_ST",
        description: "Longitudinal acceleration (including gravity) at 360 Hz",
        unit: "m/s^2",
        varType: 4,
        value: [
          2.4552206993103027,
          2.4528238773345947,
          2.4064993858337402,
          2.333040714263916,
          2.2633140087127686,
          2.2542667388916016
        ]
      },
      VertAccel: {
        countAsTime: false,
        length: 1,
        name: "VertAccel",
        description: "Vertical acceleration (including gravity)",
        unit: "m/s^2",
        varType: 4,
        value: [
          10.272781372070312
        ]
      },
      LatAccel: {
        countAsTime: false,
        length: 1,
        name: "LatAccel",
        description: "Lateral acceleration (including gravity)",
        unit: "m/s^2",
        varType: 4,
        value: [
          -3.8170790672302246
        ]
      },
      LongAccel: {
        countAsTime: false,
        length: 1,
        name: "LongAccel",
        description: "Longitudinal acceleration (including gravity)",
        unit: "m/s^2",
        varType: 4,
        value: [
          2.2542667388916016
        ]
      },
      dcStarter: {
        countAsTime: false,
        length: 1,
        name: "dcStarter",
        description: "In car trigger car starter",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      dcPitSpeedLimiterToggle: {
        countAsTime: false,
        length: 1,
        name: "dcPitSpeedLimiterToggle",
        description: "In car traction control active",
        unit: "",
        varType: 1,
        value: [
          false
        ]
      },
      dpRFTireChange: {
        countAsTime: false,
        length: 1,
        name: "dpRFTireChange",
        description: "Pitstop rf tire change request",
        unit: "",
        varType: 4,
        value: [
          1
        ]
      },
      dpLFTireChange: {
        countAsTime: false,
        length: 1,
        name: "dpLFTireChange",
        description: "Pitstop lf tire change request",
        unit: "",
        varType: 4,
        value: [
          1
        ]
      },
      dpRRTireChange: {
        countAsTime: false,
        length: 1,
        name: "dpRRTireChange",
        description: "Pitstop rr tire change request",
        unit: "",
        varType: 4,
        value: [
          1
        ]
      },
      dpLRTireChange: {
        countAsTime: false,
        length: 1,
        name: "dpLRTireChange",
        description: "Pitstop lr tire change request",
        unit: "",
        varType: 4,
        value: [
          1
        ]
      },
      dpFuelFill: {
        countAsTime: false,
        length: 1,
        name: "dpFuelFill",
        description: "Pitstop fuel fill flag",
        unit: "",
        varType: 4,
        value: [
          1
        ]
      },
      dpWindshieldTearoff: {
        countAsTime: false,
        length: 1,
        name: "dpWindshieldTearoff",
        description: "Pitstop windshield tearoff",
        unit: "",
        varType: 4,
        value: [
          1
        ]
      },
      dpFuelAddKg: {
        countAsTime: false,
        length: 1,
        name: "dpFuelAddKg",
        description: "Pitstop fuel add ammount",
        unit: "kg",
        varType: 4,
        value: [
          44.986663818359375
        ]
      },
      dpFastRepair: {
        countAsTime: false,
        length: 1,
        name: "dpFastRepair",
        description: "Pitstop fast repair set",
        unit: "",
        varType: 4,
        value: [
          0
        ]
      },
      dpLFTireColdPress: {
        countAsTime: false,
        length: 1,
        name: "dpLFTireColdPress",
        description: "Pitstop lf tire cold pressure adjustment",
        unit: "Pa",
        varType: 4,
        value: [
          206.84271240234375
        ]
      },
      dpRFTireColdPress: {
        countAsTime: false,
        length: 1,
        name: "dpRFTireColdPress",
        description: "Pitstop rf cold tire pressure adjustment",
        unit: "Pa",
        varType: 4,
        value: [
          206.84271240234375
        ]
      },
      dpLRTireColdPress: {
        countAsTime: false,
        length: 1,
        name: "dpLRTireColdPress",
        description: "Pitstop lr tire cold pressure adjustment",
        unit: "Pa",
        varType: 4,
        value: [
          206.84271240234375
        ]
      },
      dpRRTireColdPress: {
        countAsTime: false,
        length: 1,
        name: "dpRRTireColdPress",
        description: "Pitstop rr cold tire pressure adjustment",
        unit: "Pa",
        varType: 4,
        value: [
          206.84271240234375
        ]
      },
      WaterTemp: {
        countAsTime: false,
        length: 1,
        name: "WaterTemp",
        description: "Engine coolant temp",
        unit: "C",
        varType: 4,
        value: [
          77.2289047241211
        ]
      },
      WaterLevel: {
        countAsTime: false,
        length: 1,
        name: "WaterLevel",
        description: "Engine coolant level",
        unit: "l",
        varType: 4,
        value: [
          5
        ]
      },
      FuelPress: {
        countAsTime: false,
        length: 1,
        name: "FuelPress",
        description: "Engine fuel pressure",
        unit: "bar",
        varType: 4,
        value: [
          4
        ]
      },
      FuelUsePerHour: {
        countAsTime: false,
        length: 1,
        name: "FuelUsePerHour",
        description: "Engine fuel used instantaneous",
        unit: "kg/h",
        varType: 4,
        value: [
          31.441360473632812
        ]
      },
      OilTemp: {
        countAsTime: false,
        length: 1,
        name: "OilTemp",
        description: "Engine oil temperature",
        unit: "C",
        varType: 4,
        value: [
          72.12635803222656
        ]
      },
      OilPress: {
        countAsTime: false,
        length: 1,
        name: "OilPress",
        description: "Engine oil pressure",
        unit: "bar",
        varType: 4,
        value: [
          4.081998825073242
        ]
      },
      OilLevel: {
        countAsTime: false,
        length: 1,
        name: "OilLevel",
        description: "Engine oil level",
        unit: "l",
        varType: 4,
        value: [
          6.400000095367432
        ]
      },
      Voltage: {
        countAsTime: false,
        length: 1,
        name: "Voltage",
        description: "Engine voltage",
        unit: "V",
        varType: 4,
        value: [
          12.40000057220459
        ]
      },
      ManifoldPress: {
        countAsTime: false,
        length: 1,
        name: "ManifoldPress",
        description: "Engine manifold pressure",
        unit: "bar",
        varType: 4,
        value: [
          0.9784109592437744
        ]
      },
      RFbrakeLinePress: {
        countAsTime: false,
        length: 1,
        name: "RFbrakeLinePress",
        description: "RF brake line pressure",
        unit: "bar",
        varType: 4,
        value: [
          0
        ]
      },
      RFcoldPressure: {
        countAsTime: false,
        length: 1,
        name: "RFcoldPressure",
        description: "RF tire cold pressure  as set in the garage",
        unit: "kPa",
        varType: 4,
        value: [
          206.8427276611328
        ]
      },
      RFtempCL: {
        countAsTime: false,
        length: 1,
        name: "RFtempCL",
        description: "RF tire left carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      RFtempCM: {
        countAsTime: false,
        length: 1,
        name: "RFtempCM",
        description: "RF tire middle carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      RFtempCR: {
        countAsTime: false,
        length: 1,
        name: "RFtempCR",
        description: "RF tire right carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      RFwearL: {
        countAsTime: false,
        length: 1,
        name: "RFwearL",
        description: "RF tire left percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      RFwearM: {
        countAsTime: false,
        length: 1,
        name: "RFwearM",
        description: "RF tire middle percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      RFwearR: {
        countAsTime: false,
        length: 1,
        name: "RFwearR",
        description: "RF tire right percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      LFbrakeLinePress: {
        countAsTime: false,
        length: 1,
        name: "LFbrakeLinePress",
        description: "LF brake line pressure",
        unit: "bar",
        varType: 4,
        value: [
          0
        ]
      },
      LFcoldPressure: {
        countAsTime: false,
        length: 1,
        name: "LFcoldPressure",
        description: "LF tire cold pressure  as set in the garage",
        unit: "kPa",
        varType: 4,
        value: [
          206.8427276611328
        ]
      },
      LFtempCL: {
        countAsTime: false,
        length: 1,
        name: "LFtempCL",
        description: "LF tire left carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      LFtempCM: {
        countAsTime: false,
        length: 1,
        name: "LFtempCM",
        description: "LF tire middle carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      LFtempCR: {
        countAsTime: false,
        length: 1,
        name: "LFtempCR",
        description: "LF tire right carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      LFwearL: {
        countAsTime: false,
        length: 1,
        name: "LFwearL",
        description: "LF tire left percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      LFwearM: {
        countAsTime: false,
        length: 1,
        name: "LFwearM",
        description: "LF tire middle percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      LFwearR: {
        countAsTime: false,
        length: 1,
        name: "LFwearR",
        description: "LF tire right percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      RRbrakeLinePress: {
        countAsTime: false,
        length: 1,
        name: "RRbrakeLinePress",
        description: "RR brake line pressure",
        unit: "bar",
        varType: 4,
        value: [
          0
        ]
      },
      RRcoldPressure: {
        countAsTime: false,
        length: 1,
        name: "RRcoldPressure",
        description: "RR tire cold pressure  as set in the garage",
        unit: "kPa",
        varType: 4,
        value: [
          206.8427276611328
        ]
      },
      RRtempCL: {
        countAsTime: false,
        length: 1,
        name: "RRtempCL",
        description: "RR tire left carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      RRtempCM: {
        countAsTime: false,
        length: 1,
        name: "RRtempCM",
        description: "RR tire middle carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      RRtempCR: {
        countAsTime: false,
        length: 1,
        name: "RRtempCR",
        description: "RR tire right carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      RRwearL: {
        countAsTime: false,
        length: 1,
        name: "RRwearL",
        description: "RR tire left percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      RRwearM: {
        countAsTime: false,
        length: 1,
        name: "RRwearM",
        description: "RR tire middle percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      RRwearR: {
        countAsTime: false,
        length: 1,
        name: "RRwearR",
        description: "RR tire right percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      LRbrakeLinePress: {
        countAsTime: false,
        length: 1,
        name: "LRbrakeLinePress",
        description: "LR brake line pressure",
        unit: "bar",
        varType: 4,
        value: [
          0
        ]
      },
      LRcoldPressure: {
        countAsTime: false,
        length: 1,
        name: "LRcoldPressure",
        description: "LR tire cold pressure  as set in the garage",
        unit: "kPa",
        varType: 4,
        value: [
          206.8427276611328
        ]
      },
      LRtempCL: {
        countAsTime: false,
        length: 1,
        name: "LRtempCL",
        description: "LR tire left carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      LRtempCM: {
        countAsTime: false,
        length: 1,
        name: "LRtempCM",
        description: "LR tire middle carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      LRtempCR: {
        countAsTime: false,
        length: 1,
        name: "LRtempCR",
        description: "LR tire right carcass temperature",
        unit: "C",
        varType: 4,
        value: [
          39.107696533203125
        ]
      },
      LRwearL: {
        countAsTime: false,
        length: 1,
        name: "LRwearL",
        description: "LR tire left percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      LRwearM: {
        countAsTime: false,
        length: 1,
        name: "LRwearM",
        description: "LR tire middle percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      LRwearR: {
        countAsTime: false,
        length: 1,
        name: "LRwearR",
        description: "LR tire right percent tread remaining",
        unit: "%",
        varType: 4,
        value: [
          1
        ]
      },
      RRshockDefl: {
        countAsTime: false,
        length: 1,
        name: "RRshockDefl",
        description: "RR shock deflection",
        unit: "m",
        varType: 4,
        value: [
          0.13256175816059113
        ]
      },
      RRshockDefl_ST: {
        countAsTime: true,
        length: 6,
        name: "RRshockDefl_ST",
        description: "RR shock deflection at 360 Hz",
        unit: "m",
        varType: 4,
        value: [
          0.13414719700813293,
          0.13370655477046967,
          0.1333489567041397,
          0.13304783403873444,
          0.13278646767139435,
          0.13256175816059113
        ]
      },
      RRshockVel: {
        countAsTime: false,
        length: 1,
        name: "RRshockVel",
        description: "RR shock velocity",
        unit: "m/s",
        varType: 4,
        value: [
          -0.062119144946336746
        ]
      },
      RRshockVel_ST: {
        countAsTime: true,
        length: 6,
        name: "RRshockVel_ST",
        description: "RR shock velocity at 360 Hz",
        unit: "m/s",
        varType: 4,
        value: [
          -0.17344529926776886,
          -0.14326635003089905,
          -0.11861429363489151,
          -0.10118775814771652,
          -0.08736566454172134,
          -0.062119144946336746
        ]
      },
      LRshockDefl: {
        countAsTime: false,
        length: 1,
        name: "LRshockDefl",
        description: "LR shock deflection",
        unit: "m",
        varType: 4,
        value: [
          0.1400333195924759
        ]
      },
      LRshockDefl_ST: {
        countAsTime: true,
        length: 6,
        name: "LRshockDefl_ST",
        description: "LR shock deflection at 360 Hz",
        unit: "m",
        varType: 4,
        value: [
          0.1369251310825348,
          0.1374407559633255,
          0.13803276419639587,
          0.13867461681365967,
          0.1393466293811798,
          0.1400333195924759
        ]
      },
      LRshockVel: {
        countAsTime: false,
        length: 1,
        name: "LRshockVel",
        description: "LR shock velocity",
        unit: "m/s",
        varType: 4,
        value: [
          0.24768400192260742
        ]
      },
      LRshockVel_ST: {
        countAsTime: true,
        length: 6,
        name: "LRshockVel_ST",
        description: "LR shock velocity at 360 Hz",
        unit: "m/s",
        varType: 4,
        value: [
          0.16846153140068054,
          0.1995287388563156,
          0.22184349596500397,
          0.23632672429084778,
          0.2444070726633072,
          0.24768400192260742
        ]
      },
      RFshockDefl: {
        countAsTime: false,
        length: 1,
        name: "RFshockDefl",
        description: "RF shock deflection",
        unit: "m",
        varType: 4,
        value: [
          0.12979234755039215
        ]
      },
      RFshockDefl_ST: {
        countAsTime: true,
        length: 6,
        name: "RFshockDefl_ST",
        description: "RF shock deflection at 360 Hz",
        unit: "m",
        varType: 4,
        value: [
          0.1296401023864746,
          0.12968841195106506,
          0.1297299563884735,
          0.12975946068763733,
          0.1297806054353714,
          0.12979234755039215
        ]
      },
      RFshockVel: {
        countAsTime: false,
        length: 1,
        name: "RFshockVel",
        description: "RF shock velocity",
        unit: "m/s",
        varType: 4,
        value: [
          0.0025738750118762255
        ]
      },
      RFshockVel_ST: {
        countAsTime: true,
        length: 6,
        name: "RFshockVel_ST",
        description: "RF shock velocity at 360 Hz",
        unit: "m/s",
        varType: 4,
        value: [
          0.018689986318349838,
          0.01615993306040764,
          0.01239792350679636,
          0.00911686196923256,
          0.005779380444437265,
          0.0025738750118762255
        ]
      },
      LFshockDefl: {
        countAsTime: false,
        length: 1,
        name: "LFshockDefl",
        description: "LF shock deflection",
        unit: "m",
        varType: 4,
        value: [
          0.1289639174938202
        ]
      },
      LFshockDefl_ST: {
        countAsTime: true,
        length: 6,
        name: "LFshockDefl_ST",
        description: "LF shock deflection at 360 Hz",
        unit: "m",
        varType: 4,
        value: [
          0.12828616797924042,
          0.12840300798416138,
          0.12852510809898376,
          0.1286485344171524,
          0.1287897527217865,
          0.1289639174938202
        ]
      },
      LFshockVel: {
        countAsTime: false,
        length: 1,
        name: "LFshockVel",
        description: "LF shock velocity",
        unit: "m/s",
        varType: 4,
        value: [
          0.07035093754529953
        ]
      },
      LFshockVel_ST: {
        countAsTime: true,
        length: 6,
        name: "LFshockVel_ST",
        description: "LF shock velocity at 360 Hz",
        unit: "m/s",
        varType: 4,
        value: [
          0.04001539200544357,
          0.043020956218242645,
          0.04424048587679863,
          0.04798208177089691,
          0.057085443288087845,
          0.07035093754529953
        ]
      }
    };
  }
});
var getDirname = () => dirname(fileURLToPath$1(import.meta.url));
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["None"] = 0] = "None";
  LogLevel2[LogLevel2["Error"] = 1] = "Error";
  LogLevel2[LogLevel2["Warn"] = 2] = "Warn";
  LogLevel2[LogLevel2["Info"] = 3] = "Info";
  LogLevel2[LogLevel2["Debug"] = 4] = "Debug";
  return LogLevel2;
})(LogLevel || {});
var loadMockSessionData = async () => {
  const json2 = await Promise.resolve().then(() => __toESM(require_session()));
  return dump(json2.default);
};
var loadMockTelemetry = async () => {
  const json2 = await Promise.resolve().then(() => __toESM(require_telemetry()));
  return json2.default;
};
var mockTelemetry = null;
var mockSession = null;
var MockSDK = class {
  constructor() {
    __publicField(this, "currDataVersion", 1);
    __publicField(this, "isMocked", true);
    __publicField(this, "enableLogging", false);
    __publicField(this, "logLevel", 0);
    __publicField(this, "_isRunning", false);
    this._loadMockData().catch((reason) => {
      error("Error loading mock data for mock SDK:", reason);
    });
    warn(
      "Attempting to access iRacing SDK on unsupported platform!",
      "\nReturning mock SDK for testing purposes. (Only win32 supported)"
    );
  }
  async _loadMockData() {
    const [session, telemetry] = await Promise.all([
      !mockSession ? loadMockSessionData() : Promise.resolve(mockSession),
      !mockTelemetry ? loadMockTelemetry() : Promise.resolve(mockTelemetry)
    ]);
    mockSession = session;
    mockTelemetry = telemetry;
  }
  startSDK() {
    this._isRunning = true;
    return true;
  }
  stopSDK() {
    this._isRunning = false;
  }
  isRunning() {
    return this._isRunning;
  }
  waitForData(_timeout) {
    const dataNotReady = !mockSession || !mockTelemetry;
    return this._isRunning && !dataNotReady;
  }
  getSessionData() {
    return mockSession ?? "";
  }
  getSessionConnectionID() {
    return mockSession ? 1 : -1;
  }
  getSessionVersionNum() {
    return mockSession ? 1 : -1;
  }
  getTelemetryData() {
    if (!mockTelemetry) {
      return {};
    }
    return mockTelemetry;
  }
  getTelemetryVariable(name) {
    if (!mockTelemetry) {
      throw new Error("Attempted accessing mock telemetry before it was loaded.");
    }
    if (typeof name === "number") {
      return Object.values(mockTelemetry)[name];
    }
    return mockTelemetry[name];
  }
  getTelemetryVariableIndex(_name) {
    return 0;
  }
  broadcast(message, ...args) {
    log("Mocking SDK call:", message, ...args);
    return true;
  }
  __getTelemetryTypes() {
    return {};
  }
};
var DIR_NAME = getDirname();
var sdkBinding;
try {
  const rootDir = join(DIR_NAME, "../..");
  const binding = importNativeModule(rootDir);
  sdkBinding = binding.iRacingSdkNode;
} catch {
  console.warn("Failed to load native iRacing SDK module. Loading mock SDK instead.");
  sdkBinding = MockSDK;
}
var NativeSDK = sdkBinding;
var BroadcastMessages = /* @__PURE__ */ ((BroadcastMessages2) => {
  BroadcastMessages2[BroadcastMessages2["CameraSwitchPos"] = 0] = "CameraSwitchPos";
  BroadcastMessages2[BroadcastMessages2["CameraSwitchNum"] = 1] = "CameraSwitchNum";
  BroadcastMessages2[BroadcastMessages2["CameraSetState"] = 2] = "CameraSetState";
  BroadcastMessages2[BroadcastMessages2["ReplaySetPlaySpeed"] = 3] = "ReplaySetPlaySpeed";
  BroadcastMessages2[BroadcastMessages2["ReplaySetPlayPosition"] = 4] = "ReplaySetPlayPosition";
  BroadcastMessages2[BroadcastMessages2["ReplaySearch"] = 5] = "ReplaySearch";
  BroadcastMessages2[BroadcastMessages2["ReplaySetState"] = 6] = "ReplaySetState";
  BroadcastMessages2[BroadcastMessages2["ReloadTextures"] = 7] = "ReloadTextures";
  BroadcastMessages2[BroadcastMessages2["ChatCommand"] = 8] = "ChatCommand";
  BroadcastMessages2[BroadcastMessages2["PitCommand"] = 9] = "PitCommand";
  BroadcastMessages2[BroadcastMessages2["TelemCommand"] = 10] = "TelemCommand";
  BroadcastMessages2[BroadcastMessages2["FFBCommand"] = 11] = "FFBCommand";
  BroadcastMessages2[BroadcastMessages2["ReplaySearchSessionTime"] = 12] = "ReplaySearchSessionTime";
  BroadcastMessages2[BroadcastMessages2["VideoCapture"] = 13] = "VideoCapture";
  BroadcastMessages2[BroadcastMessages2["UnusedPlaceholder"] = 14] = "UnusedPlaceholder";
  return BroadcastMessages2;
})(BroadcastMessages || {});
var ChatCommand = /* @__PURE__ */ ((ChatCommand2) => {
  ChatCommand2[ChatCommand2["Macro"] = 0] = "Macro";
  ChatCommand2[ChatCommand2["BeginChat"] = 1] = "BeginChat";
  ChatCommand2[ChatCommand2["Reply"] = 2] = "Reply";
  ChatCommand2[ChatCommand2["Cancel"] = 3] = "Cancel";
  return ChatCommand2;
})(ChatCommand || {});
var TelemetryCommand = /* @__PURE__ */ ((TelemetryCommand2) => {
  TelemetryCommand2[TelemetryCommand2["Stop"] = 0] = "Stop";
  TelemetryCommand2[TelemetryCommand2["Start"] = 1] = "Start";
  TelemetryCommand2[TelemetryCommand2["Restart"] = 2] = "Restart";
  return TelemetryCommand2;
})(TelemetryCommand || {});
var ReloadTexturesCommand = /* @__PURE__ */ ((ReloadTexturesCommand2) => {
  ReloadTexturesCommand2[ReloadTexturesCommand2["All"] = 0] = "All";
  ReloadTexturesCommand2[ReloadTexturesCommand2["CarIndex"] = 1] = "CarIndex";
  return ReloadTexturesCommand2;
})(ReloadTexturesCommand || {});
var SIM_STATUS_URI = "http://127.0.0.1:32034/get_sim_status?object=simStatus";
var getSimStatus = () => new Promise((resolve, reject) => {
  const req = http.get(SIM_STATUS_URI, (res) => {
    let data = "";
    res.on("data", (d) => {
      data += d;
    });
    res.on("end", () => {
      if (typeof data !== "string") {
        reject(new Error("Invalid payload from sim received"));
      }
      resolve(data.includes("running:1"));
    });
  });
  req.on("error", (err) => {
    reject(err);
  });
});
function copyTelemData(src, key, dest) {
  dest[key] = { ...src };
  if (src.varType === 1) {
    dest[key].value = [];
    const arr = new Int8Array(src.value);
    arr.forEach((val, i) => {
      dest[key].value[i] = !!val;
    });
    return;
  }
  if (src.varType === 2 || src.varType === 3) {
    dest[key].value = [...new Int32Array(src.value)];
  } else if (src.varType === 4) {
    dest[key].value = [...new Float32Array(src.value)];
  } else if (src.varType === 5) {
    dest[key].value = [...new Float64Array(src.value)];
  }
}
var DefaultConfig = {
  logLevel: LogLevel.None,
  autoEnableTelemetry: false,
  useTelemVariableCache: true
};
var IRacingSDK = class _IRacingSDK {
  constructor(config) {
    // Public
    /**
     * Enable attempting to auto-start telemetry when starting the SDK (if it is not running).
     * @default false
     */
    __publicField(this, "autoEnableTelemetry", DefaultConfig.autoEnableTelemetry);
    /**
     * The logging level to use when calling irsdk-node API's. Defaults to 0 (LogLevel.None).
     * @default 0
     */
    __publicField(this, "logLevel", DefaultConfig.logLevel);
    /**
     * Whether or not to use an internal look-up cache when fetching Telemetry Variables by
     * name. This can provide a performance benefit, but may produce unwanted behaviour when
     * enabled in long-running processes where access of niche, car-specific variables over
     * multiple sessions is common.
     *
     * When enabled, if being used in long-running processes it is recommended to clear the
     * cache whenever you detect the player has changed cars.
     *
     * @default true
     */
    __publicField(this, "useTelemVariableCache", DefaultConfig.useTelemVariableCache);
    // Private
    __publicField(this, "_dataVer", -1);
    __publicField(this, "_sessionData", null);
    __publicField(this, "_sdk");
    __publicField(this, "_resolvedConfig");
    __publicField(this, "_variableIndexCache", {});
    this._resolvedConfig = {
      ...DefaultConfig,
      ...config ?? {}
    };
    const loggingLevel = this._resolvedConfig.logLevel ?? DefaultConfig.logLevel;
    const autoEnableTelemetry = this._resolvedConfig.autoEnableTelemetry ?? DefaultConfig.autoEnableTelemetry;
    const useTelemVariableCache = this._resolvedConfig.useTelemVariableCache ?? DefaultConfig.useTelemVariableCache;
    this._sdk = new NativeSDK();
    this._sdk.logLevel = loggingLevel;
    this.autoEnableTelemetry = autoEnableTelemetry;
    this.useTelemVariableCache = useTelemVariableCache;
    void _IRacingSDK.IsSimRunning();
  }
  /**
   * Gets the cached variable index from the internal cache, if it exists, otherwise
   * requests the index from the native module.
   *
   * @param varName The variable to grab from the cache.
   * @returns The index of the variable in the variable list.
   */
  _fetchVariableIndexFromCache(varName) {
    const cachedIndex = this._variableIndexCache[varName];
    if (typeof cachedIndex === "number") {
      return cachedIndex;
    }
    const currentIndex = this._sdk.getTelemetryVariableIndex(varName);
    if (currentIndex === null) {
      return null;
    }
    this._variableIndexCache[varName] = currentIndex;
    return currentIndex;
  }
  /**
   * Wait for the SDK module to resolve and load.
   * @deprecated This is no longer needed as of v4.0.3. Please remove.
   */
  async ready() {
    return Promise.resolve(true);
  }
  /**
   * The current version number of the session data. Increments internally every time data changes.
   * @property {number}
   * @readonly
   */
  get currDataVersion() {
    return this._sdk.currDataVersion;
  }
  /** Whether or not to enable verbose logging in the SDK.
   * @property {boolean}
   */
  get enableLogging() {
    return this._sdk.logLevel !== LogLevel.None;
  }
  set enableLogging(value) {
    this._sdk.logLevel = value ? LogLevel.Error : LogLevel.None;
  }
  // @todo: add getter for current session string version
  /**
   * Checks whether the simulation service is running.
   * @returns {boolean} True if the service is running.
   */
  static async IsSimRunning() {
    try {
      const result = await getSimStatus();
      return result;
    } catch (e) {
      error("Could not successfully determine sim status:", e);
    }
    return false;
  }
  get sessionStatusOK() {
    return this._sdk.isRunning();
  }
  /**
   * Starts the native iRacing SDK and begins subscribing for data.
   * @returns {boolean} If the SDK started successfully.
   */
  startSDK() {
    this.resetTelemetryVariableCache();
    if (!this._sdk.isRunning()) {
      const successful = this._sdk.startSDK();
      if (this.autoEnableTelemetry) {
        this.enableTelemetry(true);
      }
      return successful;
    }
    return true;
  }
  /**
   * Stops the SDK from running and resets the data version.
   */
  stopSDK() {
    this._sdk.stopSDK();
    this._dataVer = -1;
    this.resetTelemetryVariableCache();
  }
  /**
   * Wait for new data from the sdk.
   * @param {number} timeout Timeout (in ms). Max is 60fps (1/60)
   */
  waitForData(timeout) {
    const result = this._sdk.waitForData(timeout);
    if (!result && this._sdk.currDataVersion === -1) {
      this._dataVer = -1;
      this._sessionData = null;
    }
    return result;
  }
  /**
   * Gets the current session data (from yaml format).
   * @returns {SessionData}
   */
  getSessionData() {
    if (this._sessionData && this._dataVer === this.currDataVersion)
      return this._sessionData;
    try {
      const seshString = this._sdk.getSessionData();
      this._sessionData = load(seshString.replaceAll(": ,", ": 0,"));
      return this._sessionData;
    } catch (err) {
      error("There was an error getting session data:", err);
    }
    return null;
  }
  /**
   * Gets the version number of the latest session data from the SDK.
   */
  getSessionVersionNum() {
    return this._sdk.getSessionVersionNum();
  }
  /**
   * Gets the ID for the current (or previous, if none active) connection.
   */
  getSessionConnectionID() {
    return this._sdk.getSessionConnectionID();
  }
  /**
   * Gets the current weekend info from the session data
   * @returns {WeekendInfo}
   */
  getWeekendInfo() {
    const session = this.getSessionData();
    return (session == null ? void 0 : session.WeekendInfo) ?? null;
  }
  /**
   * Gets the current session info from the session data.
   * @returns {SessionInfo}
   */
  getSessionInfo() {
    const session = this.getSessionData();
    return (session == null ? void 0 : session.SessionInfo) ?? null;
  }
  /**
   * Gets the current camera info from the session data.
   * @returns {CameraInfo}
   */
  getCameraInfo() {
    const session = this.getSessionData();
    return (session == null ? void 0 : session.CameraInfo) ?? null;
  }
  /**
   * Gets the current radio info from the session data.
   * @returns {RadioInfo}
   */
  getRadioInfo() {
    const session = this.getSessionData();
    return (session == null ? void 0 : session.RadioInfo) ?? null;
  }
  /**
   * Gets the current driver info from the session data.
   * @returns {DriverInfo}
   */
  getDriverInfo() {
    const session = this.getSessionData();
    return (session == null ? void 0 : session.DriverInfo) ?? null;
  }
  /**
   * Gets the current split time info from the session data.
   * @returns {SplitTimeInfo}
   */
  getSplitInfo() {
    const session = this.getSessionData();
    return (session == null ? void 0 : session.SplitTimeInfo) ?? null;
  }
  /**
   * Gets the current session info from the session data.
   * @returns {CarSetupInfo}
   */
  getCarSetupInfo() {
    const session = this.getSessionData();
    return (session == null ? void 0 : session.CarSetup) ?? null;
  }
  /**
   * Get the current value of the telemetry variables.
   *
   * Telemetry gets updated every tick. This is a large object, so large amounts
   * of processing between ticks should attempt to cache this data instead of
   * re-requesting it via this function.
   */
  getTelemetry() {
    const rawData = this._sdk.getTelemetryData();
    const data = {};
    if (Object.keys(rawData).length > 0) {
      Object.keys(rawData).forEach((dataKey) => {
        copyTelemData(
          rawData[dataKey],
          dataKey,
          data
        );
      });
    }
    return data;
  }
  getTelemetryVariable(telemVar) {
    let resolvedTelemVar = telemVar;
    if (this.useTelemVariableCache && typeof telemVar === "string") {
      const cachedIndex = this._fetchVariableIndexFromCache(telemVar);
      if (cachedIndex === null) {
        return null;
      }
      resolvedTelemVar = cachedIndex;
    }
    const rawData = this._sdk.getTelemetryVariable(resolvedTelemVar);
    if (!rawData) {
      return null;
    }
    const parsed = {};
    copyTelemData(
      rawData,
      // eslint-disable-line
      rawData.name,
      parsed
    );
    return parsed[rawData.name];
  }
  /**
   * Resets the internal telemetry variable lookup cache. This occurs automatically
   * whenever the SDK starts and stops, and is only necessary to call if:
   *
   * - `.useTelemVariableCache` is enabled via the `Config` passed to the `IRacingSDK` constructor
   * or by the propertyy on the IRacingSDK instance.
   * - The SDK is being used in a long-running process where potentially niche variables (variables
   * only available for one car) are frequently accessed and the player changes between cars with
   * these niche variables frequently.
   *
   * If that is the case, this function should be called whenever it is detected that the player
   * has changed cars, to make sure there are no stale variables in the cache.
   */
  resetTelemetryVariableCache() {
    this._variableIndexCache = {};
  }
  // Broadcast commands
  enableTelemetry(enabled) {
    const command = enabled ? TelemetryCommand.Start : TelemetryCommand.Stop;
    this._sdk.broadcast(BroadcastMessages.TelemCommand, command);
  }
  restartTelemetry() {
    this._sdk.broadcast(BroadcastMessages.TelemCommand, TelemetryCommand.Restart);
  }
  changeCameraPosition(position, group, camera) {
    this._sdk.broadcast(BroadcastMessages.CameraSwitchPos, position, group, camera);
  }
  // @todo: needs to be padded
  changeCameraNumber(driver, group, camera) {
    this._sdk.broadcast(BroadcastMessages.CameraSwitchNum, driver, group, camera);
  }
  changeCameraState(state) {
    this._sdk.broadcast(BroadcastMessages.CameraSetState, state);
  }
  changeReplaySpeed(speed, slowMotion) {
    this._sdk.broadcast(BroadcastMessages.ReplaySetPlaySpeed, speed, slowMotion ? 1 : 0);
  }
  changeReplayPosition(position, frame) {
    this._sdk.broadcast(BroadcastMessages.ReplaySetPlayPosition, position, frame);
  }
  searchReplay(command) {
    this._sdk.broadcast(BroadcastMessages.ReplaySearch, command);
  }
  changeReplayState(state) {
    this._sdk.broadcast(BroadcastMessages.ReplaySetState, state);
  }
  triggerReplaySessionSearch(session, time) {
    this._sdk.broadcast(BroadcastMessages.ReplaySearchSessionTime, session, time);
  }
  reloadAllTextures() {
    this._sdk.broadcast(BroadcastMessages.ReloadTextures, ReloadTexturesCommand.All, 0);
  }
  reloadCarTextures(car) {
    this._sdk.broadcast(
      BroadcastMessages.ReloadTextures,
      ReloadTexturesCommand.CarIndex,
      car
    );
  }
  triggerChatState(state) {
    this._sdk.broadcast(BroadcastMessages.ChatCommand, state);
  }
  /**
   * @param {number} macro Between 1 - 15
   */
  triggerChatMacro(macro) {
    const clamped = Math.min(15, Math.max(1, macro));
    this._sdk.broadcast(BroadcastMessages.ChatCommand, ChatCommand.Macro, clamped);
  }
  triggerPitClearCommand(command) {
    this._sdk.broadcast(BroadcastMessages.PitCommand, command, 0);
  }
  triggerPitCommand(command) {
    this._sdk.broadcast(BroadcastMessages.PitCommand, command, 0);
  }
  triggerPitChange(command, amount) {
    this._sdk.broadcast(BroadcastMessages.PitCommand, command, amount);
  }
  changeFFB(mode, amount) {
    this._sdk.broadcast(BroadcastMessages.FFBCommand, mode, amount);
  }
  triggerVideoCapture(command) {
    this._sdk.broadcast(BroadcastMessages.VideoCapture, command);
  }
  /**
   * Trigger a broadcast manually, without any safety guard rails. Only use if
   * you know what you are doing!
   *
   * The function still uses the SDK type map for type-awareness. If you need to
   * turn these off for some reason, toss @ts-expect-error in a command on the
   * line before it to disable the type safety.
   *
   * @param {BroadcastMessages} message The Broadcast Message type.
   * @param args Args for the message. Can be up to 3 numbers.
   */
  broadcastUnsafe(message, ...args) {
    return this._sdk.broadcast(message, ...args);
  }
};
class MockTelemetryService {
  constructor(ipcSender) {
    this.ipcSender = ipcSender;
    this.isRunning = false;
    this.sessionTime = 0;
  }
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("Mock Telemetry started");
    const sessionData = {
      data: {
        WeekendInfo: {
          TrackLength: "4.00 km"
        },
        DriverInfo: {
          DriverCarIdx: 1,
          Drivers: [
            { CarIdx: 0, UserName: "Mock Driver 1", CarNumber: "1", iRating: 2500, LicString: "A 3.50", CarClassColor: 16711680 },
            { CarIdx: 1, UserName: "Mock Driver 2 (Player)", CarNumber: "2", iRating: 2100, LicString: "B 2.10", CarClassColor: 65280 },
            { CarIdx: 2, UserName: "Mock Driver 3", CarNumber: "42", iRating: 1800, LicString: "C 3.99", CarClassColor: 65280 },
            { CarIdx: 3, UserName: "Mock Driver 4", CarNumber: "99", iRating: 3100, LicString: "A 4.99", CarClassColor: 16711680 }
          ]
        }
      }
    };
    const loop = () => {
      if (!this.isRunning) return;
      this.sessionTime += 0.033;
      this.tickCount = (this.tickCount || 0) + 1;
      if (this.tickCount % 30 === 0) {
        this.ipcSender("session-info", sessionData);
      }
      const throttle = Math.max(0, Math.sin(this.sessionTime * 2));
      const brake = Math.max(0, -Math.sin(this.sessionTime * 2));
      const steering = Math.sin(this.sessionTime) * 1.5;
      const gear = Math.floor(Math.abs(Math.sin(this.sessionTime * 0.5) * 6)) + 1;
      const rpm = 3e3 + throttle * 4e3;
      const speed = gear * 30 + throttle * 20;
      const fuelLevel = Math.max(0, 50 - this.sessionTime * 0.05);
      const playerDist = Math.abs(this.sessionTime * 0.01 % 1);
      const car0Dist = Math.abs((this.sessionTime * 0.01 + Math.sin(this.sessionTime * 0.2) * 5e-3) % 1);
      const car2Dist = Math.abs((this.sessionTime * 0.01 + Math.cos(this.sessionTime * 0.15) * 8e-3) % 1);
      const car3Dist = Math.abs((this.sessionTime * 0.01 - this.sessionTime * 2e-3 % 0.02) % 1);
      let delta0 = car0Dist - playerDist;
      if (delta0 > 0.5) delta0 -= 1;
      if (delta0 < -0.5) delta0 += 1;
      let delta2 = car2Dist - playerDist;
      if (delta2 > 0.5) delta2 -= 1;
      if (delta2 < -0.5) delta2 += 1;
      let delta3 = car3Dist - playerDist;
      if (delta3 > 0.5) delta3 -= 1;
      if (delta3 < -0.5) delta3 += 1;
      let leftRight = 1;
      if (Math.abs(delta0 * 4e3) < 5) leftRight = 2;
      else if (Math.abs(delta2 * 4e3) < 5) leftRight = 3;
      else if (Math.abs(delta3 * 4e3) < 5) leftRight = 3;
      const telemetry = {
        values: {
          SessionTime: this.sessionTime,
          FuelLevel: fuelLevel,
          FuelUsePerHour: 15.5,
          SteeringWheelAngle: steering,
          Throttle: throttle,
          Brake: brake,
          Clutch: 0,
          Gear: gear,
          RPM: rpm,
          Speed: speed,
          CarIdxPosition: [1, 3, 4, 2],
          CarIdxClassPosition: [1, 3, 4, 2],
          CarIdxEstTime: [100.1, 100.5, 102, 100.3],
          CarIdxF2Time: [1.2, 5.5, 15, 2.3],
          CarIdxLap: [10, 10, 10, 10],
          CarIdxLapDistPct: [car0Dist, playerDist, car2Dist, car3Dist],
          CarLeftRight: leftRight
        }
      };
      const payload = this.filterTelemetry(telemetry);
      this.ipcSender("telemetry-update", payload);
      setTimeout(loop, 33);
    };
    loop();
  }
  stop() {
    this.isRunning = false;
  }
  filterTelemetry(data) {
    const values = (data == null ? void 0 : data.values) || data || {};
    const grid = {};
    for (let i = 0; i < 64; i++) {
      if (values.CarIdxPosition && values.CarIdxPosition[i] > 0) {
        grid[i] = {
          Position: values.CarIdxPosition[i],
          ClassPosition: values.CarIdxClassPosition ? values.CarIdxClassPosition[i] : 0,
          LapDistPct: values.CarIdxLapDistPct ? values.CarIdxLapDistPct[i] : 0,
          Lap: values.CarIdxLap ? values.CarIdxLap[i] : 0,
          LastLapTime: values.CarIdxLastLapTime ? values.CarIdxLastLapTime[i] : -1,
          TrackSurface: values.CarIdxTrackSurface ? values.CarIdxTrackSurface[i] : 3,
          OnPitRoad: values.CarIdxOnPitRoad ? values.CarIdxOnPitRoad[i] : false
        };
      }
    }
    return {
      SessionTime: values.SessionTime,
      player_name: "Mock Driver 2 (Player)",
      FuelLevel: values.FuelLevel || 0,
      FuelUsePerHour: values.FuelUsePerHour || 0,
      SteeringWheelAngle: values.SteeringWheelAngle || 0,
      Throttle: values.Throttle || 0,
      Brake: values.Brake || 0,
      Clutch: values.Clutch || 0,
      Gear: values.Gear || 0,
      RPM: values.RPM || 0,
      Speed: values.Speed || 0,
      CarLeftRight: values.CarLeftRight || 0,
      grid
    };
  }
}
class TelemetryService {
  constructor(ipcSender) {
    this.ipcSender = ipcSender;
    this.iracing = new IRacingSDK();
    this.isRunning = false;
    this.mockService = null;
  }
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const isRunning = await IRacingSDK.IsSimRunning();
    if (!isRunning) {
      console.warn("iRacing is not running.");
      if (process.env.VITE_DEV_SERVER_URL) {
        console.log("Starting Mock Telemetry as fallback...");
        this.mockService = new MockTelemetryService(this.ipcSender);
        this.mockService.start();
        return;
      }
    }
    this.iracing.startSDK();
    const TIMEOUT = Math.floor(1 / 30 * 1e3);
    const loop = () => {
      if (!this.isRunning) return;
      if (this.mockService) return;
      if (this.iracing.waitForData(TIMEOUT)) {
        const session = this.iracing.getSessionData();
        const telemetry = this.iracing.getTelemetry();
        if (session) {
          this.ipcSender("session-info", { data: session });
        }
        if (telemetry) {
          const payload = this.filterTelemetry(telemetry);
          this.ipcSender("telemetry-update", payload);
        }
      }
      setTimeout(loop, 10);
    };
    loop();
  }
  stop() {
    this.isRunning = false;
    if (this.mockService) {
      this.mockService.stop();
      this.mockService = null;
    } else {
      this.iracing.stopSDK();
    }
  }
  filterTelemetry(data) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const values = (data == null ? void 0 : data.values) || data || {};
    const grid = {};
    for (let i = 0; i < 64; i++) {
      if (values.CarIdxPosition && values.CarIdxPosition[i] > 0) {
        grid[i] = {
          Position: values.CarIdxPosition[i],
          ClassPosition: values.CarIdxClassPosition ? values.CarIdxClassPosition[i] : 0,
          LapDistPct: values.CarIdxLapDistPct ? values.CarIdxLapDistPct[i] : 0,
          Lap: values.CarIdxLap ? values.CarIdxLap[i] : 0,
          LastLapTime: values.CarIdxLastLapTime ? values.CarIdxLastLapTime[i] : -1,
          TrackSurface: values.CarIdxTrackSurface ? values.CarIdxTrackSurface[i] : 3,
          OnPitRoad: values.CarIdxOnPitRoad ? values.CarIdxOnPitRoad[i] : false
        };
      }
    }
    return {
      SessionTime: values.SessionTime,
      player_name: ((_h = (_g = (_c = (_b = (_a = data == null ? void 0 : data.sessionInfo) == null ? void 0 : _a.data) == null ? void 0 : _b.DriverInfo) == null ? void 0 : _c.Drivers) == null ? void 0 : _g[(_f = (_e = (_d = data == null ? void 0 : data.sessionInfo) == null ? void 0 : _d.data) == null ? void 0 : _e.DriverInfo) == null ? void 0 : _f.DriverCarIdx]) == null ? void 0 : _h.UserName) || "",
      FuelLevel: values.FuelLevel || 0,
      FuelUsePerHour: values.FuelUsePerHour || 0,
      SteeringWheelAngle: values.SteeringWheelAngle || 0,
      Throttle: values.Throttle || 0,
      Brake: values.Brake || 0,
      Clutch: values.Clutch || 0,
      Gear: values.Gear || 0,
      RPM: values.RPM || 0,
      Speed: values.Speed || 0,
      CarLeftRight: values.CarLeftRight || 0,
      grid
    };
  }
}
class Store {
  constructor(opts) {
    const userDataPath = app.getPath("userData");
    this.path = path.join(userDataPath, opts.configName + ".json");
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
  } catch (error2) {
    return defaults;
  }
}
let windowManager;
app.whenReady().then(() => {
  const store = new Store({
    configName: "user-preferences",
    defaults: {
      overlays: {
        standings: { enabled: false, x: 100, y: 100, width: 400, height: 600, clickThrough: false },
        relative: { enabled: false, x: 500, y: 100, width: 400, height: 600, clickThrough: false },
        fuel: { enabled: false, x: 100, y: 750, width: 250, height: 150, clickThrough: false },
        inputs: { enabled: false, x: 400, y: 750, width: 300, height: 150, clickThrough: false }
      }
    }
  });
  windowManager = new WindowManager(store);
  windowManager.createDashboard();
  const overlays = store.get("overlays") || {};
  Object.keys(overlays).forEach((id) => {
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
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createDashboard();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
