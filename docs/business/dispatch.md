# 📦 ColdSync Dispatch
## Capa de Orquestación de Capacidad (Shipper Operations Layer)

---

# PARTE I — Contexto y Propósito

## 1. Qué es ColdSync Dispatch

ColdSync Dispatch es la capa donde el shipper convierte demanda logística en un plan operativo factible para line haul de cadena de frío con flota dedicada/contratada.

Cubre tres etapas del modelo global: `DISPATCH → TENDERS → SCHEDULED`

Objetivo operativo:

> Llevar cada orden desde intención de servicio hasta pre-embarque listo para salida, con trazabilidad completa.

El problema que resuelve: en line haul contractual, la falla operativa aparece cuando demanda, capacidad y compromiso no están sincronizados. Dispatch resuelve esa brecha con una secuencia de control:

**Demanda → Factibilidad → Compromiso → Programación → Validación física en origen**

## 2. Qué NO es Dispatch

- Un marketplace spot
- Un sistema de última milla
- Un módulo de monitoreo en ruta
- Un módulo de conciliación financiera
- Un módulo de negociación comercial ad-hoc del carrier

Dispatch decide factibilidad y orquesta compromiso; no ejecuta ruta ni liquida viaje.

## 3. Relación con Orders

### Separación de responsabilidades

**Dispatch** define intención, selecciona capacidad, emite la solicitud formal y reprocesa excepciones.

**Orders** evalúa factibilidad del carrier, decide aceptar/rechazar/dejar vencer, y declara recursos para cumplimiento.

> **Dispatch gobierna intención operativa. Orders gobierna compromiso del carrier.**

### Contrato de interacción

1. Dispatch emite `TENDERS/PENDING` desde `DISPATCH/ASSIGNED`.
2. Orders devuelve resultado explícito:
   - `Aceptar` / `Aceptar con Cambios` → `TENDERS/ACCEPTED`
   - `Rechazar` → `TENDERS/REJECTED`
   - Sin decisión en ventana → `TENDERS/EXPIRED`
3. Dispatch consume la respuesta:
   - `ACCEPTED` → `SCHEDULED/PROGRAMMED`
   - `REJECTED` / `EXPIRED` → `DISPATCH/UNASSIGNED`
4. Si existe ruptura post-aceptación (`Fail After Accept`), Dispatch reabre en `DISPATCH/UNASSIGNED`.

Dispatch nunca sustituye la decisión del carrier.

### Ownership de TTL

- La **política de TTL** (criterios y ventanas) es definida por Dispatch. Ver Parte II, sección TTL.
- La **ejecución del TTL** (contador, expiración y evento `TENDERS/EXPIRED`) ocurre en Orders.
- Orders cierra su función al confirmar o romper compromiso. Dispatch/Scheduled gobiernan desde ahí.

---

# PARTE II — Modelo Conceptual

## 4. Service Intent

La unidad conceptual de Dispatch es la **Service Intent**: la descripción completa de qué mover, dónde, cuándo y con qué propuesta de capacidad.

| Dimensión | Contenido |
|-----------|-----------|
| Qué mover | Producto, peso, perfil térmico |
| Dónde mover | Lane, origen, destino, secuencia |
| Cuándo mover | Fecha y ventana de servicio |
| Con qué | Carrier y fleetset tentativo |

La Service Intent no es compromiso contractual hasta recibir `TENDERS/ACCEPTED`.

### Contrato mínimo de datos de entrada

Toda orden candidata a planificación debe contener:

- Identificación de lane y puntos operativos
- Fecha y ventana de servicio
- Tipo de carga: `STANDARD` o `HIBRIDA`
- Peso declarado y unidad de medida operativa
- Perfil térmico requerido (uno o múltiples según tipo)

Reglas por tipo de carga:

- **STANDARD:** un perfil térmico principal y compatibilidad simple de capacidad.
- **HIBRIDA:** múltiples perfiles térmicos y validación por compartimentos/multi-zona.

