import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { pool } from '../config/database.js';

const MP_API_URL = 'https://api.mercadopago.com';
const MP_PROVIDER = 'MERCADOPAGO';

function requiredAccessToken() {
  if ((process.env.MP_ENVIRONMENT || 'test').toLowerCase() !== 'test') {
    const error = new Error('Esta versión del proyecto está configurada para pruebas. Define MP_ENVIRONMENT=test para evitar cobros reales.');
    error.statusCode = 503;
    error.code = 'MERCADOPAGO_TEST_ONLY';
    throw error;
  }
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  if (!token) {
    const error = new Error('Configura MP_ACCESS_TOKEN en backend/.env con las credenciales de prueba de Mercado Pago.');
    error.statusCode = 503;
    error.code = 'MERCADOPAGO_NOT_CONFIGURED';
    throw error;
  }
  return token;
}

function formatCopAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw Object.assign(new Error('El valor del pago debe ser un monto positivo en COP.'), { statusCode: 400 });
  }
  // El catálogo trabaja en pesos colombianos enteros (sin centavos).
  return String(Math.round(amount));
}

function publicBaseUrl() {
  const raw = process.env.MP_PUBLIC_URL?.trim();
  if (!raw) return null;
  let url;
  try { url = new URL(raw); } catch {
    throw Object.assign(new Error('MP_PUBLIC_URL debe ser una URL HTTPS pública.'), { statusCode: 500 });
  }
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw Object.assign(new Error('Mercado Pago requiere una URL HTTPS pública en MP_PUBLIC_URL; localhost no sirve para retornos.'), { statusCode: 500 });
  }
  return url.origin;
}

