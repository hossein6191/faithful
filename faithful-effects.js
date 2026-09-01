/* The visual layer: theme, falling letters, the globe, and the scroll gate.
 *
 * Ported from the design-canvas component that produced this page. That was a
 * React class whose only job was to attach behaviour to markup that was already
 * static, so this is the same code with `this.state` and `this.props` replaced
 * by module variables and the canvas runtime dropped. The page does not need
 * React to render, and shipping a 69 KB runtime to run four animations would be
 * paying for the tool rather than the result.
 *
 * Nothing here touches the wallet, the contract, or a single certificate.
 * `faithful-app.js` owns all of that and does not know this file exists.
 */

import { LANGUAGES } from "./languages.js";

const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const RAIN_DENSITY = 130;
const GLOBE_SPEED = 0.14;

/* Every language the page knows, placed where most of its speakers are. The
   sixteen with a Discord channel are drawn larger and always labelled; the rest
   appear as you turn the globe towards them, so somebody can find their own
   language without it being one of the sixteen. */
const MARKERS = LANGUAGES.map((l) => ({
  label: l.label, name: l.endonym, country: l.country, discord: l.discord,
  lat: l.lat * Math.PI / 180, lon: l.lon * Math.PI / 180,
}));

let dark = true;
let globeSel = null;

/* ------------------------------------------------------------------- theme */
function applyTheme(next, persist) {
  dark = next;
  /* On the root, not on body. The palette lives in `:root`, so a theme change
     redefines those variables on an *ancestor* of the element whose background
     reads them. Declared on body itself, `background: var(--bg)` and the rule
     overriding `--bg` sat on the same element, and the background simply did
     not follow: the attribute flipped, `--bg` read the new colour, and the
     page stayed dark. Descendants using the same variables updated correctly
     the whole time, which is what made it hard to see. */
  /* On the root, where the palette is declared, so a theme change redefines
     the variables on the element the page's own background reads them from. */
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  const toggle = $("themeToggle");
  if (toggle) toggle.setAttribute("aria-checked", String(dark));
  if (persist) { try { localStorage.setItem("faithful_theme", dark ? "dark" : "light"); } catch (e) {} }
}

let burstTimer = null;
function toggleTheme() {
  applyTheme(!dark, true);
  const host = $("tbursts");
  if (!host) return;
  host.innerHTML = "<span class='tburst'></span>".repeat(3);
  clearTimeout(burstTimer);
  burstTimer = setTimeout(() => { host.innerHTML = ""; }, 900);
}

/* --------------------------------------------------- the chips, and the globe */
/* The globe reads which community is selected rather than owning that state, so
   a click on a chip and a click on a marker cannot disagree about which one is
   chosen. The app paints the chips; this only watches them. */
function watchChips() {
  const host = $("tgt-langs");
  if (!host) return;
  const sync = () => {
    const pressed = host.querySelector('button[aria-pressed="true"]');
    globeSel = pressed
      ? (MARKERS.find((m) => pressed.textContent.includes(m.label)) || {}).label || null
      : null;
  };
  new MutationObserver(sync).observe(host, {
    subtree: true, childList: true, attributes: true, attributeFilter: ["aria-pressed"],
  });
  sync();
}

/* Clicking a marker goes through the app's own chooser, so the globe, the chips
   and the search box cannot end up disagreeing about which language is chosen.
   Falling back to a chip click keeps it working if the module is slow to load. */
async function pickCommunity(label) {
  try {
    const app = await import("./faithful-app.js");
    if (app.chooseLanguage) { app.chooseLanguage(label); return; }
  } catch (e) {}
  const host = $("tgt-langs");
  const b = host && [...host.querySelectorAll("button")].find((x) => x.textContent.includes(label));
  if (b) b.click();
}

