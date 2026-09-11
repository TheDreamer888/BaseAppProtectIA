"""Analise local de sinais de seguranca para ficheiros, URLs e comandos."""
from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from src.app.auth.dependencies import require_user
from src.app.auth.store import UserRecord
from src.ml.model import RiskModel

router = APIRouter(prefix="/api/security", tags=["security"])
_risk_model = RiskModel()


class SecurityAnalysisIn(BaseModel):
    target: str = Field(..., min_length=1, max_length=2048)
    kind: Literal["file", "url", "command"] = "file"
    content: str | None = Field(default=None, max_length=12000)


class SecurityAnalysisOut(BaseModel):
    target: str
    kind: Literal["file", "url", "command"]
    score: float = Field(ge=0, le=1)
    risk: Literal["Baixo", "Medio", "Alto"]
    action: Literal["Permitir", "Rever", "Bloquear", "Quarentenar"]
    indicators: list[str]
    providers: list[str]


class NpmAnalysisIn(BaseModel):
    package_name: str = Field(..., min_length=1, max_length=214)
    package_json: dict[str, Any] = Field(..., max_length=200)


class NpmFinding(BaseModel):
    dependency: str
    version: str
    severity: Literal["Baixo", "Medio", "Alto"]
    signal: str
    recommendation: str


class NpmAnalysisOut(BaseModel):
    package_name: str
    score: float = Field(ge=0, le=100)
    risk: Literal["Baixo", "Medio", "Alto"]
    dependencies_checked: int
    findings: list[NpmFinding]
    summary: str
    providers: list[str]


def _indicators(payload: SecurityAnalysisIn) -> list[str]:
    value = f"{payload.target}\n{payload.content or ''}".lower()
    indicators: list[str] = []
    if payload.kind == "command" and ("powershell" in value or ".ps1" in value):
        indicators.append("Execucao remota potencial")
    if "invoke-webrequest" in value or "wget " in value or "curl " in value:
        indicators.append("Download sem validacao")
    if any(token in value for token in ("frombase64string", "-enc ", "eval(", "chr(")):
        indicators.append("Ofuscacao detectada")
    if payload.kind == "url" and any(token in value for token in ("@", "xn--", ".zip", ".scr")):
        indicators.append("URL de risco elevado")
    return indicators


@router.post("/analyze", response_model=SecurityAnalysisOut)
def analyze(payload: SecurityAnalysisIn, _: UserRecord = Depends(require_user)) -> SecurityAnalysisOut:
    indicators = _indicators(payload)
    score = _risk_model.score({"target": payload.target, "kind": payload.kind, "content": payload.content or ""})
    score = min(1.0, score + min(0.75, len(indicators) * 0.2))
    if score >= 0.75:
        risk, action = "Alto", "Quarentenar"
    elif score >= 0.4:
        risk, action = "Medio", "Rever"
    else:
        risk, action = "Baixo", "Permitir"
    return SecurityAnalysisOut(
        target=payload.target,
        kind=payload.kind,
        score=round(score, 4),
        risk=risk,
        action=action,
        indicators=indicators,
        providers=["AuryonSafe Local Rules", "AuryonSafe Risk Model"],
    )


def _npm_dependencies(package_json: dict[str, Any]) -> dict[str, str]:
    dependencies: dict[str, str] = {}
    for section in ("dependencies", "devDependencies", "optionalDependencies"):
        values = package_json.get(section, {})
        if not isinstance(values, dict):
            continue
        for name, version in values.items():
            if isinstance(name, str) and isinstance(version, str):
                dependencies[name] = version
    return dependencies


def _npm_findings(package_json: dict[str, Any]) -> list[NpmFinding]:
    findings: list[NpmFinding] = []
    scripts = package_json.get("scripts", {})
    if isinstance(scripts, dict):
        lifecycle = [name for name in scripts if name in {"preinstall", "install", "postinstall", "prepublish", "prepare"}]
        if lifecycle:
            findings.append(NpmFinding(
                dependency="Scripts do projeto",
                version="-",
                severity="Medio",
                signal=f"Scripts de ciclo de vida: {', '.join(sorted(lifecycle))}",
                recommendation="Reveja estes scripts antes de instalar dependências em CI ou ambientes de produção.",
            ))

    for name, version in _npm_dependencies(package_json).items():
        normalized = version.strip().lower()
        if normalized.startswith(("git+", "github:", "gitlab:", "http:", "https:")):
            findings.append(NpmFinding(name, version, "Alto", "Dependência obtida fora do registo npm", "Fixe um commit confiável ou publique uma versão verificada no registo npm."))
        elif normalized.startswith(("file:", "link:", "workspace:")):
            findings.append(NpmFinding(name, version, "Medio", "Dependência local ou de workspace", "Valide a origem e mantenha o lockfile versionado."))
        elif normalized in {"*", "latest"} or normalized.startswith(("^0.", "~0.")):
            findings.append(NpmFinding(name, version, "Medio", "Versão pouco restritiva", "Use versões fixas ou intervalos estreitos e atualize o lockfile em revisão."))
    return findings


@router.post("/npm/analyze", response_model=NpmAnalysisOut)
def analyze_npm(payload: NpmAnalysisIn, _: UserRecord = Depends(require_user)) -> NpmAnalysisOut:
    dependencies = _npm_dependencies(payload.package_json)
    findings = _npm_findings(payload.package_json)
    high_findings = sum(finding.severity == "Alto" for finding in findings)
    score = min(100.0, 8.0 + len(findings) * 12.0 + high_findings * 20.0)
    if score >= 60:
        risk = "Alto"
    elif score >= 25:
        risk = "Medio"
    else:
        risk = "Baixo"
    summary = (
        f"A IA de risco analisou {len(dependencies)} dependências e encontrou {len(findings)} sinais que precisam de revisão."
        if findings
        else f"A IA de risco analisou {len(dependencies)} dependências e não encontrou sinais locais prioritários."
    )
    return NpmAnalysisOut(
        package_name=payload.package_name,
        score=score,
        risk=risk,
        dependencies_checked=len(dependencies),
        findings=findings,
        summary=summary,
        providers=["AuryonSafe NPM Rules", "AuryonSafe Risk Model"],
    )