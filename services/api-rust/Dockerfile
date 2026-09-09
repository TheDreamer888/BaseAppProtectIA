# syntax=docker/dockerfile:1

# --- build stage ---
FROM rust:1.90-slim AS build
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Warm-up de dependências: compila um main.rs vazio só para cachear
# a compilação das crates (Cargo.lock), sem depender do código real ainda.
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN --mount=type=cache,target=/app/target \
    --mount=type=cache,target=/usr/local/cargo/registry \
    cargo build --release --locked && rm -rf src

# Agora entra o código real — só isto invalida o cache das camadas seguintes,
# as dependências já compiladas continuam cacheadas.
COPY src ./src
RUN touch src/main.rs
RUN --mount=type=cache,target=/app/target \
    --mount=type=cache,target=/usr/local/cargo/registry \
    cargo build --release --locked \
    && cp target/release/api-rust /app/plataforma

# --- runtime stage ---
FROM debian:bookworm-20250908-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 curl \
    && rm -rf /var/lib/apt/lists/*

# Utilizador criado ANTES do COPY --chown, senão o chown falha
# (o UID/GID têm de já existir na imagem nesse ponto)
RUN groupadd --gid 10001 appuser \
    && useradd --uid 10001 --gid appuser --create-home --shell /bin/false appuser

WORKDIR /app
COPY --from=build --chown=appuser:appuser /app/plataforma ./plataforma

USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["./plataforma"]