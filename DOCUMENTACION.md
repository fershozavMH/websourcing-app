# WebSourcing App — Documentación del Proyecto

**Machinery Hunters | Plataforma de Inteligencia de Adquisición de Maquinaria**
**Versión actual:** MVP (en producción)
**Última actualización:** Mayo 2025

---

## 1. Contexto General del Ecosistema

WebSourcing forma parte de un ecosistema tecnológico más amplio que Machinery Hunters está desarrollando de forma paralela. El objetivo global es **digitalizar y automatizar el proceso completo de adquisición y venta de maquinaria pesada usada**, reduciendo los tiempos de búsqueda, mejorando la trazabilidad de clientes y optimizando la gestión financiera.

### Ecosistema de plataformas interconectadas

```
┌─────────────────────────────────────────────────────────────────┐
│                   ECOSISTEMA MACHINERY HUNTERS                  │
├───────────────────┬────────────────────┬────────────────────────┤
│   Página Web MVP  │   WebSourcing App  │         ERP            │
│   (En producción) │   (En producción)  │   (En desarrollo)      │
│                   │                    │                        │
│ Vitrina pública   │ Dashboard interno  │ Control financiero     │
│ de maquinaria     │ del equipo de      │ y de clientes          │
│                   │ sourcing           │                        │
│ Formularios de    │ Catálogo de        │ Alta de maquinaria     │
│ contacto y leads  │ maquinaria         │ validada               │
│                   │ encontrada por     │                        │
│        │          │ scrapers           │        │               │
│        ▼          │        │           │        ▼               │
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
| **ERP** | En desarrollo | Gestión financiera, alta de maquinas validadas, integración con CRM |
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

---

## 3. Objetivo

Proporcionar al equipo de sourcing de Machinery Hunters una herramienta interna que:

1. **Consolide** en tiempo real toda la maquinaria pesada disponible en el mercado norteamericano (EE.UU., Canadá, México).
2. **Filtre y clasifique** el inventario por categoría, marca, modelo, precio, ubicación, año y especificaciones técnicas.
3. **Facilite el contacto** directo con vendedores via WhatsApp o teléfono.
4. **Sirva como punto de entrada** para el flujo de validación humana que culmina en el alta de maquinaria en el ERP.

---

## 4. Alcance

### Dentro del alcance

- Dashboard de consulta para uso **interno** del equipo de sourcing.
- Visualización de maquinaria pesada en **14 categorías**.
- Filtrado avanzado por más de **20 criterios** (marca, modelo, país, estado, precio, año, horas, millas, transmisión, tracción, ejes, tipo de pluma, etc.).
- Acceso a fuentes de datos: **Agencias (dealers)** y **Facebook Marketplace**.
- Soporte para maquinaria en **EE.UU., Canadá y México**.
- Autenticación con email y contraseña (Firebase Auth).
- Acceso directo a la publicación original del vendedor.
- Integración con WhatsApp para contacto inmediato.

### Fuera del alcance (actual)

- Publicación pública de maquinaria (eso es responsabilidad de la Página Web MVP).
- Gestión financiera o de clientes (eso es responsabilidad del ERP).
- Alta manual de maquinaria por parte del usuario (el scraper alimenta la base de datos automáticamente).
- Funcionalidad de escritura/edición de registros desde el frontend.

---

## 5. Arquitectura

### Flujo de datos

```
Fuentes externas                Backend               Frontend
─────────────────          ──────────────────     ──────────────────
Sitios de dealers    ──►                          
                          Scraper Python    ──►   WebSourcing App
Facebook Marketplace ──►  (repo separado)         (este proyecto)
                               │                       │
                               ▼                       │ lectura
                          Firebase Firestore ◄─────────┘
                          (maquinaria_aprobada)
```

### Componentes principales

| Componente | Tecnología | Descripción |
|---|---|---|
| Frontend | Next.js 15 + React 19 | Dashboard web responsive |
| Estilos | Tailwind CSS v4 | UI system + diseño responsivo |
| Base de datos | Firebase Firestore | Colección `maquinaria_aprobada` (solo lectura desde frontend) |
| Autenticación | Firebase Auth | Email/password |
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
  "carousel": "Swiper 12.1.3",
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
│   │   ├── layout.tsx          # Layout raíz, metadata, imports Swiper CSS
│   │   ├── page.tsx            # Dashboard principal y catálogo
│   │   ├── globals.css         # Estilos globales (Tailwind + Swiper)
│   │   └── login/
│   │       └── page.tsx        # Página de autenticación
│   ├── components/
│   │   ├── MachineCard.tsx     # Tarjeta de maquinaria individual
│   │   └── Filters.tsx         # Sidebar de filtros con modales
│   ├── hooks/
│   │   ├── useMachines.ts      # Consultas a Firebase Firestore
│   │   └── useMachineFilters.ts # Lógica de filtrado y ordenamiento
│   ├── lib/
│   │   └── firebase.ts         # Inicialización de Firebase
│   ├── types/
│   │   └── index.ts            # Interfaces TypeScript (Machine, SortOption)
│   └── constants/
│       └── categories.tsx      # Definición de las 14 categorías
├── public/
│   └── iconos/                 # Íconos de categorías (.webp/.png)
├── .env.local                  # Variables de entorno Firebase (no en git)
├── package.json
├── tsconfig.json
├── next.config.ts
└── DOCUMENTACION.md            # Este archivo
```

