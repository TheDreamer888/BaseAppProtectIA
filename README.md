# BaseAppProtectIA

Monorepo organizado em 3 camadas profissionais: `apps/`, `services/`, `infra/`.

## Estrutura

```
apps/
  frontend/          React + Vite + TypeScript (UI, autenticação/WebAuthn)
services/
  api-python/        FastAPI (API principal, DNS via Cloudflare, scoring de risco)
  api-rust/           Axum (API de alta performance, Postgres/Redis)
  api-dotnet/         ASP.NET (serviço .NET)
infra/
  scripts/            Scripts de manutenção e verificação
  arquitetura.sh      Diagrama textual da arquitetura em camadas
.github/workflows/    CI/CD (inclui sincronização de DNS com a Cloudflare)
```

## Como correr cada serviço

### Frontend (`apps/frontend`)
```powershell
cd apps/frontend
pnpm install
pnpm dev
```

### API Python (`services/api-python`)
```powershell
cd services/api-python
poetry install
poetry run uvicorn src.app.main:app --reload
```

### API Rust (`services/api-rust`)
```powershell
cd services/api-rust
cargo run
```

### API .NET (`services/api-dotnet`)
```powershell
cd services/api-dotnet/WebApplication1
dotnet run
```

## Variáveis de ambiente

Copia `.env.example` e `.env.auth.example` para `.env` em cada serviço conforme necessário. Nunca faças commit de ficheiros `.env` reais.

