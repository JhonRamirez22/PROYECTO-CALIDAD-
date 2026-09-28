# Desplegar RiTech en AWS con ECS Fargate

La base de la aplicación es Next.js 15 en `apps/web`, NestJS 11 en `apps/api`, Prisma 6 y PostgreSQL. Este paquete prepara imágenes Docker, task definitions de ejemplo, un script para ECR y una migración Prisma completa para una base nueva.

## Arquitectura

```text
Navegador
   └─ Route 53 → ACM/HTTPS → Application Load Balancer
                              ├─ app.<dominio> → ECS Fargate / Next.js :3000
                              └─ api.<dominio> → ECS Fargate / NestJS :3001
                                                       ├─ RDS PostgreSQL :5432
                                                       └─ EFS (/mnt/ritech-storage)
```

EFS mantiene persistentes los adjuntos que la app hoy guarda como archivos locales. RDS no se publica en internet; el SG de RDS solo acepta conexiones desde el SG de API. El repo destino es público, así que conserva `.env` fuera del control de versiones.

## 0. Requisitos y región

Necesitas una cuenta AWS con permisos para VPC, ECS/Fargate, ECR, RDS, EFS, ALB, ACM, Route 53 y Secrets Manager; AWS CLI v2, Docker y un dominio. Elige la región donde residirá la base y ejecuta todo dentro de esa región. Para usuarios principalmente europeos, compara una región europea disponible y el requisito de residencia de los datos; el costo depende del número de tareas, AZ, NAT, RDS, EFS y retención de logs. Crea un AWS Budget antes de empezar.

Autentica con IAM Identity Center/SSO o el método de tu organización, sin access keys en archivos. Define en la terminal:

```bash
export AWS_PROFILE="<perfil-aws>"
export AWS_REGION="<region-aws>"
export NEXT_PUBLIC_API_URL="https://api.<tu-dominio>"
aws sts get-caller-identity --profile "$AWS_PROFILE"
```

## 1. Revisa la migración antes de tocar RDS

`apps/api/prisma/migrations/20260928023926_sprint2_aws_ready/` es un baseline creado desde el esquema actual y corresponde a una **base PostgreSQL nueva y vacía**. Ya existe el script seguro `npm run db:migrate:deploy`; los despliegues AWS deben usar `prisma migrate deploy`, no `prisma db push --accept-data-loss`.

Antes de producción:

1. Revisa el SQL de la migración y pruébalo en una base temporal vacía.
2. Si modificas `schema.prisma`, crea otra migración en una base de desarrollo temporal y confirma los cambios SQL.
3. Para una base que ya tiene tablas (por ejemplo `ritech_db` o una base Render), no apliques este baseline sin una estrategia de adopción/baseline y un respaldo.

## 2. Red, base de datos y archivos

1. Crea una VPC con dos subredes públicas para el ALB y subredes privadas para ECS, RDS y los mount targets EFS, distribuidas en al menos dos AZ.
2. Crea los security groups: ALB acepta 80/443 desde internet; web/API aceptan sus puertos `3000`/`3001` solo desde el SG del ALB; RDS acepta `5432` solo desde el SG de API; EFS acepta NFS `2049` solo desde el SG de API.
3. Crea RDS PostgreSQL 16 en subredes privadas, cifrado, con backups automáticos y sin acceso público. Para staging puede ser Single-AZ; para producción evalúa Multi-AZ, snapshots, retención y protección contra borrado.
4. Crea EFS regional cifrado y un access point con directorio raíz `/ritech-storage`, UID/GID `1000` y permisos de escritura para el usuario `node`. Añade mount targets en las AZ usadas por Fargate.
5. Crea secretos individuales en Secrets Manager: `DATABASE_URL` (endpoint RDS y `?schema=public&sslmode=require`) y `JWT_SECRET` (por ejemplo, generado con `openssl rand -hex 48`). Codifica caracteres reservados de la contraseña en la URL. Añade `SMTP_HOST`, `SMTP_USER` y `SMTP_PASS` solo cuando configures un proveedor de correo.
6. Configura salida de red para las tareas privadas: NAT Gateway o VPC endpoints adecuados para ECR, S3, CloudWatch Logs y Secrets Manager. NAT puede tener un costo relevante.

La app requiere `RITECH_UPLOAD_DIR=/mnt/ritech-storage`; la task definition API ya monta EFS en esa ruta. Al crecer el sistema, S3 con un adaptador de almacenamiento en la app puede sustituir EFS.

## 3. Certificado TLS y balanceador

Solicita en ACM un certificado DNS-validado para `app.<tu-dominio>` y `api.<tu-dominio>` **en la región del ALB**. Crea un Application Load Balancer público con listener 80 que redirija a 443 y un listener HTTPS 443 que use el certificado.

Crea dos target groups HTTP con target type **IP**: web en puerto 3000 con health check `/login`; API en puerto 3001 con health check `/`. Añade reglas por host header para `app.<tu-dominio>` y `api.<tu-dominio>`. Crea los alias A/AAAA de Route 53 hacia el ALB (o los registros equivalentes en tu DNS).

`GET /` de la API confirma que Nest está respondiendo; antes de producción conviene agregar un health check de readiness que valide conexión a RDS.

