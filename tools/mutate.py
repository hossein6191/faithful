"""Remove each defence of contracts/faithful.py in turn and record the test that killed it.

    python tools/mutate.py        # writes tests/MUTATIONS.md; exit 1 if any mutant survives
"""
import os, pathlib, re, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = (ROOT / "contracts" / "faithful.py").read_text(encoding="utf-8")
PYTEST = [sys.executable, "-m", "pytest", "-q", "-x", "--no-header", "-p", "no:cacheprovider", str(ROOT / "tests" / "test_pure.py")]

MUTATIONS = [
    ("fence does nothing", 'return str(raw).replace("<", "(").replace(">", ")")', 'return str(raw)'),
    ("the source goes in unfenced", '"<<<SOURCE>>>\\n" + _fence(source_text) + "\\n<<<END SOURCE>>>\\n\\n"', '"<<<SOURCE>>>\\n" + source_text + "\\n<<<END SOURCE>>>\\n\\n"'),
    ("a fidelity below the floor still certifies", '    if report["fidelity"] < FIDELITY_FLOOR or report["coverage"] < COVERAGE_FLOOR:\n        return REJECTED\n', ''),
    ("a named defect no longer refuses", '    if report["defects"]:\n        return REJECTED\n', ''),
    ("low fluency refuses", '    if report["fluency"] < FLUENCY_RESERVATION:\n        return RESERVED\n', '    if report["fluency"] < FLUENCY_RESERVATION:\n        return REJECTED\n'),
    ("defects outside the catalogue are kept", '        if key in _DEFECTS and key not in found:\n            found.append(key)\n', '        if key not in found:\n            found.append(key)\n'),
    ("the same pair can be judged twice", '        if pair_hash in self.by_hash:\n            _fail("this exact source and translation are already certified as " + str(self.by_hash[pair_hash])\n                  + "; a certificate is not asked for twice")\n', ''),
    ("the pair hash ignores the languages", 'return _sha("faithful-pair\\n" + source_lang + "\\n" + target_lang + "\\n" + source_hash + "\\n" + target_hash)', 'return _sha("faithful-pair\\n" + source_hash + "\\n" + target_hash)'),
    ("any host names any publisher", '    wanted = publisher_hex.lower()\n    return any(isinstance(item, str) and item.strip().lower() == wanted for item in listed)', '    return True'),
    ("a no from the validators still binds", '        if str(answer.get("bound")) != "yes":\n            _fail(domain + " does not name " + sender_hex + " in " + WELL_KNOWN + ": " + str(answer.get("why", "")))\n', ''),
    ("an uppercase host is a domain", '    if domain != domain.lower():\n        return False\n', ''),
    ("the twenty-first publisher loses its row", '        self.publications[_pub_key(sender_hex, source_hash)] = Publication(\n            publisher=sender, source_hash=source_hash, title=title, at=u64(max(0, _instant_seconds(_now()))),\n        )\n        listed = json.loads', '        listed = json.loads'),
    ("a dotted-quad IP literal is a host", '    if domain.split(".")[-1].isdigit():\n        return False', ''),
    ("a document past the cap is still read", 'data = json.loads(text[:MAX_BODY_CHARS])', 'data = json.loads(text)'),
    ("a longer string containing the address counts as the address", 'item.strip().lower() == wanted for item in listed', 'wanted in item.strip().lower() for item in listed'),
    ("a missing document binds", '            if status == 404:\n                return {"bound": "no", "why": "no document at " + WELL_KNOWN}\n', '            if status == 404:\n                return {"bound": "yes", "why": ""}\n'),
    ("a 4xx from the host is not a comparable error", '            if 400 <= status < 500:\n                raise gl.vm.UserError(ERROR_EXTERNAL + " " + domain + " answered " + str(status))\n', ''),
    ("a host that cannot be fetched is not transient", '            except Exception:\n                raise gl.vm.UserError(ERROR_TRANSIENT + " " + domain + " could not be fetched")\n', '            except Exception:\n                raise\n'),
    ("validators agree with any leader", '            return str(theirs.get("bound")) == str(mine["bound"])', '            return True'),
    ("a leader's failure is agreed with blindly", '        if mine.startswith(ERROR_EXPECTED) or mine.startswith(ERROR_EXTERNAL):\n            return mine == leader_msg\n', '        if mine.startswith(ERROR_EXPECTED) or mine.startswith(ERROR_EXTERNAL):\n            return True\n'),
    ("is_published_by ignores the address", '        return _pub_key(publisher.strip(), source_hash.strip().lower()) in self.publications', '        return source_hash.strip().lower() in self.publishers_by_hash'),
    ("is_bound accepts any host", '        return bool(domain.strip()) and self._domain_of(publisher.strip()) == domain.strip().lower()', '        return bool(self._domain_of(publisher.strip()))'),
    ("a manifest with a missing part is certified", '            if part not in self.by_hash:\n                return False\n', '            if part not in self.by_hash:\n                continue\n'),
    ("a manifest with a rejected part is certified", '            if str(self.certificates[str(self.by_hash[part])].verdict) not in (CERTIFIED, RESERVED):\n                return False\n', ''),
    ("a manifest may repeat a part", '            if part in parts:\n                _fail("a part appears twice: " + part[:12] + "…")\n', ''),
    ("a text of one word is judged", '            if len(text) < MIN_TEXT_CHARS:', '            if False:'),
    ("the same language on both sides is judged", '        if source_lang == target_lang:\n            _fail("the source and the target are the same language")\n', ''),
    ("the certificate time is not the message clock", '            at=u64(max(0, _instant_seconds(_now()))),\n            source_hash=source_hash,', '            at=u64(0),\n            source_hash=source_hash,'),
]


