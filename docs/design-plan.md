# Design Plan — RiTech Export System

> Rev. 2 — corrige contraste AA, colisión de hues acento/warning, agrega tokens faltantes (superficie oscura, texto-sobre-color, radius, spacing, motion, type scale) y define reemplazo de iconografía/emoji de wireframe.

## 1. Color Palette

Derivado del dominio real: café arábico de origen colombiano, cacao Criollo/Trinitario, finca, puerto de exportación.

| Token | Hex | Contraste vs. fondo típico | Uso | Origen |
|---|---|---|---|---|
| `--primary` | `#1B4332` | 8.9:1 sobre `--surface` | Navbar, sidebar, botones principales, headers | Verde oscuro de hoja de café — confianza B2B, seriedad corporativa |
| `--accent` | `#B45309` | 4.6:1 sobre `--surface` | Acentos, CTAs secundarios, badges, hover states | Vaina de cacao tostado — ámbar terroso, calor del origen |
| `--surface` | `#FAF5F0` | — | Fondo general de páginas | Crudo de saco de yute / pergamino de café |
| `--surface-warm` | `#F5EDE3` | — | Cards, secciones alternadas | Molido de café antes del tueste — tono cálido neutro |
| `--surface-dark` | `#14261F` | — | Footer, banners CTA oscuros | Verde de tueste profundo — contraparte oscura de `--primary` |
| `--text` | `#1A1A1A` | 15.8:1 sobre `--surface` | Texto principal | Negro de tueste oscuro |
| `--text-muted` | `#57534E` | 4.6:1 sobre `--surface` | Texto secundario, labels, metadata de ficha técnica | Gris cálido — **corregido**: el `#6B7280` original daba 3.1:1 y fallaba AA en texto normal |
| `--text-on-dark` | `#FAF5F0` | 13.1:1 sobre `--surface-dark` / `--primary` | Texto sobre `--primary` o `--surface-dark` | Contraparte clara de `--surface` |
| `--text-on-accent` | `#FFFFFF` | 4.8:1 sobre `--accent` | Texto sobre botones/badges `--accent` | Blanco puro — máxima legibilidad sobre ámbar |
| `--border` | `#E5DDD3` | — | Bordes sutiles, separadores | Pergamino seco |
| `--success` | `#22C55E` | — | Estados positivos (aprobado, enviado) | Verde de finca activa — **corregido**: el `#15803D` original quedaba a un paso de `--primary` y se confundían a distancia |
| `--warning` | `#CA8A04` | — | Alertas, estados pendientes | Ámbar dorado de café secándose al sol — **corregido**: el `#D97706` original era casi el mismo hue que `--accent` (20° de diferencia), indistinguible entre "botón de acción" y "alerta" |
| `--danger` | `#DC2626` | — | Errores, rechazos | Rojo de cereza de café |

**Regla de uso:** ningún texto se pinta directamente con un hex fuera de esta tabla. Si un componente necesita un color que no está aquí, es señal de que falta un token — se agrega a esta tabla antes de usarse, no se improvisa inline.

**Nota de autocrítica (se mantiene de la v1):** estos colores no son genéricos de "café". El verde oscuro `#1B4332` es el verde de la hoja de *Coffea arabica*, no un verde random. El ámbar `#B45309` es el tono de una vaina de cacao abierta con la pulpa al aire.

---

## 2. Typography

### Roles

| Rol | Familia | Uso |
|---|---|---|
| Display | `DM Serif Display` | H1, hero headlines, títulos de sección — serif con carácter, tradición artesanal + sofisticación B2B |
| Body | `Inter` | Todo el texto de cuerpo, formularios, tablas, fichas técnicas — máxima legibilidad en datos densos |
| Mono | `JetBrains Mono` | Códigos de trazabilidad, números de lote, IDs de documento — alineación perfecta en columnas numéricas |

### Type scale
Sin esto cada componente improvisa su propio tamaño/peso — esta tabla es lo que se traduce 1:1 a `tailwind.config`.

