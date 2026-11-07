# Estado de implementación

## Implementado en el código integrado

- Aplicación React con inicio/configuración inicial, resumen, inventario, clientes, vehículos, ventas, historial, reportes y retorno de checkout.
- API Express organizada por rutas, controladores, modelos y servicios.
- MySQL con esquema, llaves foráneas y semillas ficticias.
- JWT, bcrypt, autorización de operaciones administrativas y respuestas centralizadas de error.
- Ventas con verificación de precio/stock en el servidor y reserva de unidades mediante transacción.
- Mercado Pago Checkout Pro en entorno de prueba, consulta autenticada del pago, validación HMAC de notificaciones e idempotencia.
- Diccionario de datos, contrato de API, despliegue local y diagrama de clases.
- Asignación para el equipo en tres sprints grandes, desglosada por integrante.

## Requiere configuración externa del equipo

- Cada persona debe instalar dependencias y llenar su propio `backend/.env` con su usuario de MySQL y un `JWT_SECRET` aleatorio.
- Para probar el checkout se necesita un Access Token de prueba de una aplicación de Mercado Pago.
- Para retorno automático y confirmación por webhook desde un entorno local se necesita una URL HTTPS pública; configura `MP_PUBLIC_URL` y `MP_WEBHOOK_SECRET`.
- La ejecución final, demostración y revisión del código corresponde al equipo en su propio entorno. Este paquete no contiene secretos ni afirmaciones de una transacción Sandbox ejecutada.

## Consideración académica

El paquete se elaboró con asistencia de IA. El equipo debe verificar y comprender los cambios y seguir las reglas de declaración de autoría del docente. No se inventan autores, commits previos ni resultados de ejecución.
