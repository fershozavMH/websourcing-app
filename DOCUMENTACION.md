# WebSourcing App — Documentación del Proyecto

**Machinery Hunters | Plataforma de Inteligencia de Adquisición de Maquinaria**
**Versión actual:** MVP (en producción) — rama `refactor` activa
**Última actualización:** Junio 2026

---

## 1. Contexto General del Ecosistema

WebSourcing forma parte de un ecosistema tecnológico más amplio que Machinery Hunters está desarrollando de forma paralela. El objetivo global es **digitalizar y automatizar el proceso completo de adquisición y venta de maquinaria pesada usada**, reduciendo los tiempos de búsqueda, mejorando la trazabilidad de clientes y optimizando la gestión financiera.

### Ecosistema de plataformas interconectadas

```
┌─────────────────────────────────────────────────────────────────┐
│                   ECOSISTEMA MACHINERY HUNTERS                  │
├───────────────────┬────────────────────┬────────────────────────┤
│   Página Web MVP  │   WebSourcing App  │         ERP            │
│   (En producción) │   (En producción)  │   (En producción)      │
│                   │                    │                        │
│ Vitrina pública   │ Dashboard interno  │ Control financiero     │
│ de maquinaria     │ del equipo de      │ y de clientes          │
│                   │ sourcing           │                        │
│ Formularios de    │ Catálogo de        │ Alta de maquinaria     │
│ contacto y leads  │ maquinaria         │ validada               │
│                   │ encontrada por     │                        │
│        │          │ scrapers           │        │               │
│        ▼          │        │     ▲     │        ▼               │
│   GoHighLevel     │   Firebase DB      │   GoHighLevel CRM      │
│   CRM ◄───────────┼────────────────────┼───────────────────►    │
│                   │        ▲           │                        │
│                   │        │           │                        │
│                   │   Scraper Python   │                        │
│                   │   (backend sep.)   │                        │
└───────────────────┴────────────────────┴────────────────────────┘
```

| Plataforma | Estado | Rol |
|---|---|---|
| **Página Web (MVP)** | En producción | Vitrina pública; genera leads conectados a GoHighLevel CRM |
| **WebSourcing App** | En producción | Dashboard interno; muestra maquinaria scrapeada para el equipo de sourcing |
| **ERP (Frappe)** | En producción | Gestión financiera, alta de máquinas validadas, integración con CRM |
| **Scraper Python** | En producción (repositorio separado) | Extrae maquinaria de múltiples fuentes y la sube a Firebase |
| **GoHighLevel CRM** | En producción | CRM central que conecta la web pública, el ERP y el equipo de ventas |

---

## 2. Descripción del Proyecto

**WebSourcing App** es un **dashboard de inteligencia de adquisición en tiempo real** diseñado para el equipo interno de sourcing de Machinery Hunters. Centraliza en una sola interfaz toda la maquinaria pesada disponible en el mercado (EE.UU., Canadá, México), scrapeada automáticamente desde múltiples fuentes, permitiendo al equipo identificar oportunidades de compra de forma rápida y eficiente.

### Problema que resuelve

Sin esta herramienta, el equipo de sourcing debía revisar manualmente decenas de sitios web y Facebook Marketplace para encontrar maquinaria disponible, proceso que tomaba horas diarias y generaba información dispersa y difícil de comparar.

**Con WebSourcing App:**
- Toda la maquinaria disponible se centraliza automáticamente en un solo lugar.
- Los filtros avanzados reducen el tiempo de búsqueda de horas a minutos.
- El equipo puede contactar vendedores directamente desde la plataforma (WhatsApp/teléfono).
- Se pueden identificar patrones de mercado (precios, disponibilidad por región, marcas).
- El equipo puede enviar maquinaria directamente al ERP desde la tarjeta.

---

## 3. Objetivo

Proporcionar al equipo de sourcing de Machinery Hunters una herramienta interna que:

1. **Consolide** en tiempo real toda la maquinaria pesada disponible en el mercado norteamericano (EE.UU., Canadá, México).
2. **Filtre y clasifique** el inventario por categoría, marca, modelo, precio, ubicación, año y especificaciones técnicas.
3. **Facilite el contacto** directo con vendedores via WhatsApp o teléfono.
4. **Sirva como punto de entrada** para el flujo de validación humana que culmina en el alta de maquinaria en el ERP.
5. **Envíe directamente al ERP** las máquinas de interés con todos sus datos estructurados.

---

## 4. Alcance

