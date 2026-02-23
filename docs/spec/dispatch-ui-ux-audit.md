# Dispatch + Orders Reference
## Estado actual y roadmap de cierre por Stage y por Capa

**Fecha:** Febrero 2026  
**Versión:** 3.2 (documento de referencia)  
**Scope:** `DISPATCH`, `TENDERS`, `SCHEDULED` (tabla/lista).  
**Fuera de scope:** `EXECUTION`, `CONCILIATION`, `Gantt`.
**Incluye:** cierre de `Matching` como competencia de `Dispatch`.

---

## 1. Objetivo

Este documento reemplaza la auditoría inicial por una referencia operativa para cerrar la implementación de:

- `Dispatch` (Shipper/Planner)
- `Orders` (Carrier)

Cubre:

1. Estado actual verificado en código
2. Brechas contra los requerimientos de negocio
3. Roadmap por módulo, stage y capa:
- Base de datos
- Backend (RPC/queries/validaciones)
- Capa de servicios (hooks + stores + mappers)
- UI/UX (reuso de componentes existentes)

---

## 1.1 Principio de implementación (acordado)

- `Dispatch` y `Orders` cuentan con cobertura UI/UX prácticamente completa para el scope actual (tablas, diálogos, bulk actions, menús contextuales, drawer con acciones internas, edición en drawer, selección/cambio de fleet set, creación de órdenes).
- La estrategia de cierre **no** parte de rediseño visual.
- En UI/UX solo se permite:
- reutilizar componentes existentes,
- adaptar wiring/comportamiento,
- y agregar elementos nuevos solo si hay brecha funcional estrictamente necesaria.
- La mayor carga de cierre se concentra en:
- `Base de datos` (contrato y trazabilidad),
- `Backend` (RPCs, reglas, atomicidad),
- `Servicios` (hooks/mappers/estado en frontend).

## 1.2 Política de veracidad de datos (obligatoria)

Regla transversal para todo el scope (`Dispatch` + `Orders`):

- No se permite ningún dato `mock`, `hardcodeado`, fallback ficticio o semántica simulada en flujo productivo.
- Toda vista debe renderizar estado real persistido en DB o derivado de RPC/servicio oficial.
- Si un dato no existe en DB/servicio, se muestra estado vacío/controlado (`N/A`, `sin dato`) y no se inventa contenido.
- Cualquier compatibilidad, score, reason code, capacidad, ruta o timeline debe venir de contrato backend persistido.
- Queda prohibido mantener lógica client-side que “corrija” estado después de RPC (fix-up manual); la consistencia debe ser transaccional en backend.

## 1.3 Reglas de implementación (must, en cualquier nivel)

Estas reglas aplican sin excepción a `DB`, `Backend`, `Servicios` y `UI/UX`:

- `R1` Persistencia real: toda acción de negocio debe persistir en DB antes de reflejarse como estado confirmado en UI.
- `R2` Fuente única de verdad: stage/substatus, outcomes, reason codes, compatibilidad y score provienen de contrato backend oficial.
- `R3` Cero datos falsos: prohibido `mock`, hardcode y fallback inventado en flujos productivos.
- `R4` Cero fix-up client-side: frontend no puede “reparar” estado después de RPC; si hay inconsistencia, se corrige en backend transaccional.
- `R5` Tipado estricto: no se permite `@ts-ignore` en flujo crítico ni mappers no tipados.
- `R6` Trazabilidad completa: toda transición y decisión crítica debe dejar rastro auditable (historial/evento).
- `R7` Reuso UI/UX: no rediseñar componentes existentes; solo adaptar wiring/comportamiento salvo brecha funcional justificada.

Checklist obligatorio por PR:

- [ ] No introduce `mockData`, hardcodes ni placeholders ficticios en flujo productivo.
- [ ] Las mutaciones de estado se resuelven en DB/RPC y no en parches de frontend.
- [ ] La UI refleja datos persistidos y no deriva semántica crítica localmente.
- [ ] Se conserva auditabilidad de transiciones y decisiones.
- [ ] No agrega `@ts-ignore` en rutas críticas de Dispatch/Orders.
- [ ] Mantiene estrategia de reuso de componentes UI existentes.

