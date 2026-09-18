from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from src.app.config import settings
from src.app.routers.dns import router as dns_router
from src.app.auth.routes import router as auth_router
from src.app.auth.routes import _current_user
from src.ml.model import RiskModel
from src.pylibrary.logging import get_logger

logger = get_logger(__name__)
settings.require_secret_key()
app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)

app.include_router(dns_router)
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
def risk_score(payload: dict, request: Request):
    if not _current_user(request):
        raise HTTPException(status_code=401, detail="Autentica-te para calcular risco.")
    if len(payload) > 100:
        raise HTTPException(status_code=413, detail="Payload demasiado grande.")
    score = risk_model.score(payload)
    logger.info(f"Risk score computed: {score}")
    return {"score": score}