### Dentro del alcance

- Dashboard de consulta para uso **interno** del equipo de sourcing.
- Visualización de maquinaria pesada en **16 categorías**.
- Filtrado avanzado por más de **20 criterios** (marca, modelo, país, estado, precio, año, horas, millas, transmisión, tracción, ejes, tipo de pluma, etc.).
- Acceso a fuentes de datos: **Agencias (dealers)** y **Facebook Marketplace**.
- Soporte para maquinaria en **EE.UU., Canadá y México**.
- Autenticación con email y contraseña (Firebase Auth).
- Acceso directo a la publicación original del vendedor.
- Integración con WhatsApp para contacto inmediato.
- **Envío al ERP** (Frappe) desde la tarjeta de maquinaria, con mapeo completo de campos.

### Fuera del alcance (actual)

- Publicación pública de maquinaria (eso es responsabilidad de la Página Web MVP).
- Gestión financiera o de clientes (eso es responsabilidad del ERP).
- Alta manual de maquinaria por parte del usuario (el scraper alimenta la base de datos automáticamente).

---

## 5. Arquitectura

### Flujo de datos

```
Fuentes externas                Backend                    Frontend
─────────────────          ──────────────────         ──────────────────
Sitios de dealers    ──►                          
                          Scraper Python    ──►     WebSourcing App
Facebook Marketplace ──►  (repo separado)           (este proyecto)
                               │                         │
                               ▼                reading  │  write (via API Route)
                          Firebase Firestore ────────────┤──────────────────────►
                          (maquinaria_aprobada)           │
                                                          │ POST /api/erp
                                                          ▼
                                                   ERP Frappe
                                                   (mh.posix.mx)
```

### Componentes principales

| Componente | Tecnología | Descripción |
|---|---|---|
| Frontend | Next.js 15 + React 19 | Dashboard web responsive |
| Estilos | Tailwind CSS v4 | UI system + diseño responsivo |
| Base de datos | Firebase Firestore | Colección `maquinaria_aprobada` |
| Autenticación | Firebase Auth | Email/password |
| API Route ERP | Next.js Route Handler (`/api/erp`) | Envío al ERP Frappe con Firebase Admin |
| Firebase Admin SDK | `firebase-admin` | Lectura/escritura server-side de Firestore |
| ERP | Frappe (mh.posix.mx) | DocType `MH Equipo` via REST API |
| Backend scraper | Python (repo separado) | Escribe en Firestore via service account |
| Despliegue | Vercel | Hosting del frontend |
| Analytics | Microsoft Clarity | Seguimiento de uso |

---

## 6. Stack Tecnológico

```json
{
  "framework": "Next.js 15.2.3 (App Router)",
  "ui": "React 19.2.4",
  "styling": "Tailwind CSS v4",
  "database": "Firebase Firestore",
  "auth": "Firebase Authentication",
  "admin_sdk": "firebase-admin",
  "erp": "Frappe Framework REST API",
  "language": "TypeScript 5",
  "deploy": "Vercel"
}
```

---

## 7. Estructura del Proyecto

```
websourcing-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout raíz, metadata
│   │   ├── page.tsx                # Dashboard principal y catálogo
│   │   ├── globals.css             # Estilos globales (Tailwind)
│   │   ├── login/
│   │   │   └── page.tsx            # Página de autenticación
│   │   ├── portafolio/
│   │   │   └── page.tsx            # Vista de portafolio curado (colección "portafolio")
│   │   └── api/
│   │       └── erp/
│   │           └── route.ts        # API Route: envío al ERP Frappe
│   ├── components/
│   │   ├── MachineCard.tsx         # Tarjeta de maquinaria individual
│   │   ├── Filters.tsx             # Sidebar de filtros orquestador
│   │   └── filters/                # Subcomponentes de filtros por categoría
│   │       ├── MultiSelectModal.tsx    # Modal reutilizable de selección múltiple
│   │       ├── MultiSelectTrigger.tsx  # Botón trigger que abre el modal
│   │       ├── RetroFilters.tsx        # Filtros específicos de Retroexcavadoras
│   │       ├── CompactadoraFilters.tsx # Filtros específicos de Compactadoras
│   │       ├── BombaFilters.tsx        # Filtros específicos de Bombas de concreto
│   │       ├── GruaFilters.tsx         # Filtros específicos de Grúas
│   │       └── ElevadorFilters.tsx     # Filtros específicos de Elevadores
│   ├── hooks/
│   │   ├── useMachines.ts          # Consultas a Firebase Firestore
│   │   └── useMachineFilters.ts    # Lógica de filtrado y ordenamiento
│   ├── lib/
│   │   ├── firebase.ts             # Inicialización de Firebase Client SDK
│   │   └── firebase-admin.ts       # Inicialización de Firebase Admin SDK
│   ├── types/
│   │   └── index.ts                # Interfaces TypeScript (Machine, SortOption)
│   └── constants/
│       ├── appConfig.ts            # Config global (colecciones, paginación, moneda)
│       ├── machineCategories.ts    # CAT enum, grupos y helpers de normalización
│       ├── categories.tsx          # CATEGORIAS_INICIO: datos + íconos para pantalla home
│       ├── locations.ts            # USA_STATES, CAN_PROVINCES, AVAILABLE_COUNTRIES
│       └── vehicleSpecs.ts         # TRACCIONES, EJES_TRASEROS
├── public/
│   └── iconos/                     # Íconos de categorías (.webp/.png)
├── .env.local                      # Variables de entorno (no en git)
├── package.json
├── tsconfig.json
├── next.config.ts
└── DOCUMENTACION.md                # Este archivo
```

