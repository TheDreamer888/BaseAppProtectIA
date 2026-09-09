# BaseGuard Frontend

Aplicação React + Vite + TypeScript responsável pela experiência de proteção,
educação e autenticação do utilizador.

## Funcionalidades principais

- Painel de proteção com estado de monitorização e quarentena
- Área de educação com percursos e treino financeiro
- Fluxo de login com provedores OAuth, passkeys e recuperação

## Requisitos

- Node.js 24+
- pnpm 10+

## Execução local

```bash
cd apps/frontend
pnpm install
pnpm dev
```

A aplicação fica disponível em `http://localhost:5173`.

## Qualidade

```bash
pnpm lint
pnpm build
```

## Estrutura relevante

- `src/App.tsx`: shell principal e navegação entre áreas
- `src/components/LoginTab.tsx`: autenticação e recuperação de conta
- `src/auth/*`: cliente de autenticação e armazenamento seguro
