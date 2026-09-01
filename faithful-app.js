import { createClient } from "https://esm.sh/genlayer-js@1.1.8";
import { studionet } from "https://esm.sh/genlayer-js@1.1.8/chains";
import { PASSAGES, SCRIPTS, scriptOf } from "./texts.js";
import { LANGUAGES, DISCORD, isSupported, search } from "./languages.js";

const byLabel = (l) => LANGUAGES.find((x) => x.label === l) || null;

const $ = (id) => document.getElementById(id);
const RPC = "https://studio.genlayer.com/api";
const EXPLORER = "https://explorer-studio.genlayer.com";
const CHAIN = { chainId: "0xf22f", chainName: "GenLayer Studio",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: [RPC], blockExplorerUrls: [EXPLORER + "/"] };

const rpc = async (method, params) => {
  const r = await fetch(RPC, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  return (await r.json()).result;
};
const log = (line, cls) => {
  const el = $("log");
  const colour = cls === "ok" ? "#22c55e" : cls === "bad" ? "#ef4444" : cls === "warn" ? "#f59e0b" : "";
  el.innerHTML += "\n" + (colour ? `<span style="color:${colour}">${line}</span>` : line);
  el.scrollTop = el.scrollHeight;
};
const link = (path, text) => `<a href="${EXPLORER}${path}" target="_blank" rel="noopener">${text} ↗</a>`;
const done = (id, yes) => $(id).setAttribute("data-done", yes ? "1" : "0");

/* Whatever state the page is in, one line says what to do now. Without it the
   later steps sit dim and correct and look like a dead end. */
function sayNext() {
  const el = $("next");
  if (!account) { el.textContent = "Start by connecting your wallet above."; return; }
  if (!reg) { el.textContent = "Now press “Deploy a register”, or paste one you already have and press Load."; return; }
  el.textContent = "";
}

/* Flags label a community, never a language on their own, so every chip carries the
   name beside it. Arabic is not one country and Hindi-Urdu is two, so a flag
   alone would be saying something false. */
const COMMUNITIES = [
  ["English", "🇬🇧"], ["Chinese", "🇨🇳"], ["Hindi-Urdu", "🇮🇳"], ["Indonesian", "🇮🇩"],
  ["Latam", "🌎"], ["Nigerian", "🇳🇬"], ["Russian", "🇷🇺"], ["Korean", "🇰🇷"],
  ["Turkish", "🇹🇷"], ["Ukranian", "🇺🇦"], ["Vietnamese", "🇻🇳"], ["Arabic", "🇸🇦"],
  ["Persian", "🇮🇷"], ["German", "🇩🇪"], ["Japanese", "🇯🇵"], ["Bangladeshi", "🇧🇩"],
];

/* The source is always English and is set by the passage, never by the person.
   The run that made this rule: a target of Hindi-Urdu was selected while the
   boxes held English and Persian, and the round came back UNDETERMINED because
   the leader called the Persian "fluent Urdu" and the validators would not.
   A label the reader can set independently of the text will eventually
   disagree with it. Here it cannot. */
/* Guided mode keeps the source pinned to English and hands out a passage, which
   is the arrangement that made a label and a text impossible to separate. Any
   pair opens the source up, and pays for it by making the reader responsible
   for both boxes. Both modes still choose a language rather than type one. */
let mode = "guided";
let source = "English";
let target = null;

/* No repeats until the set is exhausted: a shuffled order per community,
   remembered across reloads. */
const seenKey = (lang) => "faithful_seen_" + lang;
/* Every passage is English, so a language with no set of its own is not a
   reason to hand somebody an empty box. It gets one from the whole collection
   instead, and is told where it came from. Sixteen communities have passages
   about their own history; the other sixty-one get any of the 160. */
const GENERAL = Object.entries(PASSAGES).flatMap(([about, list]) =>
  list.map((text) => ({ text, about })));

function nextPassage(lang) {
  const own = PASSAGES[lang];
  if (!own) {
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(seenKey("_general")) || "[]"); } catch (e) {}
    if (seen.length >= GENERAL.length) seen = [];
    const left = GENERAL.map((_, i) => i).filter((i) => !seen.includes(i));
    const pick = left[Math.floor(Math.random() * left.length)];
    seen.push(pick);
    try { localStorage.setItem(seenKey("_general"), JSON.stringify(seen)); } catch (e) {}
    return { text: GENERAL[pick].text, from: GENERAL[pick].about,
             index: seen.length, of: GENERAL.length, left: GENERAL.length - seen.length };
  }
  const pool = own;
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(seenKey(lang)) || "[]"); } catch (e) {}
  if (seen.length >= pool.length) seen = [];
  const left = pool.map((_, i) => i).filter((i) => !seen.includes(i));
  const pick = left[Math.floor(Math.random() * left.length)];
  seen.push(pick);
  try { localStorage.setItem(seenKey(lang), JSON.stringify(seen)); } catch (e) {}
  return { text: pool[pick], index: pick + 1, of: pool.length, left: pool.length - seen.length };
}

