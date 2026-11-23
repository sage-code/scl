#!/usr/bin/env python3
"""Verify HMAC-SHA256 webhook signatures using constant-time comparison."""

import hashlib
import hmac


def sign_payload(secret: bytes, payload: bytes) -> str:
    return hmac.new(secret, payload, hashlib.sha256).hexdigest()


def verify_signature(secret: bytes, payload: bytes, provided_hex: str) -> bool:
    expected = sign_payload(secret, payload)
    # Use compare_digest instead of `==` to prevent timing side-channel leaks
    return hmac.compare_digest(expected, provided_hex)


if __name__ == "__main__":
    secret_key = b"dev-webhook-secret"
    body = b'{"event":"invoice.paid","id":"inv_104"}'
    sig = sign_payload(secret_key, body)
    print("Valid signature:", verify_signature(secret_key, body, sig))
    print("Tampered body:  ", verify_signature(secret_key, b"{}", sig))
