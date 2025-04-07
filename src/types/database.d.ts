import { Database } from 'sqlite3';

export function initializeDatabase(): Promise<void>;
export function getDatabase(): Database; 