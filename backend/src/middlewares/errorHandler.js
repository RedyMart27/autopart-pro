export function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: { message: 'Ya existe un registro con esos datos.', code: 'DUPLICATE' } });
  if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: { message: 'No se puede borrar porque el registro ya tiene historial.', code: 'IN_USE' } });
  const status = Number(error.statusCode) || 500;
  res.status(status).json({ error: { message: status >= 500 ? 'Ocurrio un error interno.' : error.message, code: error.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR') } });
}
