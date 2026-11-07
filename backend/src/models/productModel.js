import { pool } from '../config/database.js';

export async function listCategories() {
  const [rows] = await pool.execute('SELECT id, name FROM categories ORDER BY name');
  return rows;
}

export async function listProducts(filters = {}) {
  const clauses = [];
  const values = [];
  const addLike = (column, value) => {
    if (value) { clauses.push(`${column} LIKE ?`); values.push(`%${value}%`); }
  };
  if (filters.search) {
    clauses.push('(p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)');
    values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }
  addLike('p.brand', filters.brand);
  addLike('c.name', filters.category);
  addLike('v.make', filters.make);
  addLike('v.model', filters.model);
  if (filters.year && /^\d{4}$/.test(String(filters.year))) {
    clauses.push('? BETWEEN v.year_from AND v.year_to');
    values.push(Number(filters.year));
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT p.id, p.category_id, p.sku, p.name, p.brand, p.description, c.name AS category, p.price, p.stock, p.minimum_stock,
       GROUP_CONCAT(DISTINCT CONCAT(v.make, ' ', v.model, ' ', v.year_from, '-', v.year_to)) AS compatibility,
       GROUP_CONCAT(DISTINCT pv.vehicle_id) AS vehicle_ids
     FROM products p JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_vehicles pv ON pv.product_id = p.id
     LEFT JOIN vehicles v ON v.id = pv.vehicle_id
     ${where} GROUP BY p.id ORDER BY p.name LIMIT 200`, values,
  );
  return rows;
}

export async function listLowStock() {
  const [rows] = await pool.execute('SELECT id,sku,name,brand,stock,minimum_stock FROM products WHERE stock <= minimum_stock ORDER BY stock,name');
  return rows;
}

export async function createProduct(product) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'INSERT INTO products (category_id, sku, name, brand, description, price, stock, minimum_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [product.category_id, product.sku, product.name, product.brand, product.description ?? null, product.price, product.stock, product.minimum_stock],
    );
    for (const vehicleId of product.vehicle_ids ?? []) {
      await connection.execute('INSERT INTO product_vehicles (product_id, vehicle_id) VALUES (?, ?)', [result.insertId, vehicleId]);
    }
    await connection.commit();
    return result.insertId;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function updateProduct(id, product) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'UPDATE products SET category_id=?, sku=?, name=?, brand=?, description=?, price=?, stock=?, minimum_stock=? WHERE id=?',
      [product.category_id, product.sku, product.name, product.brand, product.description ?? null, product.price, product.stock, product.minimum_stock, id],
    );
    if (!result.affectedRows) { await connection.rollback(); return false; }
    await connection.execute('DELETE FROM product_vehicles WHERE product_id=?', [id]);
    for (const vehicleId of product.vehicle_ids ?? []) {
      await connection.execute('INSERT INTO product_vehicles (product_id, vehicle_id) VALUES (?, ?)', [id, vehicleId]);
    }
    await connection.commit();
    return true;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function deleteProduct(id) {
  const [result] = await pool.execute('DELETE FROM products WHERE id=?', [id]);
  return result.affectedRows > 0;
}