## 4. ECR: construir y publicar las imágenes

Los Dockerfiles se construyen desde la raíz del monorepo para que npm workspaces y `package-lock.json` estén disponibles. `NEXT_PUBLIC_API_URL` se incorpora al bundle del frontend al compilar; si cambia el dominio API, reconstruye la imagen web.

```bash
bash infra/aws/push-images.sh
```

El script crea los repositorios `ritech-api` y `ritech-web` si no existen, autentica Docker con ECR y publica ambas imágenes con un tag único. Anota los valores `API_IMAGE` y `WEB_IMAGE` que imprime. Si tu Fargate usa ARM64, modifica conjuntamente la plataforma de build y la arquitectura de las task definitions; el ejemplo usa `linux/amd64`.

## 5. ECS Fargate y permisos

Crea un cluster ECS Fargate y registra task definitions usando:

- `infra/aws/task-definitions/api-task-definition.example.json`
- `infra/aws/task-definitions/web-task-definition.example.json`

Reemplaza todos los marcadores (`<REGION>`, `<ACCOUNT_ID>`, `<IMAGE_TAG>`, IDs de EFS/access point, ARNs de secretos, dominios y log groups). Crea antes `/ecs/ritech-api` y `/ecs/ritech-web` en CloudWatch Logs.

Usa roles IAM separados:

- **Task execution role:** ECR pull, CloudWatch Logs y `secretsmanager:GetSecretValue`; agrega `kms:Decrypt` solo si los secretos usan una clave KMS administrada por ti.
- **API task role:** permisos EFS `ClientMount`/`ClientWrite` limitados al filesystem/access point. No agregues claves AWS al contenedor.
- **Web:** no necesita permisos de RDS, EFS ni secretos.

Crea dos ECS Services con una tarea inicial, subredes privadas, sin IP pública y sus respectivos target groups del ALB. Puedes comenzar con el tamaño del ejemplo y subir CPU/memoria después de observar CloudWatch.

## 6. Migrar el esquema y crear el primer administrador

### Migración

Cuando RDS esté disponible y el task definition de API esté registrado, ejecuta una tarea única en el cluster usando la imagen de API, las subredes/SG de API y el secreto `DATABASE_URL`. Sobrescribe el comando con:

```text
npm exec --workspace=apps/api -- prisma migrate deploy --schema=prisma/schema.prisma
```

Revisa la salida y confirma que Prisma aplicó las migraciones. No corras migraciones desde cada réplica al iniciar.

### Administrador inicial

Guarda `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_NAME` y `INITIAL_ADMIN_PASSWORD` como secretos temporales; la clave debe tener 12+ caracteres, mayúscula, minúscula y número. Ejecuta otra tarea única de la misma imagen, inyectando esos secretos solo para esa tarea, con comando:

```text
npm run bootstrap:admin --workspace=apps/api
```

La tarea es idempotente: si ya existe un administrador activo no cambia la cuenta; si el email existe con otro rol, se detiene. Una vez confirmado el login, elimina los secretos temporales y cualquier task definition que los referencie.

**No ejecutes `seed`, `seed:sprint2` ni la carga sintética antigua en producción.** Usa los seeds solo en staging con una clave aleatoria; los pedidos/clientes/certificados son de demostración.

## 7. Variables y verificación

API runtime: `NODE_ENV=production`, `PORT=3001`, `CORS_ORIGINS=https://app.<tu-dominio>`, `RITECH_UPLOAD_DIR=/mnt/ritech-storage`; secretos `DATABASE_URL`, `JWT_SECRET` y opcionalmente SMTP. Web runtime: `NODE_ENV=production`, `PORT=3000`; `NEXT_PUBLIC_API_URL` ya se fijó en el build.

Comprueba:

1. ALB tiene ambos target groups `healthy`.
2. `https://app.<tu-dominio>/login` carga Next.js y `https://api.<tu-dominio>/` responde.
3. El inicio de sesión funciona y las solicitudes del navegador no fallan por CORS.
4. Un pedido de prueba se guarda en RDS y un PDF adjunto sigue disponible después de reemplazar la task API, confirmando persistencia EFS.
5. Los logs aparecen en CloudWatch; RDS tiene backups y EFS dispone de plan de backup.
6. AWS Budget y alarmas están configurados para RDS, Fargate, ALB, NAT, EFS y CloudWatch.

## 8. MCP Agent Toolkit de AWS

El MCP AWS aún no está configurado en esta sesión. Su setup requiere el nombre de perfil AWS CLI, la experiencia AWS (nueva o avanzada) y la región de la cuenta. No compartas access keys ni contraseñas en el chat; la autenticación se realiza en el navegador. El toolkit usa `us-east-1` para su propio servicio aunque el despliegue de RiTech se haga en otra región.

## Referencias oficiales

- [ECS con AWS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [Load balancing para servicios ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-load-balancing.html)
- [Montar EFS en ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/efs-volumes.html)
- [RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Publicar imágenes en ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html)
- [HTTPS listener de ALB](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-https-listener.html)
- [Secrets en task definitions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html)
- [Alias Route 53 hacia un ALB](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-elb-load-balancer.html)
