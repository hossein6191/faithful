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
import { startGlobe } from "./faithful-globe.js";

const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const RAIN_DENSITY = 130;
const GLOBE_SPEED = 0.14;


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
    const label = pressed
      ? (LANGUAGES.find((l) => pressed.textContent.includes(l.label)) || {}).label || null
      : null;
    globeSel = label;
    if (window.__faithfulGlobe) window.__faithfulGlobe.select(label);
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

/* -------------------------------------------------------------------- start */
let saved = null;
try { saved = localStorage.getItem("faithful_theme"); } catch (e) {}
applyTheme(saved ? saved === "dark" : true, false);
$("themeToggle")?.addEventListener("click", toggleTheme);
startRain();
bindDive();

/* The globe is handed the app's chooser and hands back a handle, which the app
   uses to fly to whatever is being searched. Neither one owns the selection. */
startGlobe("globe", (label) => pickCommunity(label)).then(async (globe) => {
  if (!globe) return;
  window.__faithfulGlobe = globe;
  try {
    const app = await import("./faithful-app.js");
    if (app.attachGlobe) app.attachGlobe(globe);
  } catch (e) {}
});

watchChips();
