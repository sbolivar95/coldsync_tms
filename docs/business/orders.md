# 📘 ColdSync Orders

## Capa de Compromiso Operativo del Carrier (Carrier Commitment Layer)

---

## 1. Naturaleza del Sistema

### 1.1 Qué es ColdSync Orders

ColdSync Orders es la **capa de compromiso operativo** entre Shippers y Carriers dentro de ColdSync.

Su propósito es transformar una **intención de transporte** generada en Dispatch en un **compromiso operativo explícito, verificable y auditable** por parte de un Carrier para ejecutar un servicio específico bajo condiciones definidas.

ColdSync Orders:

* No planifica carriles (lanes)
* No planifica rutas
* No selecciona carriles
* No ejecuta despacho
* No monitorea viajes
* No gestiona configuraciones de fleet
* No actúa como torre de control

ColdSync Orders existe exclusivamente para responder:

> ¿Existe o no existe un compromiso operativo válido de este carrier para ejecutar este servicio, en esta fecha, bajo estas condiciones?

---

### 1.2 Qué problema resuelve

En operaciones Line Haul contractuales:

* Existen contratos
* Existen tarifas
* Existen reglas de asignación
* Existen capacidades teóricas

Pero nada de eso equivale a un **sí operativo explícito**.

ColdSync Orders introduce una capa formal de **perfeccionamiento del compromiso**:

**Intención → Solicitud Formal → Decisión Explícita → Compromiso Registrado**

Sin este paso, toda planificación es solamente proyección.

---

### 1.3 Qué NO es ColdSync Orders

* No es un módulo de planificación
* No es un sistema de ejecución
* No es un marketplace
* No es un motor de negociación

Es una **capa de toma de compromiso**.

---

## 2. Relación Conceptual: Dispatch vs Orders

### Dispatch (Shipper-Facing)

* Construye la intención del servicio (Orders)
* Define condiciones operativas
* Selecciona carrier objetivo
* Emite tender

### Orders (Carrier-Facing)

* Recibe tender
* Valida factibilidad operativa
* Emite decisión explícita
* Registra compromiso o ausencia de compromiso

**Dispatch gobierna intención.**
**Orders gobierna compromiso.**

### 2.1 Prioridad Operativa (Relación con Dispatch)

La prioridad operativa de atención se define en Dispatch y se proyecta en Orders como señal de trabajo.

Regla conceptual:

* Dispatch calcula prioridad efectiva en función de `stage + substatus` y riesgo temporal.
* Orders puede mostrar bucket visual (`CRITICA`, `ALTA`, `MEDIA`, `BAJA`) para priorizar bandeja del carrier.
* Orders no redefine el motor de prioridad ni altera ownership de compromiso.

Implicación:

* La prioridad puede variar durante `DISPATCH`, `TENDERS` y `SCHEDULED` en el flujo global, pero en Orders se consume como señal derivada para la bandeja de trabajo del carrier.
* En Orders, la prioridad guía atención de tenders, pero la decisión de compromiso sigue siendo:
  * Accept
  * Accept with Changes
  * Decline
  * Expired

Fuente canónica del modelo de priorización:

