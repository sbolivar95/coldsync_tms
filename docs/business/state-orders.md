# 🔄 Gestión de Estados de Órdenes de Despacho

## Modelo de Estados: Stage + Substatus

Cada orden de despacho tiene **dos dimensiones de estado** en todo momento:

- **Stage (Etapa):** En qué módulo vive la orden actualmente
- **Substatus (Subestado):** Qué está pasando con la orden dentro de esa etapa

Adicionalmente, cada transición se registra en un **historial de estados** para trazabilidad completa.

---

## Etapas Globales

```

DISPATCH → TENDERS → SCHEDULED → EXECUTION → CONCILIATION

```

| Etapa | Módulo | Propósito |
|-------|--------|-----------|
| **DISPATCH** | Despacho | Planificación y asignación inicial |
| **TENDERS** | Orders | Compromiso operativo del carrier |
| **SCHEDULED** | Programación | Pre-embarque, carga y validación física |
| **EXECUTION** | Torre de Control | Monitoreo en ruta y entrega |
| **CONCILIATION** | Conciliación | Auditoría y liquidación financiera |

---

## Subestados por Etapa

### 1. DISPATCH — Planificación y Asignación

| Substatus | Descripción | Acciones |
|-----------|-------------|----------|
| `NEW` | Orden recién creada, sin historial previo | Validar datos, verificar disponibilidad |
| `UNASSIGNED` | Orden con historial que regresó al pool (rechazada, vencida, observada) | Re-evaluar y reasignar |
| `ASSIGNED` | Planificador asignó fleetset (borrador interno, carrier no lo ve) | Validar restricciones, enviar al carrier |

**Transiciones:**
- `NEW` → `ASSIGNED` (planificador asigna fleetset)
- `UNASSIGNED` → `ASSIGNED` (planificador reasigna fleetset)
- `ASSIGNED` → `UNASSIGNED` (planificador desasigna)
- `ASSIGNED` → `TENDERS/PENDING` (enviar al transportista)

---

### 2. TENDERS — Compromiso del Carrier

| Substatus | Descripción | Acciones |
|-----------|-------------|----------|
| `PENDING` | Enviada al carrier, TTL activo, esperando respuesta | Monitorear TTL, esperar decisión |
| `ACCEPTED` | Carrier confirmó, firmó declaración jurada digital | Emitir ticket, pasar a Scheduled |
| `REJECTED` | Carrier rechazó — motivo obligatorio | Retornar a DISPATCH/UNASSIGNED para reasignación |
| `EXPIRED` | TTL venció sin respuesta | Retornar a DISPATCH/UNASSIGNED para reasignación |

**Transiciones:**
- `PENDING` → `ACCEPTED` (carrier acepta)
- `PENDING` → `REJECTED` (carrier rechaza)
- `PENDING` → `EXPIRED` (TTL vence)
- `REJECTED` → `DISPATCH/UNASSIGNED` (retorno automático al pool)
- `EXPIRED` → `DISPATCH/UNASSIGNED` (retorno automático al pool)

> **Nota:** Los eventos de Tenders también se registran en `dispatch_order_carrier_history` para métricas de carrier y asignación de cuota (allocation).

---

### 3. SCHEDULED — Programación y Pre-embarque

| Substatus | Descripción | Acciones |
|-----------|-------------|----------|
| `PROGRAMMED` | Orden confirmada, en espera hasta la fecha de salida (comprometida pero no liberada para ir a origen) | Monitorear calendario, preparar despacho |
| `DISPATCHED` | Unidad liberada operativamente para dirigirse a origen (no implica movimiento físico confirmado) | Monitorear salida efectiva, coordinar llegada |
| `EN_ROUTE_TO_ORIGIN` | Unidad en tránsito confirmado hacia el origen (telemetría GPS o evidencia operativa) | Monitorear ETA y coordinación de carga |
| `AT_ORIGIN` | Unidad llegó al punto de carga (geocerca) | Ejecutar checklist pre-embarque |
| `LOADING` | Checklist aprobado, carga en proceso | Monitorear temperatura, registrar producto |
| `OBSERVED` | Fallo en checklist pre-embarque | Resolver, reinspeccionar, o reasignar |

**Transiciones:**
- `PROGRAMMED` → `DISPATCHED` (liberación operativa de la unidad para dirigirse a origen)
- `DISPATCHED` → `EN_ROUTE_TO_ORIGIN` (movimiento confirmado hacia origen)
- `EN_ROUTE_TO_ORIGIN` → `AT_ORIGIN` (geocerca de origen)
- `AT_ORIGIN` → `LOADING` (checklist aprobado)
- `AT_ORIGIN` → `OBSERVED` (checklist fallido)
- `LOADING` → `EXECUTION/IN_TRANSIT` (BOL emitido, unidad sale)
- `OBSERVED` → `LOADING` (problema resuelto, continuar carga)
- `OBSERVED` → `AT_ORIGIN` (reinspección tras corrección)
- `OBSERVED` → `DISPATCH/UNASSIGNED` (no se puede resolver, reasignar)

