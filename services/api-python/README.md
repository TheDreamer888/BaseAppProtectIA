# AuryonSafe API (Python)

API principal em FastAPI: autenticação, DNS (Cloudflare) e scoring de risco (ver `src/ml`).

## Setup local (venv)

```powershell
cd services/api-python
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install .
```

> Preferir Poetry quando disponível (`poetry install`) — o `pip install .` acima
> serve como alternativa quando o Poetry não está instalado na máquina.

Cria um `.env` nesta pasta (não commitado) com pelo menos `SECRET_KEY`,
`SESSION_ENC_KEY` e `SESSION_JWT_SECRET` — ver `.env.example` na raiz do
repositório. A app recusa arrancar sem `SECRET_KEY` (`settings.require_secret_key()`).

## Correr o servidor

```powershell
.\.venv\Scripts\python.exe -m uvicorn src.app.main:app --reload
```

## Segurança de dependências ("antivírus de pacotes")

Ferramentas de scan já declaradas no grupo `dev` do `pyproject.toml`
(`bandit`, `safety`) mais `pip-audit`, instaladas à parte no venv:

```powershell
.\.venv\Scripts\python.exe -m pip install pip-audit bandit
.\.venv\Scripts\python.exe -m pip_audit          # vulnerabilidades conhecidas (OSV/PyPI Advisory)
.\.venv\Scripts\python.exe -m bandit -r src       # padrões de código inseguro
```

Corre estas verificações antes de cada release e sempre que uma dependência
for adicionada ou atualizada.

## Auditoria de manifestos npm

`POST /api/security/npm/analyze` é um endpoint autenticado que recebe o nome do
pacote e o conteúdo estruturado de um `package.json`. A resposta inclui a
pontuação de risco, o número de dependências analisadas e achados explicáveis
para scripts de ciclo de vida, versões pouco restritivas e origens fora do
registo npm.

O serviço não instala dependências, não executa scripts e não faz pedidos às
URLs declaradas no manifesto. O corpo é limitado a 200 campos de topo e os
nomes dos pacotes a 214 caracteres.

## Verificação de certificados TLS

O script `infra/scripts/check-cert-expiry.py` (na raiz do repositório) valida
a validade/expiração dos certificados TLS dos domínios usados pela app
(`PUBLIC_API_URL`, `PUBLIC_FRONTEND_URL`, domínio Cloudflare):

```powershell
python ../../infra/scripts/check-cert-expiry.py api.exemplo.com app.exemplo.com
```

Alerta (exit code != 0) quando um certificado expira em menos de 15 dias.
