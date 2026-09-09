## Machine learning

Os módulos de ML ficam em `src/ml` e não fazem parte do caminho HTTP principal.
O código atual é uma implementação determinística em Python e não exige
dependências adicionais.

```powershell
poetry install
```

Quando bibliotecas de treino ou inferência forem adicionadas, declare-as como
um grupo opcional no `pyproject.toml` e regenere o `poetry.lock`. Não crie um
segundo manifesto de dependências fora do Poetry.

Antes de treinar um modelo, confirme que os diretórios `data/`, `checkpoints/`
e `models/` estão fora do Git, conforme o `.gitignore` da raiz.
