import { pool } from '../config/database.js';

export async function countUsers() {
  const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM users');
  return rows[0].total;
}

export async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, full_name, email, password_hash, role FROM users WHERE email = ? LIMIT 1', [email],
  );
  return rows[0] ?? null;
}

export async function createAdmin({ fullName, email, passwordHash }) {
  const [result] = await pool.execute(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, \'admin\')',
    [fullName, email, passwordHash],
  );
  return { id: result.insertId, full_name: fullName, email, role: 'admin' };
}