---

## 2. Fuentes canónicas

- `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/docs/business/dispatch.md`
- `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/docs/business/orders.md`
- `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/docs/business/state-orders.md`
- `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/docs/business/matching-orders.md`
- `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/docs/spec/dispatch-ui-ux-audit.md` (este documento)

---

## 3. Estado actual verificado (código)

### 3.1 Cobertura global

Estado general real: **🟡 Parcial avanzada**.

Implementado:

- Modelo `stage + substatus` y transiciones base centralizadas.
- Tabla/lista operativa para Dispatch y Orders.
- Drawer/dialogs/actions bulk disponibles en ambos módulos.
- Flujos principales de tender: enviar, aceptar, rechazar, fail-after-accept (UI y parte de servicios).

Pendiente/crítico:

- Contrato de datos incompleto para priorización y excepciones estructuradas.
- Inconsistencias entre transición gobernada vs updates directos.
- Dependencias de mocks y `@ts-ignore` en Orders.
- Selección de fleetset aún con metadata simulada (compatibilidad/score/perfil/capacidad híbrida).
- Matching parcialmente implementado y desalineado de la especificación actual.

### 3.2 Evidencia de componentes

#### Dispatch

- Tabla/lista + acciones: `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/dispatch/views/list/DispatchOrdersTable.tsx`
- Sidebar por stage/substatus: `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/dispatch/views/list/DispatchBoardsSidebar.tsx`
- Drawer + tabs + cancel/reassign/send: `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/dispatch/components/drawer/DispatchDrawer.tsx`
- Selección de fleetset (con TODOs de compatibilidad): `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/dispatch/components/drawer/DispatchFleetsetSelectionView.tsx`
- Hook principal (incluye `revertToAssigned` por update directo): `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/dispatch/hooks/useDispatchOrders.ts`

#### Orders

- Lista principal (con `@ts-ignore`): `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/orders/OrdersList.tsx`
- Tabla (usa helpers legacy + `@ts-ignore`): `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/orders/components/OrdersTable.tsx`
- Drawer (aún usa `mockRoutes`): `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/orders/components/drawer/OrderDrawer.tsx`
- Helpers de estado/equipo (importa `mockData`): `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/orders/utils/orders-helpers.ts`
- Selección de fleetset (scores y capacidades mock): `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/orders/components/drawer/FleetsetSelectionView.tsx`
- Servicio orders (rechazo con “fix-up” manual post RPC): `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/services/database/orders.service.ts`

#### Contrato de estado/DB

- Máquina de estados: `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/types/dispatchOrderStateMachine.ts`
- Tipos DB (campos de tender y RPCs presentes): `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/types/database.types.ts`
- Servicio de dispatch + transitionState: `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/services/database/dispatchOrders.service.ts`

#### Matching (Dispatch)

- Documento objetivo de matching: `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/docs/business/matching-orders.md`
- Candidatos por RPC: `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/services/database/dispatchOrders.service.ts`
- Auto-assign RPC wrappers: `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/services/database/dispatchOrders.service.ts`
- Validaciones locales de hard constraints: `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/dispatch/utils/validation.ts`
- Hook de consumo de candidatos: `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/dispatch/hooks/useDispatchOrders.ts`
- UI de selección de fleetset (actualmente con score/mock): `/Users/antonioayala/Desktop/ColdSync/coldsync_tms/src/features/dispatch/components/drawer/DispatchFleetsetSelectionView.tsx`

### 3.3 Estado actual verificado (Supabase vía MCP)

Estado general DB real para el scope: **🟡 Parcial avanzada**.

#### Inventario confirmado (tablas relevantes)

- Núcleo de orquestación:
  - `dispatch_orders`
  - `dispatch_order_items`
  - `dispatch_order_state_history`
  - `dispatch_order_carrier_history`
