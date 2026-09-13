# v0.3.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""Bounty: money that can only reach a translator the register certified.

This is the consequence, and it is the reason a certificate is worth reaching
consensus about. A contract that records a verdict and stops has produced an
opinion; this one reads that verdict and moves money, and there is no path
through it that pays for a translation the validators refused.

A requester opens a bounty for one pair hash, or one document manifest, in one
Faithful register, funds it, and binds the translator's wallet. The requester
may also name the publisher whose source the translation must be of, and the
host that publisher must be bound to. `settle()` then asks the register, through
ordinary synchronous views, what it already decided:

    certified, and the named publisher (and host) hold  -> the translator is paid
    rejected                                              -> the requester is refunded
    no certificate under that key yet, or certified but
    the named publisher has not published the source or
    is not bound to the host yet                          -> nothing happens, try later

Provenance is a reason to wait, never to refund: a certified translation is
the translator's work, and a requester who also happens to be the publisher
could otherwise unmake the requirement and take the money back while keeping
the work. Only the validators' rejection refunds.

A name or a hash on the register is never authority on its own: whoever paid
says which publisher address they trust, and the register only answers whether
that address published these bytes and whether its host vouches for it. No
model runs here and no validator is asked anything about anybody. The answer is
the one already agreed, read for free, and obeyed once.