---

## 8. Modelo de Datos

### Colección Firestore: `maquinaria_aprobada`

Solo se almacena maquinaria que ha sido aprobada/procesada por el scraper. El equipo de sourcing humano valida y da de alta las máquinas encontradas en el ERP (proceso separado).

```typescript
interface Machine {
  // Identificación
  id: string
  titulo: string
  categoria_tarea: string       // Categoría (ej. "Excavadoras")
  origen_tarea: string          // Marca/fuente de la tarea
  pagina: string                // "Facebook Marketplace" | nombre del dealer
  url: string                   // Link a la publicación original

  // Media
  imagenes: string[]            // URLs de imágenes

  // Datos comerciales
  precio: number                // 0 = "Llamar para precio"
  año: number
  ubicacion: string             // Ciudad, Estado, País
  telefono_vendedor: string

  // Uso/desgaste (campos flexibles según tipo de equipo)
  uso_horas?: number            // Horas de uso (maquinaria)
  uso_millas?: number           // Millas recorridas (camiones)
  uso_bomba?: number            // Uso bomba (bombas de concreto)
  uso_motor?: number            // Uso motor adicional

  // Especificaciones técnicas
  motor?: string                // Descripción del motor
  transmision?: string          // "Manual" | "Automática"
  capacidad?: string            // Capacidad de carga (toneladas/yardas)
  modelo?: string               // Modelo del equipo
  traccion_camion?: string      // "4X2" | "4X4" | "6X4" | etc.
  ejes_traseros?: string        // Configuración de ejes traseros
  tipo_pluma?: string           // Tipo de pluma (Z, R/F para bombas)
  marca_pluma?: string          // Marca de la pluma/accesorio
  marca_camion?: string         // Marca del camión (si aplica)

  // Flags de equipamiento
  tiene_cabina?: boolean        // Cabina cerrada
  tiene_martillo?: boolean      // Kit martillo (retroexcavadoras)
  tiene_extension?: boolean     // Pluma extendida
  es_4x4?: boolean              // Tracción 4x4
  tiene_almeja?: boolean        // Cucharón 4 en 1
  tiene_ripper?: boolean        // Ripper/escarificador (motoconformadoras)
  es_subasta?: boolean          // Está en subasta

  // Metadata
  timestamp?: Timestamp         // Fecha/hora de creación en Firestore
}
```

### Categorías soportadas (14)

| ID | Nombre | Descripción |
|---|---|---|
| excavadoras | Excavadoras | Excavadoras de cadena y ruedas |
| retroexcavadoras | Retroexcavadoras | Backhoes |
| topadores | Topadores | Bulldozers |
| cargadores | Cargadores | Cargadores frontales de ruedas |
| motoconformadoras | Motoconformadoras | Graders/niveladoras |
| volteo | Camiones Volteo | Dump trucks |
| trompo | Camiones Trompo | Revolvedoras/mixers de concreto |
| pipa | Camiones Pipa | Tanqueros |
| tractocamiones | Tractocamiones | Semirremolques/tractores |
| gruas_titan | Grúas Titanes | Grúas de gran tonelaje |
| gruas_articuladas | Grúas Articuladas | Grúas articuladas/telescópicas |
| bombas | Bombas de Concreto | Bombas estacionarias y sobre camión |
| elevadores | Elevadores | Montacargas/forklifts |
| rough_terrain | Rough & All Terrain | Grúas todo terreno |

---

## 9. Funcionalidades Principales

### 9.1 Autenticación
- Login con email y contraseña via Firebase Auth.
- Todas las rutas requieren sesión activa (redirección automática a `/login`).
- Logout desde el navbar.

### 9.2 Navegación por Categorías
- Pantalla de inicio con las 14 categorías en grid visual.
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
- Precio formateado en USD (o "Llamar para precio").
- Año, horas/millas de uso, ubicación.
- Tags de características (4x4, cabina, ripper, tipo pluma, tracción, etc.).
- Box de especificaciones técnicas (motor, capacidad/ejes, transmisión).
- Botón de WhatsApp/llamada directa al vendedor.
- Link "Ver detalles" a la publicación original.

