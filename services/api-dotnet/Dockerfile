FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY WebApplication1/*.csproj WebApplication1/
RUN dotnet restore WebApplication1/WebApplication1.csproj
COPY WebApplication1/ WebApplication1/
RUN dotnet publish WebApplication1/WebApplication1.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
RUN apt-get update && apt-get install -y --no-install-recommends curl wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
HEALTHCHECK CMD if command -v curl >/dev/null 2>&1; then curl -fsS http://localhost:8080/health >/dev/null; elif command -v wget >/dev/null 2>&1; then wget -qO- http://localhost:8080/health >/dev/null; else exit 1; fi
ENTRYPOINT ["dotnet", "WebApplication1.dll"]
