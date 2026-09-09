"""Account recovery when a factor is lost ("se perdeu vai ter de mudar/conectar
com outras alternativas").

Two legally-common, audited approaches are combined:
1. One-time backup codes (like GitHub/Google) generated at enrollment and
   hashed at rest (never stored in plaintext) — used when every linked
   provider/passkey is unavailable.
2. Multi-provider account linking: an account can have several sign-in
   methods attached at once, so losing one (e.g. a broken phone with the
   passkey) still allows sign-in via Google/Microsoft/GitHub etc., after
   which the user can register a replacement factor.
"""
from __future__ import annotations

import secrets

from passlib.hash import bcrypt


def generate_backup_codes(count: int = 10) -> tuple[list[str], list[str]]:
    """Returns (plaintext_codes_to_show_once, hashes_to_persist)."""
    plaintext = [f"{secrets.token_hex(4)}-{secrets.token_hex(4)}" for _ in range(count)]
    hashed = [bcrypt.hash(code) for code in plaintext]
    return plaintext, hashed


def verify_backup_code(code: str, stored_hashes: list[str]) -> int | None:
    """Returns the index of the matching (and now consumed) hash, or None."""
    for idx, stored in enumerate(stored_hashes):
        if bcrypt.verify(code, stored):
            return idx
    return None
