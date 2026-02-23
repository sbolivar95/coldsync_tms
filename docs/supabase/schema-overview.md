# Esquema de Base de Datos - ColdSync TMS

## 📋 **Resumen General**

ColdSync TMS utiliza PostgreSQL con Supabase para gestionar un sistema completo de transporte de cadena de frío. El esquema está diseñado para manejar múltiples organizaciones (multi-tenant) con aislamiento completo de datos.

## 🏗️ **Arquitectura Multi-Tenant**

Todas las tablas principales incluyen `org_id` para aislamiento de datos:
- **Nivel Plataforma**: `platform_users` - Administradores del sistema
- **Nivel Organización**: `organizations` - Empresas que usan el sistema
- **Nivel Miembros**: `organization_members` - Usuarios dentro de cada organización

## 📊 **Entidades Principales**

### **1. Gestión de Organizaciones**

#### `organizations`
- **Propósito**: Empresas que usan ColdSync TMS (Shippers - Clientes del SaaS)
- **Campos clave**: `comercial_name`, `legal_name`, `status`, `base_country_id`, `tax_id`, `fiscal_address`, `billing_email`, `currency`, `time_zone`, `contact_name`, `contact_phone`, `contact_email`, `plan_type`
- **Estados**: `ACTIVE`, `INACTIVE` (los estados obsoletos SUSPENDED, CANCELED, PAST_DUE fueron migrados a INACTIVE el 13/01/2026)
- **Nota importante**: Las organizaciones se crean **sin usuarios asociados**. El primer usuario con rol OWNER se crea posteriormente desde la sección "Usuarios".

#### `organization_members`
- **Propósito**: Usuarios dentro de cada organización (relación entre usuarios de Supabase Auth y organizaciones)
- **Roles**: `OWNER`, `ADMIN`, `STAFF`, `DRIVER`
- **Campos**: `first_name`, `last_name`, `email`, `phone`, `role`, `is_active` (boolean), `status` (text)
- **Estados**: 
  - **Activo**: `is_active = true AND status = 'active'` - Usuario con acceso completo
  - **Suspendido**: `is_active = false AND status = 'suspended'` - Usuario suspendido temporalmente
  - **Eliminado (Soft Delete)**: `is_active = false AND status = 'inactive'` - Usuario eliminado, no visible en listas
- **Campo `phone`**: Se almacena tanto en `organization_members.phone` como en `auth.users.user_metadata.phone` para mantener consistencia. El sistema prioriza `organization_members.phone` cuando está disponible.
- **Nota**: El rol OWNER siempre corresponde a un usuario en Supabase Auth, nunca a la organización como entidad.

**Nota sobre `org_join_codes`**: Esta tabla puede existir en el esquema pero el sistema utiliza **magic links** como método principal de invitación, no códigos manuales. Los magic links se generan y gestionan a través de Supabase Auth.

### **2. Gestión de Transportistas y Flota**

#### `carriers`
- **Propósito**: Empresas transportistas (propias o terceros)
- **Tipos**: `OWNER` (flota propia), `THIRD PARTY` (tercerizado)
- **Datos**: Información legal, contactos, términos de pago, datos bancarios

#### `carrier_members`
- **Propósito**: Usuarios específicos de cada transportista
- **Roles**: Roles específicos para operaciones de transporte

#### `drivers`
- **Propósito**: Conductores vinculados a transportistas
- **Estados**: `AVAILABLE`, `DRIVING`, `OFF_DUTY`, `UNAVAILABLE`
- **Datos**: Licencia, contacto, nacionalidad, dirección

#### `vehicles`
- **Propósito**: Vehículos de la flota
- **Campos únicos**: `vehicle_code`, `unit_code`, `plate`, `vin`
- **Estados**: `ACTIVE`, `IN_MAINTENANCE`, `OUT_OF_SERVICE`

#### `vehicles`
- **Propósito**: Vehículos de la flota (Tractores, Camiones Rígidos, Vans)
- **Tipos**: `TRACTOR` (articulado), `RIGID` (rígido), `VAN` (rígido pequeño)
- **Capacidad Extendida**: Para vehículos RIGID/VAN, incluye campos de capacidad y dimensiones:
  - Capacidad: `transport_capacity_weight_tn`, `volume_m3`, `tare_weight_tn`
  - Dimensiones: `length_m`, `width_m`, `height_m`, `insulation_thickness_cm`
  - Configuración: `compartments`, `supports_multi_zone`, `load_capacity_type`, `load_capacity_quantity`
