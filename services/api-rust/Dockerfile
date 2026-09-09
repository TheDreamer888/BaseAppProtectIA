# --- build stage ---
FROM rust:1-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

# --- runtime stage ---
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/release/api-rust ./api-rust

RUN useradd --create-home --shell /bin/false appuser
USER appuser

EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["./api-rust"]
