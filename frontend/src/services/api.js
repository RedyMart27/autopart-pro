const API = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('autopart_token');
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  const response = await fetch(API + path, { ...options, headers, body: options.body ? JSON.stringify(options.body) : undefined });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'No se pudo completar la solicitud.');
    error.status = response.status;
    error.code = payload.error?.code;
    throw error;
  }
  return payload.data;
}

const get = path => request(path);
const post = (path, body) => request(path, { method: 'POST', body });
const put = (path, body) => request(path, { method: 'PUT', body });
const del = path => request(path, { method: 'DELETE' });
const query = values => new URLSearchParams(Object.entries(values).filter(([, value]) => value !== '' && value != null)).toString();

export const api = {
  setupStatus: () => get('/auth/setup-status'),
  setupAdmin: body => post('/auth/setup-admin', body),
  login: body => post('/auth/login', body),
  me: () => get('/auth/me'),
  products: filters => get('/products?' + query(filters)),
  lowStock: () => get('/products/low-stock'),
  categories: () => get('/products/categories'),
  createProduct: body => post('/products', body),
  updateProduct: (id, body) => put('/products/' + id, body),
  deleteProduct: id => del('/products/' + id),
  vehicles: () => get('/vehicles'),
  customers: search => get('/customers?' + query({ search })),
  createCustomer: body => post('/customers', body),
  updateCustomer: (id, body) => put('/customers/' + id, body),
  deleteCustomer: id => del('/customers/' + id),
  sales: filters => get('/sales?' + query(filters)),
  sale: id => get('/sales/' + id),
  createSale: body => post('/sales', body),
  cancelSale: id => post('/sales/' + id + '/cancel', {}),
  paymentConfig: () => get('/payments/config'),
  checkout: sale_id => post('/payments/checkout', { sale_id }),
  syncPayment: (sale_id, order_id) => post('/payments/sync', { sale_id, order_id }),
  report: () => get('/reports/summary'),
};
