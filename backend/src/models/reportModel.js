import { pool } from '../config/database.js';

export async function dashboard() {
  const [[today]] = await pool.execute("SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS sales FROM sales WHERE status='paid' AND DATE(created_at)=CURDATE()");
  const [[month]] = await pool.execute("SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS sales FROM sales WHERE status='paid' AND YEAR(created_at)=YEAR(CURDATE()) AND MONTH(created_at)=MONTH(CURDATE())");
  const [[inventory]] = await pool.execute('SELECT COUNT(*) AS products, COALESCE(SUM(price*stock),0) AS inventory_value FROM products');
  const [[stock]] = await pool.execute('SELECT COUNT(*) AS low_stock FROM products WHERE stock<=minimum_stock');
  const [recent] = await pool.execute("SELECT id,total,status,payment_method,created_at FROM sales ORDER BY created_at DESC LIMIT 8");
  const [top] = await pool.execute("SELECT p.name,p.sku,SUM(si.quantity) AS units_sold FROM sale_items si JOIN products p ON p.id=si.product_id JOIN sales s ON s.id=si.sale_id WHERE s.status='paid' GROUP BY p.id ORDER BY units_sold DESC LIMIT 5");
  return { today, month, inventory, stock, recent, top };
}
