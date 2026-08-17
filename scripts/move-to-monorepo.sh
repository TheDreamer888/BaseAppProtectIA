#!/usr/bin/env bash
set -euo pipefail
ROOT="\$(pwd)"
mkdir -p frontend admin backend agent packages/ui infra scripts_backup

# mover pastas conhecidas se existirem
mv -n "$ROOT/App.tsx" "$ROOT/frontend/" 2>/dev/null || true
mv -n "$ROOT/frontend" "$ROOT/frontend" 2>/dev/null || true
mv -n "$ROOT/backend" "$ROOT/backend" 2>/dev/null || true
mv -n "$ROOT/agent" "$ROOT/agent" 2>/dev/null || true

# mover outros frontends detectados (ex.: WebApplication1)
for d in WebApplication1 WebApp* webapp*; do
  [ -d "\$d" ] && mv -n "\$d" "$ROOT/frontend/\$d" 2>/dev/null || true
done

# mover scripts e infra
mv -n "$ROOT/scripts" "$ROOT/scripts" 2>/dev/null || true
mv -n "$ROOT/infra" "$ROOT/infra" 2>/dev/null || true

echo "Movimentos concluídos. Verifica frontend/, backend/, agent/ e packages/"
