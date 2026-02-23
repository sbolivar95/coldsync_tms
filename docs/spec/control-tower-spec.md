# Control Tower Spec

Diseño por capas para `Control Tower` en dos bloques:
- `Realtime` (tracking continuo)
- `Execution` (seguimiento del stage `EXECUTION`)

Scope actual: **sin alertas**.

Compatibilidad de alcance con documentación de negocio:
- `docs/business/control-tower.md` describe un alcance más amplio (SCHEDULED + EXECUTION + alertas).
- Este spec define el roadmap vigente: `Realtime` + `Execution`, sin orquestación de alertas en esta fase.

## Decisión de arquitectura
- Transporte de ingesta recomendado hoy: `Flespi HTTP Stream -> Supabase Edge Function`.
- Entrega en vivo al frontend: `Supabase Realtime` sobre cambios en Postgres.
- Flespi mantiene el histórico telemático completo.
- Supabase almacena estado operativo y datos de ejecución (no duplicado crudo 24/7).
- Unidad operativa de visualización en `Realtime`: unidad vinculada a `connection_device` (vehículo o remolque), con visibilidad 24/7.
- `fleet_set` es contexto operativo para `Execution` (orden/viaje), no un gate de visibilidad para `Realtime`.
- `ct_unit_live_state` permanece como capa base por `connection_device`; la UI consume una proyección live de unidades visibles (con o sin viaje activo).

## A) Realtime

### 1. Backend (Supabase / Edge Functions)
- Crear `ingest-flespi-stream`:
  - recibe lotes HTTP de Flespi.
  - normaliza payload canónico (`position`, `speed`, `ignition`, `temps`, `address`, timestamps, calidad de señal).
  - resuelve relación: `flespi_device_id/ident -> connection_device -> vehicle/trailer`.
  - hace `upsert` de estado actual.
- Mantener la ingesta actual (no rediseñar): `upsert` por `(org_id, connection_device_id)`.
- Prioridades de mapeo (estándar telemático):
  - `ignition`: `engine.ignition.status` -> `din.4`.
  - `temp_1_c`: `ble.sensor.temperature.1` -> `sensor.temperature.1`.
  - `temp_2_c`: `ble.sensor.temperature.2` -> `sensor.temperature.2`.
  - `temperature_c` (resumen): fallback a `temp_1_c`/`temp_2_c` cuando aplique.
  - `address_text`: `wialon.address`.
- Regla de robustez para mensajes parciales/ACK-like:
  - no sobrescribir con `null` cuando un campo no viene en el payload.
  - aplicar `last known good` por canal para velocidad/posición/temperatura y otros campos operativos.
  - marcar frescura por `signal_age_sec` sin perder el último valor válido.
- Regla térmica genérica por canal (sin diccionario por tipo de equipo):
  - respetar `temp_mode` (`MULTI` estricto por canal, `SINGLE`, `NONE`).
  - en `MULTI`, no replicar valores entre `Temp 1` y `Temp 2`.
  - si un canal reporta error o valor fuera de rango físico, proyectar `Sin dato/Error`.
- Resolver en lectura la fuente operativa por vínculo de dispositivo:
  - si el `connection_device` está vinculado a `vehicle`, mostrar/operar como `VEHICLE`.
  - si el `connection_device` está vinculado a `trailer`, mostrar/operar como `TRAILER`.
  - cuando exista doble contexto operativo (`tractor+trailer`), priorizar `TRAILER` para telemetría térmica y fallback a `VEHICLE` por frescura de señal (`signal_age_sec`).
- Aplicar estándar telemático de `Last Known Position`:
  - siempre conservar/mostrar última ubicación válida (`lat/lng`) aunque no haya señal actual.
  - separar ubicación de conectividad (la unidad puede tener posición válida y estado de señal stale/offline).
  - derivar `signal_status` en lectura:
    - `ONLINE`: `signal_age_sec <= 120`
    - `STALE`: `121..900`
    - `OFFLINE`: `> 900`
  - estos umbrales son configurables por operación.