function paintLangs() {
  const host = $("tgt-langs");
  host.innerHTML = "";
  for (const [name, flag] of COMMUNITIES) {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-pressed", String(name === target));
    b.innerHTML = `<span class="flag" aria-hidden="true">${flag}</span>${name}`;
    /* Picking a community is the choice; handing over a passage is what makes
       it usable. Doing both on one click is the whole point of the page. */
    b.onclick = () => chooseLanguage(name);
    host.appendChild(b);
  }
}
function chooseTarget() {
  $("tgt-lang").textContent = target || "not chosen yet";
  $("src-lang").textContent = source;
  done("step2", !!target && !!$("source").value.trim());
  suggestName();
  checkMismatch();
}
/* Typing used to set the language directly, and that is how a target could end
   up naming something the text was not. Now typing only searches: the language
   is set by choosing one, from this list or from the globe, and never by what
   is half-typed in the box. */
function combobox(boxId, listId, onPick) {
  const box = $(boxId), list = $(listId);
  let cursor = -1, shown = [];
  const close = () => { list.hidden = true; box.setAttribute("aria-expanded", "false"); cursor = -1; };
  const open = (query) => {
    shown = search(query).slice(0, 60);
    list.innerHTML = shown.length
      ? shown.map((l, i) => `
          <button type="button" class="opt" role="option" data-i="${i}" aria-selected="false">
            <span class="endo">${l.endonym}</span>
            <span>${l.label}</span>
            ${l.discord ? '<span class="tag">discord</span>'
              : l.source ? '<span class="tag">source</span>'
              : '<span class="tag" style="background:var(--warnbox-bg);color:var(--warnbox-fg)">no passages · not on the globe</span>'}
            <span class="where">${l.country}</span>
          </button>`).join("")
      : `<p class="none">Nothing here matches “${query}”. Seventy-seven languages are listed, by their
         own name and by the countries they are spoken in, so try either — “Farsi”, “Bengali” and
         “Mexico” all find something.</p>`;
    list.hidden = false;
    box.setAttribute("aria-expanded", "true");
    cursor = -1;
  };
  const mark = () => {
    for (const el of list.querySelectorAll(".opt")) el.setAttribute("aria-selected", "false");
    const el = list.querySelector(`.opt[data-i="${cursor}"]`);
    if (el) { el.setAttribute("aria-selected", "true"); el.scrollIntoView({ block: "nearest" }); }
  };
  box.addEventListener("input", () => {
    open(box.value);
    /* Turn the globe to the best match while it is still being typed, so the
       search box and the map are looking at the same place. It holds there as
       long as there is something in the box, and drifts again when it empties. */
    if (globe) {
      const q = box.value.trim();
      if (!q) { globe.release(); }
      else {
        /* The best match may be one of the sixty-one that has no marker. Fly to
           the best match that does, so typing never leaves the globe sitting
           somewhere unrelated with no explanation. */
        const onGlobe = shown.find((l) => globe.has(l.label));
        if (onGlobe) { globe.flyTo(onGlobe.label); globe.lock(); }
      }
    }
  });
  box.addEventListener("focus", () => open(box.value));
  box.addEventListener("keydown", (e) => {
    if (list.hidden && (e.key === "ArrowDown" || e.key === "Enter")) { open(box.value); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); cursor = Math.min(shown.length - 1, cursor + 1); mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); cursor = Math.max(0, cursor - 1); mark(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const p = shown[cursor >= 0 ? cursor : 0];
      if (p) { close(); onPick(p.label); }
    } else if (e.key === "Escape") close();
  });
  list.addEventListener("mousedown", (e) => {
    const opt = e.target.closest(".opt");
    if (!opt) return;
    e.preventDefault();
    const p = shown[Number(opt.dataset.i)];
    if (p) { close(); onPick(p.label); }
  });
  addEventListener("click", (e) => {
    if (!list.hidden && !box.contains(e.target) && !list.contains(e.target)) close();
  });
  return { close, box };
}

