# 📦 ColdSync Dispatch

## Capa de Orquestación de Capacidad (Shipper Operations Layer)

---

## 1. Naturaleza del Sistema

### 1.1 Qué es ColdSync Dispatch

ColdSync Dispatch es la capa donde el shipper convierte demanda logística en un plan operativo factible para line haul de cadena de frío con flota dedicada/contratada.

Dispatch cubre tres etapas del modelo global:

- `DISPATCH`
- `TENDERS`
- `SCHEDULED`

Objetivo operativo:

> Llevar cada orden desde intención de servicio hasta pre-embarque listo para salida, con trazabilidad completa.

---

### 1.2 Qué problema resuelve

En line haul contractual, la falla operativa aparece cuando demanda, capacidad y compromiso no están sincronizados.

Dispatch resuelve esa brecha con una secuencia de control:

**Demanda -> Factibilidad -> Compromiso -> Programación -> Validación física en origen**

---

### 1.3 Qué NO es ColdSync Dispatch

Dispatch no es:

- Un marketplace spot
- Un sistema de última milla
- Un módulo de monitoreo en ruta
- Un módulo de conciliación financiera
- Un módulo de negociación comercial ad-hoc del carrier

Dispatch decide factibilidad y orquesta compromiso; no ejecuta ruta ni liquida viaje.

---

## 2. Relación Conceptual con Orders

### 2.1 Separación de responsabilidades

**Dispatch**

- Define intención y factibilidad
- Selecciona propuesta de capacidad
- Emite solicitud formal de compromiso
- Reprocesa excepciones

**Orders**

- Evalúa factibilidad del carrier
- Decide aceptar/rechazar/dejar vencer
- Declara recursos para cumplimiento

Principio:

**Dispatch gobierna intención operativa.**
**Orders gobierna compromiso del carrier.**

---

### 2.2 Contrato de interacción Dispatch -> Orders

1. Dispatch emite `TENDERS/PENDING` desde `DISPATCH/ASSIGNED`.
2. Orders devuelve resultado explícito:
   - `TENDERS/ACCEPTED`
   - `TENDERS/REJECTED`
   - `TENDERS/EXPIRED`
3. Dispatch consume la respuesta:
   - `ACCEPTED` -> `SCHEDULED/PROGRAMMED`
   - `REJECTED`/`EXPIRED` -> `DISPATCH/UNASSIGNED`
4. Si existe ruptura post-aceptación (`Fail After Accept`), Dispatch reabre la orden en `DISPATCH/UNASSIGNED`.

Dispatch nunca sustituye la decisión del carrier.

### 2.3 Ownership de TTL y post-aceptación

**TTL en TENDERS**

- La **política de TTL** (criterios y ventanas) es definida por el shipper en el dominio de Dispatch.
- La **ejecución del TTL** (contador, expiración y evento `TENDERS/EXPIRED`) ocurre en Orders.

**Post-aceptación en SCHEDULED**

- Orders cierra su función al confirmar o romper compromiso.
- Dispatch/Scheduled gobiernan cumplimiento de arribo a origen y pre-embarque.
- Si el compromiso no puede cumplirse tras aceptar, se registra `Fail After Accept` y se reabre en `DISPATCH/UNASSIGNED`.

---

### 2.4 Política TTL definida en Dispatch

Dispatch define la política de vencimiento de tender según anticipación operativa:

- Pickup mismo día o siguiente: `90 minutos`
- Pickup en `2-3 días`: `24 horas`
- Pickup en `4-7 días`: `48 horas`
- Pickup en más de `7 días`: `72 horas`

Reglas:

- El TTL corre en tiempo calendario continuo (24/7) con timezone de la organización.
- Al vencer sin decisión, la orden transiciona a `TENDERS/EXPIRED`.
- `TENDERS/EXPIRED` retorna automáticamente a `DISPATCH/UNASSIGNED`.
- Esta sección (`2.4`) es la única fuente para **duración contractual del TTL**.

Esta política se versiona en Dispatch y se ejecuta en Orders sin reinterpretación.

---

### 2.5 Tiempos operativos obligatorios del proceso

Además del TTL, Dispatch define ventanas de control post-aceptación y pre-embarque:

