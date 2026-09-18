# Aegis

Monorepo do ProtectIA, organizado por responsabilidade: interface em `apps/`,
APIs em `services/` e automações em `infra/`.

## Mapa do projeto

| Caminho | Responsabilidade | Porta |
| --- | --- | ---: |
| `apps/frontend` | React, Vite, TypeScript e autenticação | `5173` |
| `services/api-python` | API principal FastAPI, DNS e risco | `8000` |
| `services/api-rust` | Serviço Axum com PostgreSQL | `3000` |
| `services/api-dotnet/WebApplication1` | API ASP.NET .NET 10 | `8080` |
| `infra/scripts` | Scripts de manutenção e validação | - |

Cada serviço mantém seu próprio ciclo de build e manifesto. O workspace pnpm
gerencia apenas `apps/*`; Docker Compose integra a stack local.

## Estrutura

```
apps/
  frontend/          React + Vite + TypeScript (UI, autenticação/WebAuthn)
services/
  api-python        FastAPI (API principal, DNS via Cloudflare, scoring de risco)
  api-rust          Axum (API de alta performance, Postgres/Redis)
  api-dotnet        ASP.NET (serviço .NET 10)
infra/
  scripts/            Scripts de manutenção e verificação
  arquitetura.sh      Diagrama textual da arquitetura em camadas
.github/workflows/    CI/CD (inclui sincronização de DNS com a Cloudflare)
```

## Pré-requisitos

- Node.js 24 e pnpm 10
- Python 3.12 e Poetry
- Rust e Cargo
- .NET SDK 10
- Docker Desktop, para executar a stack completa

## Comandos pela raiz

```powershell
pnpm install
pnpm run build
pnpm run lint:frontend
pnpm run check:python
pnpm run check:rust
pnpm run check:dotnet
```

Os comandos `check:*` dependem do SDK correspondente instalado no ambiente.
Para instalações reproduzíveis, use `pnpm run install:ci`.

## Como executar cada serviço

### Frontend (`apps/frontend`)
```powershell
pnpm --filter frontend dev
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

## Stack completa com Docker

```powershell
docker compose up --build
```

Serviços publicados localmente: frontend em `http://localhost:5173`, API
Python em `http://localhost:8000`, API Rust em `http://localhost:3000` e API
.NET em `http://localhost:8080`.

## Variáveis de ambiente

Use `.env.example` como referência para a stack e `.env.auth.example` para os
provedores de autenticação. Arquivos `.env` reais devem permanecer locais.

## Convenções

- Código de cada serviço fica dentro do seu diretório e não compartilha
  dependências entre linguagens.
- Artefatos de build, caches, modelos e segredos são ignorados pelo Git.
- Mudanças no frontend passam por lint e build; mudanças em um serviço passam
  pelo respectivo comando `check:*`.

