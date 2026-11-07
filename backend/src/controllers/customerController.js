import * as Customer from '../models/customerModel.js';

function normalize(body) {
  const item = { full_name: String(body.full_name ?? '').trim(), email: String(body.email ?? '').trim().toLowerCase(), phone: String(body.phone ?? '').trim() };
  if (item.full_name.length < 2 || item.full_name.length > 160 || (item.email && !/^\S+@\S+\.\S+$/.test(item.email)) || item.phone.length > 30) return null;
  return item;
}

export async function index(req, res, next) {
  try { res.json({ data: await Customer.listCustomers(String(req.query.search ?? '').trim()) }); }
  catch (error) { next(error); }
}

export async function create(req, res, next) {
  try {
    const customer = normalize(req.body);
    if (!customer) return res.status(400).json({ error: { message: 'Revisa nombre, correo y telefono.', code: 'INVALID_CUSTOMER' } });
    res.status(201).json({ data: { id: await Customer.createCustomer(customer) } });
  } catch (error) { next(error); }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id), customer = normalize(req.body);
    if (!Number.isInteger(id) || id < 1 || !customer) return res.status(400).json({ error: { message: 'Datos de cliente invalidos.', code: 'INVALID_CUSTOMER' } });
    if (!await Customer.updateCustomer(id, customer)) return res.status(404).json({ error: { message: 'Cliente no encontrado.', code: 'NOT_FOUND' } });
    res.json({ data: { id } });
  } catch (error) { next(error); }
}

export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!await Customer.deleteCustomer(id)) return res.status(404).json({ error: { message: 'Cliente no encontrado o asociado a ventas.', code: 'NOT_FOUND' } });
    res.status(204).end();
  } catch (error) { next(error); }
}
