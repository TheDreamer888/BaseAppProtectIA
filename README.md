# Aegis

Monorepo com foco em proteção digital, autenticação forte e educação assistida por IA.
A estrutura está organizada por domínio: aplicações de interface (`apps/`),
serviços backend (`services/`) e automação/infraestrutura (`infra/`).

## Estrutura

```
apps/
  frontend/            React + Vite + TypeScript
services/
  api-python/          FastAPI (autenticação, DNS e scoring de risco)
  api-rust/            Axum (API de alto desempenho)
  api-dotnet/          ASP.NET (.NET 10)
infra/
  scripts/             Scripts de verificação e manutenção
  arquitetura.sh       Diagrama textual da arquitetura
.github/workflows/     Pipelines CI/CD
```

## Pré-requisitos

- Node.js 24 e pnpm 10
- Python 3.12 e Poetry
- Rust e Cargo
- .NET SDK 10
- Docker Desktop (opcional para stack completa)

## Setup rápido

```bash
pnpm install
pnpm run build
pnpm run lint:frontend
pnpm run check:python
pnpm run check:rust
pnpm run check:dotnet
```

> O workspace pnpm inclui `apps/*`. Cada serviço em `services/*` mantém o seu
> próprio ciclo de dependências e build.

## Execução por componente

### Frontend (`apps/frontend`)

```bash
pnpm --filter frontend dev
```

### API Python (`services/api-python`)

```bash
cd services/api-python
poetry install
poetry run uvicorn src.app.main:app --reload
```

### API Rust (`services/api-rust`)

```bash
cd services/api-rust
cargo run
```

### API .NET (`services/api-dotnet`)

```bash
cd services/api-dotnet/WebApplication1
dotnet run
```

## Stack completa com Docker

```bash
docker compose up --build
```

Serviços locais:

- Frontend: `http://localhost:5173`
- API Python: `http://localhost:8000`
- API Rust: `http://localhost:3000`
- API .NET: `http://localhost:8080`

## Boas práticas de segurança

- Copiar `.env.example` / `.env.auth.example` antes de executar serviços
- Nunca versionar ficheiros `.env` reais
- Executar verificações (`lint`, `check:*`, scans de dependências) antes de merge
