import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { FirestoreService } from '../services/firestore';
import { JWT_SECRET, DEFAULT_ADMIN_PASSWORD } from '../config/auth';
import type { User, TimeRecord } from '../types/firestore';

const router = express.Router();

interface JwtPayload {
    id: string;
    role: string;
}

// Middleware para verificar token de administrador
const verifyAdminToken = (req: Request, res: Response, next: Function) => {
    console.log('Verificando token de administrador...');
    const authHeader = req.headers.authorization;
    console.log('Header de autorização:', authHeader);

    if (!authHeader) {
        console.log('Token não fornecido');
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extraído:', token);

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        console.log('Token decodificado:', decoded);

        if (decoded.role !== 'admin') {
            console.log('Usuário não é administrador');
            return res.status(403).json({ message: 'Acesso negado' });
        }
        console.log('Token válido, prosseguindo...');
        next();
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        return res.status(401).json({ message: 'Token inválido' });
    }
};

// Cadastrar usuário
router.post('/admin/users', verifyAdminToken, async (req: Request, res: Response) => {
    console.log('Iniciando cadastro de usuário...');
    console.log('Body recebido:', req.body);

    const { name, cpf, email, role, department } = req.body;

    // Validar se todos os campos foram fornecidos
    if (!name || !cpf || !email || !role || !department) {
        console.log('Campos faltando:', { name, cpf, email, role, department });
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    try {
        // Validar CPF (11 dígitos)
        if (cpf.length !== 11) {
            console.log('CPF inválido:', cpf);
            return res.status(400).json({ message: 'CPF deve conter 11 dígitos' });
        }

        // Verificar se já existe usuário com mesmo CPF ou email
        const existingUserByEmail = await FirestoreService.getUserByEmail(email);
        if (existingUserByEmail) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        // Criar usuário
        const userId = await FirestoreService.createUser({
            name,
            cpf,
            email,
            role,
            department
        });

        console.log('Usuário cadastrado com sucesso, ID:', userId);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ message: 'Erro ao cadastrar usuário' });
    }
});

// Buscar usuários por departamento
router.get('/admin/users', verifyAdminToken, async (req: Request, res: Response) => {
    const { department } = req.query;
    console.log('Tentativa de busca de usuários por departamento:', department);

    try {
        const users = await FirestoreService.getUsersByDepartment(department as string);
        res.json(users);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Erro ao buscar usuários' });
    }
});

// Marcar ponto
router.post('/point', async (req: Request, res: Response) => {
    const { registration } = req.body;

    try {
        const user = await FirestoreService.getUserByCpfPrefix(registration);
        
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Verificar registros do dia
        const records = await FirestoreService.getTimeRecordsForToday(user.id);
        
        if (records.length >= 4) {
            return res.status(400).json({ message: 'Limite de 4 marcações diárias atingido' });
        }

        // Registrar ponto
        await FirestoreService.createTimeRecord(user.id);

        res.json({
            message: 'Ponto registrado com sucesso',
            user: {
                name: user.name,
                registration: user.cpf.substring(0, 5),
                role: user.role,
                email: user.email,
                department: user.department
            }
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao marcar ponto' });
    }
});

// Gerar relatório de ponto
router.get('/time-report/:registration', async (req: Request, res: Response) => {
    const { registration } = req.params;

    try {
        const user = await FirestoreService.getUserByCpfPrefix(registration);
        
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const records = await FirestoreService.getTimeRecordsByUserId(user.id);

        // Gerar CSV
        const csvHeader = 'Nome,Matrícula,Cargo,Departamento,Data,Hora,Tipo\n';
        let csvContent = csvHeader;

        records.forEach(record => {
            const date = record.timestamp.toDate();
            const formattedDate = date.toLocaleDateString('pt-BR');
            const formattedTime = date.toLocaleTimeString('pt-BR');
            const hour = date.getHours();
            const recordType = determineRecordType(hour);

            csvContent += `${user.name},${registration},${user.role},${user.department},${formattedDate},${formattedTime},${recordType}\n`;
        });

        // Enviar arquivo CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_ponto_${registration}.csv`);
        res.send(csvContent);
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao gerar relatório de ponto' });
    }
});

function determineRecordType(hour: number): string {
    if (hour >= 5 && hour < 12) {
        return 'Entrada';
    } else if (hour >= 12 && hour < 14) {
        return 'Saída Almoço';
    } else if (hour >= 14 && hour < 18) {
        return 'Retorno Almoço';
    } else if (hour >= 18) {
        return 'Saída';
    } else {
        return 'Entrada';
    }
}

// Login de administrador
router.post('/admin/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    console.log('Tentativa de login:', { username });

    try {
        const user = await FirestoreService.getUserByEmail(username);

        if (!user || user.role !== 'admin') {
            console.log('Usuário não encontrado ou não é admin');
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Para o primeiro acesso, usar senha padrão
        const isValidPassword = password === DEFAULT_ADMIN_PASSWORD;
        console.log('Senha válida:', isValidPassword);

        if (!isValidPassword) {
            console.log('Senha inválida');
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('Login bem-sucedido, token gerado');
        res.json({ token });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro ao fazer login' });
    }
});

export default router;