---

### 4. EXECUTION — Monitoreo y Entrega (Torre de Control)

| Substatus | Descripción | Acciones |
|-----------|-------------|----------|
| `IN_TRANSIT` | Carga sellada, unidad en ruta | Monitoreo GPS/temperatura, alertas automáticas |
| `AT_DESTINATION` | Unidad llegó al punto de entrega (geocerca) | Iniciar descarga, verificar condición |
| `DELIVERED` | Entrega completada con POD (Proof of Delivery) | Validar POD, fotos, firmas |

**Transiciones:**
- `IN_TRANSIT` → `AT_DESTINATION` (geocerca de destino)
- `AT_DESTINATION` → `DELIVERED` (POD recibido)
- `DELIVERED` → `CONCILIATION/PENDING_AUDIT` (automático)

> **Nota:** Las alertas de temperatura, retrasos y paradas en ruta son **eventos** superpuestos al estado, no cambios de substatus. La orden permanece `IN_TRANSIT` aunque haya una alerta térmica.

---

### 5. CONCILIATION — Auditoría y Liquidación

| Substatus | Descripción | Acciones |
|-----------|-------------|----------|
| `PENDING_AUDIT` | Entrega confirmada, auditoría automática en curso | Auditoría SLA, auditoría térmica, cálculo de descuentos |
| `UNDER_REVIEW` | Discrepancias encontradas, revisión humana necesaria | Revisar evidencias, evaluar excursiones térmicas |
| `DISPUTED` | Disputa abierta, carrier presenta descargos | Evaluar evidencias del carrier (dataloggers, fotos) |
| `APPROVED` | Auditoría aprobada o disputa resuelta — listo para facturar | Autorizar facturación |
| `CLOSED` | Factura generada, ciclo de pago cerrado | Reporte final consolidado |

**Transiciones:**
- `PENDING_AUDIT` → `APPROVED` (sin discrepancias)
- `PENDING_AUDIT` → `UNDER_REVIEW` (discrepancias detectadas)
- `UNDER_REVIEW` → `DISPUTED` (disputa abierta)
- `DISPUTED` → `APPROVED` (disputa resuelta)
- `APPROVED` → `CLOSED` (factura generada)

---

### Cross-cutting: CANCELED

Una orden puede ser cancelada **antes de la etapa EXECUTION**:

- ✅ Cancelable desde: `DISPATCH`, `TENDERS`, `SCHEDULED`
- ❌ **NO cancelable** después de `EXECUTION/IN_TRANSIT` (viaje en ejecución)

Al cancelarse, la orden mantiene la etapa donde estaba al momento de la cancelación y el substatus cambia a `CANCELED`. El motivo se registra en el historial.

---

## Flujo Visual Completo

```

DISPATCH             TENDERS           SCHEDULED                 EXECUTION         CONCILIATION
┌────────────┐      ┌───────────┐     ┌──────────────────┐     ┌──────────────┐  ┌──────────────┐
│  NEW       ├─────►│ PENDING   ├────►│ PROGRAMMED       │     │ IN_TRANSIT   ├─►│PENDING_AUDIT │
│            │      │           │     │                  │     │              │  │              │
│ UNASSIGNED │◄─┐   │ ACCEPTED  │     │ DISPATCHED       │     │AT_DESTINATION│  │ UNDER_REVIEW │
│            │  │   │           │     │                  │     │              │  │              │
│ ASSIGNED   │  ├───┤ REJECTED  │     │ EN_ROUTE_TO_ORIGIN│     │ DELIVERED   ─┼─►│ DISPUTED     │
│            │  │   │           │     │                  │     │              │  │              │
│            │  ├───┤ EXPIRED   │     │ AT_ORIGIN        │     │              │  │ APPROVED     │
│            │  │   │           │     │                  │     │              │  │              │
└────────────┘  ├───┤           │     │ LOADING   ◄──────┤     └──────────────┘  │ CLOSED       │
│   └───────────┘     │ OBSERVED ────────┤                      └──────────────┘
└─── (return to UNASSIGNED)
OBSERVED → LOADING (resolved)
OBSERVED → AT_ORIGIN (re-inspect)

```

---

## Timeline de Ejemplo: Orden #DSP-2026-0042