/* Handed over by the effects module once the globe has drawn. Everything here
   works without it, because a globe that fails to load is a missing picture
   rather than a broken page. */
let globe = null;
export function attachGlobe(g) {
  globe = g;
  if (target) { globe.select(target); globe.flyTo(target); }
}

const targetCombo = combobox("tgt-other", "lang-list", (label) => chooseLanguage(label));
const sourceCombo = combobox("src-other", "src-list", (label) => chooseSource(label));

/* One way in, whether the choice came from a chip, this list, or the globe. */
export function chooseLanguage(label) {
  target = label;
  /* The name stays in the box after you pick it, rather than the box emptying
     and leaving you unsure what you chose. */
  $("tgt-other").value = label;
  paintLangs();
  chooseTarget();
  if (globe) { globe.select(label); globe.flyTo(label); globe.lock(); }
  saySupport();
  /* A passage only comes with guided mode. In a free pair the source is the
     reader's, and handing them one would overwrite what they pasted. */
  if (mode === "guided") giveOne();
}

function chooseSource(label) {
  source = label;
  $("src-other").value = label;
  if (globe) { globe.flyTo(label); globe.lock(); }
  chooseTarget();
  sayChallenge();
  saySupport();
}



/* Anything on screen from the last certification belongs to the last one. It
   goes the moment a new attempt starts, or the explorer link sits there
   pointing at a transaction that has nothing to do with what is in the boxes. */
function clearLastResult() {
  $("certSt").textContent = "";
  $("resultLink").textContent = "";
  $("result").hidden = true;
  $("result-empty").hidden = false;
}

function giveOne() {
  if (!target) { $("giveSt").textContent = "pick a language first"; return; }
  clearLastResult();
  mtOk = false;
  $("mtAsk").setAttribute("data-on", "0");
  const got = nextPassage(target);
  $("source").setAttribute("readonly", "");
  $("source").value = got.text;
  $("target").value = "";
  $("giveSt").innerHTML = got.from
    ? `passage ${got.index} of ${got.of} · <span style="color:var(--fg-3)">${target} has no passages of
       its own yet, so this one is from the ${got.from} set</span>`
    : `passage ${got.index} of ${got.of} · ${got.left} you have not seen yet`;
  counts(); chooseTarget();
  $("target").focus();
}
$("give").onclick = giveOne;

const counts = () => {
  for (const [box, out] of [["source", "src-count"], ["target", "tgt-count"]]) {
    const n = $(box).value.trim().length;
    $(out).textContent = n < 20 && n > 0 ? `· ${n} / 4000 · at least 20 to judge` : `· ${n} / 4000`;
    $(out).style.color = n > 4000 ? "#ef4444" : (n > 0 && n < 20 ? "var(--warnbox-fg)" : "");
  }
  const ready = !!reg && !!account && !!target &&
    $("source").value.trim().length >= 20 && $("target").value.trim().length >= 20 &&
    $("cert-name").value.trim().length > 0;
  $("certify").disabled = !ready;
  done("step3", $("target").value.trim().length >= 20);
};
$("source").addEventListener("input", () => { counts(); checkMismatch(); });
$("target").addEventListener("input", () => { counts(); checkMismatch(); });
$("cert-name").addEventListener("input", counts);

function suggestName() {
  if ($("cert-name").value.trim()) return;
  if (!target) return;
  const slug = String(target).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  $("cert-name").value = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  counts();
}

/* A warning, never a refusal. A language can be written in more than one script,
   and this only catches the mismatches a script check can catch, which is why
   the source is not something the reader sets at all. */
function checkMismatch() {
  const box = $("mismatch");
  const text = $("target").value.trim();
  if (!target || text.length < 20) { box.setAttribute("data-on", "0"); return; }
  const expected = SCRIPTS[target];
  if (!expected) { box.setAttribute("data-on", "0"); return; }
  const got = scriptOf(text);
  if (!got || expected.includes(got)) {
    box.setAttribute("data-on", "1");
    box.style.background = "var(--okbox-bg)";
    box.style.boxShadow = "inset 0 0 0 1px #22c55e55";
    box.style.color = "var(--fg-2)";
    box.innerHTML = `Your translation is written in <b>${got || "an unrecognised script"}</b>, which is what ${target} is written in. Good.`;
    return;
  }
  box.setAttribute("data-on", "1");
  box.style.background = "var(--warnbox-bg)";
  box.style.boxShadow = "inset 0 0 0 1px #f59e0b88";
  box.style.color = "var(--warnbox-fg)";
  box.innerHTML = `<b>This does not look like ${target}.</b> You selected ${target}, which is written in
    ${expected.join(" or ")}, but the text you pasted is mostly <b>${got}</b>.
    Validators asked to check a ${target} translation of a text that is not in ${target} will not agree
    with each other, the round comes back <b>undetermined</b>, and nothing is stored. Fix the language
    or the text before signing.`;
}

