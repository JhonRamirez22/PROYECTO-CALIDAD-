# Base de datos de RiTech

Este directorio conserva scripts SQL históricos para el esquema local de RiTech y los pasos de pgAdmin usados antes del alcance Sprint 2. **No son la fuente de verdad del esquema actual y no deben usarse para desplegar AWS.** La fuente actual es `apps/api/prisma/schema.prisma`; AWS debe instalarse con las migraciones versionadas de `apps/api/prisma/migrations/`.

## Archivos

- `01_esquema_ritech.sql`: snapshot histórico de creación de tablas para una base vacía de la versión anterior del esquema.
- `02_actualizacion_ritech_db.sql`: snapshot histórico de cambios aditivos aplicados a la base local original. No lo ejecutes otra vez ni sobre una base AWS.

## Conexión local ya configurada

El servidor local PostgreSQL 16 está iniciado y `ritech_db` ya está lista. Para registrarla en pgAdmin 4 (si aún no aparece en el panel): clic derecho en **Servers** → **Register** → **Server…**. En **General**, usa el nombre `RiTech local`. En **Connection**, configura:

- Host: `localhost`
- Port: `5432`
- Maintenance database: `postgres`
- Username: el usuario PostgreSQL configurado en tu equipo
- Password: déjala vacía en esta configuración local

Guarda y expande **Servers → RiTech local → Databases → ritech_db → Schemas → public → Tables**. Si ya tienes registrado el servidor local, refresca su árbol y abre `ritech_db`.

La conexión local `RiTech local` puede aparecer en pgAdmin. Sustituye el usuario en la URL local según tu configuración: `postgresql://<usuario-local>@localhost:5432/ritech_db`.

## Crear la base de datos desde pgAdmin

1. Abre pgAdmin 4 y conéctate al servidor PostgreSQL.
2. En el panel **Browser**, haz clic derecho en **Databases** → **Create** → **Database…**.
3. Escribe `ritech_db` como nombre (o el que prefieras) y guarda.
4. Selecciona la base recién creada. Abre **Tools** → **Query Tool**.
5. En Query Tool, usa el botón **Open File** y selecciona `01_esquema_ritech.sql`.
6. Pulsa **Execute/Run** (icono ▶ o F5). Espera a que el panel de mensajes indique que terminó sin errores.
7. En Browser, haz clic derecho en **Schemas** → **Refresh**; expande `public` → **Tables** para ver las tablas creadas.

El script usa identificadores entre comillas dobles porque Prisma conserva los nombres PascalCase del modelo (por ejemplo, `"User"`, `"Order"` y `"Shipment"`). Déjalos exactamente como están al consultar esos objetos desde SQL; sin comillas PostgreSQL convierte los nombres a minúsculas.

## Modelo y relaciones principales

- **Usuarios** pueden tener roles/permisos, perfil de vendedor, lotes, pedidos vendidos y registros de auditoría/notificación.
- **Productos** tienen lotes trazables; los lotes pueden relacionarse con certificados, análisis de calidad, muestras y documentos EUDR.
- **Clientes** realizan pedidos; cada pedido puede tener varios renglones, facturas y documentos, así como una comisión y datos logísticos.
- **Embarques** agrupan pedidos mediante `ShipmentOrder` (permite consolidación/pooling), y se relacionan con destino, proveedor, reserva, documentos aduaneros y EUDR.
- **Calidad** almacena análisis de catación y verificaciones de muestras. **Certificados** pueden corresponder a producto o lote; los certificados de finca se vinculan al perfil del vendedor.

## Notas de uso

- Requiere PostgreSQL compatible con los tipos `JSONB` y `TIMESTAMP(3)` usados por Prisma. No requiere extensiones adicionales.
- El esquema crea estructura, no datos de ejemplo ni cuentas de acceso. Las claves `id` son texto: en la aplicación Prisma genera sus valores `cuid` al crear registros. Si insertas manualmente desde pgAdmin, debes proporcionar un `id` único en esas tablas.
- La columna `User.password` almacena el hash que prepara la aplicación; nunca guardes contraseñas en texto plano.
- Estos SQL son snapshots antiguos y no incluyen todos los cambios de Sprint 2. Para una base nueva, usa las migraciones actuales en `apps/api/prisma/migrations/`; no uses `db push --accept-data-loss` en producción.
- El script inicializa un esquema vacío. Si ya existen tablas con esos nombres, el `CREATE TABLE` fallará; úsalo sobre una base nueva o respalda y revisa el estado antes de aplicarlo a una base existente.

## Consultas rápidas

En Query Tool puedes listar tablas con:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Ver columnas de pedidos:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'Order'
ORDER BY ordinal_position;
```
