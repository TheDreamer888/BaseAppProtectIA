# --- build stage ---
FROM fedora:41 AS build
RUN dnf install -y --setopt=install_weak_deps=False cargo rust openssl-devel pkgconf-pkg-config gcc && dnf clean all
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

# --- runtime stage ---
FROM fedora:41
RUN dnf install -y --setopt=install_weak_deps=False ca-certificates openssl-libs wget \
    && dnf clean all \
    && useradd --create-home --shell /sbin/nologin appuser
WORKDIR /app
COPY --from=build /app/target/release/api-rust ./api-rust

USER appuser

EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["./api-rust"]
