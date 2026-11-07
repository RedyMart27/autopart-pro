# API REST

Base local: `http://localhost:3001/api`. Las respuestas exitosas usan `{ "data": ... }`; los errores usan `{ "error": { "message": ..., "code": ... } }`. Los endpoints protegidos reciben `Authorization: Bearer <JWT>`.

| Método | Ruta | Acceso | Uso |
|---|---|---|---|
| GET | `/health` | Público | Estado básico del proceso API. |
| GET | `/auth/setup-status` | Público | Indica si falta crear el administrador inicial. |
| POST | `/auth/setup-admin` | Solo primera cuenta | Crea administrador; requiere `full_name`, `email`, `password` (mínimo 8 caracteres). |
| POST | `/auth/login` | Público | Inicio de sesión por correo y contraseña. |
| GET | `/auth/me` | JWT | Devuelve el usuario autenticado. |
| GET | `/products` | Público | Busca por `search`, `brand`, `category`, `make`, `model`, `year`. |
| GET | `/products/categories` | Público | Lista categorías. |
| GET | `/products/low-stock` | Público | Lista referencias bajo mínimo. |
| POST | `/products` | Admin | Crea producto y compatibilidades. |
| PUT | `/products/:id` | Admin | Actualiza producto y vehículos compatibles. |
| DELETE | `/products/:id` | Admin | Elimina producto si no tiene historial de ventas. |
| GET | `/vehicles` | Público | Lista marcas, modelos y rangos de años. |
| GET | `/customers?search=` | JWT | Busca clientes e indicadores agregados de compra. |
| POST | `/customers` | JWT | Crea cliente. |
| PUT | `/customers/:id` | JWT | Actualiza cliente. |
| DELETE | `/customers/:id` | Admin | Borra cliente solo si no tiene ventas asociadas. |
| GET | `/sales?search=&status=` | JWT | Lista ventas. |
| GET | `/sales/:id` | JWT | Consulta venta, detalle e intentos de pago. |
| POST | `/sales` | JWT | Crea venta. `items` contiene `product_id` y `quantity`; `payment_method` puede ser `CASH` o `MERCADOPAGO`. |
| POST | `/sales/:id/cancel` | JWT | Cancela venta pendiente y libera existencias. |
| GET | `/payments/config` | JWT | Indica si la integración Sandbox tiene llaves configuradas. |
| POST | `/payments/checkout` | JWT | Genera referencia y enlace seguro a checkout; requiere `sale_id`. |
| POST | `/payments/webhook` | Mercado Pago | Recibe eventos Orders por HTTPS, valida `x-signature` y consulta la orden antes de actualizar la venta. |
| POST | `/payments/sync` | JWT | Verifica en Mercado Pago la `order_id` devuelta al comprador; requiere `sale_id` y `order_id`. |
| GET | `/reports/summary` | JWT | Ingresos pagados, inventario, alertas, actividad reciente y más vendidos. |

El backend crea una orden de Checkout Pro con `POST /v1/orders` y devuelve `checkout_url`. La venta se confirma solo tras consultar la orden con el Access Token del servidor. El webhook firmado es el mecanismo automático recomendado; el retorno también sincroniza la orden consultando la API. Para retorno y webhook completos, configura una URL HTTPS pública; Mercado Pago no admite `localhost` como URL de retorno. En la cuenta, habilita el evento **Order (Mercado Pago)** en modo Prueba.