Un fleetset válido debe cubrir conductor + unidad tractora/vehículo + remolque (cuando aplique), cumpliendo restricciones térmicas, de capacidad y disponibilidad temporal para el lane.

## 5. Política de TTL

Esta sección es la **única fuente** para duración contractual del TTL. Se versiona en Dispatch y se ejecuta en Orders sin reinterpretación.

| Anticipación de pickup | TTL |
|------------------------|-----|
| Mismo día o siguiente | 90 minutos |
| 2–3 días | 24 horas |
| 4–7 días | 48 horas |
| Más de 7 días | 72 horas |

Reglas:

- El TTL corre en tiempo calendario continuo (24/7) con timezone de la organización.
- Al vencer sin decisión, la orden transiciona a `TENDERS/EXPIRED` y retorna automáticamente a `DISPATCH/UNASSIGNED`.

## 6. Tiempos operativos obligatorios

Ventanas de control post-aceptación y pre-embarque. Son política por defecto; pueden parametrizarse por organización/lane, pero siempre deben existir como umbral explícito de decisión.

**A. Reconfirmación post-aceptación**
- ETA inicial del carrier: máximo `30 min` tras `TENDERS/ACCEPTED`.
- Si faltan `≤ 4h` para cita sin ETA confiable: alerta automática + reconfirmación obligatoria.
- Si faltan `≤ 2h` con riesgo persistente: escalación operativa obligatoria.

**B. No-show operativo**
- Unidad sin llegar a origen `30 min` después de la hora comprometida: incidente de no-show.
- Decisión forzada en máximo `15 min`: reasignar, reprogramar o `Fail After Accept`.

**C. Resolución de observaciones en origen**
- `LEVE`: corrección en máximo `30 min`.
- `MEDIA`: corrección y validación en máximo `60 min`.
- `CRÍTICA`: corrección obligatoria en máximo `120 min`; si no se resuelve, ruptura de compromiso.

**D. Reinspección**
- Toda corrección `MEDIA/CRÍTICA` requiere reinspección en máximo `20 min` desde reporte de corrección.

## 7. Matching y Selección de Fleetset

Dispatch consume el resultado del motor de matching para construir propuestas tentativas. La lógica del motor (reglas duras, temporalidad, cupos y ranking) vive como fuente única en [ColdSync Matching](./matching-orders.md).

Secuencia de uso:

1. Orden elegible entra a planificación.
2. Matching evalúa candidatos factibles y no factibles (con `reason_code`), pero en selección operativa solo expone candidatos factibles (`MATCH_SUCCESS`).
3. Planner revisa y ajusta dentro de reglas permitidas.
4. Orden queda en `DISPATCH/ASSIGNED` como borrador.

**Dispatch no redefine reglas de matching; las aplica.**

### Gobierno de factibilidad

- Si matching retorna `NO_MATCH_*`, la asignación se bloquea y la orden permanece en `DISPATCH/UNASSIGNED`.
- No se permite excepción manual para saltarse reglas bloqueantes.
- El `reason_code` explica el bloqueo; no lo autoriza.
- Solo se muestran candidatos `MATCH_SUCCESS` en la selección operativa.
- El motivo de bloqueo se muestra en el punto de decisión.

### Gobierno de selección

- El ranking se consume desde Matching sin reinterpretación local.
- Dispatch no introduce criterios alternos ni cambia ponderaciones del motor.
- El planner puede ajustar entre candidatos factibles, con trazabilidad de decisión.

## 8. Dependencias del módulo

Dispatch no opera de forma aislada. Sin estos prerrequisitos puede registrar demanda, pero no orquestar servicio confiable:

- **Lanes:** carril/origen-destino válido y activo
- **Catálogo de carga:** productos y perfiles térmicos vigentes
- **Capacidad operativa:** fleetsets disponibles y habilitados
- **Reglas de compromiso:** integración activa con Orders (`TENDERS`)
- **Seguimiento de arribo:** señal de disponibilidad/ETA para fase `SCHEDULED`

---

