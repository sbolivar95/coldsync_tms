# 🗄️ Arquitectura Supabase - Backend

Este documento describe la arquitectura del backend, base de datos, y sistema de autenticación usando Supabase.

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Configuración](#configuración)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [Autenticación](#autenticación)
6. [Políticas de Seguridad](#políticas-de-seguridad)
7. [Tipos TypeScript](#tipos-typescript)
8. [Reglas de Base de Datos](#reglas-de-base-de-datos)

---

## 🎯 Introducción

ColdSyn TMS usa **Supabase** como Backend as a Service (BaaS), proporcionando:

- **PostgreSQL** - Base de datos relacional
- **Supabase Auth** - Sistema de autenticación
- **Row Level Security (RLS)** - Seguridad a nivel de fila
- **Real-time** - (Pendiente de implementar)
- **Storage** - (Pendiente de implementar)

### Ventajas

- ✅ Desarrollo rápido sin backend tradicional
- ✅ Autenticación lista para usar
- ✅ Seguridad robusta con RLS
- ✅ Escalable y confiable
- ✅ Tipos TypeScript generados automáticamente

---

## ⚙️ Configuración

### Cliente Supabase

El cliente está configurado en `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

### Variables de Entorno

Archivo `.env` (no versionado):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**Obtener credenciales:**
1. Ir a Supabase Dashboard
2. Settings > API
3. Copiar `Project URL` y `anon/public key`

---

## 🗃️ Estructura de Base de Datos

### Tablas Principales

#### Organizaciones y Usuarios

```sql
-- Organizaciones (Shippers - Clientes del SaaS)
organizations
  - id (uuid, PK)
  - comercial_name (text)
  - legal_name (text)
  - base_country_id (bigint, FK -> countries)
  - status (enum: ACTIVE, INACTIVE) - Nota: Los estados obsoletos (SUSPENDED, CANCELED, PAST_DUE) fueron migrados a INACTIVE el 13/01/2026
  - tax_id (text, UNIQUE) – NIT, RUC, etc.
  - fiscal_address (text)
  - billing_email (text)
  - currency (enum: BOB, USD, default 'USD')
  - time_zone (text, default 'America/La_Paz')
  - contact_name (text)
  - contact_phone (text)
  - contact_email (text)
  - plan_type (enum: STARTER, PROFESSIONAL, default 'PROFESSIONAL')
  - created_by (uuid, FK -> auth.users)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Miembros de organización (Usuarios vinculados a organizaciones)
organization_members
  - id (uuid, PK)
  - org_id (uuid, FK -> organizations)
  - user_id (uuid, FK -> auth.users)
  - role (enum: OWNER, ADMIN, STAFF, DRIVER)
  - first_name (text)
  - last_name (text)
  - email (text)
  - phone (text, nullable)
  - created_at (timestamp)

-- Usuarios de plataforma (Administradores del SaaS)
platform_users
  - user_id (uuid, FK -> auth.users, PK)
  - role (enum: DEV, PLATFORM_ADMIN)
  - is_active (boolean)
  - created_at (timestamp)
```

**Nota importante**: 
- Las organizaciones se crean **sin usuarios asociados**. El primer usuario con rol OWNER se crea posteriormente desde la sección "Usuarios".
- Los roles DEV y PLATFORM_ADMIN **no pueden ser miembros** de organizaciones (prohibición de roles dobles).

#### Flota

```sql
-- Transportistas
carriers
  - id (serial, PK)
  - carrier_id (text, unique)
  - commercial_name (text)
  - legal_name (text)
  - carrier_type (enum: OWNER, THIRD PARTY)
  - org_id (uuid, FK -> organizations)
  - ...

-- Vehículos
vehicles
  - id (uuid, PK)
  - unit_code (varchar, UNIQUE)
  - vehicle_type (varchar) -- TRACTOR, RIGID, VAN
  - plate (varchar, UNIQUE)
  - brand, model, year, vin
  - odometer_value, odometer_unit
  - org_id (uuid, FK -> organizations)
  - carrier_id (int, FK -> carriers)
  - operational_status (enum: ACTIVE, IN_SERVICE, ...)
  -- Extended Capacity Fields (for RIGID/VAN vehicles)
  - transport_capacity_weight_tn (numeric)
  - volume_m3 (numeric)
  - tare_weight_tn (numeric)
  - length_m, width_m, height_m (numeric)
  - insulation_thickness_cm (numeric)
  - compartments (bigint, default 1)
  - supports_multi_zone (boolean, default false)
  - load_capacity_type (varchar) -- PALLET, MEAT_HOOK, BULK, etc.
  - load_capacity_quantity (numeric)
  - notes (text)
  - ...

-- Conductores
drivers
  - id (serial, PK)
  - driver_id (text)
  - name (text)
  - license_number (text)
  - phone_number (text)
  - email (text)
  - org_id (uuid, FK -> organizations)
  - carrier_id (int, FK -> carriers)
  - status (enum: AVAILABLE, DRIVING, OFF_DUTY, UNAVAILABLE)
  - ...

-- Remolques
trailers
  - id (uuid, PK)
  - code (text)
  - plate (text)
  - transport_capacity_weight_tn (numeric)
  - volume_m3 (numeric)
  - tare_weight_tn (numeric)
  - length_m, width_m, height_m (numeric)
  - supports_multi_zone (boolean)
  - compartments (bigint, default 1)
  - insulation_thickness_cm (numeric)
  - org_id (uuid, FK -> organizations)
  - carrier_id (int, FK -> carriers)
  - operational_status (enum: ACTIVE, IN_SERVICE, ...)
  - ...

-- Equipos de Refrigeración (Unificado) ⭐ NUEVO
reefer_equipments
  - id (integer, PK, GENERATED BY DEFAULT AS IDENTITY)
  - org_id (uuid, FK -> organizations)
  - brand, model, year (integer)
  - serial_number (varchar)
  - power_type (enum: DIESEL, ELECTRIC, HYBRID)
  - reefer_hours (numeric)
  - diesel_capacity_l (numeric)
  - consumption_lph (numeric)
  - temp_min_c, temp_max_c (numeric)
  - owner_type (enum: TRAILER, VEHICLE) -- Asociación polimórfica
  - owner_id (uuid) -- ID del trailer o vehículo
  - created_at, updated_at (timestamp)

-- Conjuntos de flota
fleet_sets
  - id (uuid, PK)
  - org_id (uuid, FK -> organizations)
  - vehicle_id (uuid, FK -> vehicles)
  - trailer_id (uuid, FK -> trailers)
  - ...
```

#### Operaciones

```sql
-- Órdenes de despacho
dispatch_orders
  - id (uuid, PK)
  - org_id (uuid, FK -> organizations)
  - order_number (text)
  - status (enum: UNASSIGNED, PENDING, ASSIGNED, ...)
  - assigned_vehicle_id (uuid, FK -> vehicles)
  - ...

-- Rutas
routes
  - id (uuid, PK)
  - org_id (uuid, FK -> organizations)
  - route_code (text)
  - ...

-- Paradas
stops
  - id (uuid, PK)
  - route_id (uuid, FK -> routes)
  - stop_type (enum: PICKUP, DELIVERY)
  - location_id (uuid, FK -> locations)
  - ...
```

#### Configuración

```sql
-- Ubicaciones
locations
  - id (uuid, PK)
  - org_id (uuid, FK -> organizations)
  - name (text)
  - address (text)
  - latitude (numeric)
  - longitude (numeric)
  - ...

-- Productos
products
  - id (uuid, PK)
  - org_id (uuid, FK -> organizations)
  - product_code (text)
  - name (text)
  - ...

-- Perfiles térmicos
thermal_profiles
  - id (uuid, PK)
  - org_id (uuid, FK -> organizations)
  - name (text)
  - min_temperature (numeric)
  - max_temperature (numeric)
  - ...
```

### Relaciones Clave

```
Organization (1) ──< (N) OrganizationMember
Organization (1) ──< (N) Carrier
Carrier (1) ──< (N) Vehicle
Carrier (1) ──< (N) Driver
Carrier (1) ──< (N) Trailer
Organization (1) ──< (N) Location
Organization (1) ──< (N) Route
Organization (1) ──< (N) DispatchOrder
Vehicle (1) ──< (N) FleetSet
Trailer (0..1) ──< (N) FleetSet  -- NULLABLE para vehículos rígidos
Vehicle (0..1) ──< (0..1) ReeferEquipment  -- Polimórfico (owner_type='VEHICLE')
Trailer (0..1) ──< (0..1) ReeferEquipment  -- Polimórfico (owner_type='TRAILER')
```

---

## 🔒 Row Level Security (RLS)

### ¿Qué es RLS?

Row Level Security es una característica de PostgreSQL que permite controlar el acceso a filas individuales basado en políticas. En Supabase, RLS está **habilitado por defecto** en todas las tablas.

### Principio Fundamental

**Todas las queries deben incluir `org_id`** para asegurar que los usuarios solo accedan a datos de su organización.

### Principios de Implementación

1. **Prohibición estricta de triggers**: Toda lógica de negocio se implementa mediante Edge Functions, servicios o validaciones en capa de aplicación.

2. **Evitar recursiones en RLS**: Las políticas RLS se diseñan utilizando funciones `SECURITY DEFINER` o claims en JWT cuando sea necesario para prevenir cualquier ciclo recursivo.

3. **Seguridad por diseño**: RLS en todas las tablas principales, validación de membresía en cada operación.

### Políticas Básicas

```sql
-- Ejemplo: Política para vehicles
CREATE POLICY "Users can view vehicles in their organization"
ON vehicles
FOR SELECT
USING (
  org_id IN (
    SELECT org_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert vehicles in their organization"
ON vehicles
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```

### Verificación en Código

Siempre incluir `org_id` en queries:

```typescript
// ✅ Correcto
const { data } = await supabase
  .from('vehicles')
  .select('*')
  .eq('org_id', orgId); // Siempre filtrar por organización

// ❌ Incorrecto (viola seguridad)
const { data } = await supabase
  .from('vehicles')
  .select('*'); // Sin filtro de organización
```

---

## 🔐 Autenticación

### Flujo de Autenticación

1. **Usuario inicia sesión**
   ```typescript
   await supabase.auth.signInWithPassword({ email, password });
   ```

2. **Supabase Auth valida credenciales**
   - Verifica email/password
   - Crea sesión
   - Devuelve JWT token

3. **Frontend detecta cambio de sesión**
   ```typescript
   supabase.auth.onAuthStateChange((event, session) => {
     if (session) {
       fetchUserData(session.user.id);
     }
   });
   ```

4. **Se carga información adicional**
   - Verificar si es platform admin (`platform_users`)
   - Cargar membership de organización (`organization_members`)
   - Cargar información de organización (`organizations`)

### Roles y Permisos

#### Platform Roles

- **DEV** - Desarrollador con acceso completo
- **PLATFORM_ADMIN** - Administrador de plataforma

#### Organization Roles

- **OWNER** - Propietario de la organización
- **ADMIN** - Administrador
- **STAFF** - Personal
- **DRIVER** - Conductor

### Context de Autenticación

Ver [`src/lib/auth-context.tsx`](../../src/lib/auth-context.tsx) para implementación completa.

---

## 🛡️ Políticas de Seguridad

### Principios

1. **Aislamiento por Organización**
   - Todos los datos están asociados a una organización
   - Los usuarios solo ven datos de su organización

2. **Verificación de Permisos**
   - RLS verifica automáticamente
   - Políticas basadas en `organization_members`

3. **Platform Admins**
   - Pueden acceder a múltiples organizaciones
   - Selección de organización en `localStorage`

### Ejemplo de Política Completa

```sql
-- Política para vehicles que permite:
-- 1. Ver vehículos de tu organización
-- 2. Crear vehículos en tu organización (si eres ADMIN o OWNER)
-- 3. Actualizar vehículos de tu organización (si eres ADMIN o OWNER)
-- 4. Eliminar vehículos de tu organización (solo OWNER)

-- SELECT
CREATE POLICY "Users can view vehicles in their organization"
ON vehicles FOR SELECT
USING (
  org_id IN (
    SELECT org_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- INSERT
CREATE POLICY "Admins can insert vehicles"
ON vehicles FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
    AND role IN ('OWNER', 'ADMIN')
  )
);

-- UPDATE
CREATE POLICY "Admins can update vehicles"
ON vehicles FOR UPDATE
USING (
  org_id IN (
    SELECT org_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
    AND role IN ('OWNER', 'ADMIN')
  )
);

-- DELETE
CREATE POLICY "Owners can delete vehicles"
ON vehicles FOR DELETE
USING (
  org_id IN (
    SELECT org_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
    AND role = 'OWNER'
  )
);
```

---

## 📘 Tipos TypeScript

### Generación de Tipos

Los tipos se generan desde el esquema de Supabase:

```bash
# Generar tipos (si tienes Supabase CLI)
npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
```

### Estructura de Tipos

```typescript
// src/types/database.types.ts

// Enums
export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'DRIVER';
export type AssetOperationalStatus = 'ACTIVE' | 'IN_SERVICE' | 'IN_MAINTENANCE' | ...;

// Interfaces de tablas
export interface Vehicle {
  id: string;
  vehicle_code: string;
  org_id: string;
  carrier_id: number;
  make: string;
  model: string;
  operational_status: AssetOperationalStatus;
  // ...
  created_at?: string;
  updated_at?: string;
}

// Tipos para inserts (sin campos auto-generados)
export interface VehicleInsert {
  vehicle_code: string;
  org_id: string;
  carrier_id: number;
  make: string;
  model: string;
  // ... sin id, created_at, etc.
}

// Tipos para updates (todos opcionales excepto id)
export interface VehicleUpdate {
  vehicle_code?: string;
  make?: string;
  model?: string;
  // ...
}
```

### Uso en Servicios

```typescript
import type { Vehicle, VehicleInsert, VehicleUpdate } from '@/types/database.types';

export const vehiclesService = {
  async getAll(orgId: string): Promise<Vehicle[]> {
    // ...
  },
  
  async create(data: VehicleInsert, orgId: string): Promise<Vehicle> {
    // ...
  },
  
  async update(id: string, data: VehicleUpdate, orgId: string): Promise<Vehicle> {
    // ...
  },
};
```

---

## ⚡ Edge Functions

ColdSync utiliza **Supabase Edge Functions** para lógica de negocio compleja, integraciones externas (Flespi) y operaciones que requieren permisos de Service Role.

### Principios de Seguridad
1. **Verificación de Auth**: Todas las funciones validan el JWT del usuario (`auth.getUser()`) antes de proceder.
2. **Secretos Seguros**: Las llaves de API (ej. `FLESPI_TOKEN`) se almacenan en Supabase Vault y solo son accesibles desde el servidor.
3. **Service Role**: Las funciones pueden realizar operaciones que el cliente (frontend) tiene prohibidas por RLS.

### Funciones de Integración Flespi
| Función | Propósito | Autenticación |
+|---------|-----------|---------------|
+| `search-flespi-protocols` | Busca marcas/protocolos en el catálogo global de Flespi. | JWT Requerido |
+| `sync-hardware-catalog` | Sincroniza modelos de una marca específica a la base de datos local. | JWT Requerido |
+| `manage-flespi-device` | Crea, actualiza o elimina dispositivos ("Units") en la plataforma Flespi. | JWT Requerido |

---

## 📏 Reglas de Base de Datos

### [Database Rules](../../.cursor/rules/data-base-rules.md)
Reglas específicas para el mantenimiento y desarrollo de la base de datos:

#### Modificación de Esquema (DDL)
- **Migraciones Seguras** - Patrón "Expandir y Contraer" para cambios sin downtime
- **Valores por Defecto** - Obligatorios para columnas `NOT NULL` nuevas
- **Tipado Correcto** - UUIDs para IDs, `numeric` para dinero/pesos, timestamps con zona horaria

#### Protección Multi-Tenancy
- **Aislamiento por `org_id`** - Corazón de la seguridad del sistema
- **Queries Seguros** - Siempre incluir `org_id` en WHERE clauses
- **Propagación Correcta** - Verificar `org_id` en inserciones

#### Integridad de Datos
- **Soft Delete** - Usar `is_active` en lugar de `DELETE`
- **Historial Inmutable** - Tablas `*_history` solo para inserción
- **Relaciones GPS** - Actualizar tanto activos como historial de asignaciones

#### Restricciones de Infraestructura
- **Prohibición de Triggers** - No crear/modificar triggers existentes
- **RLS y Funciones** - Consultar antes de modificar políticas o RPCs

---

## 🔗 Referencias

- [Convenciones Supabase](./conventions.md)
- [Reglas de Base de Datos: .cursor/rules/data-base-rules.md](../../.cursor/rules/data-base-rules.md)
- [Documentación Supabase](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Convenciones Supabase](./conventions.md)

---

**Última actualización:** Enero 2025