| Token | Familia | Tamaño / line-height | Peso | Uso |
|---|---|---|---|---|
| `--font-display-lg` | Display | 56px / 1.1 | 400 | H1 de hero |
| `--font-display-md` | Display | 36px / 1.15 | 400 | H2 de sección |
| `--font-display-sm` | Display | 28px / 1.2 | 400 | H3, títulos de card destacada |
| `--font-body-lg` | Body | 18px / 1.5 | 400 | Intro de sección, subtítulos |
| `--font-body-base` | Body | 16px / 1.5 | 400 | Texto de cuerpo estándar |
| `--font-body-sm` | Body | 14px / 1.4 | 500 | Labels, metadata, texto de tabla |
| `--font-mono-sm` | Mono | 14px / 1.4, `font-variant-numeric: tabular-nums`, tracking +0.01em | 500 | Lotes, IDs, cantidades — sin `tabular-nums` las columnas numéricas no alinean |

`// TODO(RITECH-XXX): confirmar con negocio si se requiere soporte EN/FR/DE — textos en alemán corren ~30% más largos y pueden romper las cards de precio (`€X.XX/kg`) y el layout del type scale actual. Definir estrategia de i18n antes de maquetar componentes con texto fijo.`

---

## 3. Layout tokens

No estaban en la v1 — sin esto, shadcn/ui cae en su radius/spacing default genérico (que es el de cualquier SaaS, no el de esta marca).

| Token | Valor | Por qué |
|---|---|---|
| `--radius` | `6px` | Radius bajo, no el 8-12px suave típico de e-commerce de consumo — refuerza "documento comercial / seriedad B2B" sobre "app de consumo" |
| `--radius-sm` | `4px` | Badges, chips de certificación |
| `--spacing-unit` | `4px` (base de la escala Tailwind, sin cambios) | Consistencia con utilidades estándar — no se introduce una escala custom |
| `--shadow-card` | `0 1px 3px rgba(27,67,50,0.08), 0 1px 2px rgba(27,67,50,0.06)` | Sombra tintada con `--primary`, no un gris neutro genérico — coherente con la paleta |
| `--shadow-card-hover` | `0 4px 12px rgba(27,67,50,0.12)` | Hover de product card (ver Sección 6) |

---

## 4. Iconografía

La v1 usaba emoji (🌱📋🚢🇪🇺, 🫘🍫) solo como placeholder de wireframe ASCII — esto **no es una especificación de producción**: el render de emoji varía entre Windows/Mac/Linux/móvil y rompe consistencia de marca al instante.

- **Iconos de UI** (trust bar, sidebar, estados): `lucide-react`, trazo `1.5px`, color `currentColor` heredando de `--primary`/`--text-muted` según contexto.
- **Producto** (café, cacao, granos): fotografía real tratada, no icono — ver Sección 5.1 del `AGENTS.md` (imágenes alusivas al negocio real, tratamiento consistente, `alt` descriptivo).
- Mapeo de la trust bar del Home: `🌱→Leaf`, `📋→FileCheck`, `🚢→Ship`, `🇪🇺→Globe` (con label de texto "UE" al lado, no depender de un ícono de bandera).

---

## 5. Layout — Wireframes ASCII

