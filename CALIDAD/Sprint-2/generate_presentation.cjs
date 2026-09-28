const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const out = __dirname;
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'RiTech · Equipo de Calidad de Software';
pptx.subject = 'Resumen de requisitos, diseño, pruebas y demostración del Sprint 2';
pptx.title = 'RiTech Export Desk · Sprint 2';
pptx.company = 'RiTech';
pptx.lang = 'es-CO';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'es-CO',
};
pptx.defineSlideMaster({
  title: 'LIGHT',
  background: { color: 'F4F3EF' },
  objects: [
    { rect: { x: 0, y: 0, w: 0.16, h: 7.5, line: { color: 'F05A24', transparency: 100 }, fill: { color: 'F05A24' } } },
    { text: { text: 'RITECH  /  CALIDAD DE SOFTWARE', options: { x: 0.48, y: 0.22, w: 5.8, h: 0.22, fontFace: 'Aptos', fontSize: 8, bold: true, color: '667085', charSpacing: 1.2, margin: 0 } } },
    { line: { x: 0.48, y: 7.08, w: 12.1, h: 0, line: { color: 'D6DEE6', width: 0.8 } } },
    { text: { text: 'RiTech Export Desk  ·  27 sep 2026', options: { x: 0.5, y: 7.16, w: 6.6, h: 0.18, fontFace: 'Aptos', fontSize: 8, color: '667085', margin: 0 } } },
    { slideNumber: { x: 12.1, y: 7.15, w: 0.35, h: 0.2, color: '667085', fontFace: 'Aptos', fontSize: 8 } },
  ],
  slideNumber: { x: 12.1, y: 7.15, w: 0.35, h: 0.2, color: '667085', fontFace: 'Aptos', fontSize: 8 },
});

const C = { navy: '102B46', ink: '19334C', blue: '3465E9', orange: 'F05A24', mint: 'E8F3EF', paper: 'F4F3EF', gray: '667085', white: 'FFFFFF', line: 'D6DEE6', green: '1C6B4A', amber: '9A6700' };
const ST = pptx.ShapeType;

function text(slide, value, x, y, w, h, size = 16, color = C.ink, extra = {}) {
  slide.addText(value, { x, y, w, h, margin: 0, fontFace: 'Aptos', fontSize: size, color, breakLine: false, valign: 'mid', fit: 'shrink', ...extra });
}

function title(slide, heading, kicker = 'SPRINT 2') {
  text(slide, kicker.toUpperCase(), 0.55, 0.55, 6.3, 0.24, 9, C.blue, { bold: true, charSpacing: 1.4 });
  text(slide, heading, 0.55, 0.88, 12.15, 0.48, 25, C.navy, { bold: true, charSpacing: -0.5 });
}

function card(slide, x, y, w, h, label, detail, accent = C.blue) {
  slide.addShape(ST.roundRect, { x, y, w, h, rectRadius: 0.12, line: { color: C.line, width: 0.8 }, fill: { color: C.white } });
  slide.addShape(ST.rect, { x, y, w: 0.07, h, line: { color: accent, transparency: 100 }, fill: { color: accent } });
  text(slide, label, x + 0.2, y + 0.14, w - 0.38, 0.32, 15, C.navy, { bold: true });
  text(slide, detail, x + 0.2, y + 0.53, w - 0.4, h - 0.65, 11, C.gray, { valign: 'top', breakLine: false });
}

function line(slide, x1, y1, x2, y2, color = C.line, width = 1.5, arrow = false) {
  slide.addShape(ST.line, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color, width, endArrowType: arrow ? 'triangle' : 'none' } });
}

function addContainedImage(slide, imagePath, box) {
  const size = path.basename(imagePath) === 'casos-de-uso.png'
    ? { width: 1900, height: 1340 }
    : { width: 1900, height: 1290 };
  const scale = Math.min(box.w / size.width, box.h / size.height);
  const w = size.width * scale;
  const h = size.height * scale;
  slide.addImage({ path: imagePath, x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h });
}

