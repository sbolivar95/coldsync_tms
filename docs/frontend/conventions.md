# 📝 Convenciones de Código - Frontend

Este documento describe las convenciones de código, estándares de estilo y mejores prácticas para el desarrollo frontend en ColdSyn TMS.

---

## 📋 Tabla de Contenidos

1. [Nomenclatura](#nomenclatura)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Formato de Código](#formato-de-código)
4. [TypeScript](#typescript)
5. [React](#react)
6. [Estilos](#estilos)
7. [Imports](#imports)
8. [Comentarios](#comentarios)
9. [Ejemplos](#ejemplos)

---

## 🏷️ Nomenclatura

### Archivos y Carpetas

- **Componentes React:** PascalCase
  - ✅ `VehicleDetail.tsx`
  - ✅ `FleetList.tsx`
  - ❌ `vehicleDetail.tsx`
  - ❌ `fleet-list.tsx`

- **Utilidades y Hooks:** camelCase
  - ✅ `utils.ts`
  - ✅ `useVehicles.ts`
  - ❌ `Utils.ts`
  - ❌ `use-vehicles.ts`

- **Constantes:** UPPER_SNAKE_CASE
  - ✅ `MAX_RETRIES`
  - ✅ `API_BASE_URL`
  - ❌ `maxRetries`
  - ❌ `MaxRetries`

- **Carpetas:** camelCase o kebab-case (consistente)
  - ✅ `features/fleet/`
  - ✅ `components/ui/`
  - ✅ `data-table/` (si se usa kebab-case)

### Variables y Funciones

- **Variables:** camelCase
  ```typescript
  const vehicleList = []
  const isActive = true
  const userData = {}
  ```

- **Funciones:** camelCase con verbo
  ```typescript
  function getVehicles() {}
  function handleSubmit() {}
  function createVehicle() {}
  ```

- **Componentes:** PascalCase
  ```typescript
  function VehicleDetail() {}
  const MyComponent = () => {}
  ```

- **Tipos e Interfaces:** PascalCase
  ```typescript
  interface Vehicle {}
  type VehicleStatus = 'ACTIVE' | 'INACTIVE'
  ```

- **Props:** camelCase
  ```typescript
  interface Props {
    vehicleId: string
    onSave: (data: Vehicle) => void
    isActive?: boolean
  }
  ```

### Constantes

```typescript
// Constantes globales
const MAX_RETRIES = 3
const API_TIMEOUT = 5000

// Constantes de componente
const DEFAULT_PAGE_SIZE = 10
```

---

## 📁 Estructura de Archivos

### Estructura de un Componente

```typescript
// 1. Imports externos (React, librerías)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// 2. Imports internos (componentes, servicios, tipos)
import { Button } from '@/components/ui/Button'
import { vehiclesService } from '@/services'
import type { Vehicle } from '@/types/database.types'

// 3. Tipos e interfaces
interface Props {
  vehicleId: string
  onSave?: (vehicle: Vehicle) => void
}

// 4. Componente
export function VehicleDetail({ vehicleId, onSave }: Props) {
  // 5. Hooks
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 6. Efectos
  useEffect(() => {
    loadVehicle()
  }, [vehicleId])
  
  // 7. Funciones auxiliares
  const loadVehicle = async () => {
    // ...
  }
  
  // 8. Handlers
  const handleSave = () => {
    // ...
  }
  
  // 9. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Organización de Imports

```typescript
// 1. React y hooks
import { useState, useEffect, useCallback } from 'react'

// 2. Librerías externas
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

// 3. Componentes UI
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

// 4. Widgets
import { DataTable } from '@/components/widgets/DataTable'
import { EntityDialog } from '@/components/widgets/EntityDialog'

// 5. Servicios
import { vehiclesService } from '@/services'

// 6. Tipos
import type { Vehicle, VehicleInsert } from '@/types/database.types'

// 7. Utilidades
import { cn } from '@/lib/utils'
```

### Gestión de Entidades (Patrón Manager)

SIEMPRE usa el patrón **Modal Content Stepping** dentro de un `EntityDialog` para gestores de catálogos y sub-entidades. Evita diálogos anidados.

---

## 🎨 Formato de Código

### Indentación

- **2 espacios** (no tabs)
- Configurado en `.editorconfig` o configuración del editor

### Punto y Coma

- **Siempre usar punto y coma** al final de statements
  ```typescript
  const name = 'John';
  function greet() {
    return 'Hello';
  }
  ```

### Comillas

- **Comillas simples** para strings (preferido)
  ```typescript
  const message = 'Hello world';
  const className = 'text-center';
  ```

- **Comillas dobles** para JSX (preferido)
  ```typescript
  <div className="container">
    <p>Hello</p>
  </div>
  ```

### Líneas

- **Máximo 100-120 caracteres** por línea
- Usar múltiples líneas para código largo
  ```typescript
  const result = await vehiclesService.getAll(
    orgId,
    { carrierId: 123, status: 'ACTIVE' }
  );
  ```

### Espaciado

- **1 línea en blanco** entre secciones lógicas
- **Sin líneas en blanco** entre líneas relacionadas
  ```typescript
  // ✅ Bueno
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);
  
  const handleSave = () => {
    // ...
  };
  
  // ❌ Malo
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);
  ```

---

## 📘 TypeScript

### Tipos vs Interfaces

- **Interfaces** para objetos y props de componentes
  ```typescript
  interface Vehicle {
    id: string;
    code: string;
    make: string;
  }
  
  interface Props {
    vehicle: Vehicle;
    onSave: (vehicle: Vehicle) => void;
  }
  ```

- **Types** para uniones, intersecciones y tipos primitivos
  ```typescript
  type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  type VehicleWithDriver = Vehicle & { driver: Driver };
  ```

### Tipado Explícito

- **Siempre tipar** props, parámetros y valores de retorno
  ```typescript
  // ✅ Bueno
  function getVehicle(id: string): Promise<Vehicle | null> {
    return vehiclesService.getById(id, orgId);
  }
  
  // ❌ Malo
  function getVehicle(id) {
    return vehiclesService.getById(id, orgId);
  }
  ```

### Evitar `any`

- **Nunca usar `any`** si es posible
- Usar `unknown` si el tipo es realmente desconocido
  ```typescript
  // ✅ Bueno
  function processData(data: unknown) {
    if (typeof data === 'string') {
      return data.toUpperCase();
    }
  }
  
  // ❌ Malo
  function processData(data: any) {
    return data.toUpperCase();
  }
  ```

### Tipos de Supabase

- **Usar tipos generados** de Supabase
  ```typescript
  import type { Vehicle, VehicleInsert, VehicleUpdate } from '@/types/database.types';
  
  const vehicle: Vehicle = await vehiclesService.getById(id, orgId);
  const newVehicle: VehicleInsert = { code: 'V001', make: 'Mercedes' };
  ```

---

## ⚛️ React

### Componentes Funcionales

- **Siempre usar** componentes funcionales (no clases)
  ```typescript
  // ✅ Bueno
  export function VehicleDetail({ vehicleId }: Props) {
    return <div>...</div>;
  }
  
  // ❌ Malo
  export class VehicleDetail extends React.Component<Props> {
    // ...
  }
  ```

### Hooks

- **Orden estándar de hooks:**
  1. `useState`
  2. `useEffect`
  3. Custom hooks
  4. Otros hooks
  ```typescript
  const [state, setState] = useState();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // ...
  }, []);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  ```

### Props

- **Destructuring** de props en la firma
  ```typescript
  // ✅ Bueno
  function VehicleDetail({ vehicleId, onSave }: Props) {
    // ...
  }
  
  // ❌ Malo
  function VehicleDetail(props: Props) {
    const { vehicleId, onSave } = props;
    // ...
  }
  ```

### Keys en Lists

- **Siempre usar keys** únicas y estables
  ```typescript
  // ✅ Bueno
  {vehicles.map(vehicle => (
    <VehicleCard key={vehicle.id} vehicle={vehicle} />
  ))}
  
  // ❌ Malo
  {vehicles.map((vehicle, index) => (
    <VehicleCard key={index} vehicle={vehicle} />
  ))}
  ```

### Conditional Rendering

- **Usar operadores lógicos** para condiciones simples
  ```typescript
  // ✅ Bueno
  {loading && <Spinner />}
  {error && <ErrorMessage error={error} />}
  {vehicle && <VehicleDetail vehicle={vehicle} />}
  
  // Para condiciones más complejas, usar ternario
  {isEditing ? <EditForm /> : <ViewMode />}
  ```

---

## 🎨 Estilos

### Tailwind CSS

- **Usar Tailwind** para todos los estilos
- **No usar** CSS modules o styled-components
  ```typescript
  // ✅ Bueno
  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
    <h2 className="text-xl font-semibold text-gray-900">Title</h2>
  </div>
  
  // ❌ Malo
  <div className={styles.container}>
    <h2 className={styles.title}>Title</h2>
  </div>
  ```

### Tailwind v4 (CSS-First)
El proyecto utiliza **Tailwind CSS v4** con una filosofía **CSS-First**.
- ✅ NO usar `tailwind.config.js`.
- ✅ Definir tokens y temas en `src/styles/globals.css` usando `@theme`.
- ✅ Usar variables CSS nativas para extender el tema en tiempo de ejecución.

### Clases Condicionales

- **Usar `cn()` utility** para clases condicionales
  ```typescript
  import { cn } from '@/lib/utils';
  
  <div className={cn(
    'base-classes',
    isActive && 'active-classes',
    className // para permitir override
  )}>
  ```

### Responsive Design

- **Mobile-first** approach
  ```typescript
  <div className="
    flex flex-col
    md:flex-row
    lg:gap-4
  ">
  ```

---

## 📦 Imports

### Path Aliases

- **Usar `@/`** para imports desde `src/`
  ```typescript
  // ✅ Bueno
  import { Button } from '@/components/ui/Button';
  import { vehiclesService } from '@/services';
  
  // ❌ Malo
  import { Button } from '../../../components/ui/Button';
  ```

### Imports Absolutos

- **Preferir imports absolutos** sobre relativos
  ```typescript
  // ✅ Bueno
  import { VehicleDetail } from '@/features/fleet/entities/vehicles/VehicleDetail';
  
  // ❌ Malo (si es muy profundo)
  import { VehicleDetail } from '../../../../features/fleet/entities/vehicles/VehicleDetail';
  ```

### Agrupar Imports

- **Agrupar imports** por tipo (ver sección de Estructura de Archivos)

---

## 💬 Comentarios

### Cuándo Comentar

- **Comentar código complejo** o no obvio
- **Documentar funciones públicas** con JSDoc
- **Explicar "por qué"** no "qué"

### Formato

```typescript
/**
 * Obtiene todos los vehículos de una organización.
 * 
 * @param orgId - ID de la organización
 * @param carrierId - ID opcional del transportista para filtrar
 * @returns Promise con array de vehículos
 */
async function getAllVehicles(orgId: string, carrierId?: number): Promise<Vehicle[]> {
  // ...
}

// Comentario inline para lógica compleja
const filtered = vehicles.filter(v => {
  // Excluir vehículos en mantenimiento si no es admin
  if (v.status === 'MAINTENANCE' && !isAdmin) return false;
  return true;
});
```

---

## ✅ Ejemplos

### Componente Completo

```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { vehiclesService } from '@/services';
import type { Vehicle } from '@/types/database.types';

interface Props {
  orgId: string;
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

export function VehicleList({ orgId, onVehicleSelect }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadVehicles();
  }, [orgId]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehiclesService.getAll(orgId);
      setVehicles(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    onVehicleSelect?.(vehicle);
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-2">
      {vehicles.map(vehicle => (
        <div
          key={vehicle.id}
          onClick={() => handleVehicleClick(vehicle)}
          className="p-4 border rounded cursor-pointer hover:bg-gray-50"
        >
          <h3 className="font-semibold">{vehicle.vehicle_code}</h3>
          <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</p>
        </div>
      ))}
    </div>
  );
}
```

### Servicio

```typescript
import { supabase } from '@/lib/supabase';
import type { Vehicle, VehicleInsert, VehicleUpdate } from '@/types/database.types';

export const vehiclesService = {
  async getAll(orgId: string, carrierId?: number): Promise<Vehicle[]> {
    let query = supabase
      .from('vehicles')
      .select('*')
      .eq('org_id', orgId);

    if (carrierId != null) {
      query = query.eq('carrier_id', carrierId);
    }

    const { data, error } = await query.order('vehicle_code', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string, orgId: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async create(data: VehicleInsert, orgId: string): Promise<Vehicle> {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert({ ...data, org_id: orgId })
      .select()
      .single();

    if (error) throw error;
    return vehicle;
  },
};
```

## 🛠️ Estándar: Soft Delete
Para todas las entidades principales, implementa el borrado lógico:
- Cambia `status` a `'Inactive'` en lugar de borrar la fila.
- Los servicios deben exponer un método `softDelete(id, orgId)`.
- La UI debe confirmar que el elemento será marcado como inactivo.

---

## 🎯 Patrones Específicos: Orders Module

### View Swapping Pattern
Usar cambio de vistas en lugar de diálogos anidados:

```typescript
type DrawerView = "general" | "fleet" | "fail_after_accept";
const [currentView, setCurrentView] = useState<DrawerView>("general");

// Render según vista activa
{currentView === "general" && <GeneralView />}
{currentView === "fail_after_accept" && <FailAfterAcceptView />}
```

### Acciones Contextuales
Acciones de tabla y menú contextual según estado de orden:

```typescript
// Pending orders
if (isPending) {
  return <><AcceptAction /><DeclineAction /></>;
}

// Accepted orders
if (isAccepted) {
  return <FailAfterAcceptAction />;
}
```

### Validación Condicional
Textarea solo visible cuando se selecciona "Otro":

```typescript
{selectedReason === "other" && (
  <Textarea
    value={comments}
    onChange={(e) => setComments(e.target.value)}
    required
  />
)}
```

### Constantes de Negocio
Usar constantes centralizadas en `constants.ts`:

```typescript
import { DECLINE_REASONS, ORDER_STATUS } from "../constants";

// Usar en componentes
const reason = DECLINE_REASONS.find(r => r.value === "equipment_failure");
```

Ver [Orders Implementation Guide](./orders-implementation.md) para más detalles.

---

## 🔗 Referencias

- [Arquitectura Frontend](./architecture.md)
- [Gestión de Estado](./state-management.md)
- [Servicios y API](./services.md)
- [Orders Implementation Guide](./orders-implementation.md)
- [Reglas de Base de Datos: .cursor/rules/data-base-rules.md](../../.cursor/rules/data-base-rules.md)
- [Reglas de Implementación: .cursor/rules/ai-rules.md](../../.cursor/rules/ai-rules.md)
- [Contexto Completo](../coldsync-tms-context.md)

---

**Última actualización:** Febrero 2026