### 9.7 Paginación
- 24 máquinas por página.
- Navegación Anterior/Siguiente.
- Scroll automático al inicio al cambiar de página.

---

## 10. Seguridad

### Modelo de permisos
| Actor | Permisos | Mecanismo |
|---|---|---|
| Usuario web (sourcing) | Solo lectura en `maquinaria_aprobada` | Firestore Security Rules |
| Scraper backend (Python) | Lectura, escritura y eliminación total | Service Account (credenciales privadas) |

- Las claves de Firebase en el frontend son `NEXT_PUBLIC_*` (expuestas al browser) pero las reglas de Firestore garantizan que solo se pueda leer.
- No hay operaciones de escritura, actualización ni eliminación desde el frontend.
- El servicio de autenticación controla el acceso a la interfaz.

---

## 11. Variables de Entorno

Archivo requerido: `.env.local` (no incluido en el repositorio)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Para despliegue en Vercel, estas variables deben configurarse en el panel de Vercel bajo **Settings > Environment Variables**.

---

## 12. Instalación y Desarrollo Local

### Prerrequisitos
- Node.js v18 o superior
- npm o yarn
- Acceso al proyecto Firebase (`mh-sourcing`)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd websourcing-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env.local con las variables de Firebase

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

## 13. Despliegue

La aplicación está configurada para despliegue en **Vercel**.

1. Conectar el repositorio de GitHub a Vercel.
2. Configurar las variables de entorno en Vercel Dashboard.
3. El despliegue se activa automáticamente en cada push a la rama `main`.

---

## 14. Integraciones Planificadas (Roadmap)

A medida que el ecosistema madura, se contemplan las siguientes integraciones entre plataformas:

### WebSourcing → ERP
- Cuando el equipo de sourcing identifica una máquina de interés en WebSourcing App, el flujo de validación y alta debería poder iniciarse desde la misma plataforma.
- **Pendiente:** Implementar botón/acción "Enviar al ERP" que pre-llene el formulario de alta de maquinaria en el ERP con los datos del registro de Firestore.

### ERP → GoHighLevel CRM
- Las máquinas validadas y dadas de alta en el ERP deben sincronizarse con el CRM para que el equipo de ventas pueda hacer seguimiento.
- **Pendiente:** Definir webhook o API de sincronización ERP ↔ GoHighLevel.

### Página Web MVP → WebSourcing / ERP
- Los leads captados en la web pública (via GoHighLevel) podrían enriquecer el proceso de sourcing (demanda de clientes guía la búsqueda de maquinaria específica).
- **Pendiente:** Flujo de "demanda de cliente" que llegue al equipo de sourcing como tarea de búsqueda.

### WebSourcing → Página Web MVP
- Las máquinas validadas por sourcing y aprobadas para venta podrían publicarse automáticamente en la página pública.
- **Pendiente:** Pipeline de publicación automática: ERP (validación) → Página Web (publicación).

---

## 15. Equipo y Responsabilidades

| Rol | Responsabilidad |
|---|---|
| Equipo de Sourcing | Uso diario del dashboard para identificar maquinaria |
| Desarrollo Frontend | WebSourcing App (este proyecto) + Página Web MVP |
| Desarrollo Backend | Scraper Python, Firebase, ERP |
| Desarrollo CRM | Configuración y automatizaciones de GoHighLevel |

---

## 16. Glosario

| Término | Definición |
|---|---|
| **Sourcing** | Proceso de búsqueda e identificación de maquinaria disponible para compra |
| **Scraper** | Bot automatizado que extrae datos de maquinaria de sitios web externos |
| **maquinaria_aprobada** | Colección de Firestore con registros procesados por el scraper |
| **Agencias** | Dealers o sitios especializados en venta de maquinaria pesada |
| **MVP** | Minimum Viable Product — la página web pública de Machinery Hunters |
| **ERP** | Enterprise Resource Planning — sistema de gestión interna en desarrollo |
| **GoHighLevel (GHL)** | CRM utilizado para gestión de clientes, leads y automatizaciones de marketing |
| **Firebase** | Plataforma de Google que provee base de datos (Firestore) y autenticación |
| **Vercel** | Plataforma de despliegue para aplicaciones Next.js |
| **uso_horas** | Horas acumuladas de operación de una máquina |
| **uso_millas** | Millas recorridas (para camiones) |
| **Call For Price** | Precio no listado; el comprador debe contactar al vendedor |

---

*Documento generado en Mayo 2025. Mantener actualizado conforme evolucionen las integraciones entre plataformas.*
