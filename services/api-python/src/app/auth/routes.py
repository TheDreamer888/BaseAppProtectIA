"""Auth routes: OAuth (Google/Microsoft/GitHub/...), WebAuthn passkeys,
backup-code recovery, session, and legal consent.

Security notes:
- Authorization Code + PKCE for every OAuth provider (RFC 9700 recommendation
  for public/browser clients); client secrets stay server-side only.
- `state` and the PKCE `code_verifier` travel in a short-lived encrypted
  cookie, never in client-readable storage, to prevent CSRF/replay.
- The final session is an httpOnly/Secure/SameSite cookie (see tokens.py) —
  JavaScript never sees a bearer token.
"""
from __future__ import annotations

import base64
import hashlib
import os
import secrets

import httpx
from fastapi import APIRouter, HTTPException, Request, Response

from src.app.auth.providers import PROVIDERS, enabled_providers
from src.app.auth.dependencies import current_user
from src.app.auth.recovery import generate_backup_codes, verify_backup_code
from src.app.auth.schemas import (
    BackupCodesResponse,
    BackupCodeRedeemRequest,
    ConsentRequest,
    OAuthStartResponse,
    SessionUser,
    WebAuthnLoginVerify,
    WebAuthnRegisterVerify,
)
from src.app.auth.store import UserRecord, store
from src.app.auth.tokens import SESSION_COOKIE_NAME, issue_session_token, verify_session_token
from src.app.auth import webauthn as wa

router = APIRouter(prefix="/api/auth", tags=["auth"])

_OAUTH_FLOW_COOKIE = "oauth_flow"
_IS_PROD = os.getenv("ENV", "development") == "production"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _set_secure_cookie(response: Response, name: str, value: str, max_age: int) -> None:
    response.set_cookie(
        name,
        value,
        max_age=max_age,
        httponly=True,
        secure=_IS_PROD,
        samesite="lax",
        path="/",
    )


@router.get("/providers")
def list_providers() -> dict:
    """What the login tab renders — adapts automatically to configured env vars."""
    return {
        "oauth": [{"id": p.name, "name": p.display_name} for p in enabled_providers()],
        "webauthn": True,
        "backup_codes": True,
    }


@router.get("/oauth/{provider}/start", response_model=OAuthStartResponse)
def oauth_start(provider: str, response: Response) -> OAuthStartResponse:
    p = PROVIDERS.get(provider)
    if not p or not (p.client_id and p.client_secret):
        raise HTTPException(404, "Provedor indisponível")

    state = secrets.token_urlsafe(24)
    verifier = secrets.token_urlsafe(64)
    challenge = _b64url(hashlib.sha256(verifier.encode()).digest())

    redirect_uri = f"{os.getenv('PUBLIC_API_URL', 'http://localhost:8000')}/api/auth/oauth/{provider}/callback"
    query = httpx.QueryParams(
        {
            "client_id": p.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": p.scope,
            "state": state,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }
    )
    _set_secure_cookie(response, _OAUTH_FLOW_COOKIE, f"{provider}:{state}:{verifier}", max_age=600)
    return OAuthStartResponse(authorize_url=f"{p.authorize_url}?{query}", state=state)


