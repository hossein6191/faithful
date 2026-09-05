/* The consequence: a bounty that can only pay a certified translator.
 *
 * A contract that records a verdict and stops has produced an opinion. This
 * checks the other half — that the agreed verdict decides who gets the money,
 * that money actually moves, and that there is no path through the bounty
 * that pays for a translation the validators refused.
 *
 * Runs against the register this repository's evidence points at, and the
 * four certificates in it. Deploys three bounties with a throwaway account.
 *
 *   REGISTER=0x… node tests/on_chain/bounty.mjs
 */
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";

const RPC = "https://studio.genlayer.com/api";
const rpc = async (m, p) => {
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(RPC, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: m, params: p }) });
      return (await r.json()).result;
    } catch (e) { await new Promise((x) => setTimeout(x, 2500)); }
  }
};
let pass = 0, fail = 0;
const ok = (n, c, d = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`); };

const REGISTER = process.env.REGISTER || "0x55ACAafdDbD6D62156e59c0C3DFb2Db2C9744e15";
const acc = createAccount(generatePrivateKey());
await rpc("sim_fundAccount", { account_address: acc.address, amount: 900e18 });
const c = createClient({ chain: studionet, account: acc });
const rd = createClient({ chain: studionet });
const balance = async (a) => BigInt(await rpc("eth_getBalance", [a, "latest"]) || "0x0");
/* emit_transfer lands when the transaction finalises, and the balance can
   take a few more seconds to show it. Read until it moves, or give up after a
   minute — a transfer that never shows is a real failure, a slow one is not. */
const balanceOnceMoved = async (a, before) => {
  for (let i = 0; i < 15; i++) {
    const b = await balance(a);
    if (b !== before) return b;
    await new Promise((r) => setTimeout(r, 4000));
  }
  return await balance(a);
};
const code = readFileSync(new URL("../../contracts/fixtures/bounty.py", import.meta.url));

const wait = async (tx) => {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const t = await rpc("eth_getTransactionByHash", [tx]);
    if (t?.status === "CANCELED") return { msg: "CANCELED", exec: "CANCELED" };
    if (t?.status === "FINALIZED") {
      const lr = t.consensus_data?.leader_receipt, one = Array.isArray(lr) ? lr[0] : lr;
      let msg = ""; try { msg = Buffer.from(one.result, "base64").toString("utf8").replace(/[^\x20-\x7e]/g, " ").trim(); } catch (e) {}
      let j = null; const b = msg.indexOf("{");
      if (b !== -1) { try { j = JSON.parse(msg.slice(b)); } catch (e) {} }
      return { msg, j, exec: one?.execution_result };
    }
  }
  return { msg: "TIMEOUT", exec: "" };
};
const deployFor = async (name) => {
  const dh = await c.deployContract({ code, args: [REGISTER, name], leaderOnly: false });
  const r = await c.waitForTransactionReceipt({ hash: dh, status: "ACCEPTED", retries: 40, interval: 4000 });
  return r?.data?.contract_address;
};
const send = async (B, fn, args = [], value) => await wait(await c.writeContract({ address: B, functionName: fn, args, ...(value ? { value } : {}) }));
const view = async (B, fn, args = []) => await rd.readContract({ address: B, functionName: fn, args });
const GEN = 10n ** 18n;

console.log("register", REGISTER, "\n");

// ---------- 1 · a certified-with-reservations translation is paid ----------
const translator = privateKeyToAccount(generatePrivateKey()).address;
const B1 = await deployFor("faithful-but-clumsy");
console.log("bounty for faithful-but-clumsy at", B1);
ok("would_pay reads the register's verdict with no model and no consensus",
   (await view(B1, "would_pay")) === "translator", String(await view(B1, "would_pay")));
const b = await send(B1, "bind", [translator]);
ok("the requester binds the translator's wallet", b.j?.ok === true, translator.slice(0, 12) + "…");
const f = await send(B1, "fund", [], 30n * GEN);
ok("the bounty takes funds", f.j?.ok === true, `pool ${f.j?.pool}`);
const before = await balance(translator);
const s1 = await send(B1, "settle", []);
ok("settle pays the translator for a translation certified WITH reservations",
   s1.j?.ok === true && s1.j?.paid === "translator" && s1.j?.verdict === "certified_with_reservations",
   `${s1.j?.verdict} → ${s1.j?.paid}`);
const paid = await balanceOnceMoved(translator, before);
ok("the money actually moved", paid - before === 30n * GEN, `${(paid - before) / GEN} GEN`);
const twice = await send(B1, "settle", []);
ok("a bounty settles once", twice.exec === "ERROR" && twice.msg.includes("already been settled"), twice.msg.slice(0, 50));

// ---------- 2 · a rejected translation refunds the requester ----------
const loser = privateKeyToAccount(generatePrivateKey()).address;
const B2 = await deployFor("numbers-moved");
console.log("\nbounty for numbers-moved at", B2);
ok("would_pay says the requester gets it back", (await view(B2, "would_pay")) === "requester", String(await view(B2, "would_pay")));
await send(B2, "bind", [loser]);
await send(B2, "fund", [], 20n * GEN);
const reqBefore = await balance(acc.address);
const loserBefore = await balance(loser);
const s2 = await send(B2, "settle", []);
ok("settle refunds the requester for a rejected translation",
   s2.j?.ok === true && s2.j?.paid === "requester" && s2.j?.verdict === "rejected", `${s2.j?.verdict} → ${s2.j?.paid}`);
const reqAfter = await balanceOnceMoved(acc.address, reqBefore);
ok("the translator of a rejected translation received nothing", (await balance(loser)) === loserBefore, `${loserBefore} atto`);
ok("and the requester got the 20 GEN back (minus gas)", reqAfter - reqBefore > 19n * GEN,
   `+${(reqAfter - reqBefore) / GEN} GEN`);

// ---------- 3 · no certificate yet: nothing happens, nothing is lost ----------
const B3 = await deployFor("not-submitted-yet");
console.log("\nbounty for not-submitted-yet at", B3);
ok("would_pay says there is nothing to settle", String(await view(B3, "would_pay")).startsWith("nobody"), String(await view(B3, "would_pay")));
await send(B3, "fund", [], 5n * GEN);
const s3 = await send(B3, "settle", []);
ok("settle refuses while the register has no certificate under that name",
   s3.exec === "ERROR" && s3.msg.includes("no certificate named"), s3.msg.slice(0, 70));
const st = JSON.parse(String(await view(B3, "status")));
ok("the funds stay in the bounty for when it is", st.settled === false && st.pool === String(5n * GEN), `pool ${st.pool}`);

/* Value sent with a refused payable call is not returned by the chain — it is
   stranded — so the refusal path has to accept, refund and say why. */
const funderBefore = await balance(acc.address);
const late = await send(B1, "fund", [], 3n * GEN);
ok("funding a settled bounty is refused *and refunded*, not swallowed",
   late.j?.ok === false && String(late.j?.reason || "").includes("returned"), late.j?.reason);
ok("the refund is real", funderBefore - (await balance(acc.address)) < GEN, "net cost is gas only");

console.log(`\n${pass} passed, ${fail} failed`);
