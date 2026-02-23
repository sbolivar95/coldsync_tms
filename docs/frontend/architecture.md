# 🏛️ Arquitectura Frontend - ColdSyn TMS

Este documento describe la arquitectura, estructura y patrones de diseño del frontend de ColdSyn TMS.

---

## 📋 Tabla de Contenidos

1. [Principios de Arquitectura](#principios-de-arquitectura)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Patrones de Arquitectura](#patrones-de-arquitectura)
4. [Flujos de Datos](#flujos-de-datos)
5. [Componentes y Composición](#componentes-y-composición)
6. [Routing y Navegación](#routing-y-navegación)
7. [Gestión de Estado](#gestión-de-estado)
8. [Servicios y API](#servicios-y-api)

---

## 🎯 Principios de Arquitectura

### 1. Feature-Based Architecture

El proyecto está organizado por **features** (módulos de negocio) en lugar de por tipo de archivo. Cada feature es autocontenido y puede incluir:

- Componentes específicos del feature
- Lógica de negocio
- Tipos relacionados
- Hooks personalizados

```
features/
  └── fleet/
      ├── FleetList.tsx
      ├── FleetWrapper.tsx
      └── entities/
          ├── vehicles/
          ├── drivers/
          └── trailers/
```

### 2. Separación de Responsabilidades

- **Pages** - Vistas de nivel superior, orquestan features
- **Features** - Módulos de negocio autocontenidos
- **Components** - Componentes reutilizables (UI base + widgets)
- **Services** - Lógica de negocio y comunicación con backend
- **Stores** - Estado global compartido
- **Lib** - Utilidades y configuraciones

### 3. Composición sobre Herencia

Los componentes se construyen mediante composición de componentes más pequeños y reutilizables.

### 4. Type Safety

TypeScript se usa en todo el proyecto para garantizar type safety y mejor DX.

---

## 📁 Estructura de Carpetas

### Estructura Principal

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
└── styles/             # Estilos globales
```

### Páginas (`pages/`)

Las páginas son componentes de nivel superior que representan rutas completas. Actúan como contenedores que orquestan features y layouts.

**Ejemplo:**
```typescript
// src/pages/Dispatch.tsx
export function Dispatch() {
  return (
    <div>
      {/* Orquesta componentes de dispatch feature */}
    </div>
  )
}
```

**Páginas principales:**
- `Dashboard.tsx` - Panel de control
- `Dispatch.tsx` - Módulo de despacho
- `orders/OrdersListPage.tsx` - Orders (Carrier Commitment Layer)
- `ControlTower.tsx` - Torre de control
- `CarriersWrapper.tsx` - Gestión de transportistas
- `LocationsWrapper.tsx` - Gestión de ubicaciones
- `RoutesWrapper.tsx` - Gestión de rutas
- `Settings.tsx` - Configuración
- `Login.tsx` - Inicio de sesión

### Features (`features/`)

Cada feature es un módulo de negocio autocontenido. La estructura típica:

```
features/
  ├── orders/                    # Orders (Carrier Commitment Layer)
  │   ├── OrdersList.tsx         # Container con lógica
  │   ├── constants.ts           # Constantes de negocio
  │   ├── components/
  │   │   ├── OrdersTable.tsx    # Tabla con acciones contextuales
  │   │   ├── drawer/            # Vistas de detalle (view swapping)
  │   │   └── dialogs/           # Diálogos de acción
  │   ├── hooks/
  │   │   └── useOrders.ts       # Lógica de negocio
  │   ├── types/
  │   │   └── orders.types.ts    # Tipos TypeScript
  │   └── utils/
  │       ├── orders-helpers.ts  # Helpers
  │       └── mock-data.ts       # Mock data
  └── fleet/
      ├── FleetList.tsx           # Lista principal
      ├── FleetWrapper.tsx        # Wrapper con lógica
      └── entities/               # Entidades del feature
          ├── vehicles/
          │   ├── VehiclesList.tsx
          │   ├── VehicleDetail.tsx
          │   └── tabs/
          │       └── VehicleGeneralTab.tsx
          ├── drivers/
          └── trailers/
```

**Características:**
- Cada feature puede tener su propia estructura interna
- Los componentes dentro de un feature son específicos de ese módulo
- Los componentes reutilizables van en `components/`
- **Orders** usa local state (no requiere estado global). Ver [Orders README](../../src/features/orders/README.md)

### Componentes (`components/`)

#### UI Base (`components/ui/`)

Componentes headless de Radix UI con estilos de Tailwind. Son la base del sistema de diseño.

**Ejemplos:**
- `Button.tsx`
- `Input.tsx`
- `Dialog.tsx`
- `Select.tsx`
- `Table.tsx`

#### Widgets (`components/widgets/`)

Componentes de alto nivel reutilizables que encapsulan lógica compleja.

**Ejemplos:**
- `DataTable/` - Tabla de datos con paginación
- `DatePicker.tsx` - Selector de fechas
- `SmartSelect.tsx` - Selector inteligente
- `EntityDialog.tsx` - Diálogo genérico
- `EditableFields/` - Campos editables

### Layouts (`layouts/`)

Componentes que definen la estructura visual de la aplicación.

- `AppLayout.tsx` - Layout principal con Sidebar y Header
- `Header.tsx` - Barra superior con breadcrumbs y acciones
- `Sidebar.tsx` - Menú lateral
- `PageHeader.tsx` - Header de página con tabs

### Services (`services/`)

Servicios que encapsulan la lógica de comunicación con Supabase. Cada servicio maneja una entidad.

**Patrón:**
```typescript
export const entityService = {
  async getAll(orgId: string): Promise<Entity[]>
  async getById(id: string, orgId: string): Promise<Entity | null>
  async create(data: EntityInsert, orgId: string): Promise<Entity>
  async update(id: string, data: EntityUpdate, orgId: string): Promise<Entity>
  async delete(id: string, orgId: string): Promise<void>
}
```

### Stores (`stores/`)

Estado global usando Zustand.

- `useAppStore.ts` - Estado global de la aplicación (UI, breadcrumbs, tabs)

### Lib (`lib/`)

Utilidades y configuraciones compartidas.

- `supabase.ts` - Cliente Supabase
- `auth-context.tsx` - Context de autenticación
- `utils.ts` - Utilidades generales
- `permissions/` - **Módulo de permisos centralizado (RBAC)**
  - `types.ts` - Tipos TypeScript para permisos
  - `roles.ts` - Jerarquía de roles y funciones de utilidad
  - `permissions.ts` - Lógica de permisos (canView, canManage, etc.)
  - `index.ts` - Exportaciones centrales
- `schemas/` - Esquemas de validación Zod
- `utils/` - Utilidades específicas por dominio

---

## 🏗️ Patrones de Arquitectura

### 1. Container/Presentational Pattern

**Container Components** (Smart Components):
- Manejan lógica y estado
- Se comunican con servicios
- Pasan datos a componentes presentacionales

**Presentational Components** (Dumb Components):
- Reciben datos via props
- Se enfocan en la presentación
- Son reutilizables y testeables

**Ejemplo:**
```typescript
// Container (FleetWrapper.tsx)
export function FleetWrapper() {
  const [vehicles, setVehicles] = useState([])
  
  useEffect(() => {
    vehiclesService.getAll(orgId).then(setVehicles)
  }, [])
  
  return <FleetList vehicles={vehicles} />
}

// Presentational (FleetList.tsx)
interface Props {
  vehicles: Vehicle[]
}
export function FleetList({ vehicles }: Props) {
  return <div>{/* Render vehicles */}</div>
}
```

### 2. Compound Components

Componentes que trabajan juntos pero mantienen su propia lógica.

**Ejemplo:**
```typescript
<DataTable>
  <DataTable.Header />
  <DataTable.Body />
  <DataTable.Pagination />
</DataTable>
```

### 3. Render Props / Children as Function

Pasar funciones como children para máxima flexibilidad.

**Ejemplo:**
```typescript
<EntityDialog>
  {({ isOpen, onClose }) => (
    <Form onSubmit={handleSubmit} />
  )}
</EntityDialog>
```

### 4. Custom Hooks

Extraer lógica reutilizable a hooks personalizados.

**Ejemplo:**
```typescript
// hooks/useVehicles.ts
export function useVehicles(orgId: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    vehiclesService.getAll(orgId)
      .then(setVehicles)
      .finally(() => setLoading(false))
  }, [orgId])
  
  return { vehicles, loading }
}
```

---

## 🔄 Flujos de Datos

### Flujo Unidireccional

```
Usuario → Evento → Handler → Service → Supabase → Database
                                    ↓
                              Store (Zustand)
                                    ↓
                              Componente (actualizado)
```

### Ejemplo Completo

```typescript
// 1. Usuario hace clic en botón
<Button onClick={handleCreateVehicle}>Crear</Button>

// 2. Handler ejecuta acción
const handleCreateVehicle = async () => {
  const newVehicle = await vehiclesService.create(data, orgId)
  setVehicles([...vehicles, newVehicle])
}

// 3. Service comunica con Supabase
export const vehiclesService = {
  async create(data: VehicleInsert, orgId: string) {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert({ ...data, org_id: orgId })
      .select()
      .single()
    
    if (error) throw error
    return vehicle
  }
}

// 4. Componente se actualiza con nuevo estado
```

### Flujo de Estado Global

```typescript
// Store (Zustand)
const useAppStore = create((set) => ({
  sidebarCollapsed: true,
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value })
}))

// Componente consume store
function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  // ...
}
```

---

## 🧩 Componentes y Composición

### Estructura de un Componente

```typescript
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

// 2. Tipos
interface Props {
  id: string
  onSave?: (data: Data) => void
}

// 3. Componente
export function MyComponent({ id, onSave }: Props) {
  // 4. Hooks
  const [state, setState] = useState()
  
  // 5. Handlers
  const handleClick = () => {
    // Lógica
  }
  
  // 6. Effects
  useEffect(() => {
    // Efectos
  }, [])
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Composición de Componentes

```typescript
// Componente compuesto
export function VehicleDetail({ vehicleId }: Props) {
  return (
    <div>
      <PageHeader title="Detalle de Vehículo" />
      <Tabs>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="reefer">Reefer</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <VehicleGeneralTab vehicleId={vehicleId} />
        </TabsContent>
        <TabsContent value="reefer">
          <VehicleReeferTab vehicleId={vehicleId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 🗺️ Routing y Navegación

### Configuración de Rutas

Rutas definidas en `src/routes/index.tsx` usando React Router v7:

```typescript
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute requireOrgMember>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'dispatch',
        element: <Dispatch />,
      },
      // ...
    ],
  },
])
```

### Rutas Protegidas

Todas las rutas excepto `/login` están protegidas con `ProtectedRoute`:

```typescript
<ProtectedRoute requireOrgMember>
  <AppLayout />