# PARTE III — Modelo de Estados

## 9. Stages y subestados

### DISPATCH
| Subestado | Significado |
|-----------|-------------|
| `NEW` | Orden ingresada, sin asignación |
| `UNASSIGNED` | Sin compromiso vigente, en backlog |
| `ASSIGNED` | Propuesta tentativa asignada, borrador de tender |
| `CANCELED` | Cancelada por shipper |

### TENDERS
| Subestado | Significado |
|-----------|-------------|
| `PENDING` | Solicitud formal enviada al carrier, TTL activo |
| `ACCEPTED` | Carrier confirmó compromiso |
| `REJECTED` | Carrier rechazó |
| `EXPIRED` | TTL venció sin decisión |
| `CANCELED` | Cancelada por shipper |

### SCHEDULED
| Subestado | Significado |
|-----------|-------------|
| `PROGRAMMED` | Compromiso vigente, unidad no liberada aún |
| `DISPATCHED` | Carrier liberó unidad hacia origen |
| `EN_ROUTE_TO_ORIGIN` | Movimiento hacia origen confirmado |
| `AT_ORIGIN` | Arribo a origen confirmado |
| `LOADING` | Unidad apta, carga iniciada |
| `OBSERVED` | Observación detectada en origen, en resolución |
| `CANCELED` | Cancelada por shipper |

## 10. Transiciones críticas

```
DISPATCH/NEW ──────────────────────────► DISPATCH/UNASSIGNED
DISPATCH/UNASSIGNED ──────────────────► DISPATCH/ASSIGNED
DISPATCH/ASSIGNED ────────────────────► TENDERS/PENDING

TENDERS/ACCEPTED ─────────────────────► SCHEDULED/PROGRAMMED
TENDERS/REJECTED │
TENDERS/EXPIRED  ├────────────────────► DISPATCH/UNASSIGNED

SCHEDULED/PROGRAMMED ─────────────────► SCHEDULED/DISPATCHED
SCHEDULED/DISPATCHED ─────────────────► SCHEDULED/EN_ROUTE_TO_ORIGIN
SCHEDULED/EN_ROUTE_TO_ORIGIN ─────────► SCHEDULED/AT_ORIGIN
SCHEDULED/AT_ORIGIN ──────────────────► SCHEDULED/LOADING
                                       └► SCHEDULED/OBSERVED
SCHEDULED/OBSERVED ───────────────────► SCHEDULED/LOADING (si corrige)
                                       └► DISPATCH/UNASSIGNED (si no corrige)

DISPATCH │
TENDERS  ├────────────────────────────► CANCELED (cancelación explícita por shipper)
SCHEDULED│
```

Regla explícita:

- `SCHEDULED/OBSERVED` que no se corrige dentro de ventana retorna a `DISPATCH/UNASSIGNED`.

## 11. Vista operativa de lista

La operación diaria se gobierna en vista de lista con dos ejes: **cola por etapa/substatus** y **horizonte temporal**.

### Cola por etapas

| Cola | Stage |
|------|-------|
| Planificadas | `DISPATCH` |
| Enviadas | `TENDERS` |
| Programadas | `SCHEDULED` |

`CANCELED` se excluye del dataset de trabajo en todas las vistas. Los contadores de cada cola se calculan sobre el mismo dataset acotado por horizonte temporal.

### Horizonte temporal

| Vista | Amplitud | Avance con flechas |
|-------|----------|--------------------|
| Hoy | 1 día | 1 día |
| 3 días | 3 días | 3 días |
| Ventana operativa | D-7 a D+14 | 22 días |

### Precedencia de filtros (AND determinístico)

1. Exclusión de `CANCELED`
2. Horizonte temporal activo
3. Cola (stage/substatus) desde sidebar
4. Filtros estructurales (`Configuración = Estándar/Híbrido`)
5. Buscador (dispatch number, origen/destino, transportista, producto, peso)

Con los mismos filtros activos, dos planners observan el mismo conjunto de órdenes.

---

