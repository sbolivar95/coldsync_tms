# 📁 Estructura de Carpetas - Frontend

Este documento describe en detalle la estructura de carpetas del proyecto y la organización del código.

---

## 📋 Tabla de Contenidos

1. [Estructura General](#estructura-general)
2. [Páginas](#páginas)
3. [Features](#features)
4. [Componentes](#componentes)
5. [Servicios](#servicios)
6. [Otros Directorios](#otros-directorios)

---

## 🗂️ Estructura General

```
src/
├── pages/              # Páginas principales (vistas de nivel superior)
├── features/           # Módulos de negocio organizados por feature
├── components/         # Componentes reutilizables
│   ├── ui/            # Componentes base (Radix UI)
│   └── widgets/       # Widgets personalizados
├── layouts/            # Layouts de la aplicación
├── services/           # Servicios CRUD para Supabase
├── stores/             # Estado global (Zustand)
├── lib/                # Utilidades y configuraciones
├── types/              # Tipos TypeScript
├── hooks/              # Custom hooks
├── styles/             # Estilos globales
├── App.tsx             # Componente raíz (legacy)
├── main.tsx            # Punto de entrada
└── routes/             # Configuración de rutas
```

---

## 📄 Páginas (`pages/`)

Las páginas son componentes de nivel superior que representan rutas completas. Actúan como contenedores que orquestan features.

### Estructura

```
pages/
├── Login.tsx                    # Página de inicio de sesión
├── Dashboard.tsx                # Panel de control
├── Dispatch.tsx                  # Módulo de despacho
├── ControlTower.tsx              # Torre de control
├── Reconciliation.tsx           # Conciliación financiera
├── CarriersWrapper.tsx           # Wrapper de transportistas
├── LocationsWrapper.tsx         # Wrapper de ubicaciones
├── RoutesWrapper.tsx             # Wrapper de rutas
├── Alerts.tsx                    # Sistema de alertas
├── Settings.tsx                  # Configuración
├── Profile.tsx                   # Perfil de usuario
├── NoOrganization.tsx            # Sin organización
└── AuthRedirect.tsx              # Redirect de autenticación
```

### Características

- **Orquestan features** - Coordinan componentes de features
- **Manejan routing** - Conectan con React Router
- **Gestionan estado de página** - Estado específico de la vista
- **Breadcrumbs** - Actualizan breadcrumbs dinámicos

### Ejemplo

```typescript
// pages/Dispatch.tsx
export function Dispatch() {
  return (
    <div>
      {/* Orquesta componentes de dispatch feature */}
      <DispatchList />
      <OrderDialog />
    </div>
  );
}
```

---

## 🎯 Features (`features/`)

Cada feature es un módulo de negocio autocontenido. La estructura varía según la complejidad del feature.

### Estructura General

```
features/
├── carriers/                    # Gestión de transportistas
│   ├── CarrierDetail.tsx
│   ├── CarriersList.tsx
│   └── tabs/
│       ├── FinanceTab.tsx
│       └── GeneralTab.tsx
│
├── control-tower/              # Torre de control
│   ├── TrackingView.tsx
│   ├── UnitCard.tsx
│   ├── UnitDetailsDrawer.tsx
│   └── drawer/
│       ├── AlertItem.tsx
│       ├── AlertsTab.tsx
│       ├── GeneralTab.tsx
│       ├── InfoGrid.tsx
│       ├── InfoTab.tsx
│       ├── ProgressBar.tsx
│       ├── ReeferTab.tsx
│       └── TemperaturaTab.tsx
│
├── dispatch/                    # Despacho de órdenes
│   ├── components/
│   │   ├── DraggableOrder.tsx
│   │   ├── DraggableTripCard.tsx
│   │   ├── TripCard.tsx
│   │   └── VehicleDropZone.tsx
│   ├── dialogs/
│   │   ├── OrderDialog.tsx
│   │   └── OrderDrawer.tsx
│   └── drawer/
│       ├── AssignmentTab.tsx
│       ├── DetailsTab.tsx
│       ├── HistoryTab.tsx
│       └── ReassignView.tsx
│
├── fleet/                       # Gestión de flota
│   ├── FleetList.tsx
│   ├── FleetWrapper.tsx
│   ├── entities/
│   │   ├── assignments/
│   │   │   ├── AssignmentDetail.tsx
│   │   │   ├── AssignmentsList.tsx
│   │   │   └── tabs/
│   │   │       └── AssignmentGeneralTab.tsx
│   │   ├── drivers/
│   │   │   ├── DriverDetail.tsx
│   │   │   ├── DriversList.tsx
│   │   │   └── tabs/
│   │   │       └── DriverGeneralTab.tsx
│   │   ├── hardware/
│   │   │   ├── HardwareDetail.tsx
│   │   │   ├── HardwareList.tsx
│   │   │   └── tabs/
│   │   │       └── HardwareGeneralTab.tsx
│   │   ├── trailers/
│   │   │   ├── CompartmentDialog.tsx
│   │   │   ├── TrailerDetail.tsx
│   │   │   ├── TrailersList.tsx
│   │   │   └── tabs/
│   │   │       ├── TrailerGeneralTab.tsx
│   │   │       └── TrailerReeferTab.tsx
│   │   └── vehicles/
│   │       ├── VehicleDetail.tsx
│   │       ├── VehiclesList.tsx
│   │       └── tabs/
│   │           └── VehicleGeneralTab.tsx
│   └── shared/
│       └── CurrentAssignmentCard.tsx
│
├── locations/                    # Ubicaciones
│   ├── LocationDetail.tsx
│   ├── LocationMap.tsx
│   ├── LocationsList.tsx
│   └── tabs/
│       └── GeneralTab.tsx
│
├── routes/                      # Rutas
│   ├── RouteDetail.tsx
│   ├── RouteForm.tsx
│   └── RoutesList.tsx
│
├── settings/                     # Configuración
│   ├── OrganizationDialog.tsx
│   ├── ProductDialog.tsx
│   ├── ThermalProfileDialog.tsx
│   └── UserDialog.tsx
│
└── orders/                      # Orders (Carrier Response Interface)
```

### Patrón de Feature Complejo (Fleet)

El feature `fleet` es el más complejo y muestra el patrón completo:

```
fleet/
├── FleetList.tsx              # Lista principal
├── FleetWrapper.tsx          # Wrapper con lógica
└── entities/                 # Entidades del feature
    ├── vehicles/
    │   ├── VehiclesList.tsx
    │   ├── VehicleDetail.tsx
    │   └── tabs/
    │       └── VehicleGeneralTab.tsx
    ├── drivers/
    ├── trailers/
    ├── assignments/
    └── hardware/
```

**Características:**
- **Lista principal** - `FleetList.tsx` muestra todas las entidades
- **Wrapper** - `FleetWrapper.tsx` maneja navegación y estado
- **Entidades** - Cada entidad tiene su propia carpeta
- **Tabs** - Detalles organizados en tabs

---

## 🧩 Componentes (`components/`)

### UI Base (`components/ui/`)

Componentes headless de Radix UI con estilos de Tailwind.

```
components/ui/
├── Accordion.tsx
├── Alert.tsx
├── AlertDialog.tsx
├── Button.tsx
├── Card.tsx
├── Dialog.tsx
├── DropdownMenu.tsx
├── Input.tsx
├── Select.tsx
├── Table.tsx
├── Tabs.tsx
└── ... (50+ componentes)
```

**Características:**
- Basados en Radix UI
- Estilos con Tailwind CSS
- Accesibles por defecto
- Completamente tipados

### Widgets (`components/widgets/`)

Componentes de alto nivel reutilizables.

```
components/widgets/
├── DataTable/
│   ├── DataTable.tsx
│   ├── DataTablePagination.tsx
│   ├── index.ts
│   └── types.ts
├── DatePicker.tsx
├── TimePicker.tsx
├── SmartSelect.tsx
├── EntityDialog.tsx
├── EditableFields/
│   ├── EditableField.tsx
│   ├── EditableDropdownField.tsx
│   ├── StaticField.tsx
│   └── index.ts
├── FormField.tsx
├── FormLabel.tsx
├── ConfirmDialog.tsx
├── TableToolbar.tsx
└── ... (15+ widgets)
```

**Características:**
- Encapsulan lógica compleja
- Reutilizables en múltiples features
- API consistente
- Bien documentados

---

## 🔌 Servicios (`services/`)

Servicios CRUD organizados por entidad.

```
services/
├── index.ts                    # Exportaciones centralizadas
├── carriers.service.ts
├── drivers.service.ts
├── vehicles.service.ts
├── trailers.service.ts
├── fleetSets.service.ts
├── products.service.ts
├── locations.service.ts
├── routes.service.ts
├── dispatchOrders.service.ts
├── organizations.service.ts
├── organization_members.service.ts
└── users.service.ts
```

**Patrón:**
- Un servicio por entidad principal
- Métodos CRUD estándar
- Siempre incluye `orgId` para seguridad

---

## 📚 Otros Directorios

### Layouts (`layouts/`)

```
layouts/
├── AppLayout.tsx              # Layout principal
├── Header.tsx                 # Barra superior
├── Sidebar.tsx                # Menú lateral
└── PageHeader.tsx             # Header de página
```

### Stores (`stores/`)

```
stores/
└── useAppStore.ts             # Store global Zustand
```

### Lib (`lib/`)

```
lib/
├── supabase.ts                # Cliente Supabase
├── auth-context.tsx           # Context de autenticación
├── utils.ts                   # Utilidades generales
├── mockData.ts                # Datos mock (si aplica)
├── permissions/               # Módulo de permisos centralizado (RBAC)
│   ├── index.ts              # Exportaciones centrales
│   ├── types.ts              # Tipos TypeScript para permisos
│   ├── roles.ts              # Jerarquía de roles y utilidades
│   └── permissions.ts        # Lógica de permisos
├── schemas/                   # Esquemas de validación Zod
│   ├── organization.schemas.ts
│   ├── product.schemas.ts
│   ├── profile.schemas.ts
│   ├── thermalProfile.schemas.ts
│   └── user.schemas.ts
└── utils/                     # Utilidades específicas por dominio
    ├── organization.utils.ts
    └── user.utils.ts
```

### Types (`types/`)

```
types/
├── database.types.ts          # Tipos generados de Supabase
└── supabase.ts                # Tipos de Supabase client
```

### Hooks (`hooks/`)

```
hooks/
├── use-mobile.ts              # Hook para detectar mobile
└── useOrganization.ts         # Hook para organización
```

### Styles (`styles/`)

```
styles/
└── globals.css                 # Estilos globales
```

---

## 🎯 Principios de Organización

### 1. Feature-Based

- Código relacionado está junto
- Fácil de encontrar y mantener
- Escalable

### 2. Separación de Concerns

- **Pages** - Orquestación
- **Features** - Lógica de negocio
- **Components** - UI reutilizable
- **Services** - Comunicación con backend

### 3. Reusabilidad

- Componentes reutilizables en `components/`
- Servicios reutilizables en `services/`
- Hooks reutilizables en `hooks/`

### 4. Consistencia

- Misma estructura en todos los features
- Mismos patrones en todos los servicios
- Mismas convenciones en todo el código

---

## 📝 Reglas de Ubicación

### ¿Dónde va cada archivo?

| Tipo de Archivo | Ubicación |
|----------------|-----------|
| **Página principal** | `pages/` |
| **Componente de feature** | `features/[feature]/` |
| **Componente reutilizable** | `components/ui/` o `components/widgets/` |
| **Servicio CRUD** | `services/` |
| **Estado global** | `stores/` |
| **Layout** | `layouts/` |
| **Utilidad** | `lib/` |
| **Hook personalizado** | `hooks/` |
| **Tipo compartido** | `types/` |

---

## 🔗 Referencias

- [Arquitectura Frontend](./architecture.md)
- [Convenciones de Código](./conventions.md)
- [Contexto Completo](../coldsync-tms-context.md)

---

**Última actualización:** Diciembre 2024