**A. Reconfirmación post-aceptación (`SCHEDULED/PROGRAMMED`)**

- Confirmación inicial de ETA del carrier: máximo `30 minutos` después de `TENDERS/ACCEPTED`.
- Si faltan `<= 4 horas` para cita de carga y no hay ETA confiable: alerta automática + reconfirmación obligatoria.
- Si faltan `<= 2 horas` y persiste riesgo de tardanza: escalación operativa obligatoria.

**B. No-show operativo**

- Si la unidad no llega a origen hasta `30 minutos` después de la hora comprometida: incidente de no-show.
- El incidente debe forzar decisión en máximo `15 minutos`: reasignar, reprogramar o `Fail After Accept`.

**C. Resolución de observaciones en origen (`SCHEDULED/OBSERVED`)**

- Observación `LEVE`: corrección documental/operativa en máximo `30 minutos`.
- Observación `MEDIA`: corrección y validación en máximo `60 minutos`.
- Observación `CRITICA`: corrección obligatoria con ventana máxima de `120 minutos`; si no se resuelve en ventana de servicio, ruptura de compromiso.

**D. Reinspección**

- Toda corrección de `MEDIA/CRITICA` requiere reinspección en máximo `20 minutos` desde reporte de corrección.

Regla:

- Estos tiempos son política por defecto y pueden parametrizarse por organización/lane, pero siempre deben existir como umbral explícito de decisión.

---

## 3. Objeto Conceptual Central: Service Intent

La unidad conceptual de Dispatch es la **Service Intent**.

Define, para cada orden:

- Qué mover: producto, peso, perfil térmico
- Dónde mover: lane, origen, destino, secuencia
- Cuándo mover: fecha y ventana
- Con qué propuesta: carrier y fleetset tentativo

La Service Intent no es compromiso contractual hasta recibir `TENDERS/ACCEPTED`.

---

## 3.1 Dependencias y prerrequisitos operativos del módulo

Dispatch no opera como módulo aislado; depende de capacidades y catálogos de otros dominios.

Prerrequisitos:

- **Lanes:** carril/origen-destino válido y activo
- **Catálogo de carga:** productos y perfiles térmicos vigentes
- **Capacidad operativa:** fleetsets disponibles y habilitados
- **Reglas de compromiso:** integración activa con Orders (`TENDERS`)
- **Seguimiento de arribo:** señal de disponibilidad/ETA para fase `SCHEDULED`

Sin estos prerrequisitos, Dispatch puede registrar demanda, pero no puede orquestar servicio confiable.

---

## 3.2 Contrato mínimo de datos de entrada

Toda orden candidata a planificación debe contener, como mínimo:

- Identificación de lane y puntos operativos
- Fecha y ventana de servicio
- Tipo de carga: `STANDARD` o `HIBRIDA`
- Peso declarado y unidad de medida operativa
- Perfil térmico requerido (uno o múltiples según tipo)

Reglas por tipo de carga:

- **STANDARD:** un perfil térmico principal y compatibilidad simple de capacidad.
- **HIBRIDA:** múltiples perfiles térmicos y validación de compatibilidad por compartimentos/multi-zona.

Compatibilidad de fleetset:

- Un fleetset válido debe cubrir combinación operativa de conductor + unidad tractora/vehículo + remolque (cuando aplique).
- El fleetset debe cumplir restricciones térmicas, capacidad y disponibilidad temporal para el lane.

---

## 3.3 Política de Matching y Selección de Fleetset

Dispatch consume el resultado del motor de matching para construir propuestas de asignación tentativas (`DISPATCH/ASSIGNED`).
La lógica de decisión del motor (reglas duras, temporalidad, cupos y ranking) se mantiene como fuente única en:
- [ColdSync Matching](./matching-orders.md)

Secuencia conceptual de uso en Dispatch:

1. Orden elegible entra a planificación.
2. Matching retorna candidatos factibles + motivo explicable.
3. Planner revisa propuesta y ajusta dentro de reglas permitidas.
4. Dispatch deja la orden en `DISPATCH/ASSIGNED` como borrador.

Principio:

- Dispatch no redefine reglas de matching; las aplica.
- Sin resultado factible, la orden permanece en `DISPATCH/UNASSIGNED` con causa estructurada.