- Separar explícitamente estados operativos (sin mezclar):
  - `signal_status`: `ONLINE | STALE | OFFLINE` (frescura).
  - `motion_status`: `MOVING | IDLE | PARKED` (velocidad + ignición).
  - `device_health`: `OK | WARN | ERROR` (batería/satélites/errores de sensor cuando aplique).
- Asegurar idempotencia por `message id + timestamp` cuando aplique.
- Al reasignar `connection_device_id` en `vehicles`/`trailers`, insertar evento en `device_assignments_history` (solo inserción).
- Tuning operativo del stream HTTP para realtime:
  - `limit_messages` recomendado: `10..20` (evitar batch lag visual).
  - `queue_ttl` recomendado: `60..300` segundos para live tracking.
  - evitar `queue_ttl` alto para no reinyectar backlog viejo en UI operativa.
- Seguridad operativa:
  - rotación periódica de secreto usado en header `x-flespi-secret`.
  - no exponer secretos en frontend ni en documentación operativa.

### 2. Base de datos
- Crear `ct_unit_live_state` (1 fila por unidad/dispositivo):
  - `id uuid pk default gen_random_uuid()`
  - `org_id uuid not null`
  - `connection_device_id uuid not null fk connection_device(id)`
  - `flespi_device_id bigint null`
  - `vehicle_id uuid null fk vehicles(id)`
  - `trailer_id uuid null fk trailers(id)`
  - `message_ts timestamptz not null`
  - `server_ts timestamptz null`
  - `lat double precision null`
  - `lng double precision null`
  - `speed_kph numeric(7,2) null`
  - `heading smallint null`
  - `ignition boolean null`
  - `is_moving boolean null`
  - `is_online boolean not null default false`
  - `signal_age_sec integer null`
  - `address_text text null`
  - `temperature_c numeric(6,2) null`
  - `temp_1_c numeric(6,2) null`
  - `temp_2_c numeric(6,2) null`
  - `temp_1_error_code text null`
  - `temp_2_error_code text null`
  - `satellites integer null`
  - `voltage numeric(8,3) null`
  - `is_buffered boolean null`
  - `telematics jsonb null` (campos opcionales avanzados)
  - `updated_at timestamptz default now()`
- Restricciones/índices:
  - `unique (org_id, connection_device_id)`
  - índice `(org_id, updated_at desc)`

- Crear proyección operativa de unidades visibles realtime (recomendado como `view`):
  - `ct_realtime_units_live` (1 fila por unidad visible por `connection_device`, con o sin viaje activo)
  - columnas mínimas sugeridas:
    - `org_id uuid`
    - `fleet_set_id uuid null` (contexto de ejecución, opcional)
    - `carrier_id integer`
    - `vehicle_id uuid`
    - `trailer_id uuid null`
    - `source_device_type text check ('VEHICLE','TRAILER')`
    - `source_connection_device_id uuid`
    - `message_ts timestamptz`
    - `lat/lng/speed_kph/heading/temperature_c/temp_1_c/temp_2_c`
    - `is_online/is_moving/signal_age_sec/address_text`
    - `signal_status text check ('ONLINE','STALE','OFFLINE')`
    - `motion_status text check ('MOVING','IDLE','PARKED')`
    - `device_health text check ('OK','WARN','ERROR')`
    - `telematics jsonb`
  - incluir todas las unidades con vínculo válido a `connection_device`; cuando exista viaje activo, adjuntar contexto de `fleet_set`.

Capacidades de telemetría:
- Fleet ya define base operativa por activo:
  - `RIGID/VAN` (vehículo como unidad de carga)
  - `TRACTOR` + `TRAILER` (remolque como unidad de carga)
  - `supports_multi_zone`, `compartments`
