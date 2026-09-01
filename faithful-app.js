import { createClient } from "https://esm.sh/genlayer-js@1.1.8";
import { studionet } from "https://esm.sh/genlayer-js@1.1.8/chains";
import { PASSAGES, SCRIPTS, scriptOf } from "./texts.js";
import { LANGUAGES, search } from "./languages.js";

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
const SOURCE_LANG = "English";
let target = null;

/* No repeats until the set is exhausted: a shuffled order per community,
   remembered across reloads. */
const seenKey = (lang) => "faithful_seen_" + lang;
function nextPassage(lang) {
  const pool = PASSAGES[lang];
  if (!pool) return null;
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
  $("src-lang").textContent = SOURCE_LANG;
  done("step2", !!target && !!$("source").value.trim());
  suggestName();
  checkMismatch();
}
/* Typing used to set the language directly, and that is how a target could end
   up naming something the text was not. Now typing only searches: the language
   is set by choosing one, from this list or from the globe, and never by what
   is half-typed in the box. */
const langBox = $("tgt-other"), langList = $("lang-list");
let langCursor = -1, langShown = [];

function closeList() {
  langList.hidden = true;
  langBox.setAttribute("aria-expanded", "false");
  langCursor = -1;
}

function openList(query) {
  langShown = search(query).slice(0, 60);
  if (!langShown.length) {
    langList.innerHTML = `<p class="none">No language matches “${query}”. The contract accepts any
      name, so you can still translate into one that is not listed by pasting your own source.</p>`;
  } else {
    langList.innerHTML = langShown.map((l, i) => `
      <button type="button" class="opt" role="option" data-i="${i}" aria-selected="false">
        <span class="endo">${l.endonym}</span>
        <span>${l.label}</span>
        ${l.discord ? '<span class="tag">discord</span>' : ""}
        <span class="where">${l.country}</span>
      </button>`).join("");
  }
  langList.hidden = false;
  langBox.setAttribute("aria-expanded", "true");
  langCursor = -1;
}

function markCursor() {
  for (const el of langList.querySelectorAll(".opt")) el.setAttribute("aria-selected", "false");
  const el = langList.querySelector(`.opt[data-i="${langCursor}"]`);
  if (el) { el.setAttribute("aria-selected", "true"); el.scrollIntoView({ block: "nearest" }); }
}

/* One way in, whether the choice came from a chip, this list, or the globe. */
export function chooseLanguage(label) {
  target = label;
  langBox.value = "";
  closeList();
  paintLangs();
  chooseTarget();
  giveOne();
}

langBox.addEventListener("input", () => openList(langBox.value));
langBox.addEventListener("focus", () => openList(langBox.value));
langBox.addEventListener("keydown", (e) => {
  if (langList.hidden && (e.key === "ArrowDown" || e.key === "Enter")) { openList(langBox.value); return; }
  if (e.key === "ArrowDown") { e.preventDefault(); langCursor = Math.min(langShown.length - 1, langCursor + 1); markCursor(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); langCursor = Math.max(0, langCursor - 1); markCursor(); }
  else if (e.key === "Enter") {
    e.preventDefault();
    const pick = langShown[langCursor >= 0 ? langCursor : 0];
    if (pick) chooseLanguage(pick.label);
  } else if (e.key === "Escape") closeList();
});
langList.addEventListener("mousedown", (e) => {
  const opt = e.target.closest(".opt");
  if (!opt) return;
  e.preventDefault();
  const pick = langShown[Number(opt.dataset.i)];
  if (pick) chooseLanguage(pick.label);
});
addEventListener("click", (e) => {
  if (!langList.hidden && !langBox.contains(e.target) && !langList.contains(e.target)) closeList();
});

function giveOne() {
  if (!target) { $("giveSt").textContent = "pick a community first"; return; }
  const got = nextPassage(target);
  if (!got) {
    $("giveSt").innerHTML = `<span style="color:#f59e0b">no passages written for “${target}” yet, so paste your own source below</span>`;
    $("source").removeAttribute("readonly");
    $("source").value = "";
    $("source").placeholder = "paste an English source text";
    return;
  }
  $("source").setAttribute("readonly", "");
  $("source").value = got.text;
  $("target").value = "";
  $("giveSt").textContent = `passage ${got.index} of ${got.of} · ${got.left} you have not seen yet`;
  counts(); chooseTarget();
  $("target").focus();
}
$("give").onclick = giveOne;

const counts = () => {
  for (const [box, out] of [["source", "src-count"], ["target", "tgt-count"]]) {
    const n = $(box).value.trim().length;
    $(out).textContent = `· ${n} / 4000`;
    $(out).style.color = n > 4000 ? "#ef4444" : "";
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

  if (SOURCE_LANG === targetLang) { log("the source and the target are the same language", "warn"); return; }
  for (const [label, text] of [["source", src], ["translation", tgt]]) {
    if (text.length < 20) { log(`the ${label} is too short to judge`, "warn"); return; }
    if (text.length > 4000) { log(`the ${label} is longer than 4000 characters. Split it into parts.`, "warn"); return; }
  }

  $("certify").disabled = true;
  $("certSt").textContent = "waiting on consensus…";
  try {
    log(`▶ certifying "${name}" · ${SOURCE_LANG} → ${targetLang} … confirm in wallet`);
    const c = await client();
    const tx = await c.writeContract({ address: reg, functionName: "certify",
      args: [name, SOURCE_LANG, targetLang, src, tgt] });
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

paintLangs();
counts();
sayNext();
const saved = localStorage.getItem("faithful_register");
if (saved) { log("loading " + saved + " …"); useRegister(saved); }
