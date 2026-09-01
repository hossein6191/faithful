/* The globe: real coastlines, drag to turn, and it flies to whatever you search.
 *
 * The one before this drew its own continents from a bitmask and could not be
 * turned by hand in any useful way. This uses d3-geo's orthographic projection
 * over Natural Earth's land polygons, so the coastlines are the actual
 * coastlines, and the rotation is a value this module owns rather than a spin
 * that only ever went one way.
 *
 * Three things it does that the search box depends on:
 *
 *   flyTo(label)   turns the globe to face a language, quickly, and holds it
 *   lock()         keeps it there while a search is still on screen
 *   release()      lets it drift again when the box is emptied
 *
 * It never decides which language is chosen. Clicking a marker calls the app's
 * own chooser, the same one the chips and the search list call.
 */
import { SUPPORTED } from "./languages.js";

/* Natural Earth's 110m land polygons, public domain, kept in the repo rather
   than fetched from somebody else's raw.githubusercontent URL at page load.
   Coordinates are rounded to two decimals: about a kilometre, which is far
   finer than a 400px sphere can draw, and a third of the bytes. */
const LAND_URL = "./data/ne_110m_land.json";

let d3geo = null;
let land = null;
let dots = [];

const state = {
  rot: [-20, -12],      // [lambda, phi], degrees
  target: null,          // where flyTo is heading
  locked: false,
  dragging: false,
  selected: null,
  hover: null,
  pointer: null,
};

const dark = () => document.documentElement.getAttribute("data-theme") !== "light";

/* Points inside a polygon, so land reads as a filled halftone rather than an
   outline. Generated once from the same geometry the outlines come from. */
