# Decisions, and what was measured rather than assumed

Everything below was checked on the GenLayer Studio network. Where something is
untested it says so.

## The model is never asked whether it passes

This is the whole shape of the contract, and it exists because of one failure
mode: a lenient reader waving a bad translation through.

The prompt says it outright — *"Report what you find. Do NOT decide whether it
passes — that is not your decision to make."* The model returns three scores and
a set of named defects. `_verdict()` applies the thresholds in ordinary Python
afterwards. There is no path by which a model approves anything, because
approving is not something it is asked to do, and every validator applies the
same numbers to its own report.

## Three axes, and only two of them may refuse

| axis | what it asks | blocks |
|---|---|---|
| fidelity | do the numbers, dates, names, obligations and negations survive | yes, below 85 |
| coverage | how much of the source is present at all | yes, below 85 |
| fluency | does it read like the language, or like a machine | **never** |

A translation can be ugly and safe, or fluent and wrong. Collapsing those into
one score is how the second one gets published: a fluent mistranslation scores
well on the thing most readers notice and badly on the thing that matters.

So a faithful translation that reads poorly is `certified_with_reservations`
rather than refused. Refusing it would send the translator back to fix something
that was not broken, and the people relying on the certificate care whether the
commitments survived, not whether the prose sings.

Coverage is separate from fidelity for the same reason. A half-translated
document is not *inaccurate* — every word it did translate may be perfect. It is
incomplete, which is a different defect with a different fix.

## The agreement rule, and the run that rewrote it

The first version compared the defect sets exactly and all three scores within
±8. It failed, and the failure is worth keeping:

```
a translation with the price moved   1 agree, 3 disagree     rejected · fid 30 · ["number_changed"]
a half-translated document           0 agree, 3 disagree     rejected · cov 40 · ["omission","untranslated"]
```

In both cases every reader agreed about the outcome and about what was wrong.
They disagreed about **how badly** — one scored the distorted translation's
fidelity 30, another 55. The contract does not act on that number. Refusing
consensus over it refuses consensus over nothing.

The rule now compares what is load-bearing and nothing else:

1. **The verdict each validator derives on its own must match.** Numbers alone
   would let a leader on 86 and a validator on 80 agree "within eight" while
   standing on opposite sides of an 85 threshold.
2. **On a rejection, the defect sets must share at least one name** — not be
   identical. `omission` and `untranslated` are two names for one half-finished
   document, and demanding both from both readers refuses consensus over
   vocabulary. On a pass both sets are empty by construction.
3. **A score below its floor is not compared at all.** Both readers have already
   agreed the translation falls short there; the depth is commentary.

Same inputs, same model, only the rule changed:

```
before   1 agree, 3 disagree
after    3 agree, 0 disagree     rejected · fid 42 · ["number_changed"]
```

## Numerals in another script are the same number

Half the communities this was built for write numbers in their own script.
Persian ۲۰, Arabic ٢٠, Bengali ২০ and Chinese 二十 are twenty, and a checker that
reads them as different values would refuse most correct translations in those
languages — silently, and with `number_changed` as the reason, which is exactly
the defect a reader would trust.

The prompt says so explicitly, and the test fixtures are written in Persian
numerals on purpose so that the assertion is real:

```
PASS  Persian numerals are not read as changed numbers   defects []
```

This is not a general translation-checking concern. It is specific to this set
of languages, and it would have been invisible if the fixtures had been written
in Latin digits for convenience.

## A community label is not a language name

"Latam", "Nigerian", "Bangladeshi" and "Hindi-Urdu" are Discord community names.
Two validators handed `target_lang = "Latam"` may reasonably read it as Spanish,
as Portuguese, or as nothing in particular, and disagree for a reason that has
nothing to do with the translation.

`_LANGUAGE_OF` resolves each label to the language it means, and
`communities()` publishes both so the site and the contract cannot drift apart.
Any other string is passed through untouched, so the contract works for the
languages nobody has added yet.

## Storage holds no DynArray inside a dataclass

Constructing a `@allow_storage @dataclass` that has a `DynArray` field kills the
VM with `exit_code 1` and no message at all. Measured separately on a throwaway
probe contract, not on the register. `Certificate` therefore keeps its
defect list as a JSON string.

`exit_code 1` with an empty message is the shape of a VM death rather than a
refusal, and the reason never reaches the explorer — which is why every refusal
in this contract raises `gl.vm.UserError` with text.

## Errors are classified

`[EXPECTED]` is a rule of this contract and is checked before the closures run,
so it never reaches a validator comparison. `[MODEL]` is the model returning
something that is not a report — a missing score, a non-numeric one — and
validators must never agree on it, because agreeing would store a judgement
nobody made.

A defect name outside the closed catalogue is dropped rather than raised. A
model that invents a name has still told the truth about the ones it recognised,
and the scores carry the rest.

## What is not covered

**A translation written to steer the reader.** The text being judged reaches the
model, so a translation containing instructions aimed at the checker is a real
avenue. Every validator judges independently, so steering has to work on all of
them at once to change the stored verdict, and failing to steer all of them
splits the vote and stores nothing — but it is not defended against beyond that.

**Long documents.** Each side is capped at 4000 characters, because a 60k-character
prompt crashes GenVM outright and 12k is the largest that has been seen to work.
A page of terms fits; a contract does not. Splitting into parts is the intended
answer and the cap says so in its refusal.

**Dialect and register.** The contract asks whether the commitments survived, not
whether the translation suits its audience. A technically faithful translation
into the wrong register will certify.
