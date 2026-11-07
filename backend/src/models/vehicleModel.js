import { pool } from '../config/database.js';

export async function listVehicles() {
  const [rows] = await pool.execute('SELECT id,make,model,year_from,year_to FROM vehicles ORDER BY make,model,year_from');
  return rows;
}
