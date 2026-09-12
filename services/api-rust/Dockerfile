# --- build stage ---
FROM rust:1.90-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

# --- runtime stage ---
FROM debian:bookworm-20250908-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 curl wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/release/api-rust ./api-rust

RUN useradd --create-home --shell /bin/false appuser
USER appuser

EXPOSE 3000
HEALTHCHECK CMD if command -v curl >/dev/null 2>&1; then curl -fsS http://localhost:3000/health >/dev/null; elif command -v wget >/dev/null 2>&1; then wget -qO- http://localhost:3000/health >/dev/null; else exit 1; fi

CMD ["./api-rust"]