---

## 8. Modelo de Datos

### Colección Firestore: `maquinaria_aprobada`

```typescript
interface Machine {
  // Identificación
  id: string
  titulo: string
  categoria_tarea: string       // Categoría (ej. "Excavadoras", "Sleeper")
  origen_tarea: string
  pagina: string                // Nombre del sitio fuente
  url: string                   // Link a la publicación original

  // Media
  imagenes: string[]

  // Datos comerciales
  precio: number                // 0 = "Consultar precio"
  año: number
  ubicacion: string             // "Ciudad, Estado" o "Ciudad, Estado, País"
  telefono_vendedor: string

  // Uso / desgaste
  uso?: number                  // Horas genéricas (compatibilidad legado)
  uso_horas?: number            // Horas de operación
  uso_millas?: number           // Millas recorridas (camiones)
  uso_bomba?: number            // Horas de la bomba (bombas de concreto)
  uso_motor?: number            // Horas del motor (camiones)

  // Especificaciones técnicas — generales
  marca?: string
  modelo?: string
  motor?: string
  transmision?: string          // Valor raw del scraper; se normaliza al enviar al ERP
  capacidad?: string            // Capacidad de carga O alcance de pluma (bombas)
  alcance?: number              // Alcance en pies (grúas, elevadores)
  combustible?: string

  // Especificaciones técnicas — camiones/grúas/bombas
  marca_camion?: string
  marca_pluma?: string
  traccion_camion?: string      // "4x2", "6x4", etc.
  ejes_traseros?: string        // "Tandem", "Single axle", "Tri-axle"
  peso_eje?: number             // Peso máximo por eje en toneladas (tractocamiones)

  // Subtipos
  subtipo_elevador?: string     // "ARTICULADO" | "TELESCOPICO" | "TIJERA"
  subtipo_grua_terreno?: string
  subtipo_compactadora?: string

  // Flags de equipamiento
  tiene_cabina?: boolean
  tiene_martillo?: boolean
  tiene_extension?: boolean
  es_4x4?: boolean
  tiene_almeja?: boolean
  tiene_ripper?: boolean
  tipo_pluma?: string           // "Z-BOOM", "RZ", "R/F", etc.

  // Subasta
  es_subasta?: boolean
  precio_maximo?: number
  subasta_inicia?: string       // ISO date "YYYY-MM-DD"
  subasta_cierre?: string       // ISO date "YYYY-MM-DD"

  // Trazabilidad ERP
  estado_sourcing?: string      // "enviado_erp" cuando se envió al ERP
  id_erp?: string               // ID Frappe asignado (ej. "EQUI-000042")
  enviado_por?: string          // Usuario que lo envió
  fecha_envio_erp?: string      // ISO datetime

  // Identificación adicional
  numero_serie?: string         // Número de serie del equipo

  // Portafolio — campos generados por automatización de curación
  score_oportunidad?: string    // "LOW" | "MEDIUM" | "HIGH"
  margen_bruto_estimado?: number // Margen estimado en USD
  aprobado?: boolean
  procesado?: boolean

  // Metadata
  timestamp?: any
}
```

### Categorías soportadas (18)