- En runtime, la capacidad efectiva se valida con payload real recibido.

### 3. Servicios
- Crear `src/services/database/controlTowerRealtime.service.ts`:
  - `getLiveUnits(orgId, filters)` (fuente: proyección live por unidad, no restringida a `fleet_set` activo)
  - `getLiveUnitById(orgId, unitLiveId | connectionDeviceId)`
  - `subscribeLive(orgId, onChange)`
- Integrar con patrón de estado global del proyecto (Zustand + cacheo por `org_id`) para evitar recargas innecesarias entre navegaciones.
- Reemplazar mocks en:
  - `src/features/control_tower/hooks/useControlTower.ts`
- Mantener compatibilidad con `ct_unit_live_state` para suscripción realtime; recomputar la proyección en lectura si la implementación usa `view`.

### 4. UI/UX
- Mantener estructura actual de mapa/lista/drawer.
- Reutilizar componentes existentes (`PageHeader`, `DataTable`/listas, `DetailFooter`, patrones de `detail-views`), evitando duplicación de componentes.
- Renderizar por unidad visible vinculada a dispositivo (`VEHICLE` o `TRAILER`), no por `fleet_set` como condición de existencia.
- `Tracking` muestra todas las unidades visibles 24/7 (con o sin viaje activo).
- `Execution` filtra por órdenes en `stage EXECUTION`; una desasignación saca la unidad de tabs de execution pero no del tracking realtime.
- Tarjeta/lista:
  - título primario: vehículo (`unit_code`).
  - remolque: mostrar si existe; si no, `Sin remolque` (bobtail).
  - telemetría mostrada según `source_device_type` resuelto (`TRAILER` o `VEHICLE`).
- Señal y posición (best practice telemática):
  - no ocultar unidad por falta de señal reciente.
  - mantener marker en última ubicación válida (`Last Known Position`).
  - mostrar antigüedad de señal (`Última señal hace X min`) y estado visual `ONLINE/STALE/OFFLINE`.
  - mostrar movimiento con estado independiente (`MOVING/IDLE/PARKED`) sin confundirlo con conectividad.
  - `Tracking` y `Execution` conservan visibilidad de unidades stale/offline; en `Execution` mostrar warning operativo.
- Semántica visual operativa (estándar vigente en UI):
  - mantener `MobilityIndicator` como estándar de movimiento.
  - `MOVING`: flecha en color primary cuando hay señal vigente.
  - `IDLE/STOPPED`, `STALE` y `OFFLINE`: representación neutral/gris según componente actual.
  - en `Realtime`, la temperatura se usa para observabilidad de sensor (disponible/sin dato/error), no para severidad operativa de ejecución (`normal/warning/critical`).
  - el punto/círculo térmico del marker en `Realtime` no debe representar flags de excursión de `Execution`; esa semántica pertenece al módulo de ejecución.
- Reglas de visualización para resumen de unidad (sin rediseño de UI):
  - `CAN + Standard (vehículo/remolque)`: `[Modo: Start/Stop] + [Setpoint] + [Temp] + [Error si existe]`.
  - `CAN + HYB`: `[Modo: Start/Stop] + [Setpoint] + [Temp1] + [Temp2] + [Error si existe]`.
  - `SIN CAN + HYB`: `[Modo: -] + [Setpoint: -] + [Temp1] + [Temp2] + [Disabled]`. `Tab Reefer: Disabled`.
  - `SIN CAN + Standard (vehículo/remolque)`: `[Modo: -] + [Setpoint: -] + [Temp] + [Disabled]`. `Tab Reefer: Disabled`.
  - `Error` solo se muestra cuando existe código real en payload.
