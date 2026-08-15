from __future__ import annotations

import json
import time
import hashlib
import logging
import re

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


# Logging seguro e limpo
logger = logging.getLogger("discipline_model")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("[%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)


# ---------------------------------------------------------
# RESPOSTA DO MODELO (IMUTÁVEL, SEGURA)
# ---------------------------------------------------------

@dataclass(frozen=True)
class ModelResponse:
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: float = field(default_factory=time.time)

    def to_json(self) -> str:
        try:
            return json.dumps(
                {
                    "success": self.success,
                    "data": self.data,
                    "error": self.error,
                    "timestamp": self.timestamp
                },
                ensure_ascii=False,
                default=str
            )
        except Exception as exc:
            logger.error(f"Erro ao serializar resposta: {exc}")
            return json.dumps(
                {
                    "success": False,
                    "data": None,
                    "error": "Erro ao serializar resposta.",
                    "timestamp": time.time()
                },
                ensure_ascii=False
            )


# ---------------------------------------------------------
# MODELO BASE (VALIDAÇÃO, HASH SEGURO)
# ---------------------------------------------------------
class BaseModel:
    def __init__(self, name: str):
        if not isinstance(name, str):
            raise TypeError

        name = name.strip()
        if not name:
            raise ValueError("Nome do modelo inválido.")

        self._name = name
        logger.info(f"Modelo '{self._name}' inicializado.")


    @property
    def name(self) -> str:
        return self._name

    @staticmethod
    def hash(text: str) -> str:
        if not isinstance(text, str):
            raise TypeError("hash() requer string.")
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    @staticmethod
    def validate_payload(payload: Dict[str, Any]) -> None:
        if not isinstance(payload, dict):
            raise TypeError("Payload deve ser dict.")
        if not payload:
            raise ValueError("Payload vazio.")
        # Limite anti-DoS
        if len(json.dumps(payload)) > 10_000:
            raise ValueError("Payload demasiado grande.")

    def process(self, payload: Dict[str, Any]) -> ModelResponse:
        try:
            self.validate_payload(payload)
            serialized = json.dumps(payload, ensure_ascii=False)
            hashed = self.hash(serialized)
            return ModelResponse(success=True, data={"hash": hashed})
        except Exception as exc:
            logger.warning(f"Payload inválido: {exc}")
            return ModelResponse(success=False, error=str(exc))


# ---------------------------------------------------------
# MODELO DE IA (VALIDAÇÃO, SANITIZAÇÃO, SEGURANÇA)
# ---------------------------------------------------------

class AIModel(BaseModel):
    VERSION_REGEX = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")

    def __init__(self, name: str, version: str):
        super().__init__(name)

        if not isinstance(version, str):
            raise TypeError("Versão deve ser string.")

        version = version.strip()
        if not version:
            raise ValueError("Versão vazia.")

        if len(version) > 32:
            raise ValueError("Versão demasiado longa.")

        if not self.VERSION_REGEX.match(version):
            raise ValueError("Formato de versão inválido. Use X.Y.Z")

        self._version = version

    @property
    def version(self) -> str:
        return self._version

    def infer(self, text: str) -> ModelResponse:
        if not isinstance(text, str):
            return ModelResponse(success=False, error="Texto deve ser string.")

        cleaned = text.strip()
        if not cleaned:
            return ModelResponse(success=False, error="Texto vazio.")

        if len(cleaned) > 5000:
            return ModelResponse(success=False, error="Texto demasiado longo.")

        output = {
            "input": cleaned,
            "length": len(cleaned),
            "checksum": self.hash(cleaned),
            "model": self.name,
            "version": self.version
        }

        return ModelResponse(success=True, data=output)


# ---------------------------------------------------------
# INSTÂNCIA E FUNÇÃO DE INFERÊNCIA
# ---------------------------------------------------------

def create_model(name: str = "DisciplineEngine", version: str = "1.0.0") -> AIModel:
    return AIModel(name=name, version=version)


def run_inference(text: str, model: Optional[AIModel] = None) -> str:
    if model is None:
        model = create_model()
    return model.infer(text).to_json()