/* ---------------------------------------------------------------- wallet */
const provs = [];
addEventListener("eip6963:announceProvider", (e) => provs.push(e.detail));
dispatchEvent(new Event("eip6963:requestProvider"));
let provider = null, account = null, reg = null;

async function ensureNet(p) {
  try { await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN.chainId }] }); }
  catch (e) {
    if (e && (e.code === 4902 || String(e.message || "").includes("Unrecognized")))
      await p.request({ method: "wallet_addEthereumChain", params: [CHAIN] });
    else throw e;
  }
}
async function client() {
  await ensureNet(provider);
  const a = await provider.request({ method: "eth_accounts" });
  account = a[0];
  return createClient({ chain: studionet, account });
}
const reader = () => createClient({ chain: studionet });

$("connect").onclick = async () => {
  provider = (provs.find((p) => /rabby/i.test(p.info.name)) || provs[0])?.provider || window.ethereum;
  if (!provider) { log("no wallet found in this browser", "bad"); return; }
  await ensureNet(provider);
  const a = await provider.request({ method: "eth_requestAccounts" });
  account = a[0];
  $("who").textContent = account;
  $("faucet").disabled = false; $("deploy").disabled = false;
  log("connected " + account, "ok");
  counts(); sayNext();
  const balance = BigInt(await rpc("eth_getBalance", [account, "latest"]) || "0x0");
  if (balance < BigInt(1e17))
    log("  balance is low. Press Get test GEN, or the wallet will refuse to sign without saying why.", "warn");
};
$("faucet").onclick = async () => {
  await rpc("sim_fundAccount", { account_address: account, amount: 300e18 });
  log("funded 300 test GEN", "ok");
};

/* A transaction that splits the vote finalises exactly like one that applied.
   The status never says which; only the tally does. */
async function wait(tx, label) {
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const t = await rpc("eth_getTransactionByHash", [tx]);
    if (t?.status === "CANCELED") { log("  ✗ " + label + " was cancelled by the network. Try again.", "bad"); return null; }
    if (t?.status === "FINALIZED") {
      const lr = t.consensus_data?.leader_receipt, one = Array.isArray(lr) ? lr[0] : lr;
      let msg = ""; try { msg = new TextDecoder().decode(Uint8Array.from(atob(one.result), (c) => c.charCodeAt(0))); } catch (e) {}
      let a = 0, d = 0, idle = 0;
      for (const k in (t.consensus_data?.votes || {})) {
        const v = t.consensus_data.votes[k];
        if (v === "agree") a++; else if (v === "disagree") d++; else idle++;
      }
      log(`  votes: ${a} agree, ${d} disagree, ${idle} idle`);
      if (a * 2 <= a + d + idle) {
        log("  ⚖ the validators did not agree, so nothing was stored.", "warn");
        return { split: true };
      }
      let j = null; const b = msg.indexOf("{");
      if (b !== -1) { try { j = JSON.parse(msg.slice(b)); } catch (e) {} }
      return { split: false, msg: msg.replace(/[^\x20-\x7e]/g, " ").trim(), j };
    }
    if (i % 3 === 0 && i) log("  … " + label + " (" + i * 4 + "s)");
  }
  log("  ✗ " + label + " timed out. It may still land; reload and check the ledger.", "bad");
  return null;
}

/* ------------------------------------------------------------- the register */
async function useRegister(address) {
  let rules;
  try { rules = JSON.parse(String(await reader().readContract({ address, functionName: "rules", args: [] }))); }
  catch (e) { log("  ✗ that address did not answer rules(), so it is not a Faithful register", "bad"); return false; }
  reg = address;
  localStorage.setItem("faithful_register", address);
  $("addr").value = address;
  $("rules").textContent = JSON.stringify(rules, null, 2);
  $("regLink").innerHTML = "This register on the explorer: " + link("/address/" + address, address);
  document.body.setAttribute("data-ready", "1");
  done("step1", true);
  log("  ✓ register " + address, "ok");
  counts(); sayNext();
  await renderLedger();
  return true;
}