// 1. Opening
{
  const s = pptx.addSlide();
  s.background = { color: C.navy };
  s.addShape(ST.rect, { x: 0, y: 0, w: 0.22, h: 7.5, line: { color: C.orange, transparency: 100 }, fill: { color: C.orange } });
  text(s, 'RITECH  /  EXPORT DESK', 0.75, 0.55, 5.8, 0.28, 10, 'A9C5EF', { bold: true, charSpacing: 1.8 });
  text(s, 'Un lote.\nUn recorrido.\nUna historia verificable.', 0.75, 1.38, 7.2, 2.35, 32, C.white, { bold: true, breakLine: false, valign: 'top', charSpacing: -0.7 });
  text(s, 'Requisitos · modelo de datos · pruebas · demostración', 0.79, 4.0, 7.6, 0.44, 17, 'D6E3F5');
  text(s, 'Sprint 2  ·  15 historias seleccionadas  ·  27 sep 2026', 0.79, 4.63, 8.2, 0.32, 12, 'AFC0D4');
  s.addShape(ST.roundRect, { x: 9.15, y: 1.38, w: 2.7, h: 3.95, rectRadius: 0.18, line: { color: '54708F', width: 1 }, fill: { color: '183A5C' } });
  text(s, 'MANIFIESTO', 9.45, 1.73, 2.1, 0.25, 10, 'A9C5EF', { bold: true, charSpacing: 1.3 });
  text(s, 'COLOMBIA', 9.45, 2.48, 1.4, 0.3, 10, C.white, { bold: true, charSpacing: 1 });
  text(s, 'UNIÓN EUROPEA', 9.45, 4.2, 2.0, 0.3, 10, C.white, { bold: true, charSpacing: 1 });
  line(s, 9.55, 3.3, 11.42, 3.3, '7C9FC5', 2, true);
  s.addShape(ST.ellipse, { x: 9.45, y: 3.2, w: 0.2, h: 0.2, line: { color: 'A9C5EF', width: 1 }, fill: { color: 'A9C5EF' } });
  s.addShape(ST.ellipse, { x: 11.35, y: 3.2, w: 0.2, h: 0.2, line: { color: C.orange, width: 1 }, fill: { color: C.orange } });
  text(s, 'Presentación máxima: 10 minutos', 0.79, 6.45, 5.7, 0.3, 11, 'AFC0D4');
}

// 2. Scope at a glance
{
  const s = pptx.addSlide('LIGHT'); title(s, '15 historias, un expediente operativo');
  const groups = [
    ['Acceso', 'RTE-10 · RTE-11', 'Usuarios, roles y sesión segura.', C.blue],
    ['Origen', 'RTE-15 · RTE-16 · RTE-17 · RTE-18', 'Productos, lotes, certificados e inventario.', C.green],
    ['Clientes', 'RTE-20 · RTE-21', 'Directorio europeo y contactos.', C.orange],
    ['Pedidos', 'RTE-24 · RTE-25 · RTE-26 · RTE-28', 'Contrato, lote, aprobación y proforma.', C.blue],
    ['Documentos', 'RTE-30 · RTE-31 · RTE-32', 'Packing list y certificados de exportación.', C.green],
  ];
  groups.forEach((g, i) => card(s, 0.65 + (i % 3) * 4.1, 1.72 + Math.floor(i / 3) * 2.0, 3.7, 1.55, g[0] + '  ·  ' + g[1], g[2], g[3]));
  text(s, 'Base local independiente: ritech_sprint2  ·  datos seed sintéticos', 0.7, 6.45, 10.5, 0.3, 11, C.gray);
}

// 3. Use cases
{
  const s = pptx.addSlide('LIGHT'); title(s, 'Actores y casos de uso');
  addContainedImage(s, path.join(out, 'diagramas', 'casos-de-uso.png'), { x: 1.45, y: 1.5, w: 10.5, h: 5.25 });
  text(s, 'La operación es interna; el comprador consulta los documentos asociados.', 0.75, 6.52, 11.5, 0.28, 10, C.gray, { align: 'center' });
}

