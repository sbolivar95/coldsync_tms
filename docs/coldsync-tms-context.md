# 🎯 Contexto Completo - ColdSyn TMS

Este documento proporciona contexto completo sobre el proyecto ColdSyn TMS para desarrolladores e IA. Contiene toda la información necesaria para entender, desarrollar y mantener el sistema.

---

## 📋 Resumen Ejecutivo

**ColdSyn TMS** (Transportation Management System) es una aplicación web moderna diseñada para gestionar operaciones logísticas de transporte refrigerado. El sistema permite gestionar flotas, conductores, carriles (lanes), órdenes de despacho, y monitoreo en tiempo real de unidades en tránsito.

### Características Principales
- 🚛 Gestión completa de flota (vehículos, conductores, remolques)
- 📍 Gestión de ubicaciones con mapas
- 🗺️ Planificación y gestión de carriles (lanes)
- 📦 Sistema de despacho con drag & drop
- 🏗️ Torre de control para monitoreo en tiempo real
- 💰 Conciliación financiera
- ⚙️ Configuración multi-organización
- 🔐 Sistema de roles y permisos robusto

---

## 🛠️ Stack Tecnológico Completo

### Frontend
```json
{
  "framework": "React 18.3.1",
  "language": "TypeScript (ES2020)",
  "buildTool": "Vite 6.3.5",
  "bundler": "Vite (esbuild/SWC)",
  "uiLibrary": "Radix UI (headless components)",
  "styling": "Tailwind CSS",
  "stateManagement": "Zustand 5.0.9",
  "forms": "React Hook Form 7.55.0",
  "routing": "React Router DOM 7.11.0",
  "dragDrop": "React DnD",
  "maps": "MapLibre GL 5.15.0",
  "charts": "Recharts 2.15.2",
  "icons": "Lucide React 0.487.0",
  "notifications": "Sonner 2.0.3"
}
```

### Backend/BaaS
- **Supabase 2.89.0** - Backend as a Service
  - PostgreSQL (base de datos)
  - Supabase Auth (autenticación)
  - Row Level Security (RLS)
  - Real-time subscriptions

### Herramientas de Desarrollo
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **ESLint** - Linting (si está configurado)
- **Path Aliases** - `@/*` apunta a `./src/*`

---

## 📁 Estructura del Proyecto

