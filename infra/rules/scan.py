from __future__ import annotations

import hashlib
import math
import os
import subprocess
import time
from collections import Counter
from pathlib import Path

import yara

ROOT = Path(__file__).resolve().parents[2]
RULES = yara.compile(filepath=str(ROOT / "infra/rules/malware.yar"))

SCAN_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx",
    ".sh", ".bash", ".ps1",
    ".exe", ".dll", ".so", ".bin",
}

TRUSTED_EXTERNAL_DIRS = {
    "node_modules",
    ".venv",
    "venv",
}

IGNORE_DIRS = {
    ".git",
    ".cache",
    "dist",
    "build",
    "__pycache__",
}

MAX_READ = 1024 * 1024  # 1 MB


def sha256(path: Path) -> str:
    h = hashlib.sha256()

    with path.open("rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)

    return h.hexdigest()


def entropy(data: bytes) -> float:
    if not data:
        return 0.0

    counts = Counter(data)
    size = len(data)

    return -sum(
        (count / size) * math.log2(count / size)
        for count in counts.values()
    )


def git_tracked_files() -> set[str]:
    try:
        result = subprocess.run(
            ["git", "ls-files", "-z"],
            cwd=ROOT,
            capture_output=True,
            check=True,
        )

        return {
            item.decode(errors="replace")
            for item in result.stdout.split(b"\0")
            if item
        }

    except Exception:
        return set()


TRACKED = git_tracked_files()


def classify_zone(path: Path) -> str:
    relative = path.relative_to(ROOT)
    parts = set(relative.parts)

    if parts & IGNORE_DIRS:
        return "IGNORE"

    if str(relative) in TRACKED:
        return "TRUSTED_INTERNAL"

    if parts & TRUSTED_EXTERNAL_DIRS:
        return "TRUSTED_EXTERNAL"

    return "UNTRUSTED"


def scan_file(path: Path) -> dict:
    zone = classify_zone(path)

    if zone == "IGNORE":
        return {"zone": zone, "path": str(path)}

    try:
        with path.open("rb") as f:
            data = f.read(MAX_READ)

        ent = entropy(data)

        started = time.perf_counter()
        matches = RULES.match(data=data)
        elapsed_ms = (time.perf_counter() - started) * 1000

        score = 0

        if matches:
            score += 80

        if ent >= 7.5:
            score += 20

        if zone == "UNTRUSTED":
            score += 15

        if score >= 80:
            decision = "QUARANTINE"
        elif score >= 30:
            decision = "REVIEW"
        else:
            decision = "ALLOW"

        return {
            "path": str(path.relative_to(ROOT)),
            "zone": zone,
            "decision": decision,
            "score": score,
            "entropy": round(ent, 2),
            "sha256": sha256(path),
            "yara": [str(match) for match in matches],
            "scan_ms": round(elapsed_ms, 2),
        }

    except (PermissionError, OSError) as exc:
        return {
            "path": str(path),
            "zone": zone,
            "decision": "ERROR",
            "error": str(exc),
        }


def main():
    for root, dirs, files in os.walk(ROOT):
        dirs[:] = [
            d for d in dirs
            if d not in IGNORE_DIRS
        ]

        for filename in files:
            path = Path(root) / filename

            if path.suffix.lower() not in SCAN_EXTENSIONS:
                continue

            result = scan_file(path)

            if result.get("decision") in {"REVIEW", "QUARANTINE"}:
                print(
                    f"[{result['decision']}] "
                    f"{result['path']} "
                    f"zone={result['zone']} "
                    f"score={result['score']} "
                    f"entropy={result['entropy']} "
                    f"yara={result['yara']}"
                )


if __name__ == "__main__":
    main()
