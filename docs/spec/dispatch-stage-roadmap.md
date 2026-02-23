# Dispatch Stage Roadmap (Enfoque Único)

**Scope:** solo `DISPATCH` (`NEW`, `UNASSIGNED`, `ASSIGNED`)  
**Fuentes:** `docs/business/dispatch.md`, implementación actual del módulo Dispatch  
**Meta:** claridad de lo que ya existe, lo que falta y cómo implementarlo sin rehacer UI (reutilizando piezas de Orders).

---

## 1) Qué ya tienes (base real)

### Vistas
- Vista tabla activa y usable.
- Vista gantt activa con DnD para asignación.
- Cola lateral de despacho (expandible/colapsable) en tabla.

### Interacciones
- `Planificar` existe (auto-assign/matching).
- `Enviar` existe (emisión a carrier).
- Drawer de detalle operativo activo.
- Diálogos base ya existen en Orders (reutilizables).

### Estado
- Modelo `stage + substatus` operativo.
- Flujo conceptual principal ya está:
  - `UNASSIGNED/NEW -> ASSIGNED -> TENDERS/PENDING`.

---

## 2) Huecos críticos en DISPATCH (lo que falta)

## A. Reglas UI condicionales por estado (obligatorio)
- `Planificar` debe operar solo sobre `DISPATCH/NEW|UNASSIGNED`.
- `Enviar` debe operar solo sobre `DISPATCH/ASSIGNED`.
- CTA/bulk actions deben mostrarse/habilitarse según selección elegible.

## B. Estado inteligente unificado (tabla + cola + drawer + gantt)
- Una sola semántica de `Estado` (label + timeInfo + badge).
- Mismo orden determinístico en tabla y cola.
- Misma interpretación de urgencia/prioridad en todas las vistas.

## C. Órdenes vencidas en DISPATCH
- No solo bloquear “planificar”; debe forzar decisión:
  - Reprogramar
  - Reasignar
  - Cancelar
- Registrar motivo estructurado (`reason_code`) de la decisión.

## D. Motivos estructurados (carrier/operación)
- Falta catálogo explícito en esta capa para decisiones de excepción de Dispatch.
- Orders tiene piezas de diálogo y razones; Dispatch debe consumir/reusar patrón.

---

## 3) Objetivo funcional de DISPATCH (cierre)

Al terminar este roadmap:
- La UI guía al planner solo por acciones válidas.
- Tabla, cola, drawer y gantt muestran el mismo criterio operativo.
- Toda excepción en DISPATCH deja trazabilidad estructurada.
- No hay acciones “globales” que ignoren `stage/substatus`.

---

## 4) Roadmap de implementación (por capa)

## Fase 1 — UI/UX (primero)

### 1.1 Botones y acciones condicionales
- Header:
  - `Planificar` visible/habilitado solo si hay seleccionadas elegibles (`NEW|UNASSIGNED`).
  - `Enviar` visible/habilitado solo si hay seleccionadas elegibles (`ASSIGNED`).
- Bulk actions tabla:
  - Filtrar selección inválida y mostrar conteo válido.
- Drawer:
  - CTA contextual según substatus actual.

**Entregable:** matriz de acciones por substatus implementada en un único helper.

### 1.2 Filtros y buscador (DISPATCH-only)
- Filtros mínimos:
  - `Sin asignar`
  - `Asignadas`
  - `Vencidas`
  - `Rechazadas/Expiradas` (retorno)
  - `Por vencer` (si aplica señal en `TENDERS`)
  - `Riesgo ETA` (si aplica señal en `SCHEDULED`)
- Buscador unificado por:
  - `dispatch_number`
  - lane/origen/destino
  - carrier/unidad/conductor

**Entregable:** filtros consistentes en tabla y gantt.

### 1.3 Estado inteligente + orden único
- `Estado` único (sin columna nueva de prioridad).
- Orden único (tabla y cola):
  1. Vencidas
  2. Hoy
  3. Mañana
  4. Próximos
  5. desempate por `priority_effective`, holgura, fecha, FIFO.

**Entregable:** mismo resultado visual en tabla/cola con mismos filtros.

### 1.4 Excepciones en DISPATCH (UI)
- Flujo para vencidas:
  - acción obligatoria con diálogo de decisión.
- Motivo estructurado obligatorio en cancelar/reprogramar/reasignar.
- Reutilizar componentes de Orders:
  - dialogs de motivo
  - patrones de confirmación
  - selector de razones.

**Entregable:** no hay excepción sin motivo.

---

## Fase 2 — DB Supabase (stage DISPATCH)

Agregar/validar persistencia mínima para DISPATCH:
- `priority_effective` (numérico)
- `priority_bucket` (`CRITICA|ALTA|MEDIA|BAJA`)
- `reason_code` (acción sobre excepción)
- `reason_note` (opcional)
- `exception_type` (ej. `PAST_DUE`, `ETA_RISK_CONFIRMATION`, `ETA_RISK_SCHEDULED`, etc.)
- `exception_detected_at`

Catálogos:
- `dispatch_reason_codes` (o reusar catálogo existente equivalente)
- códigos mínimos para vencidas y cancelación operativa.

**Entregable:** toda decisión crítica en DISPATCH queda auditada en DB.

---

## Fase 3 — Servicios (stage DISPATCH)

- Unificar reglas de elegibilidad de acciones en helpers compartidos:
  - `canPlan(order)`
  - `canSend(order)`
  - `canCancel(order)`
- Unificar ordenamiento determinístico en un solo selector/hook.
- Integrar diálogos de motivo a llamadas de servicio (no texto libre hardcodeado).
- Asegurar transición gobernada y trazabilidad (actor/motivo/timestamp).

**Entregable:** comportamiento consistente entre UI y backend para DISPATCH.

---

## 5) Matriz mínima de acciones por substatus (DISPATCH scope)

- `NEW`
  - Planificar: ✅
  - Enviar: ❌
  - Cancelar: ✅ (motivo)
- `UNASSIGNED`
  - Planificar: ✅
  - Enviar: ❌
  - Cancelar: ✅ (motivo)
- `ASSIGNED`
  - Planificar: ⚠️ (solo replanificar explícito, no default)
  - Enviar: ✅
  - Cancelar: ✅ (motivo)

---

## 6) Reutilización obligatoria de componentes (sin rehacer UI)

Usar del ecosistema actual:
- Tabla/DataTable
- Drawer de detalle
- Dialog de confirmación
- Dialog de motivos (patrón Orders)
- Inputs/selects/badges/pills existentes
- Toolbar/bulk actions existentes

Regla:
- componente nuevo solo si no existe uno adaptable.

---

## 7) Checklist de cierre DISPATCH

- [ ] Acciones condicionales por `stage/substatus` en header, tabla y drawer
- [ ] Estado inteligente unificado en tabla/cola/drawer/gantt
- [ ] Orden determinístico único en tabla y cola
- [ ] Flujo de vencidas con decisión obligatoria
- [ ] Motivo estructurado en toda excepción/cancelación de DISPATCH
- [ ] Persistencia DB para prioridad y excepción
- [ ] Servicios alineados (sin bypass ni lógica duplicada)

---

**Nota:** este roadmap es deliberadamente corto y exclusivo para `DISPATCH`.  
`TENDERS` y `SCHEDULED` se abordan después de cerrar este checklist.
