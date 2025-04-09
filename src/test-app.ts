import { FirestoreService } from './services/firestore';

async function testApp() {
    try {
        console.log('1. Inicializando usuário admin...');
        await FirestoreService.initializeAdminUser();
        
        console.log('\n2. Criando usuário teste...');
        const userId = await FirestoreService.createUser({
            name: 'João Teste',
            cpf: '12345678901',
            email: 'joao@teste.com',
            role: 'funcionario',
            department: 'TI'
        });
        console.log('Usuário criado com ID:', userId);
        
        console.log('\n3. Buscando usuário por CPF...');
        const user = await FirestoreService.getUserByCpfPrefix('12345');
        if (user) {
            console.log('Usuário encontrado:', user);
            
            console.log('\n4. Registrando pontos para o usuário...');
            // Registra 4 pontos com intervalos
            for (let i = 0; i < 4; i++) {
                const recordId = await FirestoreService.createTimeRecord(user.id);
                console.log(`Ponto ${i + 1} registrado com ID:`, recordId);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo entre registros
            }
            
            console.log('\n5. Buscando registros do dia...');
            const records = await FirestoreService.getTimeRecordsForToday(user.id);
            console.log('Registros encontrados:', records);
            
            console.log('\n6. Buscando usuários do departamento TI...');
            const users = await FirestoreService.getUsersByDepartment('TI');
            console.log('Usuários do departamento:', users);
        }
        
        console.log('\nTestes concluídos com sucesso!');
    } catch (error) {
        console.error('Erro durante os testes:', error);
    }
}

testApp();
