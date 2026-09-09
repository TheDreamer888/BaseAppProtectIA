#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"

printf 'Monorepo: %s\n' "$ROOT"
printf '\nAplicações:\n'
find "$ROOT/apps" -mindepth 1 -maxdepth 1 -type d -printf '  %f\n' 2>/dev/null || true
printf '\nServiços:\n'
find "$ROOT/services" -mindepth 1 -maxdepth 1 -type d -printf '  %f\n' 2>/dev/null || true
printf '\nInfraestrutura:\n'
find "$ROOT/infra" -mindepth 1 -maxdepth 2 -type f -printf '  %P\n' 2>/dev/null || true

printf '\nNenhum arquivo foi movido. Este script é somente de auditoria.\n'