```
coldsync_tms/
├── src/
│   ├── App.tsx                 # Componente raíz (legacy, puede estar en transición)
│   ├── main.tsx                # Punto de entrada
│   ├── routes/
│   │   └── index.tsx           # Configuración de routing React Router
│   │
│   ├── pages/                  # Páginas principales (vistas de nivel superior)
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Dispatch.tsx
│   │   ├── ControlTower.tsx
│   │   ├── Reconciliation.tsx
│   │   ├── CarriersWrapper.tsx
│   │   ├── LocationsWrapper.tsx
│   │   ├── LanesWrapper.tsx
│   │   ├── Alerts.tsx
│   │   ├── Settings.tsx
│   │   ├── Profile.tsx
│   │   ├── NoOrganization.tsx
│   │   └── AuthRedirect.tsx
│   │
│   ├── features/               # Módulos de negocio organizados por feature
│   │   ├── carriers/          # Gestión de transportistas
│   │   ├── control-tower/     # Torre de control
│   │   ├── dispatch/          # Despacho de órdenes
│   │   ├── fleet/             # Gestión de flota
│   │   ├── locations/          # Ubicaciones
│   │   ├── lanes/             # Carriles (lanes)
│   │   ├── settings/          # Configuración
│   │   └── orders/            # Orders (Carrier Response Interface)
│   │
│   ├── components/             # Componentes reutilizables
│   │   ├── ui/                # Componentes base de Radix UI
│   │   ├── widgets/           # Widgets personalizados
│   │   ├── ProtectedRoute.tsx
│   │   └── OrganizationSelector.tsx
│   │
│   ├── layouts/                # Layouts de la aplicación
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageHeader.tsx
│   │
│   ├── services/               # Servicios CRUD para Supabase
│   │   ├── index.ts           # Exportaciones centralizadas
│   │   ├── database/          # Servicios de base de datos
│   │   │   ├── carriers.service.ts
│   │   │   ├── drivers.service.ts
│   │   │   ├── vehicles.service.ts
│   │   │   ├── trailers.service.ts
│   │   │   ├── reeferEquipments.service.ts  # Equipos de refrigeración unificados
│   │   │   ├── fleetSets.service.ts
│   │   │   ├── products.service.ts
│   │   │   ├── locations.service.ts
│   │   │   ├── lanes.service.ts
│   │   │   ├── dispatchOrders.service.ts
│   │   │   ├── organizations.service.ts
│   │   │   └── organizationMembers.service.ts
│   │
│   ├── stores/                 # Estado global (Zustand)
│   │   └── useAppStore.ts
│   │
│   ├── lib/                    # Utilidades y configuraciones
│   │   ├── permissions/        # Módulo de permisos centralizado (RBAC)
│   │   ├── schemas/            # Esquemas de validación Zod
│   │   └── utils/              # Utilidades específicas por dominio
│   │   ├── supabase.ts        # Cliente Supabase
│   │   ├── auth-context.tsx   # Context de autenticación
│   │   ├── utils.ts           # Utilidades generales
│   │   └── mockData.ts        # Datos mock (si aplica)
│   │
│   ├── types/                  # Tipos TypeScript
│   │   ├── database.types.ts  # Tipos generados de Supabase
│   │   └── supabase.ts        # Tipos de Supabase client
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── use-mobile.ts
│   │   └── useOrganization.ts
│   │
│   ├── styles/                 # Estilos globales
│   │   └── globals.css
│   │
│   └── index.css               # Estilos principales
│
├── docs/                       # Documentación (esta carpeta)
├── docs1/                      # Documentación legacy
├── build/                      # Build de producción
├── public/                     # Archivos estáticos
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env                        # Variables de entorno (no en git)
```

---

## 🏗️ Arquitectura

### Patrón de Arquitectura

El proyecto sigue una **arquitectura por features** (Feature-Based Architecture) con separación clara de responsabilidades:

1. **Pages** - Vistas de nivel superior que orquestan features
2. **Features** - Módulos de negocio autocontenidos
3. **Components** - Componentes reutilizables (UI base + widgets)
4. **Services** - Lógica de negocio y comunicación con backend
5. **Stores** - Estado global compartido
6. **Lib** - Utilidades y configuraciones

### Flujo de Datos

```
Usuario → Componente → Service → Supabase → Database
                ↓
            Store (Zustand) ← Estado Global
                ↓
            Componente (actualizado)
```

### Principios de Diseño

- **Separación de Concerns** - Cada capa tiene responsabilidades claras
- **Composición sobre Herencia** - Componentes pequeños y composables
- **Single Source of Truth** - Estado centralizado en Zustand
- **Type Safety** - TypeScript en todo el proyecto
- **Reusabilidad** - Componentes y servicios reutilizables

---

## 🔐 Autenticación y Autorización

### Sistema de Autenticación

El proyecto usa **Supabase Auth** con un sistema de roles multi-nivel y gestión completa de organizaciones y usuarios. Ver documentación detallada en [`docs/business/organizations-users.md`](./business/organizations-users.md).

#### Roles de Usuario

1. **Platform Roles** (en tabla `platform_users`):
   - `DEV` - Desarrollador con acceso completo al sistema
   - `PLATFORM_ADMIN` - Administrador de plataforma SaaS, único con permisos para crear organizaciones Shipper y gestionar todos los recursos

2. **Organization Roles** (en tabla `organization_members`):
   - `OWNER` - Usuario humano con acceso total a la organización Shipper
   - `ADMIN` - Gestión de usuarios y configuración dentro de la organización
   - `STAFF` - Operaciones del TMS dentro de la organización
   - `DRIVER` - Acceso limitado a asignaciones específicas