$("load").onclick = async () => {
  const a = $("addr").value.trim();
  if (a) { log("loading " + a + " …"); await useRegister(a); }
};

$("deploy").onclick = async () => {
  $("deploy").disabled = true;
  try {
    log("▶ deploying a register … confirm in wallet");
    /* The contract source is served as a static file beside this page, so what
       gets deployed is the file in the repository rather than a copy of it
       pasted somewhere. If a host will not serve it, say which file is missing
       instead of failing later with something that reads like a chain error. */
    const got = await fetch("./contracts/faithful.py?t=" + Date.now());
    if (!got.ok) throw new Error("could not read contracts/faithful.py from this host (" + got.status + ")");
    const src = await got.text();
    if (!src.startsWith("#")) throw new Error("contracts/faithful.py came back as something other than the contract");
    const c = await client();
    const h = await c.deployContract({ code: src, args: [] });
    log("  tx " + h + " · " + link("/tx/" + h, "explorer"));
    const r = await c.waitForTransactionReceipt({ hash: h, status: "ACCEPTED", retries: 60, interval: 4000 }).catch(() => null);
    const A = r?.data?.contract_address;
    if (!A) throw new Error("the deploy produced no address");
    log("  ✓ deployed at " + A, "ok");
    await useRegister(A);
  } catch (e) { log("  ✗ " + (e.message || e), "bad"); }
  $("deploy").disabled = false;
};

/* ------------------------------------------------------------------ verdict */
/* Green at the top, red at the bottom, and everything between goes through
   amber, so a score reads as a position on a scale rather than as a label. */
function scoreColour(v) {
  const n = Math.max(0, Math.min(100, Number(v) || 0));
  const stops = [[0, 239, 68, 68], [55, 245, 158, 11], [85, 163, 197, 63], [100, 34, 197, 94]];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ar, ag, ab] = stops[i], [b, br, bg, bb] = stops[i + 1];
    if (n <= b) {
      const t = (n - a) / (b - a);
      return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
    }
  }
  return "rgb(34,197,94)";
}

const BANNERS = {
  certified: ["#22c55e", "Certified",
    "Every commitment survived, nothing is missing, and it reads like the language. Nothing to fix."],
  certified_with_reservations: ["#f59e0b", "Certified, with reservations",
    "Faithful and complete, so it is safe to publish. It reads like a machine rather than a person, which is worth improving but was never a reason to refuse it."],
  rejected: ["#ef4444", "Rejected",
    "Something the source says did not survive the translation. The defect below names what."],
};

export function paintResult(r) {
  $("result-empty").hidden = true;
  $("result").hidden = false;
  const [colour, title, blurb] = BANNERS[r.verdict] || ["#94a3b8", r.verdict, ""];
  const banner = $("banner");
  banner.style.background = colour + "1c";
  banner.style.boxShadow = "inset 0 0 0 1px " + colour + "66";
  banner.className = "cheer";
  banner.innerHTML =
    `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
       <span class="pill" style="background:${colour}26;color:${colour}">${title}</span>
       <span class="mono" style="color:var(--fg-3);font-size:13px">${r.name || ""}</span>
     </div>
     <p class="copy" style="margin:10px 0 0;color:var(--fg-2);font-size:15px">${blurb}</p>`;
  void banner.offsetWidth;

  const floors = { fidelity: 85, coverage: 85, fluency: 60 };
  const blocks = { fidelity: "refuses below 85", coverage: "refuses below 85", fluency: "never refuses" };
  $("scores").innerHTML = ["fidelity", "coverage", "fluency"].map((k) => {
    const v = Number(r[k] ?? 0);
    const c = scoreColour(v);
    return `<div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:8px">
        <span style="font-weight:600;text-transform:capitalize">${k}</span>
        <span style="color:var(--fg-3);font-size:13px;margin-inline-start:auto">${blocks[k]}</span>
        <span class="mono" style="color:${c};font-weight:600;font-size:17px">${v}</span>
      </div>
      <div class="bar"><i data-w="${Math.max(0, Math.min(100, v))}" style="background:${c}"></i></div>
    </div>`;
  }).join("");
  requestAnimationFrame(() => {
    for (const i of $("scores").querySelectorAll(".bar>i")) i.style.width = i.dataset.w + "%";
  });

  const defects = r.defects || [];
  $("defects").innerHTML = defects.length
    ? `<p class="eyebrow" style="color:#ef4444">What did not survive</p>
       <ul style="margin:10px 0 0;padding-inline-start:20px;color:var(--fg-2)">
         ${defects.map((d) => `<li><code>${d}</code></li>`).join("")}</ul>`
    : `<p class="eyebrow" style="color:#22c55e">No defect named</p>`;
  $("notes").textContent = r.notes || "";
}

