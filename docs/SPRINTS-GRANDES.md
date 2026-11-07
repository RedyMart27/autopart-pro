# Plan de una semana: tres sprints grandes

**Equipo:** Jeifre, Bleyder y Davinso. **Entrega indicada:** viernes 13 de noviembre. **Ventana propuesta:** viernes 6 a jueves 12 de noviembre. Para aplicar los cambios en orden, usa las carpetas copy/paste incluidas en `docs/sprints-para-subir/`; cada una contiene archivos concretos con rutas del repositorio.

## Sprint 1 · Base, acceso e inventario (6–7 de noviembre)

**Meta:** que un administrador pueda entrar, ver el tablero y mantener el catálogo ligado a la base MySQL.

| Integrante | Trabajo y solución asignada | Terminado cuando… |
|---|---|---|
| Jeifre | Interfaz React: configuración/inicio de sesión, navegación, resumen, catálogo, filtros por categoría/marca/modelo/año, alertas y formularios de productos. | La interfaz lee el API, presenta carga/vacío/error y permite ver y editar catálogo como admin. |
| Bleyder | API MVC: conexión MySQL, configuración inicial, bcrypt/JWT, middleware de roles y endpoints de catálogo/categorías/alertas/CRUD. | La primera cuenta admin se puede crear una vez; la sesión funciona y el API rechaza mutaciones sin permiso. |
| Davinso | Esquema MySQL, relaciones, índices, datos ficticios, diccionario de datos y diagrama inicial. | Una base vacía se crea y queda con productos/vehículos de ejemplo listos para la pantalla. |

**Integración del sprint:** levantar DB/API/frontend en el mismo computador, crear primer admin, buscar por vehículo, comprobar alertas y revisar separación MVC.

## Sprint 2 · Clientes, ventas e informes (8–10 de noviembre)

**Meta:** registrar ventas correctamente y mantener stock consistente.

| Integrante | Trabajo y solución asignada | Terminado cuando… |
|---|---|---|
| Jeifre | Pantallas de clientes/vehículos, carrito de punto de venta, selección de cliente y medio de pago, historial y reportes. | El usuario puede encontrar referencias, formar carrito y consultar ventas/resumen desde la interfaz. |
| Bleyder | API MVC de clientes/ventas/reportes. Validación de cantidades y precios desde DB, bloqueos/transacción MySQL para stock, cancelación de venta pendiente y liberación única de unidades. | Efectivo se registra como pagado; Mercado Pago queda pendiente; stock insuficiente no se vende ni se descuenta parcialmente. |
| Davinso | Revisión de claves/relaciones e índices, consultas de resumen, compatibilidad de la base con el flujo y actualización de diccionario/diagrama/API. | Entrega un SQL fresco reproducible y documentos que coinciden con las tablas y endpoints reales. |

**Integración del sprint:** crear cliente, registrar venta en efectivo, comprobar descuento de stock, consultar historial e informe; cancelar una venta pendiente de demostración.

## Sprint 3 · Mercado Pago, integración y entrega (11–12 de noviembre)

**Meta:** dejar el checkout Sandbox conectado y un paquete instalable/documentado para la exposición.

| Integrante | Trabajo y solución asignada | Terminado cuando… |
|---|---|---|
| Jeifre | Checkout Pro Orders API, regreso al sistema y consulta del estado final; historial con estados, responsive, mensajes de configuración y guion de demostración. | La app genera el checkout cuando Sandbox está configurado y muestra estado pendiente/aprobado/rechazado desde la venta del backend. |
| Bleyder | Creación y consulta de Orders, webhook firmado con HMAC, verificación de monto/moneda/ambiente e idempotencia. | Un evento válido actualiza el pago; una firma inválida se rechaza; un evento duplicado no vuelve a procesarse. |
| Davinso | Manual de instalación/despliegue, variables, diagrama/diccionario final, recorrido de integración, revisión de ZIP y lista de demostración. | Otra persona puede seguir los pasos desde una copia limpia y entiende qué depende de Mercado Pago y HTTPS. |

**Integración del sprint:** usar credenciales de prueba y una URL HTTPS pública para retorno y webhook. Si aún no se tienen credenciales o URL pública, se demuestra el flujo de efectivo sin afirmar que se procesó un pago externo.

## Cadencia diaria

- Cada integrante trabaja en una rama desde `develop`; propone cambios mediante pull request o revisión en pareja.
- Hagan y documenten al menos un commit diario real por integrante mientras exista trabajo. No fabriquen historial retroactivo.
- Antes de integrar, revisen los archivos que comparte el sprint con otro integrante (en especial `frontend/src/main.jsx`, `database/schema.sql` y `backend/src/server.js`).
- Al cierre del día, actualicen el estado en la carpeta de su sprint y comuniquen bloqueos y cambios de contrato.
- Día 12: congelen cambios de alcance, hagan recorrido completo y preparen el equipo/diapositivas para el viernes 13.

## Criterios de cierre del proyecto

1. Catálogo ficticio con filtro de compatibilidad y alertas.
2. Acceso protegido y contraseña con hash.
3. CRUD administrativo de repuestos y registro de clientes.
4. Venta en efectivo, descuento de stock transaccional e historial.
5. Código de checkout Sandbox y webhook firmado; pago externo solo se marca confirmado con evento válido.
6. Reportes, diccionario, diagrama, instrucciones locales y manual de despliegue.
7. Git con ramas/commits auténticos del trabajo del grupo y variables/credenciales fuera del repositorio.

## Ramas de ejemplo

```text
feature/jeifre-sprint-1
feature/bleyder-sprint-1
feature/davinso-sprint-1
```

Repitan el patrón con `sprint-2` y `sprint-3`. Sincronicen `develop` antes de iniciar cada sprint y pidan revisión de otro integrante antes de mezclar.

## Uso responsable de asistencia de IA

El paquete integrado se preparó con ayuda de IA. Los integrantes deben revisar y poder explicar su parte y declarar la asistencia según la regla del docente. No atribuyan a una persona trabajo que no revisó ni creen commits retrospectivos. El docente decide la penalización aplicable.