### A. Gobierno de factibilidad en Dispatch

Dispatch debe impedir cualquier avance de planificación cuando matching reporta inviabilidad por hard constraints.

Regla:

- No se permite forzar manualmente una asignación con reason code de inviabilidad.
- Toda excepción debe tratarse por flujo de recuperación (`No-Match`) y no por bypass de regla.

### B. Gobierno de selección en Dispatch

Entre candidatos factibles, Dispatch puede permitir ajuste manual del planner, conservando trazabilidad de decisión.

Desempate recomendado:

1. Menor riesgo temporal
2. Mayor afinidad técnica
3. Menor costo operativo incremental

El detalle técnico de scoring, constraints y reason codes vive en una sola fuente:
- [ColdSync Matching](./matching-orders.md)

---

## 4. Modelo de Estados del Módulo

### 4.1 Etapas cubiertas

`DISPATCH -> TENDERS -> SCHEDULED`

### 4.2 Subestados

**DISPATCH**

- `NEW`
- `UNASSIGNED`
- `ASSIGNED`
- `CANCELED`

**TENDERS**

- `PENDING`
- `ACCEPTED`
- `REJECTED`
- `EXPIRED`
- `CANCELED`

**SCHEDULED**

- `PROGRAMMED`
- `DISPATCHED`
- `AT_ORIGIN`
- `LOADING`
- `OBSERVED`
- `CANCELED`

### 4.3 Transiciones críticas

- `NEW/UNASSIGNED -> ASSIGNED`
- `ASSIGNED -> TENDERS/PENDING`
- `TENDERS/ACCEPTED -> SCHEDULED/PROGRAMMED`
- `TENDERS/REJECTED|EXPIRED -> DISPATCH/UNASSIGNED`
- `SCHEDULED/AT_ORIGIN -> LOADING|OBSERVED`
- `SCHEDULED/OBSERVED -> DISPATCH/UNASSIGNED` (si no se corrige)
- `DISPATCH|TENDERS|SCHEDULED -> CANCELED` (cancelación explícita por shipper)

### 4.4 Contrato operativo de Lista (vista principal)

La operación diaria del módulo se gobierna en vista de lista con dos ejes:

1. **Cola por etapa/substatus**
2. **Horizonte temporal por fecha base**

#### 4.4.1 Cola de despacho por etapas

Agrupación operativa:

- `Planificadas` -> stage `DISPATCH`
- `Enviadas` -> stage `TENDERS`
- `Programadas` -> stage `SCHEDULED`

Cada grupo expone substatus filtrables y contador.

Regla:

- La cola filtra el dataset operativo; no es un resumen decorativo.
- Los mismos criterios se aplican de forma consistente sobre la tabla.

#### 4.4.2 Horizonte temporal (lista)

La lista usa **fecha base + horizonte** para determinar qué órdenes se muestran:

- `Día` (1 día)
- `3 días`
- `Semana` (7 días)
- `14 días`
- `30 días`

Regla de navegación:

- Flechas prev/next avanzan por tamaño de horizonte (1/3/7/14/30).

#### 4.4.3 Precedencia de filtros (determinística)

La tabla debe aplicar intersección lógica (`AND`) en este orden conceptual:

1. Cola (`stage/substatus`)
2. Buscador
3. Filtros estructurales
4. Horizonte temporal

Resultado:

- Dos planners con mismos filtros observan el mismo conjunto de órdenes.

#### 4.4.4 Nota de ciclo sobre `EXPIRED`

`TENDERS/EXPIRED` es un evento contractual válido, pero no una “bandeja permanente”.

Regla:

- tras expirar, la orden retorna a `DISPATCH/UNASSIGNED` para nueva decisión de capacidad.
- en cola operativa, la gestión continua ocurre en `Planificadas/Sin asignar`.

---

## 5. Proceso Operativo Detallado

## 5.1 Fase A: Ingreso de demanda

Entrada:

- Solicitud de transporte con datos mínimos válidos

Validaciones mínimas:

- Lane válido
- Fecha/ventana válida
- Carga y perfil térmico definidos

Salida:

- Orden en `DISPATCH/NEW`

---

## 5.2 Fase B: Clasificación de backlog

Regla:

