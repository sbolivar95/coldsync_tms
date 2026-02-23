# Auditoría UI/UX y Plan de Implementación de Dispatch
## Ejecución por Stage y por Capa (UI/UX -> DB -> Servicios)

**Fecha:** Febrero 2026  
**Versión:** 2.0  
**Referencia principal:** `docs/business/dispatch.md`

---

## 1. Objetivo del documento

Este documento define **cómo cerrar Dispatch al 100%** siguiendo el orden acordado:

1. **Primero:** soporte **UI/UX** por stage  
2. **Luego:** soporte de **DB en Supabase**  
3. **Luego:** conexión de **servicios/cables**

Stages cubiertos por Dispatch:

- `DISPATCH`
- `TENDERS`
- `SCHEDULED`

---

## 2. Estado actual consolidado

### Estado general: 🟡 PARCIAL (aprox. 70%)

Fortalezas implementadas:

- Modelo `stage + substatus` operativo en la mayor parte del módulo
- Vistas principales `Gantt` y `Tabla`
- Separación conceptual `Planificar (ASSIGNED)` vs `Enviar (PENDING)`
- DnD operativo en Gantt

Brechas principales para 100%:

- Priorización operativa determinística (no solo orden por fecha)
- Gestión estructurada de excepciones (reason codes + SLA + decisión)
- Protocolo post-aceptación (`SCHEDULED/PROGRAMMED` -> `AT_ORIGIN`)
- Matriz formal de observaciones en origen (`LEVE/MEDIA/CRITICA`)
- Uniformidad estricta de motor de estado y trazabilidad

---

## 3. Estrategia de implementación (obligatoria)

Cada stage se implementa en este orden fijo:

1. **Capa UI/UX**
2. **Capa DB (Supabase)**
3. **Capa Servicios (hooks + services + integración)**

Regla de gobierno:

- No avanzar al siguiente stage si el stage actual no tiene check de salida verde en sus 3 capas.

Premisas operativas del proyecto:

- La infraestructura base ya existe (modelo de estados, vistas principales, hooks base, RPCs iniciales).
- El trabajo debe ser **incremental por stage**, evitando rediseños globales innecesarios.
- En UI/UX se aplica política de **reutilización máxima** del catálogo actual de componentes.
- Nuevos componentes solo cuando no exista equivalente reutilizable o el costo de adaptación sea mayor.

---

## 4. Stage 1: DISPATCH (Backlog y Asignación Tentativa)

### 4.1 UI/UX (primer paso)

Objetivo: cerrar backlog operativo y decisión de planificación con orden de atención claro.

Checklist UI/UX:

- [ ] Cola lateral consolidada con filtros de trabajo:
  - `Sin asignar`
  - `Vencidas`
  - `Rechazadas/Expiradas`
  - `Observadas`
  - `Por vencer`
  - `Riesgo ETA`
- [ ] Orden determinístico visible (no solo fecha):
  - `Vencidas > Hoy > Mañana > Próximos`
  - desempate por prioridad efectiva y holgura temporal
- [ ] Estado inteligente consistente en tabla, gantt, drawer (misma regla visual)
- [ ] Flujo explícito `Planificar` (borrador) separado de `Enviar` (tender)
- [ ] UX de órdenes vencidas con decisión obligatoria: `Reprogramar | Reasignar | Cancelar`
- [ ] Sin columna nueva: la prioridad operativa derivada se expresa en `Estado` (sin edición manual)

### 4.2 DB (segundo paso)

Checklist DB:

- [ ] Persistir prioridad operativa derivada:
  - `priority_effective` (numérico)
  - `priority_bucket` (`CRITICA|ALTA|MEDIA|BAJA`)
- [ ] Persistir excepción estructurada:
  - `exception_type`
  - `reason_code`
  - `reason_note` (opcional)
  - `exception_detected_at`
- [ ] Catálogo de reason codes para excepciones de backlog y vencidas
- [ ] Asegurar trazabilidad por evento en historial de estados

### 4.3 Servicios (tercer paso)

Checklist servicios:

- [ ] Unificar motor de estado (evitar updates directos fuera de transición gobernada)
- [ ] Exponer APIs/hook para resolver vencidas con motivo estructurado
- [ ] Exponer ordenamiento determinístico único para tabla + cola + gantt
- [ ] Validar que `DISPATCH/ASSIGNED` sea borrador revisable y no envío implícito

Criterio de salida Stage 1:

- Cualquier planner obtiene el mismo orden de atención con mismos filtros.
- Toda excepción en backlog queda registrada con motivo estructurado.

---

## 5. Stage 2: TENDERS (Compromiso del Carrier)

### 5.1 UI/UX (primer paso)

Objetivo: gobernar `PENDING/ACCEPTED/REJECTED/EXPIRED` con visibilidad y acción.

Checklist UI/UX:

- [ ] Vista de tenders activos (`TENDERS/PENDING`) con TTL visible y urgencia
- [ ] Filtros por urgencia TTL (`critica/alta/media`)
- [ ] Alertas visuales para TTL cercano a vencimiento
- [ ] Cola de retorno automático para `REJECTED/EXPIRED` hacia backlog Dispatch
- [ ] Historial de decisiones de carrier visible en drawer

### 5.2 DB (segundo paso)

Checklist DB:

- [ ] Persistir deadlines y timestamps de tender:
  - `carrier_assigned_at`
  - `response_deadline`
  - `responded_at`
- [ ] Persistir outcome estructurado:
  - `outcome`
  - `outcome_reason`
  - `responded_by`