**Restricción importante**: No se permiten roles dobles. Un usuario con rol DEV o PLATFORM_ADMIN no puede ser miembro de ninguna organización Shipper como OWNER, ADMIN, STAFF o DRIVER.

#### Estados de Usuario

La interfaz de usuario muestra únicamente dos estados para simplificar la gestión:
- **Activo**: Usuario con acceso completo al sistema. Visible en la lista de usuarios. Tiene `user_id IS NOT NULL AND is_active = true AND status = 'active'` en `organization_members`.
- **Suspendido**: Usuario suspendido temporalmente por un administrador. Visible en la lista de usuarios. Es reversible mediante reactivación. Tiene `user_id IS NOT NULL AND is_active = false AND status = 'suspended'` en `organization_members`. No puede iniciar sesión (bloqueado por `banned_until` en `auth.users`).

Internamente, el sistema gestiona tres estados mediante `is_active` y `status`:
- **Activo**: `is_active = true AND status = 'active'` - Usuario con acceso completo
- **Suspendido**: `is_active = false AND status = 'suspended'` - Usuario suspendido temporalmente
- **Eliminado (Soft Delete)**: `is_active = false AND status = 'inactive'` - Usuario eliminado, no visible en listas, puede ser reactivado

**Sistema de baneo de dos capas**: La suspensión utiliza tanto `is_active` en `organization_members` como `banned_until` en `auth.users` mediante la Edge Function `sync-banned-until`. Supabase bloquea nativamente el login cuando `banned_until` está activo.

### Sistema de Invitaciones

El sistema utiliza **magic links** como método principal de invitación:

- **Magic links únicos y temporales** generados automáticamente
- **Email automático** con botón "Unirse a ColdSync TMS"
- **Un solo click** para unirse (si ya tiene cuenta) o definir contraseña (si es nuevo)
- **Expiración configurable**: 30m, 1h, 2h, 24h, 7d
- **Reenvío de invitación**: Genera un nuevo magic link (el anterior se invalida automáticamente)

### Flujo de Autenticación

```typescript
// 1. Usuario inicia sesión
supabase.auth.signInWithPassword({ email, password })

// 2. AuthProvider detecta cambio de sesión
onAuthStateChange → fetchUserData()

// 3. Se verifica si es platform admin
platform_users table → role, is_active

// 4. Si es platform admin, puede seleccionar organización
localStorage.setItem('platform_admin_selected_org', orgId)

// 5. Si no es platform admin, se busca membership
organization_members table → org_id, role

// 6. Se carga información de organización
organizations table → comercial_name, legal_name
```

### Servicios de Gestión

#### authService
- `login()`: Autenticación + validación membresía
- `switchOrganization()`: Cambio sin re-login
- `getCurrentSession()`: Sesión actual

#### organizationsService  
- `getAll()`, `getById()`: Consultas
- `update()`, `updateStatus()`: Modificaciones
- `create()`: Crear organización (solo datos de empresa, sin usuarios)

**Nota importante**: Al crear una organización, **solo se registran los datos de la empresa**. No se genera ningún usuario ni credencial en este paso. El Platform Admin debe acceder manualmente a la nueva organización y crear el primer miembro con rol OWNER mediante uno de los dos métodos disponibles (invitación por magic link o creación directa).

#### usersService / organizationMembersService
- `getAll()`: Miembros de organización
- `updateRole()`: Cambiar rol (con restricciones: nadie puede modificar su propio rol)
- `provision()`: Crear usuario + membresía (método directo)
- `invite()`: Enviar invitación por magic link (método principal)

### Edge Functions

- **provision-org-member**: Crear usuario + membresía (método directo)
- **invite-user**: Enviar invitación por magic link (método principal)

### Protección de Routing

```typescript
// Routing protegido con ProtectedRoute
<ProtectedRoute requireOrgMember>
  <AppLayout />
</ProtectedRoute>
```

### Context de Autenticación

El `AuthProvider` (`src/lib/auth-context.tsx`) proporciona:

```typescript
interface AuthContextType {
  user: User | null
  organizationMember: OrganizationMember | null
  platformUser: PlatformUser | null
  isPlatformAdmin: boolean
  isOrgMember: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUserData: () => Promise<void>
}
```

---

## 📊 Modelo de Datos Principal

### Entidades Principales

#### Organizaciones y Usuarios
- `organizations` - Organizaciones del sistema (estados: ACTIVE, INACTIVE)
- `organization_members` - Miembros de organizaciones con roles específicos
- `platform_users` - Usuarios de plataforma (admins: DEV, PLATFORM_ADMIN)

**Nota importante**: 
- Las organizaciones se crean **sin usuarios asociados**. El primer usuario con rol OWNER se crea posteriormente desde la sección "Usuarios".
- Los roles DEV y PLATFORM_ADMIN **no pueden ser miembros** de organizaciones (prohibición de roles dobles).
- El sistema utiliza **magic links** para invitaciones, no códigos manuales.

#### Flota
- `carriers` - Transportistas
- `vehicles` - Vehículos (TRACTOR, RIGID, VAN) con capacidades extendidas para vehículos rígidos
- `drivers` - Conductores
- `trailers` - Remolques refrigerados con configuración multi-zona
- `reefer_equipments` - Equipos de refrigeración unificados (soporta TRAILER y VEHICLE)
- `fleet_sets` - Conjuntos de flota (vehículo + remolque opcional para rígidos)
- `assignments` - Asignaciones de activos

#### Operaciones
- `dispatch_orders` - Órdenes de despacho
- `lanes` - Carriles (corredores operativos)
- `lane_stops` - Paradas en carriles
- `locations` - Ubicaciones

#### Configuración
- `products` - Productos
- `thermal_profiles` - Perfiles térmicos
- `countries` - Países

### Relaciones Clave

```
Organization
  ├── OrganizationMembers (1:N) - Usuarios vinculados a la organización
  ├── Carriers (1:N)
  │   ├── Vehicles (1:N)
  │   │   └── ReeferEquipment (0..1) - Polimórfico (owner_type='VEHICLE')
  │   ├── Drivers (1:N)
  │   └── Trailers (1:N)
  │       └── ReeferEquipment (0..1) - Polimórfico (owner_type='TRAILER')
  ├── Locations (1:N)
  ├── Lanes (1:N)
  └── DispatchOrders (1:N)

FleetSet (Asignación)
  ├── Vehicle (1) - Obligatorio
  ├── Trailer (0..1) - Opcional (Requerido para TRACTOR salvo en Bobtail)
  └── Driver (0..1) - Opcional (Soporte para Spotting/Bobtail)
```

**Nota**: Las invitaciones se gestionan mediante magic links de Supabase Auth, no mediante códigos almacenados en tablas separadas.

---

## 🔌 Servicios y API

### Patrón de Servicios

Todos los servicios siguen un patrón consistente:

```typescript
export const entityService = {
  // Obtener todos (con filtros opcionales)
  async getAll(orgId: string, filter?: Filter): Promise<Entity[]>
  
  // Obtener por ID
  async getById(id: string, orgId: string): Promise<Entity | null>
  
  // Crear
  async create(data: EntityInsert, orgId: string): Promise<Entity>
  
  // Actualizar
  async update(id: string, data: EntityUpdate, orgId: string): Promise<Entity>
  
  // Eliminar (soft delete si aplica)
  async delete(id: string, orgId: string): Promise<void>
}
```

### Servicios Disponibles

1. `carriersService` - Transportistas
2. `driversService` - Conductores
3. `vehiclesService` - Vehículos (con soporte para equipos de refrigeración)
4. `trailersService` - Remolques (con soporte para equipos de refrigeración)
5. `reeferEquipmentsService` - Equipos de refrigeración unificados (TRAILER/VEHICLE)
6. `fleetSetsService` - Conjuntos de flota
7. `productsService` - Productos
8. `locationsService` - Ubicaciones
9. `lanesService` - Carriles (lanes)
10. `dispatchOrdersService` - Órdenes de despacho
11. `organizationsService` - Organizaciones (creación sin usuarios)
12. `organizationMembersService` - Miembros (con invitaciones por magic links y creación directa)

