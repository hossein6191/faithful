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

const acc = createAccount(generatePrivateKey());
await rpc("sim_fundAccount", { account_address: acc.address, amount: 900e18 });
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
const show = (r) => r.j ? `${r.j.verdict} · fid ${r.j.fidelity} cov ${r.j.coverage} flu ${r.j.fluency} · ${JSON.stringify(r.j.defects)}` : r.msg.slice(0, 80);

// ---------- the rules of the contract, before any model is involved ----------
const same = await send("certify", ["x", "English", "English", SOURCE, SOURCE]);
ok("the same language twice is refused",
   same.exec === "ERROR" && same.msg.includes("same language"), same.msg.slice(0, 60));
const tiny = await send("certify", ["x", "English", "Persian", SOURCE, "کوتاه"]);
ok("a translation too short to judge is refused",
   tiny.exec === "ERROR" && tiny.msg.includes("too short"), tiny.msg.slice(0, 60));

// ---------- 1. faithful and fluent ----------
const good = await send("certify", ["good", "English", "Persian", SOURCE, GOOD]);
ok("a faithful, fluent translation is certified",
   good.applied && good.j?.verdict === "certified", `${tally(good)} → ${show(good)}`);
ok("Persian numerals are not read as changed numbers",
   good.j?.defects?.includes("number_changed") === false,
   JSON.stringify(good.j?.defects));

// ---------- 2. a number moved ----------
const bad = await send("certify", ["distorted", "English", "Persian", SOURCE, DISTORTED]);
ok("a translation that moves the price is rejected",
   bad.applied && bad.j?.verdict === "rejected", `${tally(bad)} → ${show(bad)}`);
ok("and it is rejected for the right reason",
   bad.j?.defects?.includes("number_changed"), JSON.stringify(bad.j?.defects));

// ---------- 3. half of it never translated ----------
const partial = await send("certify", ["partial", "English", "Persian", SOURCE, PARTIAL]);
ok("a half-translated document is rejected",
   partial.applied && partial.j?.verdict === "rejected", `${tally(partial)} → ${show(partial)}`);
ok("and coverage, not fidelity, is what catches it",
   partial.j?.coverage < partial.j?.fidelity ||
   (partial.j?.defects || []).some((d) => d === "omission" || d === "untranslated"),
   `cov ${partial.j?.coverage} fid ${partial.j?.fidelity} ${JSON.stringify(partial.j?.defects)}`);

// ---------- 4. the one that matters: clumsy but correct ----------
const clumsy = await send("certify", ["clumsy", "English", "Persian", SOURCE, CLUMSY]);
ok("a clumsy but correct translation is NOT rejected",
   clumsy.applied && clumsy.j?.verdict !== "rejected", `${tally(clumsy)} → ${show(clumsy)}`);
ok("its fluency is scored below its fidelity, which is the whole distinction",
   clumsy.j?.fluency < clumsy.j?.fidelity,
   `flu ${clumsy.j?.fluency} < fid ${clumsy.j?.fidelity}`);

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

console.log(`\n${pass} passed, ${fail} failed`);
console.log("contract:", A);