</ProtectedRoute>
```

### Navegación Programática

```typescript
import { useNavigate } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()
  
  const handleClick = () => {
    navigate('/dashboard')
  }
}
```

### Breadcrumbs Dinámicos

El sistema soporta breadcrumbs dinámicos que se actualizan según la navegación:

```typescript
// En un componente
onBreadcrumbChange([
  { label: 'Transportistas', onClick: () => navigate('/carriers') },
  { label: 'Detalle', onClick: () => {} }
])
```

---

## 🔄 Gestión de Estado

### Estado Local (useState)

Para estado que solo afecta a un componente:

```typescript
const [isOpen, setIsOpen] = useState(false)
```

### Estado Global (Zustand)

Para estado compartido entre múltiples componentes:

```typescript
// Store
const useAppStore = create((set) => ({
  sidebarCollapsed: true,
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value })
}))

// Uso
const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()
```

### Estado de Formularios (React Hook Form)

```typescript
const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

const onSubmit = (data: FormData) => {
  // Procesar datos
}
```

### Context API

Para estado que necesita ser compartido en un árbol de componentes:

```typescript
// AuthContext
const { user, organizationMember } = useAuth()
```

---

## 🔌 Servicios y API

### Patrón de Servicios

Todos los servicios siguen un patrón consistente:

```typescript
export const vehiclesService = {
  // Obtener todos
  async getAll(orgId: string, carrierId?: number): Promise<Vehicle[]> {
    let query = supabase
      .from('vehicles')
      .select('*')
      .eq('org_id', orgId)
    
    if (carrierId != null) {
      query = query.eq('carrier_id', carrierId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },
  
  // Obtener por ID
  async getById(id: string, orgId: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },
  
  // Crear
  async create(data: VehicleInsert, orgId: string): Promise<Vehicle> {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert({ ...data, org_id: orgId })
      .select()
      .single()
    
    if (error) throw error
    return vehicle
  },
  
  // Actualizar
  async update(id: string, data: VehicleUpdate, orgId: string): Promise<Vehicle> {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update(data)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()
    
    if (error) throw error
    return vehicle
  },
  
  // Eliminar
  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)
    
    if (error) throw error
  }
}
```

### Uso de Servicios

```typescript
// En un componente
useEffect(() => {
  vehiclesService.getAll(orgId)
    .then(setVehicles)
    .catch(handleError)
}, [orgId])
```

### Manejo de Errores

```typescript
try {
  const vehicle = await vehiclesService.create(data, orgId)
  // Éxito
} catch (error) {
  // Manejar error
  console.error('Error creating vehicle:', error)
  toast.error('Error al crear vehículo')
}
```

---

## 📝 Mejores Prácticas

### 1. Organización de Código
- Mantén componentes pequeños y enfocados
- Extrae lógica compleja a hooks personalizados
- Usa servicios para comunicación con backend

### 2. Performance
- Usa `React.memo` para componentes pesados
- Implementa lazy loading para rutas
- Optimiza re-renders con `useMemo` y `useCallback`

### 3. Type Safety
- Define tipos para todas las props
- Usa tipos generados de Supabase
- Evita `any` cuando sea posible

### 4. Reusabilidad
- Crea componentes reutilizables en `components/`
- Extrae lógica común a hooks
- Usa servicios para operaciones CRUD

### 5. Sistema de Permisos Centralizado

El proyecto implementa un **módulo de permisos centralizado** en `src/lib/permissions/` que sirve como fuente única de verdad para:

- **Jerarquía de roles**: Definición centralizada de niveles de privilegio
- **Verificación de permisos**: Funciones reutilizables (`canViewUser`, `canManageUser`, etc.)
- **Mapeo de roles**: Conversión entre etiquetas en español y valores enum
- **Control de acceso**: Validación de permisos para recursos y acciones

**Uso:**
```typescript
import { canManageUser, getAvailableRolesForAssignment, canAccessTab } from '@/lib/permissions'

// Verificar si puede gestionar un usuario
const canManage = canManageUser(currentUserRole, targetUserRole, isPlatformUser, isCurrentUser)

// Obtener roles disponibles para asignar
const availableRoles = getAvailableRolesForAssignment(currentUserRole, isPlatformUser)

// Verificar acceso a tabs
const canAccess = canAccessTab(userRole, 'productos', isPlatformUser)
```

**Beneficios:**
- ✅ Fuente única de verdad para permisos
- ✅ Sin duplicación de lógica
- ✅ Fácil de mantener y escalar
- ✅ Type-safe con TypeScript
- ✅ Consistencia en toda la aplicación

---

## 🔗 Referencias

- [Arquitectura Frontend - Contexto Completo](../coldsync-tms-context.md#arquitectura)
- [Convenciones de Código](./conventions.md)
- [Gestión de Estado](./state-management.md)
- [Servicios y API](./services.md)
- [Reglas de Base de Datos: .cursor/rules/data-base-rules.md](../../.cursor/rules/data-base-rules.md)
- [Reglas de Implementación: .cursor/rules/ai-rules.md](../../.cursor/rules/ai-rules.md)

---

**Última actualización:** 16/01/2026


