export interface User {
  name: string;
  cpf: string;
  email: string;
  role: string;
  department: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface TimeRecord {
  userId: string;
  timestamp: FirebaseFirestore.Timestamp;
}