- [ ] Trigger de expiración TTL con transición controlada a `EXPIRED`

### 5.3 Servicios (tercer paso)

Checklist servicios:

- [ ] Job/trigger confiable para expiración TTL sin intervención manual
- [ ] Envío batch/individual a carrier con validaciones homogéneas
- [ ] Retorno automático a `DISPATCH/UNASSIGNED` para `REJECTED/EXPIRED`
- [ ] Sincronizar estado UI en tiempo real para countdown de TTL

Criterio de salida Stage 2:

- Ningún tender vencido queda “silencioso”; todo `EXPIRED` retorna y se audita.

---

## 6. Stage 3: SCHEDULED (Programación y Pre-Embarque)

### 6.1 UI/UX (primer paso)

Objetivo: asegurar cumplimiento post-aceptación y control de observaciones en origen.

Checklist UI/UX:

- [ ] Vista de seguimiento post-aceptación para `SCHEDULED/PROGRAMMED`
- [ ] Indicador de riesgo por ETA comprometido vs ETA calculado
- [ ] Flujo de reconfirmación operativa y escalación
- [ ] Gestión de observaciones con severidad:
  - `LEVE`
  - `MEDIA`
  - `CRITICA`
- [ ] Decisiones asistidas por severidad:
  - continuar
  - corregir + reinspeccionar
  - romper compromiso (`Fail After Accept`)
- [ ] Hand-off claro cuando cumple condiciones de salida a siguiente dominio

### 6.2 DB (segundo paso)

Checklist DB:

- [ ] Catálogo cerrado de observaciones:
  - `observation_code`
  - `severity`
  - `can_depart`
  - `requires_reinspection`
  - `max_correction_minutes`
- [ ] Eventos estructurados de pre-embarque:
  - `inspection_result`
  - `corrective_eta`
  - `approved_by`
  - `reinspection_result`
- [ ] Persistir protocolo post-aceptación:
  - `eta_committed_at`
  - `eta_committed_value`
  - `eta_calculated_value`
  - `risk_level`
  - `risk_detected_at`
- [ ] Reason codes para `Fail After Accept`

### 6.3 Servicios (tercer paso)

Checklist servicios:

- [ ] Evaluador de riesgo post-aceptación (timer + eventos)
- [ ] Motor de escalación por ventanas (`<=4h`, `<=2h`, no-show)
- [ ] Transiciones de observación según matriz de severidad
- [ ] Retorno a `DISPATCH/UNASSIGNED` cuando no se resuelve en ventana
- [ ] Trazabilidad completa de actor/trigger/motivo

Criterio de salida Stage 3:

- No hay decisiones ad-hoc en origen: toda observación sigue matriz y queda auditada.

---

## 7. Plan de ejecución recomendado

### Fase A: UI/UX primero (por stage)

1. DISPATCH UI/UX
2. TENDERS UI/UX
3. SCHEDULED UI/UX

### Fase B: DB Supabase

1. Estructura y catálogos DISPATCH
2. Estructura y timers TENDERS
3. Estructura y eventos SCHEDULED

### Fase C: Servicios

1. Integración DISPATCH
2. Integración TENDERS
3. Integración SCHEDULED

Nota de secuenciación:

- Aunque se ejecute por capas, el alcance siempre se cierra **por stage**.  
- DB y Servicios no se implementan como bloque transversal único; se cierran stage a stage, igual que UI/UX.

---

## 7.1 Política de reutilización de componentes

Lineamientos:

- Priorizar componentes existentes (`Table`, `Drawer`, `Dialog`, `Form`, `Badge`, `Timeline`, `FilterBar`, etc.).
- Mantener patrones visuales y de interacción ya adoptados en `Orders` y `Dispatch`.
- Evitar crear variantes nuevas si un componente existente puede cubrir el caso con props/composición.
- Todo componente nuevo debe justificarse con brecha funcional concreta.

Criterio de aceptación de UI:

- Consistencia visual y de comportamiento entre vistas del mismo stage.
- Baja variabilidad en formularios (ancho de campos y densidad predecible).
- Mínimo número de componentes nuevos para resolver el requerimiento.

---

## 8. Definition of Done (100% Dispatch)

Dispatch se considera 100% cuando:

- [ ] UI/UX de los 3 stages está implementada y usable por operación real
- [ ] DB soporta prioridad, excepciones, TTL, post-aceptación y observaciones
- [ ] Servicios aplican transiciones gobernadas, sin bypass ad-hoc
- [ ] Tabla, cola y gantt muestran orden operativo consistente
- [ ] Toda excepción relevante tiene `reason_code` y trazabilidad auditable

---

## 9. Notas de consistencia con `dispatch.md`

Este plan mantiene:

- `DISPATCH/ASSIGNED` como borrador de tender (no envío implícito)
- Prioridad operativa automática (no editable manualmente)
- Excepciones gestionadas por protocolo, no por improvisación
- Scope de Dispatch limitado a `DISPATCH`, `TENDERS`, `SCHEDULED`

---

## 10. Referencia normativa (no duplicar aquí)

La matriz exacta de:

- estado inteligente (`label + timeInfo + badge`),
- orden determinístico único (tabla/cola),
- fórmula de `priority_effective` y buckets,

se mantiene como norma permanente en:

- `docs/business/dispatch.md` (Sección 7).

Este documento (`dispatch-ui-ux-audit.md`) es temporal y debe enfocarse en plan/checklist de implementación.

---

**Última actualización:** Febrero 2026
