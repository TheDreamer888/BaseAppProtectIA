MIT-0 / internal utility service.

# api-c

Serviço utilitário em C, focado em estabilidade e baixa latência: resolução DNS e
download HTTP(S) seguro (via libcurl), pensado para correr numa imagem Fedora mínima.

## Endpoints

- `GET /health` — verificação de disponibilidade.
- `GET /dns?host=<hostname>` — resolve um hostname (IPv4/IPv6) usando `getaddrinfo`.
  O hostname é validado (apenas letras, números, `.` e `-`, até 253 caracteres)
  antes de ser resolvido.
- `GET /fetch?url=<url>` — descarrega o conteúdo de um URL `http`/`https` usando
  libcurl (equivalente a `curl`/`wget`), com mitigação básica de SSRF: o hostname é
  resolvido antes do pedido e IPs privados, loopback ou link-local são rejeitados.
  O corpo da resposta é limitado a 2 MiB e o pedido expira ao fim de 8 segundos.

Todas as respostas são JSON. Erros de validação devolvem `400`; falhas de rede
devolvem `502`.

## Build local (dentro do contentor)

```sh
make            # gera ./bin/api-c
PORT=8090 ./bin/api-c
```

## Dependências

- `glibc` (resolução DNS via `getaddrinfo`)
- `libcurl` (pedidos HTTP/HTTPS)

## Variáveis de ambiente

| Variável | Omissão | Descrição |
| --- | --- | --- |
| `PORT` | `8090` | Porta TCP onde o servidor escuta. |

## Segurança

- `/fetch` recusa esquemas diferentes de `http`/`https` e IPs privados/loopback
  (mitigação de SSRF, OWASP A10:2021).
- Tamanho de resposta e tempo de pedido limitados para evitar exaustão de recursos.
- O servidor corre com um utilizador sem privilégios dentro do contentor.
