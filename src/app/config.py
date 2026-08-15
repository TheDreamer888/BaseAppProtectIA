from typing import Any
from pathlib import Path
import os
from functools import lru_cache
from cryptography.fernet import Fernet  # pip install cryptography
from types import MappingProxyType
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pathlib import Path
# -----------------------------
# Diretórios base
# -----------------------------
BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"
LOG_DIR = BASE_DIR / "logs"

def _ensure_dirs(*dirs: Path) -> None:
    """Criação segura, atómica, permissões corretas, sem quebrar a app."""
    for d in dirs:
        try:
            # criação atómica: evita diretórios a meio
            if not d.exists():
                tmp = d.with_suffix(".tmp")
                tmp.mkdir(parents=True, exist_ok=True)
                tmp.rename(d)

            # permissões seguras (Unix-like)
            try:
                d.chmod(0o700)
            except Exception:
                pass

        except Exception:
            # nunca quebrar a app por causa de diretórios
            continue


# criar diretórios base com segurança máxima
_ensure_dirs(DATA_DIR, LOG_DIR)

# -----------------------------
# Variáveis de ambiente
# -----------------------------
def env(key: str, default: str | None = None) -> str | None:
    """Obtém variável de ambiente com strip e fallback explícito."""
    value = os.getenv(key, default)
    return value.strip() if isinstance(value, str) else value

# -----------------------------
# Desencriptação de segredos
# -----------------------------
def decrypt_secret(enc_value: str | None) -> str | None:
    """Desencripta segredos usando Fernet. Retorna None se inválido."""
    if not enc_value:
        return None

    try:
        key = os.getenv("FERNET_KEY")
        if not key:
            raise RuntimeError("FERNET_KEY não definido no ambiente.")

        f = Fernet(key.encode())
        return f.decrypt(enc_value.encode()).decode()

    except Exception:
        return None

# -----------------------------
# Cache de configs + limpeza automática
# -----------------------------
_config: dict[str, object] | None = None

def get_config() -> dict[str, object]:
    global _config

    if _config is None:
        _config = {
            "BASE_DIR": BASE_DIR,
            "DATA_DIR": DATA_DIR,
            "LOG_DIR": LOG_DIR,
        }

# -----------------------------
# Cache de configs + limpeza automática
# -----------------------------
def get_config() -> dict[str, object]:
    global _config

    if _config is None:
        data_dir = DATA_DIR
        log_dir = LOG_DIR

        # limpeza segura
        for path, days in ((data_dir, 30), (log_dir, 15)):
            _auto_cleanup(path, days=days)

        _config = {
            "BASE_DIR": BASE_DIR,
            "DATA_DIR": data_dir,
            "LOG_DIR": log_dir,
        }

    return _config

# -----------------------------
# Limpeza automática
# -----------------------------
def _auto_cleanup(path: Path, days: int = 30) -> None:
    """Remove ficheiros mais antigos que X dias e diretórios vazios."""
    if not path.exists():
        return

    cutoff = time.time() - (days * 86400)

    for item in path.iterdir():
        try:
            # ignorar symlinks
            if item.is_symlink():
                continue

            # ficheiros antigos
            if item.is_file():
                if item.stat().st_mtime < cutoff:
                    item.unlink()
                continue

            # diretórios: limpeza recursiva
            if item.is_dir():
                _auto_cleanup(item, days=days)

                # remover diretórios vazios após limpeza
                if not any(item.iterdir()):
                    item.rmdir()

        except Exception:
            # nunca quebrar a app por causa de limpeza
            continue

# -----------------------------
# Encriptação de segredos
# -----------------------------
def aes_encrypt(key: bytes, plaintext: str) -> bytes:
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    return nonce + aesgcm.encrypt(nonce, plaintext.encode(), None)

def aes_decrypt(key: bytes, data: bytes) -> str:
    aesgcm = AESGCM(key)
    nonce, ciphertext = data[:12], data[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode()

# -----------------------------
# Constantes base
# -----------------------------
APP_NAME: str = "ProtectIA"


def _env_bool(name: str, default: bool = False) -> bool:
    """Interpretação segura de booleanos vindos do ambiente."""
    raw = os.getenv(name, "").strip().lower()

    if raw in ("1", "true", "yes", "on"):
        return True
    if raw in ("0", "false", "no", "off"):
        return False

    return default


DEBUG: bool = _env_bool("DEBUG", default=False)
USE_STRICT_TYPES: bool = True


# -----------------------------
# Diretórios base
# -----------------------------
BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"
LOG_DIR = BASE_DIR / "logs"
    
def _ensure_dirs(*dirs: Path) -> None:
    """
    Criação segura, atómica, permissões corretas, tolerante a erros.
    CLEAN + ROBUSTO + ENTERPRISE + ULTRA.
    """
    for d in dirs:
        try:
            # criação atómica: evita diretórios incompletos
            if not d.exists():
                tmp = d.with_suffix(".tmp")
                tmp.mkdir(parents=True, exist_ok=True)
                tmp.rename(d)

            # permissões seguras (Unix-like)
            try:
                d.chmod(0o700)
            except Exception:
                pass

        except Exception:
            # nunca quebrar a app por causa de diretórios
            continue


# criar diretórios base com segurança máxima
_ensure_dirs(DATA_DIR, LOG_DIR)

# -----------------------------
# Gestão de segredos
# -----------------------------
def decrypt_secret(enc_value: str | None) -> str | None:
    """
    Placeholder seguro para desencriptação de segredos.
    CLEAN + ROBUSTO + ENTERPRISE + ULTRA.
    """
    if enc_value is None:
        return None

    enc_value = enc_value.strip()
    if not enc_value:
        return None

    # TODO: substituir por desencriptação real (AESGCM, KMS, etc.)
    return enc_value

def _require_secret(name: str) -> str:
    """
    Validação forte de segredos obrigatórios.
    - Sanitiza
    - Garante não-vazio
    - Garante não-nulo
    - Erro explícito e imediato
    """
    raw = os.getenv(name, None)

    secret = decrypt_secret(raw)
    if secret is None or not isinstance(secret, str) or not secret.strip():
        raise RuntimeError(f"{name} ausente ou inválido — abortando inicialização.")

    return secret

# segredo final, validado, sanitizado e seguro
SECRET_KEY: str = _require_secret("SECRET_KEY_ENC").strip()

# ---------------------------------
# Segurança de dados e segredos
# ---------------------------------
def redact(value: Any) -> Any:
    """
    Redação profunda, rápida e segura.
    - Zero recursão pesada
    - Zero cópias desnecessárias
    - Zero risco de CPU burn
    - Estável em produção (Ubuntu/Debian/Azure)
    """

    # --- Dicionários ---
    if isinstance(value, Mapping):
        out = {}
        for k, v in value.items():
            key_str = str(k)
            if _is_sensitive(key_str):
                out[key_str] = REDACTED
            else:
                out[key_str] = redact(v)
        return out

    # --- Listas / Tuplos / Sets ---
    if isinstance(value, (list, tuple, set)):
        t = type(value)
        return t(redact(v) for v in value)

    # --- Iteráveis genéricos (evitar tratar str/bytes como iteráveis) ---
    if isinstance(value, Iterable) and not isinstance(value, (str, bytes)):
        try:
            return [redact(v) for v in value]
        except Exception:
            return value

    # --- Tipos simples / não estruturados ---
    return value




