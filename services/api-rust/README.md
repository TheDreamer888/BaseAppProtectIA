# API Rust

Servico Axum para operacoes de baixa latencia. Usa PostgreSQL para o health check e expoe a porta `3000` por padrao.

## Executar localmente

Na raiz do repositorio, configure `DATABASE_URL` no `.env` e rode:

```powershell
cd services/api-rust
cargo run
```

Verificacoes rapidas:

```powershell
cargo check --locked
cargo test --locked
Invoke-RestMethod http://localhost:3000/health
```

## Endpoints atuais

- `GET /health`: verifica a conexao com PostgreSQL.
- `GET /api/hello`: endpoint de exemplo.

## Docker

O servico e iniciado pelo Compose na raiz. Para executar somente sua imagem:

```powershell
docker compose up --build api-rust postgres
```