**Carga de pollo — Santa Cruz → Cochabamba**

| # | Timestamp | Stage | Substatus | Evento | Actor |
|---|-----------|-------|-----------|--------|-------|
| 1 | Feb 11 08:00 | DISPATCH | NEW | Orden creada | María (planner) |
| 2 | Feb 11 08:30 | DISPATCH | ASSIGNED | Drag & drop en TRK-1024 | María |
| 3 | Feb 11 09:00 | TENDERS | PENDING | "Enviar al Transportista" — TTL 24h | María |
| 4 | Feb 11 14:00 | TENDERS | ACCEPTED | Carrier confirma, firma declaración | Carlos (carrier) |
| 5 | Feb 12 06:00 | SCHEDULED | PROGRAMMED | Orden confirmada, en espera | Sistema |
| 6 | Feb 12 07:00 | SCHEDULED | DISPATCHED | Unidad liberada para dirigirse a origen | María |
| 7 | Feb 12 07:45 | SCHEDULED | EN_ROUTE_TO_ORIGIN | Movimiento confirmado hacia origen | GPS |
| 8 | Feb 12 08:30 | SCHEDULED | AT_ORIGIN | Unidad en planta (geocerca) | GPS |
| 9 | Feb 12 09:00 | SCHEDULED | LOADING | Checklist OK, carga inicia | Inspector |
| 10 | Feb 12 10:30 | EXECUTION | IN_TRANSIT | BOL emitido, unidad sale | Inspector |
| 11 | Feb 12 18:00 | EXECUTION | AT_DESTINATION | Llega a Cochabamba (geocerca) | GPS |
| 12 | Feb 12 19:00 | EXECUTION | DELIVERED | POD firmado, fotos capturadas | Receptor |
| 13 | Feb 12 19:01 | CONCILIATION | PENDING_AUDIT | Auditoría automática inicia | Sistema |
| 14 | Feb 12 19:05 | CONCILIATION | APPROVED | Sin discrepancias | Sistema |
| 15 | Feb 15 10:00 | CONCILIATION | CLOSED | Factura generada | Billing |

---

## Almacenamiento en Base de Datos

### Columnas en `dispatch_orders`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `stage` | `dispatch_order_stage` (enum) | Etapa actual: DISPATCH, TENDERS, SCHEDULED, EXECUTION, CONCILIATION |
| `substatus` | `dispatch_order_substatus` (enum) | Subestado actual dentro de la etapa |

### Tabla de Historial: `dispatch_order_state_history`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `dispatch_order_id` | UUID | Referencia a la orden |
| `from_stage` | TEXT | Etapa anterior (null en primera entrada) |
| `from_substatus` | TEXT | Subestado anterior |
| `to_stage` | TEXT | Nueva etapa |
| `to_substatus` | TEXT | Nuevo subestado |
| `changed_by` | UUID | Usuario que realizó el cambio |
| `changed_at` | TIMESTAMPTZ | Timestamp del cambio |
| `trigger_type` | TEXT | USER, SYSTEM, GPS, TIMER |
| `reason` | TEXT | Motivo estructurado |
| `notes` | TEXT | Notas libres |
| `metadata` | JSONB | Contexto adicional (carrier_id, fleet_set_id, etc.) |
| `org_id` | UUID | Organización |

### Tabla Existente: `dispatch_order_carrier_history`

Se mantiene sin modificaciones. Registra interacciones específicas con carriers durante la etapa TENDERS:
- Outcomes de asignación (PENDING, ACCEPTED, REJECTED, TIMEOUT, etc.)
- Swaps de fleetset
- Conteo de allocation

---

## Reglas de Cancelación

| Etapa | ¿Cancelable? | Notas |
|-------|:---:|-------|
| DISPATCH | ✅ | Cancelación libre, sin impacto externo |
| TENDERS | ✅ | Notifica al carrier, registra CANCELED_BY_ORG en carrier_history |
| SCHEDULED | ✅ | Envía "Kill Ticket" a ColdSync Go si ya hay ticket emitido |
| EXECUTION | ❌ | Viaje en ejecución — solo puede completarse o generar excepciones |
| CONCILIATION | ❌ | Proceso financiero en curso |

---

## Referencias

- [Despacho](./dispatch.md) — Flujo de Dispatch (Etapa 1)
- [Orders](./orders.md) — Compromiso del Carrier (Etapa 2)
- [Torre de Control](./control-tower.md) — Monitoreo en ruta (Etapa 4)
- [Conciliación](./reconciliation.md) — Auditoría post-viaje (Etapa 5)
- [KPIs](./kpis.md) — Métricas de desempeño

---

**Última actualización:** Febrero 2026
