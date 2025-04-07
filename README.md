# Neoponto - Sistema de Marcação de Ponto

Sistema web para marcação de ponto desenvolvido em TypeScript.

## Funcionalidades

- Marcação de ponto com matrícula
- Área administrativa com login
- Cadastro de usuários
- Busca de usuários por departamento
- Comprovante de ponto em pop-up com tipo de registro (entrada, saída almoço, etc.)
- Download de relatório de ponto individual em CSV
- Armazenamento em SQLite

## Requisitos

- Node.js (versão 14 ou superior)
- npm (gerenciador de pacotes do Node.js)

## Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd neoponto
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

O sistema estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
neoponto/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── public/
│   │   ├── css/
│   │   │   ├── admin/
│   │   │   └── point/
│   │   ├── js/
│   │   │   ├── admin/
│   │   │   └── point/
│   │   └── img/
│   ├── routes/
│   │   └── api.ts
│   ├── views/
│   │   ├── admin.html
│   │   └── point.html
│   └── server.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Uso

### Marcação de Ponto
1. Acesse a página inicial
2. Digite sua matrícula (5 primeiros dígitos do CPF)
3. Clique em "Marcar Ponto"
4. Um pop-up mostrará o comprovante com nome, matrícula, data, hora e tipo de registro

### Área Administrativa
1. Acesse a área administrativa
2. Faça login com:
   - Usuário: admin
   - Senha: admin123
3. Cadastre novos usuários ou busque usuários existentes por departamento
4. Na busca de usuários, clique no botão "Relatório" para baixar o relatório de ponto individual em CSV

## Desenvolvimento

Para iniciar o servidor em modo de desenvolvimento com hot-reload:
```bash
npm run dev
```

## Licença

Este projeto está sob a licença MIT. 