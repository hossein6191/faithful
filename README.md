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

## Built for sixteen communities, open to any language

`communities()` publishes the Discord communities **and the language each label
actually means** — because "Latam", "Nigerian", "Bangladeshi" and "Hindi-Urdu"
are community names, not languages, and two validators handed `"Latam"` would
otherwise be free to read it differently.

```
English · Chinese · Hindi-Urdu · Indonesian · Latam · Nigerian · Russian · Korean
Turkish · Ukranian · Vietnamese · Arabic · Persian · German · Japanese · Bangladeshi
```

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
  and pays nothing for consensus.
- **A record that survives the argument.** `texts(name)` publishes exactly what
  was judged, so a certificate can be checked rather than trusted.

## Reading a certificate

```
certify(name, source_lang, target_lang, source, translation)   the one call that costs consensus

is_certified(name) -> bool    the gate; reservations still certify
certificate(name)             verdict, three scores, defects, who submitted it
texts(name)                   the exact pair that was judged
communities()                 the sixteen labels and the language each means
rules()                       the gate and the agreement rule
names()                       what this register holds
```

`rules()` publishes the thresholds and the comparison, so nobody has to read the
source to know what a certificate means.

## The site

Pick your community and it hands you one of ten short English passages about
that community's own history — no repeats until you have seen all ten. You
translate it, and both texts are submitted together. `texts.js` holds all 160.

**The source language is not something you can set.** It is English, fixed by
the passage, and the box is read-only. That is not a simplification: a label a
reader can change independently of the text will eventually disagree with it,
and this page was built after a round came back `UNDETERMINED` for exactly that
reason — a target of Hindi-Urdu selected over an English-to-Persian pair, which
the leader called "fluent Urdu" and the validators would not.

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
tests/on_chain/smoke.mjs   the four cases, against real validators
```

The four are the whole argument: a faithful translation certifies, a moved price
is rejected and named, a half-translated document is caught by coverage rather
than fidelity, and **a clumsy but correct translation is not rejected**. The last
one is the point — a checker that refuses ugly-but-safe work is as wrong as one
that certifies fluent-but-false work.

`DECISIONS.md` records what was measured, including the agreement rule that had
to be narrowed and the run that forced it.

---

MIT licensed.
