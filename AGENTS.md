# Instrucoes para agentes e bots

## Regra obrigatoria de testes

- Execute testes somente em ambiente virtual, sandbox ou outro ambiente explicitamente isolado.
- Nunca teste diretamente em producao, em servicos compartilhados ou em sistemas existentes do usuario.
- Nunca use credenciais, bancos de dados, filas, buckets, volumes ou endpoints de producao para testes.
- Prefira dados sinteticos e recursos efemeros; use containers, mocks e fixtures quando possivel.
- Ao usar Docker Compose, confirme que o projeto esta isolado e que nao reutiliza volumes, redes, containers ou portas de outro ambiente.
- Nao execute migracoes, comandos destrutivos, limpeza de recursos ou alteracoes de infraestrutura fora do sandbox.
- Se o isolamento nao puder ser garantido, pare e peca autorizacao explicita antes de executar qualquer teste ou comando que possa alterar dados.
- Antes de testar, declare qual ambiente sera usado e valide que ele e descartavel ou restauravel.