- Mantener Google Maps y markers actuales.
- Actualización de marker en tiempo real:
  - el marker se refresca automáticamente por eventos de `Supabase Realtime` sobre `ct_unit_live_state` (o vista derivada de unidades live) + proyección en servicio.
  - al llegar nueva telemetría válida (`message_ts`, `lat`, `lng`), el marker actualiza posición/estado sin recargar la página.
  - sin telemetría nueva, el marker conserva `Last Known Position` y solo cambia su estado visual (`ONLINE/STALE/OFFLINE`).
- Dirección y temperatura:
  - priorizar campos persistidos (`address_text`, `temp_1_c`, `temp_2_c`, `temperature_c`).
  - usar `telematics` raw solo como fallback técnico.
- Drawer `Estado` (Realtime) en alcance actual:
  - 1) `Conectividad`: `ONLINE/STALE/OFFLINE` + `Última señal`.
  - 2) `Movimiento`: estado operativo + velocidad.
  - 3) `Ignición`.
  - 4) `Temperatura` como señal de disponibilidad de sensor (valor / sin dato / error), sin lectura operacional de excursión.
  - indicadores de salud de flota (batería/satélites/etc.) quedan como mejora incremental opcional y no forman parte del alcance visual obligatorio actual.
- Mantener lineamientos de mapa del proyecto:
  - `APIProvider` solo en rutas que usan mapa.
  - `disableDefaultUI={true}` y controles custom (`MapSideControls`).
  - evitar flicker/desmontajes en loading.

## B) Execution (stage + substatus, estado implementado)

Referencia de estados: `docs/business/state-orders.md`.

### 1. Alcance funcional vigente
- `Execution` en Control Tower se filtra por stage `EXECUTION` con substatus:
  - `IN_TRANSIT`
  - `AT_DESTINATION`
  - `DELIVERED`
- Los flags operativos (retraso, excursión térmica, etc.) son contexto y **no** cambian substatus.
- Regla vigente de UI: el estándar visual actual se preserva y cualquier mejora debe ser incremental sobre componentes existentes (no rediseño).
- Consistencia obligatoria de modelado: lista/mapa/drawer deben proyectar el mismo modelo de estados (movimiento, conectividad y temperatura), sin renombrar ni reinterpretar estados por vista.

### 2. Backend y datos (as-is)
- No existe aún un backend separado de `Execution` (`controlTowerExecution.service` dedicado).
- La resolución de estado de ejecución se hace hoy sobre `dispatch_orders`:
  - filtro por `org_id`
  - `stage = 'EXECUTION'`
  - `substatus in ('IN_TRANSIT','AT_DESTINATION','DELIVERED')`
  - relación por `fleet_set_id` activo en la vista de Control Tower.
- No forman parte del alcance actual:
  - `ct_execution_session`
  - `ct_track_point`
  - `ct_execution_metrics`
- La ingesta realtime mantiene `ct_unit_live_state` como fuente telemática de estado actual.

### 3. UI/UX implementada (as-is)
- Tabs visibles en la página:
  - `Tracking` (universo visible actual)
  - `En Ejecución` (órdenes activas de ejecución)
  - `En Tránsito`
  - `En Destino`
  - `Completadas`
- Reglas actuales de filtrado:
  - `En Ejecución`: `executionSubstatus != null && executionSubstatus != 'DELIVERED'`
  - `En Tránsito`: `executionSubstatus === 'IN_TRANSIT'`
  - `En Destino`: `executionSubstatus === 'AT_DESTINATION'`
  - `Completadas`: `executionSubstatus === 'DELIVERED'`
- Drawer:
  - `General` aparece cuando la unidad tiene viaje activo.
  - `Estado`, `Temperatura`, `Gráficos`, `Info` se mantienen.
  - `Reefer` se muestra solo cuando `has_can=true`; sin CAN no se habilita.
  - No se monta tab de alertas en el flujo actual de Control Tower.
  - `Estado` debe reutilizar los estados ya resueltos en la unidad mostrada en lista (misma semántica, sin estados alternos por componente).

