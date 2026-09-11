# --- build stage ---
FROM fedora:41 AS build
RUN dnf install -y --setopt=install_weak_deps=False gcc make libcurl-devel && dnf clean all
WORKDIR /app
COPY Makefile ./
COPY src ./src
RUN make

# --- runtime stage ---
FROM fedora:41
RUN dnf install -y --setopt=install_weak_deps=False libcurl ca-certificates wget curl \
    && dnf clean all \
    && useradd --create-home --shell /sbin/nologin appuser
WORKDIR /app
COPY --from=build /app/bin/api-c ./api-c

USER appuser
ENV PORT=8090
EXPOSE 8090
HEALTHCHECK CMD curl -f http://localhost:8090/health || exit 1

CMD ["./api-c"]