# PARTE IV — Proceso Operativo

## 12. Flujo de fases


[A] Ingreso ──► [B] Backlog ──► [C] Asignación tentativa ──► [D] Emisión de tender
                                                                        │
                                                              [E] Resolución del carrier
                                                               ACCEPTED │  REJECTED/EXPIRED
                                                                        │         │
                                                              [F] Programación   [B] Backlog
                                                                        │
                                                              [G] Pre-embarque en origen
                                                                        │
                                                                  SCHEDULED/LOADING


## 13. Fase A — Ingreso de demanda

- **Entrada:** solicitud con datos mínimos válidos (ver sección 4)
- **Validaciones:** lane válido, fecha/ventana válida, carga y perfil térmico definidos
- **Salida:** orden en `DISPATCH/NEW`

## 14. Fase B — Clasificación de backlog

Toda orden sin compromiso vigente entra a backlog (`DISPATCH/NEW` o `DISPATCH/UNASSIGNED`).

Causas de retorno a backlog:
- `TENDERS/REJECTED`
- `TENDERS/EXPIRED`
- `SCHEDULED/OBSERVED` no resuelto
- `Fail After Accept`

**Salida:** orden priorizada para decisión de planificación.

## 15. Fase C — Asignación tentativa (Borrador de Tender)

El planner selecciona órdenes, el sistema genera propuesta de matching, y el planner puede ajustar dentro de reglas permitidas.

`DISPATCH/ASSIGNED` = **intención interna revisable**, no solicitud enviada al carrier.

Regla: solo se puede asignar con candidatos `MATCH_SUCCESS`. Sin candidato factible, la orden permanece en `DISPATCH/UNASSIGNED` con causa estructurada.

> **Planificar no equivale a enviar. El envío requiere gate explícito de validación del planner.**

## 16. Fase D — Emisión de tender

- **Condición:** orden en `DISPATCH/ASSIGNED` con factibilidad aprobada
- **Acción:** emitir solicitud formal al carrier
- **Salida:** `TENDERS/PENDING` con TTL dinámico (ver sección 5)

`TENDERS/PENDING` = **solicitud formal enviada al carrier**.

## 17. Fase E — Resolución del carrier

| Respuesta | Siguiente estado |
|-----------|-----------------|
| `ACCEPTED` | `SCHEDULED/PROGRAMMED` → continúa a Fase F |
| `REJECTED` | `DISPATCH/UNASSIGNED` → regresa a Fase B |
| `EXPIRED` | `DISPATCH/UNASSIGNED` → regresa a Fase B |

## 18. Fase F — Programación y seguimiento post-aceptación

La aceptación confirma compromiso pero no elimina riesgo de no llegada. El seguimiento entre `PROGRAMMED` y `AT_ORIGIN` es obligatorio.

### Secuencia canónica de señales

| Estado | Significado operativo |
|--------|-----------------------|
| `PROGRAMMED` | Compromiso vigente, unidad no liberada |
| `DISPATCHED` | Carrier liberó unidad (release operativo) |
| `EN_ROUTE_TO_ORIGIN` | Movimiento hacia origen confirmado por telemetría o Carrier Ops |
| `AT_ORIGIN` | Arribo confirmado por geocerca o validación del planner |

Una orden aceptada se considera **en cumplimiento** al avanzar por esta cadena; **en riesgo** ante `NO_SIGNAL`, `ETA_RISK` o `NO_SHOW`; y **en ruptura** cuando no existe recuperación viable o el carrier declara `Fail After Accept`.

Regla de inmutabilidad del servicio aceptado:

- Para el carrier, origen, destino, fecha/ventana y perfil térmico comprometidos no se renegocian en `SCHEDULED`; si no puede cumplirlos, corresponde `Fail After Accept`.

### Modelo híbrido de detección (LATAM)

Orden de confianza para transiciones oficiales:

1. Confirmación formal de Carrier Ops
2. GPS/telemática consistente hacia origen
3. Registro operativo validado por planner/supervisor
4. Mensaje de conductor (WhatsApp/llamada) — solo evidencia contextual

