# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Personal interno de RiTech que administra usuarios, productos, lotes, clientes, pedidos y documentos de exportación.
- Administradores, operadores, gerentes/aprobadores y personal contable aparecen como roles en las historias seleccionadas.
- Los compradores europeos son clientes registrados del flujo de exportación.

## Product Purpose

RiTech Export System es una aplicación para gestionar la exportación de café y cacao colombianos hacia clientes de la Unión Europea. El incremento seleccionado debe permitir recorrer el flujo operativo desde el acceso y el registro de catálogo/lotes hasta la gestión de clientes, pedidos y documentos esenciales.

## Positioning

La operación reúne el producto y su lote trazable con el pedido del cliente europeo y la documentación de exportación asociada.

## Operating Context

- El dominio incluye café y cacao, lotes con trazabilidad, certificaciones, clientes europeos y pedidos de exportación.
- Las historias seleccionadas abarcan acceso, productos, lotes, inventario, clientes y contactos, pedido/aprobación, proforma, packing list y certificados fitosanitarios y de origen.
- La demostración prioriza al personal interno que opera el flujo de exportación.

## Capabilities and Constraints

- Alcance solicitado para el incremento: RTE-10, RTE-11, RTE-15, RTE-16, RTE-17, RTE-18, RTE-20, RTE-21, RTE-24, RTE-25, RTE-26, RTE-28, RTE-30, RTE-31 y RTE-32.
- Se excluyen del alcance las historias retiradas a solicitud del usuario: RTE-12, RTE-33, RTE-34, RTE-38, RTE-40 y RTE-44.
- El repositorio existente usa Next.js para la web, NestJS para la API, Prisma y PostgreSQL. El usuario pidió una nueva experiencia UI desde cero; la base técnica existente se inspecciona y se conserva cuando permita entregar un prototipo funcional.
- El enum de roles del esquema Prisma no coincide directamente con todos los roles nombrados en RTE-10. Resolver esa correspondencia antes de afirmar la autorización final.
- Mantener cada criterio de aceptación según su ticket Jira. No declarar historias completas sin pruebas y evidencia verificable.

## Evidence on Hand

- Product Backlog de Jira RTE, incluyendo las historias y criterios de aceptación seleccionados.
- `apps/api/prisma/schema.prisma` y módulos actuales de API y web.
- `docs/design-plan.md` y documentación de base de datos existente.
- No se deben inventar contribuciones individuales ni resultados de pruebas; se completarán con evidencia aportada o ejecutada.

## Product Principles

- Mantener trazabilidad desde el producto/lote hasta el pedido y sus documentos.
- Priorizar un flujo operativo demostrable para el personal interno.
- Mostrar estados y validaciones de forma clara.
- Distinguir el alcance seleccionado de funcionalidades excluidas o aún no verificadas.

## Accessibility & Inclusion

La interfaz web debe ser navegable por teclado, etiquetar los campos y controles, presentar errores junto al campo relacionado, conservar contraste legible y respetar la preferencia de movimiento reducido.
