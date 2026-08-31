# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""Faithful: a translation is certified only when it carries the same commitments.

The failure this exists to prevent is a bad translation being waved through, so
the model is never allowed to decide that. It reports three numbers and a set of
named defects; the contract applies the thresholds in ordinary code. A lenient
reader cannot approve anything on its own, because approving is not something it
is asked to do.

Three axes, because they fail differently and only two of them are dangerous:

  fidelity   do the numbers, dates, names, obligations and negations survive
  coverage   how much of the source is actually there
  fluency    does it read like the language, or like a machine

A translation can be ugly and safe, or fluent and wrong. Conflating those is how
the second one gets published. Fidelity and coverage block; fluency never does —
it is reported, and a faithful translation that reads badly is certified *with
reservations* rather than refused, because refusing it would send the translator
back to fix something that was not broken.

What validators must agree on
-----------------------------
**The verdict each of them derives on its own**, first and always. Numbers alone
would let a leader on 86 and a validator on 80 agree "within eight" while
standing on opposite sides of an 85 threshold.

Then only what is still load-bearing. On a rejection the two must name at least
one defect in common, but not the same list — "omission" and "untranslated" are
two names for one half-finished document. And a score below its floor is not
compared at all: both readers have already agreed the translation falls short,
and how far short is not a fact this contract acts on. Measured, before that
rule existed: an obviously-distorted translation drew 1 agree and 3 disagree
because one reader scored its fidelity 30 and another scored it 55, while both
called it rejected for the same reason.

