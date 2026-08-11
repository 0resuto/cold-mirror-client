var yr = Object.defineProperty;
var br = (n, r, i) => r in n ? yr(n, r, { enumerable: !0, configurable: !0, writable: !0, value: i }) : n[r] = i;
var K = (n, r, i) => br(n, typeof r != "symbol" ? r + "" : r, i);
import { ipcMain as Pe, BrowserWindow as va, app as xe } from "electron";
import Ne from "path";
import { fileURLToPath as Rr } from "url";
import { error as La, warn as Pr, log as Ar } from "node:console";
import { join as xr, dirname as kr } from "node:path";
import { fileURLToPath as _r } from "node:url";
import qe from "fs";
import Mr from "os";
import wr from "node:http";
const Fr = Rr(import.meta.url), Ke = Ne.dirname(Fr);
class Or {
  constructor(r) {
    this.windows = /* @__PURE__ */ new Map(), this.store = r, this.setupIpc();
  }
  setupIpc() {
    Pe.on("set-ignore-mouse-events", (r, i, d) => {
      const t = va.fromWebContents(r.sender);
      t && t.setIgnoreMouseEvents(i, d);
    }), Pe.on("window-action", (r, { windowId: i, action: d, payload: t }) => {
      const u = this.windows.get(i);
      if (u)
        switch (d) {
          case "close":
            if (i.startsWith("overlay-")) {
              const p = i.replace("overlay-", "");
              this.toggleOverlay(p, !1);
            } else
              u.close();
            break;
          case "minimize":
            u.minimize();
            break;
          case "maximize":
            u.isMaximized() ? u.unmaximize() : u.maximize();
            break;
          case "move":
            u.setPosition(t.x, t.y);
            break;
          case "resize":
            if (u.setSize(t.width, t.height), i.startsWith("overlay-")) {
              const p = i.replace("overlay-", ""), m = this.store.get("overlays") || {};
              m[p] && (m[p].width = t.width, m[p].height = t.height, this.store.set("overlays", m));
            }
            break;
        }
    }), Pe.handle("get-settings", () => this.store.getAll()), Pe.on("update-overlay-setting", (r, { id: i, settings: d }) => {
      const t = this.store.get("overlays") || {};
      t[i] = { ...t[i], ...d }, this.store.set("overlays", t);
      const u = this.windows.get(`overlay-${i}`);
      u && d.clickThrough !== void 0 && u.setIgnoreMouseEvents(d.clickThrough, { forward: !0 }), this.broadcast("settings-updated", this.store.getAll());
    }), Pe.on("toggle-overlay", (r, i, d) => {
      this.toggleOverlay(i, d);
    });
  }
  toggleOverlay(r, i) {
    const d = this.store.get("overlays") || {};
    d[r] || (d[r] = {});
    const t = i !== void 0 ? i : !d[r].enabled;
    if (d[r].enabled = t, this.store.set("overlays", d), t)
      this.createOverlay(r, d[r]);
    else {
      const u = this.windows.get(`overlay-${r}`);
      u && !u.isDestroyed() && u.close();
    }
    this.broadcast("settings-updated", this.store.getAll());
  }
  createWindow(r, i = {}, d = {}) {
    if (this.windows.has(r))
      return this.windows.get(r).focus(), this.windows.get(r);
    const t = new va({
      ...i,
      icon: Ne.join(Ke, "../app_icon.ico"),
      webPreferences: {
        preload: Ne.join(Ke, "preload.mjs"),
        nodeIntegration: !1,
        contextIsolation: !0,
        ...i.webPreferences
      }
    }), u = new URLSearchParams(d).toString();
    return process.env.VITE_DEV_SERVER_URL ? t.loadURL(`${process.env.VITE_DEV_SERVER_URL}?${u}`) : t.loadFile(Ne.join(Ke, "../dist/index.html"), { query: d }), t.on("resized", () => this.saveBounds(r, t)), t.on("moved", () => this.saveBounds(r, t)), t.on("maximize", () => t.webContents.send("maximize-state", !0)), t.on("unmaximize", () => t.webContents.send("maximize-state", !1)), t.on("closed", () => {
      this.windows.delete(r);
    }), this.windows.set(r, t), t;
  }
  saveBounds(r, i) {
    if (!r.startsWith("overlay-")) return;
    const d = r.replace("overlay-", ""), t = i.getBounds(), u = this.store.get("overlays") || {};
    u[d] && (u[d].x = t.x, u[d].y = t.y, u[d].width = t.width, u[d].height = t.height, this.store.set("overlays", u));
  }
  createDashboard() {
    return this.createWindow("dashboard", {
      width: 900,
      height: 650,
      frame: !1,
      transparent: !0,
      hasShadow: !1
    }, { window: "dashboard" });
  }
  createOverlay(r, i = {}) {
    const d = {
      inputs: 300,
      radar: 100,
      trackmap: 400,
      weather: 420,
      pit: 380,
      dash: 400
    }, t = {
      inputs: 120,
      radar: 150,
      trackmap: 80,
      weather: 60,
      pit: 100,
      dash: 200
    }, u = this.createWindow(`overlay-${r}`, {
      width: i.width || (r === "trackmap" ? 800 : r === "weather" || r === "pit" ? 420 : r === "dash" ? 600 : 400),
      height: i.height || (r === "trackmap" || r === "weather" ? 80 : r === "pit" ? 140 : r === "dash" ? 300 : 600),
      minWidth: d[r] || 150,
      minHeight: t[r] || 150,
      x: i.x,
      y: i.y,
      frame: !1,
      transparent: !0,
      alwaysOnTop: !0,
      hasShadow: !1,
      skipTaskbar: !0
    }, { window: "overlay", type: r, id: `overlay-${r}` });
    return i.clickThrough && u.setIgnoreMouseEvents(!0, { forward: !0 }), u;
  }
  getAllWindows() {
    return Array.from(this.windows.values());
  }
  broadcast(r, i) {
    this.windows.forEach((d) => {
      d.isDestroyed() || d.webContents.send(r, i);
    });
  }
}
function Er(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
function ar(n) {
  throw new Error('Could not dynamically require "' + n + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var Xe = { exports: {} }, $e, ba;
function Ur() {
  if (ba) return $e;
  ba = 1;
  var n = qe, r = Ne, i = Mr, d = typeof __webpack_require__ == "function" ? __non_webpack_require__ : ar, t = process.config && process.config.variables || {}, u = !!process.env.PREBUILDS_ONLY, p = process.versions.modules, m = ee() ? "electron" : oe() ? "node-webkit" : "node", N = process.env.npm_config_arch || i.arch(), o = process.env.npm_config_platform || i.platform(), c = process.env.LIBC || (ge(o) ? "musl" : "glibc"), D = process.env.ARM_VERSION || (N === "arm64" ? "8" : t.arm_version) || "", A = (process.versions.uv || "").split(".")[0];
  $e = k;
  function k(M) {
    return d(k.resolve(M));
  }
  k.resolve = k.path = function(M) {
    M = r.resolve(M || ".");
    try {
      var E = d(r.join(M, "package.json")).name.toUpperCase().replace(/-/g, "_");
      process.env[E + "_PREBUILD"] && (M = process.env[E + "_PREBUILD"]);
    } catch {
    }
    if (!u) {
      var w = _(r.join(M, "build/Release"), q);
      if (w) return w;
      var O = _(r.join(M, "build/Debug"), q);
      if (O) return O;
    }
    var Z = Q(M);
    if (Z) return Z;
    var y = Q(r.dirname(process.execPath));
    if (y) return y;
    var ue = [
      "platform=" + o,
      "arch=" + N,
      "runtime=" + m,
      "abi=" + p,
      "uv=" + A,
      D ? "armv=" + D : "",
      "libc=" + c,
      "node=" + process.versions.node,
      process.versions.electron ? "electron=" + process.versions.electron : "",
      typeof __webpack_require__ == "function" ? "webpack=true" : ""
      // eslint-disable-line
    ].filter(Boolean).join(" ");
    throw new Error("No native build was found for " + ue + `
    loaded from: ` + M + `
`);
    function Q(de) {
      var ae = j(r.join(de, "prebuilds")).map(G), Se = ae.filter(H(o, N)).sort(W)[0];
      if (Se) {
        var ce = r.join(de, "prebuilds", Se.name), Ce = j(ce).map(X), ve = Ce.filter($(m, p)), z = ve.sort(le(m))[0];
        if (z) return r.join(ce, z.file);
      }
    }
  };
  function j(M) {
    try {
      return n.readdirSync(M);
    } catch {
      return [];
    }
  }
  function _(M, E) {
    var w = j(M).filter(E);
    return w[0] && r.join(M, w[0]);
  }
  function q(M) {
    return /\.node$/.test(M);
  }
  function G(M) {
    var E = M.split("-");
    if (E.length === 2) {
      var w = E[0], O = E[1].split("+");
      if (w && O.length && O.every(Boolean))
        return { name: M, platform: w, architectures: O };
    }
  }
  function H(M, E) {
    return function(w) {
      return w == null || w.platform !== M ? !1 : w.architectures.includes(E);
    };
  }
  function W(M, E) {
    return M.architectures.length - E.architectures.length;
  }
  function X(M) {
    var E = M.split("."), w = E.pop(), O = { file: M, specificity: 0 };
    if (w === "node") {
      for (var Z = 0; Z < E.length; Z++) {
        var y = E[Z];
        if (y === "node" || y === "electron" || y === "node-webkit")
          O.runtime = y;
        else if (y === "napi")
          O.napi = !0;
        else if (y.slice(0, 3) === "abi")
          O.abi = y.slice(3);
        else if (y.slice(0, 2) === "uv")
          O.uv = y.slice(2);
        else if (y.slice(0, 4) === "armv")
          O.armv = y.slice(4);
        else if (y === "glibc" || y === "musl")
          O.libc = y;
        else
          continue;
        O.specificity++;
      }
      return O;
    }
  }
  function $(M, E) {
    return function(w) {
      return !(w == null || w.runtime && w.runtime !== M && !pe(w) || w.abi && w.abi !== E && !w.napi || w.uv && w.uv !== A || w.armv && w.armv !== D || w.libc && w.libc !== c);
    };
  }
  function pe(M) {
    return M.runtime === "node" && M.napi;
  }
  function le(M) {
    return function(E, w) {
      return E.runtime !== w.runtime ? E.runtime === M ? -1 : 1 : E.abi !== w.abi ? E.abi ? -1 : 1 : E.specificity !== w.specificity ? E.specificity > w.specificity ? -1 : 1 : 0;
    };
  }
  function oe() {
    return !!(process.versions && process.versions.nw);
  }
  function ee() {
    return process.versions && process.versions.electron || process.env.ELECTRON_RUN_AS_NODE ? !0 : typeof window < "u" && window.process && window.process.type === "renderer";
  }
  function ge(M) {
    return M === "linux" && n.existsSync("/etc/alpine-release");
  }
  return k.parseTags = X, k.matchTags = $, k.compareTags = le, k.parseTuple = G, k.matchTuple = H, k.compareTuples = W, $e;
}
var Ra;
function Hr() {
  if (Ra) return Xe.exports;
  Ra = 1;
  const n = typeof __webpack_require__ == "function" ? __non_webpack_require__ : ar;
  return typeof n.addon == "function" ? Xe.exports = n.addon.bind(n) : Xe.exports = Ur(), Xe.exports;
}
var Vr = Hr();
const Wr = /* @__PURE__ */ Er(Vr);
function Xr(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var Y = {}, Be = {}, fe = {}, Pa;
function ke() {
  if (Pa) return fe;
  Pa = 1;
  function n(p) {
    return typeof p > "u" || p === null;
  }
  function r(p) {
    return typeof p == "object" && p !== null;
  }
  function i(p) {
    return Array.isArray(p) ? p : n(p) ? [] : [p];
  }
  function d(p, m) {
    if (m) {
      const N = Object.keys(m);
      for (let o = 0, c = N.length; o < c; o += 1) {
        const D = N[o];
        p[D] = m[D];
      }
    }
    return p;
  }
  function t(p, m) {
    let N = "";
    for (let o = 0; o < m; o += 1)
      N += p;
    return N;
  }
  function u(p) {
    return p === 0 && Number.NEGATIVE_INFINITY === 1 / p;
  }
  return fe.isNothing = n, fe.isObject = r, fe.toArray = i, fe.repeat = t, fe.isNegativeZero = u, fe.extend = d, fe;
}
var Qe, Aa;
function _e() {
  if (Aa) return Qe;
  Aa = 1;
  function n(i, d) {
    let t = "";
    const u = i.reason || "(unknown reason)";
    return i.mark ? (i.mark.name && (t += 'in "' + i.mark.name + '" '), t += "(" + (i.mark.line + 1) + ":" + (i.mark.column + 1) + ")", !d && i.mark.snippet && (t += `

` + i.mark.snippet), u + " " + t) : u;
  }
  function r(i, d) {
    Error.call(this), this.name = "YAMLException", this.reason = i, this.mark = d, this.message = n(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
  }
  return r.prototype = Object.create(Error.prototype), r.prototype.constructor = r, r.prototype.toString = function(d) {
    return this.name + ": " + n(this, d);
  }, Qe = r, Qe;
}
var Ze, xa;
function Br() {
  if (xa) return Ze;
  xa = 1;
  const n = ke();
  function r(t, u, p, m, N) {
    let o = "", c = "";
    const D = Math.floor(N / 2) - 1;
    return m - u > D && (o = " ... ", u = m - D + o.length), p - m > D && (c = " ...", p = m + D - c.length), {
      str: o + t.slice(u, p).replace(/\t/g, "→") + c,
      pos: m - u + o.length
      // relative position
    };
  }
  function i(t, u) {
    return n.repeat(" ", u - t.length) + t;
  }
  function d(t, u) {
    if (u = Object.create(u || null), !t.buffer) return null;
    u.maxLength || (u.maxLength = 79), typeof u.indent != "number" && (u.indent = 1), typeof u.linesBefore != "number" && (u.linesBefore = 3), typeof u.linesAfter != "number" && (u.linesAfter = 2);
    const p = /\r?\n|\r|\0/g, m = [0], N = [];
    let o, c = -1;
    for (; o = p.exec(t.buffer); )
      N.push(o.index), m.push(o.index + o[0].length), t.position <= o.index && c < 0 && (c = m.length - 2);
    c < 0 && (c = m.length - 1);
    let D = "";
    const A = Math.min(t.line + u.linesAfter, N.length).toString().length, k = u.maxLength - (u.indent + A + 3);
    for (let _ = 1; _ <= u.linesBefore && !(c - _ < 0); _++) {
      const q = r(
        t.buffer,
        m[c - _],
        N[c - _],
        t.position - (m[c] - m[c - _]),
        k
      );
      D = n.repeat(" ", u.indent) + i((t.line - _ + 1).toString(), A) + " | " + q.str + `
` + D;
    }
    const j = r(t.buffer, m[c], N[c], t.position, k);
    D += n.repeat(" ", u.indent) + i((t.line + 1).toString(), A) + " | " + j.str + `
`, D += n.repeat("-", u.indent + A + 3 + j.pos) + `^
`;
    for (let _ = 1; _ <= u.linesAfter && !(c + _ >= N.length); _++) {
      const q = r(
        t.buffer,
        m[c + _],
        N[c + _],
        t.position - (m[c] - m[c + _]),
        k
      );
      D += n.repeat(" ", u.indent) + i((t.line + _ + 1).toString(), A) + " | " + q.str + `
`;
    }
    return D.replace(/\n$/, "");
  }
  return Ze = d, Ze;
}
var ea, ka;
function J() {
  if (ka) return ea;
  ka = 1;
  const n = _e(), r = [
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
  ], i = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function d(u) {
    const p = {};
    return u !== null && Object.keys(u).forEach(function(m) {
      u[m].forEach(function(N) {
        p[String(N)] = m;
      });
    }), p;
  }
  function t(u, p) {
    if (p = p || {}, Object.keys(p).forEach(function(m) {
      if (r.indexOf(m) === -1)
        throw new n('Unknown option "' + m + '" is met in definition of "' + u + '" YAML type.');
    }), this.options = p, this.tag = u, this.kind = p.kind || null, this.resolve = p.resolve || function() {
      return !0;
    }, this.construct = p.construct || function(m) {
      return m;
    }, this.instanceOf = p.instanceOf || null, this.predicate = p.predicate || null, this.represent = p.represent || null, this.representName = p.representName || null, this.defaultStyle = p.defaultStyle || null, this.multi = p.multi || !1, this.styleAliases = d(p.styleAliases || null), i.indexOf(this.kind) === -1)
      throw new n('Unknown kind "' + this.kind + '" is specified for "' + u + '" YAML type.');
  }
  return ea = t, ea;
}
var aa, _a;
function rr() {
  if (_a) return aa;
  _a = 1;
  const n = _e(), r = J();
  function i(u, p) {
    const m = [];
    return u[p].forEach(function(N) {
      let o = m.length;
      m.forEach(function(c, D) {
        c.tag === N.tag && c.kind === N.kind && c.multi === N.multi && (o = D);
      }), m[o] = N;
    }), m;
  }
  function d() {
    const u = {
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
    function p(m) {
      m.multi ? (u.multi[m.kind].push(m), u.multi.fallback.push(m)) : u[m.kind][m.tag] = u.fallback[m.tag] = m;
    }
    for (let m = 0, N = arguments.length; m < N; m += 1)
      arguments[m].forEach(p);
    return u;
  }
  function t(u) {
    return this.extend(u);
  }
  return t.prototype.extend = function(p) {
    let m = [], N = [];
    if (p instanceof r)
      N.push(p);
    else if (Array.isArray(p))
      N = N.concat(p);
    else if (p && (Array.isArray(p.implicit) || Array.isArray(p.explicit)))
      p.implicit && (m = m.concat(p.implicit)), p.explicit && (N = N.concat(p.explicit));
    else
      throw new n("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    m.forEach(function(c) {
      if (!(c instanceof r))
        throw new n("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      if (c.loadKind && c.loadKind !== "scalar")
        throw new n("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      if (c.multi)
        throw new n("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }), N.forEach(function(c) {
      if (!(c instanceof r))
        throw new n("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    });
    const o = Object.create(t.prototype);
    return o.implicit = (this.implicit || []).concat(m), o.explicit = (this.explicit || []).concat(N), o.compiledImplicit = i(o, "implicit"), o.compiledExplicit = i(o, "explicit"), o.compiledTypeMap = d(o.compiledImplicit, o.compiledExplicit), o;
  }, aa = t, aa;
}
var ra, Ma;
function ir() {
  if (Ma) return ra;
  Ma = 1;
  const n = J();
  return ra = new n("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(r) {
      return r !== null ? r : "";
    }
  }), ra;
}
var ia, wa;
function nr() {
  if (wa) return ia;
  wa = 1;
  const n = J();
  return ia = new n("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(r) {
      return r !== null ? r : [];
    }
  }), ia;
}
var na, Fa;
function tr() {
  if (Fa) return na;
  Fa = 1;
  const n = J();
  return na = new n("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(r) {
      return r !== null ? r : {};
    }
  }), na;
}
var ta, Oa;
function sr() {
  if (Oa) return ta;
  Oa = 1;
  const n = rr();
  return ta = new n({
    explicit: [
      ir(),
      nr(),
      tr()
    ]
  }), ta;
}
var sa, Ea;
function lr() {
  if (Ea) return sa;
  Ea = 1;
  const n = J();
  function r(t) {
    if (t === null) return !0;
    const u = t.length;
    return u === 1 && t === "~" || u === 4 && (t === "null" || t === "Null" || t === "NULL");
  }
  function i() {
    return null;
  }
  function d(t) {
    return t === null;
  }
  return sa = new n("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: r,
    construct: i,
    predicate: d,
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
  }), sa;
}
var la, Ua;
function or() {
  if (Ua) return la;
  Ua = 1;
  const n = J();
  function r(t) {
    if (t === null) return !1;
    const u = t.length;
    return u === 4 && (t === "true" || t === "True" || t === "TRUE") || u === 5 && (t === "false" || t === "False" || t === "FALSE");
  }
  function i(t) {
    return t === "true" || t === "True" || t === "TRUE";
  }
  function d(t) {
    return Object.prototype.toString.call(t) === "[object Boolean]";
  }
  return la = new n("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: r,
    construct: i,
    predicate: d,
    represent: {
      lowercase: function(t) {
        return t ? "true" : "false";
      },
      uppercase: function(t) {
        return t ? "TRUE" : "FALSE";
      },
      camelcase: function(t) {
        return t ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  }), la;
}
var oa, Ha;
function ur() {
  if (Ha) return oa;
  Ha = 1;
  const n = ke(), r = J();
  function i(o) {
    return o >= 48 && o <= 57 || o >= 65 && o <= 70 || o >= 97 && o <= 102;
  }
  function d(o) {
    return o >= 48 && o <= 55;
  }
  function t(o) {
    return o >= 48 && o <= 57;
  }
  function u(o) {
    if (o === null) return !1;
    const c = o.length;
    let D = 0, A = !1;
    if (!c) return !1;
    let k = o[D];
    if ((k === "-" || k === "+") && (k = o[++D]), k === "0") {
      if (D + 1 === c) return !0;
      if (k = o[++D], k === "b") {
        for (D++; D < c; D++) {
          if (k = o[D], k !== "0" && k !== "1") return !1;
          A = !0;
        }
        return A && isFinite(p(o));
      }
      if (k === "x") {
        for (D++; D < c; D++) {
          if (!i(o.charCodeAt(D))) return !1;
          A = !0;
        }
        return A && isFinite(p(o));
      }
      if (k === "o") {
        for (D++; D < c; D++) {
          if (!d(o.charCodeAt(D))) return !1;
          A = !0;
        }
        return A && isFinite(p(o));
      }
    }
    for (; D < c; D++) {
      if (!t(o.charCodeAt(D)))
        return !1;
      A = !0;
    }
    return A ? isFinite(p(o)) : !1;
  }
  function p(o) {
    let c = o, D = 1, A = c[0];
    if ((A === "-" || A === "+") && (A === "-" && (D = -1), c = c.slice(1), A = c[0]), c === "0") return 0;
    if (A === "0") {
      if (c[1] === "b") return D * parseInt(c.slice(2), 2);
      if (c[1] === "x") return D * parseInt(c.slice(2), 16);
      if (c[1] === "o") return D * parseInt(c.slice(2), 8);
    }
    return D * parseInt(c, 10);
  }
  function m(o) {
    return p(o);
  }
  function N(o) {
    return Object.prototype.toString.call(o) === "[object Number]" && o % 1 === 0 && !n.isNegativeZero(o);
  }
  return oa = new r("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: u,
    construct: m,
    predicate: N,
    represent: {
      binary: function(o) {
        return o >= 0 ? "0b" + o.toString(2) : "-0b" + o.toString(2).slice(1);
      },
      octal: function(o) {
        return o >= 0 ? "0o" + o.toString(8) : "-0o" + o.toString(8).slice(1);
      },
      decimal: function(o) {
        return o.toString(10);
      },
      hexadecimal: function(o) {
        return o >= 0 ? "0x" + o.toString(16).toUpperCase() : "-0x" + o.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  }), oa;
}
var ua, Va;
function cr() {
  if (Va) return ua;
  Va = 1;
  const n = ke(), r = J(), i = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  ), d = new RegExp(
    "^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function t(o) {
    return o === null || !i.test(o) ? !1 : isFinite(parseFloat(o, 10)) ? !0 : d.test(o);
  }
  function u(o) {
    let c = o.toLowerCase();
    const D = c[0] === "-" ? -1 : 1;
    return "+-".indexOf(c[0]) >= 0 && (c = c.slice(1)), c === ".inf" ? D === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : c === ".nan" ? NaN : D * parseFloat(c, 10);
  }
  const p = /^[-+]?[0-9]+e/;
  function m(o, c) {
    if (isNaN(o))
      switch (c) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    else if (Number.POSITIVE_INFINITY === o)
      switch (c) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    else if (Number.NEGATIVE_INFINITY === o)
      switch (c) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    else if (n.isNegativeZero(o))
      return "-0.0";
    const D = o.toString(10);
    return p.test(D) ? D.replace("e", ".e") : D;
  }
  function N(o) {
    return Object.prototype.toString.call(o) === "[object Number]" && (o % 1 !== 0 || n.isNegativeZero(o));
  }
  return ua = new r("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: t,
    construct: u,
    predicate: N,
    represent: m,
    defaultStyle: "lowercase"
  }), ua;
}
var ca, Wa;
function Cr() {
  return Wa || (Wa = 1, ca = sr().extend({
    implicit: [
      lr(),
      or(),
      ur(),
      cr()
    ]
  })), ca;
}
var Ca, Xa;
function mr() {
  return Xa || (Xa = 1, Ca = Cr()), Ca;
}
var ma, Ba;
function fr() {
  if (Ba) return ma;
  Ba = 1;
  const n = J(), r = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  ), i = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function d(p) {
    return p === null ? !1 : r.exec(p) !== null || i.exec(p) !== null;
  }
  function t(p) {
    let m = 0, N = null, o = r.exec(p);
    if (o === null && (o = i.exec(p)), o === null) throw new Error("Date resolve error");
    const c = +o[1], D = +o[2] - 1, A = +o[3];
    if (!o[4])
      return new Date(Date.UTC(c, D, A));
    const k = +o[4], j = +o[5], _ = +o[6];
    if (o[7]) {
      for (m = o[7].slice(0, 3); m.length < 3; )
        m += "0";
      m = +m;
    }
    if (o[9]) {
      const G = +o[10], H = +(o[11] || 0);
      N = (G * 60 + H) * 6e4, o[9] === "-" && (N = -N);
    }
    const q = new Date(Date.UTC(c, D, A, k, j, _, m));
    return N && q.setTime(q.getTime() - N), q;
  }
  function u(p) {
    return p.toISOString();
  }
  return ma = new n("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: d,
    construct: t,
    instanceOf: Date,
    represent: u
  }), ma;
}
var fa, ja;
function pr() {
  if (ja) return fa;
  ja = 1;
  const n = J();
  function r(i) {
    return i === "<<" || i === null;
  }
  return fa = new n("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: r
  }), fa;
}
var pa, qa;
function dr() {
  if (qa) return pa;
  qa = 1;
  const n = J(), r = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function i(p) {
    if (p === null) return !1;
    let m = 0;
    const N = p.length, o = r;
    for (let c = 0; c < N; c++) {
      const D = o.indexOf(p.charAt(c));
      if (!(D > 64)) {
        if (D < 0) return !1;
        m += 6;
      }
    }
    return m % 8 === 0;
  }
  function d(p) {
    const m = p.replace(/[\r\n=]/g, ""), N = m.length, o = r;
    let c = 0;
    const D = [];
    for (let k = 0; k < N; k++)
      k % 4 === 0 && k && (D.push(c >> 16 & 255), D.push(c >> 8 & 255), D.push(c & 255)), c = c << 6 | o.indexOf(m.charAt(k));
    const A = N % 4 * 6;
    return A === 0 ? (D.push(c >> 16 & 255), D.push(c >> 8 & 255), D.push(c & 255)) : A === 18 ? (D.push(c >> 10 & 255), D.push(c >> 2 & 255)) : A === 12 && D.push(c >> 4 & 255), new Uint8Array(D);
  }
  function t(p) {
    let m = "", N = 0;
    const o = p.length, c = r;
    for (let A = 0; A < o; A++)
      A % 3 === 0 && A && (m += c[N >> 18 & 63], m += c[N >> 12 & 63], m += c[N >> 6 & 63], m += c[N & 63]), N = (N << 8) + p[A];
    const D = o % 3;
    return D === 0 ? (m += c[N >> 18 & 63], m += c[N >> 12 & 63], m += c[N >> 6 & 63], m += c[N & 63]) : D === 2 ? (m += c[N >> 10 & 63], m += c[N >> 4 & 63], m += c[N << 2 & 63], m += c[64]) : D === 1 && (m += c[N >> 2 & 63], m += c[N << 4 & 63], m += c[64], m += c[64]), m;
  }
  function u(p) {
    return Object.prototype.toString.call(p) === "[object Uint8Array]";
  }
  return pa = new n("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: i,
    construct: d,
    predicate: u,
    represent: t
  }), pa;
}
var da, Ga;
function hr() {
  if (Ga) return da;
  Ga = 1;
  const n = J(), r = Object.prototype.hasOwnProperty, i = Object.prototype.toString;
  function d(u) {
    if (u === null) return !0;
    const p = {}, m = u;
    for (let N = 0, o = m.length; N < o; N += 1) {
      const c = m[N];
      let D = !1;
      if (i.call(c) !== "[object Object]") return !1;
      let A;
      for (A in c)
        if (r.call(c, A))
          if (!D) D = !0;
          else return !1;
      if (!D || r.call(p, A)) return !1;
      Object.defineProperty(p, A, { value: !0 });
    }
    return !0;
  }
  function t(u) {
    return u !== null ? u : [];
  }
  return da = new n("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: d,
    construct: t
  }), da;
}
var ha, za;
function Tr() {
  if (za) return ha;
  za = 1;
  const n = J(), r = Object.prototype.toString;
  function i(t) {
    if (t === null) return !0;
    const u = t, p = new Array(u.length);
    for (let m = 0, N = u.length; m < N; m += 1) {
      const o = u[m];
      if (r.call(o) !== "[object Object]") return !1;
      const c = Object.keys(o);
      if (c.length !== 1) return !1;
      p[m] = [c[0], o[c[0]]];
    }
    return !0;
  }
  function d(t) {
    if (t === null) return [];
    const u = t, p = new Array(u.length);
    for (let m = 0, N = u.length; m < N; m += 1) {
      const o = u[m], c = Object.keys(o);
      p[m] = [c[0], o[c[0]]];
    }
    return p;
  }
  return ha = new n("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: i,
    construct: d
  }), ha;
}
var Ta, Ya;
function gr() {
  if (Ya) return Ta;
  Ya = 1;
  const n = J(), r = Object.prototype.hasOwnProperty;
  function i(t) {
    if (t === null) return !0;
    const u = t;
    for (const p in u)
      if (r.call(u, p) && u[p] !== null)
        return !1;
    return !0;
  }
  function d(t) {
    return t !== null ? t : {};
  }
  return Ta = new n("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: i,
    construct: d
  }), Ta;
}
var ga, Ja;
function Na() {
  return Ja || (Ja = 1, ga = mr().extend({
    implicit: [
      fr(),
      pr()
    ],
    explicit: [
      dr(),
      hr(),
      Tr(),
      gr()
    ]
  })), ga;
}
var Ka;
function jr() {
  if (Ka) return Be;
  Ka = 1;
  const n = ke(), r = _e(), i = Br(), d = Na(), t = Object.prototype.hasOwnProperty, u = 1, p = 2, m = 3, N = 4, o = 1, c = 2, D = 3, A = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, k = /[\x85\u2028\u2029]/, j = /[,\[\]{}]/, _ = /^(?:!|!!|![0-9A-Za-z-]+!)$/, q = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function G(e) {
    return Object.prototype.toString.call(e);
  }
  function H(e) {
    return e === 10 || e === 13;
  }
  function W(e) {
    return e === 9 || e === 32;
  }
  function X(e) {
    return e === 9 || e === 32 || e === 10 || e === 13;
  }
  function $(e) {
    return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
  }
  function pe(e) {
    if (e >= 48 && e <= 57)
      return e - 48;
    const s = e | 32;
    return s >= 97 && s <= 102 ? s - 97 + 10 : -1;
  }
  function le(e) {
    return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
  }
  function oe(e) {
    return e >= 48 && e <= 57 ? e - 48 : -1;
  }
  function ee(e) {
    switch (e) {
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
        return `
`;
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
  function ge(e) {
    return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
      (e - 65536 >> 10) + 55296,
      (e - 65536 & 1023) + 56320
    );
  }
  function M(e, s, f) {
    s === "__proto__" ? Object.defineProperty(e, s, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: f
    }) : e[s] = f;
  }
  const E = new Array(256), w = new Array(256);
  for (let e = 0; e < 256; e++)
    E[e] = ee(e) ? 1 : 0, w[e] = ee(e);
  function O(e, s) {
    this.input = e, this.filename = s.filename || null, this.schema = s.schema || d, this.onWarning = s.onWarning || null, this.legacy = s.legacy || !1, this.json = s.json || !1, this.listener = s.listener || null, this.maxDepth = typeof s.maxDepth == "number" ? s.maxDepth : 100, this.maxTotalMergeKeys = typeof s.maxTotalMergeKeys == "number" ? s.maxTotalMergeKeys : 1e4, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.depth = 0, this.totalMergeKeys = 0, this.firstTabInLine = -1, this.documents = [], this.anchorMapTransactions = [];
  }
  function Z(e, s) {
    const f = {
      name: e.filename,
      buffer: e.input.slice(0, -1),
      // omit trailing \0
      position: e.position,
      line: e.line,
      column: e.position - e.lineStart
    };
    return f.snippet = i(f), new r(s, f);
  }
  function y(e, s) {
    throw Z(e, s);
  }
  function ue(e, s) {
    e.onWarning && e.onWarning.call(null, Z(e, s));
  }
  function Q(e, s, f) {
    const g = e.anchorMapTransactions;
    if (g.length !== 0) {
      const C = g[g.length - 1];
      t.call(C, s) || (C[s] = {
        existed: t.call(e.anchorMap, s),
        value: e.anchorMap[s]
      });
    }
    e.anchorMap[s] = f;
  }
  function de(e) {
    e.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
  }
  function ae(e) {
    const s = e.anchorMapTransactions.pop(), f = e.anchorMapTransactions;
    if (f.length === 0) return;
    const g = f[f.length - 1], C = Object.keys(s);
    for (let I = 0, a = C.length; I < a; I += 1) {
      const l = C[I];
      t.call(g, l) || (g[l] = s[l]);
    }
  }
  function Se(e) {
    const s = e.anchorMapTransactions.pop(), f = Object.keys(s);
    for (let g = f.length - 1; g >= 0; g -= 1) {
      const C = s[f[g]];
      C.existed ? e.anchorMap[f[g]] = C.value : delete e.anchorMap[f[g]];
    }
  }
  function ce(e) {
    return {
      position: e.position,
      line: e.line,
      lineStart: e.lineStart,
      lineIndent: e.lineIndent,
      firstTabInLine: e.firstTabInLine,
      tag: e.tag,
      anchor: e.anchor,
      kind: e.kind,
      result: e.result
    };
  }
  function Ce(e, s) {
    e.position = s.position, e.line = s.line, e.lineStart = s.lineStart, e.lineIndent = s.lineIndent, e.firstTabInLine = s.firstTabInLine, e.tag = s.tag, e.anchor = s.anchor, e.kind = s.kind, e.result = s.result;
  }
  const ve = {
    YAML: function(s, f, g) {
      s.version !== null && y(s, "duplication of %YAML directive"), g.length !== 1 && y(s, "YAML directive accepts exactly one argument");
      const C = /^([0-9]+)\.([0-9]+)$/.exec(g[0]);
      C === null && y(s, "ill-formed argument of the YAML directive");
      const I = parseInt(C[1], 10), a = parseInt(C[2], 10);
      I !== 1 && y(s, "unacceptable YAML version of the document"), s.version = g[0], s.checkLineBreaks = a < 2, a !== 1 && a !== 2 && ue(s, "unsupported YAML version of the document");
    },
    TAG: function(s, f, g) {
      let C;
      g.length !== 2 && y(s, "TAG directive accepts exactly two arguments");
      const I = g[0];
      C = g[1], _.test(I) || y(s, "ill-formed tag handle (first argument) of the TAG directive"), t.call(s.tagMap, I) && y(s, 'there is a previously declared suffix for "' + I + '" tag handle'), q.test(C) || y(s, "ill-formed tag prefix (second argument) of the TAG directive");
      try {
        C = decodeURIComponent(C);
      } catch {
        y(s, "tag prefix is malformed: " + C);
      }
      s.tagMap[I] = C;
    }
  };
  function z(e, s, f, g) {
    if (s < f) {
      const C = e.input.slice(s, f);
      if (g)
        for (let I = 0, a = C.length; I < a; I += 1) {
          const l = C.charCodeAt(I);
          l === 9 || l >= 32 && l <= 1114111 || y(e, "expected valid JSON character");
        }
      else A.test(C) && y(e, "the stream contains non-printable characters");
      e.result += C;
    }
  }
  function me(e, s, f, g) {
    n.isObject(f) || y(e, "cannot merge mappings; the provided source object is unacceptable");
    const C = Object.keys(f);
    for (let I = 0, a = C.length; I < a; I += 1) {
      const l = C[I];
      e.maxTotalMergeKeys !== -1 && ++e.totalMergeKeys > e.maxTotalMergeKeys && y(e, "merge keys exceeded maxTotalMergeKeys (" + e.maxTotalMergeKeys + ")"), t.call(s, l) || (M(s, l, f[l]), g[l] = !0);
    }
  }
  function re(e, s, f, g, C, I, a, l, v) {
    if (Array.isArray(C)) {
      C = Array.prototype.slice.call(C);
      for (let h = 0, T = C.length; h < T; h += 1)
        Array.isArray(C[h]) && y(e, "nested arrays are not supported inside keys"), typeof C == "object" && G(C[h]) === "[object Object]" && (C[h] = "[object Object]");
    }
    if (typeof C == "object" && G(C) === "[object Object]" && (C = "[object Object]"), C = String(C), s === null && (s = {}), g === "tag:yaml.org,2002:merge")
      if (Array.isArray(I))
        for (let h = 0, T = I.length; h < T; h += 1)
          me(e, s, I[h], f);
      else
        me(e, s, I, f);
    else
      !e.json && !t.call(f, C) && t.call(s, C) && (e.line = a || e.line, e.lineStart = l || e.lineStart, e.position = v || e.position, y(e, "duplicated mapping key")), M(s, C, I), delete f[C];
    return s;
  }
  function Le(e) {
    const s = e.input.charCodeAt(e.position);
    s === 10 ? e.position++ : s === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : y(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
  }
  function V(e, s, f) {
    let g = 0, C = e.input.charCodeAt(e.position);
    for (; C !== 0; ) {
      for (; W(C); )
        C === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), C = e.input.charCodeAt(++e.position);
      if (s && C === 35)
        do
          C = e.input.charCodeAt(++e.position);
        while (C !== 10 && C !== 13 && C !== 0);
      if (H(C))
        for (Le(e), C = e.input.charCodeAt(e.position), g++, e.lineIndent = 0; C === 32; )
          e.lineIndent++, C = e.input.charCodeAt(++e.position);
      else
        break;
    }
    return f !== -1 && g !== 0 && e.lineIndent < f && ue(e, "deficient indentation"), g;
  }
  function Ie(e) {
    let s = e.position, f = e.input.charCodeAt(s);
    return !!((f === 45 || f === 46) && f === e.input.charCodeAt(s + 1) && f === e.input.charCodeAt(s + 2) && (s += 3, f = e.input.charCodeAt(s), f === 0 || X(f)));
  }
  function ie(e, s) {
    s === 1 ? e.result += " " : s > 1 && (e.result += n.repeat(`
`, s - 1));
  }
  function Me(e, s, f) {
    let g, C, I, a, l, v;
    const h = e.kind, T = e.result;
    let L = e.input.charCodeAt(e.position);
    if (X(L) || $(L) || L === 35 || L === 38 || L === 42 || L === 33 || L === 124 || L === 62 || L === 39 || L === 34 || L === 37 || L === 64 || L === 96)
      return !1;
    if (L === 63 || L === 45) {
      const S = e.input.charCodeAt(e.position + 1);
      if (X(S) || f && $(S))
        return !1;
    }
    for (e.kind = "scalar", e.result = "", g = C = e.position, I = !1; L !== 0; ) {
      if (L === 58) {
        const S = e.input.charCodeAt(e.position + 1);
        if (X(S) || f && $(S))
          break;
      } else if (L === 35) {
        const S = e.input.charCodeAt(e.position - 1);
        if (X(S))
          break;
      } else {
        if (e.position === e.lineStart && Ie(e) || f && $(L))
          break;
        if (H(L))
          if (a = e.line, l = e.lineStart, v = e.lineIndent, V(e, !1, -1), e.lineIndent >= s) {
            I = !0, L = e.input.charCodeAt(e.position);
            continue;
          } else {
            e.position = C, e.line = a, e.lineStart = l, e.lineIndent = v;
            break;
          }
      }
      I && (z(e, g, C, !1), ie(e, e.line - a), g = C = e.position, I = !1), W(L) || (C = e.position + 1), L = e.input.charCodeAt(++e.position);
    }
    return z(e, g, C, !1), e.result ? !0 : (e.kind = h, e.result = T, !1);
  }
  function we(e, s) {
    let f, g, C = e.input.charCodeAt(e.position);
    if (C !== 39)
      return !1;
    for (e.kind = "scalar", e.result = "", e.position++, f = g = e.position; (C = e.input.charCodeAt(e.position)) !== 0; )
      if (C === 39)
        if (z(e, f, e.position, !0), C = e.input.charCodeAt(++e.position), C === 39)
          f = e.position, e.position++, g = e.position;
        else
          return !0;
      else H(C) ? (z(e, f, g, !0), ie(e, V(e, !1, s)), f = g = e.position) : e.position === e.lineStart && Ie(e) ? y(e, "unexpected end of the document within a single quoted scalar") : (e.position++, W(C) || (g = e.position));
    y(e, "unexpected end of the stream within a single quoted scalar");
  }
  function ye(e, s) {
    let f, g, C, I = e.input.charCodeAt(e.position);
    if (I !== 34)
      return !1;
    for (e.kind = "scalar", e.result = "", e.position++, f = g = e.position; (I = e.input.charCodeAt(e.position)) !== 0; ) {
      if (I === 34)
        return z(e, f, e.position, !0), e.position++, !0;
      if (I === 92) {
        if (z(e, f, e.position, !0), I = e.input.charCodeAt(++e.position), H(I))
          V(e, !1, s);
        else if (I < 256 && E[I])
          e.result += w[I], e.position++;
        else if ((C = le(I)) > 0) {
          let a = C, l = 0;
          for (; a > 0; a--)
            I = e.input.charCodeAt(++e.position), (C = pe(I)) >= 0 ? l = (l << 4) + C : y(e, "expected hexadecimal character");
          e.result += ge(l), e.position++;
        } else
          y(e, "unknown escape sequence");
        f = g = e.position;
      } else H(I) ? (z(e, f, g, !0), ie(e, V(e, !1, s)), f = g = e.position) : e.position === e.lineStart && Ie(e) ? y(e, "unexpected end of the document within a double quoted scalar") : (e.position++, W(I) || (g = e.position));
    }
    y(e, "unexpected end of the stream within a double quoted scalar");
  }
  function Fe(e, s) {
    let f = !0, g, C, I;
    const a = e.tag;
    let l;
    const v = e.anchor;
    let h, T, L, S;
    const R = /* @__PURE__ */ Object.create(null);
    let b, P, x, F = e.input.charCodeAt(e.position);
    if (F === 91)
      h = 93, S = !1, l = [];
    else if (F === 123)
      h = 125, S = !0, l = {};
    else
      return !1;
    for (e.anchor !== null && Q(e, e.anchor, l), F = e.input.charCodeAt(++e.position); F !== 0; ) {
      if (V(e, !0, s), F = e.input.charCodeAt(e.position), F === h)
        return e.position++, e.tag = a, e.anchor = v, e.kind = S ? "mapping" : "sequence", e.result = l, !0;
      if (f ? F === 44 && y(e, "expected the node content, but found ','") : y(e, "missed comma between flow collection entries"), P = b = x = null, T = L = !1, F === 63) {
        const U = e.input.charCodeAt(e.position + 1);
        X(U) && (T = L = !0, e.position++, V(e, !0, s));
      }
      g = e.line, C = e.lineStart, I = e.position, te(e, s, u, !1, !0), P = e.tag, b = e.result, V(e, !0, s), F = e.input.charCodeAt(e.position), (L || e.line === g) && F === 58 && (T = !0, F = e.input.charCodeAt(++e.position), V(e, !0, s), te(e, s, u, !1, !0), x = e.result), S ? re(e, l, R, P, b, x, g, C, I) : T ? l.push(re(e, null, R, P, b, x, g, C, I)) : l.push(b), V(e, !0, s), F = e.input.charCodeAt(e.position), F === 44 ? (f = !0, F = e.input.charCodeAt(++e.position)) : f = !1;
    }
    y(e, "unexpected end of the stream within a flow collection");
  }
  function Oe(e, s) {
    let f, g = o, C = !1, I = !1, a = s, l = 0, v = !1, h, T = e.input.charCodeAt(e.position);
    if (T === 124)
      f = !1;
    else if (T === 62)
      f = !0;
    else
      return !1;
    for (e.kind = "scalar", e.result = ""; T !== 0; )
      if (T = e.input.charCodeAt(++e.position), T === 43 || T === 45)
        o === g ? g = T === 43 ? D : c : y(e, "repeat of a chomping mode identifier");
      else if ((h = oe(T)) >= 0)
        h === 0 ? y(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : I ? y(e, "repeat of an indentation width identifier") : (a = s + h - 1, I = !0);
      else
        break;
    if (W(T)) {
      do
        T = e.input.charCodeAt(++e.position);
      while (W(T));
      if (T === 35)
        do
          T = e.input.charCodeAt(++e.position);
        while (!H(T) && T !== 0);
    }
    for (; T !== 0; ) {
      for (Le(e), e.lineIndent = 0, T = e.input.charCodeAt(e.position); (!I || e.lineIndent < a) && T === 32; )
        e.lineIndent++, T = e.input.charCodeAt(++e.position);
      if (!I && e.lineIndent > a && (a = e.lineIndent), H(T)) {
        l++;
        continue;
      }
      if (!I && a === 0 && y(e, "missing indentation for block scalar"), e.lineIndent < a) {
        g === D ? e.result += n.repeat(`
`, C ? 1 + l : l) : g === o && C && (e.result += `
`);
        break;
      }
      f ? W(T) ? (v = !0, e.result += n.repeat(`
`, C ? 1 + l : l)) : v ? (v = !1, e.result += n.repeat(`
`, l + 1)) : l === 0 ? C && (e.result += " ") : e.result += n.repeat(`
`, l) : e.result += n.repeat(`
`, C ? 1 + l : l), C = !0, I = !0, l = 0;
      const L = e.position;
      for (; !H(T) && T !== 0; )
        T = e.input.charCodeAt(++e.position);
      z(e, L, e.position, !1);
    }
    return !0;
  }
  function ne(e, s) {
    const f = e.tag, g = e.anchor, C = [];
    let I = !1;
    if (e.firstTabInLine !== -1) return !1;
    e.anchor !== null && Q(e, e.anchor, C);
    let a = e.input.charCodeAt(e.position);
    for (; a !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, y(e, "tab characters must not be used in indentation")), a === 45); ) {
      const l = e.input.charCodeAt(e.position + 1);
      if (!X(l))
        break;
      if (I = !0, e.position++, V(e, !0, -1) && e.lineIndent <= s) {
        C.push(null), a = e.input.charCodeAt(e.position);
        continue;
      }
      const v = e.line;
      if (te(e, s, m, !1, !0), C.push(e.result), V(e, !0, -1), a = e.input.charCodeAt(e.position), (e.line === v || e.lineIndent > s) && a !== 0)
        y(e, "bad indentation of a sequence entry");
      else if (e.lineIndent < s)
        break;
    }
    return I ? (e.tag = f, e.anchor = g, e.kind = "sequence", e.result = C, !0) : !1;
  }
  function Ee(e, s, f) {
    let g, C, I, a;
    const l = e.tag, v = e.anchor, h = {}, T = /* @__PURE__ */ Object.create(null);
    let L = null, S = null, R = null, b = !1, P = !1;
    if (e.firstTabInLine !== -1) return !1;
    e.anchor !== null && Q(e, e.anchor, h);
    let x = e.input.charCodeAt(e.position);
    for (; x !== 0; ) {
      !b && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, y(e, "tab characters must not be used in indentation"));
      const F = e.input.charCodeAt(e.position + 1), U = e.line;
      if ((x === 63 || x === 58) && X(F))
        x === 63 ? (b && (re(e, h, T, L, S, null, C, I, a), L = S = R = null), P = !0, b = !0, g = !0) : b ? (b = !1, g = !0) : y(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, x = F;
      else {
        if (C = e.line, I = e.lineStart, a = e.position, !te(e, f, p, !1, !0))
          break;
        if (e.line === U) {
          for (x = e.input.charCodeAt(e.position); W(x); )
            x = e.input.charCodeAt(++e.position);
          if (x === 58)
            x = e.input.charCodeAt(++e.position), X(x) || y(e, "a whitespace character is expected after the key-value separator within a block mapping"), b && (re(e, h, T, L, S, null, C, I, a), L = S = R = null), P = !0, b = !1, g = !1, L = e.tag, S = e.result;
          else if (P)
            y(e, "can not read an implicit mapping pair; a colon is missed");
          else
            return e.tag = l, e.anchor = v, !0;
        } else if (P)
          y(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
        else
          return e.tag = l, e.anchor = v, !0;
      }
      if ((e.line === U || e.lineIndent > s) && (b && (C = e.line, I = e.lineStart, a = e.position), te(e, s, N, !0, g) && (b ? S = e.result : R = e.result), b || (re(e, h, T, L, S, R, C, I, a), L = S = R = null), V(e, !0, -1), x = e.input.charCodeAt(e.position)), (e.line === U || e.lineIndent > s) && x !== 0)
        y(e, "bad indentation of a mapping entry");
      else if (e.lineIndent < s)
        break;
    }
    return b && re(e, h, T, L, S, null, C, I, a), P && (e.tag = l, e.anchor = v, e.kind = "mapping", e.result = h), P;
  }
  function Ge(e) {
    let s = !1, f = !1, g, C, I = e.input.charCodeAt(e.position);
    if (I !== 33) return !1;
    e.tag !== null && y(e, "duplication of a tag property"), I = e.input.charCodeAt(++e.position), I === 60 ? (s = !0, I = e.input.charCodeAt(++e.position)) : I === 33 ? (f = !0, g = "!!", I = e.input.charCodeAt(++e.position)) : g = "!";
    let a = e.position;
    if (s) {
      do
        I = e.input.charCodeAt(++e.position);
      while (I !== 0 && I !== 62);
      e.position < e.length ? (C = e.input.slice(a, e.position), I = e.input.charCodeAt(++e.position)) : y(e, "unexpected end of the stream within a verbatim tag");
    } else {
      for (; I !== 0 && !X(I); )
        I === 33 && (f ? y(e, "tag suffix cannot contain exclamation marks") : (g = e.input.slice(a - 1, e.position + 1), _.test(g) || y(e, "named tag handle cannot contain such characters"), f = !0, a = e.position + 1)), I = e.input.charCodeAt(++e.position);
      C = e.input.slice(a, e.position), j.test(C) && y(e, "tag suffix cannot contain flow indicator characters");
    }
    C && !q.test(C) && y(e, "tag name cannot contain such characters: " + C);
    try {
      C = decodeURIComponent(C);
    } catch {
      y(e, "tag name is malformed: " + C);
    }
    return s ? e.tag = C : t.call(e.tagMap, g) ? e.tag = e.tagMap[g] + C : g === "!" ? e.tag = "!" + C : g === "!!" ? e.tag = "tag:yaml.org,2002:" + C : y(e, 'undeclared tag handle "' + g + '"'), !0;
  }
  function Ue(e) {
    let s = e.input.charCodeAt(e.position);
    if (s !== 38) return !1;
    e.anchor !== null && y(e, "duplication of an anchor property"), s = e.input.charCodeAt(++e.position);
    const f = e.position;
    for (; s !== 0 && !X(s) && !$(s); )
      s = e.input.charCodeAt(++e.position);
    return e.position === f && y(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(f, e.position), !0;
  }
  function He(e) {
    let s = e.input.charCodeAt(e.position);
    if (s !== 42) return !1;
    s = e.input.charCodeAt(++e.position);
    const f = e.position;
    for (; s !== 0 && !X(s) && !$(s); )
      s = e.input.charCodeAt(++e.position);
    e.position === f && y(e, "name of an alias node must contain at least one character");
    const g = e.input.slice(f, e.position);
    return t.call(e.anchorMap, g) || y(e, 'unidentified alias "' + g + '"'), e.result = e.anchorMap[g], V(e, !0, -1), !0;
  }
  function ze(e, s, f, g) {
    const C = ce(e);
    return de(e), Ce(e, s), e.tag = null, e.anchor = null, e.kind = null, e.result = null, Ee(e, f, g) && e.kind === "mapping" ? (ae(e), !0) : (Se(e), Ce(e, C), !1);
  }
  function te(e, s, f, g, C) {
    let I, a, l = 1, v = !1, h = !1, T = null, L, S, R;
    e.depth >= e.maxDepth && y(e, "nesting exceeded maxDepth (" + e.maxDepth + ")"), e.depth += 1, e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null;
    const b = I = a = N === f || m === f;
    if (g && V(e, !0, -1) && (v = !0, e.lineIndent > s ? l = 1 : e.lineIndent === s ? l = 0 : e.lineIndent < s && (l = -1)), l === 1)
      for (; ; ) {
        const P = e.input.charCodeAt(e.position), x = ce(e);
        if (v && (P === 33 && e.tag !== null || P === 38 && e.anchor !== null) || !Ge(e) && !Ue(e))
          break;
        T === null && (T = x), V(e, !0, -1) ? (v = !0, a = b, e.lineIndent > s ? l = 1 : e.lineIndent === s ? l = 0 : e.lineIndent < s && (l = -1)) : a = !1;
      }
    if (a && (a = v || C), l === 1 || N === f)
      if (u === f || p === f ? S = s : S = s + 1, R = e.position - e.lineStart, l === 1)
        if (a && (ne(e, R) || Ee(e, R, S)) || Fe(e, S))
          h = !0;
        else {
          const P = e.input.charCodeAt(e.position);
          T !== null && b && !a && P !== 124 && P !== 62 && ze(
            e,
            T,
            T.position - T.lineStart,
            S
          ) || I && Oe(e, S) || we(e, S) || ye(e, S) ? h = !0 : He(e) ? (h = !0, (e.tag !== null || e.anchor !== null) && y(e, "alias node should not have any properties")) : Me(e, S, u === f) && (h = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && Q(e, e.anchor, e.result);
        }
      else l === 0 && (h = a && ne(e, R));
    if (e.tag === null)
      e.anchor !== null && Q(e, e.anchor, e.result);
    else if (e.tag === "?") {
      e.result !== null && e.kind !== "scalar" && y(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"');
      for (let P = 0, x = e.implicitTypes.length; P < x; P += 1)
        if (L = e.implicitTypes[P], L.resolve(e.result)) {
          e.result = L.construct(e.result), e.tag = L.tag, e.anchor !== null && Q(e, e.anchor, e.result);
          break;
        }
    } else if (e.tag !== "!") {
      if (t.call(e.typeMap[e.kind || "fallback"], e.tag))
        L = e.typeMap[e.kind || "fallback"][e.tag];
      else {
        L = null;
        const P = e.typeMap.multi[e.kind || "fallback"];
        for (let x = 0, F = P.length; x < F; x += 1)
          if (e.tag.slice(0, P[x].tag.length) === P[x].tag) {
            L = P[x];
            break;
          }
      }
      L || y(e, "unknown tag !<" + e.tag + ">"), e.result !== null && L.kind !== e.kind && y(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + L.kind + '", not "' + e.kind + '"'), L.resolve(e.result, e.tag) ? (e.result = L.construct(e.result, e.tag), e.anchor !== null && Q(e, e.anchor, e.result)) : y(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
    }
    return e.listener !== null && e.listener("close", e), e.depth -= 1, e.tag !== null || e.anchor !== null || h;
  }
  function Ye(e) {
    const s = e.position;
    let f = !1, g;
    for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (g = e.input.charCodeAt(e.position)) !== 0 && (V(e, !0, -1), g = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || g !== 37)); ) {
      f = !0, g = e.input.charCodeAt(++e.position);
      let C = e.position;
      for (; g !== 0 && !X(g); )
        g = e.input.charCodeAt(++e.position);
      const I = e.input.slice(C, e.position), a = [];
      for (I.length < 1 && y(e, "directive name must not be less than one character in length"); g !== 0; ) {
        for (; W(g); )
          g = e.input.charCodeAt(++e.position);
        if (g === 35) {
          do
            g = e.input.charCodeAt(++e.position);
          while (g !== 0 && !H(g));
          break;
        }
        if (H(g)) break;
        for (C = e.position; g !== 0 && !X(g); )
          g = e.input.charCodeAt(++e.position);
        a.push(e.input.slice(C, e.position));
      }
      g !== 0 && Le(e), t.call(ve, I) ? ve[I](e, I, a) : ue(e, 'unknown document directive "' + I + '"');
    }
    if (V(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, V(e, !0, -1)) : f && y(e, "directives end mark is expected"), te(e, e.lineIndent - 1, N, !1, !0), V(e, !0, -1), e.checkLineBreaks && k.test(e.input.slice(s, e.position)) && ue(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && Ie(e)) {
      e.input.charCodeAt(e.position) === 46 && (e.position += 3, V(e, !0, -1));
      return;
    }
    e.position < e.length - 1 && y(e, "end of the stream or a document separator is expected");
  }
  function Ve(e, s) {
    e = String(e), s = s || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
    const f = new O(e, s), g = e.indexOf("\0");
    for (g !== -1 && (f.position = g, y(f, "null byte is not allowed in input")), f.input += "\0"; f.input.charCodeAt(f.position) === 32; )
      f.lineIndent += 1, f.position += 1;
    for (; f.position < f.length - 1; )
      Ye(f);
    return f.documents;
  }
  function We(e, s, f) {
    s !== null && typeof s == "object" && typeof f > "u" && (f = s, s = null);
    const g = Ve(e, f);
    if (typeof s != "function")
      return g;
    for (let C = 0, I = g.length; C < I; C += 1)
      s(g[C]);
  }
  function Je(e, s) {
    const f = Ve(e, s);
    if (f.length !== 0) {
      if (f.length === 1)
        return f[0];
      throw new r("expected a single document in the stream, but found more");
    }
  }
  return Be.loadAll = We, Be.load = Je, Be;
}
var Sa = {}, $a;
function qr() {
  if ($a) return Sa;
  $a = 1;
  const n = ke(), r = _e(), i = Na(), d = Object.prototype.toString, t = Object.prototype.hasOwnProperty, u = 65279, p = 9, m = 10, N = 13, o = 32, c = 33, D = 34, A = 35, k = 37, j = 38, _ = 39, q = 42, G = 44, H = 45, W = 58, X = 61, $ = 62, pe = 63, le = 64, oe = 91, ee = 93, ge = 96, M = 123, E = 124, w = 125, O = {};
  O[0] = "\\0", O[7] = "\\a", O[8] = "\\b", O[9] = "\\t", O[10] = "\\n", O[11] = "\\v", O[12] = "\\f", O[13] = "\\r", O[27] = "\\e", O[34] = '\\"', O[92] = "\\\\", O[133] = "\\N", O[160] = "\\_", O[8232] = "\\L", O[8233] = "\\P";
  const Z = [
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
  ], y = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function ue(a, l) {
    if (l === null) return {};
    const v = {}, h = Object.keys(l);
    for (let T = 0, L = h.length; T < L; T += 1) {
      let S = h[T], R = String(l[S]);
      S.slice(0, 2) === "!!" && (S = "tag:yaml.org,2002:" + S.slice(2));
      const b = a.compiledTypeMap.fallback[S];
      b && t.call(b.styleAliases, R) && (R = b.styleAliases[R]), v[S] = R;
    }
    return v;
  }
  function Q(a) {
    let l, v;
    const h = a.toString(16).toUpperCase();
    if (a <= 255)
      l = "x", v = 2;
    else if (a <= 65535)
      l = "u", v = 4;
    else if (a <= 4294967295)
      l = "U", v = 8;
    else
      throw new r("code point within a string may not be greater than 0xFFFFFFFF");
    return "\\" + l + n.repeat("0", v - h.length) + h;
  }
  const de = 1, ae = 2;
  function Se(a) {
    this.schema = a.schema || i, this.indent = Math.max(1, a.indent || 2), this.noArrayIndent = a.noArrayIndent || !1, this.skipInvalid = a.skipInvalid || !1, this.flowLevel = n.isNothing(a.flowLevel) ? -1 : a.flowLevel, this.styleMap = ue(this.schema, a.styles || null), this.sortKeys = a.sortKeys || !1, this.lineWidth = a.lineWidth || 80, this.noRefs = a.noRefs || !1, this.noCompatMode = a.noCompatMode || !1, this.condenseFlow = a.condenseFlow || !1, this.quotingType = a.quotingType === '"' ? ae : de, this.forceQuotes = a.forceQuotes || !1, this.replacer = typeof a.replacer == "function" ? a.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
  }
  function ce(a, l) {
    const v = n.repeat(" ", l);
    let h = 0, T = "";
    const L = a.length;
    for (; h < L; ) {
      let S;
      const R = a.indexOf(`
`, h);
      R === -1 ? (S = a.slice(h), h = L) : (S = a.slice(h, R + 1), h = R + 1), S.length && S !== `
` && (T += v), T += S;
    }
    return T;
  }
  function Ce(a, l) {
    return `
` + n.repeat(" ", a.indent * l);
  }
  function ve(a, l) {
    for (let v = 0, h = a.implicitTypes.length; v < h; v += 1)
      if (a.implicitTypes[v].resolve(l))
        return !0;
    return !1;
  }
  function z(a) {
    return a === o || a === p;
  }
  function me(a) {
    return a >= 32 && a <= 126 || a >= 161 && a <= 55295 && a !== 8232 && a !== 8233 || a >= 57344 && a <= 65533 && a !== u || a >= 65536 && a <= 1114111;
  }
  function re(a) {
    return me(a) && a !== u && // - b-char
    a !== N && a !== m;
  }
  function Le(a, l, v) {
    const h = re(a), T = h && !z(a);
    return (
      // ns-plain-safe
      (v ? h : h && // - c-flow-indicator
      a !== G && a !== oe && a !== ee && a !== M && a !== w) && // ns-plain-char
      a !== A && // false on '#'
      !(l === W && !T) || // false on ': '
      re(l) && !z(l) && a === A || // change to true on '[^ ]#'
      l === W && T
    );
  }
  function V(a) {
    return me(a) && a !== u && !z(a) && // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    a !== H && a !== pe && a !== W && a !== G && a !== oe && a !== ee && a !== M && a !== w && // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    a !== A && a !== j && a !== q && a !== c && a !== E && a !== X && a !== $ && a !== _ && a !== D && // | “%” | “@” | “`”)
    a !== k && a !== le && a !== ge;
  }
  function Ie(a) {
    return !z(a) && a !== W;
  }
  function ie(a, l) {
    const v = a.charCodeAt(l);
    let h;
    return v >= 55296 && v <= 56319 && l + 1 < a.length && (h = a.charCodeAt(l + 1), h >= 56320 && h <= 57343) ? (v - 55296) * 1024 + h - 56320 + 65536 : v;
  }
  function Me(a) {
    return /^\n* /.test(a);
  }
  const we = 1, ye = 2, Fe = 3, Oe = 4, ne = 5;
  function Ee(a, l, v, h, T, L, S, R) {
    let b, P = 0, x = null, F = !1, U = !1;
    const ya = h !== -1;
    let be = -1, Re = V(ie(a, 0)) && Ie(ie(a, a.length - 1));
    if (l || S)
      for (b = 0; b < a.length; P >= 65536 ? b += 2 : b++) {
        if (P = ie(a, b), !me(P))
          return ne;
        Re = Re && Le(P, x, R), x = P;
      }
    else {
      for (b = 0; b < a.length; P >= 65536 ? b += 2 : b++) {
        if (P = ie(a, b), P === m)
          F = !0, ya && (U = U || // Foldable line = too long, and not more-indented.
          b - be - 1 > h && a[be + 1] !== " ", be = b);
        else if (!me(P))
          return ne;
        Re = Re && Le(P, x, R), x = P;
      }
      U = U || ya && b - be - 1 > h && a[be + 1] !== " ";
    }
    return !F && !U ? Re && !S && !T(a) ? we : L === ae ? ne : ye : v > 9 && Me(a) ? ne : S ? L === ae ? ne : ye : U ? Oe : Fe;
  }
  function Ge(a, l, v, h, T) {
    a.dump = (function() {
      if (l.length === 0)
        return a.quotingType === ae ? '""' : "''";
      if (!a.noCompatMode && (Z.indexOf(l) !== -1 || y.test(l)))
        return a.quotingType === ae ? '"' + l + '"' : "'" + l + "'";
      const L = a.indent * Math.max(1, v), S = a.lineWidth === -1 ? -1 : Math.max(Math.min(a.lineWidth, 40), a.lineWidth - L), R = h || // No block styles in flow mode.
      a.flowLevel > -1 && v >= a.flowLevel;
      function b(P) {
        return ve(a, P);
      }
      switch (Ee(
        l,
        R,
        a.indent,
        S,
        b,
        a.quotingType,
        a.forceQuotes && !h,
        T
      )) {
        case we:
          return l;
        case ye:
          return "'" + l.replace(/'/g, "''") + "'";
        case Fe:
          return "|" + Ue(l, a.indent) + He(ce(l, L));
        case Oe:
          return ">" + Ue(l, a.indent) + He(ce(ze(l, S), L));
        case ne:
          return '"' + Ye(l) + '"';
        default:
          throw new r("impossible error: invalid scalar style");
      }
    })();
  }
  function Ue(a, l) {
    const v = Me(a) ? String(l) : "", h = a[a.length - 1] === `
`, L = h && (a[a.length - 2] === `
` || a === `
`) ? "+" : h ? "" : "-";
    return v + L + `
`;
  }
  function He(a) {
    return a[a.length - 1] === `
` ? a.slice(0, -1) : a;
  }
  function ze(a, l) {
    const v = /(\n+)([^\n]*)/g;
    let h = (function() {
      let R = a.indexOf(`
`);
      return R = R !== -1 ? R : a.length, v.lastIndex = R, te(a.slice(0, R), l);
    })(), T = a[0] === `
` || a[0] === " ", L, S;
    for (; S = v.exec(a); ) {
      const R = S[1], b = S[2];
      L = b[0] === " ", h += R + (!T && !L && b !== "" ? `
` : "") + te(b, l), T = L;
    }
    return h;
  }
  function te(a, l) {
    if (a === "" || a[0] === " ") return a;
    const v = / [^ ]/g;
    let h, T = 0, L, S = 0, R = 0, b = "";
    for (; h = v.exec(a); )
      R = h.index, R - T > l && (L = S > T ? S : R, b += `
` + a.slice(T, L), T = L + 1), S = R;
    return b += `
`, a.length - T > l && S > T ? b += a.slice(T, S) + `
` + a.slice(S + 1) : b += a.slice(T), b.slice(1);
  }
  function Ye(a) {
    let l = "", v = 0;
    for (let h = 0; h < a.length; v >= 65536 ? h += 2 : h++) {
      v = ie(a, h);
      const T = O[v];
      !T && me(v) ? (l += a[h], v >= 65536 && (l += a[h + 1])) : l += T || Q(v);
    }
    return l;
  }
  function Ve(a, l, v) {
    let h = "";
    const T = a.tag;
    for (let L = 0, S = v.length; L < S; L += 1) {
      let R = v[L];
      a.replacer && (R = a.replacer.call(v, String(L), R)), (f(a, l, R, !1, !1) || typeof R > "u" && f(a, l, null, !1, !1)) && (h !== "" && (h += "," + (a.condenseFlow ? "" : " ")), h += a.dump);
    }
    a.tag = T, a.dump = "[" + h + "]";
  }
  function We(a, l, v, h) {
    let T = "";
    const L = a.tag;
    for (let S = 0, R = v.length; S < R; S += 1) {
      let b = v[S];
      a.replacer && (b = a.replacer.call(v, String(S), b)), (f(a, l + 1, b, !0, !0, !1, !0) || typeof b > "u" && f(a, l + 1, null, !0, !0, !1, !0)) && ((!h || T !== "") && (T += Ce(a, l)), a.dump && m === a.dump.charCodeAt(0) ? T += "-" : T += "- ", T += a.dump);
    }
    a.tag = L, a.dump = T || "[]";
  }
  function Je(a, l, v) {
    let h = "";
    const T = a.tag, L = Object.keys(v);
    for (let S = 0, R = L.length; S < R; S += 1) {
      let b = "";
      h !== "" && (b += ", "), a.condenseFlow && (b += '"');
      const P = L[S];
      let x = v[P];
      a.replacer && (x = a.replacer.call(v, P, x)), f(a, l, P, !1, !1) && (a.dump.length > 1024 && (b += "? "), b += a.dump + (a.condenseFlow ? '"' : "") + ":" + (a.condenseFlow ? "" : " "), f(a, l, x, !1, !1) && (b += a.dump, h += b));
    }
    a.tag = T, a.dump = "{" + h + "}";
  }
  function e(a, l, v, h) {
    let T = "";
    const L = a.tag, S = Object.keys(v);
    if (a.sortKeys === !0)
      S.sort();
    else if (typeof a.sortKeys == "function")
      S.sort(a.sortKeys);
    else if (a.sortKeys)
      throw new r("sortKeys must be a boolean or a function");
    for (let R = 0, b = S.length; R < b; R += 1) {
      let P = "";
      (!h || T !== "") && (P += Ce(a, l));
      const x = S[R];
      let F = v[x];
      if (a.replacer && (F = a.replacer.call(v, x, F)), !f(a, l + 1, x, !0, !0, !0))
        continue;
      const U = a.tag !== null && a.tag !== "?" || a.dump && a.dump.length > 1024;
      U && (a.dump && m === a.dump.charCodeAt(0) ? P += "?" : P += "? "), P += a.dump, U && (P += Ce(a, l)), f(a, l + 1, F, !0, U) && (a.dump && m === a.dump.charCodeAt(0) ? P += ":" : P += ": ", P += a.dump, T += P);
    }
    a.tag = L, a.dump = T || "{}";
  }
  function s(a, l, v) {
    const h = v ? a.explicitTypes : a.implicitTypes;
    for (let T = 0, L = h.length; T < L; T += 1) {
      const S = h[T];
      if ((S.instanceOf || S.predicate) && (!S.instanceOf || typeof l == "object" && l instanceof S.instanceOf) && (!S.predicate || S.predicate(l))) {
        if (v ? S.multi && S.representName ? a.tag = S.representName(l) : a.tag = S.tag : a.tag = "?", S.represent) {
          const R = a.styleMap[S.tag] || S.defaultStyle;
          let b;
          if (d.call(S.represent) === "[object Function]")
            b = S.represent(l, R);
          else if (t.call(S.represent, R))
            b = S.represent[R](l, R);
          else
            throw new r("!<" + S.tag + '> tag resolver accepts not "' + R + '" style');
          a.dump = b;
        }
        return !0;
      }
    }
    return !1;
  }
  function f(a, l, v, h, T, L, S) {
    a.tag = null, a.dump = v, s(a, v, !1) || s(a, v, !0);
    const R = d.call(a.dump), b = h;
    h && (h = a.flowLevel < 0 || a.flowLevel > l);
    const P = R === "[object Object]" || R === "[object Array]";
    let x, F;
    if (P && (x = a.duplicates.indexOf(v), F = x !== -1), (a.tag !== null && a.tag !== "?" || F || a.indent !== 2 && l > 0) && (T = !1), F && a.usedDuplicates[x])
      a.dump = "*ref_" + x;
    else {
      if (P && F && !a.usedDuplicates[x] && (a.usedDuplicates[x] = !0), R === "[object Object]")
        h && Object.keys(a.dump).length !== 0 ? (e(a, l, a.dump, T), F && (a.dump = "&ref_" + x + a.dump)) : (Je(a, l, a.dump), F && (a.dump = "&ref_" + x + " " + a.dump));
      else if (R === "[object Array]")
        h && a.dump.length !== 0 ? (a.noArrayIndent && !S && l > 0 ? We(a, l - 1, a.dump, T) : We(a, l, a.dump, T), F && (a.dump = "&ref_" + x + a.dump)) : (Ve(a, l, a.dump), F && (a.dump = "&ref_" + x + " " + a.dump));
      else if (R === "[object String]")
        a.tag !== "?" && Ge(a, a.dump, l, L, b);
      else {
        if (R === "[object Undefined]")
          return !1;
        if (a.skipInvalid) return !1;
        throw new r("unacceptable kind of an object to dump " + R);
      }
      if (a.tag !== null && a.tag !== "?") {
        let U = encodeURI(
          a.tag[0] === "!" ? a.tag.slice(1) : a.tag
        ).replace(/!/g, "%21");
        a.tag[0] === "!" ? U = "!" + U : U.slice(0, 18) === "tag:yaml.org,2002:" ? U = "!!" + U.slice(18) : U = "!<" + U + ">", a.dump = U + " " + a.dump;
      }
    }
    return !0;
  }
  function g(a, l) {
    const v = [], h = [];
    C(a, v, h);
    const T = h.length;
    for (let L = 0; L < T; L += 1)
      l.duplicates.push(v[h[L]]);
    l.usedDuplicates = new Array(T);
  }
  function C(a, l, v) {
    if (a !== null && typeof a == "object") {
      const h = l.indexOf(a);
      if (h !== -1)
        v.indexOf(h) === -1 && v.push(h);
      else if (l.push(a), Array.isArray(a))
        for (let T = 0, L = a.length; T < L; T += 1)
          C(a[T], l, v);
      else {
        const T = Object.keys(a);
        for (let L = 0, S = T.length; L < S; L += 1)
          C(a[T[L]], l, v);
      }
    }
  }
  function I(a, l) {
    l = l || {};
    const v = new Se(l);
    v.noRefs || g(a, v);
    let h = a;
    return v.replacer && (h = v.replacer.call({ "": h }, "", h)), f(v, 0, h, !0, !0) ? v.dump + `
` : "";
  }
  return Sa.dump = I, Sa;
}
var Qa;
function Gr() {
  if (Qa) return Y;
  Qa = 1;
  const n = jr(), r = qr();
  function i(d, t) {
    return function() {
      throw new Error("Function yaml." + d + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.");
    };
  }
  return Y.Type = J(), Y.Schema = rr(), Y.FAILSAFE_SCHEMA = sr(), Y.JSON_SCHEMA = Cr(), Y.CORE_SCHEMA = mr(), Y.DEFAULT_SCHEMA = Na(), Y.load = n.load, Y.loadAll = n.loadAll, Y.dump = r.dump, Y.YAMLException = _e(), Y.types = {
    binary: dr(),
    float: cr(),
    map: tr(),
    null: lr(),
    pairs: Tr(),
    set: gr(),
    timestamp: fr(),
    bool: or(),
    int: ur(),
    merge: pr(),
    omap: hr(),
    seq: nr(),
    str: ir()
  }, Y.safeLoad = i("safeLoad", "load"), Y.safeLoadAll = i("safeLoadAll", "loadAll"), Y.safeDump = i("safeDump", "dump"), Y;
}
var zr = Gr();
const Yr = /* @__PURE__ */ Xr(zr), {
  Type: bi,
  Schema: Ri,
  FAILSAFE_SCHEMA: Pi,
  JSON_SCHEMA: Ai,
  CORE_SCHEMA: xi,
  DEFAULT_SCHEMA: ki,
  load: Jr,
  loadAll: _i,
  dump: Kr,
  YAMLException: Mi,
  types: wi,
  safeLoad: Fi,
  safeLoadAll: Oi,
  safeDump: Ei
} = Yr;
var $r = Object.create, Sr = Object.defineProperty, Qr = Object.getOwnPropertyDescriptor, vr = Object.getOwnPropertyNames, Zr = Object.getPrototypeOf, ei = Object.prototype.hasOwnProperty, Lr = (n, r) => function() {
  return r || (0, n[vr(n)[0]])((r = { exports: {} }).exports, r), r.exports;
}, ai = (n, r, i, d) => {
  if (r && typeof r == "object" || typeof r == "function")
    for (let t of vr(r))
      !ei.call(n, t) && t !== i && Sr(n, t, { get: () => r[t], enumerable: !(d = Qr(r, t)) || d.enumerable });
  return n;
}, Ir = (n, r, i) => (i = n != null ? $r(Zr(n)) : {}, ai(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  Sr(i, "default", { value: n, enumerable: !0 }),
  n
)), ri = Lr({
  "src/mock-data/session.json"(n, r) {
    r.exports = {
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
            IsScenic: !0,
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
}), ii = Lr({
  "src/mock-data/telemetry.json"(n, r) {
    r.exports = {
      SessionTime: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "SessionOnJokerLap",
        description: "Player is currently completing a joker lap",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      SessionTimeOfDay: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "DriverMarker",
        description: "Driver activated flag",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      PushToPass: {
        countAsTime: !1,
        length: 1,
        name: "PushToPass",
        description: "Push to pass button state",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      ManualBoost: {
        countAsTime: !1,
        length: 1,
        name: "ManualBoost",
        description: "Hybrid manual boost state",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      ManualNoBoost: {
        countAsTime: !1,
        length: 1,
        name: "ManualNoBoost",
        description: "Hybrid manual no boost state",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      IsOnTrack: {
        countAsTime: !1,
        length: 1,
        name: "IsOnTrack",
        description: "1=Car on track physics running with player in car",
        unit: "",
        varType: 1,
        value: [
          !0
        ]
      },
      IsReplayPlaying: {
        countAsTime: !1,
        length: 1,
        name: "IsReplayPlaying",
        description: "0=replay not playing  1=replay playing",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      ReplayFrameNum: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "IsDiskLoggingEnabled",
        description: "0=disk based telemetry turned off  1=turned on",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      IsDiskLoggingActive: {
        countAsTime: !1,
        length: 1,
        name: "IsDiskLoggingActive",
        description: "0=disk based telemetry file not being written  1=being written",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      FrameRate: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "PlayerCarInPitStall",
        description: "Players car is properly in there pitstall",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      PlayerCarPitSvStatus: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 64,
        name: "CarIdxOnPitRoad",
        description: "On pit road between the cones by car index",
        unit: "",
        varType: 1,
        value: [
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1
        ]
      },
      CarIdxPosition: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 64,
        name: "CarIdxQualTireCompoundLocked",
        description: "Cars Qual tire compound is locked-in",
        unit: "",
        varType: 1,
        value: [
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1
        ]
      },
      CarIdxFastRepairsUsed: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "OnPitRoad",
        description: "Is the player car on pit road between the cones",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      CarIdxSteer: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "LapDeltaToBestLap_OK",
        description: "Delta time for best lap is valid",
        unit: "",
        varType: 1,
        value: [
          !0
        ]
      },
      LapDeltaToOptimalLap: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "LapDeltaToOptimalLap_OK",
        description: "Delta time for optimal lap is valid",
        unit: "",
        varType: 1,
        value: [
          !0
        ]
      },
      LapDeltaToSessionBestLap: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "LapDeltaToSessionBestLap_OK",
        description: "Delta time for session best lap is valid",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      LapDeltaToSessionOptimalLap: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "LapDeltaToSessionOptimalLap_OK",
        description: "Delta time for session optimal lap is valid",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      LapDeltaToSessionLastlLap: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "LapDeltaToSessionLastlLap_OK",
        description: "Delta time for session last lap is valid",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      Speed: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "OkToReloadTextures",
        description: "True if it is ok to reload car textures at this time",
        unit: "",
        varType: 1,
        value: [
          !0
        ]
      },
      LoadNumTextures: {
        countAsTime: !1,
        length: 1,
        name: "LoadNumTextures",
        description: "True if the car_num texture will be loaded",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      CarLeftRight: {
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "PitsOpen",
        description: "True if pit stop is allowed for the current player",
        unit: "",
        varType: 1,
        value: [
          !0
        ]
      },
      VidCapEnabled: {
        countAsTime: !1,
        length: 1,
        name: "VidCapEnabled",
        description: "True if video capture system is enabled",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      VidCapActive: {
        countAsTime: !1,
        length: 1,
        name: "VidCapActive",
        description: "True if video currently being captured",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      PitRepairLeft: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "PitstopActive",
        description: "Is the player getting pit stop service",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      FastRepairUsed: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "IsOnTrackCar",
        description: "1=Car on track physics running",
        unit: "",
        varType: 1,
        value: [
          !0
        ]
      },
      IsInGarage: {
        countAsTime: !1,
        length: 1,
        name: "IsInGarage",
        description: "1=Car in garage physics running",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      SteeringWheelPctTorque: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "SteeringWheelUseLinear",
        description: "True if steering wheel force is using linear mode",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      BrakeABSactive: {
        countAsTime: !1,
        length: 1,
        name: "BrakeABSactive",
        description: "true if abs is currently reducing brake force pressure",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      EngineWarnings: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 64,
        name: "CarIdxP2P_Status",
        description: "Push2Pass active or not",
        unit: "",
        varType: 1,
        value: [
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1,
          !1
        ]
      },
      CarIdxP2P_Count: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "ReplayPlaySlowMotion",
        description: "0=not slow motion  1=replay is in slow motion",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      ReplaySessionTime: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
        countAsTime: !0,
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
        countAsTime: !0,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
        countAsTime: !0,
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
        countAsTime: !0,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
        countAsTime: !0,
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
        countAsTime: !0,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
        length: 1,
        name: "dcStarter",
        description: "In car trigger car starter",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      dcPitSpeedLimiterToggle: {
        countAsTime: !1,
        length: 1,
        name: "dcPitSpeedLimiterToggle",
        description: "In car traction control active",
        unit: "",
        varType: 1,
        value: [
          !1
        ]
      },
      dpRFTireChange: {
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
        countAsTime: !1,
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
        countAsTime: !0,
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
}), ni = () => kr(_r(import.meta.url)), Ae = /* @__PURE__ */ ((n) => (n[n.None = 0] = "None", n[n.Error = 1] = "Error", n[n.Warn = 2] = "Warn", n[n.Info = 3] = "Info", n[n.Debug = 4] = "Debug", n))(Ae || {}), ti = async () => {
  const n = await Promise.resolve().then(() => Ir(ri()));
  return Kr(n.default);
}, si = async () => (await Promise.resolve().then(() => Ir(ii()))).default, se = null, he = null, li = class {
  constructor() {
    K(this, "currDataVersion", 1);
    K(this, "isMocked", !0);
    K(this, "enableLogging", !1);
    K(this, "logLevel", 0);
    K(this, "_isRunning", !1);
    this._loadMockData().catch((n) => {
      La("Error loading mock data for mock SDK:", n);
    }), Pr(
      "Attempting to access iRacing SDK on unsupported platform!",
      `
Returning mock SDK for testing purposes. (Only win32 supported)`
    );
  }
  async _loadMockData() {
    const [n, r] = await Promise.all([
      he ? Promise.resolve(he) : ti(),
      se ? Promise.resolve(se) : si()
    ]);
    he = n, se = r;
  }
  startSDK() {
    return this._isRunning = !0, !0;
  }
  stopSDK() {
    this._isRunning = !1;
  }
  isRunning() {
    return this._isRunning;
  }
  waitForData(n) {
    const r = !he || !se;
    return this._isRunning && !r;
  }
  getSessionData() {
    return he ?? "";
  }
  getSessionConnectionID() {
    return he ? 1 : -1;
  }
  getSessionVersionNum() {
    return he ? 1 : -1;
  }
  getTelemetryData() {
    return se || {};
  }
  getTelemetryVariable(n) {
    if (!se)
      throw new Error("Attempted accessing mock telemetry before it was loaded.");
    return typeof n == "number" ? Object.values(se)[n] : se[n];
  }
  getTelemetryVariableIndex(n) {
    return 0;
  }
  broadcast(n, ...r) {
    return Ar("Mocking SDK call:", n, ...r), !0;
  }
  __getTelemetryTypes() {
    return {};
  }
}, oi = ni(), Ia;
try {
  const n = xr(oi, "../..");
  Ia = Wr(n).iRacingSdkNode;
} catch {
  console.warn("Failed to load native iRacing SDK module. Loading mock SDK instead."), Ia = li;
}
var ui = Ia, B = /* @__PURE__ */ ((n) => (n[n.CameraSwitchPos = 0] = "CameraSwitchPos", n[n.CameraSwitchNum = 1] = "CameraSwitchNum", n[n.CameraSetState = 2] = "CameraSetState", n[n.ReplaySetPlaySpeed = 3] = "ReplaySetPlaySpeed", n[n.ReplaySetPlayPosition = 4] = "ReplaySetPlayPosition", n[n.ReplaySearch = 5] = "ReplaySearch", n[n.ReplaySetState = 6] = "ReplaySetState", n[n.ReloadTextures = 7] = "ReloadTextures", n[n.ChatCommand = 8] = "ChatCommand", n[n.PitCommand = 9] = "PitCommand", n[n.TelemCommand = 10] = "TelemCommand", n[n.FFBCommand = 11] = "FFBCommand", n[n.ReplaySearchSessionTime = 12] = "ReplaySearchSessionTime", n[n.VideoCapture = 13] = "VideoCapture", n[n.UnusedPlaceholder = 14] = "UnusedPlaceholder", n))(B || {}), Dr = /* @__PURE__ */ ((n) => (n[n.Macro = 0] = "Macro", n[n.BeginChat = 1] = "BeginChat", n[n.Reply = 2] = "Reply", n[n.Cancel = 3] = "Cancel", n))(Dr || {}), je = /* @__PURE__ */ ((n) => (n[n.Stop = 0] = "Stop", n[n.Start = 1] = "Start", n[n.Restart = 2] = "Restart", n))(je || {}), Da = /* @__PURE__ */ ((n) => (n[n.All = 0] = "All", n[n.CarIndex = 1] = "CarIndex", n))(Da || {}), ci = "http://127.0.0.1:32034/get_sim_status?object=simStatus", Ci = () => new Promise((n, r) => {
  wr.get(ci, (d) => {
    let t = "";
    d.on("data", (u) => {
      t += u;
    }), d.on("end", () => {
      typeof t != "string" && r(new Error("Invalid payload from sim received")), n(t.includes("running:1"));
    });
  }).on("error", (d) => {
    r(d);
  });
});
function Za(n, r, i) {
  if (i[r] = { ...n }, n.varType === 1) {
    i[r].value = [], new Int8Array(n.value).forEach((t, u) => {
      i[r].value[u] = !!t;
    });
    return;
  }
  n.varType === 2 || n.varType === 3 ? i[r].value = [...new Int32Array(n.value)] : n.varType === 4 ? i[r].value = [...new Float32Array(n.value)] : n.varType === 5 && (i[r].value = [...new Float64Array(n.value)]);
}
var Te = {
  logLevel: Ae.None,
  autoEnableTelemetry: !1,
  useTelemVariableCache: !0
}, er = class Nr {
  constructor(r) {
    // Public
    /**
     * Enable attempting to auto-start telemetry when starting the SDK (if it is not running).
     * @default false
     */
    K(this, "autoEnableTelemetry", Te.autoEnableTelemetry);
    /**
     * The logging level to use when calling irsdk-node API's. Defaults to 0 (LogLevel.None).
     * @default 0
     */
    K(this, "logLevel", Te.logLevel);
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
    K(this, "useTelemVariableCache", Te.useTelemVariableCache);
    // Private
    K(this, "_dataVer", -1);
    K(this, "_sessionData", null);
    K(this, "_sdk");
    K(this, "_resolvedConfig");
    K(this, "_variableIndexCache", {});
    this._resolvedConfig = {
      ...Te,
      ...r ?? {}
    };
    const i = this._resolvedConfig.logLevel ?? Te.logLevel, d = this._resolvedConfig.autoEnableTelemetry ?? Te.autoEnableTelemetry, t = this._resolvedConfig.useTelemVariableCache ?? Te.useTelemVariableCache;
    this._sdk = new ui(), this._sdk.logLevel = i, this.autoEnableTelemetry = d, this.useTelemVariableCache = t, Nr.IsSimRunning();
  }
  /**
   * Gets the cached variable index from the internal cache, if it exists, otherwise
   * requests the index from the native module.
   *
   * @param varName The variable to grab from the cache.
   * @returns The index of the variable in the variable list.
   */
  _fetchVariableIndexFromCache(r) {
    const i = this._variableIndexCache[r];
    if (typeof i == "number")
      return i;
    const d = this._sdk.getTelemetryVariableIndex(r);
    return d === null ? null : (this._variableIndexCache[r] = d, d);
  }
  /**
   * Wait for the SDK module to resolve and load.
   * @deprecated This is no longer needed as of v4.0.3. Please remove.
   */
  async ready() {
    return Promise.resolve(!0);
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
    return this._sdk.logLevel !== Ae.None;
  }
  set enableLogging(r) {
    this._sdk.logLevel = r ? Ae.Error : Ae.None;
  }
  // @todo: add getter for current session string version
  /**
   * Checks whether the simulation service is running.
   * @returns {boolean} True if the service is running.
   */
  static async IsSimRunning() {
    try {
      return await Ci();
    } catch (r) {
      La("Could not successfully determine sim status:", r);
    }
    return !1;
  }
  get sessionStatusOK() {
    return this._sdk.isRunning();
  }
  /**
   * Starts the native iRacing SDK and begins subscribing for data.
   * @returns {boolean} If the SDK started successfully.
   */
  startSDK() {
    if (this.resetTelemetryVariableCache(), !this._sdk.isRunning()) {
      const r = this._sdk.startSDK();
      return this.autoEnableTelemetry && this.enableTelemetry(!0), r;
    }
    return !0;
  }
  /**
   * Stops the SDK from running and resets the data version.
   */
  stopSDK() {
    this._sdk.stopSDK(), this._dataVer = -1, this.resetTelemetryVariableCache();
  }
  /**
   * Wait for new data from the sdk.
   * @param {number} timeout Timeout (in ms). Max is 60fps (1/60)
   */
  waitForData(r) {
    const i = this._sdk.waitForData(r);
    return !i && this._sdk.currDataVersion === -1 && (this._dataVer = -1, this._sessionData = null), i;
  }
  /**
   * Gets the current session data (from yaml format).
   * @returns {SessionData}
   */
  getSessionData() {
    if (this._sessionData && this._dataVer === this.currDataVersion)
      return this._sessionData;
    try {
      const r = this._sdk.getSessionData();
      return this._sessionData = Jr(r.replaceAll(": ,", ": 0,")), this._sessionData;
    } catch (r) {
      La("There was an error getting session data:", r);
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
    const r = this.getSessionData();
    return (r == null ? void 0 : r.WeekendInfo) ?? null;
  }
  /**
   * Gets the current session info from the session data.
   * @returns {SessionInfo}
   */
  getSessionInfo() {
    const r = this.getSessionData();
    return (r == null ? void 0 : r.SessionInfo) ?? null;
  }
  /**
   * Gets the current camera info from the session data.
   * @returns {CameraInfo}
   */
  getCameraInfo() {
    const r = this.getSessionData();
    return (r == null ? void 0 : r.CameraInfo) ?? null;
  }
  /**
   * Gets the current radio info from the session data.
   * @returns {RadioInfo}
   */
  getRadioInfo() {
    const r = this.getSessionData();
    return (r == null ? void 0 : r.RadioInfo) ?? null;
  }
  /**
   * Gets the current driver info from the session data.
   * @returns {DriverInfo}
   */
  getDriverInfo() {
    const r = this.getSessionData();
    return (r == null ? void 0 : r.DriverInfo) ?? null;
  }
  /**
   * Gets the current split time info from the session data.
   * @returns {SplitTimeInfo}
   */
  getSplitInfo() {
    const r = this.getSessionData();
    return (r == null ? void 0 : r.SplitTimeInfo) ?? null;
  }
  /**
   * Gets the current session info from the session data.
   * @returns {CarSetupInfo}
   */
  getCarSetupInfo() {
    const r = this.getSessionData();
    return (r == null ? void 0 : r.CarSetup) ?? null;
  }
  /**
   * Get the current value of the telemetry variables.
   *
   * Telemetry gets updated every tick. This is a large object, so large amounts
   * of processing between ticks should attempt to cache this data instead of
   * re-requesting it via this function.
   */
  getTelemetry() {
    const r = this._sdk.getTelemetryData(), i = {};
    return Object.keys(r).length > 0 && Object.keys(r).forEach((d) => {
      Za(
        r[d],
        d,
        i
      );
    }), i;
  }
  getTelemetryVariable(r) {
    let i = r;
    if (this.useTelemVariableCache && typeof r == "string") {
      const u = this._fetchVariableIndexFromCache(r);
      if (u === null)
        return null;
      i = u;
    }
    const d = this._sdk.getTelemetryVariable(i);
    if (!d)
      return null;
    const t = {};
    return Za(
      d,
      // eslint-disable-line
      d.name,
      t
    ), t[d.name];
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
  enableTelemetry(r) {
    const i = r ? je.Start : je.Stop;
    this._sdk.broadcast(B.TelemCommand, i);
  }
  restartTelemetry() {
    this._sdk.broadcast(B.TelemCommand, je.Restart);
  }
  changeCameraPosition(r, i, d) {
    this._sdk.broadcast(B.CameraSwitchPos, r, i, d);
  }
  // @todo: needs to be padded
  changeCameraNumber(r, i, d) {
    this._sdk.broadcast(B.CameraSwitchNum, r, i, d);
  }
  changeCameraState(r) {
    this._sdk.broadcast(B.CameraSetState, r);
  }
  changeReplaySpeed(r, i) {
    this._sdk.broadcast(B.ReplaySetPlaySpeed, r, i ? 1 : 0);
  }
  changeReplayPosition(r, i) {
    this._sdk.broadcast(B.ReplaySetPlayPosition, r, i);
  }
  searchReplay(r) {
    this._sdk.broadcast(B.ReplaySearch, r);
  }
  changeReplayState(r) {
    this._sdk.broadcast(B.ReplaySetState, r);
  }
  triggerReplaySessionSearch(r, i) {
    this._sdk.broadcast(B.ReplaySearchSessionTime, r, i);
  }
  reloadAllTextures() {
    this._sdk.broadcast(B.ReloadTextures, Da.All, 0);
  }
  reloadCarTextures(r) {
    this._sdk.broadcast(
      B.ReloadTextures,
      Da.CarIndex,
      r
    );
  }
  triggerChatState(r) {
    this._sdk.broadcast(B.ChatCommand, r);
  }
  /**
   * @param {number} macro Between 1 - 15
   */
  triggerChatMacro(r) {
    const i = Math.min(15, Math.max(1, r));
    this._sdk.broadcast(B.ChatCommand, Dr.Macro, i);
  }
  triggerPitClearCommand(r) {
    this._sdk.broadcast(B.PitCommand, r, 0);
  }
  triggerPitCommand(r) {
    this._sdk.broadcast(B.PitCommand, r, 0);
  }
  triggerPitChange(r, i) {
    this._sdk.broadcast(B.PitCommand, r, i);
  }
  changeFFB(r, i) {
    this._sdk.broadcast(B.FFBCommand, r, i);
  }
  triggerVideoCapture(r) {
    this._sdk.broadcast(B.VideoCapture, r);
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
  broadcastUnsafe(r, ...i) {
    return this._sdk.broadcast(r, ...i);
  }
};
class mi {
  constructor(r) {
    this.ipcSender = r, this.isRunning = !1, this.sessionTime = 0;
  }
  start() {
    if (this.isRunning) return;
    this.isRunning = !0, console.log("Mock Telemetry started");
    const r = {
      data: {
        WeekendInfo: {
          TrackLength: "4.00 km"
        },
        DriverInfo: {
          DriverCarIdx: 1,
          Drivers: [
            { CarIdx: 0, UserName: "Radar Tester 1", CarNumber: "1", iRating: 2500, LicString: "A 3.50", CarClassColor: 16711680 },
            { CarIdx: 1, UserName: "Player", CarNumber: "2", iRating: 2100, LicString: "B 2.10", CarClassColor: 65280 },
            { CarIdx: 2, UserName: "Radar Tester 2", CarNumber: "42", iRating: 1800, LicString: "C 3.99", CarClassColor: 65280 },
            { CarIdx: 3, UserName: "Fast Guy", CarNumber: "99", iRating: 3100, LicString: "A 4.99", CarClassColor: 16711680 },
            { CarIdx: 4, UserName: "Lapped Car", CarNumber: "7", iRating: 1200, LicString: "D 2.50", CarClassColor: 255 },
            { CarIdx: 5, UserName: "Rival", CarNumber: "33", iRating: 2150, LicString: "B 3.00", CarClassColor: 65280 },
            { CarIdx: 6, UserName: "Leader", CarNumber: "10", iRating: 4e3, LicString: "A 4.00", CarClassColor: 16711680 }
          ]
        }
      }
    }, i = () => {
      if (!this.isRunning) return;
      this.sessionTime += 0.033, this.tickCount = (this.tickCount || 0) + 1, this.tickCount % 30 === 0 && this.ipcSender("session-info", r);
      const d = Math.max(0, Math.sin(this.sessionTime * 2)), t = Math.max(0, -Math.sin(this.sessionTime * 2)), u = Math.sin(this.sessionTime) * 1.5, p = Math.floor(Math.abs(Math.sin(this.sessionTime * 0.5) * 6)) + 1, m = 3e3 + d * 4e3, N = p * 30 + d * 20, o = Math.max(0, 50 - this.sessionTime * 0.05), c = Math.abs(this.sessionTime * 0.01 % 1), D = Math.abs((c + Math.sin(this.sessionTime * 0.2) * 5e-3) % 1), A = Math.abs((c + Math.cos(this.sessionTime * 0.15) * 8e-3) % 1), k = (c + 0.15) % 1, j = (c + 0.5) % 1, _ = (c + 0.85) % 1, q = (c + 0.05) % 1;
      let G = D - c;
      G > 0.5 && (G -= 1), G < -0.5 && (G += 1);
      let H = A - c;
      H > 0.5 && (H -= 1), H < -0.5 && (H += 1);
      let W = 1;
      Math.abs(G * 4e3) < 5 ? W = 2 : Math.abs(H * 4e3) < 5 && (W = 3);
      const X = 22.5 + Math.sin(this.sessionTime * 0.05) * 0.5, $ = 35.2 + Math.cos(this.sessionTime * 0.02) * 1.5, pe = 2.5 + Math.sin(this.sessionTime * 0.1) * 1, le = this.sessionTime * 0.05 % (Math.PI * 2), oe = this.sessionTime * 0.3 % (Math.PI * 2), ee = this.sessionTime % 15 < 7.5, E = {
        values: {
          SessionTime: this.sessionTime,
          AirTemp: X,
          TrackTemp: $,
          WindVel: Math.max(0, pe),
          WindDir: le,
          Yaw: oe,
          FuelLevel: o,
          FuelUsePerHour: 15.5,
          SteeringWheelAngle: u,
          Throttle: d,
          Brake: t,
          Clutch: 0,
          Gear: p,
          RPM: m,
          ShiftIndicatorPct: (m - 3e3) / 4e3,
          // mock: 3000 is 0, 7000 is 1.0
          Speed: N,
          PitSvFlags: 31,
          PitSvFuel: 25.5,
          // Added 7 cars total
          CarIdxPosition: [6, 3, 5, 2, 7, 4, 1],
          CarIdxClassPosition: [6, 3, 5, 2, 7, 4, 1],
          CarIdxLap: [9, 10, 11, 10, 8, 10, 10],
          CarIdxLapDistPct: [D, c, A, k, j, _, q],
          CarLeftRight: W,
          CarIdxOnPitRoad: [!1, ee, !0, !1, !1, !1, !1],
          CarIdxHasDamage: [!0, !1, !1, !1, !0, !1, !1],
          CarIdxIsFastestLap: [!1, !1, !1, !1, !1, !1, !0],
          CarIdxBestLapTime: [75.2, 72.1, 74.5, 71.8, 80, 73, 71.5],
          CarIdxLastLapTime: [76.1, 72.3, 75, 72, 81.2, 73.5, 71.8],
          CarIdxF2Time: [12.5, 0, 4.2, -1.5, 45, 2.1, -15]
        }
      }, w = this.filterTelemetry(E);
      this.ipcSender("telemetry-update", w), setTimeout(i, 33);
    };
    i();
  }
  stop() {
    this.isRunning = !1;
  }
  filterTelemetry(r) {
    const i = (r == null ? void 0 : r.values) || r || {}, d = {};
    for (let t = 0; t < 64; t++)
      i.CarIdxPosition && i.CarIdxPosition[t] > 0 && (d[t] = {
        Position: i.CarIdxPosition[t],
        ClassPosition: i.CarIdxClassPosition ? i.CarIdxClassPosition[t] : 0,
        LapDistPct: i.CarIdxLapDistPct ? i.CarIdxLapDistPct[t] : 0,
        Lap: i.CarIdxLap ? i.CarIdxLap[t] : 0,
        LastLapTime: i.CarIdxLastLapTime ? i.CarIdxLastLapTime[t] : -1,
        BestLapTime: i.CarIdxBestLapTime ? i.CarIdxBestLapTime[t] : -1,
        F2Time: i.CarIdxF2Time ? i.CarIdxF2Time[t] : -1,
        TrackSurface: i.CarIdxTrackSurface ? i.CarIdxTrackSurface[t] : 3,
        OnPitRoad: i.CarIdxOnPitRoad ? i.CarIdxOnPitRoad[t] : !1,
        HasDamage: i.CarIdxHasDamage ? i.CarIdxHasDamage[t] : !1,
        IsFastestLap: i.CarIdxIsFastestLap ? i.CarIdxIsFastestLap[t] : !1
      });
    return {
      SessionTime: i.SessionTime,
      player_name: "Player",
      playerCarIdx: 1,
      AirTemp: i.AirTemp || 0,
      TrackTemp: i.TrackTemp || 0,
      WindVel: i.WindVel || 0,
      WindDir: i.WindDir || 0,
      Yaw: i.Yaw || 0,
      FuelLevel: i.FuelLevel || 0,
      FuelUsePerHour: i.FuelUsePerHour || 0,
      SteeringWheelAngle: i.SteeringWheelAngle || 0,
      Throttle: i.Throttle || 0,
      Brake: i.Brake || 0,
      Clutch: i.Clutch || 0,
      Gear: i.Gear || 0,
      RPM: i.RPM || 0,
      ShiftIndicatorPct: i.ShiftIndicatorPct || 0,
      Speed: i.Speed || 0,
      PitSvFlags: i.PitSvFlags || 0,
      PitSvFuel: i.PitSvFuel || 0,
      CarLeftRight: i.CarLeftRight || 0,
      grid: d
    };
  }
}
class fi {
  constructor(r) {
    this.ipcSender = r, this.iracing = new er(), this.isRunning = !1, this.mockService = null;
  }
  async start() {
    if (this.isRunning) return;
    if (this.isRunning = !0, !await er.IsSimRunning() && (console.warn("iRacing is not running."), process.env.VITE_DEV_SERVER_URL)) {
      console.log("Starting Mock Telemetry as fallback..."), this.mockService = new mi(this.ipcSender), this.mockService.start();
      return;
    }
    this.iracing.startSDK();
    const i = Math.floor(1 / 30 * 1e3), d = () => {
      if (this.isRunning && !this.mockService) {
        if (this.iracing.waitForData(i)) {
          const t = this.iracing.getSessionData(), u = this.iracing.getTelemetry();
          if (t && this.ipcSender("session-info", { data: t }), u) {
            const p = this.filterTelemetry(u);
            this.ipcSender("telemetry-update", p);
          }
        }
        setTimeout(d, 10);
      }
    };
    d();
  }
  stop() {
    this.isRunning = !1, this.mockService ? (this.mockService.stop(), this.mockService = null) : this.iracing.stopSDK();
  }
  filterTelemetry(r) {
    var t, u, p, m, N, o, c, D, A, k, j;
    const i = (r == null ? void 0 : r.values) || r || {}, d = {};
    for (let _ = 0; _ < 64; _++)
      i.CarIdxPosition && i.CarIdxPosition[_] > 0 && (d[_] = {
        Position: i.CarIdxPosition[_],
        ClassPosition: i.CarIdxClassPosition ? i.CarIdxClassPosition[_] : 0,
        LapDistPct: i.CarIdxLapDistPct ? i.CarIdxLapDistPct[_] : 0,
        Lap: i.CarIdxLap ? i.CarIdxLap[_] : 0,
        LastLapTime: i.CarIdxLastLapTime ? i.CarIdxLastLapTime[_] : -1,
        BestLapTime: i.CarIdxBestLapTime ? i.CarIdxBestLapTime[_] : -1,
        F2Time: i.CarIdxF2Time ? i.CarIdxF2Time[_] : -1,
        TrackSurface: i.CarIdxTrackSurface ? i.CarIdxTrackSurface[_] : 3,
        OnPitRoad: i.CarIdxOnPitRoad ? i.CarIdxOnPitRoad[_] : !1,
        HasDamage: i.CarIdxHasDamage ? i.CarIdxHasDamage[_] : !1,
        IsFastestLap: i.CarIdxIsFastestLap ? i.CarIdxIsFastestLap[_] : !1
      });
    return {
      SessionTime: i.SessionTime,
      player_name: ((D = (c = (p = (u = (t = r == null ? void 0 : r.sessionInfo) == null ? void 0 : t.data) == null ? void 0 : u.DriverInfo) == null ? void 0 : p.Drivers) == null ? void 0 : c[(o = (N = (m = r == null ? void 0 : r.sessionInfo) == null ? void 0 : m.data) == null ? void 0 : N.DriverInfo) == null ? void 0 : o.DriverCarIdx]) == null ? void 0 : D.UserName) || "",
      playerCarIdx: (j = (k = (A = r == null ? void 0 : r.sessionInfo) == null ? void 0 : A.data) == null ? void 0 : k.DriverInfo) == null ? void 0 : j.DriverCarIdx,
      AirTemp: i.AirTemp || 0,
      TrackTemp: i.TrackTemp || 0,
      WindVel: i.WindVel || 0,
      WindDir: i.WindDir || 0,
      Yaw: i.Yaw || 0,
      FuelLevel: i.FuelLevel || 0,
      FuelUsePerHour: i.FuelUsePerHour || 0,
      SteeringWheelAngle: i.SteeringWheelAngle || 0,
      Throttle: i.Throttle || 0,
      Brake: i.Brake || 0,
      Clutch: i.Clutch || 0,
      Gear: i.Gear || 0,
      RPM: i.RPM || 0,
      ShiftIndicatorPct: i.ShiftIndicatorPct || 0,
      Speed: i.Speed || 0,
      PitSvFlags: i.PitSvFlags || 0,
      PitSvFuel: i.PitSvFuel || 0,
      CarLeftRight: i.CarLeftRight || 0,
      grid: d
    };
  }
}
class pi {
  constructor(r) {
    const i = xe.getPath("userData");
    this.path = Ne.join(i, r.configName + ".json"), this.data = di(this.path, r.defaults);
  }
  get(r) {
    return this.data[r];
  }
  set(r, i) {
    this.data[r] = i, qe.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
  }
  setAll(r) {
    this.data = { ...this.data, ...r }, qe.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
  }
  getAll() {
    return this.data;
  }
}
function di(n, r) {
  try {
    return JSON.parse(qe.readFileSync(n));
  } catch {
    return r;
  }
}
let De;
xe.whenReady().then(() => {
  const n = new pi({
    configName: "user-preferences",
    defaults: {
      overlays: {
        standings: {
          enabled: !1,
          x: 100,
          y: 100,
          width: 400,
          height: 600,
          clickThrough: !1,
          columns: { pos: !0, num: !0, driver: !0, carName: !1, carClass: !0, classPos: !0, srating: !0, irating: !0, gap: !0, bestLap: !1, lastLap: !0, trackPct: !1, laps: !1 }
        },
        relative: { enabled: !1, x: 500, y: 100, width: 400, height: 600, clickThrough: !1 },
        fuel: { enabled: !1, x: 100, y: 750, width: 250, height: 150, clickThrough: !1 },
        inputs: { enabled: !1, x: 400, y: 750, width: 300, height: 150, clickThrough: !1 }
      }
    }
  });
  De = new Or(n), De.createDashboard();
  const r = n.get("overlays") || {};
  Object.keys(r).forEach((d) => {
    r[d].enabled && De.createOverlay(d, r[d]);
  }), new fi((d, t) => {
    De && De.broadcast(d, t);
  }).start(), xe.on("activate", () => {
    va.getAllWindows().length === 0 && De.createDashboard();
  });
});
xe.on("window-all-closed", () => {
  process.platform !== "darwin" && xe.quit();
});
