# ColdSync TMS - Reglas de Código para IA

Eres un experto en TypeScript, React 18, Vite, Tailwind CSS, Shadcn UI, Radix UI, Zustand y Supabase.

## Contexto del Proyecto

ColdSync es un TMS (Transportation Management System) especializado en logística de cadena de frío para transporte de media y larga distancia. La plataforma orquesta operaciones entre Shippers (generadores de carga) y Carriers (transportistas).

## Módulos Principales

- **Despacho (Dispatch):** Gestión de demanda, planificación, asignación y preparación de carga
- **Ejecución (Execution):** Seguimiento de viajes, gestión de eventos, cumplimiento térmico y ETA
- **Conciliación (Reconciliation):** Auditoría post-viaje, validación de documentos, deducciones, disputas y autorización de facturación
- **Torre de Control (Control Tower):** Monitoreo de flota en tiempo real con telemetría IoT

## Estilo y Estructura de Código

### Principios Generales

- Escribe código TypeScript conciso y técnico con ejemplos precisos
- Usa patrones funcionales y declarativos; evita clases
- Prefiere iteración y modularización sobre duplicación de código
- Usa nombres de variables descriptivos con verbos auxiliares (ej: `isLoading`, `hasError`, `canSubmit`)
- Mantén componentes bajo 200-300 líneas; refactoriza si se excede

### Estructura de Archivos

- Organiza archivos: componente exportado, subcomponentes, helpers, contenido estático, tipos
- **SIEMPRE revisar la estructura existente** antes de crear carpetas nuevas
- **Preguntar sobre ubicaciones** cuando no esté claro dónde va un archivo
- **Usar las convenciones** ya establecidas en el proyecto
- Estructura por módulos de features siguiendo el patrón existente:
  ```
  src/
  ├── features/
  │   ├── dispatch/
  │   ├── execution/
  │   ├── reconciliation/
  │   └── control_tower/
  ├── components/     # Componentes UI compartidos
  ├── services/       # Servicios organizados por categorías
  │   ├── database/   # Servicios CRUD (Supabase)
  │   ├── external/   # APIs externas (Flespi, Google Maps)
  │   ├── communications/ # Notificaciones, SMS, llamadas
  │   └── storage/    # Manejo de archivos y documentos
  ├── stores/         # Stores de Zustand
  └── lib/            # Utilidades y helpers
  ```

#### Reglas de Organización de Archivos

**ANTES de crear cualquier archivo o carpeta:**

1. **🔍 Revisar estructura existente**
   - Usar `listDirectory` para explorar carpetas relacionadas
   - Verificar si ya existe una ubicación apropiada
   - Buscar patrones similares en el proyecto

2. **❓ Preguntar cuando hay dudas**
   - Si no está claro dónde va un archivo, preguntar al usuario
   - Proponer opciones basadas en la estructura existente
   - No asumir ubicaciones sin confirmar

3. **📏 Seguir convenciones establecidas**
   - Respetar la nomenclatura existente (camelCase, PascalCase, kebab-case)
   - Mantener la jerarquía de carpetas establecida
   - Usar los mismos patrones de organización

**Ejemplos de buenas prácticas:**
```typescript
// ✅ Bueno - Revisar primero
// 1. Explorar: listDirectory("docs/")
// 2. Encontrar: docs/supabase/ ya existe
// 3. Usar: docs/supabase/schema-overview.md

// ❌ Malo - Crear sin revisar
// 1. Asumir: crear docs/database/
// 2. Resultado: duplicación innecesaria
```

#### Patrones de Estructura para Features

**REGLA**: La estructura dentro de `src/features/[feature-name]/` depende de la complejidad:

**Patrón Simple** (una entidad, componentes relacionados):
```
src/features/profile/
├── ProfileAvatarSection.tsx
├── ProfilePersonalInfoForm.tsx
└── ProfilePasswordForm.tsx
```

**Patrón Complejo** (múltiples entidades, CRUD completo):
```
src/features/settings/
└── entities/
    ├── organizations/
    │   ├── OrganizationsTab.tsx
    │   └── OrganizationDialog.tsx
    └── users/
        ├── UsersTab.tsx
        └── UserDialog.tsx
```

