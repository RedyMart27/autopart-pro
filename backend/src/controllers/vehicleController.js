import { listVehicles } from '../models/vehicleModel.js';
export async function index(_req, res, next) {
  try { res.json({ data: await listVehicles() }); } catch (error) { next(error); }
}
