#!/usr/bin/env bash
set -euo pipefail

# Usage: ./check-package-build.sh <package[@version]>
PKG="${1:-}"
if [[ -z "$PKG" ]]; then
  echo "Uso: $0 <package[@version]>"
  exit 2
fi

TMPDIR="$(mktemp -d)"
cleanup() { rm -rf "$TMPDIR"; }
trap cleanup EXIT

echo "Pacote: $PKG"
echo

DIST_INTEGRITY="$(npm view "$PKG" dist.integrity 2>/dev/null || true)"
if [[ -n "$DIST_INTEGRITY" ]]; then
  echo "dist.integrity: $DIST_INTEGRITY"
else
  echo "dist.integrity: (não disponível)"
fi
echo

TARBALL="$(npm pack "$PKG" 2>/dev/null | tail -n1 || true)"
if [[ -z "$TARBALL" || ! -f "$TARBALL" ]]; then
  echo "Falha ao criar/achar tarball para $PKG."
  exit 3
fi
echo "Tarball: $TARBALL"
echo

if command -v openssl >/dev/null 2>&1; then
  LOCAL_BASE64="$(openssl dgst -sha512 -binary "$TARBALL" | openssl base64 -A)"
  LOCAL_INTEGRITY="sha512-$LOCAL_BASE64"
  echo "Hash local: $LOCAL_INTEGRITY"
  if [[ -n "$DIST_INTEGRITY" && "$LOCAL_INTEGRITY" == "$DIST_INTEGRITY" ]]; then
    echo "OK — tarball corresponde ao dist.integrity."
  else
    echo "AVISO — tarball NÃO corresponde ao dist.integrity (ou dist.integrity ausente)."
  fi
else
  echo "openssl não encontrado — não foi possível verificar integridade."
fi
echo

echo "Conteúdo do tarball (resumo):"
tar -tf "$TARBALL" | sed -n '1,200p'
echo

echo "Mostrando package/install.js (até 200 linhas) se existir:"
if tar -xOzf "$TARBALL" package/install.js > "$TMPDIR/install.js" 2>/dev/null; then
  sed -n '1,200p' "$TMPDIR/install.js" || true
else
  echo "package/install.js não existe."
fi
echo

echo "package.json do tarball:"
if tar -xOzf "$TARBALL" package/package.json > "$TMPDIR/package.json" 2>/dev/null; then
  if command -v jq >/dev/null 2>&1; then
    jq . "$TMPDIR/package.json"
  else
    cat "$TMPDIR/package.json"
  fi
else
  echo "package/package.json não encontrado."
fi
echo

echo "Resumo: não aprova builds automaticamente. Se tudo estiver limpo, usa 'pnpm approve-builds <pkg>@<vers>'."