* [ColdSync Dispatch](./dispatch.md#7-política-de-priorización)

---

## 3. Objeto Conceptual Central: Tender

Un Tender es una **solicitud formal de compromiso** enviada a un carrier específico para un servicio concreto.

El Tender puede contener un Fleetset sugerido por Dispatch.
Dicho Fleetset no constituye asignación, sino recomendación inicial.

Propiedades:

* Carrier destino único
* Condiciones claras del servicio
* Vigencia temporal (TTL)
* Requiere decisión explícita

Mientras un tender no tenga decisión:

> No existe compromiso operativo.

---

## 4. Decisiones del Carrier

### 4.1 Accept

El carrier confirma que ejecutará el servicio bajo los términos recibidos.

Resultado:
**Se crea un compromiso operativo.**

---

### 4.2 Accept with Changes

El carrier confirma que ejecutará el servicio proponiendo **únicamente sustitución de recursos propios** (Fleetsets):

* Vehículo
* Conductor
* Trailer

No se permiten cambios en:

* Origen
* Destino
* Fecha
* Hora
* Producto
* Perfil térmico
* Peso

Resultado:
**Se crea compromiso operativo con recursos sustituidos.**

Este evento **no edita un compromiso existente**.
Es una forma alternativa de creación de compromiso.

---

### 4.2.1 Declaración de Recursos mediante Fleetsets (Resource Declaration)

En ColdSync, los recursos operativos del carrier se modelan como **Fleetsets**, compuestos por:

**Conductor + Vehículo + Remolque**

También existen vehículos rígidos (sin remolque). En ese caso, un Fleetset puede ser:

**Conductor + Vehículo**

ColdSync Orders:

* No crea Fleetsets
* No administra Fleetsets
* No edita Fleetsets

Orders solo consume Fleetsets previamente definidos en el módulo de Fleet del carrier.

El compromiso operativo siempre queda asociado a:

> Un carrier **y** un Fleetset declarado.

---

#### Fleetset asignado desde Dispatch

El Tender puede llegar a Orders con un Fleetset ya asignado o sugerido por Dispatch, debido a esquemas de flota dedicada o contratada visibles para el shipper.

Este Fleetset:

* No constituye asignación final
* Representa una recomendación inicial

---

#### Recomendación de Fleetsets compatibles

Si el carrier necesita sustituir el Fleetset recibido:

* Orders consulta los Fleetsets activos existentes del carrier (gestionados en Fleet)
* Orders muestra únicamente Fleetsets existentes que ya cumplen con las condiciones de la orden

Orders no crea ni arma Fleetsets.

---

#### Selección del Fleetset

Durante **Accept** o **Accept with Changes**:

1. Orders muestra Fleetsets compatibles
2. El carrier selecciona uno
3. El sistema valida nuevamente compatibilidad
4. Se registra el compromiso junto con el Fleetset elegido

ColdSync **no elige** el Fleetset por el carrier.

---

#### Regla de Responsabilidad

* ColdSync valida compatibilidad
* El carrier decide qué Fleetset usar
* El carrier asume responsabilidad sobre esa elección

---

#### Relación con “Accept” y “Accept with Changes”

Ambos representan creación de compromiso con declaración de Fleetset.

La diferencia es solo de experiencia de usuario:

* **Accept** → selecciona Fleetset sugerido o visible
* **Accept with Changes** → selecciona Fleetset alternativo

En ambos casos:

> El compromiso se crea con un Fleetset declarado.

---

#### Inmutabilidad del Fleetset Declarado

Una vez creado el compromiso:

* El Fleetset asociado no puede cambiarse

Si el carrier necesita usar otro Fleetset:

Se debe declarar **Fail After Accept** y crear un nuevo tender.

Esto preserva:

* Trazabilidad
* Auditoría
* Métricas reales

---

### 4.2.2 Principio Operativo de Sustitución de Recursos

ColdSync Orders **no soporta reasignación de recursos dentro de un compromiso existente**.

La sustitución de recursos ocurre únicamente:

* Durante la creación del compromiso (Accept / Accept with Changes)

Cualquier cambio posterior se considera:

**Ruptura de compromiso.**

---

### 4.2.3 Reemplazo Controlado Post-Aceptación (Replacement Event - Recomendación)

[Inferencia] En sistemas TMS enterprise, el patrón común no es “editar” un compromiso, sino registrar un **evento de reemplazo** auditado antes del handoff a ejecución.

Para alinear ColdSync con esa práctica sin perder la certeza contractual, se recomienda soportar un reemplazo controlado bajo reglas estrictas.

**Principio:** No se edita el compromiso. Se registra un evento auditable asociado al compromiso.

**Condiciones mínimas recomendadas:**

* Solo permitido **antes del handoff** (antes de “Cerrado por Handoff”)
* Solo puede seleccionarse un Fleetset dentro de los Fleetsets compatibles mostrados
* Requiere **motivo tipificado**
* Requiere auditoría: quién, cuándo, qué Fleetset saliente, qué Fleetset entrante
* Límite recomendado: **máximo 1 o 2 reemplazos** por compromiso

**Implicación conceptual:**

* El compromiso sigue siendo válido
* Se mantiene la trazabilidad de recursos
* Se evita re-tender innecesario por eventos operativos frecuentes

**Regla de degradación:**

Si no existe Fleetset compatible disponible para reemplazo, o se excede el límite permitido:

* **Fail After Accept** y re-tender

---

### 4.3 Decline

El carrier declara imposibilidad de ejecutar.

Motivos tipificados (ejemplos):

* Falla de equipo de frío
* Falta de conductor certificado
* Incompatibilidad sanitaria de carga previa

Resultado:
**No existe compromiso.**

---

### 4.4 No Response (Expired)

El TTL vence sin decisión.

Resultado:
**No existe compromiso.**

---

### 4.5 Fail After Accept

El carrier había creado compromiso, pero posteriormente declara imposibilidad.

Resultado:
**Ruptura de compromiso.**
Genera evento auditable y base para penalidad.

---

### 4.6 Observed (Falla Física en Origen)

El carrier llegó a planta bajo compromiso válido, pero la unidad falla checklist físico.

Resultado:
**Ruptura de compromiso por incumplimiento de declaración.**

---

## 5. Estados Conceptuales del Compromiso

Orders gestiona **estados de compromiso**, no estados de viaje.

En el modelo de [Gestión de Estados](./state-orders.md), Orders corresponde a la **etapa TENDERS**:

| Estado Conceptual | Stage/Substatus | Descripción |
|---|---|---|
| No Solicitado | `DISPATCH/ASSIGNED` | Orden asignada pero no enviada al carrier |
| Solicitado (Tender Pendiente) | `TENDERS/PENDING` | TTL activo, esperando decisión del carrier |
| Comprometido | `TENDERS/ACCEPTED` | Carrier confirmó — compromiso creado |
| Rechazado | `TENDERS/REJECTED` | Carrier declinó — retorna a `DISPATCH/UNASSIGNED` |
| Vencido | `TENDERS/EXPIRED` | TTL venció sin respuesta — retorna a `DISPATCH/UNASSIGNED` |
| Roto por Observación | `SCHEDULED/OBSERVED` | Unidad falló checklist en planta |
| Cerrado por Handoff | `SCHEDULED/PROGRAMMED` | Compromiso transferido a ejecución |

> "Cerrado por Handoff" significa que el compromiso fue exitosamente transferido a la etapa SCHEDULED.
> No significa que Orders ejecuta el viaje.

---

## 6. Rol del Tiempo (TTL)

Todo tender posee TTL obligatorio.

Si expira:

* Se marca Expired
* Se considera ausencia de compromiso
* Pasa a Dispatch nuevamente como una rechazada/sin asignar y puede emitir nuevo tender de esta orden.

---

### 6.1 Política de TTL Dinámico

El TTL se calcula según **diferencia entre fecha/hora de tender y fecha/hora de pickup**.

* Pickup mismo día o siguiente: 90 minutos
* Pickup en 2–3 días: 24 horas
* Pickup en 4–7 días: 48 horas
* Pickup >7 días: 72 horas

**Regla:**
El TTL corre en tiempo calendario continuo (24/7) usando timezone de la organización.
La duración contractual del TTL es canónica en Dispatch y se consume sin reinterpretación en Orders.

### 6.2 Ownership del TTL

- La **política de TTL** (ventanas y criterio de negocio) es definida por el shipper en Dispatch.
- Orders aplica esa política en runtime para gestionar `TENDERS/PENDING` y transicionar a `TENDERS/EXPIRED` cuando corresponde.
- Orders no redefine unilateralmente la política de TTL.

### 6.3 Ownership post-aceptación

- Orders gobierna la decisión de compromiso (`ACCEPTED/REJECTED/EXPIRED`) y su trazabilidad.
- El cumplimiento de arribo y pre-embarque posterior a `ACCEPTED` pertenece al dominio `SCHEDULED`.
- Si existe imposibilidad de cumplimiento después de aceptar, se registra `Fail After Accept` y la orden vuelve a `DISPATCH/UNASSIGNED` para reorquestación.

---

## 7. Comportamiento ante concurrencia

* Solo un tender activo por servicio
* Si un tender expira, cualquier acción posterior del carrier es ignorada
* Si el shipper re-tenderiza, el tender previo queda cerrado

Esto evita dobles compromisos.

---

## 8. Traducción a UI

Acciones visibles:

* Aceptar
* Aceptar con cambios
* Rechazar

Expired, Fail After Accept y Observed son resultados sistémicos.

---

## 9. Alcance Real de Orders

ColdSync Orders:

* Registra creación de compromiso
* Registra rupturas de compromiso
* Registra cierre por handoff

No:

* Ejecuta
* Despacha
* Monitorea
* Concilia
* Genera reportes
* Genera facturas
* Genera cierres

---

## 10. Inmutabilidad del Compromiso

Una vez creado:

* No se edita
* No se reemplaza

Solo puede:

* Cumplirse
* Romperse
* Cerrarse por handoff

---

## 11. Principio Rector

ColdSync Orders optimiza **certeza**, no optimización.

No optimiza:

* Costos
* Kilómetros
* Rutas
* Tiempos

Optimiza:

> Confiabilidad contractual de ejecución.

---

## 12. Modelo Final

**Intención → Tender → Decisión → Compromiso → (Cumplido | Roto | Cerrado)**

> **Referencia completa:** Ver [Gestión de Estados](./state-orders.md) para el modelo global de 5 etapas y cómo TENDERS se relaciona con DISPATCH, SCHEDULED, EXECUTION y CONCILIATION.

---

## 13. Experiencia Operativa (UX) de Orders

### 13.1 Bandeja Principal

Orders funciona como una **bandeja de trabajo del carrier** que muestra únicamente tenders activos sin decisión.

Cada fila representa:

> Una solicitud de compromiso pendiente.

---

### 13.2 Clasificación Visual

Las órdenes se agrupan y filtran por:

* Hoy
* Mañana
* Próximos 2–3 días
* Futuras (>3 días)
* Expiran pronto
* Vencidas

No se crean estados nuevos.

---

### 13.3 Urgencia

Derivada del TTL restante:

* Crítica (`<= 2h` o vencido)
* Alta (`> 2h y <= 6h`)
* Media (`> 6h y <= 24h`)
* Baja (`> 24h`)

---

### 13.4 Prioridad

Campo derivado y enviado desde Dispatch:

* Crítica
* Alta
* Media
* Baja

Orders solo muestra este valor y no redefine su cálculo.

---

### 13.5 Ordenamiento Recomendado

Para bandeja de Orders (`TENDERS/PENDING`), mantener orden determinístico alineado a Dispatch:

1. Urgencia TTL
2. `priority_effective` desc
3. Menor holgura temporal (`response_deadline - now`) asc
4. `planned_start_at` asc
5. `created_at` asc (FIFO)

---

### 13.6 Usuarios Objetivo

* Despachador del carrier
* Planner del carrier
* Coordinador de flota
* Supervisor operativo

El chofer no interactúa con Orders.

---

### 13.7 Acciones Masivas

Permitidas:

* Decline múltiple

Condicionadas:

* Accept múltiple solo si cada orden tiene Fleetset declarado explícitamente

No recomendadas:

* Accept with Changes masivo
