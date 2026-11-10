import * as Sale from '../models/saleModel.js';

export async function index(req, res, next) {
  try { res.json({ data: await Sale.listSales({ search: String(req.query.search ?? '').trim(), status: String(req.query.status ?? '') }) }); }
  catch (error) { next(error); }
}

export async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: { message: 'Numero de venta invalido.', code: 'INVALID_ID' } });
    const data = await Sale.getSale(id);
    if (!data) return res.status(404).json({ error: { message: 'Venta no encontrada.', code: 'NOT_FOUND' } });
    res.json({ data });
  } catch (error) { next(error); }
}

export async function create(req, res, next) {
  try {
    const customerId = req.body.customer_id ? Number(req.body.customer_id) : null;
    const items = req.body.items;
    const paymentMethod = req.body.payment_method === 'MERCADOPAGO' ? 'MERCADOPAGO' : 'CASH';
    if ((customerId !== null && (!Number.isInteger(customerId) || customerId < 1)) || !Array.isArray(items) || items.length < 1 || items.length > 50) {
      return res.status(400).json({ error: { message: 'Agrega al menos un producto valido a la venta.', code: 'INVALID_SALE' } });
    }
    const normalized = items.map(item => ({ product_id: Number(item.product_id), quantity: Number(item.quantity) }));
    if (normalized.some(item => !Number.isInteger(item.product_id) || item.product_id < 1 || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      return res.status(400).json({ error: { message: 'Cada linea requiere producto y cantidad entera positiva.', code: 'INVALID_ITEM' } });
    }
    const aggregated = [...normalized.reduce((map, item) => map.set(item.product_id, (map.get(item.product_id) ?? 0) + item.quantity), new Map())]
      .map(([product_id, quantity]) => ({ product_id, quantity }));
    const data = await Sale.createSale({ customerId, userId: req.user.id, items: aggregated, paymentMethod });
    res.status(201).json({ data });
  } catch (error) { next(error); }
}

export async function cancel(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await Sale.cancelPendingSale(id, req.user.id);
    if (result.notFound) return res.status(404).json({ error: { message: 'Venta no encontrada.', code: 'NOT_FOUND' } });
    if (result.conflict) return res.status(409).json({ error: { message: result.paymentPending ? 'Esta venta tiene un pago de Mercado Pago en curso; espera su confirmación antes de cancelarla.' : 'Solo se pueden cancelar ventas pendientes.', code: result.paymentPending ? 'PAYMENT_IN_PROGRESS' : 'SALE_NOT_PENDING' } });
    res.json({ data: result });
  } catch (error) { next(error); }
}
