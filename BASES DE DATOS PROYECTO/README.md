# Base de datos de RiTech

Este directorio contiene el esquema relacional PostgreSQL del sistema RiTech y los pasos para cargarlo con pgAdmin 4. En este equipo ya quedó creada y actualizada la base `ritech_db` en PostgreSQL 16 local. Se conservaron sus datos existentes y se aplicaron únicamente los cambios faltantes del modelo. El diseño se generó desde el modelo Prisma real de `apps/api/prisma/schema.prisma`, por lo que incluye los módulos implementados para exportación de café y cacao: usuarios y permisos, productos y lotes, clientes, pedidos, pagos y facturas, calidad, certificados, logística y embarques, documentación aduanera/EUDR, notificaciones y auditoría.

## Archivos

- `01_esquema_ritech.sql`: crea desde cero los tipos enumerados, tablas, claves primarias y foráneas, índices y restricciones. No inserta usuarios ni datos ficticios. Úsalo solo en una base nueva.
- `02_actualizacion_ritech_db.sql`: actualización aditiva que se aplicó a la base `ritech_db` existente; agrega los elementos que faltaban y conserva los datos actuales. No la ejecutes otra vez sobre esta misma base.

## Conexión local ya configurada

El servidor local PostgreSQL 16 está iniciado y `ritech_db` ya está lista. Para registrarla en pgAdmin 4 (si aún no aparece en el panel): clic derecho en **Servers** → **Register** → **Server…**. En **General**, usa el nombre `RiTech local`. En **Connection**, configura:

- Host: `localhost`
- Port: `5432`
- Maintenance database: `postgres`
- Username: `jhon`
- Password: déjala vacía en esta configuración local

Guarda y expande **Servers → RiTech local → Databases → ritech_db → Schemas → public → Tables**. Si ya tienes registrado el servidor local, refresca su árbol y abre `ritech_db`.

La conexión `RiTech local` ya quedó registrada en pgAdmin y el árbol `ritech_db → public → Tables` muestra las 29 tablas. Para conectar la aplicación, la URL local es `postgresql://jhon@localhost:5432/ritech_db`.

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
- Este archivo se genera desde el esquema Prisma. Si cambian modelos en `apps/api/prisma/schema.prisma`, regenera el SQL antes de usarlo para una instalación nueva.
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