Una señal contextual por sí sola no cambia estado oficial. Toda transición debe quedar auditada con `trigger_type`, actor, hora y motivo.

### Eventos ejecutables post-aceptación

| Evento | Fuente | Umbral | Acción obligatoria |
|--------|--------|--------|--------------------|
| `ETA_MISSING` | Carrier Ops / Sistema | Sin ETA en `≤ 30 min` de `ACCEPTED` | Alerta + reconfirmación |
| `ETA_RISK` | Sistema | ETA fuera de ventana/cita | Pre-rescate + decisión |
| `NO_SIGNAL` | Telemetría | Sin señal en ventana crítica | Escalación automática |
| `DEPARTURE_CONFIRMED` | Carrier Ops / GPS | Unidad liberada | `PROGRAMMED → DISPATCHED` |
| `ARRIVAL_ORIGIN` | Geocerca | Ingreso a geocerca | `EN_ROUTE → AT_ORIGIN` |
| `NO_SHOW` | Sistema (timer) | No arribo hasta `+30 min` | Decisión en `≤ 15 min` |

### Escalación por niveles

| Nivel | Tipo | Acción |
|-------|------|--------|
| 1 | Automático | Recordatorio de compromiso y ETA |
| 2 | Automático | Alerta de riesgo por desvío de ETA |
| 3 | Semiautomático | Solicitud obligatoria de reconfirmación |
| 4 | Operativo | Decisión de rescate o `Fail After Accept` |

Si la probabilidad de llegada a tiempo cae bajo el umbral definido, se fuerza decisión explícita: reconfirmación con nuevo ETA compatible, o `Fail After Accept` + retorno a `DISPATCH/UNASSIGNED`.

### Gestión por tipo de ventana horaria

- **Ventana cerrada** (`start-end`): riesgo contra `end` (límite estricto de incumplimiento); KPI de puntualidad contra `start`.
- **Ventana abierta del día:** `end_of_day_cutoff` contractual como límite de no-show.
- **Rango amplio:** `warning_threshold` para alerta; `decision_threshold` para decisión obligatoria.

## 19. Fase G — Pre-embarque en origen

Al arribar la unidad, se ejecuta inspección/checklist físico con resultado tipificado.

### Matriz de decisión por severidad

| Severidad | Condición de salida | Acción |
|-----------|--------------------|--------------------|
| `LEVE` | Puede viajar bajo evidencia de corrección | Continúa a `LOADING` |
| `MEDIA` | Requiere validación de supervisión | Si corrige en ventana → `LOADING`; si no → `OBSERVED` |
| `CRÍTICA` | No puede viajar | `OBSERVED` + corrección obligatoria + reinspección |

### Catálogo cerrado de observaciones

Toda observación debe registrarse con código de catálogo predefinido. No se permite texto libre como causa principal.

Cada código debe incluir: código único, descripción estandarizada, severidad, `can_depart` (sí/no), requiere aprobación de supervisor, requiere reinspección y SLA de corrección.

Criterio técnico mínimo en origen:

- La validación de pre-enfriamiento e integridad térmica debe basarse en telemetría (sensores de temperatura de retorno/suministro) y/o evidencia operativa equivalente; el inicio de `LOADING` se confirma por acción del inspector y/o señal de apertura de puertas en andén.

Si `can_depart = no`, la orden permanece en `SCHEDULED/OBSERVED` hasta resolución o retorno a `DISPATCH/UNASSIGNED`.

### Resolución de `OBSERVED`

| Resultado | Siguiente estado |
|-----------|-----------------|
| Corrección exitosa y aprobada | `SCHEDULED/LOADING` |
| Reinspección en curso | `SCHEDULED/AT_ORIGIN` |
| No se resuelve en ventana | `DISPATCH/UNASSIGNED` + `Fail After Accept` |

### Handoff operacional

La transferencia al siguiente dominio ocurre solo cuando: la unidad supera control de origen, se valida pre-enfriamiento requerido, y se confirma inicio de carga/salida.

