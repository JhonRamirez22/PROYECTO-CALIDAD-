# Entrega Sprint 2 · RiTech Export System

Entrega solicitada: **30 de septiembre de 2026, antes de las 2:00 p. m.** Presentación: máximo 10 minutos por equipo.

## Archivos de la entrega

- `Requerimientos-Sprint-2.docx` y `Requerimientos-Sprint-2.pdf`: alcance, requisitos, actores/casos UML, lectura del Product Backlog, épicas/historias/criterios y base de datos.
- `Supuesto-Trabajo-Integrantes-Sprint-2.docx` y `.pdf`: distribución propuesta basada en asignaciones Jira actuales; requiere validación de cada integrante.
- `Plan-de-Pruebas-Sprint-2.xlsx`: copia de la plantilla de la profesora con los casos trazados a las 15 historias.
- `Presentacion-Sprint-2.pptx`: resumen y guion cronometrado de la demo.
- `Entrega-RiTech-Sprint-2.zip`: paquete con los archivos de entrega, diagramas y adjunto de prueba.
- `diagramas/casos-de-uso.png` y `diagramas/modelo-de-datos.png`: imágenes usadas dentro del documento y la presentación.
- `fixtures/certificado-sintetico-demo.pdf`: adjunto artificial para probar la carga; indica que no tiene validez oficial.

## Qué corresponde y qué no

Las 15 historias RTE-10, RTE-11, RTE-15, RTE-16, RTE-17, RTE-18, RTE-20, RTE-21, RTE-24, RTE-25, RTE-26, RTE-28, RTE-30, RTE-31 y RTE-32 conforman el alcance. El contrato activo se modela como prerequisito técnico de RTE-24; no se declara terminada la épica completa de contratos marco. Se excluyen RTE-12, RTE-33, RTE-34, RTE-38, RTE-40 y RTE-44, retiradas anteriormente por complejidad.

Al cerrar esta revisión, Jira muestra 14 historias seleccionadas como **Finalizada** y RTE-28 como **En curso**. Cada transición incluye un comentario breve con la evidencia comprobada. Esto registra el estado verificado del prototipo, pero no demuestra qué integrante ejecutó cada tarea. El documento de aportes sigue marcado como **supuesto** y debe ser confirmado por el equipo antes de presentarlo.

## Orden recomendado para explicar el trabajo

1. Resume propósito, alcance y perfiles de acceso.
2. Explica requisitos funcionales, no funcionales propuestos y restricciones.
3. Recorre el diagrama UML y el modelo relacional.
4. Muestra Jira: estado, asignación y evidencia real por historia.
5. Ejecuta la demo local según el paso a paso del README raíz.
6. Cierra con pruebas ejecutadas, pendientes, contribuciones verificadas y siguientes pasos.

## Base de datos y datos de demostración

La base independiente es `ritech_sprint2`. El esquema fuente está en `apps/api/prisma/schema.prisma`; `bash CALIDAD/Sprint-2/setup-database.sh` crea la base sólo si no existe, publica el esquema y carga registros sintéticos. La base anterior `ritech_db` se conserva. No uses los datos ficticios como documentos comerciales reales.
