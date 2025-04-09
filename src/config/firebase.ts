import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Use environment variable in production
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  try {
    // Use local file in development
    const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
    serviceAccount = require(serviceAccountPath);
  } catch (error) {
    console.error('Erro ao carregar as credenciais do Firebase. Certifique-se de que o arquivo firebase-service-account.json existe na raiz do projeto ou que a variável de ambiente FIREBASE_SERVICE_ACCOUNT está configurada.');
    process.exit(1);
  }
}

const app = initializeApp({
  credential: cert(serviceAccount)
});

// Exporta as instâncias do Firestore e Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  TIME_RECORDS: 'time_records'
} as const;

// Função helper para converter timestamp do Firestore
export const fromFirestoreTimestamp = (timestamp: FirebaseFirestore.Timestamp) => {
  return timestamp.toDate();
};

// Função helper para converter para timestamp do Firestore
export const toFirestoreTimestamp = (date: Date) => {
  return FirebaseFirestore.Timestamp.fromDate(date);
};
