# Azure App Starter

Projeto base organizado para desenvolvimento seguro com Python e integração Azure.

## Estrutura

- app.py: ponto de entrada da aplicação
- src/app/: código da aplicação
- requirements.txt: dependências pinadas
- .env.example: variáveis de ambiente

## Como usar

1. Crie o ambiente virtual:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Instale as dependências:
   ```powershell
   pip install -r requirements.txt
   ```

3. Execute a aplicação:
   ```powershell
   uvicorn app:app --reload
   ```

4. Acesse:
   - http://localhost:8000/health