def _fresh_env(**extra):
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1"); env.update(extra); return env


def run(mutant: pathlib.Path) -> str:
    out = subprocess.run(PYTEST, env=_fresh_env(FAITHFUL_SOURCE=str(mutant)), capture_output=True, text=True, cwd=ROOT)
    if out.returncode == 0:
        return ""
    text = out.stdout + out.stderr
    if "error during collection" in text or "IndentationError" in text or "SyntaxError" in text:
        raise RuntimeError("the mutant does not even import; that is a broken anchor, not a killed defence:\n" + text[-600:])
    m = re.search(r"FAILED tests/test_pure\.py::(\S+)", text)
    if not m:
        raise RuntimeError("a test failed but its name could not be read:\n" + text[-800:])
    return m.group(1)


def main() -> int:
    baseline = subprocess.run(PYTEST, env=_fresh_env(), capture_output=True, text=True, cwd=ROOT)
    if baseline.returncode != 0:
        print("the unmutated suite does not pass; a mutation table over a failing suite proves nothing"); print((baseline.stdout + baseline.stderr)[-600:]); return 3
    rows, escaped = [], []
    with tempfile.TemporaryDirectory() as tmp:
        for name, old, new in MUTATIONS:
            if SRC.count(old) != 1:
                print(f"  ! anchor not found exactly once ({SRC.count(old)}): {name}"); return 2
            path = pathlib.Path(tmp) / f"faithful_{len(rows) + len(escaped)}.py"; path.write_text(SRC.replace(old, new), encoding="utf-8")
            killer = run(path); (rows if killer else escaped).append((name, killer))
            print(f"  {'killed ' if killer else 'ESCAPED'}  {name}" + (f"  ← {killer}" if killer else ""))
    if escaped:
        print(f"\n{len(escaped)} mutant(s) escaped; no table written."); return 1
    table = ["# Mutations", "", f"{len(rows)} defences in `contracts/faithful.py`, each removed or inverted in turn, and the test that failed because of it. "
             "Generated by `tools/mutate.py`; it refuses to write this file if any mutant survives, or if the unmutated suite is not green.", "",
             "| defence removed | killed by |", "|---|---|"] + [f"| {n} | `{k}` |" for n, k in rows] + [""]
    (ROOT / "tests" / "MUTATIONS.md").write_text("\n".join(table), encoding="utf-8")
    print(f"\n{len(rows)} / {len(rows)} killed · tests/MUTATIONS.md written"); return 0


if __name__ == "__main__":
    sys.exit(main())