function inRing(p, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inFeature(p, f) {
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  for (const poly of polys) {
    if (!inRing(p, poly[0])) continue;
    let hole = false;
    for (let i = 1; i < poly.length; i++) if (inRing(p, poly[i])) { hole = true; break; }
    if (!hole) return true;
  }
  return false;
}
function halftone(features, step) {
  const out = [];
  for (const f of features) {
    const [[minLng, minLat], [maxLng, maxLat]] = d3geo.geoBounds(f);
    for (let lng = minLng; lng <= maxLng; lng += step) {
      for (let lat = minLat; lat <= maxLat; lat += step) {
        if (inFeature([lng, lat], f)) out.push([lng, lat]);
      }
    }
  }
  return out;
}

export async function startGlobe(canvasId, onPick) {
  const cv = document.getElementById(canvasId);
  if (!cv) return null;

  try {
    d3geo = await import("https://esm.sh/d3-geo@3");
  } catch (e) {
    console.warn("globe: d3-geo did not load", e);
    return null;
  }

  const ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, R = 0;
  const projection = d3geo.geoOrthographic().clipAngle(90);
  const path = d3geo.geoPath(projection, ctx);
  const graticule = d3geo.geoGraticule10 ? d3geo.geoGraticule10() : d3geo.geoGraticule()();

  const resize = () => {
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    W = r.width; H = r.height;
    R = Math.min(W, H) / 2 - 6;
    projection.scale(R).translate([W / 2, H / 2]);
  };
  resize();
  addEventListener("resize", resize);

  /* Load the coastlines, then the halftone. The globe draws before either
     arrives, so a slow network is an emptier globe rather than no globe. */
  fetch(LAND_URL)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
    .then((json) => {
      land = json;
      dots = halftone(json.features, 1.7);
    })
    .catch((e) => console.warn("globe: land data did not load", e));

  /* ------------------------------------------------------------ interaction */
  const local = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  let drag = null;

  cv.addEventListener("pointerdown", (e) => {
    drag = { ...local(e), rot: [...state.rot], moved: false };
    state.dragging = true;
    state.target = null;
    cv.setPointerCapture(e.pointerId);
    cv.style.cursor = "grabbing";
  });
  cv.addEventListener("pointermove", (e) => {
    const p = local(e);
    state.pointer = p;
    if (!drag) { cv.style.cursor = state.hover ? "pointer" : "grab"; return; }
    /* Degrees per pixel scaled to the radius, so the point under the cursor
       stays roughly under the cursor however big the globe is drawn. */
    const k = 90 / R;
    state.rot[0] = drag.rot[0] + (p.x - drag.x) * k;
    state.rot[1] = Math.max(-89, Math.min(89, drag.rot[1] - (p.y - drag.y) * k));
    if (Math.abs(p.x - drag.x) + Math.abs(p.y - drag.y) > 3) drag.moved = true;
  });
  const endDrag = () => {
    if (drag && !drag.moved && state.hover && onPick) onPick(state.hover.label);
    drag = null;
    state.dragging = false;
    cv.style.cursor = "grab";
  };
  cv.addEventListener("pointerup", endDrag);
  cv.addEventListener("pointercancel", () => { drag = null; state.dragging = false; });
  cv.addEventListener("pointerleave", () => { state.pointer = null; state.hover = null; });
  cv.style.cursor = "grab";
  cv.style.touchAction = "none";

  /* ------------------------------------------------------------------ frame */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let last = performance.now();

  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!W) { resize(); return; }
    const box = cv.getBoundingClientRect();
    if (box.bottom < -80 || box.top > innerHeight + 80) { last = now; return; }
    const dt = Math.min(64, now - last); last = now;

    if (state.target && !state.dragging) {
      /* Fast, and it stops. A search should put the country in front of you
         while you are still looking at the box you typed it into. */
      const ease = 1 - Math.pow(0.001, dt / 1000);
      let d = ((state.target[0] - state.rot[0] + 540) % 360) - 180;
      state.rot[0] += d * ease;
      state.rot[1] += (state.target[1] - state.rot[1]) * ease;
      if (Math.abs(d) < 0.4 && Math.abs(state.target[1] - state.rot[1]) < 0.4) {
        state.rot = [...state.target];
        if (!state.locked) state.target = null;
      }
    } else if (!state.dragging && !state.locked && !state.target && !reduce) {
      state.rot[0] += dt * 0.006;
    }

    projection.rotate(state.rot);
    const isDark = dark();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* the ocean */
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "rgba(18,32,66,.55)" : "rgba(222,234,252,.75)";
    ctx.fill();
    ctx.strokeStyle = isDark ? "rgba(155,106,246,.34)" : "rgba(17,15,255,.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    /* the grid */
    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = isDark ? "rgba(160,175,220,.13)" : "rgba(40,60,120,.13)";
    ctx.lineWidth = 0.7;
    ctx.stroke();

    if (land) {
      ctx.beginPath();
      for (const f of land.features) path(f);
      ctx.fillStyle = isDark ? "rgba(74,182,126,.20)" : "rgba(38,140,94,.16)";
      ctx.fill();
      ctx.strokeStyle = isDark ? "rgba(112,214,158,.70)" : "rgba(28,116,76,.65)";
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    if (dots.length) {
      ctx.fillStyle = isDark ? "rgba(126,222,170,.42)" : "rgba(30,120,80,.34)";
      ctx.beginPath();
      for (const [lng, lat] of dots) {
        const p = projection([lng, lat]);
        if (!p) continue;
        ctx.moveTo(p[0], p[1]);
        ctx.arc(p[0], p[1], 0.85, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    /* Only the supported languages are drawn. Seventy-seven markers is a wall
       of text on a 400px sphere and work spent on labels nobody can read; these
       sixteen are the ones with passages, and the ones the page can promise. */
    let hover = null;
    ctx.textBaseline = "middle";
    for (const l of SUPPORTED) {
      const p = projection([l.lon, l.lat]);
      if (!p) continue;
      const sel = state.selected === l.label;
      const near = state.pointer && Math.hypot(state.pointer.x - p[0], state.pointer.y - p[1]) < 13;
      if (near) hover = l;
      ctx.beginPath();
      ctx.arc(p[0], p[1], sel ? 5 : l.discord ? 3.4 : 2.2, 0, Math.PI * 2);
      ctx.fillStyle = sel ? "#E37DF7"
        : (isDark ? "rgba(227,125,247,.92)" : "rgba(17,15,255,.85)");
      ctx.fill();
      if (sel) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 9 + Math.sin(now / 260) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(227,125,247,.75)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      const right = p[0] > W / 2;
      ctx.textAlign = right ? "right" : "left";
      ctx.font = (sel || near ? "700 " : "600 ") + (sel || near ? 13 : 12) + "px Switzer, sans-serif";
      const tx = p[0] + (right ? -9 : 9);
      ctx.lineJoin = "round";
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = isDark ? "rgba(7,7,15,.9)" : "rgba(250,250,255,.95)";
      ctx.strokeText(l.endonym, tx, p[1]);
      ctx.fillStyle = sel ? "#E37DF7"
        : (isDark ? "rgba(240,242,252,.95)" : "rgba(20,22,50,.95)");
      ctx.fillText(l.endonym, tx, p[1]);
    }
    state.hover = hover;
  };
  requestAnimationFrame(frame);

  return {
    /* Facing a point means rotating the globe to its negative. */
    flyTo(label) {
      const l = SUPPORTED.find((x) => x.label === label);
      if (!l) return false;
      state.target = [-l.lon, -l.lat];
      return true;
    },
    select(label) { state.selected = label || null; },
    lock() { state.locked = true; },
    release() { state.locked = false; state.target = null; },
    has(label) { return SUPPORTED.some((x) => x.label === label); },
  };
}
