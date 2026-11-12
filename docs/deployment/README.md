# Manual de instalación y despliegue

## Entorno local

1. Instala Node.js 20+, npm, MySQL 8 y ngrok. Arranca el servicio MySQL.
2. En una base vacía ejecuta `database/schema.sql` y luego `database/seeds/seed.sql` una vez. Para reconstruir por entregas, ejecuta `001_base_inventario.sql`, carga el seed y después ejecuta `002_clientes_ventas.sql` y `003_pagos.sql`. Si actualizas una base de la versión Wompi, ejecuta además `004_mercadopago.sql` una sola vez.
3. En `backend`, copia `.env.example` a `.env`. Ajusta DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD y crea un `JWT_SECRET` largo.
4. Abre una ventana de CMD en `backend`, ejecuta `npm install` y luego `npm run dev`. Déjala abierta; la API escucha en `http://localhost:3001`.
5. Abre otra ventana de CMD en `frontend`, ejecuta `npm install` y luego `npm run dev`. Déjala abierta; la web se abre en `http://localhost:5173`.
6. Abre `http://localhost:5173` y crea el administrador inicial.

El frontend usa Vite para reenviar las peticiones `/api` al backend local en el puerto 3001.

## Mercado Pago Checkout Pro en pruebas

1. En Mercado Pago Developers crea una aplicación para Checkout Pro y usa credenciales de prueba. Configura `MP_ENVIRONMENT=test` y `MP_ACCESS_TOKEN` en `backend/.env`.
2. En otra ventana CMD, ejecuta `ngrok http 5173`. Usa la URL HTTPS que ngrok muestra, por ejemplo `https://tu-dominio.ngrok-free.dev`. Mantén esa ventana abierta durante las pruebas. Solo se necesita este túnel: Vite reenvía `/api` al backend local.
3. Configura `MP_PUBLIC_URL` con esa URL HTTPS de ngrok, sin una ruta adicional. Si ngrok genera otra dirección al reiniciar, actualiza el valor en `.env` y reinicia el backend.
4. En la configuración de Webhooks de la aplicación de Mercado Pago, elige modo **Prueba**, habilita **Order (Mercado Pago)** y configura como URL de prueba la misma dirección HTTPS de ngrok seguida de `/api/payments/webhook`, por ejemplo `https://tu-dominio.ngrok-free.dev/api/payments/webhook`.
5. Copia el secreto de firma del webhook en `MP_WEBHOOK_SECRET` en el `.env` del backend. Reinicia el backend después de modificar `.env`.
6. Abre el sitio usando la URL pública de ngrok para probar el retorno de Mercado Pago. Inicia sesión en esa dirección y conserva abiertos backend, frontend y ngrok. Puedes hacer una compra de prueba con una cuenta compradora de prueba.

No uses credenciales de producción ni publiques el archivo `.env`. En el checkout, verifica que el estado final quede aprobado; el backend confirma el pago consultando la orden y validando las notificaciones firmadas de Mercado Pago.

## Despliegue de demostración

- Usa servicios separados para frontend estático, API Node y MySQL administrado.
- Habilita HTTPS en ambas aplicaciones y CORS para el dominio exacto del frontend (`CLIENT_ORIGIN`).
- Define variables de entorno en el panel del hosting. No publiques `.env` ni lo empaquetes.
- Para la API, asigna el puerto provisto por el hosting y conserva el script `npm start`.
- Configura en Mercado Pago modo Prueba el evento **Order (Mercado Pago)** con la URL HTTPS pública `/api/payments/webhook`.
- Ejecuta SQL de esquema/semilla sobre la base de demostración vacía y crea el administrador desde la página inicial.
- Mantén respaldos de la base y no uses datos reales en la demostración.

## Recuperación básica

- Error de conexión: revisa servicio MySQL, `DB_*`, base y permisos del usuario.
- Error 401 tras cambiar `JWT_SECRET`: borra la sesión del navegador y vuelve a iniciar.
- Checkout deshabilitado: revisa `MP_ACCESS_TOKEN` y reinicia la API.
- No vuelve al sitio: revisa `MP_PUBLIC_URL`; debe ser HTTPS público, no localhost.
- Pago pendiente: revisa `MP_WEBHOOK_SECRET`, que el evento **Order** esté habilitado y que el webhook sea alcanzable por HTTPS.
- Webhook no accesible: comprueba que ngrok sigue abierto y que la URL configurada termina exactamente en `/api/payments/webhook`.
