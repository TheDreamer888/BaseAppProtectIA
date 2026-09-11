"""Pydantic schemas for the auth module."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr


class OAuthStartResponse(BaseModel):
    authorize_url: str
    state: str


class SessionUser(BaseModel):
    id: str
    email: EmailStr | None = None
    name: str | None = None
    linked_methods: list[str] = []
    mfa_enrolled: bool = False


class WebAuthnRegisterVerify(BaseModel):
    credential: dict
    challenge_id: str
    device_label: str | None = None


class WebAuthnLoginVerify(BaseModel):
    credential: dict
    challenge_id: str


class BackupCodesResponse(BaseModel):
    codes: list[str]


class BackupCodeRedeemRequest(BaseModel):
    email: EmailStr
    code: str


class ConsentRequest(BaseModel):
    terms_accepted: bool
    privacy_accepted: bool
    marketing_opt_in: bool = False
