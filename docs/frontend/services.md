# 🔌 Servicios y API - Frontend

Este documento describe el sistema de servicios, comunicación con Supabase, y patrones de API en ColdSync TMS basado en el esquema real de base de datos.

---

## 📋 Tabla de Contenidos

1. [Arquitectura de Servicios](#arquitectura-de-servicios)
2. [Patrón de Servicios](#patrón-de-servicios)
3. [Servicios Disponibles](#servicios-disponibles)
4. [Uso de Servicios](#uso-de-servicios)
5. [Manejo de Errores](#manejo-de-errores)
6. [Filtros y Queries](#filtros-y-queries)
7. [Mejores Prácticas](#mejores-prácticas)

---

## 🏗️ Arquitectura de Servicios

### Estructura Organizada por Categorías

Los servicios están organizados en `src/services/` por categorías:

```
services/
├── database/                   # Servicios CRUD (Supabase)
│   ├── index.ts               # Exportaciones de base de datos
│   ├── auth.service.ts        # Autenticación y sesiones
│   ├── carriers.service.ts    # Transportistas
│   ├── drivers.service.ts     # Conductores
│   ├── vehicles.service.ts    # Vehículos
│   ├── trailers.service.ts    # Remolques
│   ├── fleetSets.service.ts   # Conjuntos de flota
│   ├── products.service.ts    # Productos
│   ├── thermalProfiles.service.ts # Perfiles térmicos
│   ├── locations.service.ts   # Ubicaciones
│   ├── routes.service.ts      # Rutas
│   ├── dispatchOrders.service.ts # Órdenes de despacho
│   ├── hardware.service.ts    # Hardware y Catálogo Flespi
│   ├── organizations.service.ts # Organizaciones
│   ├── organization_members.service.ts # Miembros
│   └── seed.ts               # Utilidades de datos de prueba
│
├── external/                  # APIs externas (futuro)
│   └── index.ts              # Flespi, Google Maps, etc.
│
├── communications/            # Servicios de comunicación (futuro)
│   └── index.ts              # Notificaciones, SMS, etc.
│
├── storage/                   # Archivos y documentos (futuro)
│   └── index.ts              # Supabase Storage, uploads
│
└── index.ts                   # Export principal por categorías
```

### Cliente Supabase

Todos los servicios usan el cliente Supabase configurado en `src/lib/supabase.ts`:

```typescript
import { supabase } from '../../lib/supabase';
```

---

## 📐 Patrón de Servicios

### Estructura Estándar

Cada servicio sigue este patrón:

```typescript
import { supabase } from '../lib/supabase';
import type {
  Entity,
  EntityInsert,
  EntityUpdate,
} from '../types/database.types';

/**
 * Entity Service - CRUD operations for entities table
 */
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
      // PGRST116 = no rows returned
      if (error.code === 'PGRST116') return null;
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

### Características Clave

1. **Siempre incluir `org_id`** - Para seguridad y aislamiento de datos
2. **Tipos TypeScript** - Usar tipos generados de Supabase
3. **Manejo de errores** - Lanzar errores para que el componente los maneje
4. **Retornar arrays vacíos** - En lugar de `null` para `getAll`
5. **Retornar `null`** - Para `getById` cuando no existe

---

## 📦 Servicios Disponibles

### 1. Carriers Service

Gestión de transportistas con tipos OWNER y THIRD PARTY:

```typescript
import { carriersService } from '../services/database';

// Obtener todos los transportistas con relaciones
const carriers = await carriersService.getAll(orgId);

// Obtener por ID con miembros, conductores, vehículos y remolques
const carrier = await carriersService.getById(carrierId, orgId);

// Crear transportista
const newCarrier = await carriersService.create({
  carrier_id: 'CAR-001',
  commercial_name: 'FríoExpress Bolivia',
  legal_name: 'Transporte Refrigerado FríoExpress S.A.',
  carrier_type: 'OWNER', // o 'THIRD PARTY'
  tax_id: '1234567890',
  legal_representative: 'Carlos Mendoza García',
  country: 'Bolivia',
  city: 'Santa Cruz',
  fiscal_address: 'Av. Cristo Redentor #1500',
  contact_name: 'María López',
  contact_phone: '+591 70123456',
  contact_email: 'operaciones@frioexpress.bo',
  ops_phone_24_7: '+591 70123457',
  finance_email: 'finanzas@frioexpress.bo',
  payment_terms: 30,
  currency: 'USD',
}, orgId);
```

### 2. Vehicles Service

Gestión de vehículos vinculados a transportistas:

```typescript
import { vehiclesService } from '../services/database';

// Obtener todos los vehículos
const vehicles = await vehiclesService.getAll(orgId);

// Obtener vehículos de un transportista específico
const carrierVehicles = await vehiclesService.getAll(orgId, { carrierId: 123 });

// Crear vehículo
const vehicle = await vehiclesService.create({
  vehicle_code: 'VEH-001',
  unit_code: 'UNIT-001',
  vehicle_type: 'Tractocamión',
  plate: 'ABC-123',
  brand: 'Mercedes-Benz',
  model: 'Actros',
  year: 2023,
  vin: 'WDB9634321L123456',
  odometer_value: 50000,
  odometer_unit: 'km',
  additional_info: 'Vehículo para carga refrigerada',
  operational_status: 'ACTIVE',
  carrier_id: carrierId,
}, orgId);
```

### 3. Drivers Service

Gestión de conductores con estados y nacionalidad:

```typescript
import { driversService } from '../services/database';

// Obtener todos los conductores
const drivers = await driversService.getAll(orgId);

// Obtener conductores disponibles de un transportista
const availableDrivers = await driversService.getAll(orgId, { 
  carrierId: 123, 
  status: 'AVAILABLE' 
});

// Crear conductor
const driver = await driversService.create({
  driver_id: 'DRV-001',
  name: 'Juan Carlos Pérez',
  license_number: 'LIC-123456',
  phone_number: '+591 70123456',
  email: 'juan.perez@frioexpress.bo',
  birth_date: '1985-03-15',
  nationality: boliviaCountryId,
  address: 'Calle Comercio #789',
  city: 'Santa Cruz',
  status: 'AVAILABLE',
  contract_date: '2023-01-15',
  carrier_id: carrierId,
}, orgId);
```

### 4. Thermal Profiles Service

Gestión de perfiles térmicos para productos:

```typescript
import { thermalProfilesService } from '../services/database';

// Obtener todos los perfiles térmicos
const profiles = await thermalProfilesService.getAll(orgId);

// Crear perfil térmico
const profile = await thermalProfilesService.create({
  name: 'Congelado Profundo',
  description: 'Para productos que requieren congelación profunda',
  temp_min_c: -25,
  temp_max_c: -18,
}, orgId);
```

### 5. Products Service

Gestión de productos con perfiles térmicos:

```typescript
import { productsService } from '../services/database';

// Obtener productos con perfiles térmicos
const products = await productsService.getAllWithThermalProfiles(orgId);

// Crear producto y vincular perfiles térmicos
const product = await productsService.create({
  name: 'Helados Premium',
  description: 'Helados artesanales de alta calidad',
}, orgId);

// Vincular producto a perfiles térmicos
await productsService.linkThermalProfiles(product.id, [profileId1, profileId2], orgId);
```

### 6. Locations Service

Gestión de ubicaciones con geofencing:

```typescript
import { locationsService } from '../services/database';

// Obtener todas las ubicaciones con tipos
const locations = await locationsService.getAll(orgId);

// Crear ubicación con geofencing circular
const location = await locationsService.create({
  name: 'CD Santa Cruz Norte',
  code: 'CDSCN-001',
  city: 'Santa Cruz',
  address: 'Parque Industrial Norte, Lote 100',
  type_location_id: locationTypeId,
  num_docks: 12,
  geofence_type: 'circular',
  geofence_data: {
    radius: 100,
    center: { lat: -17.78, lng: -63.18 }
  },
  country_id: boliviaCountryId,
}, orgId);
```

### 7. Dispatch Orders Service

Gestión de órdenes de despacho con items y paradas:

```typescript
import { dispatchOrdersService } from '../services/database';

// Obtener órdenes por estado
const unassigned = await dispatchOrdersService.getByStatus(orgId, 'UNASSIGNED');

// Crear orden de despacho completa
const order = await dispatchOrdersService.createWithItemsAndStops({
  dispatch_number: 'ORD-001',
  status: 'UNASSIGNED',
  planned_start_at: new Date('2024-01-15T08:00:00Z'),
  planned_end_at: new Date('2024-01-15T18:00:00Z'),
  items: [
    {
      product_id: productId,
      item_name: 'Helados Premium',
      quantity: 100,
      unit: 'cajas',
    }
  ],
  stops: [
    {
      stop_order: 1,
      stop_type: 'PICKUP',
      location_id: originLocationId,
    },
    {
      stop_order: 2,
      stop_type: 'DELIVERY',
      location_id: destinationLocationId,
    }
  ]
}, orgId);

// Asignar orden a conjunto de flota
await dispatchOrdersService.assignToFleetSet(orderId, fleetSetId, orgId);
```

### 8. Fleet Sets Service

Gestión de conjuntos de flota (transportista + conductor + vehículo + remolque):

```typescript
import { fleetSetsService } from '../services/database';

// Obtener conjuntos activos
const activeSets = await fleetSetsService.getActive(orgId);

// Crear conjunto de flota
const fleetSet = await fleetSetsService.create({
  carrier_id: carrierId,
  driver_id: driverId,
  vehicle_id: vehicleId,
  trailer_id: trailerId,
  starts_at: new Date(),
  notes: 'Conjunto para ruta Santa Cruz - La Paz',
}, orgId);

// Finalizar conjunto
await fleetSetsService.end(fleetSetId, orgId);
```

### 9. Hardware Service

Gestión de inventario de dispositivos y catálogo global de Flespi:

```typescript
import { hardwareService } from '../services/database';

// Obtener protocolos (marcas) habilitados
const protocols = await hardwareService.getProtocols();

// Obtener modelos de un protocolo
const models = await hardwareService.getDeviceTypes(protocolId);

// Buscar nuevas marcas directamente en Flespi (Proxy a Edge Function)
const results = await hardwareService.searchFlespiProtocols('teltonika');

// Sincronizar modelos de una marca (Proxy a Edge Function)
await hardwareService.syncFlespiProtocol(protocolId);

// Crear dispositivo de conexión (ident = IMEI/Serial)
const device = await hardwareService.create({
  ident: '864205040...',
  flespi_device_type_id: 302, // FMB202
  carrier_id: 123,
  tracked_entity_type: 'VEHICLE',
  assigned_entity_id: vehicleId,
}, orgId);
```


---

## 💻 Uso de Servicios

### En Componentes

```typescript
import { useState, useEffect } from 'react';
import { carriersService } from '../services/database';
import type { Carrier } from '../types/database.types';

function CarrierList({ orgId }: Props) {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarriers();
  }, [orgId]);

  const loadCarriers = async () => {
    try {
      setLoading(true);
      const data = await carriersService.getAll(orgId);
      setCarriers(data);
    } catch (error) {
      console.error('Error loading carriers:', error);
      toast.error('Error al cargar transportistas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {carriers.map(carrier => (
        <div key={carrier.id}>
          <h3>{carrier.commercial_name}</h3>
          <p>{carrier.carrier_type}</p>
          <p>{carrier.contact_email}</p>
        </div>
      ))}
    </div>
  );
}
```

### Con Custom Hooks

```typescript
// hooks/useCarriers.ts
import { useState, useEffect } from 'react';
import { carriersService } from '../services/database';
import type { Carrier } from '../types/database.types';

export function useCarriers(orgId: string, filters?: { type?: 'OWNER' | 'THIRD PARTY' }) {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadCarriers();
  }, [orgId, filters]);

  const loadCarriers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await carriersService.getAll(orgId);
      
      // Filtrar por tipo si se especifica
      const filteredData = filters?.type 
        ? data.filter(c => c.carrier_type === filters.type)
        : data;
        
      setCarriers(filteredData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadCarriers();
  };

  return { carriers, loading, error, refresh };
}

// Uso en componente
function CarrierList({ orgId }: Props) {
  const { carriers, loading, error, refresh } = useCarriers(orgId, { type: 'OWNER' });

  if (loading) return <div>Cargando transportistas...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refrescar</button>
      {carriers.map(carrier => (
        <div key={carrier.id}>
          {carrier.commercial_name} ({carrier.carrier_type})
        </div>
      ))}
    </div>
  );
}
```

---

## ⚠️ Manejo de Errores

### Estrategia de Errores

Los servicios **lanzan errores** para que los componentes los manejen:

```typescript
// En el servicio
async getById(id: string, orgId: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw error; // Otro error
  }
  return data;
}
```

### Manejo en Componentes

```typescript
const loadVehicle = async () => {
  try {
    setLoading(true);
    const vehicle = await vehiclesService.getById(id, orgId);
    if (!vehicle) {
      toast.error('Vehículo no encontrado');
      return;
    }
    setVehicle(vehicle);
  } catch (error) {
    console.error('Error loading vehicle:', error);
    toast.error('Error al cargar vehículo');
  } finally {
    setLoading(false);
  }
};
```

### Tipos de Errores Comunes

```typescript
// Error de red
if (error.message.includes('fetch')) {
  toast.error('Error de conexión');
}