| Firestore `categoria_tarea` | UI (pantalla home) | ERP `custom_categoria_equipo` | Tipo |
|---|---|---|---|
| `Excavadoras` | Excavadoras | `EXCAVADORA` | Maquinaria amarilla |
| `Retroexcavadoras` | Retroexcavadoras | `RETROEXCAVADORA` | Maquinaria amarilla |
| `Topadores` | Topadores | `TOPADOR FRONTAL` | Maquinaria amarilla |
| `Cargadores` | Cargadores | `CARGADOR FRONTAL` | Maquinaria amarilla |
| `Motoconformadoras` | Motoconformadoras | `MOTOCONFORMADORA` | Maquinaria amarilla |
| `Compactadoras` | Compactadoras | `COMPACTADORA` | Maquinaria amarilla |
| `Elevadores` | Elevadores | `ELEVADOR ARTICULADO` / `TELESCOPICO` / `TIJERA` | Elevación |
| `Camiones Volteo` | Camiones Volteo | `CAMIÓN DE VOLTEO` | Camión |
| `Camiones Trompo` | Camiones Trompo | `TROMPO REVOLVEDOR` | Camión |
| `Camiones Pipa` | Camiones Pipa | `PIPA DE AGUA` | Camión |
| `Sleeper` | *(subtipo de Tractocamiones)* | `TRACTOCAMION` | Tractocamión |
| `Day cab` | *(subtipo de Tractocamiones)* | `TRACTOCAMION` | Tractocamión |
| — | Tractocamiones | — | Agrupador UI de Sleeper + Day cab |
| `Gruas Titanes` | Grúas Titanes | `GRÚA TITÁN` | Grúa |
| `Gruas Articuladas` | Grúas Articuladas | `GRÚA ARTICULADA` | Grúa |
| `rough_terrain` | Rough Terrain | `ROUGH TERRAIN` | Grúa |
| `rough_terrain` | All Terrain | `ALL TERRAIN` | Grúa (normaliza igual que Rough Terrain) |
| `Bombas` | Bombas | `BOMBA DE CONCRETO` | Bomba |

> **Nota sobre Tractocamiones:** La pantalla de inicio muestra "Tractocamiones" como categoría unificada que al seleccionarla consulta tanto `Sleeper` como `Day cab` en Firestore. El scraper sigue guardando los subtipos originales.
>
> **Nota sobre Rough/All Terrain:** Ambas tarjetas de inicio normalizan a `rough_terrain` en Firestore via `normalizeCategory()`. La distinción es solo visual en la UI.

---

## 9. Funcionalidades Principales

### 9.1 Autenticación
- Login con email y contraseña via Firebase Auth.
- Todas las rutas requieren sesión activa (redirección automática a `/login`).
- Logout desde el navbar.

### 9.2 Navegación por Categorías
- Pantalla de inicio con las 16 categorías en grid visual.
- Al seleccionar una categoría se carga el catálogo correspondiente.

### 9.3 Tabs de Fuente de Datos
- **Agencias**: Solo maquinaria de dealers y sitios especializados.
- **Facebook Marketplace**: Solo publicaciones de Facebook.
- **Mix All**: Todas las fuentes combinadas.

### 9.4 Filtros Avanzados
| Filtro | Tipo | Aplica a |
|---|---|---|
| Búsqueda por palabra clave | Texto | Todas |
| País | Multi-select modal | Todas |
| Estado/Provincia | Multi-select modal | Todas |
| Marca | Multi-select modal | Todas |
| Modelo | Multi-select modal | Todas |
| Motor | Multi-select modal | Todas |
| Tracción | Multi-select modal | Camiones |
| Ejes traseros | Multi-select modal | Camiones |
| Año (rango) | Min/Max numérico | Todas |
| Precio (rango) | Min/Max numérico | Todas |
| Horas (rango) | Min/Max numérico | Maquinaria |
| Millas (rango) | Min/Max numérico | Camiones |
| Capacidad (rango) | Min/Max numérico | Camiones/bombas |
| Transmisión | Select | Camiones |
| Tipo de pluma | Checkbox | Bombas de concreto |
| Marca de pluma | Multi-select modal | Bombas/grúas |
| Cabina cerrada | Toggle | Retroexcavadoras |
| Kit martillo | Toggle | Retroexcavadoras |
| Extensión de pluma | Toggle | Retroexcavadoras |
| Cucharón 4 en 1 | Toggle | Retroexcavadoras |
| Ripper | Toggle | Motoconformadoras |

### 9.5 Ordenamiento
- Más recientes (por timestamp)
- Precio: menor a mayor
- Precio: mayor a menor
- Año: más nuevo primero