- Catálogos y maestros para Dispatch/Orders:
  - `lanes`, `lane_stops`, `locations`
  - `fleet_sets`, `carriers`, `vehicles`, `trailers`, `drivers`
  - `thermal_profile`, `products`
  - `cancellation_reasons`, `rejection_reasons`
- Realtime/Execution (fuera de scope funcional, pero relevante para integración):
  - `ct_unit_live_state`

#### Relaciones (FK) críticas confirmadas

- `dispatch_orders.lane_id -> lanes.id`
- `dispatch_orders.fleet_set_id -> fleet_sets.id`
- `dispatch_order_items.dispatch_order_id -> dispatch_orders.id`
- `dispatch_order_items.product_id -> products.id`
- `dispatch_order_items.thermal_profile_id -> thermal_profile.id`
- `dispatch_order_state_history.dispatch_order_id -> dispatch_orders.id`
- `dispatch_order_carrier_history.dispatch_order_id -> dispatch_orders.id`
- `dispatch_order_carrier_history.carrier_id -> carriers.id`
- `fleet_sets` vincula recursos operativos (`carrier_id`, `driver_id`, `vehicle_id`, `trailer_id`)
- `ct_unit_live_state` vincula unidades (`vehicle_id`, `trailer_id`, `connection_device_id`)

#### Modelo de estados en DB (enums)

- `dispatch_order_stage` incluye:
  - `DISPATCH`, `TENDERS`, `SCHEDULED`, `EXECUTION`, `CONCILIATION`
