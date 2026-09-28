# RiTech Export System

Plataforma web para organizar la exportación de café y cacao de origen colombiano hacia compradores europeos. El flujo que se presenta en Sprint 2 sigue el expediente operativo: usuario → producto → lote → cliente y contrato activo → pedido → aprobación → documentos de exportación.

## Mapa del repositorio

| Ubicación | Contenido |
|---|---|
| `apps/web/` | Interfaz Next.js: manifiesto, productos, lotes, inventario, clientes, pedidos, certificados, documentos y usuarios. |
| `apps/api/` | API NestJS, autenticación JWT, validaciones y servicios por módulo. |
| `apps/api/prisma/schema.prisma` | Fuente canónica del modelo PostgreSQL y relaciones. |
| `apps/api/prisma/seed-sprint2.ts` | Datos sintéticos para la demostración local. |
| `BASES DE DATOS PROYECTO/` | Scripts y documentación previa de la base local original. No se borra ni se usa para reemplazarla. |
| `docs/design-plan.md` | Plan visual anterior, conservado como referencia histórica. La UI de Sprint 2 usa el manifiesto operativo y los tokens de `apps/web/src/app/globals.css`. |
| `CALIDAD/Sprint-2/` | Documento de requisitos, matriz de pruebas, presentación y guía de entrega. |
| `PRODUCT.md` | Propósito, alcance y límites del producto. |

## Alcance seleccionado en Jira

Las 15 historias del Sprint 2 son: RTE-10, RTE-11, RTE-15, RTE-16, RTE-17, RTE-18, RTE-20, RTE-21, RTE-24, RTE-25, RTE-26, RTE-28, RTE-30, RTE-31 y RTE-32. Las épicas relacionadas son autenticación/seguridad, productos/lotes, clientes, pedidos/exportación y documentación.

La validación de pedidos requiere un contrato activo del cliente. Se agregó un modelo de apoyo `ClientContract` para esa regla de RTE-24; no representa la implementación completa de la historia independiente de contratos marco. Los certificados de origen usan formatos permitidos por configuración del destino; esta lista debe confirmarse con la autoridad o el proceso comercial antes de usar datos reales.

## Preparar una base de datos limpia

Se creó la base local independiente `ritech_sprint2`; la base anterior `ritech_db` se conserva sin cambios. En una máquina nueva, con PostgreSQL activo y Node/npm instalados, ejecuta:

```bash
bash CALIDAD/Sprint-2/setup-database.sh
```

El script se detiene si el nombre de base ya existe; no ejecuta `DROP DATABASE`. Para crear una base aparte, define otro `RITECH_DB_NAME`. El esquema se publica desde Prisma y el seeder agrega solamente registros ficticios de demostración. Si no defines `RITECH_DEMO_PASSWORD`, se genera una contraseña aleatoria y se imprime una sola vez en la consola. No reutilices contraseñas de demostración en AWS.

## Ejecutar la aplicación

Desde la raíz, abre dos terminales. La primera ejecuta la API conectada a la base Sprint 2:

```bash
DATABASE_URL="postgresql://${USER}@localhost:5432/ritech_sprint2?schema=public" npm run dev:api
```

La segunda inicia la web:

```bash
npm run dev:web
```

La aplicación queda en `http://localhost:3000` y la API en `http://localhost:3001`. La ruta `/` abre el manifiesto; desde la navegación se accede a productos, lotes, inventario, clientes, pedidos, certificados, documentos y administración de usuarios. Para obtener un paquete de producción, usa `npm run build`. Para ejecutar las pruebas unitarias de API: `npm --workspace apps/api run test -- --runInBand`.

## Recorrido para la demostración

1. Iniciar sesión como administrador local.
2. Mostrar el manifiesto y seleccionar un pedido para abrir su expediente.
3. Registrar un producto y un lote, verificando el código de trazabilidad y el estado.
4. Registrar un cliente europeo, asociarle contrato activo y contactos.
5. Crear un pedido con un lote disponible, sus datos de embalaje y valor total; enviarlo a aprobación.
6. Aprobar o rechazar el pedido como administrador/gerente.
7. Generar la proforma PDF y packing list; mostrar versiones en historial y certificados asociados al envío/lote.
8. Mostrar la matriz de pruebas y el estado real Jira; no presentar casos pendientes como aprobados.

## Límites de la demostración

- Los clientes, productos, lotes, pedidos, contratos y certificados del seeder son datos sintéticos.
- La validación de VAT revisa formato y prefijo según el país; no consulta VIES ni confirma validez fiscal.
- La entrega de correo requiere SMTP. Sin SMTP, la interfaz informa que el envío no se realizó y permite descargar el PDF.
- Los adjuntos se almacenan en `apps/api/storage` en desarrollo local. Para producción se necesita almacenamiento persistente y protegido.
- La autenticación usa JWT de 24 horas con renovación silenciosa; la sesión se conserva en el navegador de demostración.

## Entregables académicos

Revisa `CALIDAD/Sprint-2/README.md` para localizar el documento de requisitos, el documento separado de distribución supuesta de trabajo, la plantilla Excel completada, la presentación y los diagramas. Los nombres Jira RTE y asignaciones son la referencia; el apartado de contribuciones distingue asignación de trabajo demostrado.