### 9.6 Tarjeta de Maquinaria (MachineCard)
- Carousel de imágenes con navegación manual y contador.
- Badge de fuente (página) en esquina superior izquierda.
- Precio formateado en USD (o "Consultar precio").
- Grid de datos: Precio Venta | Año / Uso (horas + millas apilados) | Ubicación.
- **Tags de características**: 4x4, Cabina, Martillo, Extensión, Almeja, Ripper, tipo de pluma, tracción, ejes, subtipo compactadora.
- **Fila de specs técnicos** (varía por categoría):
  - Trucks/Grúas/Bombas: `Motor | Capacidad* | Transmisión`
  - Elevadores: `Alcance | Subtipo | Combustible`
  - Maquinaria amarilla: sin fila de specs (tags son suficientes)
  - *La celda central es la más relevante por categoría y se muestra en naranja: Peso Eje para tractocamiones, Capacidad para el resto de trucks, Subtipo para elevadores.
- Botón de teléfono/WhatsApp al vendedor.
- Botón "Ver Detalles" → publicación original.
- Menú ⋮ (3 puntos) → **Enviar a ERP** / **Re-enviar al ERP**.

### 9.7 Envío al ERP
- Desde el menú ⋮ de cualquier tarjeta → **Enviar a ERP**.
- Llama al API Route `POST /api/erp` con todos los datos de la máquina.
- Antes de insertar, consulta Frappe para evitar duplicados (por `nombre LIKE '%[firestoreId]'`).
- Si ya existe en Frappe (aunque Firebase diga que no), muestra el ID existente.
- Si fue eliminado del ERP, el check no lo encuentra y permite re-insertar.
- Al éxito, actualiza el documento en Firebase (`estado_sourcing: "enviado_erp"`, `id_erp`, `enviado_por`, `fecha_envio_erp`).
- El botón pasa a mostrar "Re-enviar al ERP" (permite reenvío manual si fuera necesario).

### 9.8 Paginación
- 24 máquinas por página (constante `ITEMS_PER_PAGE`).
- Paginación inteligente con elipsis (p. ej. `1 … 4 5 6 … 20`).
- Scroll automático al inicio al cambiar de página.

### 9.9 Portafolio (`/portafolio`)
- Vista independiente accesible desde el navbar del dashboard principal.
- Lee la colección `portafolio` de Firestore (constante `PORTAFOLIO_COLLECTION`).
- Los documentos de portafolio tienen estructura tipo ERP; la función `normalizePortafolioDoc()` los convierte al formato `Machine` que consume `MachineCard`.
- Reutiliza el componente `MachineCard` sin modificaciones.
- Filtros disponibles: búsqueda por texto, filtro de categoría (dinámico según los datos), ordenamiento.
- Campos exclusivos del portafolio: `score_oportunidad` (LOW/MEDIUM/HIGH), `margen_bruto_estimado`, `aprobado`, `procesado`.
- Los documentos son generados por una automatización de curación externa (aún en desarrollo); la colección puede estar vacía hasta que esa automatización esté activa.

---

## 10. Integración ERP — Mapeo de Campos

### `POST /api/erp` → Frappe `MH Equipo`

#### Lógica de derivación

| Variable | Cálculo |
|---|---|
| `esCamion` | Categoría ∈ {Sleeper, Day cab, Camiones Volteo/Trompo/Pipa, Grúas Titanes/Articuladas, Bombas} |
| `esBomba` | Categoría = "Bombas" |
| `esSubasta` | `machine.es_subasta === true` |
| `marca` | `marca` → `marca_pluma` → (Bombas: extraída del título) → `marca_camion` |
| `territorio` | Última parte de "Ciudad, Estado" tras la coma |
| `ciudad` | Primera parte de "Ciudad, Estado" antes de la coma |
| `categoriaERP` | `CATEGORIA_MAP[categoria_tarea]`; Elevadores usan `subtipo_elevador` para categoría específica |
| `usoHoras` | `uso_horas` \|\| `uso` \|\| `uso_motor` |
| `usoMillas` | `uso_millas` |
| `usoBomba` | `uso_bomba` |
| `condicionFields` | Si millas > 0 → `{condicion_camion: millas, condicion_um: 'Mi'}` · Si horas > 0 → `{..., condicion_um: 'Hr'}` · Si sólo bomba → horas bomba con 'Hr' |
| `alcanceValor/Uom` | Bombas: parseo de `capacidad` ("37 Meters"→37/Metros, "47 ft"→47/Pies) · Otros: campo `alcance` en Pies |
| `capacidadValor` | Bombas: vacío (alcance va en custom_alcance) · Otros: valor de `capacidad` |
| `capacidadUom` | Trompo/Volteo → Yardas · Pipa → Galones · Grúas → Toneladas · Bombas → vacío |

