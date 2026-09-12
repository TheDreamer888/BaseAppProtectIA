# Aegis API (Rust)

API em Rust (Axum) orientada a desempenho para endpoints de backend.

## O que expõe

- `GET /api/hello`
- `GET /health`

> O endpoint de `health` valida também a ligação à base de dados.

## Requisitos

- Rust + Cargo
- `DATABASE_URL` configurada

## Executar localmente

```bash
cd services/api-rust
cargo run
```

Por padrão, a API sobe em `http://localhost:3000`.

## Verificação

```bash
cargo check
```

Na raiz do monorepo, o equivalente é:

```bash
pnpm run check:rust
```

## Docker

```bash
docker build -t aegis-api-rust services/api-rust
docker run --rm -p 3000:3000 --env DATABASE_URL="<url>" aegis-api-rust
```
