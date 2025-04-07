import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './config/database';
import apiRoutes from './routes/api';

const app = express();
const port = process.env.PORT || 3000;

// Configuração do CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsing JSON
app.use(express.json());

// Middleware para logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'src', 'public')));

// Rotas da API
app.use('/api', apiRoutes);

// Rotas das páginas
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'src', 'views', 'point.html'));
});

app.get('/admin', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'src', 'views', 'admin.html'));
});

// Middleware de tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota para lidar com 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicialização do banco de dados
initializeDatabase().catch((error: Error) => {
  console.error('Erro ao inicializar o banco de dados:', error);
  process.exit(1);
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
}); 