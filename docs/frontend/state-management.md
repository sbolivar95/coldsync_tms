# 🔄 Gestión de Estado - Frontend

Este documento describe cómo se gestiona el estado en la aplicación ColdSyn TMS, incluyendo Zustand, Context API, y estado local.

---

## 📋 Tabla de Contenidos

1. [Estrategias de Estado](#estrategias-de-estado)
2. [Zustand (Estado Global)](#zustand-estado-global)
3. [Context API](#context-api)
4. [Estado Local (useState)](#estado-local-usestate)
5. [Estado de Formularios](#estado-de-formularios)
6. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Estrategias de Estado

El proyecto usa múltiples estrategias según el alcance del estado:

| Estrategia | Cuándo Usar | Ejemplo |
|------------|-------------|---------|
| **useState** | Estado local a un componente | `isOpen`, `selectedItem` |
| **Zustand** | Estado compartido entre múltiples componentes | `sidebarCollapsed`, `breadcrumbsState` |
| **Context API** | Estado que necesita ser compartido en un árbol | `AuthContext` (usuario, organización) |
| **React Hook Form** | Estado de formularios | Formularios de creación/edición |
| **URL/Query Params** | Estado que debe persistir en la URL | Filtros, paginación |

---

## 🗄️ Zustand (Estado Global)

### Store Principal

El store global está en `src/stores/useAppStore.ts`:

```typescript
import { create } from 'zustand';

interface AppState {
  // Autenticación
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;

  // UI
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;

  // Breadcrumbs dinámicos
  breadcrumbsState: Record<string, BreadcrumbItem[]>;
  setBreadcrumbs: (view: string, breadcrumbs: BreadcrumbItem[]) => void;
  clearBreadcrumbs: (view: string) => void;

  // Reset trigger
  resetTrigger: number;
  incrementResetTrigger: () => void;

  // Tabs activos
  transportistasActiveTab: string;
  setTransportistasActiveTab: (tab: string) => void;
  
  settingsActiveTab: string;
  setSettingsActiveTab: (tab: string) => void;

  // Handlers de creación
  createHandlers: Record<string, () => void>;
  registerCreateHandler: (route: string, handler: () => void) => void;
  triggerCreate: (route: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Estado inicial
  isAuthenticated: true,
  sidebarCollapsed: true,
  breadcrumbsState: {},
  resetTrigger: 0,
  transportistasActiveTab: 'todos',
  settingsActiveTab: 'usuarios',
  createHandlers: {},

  // Actions
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setBreadcrumbs: (view, breadcrumbs) =>
    set((state) => ({
      breadcrumbsState: { ...state.breadcrumbsState, [view]: breadcrumbs },
    })),
  
  clearBreadcrumbs: (view) =>
    set((state) => {
      const newState = { ...state.breadcrumbsState };
      delete newState[view];
      return { breadcrumbsState: newState };
    }),
  
  incrementResetTrigger: () =>
    set((state) => ({ resetTrigger: state.resetTrigger + 1 })),
  
  setTransportistasActiveTab: (tab) => set({ transportistasActiveTab: tab }),
  setSettingsActiveTab: (tab) => set({ settingsActiveTab: tab }),
  
  registerCreateHandler: (route, handler) =>
    set((state) => ({
      createHandlers: { ...state.createHandlers, [route]: handler },
    })),
  
  triggerCreate: (route) => {
    const handler = useAppStore.getState().createHandlers[route];
    if (handler) handler();
  },
}));
```

### Uso del Store

```typescript
// En un componente
import { useAppStore } from '@/stores/useAppStore';

function MyComponent() {
  // Obtener estado y acciones
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  
  // O solo obtener lo que necesitas (mejor performance)
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  
  return (
    <button onClick={toggleSidebar}>
      {sidebarCollapsed ? 'Expandir' : 'Colapsar'}
    </button>
  );
}
```

### Breadcrumbs Dinámicos

El sistema de breadcrumbs permite que cada vista actualice sus breadcrumbs:

```typescript
// En un componente de detalle
import { useAppStore } from '@/stores/useAppStore';
import { useLocation } from 'react-router-dom';

function VehicleDetail({ vehicleId }: Props) {
  const location = useLocation();
  const { setBreadcrumbs } = useAppStore();
  
  useEffect(() => {
    setBreadcrumbs(location.pathname, [
      { label: 'Transportistas', onClick: () => navigate('/carriers') },
      { label: 'Flota', onClick: () => navigate('/carriers?tab=vehiculos') },
      { label: 'Detalle', onClick: () => {} }
    ]);
  }, [vehicleId]);
  
  // ...
}
```

### Reset Trigger

El `resetTrigger` se usa para resetear vistas cuando se navega:

```typescript
// En AppLayout
const { resetTrigger, incrementResetTrigger } = useAppStore();

const handleViewChange = (view: string) => {
  incrementResetTrigger(); // Notifica a todos los componentes
  navigate(view);
};

// En un componente que necesita resetear
const { resetTrigger } = useAppStore();
const prevResetTrigger = useRef(resetTrigger);

useEffect(() => {
  if (resetTrigger !== prevResetTrigger.current) {
    // Resetear estado local
    setSelectedItem(null);
    prevResetTrigger.current = resetTrigger;
  }
}, [resetTrigger]);
```

### Create Handlers

Sistema para registrar handlers de creación por ruta:

```typescript
// En un componente
const { registerCreateHandler } = useAppStore();
const location = useLocation();

useEffect(() => {
  registerCreateHandler(location.pathname, () => {
    // Lógica de creación
    setIsCreating(true);
  });
}, [location.pathname]);

// El botón "Crear" en el Header llama a triggerCreate(location.pathname)
```

---

## 🎭 Context API

### AuthContext

El `AuthContext` (`src/lib/auth-context.tsx`) maneja autenticación y usuario:

```typescript
interface AuthContextType {
  user: User | null;
  organizationMember: OrganizationMember | null;
  platformUser: PlatformUser | null;
  isPlatformAdmin: boolean;
  isOrgMember: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [organizationMember, setOrganizationMember] = useState<OrganizationMember | null>(null);
  // ...
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
```

### Uso del Context

```typescript
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { user, organizationMember, isPlatformAdmin, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!user) return <div>No autenticado</div>;
  
  return (
    <div>
      <p>Usuario: {user.email}</p>
      {organizationMember && (
        <p>Organización: {organizationMember.organization?.comercial_name}</p>
      )}
    </div>
  );
}
```

---

## 📦 Estado Local (useState)

### Cuándo Usar useState

Usa `useState` para estado que:
- Solo afecta a un componente
- No necesita ser compartido
- Es temporal (modales, formularios locales)

### Ejemplo

```typescript
function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // ...
}
```

### Estado Derivado

Usa `useMemo` para estado derivado:

```typescript
const filteredVehicles = useMemo(() => {
  return vehicles.filter(v => v.status === 'ACTIVE');
}, [vehicles]);
```

---

## 📝 Estado de Formularios

### React Hook Form

El proyecto usa React Hook Form para formularios:

```typescript
import { useForm } from 'react-hook-form';
import type { VehicleInsert } from '@/types/database.types';

function VehicleForm({ onSave }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<VehicleInsert>({
    defaultValues: {
      vehicle_code: '',
      make: '',
      model: '',
    },
  });

  const onSubmit = async (data: VehicleInsert) => {
    try {
      const vehicle = await vehiclesService.create(data, orgId);
      onSave?.(vehicle);
      reset();
    } catch (error) {
      console.error('Error creating vehicle:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('vehicle_code', { required: 'Código requerido' })}
      />
      {errors.vehicle_code && (
        <span>{errors.vehicle_code.message}</span>
      )}
      
      <button type="submit" disabled={isSubmitting}>
        Guardar
      </button>
    </form>
  );
}
```

### Validación

```typescript
const {
  register,
  formState: { errors },
} = useForm<VehicleInsert>({
  defaultValues: { /* ... */ },
  resolver: zodResolver(vehicleSchema), // Si usas Zod
});

// O validación manual
register('vehicle_code', {
  required: 'Código es requerido',
  minLength: { value: 3, message: 'Mínimo 3 caracteres' },
  pattern: { value: /^[A-Z0-9]+$/, message: 'Solo mayúsculas y números' },
});
```

---

## ✅ Mejores Prácticas

### 1. Elegir la Estrategia Correcta

- **useState** para estado local
- **Zustand** para estado compartido
- **Context** para estado que necesita ser compartido en un árbol
- **URL** para estado que debe persistir

### 2. Optimización de Re-renders

```typescript
// ✅ Bueno - Solo se suscribe a lo que necesita
const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);

// ❌ Malo - Se suscribe a todo el store
const { sidebarCollapsed } = useAppStore();
```

### 3. Evitar Estado Duplicado

```typescript
// ❌ Malo - Estado duplicado
const [vehicles, setVehicles] = useState([]);
const [activeVehicles, setActiveVehicles] = useState([]);

// ✅ Bueno - Estado derivado
const [vehicles, setVehicles] = useState([]);
const activeVehicles = useMemo(
  () => vehicles.filter(v => v.status === 'ACTIVE'),
  [vehicles]
);
```

### 4. Sincronización con Servidor

```typescript
// Cargar datos al montar
useEffect(() => {
  loadVehicles();
}, [orgId]);

// Refrescar después de mutaciones
const handleCreate = async (data: VehicleInsert) => {
  await vehiclesService.create(data, orgId);
  await loadVehicles(); // Refrescar lista
};
```

### 5. Manejo de Loading y Error

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);

const loadVehicles = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await vehiclesService.getAll(orgId);
    setVehicles(data);
  } catch (err) {
    setError(err as Error);
  } finally {
    setLoading(false);
  }
};
```

---

## 🔗 Referencias

- [Arquitectura Frontend](./architecture.md)
- [Convenciones de Código](./conventions.md)
- [Servicios y API](./services.md)
- [Reglas de Implementación: .cursor/rules/ai-rules.md#gestión-de-estado](../../.cursor/rules/ai-rules.md#gestión-de-estado)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [React Hook Form](https://react-hook-form.com)

---

**Última actualización:** Diciembre 2024

