import { db, COLLECTIONS } from '../config/firebase';
import type { User, TimeRecord } from '../types/firestore';

export class FirestoreService {
  // Users
  static async createUser(userData: Omit<User, 'createdAt'>): Promise<string> {
    const userRef = await db.collection(COLLECTIONS.USERS).add({
      ...userData,
      createdAt: new Date()
    });
    return userRef.id;
  }

  static async getUserByEmail(email: string): Promise<(User & { id: string }) | null> {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() as User };
  }

  static async getUserById(id: string): Promise<(User & { id: string }) | null> {
    const doc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() as User };
  }

  static async getUserByCpfPrefix(prefix: string): Promise<(User & { id: string }) | null> {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('cpf', '>=', prefix)
      .where('cpf', '<=', prefix + '\uf8ff')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() as User };
  }

  static async getUsersByDepartment(department: string): Promise<(User & { id: string })[]> {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('department', '==', department)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as User
    }));
  }

  // Time Records
  static async createTimeRecord(userId: string): Promise<string> {
    const recordRef = await db.collection(COLLECTIONS.TIME_RECORDS).add({
      userId,
      timestamp: new Date()
    });
    return recordRef.id;
  }

  static async getTimeRecordsByUserId(userId: string): Promise<(TimeRecord & { id: string })[]> {
    const snapshot = await db.collection(COLLECTIONS.TIME_RECORDS)
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as TimeRecord
    }));
  }

  static async getTimeRecordsForToday(userId: string): Promise<(TimeRecord & { id: string })[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const snapshot = await db.collection(COLLECTIONS.TIME_RECORDS)
      .where('userId', '==', userId)
      .where('timestamp', '>=', today)
      .where('timestamp', '<', tomorrow)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as TimeRecord
    }));
  }

  // Initialize Admin User
  static async initializeAdminUser(): Promise<void> {
    const adminEmail = 'admin@neoponto.com';
    const existingAdmin = await this.getUserByEmail(adminEmail);

    if (!existingAdmin) {
      await this.createUser({
        name: 'admin',
        cpf: '00000000000',
        email: adminEmail,
        role: 'admin',
        department: 'Administrativo'
      });
      console.log('Usuário admin criado com sucesso');
    }
  }
}