// 4. Data model
{
  const s = pptx.addSlide('LIGHT'); title(s, 'Modelo de datos relacional');
  addContainedImage(s, path.join(out, 'diagramas', 'modelo-de-datos.png'), { x: 1.45, y: 1.48, w: 10.5, h: 5.25 });
  text(s, 'Prisma/PostgreSQL · ClientContract es precondición técnica de creación de pedido.', 0.75, 6.52, 11.5, 0.28, 10, C.gray, { align: 'center' });
}

// 5. Operational path
{
  const s = pptx.addSlide('LIGHT'); title(s, 'Del origen al expediente de exportación');
  const flow = [
    ['01', 'Producto', 'Variedad y origen'], ['02', 'Lote', 'Peso y trazabilidad'], ['03', 'Cliente', 'VAT y contrato'],
    ['04', 'Pedido', 'Líneas e Incoterm'], ['05', 'Revisión', 'Aprobar / rechazar'], ['06', 'Documentos', 'Proforma y packing'],
  ];
  flow.forEach((item, i) => {
    const x = 0.62 + i * 2.08;
    s.addShape(ST.roundRect, { x, y: 2.1, w: 1.72, h: 2.03, rectRadius: 0.12, line: { color: C.line, width: 1 }, fill: { color: C.white } });
    s.addShape(ST.ellipse, { x: x + 0.18, y: 2.32, w: 0.42, h: 0.42, line: { color: C.blue, width: 1 }, fill: { color: C.blue } });
    text(s, item[0], x + 0.18, 2.40, 0.42, 0.14, 8, C.white, { bold: true, align: 'center' });
    text(s, item[1], x + 0.18, 2.94, 1.42, 0.34, 14, C.navy, { bold: true });
    text(s, item[2], x + 0.18, 3.43, 1.42, 0.4, 10, C.gray, { valign: 'top' });
    if (i < flow.length - 1) line(s, x + 1.74, 3.1, x + 2.02, 3.1, C.orange, 2, true);
  });
  s.addShape(ST.roundRect, { x: 1.0, y: 5.08, w: 11.25, h: 0.84, rectRadius: 0.1, line: { color: 'C4D6CF', width: 1 }, fill: { color: C.mint } });
  text(s, 'Validaciones demostradas: contrato activo · cantidad ≤ peso del lote · aprobación auditada · archivos vinculados a expediente.', 1.25, 5.28, 10.75, 0.42, 13, C.green, { bold: true, align: 'center' });
}

// 6. Documents and certificates
{
  const s = pptx.addSlide('LIGHT'); title(s, 'Documentos: descarga, relación e historial');
  card(s, 0.72, 1.68, 5.65, 1.55, 'Proforma · RTE-28', 'PDF desde pedido; número secuencial y registro en historial. Envío por email pendiente de SMTP aprobado.', C.blue);
  card(s, 6.9, 1.68, 5.65, 1.55, 'Packing list · RTE-30', 'Edita bultos y dimensiones antes de generar. Requiere pedido aprobado, envío y datos completos.', C.orange);
  card(s, 0.72, 3.62, 5.65, 1.55, 'Fitosanitario · RTE-31', 'Emisor, fechas, lote/envío, adjunto descargable y filtros por vencimiento/fechas.', C.green);
  card(s, 6.9, 3.62, 5.65, 1.55, 'Origen · RTE-32', 'Formato permitido por destino, producto/lote, envío y archivo PDF histórico.', C.blue);
  text(s, 'Los archivos utilizados en pruebas están rotulados como sintéticos y no tienen validez oficial.', 0.9, 6.15, 11.6, 0.4, 11, C.gray, { italic: true, align: 'center' });
}