### 4. Modelo de estados operativos en UI (vigente)
- Se manejan dos dimensiones separadas:
  - **Movimiento/conectividad**: estado de movilidad y frescura de señal.
  - **Temperatura**: condición térmica (normal/warning/critical) y error de reefer cuando exista.
- `MobilityIndicator` es el estándar actual de movimiento y debe preservarse como base para mejoras.
- La salud de flota (`device_health`) no está en el alcance visual actual de Execution como semántica de color obligatoria.

### 5. Mejoras incrementales permitidas (sin cambiar el estándar visual)
- Completar tab `General` con datos reales de orden en ejecución (ruta, ETA, progreso) reutilizando layout actual.
- Completar tab `Gráficos` con histórico cuando exista fuente persistida de track.
- Agregar indicadores adicionales de salud de flota en `Estado` o `Info` como datos complementarios (sin reemplazar semántica visual de movilidad vigente).
- Extraer servicio dedicado de `Execution` cuando el volumen de consultas lo requiera, sin romper contratos actuales de UI.

## RLS, Realtime y retención
- Aplicar RLS por `org_id` en todas las tablas `ct_*`.
- Definir políticas con `has_org_min_role(org_id, 'ROLE'::user_role)` para aislar multi-tenant.
- Habilitar Realtime en `ct_unit_live_state`.
- Si se implementa una vista/tabla derivada de unidades live (ej. `ct_realtime_units_live`), habilitar Realtime también allí.
- Retención recomendada:
  - `ct_unit_live_state`: solo estado actual.
  - `ct_track_point`: 30-90 días hot, luego archive/delete.

## Reglas operativas de visualización
- `Tracking` opera sobre unidades visibles por vínculo de dispositivo (`connection_device`) y no depende de `fleet_set` activo.
- `Execution` opera sobre órdenes activas en ejecución y sus `fleet_sets` asociados.
- Consistencia obligatoria entre vistas: lista, mapa y drawer deben usar el mismo modelo de estado para movimiento, conectividad y temperatura.
- Al desasignar una orden/fleet set:
  - la unidad permanece visible en `Tracking` mientras exista vínculo válido de dispositivo.
  - la unidad deja de aparecer en tabs de `Execution` si pierde contexto de ejecución activo.
- `RIGID/VAN`: la fuente de posición/estado se resuelve desde device de vehículo.
- `TRACTOR+TRAILER`:
  - priorizar telemetría del remolque cuando exista y esté fresca.
  - fallback a vehículo cuando remolque esté stale/offline o no tenga device.
- conductor (`driver_id`) no altera la resolución telemática; afecta solo semántica operativa del `fleet_set`.

## Fases de implementación (actualizadas)
1. Fase 1 (implementada)
- `ct_unit_live_state`
- `ingest-flespi-stream`
- UI Control Tower con filtros de Execution (`IN_TRANSIT`, `AT_DESTINATION`, `DELIVERED`) y tabs actuales
- reemplazo de mocks por lectura real para estado operativo base

2. Fase 2 (incremental)
- enriquecer `General` y `Gráficos` con datos reales de ejecución
- opcional: servicio dedicado `Execution` sin rediseño de UI

3. Fase 3 (opcional avanzado)
- histórico/métricas de ejecución persistidas (`ct_track_point`, `ct_execution_metrics`) si el negocio lo prioriza
- hardening de performance y reproceso controlado

## Alineación con reglas de base de datos
- No usar triggers nuevos para automatización (restricción del proyecto); resolver apertura/cierre de sesión vía servicio backend (RPC/Edge Function) y transiciones explícitas.
- Usar `timestamp with time zone` en todas las marcas de tiempo.
- Usar `numeric` para temperatura/pesos/costos.
- Mantener `org_id` en escrituras y filtros de actualización/borrado.
- Evitar `DELETE` físico de datos operativos; preferir cierre de sesión (`status='CLOSED'`, `ended_at`) y retención programada para telemetría.