### Ejemplo de Uso

```typescript
import { vehiclesService } from '@/services'

// Obtener todos los vehículos de una organización
const vehicles = await vehiclesService.getAll(orgId)

// Obtener vehículos de un transportista específico
const carrierVehicles = await vehiclesService.getAll(orgId, { carrierId: 123 })

// Crear un nuevo vehículo
const newVehicle = await vehiclesService.create({
  vehicle_code: 'V001',
  make: 'Mercedes',
  model: 'Actros',
  // ... otros campos
}, orgId)
```

---

## 🎨 Componentes y UI

### Sistema de Componentes

#### Componentes Base (Radix UI)
Ubicación: `src/components/ui/`

Componentes headless de Radix UI con estilos de Tailwind:
- Button, Input, Select, Dialog, DropdownMenu, etc.
- ~50 componentes base

#### Widgets Personalizados
Ubicación: `src/components/widgets/`

Componentes de alto nivel reutilizables:
- `DataTable` - Tabla de datos con paginación y filtros
- `DatePicker` - Selector de fechas
- `TimePicker` - Selector de hora
- `SmartSelect` - Selector inteligente con búsqueda
- `EntityDialog` - Diálogo genérico para entidades
- `EditableFields` - Campos editables inline
- `FormField`, `FormLabel` - Componentes de formulario
- `ConfirmDialog` - Diálogo de confirmación
- `TableToolbar` - Barra de herramientas de tabla

### Ejemplo de Componente

```typescript
// Uso de DataTable
<DataTable
  columns={columns}
  data={vehicles}
  onRowClick={(row) => handleRowClick(row)}
  toolbar={<TableToolbar />}
/>
```

---

## 🔄 Gestión de Estado

### Zustand Store

El store global (`src/stores/useAppStore.ts`) maneja:

```typescript
interface AppState {
  // Autenticación
  isAuthenticated: boolean
  
  // UI
  sidebarCollapsed: boolean
  
  // Breadcrumbs dinámicos
  breadcrumbsState: Record<string, BreadcrumbItem[]>
  
  // Reset triggers
  resetTrigger: number
  
  // Tabs activos
  transportistasActiveTab: string
  settingsActiveTab: string
  
  // Handlers de creación
  createHandlers: Record<string, () => void>
}
```

### Context API

- `AuthContext` - Autenticación y usuario actual
- Otros contexts según necesidad

### Estado Local

- Componentes usan `useState` para estado local
- `useEffect` para efectos secundarios
- React Hook Form para estado de formularios

---

## 🗺️ Routing

### Configuración de Routing

Routing definido en `src/routes/index.tsx`:

```typescript
/                    → Redirect a /dashboard
/login               → Login
/auth/redirect       → Auth redirect handler
/no-organization     → Sin organización
/dashboard           → Dashboard
/dispatch            → Despacho
/control-tower       → Torre de control
/financials          → Conciliación
/carriers            → Transportistas
/locations           → Ubicaciones
/lanes               → Carriles (Lanes)
/alerts              → Alertas
/settings            → Configuración
/profile             → Perfil
```

### Routing Protegido

Todas las rutas excepto `/login` y `/auth/redirect` están protegidas.

---

## 📦 Módulos Principales

### 1. Dashboard
**Ruta:** `/dashboard`  
**Archivo:** `src/pages/Dashboard.tsx`

Panel de control principal con:
- Resumen de operaciones
- Analytics (pendiente)
- Reportes (pendiente)

### 2. Dispatch (Despacho)
**Ruta:** `/dispatch`  
**Archivo:** `src/pages/Dispatch.tsx`

Gestión de órdenes de despacho:
- Lista de órdenes
- Drag & Drop para asignación
- Diálogos de creación/edición
- Drawers de detalle

