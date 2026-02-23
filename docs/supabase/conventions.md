# 📝 Convenciones Supabase - Backend

Este documento describe las convenciones y mejores prácticas para trabajar con Supabase en ColdSyn TMS.

---

## 📋 Tabla de Contenidos

1. [Queries](#queries)
2. [Servicios](#servicios)
3. [Manejo de Errores](#manejo-de-errores)
4. [Seguridad](#seguridad)
5. [Tipos](#tipos)
6. [Mejores Prácticas](#mejores-prácticas)

---

## 🔍 Queries

### Estructura de Query

```typescript
// ✅ Bueno - Query estructurada y legible
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('org_id', orgId)
  .eq('status', 'ACTIVE')
  .order('vehicle_code', { ascending: true });

// ❌ Malo - Query difícil de leer
const { data, error } = await supabase.from('vehicles').select('*').eq('org_id', orgId).eq('status', 'ACTIVE');
```

### Siempre Incluir org_id

```typescript
// ✅ Correcto - Siempre filtrar por organización
const { data } = await supabase
  .from('vehicles')
  .select('*')
  .eq('org_id', orgId);

// ❌ Incorrecto - Sin filtro de organización (viola seguridad)
const { data } = await supabase
  .from('vehicles')
  .select('*');
```

### Ordenamiento

```typescript
// Ordenar por campo específico
.order('vehicle_code', { ascending: true });

// Ordenar por múltiples campos
.order('status', { ascending: true })
.order('vehicle_code', { ascending: true });
```

### Filtros

```typescript
// Igualdad
.eq('status', 'ACTIVE');

// No igual
.neq('status', 'INACTIVE');

// Mayor que / Menor que
.gt('created_at', '2024-01-01');
.lt('price', 1000);

// Contiene (case-insensitive)
.ilike('name', '%search%');

// En array
.in('status', ['ACTIVE', 'PENDING']);

// Is null / Is not null
.is('deleted_at', null);
.not('deleted_at', 'is', null);
```

### Joins

```typescript
// Join simple
.select(`
  *,
  carriers (
    id,
    commercial_name
  )
`);

// Join anidado
.select(`
  *,
  carriers (
    id,
    commercial_name,
    vehicles (
      id,
      vehicle_code
    )
  )
`);
```

### Paginación

```typescript
const page = 1;
const pageSize = 10;
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;

const { data, error, count } = await supabase
  .from('vehicles')
  .select('*', { count: 'exact' })
  .eq('org_id', orgId)
  .range(from, to);
```

---

## 🔌 Servicios

### Estructura Estándar

```typescript
import { supabase } from '../lib/supabase';
import type { Entity, EntityInsert, EntityUpdate } from '../types/database.types';

export const entityService = {
  /**
   * Get all entities for an organization
   */
  async getAll(orgId: string, filters?: Filters): Promise<Entity[]> {
    let query = supabase
      .from('entities')
      .select('*')
      .eq('org_id', orgId);

    // Aplicar filtros opcionales
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Get a single entity by ID
   */
  async getById(id: string, orgId: string): Promise<Entity | null> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  },

  /**
   * Create a new entity
   */
  async create(data: EntityInsert, orgId: string): Promise<Entity> {
    const { data: entity, error } = await supabase
      .from('entities')
      .insert({ ...data, org_id: orgId })
      .select()
      .single();

    if (error) throw error;
    return entity;
  },

  /**
   * Update an existing entity
   */
  async update(id: string, data: EntityUpdate, orgId: string): Promise<Entity> {
    const { data: entity, error } = await supabase
      .from('entities')
      .update(data)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return entity;
  },

  /**
   * Delete an entity
   */
  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('entities')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
  },
};
```

### Nomenclatura de Métodos

- `getAll()` - Obtener todos
- `getById()` - Obtener por ID
- `getByStatus()` - Obtener por estado
- `getByCarrier()` - Obtener por transportista
- `create()` - Crear
- `update()` - Actualizar
- `delete()` - Eliminar
- `search()` - Buscar

---

## ⚠️ Manejo de Errores

### Códigos de Error Comunes

```typescript
// PGRST116 - No rows returned (para .single())
if (error.code === 'PGRST116') return null;

// 23505 - Unique violation
if (error.code === '23505') {
  throw new Error('Este código ya existe');
}

// 42501 - Insufficient privilege (RLS)
if (error.code === '42501') {
  throw new Error('No tienes permisos para esta acción');
}

// 23503 - Foreign key violation
if (error.code === '23503') {
  throw new Error('Referencia inválida');
}
```

### Estrategia de Manejo

```typescript
// En el servicio - Lanzar errores
async getById(id: string, orgId: string): Promise<Entity | null> {
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error; // Lanzar para que el componente lo maneje
  }
  return data;
}

// En el componente - Manejar errores
try {
  const entity = await entityService.getById(id, orgId);
  if (!entity) {
    toast.error('No encontrado');
    return;
  }
  setEntity(entity);
} catch (error) {
  console.error('Error:', error);
  toast.error('Error al cargar');
}
```

---

## 🔒 Seguridad

### Principios Fundamentales

1. **Siempre incluir `org_id`**
   ```typescript
   // ✅ Correcto
   .eq('org_id', orgId);
   
   // ❌ Incorrecto
   // Sin filtro de organización
   ```

2. **Usar RLS (Row Level Security)**
   - Habilitado por defecto en Supabase
   - Políticas definidas en la base de datos
   - Verificación automática

3. **Validar permisos en frontend**
   ```typescript
   const { organizationMember } = useAuth();
   const canEdit = organizationMember?.role === 'OWNER' || organizationMember?.role === 'ADMIN';
   
   if (!canEdit) {
     return <div>Sin permisos</div>;
   }
   ```

4. **Nunca confiar solo en frontend**
   - RLS es la última línea de defensa
   - Frontend solo para UX
   - Backend siempre valida

### Verificación de org_id

```typescript
// ✅ Correcto - org_id siempre incluido
async create(data: EntityInsert, orgId: string): Promise<Entity> {
  const { data: entity, error } = await supabase
    .from('entities')
    .insert({ ...data, org_id: orgId }) // org_id siempre incluido
    .select()
    .single();
  
  if (error) throw error;
  return entity;
}

// ❌ Incorrecto - org_id puede faltar
async create(data: EntityInsert): Promise<Entity> {
  // ¿De dónde viene org_id? Puede ser undefined
  const { data: entity, error } = await supabase
    .from('entities')
    .insert(data) // org_id puede faltar
    .select()
    .single();
  
  if (error) throw error;
  return entity;
}
```

---

## 📘 Tipos

### Usar Tipos Generados

```typescript
// ✅ Correcto - Tipos generados de Supabase
import type { Vehicle, VehicleInsert, VehicleUpdate } from '@/types/database.types';

// ❌ Incorrecto - Tipos manuales (pueden desincronizarse)
interface Vehicle {
  id: string;
  // ...
}
```

### Tipos para Operaciones

```typescript
// Para leer
const vehicle: Vehicle = await vehiclesService.getById(id, orgId);

// Para crear
const newVehicle: VehicleInsert = {
  vehicle_code: 'V001',
  make: 'Mercedes',
  // ... sin id, created_at, etc.
};

// Para actualizar
const updates: VehicleUpdate = {
  make: 'Mercedes-Benz', // Solo campos a actualizar
  // ... todos opcionales
};
```

### Validación de Tipos

```typescript
// Validar que org_id existe
if (!orgId) {
  throw new Error('orgId is required');
}

// Validar tipos antes de insertar
const vehicleData: VehicleInsert = {
  vehicle_code: data.vehicle_code,
  make: data.make,
  // ...
};

// TypeScript validará en tiempo de compilación
await vehiclesService.create(vehicleData, orgId);
```

---

## ✅ Mejores Prácticas

### 1. Queries Legibles

```typescript
// ✅ Bueno - Legible y estructurado
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('org_id', orgId)
  .eq('status', 'ACTIVE')
  .order('vehicle_code', { ascending: true });

// ❌ Malo - Difícil de leer
const { data, error } = await supabase.from('vehicles').select('*').eq('org_id', orgId).eq('status', 'ACTIVE');
```

### 2. Manejo Consistente de Errores

```typescript
// ✅ Bueno - Manejo consistente
if (error) {
  if (error.code === 'PGRST116') return null;
  throw error;
}

// ❌ Malo - Manejo inconsistente
if (error) {
  console.error(error);
  return null; // Oculta errores importantes
}
```

### 3. Retornar Arrays Vacíos

```typescript
// ✅ Bueno
return data ?? [];

// ❌ Malo
return data; // Puede ser null
```

### 4. Documentar Servicios

```typescript
/**
 * Vehicles Service - CRUD operations for vehicles table
 * 
 * @example
 * const vehicles = await vehiclesService.getAll(orgId);
 * const vehicle = await vehiclesService.getById(id, orgId);
 */
export const vehiclesService = {
  // ...
};
```

### 5. Evitar Queries N+1

```typescript
// ❌ Malo - N+1 queries
const vehicles = await vehiclesService.getAll(orgId);
for (const vehicle of vehicles) {
  const carrier = await carriersService.getById(vehicle.carrier_id, orgId);
  // ...
}

// ✅ Bueno - Una query con join
const { data } = await supabase
  .from('vehicles')
  .select(`
    *,
    carriers (
      id,
      commercial_name
    )
  `)
  .eq('org_id', orgId);
```

### 6. Usar Transacciones cuando sea Necesario

```typescript
// Para operaciones que deben ser atómicas
// Nota: Supabase no soporta transacciones directamente
// Usar funciones de base de datos o manejar en lógica de aplicación
```

---

## 🔗 Referencias

- [Arquitectura Supabase](./architecture.md)
- [Servicios Frontend](../frontend/services.md)
- [Reglas de Base de Datos: .cursor/rules/data-base-rules.md](../../.cursor/rules/data-base-rules.md)
- [Reglas de Implementación: .cursor/rules/ai-rules.md#obtención-de-datos-y-supabase](../../.cursor/rules/ai-rules.md#obtención-de-datos-y-supabase)
- [Documentación Supabase](https://supabase.com/docs)

---

**Última actualización:** Enero 2025