**Salida final del módulo: `SCHEDULED/LOADING` con trazabilidad íntegra.**

---

# PARTE V — Excepciones y Recuperación

## 20. Principios generales

Toda excepción sigue el mismo esquema:

1. Registro de causa raíz, actor y timestamp.
2. Clasificación: recuperable → `DISPATCH/UNASSIGNED`; terminal → `CANCELED`.
3. Nueva decisión explícita del planner: reasignar, reprogramar o cancelar.

**El sistema puede sugerir candidatos de matching, pero no ejecuta reasignación automática silenciosa.** La reasignación requiere decisión explícita con trazabilidad de actor y motivo.

## 21. Fail After Accept (Ruptura post-aceptación)

Existe `TENDERS/ACCEPTED` pero el carrier evidencia imposibilidad de cumplimiento. Incluye observaciones `MEDIA/CRÍTICA` no resueltas en origen.

- No se edita silenciosamente el compromiso.
- Se registra evento de ruptura con motivo tipificado.
- No crea substatus adicional en `TENDERS`.
- La orden reingresa a `DISPATCH/UNASSIGNED`.

## 22. Cancelación por shipper

Cancelación explícita antes de ejecución en ruta.

- Debe ser auditada con motivo estructurado.
- Notificación inmediata obligatoria a: carrier comprometido, conductor/unidad, supervisión de turno en origen y responsables operativos del shipper.

## 23. Órdenes vencidas (Past Due)

Orden cuya fecha/hora objetivo de pickup fue superada sin cierre operativo válido.

**Regla:** no puede permanecer en espera pasiva; entra a cola de excepción con atención prioritaria.

SLA:
- Primera acción: máximo `15–30 min` desde detección.
- Decisión final: máximo `60 min` desde detección.

Árbol de decisión:
1. **Reprogramar** — demanda vigente con nueva ventana factible.
2. **Reasignar** — mismo horizonte con capacidad alternativa disponible.
3. **Cancelar** — servicio sin vigencia o sin rescate factible.

Reason codes mínimos: `PAST_DUE_NO_CAPACITY`, `PAST_DUE_NO_CONFIRMATION`, `PAST_DUE_REPROGRAMMED`, `PAST_DUE_REASSIGNED`, `PAST_DUE_CANCELLED_BY_SHIPPER`.

> **Vencida no es estado terminal; es excepción gestionada con decisión explícita y auditable.**

---

# PARTE VI — Gobernanza

## 24. Priorización operativa

La prioridad es **automática y determinística**; no se captura ni edita manualmente.

> El estado (`stage + substatus`) explica dónde está la orden. La prioridad explica qué se atiende primero.

### Columna de Estado (render único)

`Estado` = `label + timeInfo + badge`. El badge se deriva del score; no es campo manual.

| Stage / Subestado | Label | timeInfo | Badge |
|-------------------|-------|----------|-------|
| `DISPATCH/NEW` | Sin asignar | Creada hace X | Derivado |
| `DISPATCH/UNASSIGNED` | Sin asignar | Vencida hace X / Pickup en X | Derivado |
| `DISPATCH/ASSIGNED` | Asignada | Pendiente de envío | `ALTA` mínimo |
| `TENDERS/PENDING` | Pendiente | Vence en X | `CRÍTICA` ≤2h / `ALTA` ≤6h / `MEDIA` ≤24h / `BAJA` >24h |
| `TENDERS/ACCEPTED` | Aceptada | Aceptada hace X | `ALTA` si pickup <24h, sino `MEDIA` |
| `TENDERS/REJECTED` | Rechazada | hace X | `CRÍTICA` |
| `TENDERS/EXPIRED` | Expirada | hace X | `CRÍTICA` |
| `SCHEDULED/PROGRAMMED` | Programada | Pickup en X | `ALTA` <4h / `CRÍTICA` <2h sin ETA |
| `SCHEDULED/DISPATCHED` | Liberada a origen | Liberada hace X | Por riesgo ETA |
| `SCHEDULED/EN_ROUTE_TO_ORIGIN` | En ruta a origen | ETA at Origen X | Por riesgo ETA |
| `SCHEDULED/AT_ORIGIN` | En origen | Llegó hace X | `MEDIA` |
| `SCHEDULED/LOADING` | Cargando | Desde hace X | `MEDIA` |
| `SCHEDULED/OBSERVED` | Observada | hace X | `CRÍTICA`/`ALTA`/`MEDIA` según severidad |
| Cualquier `CANCELED` | Cancelada | Cancelada hace X | `NEUTRA` |

