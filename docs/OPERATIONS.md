# Operacao local

## Subir a stack

```powershell
Copy-Item .env.example .env
docker compose config --quiet
docker compose up --build
```

Para subir em segundo plano:

```powershell
docker compose up --build -d
docker compose ps
```

## Parar e limpar

```powershell
docker compose down
docker compose down -v
```

`down -v` remove os volumes locais de PostgreSQL e Redis. Use somente quando quiser apagar os dados de desenvolvimento.

## Validacao

```powershell
pnpm run check:python
pnpm run check:rust
pnpm run check:dotnet
Push-Location services/api-c; make; Pop-Location
pnpm run audit:security
```

`validate:compose` e `check:all` ainda não são scripts definidos no
`package.json`; use os comandos equivalentes acima até esses atalhos serem
adicionados.

Para verificar certificados antes de uma release:

```powershell
python3 infra/scripts/check-cert-expiry.py api.exemplo.com app.exemplo.com
```

## Diagnostico rapido

- `docker compose config --quiet` falha: revise `.env` e as variaveis obrigatorias.
- API Python nao inicia: confirme `SECRET_KEY` e os segredos de sessao.
- API Rust fica `unhealthy`: confirme PostgreSQL e `DATABASE_URL`.
- Frontend nao carrega: confirme que a porta `5173` esta livre e que os quatro backends iniciaram.
- Logs: `docker compose logs -f <servico>`.