- `dispatch_order_substatus` incluye para el scope:
  - `NEW`, `UNASSIGNED`, `ASSIGNED`, `PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `PROGRAMMED`, `DISPATCHED`, `EN_ROUTE_TO_ORIGIN`, `AT_ORIGIN`, `LOADING`, `OBSERVED`

#### Hallazgos técnicos de integridad/seguridad a corregir

- Se observó anomalía en el constraint `dispatch_orders_cancellation_reason_fk` (composición no usual al inspeccionar columnas asociadas al FK), requiere validación/corrección explícita en migración.
- En advisors de Supabase aparecen funciones críticas con `search_path` mutable (hardening pendiente), incluyendo RPCs del flujo Dispatch/Orders.

#### Hallazgos de cobertura vs negocio (DB)

- Base de stages/substatus, historial y ciclo tender existe en DB.
- Persiste brecha para trazabilidad completa de matching:
  - reason codes bloqueantes por candidato (`NO_MATCH_*`) y huella/snapshot de decisión.
- Persiste brecha para operación híbrida por compartimiento:
  - no se evidencia contrato explícito por compartimentos/zona térmica en el núcleo de órdenes para gobernar validación fina de híbridas.

---

## 4. Gap analysis por capa

## 4.1 Base de datos

Estado: **🟡 Parcial**

Existe:

- `dispatch_orders.stage/substatus`
- `carrier_assigned_at`, `response_deadline`
- `dispatch_order_state_history`, `dispatch_order_carrier_history`
- `dispatch_order_items` con relación a `products` y `thermal_profile`
- RPCs de ciclo tender (`send_dispatch_order_to_carrier`, `carrier_accept_dispatch_order`, `carrier_reject_dispatch_order`)

Falta para requerimiento objetivo:

- Priorización persistida:
- `priority_effective`
- `priority_bucket`
- Excepción estructurada en orden:
- `exception_type`, `reason_code`, `reason_note`, `exception_detected_at`
- Catálogo formal para observaciones de origen:
- `observation_code`, `severity`, `can_depart`, `requires_reinspection`, `max_correction_minutes`
- Campos de seguimiento de riesgo post-aceptación:
- `eta_committed_at`, `eta_committed_value`, `eta_calculated_value`, `risk_level`, `risk_detected_at`
- Campos de matching auditable:
- `reason_code` bloqueante por candidato (`NO_MATCH_*`)
- `block_reason_code`, `blocked_from`, `blocked_until`, `blocked_by`, `evidence_ref` para activos bloqueados
- snapshot/huella de decisión de matching por orden para trazabilidad
- Contrato explícito para híbridas por compartimiento/multi-zona (perfil térmico + peso por compartimiento)
- Corrección del FK `dispatch_orders_cancellation_reason_fk` para integridad consistente
- Hardening de funciones (fijar `search_path`) en RPCs críticas de Dispatch/Orders

## 4.2 Backend

Estado: **🟡 Parcial**

Existe:

- RPCs clave para enviar/aceptar/rechazar.
- Validación de transiciones por máquina de estado en servicio de dispatch.

Brechas:

- `rejectOrder` necesita “parches” post-RPC para historia/cleanup, señal de contrato incompleto.
- Reversión `PENDING -> ASSIGNED` en Dispatch se hace por update directo en vez de transición gobernada (riesgo de trazabilidad inconsistente).
- Falta consolidar TTL+expiración como flujo 100% determinístico y auditable end-to-end.
- No hay contrato unificado para motivos estructurados pre y post-aceptación.
- Matching no está cerrado como pipeline determinístico de 6 pasos (elegibilidad, hard constraints, temporalidad/ETA origen, conflictos, cupos, ranking) según `matching-orders.md`.
- Falta contrato backend para bloquear selección de candidatos `NO_MATCH_*` en el punto de decisión.

## 4.3 Capa de servicios

Estado: **🟡 Parcial**

Existe:

- Hooks de Dispatch y Orders funcionales.
- Integración con store global y realtime básico.

Brechas:

- Mappers inconsistentes entre `DispatchOrder` y `CarrierOrder` (adaptaciones ad-hoc).
- Dependencia de helpers legacy con tipos antiguos.
- Uso de `any` y `@ts-ignore` en puntos críticos de flujo.
- Lógica de compatibilidad fleetset aún incompleta (híbrido/perfil térmico/capacidad real por compartimiento).
- Lógica de matching dividida entre RPC + validaciones locales sin fuente única de verdad ni reason codes homogéneos.

### 4.3.1 Auditoría de servicios (estado real)

Estado general: **🟡 Parcial con deuda técnica concentrada en Orders y matching**.

Hallazgos P0 (bloquean cierre funcional correcto):

- `orders.service` ejecuta rechazo con fix-up manual post RPC, por lo que la verdad de estado no está cerrada en backend.
- `OrderDrawer` depende de `mockRoutes` para route/lane details en lugar de contrato real.
- `orders-helpers` arrastra dependencia de `mockData` para derivaciones críticas.

Hallazgos P1 (riesgo alto de desalineación DB↔UI):

- `OrdersList` y `OrdersTable` mantienen `@ts-ignore` y adaptaciones legacy que enmascaran desajustes de contrato.
- `DispatchFleetsetSelectionView` y `FleetsetSelectionView` aún usan compatibilidad/score simulado o incompleto.
- Matching en frontend mezcla validación local y resultado RPC sin reason codes unificados como fuente única.

Hallazgos P2 (deuda de robustez):

- Uso de `any` en rutas de mapeo y acciones bulk.
- Duplicidad de criterios de orden/prioridad entre hooks/lista/sidebar.

### 4.3.2 Reglas de cierre para servicios

- Todas las mutaciones de estado deben cerrarse en RPC transaccional (sin parches client-side).
- Hooks de Dispatch/Orders solo orquestan: no reescriben semántica de estado.
- Mappers tipados estrictos (`DispatchOrder`/`CarrierOrder`) sin `@ts-ignore`.
- `matching` debe consumir un único DTO backend con `score`, `reason_code`, `hard_blocked`, `temporal_feasible`, `allocation_fit`.

## 4.4 UI/UX

Estado: **🟡 Parcial avanzada**

Existe:

- Componentes reutilizables adecuados: tabla, drawer, dialogs, bulk actions, badges, sidebar.
- Navegación por stages/substatus en Dispatch.

Brechas:

- No se identifican brechas de diseño estructural; las brechas son principalmente de cableado de datos/semántica.
- Orders aún depende de mock para lane/route y helpers legacy.
- Filtros/orden y badges dependen de datos no completamente consolidados (prioridad efectiva, reason codes, outcomes).
- En Dispatch, la selección de fleetset requiere datos reales de matching (`score`, `NO_MATCH_*`), manteniendo el mismo componente actual.

---

## 5. Roadmap por módulo, stage y capa

## 5.1 Dispatch (Shipper/Planner)

### Stage: DISPATCH

#### Base de datos

- Agregar campos de prioridad operativa (`priority_effective`, `priority_bucket`).
- Agregar campos de excepción estructurada (`exception_type`, `reason_code`, `reason_note`, `exception_detected_at`).
- Catálogo de `reason_code` para backlog/vencidas/reasignación.

#### Backend

- Exponer endpoint/RPC para resolver vencidas con motivo obligatorio.
- Centralizar transición `ASSIGNED <-> UNASSIGNED` por `transitionState` (sin updates directos).
- Garantizar escritura uniforme en `dispatch_order_state_history`.

#### Servicios

- Unificar un único sorter determinístico para lista/sidebar/acciones.
- Eliminar conversiones ad-hoc a tipos de Orders en la tabla de Dispatch.
- Completar `useUnassignedOrders` con perfil térmico real (sin TODO).

#### UI/UX (tabla/lista)

- Reusar colas/sidebar/drawer actuales sin cambios estructurales.
- Solo ajustar binding para prioridad/excepción y resolución de vencidas.

### Stage: TENDERS

#### Base de datos

- Estandarizar registro de timestamps de tender (`assigned_at`, `responded_at`, `response_deadline`) sin duplicidades.
- Homologar `outcome_reason` contra catálogo.

#### Backend

- Garantizar expiración TTL auditable con transición controlada a `EXPIRED` y retorno a `UNASSIGNED`.
- Corregir contrato de rechazo para evitar “fix-ups” manuales en capa de servicio.

#### Servicios

- Consolidar acción `send-to-carrier` batch e individual con mismas validaciones.
- Sincronizar countdown TTL y estado en store sin lógica duplicada.

#### UI/UX (tabla/lista)

- Mantener componentes existentes (`DispatchOrdersTable`, `DispatchBoardsSidebar`, `DispatchDrawer`).
- Ajustar filtros/contadores con reglas de negocio final (sin cambios de layout).

### Stage: SCHEDULED

#### Base de datos

- Agregar campos de riesgo post-aceptación y catálogo de observaciones con severidad.
- Persistir decisión de salida de observed (`continue`, `reinspect`, `fail-after-accept`).

#### Backend

- Implementar evaluador de riesgo ETA post-aceptación y triggers de escalación.
- Reglas de retorno a `DISPATCH/UNASSIGNED` por fail-after-accept no resuelto.

#### Servicios

- Integrar timeline de eventos Scheduled en historial unificado.
- Exponer operaciones de observed con SLA por severidad.

#### UI/UX (tabla/lista)

- Mantener vistas y drawer actuales; solo cablear datos de riesgo/observaciones.
- Sin cambios de diseño base ni nuevas pantallas para este scope.

---

## 5.2 Orders (Carrier)

### Stage: TENDERS

#### Base de datos

- Alinear outcomes y motivos (`ACCEPTED`, `REJECTED`, `EXPIRED`) con catálogos.
- Consolidar estructura de historial para decisiones del carrier.

#### Backend

- Endurecer RPCs para que `accept/reject/accept-with-changes` dejen estado + historial consistente sin reparaciones client-side.
- Resolver swap de fleetset con transacción única (evitar estados parciales).

#### Servicios

- Eliminar dependencia de `mockData` y helpers legacy.
- Reemplazar `@ts-ignore` por tipos unificados de dominio.
- Consolidar `getRejectionReasons` en fuente DB (no constante local).

#### UI/UX

- `OrdersTable`: migrar a helpers tipados y semántica real de estado.
- `OrderDrawer`: eliminar `mockRoutes`; usar lane/stops reales desde la orden.
- `FleetsetSelectionView`: reemplazar score/capacidad/perfil mock por datos reales + compatibilidad.
- Mantener componentes existentes; solo ajustar data-binding y validaciones.

### Stage: SCHEDULED (seguimiento carrier del compromiso)

#### Base de datos

- Modelar eventos post-aceptación y `fail-after-accept` con reason code estructurado.
- Persistir resolución de `OBSERVED` con severidad y ventana.

#### Backend

- Endpoint único para fail-after-accept con reglas por substatus permitido.
- Validación de SLA de observaciones y transición automática según matriz.

#### Servicios

- Unificar historial de compromisos en tabs de Orders (`detalles/historial`) sin mezclar reglas locales.
- Propagar estado de Scheduled en tiempo real hacia la bandeja `Mis Compromisos`.

#### UI/UX

- Reusar `FailAfterAcceptView` y `OrderHistoryTab`.
- Agregar semántica de severidad/ventana en `Observed` sin crear componentes nuevos.
- Bandeja `Mis Compromisos` ordenada por riesgo operativo y proximidad de hito.

---

## 6. Roadmap por componente (implementación)

## 6.1 Dispatch

- `DispatchBoardsSidebar`: cerrar filtros de excepción y contadores definitivos por stage.
- `DispatchOrdersTable`: eliminar mapeo a tipo Orders y usar DTO propio de Dispatch.
- `DispatchDrawer`: completar acciones gobernadas por transición; incorporar resolución de vencidas/observadas.
- `DispatchFleetsetSelectionView`: reemplazar compatibilidad y score mock por evaluación real.
- `useDispatchOrders`: eliminar update directo en `revertToAssigned`; usar transición auditada.
- `dispatchOrders.service`: consolidar `transitionState` como única puerta de cambio de estado.

## 6.2 Orders

- `OrdersList`: remover `@ts-ignore` y normalizar eventos de aceptación/rechazo/fail.
- `OrdersTable`: migrar helpers a datos reales y tipado estricto.
- `OrderDrawer`: reemplazar `mockRoutes` por lane data real.
- `FleetsetSelectionView`: usar compatibilidad real y capacidad térmica efectiva.
- `orders-helpers`: eliminar dependencia de `mockData` y usar contrato `CarrierOrder` real.
- `orders.service`: remover fix-ups manuales post-RPC y asegurar atomicidad transaccional.

## 6.3 Servicios (DB + hooks) — cierre de persistencia real

- `dispatchOrders.service`:
- usar `transitionState` como única puerta de cambio de stage/substatus.
- eliminar updates directos no auditados (`revert` por update plano).
- `orders.service`:
- mover consistencia de `reject/accept/fail-after-accept` a RPC backend.
- eliminar correcciones manuales posteriores en frontend.
- `useDispatchOrders` / `useOrders`:
- quitar lógica de “reconciliación local” de estado.
- consumir snapshots/DTOs backend como verdad única.
- `orders-helpers` y mappers:
- eliminar toda dependencia a `mockData`.
- unificar derivaciones de lane/stops/thermal/capacidad desde DB.
- `FleetsetSelectionView` (Dispatch/Orders):
- score/compatibilidad/reason codes solamente desde matching backend.
- bloquear selección de candidatos `NO_MATCH_*` sin excepciones.

## 5.3 Matching (competencia de Dispatch)

### Alcance funcional

- Matching debe cerrar la decisión de factibilidad para `DISPATCH/NEW|UNASSIGNED -> ASSIGNED`.
- Solo candidatos `MATCH_SUCCESS` pueden ser seleccionables.
- Candidatos con `NO_MATCH_*` deben verse con motivo estructurado y acción bloqueada.

### Base de datos

- Definir contrato persistente de resultados de matching por orden/candidato con `reason_code`.
- Incorporar modelo de bloqueo temporal de activos (`NO_MATCH_ASSET_BLOCKED`) con vigencia y evidencia.
- Persistir huella de decisión (input relevante, score, candidato seleccionado, actor/timestamp).

### Backend

- Unificar en RPCs la evaluación completa: hard constraints + factibilidad temporal (`ETA at Origen`) + conflictos + cupos + ranking.
- Garantizar atomicidad en `assign_dispatch_to_fleet_set` y `auto_assign_dispatch_to_best_fleet`.
- Exponer reason codes bloqueantes antes de confirmar asignación.

### Servicios

- Convertir `validation.ts` en capa auxiliar de presentación; la fuente de verdad de factibilidad debe ser backend.
- Normalizar DTO de candidatos (`score`, `reason_code`, `hard_blocked`, `temporal_feasible`, `allocation_fit`).
- Hacer que `getFleetCandidates` y `autoAssignFleet` consuman el mismo contrato.

### UI/UX

- En `DispatchFleetsetSelectionView` mostrar:
- score real del matching
- etiqueta de factibilidad
- reason code cuando no sea elegible
- bloqueo explícito de selección para `NO_MATCH_*`
- Reusar componentes actuales (lista, badge, tooltip, drawer) sin rediseño.

---

## 7. Plan de ejecución sugerido

### Fase 0 — Cierre de Matching en Dispatch

- Alinear contrato DB/RPC con `matching-orders.md`.
- Eliminar score/capacidad/perfil mock en selección de fleetset.
- Bloquear selección de candidatos no factibles con `reason_code` visible.

### Fase 1 — Contrato y saneamiento (base)

- Cerrar contrato DB + RPC para TENDERS (`accept/reject/expired`) y motivos estructurados.
- Limpiar dependencias mock + `@ts-ignore` en Orders.
- Normalizar transición de estado en Dispatch (`transitionState` único).
- Corregir integridad de FK detectada en `dispatch_orders_cancellation_reason_fk`.
- Aplicar hardening de funciones SQL (`search_path`) en RPCs críticas.

### Fase 2 — Cierre Stage DISPATCH (tabla)

- Priorización efectiva y excepciones estructuradas.
- Filtros/orden determinístico y resolución de vencidas.
- Fleetset compatibility real en drawer de Dispatch.

### Fase 3 — Cierre Stage TENDERS (Dispatch + Orders)

- TTL end-to-end confiable y auditable.
- Rechazo/expiración con retorno automático limpio a `DISPATCH/UNASSIGNED`.
- Historial carrier consistente sin remediación client-side.

### Fase 4 — Cierre Stage SCHEDULED (seguimiento de compromiso)

- Riesgo ETA + observed matrix + fail-after-accept estructurado.
- UX de seguimiento en lista/drawer reutilizando componentes (solo adaptación de comportamiento).

### Criterio transversal de ejecución

- Si una tarea puede resolverse en `DB`, `Backend` o `Servicios`, no se abre trabajo de rediseño UI.
- Las tareas UI deben justificarse como “adaptación de wiring” y no como “cambio de componente”.

---

## 8. Definition of Done (DoD)

- Todas las transiciones `DISPATCH/TENDERS/SCHEDULED` pasan por motor gobernado y quedan auditadas.
- Sin `mockData`, sin `@ts-ignore` y sin `any` en flujo crítico Dispatch/Orders.
- TTL y outcomes de tender son determinísticos y replicables.
- Fleetset selection valida compatibilidad real (estándar e híbrido por compartimiento).
- UI/UX usa componentes existentes; nuevos componentes solo con justificación explícita.
- Dispatch (tabla) y Orders (tabla+drawer) reflejan el mismo contrato de estado.
- No existen mocks, hardcodes ni datos ficticios en la experiencia productiva; la UI refleja únicamente estado persistido en DB y servicios oficiales.

---

## 9. Notas de gobierno

- Este documento es referencia viva de implementación.
- Cualquier cambio de reglas funcionales debe nacer en `docs/business/*` y luego actualizar este roadmap.
- El avance se reporta por módulo/stage/capa con check de salida por fase.