The notes are free text and are never compared.
"""

import datetime
import json
import typing
from dataclasses import dataclass

from genlayer import *


ERROR_EXPECTED = "[EXPECTED]"   # a rule of this contract — deterministic, must match
ERROR_MODEL = "[MODEL]"         # the model returned something unusable — never agree

MAX_TEXT_CHARS = 4000           # each side; a 60k prompt crashes GenVM, 12k is safe
MIN_TEXT_CHARS = 20
MAX_NAME_CHARS = 60
MAX_LANG_CHARS = 40

# The gate, in code. The model never sees these.
FIDELITY_FLOOR = 85
COVERAGE_FLOOR = 85
FLUENCY_RESERVATION = 60        # below this it is flagged, never refused

# How far apart two independent readers may be and still be reading the same
# translation. Fluency is the loosest because it is the most subjective and the
# only one that cannot refuse anything.
TOL_FIDELITY = 8
TOL_COVERAGE = 8
TOL_FLUENCY = 20

CERTIFIED = "certified"
RESERVED = "certified_with_reservations"
REJECTED = "rejected"

# A closed set, so validators compare an exact set of names rather than prose.
# Each of these is a way a translation can be wrong that a fluent one still is.
_DEFECTS = {
    "number_changed":   "a number, amount, date or quantity differs from the source",
    "negation_flipped": "something the source affirms is denied, or the reverse",
    "name_changed":     "a name, place, product or identifier differs",
    "omission":         "a material part of the source is missing",
    "addition":         "the translation states something the source does not",
    "untranslated":     "substantial parts are left in the source language",
}

# The Discord communities this was built for. Their labels are not language
# names — "Latam", "Nigerian", "Bangladeshi" and "Hindi-Urdu" each need saying
# plainly, or two validators will read the same request differently.
_COMMUNITIES = [
    ("English", "English"),
    ("Chinese", "Chinese (Simplified)"),
    ("Hindi-Urdu", "Hindi and Urdu"),
    ("Indonesian", "Indonesian"),
    ("Latam", "Spanish (Latin America)"),
    ("Nigerian", "Nigerian English and Pidgin"),
    ("Russian", "Russian"),
    ("Korean", "Korean"),
    ("Turkish", "Turkish"),
    ("Ukranian", "Ukrainian"),
    ("Vietnamese", "Vietnamese"),
    ("Arabic", "Arabic"),
    ("Persian", "Persian (Farsi)"),
    ("German", "German"),
    ("Japanese", "Japanese"),
    ("Bangladeshi", "Bengali"),
]
_LANGUAGE_OF = {label: language for label, language in _COMMUNITIES}


def _fail(message: str) -> typing.NoReturn:
    """A refusal by a rule of this contract.

    `raise` rather than `assert`: a failed assert reaches the explorer as
    exit_code 1 with the reason discarded, which tells the caller nothing.
    """
    raise gl.vm.UserError(ERROR_EXPECTED + " " + message)


def _language_of(label: str) -> str:
    """The language a community label actually means.

    Any string is accepted, so this works for languages nobody thought of. The
    table only exists so that the sixteen it was built for are unambiguous.
    """
    return _LANGUAGE_OF.get(label, label)


def _score(raw: typing.Any, field: str) -> int:
    """One number out of the model, coerced hard and bounded."""
    if raw is None:
        raise gl.vm.UserError(ERROR_MODEL + " the model returned no '" + field + "'")
    try:
        value = int(round(float(str(raw).strip().rstrip("%"))))
    except Exception:
        raise gl.vm.UserError(ERROR_MODEL + " '" + field + "' is not a number: "
                              + str(raw)[:40])
    if value < 0:
        return 0
    if value > 100:
        return 100
    return value


def _defects(raw: typing.Any) -> list:
    """The named defects, filtered to the closed set and sorted.

    Anything outside the catalogue is dropped rather than refused: a model that
    invents a defect name has still told the truth about the ones it recognised,
    and the numbers carry the rest. Sorted so two validators that found the same
    things compare equal regardless of the order they listed them.
    """
    if raw is None:
        return []
    if isinstance(raw, str):
        raw = [part.strip() for part in raw.split(",")]
    if not isinstance(raw, list):
        raise gl.vm.UserError(ERROR_MODEL + " 'defects' is not a list")
    found = []
    for item in raw:
        if isinstance(item, dict):
            item = item.get("defect", item.get("name", item.get("code", "")))
        key = str(item).strip().lower().replace(" ", "_").replace("-", "_")
        if key in _DEFECTS and key not in found:
            found.append(key)
    found.sort()
    return found


def _read(answer: typing.Any) -> dict:
    """Pull the report out of whatever the model returned."""
    if not isinstance(answer, dict):
        raise gl.vm.UserError(ERROR_MODEL + " the model did not return an object")
    fidelity = answer.get("fidelity")
    if fidelity is None:
        fidelity = answer.get("accuracy")
    coverage = answer.get("coverage")
    if coverage is None:
        coverage = answer.get("completeness")
    fluency = answer.get("fluency")
    if fluency is None:
        fluency = answer.get("readability")
    notes = ""
    for key in ("notes", "note", "reason", "explanation"):
        value = answer.get(key)
        if isinstance(value, str) and value.strip():
            notes = value.strip()[:300]
            break
    return {
        "fidelity": _score(fidelity, "fidelity"),
        "coverage": _score(coverage, "coverage"),
        "fluency": _score(fluency, "fluency"),
        "defects": _defects(answer.get("defects", answer.get("issues"))),
        "notes": notes,
    }


def _verdict(report: dict) -> str:
    """The gate, in ordinary code. The model is never asked for this.

    A model that decides pass or fail can wave a bad translation through on its
    own. A model that reports numbers cannot, because the thresholds live here
    and every validator applies the same ones.
    """
    if report["defects"]:
        return REJECTED
    if report["fidelity"] < FIDELITY_FLOOR or report["coverage"] < COVERAGE_FLOOR:
        return REJECTED
    if report["fluency"] < FLUENCY_RESERVATION:
        return RESERVED
    return CERTIFIED


@allow_storage
@dataclass
class Certificate:
    """One judged translation, in scalars only.

    No `DynArray` field: constructing a storage dataclass that holds one kills
    the VM with `exit_code 1` and no message. Measured — see DECISIONS.md.
    """

    source_lang: str
    target_lang: str
    source_text: str
    target_text: str
    verdict: str
    fidelity: u32
    coverage: u32
    fluency: u32
    defects_json: str
    notes: str
    submitted_by: Address
    at: u64


class Faithful(gl.Contract):
    """Certificates that a translation says what the original said."""

    certificates: TreeMap[str, Certificate]
    names_in_order: DynArray[str]

    def __init__(self) -> None:
        pass

    @gl.public.write
    def certify(self, name: str, source_lang: str, target_lang: str,
                source_text: str, target_text: str) -> str:
        """Judge one translation. This is the only call that costs consensus."""
        name = name.strip()
        source_lang = source_lang.strip()
        target_lang = target_lang.strip()
        source_text = source_text.strip()
        target_text = target_text.strip()

        if not name or len(name) > MAX_NAME_CHARS:
            _fail("a certificate needs a name of 1 to " + str(MAX_NAME_CHARS) + " characters")
        if name in self.certificates:
            _fail("a certificate named " + name + " already exists")
        if not source_lang or not target_lang:
            _fail("name both languages")
        if len(source_lang) > MAX_LANG_CHARS or len(target_lang) > MAX_LANG_CHARS:
            _fail("a language name is longer than " + str(MAX_LANG_CHARS) + " characters")
        if source_lang == target_lang:
            _fail("the source and the target are the same language")
        for label, text in (("source", source_text), ("translation", target_text)):
            if len(text) < MIN_TEXT_CHARS:
                _fail("the " + label + " is too short to judge; give at least "
                      + str(MIN_TEXT_CHARS) + " characters")
            if len(text) > MAX_TEXT_CHARS:
                _fail("the " + label + " is longer than " + str(MAX_TEXT_CHARS)
                      + " characters; split it into parts")

        source_name = _language_of(source_lang)
        target_name = _language_of(target_lang)
        catalogue = "\n".join("- " + key + ": " + text for key, text in sorted(_DEFECTS.items()))

        task = (
            "You are checking a translation. Report what you find. Do NOT decide "
            "whether it passes — that is not your decision to make.\n\n"
            "SOURCE (" + source_name + ")\n" + source_text + "\n\n"
            "TRANSLATION (" + target_name + ")\n" + target_text + "\n\n"
            "Score three things from 0 to 100, and keep them separate:\n"
            "  fidelity  — do the numbers, dates, names, obligations, permissions "
            "and negations survive unchanged? A translation that reads beautifully "
            "but moves a number is not faithful.\n"
            "  coverage  — how much of the source is present at all? Missing "
            "sentences and untranslated blocks lower this, not fidelity.\n"
            "  fluency   — does it read like " + target_name + " written by a "
            "person? Judge only the writing. A clumsy but correct translation "
            "scores low here and high on fidelity.\n\n"
            "A numeral written in the target language's own script with the same "
            "value is NOT a change: 20 and \u06f2\u06f0 and \u0662\u0660 and "
            "\u4e8c\u5341 are the same number. Nor is a date written in the "
            "target's usual order. Only a different value is.\n\n"
            "Then list any defect from this closed set, and nothing else:\n"
            + catalogue + "\n\n"
            "Answer with ONLY this JSON:\n"
            "{\"fidelity\": 0-100, \"coverage\": 0-100, \"fluency\": 0-100, "
            "\"defects\": [names from the set above], "
            "\"notes\": \"at most 30 words naming the most serious thing you found\"}"
        )

        def leader_fn() -> typing.Any:
            # The nondeterministic call lives inside the closure. Outside it,
            # validators would not repeat the work and the comparison below
            # would be an answer agreeing with itself.
            answer = gl.nondet.exec_prompt(task, response_format="json")
            report = _read(answer)
            report["verdict"] = _verdict(report)
            return report

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                # Every rule of this contract is checked before the closures run,
                # so the only failure reachable in here is the model returning
                # something that is not a report. Agreeing on that would store a
                # judgement nobody made.
                return False

            mine = leader_fn()
            theirs = leaders_res.calldata
            if not isinstance(theirs, dict):
                return False

            # The verdict first, because it is the thing that will be obeyed.
            # Two readers eight points apart either side of a threshold have not
            # agreed about anything that matters.
            if str(theirs.get("verdict")) != str(mine["verdict"]):
                return False

            their_defects = sorted(str(d) for d in (theirs.get("defects") or []))
            my_defects = sorted(mine["defects"])

            # Two readers who both refuse a translation should agree about at
            # least one thing that is wrong with it. They need not produce the
            # same list: "omission" and "untranslated" are two names for one
            # half-finished document, and demanding both from both of them
            # refuses consensus over vocabulary.
            if str(mine["verdict"]) == REJECTED:
                if bool(their_defects) != bool(my_defects):
                    return False
                if my_defects and not set(their_defects) & set(my_defects):
                    return False
            elif their_defects != my_defects:
                # A passing verdict means neither found anything, so the sets are
                # empty on both sides. If they are not, something is inconsistent.
                return False

            # The scores are compared only where they are still load-bearing.
            # Below a floor both readers have already agreed the translation
            # falls short, and how far short is not a fact this contract acts on
            # — refusing consensus over 30 against 55 would refuse it over a
            # number nobody reads.
            for field, tolerance, floor in (("fidelity", TOL_FIDELITY, FIDELITY_FLOOR),
                                            ("coverage", TOL_COVERAGE, COVERAGE_FLOOR),
                                            ("fluency", TOL_FLUENCY, FLUENCY_RESERVATION)):
                try:
                    theirs_value = int(theirs.get(field))
                except Exception:
                    return False
                mine_value = int(mine[field])
                if theirs_value < floor and mine_value < floor:
                    continue
                if abs(theirs_value - mine_value) > tolerance:
                    return False

            # The notes are deliberately not compared.
            return True

        judged = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        defects = [str(d) for d in judged.get("defects", [])]
        self.certificates[name] = Certificate(
            source_lang=source_lang,
            target_lang=target_lang,
            source_text=source_text,
            target_text=target_text,
            verdict=str(judged.get("verdict", REJECTED)),
            fidelity=u32(int(judged.get("fidelity", 0))),
            coverage=u32(int(judged.get("coverage", 0))),
            fluency=u32(int(judged.get("fluency", 0))),
            defects_json=json.dumps(defects),
            notes=str(judged.get("notes", ""))[:300],
            submitted_by=gl.message.sender_address,
            at=u64(int(datetime.datetime.now(datetime.timezone.utc).timestamp())),
        )
        self.names_in_order.append(name)
        return json.dumps({
            "ok": True,
            "name": name,
            "verdict": str(judged.get("verdict", REJECTED)),
            "fidelity": int(judged.get("fidelity", 0)),
            "coverage": int(judged.get("coverage", 0)),
            "fluency": int(judged.get("fluency", 0)),
            "defects": defects,
            "notes": str(judged.get("notes", ""))[:300],
        })

    # ---------------------------------------------------------------- reading

    @gl.public.view
    def is_certified(self, name: str) -> bool:
        """The gate. Free, deterministic, and callable by another contract.

        Reservations still certify: a faithful translation that reads badly is
        safe to publish, and refusing it would be refusing the wrong thing.
        """
        if name not in self.certificates:
            return False
        return str(self.certificates[name].verdict) in (CERTIFIED, RESERVED)

    @gl.public.view
    def certificate(self, name: str) -> str:
        if name not in self.certificates:
            return json.dumps({"error": "no certificate named " + name[:MAX_NAME_CHARS]})
        entry = self.certificates[name]
        return json.dumps({
            "name": name,
            "source_lang": str(entry.source_lang),
            "target_lang": str(entry.target_lang),
            "verdict": str(entry.verdict),
            "fidelity": int(entry.fidelity),
            "coverage": int(entry.coverage),
            "fluency": int(entry.fluency),
            "defects": json.loads(str(entry.defects_json)),
            "notes": str(entry.notes),
            "submitted_by": entry.submitted_by.as_hex,
            "at": int(entry.at),
        })

    @gl.public.view
    def texts(self, name: str) -> str:
        """What was judged, so a reader can check the certificate themselves."""
        if name not in self.certificates:
            return json.dumps({"error": "no certificate named " + name[:MAX_NAME_CHARS]})
        entry = self.certificates[name]
        return json.dumps({
            "source": str(entry.source_text),
            "translation": str(entry.target_text),
        })

    @gl.public.view
    def names(self) -> str:
        return json.dumps([str(name) for name in self.names_in_order])

    @gl.public.view
    def communities(self) -> str:
        """The Discord communities, and the language each label actually means."""
        return json.dumps([{"community": label, "language": language}
                           for label, language in _COMMUNITIES])

    @gl.public.view
    def rules(self) -> str:
        """The gate and the agreement rule, readable before anybody relies on them."""
        return json.dumps({
            "gate": {
                "rejected_if": "any defect is named, or fidelity < " + str(FIDELITY_FLOOR)
                               + ", or coverage < " + str(COVERAGE_FLOOR),
                "reserved_if": "it passes but fluency < " + str(FLUENCY_RESERVATION),
                "decided_by": "this contract, in ordinary code — the model is never "
                              "asked whether a translation passes",
            },
            "agreement": {
                "verdict": "the verdict each validator derives on its own must match",
                "defects": "on a rejection, the sets must share at least one defect; "
                           "on a pass they are empty on both sides",
                "scores": "compared within tolerance only above the floor — below it "
                          "both readers have already agreed it falls short, and how "
                          "far short is not acted on",
                "tolerance": {"fidelity": TOL_FIDELITY, "coverage": TOL_COVERAGE,
                              "fluency": TOL_FLUENCY},
                "notes": "never compared",
            },
            "defects": _DEFECTS,
            "limits": {"text_chars": [MIN_TEXT_CHARS, MAX_TEXT_CHARS]},
        })