// 7. Verification
{
  const s = pptx.addSlide('LIGHT'); title(s, 'Verificación y honestidad del estado');
  const metrics = [['Build API', 'PASS', C.green], ['Build web', 'PASS', C.green], ['Jest API', '6 suites · 23 tests', C.blue], ['Pruebas smoke', 'Flujos API/UI seleccionados', C.orange]];
  metrics.forEach((m, i) => card(s, 0.75 + (i % 2) * 6.0, 1.58 + Math.floor(i / 2) * 1.65, 5.48, 1.25, m[0], m[1], m[2]));
  s.addShape(ST.roundRect, { x: 0.78, y: 5.2, w: 11.5, h: 0.92, rectRadius: 0.12, line: { color: 'E8CF9B', width: 1 }, fill: { color: 'FFF4D6' } });
  text(s, 'Jira: 14 historias Finalizadas · RTE-28 en curso por la integración de email/SMTP.', 1.08, 5.42, 10.9, 0.48, 12, C.amber, { bold: true, align: 'center' });
  text(s, 'La matriz Excel marca PENDIENTE cuando no se ejecutó; no se presenta como fallo ni como aprobación.', 0.85, 6.42, 11.4, 0.28, 10, C.gray, { align: 'center' });
}

// 8. Ten-minute run of show
{
  const s = pptx.addSlide('LIGHT'); title(s, 'Guion de demostración · 10:00');
  const rows = [
    ['00:00–01:00', 'Propósito, alcance y roles', 'Slide 1–2'],
    ['01:00–02:15', 'Casos de uso y entidades', 'Slide 3–4'],
    ['02:15–03:15', 'Catálogo, lote e inventario', 'Demo: productos → lotes'],
    ['03:15–04:30', 'Cliente, VAT, contacto y contrato', 'Demo: directorio'],
    ['04:30–06:15', 'Pedido, asignación, embalaje y decisión', 'Demo: borrador → revisión'],
    ['06:15–08:15', 'PDFs, certificados y versiones', 'Demo: expediente documental'],
    ['08:15–09:20', 'Matriz de pruebas y estados Jira', 'Solo evidencia verificada'],
    ['09:20–10:00', 'Conclusión y siguientes pasos', 'SMTP / filtros pendientes'],
  ];
  const tableRows = [['Tiempo', 'Contenido', 'Apoyo']].concat(rows);
  s.addTable(tableRows, { x: 0.72, y: 1.56, w: 11.8, h: 4.98, colW: [2.05, 5.2, 4.55], rowH: 0.52, border: { type: 'solid', color: C.line, pt: 0.7 }, fill: C.white, color: C.ink, fontFace: 'Aptos', fontSize: 11, margin: 0.08, valign: 'mid', autoFit: false, showHeader: true, headerColor: C.white, headerFill: C.navy, headerFontFace: 'Aptos', headerFontSize: 11 });
  text(s, 'La presentación no excede 10 minutos; dejar el prototipo ya iniciado y los datos QA claramente identificados.', 0.8, 6.65, 11.4, 0.23, 9, C.gray, { align: 'center' });
}

// 9. Delivery and attribution boundary
{
  const s = pptx.addSlide('LIGHT'); title(s, 'Entrega, responsables y límites');
  card(s, 0.72, 1.65, 5.6, 1.4, 'Fecha de entrega', '30 de septiembre de 2026 · antes de las 2:00 p. m.', C.orange);
  card(s, 6.85, 1.65, 5.6, 1.4, 'Documentos', 'Requisitos, diagrama UML, modelo de datos y matriz Excel están en CALIDAD/Sprint-2.', C.blue);
  card(s, 0.72, 3.42, 5.6, 1.4, 'Aportes individuales', 'La distribución Jira es un supuesto separado; requiere validación de cada integrante.', C.green);
  card(s, 6.85, 3.42, 5.6, 1.4, 'Límites del prototipo', 'VAT por formato, almacenamiento local y formatos de certificado configurados; confirmar antes de usar datos reales.', C.orange);
  text(s, 'Cierre: mostrar lo construido, leer los resultados de prueba y dejar explícitos los pendientes.', 0.9, 5.72, 11.4, 0.5, 15, C.navy, { bold: true, align: 'center' });
}

const output = path.join(out, 'Presentacion-Sprint-2.pptx');
pptx.writeFile({ fileName: output }).then(() => {
  console.log(`Presentación generada: ${output}`);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