@router.get("/oauth/{provider}/callback")
async def oauth_callback(provider: str, request: Request, response: Response, code: str, state: str):
    p = PROVIDERS.get(provider)
    if not p or not (p.client_id and p.client_secret):
        raise HTTPException(404, "Provedor indisponível")
    flow = request.cookies.get(_OAUTH_FLOW_COOKIE)
    if not flow:
        raise HTTPException(400, "Fluxo de login expirado, tenta novamente.")
    try:
        saved_provider, saved_state, verifier = flow.split(":", 2)
    except ValueError as exc:
        raise HTTPException(400, "Fluxo de login inválido.") from exc
    if saved_provider != provider or saved_state != state:
        raise HTTPException(400, "State inválido — possível CSRF.")

    redirect_uri = f"{os.getenv('PUBLIC_API_URL', 'http://localhost:8000')}/api/auth/oauth/{provider}/callback"

    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post(
            p.token_url,
            data={
                "client_id": p.client_id,
                "client_secret": p.client_secret,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "code_verifier": verifier,
            },
            headers={"Accept": "application/json"},
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]

        userinfo_resp = await client.get(
            p.userinfo_url,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        userinfo_resp.raise_for_status()
        info = userinfo_resp.json()

    email = info.get(p.email_field)
    name = info.get(p.name_field)
    user = store.get_or_create_user(email=email, name=name, method=provider)

    session_token = issue_session_token(user.id, list(user.linked_methods))
    _set_secure_cookie(response, SESSION_COOKIE_NAME, session_token, max_age=8 * 3600)
    response.delete_cookie(_OAUTH_FLOW_COOKIE)

    frontend_url = os.getenv("PUBLIC_FRONTEND_URL", "http://localhost:5173")
    response.status_code = 302
    response.headers["Location"] = f"{frontend_url}/#/login-success"
    return response


_current_user = current_user


@router.get("/session", response_model=SessionUser | None)
def session(request: Request):
    user = _current_user(request)
    if not user:
        return None
    return SessionUser(
        id=user.id,
        email=user.email,
        name=user.name,
        linked_methods=sorted(user.linked_methods),
        mfa_enrolled=bool(user.webauthn_credentials or user.backup_code_hashes),
    )


@router.post("/logout")
def logout(response: Response) -> dict:
    response.delete_cookie(SESSION_COOKIE_NAME)
    return {"ok": True}


# ---- WebAuthn passkeys / security keys ("keys/pen") ----

@router.post("/webauthn/register/options")
def webauthn_register_options(request: Request) -> dict:
    user = _current_user(request)
    if not user:
        raise HTTPException(401, "Autentica-te primeiro com um dos provedores.")
    existing_ids = [base64.urlsafe_b64decode(cid + "==") for cid in user.webauthn_credentials]
    options, options_json = wa.build_registration_options(user.id, user.email or user.id, existing_ids)
    challenge_id = secrets.token_urlsafe(16)
    store.webauthn_challenges.set(challenge_id, (user.id, options.challenge))
    return {"challenge_id": challenge_id, "options": options_json}


@router.post("/webauthn/register/verify")
def webauthn_register_verify(body: WebAuthnRegisterVerify, request: Request) -> dict:
    entry = store.webauthn_challenges.pop(body.challenge_id)
    if not entry:
        raise HTTPException(400, "Desafio expirado.")
    user_id, challenge = entry
    verification = wa.verify_registration(body.credential, challenge)
    user = store.users[user_id]
    cred_id_b64 = _b64url(verification.credential_id)
    user.webauthn_credentials[cred_id_b64] = {
        "public_key": verification.credential_public_key,
        "sign_count": verification.sign_count,
        "label": body.device_label or "Chave de segurança",
    }
    user.linked_methods.add("passkey")
    return {"ok": True}


@router.post("/webauthn/login/options")
def webauthn_login_options(email: str) -> dict:
    user_id = store.email_index.get(email)
    user = store.users.get(user_id) if user_id else None
    allowed_ids = (
        [base64.urlsafe_b64decode(cid + "==") for cid in user.webauthn_credentials] if user else []
    )
    options, options_json = wa.build_authentication_options(allowed_ids)
    challenge_id = secrets.token_urlsafe(16)
    store.webauthn_challenges.set(challenge_id, (user_id, options.challenge))
    return {"challenge_id": challenge_id, "options": options_json}


@router.post("/webauthn/login/verify")
def webauthn_login_verify(body: WebAuthnLoginVerify, response: Response) -> dict:
    entry = store.webauthn_challenges.pop(body.challenge_id)
    if not entry:
        raise HTTPException(400, "Desafio expirado.")
    user_id, challenge = entry
    user = store.users.get(user_id)
    if not user:
        raise HTTPException(404, "Utilizador não encontrado.")
    cred_id_b64 = body.credential.get("id")
    cred = user.webauthn_credentials.get(cred_id_b64)
    if not cred:
        raise HTTPException(400, "Chave de segurança desconhecida.")
    verification = wa.verify_authentication(
        body.credential, challenge, cred["public_key"], cred["sign_count"]
    )
    cred["sign_count"] = verification.new_sign_count

    session_token = issue_session_token(user.id, list(user.linked_methods))
    _set_secure_cookie(response, SESSION_COOKIE_NAME, session_token, max_age=8 * 3600)
    return {"ok": True}


# ---- Recovery when a factor is lost ----

@router.post("/recovery/backup-codes/generate", response_model=BackupCodesResponse)
def generate_codes(request: Request) -> BackupCodesResponse:
    user = _current_user(request)
    if not user:
        raise HTTPException(401, "Autentica-te primeiro.")
    plaintext, hashes = generate_backup_codes()
    user.backup_code_hashes = hashes
    return BackupCodesResponse(codes=plaintext)  # shown once, never stored/logged in plaintext


@router.post("/recovery/backup-codes/redeem")
def redeem_code(body: BackupCodeRedeemRequest, response: Response) -> dict:
    normalized_email = str(body.email).casefold()
    user_id = store.email_index.get(normalized_email)
    user = store.users.get(user_id) if user_id else None
    if not user:
        raise HTTPException(404, "Conta não encontrada.")
    idx = verify_backup_code(body.code, user.backup_code_hashes)
    if idx is None:
        raise HTTPException(400, "Código inválido ou já utilizado.")
    user.backup_code_hashes.pop(idx)  # one-time use
    session_token = issue_session_token(user.id, list(user.linked_methods))
    _set_secure_cookie(response, SESSION_COOKIE_NAME, session_token, max_age=8 * 3600)
    return {"ok": True, "remaining_codes": len(user.backup_code_hashes)}


# ---- Legal / consent (GDPR Art. 7, LGPD Art. 8: freely given, recorded consent) ----

@router.post("/consent")
def record_consent(body: ConsentRequest, request: Request) -> dict:
    user = _current_user(request)
    if not user:
        raise HTTPException(401, "Autentica-te primeiro.")
    if not (body.terms_accepted and body.privacy_accepted):
        raise HTTPException(400, "É necessário aceitar os Termos e a Política de Privacidade.")
    import time

    user.consent = {**body.model_dump(), "recorded_at": time.time()}
    return {"ok": True}