Ver [component-size.rules.md](./component-size.rules.md#patrones-de-estructura-por-tipo-de-feature) para criterios detallados de cuándo usar cada patrón.

### Convenciones de Nomenclatura

- Usa minúsculas con guiones bajos para directorios (ej: `features/control_tower`)
- Usa PascalCase para archivos de componentes (ej: `TripCard.tsx`)
- Usa camelCase para archivos de utilidades (ej: `formatTemperature.ts`)
- Prefiere exports nombrados para componentes
- Prefija hooks personalizados con "use" (ej: `useTripStatus`)

## Uso de TypeScript

- Usa TypeScript para todo el código con modo estricto habilitado
- Prefiere interfaces sobre types para formas de objetos
- Evita enums; usa objetos const o uniones de literales de string en su lugar
- Usa componentes funcionales con interfaces TypeScript
- Define tipos de props inline para componentes pequeños, interfaces separadas para complejos
- Usa esquemas Zod para validación en tiempo de ejecución (formularios, respuestas API)

Ejemplo:
```typescript
// ✅ Good
interface TripCardProps {
  tripId: string;
  status: 'pending' | 'in_transit' | 'completed';
  temperature: number;
}

// ❌ Avoid
enum TripStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit'
}
```

## Sintaxis y Formato

- Usa la palabra clave "function" para funciones puras y utilidades
- Usa arrow functions para definiciones de componentes y callbacks
- Evita llaves innecesarias en condicionales; usa sintaxis concisa
- Usa JSX declarativo
- Prefiere early returns para reducir anidación

Ejemplo:
```typescript
// ✅ Good
function calculateTemperatureDeviation(current: number, target: number) {
  if (!current || !target) return 0;
  return Math.abs(current - target);
}

// ✅ Good - Component
export function TripCard({ tripId, status }: TripCardProps) {
  if (!tripId) return null;
  
  return <div>...</div>;
}
```

## Gestión de Estado

### Zustand (Estado Global)

- Usa Zustand para estado entre features (auth, filtros globales, notificaciones)
- Crea slices para diferentes dominios (trips, telemetría, usuarios)
- Mantén stores enfocados y de responsabilidad única
- Usa selectores para evitar re-renders innecesarios
  - **SIEMPRE** usa selectores específicos: `useAppStore((state) => state.campo)`
  - **PARA múltiples valores**: usa `useShallow` de `zustand/react/shallow`
  - [Ver documentación completa: docs/frontend/state-management.md#zustand-estado-global]

Ejemplo:
```typescript
// stores/tripStore.ts
interface TripStore {
  trips: Trip[];
  selectedTrip: Trip | null;
  setSelectedTrip: (trip: Trip) => void;
}

export const useTripStore = create<TripStore>((set) => ({
  trips: [],
  selectedTrip: null,
  setSelectedTrip: (trip) => set({ selectedTrip: trip }),
}));

// In component - use selector
const selectedTrip = useTripStore((state) => state.selectedTrip);
```

### Estado Local

- Usa useState para estado local del componente
- Usa useReducer para lógica de estado compleja
- Evita prop drilling; usa Zustand o context cuando sea necesario

### ⚠️ REGLA CRÍTICA: Prevención de Re-renders y Recargas Innecesarias

**PRINCIPIO FUNDAMENTAL**: Los datos cargados deben persistir entre navegaciones y no recargarse innecesariamente. Esto aplica a TODA la aplicación, no solo a entidades específicas.

**ANTES de crear un hook personalizado para datos (useXxx hooks):**

1. **¿Los datos se comparten entre múltiples componentes?**
   - ✅ SÍ → **USA ZUSTAND** (estado compartido, evita duplicación)
   - ❌ NO → `useState` local está bien

2. **¿Los datos necesitan persistir entre navegaciones?**
   - ✅ SÍ → **USA ZUSTAND** (evita recargas al volver a la página)
   - ❌ NO → `useState` local está bien

3. **¿El hook se usa en múltiples lugares del código?**
   - ✅ SÍ → **USA ZUSTAND** (una sola fuente de verdad, evita inconsistencias)
   - ❌ NO → `useState` local está bien

**Patrón CORRECTO para hooks de datos compartidos (patrón universal):**
```typescript
// ✅ CORRECTO: Usar Zustand con cacheo inteligente
export function useData(dependency: string) {
  // 1. Usar Zustand store (estado compartido y persistente)
  const data = useAppStore((state) => state.data)
  const isLoading = useAppStore((state) => state.dataLoading)
  const dataLoadedDependency = useAppStore((state) => state.dataLoadedDependency)
  const setData = useAppStore((state) => state.setData)
  const setDataLoading = useAppStore((state) => state.setDataLoading)
  const setDataLoadedDependency = useAppStore((state) => state.setDataLoadedDependency)

  // 2. Función de carga con cacheo inteligente
  const loadData = async (force = false) => {
    if (!dependency) {
      setData([])
      setDataLoadedDependency(null)
      return
    }

    // CACHEO: Solo recargar si la dependencia cambió o se fuerza
    if (!force && dataLoadedDependency === dependency && data.length > 0) {
      return // Ya cargado para esta dependencia, no recargar
    }

    try {
      setDataLoading(true)
      const result = await dataService.getAll(dependency)
      setData(result)
      setDataLoadedDependency(dependency) // Guardar dependencia cargada
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
      setData([])
      setDataLoadedDependency(null)
    } finally {
      setDataLoading(false)
    }
  }

  // 3. Solo cargar si la dependencia cambió o no hay datos
  useEffect(() => {
    if (dependency && (dataLoadedDependency !== dependency || data.length === 0)) {
      loadData()
    } else if (!dependency) {
      setData([])
      setDataLoadedDependency(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependency, dataLoadedDependency, data.length])

  return { data, isLoading, loadData, ... }
}
```

**Patrón INCORRECTO (causa recargas innecesarias y pérdida de estado):**
```typescript
// ❌ INCORRECTO: useState local para datos compartidos
export function useData(dependency: string) {
  const [data, setData] = useState([]) // ❌ Se pierde al desmontar componente
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    loadData() // ❌ Recarga CADA VEZ que se monta, incluso si ya estaba cargado
  }, [dependency])
  
  // ❌ Problemas:
  // - Recarga innecesaria al navegar y volver
  // - Estado se pierde al desmontar
  // - Múltiples instancias del hook = múltiples llamadas API
}
```

**Checklist universal antes de crear un hook de datos:**
- [ ] ¿Los datos se usan en múltiples componentes? → Zustand
- [ ] ¿Los datos deben persistir entre navegaciones? → Zustand
- [ ] ¿Ya existe estado en Zustand para estos datos? → Usar ese estado
- [ ] ¿Implementa cacheo inteligente? → Verificar dependencia cargada antes de recargar
- [ ] ¿Evita recargas innecesarias? → Solo recargar si dependencia cambió o se fuerza
- [ ] ¿Solo se usa en un componente? → `useState` local está bien

**Nota**: `dependency` puede ser cualquier identificador que determine qué datos cargar (orgId, userId, carrierId, etc.). El patrón es universal y aplica a toda la aplicación.

## Formularios y Validación

- Usa **React Hook Form** para todos los formularios.
- Usa **Zod** para validación de esquemas.
  - **VERIFICAR**: Que los schemas de Zod reflejen exactamente los tipos de la base de datos.
  - **CHECKLIST**: Antes de crear un formulario, verificar que todos los campos existen en Supabase.
- Integra Zod con React Hook Form usando `zodResolver`.
- **Para reglas completas de construcción de formularios**: Ver [ai-rules-forms.md](./ai-rules-forms.md) - Incluye árbol de decisión de layouts, patrones de estructura, estilos consistentes y anti-patrones.

## Formularios grandes y UX

- Para formularios extensos, **usa un único formulario (`useForm`) compartido**, aunque la UI esté dividida en:
  - Tabs
  - Steps (wizard)
  - Secciones colapsables
- **No crear múltiples instancias de `useForm`** para un mismo flujo de guardado.
- Utiliza `FormProvider` y `useFormContext` para acceder al formulario desde componentes hijos.

## Tabs y secciones

- Los **tabs solo controlan navegación y visibilidad**, no el estado del formulario.
- Los botones **Guardar / Cancelar** deben ser **únicos y globales** al formulario.
- Evita lógica de guardado por tab.

### ⚠️ REGLA DE REVISIÓN: Formularios con Tabs

**SIEMPRE verificar en revisiones:**
- ✅ ¿Hay un único `useForm` en el componente padre?
- ✅ ¿Los tabs usan `useFormContext()` en lugar de crear su propio `useForm`?
- ✅ ¿Los botones Guardar/Cancelar están en el componente padre, no en los tabs?
- ❌ Si encuentras múltiples `useForm` en tabs → **VIOLACIÓN**: refactorizar a `FormProvider` + `useFormContext`

**Para Detail Views:** Ver [detail-views-pattern.md](./detail-views-pattern.md) para patrón completo con `DetailFooter` y `useFormChanges`.

## Zustand y estado global

- Usa **Zustand solo para estado UI o de contexto**, por ejemplo:
  - Tab activo
  - Modo edición / lectura
  - Flags de navegación
- **No duplicar estado del formulario en Zustand**.
- El estado de los campos vive exclusivamente en React Hook Form.

## Validación y submit

- Define **un único schema Zod** para todo el formulario.
- Permite validación por secciones usando:
  - `trigger(['campo1', 'campo2'])` cuando sea necesario.
- El submit debe manejar **todo el formulario como una unidad lógica**.

## Componentes de formulario

- Crea componentes reutilizables de campos usando:
  - `useFormContext`
  - `Controller` solo cuando el input no es nativo.
- Los componentes **no deben manejar estado local del valor**.

- [Ver documentación completa: docs/frontend/conventions.md#formularios]
- [Ver reglas de construcción de formularios: ai-rules-forms.md](./ai-rules-forms.md)

### Validaciones Específicas del Esquema

Basado en el esquema de base de datos, usa estas validaciones:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Ejemplo: Formulario de Transportista
const carrierSchema = z.object({
  carrier_id: z.string().min(1, 'ID de transportista requerido'),
  commercial_name: z.string().min(1, 'Nombre comercial requerido'),
  legal_name: z.string().min(1, 'Razón social requerida'),
  carrier_type: z.enum(['OWNER', 'THIRD PARTY']),
  tax_id: z.string().min(1, 'NIT/RUC requerido'),
  legal_representative: z.string().min(1, 'Representante legal requerido'),
  country: z.string().min(1, 'País requerido'),
  city: z.string().min(1, 'Ciudad requerida'),
  fiscal_address: z.string().min(1, 'Dirección fiscal requerida'),
  contact_name: z.string().min(1, 'Nombre de contacto requerido'),
  contact_phone: z.string().min(1, 'Teléfono de contacto requerido'),
  contact_email: z.string().email('Email inválido'),
  ops_phone_24_7: z.string().min(1, 'Teléfono 24/7 requerido'),
  finance_email: z.string().email('Email de finanzas inválido'),
  payment_terms: z.number().min(1, 'Términos de pago requeridos'),
  currency: z.string().optional(),
});

// Ejemplo: Formulario de Perfil Térmico
const thermalProfileSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  temp_min_c: z.number()
    .min(-50, 'Temperatura mínima no puede ser menor a -50°C')
    .max(50, 'Temperatura mínima no puede ser mayor a 50°C'),
  temp_max_c: z.number()
    .min(-50, 'Temperatura máxima no puede ser menor a -50°C')
    .max(50, 'Temperatura máxima no puede ser mayor a 50°C'),
}).refine((data) => data.temp_min_c < data.temp_max_c, {
  message: "Temperatura mínima debe ser menor que la máxima",
  path: ["temp_max_c"],
});

// Ejemplo: Formulario de Orden de Despacho
const dispatchOrderSchema = z.object({
  dispatch_number: z.string().min(1, 'Número de despacho requerido'),
  status: z.enum(['UNASSIGNED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']),
  carrier_id: z.number().optional(),
  planned_start_at: z.date({ required_error: 'Fecha de inicio requerida' }),
  planned_end_at: z.date({ required_error: 'Fecha de fin requerida' }),
  notes: z.string().optional(),
}).refine((data) => data.planned_start_at < data.planned_end_at, {
  message: "Fecha de inicio debe ser anterior a la fecha de fin",
  path: ["planned_end_at"],
});

type CarrierFormData = z.infer<typeof carrierSchema>;
type ThermalProfileFormData = z.infer<typeof thermalProfileSchema>;
type DispatchOrderFormData = z.infer<typeof dispatchOrderSchema>;
```

## UI y Estilos

### Librería de Componentes

- Usa Shadcn UI y Radix UI para todos los componentes UI
- [ ] ¿Estoy usando componentes `Form*` de shadcn/ui?
- [ ] ¿Estoy aplicando el patrón **Modal Content Stepping** para gestiones dentro de diálogos? (Ver `component-reuse.rules.md`)

### Estilos

- Usa Tailwind CSS para todos los estilos (v4 CSS-First)
- Implementa diseño responsivo con enfoque mobile-first
- Usa utilidades built-in de Tailwind; evita CSS personalizado cuando sea posible
- Sigue la paleta de colores y tokens definidos en `src/styles/globals.css` usando `@theme`
- Usa escala de espaciado consistente (4, 8, 12, 16, 24, 32, etc.)

### Patrones UI Específicos del Dominio

- Visualizaciones de temperatura: Usa codificación de colores (verde/amarillo/rojo) basada en desviación
- Badges de estado: Usa estilos de badge consistentes de Shadcn
- Componentes de timeline: Usa layout vertical para mobile, horizontal para desktop
- Mapas/Seguimiento: Usa lazy loading para componentes de mapas

Ejemplo:
```typescript
// ✅ Good - Temperature with color coding
function TemperatureDisplay({ temp, target }: Props) {
  const deviation = Math.abs(temp - target);
  const colorClass = deviation < 2 ? 'text-green-600' : 
                     deviation < 5 ? 'text-yellow-600' : 
                     'text-red-600';
  
  return <span className={`font-semibold ${colorClass}`}>{temp}°C</span>;
}
```

## Obtención de Datos y Supabase

### Cliente Supabase

- Usa el cliente Supabase configurado desde `src/lib/supabase`
- Implementa manejo de errores apropiado para todas las operaciones de base de datos
- Usa tipos TypeScript generados desde el esquema de Supabase
  - **IMPORTANTE**: Nunca editar manualmente `database.types.ts`
  - **VERIFICAR**: Que todos los campos del formulario existen en la base de datos
  - [Ver documentación completa: docs/supabase/conventions.md#tipos]
- Implementa actualizaciones optimistas para mejor UX

### Patrones de Consulta

- Obtén datos en componentes padre, pásalos como props
- Usa React Query o SWR si agregas capa de caché (actualmente no está en el stack)
- Maneja estados de carga y error consistentemente
- Implementa paginación para datasets grandes
- Siempre usa `.select()` con columnas específicas para reducir el tamaño del payload
- Usa joins de tablas foráneas eficientemente con el operador `!inner` cuando sea necesario
- [Ver documentación completa: docs/supabase/conventions.md#queries]

Ejemplo básico:
```typescript
// ✅ Good - Specific columns, proper error handling
async function fetchTrips(status?: string) {
  try {
    let query = supabase
      .from('trips')
      .select(`
        id,
        status,
        origin,
        destination,
        carrier:carriers(id, name, email),
        shipper:shippers(id, name)
      `);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw error;
  }
}

// ✅ Good - Pagination
async function fetchTripsPaginated(page: number, pageSize: number = 20) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from('trips')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return { data, count };
}
```

### Diseño de Base de Datos y Seguridad

#### Row Level Security (RLS)

**SIEMPRE pregunta antes de crear políticas RLS.** Proporciona contexto sobre:
1. **Nombre de tabla** y su propósito
2. **Roles de usuario** que necesitan acceso (shipper, carrier, admin)
3. **Patrones de acceso:**
   - ¿Qué datos debe ver cada rol?
   - ¿Qué pueden insertar/actualizar/eliminar?
   - ¿Hay restricciones a nivel de fila (ej: carriers solo ven sus propios trips)?
4. **Configuración de Auth:** ¿Usando Supabase Auth o JWT personalizado?

Ejemplo de flujo de conversación:
```
AI: "Necesito crear políticas RLS para la tabla 'trips'. Esto es lo que estoy pensando:
- Shippers solo pueden ver trips donde son el shipper_id
- Carriers pueden ver trips asignados a ellos (carrier_id)
- Admins pueden ver todos los trips
- Todos los roles pueden actualizar trips a los que tienen acceso

