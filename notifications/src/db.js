import mysql from 'mysql2/promise';

// timezone 'Z': occurredAt y created_at se guardan en UTC (DATETIME no guarda zona).
export function createPool(db) {
  return mysql.createPool({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: db.database,
    timezone: 'Z',
    charset: 'utf8mb4_unicode_ci',
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 5000,
    enableKeepAlive: true,
  });
}