#### Payload completo

| Campo Frappe | Valor | Notas |
|---|---|---|
| `nombre` | `"${titulo} [${firestoreId}]"` | Garantiza unicidad; permite búsqueda por ID |
| `status` | `Subasta` \| `Proveedor` | Según `es_subasta` |
| `custom_categoria_equipo` | Ver mapa de categorías | Obligatorio |
| `custom_enlace` | `url` | URL de la publicación |
| `custom_ano_equipo` | `String(año)` | Solo si año > 0; Select en Frappe → string |
| `numero_de_serie` | `''` | No capturado por scraper |
| `custom_marca` | `marca` (derivado) | |
| `custom_modelo_equipo` | `modelo` \|\| (Bombas: extraído del título) | |
| `custom_capacidad` | `capacidadValor` | Vacío para Bombas |
| `capacidad_uom` | `capacidadUom` | Galones/Yardas/Toneladas/Libras |
| `custom_alcance` | `alcanceValor` | Numérico sin unidad |
| `alcance_uom` | `alcanceUom` | Metros/Pies |
| `custom_territory` | `territorio` | Estado/provincia (Link field Frappe) |
| `ciudad` | `ciudad` | Campo libre |
| `custom_informacion_adicional_equipo` | Ubicación completa + uso + enviado por | Texto libre |
| `custom_image` | `imagenes[0]` | Primera imagen |
| `datos_contacto` | `Origen: pagina\nTel: telefono` | Campo libre |
| `ano_camion` | `String(año)` si `esCamion && año > 0` | |
| `motor_camion` | `motor` si `esCamion` | |
| `marca_camion` | `marca_camion` si `esCamion` | |
| `modelo_camion` | `modelo` si `esCamion` | |
| `transmision_camion` | `normalizarTransmision(transmision)` si `esCamion` y valor válido | Solo se incluye si resulta en "Manual" o "Automatico" |
| `custom_suspension_camion` | `ejes_traseros` si `esCamion` | Tandem, Single axle, etc. |
| `condicion_camion` + `condicion_um` | `condicionFields` spread | Número (no string) + Hr/Mi; omitido si no hay uso |
| `estimated_costing` | `Number(precio)` | |
| `custom_supplier` | `''` | No capturado |
| `custom_subasta` | `getSubastaSite(pagina)` | Solo si `esSubasta`; mapea a catálogo Frappe |
| `precio_minimo` | `precio` | Solo si `esSubasta` |
| `precio_maximo` | `precio_maximo` \|\| 0 | Solo si `esSubasta` |
| `subasta_inicia` | `subasta_inicia` \|\| `''` | Solo si `esSubasta`; pendiente de scraper |
| `subasta_cierre` | `subasta_cierre` \|\| `''` | Solo si `esSubasta`; pendiente de scraper |

#### Normalización de transmisión

```
EATON, FULLER, SPICER, MACK T, ZF M, MANUAL → "Manual"
ALLISON, AUTO*, VOITH, ZF A              → "Automatico"
Todo lo demás                            → campo omitido (no se envía)
```

#### Mapeo de sitios de subasta

`pagina` se normaliza (lowercase, sin espacios) y se mapea a:
`AuctionTime · Auctionsource · Barnone · Bidspotter · BigIron · CraneMarket · CraneNetwork · CraneTrader · EquipmentFacts · Housby · Ironplanet · JJ Kane · MachineMarket · Proxibid · Purplewave · Ritchie Bros · Otro`

#### Extracción de datos de Bombas desde título

| Formato | Ejemplo | Marca | Modelo | Alcance |
|---|---|---|---|---|
| UsedConcretePumps | `"2007 38M PUTZMEISTER ON A 2007 MACK"` | `PUTZMEISTER` | `38M` | Del campo `capacidad` |
| ConcretePumpDepot | `"2006 Alliance JXR33-4.16"` | `Alliance` | `JXR33-4.16` | Del campo `capacidad` |

---

## 11. Seguridad

### Modelo de permisos

