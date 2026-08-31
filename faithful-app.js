import { createClient } from "https://esm.sh/genlayer-js@1.1.8";
import { studionet } from "https://esm.sh/genlayer-js@1.1.8/chains";

const $ = (id) => document.getElementById(id);
const RPC = "https://studio.genlayer.com/api";
const EXPLORER = "https://explorer-studio.genlayer.com";
const CHAIN = { chainId: "0xf22f", chainName: "GenLayer Studio",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: [RPC], blockExplorerUrls: [EXPLORER + "/"] };

/* Replace with your own register once you have deployed one. */
const CANONICAL = "";

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

/* Flags label a community, never a language on their own — every chip carries the
   name beside it. A flag alone would be wrong here anyway: Arabic is not one
   country, and Hindi-Urdu is two. */
const COMMUNITIES = [
  ["English", "🇬🇧"], ["Chinese", "🇨🇳"], ["Hindi-Urdu", "🇮🇳"], ["Indonesian", "🇮🇩"],
  ["Latam", "🌎"], ["Nigerian", "🇳🇬"], ["Russian", "🇷🇺"], ["Korean", "🇰🇷"],
  ["Turkish", "🇹🇷"], ["Ukranian", "🇺🇦"], ["Vietnamese", "🇻🇳"], ["Arabic", "🇸🇦"],
  ["Persian", "🇮🇷"], ["German", "🇩🇪"], ["Japanese", "🇯🇵"], ["Bangladeshi", "🇧🇩"],
];

let source = "English", target = "Persian";

function chips(host, chosen, onPick) {
  host.innerHTML = "";
  for (const [name, flag] of COMMUNITIES) {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-pressed", String(name === chosen()));
    b.innerHTML = `<span class="flag" aria-hidden="true">${flag}</span>${name}`;
    b.onclick = () => { onPick(name); paintLangs(); };
    host.appendChild(b);
  }
}
function paintLangs() {
  chips($("src-langs"), () => source, (n) => { source = n; });
  chips($("tgt-langs"), () => target, (n) => { target = n; $("tgt-other").value = ""; });
}
paintLangs();
$("tgt-other").addEventListener("input", (e) => {
  const typed = e.target.value.trim();
  if (typed) { target = typed; paintLangs(); }
});

const counts = () => {
  for (const [box, out] of [["source", "src-count"], ["target", "tgt-count"]]) {
    const n = $(box).value.trim().length;
    $(out).textContent = `· ${n} / 4000`;
    $(out).style.color = n > 4000 || n < 20 ? "#f59e0b" : "";
  }
};
$("source").addEventListener("input", counts);
$("target").addEventListener("input", counts);
counts();

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
  $("certify").disabled = !reg;
  log("connected " + account, "ok");
  const balance = BigInt(await rpc("eth_getBalance", [account, "latest"]) || "0x0");
  if (balance < BigInt(1e17))
    log("  balance is low — press Get test GEN, or the wallet will refuse to sign without saying why", "warn");
};
$("faucet").onclick = async () => {
  await rpc("sim_fundAccount", { account_address: account, amount: 300e18 });
  log("funded 300 test GEN", "ok");
};

/* A transaction that splits the vote finalises exactly like one that applied.
   The status never says which; only the tally does. */
async function wait(tx, label) {
  for (let i = 0; i < 75; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const t = await rpc("eth_getTransactionByHash", [tx]);
    if (t?.status === "CANCELED") { log("  ✗ " + label + " was cancelled by the network — try again", "bad"); return null; }
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
        log("  ⚖ the validators did not agree, so nothing was stored. Run it again.", "warn");
        return null;
      }
      let j = null; const b = msg.indexOf("{");
      if (b !== -1) { try { j = JSON.parse(msg.slice(b)); } catch (e) {} }
      return { msg: msg.replace(/[^\x20-\x7e]/g, " ").trim(), j };
    }
    if (i % 3 === 0 && i) log("  … " + label + " (" + i * 4 + "s)");
  }
  log("  ✗ " + label + " timed out", "bad");
  return null;
}

/* ------------------------------------------------------------- the register */
async function useRegister(address) {
  /* A free read before anything is signed. Pointing this page at a contract that
     is not a Faithful costs a signature and dies with exit_code 1, which says
     nothing about why. */
  let rules;
  try { rules = JSON.parse(String(await reader().readContract({ address, functionName: "rules", args: [] }))); }
  catch (e) { log("  ✗ that address did not answer rules() — it is not a Faithful register", "bad"); return false; }
  reg = address;
  localStorage.setItem("faithful_register", address);
  $("addr").value = address;
  $("rules").textContent = JSON.stringify(rules, null, 2);
  $("certify").disabled = !account;
  log("  ✓ register " + address, "ok");
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
    const src = await (await fetch("./contracts/faithful.py?t=" + Date.now())).text();
    const c = await client();
    const h = await c.deployContract({ code: src, args: [] });
    log("  tx " + h);
    const r = await c.waitForTransactionReceipt({ hash: h, status: "ACCEPTED", retries: 50, interval: 4000 }).catch(() => null);
    const A = r?.data?.contract_address;
    if (!A) throw new Error("the deploy produced no address");
    log("  ✓ deployed at " + A, "ok");
    await useRegister(A);
  } catch (e) { log("  ✗ " + (e.message || e), "bad"); }
  $("deploy").disabled = false;
};

/* ------------------------------------------------------------------ certify */
const PALETTE = {
  certified: ["#22c55e", "certified", "faithful, complete, and it reads like the language"],
  certified_with_reservations: ["#f59e0b", "certified with reservations",
    "faithful and complete, but it reads badly — safe to publish, worth improving"],
  rejected: ["#ef4444", "rejected", "something the source says did not survive"],
};