¿Debo proceder con estas políticas?"
```

**Mejores Prácticas para RLS:**
- Habilita RLS en TODAS las tablas: `ALTER TABLE trips ENABLE ROW LEVEL SECURITY;`
- Crea políticas separadas para SELECT, INSERT, UPDATE, DELETE
- Usa `auth.uid()` para referenciar el usuario actual
- Usa `auth.jwt() ->> 'role'` para claims de rol personalizados
- Prueba políticas con diferentes contextos de usuario
- Documenta la lógica de políticas en comentarios
- Mantén políticas simples y legibles; la lógica compleja pertenece a funciones

Ejemplo de Estructura de Política RLS:
```sql
-- SELECT policy for shippers
CREATE POLICY "Shippers can view their own trips"
ON trips FOR SELECT
TO authenticated
USING (shipper_id = auth.uid());

-- SELECT policy for carriers
CREATE POLICY "Carriers can view assigned trips"
ON trips FOR SELECT
TO authenticated
USING (carrier_id = auth.uid());

-- UPDATE policy with business logic
CREATE POLICY "Carriers can update trip status"
ON trips FOR UPDATE
TO authenticated
USING (carrier_id = auth.uid())
WITH CHECK (
  carrier_id = auth.uid() AND
  status IN ('in_transit', 'completed')
);
```

#### Database Triggers - NO CREAR

**NUNCA crees triggers de base de datos automáticamente.** En su lugar:
1. **Siempre pregunta primero** si se necesitan triggers
2. **Prefiere lógica de aplicación** en la capa frontend/API
3. **Usa Supabase Functions** (Edge Functions) para lógica de negocio
4. **Usa Database Functions** solo para consultas complejas o transformaciones de datos

**Por qué evitar triggers:**
- Difíciles de depurar y probar
- Pueden causar efectos secundarios inesperados
- Difíciles de versionar
- Impacto en rendimiento
- Hace el codebase menos transparente

**Alternativas a triggers:**
```typescript
// ✅ Good - Handle in application code
async function createTrip(tripData: TripInput) {
  const { data: trip, error } = await supabase
    .from('trips')
    .insert(tripData)
    .select()
    .single();
    
  if (error) throw error;
  
  // Business logic in app code, not trigger
  await sendNotificationToCarrier(trip.carrier_id, trip.id);
  await logTripCreation(trip.id, auth.user.id);
  
  return trip;
}