/* ------------------------------------------------------------ falling letters */
function startRain() {
  const cv = $("rain");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(1.5, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
  };
  resize();
  addEventListener("resize", resize);

  /* Letters from the scripts this contract was built for, so the background is
     the subject rather than decoration. */
  const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩अআকখ字言語한글글자امتصدقخحروفыюяїєÜĞŞđơư";
  const N = RAIN_DENSITY;
  const P = [];
  for (let i = 0; i < N; i++) {
    P.push({ c: CH[Math.floor(Math.random() * CH.length)], x: Math.random(), y: Math.random(),
             v: 0.012 + Math.random() * 0.05, s: 9 + Math.random() * 13 });
  }
  let act = new Set(), lastAct = 0, prev = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(64, now - prev); prev = now;
    if (now - lastAct > 170) {
      act = new Set();
      const k = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < k; i++) act.add(Math.floor(Math.random() * N));
      lastAct = now;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let i = 0; i < N; i++) {
      const p = P[i];
      if (!reduceMotion) {
        p.y += p.v * dt / 1000;
        if (p.y > 1.04) { p.y = -0.04; p.x = Math.random(); p.c = CH[Math.floor(Math.random() * CH.length)]; }
      }
      const depth = (p.s - 9) / 13;
      if (act.has(i)) {
        ctx.font = "600 " + (p.s + 4).toFixed(0) + "px Switzer, sans-serif";
        ctx.shadowColor = dark ? "rgba(227,125,247,.9)" : "rgba(155,106,246,.8)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = dark ? "#E9A7FA" : "#8A5CF0";
      } else {
        ctx.font = "400 " + p.s.toFixed(0) + "px Switzer, sans-serif";
        ctx.shadowBlur = 0;
        ctx.fillStyle = dark
          ? "rgba(150,152,200," + (0.08 + depth * 0.16).toFixed(3) + ")"
          : "rgba(60,63,120," + (0.06 + depth * 0.12).toFixed(3) + ")";
      }
      ctx.fillText(p.c, p.x * W, p.y * H);
    }
    ctx.shadowBlur = 0;
  };
  requestAnimationFrame(frame);
}

/* ---------------------------------------------------------- the scroll gate */
function bindDive() {
  const dive = $("dive"), mask = $("maskLayer"), gfull = $("gfull"),
        dfull = $("diveFull"), hint = $("diveHint"), gfield = $("gfield");
  if (!dive || !mask) return;
  let tick = 0;
  const update = () => {
    tick = 0;
    const total = dive.offsetHeight - innerHeight;
    const top = dive.getBoundingClientRect().top;
    const p = Math.max(0, Math.min(1, -top / total));
    const init = Math.min(innerWidth * 0.4, 400);
    const w = init + Math.pow(p, 2.3) * 5200;
    mask.style.webkitMaskSize = w + "px";
    mask.style.maskSize = w + "px";
    const f = Math.max(0, Math.min(1, (p - 0.74) / 0.2));
    if (gfull) gfull.style.opacity = f;
    if (dfull) dfull.style.opacity = f;
    if (hint) hint.style.opacity = String(Math.max(0, 1 - p * 4));
    if (gfield) gfield.style.transform = "scale(" + (1 + p * 0.18).toFixed(4) + ")";
  };
  const onScroll = () => { if (!tick) tick = requestAnimationFrame(update); };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  update();
}