/* Exported so the three verdicts can be checked in a browser without a wallet
   and without a consensus round. The page never calls it from outside. */
export function paintResult(r) {
  $("result-empty").hidden = true;
  $("result").hidden = false;
  const [colour, label, note] = PALETTE[r.verdict] || ["#94a3b8", r.verdict, ""];
  const chip = $("verdict");
  chip.textContent = label;
  chip.style.background = colour + "22";
  chip.style.color = colour;
  chip.style.boxShadow = "inset 0 0 0 1px " + colour + "66";
  $("verdict-note").textContent = note;

  const floors = { fidelity: 85, coverage: 85, fluency: 60 };
  $("scores").innerHTML = ["fidelity", "coverage", "fluency"].map((k) => {
    const v = Number(r[k] ?? 0);
    const under = v < floors[k];
    const colour = k === "fluency" ? (under ? "#f59e0b" : "#22c55e") : (under ? "#ef4444" : "#22c55e");
    const blocks = k === "fluency" ? "never blocks" : "blocks below " + floors[k];
    return `<div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:7px">
        <span style="font-weight:600;text-transform:capitalize">${k}</span>
        <span style="color:#94a3b8;font-size:13px">${blocks}</span>
        <span class="mono" style="color:${colour};font-weight:600">${v}</span>
      </div>
      <div class="bar"><i style="width:${Math.max(0, Math.min(100, v))}%;background:${colour}"></i></div>
    </div>`;
  }).join("");

  const defects = r.defects || [];
  $("defects").innerHTML = defects.length
    ? `<p class="eyebrow" style="color:#ef4444">Defects named</p>
       <ul style="margin:10px 0 0;padding-inline-start:20px;color:#cbd5e1">
         ${defects.map((d) => `<li><code>${d}</code></li>`).join("")}</ul>`
    : `<p class="eyebrow" style="color:#22c55e">No defect named</p>`;
  $("notes").textContent = r.notes || "";
}

$("certify").onclick = async () => {
  if (!reg) { log("load or deploy a register first", "warn"); return; }
  const name = $("cert-name").value.trim();
  const src = $("source").value.trim();
  const tgt = $("target").value.trim();
  const targetLang = $("tgt-other").value.trim() || target;

  if (!name) { log("give the certificate a name", "warn"); return; }
  if (source === targetLang) { log("the source and the target are the same language", "warn"); return; }
  for (const [label, text] of [["source", src], ["translation", tgt]]) {
    if (text.length < 20) { log(`the ${label} is too short to judge`, "warn"); return; }
    if (text.length > 4000) { log(`the ${label} is longer than 4000 characters — split it`, "warn"); return; }
  }

  $("certify").disabled = true;
  $("certSt").textContent = "waiting on consensus…";
  try {
    log(`▶ certifying "${name}" · ${source} → ${targetLang} … confirm in wallet`);
    const c = await client();
    const tx = await c.writeContract({ address: reg, functionName: "certify",
      args: [name, source, targetLang, src, tgt] });
    log("  tx " + tx);
    const res = await wait(tx, "certifying");
    if (!res) { $("certSt").textContent = ""; $("certify").disabled = false; return; }
    if (!res.j?.verdict) { log("  ✗ " + res.msg.slice(0, 200), "bad"); $("certSt").textContent = ""; $("certify").disabled = false; return; }
    log(`  → ${res.j.verdict} · fidelity ${res.j.fidelity} coverage ${res.j.coverage} fluency ${res.j.fluency}`,
        res.j.verdict === "rejected" ? "warn" : "ok");
    if (res.j.defects?.length) log("    defects: " + res.j.defects.join(", "), "warn");
    paintResult(res.j);
    $("certSt").innerHTML = `<a href="${EXPLORER}/tx/${tx}" target="_blank" rel="noopener">on the explorer ↗</a>`;
    await renderLedger();
  } catch (e) { log("  ✗ " + (e.message || e), "bad"); $("certSt").textContent = ""; }
  $("certify").disabled = false;
};

/* ------------------------------------------------------------------- ledger */
async function renderLedger() {
  if (!reg) return;
  const rd = reader();
  let names = [];
  try { names = JSON.parse(String(await rd.readContract({ address: reg, functionName: "names", args: [] }))); }
  catch (e) { return; }
  const body = $("ledger").querySelector("tbody");
  if (!names.length) {
    body.innerHTML = `<tr><td style="color:#94a3b8;border:0">this register is empty</td></tr>`;
    return;
  }
  const rows = [`<tr><th>name</th><th>pair</th><th>verdict</th><th>fid</th><th>cov</th><th>flu</th><th>defects</th></tr>`];
  for (const n of names) {
    let e;
    try { e = JSON.parse(String(await rd.readContract({ address: reg, functionName: "certificate", args: [n] }))); }
    catch (err) { continue; }
    const [colour, label] = PALETTE[e.verdict] || ["#94a3b8", e.verdict];
    rows.push(`<tr>
      <td class="mono">${e.name}</td>
      <td style="color:#cbd5e1">${e.source_lang} → ${e.target_lang}</td>
      <td><span style="color:${colour};font-weight:600">${label}</span></td>
      <td class="mono">${e.fidelity}</td><td class="mono">${e.coverage}</td><td class="mono">${e.fluency}</td>
      <td class="mono" style="color:#94a3b8">${(e.defects || []).join(", ") || "—"}</td>
    </tr>`);
  }
  body.innerHTML = rows.join("");
}

const saved = localStorage.getItem("faithful_register") || CANONICAL;
if (saved) { log("loading " + saved + " …"); useRegister(saved); }
