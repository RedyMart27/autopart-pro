import { pool } from '../config/database.js';

export async function listCustomers(search = '') {
  const like = `%${search}%`;
  const [rows] = await pool.execute(
    `SELECT c.id, c.full_name, c.email, c.phone, c.created_at,
       COUNT(s.id) AS sales_count, COALESCE(SUM(CASE WHEN s.status='paid' THEN s.total ELSE 0 END),0) AS lifetime_value
     FROM customers c LEFT JOIN sales s ON s.customer_id=c.id
     WHERE (?='' OR c.full_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)
     GROUP BY c.id ORDER BY c.full_name LIMIT 200`, [search, like, like, like],
  );
  return rows;
}

export async function createCustomer({ full_name, email, phone }) {
  const [result] = await pool.execute(
    'INSERT INTO customers (full_name,email,phone) VALUES (?,?,?)',
    [full_name, email || null, phone || null],
  );
  return result.insertId;
}

export async function updateCustomer(id, { full_name, email, phone }) {
  const [result] = await pool.execute('UPDATE customers SET full_name=?,email=?,phone=? WHERE id=?',
    [full_name, email || null, phone || null, id]);
  return result.affectedRows > 0;
}

export async function deleteCustomer(id) {
  const [result] = await pool.execute('DELETE FROM customers WHERE id=?', [id]);
  return result.affectedRows > 0;
}
