# Diccionario de datos

Motor: InnoDB. Codificación: `utf8mb4`. Importes almacenados en COP como `DECIMAL(12,2)`. Los identificadores son `BIGINT UNSIGNED AUTO_INCREMENT`, excepto las llaves compuestas indicadas.

| Tabla | Campos y restricciones | Propósito |
|---|---|---|
| `categories` | `id` PK; `name` VARCHAR(80), único y obligatorio | Clasifica los repuestos. |
| `products` | `id` PK; `category_id` FK a categories; `sku` VARCHAR(40), único; `name`, `brand` obligatorios; `description` opcional; `price` DECIMAL(12,2); `stock` y `minimum_stock` enteros sin signo; `created_at`, `updated_at` | Referencias, precios y existencias. |
| `vehicles` | `id` PK; `make`, `model`; `year_from`, `year_to` SMALLINT UNSIGNED | Marca, modelo y años compatibles. |
| `product_vehicles` | PK compuesta (`product_id`, `vehicle_id`); ambas columnas son FK con `ON DELETE CASCADE` | Relación muchos a muchos entre repuestos y vehículos. |
| `customers` | `id` PK; `full_name`; `email` opcional y único; `phone` opcional; `created_at` | Datos de clientes. El correo vacío se guarda como `NULL`. |
| `users` | `id` PK; `full_name`; `email` obligatorio y único; `password_hash`; `role` enum `admin`/`staff`; `created_at` | Usuarios autorizados. La clave nunca se almacena en texto plano. |
| `sales` | `id` PK; `customer_id` FK opcional; `created_by` FK a users; `subtotal`, `tax`, `total`; `payment_method` enum `CASH`/`MERCADOPAGO` (se conserva `WOMPI` solo para historial anterior); `status` enum `pending`/`paid`/`declined`/`cancelled`; `inventory_released`; `created_at` | Encabezado de venta, cobro y estado. |
| `sale_items` | `id` PK; `sale_id` FK; `product_id` FK; `quantity`; `unit_price`, `line_total` | Detalle con precio capturado al vender. |
| `payments` | `id` PK; `sale_id` FK; `provider`; `provider_reference` único por proveedor; `provider_transaction_id`; `amount`, `currency`; `status`; `environment`; timestamps | Referencia y resultado del pago externo. |
| `payment_events` | `id` PK; `provider`; `event_checksum` CHAR(64), único por proveedor; `event_type`; `received_at` | Evita procesar más de una vez el mismo evento firmado. |

## Relaciones principales

- Una categoría clasifica varios productos.
- Un producto puede ser compatible con varios vehículos y un vehículo puede tener varios productos compatibles.
- Un cliente puede estar asociado a varias ventas; cada venta puede ser mostrador sin cliente.
- Cada venta se registra por un usuario y contiene una o más líneas de venta.
- Una venta puede tener uno o varios intentos de pago.

## Consideraciones

- El stock se descuenta en una transacción al crear una venta. El precio y la cantidad se vuelven a verificar en el servidor.
- Si una venta Mercado Pago pendiente se cancela o rechaza, el stock reservado se repone una sola vez mediante `inventory_released`.
- `seed.sql` es para la instalación inicial; no lo vuelvas a ejecutar sobre una base sembrada porque sus inserciones no son idempotentes.
