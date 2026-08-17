#!/bin/bash
cat << 'EOF'
╔══════════════════════════════════════════════╗
║            Camada de Apresentação            ║
║   (UI / WebApplication1 - Autenticação,      ║
║    validação de inputs, proteção XSS/CSRF)   ║
╚══════════════════════════════════════════════╝
                     │
                     ▼
╔══════════════════════════════════════════════╗
║          Camada de Lógica de Negócio         ║
║   (src/ - Regras, RBAC/ABAC, auditoria,      ║
║    masking de dados, integração segurança)   ║
╚══════════════════════════════════════════════╝
                     │
                     ▼
╔══════════════════════════════════════════════╗
║           Camada de Persistência SQL          ║
║   (ORM, queries parametrizadas, RLS,          ║
║    Field-Level Security, proteção PII)        ║
╚══════════════════════════════════════════════╝
                     │
                     ▼
╔══════════════════════════════════════════════╗
║          Camada de Infraestrutura             ║
║   (scripts/, venv/, configs - TLS, GPG,       ║
║    logging, CI/CD, monitorização)             ║
╚══════════════════════════════════════════════╝
                     │
                     ▼
╔══════════════════════════════════════════════╗
║             Camada de Testes                  ║
║   (tests/ - Unitários, integração, fuzzing,   ║
║    SQL injection, auditoria contínua)         ║
╚══════════════════════════════════════════════╝
EOF
