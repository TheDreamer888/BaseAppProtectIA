# Política de segurança

## Reportar uma vulnerabilidade

Se encontrar uma vulnerabilidade, exposição de segredo ou falha de configuração sensível:

- não abra issue pública com detalhes exploráveis
- use o fluxo privado de segurança do GitHub, se estiver ativo
- caso necessário, contacte o mantenedor do repositório em canal privado

## Escopo

Esta política cobre:

- código das aplicações em `apps/` e `services/`
- workflows em `.github/workflows/`
- segredos, variáveis e integrações de infraestrutura

## Boas práticas mínimas

- manter secret scanning e push protection ativos
- rever PRs com impacto em autenticação, CI e infraestrutura
- validar alterações em workflows antes do merge
- remover ou rodar qualquer segredo exposto imediatamente