// ✅ Good - Use Supabase Edge Functions for webhooks
// Deploy to Supabase Functions, not as database trigger
```

#### Database Functions (Funciones Postgres)

**Pregunta antes de crear, pero aceptable para:**
- Consultas complejas difíciles de expresar en el cliente Supabase
- Agregaciones de datos y análisis
- Lógica de consulta reutilizable
- Operaciones críticas de rendimiento

**Mejores prácticas para funciones DB:**
- Manténlas puras y deterministas cuando sea posible
- Retorna tipos apropiados (usa `RETURNS TABLE` o `RETURNS SETOF`)
- Usa `SECURITY DEFINER` con moderación; prefiere `SECURITY INVOKER`
- Documenta parámetros y valores de retorno
- Prefija con nombre del proyecto: `coldsync_calculate_trip_cost`

Ejemplo de función DB aceptable:
```sql
-- ✅ Acceptable - Complex aggregation
CREATE OR REPLACE FUNCTION coldsync_get_carrier_performance(
  carrier_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  total_trips INTEGER,
  on_time_trips INTEGER,
  avg_temperature_deviation NUMERIC
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE actual_arrival <= estimated_arrival)::INTEGER,
    AVG(ABS(actual_temp - target_temp))::NUMERIC
  FROM trips
  WHERE carrier_id = carrier_uuid
    AND completed_at BETWEEN start_date AND end_date;