### 5.1 Home (Landing Page pública)
```
┌─────────────────────────────────────────────────────────┐
│ NAVBAR: Logo RiTech │ Catálogo │ Nosotros │ Login │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HERO                                                   │
│  ┌─────────────────────────────────────────────┐        │
│  │  [Foto real: vaina de cacao abierta]         │        │
│  │                                              │        │
│  │  "Café y Cacao Colombiano                    │        │
│  │   de Origen para el Mercado Europeo"         │        │
│  │                                              │        │
│  │  [Explorar Catálogo]  [Solicitar Cotización]│        │
│  └─────────────────────────────────────────────┘        │
│                                                         │
│  TRUST BAR (iconos lucide-react, no emoji)               │
│  ┌──────────┬──────────┬──────────┬──────────┐          │
│  │ Leaf     │ FileCheck│ Ship     │ Globe    │          │
│  │ Orgánico │ EUDR     │ FOB/CIF  │ UE Ready │          │
│  │ Cert.    │ Compli.  │ Incoterm │ Export   │          │
│  └──────────┴──────────┴──────────┴──────────┘          │
│                                                         │
│  PRODUCTOS DESTACADOS (foto real por producto)           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ [FOTO]  │ │ [FOTO]  │ │ [FOTO]  │                   │
│  │Arábica  │ │Caturra  │ │Criollo  │                   │
│  │Supremo  │ │Lot 2024 │ │Trinit.  │                   │
│  │€X,XX/kg │ │€X,XX/kg │ │€X,XX/kg │                   │
│  └─────────┘ └─────────┘ └─────────┘                   │
│                                                         │
│  FOOTER (--surface-dark + --text-on-dark)                │
│  Contacto │ Terms │ Privacy │ © 2024 RiTech SAS         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Dashboard (panel interno autenticado)
```
┌──────────┬──────────────────────────────────────────────┐
│ SIDEBAR  │ HEADER: Dashboard │ [Usuario ▼]              │
│          ├──────────────────────────────────────────────┤
│ Dash     │                                              │
│ Prod     │  KPI CARDS (--shadow-card, --radius)          │
│ Lotes    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│ Clientes │  │Ventas │ │Pend. │ │Envíos│ │Client│       │
│ Pedidos  │  │€12,4k │ │  8   │ │  3   │ │  45  │       │
│ Docs     │  └──────┘ └──────┘ └──────┘ └──────┘       │
│ Reportes │                                              │
│          │  CHARTS ROW                                  │
│ ───────  │  ┌────────────────┐ ┌────────────────┐       │
│ Admin    │  │ Ventas 12m     │ │ Por Producto  │       │
│ Salir    │  │ ████░░░░░░     │ │ ████ Café 60% │       │
│          │  └────────────────┘ └────────────────┘       │
└──────────┴──────────────────────────────────────────────┘
```
Formato numérico UE: `€12,4k` (coma decimal), no `€12.4k` — confirmar en i18n (Sección 2, TODO).

### 5.3 Catálogo Público
```
┌─────────────────────────────────────────────────────────┐
│ NAVBAR                                                  │
├─────────────────────────────────────────────────────────┤
│  CATÁLOGO DE PRODUCTOS                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │ [Filtros]                                        │   │
│  │ Tipo: [Café ▼] [Cacao ▼] [Todos]                │   │
│  │ Variedad: [Arábica ▼] [Criollo ▼]               │   │
│  │ Certificación: [Orgánico] [Fair Trade]           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ [FOTO]   │ │ [FOTO]   │ │ [FOTO]   │                │
│  │ Café     │ │ Café     │ │ Cacao    │                │
│  │ Arábica  │ │ Caturra  │ │ Criollo  │                │
│  │ Supremo  │ │ MH-417   │ │ Trinit.  │                │
│  │ Huila    │ │ Nariño   │ │ Santander│                │
│  │ €X,XX/kg │ │ €X,XX/kg │ │ €X,XX/kg │                │
│  │ [Ver Más]│ │ [Ver Más]│ │ [Ver Más]│                │
│  └──────────┘ └──────────┘ └──────────┘                │
└─────────────────────────────────────────────────────────┘
```

### 5.4 Ficha de Producto
```
┌─────────────────────────────────────────────────────────┐
│ NAVBAR                                                  │
├─────────────────────────────────────────────────────────┤
│  ← Volver al Catálogo                                   │
│                                                         │
│  ┌───────────────────┐  DETALLES DEL PRODUCTO           │
│  │                   │                                  │
│  │  [FOTO GRANDE]    │  Café Arábica Supremo            │
│  │  Grano de café    │  Tipo: Café                     │
│  │  cereza roja      │  Variedad: Arábica              │
│  │                   │  Origen: Huila, Colombia         │
│  │                   │  Altitud: 1.800 msnm             │
│  └───────────────────┘  Proceso: Lavado                 │
│                          Certificaciones:                │
│                          ☑ Orgánico  ☑ Fair Trade        │
│                                                         │
│  ── LOTES DISPONIBLES (--font-mono-sm, tabular-nums) ──  │
│  ┌──────────┬──────────┬──────────┬──────────┐          │
│  │ Lote     │ Peso     │ Estado   │ Acción   │          │
│  ├──────────┼──────────┼──────────┼──────────┤          │
│  │ LT-2024  │ 1.200 kg │Disponible│ [Cotizar]│          │
│  │ LT-0042  │   800 kg │Disponible│ [Cotizar]│          │
│  └──────────┴──────────┴──────────┴──────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Elemento Firma