- **Relación**: Puede tener equipo de refrigeración a través de `reefer_equipments` (owner_type='VEHICLE')

#### `trailers`
- **Propósito**: Remolques refrigerados
- **Especificaciones**: Capacidad, dimensiones, compartimentos, aislamiento, configuración multi-zona
- **Relación**: Puede tener equipo de refrigeración a través de `reefer_equipments` (owner_type='TRAILER')

#### `reefer_equipments` ⭐ **NUEVO**
- **Propósito**: Tabla unificada para equipos de refrigeración (reemplaza `trailer_reefer_specs`)
- **Asociación Polimórfica**: Soporta equipos montados en `TRAILER` o `VEHICLE` mediante `owner_type` y `owner_id`
- **Datos**: Marca, modelo, año, tipo de energía (DIESEL/ELECTRIC/HYBRID), consumo, capacidad, rangos de temperatura
- **Ventajas**: 
  - Inventario único de equipos de frío
  - Soporte para vehículos rígidos con equipo integrado
  - Mantenimiento centralizado del ciclo de vida del equipo

#### `trailer_reefer_specs` ⚠️ **ELIMINADA**
- **Estado**: Tabla eliminada en Fase 5 (migración `20260118020000_remove_trailer_reefer_specs.sql`)
- **Migración**: Todos los datos fueron migrados a `reefer_equipments`
- **Compatibilidad**: Los tipos TypeScript (`TrailerReeferSpecs`) y el wrapper `trailerReeferSpecsService` se mantienen para compatibilidad, pero internamente usan `reefer_equipments`

#### `fleet_sets`
- **Propósito**: Combinaciones activas de transportista + conductor + vehículo + remolque
- **Funcionalidad**: Gestión temporal de asignaciones de flota

### **3. Gestión de Productos y Perfiles Térmicos**

#### `products`
- **Propósito**: Catálogo de productos transportables
- **Relación**: Vinculado a perfiles térmicos mediante tabla intermedia

#### `thermal_profile`
- **Propósito**: Perfiles de temperatura para diferentes tipos de productos
- **Rangos**: `temp_min_c` y `temp_max_c` en grados Celsius
- **Ejemplos**: Congelado (-25°C a -18°C), Refrigerado (0°C a 4°C)

#### `product_thermal_profiles`
- **Propósito**: Relación muchos-a-muchos entre productos y perfiles térmicos
- **Funcionalidad**: Un producto puede tener múltiples perfiles térmicos válidos

### **4. Gestión de Ubicaciones y Lanes**

#### `countries`
- **Propósito**: Catálogo de países del sistema
- **Campos**: `name`, `iso_code`

#### `location_types`
- **Propósito**: Tipos de ubicaciones (CD, Frigorífico, Punto de Venta, etc.)
- **Personalizable**: Cada organización define sus tipos; `allowed_stop_types` (array) para validación de paradas

#### `locations`
- **Propósito**: Ubicaciones físicas con geofencing
- **Geofencing**: Soporte para polígonos y círculos
- **Datos**: `geofence_type`, `geofence_data` (JSON), `num_docks`, `default_dwell_time_hours`

#### `lane_types`
- **Propósito**: Clasificación de carriles (Línea Troncal, Distribución Regional, Retorno, etc.)

#### `lanes`
- **Propósito**: Carriles predefinidos (geometría operativa y tiempos; los precios viven en `rate_cards`)
- **Tiempos**: `transit_time`, `operational_buffer`
- **Documentación**: Ver [Lanes (Carriles)](../business/lanes.md) para detalles conceptuales

#### `lane_stops`
- **Propósito**: Paradas de cada ruta en orden específico
- **Tipos**: `PICKUP`, `DELIVERY`, etc.; `estimated_duration` (horas) por parada

### **5. Gestión de Despacho**