// Error de permisos (RLS)
if (error.code === '42501') {
  toast.error('No tienes permisos para esta acción');
}

// Error de validación
if (error.code === '23505') { // Unique violation
  toast.error('Este código ya existe');
}
```

---

## 🔍 Filtros y Queries

### Filtros Básicos

```typescript
// En el servicio
async getAll(orgId: string, filters?: {
  carrierId?: number;
  status?: string;
  search?: string;
}): Promise<Vehicle[]> {
  let query = supabase
    .from('vehicles')
    .select('*')
    .eq('org_id', orgId);

  if (filters?.carrierId != null) {
    query = query.eq('carrier_id', filters.carrierId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.ilike('vehicle_code', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
```

### Ordenamiento

```typescript
// Ordenar por código ascendente
const { data } = await supabase
  .from('vehicles')
  .select('*')
  .eq('org_id', orgId)
  .order('vehicle_code', { ascending: true });

// Ordenar por fecha descendente
.order('created_at', { ascending: false });
```

### Paginación

```typescript
// Paginación básica
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

### Joins y Relaciones

```typescript
// Obtener vehículos con transportista
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

---

## ✅ Mejores Prácticas

### 1. Siempre Incluir org_id

```typescript
// ✅ Bueno
async getAll(orgId: string): Promise<Entity[]> {
  const { data } = await supabase
    .from('entities')
    .select('*')
    .eq('org_id', orgId); // Siempre filtrar por organización
}

// ❌ Malo
async getAll(): Promise<Entity[]> {
  const { data } = await supabase
    .from('entities')
    .select('*'); // Sin filtro de organización
}
```

### 2. Usar Tipos Generados

```typescript
// ✅ Bueno
import type { Vehicle, VehicleInsert, VehicleUpdate } from '@/types/database.types';

// ❌ Malo
interface Vehicle {
  id: string;
  // ... definir manualmente
}
```

### 3. Manejar Errores Consistentemente

```typescript
// ✅ Bueno
if (error) {
  if (error.code === 'PGRST116') return null;
  throw error;
}

// ❌ Malo
if (error) {
  console.error(error);
  return null; // Oculta errores importantes
}
```

### 4. Retornar Arrays Vacíos

```typescript
// ✅ Bueno
return data ?? [];

// ❌ Malo
return data; // Puede ser null
```

### 5. Documentar Servicios

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

### 6. Evitar Lógica de Negocio en Servicios

```typescript
// ✅ Bueno - Servicio solo hace CRUD
async create(data: VehicleInsert, orgId: string): Promise<Vehicle> {
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .insert({ ...data, org_id: orgId })
    .select()
    .single();
  
  if (error) throw error;
  return vehicle;
}

// ❌ Malo - Lógica de negocio en servicio
async create(data: VehicleInsert, orgId: string): Promise<Vehicle> {
  // Validar código único
  // Enviar notificación
  // Actualizar otros registros
  // ... demasiada lógica
}
```

---

## 🔗 Referencias

- [Arquitectura Frontend](./architecture.md)
- [Convenciones de Código](./conventions.md)
- [Gestión de Estado](./state-management.md)
- [Supabase Architecture](../supabase/architecture.md)
- [Supabase Documentation](https://supabase.com/docs)

---

**Última actualización:** Diciembre 2024

