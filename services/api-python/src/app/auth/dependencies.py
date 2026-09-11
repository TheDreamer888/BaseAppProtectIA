"""Dependências de autenticação reutilizáveis pelas rotas protegidas."""
from __future__ import annotations

from fastapi import HTTPException, Request

from src.app.auth.store import UserRecord, store
from src.app.auth.tokens import SESSION_COOKIE_NAME, verify_session_token


def current_user(request: Request) -> UserRecord | None:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    claims = verify_session_token(token)
    if not claims:
        return None
    subject = claims.get("sub")
    return store.users.get(subject) if isinstance(subject, str) else None


def require_user(request: Request) -> UserRecord:
    user = current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Autentica-te primeiro.")
    return user