### 3. Control Tower (Torre de Control)
**Ruta:** `/control-tower`  
**Archivo:** `src/pages/ControlTower.tsx`

Monitoreo en tiempo real:
- Vista de tracking
- Tarjetas de unidades
- Drawer de detalles con tabs (Info, Temperatura, Reefer, Alertas)

### 4. Fleet (Flota)
**Ruta:** `/carriers` (con tabs)  
**Archivo:** `src/pages/CarriersWrapper.tsx`

Gestión completa de flota:
- Transportistas
- Vehículos
- Conductores
- Remolques
- Hardware/IoT
- Asignaciones

### 5. Locations (Ubicaciones)
**Ruta:** `/locations`  
**Archivo:** `src/pages/LocationsWrapper.tsx`

Gestión de ubicaciones:
- Lista de ubicaciones
- Detalle con mapa (MapLibre GL)
- CRUD completo

### 6. Lanes (Carriles)
**Ruta:** `/lanes`  
**Archivo:** `src/pages/LanesWrapper.tsx`

Planificación de carriles:
- Lista de carriles
- Detalle de carril
- Formulario de creación/edición

### 7. Settings (Configuración)
**Ruta:** `/settings`  
**Archivo:** `src/pages/Settings.tsx`

Configuración del sistema con tabs organizados:

#### Para Platform Admins (DEV / PLATFORM_ADMIN)
- **Empresas**: Gestión de organizaciones (crear, editar, suspender)
- **Usuarios**: Gestión de miembros con sistema de invitaciones por magic links
- **Productos**: Catálogo de productos transportados
- **Perfiles Térmicos**: Configuraciones de temperatura

#### Para Usuarios Organizaciones (Shipper) y Carrier
- **Usuarios**: Gestión de miembros con sistema de invitaciones por magic links
- **Productos**: Catálogo de productos transportados
- **Perfiles Térmicos**: Configuraciones de temperatura
- **NO hay tab "Empresas"** ni selector de organización

**Características destacadas:**
- Sistema de invitaciones por magic links (método principal)
- Método alternativo de creación directa con credenciales temporales
- Gestión de estados de usuario (Activo, Suspendido)
- Generación automática de credenciales (método directo)
- Emails automáticos con magic links
- Filtros por estado y búsqueda avanzada

### 8. Reconciliation (Conciliación)
**Ruta:** `/financials`  
**Archivo:** `src/pages/Reconciliation.tsx`

Conciliación financiera (en desarrollo)

### 9. Alerts (Alertas)
**Ruta:** `/alerts`  
**Archivo:** `src/pages/Alerts.tsx`

Sistema de alertas (en desarrollo)

---

## ⚙️ Configuración de Entorno

### Variables de Entorno

Archivo `.env` (no versionado):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### Configuración de Vite

`vite.config.ts`:
- Path alias `@/*` → `./src/*`
- Puerto: 3000
- Build output: `build/`

### TypeScript

`tsconfig.json`:
- Target: ES2020
- Strict mode: activado
- Path mapping: `@/*` → `./src/*`

---

## 🚀 Comandos Útiles

### Desarrollo
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build
```

### Estructura de Carpetas
```bash
# Ver estructura
tree src/ -I node_modules
```

---

## 🔧 Convenciones de Código

### Nomenclatura

- **Componentes:** PascalCase (`VehicleDetail.tsx`)
- **Archivos:** PascalCase para componentes, camelCase para utilidades
- **Variables/Funciones:** camelCase (`getAllVehicles`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Tipos/Interfaces:** PascalCase (`Vehicle`, `VehicleInsert`)

### Estructura de Archivos

```typescript
// 1. Imports (React, librerías, componentes)
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

// 2. Tipos e interfaces
interface Props {
  id: string
}

