# Configuracao

A stack usa `.env` na raiz para o Docker Compose. Os serviços executados fora do
Compose carregam a configuração a partir do diretório de cada serviço; a API
Python, em particular, usa `services/api-python/.env`. Os arquivos reais nunca
devem ser commitados.

## Primeiro setup

```powershell
Copy-Item .env.example .env
Copy-Item .env.example services/api-python/.env
```

Preencha pelo menos `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `SECRET_KEY`, `SESSION_ENC_KEY` e `SESSION_JWT_SECRET`. Para gerar os segredos:

```powershell
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

As credenciais OAuth de `.env.auth.example` sao opcionais. Copie apenas os pares do provedor desejado para o `.env` existente; nao substitua o arquivo inteiro.

## Variaveis por responsabilidade

| Grupo | Variaveis | Uso |
| --- | --- | --- |
| PostgreSQL | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Banco usado pelo Compose e pela API Rust |
| Redis | `REDIS_PASSWORD` | Cache e filas locais |
| API Python | `SECRET_KEY`, `SESSION_ENC_KEY`, `SESSION_JWT_SECRET`, `CORS_ORIGINS` | Configuração, sessões e CORS; usar `services/api-python/.env` |
| API Rust | `DATABASE_URL`, `PORT` | Conexao e porta do servico |
| Frontend | `PUBLIC_API_URL`, `PUBLIC_FRONTEND_URL` | URLs publicas usadas pela UI |
| SDK | `SDK_CLIENT_ID`, `SDK_ENC_KEY` | Credenciais da SDK apenas no backend; a chave deve ser guardada num gestor de segredos |
| OAuth | `*_CLIENT_ID`, `*_CLIENT_SECRET` | Provedores de login opcionais, incluindo Google, Microsoft, GitHub e Amazon |
| Cloudflare | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` | Rotas de DNS |
| AuryonSafe providers | `VIRUSTOTAL_API_KEY`, `ABUSEIPDB_API_KEY`, `BITDEFENDER_API_KEY`, `BITWARDEN_API_URL` | Integrações opcionais de reputação e cofre, apenas no backend |

No Compose, `DATABASE_URL` é montada automaticamente a partir das variáveis do
PostgreSQL. Para rodar a API Rust fora do Docker, exporte `DATABASE_URL` (ou
coloque-a em `services/api-rust/.env`) com `localhost` como host.

## Regras

- Nunca coloque segredos em `README`, logs, imagens Docker ou arquivos rastreados.
- Nunca envie `SDK_CLIENT_ID`, `*_CLIENT_SECRET` ou tokens para o frontend; as integrações são usadas exclusivamente no backend.
- Os provedores VirusTotal, AbuseIPDB, Bitdefender e Bitwarden permanecem desligados quando as variáveis acima não estão definidas. O endpoint local `/api/security/analyze` continua disponível sem essas chaves e identifica as fontes efetivamente usadas.
- Em produção, cifre os valores persistidos da SDK com `SDK_ENC_KEY` e forneça a chave através de um gestor de segredos.
- Use nomes de variaveis em maiusculas e sem aspas desnecessarias.
- Mantenha `.env.example` atualizado quando uma variavel obrigatoria mudar.
- Se uma variavel for especifica de um ambiente, documente o valor local e o valor de producao separadamente.