It is a fixture: small on purpose, and here to be read.
"""

import json
import typing
from genlayer import *


# Paying an ordinary wallet is an external message to the chain layer, reached
# through the EVM interface even though the recipient is not a contract.
@gl.evm.contract_interface
class _Payee:
    class View:
        pass

    class Write:
        pass


ZERO = "0x0000000000000000000000000000000000000000"


class Bounty(gl.Contract):
    register: Address        # the Faithful register holding the certificate
    kind: str                # "pair" for one certificate, "document" for a manifest of parts
    key: str                 # the pair hash or the manifest hash this bounty is for
    publisher: Address       # if not ZERO, the source must have been published by this account
    domain: str              # if not "", the publisher must be bound to this host by the validators
    requester: Address       # who funds it, and who is refunded on a rejection
    translator: Address      # who is paid on a certification
    bound: bool
    pool: u256
    settled: bool
    outcome_json: str

    def __init__(self, register: str, kind: str, key: str, publisher: str, domain: str) -> None:
        self.register = Address(register)
        kind = kind.strip().lower()
        if kind not in ("pair", "document"):
            raise gl.vm.UserError("[EXPECTED] a bounty is for a pair or a document")
        key = key.strip().lower()
        if len(key) != 64 or any(ch not in "0123456789abcdef" for ch in key):
            raise gl.vm.UserError("[EXPECTED] the key is a 64-character hex hash")
        domain = domain.strip().lower()
        who = Address(publisher.strip()) if publisher.strip() else Address(ZERO)
        if domain and who.as_hex.lower() == ZERO:
            raise gl.vm.UserError("[EXPECTED] a domain requirement needs a publisher to be bound to it")
        self.kind = kind
        self.key = key
        self.publisher = who
        self.domain = domain
        self.requester = gl.message.sender_address
        self.translator = gl.message.sender_address
        self.bound = False
        self.pool = u256(0)
        self.settled = False
        self.outcome_json = "{}"

    # ------------------------------------------------------------------ setup
    @gl.public.write
    def bind(self, translator: str) -> str:
        """Say which wallet the translator is paid at.

        Bound by the requester rather than claimed by the translator, because
        a claim would need an identity this contract has no way to check. The
        binding is public, it is fixed before the money moves, and it can be
        made only once.
        """
        if gl.message.sender_address != self.requester:
            raise gl.vm.UserError("[EXPECTED] only the requester binds the translator")
        if self.settled:
            raise gl.vm.UserError("[EXPECTED] this bounty has already been settled")
        if self.bound:
            raise gl.vm.UserError("[EXPECTED] the translator is already bound")
        self.translator = Address(translator)
        self.bound = True
        return json.dumps({"ok": True, "translator": self.translator.as_hex})

    @gl.public.write.payable
    def fund(self) -> str:
        """Add to the bounty. Anybody may.

        This never raises. Value sent with a *refused* payable call is not
        returned by the chain; it is simply stranded in the contract. So a
        call that cannot be honoured is accepted, refunded explicitly, and told
        why. A refusal that costs the caller their money is not a refusal.
        """
        value = gl.message.value
        if self.settled:
            if value > u256(0):
                _Payee(gl.message.sender_address).emit_transfer(value=value)
            return json.dumps({"ok": False,
                               "reason": "this bounty has already been settled; your funds were returned"})
        if value == u256(0):
            return json.dumps({"ok": False, "reason": "send an amount greater than zero"})
        self.pool = self.pool + value
        return json.dumps({"ok": True, "pool": str(int(self.pool))})

    # ------------------------------------------------------------ the verdict
    def _verdict(self) -> str:
        """What the register says about this key: a verdict, or "" if nothing to settle yet."""
        register = gl.get_contract_at(self.register)
        if str(self.kind) == "pair":
            entry = json.loads(str(register.view().certificate_hash(str(self.key))))
            if "error" in entry:
                return ""
            return str(entry.get("verdict", ""))
        doc = json.loads(str(register.view().document(str(self.key))))
        if "error" in doc or not doc.get("complete"):
            return ""
        return "certified" if doc.get("certified") else "rejected"

    def _provenance(self, register: typing.Any, source_hashes: list) -> str:
        """The publisher rule, when the requester set one: "" when it holds, else why not.

        Every source must have been published by the named address, and that
        address must be bound to the named host when one was required.
        """
        if self.publisher.as_hex.lower() == ZERO:
            return ""
        who = self.publisher.as_hex
        for source_hash in source_hashes:
            if not bool(register.view().is_published_by(who, str(source_hash))):
                return who + " has not published this source"
        if str(self.domain):
            if not bool(register.view().is_bound(who, str(self.domain))):
                return who + " is not bound to " + str(self.domain)
        return ""

    def _decision(self) -> dict:
        """What the register says, as one of: pay, refund, or wait (with the reason)."""
        verdict = self._verdict()
        if verdict == "":
            return {"verdict": "", "do": "wait", "why": "the register holds nothing for this " + str(self.kind) + " yet"}
        register = gl.get_contract_at(self.register)
        if str(self.kind) == "pair":
            passed = bool(register.view().is_certified_hash(str(self.key)))
            entry = json.loads(str(register.view().certificate_hash(str(self.key))))
            sources = [entry.get("source_hash", "")]
        else:
            passed = bool(register.view().is_document_certified(str(self.key)))
            doc = json.loads(str(register.view().document(str(self.key))))
            sources = [p.get("source_hash", "") for p in doc.get("parts", [])]
        if not passed:
            return {"verdict": verdict, "do": "refund", "why": "the validators refused it"}
        missing = self._provenance(register, sources)
        if missing:
            return {"verdict": verdict, "do": "wait", "why": "certified, but " + missing}
        return {"verdict": verdict, "do": "pay", "why": ""}

    @gl.public.write
    def settle(self) -> str:
        """Pay the translator or refund the requester, once, as the register decided.

        The whole judgement was made and agreed elsewhere. Here it is read
        synchronously and obeyed: the views cost no consensus and no model
        call, and two people running this would get the same answer.
        """
        if self.settled:
            raise gl.vm.UserError("[EXPECTED] this bounty has already been settled")
        if self.pool == u256(0):
            raise gl.vm.UserError("[EXPECTED] there is nothing in the bounty")
        decision = self._decision()
        if decision["do"] == "wait":
            raise gl.vm.UserError("[EXPECTED] " + str(decision["why"]) + ", so there is nothing to settle yet")
        certified = decision["do"] == "pay"
        if certified and not self.bound:
            raise gl.vm.UserError(
                "[EXPECTED] the translation is certified but no translator is bound to be paid"
            )

        amount = self.pool
        payee = self.translator if certified else self.requester
        _Payee(payee).emit_transfer(value=amount)
        self.pool = u256(0)
        self.settled = True
        outcome = {
            "verdict": str(decision["verdict"]),
            "paid": "translator" if certified else "requester",
            "to": payee.as_hex,
            "amount": str(int(amount)),
        }
        self.outcome_json = json.dumps(outcome)
        return json.dumps({"ok": True, **outcome})

    # ------------------------------------------------------------------ views
    @gl.public.view
    def would_pay(self) -> str:
        """What `settle` will do, readable for free before anybody signs."""
        decision = self._decision()
        if decision["do"] == "wait":
            return "nobody: " + str(decision["why"])
        return "translator" if decision["do"] == "pay" else "requester"

    @gl.public.view
    def status(self) -> str:
        return json.dumps({
            "register": self.register.as_hex,
            "kind": str(self.kind),
            "key": str(self.key),
            "publisher": self.publisher.as_hex,
            "domain": str(self.domain),
            "requester": self.requester.as_hex,
            "translator": self.translator.as_hex if self.bound else None,
            "pool": str(int(self.pool)),
            "settled": bool(self.settled),
            "outcome": json.loads(str(self.outcome_json)),
        })
