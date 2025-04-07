import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';

let db: Database;

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('Iniciando conexão com o banco de dados...');
    db = new sqlite3.Database('./database.sqlite', (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        reject(err);
        return;
      }
      console.log('Conectado ao banco de dados SQLite');
      createTables();
      resolve();
    });
  });
};

const createTables = () => {
  console.log('Criando tabelas...');
  db.serialize(() => {
    // Tabela de usuários
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cpf TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela de usuários:', err);
      } else {
        console.log('Tabela de usuários criada com sucesso');
      }
    });

    // Tabela de pontos
    db.run(`
      CREATE TABLE IF NOT EXISTS time_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela de pontos:', err);
      } else {
        console.log('Tabela de pontos criada com sucesso');
      }
    });

    // Verificar se o usuário admin já existe
    db.get('SELECT * FROM users WHERE email = ?', ['admin@neoponto.com'], (err, row) => {
      if (err) {
        console.error('Erro ao verificar usuário admin:', err);
      } else if (row) {
        console.log('Usuário admin já existe:', row);
      } else {
        console.log('Usuário admin não existe, criando...');
        // Inserir usuário admin padrão
        db.run(`
          INSERT INTO users (name, cpf, email, role, department)
          VALUES ('admin', '00000000000', 'admin@neoponto.com', 'admin', 'Administrativo')
        `, function(err) {
          if (err) {
            console.error('Erro ao inserir usuário admin:', err);
          } else {
            console.log('Usuário admin criado com sucesso, ID:', this.lastID);
          }
        });
      }
    });
  });
};

export const getDatabase = () => db; 