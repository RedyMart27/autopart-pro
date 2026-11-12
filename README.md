# AutoPart Pro

Sistema web para inventario y venta técnica de repuestos automotrices. Equipo: **Jeifre, Bleyder y Davinso**. Incluye catálogo con compatibilidad por marca/modelo/año, control de stock mínimo, administración de productos, clientes, punto de venta, ventas, reportes, autenticación JWT y checkout Mercado Pago Checkout Pro para pruebas.

## Tecnologías

- Frontend: React 18, Vite y Lucide.
- Backend: Node.js 20+, Express y arquitectura MVC.
- Base de datos: MySQL 8.
- Seguridad: bcrypt para contraseñas, JWT para sesiones, validación de stock con transacciones y verificación de firma de eventos de pago.

## Requisitos

Instala Node.js 20 o posterior, Git y MySQL 8. Revisa que npm venga incluido con Node.js. Para ver el estado de la base de datos, el servicio MySQL debe estar iniciado.

## Instalación local en Windows CMD

### 1. Preparar la base de datos

Abre MySQL Workbench o la consola de MySQL y ejecuta, en este orden:

1. `database/schema.sql`
2. `database/seeds/seed.sql`

El seed carga categorías, vehículos y seis productos ficticios. Ejecútalo una sola vez sobre la base nueva.

Para reconstruir el proyecto por entregas en vez de cargar el esquema final de una vez, ejecuta `database/migrations/001_base_inventario.sql`, carga el seed, y luego aplica `002_clientes_ventas.sql` y `003_pagos.sql` en ese orden. Si ya tienes una base creada con la versión anterior, aplica también `004_mercadopago.sql` una sola vez.

### 2. Configurar y arrancar el backend

Abre una ventana CMD en la carpeta del proyecto:

```cmd
cd backend
copy .env.example .env
```

Edita `backend\.env` con los datos de tu MySQL. Cambia `JWT_SECRET` por una cadena aleatoria propia de al menos 32 caracteres. No subas `.env` a GitHub.

Luego instala e inicia la API:

```cmd
npm install
npm run dev
```

La API queda en `http://localhost:3001`.

### 3. Instalar y arrancar el frontend

Abre **otra** ventana CMD en la carpeta del proyecto:

```cmd
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. Vite reenvía las llamadas `/api` al backend.

### 4. Crear el administrador inicial

En el primer ingreso, el sistema muestra el formulario de configuración inicial. Crea una cuenta de administrador con nombre, correo y una contraseña de al menos 8 caracteres. Después de esa primera cuenta, usa la pantalla de inicio de sesión.

## Configurar Mercado Pago en pruebas

En Mercado Pago Developers crea una aplicación, selecciona el entorno **Prueba** y copia su Access Token de prueba en `MP_ACCESS_TOKEN` dentro de `backend\.env`. No pongas el Access Token en el frontend ni lo subas a GitHub. Las credenciales de prueba permiten simular pagos sin cargos reales.

Para usar Checkout Pro con retorno a la aplicación, configura `MP_PUBLIC_URL` con la URL HTTPS pública de tu frontend/túnel. No uses `localhost` en los retornos: Mercado Pago lo rechaza. El backend crea una orden mediante la Orders API, con los precios de MySQL y una `external_reference` vinculada a la venta. El retorno del navegador consulta la orden desde el backend; las notificaciones firmadas de Mercado Pago actualizan el estado aunque el usuario cierre la pestaña. En Mercado Pago Developers configura el webhook de órdenes (evento **Order**) y guarda su firma en `MP_WEBHOOK_SECRET`. Sin URL pública puedes iniciar una prueba, pero no funcionarán el retorno automático ni el webhook.

## Módulos disponibles

- Acceso de administrador con JWT y contraseña cifrada con bcrypt.
- Inventario: búsqueda por repuesto, marca, categoría y vehículo; alta, edición, eliminación y alertas de stock mínimo.
- Clientes: alta, edición, búsqueda e historial agregado de compra.
- Ventas: carrito de punto de venta, cobro en efectivo, checkout Mercado Pago y cancelación de pagos pendientes.
- Inventario transaccional: el backend vuelve a consultar precio y existencias antes de registrar una venta.
- Reportes: ingresos del día/mes, productos más vendidos, valor del inventario y ventas recientes.
- Vehículos: catálogo ficticio y compatibilidad por marca, modelo y rango de años.

## Estructura

```text
backend/     API REST organizada en config, controllers, middlewares, models, routes y services
database/    esquema, semillas y scripts MySQL
docs/        diccionario de datos, API, despliegue, diagrama y sprints grandes
frontend/    aplicación React + Vite
```

## Documentación del equipo

Consulta `docs/SPRINTS-GRANDES.md` para la asignación de trabajo, `docs/API.md` para endpoints y roles, `docs/data-dictionary.md` para las tablas, `docs/class-diagram.mmd` para el diagrama y `docs/deployment/README.md` para instalación y entrega.

## Alcance y límites actuales

La aplicación incluye el código del flujo de pruebas, pero completar un pago de prueba requiere el Access Token de prueba de Mercado Pago y, para notificaciones automáticas, un webhook HTTPS alcanzable desde internet. No se incluyen credenciales ni pagos de producción. Los datos de ejemplo son ficticios. El equipo debe instalar dependencias, configurar sus secretos y ejecutar el proyecto en sus equipos.

El código de este paquete fue preparado con asistencia de IA. Cada integrante debe revisar y comprender el código y declarar esa asistencia de acuerdo con las reglas del curso. No se incluye una bitácora de prompts inventada.

## Git en equipo

Trabajen en ramas con nombre por integrante y sprint, por ejemplo `feature/jeifre-sprint-1`, `feature/bleyder-sprint-2` y `feature/davinso-sprint-3`. Cada persona debe explicar sus cambios en sus commits y coordinar la integración por pull request o revisión del equipo. No incluyan `.env`, claves, clientes reales ni `node_modules`.