- Toda orden sin compromiso vigente entra a backlog de despacho

Estados de backlog:

- `DISPATCH/NEW`
- `DISPATCH/UNASSIGNED`

Causas de retorno a backlog:

- `TENDERS/REJECTED`
- `TENDERS/EXPIRED`
- `SCHEDULED/OBSERVED` no resuelto

Salida:

- Orden priorizada para decisión de planificación

---

## 5.3 Fase C: Asignación tentativa de capacidad

Acción:

- Seleccionar carrier/fleetset tentativo mediante regla o decisión del planner

Condición de paso:

- Cumplir restricciones duras (sección 6)

Salida:

- `DISPATCH/ASSIGNED`

---

## 5.3.1 Borrador de Tender (Pre-Tender Review Gate)

La asignación en `DISPATCH/ASSIGNED` representa un **borrador de tender**, no una solicitud enviada al carrier.

Proceso operativo:

1. El planner selecciona qué órdenes entran al proceso de planificación.
2. El sistema genera propuesta de asignación tentativo (matching) para esas órdenes.
3. El planner puede ajustar manualmente carrier/fleetset/fechas dentro de reglas permitidas.
4. Solo tras revisión explícita del planner se habilita emisión formal de tender.

Regla:

- `DISPATCH/ASSIGNED` = intención interna revisable.
- `TENDERS/PENDING` = solicitud formal enviada al carrier.

Principio:

> Planificar no equivale a enviar. El envío a carrier requiere gate explícito de validación del planner.

---

## 5.4 Fase D: Emisión de solicitud formal (Tender)

Acción:

- Emitir solicitud formal al carrier

Condiciones de emisión:

- Orden en `DISPATCH/ASSIGNED`
- Factibilidad aprobada

Salida:

- `TENDERS/PENDING` con TTL dinámico

---

## 5.5 Fase E: Resolución de compromiso del carrier

Rutas:

- `ACCEPTED` -> continuidad
- `REJECTED` -> retorno a backlog
- `EXPIRED` -> retorno a backlog

Resultado:

- Compromiso confirmado o reapertura de decisión de capacidad

---

## 5.6 Fase F: Programación

Entrada:

- `TENDERS/ACCEPTED`

Acción:

- Calendarizar salida y preparar arribo a origen

Salida:

- `SCHEDULED/PROGRAMMED`

---

## 5.6.1 Seguimiento de disponibilidad post-aceptación

La aceptación de tender confirma compromiso, pero no elimina riesgo de no llegada o tardanza.

El seguimiento entre `SCHEDULED/PROGRAMMED` y `SCHEDULED/AT_ORIGIN` es obligatorio y se rige por:

- `2.5 Tiempos operativos obligatorios del proceso` (ventanas y SLA)
- `9. Protocolo de Cumplimiento Post-Aceptación` (secuencia, escalación y decisión)

---

## 5.7 Fase G: Pre-embarque en origen

Secuencia:

1. `SCHEDULED/DISPATCHED`
2. `SCHEDULED/AT_ORIGIN`
3. Inspección/checklist físico
4. Resultado:
   - Aprobado -> `SCHEDULED/LOADING`
   - Observado -> evaluación por severidad y decisión operativa

### 5.7.1 Matriz de decisión por severidad de observación

La observación en origen debe tratarse con severidad tipificada, no con criterio libre.
Este control es una política operativa del proceso, no un módulo independiente.

- **Leve:** la unidad puede viajar bajo condición y evidencia de corrección planificada.
  - Resultado: continuidad a `SCHEDULED/LOADING`.
- **Media:** requiere validación de supervisión y tiempo de corrección compatible con la cita.
  - Si corrige dentro de ventana: continuidad a `SCHEDULED/LOADING`.
  - Si no corrige en ventana: `SCHEDULED/OBSERVED` y contingencia.
- **Crítica:** la unidad no puede viajar.
  - Resultado inicial: `SCHEDULED/OBSERVED`.
  - Requiere corrección obligatoria + reinspección.

### 5.7.1.1 Catálogo cerrado de observaciones (norma)

Toda observación de origen debe registrarse con un código de catálogo predefinido.  
No se permite texto libre como causa principal de decisión.

Cada código del catálogo debe incluir:

- Código único de causa
- Descripción operativa estandarizada
- Severidad (`LEVE`, `MEDIA`, `CRITICA`)
- Condición de salida (`can_depart`: sí/no)
- Requiere aprobación de supervisor (sí/no)
- Requiere reinspección (sí/no)
- Tiempo máximo de corrección sugerido (SLA)

Beneficio operativo:

- Elimina decisiones ambiguas entre turnos
- Permite trazabilidad comparable entre carriers, plantas y lanes
- Asegura consistencia entre operación, auditoría y gestión contractual

### 5.7.1.2 Bloqueantes de salida

Las causas catalogadas como bloqueantes impiden continuidad a `SCHEDULED/LOADING` hasta corrección y validación.

Regla:

- Si `can_depart = no`, la orden debe permanecer en `SCHEDULED/OBSERVED` hasta resolución o retorno a `DISPATCH/UNASSIGNED`.

### 5.7.2 Resolución de `SCHEDULED/OBSERVED`

Rutas válidas:

- `OBSERVED -> LOADING` (corrección exitosa y aprobación)
- `OBSERVED -> AT_ORIGIN` (reinspección en curso)
- `OBSERVED -> DISPATCH/UNASSIGNED` (no se logra resolver en ventana)

Si la observación impide cumplir el servicio aceptado:

- Se registra ruptura post-aceptación (`Fail After Accept`) y se reabre capacidad en `DISPATCH/UNASSIGNED`.

### 5.7.3 Criterio de handoff operacional

La transferencia al siguiente dominio operacional ocurre solo cuando:

- la unidad supera control de origen,
- se valida pre-enfriamiento requerido,
- y se confirma inicio de carga/salida según política operativa.

No se transfiere responsabilidad al siguiente dominio mientras la orden permanezca en `AT_ORIGIN` u `OBSERVED`.

Si `OBSERVED` no se corrige:

- Retorno a `DISPATCH/UNASSIGNED`

Salida final del módulo:

- Orden en `SCHEDULED/LOADING` lista para handoff operacional

---

## 6. Gobierno de Factibilidad en Dispatch

