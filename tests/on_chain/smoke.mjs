/* Faithful against the live Studio network.
 *
 * The claim to prove is not that a model can read Persian. It is that the four
 * cases below land in four different places, and that validators reach the same
 * verdict about each independently:
 *
 *   faithful and fluent        → certified
 *   a number moved             → rejected, number_changed
 *   half of it missing         → rejected, omission / untranslated
 *   clumsy but correct         → certified_with_reservations, NOT rejected
 *
 * The last one is the point. A checker that refuses ugly-but-safe translations
 * sends people back to fix something that was not broken; one that certifies
 * fluent-but-wrong ones is the reason this contract exists.
 *
 *   npm i genlayer-js viem && node tests/on_chain/smoke.mjs
 */
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { generatePrivateKey } from "viem/accounts";
import { readFileSync } from "node:fs";

const RPC = "https://studio.genlayer.com/api";
const rpc = async (m, p) => {
  const r = await fetch(RPC, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: m, params: p }) });
  return (await r.json()).result;
};
let pass = 0, fail = 0;
const ok = (n, c, d = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`); };

const SOURCE =
  "Acme Cloud charges 20 USD per seat each month. Overage is billed at 0.10 USD " +
  "per gigabyte. Invoices are due within 14 days. We may change these terms with " +
  "30 days notice. Support requests are answered within 2 business days.";

/* Persian numerals on purpose. Half the communities this was built for write
   numbers in their own script, and a checker that reads ۲۰ as a different
   number from 20 would refuse most correct translations. */
const GOOD =
  "اکمی کلاود ماهانه ۲۰ دلار برای هر کاربر دریافت می‌کند. مصرف مازاد به ازای هر " +
  "گیگابایت ۰٫۱۰ دلار محاسبه می‌شود. مهلت پرداخت صورت‌حساب‌ها ۱۴ روز است. ما " +
  "می‌توانیم این شرایط را با ۳۰ روز اطلاع قبلی تغییر دهیم. به درخواست‌های پشتیبانی " +
  "ظرف ۲ روز کاری پاسخ داده می‌شود.";

/* The price and the notice period both moved. Everything else is a good translation. */
const DISTORTED =
  "اکمی کلاود ماهانه ۳۵ دلار برای هر کاربر دریافت می‌کند. مصرف مازاد به ازای هر " +
  "گیگابایت ۰٫۱۰ دلار محاسبه می‌شود. مهلت پرداخت صورت‌حساب‌ها ۱۴ روز است. ما " +
  "می‌توانیم این شرایط را با ۷ روز اطلاع قبلی تغییر دهیم. به درخواست‌های پشتیبانی " +
  "ظرف ۲ روز کاری پاسخ داده می‌شود.";

/* One sentence translated, the rest left in English. */
const PARTIAL =
  "اکمی کلاود ماهانه ۲۰ دلار برای هر کاربر دریافت می‌کند. Overage is billed at " +
  "0.10 USD per gigabyte. Invoices are due within 14 days. We may change these " +
  "terms with 30 days notice. Support requests are answered within 2 business days.";

/* Every fact correct, written the way a word-by-word machine would write it. */
const CLUMSY =
  "اکمی کلاود شارژ می‌کند ۲۰ دلار برای هر صندلی هر ماه. اضافه‌مصرف صورتحساب " +
  "می‌شود در ۰٫۱۰ دلار برای هر گیگابایت. فاکتورها هستند سررسید در داخل ۱۴ روزها. " +
  "ما ممکن است تغییر دهیم این شرایط با ۳۰ روزها اطلاع. درخواست‌های پشتیبانی هستند " +
  "پاسخ داده شده در داخل ۲ کسب‌وکار روزها.";

import { createHash } from "node:crypto";
const sha = (t) => createHash("sha256").update(t, "utf8").digest("hex");
const acc = createAccount(generatePrivateKey());
const stranger = createAccount(generatePrivateKey());
/* DOMAIN is a host whose /.well-known/faithful.json the validators can fetch. BIND_KEY,
   when set, is the private key of an address that file names, for the positive path. */
const DOMAIN = process.env.DOMAIN || "faithful-one.vercel.app";
const binder = process.env.BIND_KEY ? createAccount(process.env.BIND_KEY) : null;
await rpc("sim_fundAccount", { account_address: acc.address, amount: 900e18 });
await rpc("sim_fundAccount", { account_address: stranger.address, amount: 200e18 });
if (binder) await rpc("sim_fundAccount", { account_address: binder.address, amount: 200e18 });
const c = createClient({ chain: studionet, account: acc });
const rd = createClient({ chain: studionet });

const code = readFileSync(new URL("../../contracts/faithful.py", import.meta.url));
const dh = await c.deployContract({ code, args: [], leaderOnly: false });
const A = (await c.waitForTransactionReceipt({ hash: dh, status: "ACCEPTED", retries: 40, interval: 4000 }))?.data?.contract_address;
console.log("Faithful at", A, "\n");

const wait = async (tx) => {
  /* 130 rounds at 4s. A judgement over two long texts has taken past four
     minutes on a busy Studio, and a timeout reads exactly like a contract
     fault while being nothing of the kind. */
  for (let i = 0; i < 130; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const t = await rpc("eth_getTransactionByHash", [tx]);
    if (t?.status === "CANCELED") return { msg: "CANCELED", exec: "CANCELED", votes: { a: 0, d: 0, idl: 0 }, applied: false };
    if (t?.status === "FINALIZED") {
      const lr = t.consensus_data?.leader_receipt, one = Array.isArray(lr) ? lr[0] : lr;
      let msg = ""; try { msg = Buffer.from(one.result, "base64").toString("utf8"); } catch (e) {}
      let a = 0, d = 0, idl = 0;
      for (const k in (t.consensus_data?.votes || {})) { const v = t.consensus_data.votes[k]; if (v === "agree") a++; else if (v === "disagree") d++; else idl++; }
      let j = null; const b = msg.indexOf("{");
      if (b !== -1) { try { j = JSON.parse(msg.slice(b)); } catch (e) {} }
      /* A split vote finalises and applies nothing. Only the tally says so. */
      return { msg: msg.replace(/[^\x20-\x7e]/g, " ").trim(), j, exec: one?.execution_result,
               votes: { a, d, idl }, applied: a * 2 > a + d + idl };
    }
  }
  return { msg: "TIMEOUT", exec: "", votes: { a: 0, d: 0, idl: 0 }, applied: false };
};
const send = async (fn, args) => await wait(await c.writeContract({ address: A, functionName: fn, args }));
const view = async (fn, args = []) => await rd.readContract({ address: A, functionName: fn, args });
const tally = (r) => `${r.votes.a} agree, ${r.votes.d} disagree, ${r.votes.idl} idle`;

/* Certify, then read the certificate the contract actually stored.
 *
 * Two ways this test lied to itself before it did this, both worth keeping:
 *
 *   A slow round timed out here while the transaction went on to succeed on
 *   chain, and the timeout was recorded as the contract failing.
 *
 *   Worse: an `[EXPECTED]` refusal left the parsed result undefined, and
 *   `undefined !== "rejected"` is true — so "a clumsy translation is NOT
 *   rejected" passed on a transaction that never judged anything at all.
 *
 * The stored certificate is the fact. The transaction's return value is a
 * convenience, and asserting on it is asserting on the wrong thing. */
async function certify(name, src, tgt, text, translation) {
  const r = await send("certify", [name, src, tgt, text, translation]);
  for (let i = 0; i < 45; i++) {
    let stored;
    try { stored = JSON.parse(String(await view("certificate", [name]))); } catch (e) { stored = null; }
    if (stored && !stored.error) return { ...r, stored };
    await new Promise((x) => setTimeout(x, 4000));
  }
  return { ...r, stored: null };
}
const show = (r) => r.stored
  ? `${r.stored.verdict} · fid ${r.stored.fidelity} cov ${r.stored.coverage} flu ${r.stored.fluency} · ${JSON.stringify(r.stored.defects)}`
  : "NOTHING STORED — " + r.msg.slice(0, 70);

// ---------- the rules of the contract, before any model is involved ----------
const same = await send("certify", ["x", "English", "English", SOURCE, SOURCE]);
ok("the same language twice is refused",
   same.exec === "ERROR" && same.msg.includes("same language"), same.msg.slice(0, 60));
const tiny = await send("certify", ["x", "English", "Persian", SOURCE, "کوتاه"]);
ok("a translation too short to judge is refused",
   tiny.exec === "ERROR" && tiny.msg.includes("too short"), tiny.msg.slice(0, 60));

// ---------- 1. faithful and fluent ----------
// ---------- a publisher puts the source hash on the record before anything is judged ----------
const SRC_HASH = sha(SOURCE);
const pub = await send("publish", [SRC_HASH, "Acme Cloud terms of service"]);
ok("a publisher registers the source hash under its own address", pub.j?.ok === true && String(pub.j?.publisher).toLowerCase() === acc.address.toLowerCase(), pub.msg.slice(0, 60));
const badHash = await send("publish", ["not-a-hash", "x"]);
ok("a source hash must be 64 hex characters", badHash.exec === "ERROR" && badHash.msg.includes("64 lowercase hex"));
const cs = createClient({ chain: studionet, account: stranger });
const second = await wait(await cs.writeContract({ address: A, functionName: "publish", args: [SRC_HASH, "mine too"] }));
ok("another account may publish the same hash: nobody wins a race, nobody is in anybody's way", second.j?.ok === true && second.j?.publishers === 2, second.msg.slice(0, 70));
const pubs = JSON.parse(String(await view("publishers_of", [SRC_HASH])));
ok("publishers_of lists both, in order of arrival, and names nobody as authoritative",
   pubs.length === 2 && pubs[0].publisher.toLowerCase() === acc.address.toLowerCase() && pubs[1].publisher.toLowerCase() === stranger.address.toLowerCase() && pubs[1].title === "mine too", JSON.stringify(pubs.map((p) => p.title)));
ok("is_published_by answers for the address the consumer brings",
   (await view("is_published_by", [acc.address, SRC_HASH])) === true && (await view("is_published_by", [stranger.address, SRC_HASH])) === true
   && (await view("is_published_by", ["0x" + "1".repeat(40), SRC_HASH])) === false);

const good = await certify("good", "English", "Persian", SOURCE, GOOD);
ok("the certificate lists the publishers of its source, live", Array.isArray(good.stored?.publishers) && good.stored.publishers.map((p) => p.toLowerCase()).includes(acc.address.toLowerCase()) && good.stored.publishers.length === 2, `publishers ${JSON.stringify(good.stored?.publishers)}`);

// ---------- a host vouches for an address, checked by every validator ----------
const badHost = await send("bind_domain", ["https://" + DOMAIN + "/x"]);
ok("a domain must be a bare host; anything else is refused before any validator fetches", badHost.exec === "ERROR" && badHost.msg.includes("bare lowercase host"), badHost.msg.slice(0, 70));
const notNamed = await send("bind_domain", [DOMAIN]);
ok("a wallet the host's well-known file does not name is refused by the validators, with the reason",
   notNamed.exec === "ERROR" && notNamed.msg.includes("does not name " + acc.address), `${tally(notNamed)} · ${notNamed.msg.slice(0, 110)}`);
ok("and nothing is bound", (await view("is_bound", [acc.address, DOMAIN])) === false && JSON.parse(String(await view("domain_of", [acc.address]))).domain === "");
if (binder) {
  const cb = createClient({ chain: studionet, account: binder });
  const bound = await wait(await cb.writeContract({ address: A, functionName: "bind_domain", args: [DOMAIN] }));
  ok("a wallet the file names is bound: every validator fetched the document and agreed", bound.j?.ok === true && bound.j?.domain === DOMAIN, `${tally(bound)} · ${bound.msg.slice(0, 90)}`);
  ok("is_bound and domain_of read it for free", (await view("is_bound", [binder.address, DOMAIN])) === true && (await view("is_bound", [binder.address, "other.example"])) === false
     && JSON.parse(String(await view("domain_of", [binder.address]))).well_known === "https://" + DOMAIN + "/.well-known/faithful.json");
  const pubB = await wait(await cb.writeContract({ address: A, functionName: "publish", args: [SRC_HASH, "the bound publisher's copy"] }));
  const pubs2 = JSON.parse(String(await view("publishers_of", [SRC_HASH])));
  ok("a publication by a bound publisher shows its host", pubB.j?.ok === true && pubs2.some((p) => p.publisher.toLowerCase() === binder.address.toLowerCase() && p.domain === DOMAIN));
} else console.log("(set BIND_KEY to the key of an address " + DOMAIN + "/.well-known/faithful.json names, to also check the positive path)");
ok("the certificate is bound to hashes of what was judged", good.stored?.source_hash === SRC_HASH && good.stored?.target_hash === sha(GOOD) && /^[0-9a-f]{64}$/.test(good.stored?.pair_hash || ""), `pair ${String(good.stored?.pair_hash).slice(0, 12)}…`);
ok("a faithful, fluent translation is certified",
   good.stored?.verdict === "certified", `${tally(good)} → ${show(good)}`);
ok("Persian numerals are not read as changed numbers",
   Array.isArray(good.stored?.defects) && !good.stored.defects.includes("number_changed"),
   JSON.stringify(good.stored?.defects));

// ---------- 2. a number moved ----------
const bad = await certify("distorted", "English", "Persian", SOURCE, DISTORTED);
ok("a translation that moves the price is rejected",
   bad.stored?.verdict === "rejected", `${tally(bad)} → ${show(bad)}`);
ok("and it is rejected for the right reason",
   (bad.stored?.defects || []).includes("number_changed"), JSON.stringify(bad.stored?.defects));

// ---------- 3. half of it never translated ----------
const partial = await certify("partial", "English", "Persian", SOURCE, PARTIAL);
ok("a half-translated document is rejected",
   partial.stored?.verdict === "rejected", `${tally(partial)} → ${show(partial)}`);
ok("and coverage, not fidelity, is what catches it",
   partial.stored != null && partial.stored.coverage < partial.stored.fidelity,
   `cov ${partial.stored?.coverage} < fid ${partial.stored?.fidelity} ${JSON.stringify(partial.stored?.defects)}`);

// ---------- 4. the one that matters: clumsy but correct ----------
const clumsy = await certify("clumsy", "English", "Persian", SOURCE, CLUMSY);
/* Note what this does NOT say. `!== "rejected"` would be satisfied by a
   transaction that failed and stored nothing, which is how this assertion
   passed once without judging anything. It must name the verdict it expects. */
ok("a clumsy but correct translation is certified with reservations, not rejected",
   clumsy.stored?.verdict === "certified_with_reservations", `${tally(clumsy)} → ${show(clumsy)}`);
ok("its fluency is scored below its fidelity, which is the whole distinction",
   clumsy.stored != null && clumsy.stored.fluency < clumsy.stored.fidelity,
   `flu ${clumsy.stored?.fluency} < fid ${clumsy.stored?.fidelity}`);

// ---------- the gate another contract reads ----------
const gate = {};
for (const n of ["good", "distorted", "partial", "clumsy"]) gate[n] = await view("is_certified", [n]);
ok("is_certified passes the safe ones and stops the wrong ones",
   gate.good === true && gate.distorted === false && gate.partial === false && gate.clumsy === true,
   JSON.stringify(gate));

// ---------- the communities ----------
const communities = JSON.parse(String(await view("communities")));
ok("all sixteen communities are published, label and language",
   communities.length === 16 && communities.some((x) => x.community === "Latam" && x.language.includes("Latin America")),
   `${communities.length}: ${communities.map((x) => x.community).join(", ")}`);

const rules = JSON.parse(String(await view("rules")));
ok("the gate is published, and says the model does not decide it",
   String(rules.gate.decided_by).includes("never"), rules.gate.rejected_if);

const dupe = await send("certify", ["good", "English", "German", SOURCE, GOOD]);
ok("a certificate name cannot be reused",
   dupe.exec === "ERROR" && dupe.msg.includes("already exists"), dupe.msg.slice(0, 60));
const samePair = await send("certify", ["good-again", "English", "Persian", SOURCE, GOOD]);
ok("the same pair is never judged twice — a certificate is not asked for until the answer suits",
   samePair.exec === "ERROR" && samePair.msg.includes("already certified as good"), samePair.msg.slice(0, 80));

// ---------- the gate by identity, and documents in parts ----------
ok("is_certified_hash gates by identity with no model and no consensus",
   (await view("is_certified_hash", [good.stored.pair_hash])) === true && (await view("is_certified_hash", [bad.stored.pair_hash])) === false && (await view("is_certified_hash", ["f".repeat(64)])) === false);
ok("certificate_hash finds the certificate by its pair hash", JSON.parse(String(await view("certificate_hash", [good.stored.pair_hash]))).name === "good");
ok("publication reads one publisher's row", JSON.parse(String(await view("publication", [acc.address, SRC_HASH]))).title === "Acme Cloud terms of service");
const m1 = await send("manifest", ["terms-in-two-parts", JSON.stringify([good.stored.pair_hash, clumsy.stored.pair_hash])]);
ok("a manifest of certified parts is a certified document", m1.j?.ok === true && m1.j?.certified_now === true && (await view("is_document_certified", [m1.j.manifest_hash])) === true, tally(m1));
const m2 = await send("manifest", ["terms-with-a-bad-part", JSON.stringify([good.stored.pair_hash, bad.stored.pair_hash])]);
ok("a manifest with a rejected part is not", m2.j?.ok === true && m2.j?.certified_now === false && (await view("is_document_certified", [m2.j.manifest_hash])) === false);
const doc = JSON.parse(String(await view("document", [m2.j.manifest_hash])));
ok("document() shows every part's live state", doc.complete === true && doc.parts.length === 2 && doc.parts[1].verdict === "rejected" && doc.certified === false);
const m3 = await send("manifest", ["with-a-missing-part", JSON.stringify([good.stored.pair_hash, "e".repeat(64)])]);
ok("a manifest may name a part not yet judged, and is not certified until it is", m3.j?.ok === true && m3.j?.certified_now === false);
const m4 = await send("manifest", ["one-part", JSON.stringify([good.stored.pair_hash])]);
ok("a manifest needs at least two parts", m4.exec === "ERROR" && m4.msg.includes("2 to"));
console.log("manifest (two certified parts):", m1.j?.manifest_hash);

console.log(`\n${pass} passed, ${fail} failed`);
console.log("contract:", A);
