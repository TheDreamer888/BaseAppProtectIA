FROM fedora:41 AS build
RUN dnf install -y --setopt=install_weak_deps=False dotnet-sdk-10.0 && dnf clean all
WORKDIR /src
COPY WebApplication1/*.csproj WebApplication1/
RUN dotnet restore WebApplication1/WebApplication1.csproj
COPY WebApplication1/ WebApplication1/
RUN dotnet publish WebApplication1/WebApplication1.csproj -c Release -o /app --no-restore

FROM fedora:41
RUN dnf install -y --setopt=install_weak_deps=False dotnet-runtime-10.0 curl \
    && dnf clean all \
    && useradd --create-home --shell /sbin/nologin appuser
WORKDIR /app
COPY --from=build /app .
USER appuser
EXPOSE 8080
HEALTHCHECK CMD curl -f http://localhost:8080/health || exit 1
ENTRYPOINT ["dotnet", "WebApplication1.dll"]