| Actor | Permisos | Mecanismo |
|---|---|---|
| Usuario web (sourcing) | Lectura de `maquinaria_aprobada`; escritura de campos ERP via API Route | Firestore Security Rules (client) + Firebase Admin SDK (server) |
| API Route `/api/erp` | Lectura y escritura de `maquinaria_aprobada` (server-side) | Firebase Admin SDK con Service Account |
| Scraper backend (Python) | Lectura, escritura y eliminación total | Service Account (credenciales privadas) |
| ERP Frappe | Creación y consulta de `MH Equipo` | API Key + Secret (token auth) |

- Las claves de Firebase Client SDK (`NEXT_PUBLIC_*`) son seguras porque las Firestore Security Rules restringen las operaciones permitidas desde el browser.
- El Firebase Admin SDK (`firebase-admin`) corre **solo en el servidor** (Next.js API Route) y usa credenciales de Service Account, nunca expuestas al browser.
- Las credenciales del ERP (`ERP_API_KEY`, `ERP_API_SECRET`) son variables de entorno server-side, nunca expuestas al browser.

---

## 12. Variables de Entorno

Archivo requerido: `.env.local` (no incluido en el repositorio)

```bash
# Firebase Client SDK (expuestas al browser — seguras con Firestore Rules)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (solo servidor — NO NEXT_PUBLIC_)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=           # Private key completa con \n literales

# ERP Frappe (solo servidor — NO NEXT_PUBLIC_)
ERP_API_URL=                          # https://mh.posix.mx/api/resource/MH%20Equipo
ERP_API_KEY=
ERP_API_SECRET=
```

Para despliegue en Vercel, todas las variables deben configurarse en **Settings > Environment Variables**. Las variables `FIREBASE_ADMIN_*` y `ERP_*` deben ser **server-only** (sin el prefijo `NEXT_PUBLIC_`).

---

## 13. Instalación y Desarrollo Local

### Prerrequisitos
- Node.js v18 o superior
- npm
- Acceso al proyecto Firebase (`mh-sourcing`)
- Credenciales de Firebase Admin SDK (Service Account)
- Credenciales de ERP Frappe

### Pasos

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd websourcing-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env.local con todas las variables listadas en la sección 12

# 4. Iniciar servidor de desarrollo
npm run dev
# Disponible en http://localhost:3000
```

### Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo con hot reload
npm run build    # Build de producción
npm run start    # Servidor de producción local
npm run lint     # Análisis estático de código
```

---

## 14. Despliegue

La aplicación está configurada para despliegue en **Vercel**.

1. Conectar el repositorio de GitHub a Vercel.
2. Configurar **todas** las variables de entorno en Vercel Dashboard (tanto las `NEXT_PUBLIC_*` como las server-only).
3. El despliegue se activa automáticamente en cada push a la rama `main`.

**Nota importante:** La variable `FIREBASE_ADMIN_PRIVATE_KEY` contiene saltos de línea. En Vercel, pegarla con los `\n` literales funciona correctamente; el código hace `.replace(/\\n/g, '\n')` al inicializar.

---

## 15. Estado de Avance y Roadmap

### ✅ Completado

| Tarea | Detalles |
|---|---|
| Dashboard de catálogo (sourcing) | Página principal con grilla de categorías, tabs de fuente, filtros y tarjetas |
| Autenticación Firebase | Login email/password; guard en todas las rutas |
| 18 categorías de maquinaria | Incluyendo All Terrain, Tractocamiones unificados y Compactadoras |
| Filtros avanzados modulares | Subcomponentes por categoría en `src/components/filters/`; MultiSelectModal reutilizable |
| Filtros de tractocamiones | Peso eje, tracción, ejes traseros, transmisión; lógica de agrupación Sleeper+Day cab |
| Filtros de elevadores | Subtipo, alcance, combustible |
| Filtros de compactadoras | Subtipo de compactadora |
| Envío al ERP (Frappe) | Botón en MachineCard; mapeo completo de 30+ campos; lógica anti-duplicados |
| Paginación inteligente | Con elipsis; scroll-to-top automático |
| Skeleton loading | En dashboard y portafolio |
| Refactorización de constantes | `categories.tsx`, `locations.ts`, `vehicleSpecs.ts`, `machineCategories.ts`, `appConfig.ts` |
| Página Portafolio (`/portafolio`) | Vista de colección `portafolio` con normalización de docs tipo ERP |

### 🔄 En progreso (rama `refactor`)

