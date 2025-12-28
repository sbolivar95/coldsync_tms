# ColdSync - Guías del Proyecto

Esta documentación centraliza las guías de desarrollo, diseño y convenciones del proyecto ColdSync.

---

## 📋 Tabla de Contenidos

1. [General](#general)
2. [Sistema de Diseño](#sistema-de-diseño)
3. [Navegación y Breadcrumbs](#navegación-y-breadcrumbs)
4. [Componentes Documentados](#componentes-documentados)

---

# General

## Descripción del Proyecto

**ColdSync** es una plataforma de gestión de cadena de frío con:

- Color primario: `#004ef0`
- Sidebar oscuro lateral + Header superior
- 10 secciones principales (7 en sidebar + 3 inferior)
- Navegación profunda con breadcrumbs
- Navegación anidada cross-sección
- Sistema de componentes reutilizables

## Principios de Desarrollo

- **Reutilización**: Usar componentes estandarizados (`DataTable`, `SmartSelect`, `FormField`)
- **Consistencia**: Mantener design system en toda la app (colores, espaciado, tipografía)
- **DRY**: Evitar duplicación de código
- **Documentación**: Componentes complejos deben tener README junto al código
- **Tailwind v4 Puro**: Utility-first, sin estilos base en CSS, configuración en `@theme`

## Estructura del Proyecto

```
/components/
├── common/              # Componentes reutilizables
├── DataTable/           # Sistema de tablas (ver README)
├── fleet/               # Componentes Fleet (solo anidado dentro de transportistas)
├── transportistas/      # Sección Transportistas
├── ubicaciones/         # Sección Ubicaciones
├── torre-control/       # Sección Torre de Control
└── ui/                  # Componentes shadcn/ui

/data/
└── mockData.ts          # Datos mock centralizados

App.tsx                  # Componente raíz (orquestador)
```

---

# Arquitectura de la Aplicación

## Patrón de Layout Único

ColdSync usa un **layout único compartido** en toda la aplicación:

```tsx
App.tsx (componente principal)
├── <Sidebar />          ← UN SOLO SIDEBAR (siempre visible)
│   └── Maneja navegación entre secciones
│
└── <div> (área de contenido)
    ├── <Header />       ← UN SOLO HEADER (dinámico)
    │   └── Cambia título, breadcrumbs y acciones según sección
    │
    └── <main>
        └── renderView() ← Contenido dinámico
            ├── Dashboard
            ├── Despacho
            ├── Torre de Control
            ├── Transportistas (con Fleet anidado)
            ├── Ubicaciones
            ├── etc...
```

### ⚠️ IMPORTANTE: Componentes Únicos Globales

**NO crear nuevos Sidebar o Header por sección:**

- ✅ **UN SOLO** `/components/Sidebar.tsx` para toda la app
- ✅ **UN SOLO** `/components/Header.tsx` para toda la app
- ✅ Estos componentes son **configurables** mediante props
- ❌ **NO duplicar** estos componentes en carpetas de secciones
- ❌ **NO crear** un sidebar dentro de cada vista

### Flujo de Navegación

1. Usuario hace click en el Sidebar
2. `App.tsx` actualiza `activeView`
3. `renderView()` muestra el componente correspondiente
4. El Header se actualiza automáticamente con la configuración de esa vista

**Ventajas:**

- 🔄 Sin duplicación de código
- 🎯 Estado centralizado
- ⚡ Mejor performance
- 🎨 Consistencia visual garantizada

---

# Sidebar - Configuración Global

## Ubicación

**Archivo:** `/components/Sidebar.tsx`

## Características

- **Color de fondo:** `#1a1d2e` (oscuro)
- **Color primario:** `#004ef0` (indicador activo)
- **Ancho colapsado:** 16px (64px)
- **Ancho expandido:** 264px
- **Logo:** ColdSync con icono Snowflake
- **Estados:** Hover, activo, colapsado

## Secciones del Menú

### Navegación Principal (7 items)

```tsx
const menuItems = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  { id: "dispatch", icon: Package2, label: "Despacho" },
  {
    id: "control-tower",
    icon: Radio,
    label: "Torre de Control",
  },
  { id: "financials", icon: DollarSign, label: "Conciliación" },
  { id: "carriers", icon: Truck, label: "Transportistas" },
  { id: "locations", icon: MapPin, label: "Ubicaciones" },
  { id: "routes", icon: Map, label: "Rutas" },
];
```

### Navegación Inferior (3 items)

```tsx
const bottomMenuItems = [
  { id: "alerts", icon: AlertTriangle, label: "Alertas" },
  { id: "settings", icon: Settings, label: "Settings" },
  {
    id: "profile",
    icon: UserCircle,
    label: "Perfil de Usuario",
  },
];
```

### ⚠️ IMPORTANTE: Fleet ya NO está en el Sidebar

**Fleet** fue removido del sidebar y ahora es **solo accesible vía navegación anidada** desde Transportistas. Ver sección [Navegación Anidada Cross-Sección](#navegación-anidada-cross-sección).

## Cómo Agregar una Nueva Sección

**1. Agregar item al Sidebar** (`/components/Sidebar.tsx`):

```tsx
const menuItems = [
  // ... items existentes
  {
    id: "nueva-seccion",
    icon: IconName,
    label: "Nueva Sección",
  },
];
```

**2. Crear componente de la vista** (`/components/NuevaSeccion.tsx`):

```tsx
export function NuevaSeccion() {
  return <div className="p-6">{/* Contenido */}</div>;
}
```

**3. Registrar en App.tsx**:

```tsx
// Importar
import { NuevaSeccion } from "./components/NuevaSeccion";

// Agregar configuración
const viewConfigs: Record<string, ViewConfig> = {
  // ... otras vistas
  "nueva-seccion": {
    title: "Nueva Sección",
    component: NuevaSeccion,
    createLabel: "Crear Nuevo", // Opcional
  },
};
```

## Modificar Sidebar

⚠️ **CUIDADO:** Al modificar `/components/Sidebar.tsx`, los cambios afectan **TODA la aplicación**.

**Cambios comunes:**

- Agregar/quitar items del menú
- Cambiar iconos
- Modificar estilos del item activo
- Ajustar comportamiento de colapso

---

# Header - Configuración Global

## Ubicación

**Archivo:** `/components/Header.tsx`

## Características

- **Altura fija:** `h-16` (64px) - no depende de padding vertical
- **Tipografía:** `text-base font-medium` para títulos y breadcrumbs
- **Color de fondo:** `bg-white`
- **Border inferior:** `border-b border-gray-200`
- **Padding horizontal:** `px-6`
- **Alineación vertical:** `flex items-center` (centrado automático)

## Especificaciones de Estilo

### Título Principal (sin breadcrumbs)

```tsx
<h1 className="text-base font-medium text-gray-900">{title}</h1>
```

### Título Clickeable (con breadcrumbs)

```tsx
<button className="text-base font-medium text-gray-500 hover:text-gray-900 hover:underline">
  {title}
</button>
```

### Breadcrumbs - Nivel Actual (último)

```tsx
<span className="text-base font-medium text-gray-900">
  {crumb.label}
</span>
```

### Breadcrumbs - Niveles Anteriores (clickeables)

```tsx
<button className="text-base font-medium text-gray-500 hover:text-gray-900 hover:underline">
  {crumb.label}
</button>
```

### Separador de Breadcrumbs

```tsx
<span className="text-gray-400">›</span>
```

## Modificar Header

⚠️ **CUIDADO:** Al modificar `/components/Header.tsx`, los cambios afectan **TODAS las secciones** de la aplicación.

**Cambios comunes:**

- Ajustar altura (`h-16` → `h-20`)
- Modificar tipografía de títulos
- Cambiar estilos de breadcrumbs
- Personalizar acciones del lado derecho

**Ejemplo de cambio global:**

```tsx
// Cambiar font-weight de todos los títulos
<h1 className="text-base font-semibold text-gray-900">
  {title}
</h1>
// ↑ Este cambio se aplica automáticamente en:
// Dashboard, Transportistas, Ubicaciones, Rutas, etc.
```

---

# Tailwind v4 - Configuración

## Filosofía Tailwind v4

Este proyecto usa **Tailwind v4** con enfoque **CSS-first**:

- ❌ **NO** se usa `tailwind.config.js`
- ❌ **NO** hay estilos base para elementos HTML (h1, h2, p, etc.)
- ✅ **SÍ** configuración con `@theme` en `/styles/globals.css`
- ✅ **SÍ** variables CSS nativas accesibles en el navegador
- ✅ **SÍ** clases utility aplicadas explícitamente en cada elemento

## Estructura globals.css

```css
@import "tailwindcss"; /* Importa Tailwind v4 */

:root {
  /* Variables de diseño */
  --primary: #004ef0;
  --input-background: #f3f3f5;
}

@theme inline {
  /* Mapeo a utilidades Tailwind */
  --color-primary: var(--primary);
  --color-input-background: var(--input-background);
}

@layer base {
  /* Solo reset mínimo */
  body {
    @apply bg-background text-foreground;
  }
}
```

**Uso en componentes:**

```tsx
// ❌ INCORRECTO (no hay estilos base)
<h1>Título</h1>

// ✅ CORRECTO (clases explícitas)
<h1 className="text-2xl font-medium">Título</h1>
```

---

# Sistema de Diseño

## Paleta de Colores

```css
--primary: #004ef0
  /* Azul principal - botones, links, underlines */
  --primary-focus: #003bc4 /* Hover/Active states */
  --primary-light: #e5edff /* Backgrounds suaves */
  --input-background: #f3f3f5 /* Background de inputs */
  --destructive: #d4183d /* Errores y alertas */;
```

## Tipografía (Tailwind v4 Utility-First)

⚠️ **IMPORTANTE**: Este proyecto usa **Tailwind v4 puro**. SIEMPRE debes aplicar clases de tipografía explícitamente:

| Elemento | Clases Requeridas       | Uso                 |
| -------- | ----------------------- | ------------------- |
| H1       | `text-2xl font-medium`  | Títulos principales |
| H2       | `text-xl font-medium`   | Títulos de sección  |
| H3       | `text-lg font-medium`   | Subtítulos          |
| Body     | `text-sm`               | Texto general       |
| Label    | `text-xs text-gray-600` | Labels de campos    |
| Button   | `text-sm font-medium`   | Texto de botones    |

**Filosofía Tailwind v4:**

- ✅ NO hay estilos base en CSS para elementos HTML
- ✅ SIEMPRE aplicar clases utility directamente en JSX
- ✅ Usar componentes reutilizables para evitar repetición
- ✅ Configuración en `/styles/globals.css` con `@theme` (no `tailwind.config.js`)

## Espaciado

```tsx
// Entre campos de formulario
space-y-4  // 16px

// Entre label e input
space-y-1.5  // 6px

// Entre secciones (Cards)
space-y-6  // 24px

// Padding de Cards
p-6  // 24px

// Grid gaps
gap-x-8 gap-y-6  // 32px horizontal, 24px vertical
```

---

# Formularios

## Input Fields

**Especificaciones:**

- Altura: `h-9` (36px)
- Padding: `px-3`
- Background: `bg-input-background` (#f3f3f5)
- Border radius: `rounded-md`
- Focus: Ring azul automático

```tsx
// Normal
<Input placeholder="Ingrese valor..." />

// Disabled
<Input disabled className="bg-gray-50 text-gray-500" />

// Campo crítico (emergencias)
<Input className="border-orange-200 focus:border-orange-400" />
```

## Labels

```tsx
<Label htmlFor="field-id" className="text-xs text-gray-600">
  Nombre del Campo <span className="text-red-500">*</span>
</Label>
```

- Tamaño: `text-xs` (12px)
- Color: `text-gray-600`
- Requeridos: Asterisco rojo

## Botones

```tsx
// Primario
<button
  className="px-5 py-2.5 text-sm text-white rounded-md hover:opacity-90"
  style={{ backgroundColor: '#004ef0' }}
>
  Guardar
</button>

// Secundario
<button className="px-5 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md">
  Cancelar
</button>
```

## Layout de Formularios

**2 columnas en desktop:**

```tsx
<Card className="p-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
    <div>{/* Columna Izquierda */}</div>
    <div>{/* Columna Derecha */}</div>
  </div>
</Card>
```

**Grid para campos cortos:**

```tsx
<div className="grid grid-cols-2 gap-3">
  <InputField label="Teléfono" />
  <InputField label="Email" />
</div>
```

---

# Tablas

## Uso del DataTable

Para tablas complejas con paginación, multiselección y acciones, usar el componente `DataTable`.

📚 **Ver documentación completa:** `/components/DataTable/README.md`

**Ejemplo básico:**

```tsx
import { DataTable } from "@/components/DataTable";

const columns = [
  {
    key: "name",
    header: "Nombre",
    render: (item) => <span>{item.name}</span>,
  },
  {
    key: "status",
    header: "Estado",
    align: "center",
    render: (item) => <Badge>{item.status}</Badge>,
  },
];

<DataTable
  data={data}
  columns={columns}
  getRowId={(item) => item.id}
  itemsPerPage={10}
/>;
```

## Estándares de Tablas

**Headers:**

- Background: `bg-gray-50` o `style={{ backgroundColor: '#eff5fd' }}`
- Texto: `text-xs text-gray-500 uppercase tracking-wider`
- Padding: `px-4 py-2.5`

**Celdas:**

- Texto: `text-xs text-gray-900`
- Padding: `px-4 py-3`
- Border: `border-b border-gray-100`
- Hover: `hover:bg-gray-50 transition-colors`

**Acciones por fila:**

- Botones: `h-7 w-7 p-0`
- Iconos: `w-3.5 h-3.5`
- Gap: `gap-1`
- Alineación: `justify-end`

## Badges de Estado

| Estado          | Clase                           |
| --------------- | ------------------------------- |
| Activo/Completo | `bg-green-100 text-green-700`   |
| Pendiente       | `bg-yellow-100 text-yellow-700` |
| Error/Inactivo  | `bg-red-100 text-red-700`       |
| En Proceso      | `bg-blue-100 text-blue-700`     |
| Neutral         | `bg-gray-100 text-gray-700`     |

## Paginación

**Especificaciones:**

- Altura botones: `h-7`
- Botones números: `w-7 p-0 text-xs`
- Gap: `gap-1.5`
- Color activo: `#004ef0`

**Container:**

```tsx
<div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
  <div className="text-sm text-gray-700">
    Mostrando 1 a 10 de 50 registros
  </div>
  {/* Botones de paginación */}
</div>
```

---

# Navegación y Breadcrumbs

## Sistema de Breadcrumbs (v2.1)

El componente `Header.tsx` maneja los breadcrumbs con navegación tipo tabs.

**Características:**

- ✅ Nivel actual: negro, no clickeable
- ✅ Niveles anteriores: gris, clickeables
- ✅ Separador: `›`
- ✅ Título clickeable cuando hay breadcrumbs

**Interfaz:**

```tsx
interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface HeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  onTitleClick?: () => void;
}
```

## Tipos de Navegación

### Navegación Simple (Tipo A)

**Sin breadcrumbs, sin navegación profunda**

**Secciones:**

- Dashboard
- Alertas
- Settings (con tabs)
- Perfil

**Características:**

- No hay breadcrumbs
- Todo el contenido se muestra en una sola vista
- Pueden tener tabs para organizar contenido

---

### Navegación con Detalle (Tipo B)

**Lista → Detalle con breadcrumbs simples**

**Secciones:**

- Despacho
- Conciliación

**Patrón:**

```
Lista → Detalle
Transportistas → ColdChain Express
```

**Implementación:**

```tsx
// Wrapper Component
export function SeccionWrapper({ onBreadcrumbChange }) {
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setView("detail");
    onBreadcrumbChange?.([{ label: item.name }]);
  };

  const handleBack = () => {
    setView("list");
    onBreadcrumbChange?.([]);
  };

  if (view === "detail") {
    return (
      <ItemDetail item={selectedItem} onBack={handleBack} />
    );
  }

  return <ItemList onSelectItem={handleSelectItem} />;
}
```

---

### Navegación Multi-Nivel (Tipo C)

**Lista → Detalle → Sub-secciones con tabs**

**Secciones:**

- Transportistas
- Ubicaciones
- Rutas

**Patrón:**

```
Lista → Detalle → Tab
Transportistas → ColdChain Express → Documentos
Ubicaciones → Warehouse Chicago → Configuración
```

**Breadcrumbs generados:**

```tsx
Transportistas › ColdChain Express › Documentos
    ↑ vuelve        ↑ vuelve          �� actual (tab)
```

**Implementación:**

```tsx
// Detail Component con Tabs
export function ItemDetail({ item, onBack }) {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <div>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <TabsContent value="info">...</TabsContent>
      <TabsContent value="docs">...</TabsContent>
    </div>
  );
}
```

---

### Navegación Anidada Cross-Sección (Tipo D) 🆕

**Navegación entre secciones diferentes con filtrado**

**Implementación actual:**

- **Transportistas → Fleet** (filtrado por transportista)

**Patrón:**

```
Sección A → Detalle A → Sección B (filtrada)
Transportistas → ColdChain Express → Fleet (vehículos de ColdChain)
```

**Breadcrumbs generados:**

```tsx
Transportistas › ColdChain Express › Vehículos
    ↑ vuelve        ↑ vuelve a detail  ↑ actual (tab de Fleet)

Transportistas › ColdChain Express › Vehículos › TRK-1024
    ↑ vuelve        ↑ vuelve a detail  ↑ vuelve   ↑ actual
```

**Características clave:**

- ✅ Fleet **NO está en el Sidebar** (solo accesible vía Transportistas)
- ✅ Fleet se renderiza **filtrado automáticamente** por transportista
- ✅ Breadcrumbs combinados muestran la jerarquía completa
- ✅ Navegación bidireccional funcional

**Implementación paso a paso:**

**1. Wrapper de Sección A (Transportistas):**

```tsx
export function TransportistasWrapper({
  onBreadcrumbChange,
  onTabChange,
}) {
  const [view, setView] = useState<"list" | "detail" | "fleet">(
    "list",
  );
  const [selectedCarrier, setSelectedCarrier] = useState(null);

  const handleViewFleet = (carrier) => {
    setSelectedCarrier(carrier);
    setView("fleet");

    // Breadcrumbs iniciales: Transportistas > ColdChain Express
    onBreadcrumbChange([
      {
        label: carrier.nombreComercial,
        onClick: () => {
          setView("detail");
          onBreadcrumbChange([
            { label: carrier.nombreComercial },
          ]);
        },
      },
    ]);

    // Notificar tab inicial de Fleet
    onTabChange("vehiculos");
  };

  const handleFleetBreadcrumbChange = (fleetBreadcrumbs) => {
    // Combinar breadcrumbs
    if (selectedCarrier) {
      const combinedBreadcrumbs = [
        {
          label: selectedCarrier.nombreComercial,
          onClick: () => {
            setView("detail");
            onBreadcrumbChange([
              { label: selectedCarrier.nombreComercial },
            ]);
          },
        },
        ...fleetBreadcrumbs,
      ];
      onBreadcrumbChange(combinedBreadcrumbs);
    }
  };

  if (view === "fleet" && selectedCarrier) {
    return (
      <FleetWrapper
        transportistaNombre={selectedCarrier.nombreComercial}
        onBreadcrumbChange={handleFleetBreadcrumbChange}
        onTabChange={onTabChange}
      />
    );
  }

  if (view === "detail" && selectedCarrier) {
    return (
      <TransportistaDetail
        carrier={selectedCarrier}
        onBack={handleBack}
      />
    );
  }

  return (
    <TransportistasList
      onSelectCarrier={handleSelectCarrier}
      onViewFleet={handleViewFleet}
    />
  );
}
```

**2. Wrapper de Sección B (Fleet):**

```tsx
interface FleetWrapperProps {
  transportistaNombre?: string; // Filtro opcional
  onBreadcrumbChange?: (breadcrumbs: BreadcrumbItem[]) => void;
  onTabChange?: (tab: string) => void;
}

export function FleetWrapper({
  transportistaNombre,
  onBreadcrumbChange,
  onTabChange,
}: FleetWrapperProps) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("vehiculos");

  // Pasar filtro a FleetList
  return (
    <FleetList
      transportistaNombre={transportistaNombre}
      onSelectItem={handleSelectItem}
      onTabChange={handleTabChange}
      activeTab={activeTab}
    />
  );
}
```

**3. Componente de Lista con Filtrado:**

```tsx
interface FleetListProps {
  transportistaNombre?: string; // Filtro opcional
  onSelectItem: (item: any, type: string) => void;
}

export function FleetList({
  transportistaNombre,
  onSelectItem,
}: FleetListProps) {
  const renderContent = () => {
    // Filtrar datos por transportista si está presente
    const filteredVehicles = transportistaNombre
      ? mockVehicles.filter(
          (v) => v.carrier === transportistaNombre,
        )
      : mockVehicles;

    const filteredDrivers = transportistaNombre
      ? mockDrivers.filter(
          (d) => d.carrier === transportistaNombre,
        )
      : mockDrivers;

    // ... resto del filtrado

    return (
      <DataTable
        data={filteredVehicles}
        columns={vehicleColumns}
        // ...
      />
    );
  };

  return renderContent();
}
```

**4. Acción en Lista de Sección A:**

```tsx
// En TransportistasList.tsx
const actions = [
  {
    icon: Pencil,
    label: "Editar",
    onClick: (carrier) => console.log("Editar", carrier),
  },
  {
    icon: Container,
    label: "Ver flota",
    onClick: (carrier) => onViewFleet(carrier), // ← Nueva acción
  },
];

<DataTable
  data={carriers}
  columns={columns}
  actions={actions}
/>;
```

**Ventajas del patrón:**

- 🎯 Filtrado automático sin duplicar componentes
- 🔄 Navegación bidireccional fluida
- 📍 Breadcrumbs jerárquicos claros
- 🚀 Reutilización de componentes existentes
- 💾 Sin duplicación de código

**Cuándo usar Tipo D:**

- Cuando una sección necesita mostrar datos de otra sección filtrados por contexto
- Cuando quieres evitar duplicar una sección completa en el sidebar
- Cuando la relación entre secciones es de "pertenencia" (ej: flota pertenece a transportista)

---

## Secciones con Breadcrumbs

**Con navegación profunda:**

- Transportistas: `Transportistas › ColdChain Express › Documentos`
- Transportistas → Fleet: `Transportistas › ColdChain Express › Vehículos`
- Ubicaciones: `Ubicaciones › Warehouse Chicago › Configuración`
- Rutas: `Rutas › Chicago-Dallas › Paradas`

**Sin breadcrumbs:**

- Dashboard, Alertas, Settings, Perfil

## Estilos de Breadcrumbs

```tsx
// Nivel actual (negro, no clickeable)
<span className="text-base font-medium text-gray-900">{currentLevel}</span>

// Niveles anteriores (gris, clickeable)
<button className="text-base font-medium text-gray-500 hover:text-gray-900 hover:underline">
  {previousLevel}
</button>

// Separador
<span className="text-gray-400">›</span>
```

---

# Componentes Documentados

## DataTable

Componente genérico para tablas complejas con multiselección, paginación y acciones.

📚 **Documentación completa:** `/components/DataTable/README.md`

**Features:**

- Multiselect con header transformable
- Paginación inteligente
- Acciones por fila y masivas
- Configuración flexible de columnas

## SmartSelect

Componente de selección con 3 modos: single, multi y smart.

📚 **Documentación completa:** `/components/common/SMARTSELECT_README.md`

**Modos:**

- **Single**: Selección simple con búsqueda
- **Multi**: Selección múltiple con checkboxes
- **Smart**: Selección inteligente con scores y metadata

**Ejemplo básico:**

```tsx
import { SmartSelect } from "@/components/common/SmartSelect";

<SmartSelect
  label="País"
  id="pais"
  mode="single"
  options={[
    { value: "bo", label: "Bolivia" },
    { value: "pe", label: "Perú" },
  ]}
  value={selectedCountry}
  onChange={setSelectedCountry}
/>;
```

---

# Checklist de Implementación

## Formularios

- [ ] Usar componentes estandarizados
- [ ] Labels en `text-xs text-gray-600`
- [ ] Campos requeridos con asterisco rojo
- [ ] `space-y-1.5` entre label e input
- [ ] `space-y-4` entre campos
- [ ] Grid 2 columnas en desktop
- [ ] Background gris claro en contenedor principal

## Tablas

- [ ] Usar `DataTable` para tablas complejas
- [ ] Headers en `text-xs text-gray-500 uppercase`
- [ ] Celdas con `text-xs text-gray-900`
- [ ] Padding consistente
- [ ] Hover states
- [ ] Badges de estado con colores semánticos
- [ ] Paginación con contadores claros

## Navegación

- [ ] Identificar tipo de navegación (A, B, C o D)
- [ ] Crear wrapper para navegación profunda
- [ ] Implementar callbacks de breadcrumbs
- [ ] Links clickeables en tablas con color `#004ef0`
- [ ] Integrar con App.tsx
- [ ] Probar navegación forward/backward

## Navegación Cross-Sección (Tipo D)

- [ ] Definir prop de filtro en Wrapper de destino
- [ ] Implementar filtrado en componente de lista
- [ ] Agregar estado de vista en Wrapper de origen
- [ ] Crear handler `handleFleetBreadcrumbChange` para combinar breadcrumbs
- [ ] Agregar acción en tabla de origen
- [ ] Probar filtrado y navegación bidireccional

---

# Imports Recomendados

```tsx
// Componentes base
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Componentes reutilizables
import { DataTable } from "@/components/DataTable";
import { SmartSelect } from "@/components/common/SmartSelect";

// Iconos
import { Pencil, Trash2, Plus } from "lucide-react";
```

---

**Versión:** 4.0 - Sistema de Navegación Estandarizado con Patrón Cross-Sección  
**Última actualización:** 2025-12-04  
**Mantenedor:** Equipo ColdSync