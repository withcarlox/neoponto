import express, { Request, Response } from 'express';
import { getDatabase } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface User {
    id: number;
    name: string;
    cpf: string;
    email: string;
    role: string;
    department: string;
}

interface UserResponse {
    name: string;
    registration: string;
    cpf: string;
    email: string;
    role: string;
    department: string;
}

interface TimeRecord {
    id: number;
    user_id: number;
    timestamp: string;
}

interface JwtPayload {
    id: number;
    role: string;
}

const router = express.Router();

const JWT_SECRET = 'seu_segredo_jwt';

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
    console.log('Headers recebidos:', req.headers);
    console.log('Body recebido:', req.body);

    const { name, cpf, email, role, department } = req.body;
    const db = getDatabase();

    console.log('Dados extraídos do body:', { name, cpf, email, role, department });

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

        // Gerar matrícula (5 primeiros dígitos do CPF)
        const registration = cpf.substring(0, 5);

        db.run(
            'INSERT INTO users (name, cpf, email, role, department) VALUES (?, ?, ?, ?, ?)',
            [name, cpf, email, role, department],
            function(err) {
                if (err) {
                    console.error('Erro ao cadastrar usuário:', err);
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ message: 'CPF ou email já cadastrado' });
                    }
                    return res.status(500).json({ message: 'Erro ao cadastrar usuário' });
                }
                console.log('Usuário cadastrado com sucesso, ID:', this.lastID);
                res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
            }
        );
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ message: 'Erro ao cadastrar usuário' });
    }
});

// Buscar usuários por departamento
router.get('/admin/users', verifyAdminToken, async (req: Request, res: Response) => {
    const { department } = req.query;
    const db = getDatabase();

    console.log('Tentativa de busca de usuários por departamento:', department);

    try {
        db.all(
            'SELECT name, cpf, email, role, department FROM users WHERE department = ?',
            [department],
            (err, rows: User[]) => {
                if (err) {
                    console.error('Erro ao buscar usuários:', err);
                    return res.status(500).json({ message: 'Erro ao buscar usuários' });
                }

                console.log('Usuários encontrados:', rows);

                const users: UserResponse[] = rows.map(user => ({
                    name: user.name,
                    registration: user.cpf.substring(0, 5),
                    cpf: user.cpf,
                    email: user.email,
                    role: user.role,
                    department: user.department
                }));

                res.json(users);
            }
        );
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Erro ao buscar usuários' });
    }
});

// Marcar ponto
router.post('/point', async (req: Request, res: Response) => {
    const { registration } = req.body;
    const db = getDatabase();

    try {
        db.get(
            'SELECT * FROM users WHERE cpf LIKE ?',
            [`${registration}%`],
            (err, user: User | undefined) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao buscar usuário' });
                }

                if (!user) {
                    return res.status(404).json({ message: 'Usuário não encontrado' });
                }

                // Verificar registros do dia
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                db.all(
                    'SELECT COUNT(*) as count FROM time_records WHERE user_id = ? AND timestamp >= ? AND timestamp < ?',
                    [user.id, today.toISOString(), tomorrow.toISOString()],
                    (err, result: any[]) => {
                        if (err) {
                            return res.status(500).json({ message: 'Erro ao verificar registros' });
                        }

                        if (result[0].count >= 4) {
                            return res.status(400).json({ 
                                message: 'Todos os pontos diários já foram batidos. Para hora extra, entre em contato com seu gerente.'
                            });
                        }

                        // Se não atingiu o limite, registra o ponto
                        db.run(
                            'INSERT INTO time_records (user_id) VALUES (?)',
                            [user.id],
                            function(err) {
                                if (err) {
                                    return res.status(500).json({ message: 'Erro ao registrar ponto' });
                                }

                                res.json({
                                    name: user.name,
                                    registration: registration,
                                    cpf: user.cpf,
                                    email: user.email,
                                    department: user.department
                                });
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao marcar ponto' });
    }
});

// Gerar relatório de ponto
router.get('/time-report/:registration', async (req: Request, res: Response) => {
    const { registration } = req.params;
    const db = getDatabase();

    try {
        // Buscar usuário pela matrícula (5 primeiros dígitos do CPF)
        db.get(
            'SELECT * FROM users WHERE cpf LIKE ?',
            [`${registration}%`],
            (err, user: User | undefined) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao buscar usuário' });
                }

                if (!user) {
                    return res.status(404).json({ message: 'Usuário não encontrado' });
                }

                // Buscar registros de ponto do usuário
                db.all(
                    'SELECT * FROM time_records WHERE user_id = ? ORDER BY timestamp',
                    [user.id],
                    (err, records: TimeRecord[]) => {
                        if (err) {
                            return res.status(500).json({ message: 'Erro ao buscar registros de ponto' });
                        }

                        // Gerar CSV
                        const csvHeader = 'Nome,Matrícula,Cargo,Departamento,Data,Hora,Tipo\n';
                        let csvContent = csvHeader;

                        records.forEach(record => {
                            const date = new Date(record.timestamp);
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
                    }
                );
            }
        );
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
    console.log('Tentativa de login:', { username, password });
    const db = getDatabase();

    try {
        db.get(
            'SELECT * FROM users WHERE email = ? AND role = ?',
            [username, 'admin'],
            async (err, user: User | undefined) => {
                if (err) {
                    console.error('Erro ao buscar usuário:', err);
                    return res.status(500).json({ message: 'Erro ao buscar usuário' });
                }

                console.log('Usuário encontrado:', user);

                if (!user) {
                    console.log('Usuário não encontrado');
                    return res.status(401).json({ message: 'Credenciais inválidas' });
                }

                // Para o primeiro acesso, a senha padrão é 'admin123'
                const isValidPassword = password === 'admin123';
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
            }
        );
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro ao fazer login' });
    }
});

export default router; 