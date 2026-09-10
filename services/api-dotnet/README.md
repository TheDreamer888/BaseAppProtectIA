# Aegis API (.NET)

Serviço ASP.NET Core (`net10.0`) para endpoints HTTP e integração com frontend.

## O que expõe

- `GET /health`
- `GET /weatherforecast` (endpoint base de exemplo)

## Requisitos

- .NET SDK 10

## Executar localmente

```bash
cd services/api-dotnet/WebApplication1
dotnet restore
dotnet run
```

Por padrão, a API responde em `http://localhost:8080` no container e em porta local definida pelo `dotnet run`.

## Verificação

```bash
dotnet restore services/api-dotnet/WebApplication1/WebApplication1.csproj
dotnet build services/api-dotnet/WebApplication1/WebApplication1.csproj --no-restore
```

Na raiz do monorepo, o equivalente é:

```bash
pnpm run check:dotnet
```

## CORS

As origens permitidas podem ser definidas em `Cors:AllowedOrigins` (separadas por vírgula). Sem configuração explícita, o fallback é `http://localhost:5173`.

## Docker

```bash
docker build -t aegis-api-dotnet services/api-dotnet
docker run --rm -p 8080:8080 aegis-api-dotnet
```