| Tarea | Estado | Notas |
|---|---|---|
| Refinamiento de filtros tractocamiones | Cambios pendientes de commit | `src/app/page.tsx`, `src/components/MachineCard.tsx`, `src/constants/appConfig.ts`, `src/types/index.ts` con modificaciones sin commitear |
| Portafolio — automatización de curación | Estructura lista; pendiente de automatización externa | La colección `portafolio` y la UI están listas; falta el proceso que genere los documentos con `score_oportunidad` y `margen_bruto_estimado` |

### ⏳ Pendiente

| Tarea | Notas |
|---|---|
| Merge rama `refactor` → `main` | Cuando se estabilicen los cambios actuales |
| Fechas de subasta en scraper | `subasta_inicia` y `subasta_cierre` ya están en el modelo; falta que el scraper las capture |
| ERP → GoHighLevel CRM | Definir webhook o API de sincronización |
| Página Web MVP → WebSourcing / ERP | Flujo de demanda de cliente → tarea de sourcing |
| WebSourcing → Página Web MVP | Pipeline: ERP (validación) → Web pública (publicación) |
| Portafolio — campos de score y margen | La UI los muestra si existen; la automatización externa debe poblarlos |
| Portafolio — filtros avanzados | Por ahora solo búsqueda, categoría y ordenamiento; pendiente ampliar si el equipo lo requiere |

---

## 16. Equipo y Responsabilidades

| Rol | Responsabilidad |
|---|---|
| Equipo de Sourcing | Uso diario del dashboard para identificar y enviar maquinaria al ERP |
| Desarrollo Frontend | WebSourcing App (este proyecto) + Página Web MVP |
| Desarrollo Backend | Scraper Python, Firebase, ERP |
| Desarrollo CRM | Configuración y automatizaciones de GoHighLevel |

---

## 17. Glosario

| Término | Definición |
|---|---|
| **Sourcing** | Proceso de búsqueda e identificación de maquinaria disponible para compra |
| **Scraper** | Bot automatizado que extrae datos de maquinaria de sitios web externos |
| **maquinaria_aprobada** | Colección de Firestore con registros procesados por el scraper |
| **Agencias** | Dealers o sitios especializados en venta de maquinaria pesada |
| **MVP** | Minimum Viable Product — la página web pública de Machinery Hunters |
| **ERP** | Enterprise Resource Planning — Frappe en `mh.posix.mx` |
| **Frappe** | Framework ERP open-source sobre el que está construido el ERP de MH |
| **MH Equipo** | DocType de Frappe que representa una máquina en el inventario/pipeline |
| **DocType** | Entidad/modelo de datos en Frappe (equivalente a una tabla/colección) |
| **GoHighLevel (GHL)** | CRM utilizado para gestión de clientes, leads y automatizaciones de marketing |
| **Firebase** | Plataforma de Google que provee base de datos (Firestore) y autenticación |
| **Firebase Admin SDK** | SDK server-side de Firebase; permite lectura/escritura sin restricciones de Security Rules |
| **Vercel** | Plataforma de despliegue para aplicaciones Next.js |
| **esCamion** | Flag interno: categorías con chassis de camión (llenan la sección "Detalles del camión" en el ERP) |
| **esSubasta** | Flag interno: `es_subasta === true`; activa campos de subasta en el payload ERP |
| **uso_horas** | Horas acumuladas de operación de una máquina |
| **uso_millas** | Millas recorridas (para camiones y grúas sobre camión) |
| **uso_bomba** | Horas de operación de la bomba (bombas de concreto) |
| **condicion_camion** | Campo Frappe para el uso del equipo (número); su unidad va en `condicion_um` |
| **Call For Price** | Precio no listado; el comprador debe contactar al vendedor |
| **Link field** | Tipo de campo en Frappe que valida contra un catálogo registrado (rechaza valores libres) |
| **Select field** | Tipo de campo en Frappe con lista fija de opciones válidas |

---

---

## 18. Colecciones Firestore

| Colección | Escritura | Lectura | Descripción |
|---|---|---|---|
| `maquinaria_aprobada` | Scraper Python (service account) + API Route /api/erp | WebSourcing App (client SDK) | Maquinaria scrapeada y procesada; fuente principal del dashboard |
| `portafolio` | Automatización de curación (externa) | WebSourcing App (client SDK) | Equipos curados con score de oportunidad y margen estimado |

---

*Última actualización: Junio 2026. Rama activa: `refactor`. Mantener actualizado conforme evolucionen las integraciones entre plataformas.*
