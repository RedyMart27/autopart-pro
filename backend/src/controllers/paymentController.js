import {
  createCheckout,
  processMercadoPagoNotification,
  syncMercadoPagoPayment,
  verifyMercadoPagoWebhook,
} from '../services/paymentService.js';

export function config(_req, res) {
  const configured = Boolean(process.env.MP_ACCESS_TOKEN?.trim());
  res.json({ data: {
    sandbox_configured: configured,
    environment: process.env.MP_ENVIRONMENT || 'test',
    provider: 'mercadopago',
    webhook_configured: Boolean(process.env.MP_WEBHOOK_SECRET?.trim()),
  } });
}

export async function checkout(req, res, next) {
  try {
    const saleId = Number(req.body.sale_id);
    if (!Number.isInteger(saleId) || saleId < 1) return res.status(400).json({ error: { message: 'Numero de venta invalido.', code: 'INVALID_SALE' } });
    res.status(201).json({ data: await createCheckout(saleId, req.user.id) });
  } catch (error) { next(error); }
}

export async function webhook(req, res, next) {
  try {
    const dataId = req.query['data.id'] || req.query.data?.id || req.body?.data?.id;
    const valid = verifyMercadoPagoWebhook({
      signature: req.get('x-signature'),
      requestId: req.get('x-request-id'),
      dataId,
    });
    if (!valid) {
      return res.status(401).json({ error: { message: 'Firma de notificación de Mercado Pago no válida.', code: 'INVALID_WEBHOOK_SIGNATURE' } });
    }
    res.status(200).json({ data: await processMercadoPagoNotification({ dataId, type: req.query.type || req.body?.type }) });
  } catch (error) { next(error); }
}

export async function syncPayment(req, res, next) {
  try {
    const saleId = Number(req.body.sale_id);
    const orderId = String(req.body.order_id || '');
    if (!Number.isInteger(saleId) || saleId < 1 || !orderId) {
      return res.status(400).json({ error: { message: 'Venta u orden inválida.', code: 'INVALID_PAYMENT' } });
    }
    res.json({ data: await syncMercadoPagoPayment(saleId, orderId) });
  } catch (error) { next(error); }
}
