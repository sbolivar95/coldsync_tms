# 📚 Documentación de Negocio - ColdSync TMS

Esta carpeta contiene la documentación de las reglas de negocio y procesos operativos de ColdSync TMS.

## 📋 Índice de Documentos

### Gestión de Flota y Activos
- **[Fleet Management](./fleet-management.md)** - Gestión de activos y flota dedicada
  - Tipos de vehículos (TRACTOR, RIGID, VAN)
  - Fleet Sets y asignaciones
  - Reglas de Bobtail, Spotting y Drop & Hook

- **[Matching Orders](./matching-orders.md)** - Algoritmo de matching orden → flota
  - Criterios de validación (peso, temperatura, compartimentos)
  - Arquitectura de reefers y equipos de refrigeración
  - Casos de uso y ejemplos

### Operaciones de Despacho
- **[State Management](./state-orders.md)** - Modelo global de estados (Stage + Substatus)
  - 5 etapas: DISPATCH → TENDERS → SCHEDULED → EXECUTION → CONCILIATION
  - Historial de transiciones
  - Reglas de cancelación

- **[Orders](./orders.md)** - Gestión de órdenes de despacho
  - Estados del ciclo de vida
  - TTL (Time To Live) y ventanas de tiempo
  - Órdenes híbridas y multi-zona

- **[Dispatch](./dispatch.md)** - Proceso de despacho y asignación
  - Flujo de trabajo
  - Auto-asignación
  - Validaciones y restricciones

### Configuración y Catálogos
- **[Lanes](./lanes.md)** - Carriles y rutas predefinidas
  - Definición de carriles
  - Paradas y tiempos de tránsito
  - Relación con tarifas

- **[Control Tower](./control-tower.md)** - Torre de control y monitoreo
  - Visibilidad en tiempo real
  - Alertas y excepciones
  - KPIs operativos

### Comercial y Finanzas
- **[Tarifas](./tarifas.md)** - Tarifarios y cálculo de costos por despacho
  - Tipos de cargo (Flete, Distancia, Combustible) y base de cálculo (Fijo, Por tn, Por km, Porcentaje)
  - Escalones por tonelada, cargo mínimo y orden de aplicación
  - Selección del tarifario (carril, transportista, perfil térmico)

- **[KPIs](./kpis.md)** - Indicadores clave de desempeño
  - Métricas operativas
  - Métricas financieras
  - Dashboards y reportes

- **[Reconciliation](./reconciliation.md)** - Reconciliación y facturación
  - Proceso de reconciliación
  - Validación de costos
  - Generación de facturas

### Organización y Usuarios
- **[Organizations & Users](./organizations-users.md)** - Gestión de organizaciones y usuarios
  - Estructura multi-tenant
  - Roles y permisos
  - Invitaciones y accesos

## 🎯 Conceptos Clave

### Tipos de Vehículos

1. **TRACTOR** (Articulado)
   - Requiere remolque para operar
   - Capacidad de carga en el remolque
   - Reefer montado en el remolque

2. **RIGID** (Rígido)
   - Vehículo completo con caja integrada
   - Capacidad de carga en el vehículo
   - Reefer montado en el vehículo

3. **VAN** (Furgoneta)
   - Similar a RIGID pero más pequeño
   - Capacidad de carga en el vehículo
   - Reefer montado en el vehículo

### Equipos de Refrigeración (Reefers)

Los equipos de refrigeración están en la tabla `reefer_equipments` y pueden estar asociados a:
- **TRAILER** (para vehículos TRACTOR)
- **VEHICLE** (para vehículos RIGID/VAN)

**Importante**: El tipo de energía (`power_type`: DIESEL/ELECTRIC/HYBRID) **NO** es un criterio de matching. Solo se usa para:
- Cálculos de costos operativos
- Mantenimiento preventivo
- Reportes de eficiencia energética

### Órdenes Híbridas

Órdenes que transportan múltiples productos con diferentes perfiles térmicos. Requieren:
- Vehículos con `supports_multi_zone = true`
- Suficientes compartimentos (`compartments >= número de productos`)
- O perfiles térmicos con intersección válida

## 🔗 Referencias Cruzadas

- **Esquema de Base de Datos**: Ver `/docs/supabase/schema-overview.md`
- **Arquitectura Frontend**: Ver `/docs/frontend/architecture.md`
- **Convenciones de Código**: Ver `/docs/development/README.md`

## 📝 Notas de Actualización

- **2026-01-18**: Migración de `trailer_reefer_specs` a `reefer_equipments` (tabla unificada)
- **2026-01-28**: Eliminación de `dispatch_order_stops`, uso de `lane_stops` vía `dispatch_orders.lane_id`
- **2026-02-08**: Documentación del algoritmo de matching y arquitectura de reefers
