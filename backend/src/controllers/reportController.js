import { dashboard } from '../models/reportModel.js';
export async function summary(_req, res, next) {
  try { res.json({ data: await dashboard() }); } catch (error) { next(error); }
}