Las reglas duras de factibilidad pertenecen al dominio de Matching y no se duplican en Dispatch:
- [ColdSync Matching - Hard Constraints](./matching-orders.md#5-hard-constraints-bloqueantes)

Responsabilidad de Dispatch:

- Aplicar el resultado de factibilidad sin reinterpretación.
- Bloquear avance a `DISPATCH/ASSIGNED` cuando exista inviabilidad.
- Registrar causa estructurada y enrutar a recuperación operativa.

Principio:

> Dispatch no emite compromiso potencialmente inviable.

---

## 7. Política de Priorización

Dispatch utiliza una **prioridad operativa automática y determinística**.

La prioridad no se define manualmente al crear la orden; se recalcula según estado operativo y tiempo.

Principio:

> El estado (`stage + substatus`) explica dónde está la orden; la prioridad operativa explica qué se atiende primero.

### 7.1 Estado inteligente (una sola columna `Estado`)

Regla:

- Render de `Estado` = `label + timeInfo + badge`.
- No se agrega columna nueva para prioridad.
- El badge es derivado automáticamente (sin edición manual).

#### DISPATCH

- `NEW` -> label: `Sin asignar` | timeInfo: `Creada hace X` | badge: según prioridad derivada
- `UNASSIGNED` -> label: `Sin asignar` | timeInfo:
  - si `planned_start_at < now`: `Vencida hace X`
  - si hoy/futuro: `Pickup en X`
  - badge: según prioridad derivada
- `ASSIGNED` -> label: `Asignada` | timeInfo: `Pendiente de envío` | badge: `ALTA` (mínimo)

#### TENDERS

- `PENDING` -> label: `Pendiente` | timeInfo: `Vence en X` | badge por TTL:
  - `<= 2h`: `CRÍTICA`
  - `>2h y <=6h`: `ALTA`
  - `>6h y <=24h`: `MEDIA`
  - `>24h`: `BAJA`
- `ACCEPTED` -> label: `Aceptada` | timeInfo: `Aceptada hace X` | badge: `ALTA` si pickup < 24h, sino `MEDIA`
- `REJECTED` -> label: `Rechazada` | timeInfo: `hace X` | badge: `CRÍTICA`
- `EXPIRED` -> label: `Expirada` | timeInfo: `hace X` | badge: `CRÍTICA`

Regla de transición:

- Si el TTL vence en `PENDING`, la orden transiciona a `EXPIRED` y retorna a `DISPATCH/UNASSIGNED`.

#### SCHEDULED

- `PROGRAMMED` -> label: `Programada` | timeInfo: `Pickup en X` | badge:
  - pickup < 4h: `ALTA`
  - pickup < 2h sin reconfirmación/ETA: `CRÍTICA`
- `DISPATCHED` -> label: `En tránsito a origen` | timeInfo: `ETA origen X` | badge por riesgo ETA (`CRÍTICA`/`ALTA`/`MEDIA`)
- `AT_ORIGIN` -> label: `En origen` | timeInfo: `Llegó hace X` | badge: `MEDIA`
- `LOADING` -> label: `Cargando` | timeInfo: `Desde hace X` | badge: `MEDIA`
- `OBSERVED` -> label: `Observada` | timeInfo: `hace X` | badge:
  - severidad `CRITICA`: `CRÍTICA`
  - severidad `MEDIA`: `ALTA`
  - severidad `LEVE`: `MEDIA`

Regla transversal de cancelación:

- `CANCELED` (en `DISPATCH`, `TENDERS` o `SCHEDULED`) -> label: `Cancelada` | timeInfo: `Cancelada hace X` | badge: `NEUTRA`

### 7.2 Cobertura por etapa del módulo

La prioridad operativa se aplica a los tres stages que gobierna Dispatch:

- `DISPATCH`
- `TENDERS`
- `SCHEDULED`

No cambia ownership funcional:

- Orders mantiene la decisión de compromiso del carrier.
- Dispatch mantiene la orquestación y el orden de atención.

### 7.3 Fórmula única de prioridad

`priority_effective = stage_score + time_score + exception_score`

`stage_score`:

- `DISPATCH`: 20
- `TENDERS`: 40
- `SCHEDULED`: 60

`time_score`:

- vencida: +50
- hoy: +30
- mañana: +15
- próximos: +5
- TTL `<=2h`: +40
- TTL `>2h y <=6h`: +25

Regla de no-duplicidad temporal:

- Los tramos de `time_score` son mutuamente excluyentes (no suman doble).
- La duración del TTL (90m/24h/48h/72h) se define solo en `2.4`.
- Los tramos de `<=2h` y `<=6h` aquí solo clasifican riesgo operativo/visual.

`exception_score`:

- `REJECTED/EXPIRED/FAIL_AFTER_ACCEPT`: +50
- `OBSERVED_CRITICA`: +50
- `OBSERVED_MEDIA`: +30
- `ETA_RISK_CONFIRMATION`: +25
- `ETA_RISK_SCHEDULED`: +25

Buckets:

- `>=120`: `CRÍTICA`
- `>=90`: `ALTA`
- `>=60`: `MEDIA`
- `<60`: `BAJA`

Regla:

- El bucket visual deriva del score efectivo; no es campo manual de entrada del planner.
- Si existe excepción de negocio, debe quedar auditada y expirar por política operativa.

### 7.4 Orden determinístico único (tabla y cola)

Sort global (mismo algoritmo en ambos):

Este orden se aplica **sobre el conjunto ya filtrado** por `4.4.3 Precedencia de filtros (determinística)`.

1. Grupo temporal:
   - `Vencidas`
   - `Hoy`
   - `Mañana`
   - `Próximos`
2. `priority_effective` desc
3. Menor holgura temporal (`deadline_operativo - now`) asc
4. `planned_start_at` asc
5. `created_at` asc (FIFO)

Definición única de `deadline_operativo`:

- `DISPATCH`: `planned_start_at`
- `TENDERS`: `response_deadline`
- `SCHEDULED`: `eta_comprometido_origen`; si no existe, fallback `planned_start_at`

Objetivo:

- Dos planners con los mismos filtros deben observar el mismo orden de cola.

### 7.5 Regla de operación para creación y edición

- En creación, la orden no requiere captura manual de prioridad operativa.
- La prioridad se calcula automáticamente desde el primer render operativo.
- La prioridad operativa no se edita manualmente en UI; cualquier ajuste debe resolverse por reglas del motor y no por override humano.

### 7.6 Relación con cupos contractuales

En operaciones con cupos contractuales, la priorización incorpora recuperación de cupo por causa
(cancelación shipper vs rechazo/incumplimiento carrier), según política definida en:

- [ColdSync Matching - Balance de cupos](./matching-orders.md#92-balance-de-cupos-y-recuperación-por-causa)

---

## 8. Gestión de Excepciones

Excepciones estructurales:

- `TENDERS/REJECTED`
- `TENDERS/EXPIRED`
- `Fail After Accept`
- `SCHEDULED/OBSERVED`
- Vencimiento sin capacidad
- Cancelación por shipper antes de ejecución

Tratamiento estándar:

1. Excepciones recuperables (`REJECTED`, `EXPIRED`, `Fail After Accept`, `OBSERVED` no resuelto): retorno a `DISPATCH/UNASSIGNED`
2. Excepciones terminales por decisión de negocio (`Cancelación por shipper`): transición a `CANCELED`
3. Registro de causa raíz y actor
4. Nueva decisión cuando aplique: reasignar, reprogramar o cancelar

### 8.0 Principio de intervención humana en reasignación

Cuando una orden retorna por excepción (`REJECTED`, `EXPIRED`, `Fail After Accept`, `OBSERVED` no resuelto):

- el sistema puede sugerir candidatos de matching,
- pero no debe ejecutar reasignación automática silenciosa.

La reasignación requiere decisión explícita del planner con trazabilidad de actor y motivo.

### 8.0.1 Excepción por vencimiento de tender (TTL)

Cuando un tender vence en `TENDERS/PENDING`:

- Se registra `TENDERS/EXPIRED` como ausencia de compromiso.
- Se activa retorno automático a `DISPATCH/UNASSIGNED`.
- Dispatch obliga nueva decisión de capacidad (reasignar carrier/fleetset, reprogramar o cancelar).

Esta excepción se rige por la política definida en `2.4 Política TTL definida en Dispatch`.

### 8.1 Fail After Accept (Ruptura post-aceptación)

Definición:

- Existe `TENDERS/ACCEPTED`, pero el carrier informa o evidencia imposibilidad de cumplimiento.
- Incluye imposibilidad originada por observaciones de severidad media/crítica no resueltas en origen.

Regla operativa:

- No se edita silenciosamente el compromiso.
- Se registra evento de ruptura con motivo tipificado y trazabilidad completa.
- La orden reingresa a `DISPATCH/UNASSIGNED` para recuperación operativa.

Objetivo:

- Proteger continuidad del plan y conservar evidencia contractual de incumplimiento.

### 8.2 Cancelación por shipper

Definición:

- El shipper cancela una orden antes de ejecución en ruta.

Regla operativa:

- La cancelación debe ser explícita, auditada y con motivo estructurado.
- Debe notificarse de forma inmediata a actores operativos impactados.

Notificación mínima:

- Carrier comprometido
- Conductor/unidad comprometida
- Supervisión de turno en origen
- Responsables operativos del shipper

Objetivo:

- Evitar viajes fantasma, arribos innecesarios y pérdida de capacidad.

### 8.3 Protocolo para órdenes vencidas (past due)

Definición:

- Orden cuya fecha/hora objetivo de pickup ya fue superada sin cierre operativo válido.

Regla principal:

- Una orden vencida no puede permanecer en espera pasiva.
- Debe entrar a cola de excepción con atención prioritaria inmediata.

SLA recomendado:

1. Primera acción obligatoria: máximo `15-30 minutos` desde detección de vencimiento.
2. Decisión operativa final: máximo `60 minutos` desde detección.

Árbol de decisión recomendado:

1. **Reprogramar**  
   - Si la demanda sigue vigente y existe nueva ventana factible.
2. **Reasignar**  
   - Si el servicio debe mantenerse en el mismo horizonte operativo y existe capacidad alternativa.
3. **Cancelar**  
   - Si el servicio perdió vigencia operativa/comercial o no existe rescate factible.

Trazabilidad obligatoria:

- `reason_code` estructurado para toda decisión sobre orden vencida.
- Comentario operativo opcional.
- Registro de actor, timestamp y acción tomada.

Reason codes sugeridos mínimos:

- `PAST_DUE_NO_CAPACITY`
- `PAST_DUE_NO_CONFIRMATION`
- `PAST_DUE_REPROGRAMMED`
- `PAST_DUE_REASSIGNED`
- `PAST_DUE_CANCELLED_BY_SHIPPER`

Principio:

> Vencida no es estado terminal; es excepción gestionada con decisión explícita y auditable.

---

## 9. Protocolo de Cumplimiento Post-Aceptación

El `TTL` de tender controla el tiempo de respuesta comercial, pero no garantiza cumplimiento operativo de arribo a origen.  
Por eso, después de `TENDERS/ACCEPTED`, Dispatch aplica un protocolo adicional de aseguramiento.

### 9.1 Doble compromiso operativo

1. **Compromiso de aceptación:** `TENDERS/ACCEPTED`
2. **Compromiso de arribo:** confirmación de disponibilidad y ETA comprometido hacia origen

Sin el segundo compromiso, la aceptación no protege completamente la ejecución del día.

### 9.2 Secuencia estándar post-aceptación

1. Registrar ETA comprometido por el carrier.
2. Activar cálculo automático de ETA con telemetría disponible.
3. Comparar ETA calculado vs cita comprometida.
4. Si hay riesgo, exigir reconfirmación operativa en ventana controlada.
5. Si no hay reconfirmación viable o se confirma imposibilidad, ejecutar contingencia.

### 9.3 Escalación por niveles

- **Nivel 1 (automático):** recordatorio de compromiso y ETA.
- **Nivel 2 (automático):** alerta de riesgo por desvío de ETA.
- **Nivel 3 (semiautomático):** solicitud obligatoria de reconfirmación.
- **Nivel 4 (operativo):** decisión de rescate (`reasignar`, `reprogramar` o `Fail After Accept`).

### 9.4 Regla de decisión

Si la probabilidad de llegada a tiempo cae bajo el umbral operativo definido, no se mantiene espera pasiva.  
Se fuerza una decisión explícita:

- **Reconfirmación viable** (nuevo ETA compatible con cita)
- **Ruptura post-aceptación** (`Fail After Accept`) y retorno a `DISPATCH/UNASSIGNED`

### 9.5 Rol de interacción manual

Llamadas y mensajes son respaldo operativo, no fuente principal de verdad.  
Toda interacción manual relevante debe registrarse como evento estructurado en historial.

### 9.6 Indicadores de desempeño recomendados

- `% Accepted -> AT_ORIGIN a tiempo`
- `% Fail After Accept sobre órdenes aceptadas`
- `Tiempo de reacción desde alerta de riesgo hasta decisión`
- `% rescates exitosos sin pérdida de cita`

Principio:

> La operación no debe depender de persecución manual del carrier; debe estar gobernada por compromiso explícito, telemetría y decisiones por excepción.

---

## 10. Gobernanza y Trazabilidad

Normas:

- Fuente de verdad: `stage + substatus`
- Una sola máquina de estados transiciona
- Toda transición se registra con actor, trigger y motivo
- Eventos automáticos deben ser idempotentes

Triggers esperados:

- `USER`
- `SYSTEM`
- `TIMER`
- `GPS`

---

## 11. Alcance y Criterio de Cierre del Módulo

Dispatch se considera completado para una orden cuando:

- Llega a `SCHEDULED/LOADING`
- Tiene trazabilidad íntegra de decisiones
- No mantiene conflicto de factibilidad abierto

La continuidad operacional posterior ocurre en el siguiente dominio del ciclo global.

---

## 12. Principio Rector

ColdSync Dispatch en line haul frío es un sistema de:

- Control de factibilidad
- Orquestación de compromiso
- Gestión disciplinada de excepciones
- Preparación operativa previa a ejecución

---

## 13. Referencias

- [Gestión de Estados](./state-orders.md)
- [ColdSync Orders](./orders.md)
- [ColdSync Matching](./matching-orders.md)
- [Auditoría de Integración](../spec/analysis-state-integration.md)

---

**Última actualización:** Febrero 2026
