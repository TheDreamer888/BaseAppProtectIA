from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from src.app.config import settings
from src.app.auth.dependencies import require_user
from src.app.routers.dns import router as dns_router
from src.app.routers.security import router as security_router
from src.app.auth.routes import router as auth_router
from src.ml.model import RiskModel
from src.pylibrary.logging import get_logger

logger = get_logger(__name__)
settings.require_secret_key()
app = FastAPI(title=settings.app_name, version="1.0.0")

if settings.allowed_host_list:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_host_list)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if request.url.scheme == "https":
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response

app.include_router(dns_router)
app.include_router(security_router)
app.include_router(auth_router)

risk_model = RiskModel()


@app.get("/health")
def health():
    """Liveness/readiness probe — não expõe detalhes internos."""
    return {"status": "healthy"}


@app.get("/api/protect/status")
def status():
    return {"status": "ok", "app": settings.app_name}

@app.post("/api/protect/risk-score")
def risk_score(payload: dict[str, object], _: object = Depends(require_user)):
    if len(payload) > 50:
        raise HTTPException(status_code=413, detail="Payload demasiado grande.")
    score = risk_model.score(payload)
    logger.info("Risk score computed")
    return {"score": score}

