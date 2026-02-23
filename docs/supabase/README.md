# 🗄️ Supabase - Base de Datos y Backend

Esta sección contiene toda la documentación relacionada con Supabase, incluyendo esquemas de base de datos, arquitectura, autenticación y convenciones.

---

## 📋 Tabla de Contenidos

1. [Esquema de Base de Datos](#esquema-de-base-de-datos)
2. [Arquitectura](#arquitectura)
3. [Autenticación](#autenticación)
4. [Convenciones](#convenciones)
5. [Políticas RLS](#políticas-rls)

---

## 🗂️ Esquema de Base de Datos

### [Schema Overview](./schema-overview.md)
Documentación completa del esquema de base de datos, incluyendo:
- **Arquitectura Multi-Tenant** - Aislamiento por organización
- **Entidades Principales** - Todas las tablas y sus relaciones
- **Seguridad y Roles** - Sistema de permisos y acceso
- **Integraciones** - Conexiones con Flespi y Auth

### [Schema SQL](./schema.sql)
Archivo SQL con la definición completa del esquema de base de datos.

---

## 🏗️ Arquitectura

### [Architecture](./architecture.md)
Arquitectura completa de Supabase, incluyendo:
- Configuración de RLS (Row Level Security)
- Políticas de seguridad por tabla
- Estructura de roles y permisos
- Integraciones con servicios externos

---

## 🔐 Autenticación

### [Authentication](../business/authentication.md)
Sistema de autenticación y autorización:
- **Supabase Auth** - Configuración y flujos
- **Roles del Sistema** - Platform Admin, Organization Owner, etc.
- **JWT Claims** - Información de usuario y organización
- **Políticas RLS** - Seguridad a nivel de fila

---

## 📏 Convenciones

### [Conventions](./conventions.md)
Convenciones para trabajar con Supabase:
- **Naming Conventions** - Nomenclatura de tablas y campos
- **Query Patterns** - Patrones de consulta recomendados
- **Service Patterns** - Estructura de servicios CRUD
- **Error Handling** - Manejo de errores de Supabase

### [Database Rules](../../.cursor/rules/data-base-rules.md)
Reglas específicas para modificación de esquemas y seguridad:
- **Migraciones Seguras** - Patrón "Expandir y Contraer"
- **Multi-Tenancy** - Protección con `org_id`
- **Integridad de Datos** - Soft delete y tablas de historial
- **Restricciones de Infraestructura** - Triggers y RLS

---

## 🛡️ Políticas RLS

### Row Level Security
Todas las tablas principales implementan RLS para:
- **Aislamiento por Organización** - `org_id` filtering
- **Control de Acceso por Rol** - Permisos específicos por usuario
- **Seguridad Multi-Tenant** - Datos completamente aislados

### Ejemplos de Políticas

```sql
-- Ejemplo: Carriers solo visibles por su organización
CREATE POLICY "Users can view carriers from their organization"
ON carriers FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```

---

## 🔗 Integraciones

### Flespi (Telemetría IoT)
- **Catalog Management** - Gestión on-demand de marcas y modelos (Just-in-Time).
- **Connection Devices** - Inventario de dispositivos físicos (IMEI/Serial).
- **Device Assignments** - Vinculación con vehículos y remolques.
- **Shadow Devices** - Sincronización de configuración mediante Edge Functions.

### Supabase Auth
- **User Management** - Gestión de usuarios
- **Organization Members** - Miembros de organizaciones
- **Platform Users** - Administradores de plataforma

---

## 📊 Entidades Principales

### Gestión de Organizaciones
- `organizations` - Empresas que usan el sistema
- `organization_members` - Usuarios dentro de organizaciones
- `platform_users` - Administradores de plataforma

### Gestión de Flota
- `carriers` - Transportistas (propios/terceros)
- `drivers` - Conductores
- `vehicles` - Vehículos
- `trailers` - Remolques refrigerados
- `fleet_sets` - Combinaciones activas de flota

### Gestión de Productos
- `products` - Catálogo de productos
- `thermal_profile` - Perfiles de temperatura
- `product_thermal_profiles` - Relación productos-perfiles

### Gestión de Ubicaciones
- `locations` - Ubicaciones con geofencing
- `location_types` - Tipos de ubicación
- `lanes` - Carriles predefinidos (corredores operativos)
- `lane_stops` - Paradas de carriles

### Gestión de Despacho
- `dispatch_orders` - Órdenes de transporte (incl. `route_id`, `carrier_contract_id`)
- `dispatch_order_items` - Items de cada orden (incl. `thermal_profile_id`)
- `dispatch_order_stop_actuals` - Llegada/salida real por parada de ruta

### Módulo Comercial y Geográfico
- `carrier_contracts` - Contratos por carrier
- `rate_cards` - Tarifarios por contrato + ruta + perfil/servicio
- `rate_tiers` - Escalones de precio por peso
- `dispatch_order_costs` - Costo por orden (1:1)
- `penalty_rules` - Reglas de penalidad por contrato
- `accessorial_charge_types` / `carrier_contract_accessorials` - Catálogo de recargos

---

## 🛠️ Herramientas y Utilidades

### Seed Data
- **[Seed Service](../services/database/seed.ts)** - Generación de datos de prueba
- **Datos Realistas** - Transportistas, productos, carriles bolivianos
- **Limpieza** - Funciones para limpiar datos de prueba

### Type Generation
```bash
# Generar tipos TypeScript desde Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

---

## 📚 Recursos Adicionales

### Documentación Relacionada
- [Frontend Services](../frontend/services.md) - Servicios que consumen Supabase
- [Development Conventions](../development/README.md) - Estándares de desarrollo
- [Business Logic](../business/README.md) - Reglas de negocio

### Enlaces Externos
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/reference/cli)

---

## 🚀 Inicio Rápido

### Para Desarrolladores
1. **Lee** [Schema Overview](./schema-overview.md) para entender la estructura
2. **Revisa** [Conventions](./conventions.md) para patrones de desarrollo
3. **Consulta** [Frontend Services](../frontend/services.md) para implementación

### Para Administradores
1. **Configura** políticas RLS según [Architecture](./architecture.md)
2. **Gestiona** usuarios y organizaciones
3. **Monitorea** performance y seguridad

---

**¿Preguntas sobre Supabase?** Consulta la documentación específica o contacta al equipo de backend.