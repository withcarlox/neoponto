import { db } from './config/firebase';

async function testFirebaseConnection() {
  try {
    // Tenta fazer uma operação simples no Firestore
    const testDoc = await db.collection('test').add({
      timestamp: new Date(),
      message: 'Test connection'
    });
    
    console.log('Conexão com Firebase estabelecida com sucesso!');
    console.log('Test document created with ID:', testDoc.id);
    
    // Limpa o documento de teste
    await testDoc.delete();
    
  } catch (error) {
    console.error('Erro ao conectar com Firebase:', error);
  }
}

testFirebaseConnection();