/* ---------------------------------------------------------------- the globe */
async function startGlobe() {
  try {
    const cv = $("globe");
    if (!cv) return;
    const mod = await import("./land-data.js");
    const bin = atob(mod.LAND_B64);
    const land = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) land[i] = bin.charCodeAt(i);
    const MW = 288, MH = 144;
    const isLand = (lon, lat) => {
      const gx = Math.floor((lon + 180) / 360 * MW), gy = Math.floor((90 - lat) / 180 * MH);
      if (gx < 0 || gx >= MW || gy < 0 || gy >= MH) return false;
      const b = gy * MW + gx;
      return (land[b >> 3] >> (b & 7)) & 1;
    };

    /* The land is spelled out in the sentence the contract exists to enforce. */
    const PHRASE = "afaithfultranslationcarriesthesamecommitments";
    const nodes = [];
    let k = 0, run = 0, sea3 = 0;
    for (let lat = -86; lat <= 86; lat += 3.05) {
      const rl = Math.cos(lat * Math.PI / 180);
      const n = Math.max(1, Math.round(98 * rl));
      for (let i = 0; i < n; i++) {
        const lon = -180 + 360 * i / n;
        const l = isLand(lon, lat);
        if (!l && (sea3++ % 2)) continue;
        let letter = 0;
        if (l && (run++ % 2 === 0)) letter = PHRASE.charAt(k++ % PHRASE.length);
        nodes.push({ lat: lat * Math.PI / 180, lon: lon * Math.PI / 180, land: l, c: letter });
      }
    }

    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      const r = cv.getBoundingClientRect();
      if (!r.width) return;
      dpr = Math.min(1.5, devicePixelRatio || 1);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      W = r.width; H = r.height;
    };
    resize();
    addEventListener("resize", resize);

    let spin = 2.4, vel = GLOBE_SPEED, tilt = -0.42, vtilt = 0;
    let hover = false, drag = null, look = null, hoverM = null;
    const local = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener("pointerenter", () => { hover = true; });
    cv.addEventListener("pointerleave", () => { hover = false; look = null; });
    cv.addEventListener("pointerdown", (e) => {
      drag = local(e); drag.moved = false;
      cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing";
    });
    cv.addEventListener("pointermove", (e) => {
      const p = local(e); look = p;
      if (!drag) { cv.style.cursor = hoverM ? "pointer" : "grab"; return; }
      const u = Math.min(W, H) || 1;
      vel = (p.x - drag.x) / u * 9;
      vtilt = -(p.y - drag.y) / u * 6;
      tilt = Math.max(-1.15, Math.min(1.15, tilt + vtilt * 0.016));
      if (Math.abs(p.x - drag.x) + Math.abs(p.y - drag.y) > 3) drag.moved = true;
      drag.x = p.x; drag.y = p.y;
    });
    /* A drag that never moved is a click, and a click on a marker chooses that
       community by pressing its chip. The globe never sets the language itself. */
    cv.addEventListener("pointerup", () => {
      if (drag && !drag.moved && hoverM) pickCommunity(hoverM.label);
      drag = null; cv.style.cursor = "grab";
    });
    cv.addEventListener("pointercancel", () => { drag = null; });

    const land8 = [], sea = [], soil = [];
    let prev = performance.now();
    const frame = (now) => {
      requestAnimationFrame(frame);
      if (!W) { resize(); prev = now; return; }
      const vis = cv.getBoundingClientRect();
      if (vis.bottom < -60 || vis.top > innerHeight + 60) { prev = now; return; }
      const dt = Math.min(64, now - prev); prev = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const INKB = dark ? "226,228,238" : "36,38,72";
      const ink = (a) => "rgba(" + INKB + "," + Math.max(0, Math.min(0.9, a)).toFixed(3) + ")";
      if (!drag) {
        const idle = reduceMotion ? 0 : (hover ? GLOBE_SPEED * 0.28 : GLOBE_SPEED);
        vel += (idle - vel) * Math.min(1, dt / 900);
        vtilt *= Math.pow(0.9, dt / 16);
        tilt += vtilt * dt / 1000;
        tilt += (-0.42 - tilt) * Math.min(1, dt / 4000);
      }
      spin += vel * dt / 1000;
      const u = Math.min(W, H), cx = W / 2, cy = H / 2 + u * 0.02, R = u * 0.36, fs = u * 0.026;
      const cs = Math.cos(spin), sn = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt);
      ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, Math.PI * 2);
      ctx.strokeStyle = dark ? "rgba(155,106,246,.18)" : "rgba(17,15,255,.13)";
      ctx.lineWidth = 1; ctx.stroke();
      sea.length = 0; soil.length = 0;
      const lx = (look && !drag) ? look.x : -1e9, ly = (look && !drag) ? look.y : -1e9;
      const lr = u * 0.2, lr2 = lr * lr;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const nd of nodes) {
        const cl = Math.cos(nd.lat);
        const x0 = cl * Math.cos(nd.lon), y0 = Math.sin(nd.lat), z0 = cl * Math.sin(nd.lon);
        const x1 = x0 * cs - z0 * sn, z1 = x0 * sn + z0 * cs;
        const y2 = y0 * ct - z1 * st, z2 = y0 * st + z1 * ct;
        if (z2 <= 0.02) continue;
        const px = cx + x1 * R, py = cy - y2 * R;
        const dx = px - lx, dy = py - ly;
        const glow = (dx * dx + dy * dy < lr2) ? (1 - Math.sqrt(dx * dx + dy * dy) / lr) : 0;
        if (!nd.land) { sea.push(px, py, Math.min(0.999, z2 + glow * 0.55)); continue; }
        if (!nd.c) { soil.push(px, py, Math.min(0.999, z2 + glow * 0.55)); continue; }
        const tx0 = -Math.sin(nd.lon), tz0 = Math.cos(nd.lon);
        const tx1 = tx0 * cs - tz0 * sn, tz1 = tx0 * sn + tz0 * cs;
        const ang = Math.round(Math.atan2(tz1 * st, tx1) / (Math.PI * 2 / 64)) * (Math.PI * 2 / 64);
        const b = Math.min(7, Math.max(0, ((Math.min(0.999, z2 + glow * 0.6)) * 7.99) | 0));
        (land8[b] || (land8[b] = [])).push(px, py, ang, nd.c);
      }
      const dmin = Math.max(0.7, u * 0.0029);
      const dots = (list, b0, gain, grow) => {
        for (let lvl = 0; lvl < 6; lvl++) {
          const z = (lvl + 0.5) / 6, dsz = dmin * grow * (0.55 + 0.75 * z);
          ctx.fillStyle = ink(b0 + gain * z);
          ctx.beginPath();
          for (let q = 0; q < list.length; q += 3) {
            const lv = list[q + 2] >= 1 ? 5 : (list[q + 2] * 6) | 0;
            if (lv !== lvl) continue;
            ctx.rect(list[q] - dsz / 2, list[q + 1] - dsz / 2, dsz, dsz);
          }
          ctx.fill();
        }
      };
      dots(sea, 0.10, 0.20, 1.0);
      dots(soil, 0.32, 0.42, 1.7);
      for (let bi = 0; bi < 8; bi++) {
        const arr = land8[bi];
        if (!arr || !arr.length) continue;
        const zb = (bi + 0.5) / 8;
        ctx.font = "bold " + (fs * (0.42 + 0.58 * zb)).toFixed(2) + "px Switzer, sans-serif";
        ctx.fillStyle = ink(0.26 + 0.7 * Math.pow(zb, 0.6));
        for (let t = 0; t < arr.length; t += 4) {
          ctx.save();
          ctx.translate(arr[t], arr[t + 1]);
          ctx.rotate(arr[t + 2]);
          ctx.fillText(arr[t + 3], 0, 0);
          ctx.restore();
        }
        arr.length = 0;
      }
      let hm = null;
      for (const m of MARKERS) {
        const cl = Math.cos(m.lat);
        const x0 = cl * Math.cos(m.lon), y0 = Math.sin(m.lat), z0 = cl * Math.sin(m.lon);
        const x1 = x0 * cs - z0 * sn, z1 = x0 * sn + z0 * cs;
        const y2 = y0 * ct - z1 * st, z2 = y0 * st + z1 * ct;
        if (z2 <= 0.03) continue;
        const px = cx + x1 * R, py = cy - y2 * R;
        const sel = globeSel === m.label;
        const hovThis = !!look && Math.hypot(look.x - px, look.y - py) < u * 0.055;
        if (hovThis) hm = m;
        /* Seventy-seven labels at one weight is a wall of text, so the ones
           without a channel are drawn faintly until they face you, and named
           only when they are near the front, selected, or under the pointer. */
        const minor = !m.discord && !sel && !hovThis;
        if (minor && z2 < 0.55) continue;
        ctx.beginPath(); ctx.arc(px, py, sel ? u * 0.011 : (m.discord ? u * 0.0075 : u * 0.005), 0, Math.PI * 2);
        const da = (0.35 + 0.65 * z2).toFixed(3);
        ctx.fillStyle = sel ? "#E37DF7" : (dark ? "rgba(227,125,247," + da + ")" : "rgba(17,15,255," + da + ")");
        ctx.fill();
        if (sel) {
          ctx.beginPath(); ctx.arc(px, py, u * 0.021 + Math.sin(now / 280) * u * 0.004, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(227,125,247,.7)"; ctx.lineWidth = 1.4; ctx.stroke();
        }
        const f = Math.max(10, Math.min(15, fs * 1.4)) * (sel || hovThis ? 1.12 : 1)
                  * (m.discord || sel || hovThis ? 1 : 0.82) * (0.84 + 0.16 * z2);
        ctx.font = "600 " + f.toFixed(1) + "px Switzer, 'Segoe UI', sans-serif";
        const right = px > cx;
        const tx = px + (right ? -u * 0.02 : u * 0.02);
        ctx.textAlign = right ? "right" : "left";
        ctx.lineJoin = "round"; ctx.lineWidth = 3.5;
        ctx.strokeStyle = dark ? "rgba(7,7,15,.85)" : "rgba(250,250,255,.92)";
        ctx.strokeText(m.name, tx, py);
        if (sel || hovThis) {
          const wpx = ctx.measureText(m.name).width;
          const gx0 = right ? tx - wpx : tx;
          const g = ctx.createLinearGradient(gx0, 0, gx0 + wpx, 0);
          g.addColorStop(0, "#E37DF7"); g.addColorStop(0.55, "#9B6AF6");
          g.addColorStop(1, dark ? "#7D7BFF" : "#110FFF");
          ctx.fillStyle = g;
        } else {
          ctx.fillStyle = ink((m.discord ? 0.42 : 0.24) + 0.58 * z2);
        }
        ctx.fillText(m.name, tx, py);
        ctx.textAlign = "center";
      }
      hoverM = hm;
    };
    requestAnimationFrame(frame);
  } catch (e) {
    /* A globe that will not draw is a missing decoration, never a broken page. */
    console.warn("globe failed", e);
  }
}

/* -------------------------------------------------------------------- start */
let saved = null;
try { saved = localStorage.getItem("faithful_theme"); } catch (e) {}
applyTheme(saved ? saved === "dark" : true, false);
$("themeToggle")?.addEventListener("click", toggleTheme);
startRain();
startGlobe();
bindDive();
watchChips();
