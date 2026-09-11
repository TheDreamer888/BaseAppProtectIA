# Agent Guidelines — Aegis / MultiThings

Monorepo com frontend React e três serviços de backend (Python, Rust, .NET). Objetivo do produto: site profissional de proteção/loja ("MultiThings") com autenticação segura (WebAuthn), catálogo e planos de assinatura.

## Antes de codificar

- Leia [README.md](README.md), [docs/architecture/README.md](docs/architecture/README.md), [docs/CONFIGURATION.md](docs/CONFIGURATION.md) e [docs/OPERATIONS.md](docs/OPERATIONS.md) — não duplique o conteúdo deles, apenas siga.
- Nunca commit segredos reais. Apenas arquivos `.env.example` / `.env.auth.example` são versionados.
- Comece pelo arquivo, símbolo, teste ou comportamento mais próximo do pedido; faça a menor alteração que possa ser validada.
- Preserve alterações existentes no worktree. Não faça reset, checkout destrutivo ou refatoração não relacionada.
- Antes de editar, formule uma hipótese local sobre a causa e um teste curto que possa refutá-la.

## Arquitetura (resumo)

```
apps/frontend      React 19 + Vite + TS, servido via Nginx (:5173)
services/api-python FastAPI — auth, DNS, risco, WebAuthn (:8000)
services/api-rust   Axum — baixa latência, acesso a Postgres (:3000)
services/api-dotnet ASP.NET Core .NET 10 (:8080)
infra/              scripts de operação (certs, checks) — sem lógica de negócio
docs/               documentação técnica e contratos
```

Cada serviço mantém seu próprio Dockerfile/README/comandos. A raiz só orquestra (Compose, scripts globais).

## Build e testes

```powershell
pnpm install
pnpm run build               # build do frontend
pnpm run lint:frontend       # oxlint
pnpm run check:python        # compila código Python
pnpm run check:rust          # cargo check
pnpm run check:dotnet        # build do .NET
Push-Location services/api-c; make; Pop-Location # compila a API C (com make/libcurl)
pnpm run audit:security      # pnpm audit --audit-level high
```

Sempre rode o check correspondente ao serviço alterado antes de considerar a tarefa concluída (`check:python`, `check:rust`, `check:dotnet`, `lint:frontend`).

## Convenções do frontend (`apps/frontend/src`)

- TypeScript estrito, sem `any`. Componentes funcionais com hooks (`useState`, `useMemo`, `useCallback`).
- Texto de interface em **português (pt-PT/pt-BR)** — siga o tom já usado em `App.tsx` (ex.: "Varredura concluída", nomes de planos em €).
- Estado de UI local fica em `App.tsx`; chamadas de API ficam isoladas em `src/api/*Client.ts` (ver `booksClient.ts`) com fallback local quando a API está offline (`apiStatus: 'online' | 'offline' | 'loading'`).
- Autenticação (login, WebAuthn, storage seguro) fica em `src/auth/` (`authClient.ts`, `secureStore.ts`, `webauthn.ts`) — não espalhe lógica de auth em componentes de página.
- Componentes de página/seção ficam em `src/components/`; cada componente tem seu próprio `.css` ao lado (ex.: `LoginTab.tsx` + `LoginTab.css`).
- Não introduza bibliotecas de UI/CSS novas sem necessidade — o projeto usa CSS puro por componente.

## Site "profissional" — pontos de atenção

- Acessibilidade: mantenha `aria-label`, `aria-hidden` e navegação por teclado já usados nos componentes existentes.
- Estados de carregamento/erro sempre visíveis ao usuário (ex.: `apiStatusLabel`), nunca falhar silenciosamente.
- Nenhum dado sensível (tokens, senhas) deve ir para `localStorage` sem passar por `secureStore.ts`.
- Ao adicionar páginas/seções novas, siga o padrão de `ActiveView` em `App.tsx` (switch de views) em vez de introduzir um router novo sem discutir antes.
- Mantenha uma hierarquia visual clara: uma ação principal por bloco, textos curtos, contraste suficiente, foco visível e layout estável durante loading.
- Teste a interface em viewport desktop e móvel; não deixe texto, botões, tabelas ou estados de erro sair do contêiner ou exigir scroll horizontal acidental.
- Use os padrões visuais existentes antes de criar componentes novos. Não adicione bibliotecas de UI, ícones ou fontes externas sem necessidade e sem avaliar o impacto no bundle.
- Prefira controles semânticos (`button`, `a`, `label`, `input`) e feedback associado ao elemento que mudou. Ícones decorativos devem ter `aria-hidden="true"`.
- Para fluxos críticos (login, compra, plano, proteção), cubra estados pronto, carregando, sucesso, erro, offline e cancelamento.

## APIs, contratos e documentação

- Chamadas HTTP ficam em clientes próprios; componentes não devem conhecer URLs, headers ou detalhes de serialização.
- Valide entradas nas fronteiras e trate respostas inesperadas. O fallback local deve indicar claramente que a API está offline, sem mascarar erros de autenticação ou autorização.
- Ao alterar endpoint, schema, variável de ambiente ou fluxo de autenticação, atualize o README/contrato do serviço e os arquivos `.example` correspondentes.
- Documente decisões permanentes no documento técnico existente mais próximo; não crie uma nova página para uma nota que já pertence a `docs/CONFIGURATION.md`, `docs/OPERATIONS.md` ou `docs/architecture/README.md`.
- Não inclua tokens, cookies, PII ou payloads sensíveis em logs, mensagens de erro, screenshots ou documentação.

## Testes e entrega

- Depois da primeira edição, rode imediatamente a validação mais estreita disponível; após alterações adjacentes, repita-a antes de ampliar o escopo.
- Para frontend, valide `pnpm run build` e `pnpm run lint:frontend`; para backend, rode o check do serviço alterado e um teste do fluxo afetado quando existir.
- Para mudanças de UI, verifique também teclado, foco, responsividade, estado offline e console sem erros no navegador quando houver ambiente disponível.
- Antes de concluir, revise o diff e confirme que não há arquivos gerados, segredos, mudanças de lockfile não intencionais ou alterações fora do pedido.
- No resumo final, informe arquivos alterados, comportamento entregue, validações executadas e qualquer limitação que permaneça.

## Segurança

- Segue OWASP Top 10: valide entrada nos boundaries de cada API, nunca confie em dados vindos do frontend.
- WebAuthn/autenticação: qualquer mudança em `src/auth/` ou `services/api-python/src/app/auth/` deve preservar o fluxo de recovery e tokens existente (`recovery.py`, `tokens.py`).
