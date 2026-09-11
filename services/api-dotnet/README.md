# API .NET

Servico ASP.NET Core em .NET 10. O projeto executavel fica em `WebApplication1/` e escuta a porta `8080` no container.

## Executar localmente

```powershell
cd services/api-dotnet/WebApplication1
dotnet restore
dotnet run --urls http://localhost:8080
```

Verificacoes rapidas:

```powershell
dotnet build --configuration Release
Invoke-RestMethod http://localhost:8080/health
```

## Endpoints atuais

- `GET /health`: liveness do servico.
- `GET /weatherforecast`: endpoint de exemplo.
- `GET /openapi/v1.json`: documento OpenAPI no ambiente de desenvolvimento.

## Docker

A imagem e construida a partir de `services/api-dotnet/` e publicada pelo Compose na porta `8080`.

```powershell
docker compose up --build api-dotnet
```
