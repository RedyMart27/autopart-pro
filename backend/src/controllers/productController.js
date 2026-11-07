import * as Product from '../models/productModel.js';

export async function index(req, res, next) {
  try {
    const filters = Object.fromEntries(['search', 'brand', 'category', 'make', 'model', 'year']
      .map(key => [key, String(req.query[key] ?? '').trim()]));
    res.json({ data: await Product.listProducts(filters) });
  } catch (error) { next(error); }
}

export async function lowStock(_req, res, next) {
  try { res.json({ data: await Product.listLowStock() }); }
  catch (error) { next(error); }
}

export async function categories(_req, res, next) {
  try { res.json({ data: await Product.listCategories() }); }
  catch (error) { next(error); }
}

function validateProduct(body) {
  const product = {
    category_id: Number(body.category_id), sku: String(body.sku ?? '').trim(),
    name: String(body.name ?? '').trim(), brand: String(body.brand ?? '').trim(),
    description: String(body.description ?? '').trim(), price: Number(body.price),
    stock: Number(body.stock), minimum_stock: Number(body.minimum_stock),
    vehicle_ids: Array.isArray(body.vehicle_ids) ? body.vehicle_ids.map(Number) : [],
  };
  if (!product.category_id || !product.sku || !product.name || !product.brand ||
      !Number.isFinite(product.price) || product.price < 0 || !Number.isInteger(product.stock) || product.stock < 0 ||
      !Number.isInteger(product.minimum_stock) || product.minimum_stock < 0 || product.vehicle_ids.some(id => !Number.isInteger(id) || id <= 0)) return null;
  return product;
}

export async function create(req, res, next) {
  try {
    const product = validateProduct(req.body);
    if (!product) return res.status(400).json({ error: { message: 'Revisa los datos del producto.', code: 'INVALID_PRODUCT' } });
    res.status(201).json({ data: { id: await Product.createProduct(product) } });
  } catch (error) { next(error); }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id), product = validateProduct(req.body);
    if (!Number.isInteger(id) || id <= 0 || !product) return res.status(400).json({ error: { message: 'Revisa el codigo y los datos del producto.', code: 'INVALID_PRODUCT' } });
    if (!await Product.updateProduct(id, product)) return res.status(404).json({ error: { message: 'No encontramos ese producto.', code: 'NOT_FOUND' } });
    res.json({ data: { id } });
  } catch (error) { next(error); }
}

export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: { message: 'Codigo de producto invalido.', code: 'INVALID_ID' } });
    if (!await Product.deleteProduct(id)) return res.status(404).json({ error: { message: 'No encontramos ese producto.', code: 'NOT_FOUND' } });
    res.status(204).end();
  } catch (error) { next(error); }
}