#### `dispatch_orders`
- **Propósito**: Órdenes de despacho/transporte
- **Estados**: `UNASSIGNED`, `ASSIGNED`, `PENDING`, `REJECTED`, `SCHEDULED`, `IN_TRANSIT`, `COMPLETED`, `CANCELLED`, `OBSERVANCE`
- **Asignación**: Puede asignarse a `fleet_set_id` o componentes individuales (`carrier_id`, `driver_id`, `vehicle_id`, `trailer_id`)
- **Lane**: `lane_id` (FK a `lanes`) - **REQUERIDO** - Las paradas planificadas se derivan de `lane_stops` vía esta relación
- **Comercial**: `carrier_contract_id` para vinculación con el módulo comercial (opcional)
- **Ventanas de tiempo**: `pickup_window_start`, `pickup_window_end` (time without time zone)
- **Asignación de transportista**: `carrier_assigned_at`, `allocation_period_id` para tracking de asignaciones
- **Observancias**: `observance_count` para contar incidencias

#### `dispatch_order_items`
- **Propósito**: Productos/items de cada orden de despacho
- **Datos**: `product_id`, `quantity`, `unit`, `notes`, `item_name`, `description`
- **Perfil térmico**: `thermal_profile_id` (FK a `thermal_profile`) - **OPCIONAL** pero recomendado para validación de compatibilidad
- **Nota**: En modo híbrido, cada compartimiento es un item separado con su propio `thermal_profile_id`

#### `dispatch_order_stop_actuals` ⭐ **NUEVO**
- **Propósito**: Registro de llegada/salida real por parada de ruta en cada orden
- **Relación**: `dispatch_order_id` + `route_stop_id` (una fila por parada de ruta por orden, UNIQUE)
- **Campos**: `actual_arrival_at`, `actual_departure_at`, `notes`
- **Nota**: Las paradas planificadas vienen de `route_stops` vía `dispatch_orders.route_id`. Esta tabla solo registra tiempos reales.

#### `dispatch_order_stops` ⚠️ **ELIMINADA**
- **Estado**: Tabla eliminada en migración `20260128100001_route_id_and_stop_actuals.sql`
- **Migración**: Las paradas planificadas ahora se obtienen de `lane_stops` vía `dispatch_orders.lane_id`
- **Razón**: Centralización de carriles reutilizables y eliminación de duplicación de datos

### **6. Módulo Comercial y Geográfico (Tarifas, Contratos, Costos)**

#### `carrier_contracts`
- **Propósito**: Contratos comerciales por carrier (un carrier puede tener varios contratos vigentes)
- **Campos**: `contract_number`, `valid_from`/`valid_to`, `payment_terms`, `currency`, `min_commitment_type`/`value`, `status`

#### `rate_cards`
- **Propósito**: Tarifarios por contrato + carril + perfil térmico/servicio
- **Campos**: `carrier_id` (nullable, null = org default), `lane_id`, `thermal_profile_id`, `name`, `base_value` (costo fijo de ruta), `valid_from`/`valid_to`
- **Documentación**: Ver [Lanes (Carriles)](../business/lanes.md) para relación con tarifación

#### `rate_tiers`
- **Propósito**: Escalones de precio por peso dentro de una tarifa (economías de escala)
- **Restricción**: Rangos de peso no solapados por `rate_card_id` (EXCLUDE con btree_gist)

#### `dispatch_order_costs`
- **Propósito**: Costo calculado por orden (1:1 con `dispatch_orders`): base, recargos, penalidades, estado (DRAFT/CONFIRMED/INVOICED/PAID)
- **Relación**: `dispatch_order_id` UNIQUE, `rate_card_id`

#### `penalty_rules`
- **Propósito**: Reglas de penalidad por contrato (retraso, temperatura fuera de rango, daño)
- **Campos**: `rule_type`, `penalty_type`/`penalty_value`, condiciones de duración/temperatura

#### `accessorial_charge_types` y `carrier_contract_accessorials`
- **Propósito**: Catálogo de recargos (peajes, seguro, etc.) y valores por contrato

#### `dispatch_order_observance_history` (campos añadidos)
- **Vinculación con penalidades**: `penalty_rule_applied`, `penalty_amount`, `duration_hours`, `temp_deviation_c`, `temp_duration_hours`

