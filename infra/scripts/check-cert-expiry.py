#!/usr/bin/env python3
"""Verifica a validade/expiração de certificados TLS de uma lista de domínios.

Uso:
    python check-cert-expiry.py dominio1.com dominio2.com [--warn-days 15]

Sai com código != 0 se algum certificado já expirou ou expira dentro do
limiar de aviso (por omissão, 15 dias). Não faz commit/instala nada — só lê.
"""
from __future__ import annotations

import argparse
import socket
import ssl
import sys
from datetime import datetime, timezone


def get_cert_expiry(host: str, port: int = 443, timeout: float = 5.0) -> datetime:
    ctx = ssl.create_default_context()
    with socket.create_connection((host, port), timeout=timeout) as sock:
        with ctx.wrap_socket(sock, server_hostname=host) as tls_sock:
            cert = tls_sock.getpeercert()
    not_after = cert.get("notAfter")
    if not not_after:
        raise ValueError(f"Certificado de {host} sem campo 'notAfter'.")
    return datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("hosts", nargs="+", help="Domínios a verificar (ex.: api.exemplo.com)")
    parser.add_argument("--warn-days", type=int, default=15, help="Limiar de aviso em dias (default: 15)")
    args = parser.parse_args()

    now = datetime.now(timezone.utc)
    exit_code = 0

    for host in args.hosts:
        try:
            expiry = get_cert_expiry(host)
        except Exception as exc:
            print(f"[ERRO] {host}: não foi possível validar o certificado ({exc})")
            exit_code = 1
            continue

        days_left = (expiry - now).days
        if days_left < 0:
            print(f"[EXPIRADO] {host}: expirou há {-days_left} dia(s) ({expiry.date()})")
            exit_code = 1
        elif days_left <= args.warn_days:
            print(f"[AVISO] {host}: expira em {days_left} dia(s) ({expiry.date()})")
            exit_code = 1
        else:
            print(f"[OK] {host}: expira em {days_left} dia(s) ({expiry.date()})")

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
