/* Take a snapshot of a Faithful register for the site's fallback: names, certificates and manifests,
 * as the chain returns them, with the time it was taken.
 *   REGISTER=0x… node tools/snapshot.mjs > data/snapshot.json
 */
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
const REGISTER = process.env.REGISTER; if (!REGISTER) { console.error("set REGISTER=0x…"); process.exit(2); }
const rd = createClient({ chain: studionet });
const view = async (fn, args = []) => rd.readContract({ address: REGISTER, functionName: fn, args });
const names = JSON.parse(String(await view("names")));
const certificates = {};
for (const n of names) certificates[n] = JSON.parse(String(await view("certificate", [n])));
const manifests = JSON.parse(String(await view("manifests_list")));
const documents = {};
for (const m of manifests) documents[m.manifest_hash] = JSON.parse(String(await view("document", [m.manifest_hash])));
console.log(JSON.stringify({ register: REGISTER, taken_at: new Date().toISOString().slice(0, 19) + "Z", names, certificates, manifests, documents }, null, 1));