#### `carrier_allocation_rules` (campo añadido)
- **Opcional**: `carrier_contract_id` para cupos ligados a un contrato

### **7. Telemetría y Dispositivos IoT**

#### `telematics_provider`
- **Propósito**: Proveedores de servicios de telemetría

#### `flespi_protocols` ⭐ **NUEVO**
- **Propósito**: Catálogo global de marcas habilitadas sincronizadas desde Flespi.
- **Campos**: `id` (Protocol ID), `name`.
- **Integración**: Sincronización on-demand mediante Edge Functions.

#### `flespi_device_types` ⭐ **NUEVO**
- **Propósito**: Catálogo de modelos específicos para cada marca/protocolo.
- **Campos**: `id` (Device Type ID), `name`, `protocol_id` (FK -> flespi_protocols).
- **Funcionalidad**: Permite la selección dinámica de modelos soportados por Flespi.

#### `hardware_device` ⚠️ **ELIMINADA**
- **Estado**: Tabla eliminada y reemplazada por el catálogo dinámico de Flespi.

#### `connection_device`
- **Propósito**: Dispositivos físicos (unidades GPS/IoT) del inventario del transportista.
- **Campos clave**: `ident` (IMEI/Serial), `flespi_device_type_id` (FK -> flespi_device_types).
- **Asignación**: `tracked_entity_type` (TRAILER, VEHICLE) - Lógica "Vehicle-First".
- **Integración**: `flespi_device_id` para telemetría activa en Flespi.

#### `device_assignments_history`
- **Propósito**: Historial de asignaciones de dispositivos
- **Auditoría**: Quién, cuándo, por qué se asignó/desasignó

### **8. Asignación Automática de Transportistas**

#### `carrier_allocation_rules`
- **Propósito**: Reglas para asignación automática de órdenes a transportistas
- **Configuración**: `target_orders`, `reset_every_days`, `carryover_enabled`
- **Control**: `reject_rate_threshold` para gestión de rechazos

#### `carrier_allocation_periods`
- **Propósito**: Períodos específicos de asignación con métricas
- **Métricas**: `dispatched_count`, `rejected_count`, `carried_over`

## 🔐 **Seguridad y Acceso**

### **Row Level Security (RLS)**
- Todas las tablas principales tienen RLS habilitado
- Filtrado automático por `org_id` para aislamiento de datos
- Políticas específicas por rol de usuario

### **Roles del Sistema**
- **Platform Admin**: Acceso completo al sistema
- **Organization Owner**: Control total de su organización
- **Organization Admin**: Gestión operativa de la organización
- **Staff**: Acceso limitado a operaciones específicas
- **Driver**: Acceso solo a sus asignaciones y reportes

## 📈 **Escalabilidad y Performance**

### **Índices Principales**
- `org_id` en todas las tablas principales
- Campos únicos: `carrier_id`, `vehicle_code`, `plate`, etc.
- Índices compuestos para consultas frecuentes

### **Particionamiento**
- Preparado para particionamiento por `org_id` si es necesario
- Tablas de historial pueden particionarse por fecha

## 🔄 **Integraciones Externas**

### **Flespi (Telemetría)**
- `flespi_device_id` en `connection_device` para unidades activas.
- `flespi_protocols` y `flespi_device_types` para el catálogo global dinámico.
- **Edge Functions**: Gestión de aprovisionamiento y búsqueda on-demand.

### **Autenticación**
- Integración con Supabase Auth (`auth.users`)
- Referencias a `user_id` en tablas de miembros

## 📝 **Notas de Implementación**

1. **UUIDs vs Integers**: Entidades principales usan UUIDs, referencias simples usan integers
2. **Timestamps**: Todas las tablas incluyen `created_at` y `updated_at`
3. **Soft Deletes**: Uso de `is_active` en lugar de eliminación física
4. **Validaciones**: Constraints a nivel de base de datos para integridad
5. **Extensibilidad**: Campos `notes` y `metadata` (JSON) para flexibilidad

## 🚀 **Próximos Pasos**

1. Implementar políticas RLS específicas por entidad
2. Agregar índices de performance según patrones de uso
3. Implementar triggers para auditoría automática
4. Configurar replicación para backup y analytics