/* ------------------------------------------------------------------ certify */
$("certify").onclick = async () => {
  const name = $("cert-name").value.trim();
  const src = $("source").value.trim();
  const tgt = $("target").value.trim();
  const targetLang = target;

  if (source === targetLang) { log("the source and the target are the same language", "warn"); return; }
  for (const [label, text] of [["source", src], ["translation", tgt]]) {
    if (text.length < 20) { log(`the ${label} is too short to judge`, "warn"); return; }
    if (text.length > 4000) { log(`the ${label} is longer than 4000 characters. Split it into parts.`, "warn"); return; }
  }

  clearLastResult();
  $("certify").disabled = true;
  $("certSt").textContent = "waiting on consensus…";
  try {
    log(`▶ certifying "${name}" · ${source} → ${targetLang} … confirm in wallet`);
    const c = await client();
    const tx = await c.writeContract({ address: reg, functionName: "certify",
      args: [name, source, targetLang, src, tgt] });
    log("  tx " + tx + " · " + link("/tx/" + tx, "explorer"));
    $("certSt").innerHTML = link("/tx/" + tx, "follow it on the explorer");
    const res = await wait(tx, "certifying");
    if (!res) { $("certify").disabled = false; counts(); return; }
    if (res.split) {
      log("    Run it again, or check that the language you picked matches what you pasted.", "warn");
      $("certify").disabled = false; counts(); return;
    }
    if (!res.j?.verdict) { log("  ✗ " + String(res.msg).slice(0, 200), "bad"); $("certify").disabled = false; counts(); return; }
    log(`  → ${res.j.verdict} · fidelity ${res.j.fidelity} coverage ${res.j.coverage} fluency ${res.j.fluency}`,
        res.j.verdict === "rejected" ? "warn" : "ok");
    if (res.j.defects?.length) log("    " + res.j.defects.join(", "), "warn");
    paintResult({ ...res.j, name });
    $("resultLink").innerHTML = link("/tx/" + tx, "this certification on the explorer") +
      " · " + link("/address/" + reg, "the register");
    window.scrollTo({ top: $("result-card").getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
    await renderLedger();
  } catch (e) { log("  ✗ " + (e.message || e), "bad"); $("certSt").textContent = ""; }
  $("certify").disabled = false;
  counts();
};

/* ------------------------------------------------------------------- ledger */
async function renderLedger() {
  if (!reg) return;
  const rd = reader();
  let names = [];
  try { names = JSON.parse(String(await rd.readContract({ address: reg, functionName: "names", args: [] }))); }
  catch (e) { return; }
  const body = $("ledger").querySelector("tbody");
  if (!names.length) { body.innerHTML = `<tr><td style="color:var(--fg-3);border:0">this register is empty</td></tr>`; return; }
  const rows = [`<tr><th>name</th><th>pair</th><th>verdict</th><th>fid</th><th>cov</th><th>flu</th><th>defects</th></tr>`];
  for (const n of names.slice().reverse()) {
    let e;
    try { e = JSON.parse(String(await rd.readContract({ address: reg, functionName: "certificate", args: [n] }))); }
    catch (err) { continue; }
    const [colour, label] = BANNERS[e.verdict] || ["#94a3b8", e.verdict];
    rows.push(`<tr>
      <td class="mono">${e.name}</td>
      <td style="color:var(--fg-2)">${e.source_lang} → ${e.target_lang}</td>
      <td><span style="color:${colour};font-weight:600">${label}</span></td>
      <td class="mono" style="color:${scoreColour(e.fidelity)}">${e.fidelity}</td>
      <td class="mono" style="color:${scoreColour(e.coverage)}">${e.coverage}</td>
      <td class="mono" style="color:${scoreColour(e.fluency)}">${e.fluency}</td>
      <td class="mono" style="color:var(--fg-3)">${(e.defects || []).join(", ") || "none"}</td>
    </tr>`);
  }
  body.innerHTML = rows.join("");
}

/* The page fully supports the fifteen languages with their own GenLayer Discord
   channel, plus English as the source. Anything else is not blocked, because the
   contract takes any language string, but nothing is promised either: no
   passages, no place on the globe, and nobody in a channel to argue with the
   verdict. Saying that once, clearly, beats letting somebody find out after a
   signature. */
function saySupport() {
  const el = $("support");
  if (!el) return;
  const bad = [source, target].filter((l) => l && !isSupported(l));
  if (!bad.length) { el.setAttribute("data-on", "0"); return; }
  el.setAttribute("data-on", "1");
  el.style.background = "var(--warnbox-bg)";
  el.style.boxShadow = "inset 0 0 0 1px #f59e0b88";
  el.style.color = "var(--warnbox-fg)";
  el.innerHTML = `<b>${bad.join(" and ")} ${bad.length > 1 ? "are" : "is"} outside the supported set.</b>
    Fifteen languages have their own channel in the GenLayer Discord, and those plus English are what
    this page carries passages and map markers for. Keeping the set that size is what keeps the page
    light enough to run. You can still certify ${bad.length > 1 ? "these" : "this"} — the contract takes
    any language — but there are no passages, nothing on the globe, and no channel to take the result to.`;
}

/* The fifteen are named in the opening box from the data rather than typed into
   the HTML, so the list cannot drift away from what the globe draws and what the
   contract publishes. */
(function nameTheFifteen() {
  const el = $("d15");
  if (!el) return;
  const names = DISCORD.map((l) => l.label);
  el.textContent = names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
})();

/* -------------------------------------------------------------------- modes */
function setMode(next) {
  mode = next;
  document.body.setAttribute("data-mode", mode);
  $("mode-guided").setAttribute("aria-selected", String(mode === "guided"));
  $("mode-free").setAttribute("aria-selected", String(mode === "free"));
  $("src-pick").hidden = mode !== "free";
  $("give").hidden = mode !== "guided";
  $("giveSt").hidden = mode !== "guided";
  if (mode === "guided") {
    source = "English";
    $("source").setAttribute("readonly", "");
    $("source").placeholder = "press “Give me a passage” above";
  } else {
    $("source").removeAttribute("readonly");
    $("source").placeholder = "paste the text you are translating from";
    $("src-other").value = source;
  }
  chooseTarget();
  sayChallenge();
  saySupport();
  counts();
}

/* Translating into English is the one direction where the person doing it is
   usually the learner rather than the expert, so it is worth naming. */
function sayChallenge() {
  const el = $("challenge");
  if (mode !== "free") { el.hidden = true; return; }
  if (target === "English") {
    el.hidden = false;
    el.innerHTML = `<b style="color:var(--g1)">Challenge your English.</b> Translating into a language
      you are still learning is the hardest thing this page can be asked to check, and the scores will
      tell you where it went: fidelity if a fact moved, coverage if something was dropped, fluency if
      it reads like a textbook rather than a person.`;
  } else if (source === target && source) {
    el.hidden = false;
    el.innerHTML = `<span style="color:var(--warnbox-fg)">Both ends are ${source}. The contract refuses
      that, because a translation between one language and itself has nothing to check.</span>`;
  } else {
    el.hidden = true;
  }
}

$("mode-guided").onclick = () => setMode("guided");
$("mode-free").onclick = () => setMode("free");

/* ---------------------------------------------------------- the translator */
/* Offered, and argued against in the same breath. It exists so somebody can see
   what the contract does in a language they do not read; the note beside it says
   why doing it by hand is the more interesting test. */
/* The machine translator asks before it runs. Not to be difficult: a machine
   translation of a plain sentence scores well because it deserves to, and
   somebody who lets it fill the box straight away never sees the thing the
   three scores are actually for. One press, one answer, then it does whatever
   they asked. */
let mtOk = false;

$("mt").onclick = () => {
  if (mtOk) { machineTranslate(); return; }
  $("mtAsk").setAttribute("data-on", "1");
  $("mtSt").textContent = "";
};
$("mtNo").onclick = () => {
  $("mtAsk").setAttribute("data-on", "0");
  $("target").focus();
};
$("mtYes").onclick = () => {
  mtOk = true;
  $("mtAsk").setAttribute("data-on", "0");
  machineTranslate();
};

async function machineTranslate() {
  const src = $("source").value.trim();
  const from = byLabel(source), to = byLabel(target);
  if (!src) { $("mtSt").textContent = "There is nothing in the source box yet."; return; }
  if (!from || !to) { $("mtSt").textContent = "Pick both languages first."; return; }
  if (from.code === to.code) { $("mtSt").textContent = `${source} and ${target} are the same language to a translator.`; return; }
  if (src.length > 480) { $("mtSt").textContent = "The free translator takes about 480 characters. Translate this one by hand, or shorten it."; return; }

  $("mt").disabled = true;
  $("mtSt").textContent = "asking the translator…";
  try {
    const url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(src) +
                "&langpair=" + from.code + "|" + to.code;
    const r = await fetch(url);
    const j = await r.json();
    let out = j?.responseData?.translatedText;
    if (!out || j.responseStatus >= 400) throw new Error(j?.responseDetails || "no translation came back");

    /* The service returns its own placeholder markup inside the text, and on
       short or informal input it sometimes returns nothing but that. Pasting
       `<g id="1">1</g>` into the box and calling it a translation would be
       worse than admitting it failed. */
    out = out.replace(/<\/?g[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    const letters = (out.match(/\p{L}/gu) || []).length;
    if (letters < Math.max(3, out.length * 0.4)) {
      throw new Error("it came back as markup rather than words, which it does on very short or informal input");
    }
    $("target").value = out;
    $("target").dispatchEvent(new Event("input"));
    $("mtSt").innerHTML = `Machine translation, ${source} to ${target}. <b>Read it before you sign
      it</b>: you are certifying this text as yours, and the certificate does not record who wrote it.`;
  } catch (e) {
    $("mtSt").textContent = "The translator did not answer (" + (e.message || e) + "). Translating by hand always works.";
  }
  $("mt").disabled = false;
}

/* ------------------------------------------------------------------- reset */
/* The confirmation lives on the button itself rather than in a dialog. A modal
   was built for this once and had to be removed because it stuck: the overlay
   stayed up and the page would not let go of it. A button that asks a question
   and answers it in place cannot trap anybody, and it sits in the card that
   shows the address it is about to forget. */
let armed = null;
function disarm() {
  clearTimeout(armed); armed = null;
  $("reset").textContent = "Start over";
  $("reset").style.borderColor = "rgba(239,68,68,.45)";
  $("resetSt").textContent = "Forget this register and empty every box. Nothing on chain is touched.";
}

$("reset").onclick = () => {
  if (!armed) {
    armed = setTimeout(disarm, 6000);
    $("reset").textContent = "Yes, clear it";
    $("reset").style.borderColor = "#ef4444";
    $("resetSt").innerHTML = reg
      ? `This forgets <span class="mono">${reg}</span>. Every certificate in it stays exactly where
         it is, and you can load the address again. Press once more, or wait to cancel.`
      : "Nothing is loaded, so there is nothing to lose. Press once more, or wait to cancel.";
    return;
  }
  clearTimeout(armed); armed = null;

  for (const k of Object.keys(localStorage)) {
    if (k === "faithful_register" || k.startsWith("faithful_seen_")) localStorage.removeItem(k);
  }
  reg = null; target = null;
  document.body.setAttribute("data-ready", "0");
  for (const id of ["step1", "step2", "step3"]) done(id, false);
  $("addr").value = ""; $("regLink").textContent = "";
  $("source").setAttribute("readonly", "");
  $("source").value = ""; $("target").value = ""; $("cert-name").value = "";
  $("giveSt").textContent = ""; $("tgt-other").value = "";
  $("mismatch").setAttribute("data-on", "0");
  $("rules").textContent = "load a register to read its published rules";
  $("result").hidden = true; $("result-empty").hidden = false;
  $("resultLink").textContent = ""; $("certSt").textContent = "";
  $("ledger").querySelector("tbody").innerHTML =
    `<tr><td style="color:var(--fg-3);border:0">nothing loaded yet</td></tr>`;
  $("log").textContent = "ready.";
  $("deploy").disabled = !account;
  $("faucet").disabled = !account;
  disarm();
  $("resetSt").innerHTML = `<span style="color:#22c55e">Cleared.</span> ` +
    (account ? "Deploy a register to start again." : "Connect a wallet, then deploy a register.");
  paintLangs(); chooseTarget(); counts(); sayNext();
  log("cleared.", "ok");
};

paintLangs();
setMode("guided");
counts();
sayNext();
const saved = localStorage.getItem("faithful_register");
if (saved) { log("loading " + saved + " …"); useRegister(saved); }