// 3. Componente
export function Component({ id }: Props) {
  // 4. Hooks
  const [state, setState] = useState()
  
  // 5. Handlers
  const handleClick = () => {}
  
  // 6. Render
  return <div>...</div>
}
```

### Formato

- 2 espacios de indentación
- Punto y coma al final
- Comillas simples para strings (preferido)
- Tailwind CSS para estilos (no CSS modules)

---

## 🐛 Problemas Comunes y Soluciones

### 1. Error de Variables de Entorno
**Problema:** `Missing Supabase environment variables`  
**Solución:** Verificar que `.env` existe y tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

### 2. Error de Autenticación
**Problema:** Usuario no puede iniciar sesión  
**Solución:** Verificar que Supabase Auth está configurado y el usuario existe

### 3. Error de Permisos RLS
**Problema:** No se pueden leer/escribir datos  
**Solución:** Verificar políticas de Row Level Security en Supabase

### 4. Error de Tipos TypeScript
**Problema:** Tipos no coinciden  
**Solución:** Regenerar tipos desde Supabase: `npx supabase gen types typescript`

---

## 📚 Recursos y Referencias

### Documentación Externa
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [Supabase](https://supabase.com/docs)
- [Radix UI](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://zustand-demo.pmnd.rs)
- [React Router](https://reactrouter.com)

### Documentación Interna
- [`README.md`](./README.md) - Índice de documentación
- [`project-status.md`](./project-status.md) - Estado del proyecto
- [`business/organizations-users.md`](./business/organizations-users.md) - Gestión de usuarios y organizaciones
- [`frontend/architecture.md`](./frontend/architecture.md) - Arquitectura frontend
- [`supabase/architecture.md`](./supabase/architecture.md) - Arquitectura Supabase

---

## 🎯 Flujos de Negocio Importantes

### Flujo de Despacho
1. Usuario crea orden de despacho
2. Orden aparece en lista de "Unassigned"
3. Usuario arrastra orden a vehículo (Drag & Drop)
4. Sistema asigna orden al vehículo
5. Orden cambia de estado a "ASSIGNED"
6. Se puede monitorear en Control Tower

### Flujo de Gestión de Flota
1. Usuario crea transportista
2. Asocia vehículos, conductores, remolques
3. Configura equipos de refrigeración (pueden estar en vehículos rígidos o remolques)
4. Crea fleet sets (vehículo + remolque opcional para vehículos rígidos)
5. Asigna conductores a vehículos
6. Todo queda asociado a la organización

### Flujo de Autenticación
1. Usuario inicia sesión
2. Sistema verifica credenciales
3. Si es platform admin, puede seleccionar organización
4. Si es miembro regular, carga su organización
5. Usuario accede a funcionalidades según su rol

---

## 🔄 Integraciones Externas

### Supabase
- **Autenticación** - Supabase Auth
- **Base de Datos** - PostgreSQL
- **Storage** - (si se usa en el futuro)
- **Real-time** - (si se implementa)

### MapLibre GL
- **Mapas** - Visualización de ubicaciones
- **Geocoding** - (si se implementa)

---

## 📝 Notas Importantes

1. **Multi-organización:** El sistema soporta múltiples organizaciones con aislamiento de datos
2. **Platform Admins:** Solo DEV y PLATFORM_ADMIN pueden crear organizaciones y cambiar entre ellas usando `localStorage`
3. **Creación de organizaciones:** Las organizaciones se crean sin usuarios. El primer OWNER se crea después desde la sección "Usuarios"
4. **Invitaciones:** El sistema utiliza magic links (método principal), no códigos manuales
5. **Roles dobles:** Prohibidos - DEV/PLATFORM_ADMIN no pueden ser miembros de organizaciones
6. **Modificación de roles:** Nadie puede modificar su propio rol
7. **Row Level Security:** Todas las queries deben incluir `org_id` para seguridad. Evitar recursiones usando SECURITY DEFINER
8. **Prohibición de triggers:** Toda lógica de negocio se implementa mediante Edge Functions o servicios
9. **Tipos TypeScript:** Se generan desde Supabase, no editar manualmente
10. **Estado Global:** Usar Zustand solo para estado compartido, `useState` para local

---

**Última actualización:** Enero 2025