END;
$ LANGUAGE plpgsql SECURITY INVOKER;
```

### Suscripciones en Tiempo Real

- Usa Supabase real-time para actualizaciones en vivo (telemetría, estado de trip)
- Siempre limpia suscripciones en cleanup de useEffect
- Filtra suscripciones server-side para rendimiento
- Maneja lógica de reconexión elegantemente

Ejemplo:
```typescript
// ✅ Good - Real-time with cleanup
useEffect(() => {
  const channel = supabase
    .channel('trip-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'trips',
        filter: `id=eq.${tripId}`,
      },
      (payload) => {
        setTrip(payload.new as Trip);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [tripId]);
```

### Supabase Storage (para documentos)

- Usa estructura de bucket organizada: `documents/{trip_id}/{document_type}/`
- Establece políticas de bucket apropiadas (RLS para storage)
- Valida tipos y tamaños de archivo en upload
- Genera URLs firmadas para acceso temporal
- Implementa limpieza apropiada para registros eliminados

Ejemplo:
```typescript
// ✅ Good - Document upload with validation
async function uploadTripDocument(
  tripId: string,
  file: File,
  documentType: 'pod' | 'cmr' | 'invoice'
) {
  // Validate
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }
  
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  // Upload
  const filePath = `${tripId}/${documentType}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file);
    
  if (error) throw error;
  
  // Save reference in database
  await supabase.from('trip_documents').insert({
    trip_id: tripId,
    document_type: documentType,
    storage_path: filePath,
  });
  
  return data;
}
```

## Optimización de Rendimiento

- Usa React.memo() para items de lista costosos
- Implementa virtualización para listas largas (trips, eventos)
- Lazy load módulos de features con React.lazy()
- Optimiza imágenes: usa formato WebP, incluye datos de tamaño, implementa lazy loading
- Debounce inputs de búsqueda y filtros
- Usa keys apropiadas en listas (prefiere IDs sobre índices)

## IoT y Datos en Tiempo Real (Flespi)

- Maneja datos de telemetría asincrónicamente
- Implementa limpieza apropiada de WebSocket
- Cachea datos de telemetría apropiadamente
- Muestra estados de carga durante refresh de datos
- Maneja pérdida de conexión elegantemente

## Manejo de Errores

- Usa try-catch para operaciones async
- Muestra mensajes de error amigables al usuario
- Registra errores en consola en desarrollo
- Usa notificaciones toast para feedback del usuario
- Implementa error boundaries para secciones críticas

Ejemplo:
```typescript
// ✅ Good
try {
  await updateTripStatus(tripId, newStatus);
  toast.success('Trip status updated successfully');
} catch (error) {
  console.error('Failed to update trip:', error);
  toast.error('Failed to update trip status. Please try again.');
}
```

## Routing

- Usa patrones de React Router v7
- Define rutas en `src/routes/`
- Usa rutas anidadas para módulos de features
- Implementa route guards para autenticación
- Usa parámetros de URL para IDs de entidades

## Testing (Futuro)

- Escribe tests unitarios para utilidades y helpers
- Escribe tests de integración para flujos críticos
- Prueba validaciones de formularios con esquemas Zod
- Mock llamadas a Supabase en tests

## Servicios y API

### Estructura de Servicios

Organiza servicios por categorías para mejor escalabilidad y mantenimiento:

```
src/services/
├── database/              ← Servicios CRUD (Supabase)
│   ├── auth.service.ts
│   ├── carriers.service.ts
│   ├── dispatchOrders.service.ts
│   ├── drivers.service.ts
│   ├── fleetSets.service.ts
│   ├── locations.service.ts
│   ├── organizations.service.ts
│   ├── organization_members.service.ts
│   ├── products.service.ts
│   ├── routes.service.ts
│   ├── thermalProfiles.service.ts
│   ├── trailers.service.ts
│   ├── users.service.ts
│   ├── vehicles.service.ts
│   └── index.ts
│
├── external/              ← APIs externas
│   ├── flespi.service.ts        ← IoT/Telemetría
│   ├── googlemaps.service.ts    ← Mapas y geocoding
│   ├── weather.service.ts       ← APIs del clima
│   └── index.ts
│
├── communications/        ← Servicios de comunicación
│   ├── notifications.service.ts ← Push notifications
│   ├── sms.service.ts          ← SMS provider
│   ├── twilio.service.ts       ← Llamadas/WhatsApp
│   └── index.ts
│
├── storage/              ← Archivos y documentos
│   ├── documents.service.ts    ← Supabase Storage
│   ├── uploads.service.ts      ← File handling
│   └── index.ts
│
└── index.ts              ← Export principal
```

### Patrón de Servicio

### Patrón de Servicio

- **Servicios de Base de Datos** (`src/services/database/`): Operaciones CRUD con Supabase
- **Servicios Externos** (`src/services/external/`): APIs de terceros (Flespi, Google Maps, etc.)
- **Servicios de Comunicación** (`src/services/communications/`): Notificaciones, SMS, llamadas
- **Servicios de Storage** (`src/services/storage/`): Manejo de archivos y documentos
- Cada servicio maneja una entidad específica (ej: `carriersService`, `driversService`)
- Los servicios CRUD siguen un patrón consistente: `getAll`, `getById`, `create`, `update`, `delete`
- Siempre incluye parámetro `orgId` para aislamiento de organización (servicios de base de datos)
- Usa tipos TypeScript del esquema de Supabase (`Entity`, `EntityInsert`, `EntityUpdate`)
- [Ver documentación completa: docs/frontend/services.md]
- [Ver convenciones Supabase: docs/supabase/conventions.md]

### Entidades Principales del Sistema

Basado en el esquema de base de datos actual:

#### **Gestión de Organizaciones**
- `organizations` - Organizaciones del sistema
- `organization_members` - Miembros con roles (OWNER, ADMIN, STAFF, DRIVER)
- `platform_users` - Usuarios administradores de plataforma
- `org_join_codes` - Códigos de invitación para unirse a organizaciones

#### **Gestión de Transportistas y Flota**
- `carriers` - Transportistas (OWNER/THIRD PARTY)
- `carrier_members` - Miembros de transportistas con roles específicos
- `drivers` - Conductores vinculados a transportistas
- `vehicles` - Vehículos con especificaciones técnicas
- `trailers` - Remolques refrigerados
- `trailer_reefer_specs` - Especificaciones de sistemas de refrigeración
- `fleet_sets` - Combinaciones activas de transportista+conductor+vehículo+remolque

#### **Gestión de Productos y Perfiles Térmicos**
- `products` - Catálogo de productos
- `thermal_profile` - Perfiles de temperatura (min/max °C)
- `product_thermal_profiles` - Relación productos-perfiles térmicos

#### **Gestión de Ubicaciones y Rutas**
- `countries` - Países del sistema
- `location_types` - Tipos de ubicación (CD, Frigorífico, Punto de Venta, etc.)
- `locations` - Ubicaciones con geofencing
- `route_types` - Tipos de ruta (Local, Regional, Larga Distancia, etc.)
- `routes` - Rutas con costos y tiempos
- `route_stops` - Paradas de cada ruta

#### **Gestión de Despacho**
- `dispatch_orders` - Órdenes de despacho (incl. `route_id`, `rate_card_id`, `carrier_contract_id`)
- `dispatch_order_items` - Items/productos de cada orden (incl. `thermal_profile_id`)
- `dispatch_order_stop_actuals` - Llegada/salida real por parada de ruta (reemplaza `dispatch_order_stops`)

#### **Módulo Comercial y Geográfico**
- `carrier_contracts` - Contratos por carrier
- `rate_cards` - Tarifarios por contrato + ruta + perfil/servicio
- `rate_tiers` - Escalones de precio por peso
- `dispatch_order_costs` - Costo por orden (1:1)
- `penalty_rules` - Reglas de penalidad por contrato
- `accessorial_charge_types` / `carrier_contract_accessorials` - Catálogo de recargos

#### **Telemetría y Dispositivos IoT**
- `telematics_provider` - Proveedores de telemetría
- `hardware_device` - Dispositivos de hardware
- `connection_device` - Dispositivos conectados (Flespi integration)
- `device_assignments_history` - Historial de asignaciones de dispositivos

#### **Asignación de Transportistas**
- `carrier_allocation_rules` - Reglas de asignación automática
- `carrier_allocation_periods` - Períodos de asignación con métricas
- **Servicios Externos** (`src/services/external/`): APIs de terceros (Flespi, Google Maps, etc.)
- **Servicios de Comunicación** (`src/services/communications/`): Notificaciones, SMS, llamadas
- **Servicios de Storage** (`src/services/storage/`): Manejo de archivos y documentos
- Cada servicio maneja una entidad específica (ej: `vehiclesService`, `carriersService`)
- Los servicios CRUD siguen un patrón consistente: `getAll`, `getById`, `create`, `update`, `delete`
- Siempre incluye parámetro `orgId` para aislamiento de organización (servicios de base de datos)
- Usa tipos TypeScript del esquema de Supabase (`Entity`, `EntityInsert`, `EntityUpdate`)
- [Ver documentación completa: docs/frontend/services.md]
- [Ver convenciones Supabase: docs/supabase/conventions.md]

Ejemplo de servicio de base de datos:
```typescript
// src/services/database/carriers.service.ts
export const carriersService = {
  async getAll(orgId: string): Promise<Carrier[]> {
    const { data, error } = await supabase
      .from('carriers')
      .select(`
        *,
        carrier_members(id, user_id, role),
        drivers(id, name, status),
        vehicles(id, vehicle_code, operational_status),
        trailers(id, code, operational_status)
      `)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('commercial_name', { ascending: true });
    
    if (error) throw error;
    return data ?? [];
  },
  
  async getById(id: number, orgId: string): Promise<Carrier | null> {
    const { data, error } = await supabase
      .from('carriers')
      .select(`
        *,
        carrier_members(id, user_id, role, full_name, email),
        drivers(id, name, status, phone_number),
        vehicles(id, vehicle_code, plate, operational_status),
        trailers(id, code, plate, operational_status)
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },
  
  async create(data: CarrierInsert, orgId: string): Promise<Carrier> {
    const { data: carrier, error } = await supabase
      .from('carriers')
      .insert({ 
        ...data, 
        org_id: orgId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return carrier;
  },

  async update(id: number, orgId: string, updates: CarrierUpdate): Promise<Carrier> {
    const { data, error } = await supabase
      .from('carriers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
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

Ejemplo de servicio externo:
```typescript
// src/services/external/googlemaps.service.ts
export const googlemapsService = {
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    return data.results[0];
  },
  
  async calculateRoute(origin: string, destination: string): Promise<RouteResult> {
    // Implementation for route calculation
  },
};
```

### Imports por Categoría

```typescript
// ✅ Imports organizados por categoría
import { carriersService, vehiclesService } from '../services/database'
import { flespiService, googlemapsService } from '../services/external'
import { smsService, notificationsService } from '../services/communications'
import { documentsService } from '../services/storage'

// ❌ Evitar imports mezclados
import { carriersService, flespiService, smsService } from '../services'
```
```

## Términos Clave del Dominio (Usar consistentemente)

**Reglas de Idioma:** Ver [language.rules.md](./language.rules.md) para convenciones de idioma:
- Código: Inglés (variables, funciones, tipos)
- Comentarios: Inglés
- Documentación: Español (archivos `.md`)
- UI/UX: Español (texto visible al usuario)

**Español (Principal):**
- Viaje (Trip)
- Transportista (Carrier)
- Generador de Carga (Shipper)
- Despacho (Dispatch)
- Conciliación (Reconciliation)
- Torre de Control (Control Tower)

**Técnico:**
- Reefer (contenedor/camión refrigerado)
- Telemetría (Telemetry)
- ETA (Estimated Time of Arrival)
- Compliance térmico (Thermal compliance)

## Patrones Específicos del Proyecto

### Flujo de Estado de Viaje

Sigue las transiciones de estado definidas:
1. Pendiente → En Planificación → Asignado → En Camino → Completado
2. Maneja validaciones y estados UI específicos de estado

### Monitoreo de Temperatura

- Muestra temperaturas actual, mín, máx y objetivo
- Codifica colores basado en umbrales de desviación
- Muestra alertas para valores fuera de rango

### Gestión de Documentos

- Maneja múltiples tipos de documentos (POD, CMR, Invoice)
- Implementa validación de upload
- Muestra estado de documento (pending, approved, rejected)

### Acceso Basado en Roles

- Vista Shipper: Crear demandas, rastrear trips, conciliación
- Vista Carrier: Aceptar asignaciones, actualizar estado, subir documentos
- Vista Admin: Acceso completo, resolución de disputas

## Errores Comunes a Evitar

- ❌ No uses componentes de clase
- ❌ No mutes estado de Zustand directamente
- ❌ No olvides desuscribirte de Supabase real-time
- ❌ No uses estilos inline; usa Tailwind
- ❌ No crees llamadas API duplicadas; centraliza en servicios
- ❌ No hardcodees datos sensibles; usa variables de entorno
- ❌ No olvides estados de carga/error en obtención de datos
- ❌ No sobre-optimices prematuramente; mide primero
- ❌ **No crees carpetas sin revisar la estructura existente**
- ❌ **No asumas ubicaciones de archivos sin confirmar**
- ❌ **No ignores las convenciones establecidas del proyecto**
- ❌ **No uses useState local en hooks de datos compartidos (usa Zustand)**
- ❌ **No recargues datos innecesariamente al navegar (implementa cacheo inteligente)**
- ❌ **No ignores la persistencia de estado entre navegaciones (causa re-renders innecesarios)**

## Checklist de Revisión de Código

Antes de enviar código, asegúrate:
- [ ] TypeScript strict mode pasa sin errores
- [ ] Componentes están bajo 300 líneas
- [ ] No hay console.logs en código de producción
- [ ] Manejo de errores apropiado está implementado
- [ ] Estados de carga se muestran
- [ ] Diseño responsivo funciona en mobile
- [ ] Validación Zod está en su lugar para formularios
- [ ] **Formularios siguen las reglas de [ai-rules-forms.md](./ai-rules-forms.md)**: layout apropiado, estilos consistentes, anchos predecibles
- [ ] **Formularios con tabs: un único `useForm` + `FormProvider`, tabs usan `useFormContext`**
- [ ] **Detail Views: Usa `DetailFooter` component y `useFormChanges` hook** (ver [detail-views-pattern.md](./detail-views-pattern.md))
- [ ] Acciones de Zustand se usan para actualizaciones de estado
- [ ] Consultas de Supabase incluyen manejo de errores
- [ ] Código sigue la estructura de archivos establecida
- [ ] **Se revisó la estructura existente antes de crear archivos/carpetas**
- [ ] **Se respetaron las convenciones de nomenclatura del proyecto**
- [ ] **Hooks de datos (useXxx) usan Zustand si se comparten entre componentes**
- [ ] **Hooks de datos implementan cacheo para evitar recargas innecesarias**

---

## 📚 Documentación Adicional

Para información más detallada sobre arquitectura, convenciones y mejores prácticas, consulta:

- **Arquitectura Frontend**: [docs/frontend/architecture.md](../../docs/frontend/architecture.md)
- **Gestión de Estado**: [docs/frontend/state-management.md](../../docs/frontend/state-management.md)
- **Convenciones de Código**: [docs/frontend/conventions.md](../../docs/frontend/conventions.md)
- **Convenciones Supabase**: [docs/supabase/conventions.md](../../docs/supabase/conventions.md)
- **Patrón de Detail Views**: [.cursor/rules/detail-views-pattern.md](./detail-views-pattern.md) ⭐ **NUEVO**
- **Reglas de Formularios**: [.cursor/rules/ai-rules-forms.md](./ai-rules-forms.md) ⭐ **NUEVO** - Árbol de decisión de layouts, estilos consistentes, anti-patrones
- **Template de Referencia**: [src/templates/EntityDetailTemplate.tsx](../../src/templates/EntityDetailTemplate.tsx) ⭐ **NUEVO**
- **Documentación General**: [docs/README.md](../../docs/README.md)

**Recuerda:** ColdSync TMS es crítico para la misión de logística de cadena de frío. Prioriza confiabilidad, precisión de datos y experiencia de usuario en todas las implementaciones.
