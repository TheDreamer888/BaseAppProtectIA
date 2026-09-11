# Arquitetura

## Visao geral

O frontend React e servido pelo Nginx. As APIs sao servicos independentes e
compartilham apenas contratos HTTP e a infraestrutura local. PostgreSQL e
Redis sao dependencias de desenvolvimento fornecidas pelo Docker Compose.

```text
Browser
   |
   v
Frontend React/Vite -> Nginx :5173
   |-- API Python :8000 -> Cloudflare / scoring / autenticacao
   |-- API Rust :3000 ----> PostgreSQL :5432
   |-- API .NET :8080 ----> endpoints ASP.NET
   `-- API C :8090 --------> DNS / fetch HTTP seguro

Redis :6379 fica disponivel para componentes que precisem de cache ou filas.
```

## Limites de responsabilidade

- `apps/frontend`: apresentacao, fluxo de login e WebAuthn.
- `services/api-python`: dominio principal da aplicacao.
- `services/api-rust`: operacoes que exigem baixa latencia e acesso a dados.
- `services/api-dotnet`: servico ASP.NET independente.
- `infra`: verificacoes e automacao, sem codigo de negocio.
- `docs`: contratos operacionais e decisoes de organizacao.

Cada servico deve manter seu manifesto, Dockerfile, README e comandos de
validacao no proprio diretorio. A raiz coordena apenas tarefas compostas.
# Arquitetura da Aegis

## Blocos

| Bloco | Local | Responsabilidade | Entrada principal |
| --- | --- | --- | --- |
| Produto | `apps/frontend` | Interface web, sessão e WebAuthn | Navegador |
| API principal | `services/api-python` | Autenticação, DNS e risco | Frontend |
| API de performance | `services/api-rust` | Operações de baixa latência | Frontend e serviços |
| API .NET | `services/api-dotnet` | Serviço complementar ASP.NET | Frontend e integrações |
| API C | `services/api-c` | DNS e fetch HTTP(S) seguro | Frontend e integrações |
| Dados | `postgres` no Compose | Persistência relacional | APIs |
| Cache | `redis` no Compose | Cache e estado transitório | APIs |
| Operação | `infra` | Checks, certificados e comandos operacionais | CI/CD e desenvolvimento |
| Automação | `.github/workflows` | Validação e tarefas automatizadas | GitHub Actions |

## Fluxo local

```text
Navegador
   |
   v
frontend:5173
   |---------------------> api-python:8000 -----> postgres:5432
   |---------------------> api-rust:3000   -----> postgres:5432
   |---------------------> api-c:8090
   |---------------------> api-dotnet:8080
   \                                      \-----> redis:6379
```

## Ordem recomendada para trabalhar

1. `docker-compose.yml` para subir dependências e serviços.
2. `apps/frontend` para fluxos de usuário e autenticação.
3. `services/api-python` para regras principais e integrações.
4. `services/api-rust` e `services/api-dotnet` para capacidades específicas.
5. `infra/scripts` e `.github/workflows` para operação e automação.

## Regras de organização

- Código de interface fica em `apps/`.
- Código de backend fica em `services/`.
- Scripts que operam o ambiente ficam em `infra/scripts/`.
- Documentação técnica fica em `docs/`.
- Segredos ficam fora do Git; apenas arquivos `.example` são versionados.
- A raiz mantém somente contratos globais: Compose, manifests do workspace,
  variáveis de exemplo e documentação de entrada.