### Fórmula de prioridad

`priority_effective = stage_score + time_score + exception_score`

**stage_score:** `DISPATCH` +20 / `TENDERS` +40 / `SCHEDULED` +60

**time_score** (tramos mutuamente excluyentes):

| Condición | Score |
|-----------|-------|
| Vencida | +50 |
| Hoy | +30 |
| Mañana | +15 |
| Próximos | +5 |
| TTL ≤ 2h | +40 |
| TTL > 2h y ≤ 6h | +25 |

Los tramos `≤ 2h` y `≤ 6h` clasifican riesgo operativo/visual. Las duraciones de TTL (90min/24h/48h/72h) se definen únicamente en la sección 5.

**exception_score:**

| Condición | Score |
|-----------|-------|
| `REJECTED` / `EXPIRED` / `Fail After Accept` | +50 |
| `OBSERVED_CRÍTICA` | +50 |
| `OBSERVED_MEDIA` | +30 |
| `ETA_RISK_CONFIRMATION` | +25 |
| `ETA_RISK_SCHEDULED` | +25 |

**Buckets:** `≥ 120` → `CRÍTICA` / `≥ 90` → `ALTA` / `≥ 60` → `MEDIA` / `< 60` → `BAJA`

### Orden determinístico de tabla y cola

Aplicado sobre el dataset ya filtrado (ver sección 11):

1. Grupo temporal: Vencidas → Hoy → Mañana → Próximos
2. `priority_effective` desc
3. Menor holgura (`deadline_operativo − now`) asc
4. `planned_start_at` asc
5. `created_at` asc (FIFO)

`deadline_operativo`: `planned_start_at` en DISPATCH / `response_deadline` en TENDERS / `eta_comprometido_origen` en SCHEDULED (fallback: `planned_start_at`).

Dos planners con los mismos filtros observan el mismo orden.

### Relación con cupos contractuales

La priorización incorpora recuperación de cupo por causa (cancelación shipper vs. rechazo/incumplimiento carrier) según política en [ColdSync Matching - Balance de cupos](./matching-orders.md#92-balance-de-cupos-y-recuperación-por-causa).

## 25. Gobernanza y Trazabilidad

- **Fuente de verdad:** `stage + substatus`
- **Una sola máquina de estados** transiciona; no hay cambios paralelos
- **Toda transición** se registra con actor, trigger y motivo
- **Eventos automáticos** deben ser idempotentes

Triggers válidos: `USER` / `SYSTEM` / `TIMER` / `GPS`

## 26. Indicadores de desempeño recomendados

- `% ACCEPTED → AT_ORIGIN a tiempo`
- `% Fail After Accept sobre órdenes aceptadas`
- `Tiempo de reacción desde alerta de riesgo hasta decisión`
- `% rescates exitosos sin pérdida de cita`

## 27. Criterio de cierre del módulo

Dispatch se considera completado para una orden cuando:

- Llega a `SCHEDULED/LOADING`
- Tiene trazabilidad íntegra de decisiones
- No mantiene conflicto de factibilidad abierto

La continuidad operacional posterior ocurre en el siguiente dominio del ciclo global.

---

## Referencias

- [Gestión de Estados](./state-orders.md)
- [ColdSync Orders](./orders.md)
- [ColdSync Matching](./matching-orders.md)

---

**Última actualización:** Febrero 2026
