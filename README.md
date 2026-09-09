# Faithful

**A translation is certified only when it carries the same commitments.**

Three axes, judged separately because they fail differently. The model reports
what it finds; it is never asked whether the translation passes. That decision is
made in code, with thresholds every validator applies to its own reading.

```
certify("acme-fa", "English", "Persian", source, translation)

  → every validator reads both texts and scores three things independently
  → each derives the verdict from the same thresholds, in ordinary code
  → they settle only if they reached the same verdict
  → is_certified("acme-fa")   free, deterministic, readable by another contract
```

## Demo

Seventy-six seconds, no cuts: connect, load the register, paste the pair, sign, watch the
validators vote, read the certificate on the explorer.

[![Faithful demo — click to play](assets/demo-poster.png)](https://github.com/hossein6191/faithful/blob/main/assets/demo.mp4)

*Click the picture to play it on GitHub, or [download the file](https://github.com/hossein6191/faithful/raw/main/assets/demo.mp4).*

## The failure this exists to prevent

A bad translation being waved through.

That happens when a model is asked to decide, because a lenient reader can
approve on its own. So it is not asked. The prompt says so outright — *"Report
what you find. Do NOT decide whether it passes — that is not your decision to
make."* — and the gate lives in `_verdict()`, in Python, where anybody can read
it and every validator applies the same numbers.

## Three axes, and only two of them may refuse

| axis | what it asks | blocks |
|---|---|---|
| **fidelity** | do the numbers, dates, names, obligations and negations survive | below 85 |
| **coverage** | how much of the source is present at all | below 85 |
| **fluency** | does it read like the language, or like a machine | **never** |

A translation can be ugly and safe, or fluent and wrong. Collapsing those into
one score is how the second one gets published: a fluent mistranslation scores
well on the thing readers notice and badly on the thing that matters.

So a faithful translation that reads poorly is `certified_with_reservations`
rather than refused. Refusing it would send the translator back to fix something
that was not broken.

Coverage is separate for the same reason. A half-translated document is not
inaccurate — every word it did translate may be perfect. It is incomplete, which
is a different defect with a different fix.

## Four certificates, on chain

One register, four translations of the same English sentence into Persian,
signed from one wallet. Every number below is read off the contract, not
reported here from a run somewhere else.

**Register:** [`0x55ACAafdDbD6D62156e59c0C3DFb2Db2C9744e15`](https://explorer-studio.genlayer.com/address/0x55ACAafdDbD6D62156e59c0C3DFb2Db2C9744e15)
· GenLayer Studio

> Ferdowsi completed the Shahnameh around 1010 after roughly three decades of work, in some fifty thousand couplets.

| certificate | verdict | fid | cov | flu | `is_certified` | votes | tx |
|---|---|---|---|---|---|---|---|
| `faithful-and-natural` | certified | 95 | 100 | 95 | **true** | 3–0 | [↗](https://explorer-studio.genlayer.com/tx/0x8dbb767d0967f067295875c92a249b29deea09feb6975b4587329278d940f144) |
| `faithful-but-clumsy` | certified **with reservations** | 100 | 100 | **35** | **true** | 3–1 | [↗](https://explorer-studio.genlayer.com/tx/0x7c7782d53158d6959046948b87e963105c0dc9d643668bb17261f79b8a428d04) |
| `numbers-moved` | rejected · `number_changed` | **10** | 95 | 92 | false | 3–0 | [↗](https://explorer-studio.genlayer.com/tx/0x3be94fee5395f57ade86d7cfddbeb06cdc4d9c890dc18c484817c36e610a608e) |
| `half-translated` | rejected · `omission` | 100 | **50** | 100 | false | 3–1 | [↗](https://explorer-studio.genlayer.com/tx/0xe72a9f0970b75a767d5ce07783f1711a2782a1fef556683eb7e8e6035ffc3860) |

**`faithful-but-clumsy` is the one that matters.** Fidelity 100, coverage 100,
fluency **35** — and it certifies. The leader's own note: *"word-for-word and
follows English syntax rather than Persian grammar, resulting in a very
unnatural and robotic sentence structure."* Every commitment in the sentence
survived, so the contract does not refuse it. A checker that collapsed these
into one score would have thrown away a translation that was completely correct.

**`half-translated` is its mirror.** Fidelity 100 and fluency 100 — everything it
does say is accurate and reads well — and it is refused anyway, on coverage 50,
because half the sentence is not there. *"omits the duration of the work (three
decades) and the volume of the work (fifty thousand couplets)."* One number
covering both cases would have to call these two documents similar. They are
opposites.

**`numbers-moved` is what the whole thing is for.** 1010 became 1210, three
decades became three years, fifty thousand couplets became five thousand.
Fluency 92: it reads perfectly. That is exactly why fluency cannot be allowed to
decide anything.

Read any of it back without spending a transaction:

```
gl.get_contract_at(addr).view().is_certified("faithful-but-clumsy")   → true
gl.get_contract_at(addr).view().certificate("half-translated")        → the scores and defects
gl.get_contract_at(addr).view().texts("numbers-moved")                → the exact pair judged
```

## What validators must agree on

The verdict each of them derives on its own, first and always. Numbers alone
would let a leader on 86 and a validator on 80 agree "within eight" while
standing on opposite sides of an 85 threshold.

Then only what is still load-bearing:

- **On a rejection**, the two must name at least one defect in common — not the
  same list. `omission` and `untranslated` are two names for one half-finished
  document.
- **A score below its floor is not compared at all.** Both readers have already
  agreed the translation falls short there, and how far short is not a fact this
  contract acts on.

This is not a preference. The first version compared everything exactly and an
obviously-distorted translation drew **1 agree, 3 disagree** — every reader
called it rejected for the same reason, and they split over whether its fidelity
was 30 or 55. Same inputs, same model, rule narrowed: **3 agree, 0 disagree.**

The notes are free text and are never compared.

## The six defects

A closed set, so validators compare an exact vocabulary rather than prose:

```
number_changed     a number, amount, date or quantity differs from the source
negation_flipped   something the source affirms is denied, or the reverse
name_changed       a name, place, product or identifier differs
omission           a material part of the source is missing
addition           the translation states something the source does not
untranslated       substantial parts are left in the source language
```

## Built for fifteen communities and English, open to any language

`communities()` publishes the Discord communities **and the language each label
actually means** — because "Latam", "Nigerian", "Bangladeshi" and "Hindi-Urdu"
are community names, not languages, and two validators handed `"Latam"` would
otherwise be free to read it differently.

```
English · Chinese · Hindi-Urdu · Indonesian · Latam · Nigerian · Russian · Korean
Turkish · Ukranian · Vietnamese · Arabic · Persian · German · Japanese · Bangladeshi
```

Fifteen of those have their own channel in the GenLayer Discord. English is the
sixteenth, as the language every passage is written in.

Any other language string is passed through untouched, so this works for the
ones nobody has added yet.

**Numerals in another script are the same number.** Persian ۲۰, Arabic ٢٠,
Bengali ২০ and Chinese 二十 are twenty. Half the communities above write numbers
that way, and a checker that read them as different values would refuse most
correct translations — reporting `number_changed`, which is exactly the defect a
reader would trust. The prompt says so, and the test fixtures are written in
Persian numerals so the assertion is real rather than decorative.

## What it is for

- **Community translations of anything that carries obligations** — terms,
  announcements, governance proposals, safety notices — where a moved number is
  a different promise.
- **A gate before publishing**: `is_certified(name)` is a view, so another
  contract reads it with `gl.get_contract_at(addr).view().is_certified(name)`
  and pays nothing for consensus. `contracts/fixtures/bounty.py` is that
  contract, below.
- **A record that survives the argument.** `texts(name)` publishes exactly what
  was judged, so a certificate can be checked rather than trusted.

## Bound to what was judged, not to a name

A certificate's name is a label anybody could have typed. Its identity is what
the validators actually read:

```
source_hash = sha256(source text as stored)
target_hash = sha256(translation as stored)
pair_hash   = sha256("faithful-pair", source language, target language, source_hash, target_hash)
```

Every certificate carries all three, `is_certified_hash(pair_hash)` is the gate
by identity, and the same pair is never judged twice: a second `certify` over
identical bytes is refused with the name of the certificate that already holds
them — a certificate is not asked for until the answer suits.

**Publishers.** Whoever owns a source can put its hash on the record first,
under its own address, with `publish(source_hash, title)`. The first publisher
keeps the hash; another account cannot take it over. A certificate judged later
over that source carries the publisher's address, so a consumer can ask not only
"is this translation faithful to these bytes" but "and are these bytes the
publisher's".

**Documents in parts.** A long text is judged in parts — the contract caps each
side at 4,000 characters — and a document is a `manifest(name, [pair_hash, …])`:
an ordered list of the parts' pair hashes. Nothing about the document is stored
as a verdict; `is_document_certified(manifest_hash)` reads every part's
certificate at the moment it is asked and is true only when all of them passed.
`document()` shows each part's live state, including parts not judged yet.

The site computes the same hashes in the browser, prints them next to every
certificate, and verifies a pair hash against the register with one free read.

## The consequence: a bounty that can only pay a certified translator

A contract that records a verdict and stops has produced an opinion.
`contracts/fixtures/bounty.py` is the other half: a requester opens a bounty
for one **pair hash** — or one **document manifest** — in one register,
optionally naming the publisher the source must have been published by, funds
it, and binds the translator's wallet. `settle()` asks the register — through
an ordinary synchronous view, no model, no consensus — what it already decided,
and obeys it once:

```
certified, with or without reservations, by the named publisher   → the translator is paid
rejected, or published by somebody else                           → the requester is refunded
nothing under that hash yet                                       → nothing happens; try later
```

There is no path through it that pays for a translation the validators
refused, and `would_pay()` says what `settle()` will do before anybody signs.

`tests/on_chain/bounty.mjs` runs it against the register above: a bounty on the
clumsy-but-faithful pair pays its translator — reservations still certify — a
bounty on the moved-numbers pair sends the money back to the requester, a bounty
naming the wrong publisher pays nobody but the requester, a document bounty on
the two-part manifest pays the translator, and a bounty on a hash that has no
certificate refuses to settle and keeps the funds. It also proves the refusal
path refunds rather than strands: value sent with a refused payable call is not
returned by the chain, so the contract returns it itself and says why.

## Reading a certificate

```
certify(name, source_lang, target_lang, source, translation)   the one call that costs consensus
publish(source_hash, title)                                    a publisher's address on the record, first come
manifest(name, [pair_hash, …])                                 a document judged in parts

is_certified(name) -> bool             the gate; reservations still certify
is_certified_hash(pair_hash) -> bool   the gate by identity
is_document_certified(manifest_hash)   true only when every part passed
certificate(name) · certificate_hash(pair_hash)
                                       verdict, three scores, defects, submitter, hashes, publisher
texts(name)                            the exact pair that was judged
document(manifest_hash)                every part's live state
publisher_of(source_hash)              who published it, and under what title
communities()                          the sixteen labels and the language each means
rules()                                the gate, the agreement rule, and the bindings
names() · manifests_list()             what this register holds
```

`rules()` publishes the thresholds and the comparison, so nobody has to read the
source to know what a certificate means. The site does not print it — a wall of
raw JSON is not something anybody reads on the way past — but it does call it:
an address that cannot answer `rules()` is refused as a register with a free
read, rather than costing a signature to find out. Studio's RPC sometimes
answers a read with *Contract not found* for an address the explorer shows
perfectly well, for a minute at a time; reads therefore retry eight times over
about forty seconds, and if the demo register still cannot be read the site
shows a snapshot of it taken from the chain (`data/snapshot.json`, made by
`tools/snapshot.mjs`), labelled as such, with every row linking to the explorer.

## The site

Live at **<https://faithful-one.vercel.app>**. Two modes.

**Guided** picks your community and hands you one of ten short English passages
about that community's own history — no repeats until you have seen all ten.
`texts.js` holds all 160. Here **the source language cannot be set**: it is
English, fixed by the passage, and the box is read-only. That is not a
simplification. A label a reader can change independently of the text will
eventually disagree with it, and this page was built after a round came back
`UNDETERMINED` for exactly that reason — a target of Hindi-Urdu selected over an
English-to-Persian pair, which the leader called "fluent Urdu" and the
validators would not.

**Any pair** takes both texts and both languages from you, which is how the four
certificates above were made. The protection there is different: the language is
still chosen from the list rather than typed, so the label always names a real
language, and a script check warns before signing when the text does not look
like the language it is filed under.

**Only those sixteen are supported, and the page says so rather than letting
somebody find out after a signature.** Choosing anything else is allowed —
the contract takes any language string — but there are no passages for it, no
marker on the globe, and the page states all of that the moment the language is
picked, in either mode. Keeping the working set that size is what keeps the page
light; the other sixty-one are still searchable, and are labelled in the list as
having neither.

**Which key signs is the reader's choice, not the page's.** Every wallet in the
browser announces itself under EIP-6963, so pressing Connect lists them by name
and icon rather than picking one — the old code took Rabby if it saw it and the
first announcement otherwise, which is a silent decision about whose key signs.
Connect again to switch, Disconnect to drop it. The page also follows
`accountsChanged`, because an address printed here that is not the one signing
is worse than no address at all. Disconnecting leaves the register loaded:
reading it is free and needs no wallet, so it takes away signing and nothing
else.

The language list is searchable by the names people actually type. "Farsi",
"Mandarin", "Bengali", "Naija" and "Mexico" all find the right community, which
they did not until every entry was given its other names and the countries it is
spoken in.

For the mismatches a script check can still catch, the page warns before
anything is signed: paste Arabic script under a German label and it says so, and
says what will happen if you sign anyway.

Both boxes carry `dir="auto"`, so the browser takes writing direction from the
text itself rather than from a list of languages somebody remembered to update —
Persian, Arabic and Urdu lay out right-to-left without being named anywhere.

Scores are coloured on a scale rather than by a label: green at the top, through
amber, to red — so 42 and 85 do not look alike.

## Tests

```
pip install -r requirements-dev.txt && pytest tests/ -q     17 tests, no network, under a second
python tools/mutate.py                                       15 defences removed in turn, each killed by a named test
genvm-lint check contracts/faithful.py

npm ci                                                       genlayer-js 1.1.8 and viem 2.56.3, from the lockfile
node tests/on_chain/smoke.mjs                                the four cases, publishers, hashes and manifests, against real validators
REGISTER=0x… node tests/on_chain/bounty.mjs                  the consequence, against the register above
```

The offline suite covers the gate, the parsing, the prompt boundary, the
bindings, the clock and two static rules over the source: every write records
its sender, and everything interpolated into the prompt is a `_fence()` call or
a name the contract owns. `tests/MUTATIONS.md` is generated, and the generator
refuses to write it if any mutant survives.

The four are the whole argument: a faithful translation certifies, a moved price
is rejected and named, a half-translated document is caught by coverage rather
than fidelity, and **a clumsy but correct translation is not rejected**. The last
one is the point — a checker that refuses ugly-but-safe work is as wrong as one
that certifies fluent-but-false work.

`DECISIONS.md` records what was measured, including the agreement rule that had
to be narrowed and the run that forced it.

## Credits

The globe draws [Natural Earth](https://www.naturalearthdata.com/) 110m land
polygons, public domain, kept in `data/` rather than fetched from a third-party
URL at page load. Projection by [d3-geo](https://github.com/d3/d3-geo).

---

MIT licensed.