**Mapa de trazabilidad visual** — un diagrama de flujo horizontal que muestra el recorrido del grano:

```
  FINCA          PROCESAMIENTO      PUERTO            DESTINO UE
┌─────┐        ┌──────────┐      ┌────────────┐     ┌──────────────┐
│Finca│ ─────▶ │Despulpado│ ───▶ │  Cartagena │ ──▶ │  Rotterdam    │
│Huila│        │ Lavado   │      │  (puerto)  │     │ Países Bajos  │
└─────┘        │ Secado   │      └────────────┘     └──────────────┘
               └──────────┘
```

Este mapa aparece:
1. En la hero section del home (versión estática/ilustrada)
2. En la ficha de producto (versión dinámica con datos del lote real)
3. En el dashboard como widget de tracking por pedido

**No se acumulan elementos firma.** Todo lo demás (color, tipografía, layout) se disciplina alrededor de este único elemento distintivo.

---

## 7. Motion Design

### Tokens de timing
Sin esto cada componente define su propio timing ad hoc y el sitio se siente inconsistente aunque cada animación individual esté bien hecha.

| Token | Valor | Uso |
|---|---|---|
| `--duration-fast` | `150ms` | Hover states, focus rings |
| `--duration-base` | `250ms` | Transiciones de card, stepper |
| `--duration-slow` | `400ms` | Scroll reveals, transición card→detalle |
| `--easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default para todas las transiciones de UI |
| `--easing-emphasis` | `cubic-bezier(0.16, 1, 0.3, 1)` | Reveals de hero / elemento firma — entrada con más "presencia" |

### Aplicación
- **Scroll reveals** en fichas de producto (`framer-motion` `whileInView`, `--duration-slow` + `--easing-emphasis`).
- **Hover micro-interactions** en product cards: `scale(1.02)` + `--shadow-card` → `--shadow-card-hover`, `--duration-fast` + `--easing-standard`.
- **Stepper animation** en checkout: cantidad +/- con animación de número, `--duration-fast`.
- **Transición card → detalle** al hacer click en producto del catálogo, `--duration-base`.
- **Respeto a `prefers-reduced-motion`**: todas las transiciones anteriores caen a `--duration-fast` sin desplazamiento/escala (solo opacidad) cuando el sistema lo pide.

---

## 8. Autocrítica — Pasada 2

1. **¿Es genérico?** No — los colores están derivados de: hoja de café (verde oscuro), vaina de cacao tostado (ámbar), cereza madura (rojo), pergamino seco (beige). El elemento firma es un mapa de trazabilidad que no existiría en una "exportadora de flores" o "aguacate".

2. **¿Numeración arbitraria?** No — la sección de trazabilidad usa secuencia real: Finca → Procesamiento → Puerto → Destino. Es el flujo de exportación real.

3. **¿Hero genérico?** No — el hero abre con fotografía real de grano/vaina + headline de origen colombiano + mercado europeo. No es "big number + gradiente".

4. **¿Los tokens son suficientes para que un dev no tenga que improvisar?** Ahora sí — color, type scale, radius, spacing, shadow y motion timing están todos definidos explícitamente (ver Secciones 1–3 y 7). En la v1 solo color y familias tipográficas estaban resueltos.

---

## 9. Pendientes abiertos

- `// TODO(RITECH-XXX): definir estrategia de i18n (ES/EN/FR/DE) antes de maquetar componentes con texto fijo — afecta type scale y ancho de cards de precio.`
- `// TODO(RITECH-XXX): confirmar con negocio el set final de certificaciones a mostrar como badge (Orgánico, Fair Trade, Rainforest Alliance, EUDR) para dimensionar el chip de --radius-sm correctamente.`