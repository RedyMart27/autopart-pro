import { pool } from '../config/database.js';

export async function createSale({ customerId, userId, items, paymentMethod }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const detail = [];
    let subtotalCents = 0;
    for (const item of items) {
      const [rows] = await connection.execute(
        'SELECT id,name,price,stock FROM products WHERE id=? FOR UPDATE', [item.product_id],
      );
      const product = rows[0];
      if (!product) throw Object.assign(new Error(`Producto ${item.product_id} no existe.`), { statusCode: 400 });
      if (product.stock < item.quantity) throw Object.assign(new Error(`Stock insuficiente para ${product.name}. Disponibles: ${product.stock}.`), { statusCode: 409 });
      const unitCents = Math.round(Number(product.price) * 100);
      const lineCents = unitCents * item.quantity;
      subtotalCents += lineCents;
      detail.push({ product_id: product.id, quantity: item.quantity, unit_price: unitCents / 100, line_total: lineCents / 100 });
    }
    const subtotal = subtotalCents / 100;
    const status = paymentMethod === 'CASH' ? 'paid' : 'pending';
    const [sale] = await connection.execute(
      'INSERT INTO sales (customer_id,created_by,subtotal,tax,total,payment_method,status) VALUES (?,?,?,?,?,?,?)',
      [customerId || null, userId, subtotal, 0, subtotal, paymentMethod, status],
    );
    for (const item of detail) {
      await connection.execute('INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,line_total) VALUES (?,?,?,?,?)',
        [sale.insertId, item.product_id, item.quantity, item.unit_price, item.line_total]);
      await connection.execute('UPDATE products SET stock=stock-? WHERE id=?', [item.quantity, item.product_id]);
    }
    await connection.commit();
    return { id: sale.insertId, total: subtotal, status, payment_method: paymentMethod };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function listSales({ search = '', status = '' } = {}) {
  const clauses = [], values = [];
  if (status) { clauses.push('s.status=?'); values.push(status); }
  if (search) { clauses.push('(CAST(s.id AS CHAR) LIKE ? OR c.full_name LIKE ?)'); values.push(`%${search}%`, `%${search}%`); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT s.id,s.subtotal,s.tax,s.total,s.payment_method,s.status,s.created_at,c.full_name AS customer_name,
      COUNT(si.id) AS item_count FROM sales s LEFT JOIN customers c ON c.id=s.customer_id
      LEFT JOIN sale_items si ON si.sale_id=s.id ${where} GROUP BY s.id ORDER BY s.created_at DESC LIMIT 200`, values,
  );
  return rows;
}

export async function getSale(id) {
  const [sales] = await pool.execute('SELECT s.*,c.full_name AS customer_name FROM sales s LEFT JOIN customers c ON c.id=s.customer_id WHERE s.id=?', [id]);
  if (!sales[0]) return null;
  const [items] = await pool.execute('SELECT si.product_id,si.quantity,si.unit_price,si.line_total,p.name,p.sku FROM sale_items si JOIN products p ON p.id=si.product_id WHERE si.sale_id=?', [id]);
  const [payments] = await pool.execute('SELECT provider,provider_reference,provider_transaction_id,status,environment FROM payments WHERE sale_id=? ORDER BY id DESC', [id]);
  return { ...sales[0], items, payments };
}

export async function cancelPendingSale(id, userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT id,status,inventory_released FROM sales WHERE id=? FOR UPDATE', [id]);
    const sale = rows[0];
    if (!sale) { await connection.rollback(); return { notFound: true }; }
    if (sale.status !== 'pending') { await connection.rollback(); return { conflict: true }; }
    const [payments] = await connection.execute(
      "SELECT id FROM payments WHERE sale_id=? AND provider='MERCADOPAGO' AND status='pending' LIMIT 1 FOR UPDATE",
      [id],
    );
    if (payments.length) { await connection.rollback(); return { conflict: true, paymentPending: true }; }
    if (!sale.inventory_released) {
      const [items] = await connection.execute('SELECT product_id,quantity FROM sale_items WHERE sale_id=?', [id]);
      for (const item of items) await connection.execute('UPDATE products SET stock=stock+? WHERE id=?', [item.quantity, item.product_id]);
    }
    await connection.execute('UPDATE sales SET status=\'cancelled\',inventory_released=TRUE WHERE id=?', [id]);
    await connection.commit();
    return { id, status: 'cancelled', userId };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
