from fastapi import FastAPI
from src.app.config import settings  
from src.ml.model import RiskModel   
from src.pylibrary.logging import get_logger

logger = get_logger(__name__)
app = FastAPI(title="BASEAppProtectIA", version="1.0.0")

risk_model = RiskModel()

@app.get("/api/protect/status")
def status():
    return {"status": "ok", "app": "BASEAppProtectIA"}

@app.post("/api/protect/risk-score")
def risk_score(payload: dict):
    score = risk_model.score(payload)
    logger.info(f"Risk score computed: {score}")
    return {"score": score}