async function mercadoPagoRequest(path, options = {}) {
  const response = await fetch(`${MP_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${requiredAccessToken()}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const rawBody = await response.text();
  let body = {};
  try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { /* conserva el texto para diagnosticar respuestas no JSON */ }
  if (!response.ok) {
    const causes = Array.isArray(body.cause)
      ? body.cause.map(item => [item.code, item.description].filter(Boolean).join(': ')).filter(Boolean).join('; ')
      : '';
    const detail = causes || body.message || body.error || body.detail
      || (rawBody ? rawBody.replace(/\s+/g, ' ').slice(0, 350) : 'Mercado Pago rechazó la solicitud.');
    const error = new Error(`Mercado Pago (${response.status}): ${detail}`);
    error.statusCode = response.status >= 500 ? 502 : 400;
    error.code = body.error || 'MERCADOPAGO_REQUEST_FAILED';
    throw error;
  }
  return body;
}

export async function createCheckout(saleId, userId) {
  requiredAccessToken();
  const [sales] = await pool.execute(
    'SELECT id,total,status,payment_method FROM sales WHERE id=?',
    [saleId],
  );
  const sale = sales[0];
  if (!sale) throw Object.assign(new Error('Venta no encontrada.'), { statusCode: 404 });
  if (sale.payment_method !== MP_PROVIDER || sale.status !== 'pending') {
    throw Object.assign(new Error('La venta no está pendiente de pago con Mercado Pago.'), { statusCode: 409 });
  }

  // Reuse an open order if the user retries the checkout button. This prevents
  // multiple independent payment attempts for the same reserved sale.
  const [existingPayments] = await pool.execute(
    `SELECT provider_transaction_id FROM payments
     WHERE sale_id=? AND provider=? AND status='pending' AND provider_transaction_id IS NOT NULL
     ORDER BY id DESC LIMIT 1`,
    [sale.id, MP_PROVIDER],
  );
  if (existingPayments[0]?.provider_transaction_id) {
    const existingOrder = await mercadoPagoRequest(`/v1/orders/${encodeURIComponent(existingPayments[0].provider_transaction_id)}`);
    if (!['processed', 'failed', 'canceled', 'cancelled', 'expired', 'refunded', 'charged_back', 'error'].includes(existingOrder.status)
        && existingOrder.checkout_url) {
      return { sale_id: sale.id, order_id: existingOrder.id, checkout_url: existingOrder.checkout_url, environment: 'test' };
    }
  }

  const [items] = await pool.execute(
    `SELECT p.sku,p.name,si.quantity,si.unit_price
     FROM sale_items si JOIN products p ON p.id=si.product_id WHERE si.sale_id=?`,
    [sale.id],
  );
  if (!items.length) throw Object.assign(new Error('La venta no tiene productos.'), { statusCode: 409 });

  const externalReference = `AUTOPART-${sale.id}-${randomBytes(5).toString('hex').toUpperCase()}`;
  const appUrl = publicBaseUrl();
  const orderBody = {
    type: 'online',
    processing_mode: 'manual',
    capture_mode: 'automatic_async',
    total_amount: formatCopAmount(sale.total),
    external_reference: externalReference,
    items: items.map(item => ({
      external_code: item.sku,
      title: item.name,
      quantity: Number(item.quantity),
      unit_price: formatCopAmount(item.unit_price),
    })),
  };

  if (appUrl) {
    const returnUrl = new URL('/', appUrl);
    returnUrl.searchParams.set('sale', String(sale.id));
    orderBody.config = {
      online: {
        success_url: returnUrl.toString(),
        failure_url: returnUrl.toString(),
        pending_url: returnUrl.toString(),
        auto_return: 'all',
      },
    };
  }

  const order = await mercadoPagoRequest('/v1/orders', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': randomUUID() },
    body: JSON.stringify(orderBody),
  });
  if (!order.checkout_url || !order.id) {
    throw Object.assign(new Error('Mercado Pago no devolvió una URL de checkout válida.'), { statusCode: 502 });
  }

  await pool.execute(
    `INSERT INTO payments (sale_id,provider,provider_reference,provider_transaction_id,amount,currency,status,environment)
     VALUES (?,?,?,?,?,?,?,?)`,
    [sale.id, MP_PROVIDER, externalReference, String(order.id), sale.total, 'COP', 'pending', 'test'],
  );
  return { sale_id: sale.id, reference: externalReference, order_id: order.id, checkout_url: order.checkout_url, environment: 'test' };
}

export function verifyMercadoPagoWebhook({ signature, requestId, dataId, secret = process.env.MP_WEBHOOK_SECRET }) {
  if (!signature || !requestId || !dataId || !secret) return false;
  const parts = Object.fromEntries(String(signature).split(',').map(part => {
    const [key, ...value] = part.trim().split('=');
    return [key, value.join('=')];
  }));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  const provided = String(parts.v1).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(provided)) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
}

async function applyOrderStatus(order, sourceEvent) {
  const externalReference = String(order.external_reference || '');
  if (!externalReference || !order.id) return { ignored: true };
  if (process.env.MP_ENVIRONMENT !== 'production' && order.live_mode === true) {
    throw Object.assign(new Error('La orden recibida pertenece a producción, no al ambiente de prueba.'), { statusCode: 400 });
  }

  const [rows] = await pool.execute(
    'SELECT id,sale_id,amount,currency,status FROM payments WHERE provider=? AND provider_reference=?',
    [MP_PROVIDER, externalReference],
  );
  const localPayment = rows[0];
  if (!localPayment) return { unknown_reference: true };
  if (Math.round(Number(localPayment.amount) * 100) !== Math.round(Number(order.total_amount) * 100)
      || ((order.currency_id || order.currency) && localPayment.currency !== (order.currency_id || order.currency))) {
    throw Object.assign(new Error('El valor notificado por Mercado Pago no coincide con la venta.'), { statusCode: 400 });
  }

  const status = String(order.status || '').toLowerCase();
  const eventFingerprint = createHash('sha256')
    .update(`${order.id}:${status}:${order.status_detail || ''}:${sourceEvent || 'sync'}`)
    .digest('hex');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    try {
      await connection.execute(
        'INSERT INTO payment_events (provider,event_checksum,event_type) VALUES (?,?,?)',
        [MP_PROVIDER, eventFingerprint, `order.${status || 'unknown'}`],
      );
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') { await connection.commit(); return { duplicate: true, sale_id: localPayment.sale_id }; }
      throw error;
    }

    const [lockedPayments] = await connection.execute(
      'SELECT id,sale_id,status FROM payments WHERE id=? FOR UPDATE', [localPayment.id],
    );
    const [lockedSales] = await connection.execute(
      'SELECT id,status,inventory_released FROM sales WHERE id=? FOR UPDATE', [localPayment.sale_id],
    );
    const currentPayment = lockedPayments[0];
    const sale = lockedSales[0];
    // Keep the Orders API id here so a later checkout retry can retrieve this order.
    const transactionId = order.id;
    let paymentStatus = currentPayment.status;
    if (status === 'processed') paymentStatus = 'approved';
    else if (['failed', 'canceled', 'cancelled', 'expired'].includes(status)) paymentStatus = 'declined';
    else if (status === 'error') paymentStatus = 'error';
    else if (['created', 'processing', 'action_required'].includes(status)) paymentStatus = 'pending';

    await connection.execute(
      'UPDATE payments SET provider_transaction_id=?,status=? WHERE id=?',
      [String(transactionId), paymentStatus, currentPayment.id],
    );
    let resultingSaleStatus = sale.status;
    if (status === 'processed' && sale.status === 'pending') {
      await connection.execute("UPDATE sales SET status='paid' WHERE id=?", [sale.id]);
      resultingSaleStatus = 'paid';
    } else if (['failed', 'canceled', 'cancelled', 'expired', 'error'].includes(status)
      && sale.status === 'pending' && !sale.inventory_released) {
      const [saleItems] = await connection.execute('SELECT product_id,quantity FROM sale_items WHERE sale_id=?', [sale.id]);
      for (const item of saleItems) {
        await connection.execute('UPDATE products SET stock=stock+? WHERE id=?', [item.quantity, item.product_id]);
      }
      await connection.execute("UPDATE sales SET status='declined',inventory_released=TRUE WHERE id=?", [sale.id]);
      resultingSaleStatus = 'declined';
    }
    await connection.commit();
    return { processed: true, sale_id: sale.id, status: resultingSaleStatus };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function processMercadoPagoNotification({ dataId, type }) {
  if (!dataId || !['order', 'orders'].includes(String(type).toLowerCase())) return { ignored: true };
  const order = await mercadoPagoRequest(`/v1/orders/${encodeURIComponent(dataId)}`);
  return applyOrderStatus(order, 'webhook');
}

export async function syncMercadoPagoPayment(saleId, orderId) {
  if (!orderId) throw Object.assign(new Error('Falta el identificador de la orden devuelto por Mercado Pago.'), { statusCode: 400 });
  const order = await mercadoPagoRequest(`/v1/orders/${encodeURIComponent(orderId)}`);
  const externalReference = String(order.external_reference || '');
  const [matches] = await pool.execute(
    'SELECT id FROM payments WHERE sale_id=? AND provider=? AND provider_reference=?',
    [saleId, MP_PROVIDER, externalReference],
  );
  if (!matches[0]) throw Object.assign(new Error('La orden no corresponde a esta venta.'), { statusCode: 403 });
  return applyOrderStatus(order, 'return-sync');
}
