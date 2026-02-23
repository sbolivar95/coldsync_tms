# 📘 ColdSync Orders
## Capa de Compromiso Operativo del Carrier (Carrier Commitment Layer)

---

# PARTE I — Contexto y Propósito

## 1. Qué es ColdSync Orders

ColdSync Orders es la **capa de compromiso operativo** entre Shippers y Carriers dentro de ColdSync.

Su propósito es transformar una **intención de transporte** generada en Dispatch en un **compromiso operativo explícito, verificable y auditable** por parte de un Carrier para ejecutar un servicio específico bajo condiciones definidas.

El problema que resuelve: en operaciones Line Haul contractuales existen contratos, tarifas, reglas de asignación y capacidades teóricas — pero nada de eso equivale a un **sí operativo explícito**. Orders introduce una capa formal de perfeccionamiento del compromiso:

**Intención → Solicitud Formal → Decisión Explícita → Compromiso Registrado**

Sin este paso, toda planificación es solamente proyección.

## 2. Qué NO es Orders — y scope del módulo

Orders existe exclusivamente para responder:

> ¿Existe o no existe un compromiso operativo válido de este carrier para ejecutar este servicio, en esta fecha, bajo estas condiciones?

No es un módulo de planificación, ejecución, marketplace ni motor de negociación. No ejecuta, despacha, monitorea la ejecución en ruta (dominio `EXECUTION`), concilia, genera reportes, facturas ni cierres.

Orders cubre dos momentos del compromiso: la decisión explícita en `TENDERS` y la continuidad operativa post-aceptación en `SCHEDULED` para seguimiento del carrier y gestión de excepciones (incluyendo `Fail After Accept`).

Resultados posibles del proceso de tender:

- **Con compromiso creado:** puede **cumplirse** (transferencia a `SCHEDULED/PROGRAMMED`) o **romperse** vía `Fail After Accept` (incluyendo `SCHEDULED/OBSERVED` no resuelto).
- **Sin compromiso creado:** puede **terminar sin compromiso** por rechazo (`TENDERS/REJECTED`) o expiración (`TENDERS/EXPIRED`).

## 3. Relación con Dispatch

**Dispatch** construye la intención del servicio, define condiciones operativas, selecciona el carrier objetivo y emite el tender.

**Orders** recibe el tender, valida factibilidad operativa, emite decisión explícita y registra el compromiso o su ausencia.

> **Dispatch gobierna intención. Orders gobierna compromiso.**

### Prioridad operativa

La prioridad de atención se define y calcula en Dispatch; Orders la consume como señal de trabajo para la bandeja del carrier. Orders no redefine el motor de prioridad ni altera el ownership del compromiso.

Fuente canónica: [ColdSync Dispatch — Priorización operativa](./dispatch.md#24-priorización-operativa)

### Ownership de TTL y post-aceptación

- La **política de TTL** (ventanas y criterio de negocio) es definida por el shipper en Dispatch.
- Orders aplica esa política en runtime: gestiona `TENDERS/PENDING` y transiciona a `TENDERS/EXPIRED` cuando corresponde. No redefine la política.
- Orders gobierna la decisión de compromiso (`ACCEPTED` / `REJECTED` / `EXPIRED`) y su trazabilidad.
- El cumplimiento de arribo y pre-embarque posterior a `ACCEPTED` pertenece al dominio `SCHEDULED`; Orders consume esos substatus para seguimiento de compromisos del carrier.
- Si existe imposibilidad de cumplimiento tras aceptar, se registra `Fail After Accept` y la orden vuelve a `DISPATCH/UNASSIGNED`.

---

# PARTE II — Modelo Conceptual

## 4. El Tender

Un Tender es una **solicitud formal de compromiso** enviada a un carrier específico para un servicio concreto.

| Propiedad | Descripción |
|-----------|-------------|
| Carrier destino | Único — un tender, un carrier |
| Condiciones del servicio | Origen, destino, fecha, ventana, perfil térmico, peso |
| Fleetset sugerido | Recomendación inicial de Dispatch; no es asignación final |
| Vigencia | TTL obligatorio; sin decisión en ventana → `EXPIRED` |
| Decisión requerida | Explícita — sin decisión no hay compromiso |

> Mientras un tender no tenga decisión, no existe compromiso operativo.

Solo puede existir **un tender activo por servicio**. Si expira, cualquier acción posterior del carrier es ignorada. Si el shipper re-tenderiza, el tender previo queda cerrado. Esto evita dobles compromisos.

## 5. Política de TTL

La duración contractual del TTL es canónica en Dispatch y se consume sin reinterpretación en Orders.

| Anticipación de pickup | TTL |
|------------------------|-----|
| Mismo día o siguiente | 90 minutos |
| 2–3 días | 24 horas |
| 4–7 días | 48 horas |
| Más de 7 días | 72 horas |

El TTL corre en tiempo calendario continuo (24/7) usando el timezone de la organización.

## 6. Fleetsets — Declaración de Recursos

En ColdSync, los recursos operativos del carrier se modelan como **Fleetsets**: `Conductor + Vehículo + Remolque` (o `Conductor + Vehículo` para vehículos rígidos sin remolque).

| Regla | Detalle |
|-------|---------|
| Orders no crea ni administra Fleetsets | Solo consume los definidos en el módulo Fleet del carrier |
| Todo compromiso queda asociado a un Fleetset declarado | Carrier + Fleetset es la unidad mínima de compromiso |
| El Fleetset sugerido por Dispatch no es asignación | Es recomendación inicial; el carrier selecciona el definitivo |
| Orders muestra solo Fleetsets compatibles | Los que ya cumplen las condiciones de la orden |
| ColdSync valida compatibilidad; el carrier decide | El carrier asume responsabilidad sobre su elección |
| El Fleetset declarado es inmutable post-compromiso | Si el carrier necesita cambiarlo: `Fail After Accept` + nuevo tender |

La diferencia entre **Accept** y **Accept with Changes** es solo de experiencia de usuario: en ambos casos el compromiso se crea con un Fleetset declarado. Accept with Changes permite seleccionar un Fleetset alternativo al sugerido.

## 7. Modelo de estados del compromiso

El modelo de Orders integra decisión de compromiso en **TENDERS** y seguimiento de compromisos del carrier en **SCHEDULED** (sin cambiar el ownership operativo de `SCHEDULED`).

| Estado conceptual | Stage / Substatus | Descripción |
|-------------------|-------------------|-------------|
| No solicitado | `DISPATCH/ASSIGNED` | Orden asignada pero no enviada al carrier |
| Solicitado | `TENDERS/PENDING` | TTL activo, esperando decisión |
| Comprometido | `TENDERS/ACCEPTED` | Carrier confirmó — compromiso creado |
| Compromiso en seguimiento | `SCHEDULED/PROGRAMMED` → `SCHEDULED/DISPATCHED` → `SCHEDULED/EN_ROUTE_TO_ORIGIN` → `SCHEDULED/AT_ORIGIN` → `SCHEDULED/LOADING` | Compromiso activo del carrier en post-aceptación |
| Rechazado | `TENDERS/REJECTED` | Carrier declinó — retorna a `DISPATCH/UNASSIGNED` |
| Vencido | `TENDERS/EXPIRED` | TTL venció sin respuesta — retorna a `DISPATCH/UNASSIGNED` |
| Observado en origen | `SCHEDULED/OBSERVED` | Unidad falló checklist en planta; requiere corrección o ruptura |

> Tras `TENDERS/ACCEPTED`, la orden pasa a `SCHEDULED/PROGRAMMED`. Orders puede mostrar seguimiento del compromiso del carrier durante `SCHEDULED`, pero no redefine la gobernanza de esa etapa.
> `Observed` es un resultado operativo del dominio `SCHEDULED` (no una decisión de `TENDERS`), incluido aquí solo para completar el ciclo del compromiso.

Referencia completa: [Gestión de Estados](./state-orders.md)

---

# PARTE III — Decisiones del Carrier y Resultados Operativos

## 8. Mapa de decisiones

| Decisión | Trigger | Resultado | Crea compromiso |
|----------|---------|-----------|-----------------|
| **Accept** | Carrier confirma ejecución bajo términos recibidos | `TENDERS/ACCEPTED` | ✅ Sí |
| **Accept with Changes** | Carrier confirma con Fleetset alternativo propio | `TENDERS/ACCEPTED` | ✅ Sí |
| **Decline** | Carrier declara imposibilidad de ejecutar | `TENDERS/REJECTED` | ❌ No |
| **No Response** | TTL vence sin decisión | `TENDERS/EXPIRED` | ❌ No |
| **Fail After Accept** | Carrier declara imposibilidad después de `TENDERS/ACCEPTED`, mientras la orden está en `SCHEDULED` (`PROGRAMMED`, `DISPATCHED`, `EN_ROUTE_TO_ORIGIN`, `AT_ORIGIN`, `LOADING` u `OBSERVED` no resuelto) | Evento de ruptura + retorno a `DISPATCH/UNASSIGNED` | — |
| **Observed** (resultado operativo) | Unidad falla checklist físico en origen | `SCHEDULED/OBSERVED` | — |

## 9. Accept

El carrier confirma que ejecutará el servicio bajo los términos recibidos, seleccionando el Fleetset correspondiente.

**Resultado:** se crea un compromiso operativo.

## 10. Accept with Changes

El carrier confirma ejecución proponiendo **únicamente sustitución de recursos propios** (Fleetset: vehículo, conductor, remolque).

No se permiten cambios en: origen, destino, fecha, hora, producto, perfil térmico ni peso.

**Resultado:** se crea compromiso operativo con recursos sustituidos. No es edición de un compromiso existente — es una forma alternativa de creación.

> ColdSync no elige el Fleetset por el carrier. El sistema valida compatibilidad; el carrier decide y asume responsabilidad.

**Principio operativo de sustitución de recursos:** Orders no soporta reasignación de recursos dentro de un compromiso existente. La sustitución ocurre únicamente durante la creación del compromiso. Cualquier cambio posterior se considera ruptura.

## 11. Decline

El carrier declara imposibilidad de ejecutar con motivo tipificado.

Motivos de ejemplo: falla de equipo de frío, falta de conductor certificado, incompatibilidad sanitaria de carga previa.

**Resultado:** no existe compromiso. La orden retorna a `DISPATCH/UNASSIGNED`.

## 12. No Response (Expired)

El TTL vence sin decisión del carrier.

**Resultado:** no existe compromiso. La orden retorna a `DISPATCH/UNASSIGNED`. Toda acción posterior del carrier sobre ese tender es ignorada.

## 13. Fail After Accept

El carrier había creado compromiso pero posteriormente declara imposibilidad de cumplimiento.

- **Precondición obligatoria:** la orden ya pasó por `TENDERS/ACCEPTED`.
- **Contexto operativo:** se declara en post-aceptación cuando la orden está en `SCHEDULED` (antes de `EXECUTION`).
- **Causales válidas:** imposibilidad operativa del carrier, incluyendo `SCHEDULED/OBSERVED` no resuelto en ventana.
- Es una acción explícita del carrier registrada por el sistema.
- Genera evento auditable y base para penalidad.
- No crea substatus adicional en TENDERS.
- **Resultado:** ruptura de compromiso y retorno a `DISPATCH/UNASSIGNED` para reorquestación.

## 14. Observed (Falla física en origen)

El carrier llegó a planta bajo compromiso válido, pero la unidad falla el checklist físico.

**Resultado:** la orden pasa a `SCHEDULED/OBSERVED` como excepción operativa.

- Si la observación se corrige en ventana, continúa el flujo en `SCHEDULED/LOADING`.
- Si no se corrige en ventana, se registra ruptura vía `Fail After Accept` y retorno a `DISPATCH/UNASSIGNED`.

---

# PARTE IV — Bandeja Operativa (Carrier UX)

## 15. Bandeja principal

Orders funciona como una **bandeja de trabajo del carrier** organizada en tres tabs:

- **Pendientes:** `TENDERS/PENDING`.
- **Mis Compromisos:** `TENDERS/ACCEPTED` y estados `SCHEDULED` activos del compromiso (`PROGRAMMED`, `DISPATCHED`, `EN_ROUTE_TO_ORIGIN`, `AT_ORIGIN`, `LOADING`, `OBSERVED`), solo como vista de seguimiento del carrier.
- **Historial:** resultados sin compromiso (`TENDERS/REJECTED`, `TENDERS/EXPIRED`) y rupturas post-aceptación registradas (`Fail After Accept` / `OBSERVED` no resuelto).

### Usuarios objetivo

- Despachador del carrier
- Planner del carrier
- Coordinador de flota
- Supervisor operativo

El conductor no interactúa con Orders.

## 16. Clasificación y filtros

Las órdenes se agrupan y filtran por horizonte temporal:

| Grupo | Criterio |
|-------|----------|
| Hoy | Pickup en el día actual |
| Mañana | Pickup día siguiente |
| Próximos 2–3 días | Pickup en ese rango |
| Futuras | Pickup > 3 días |
| Expiran pronto | TTL bajo umbral de alerta |
| Vencidas | TTL expirado sin decisión |

No se crean estados nuevos para estos agrupadores; son vistas del mismo conjunto de datos.

## 17. Urgencia y prioridad

**Urgencia** — derivada del TTL restante:

| TTL restante | Urgencia |
|-------------|----------|
| ≤ 2h o vencido | Crítica |
| > 2h y ≤ 6h | Alta |
| > 6h y ≤ 24h | Media |
| > 24h | Baja |

**Prioridad** — campo derivado enviado desde Dispatch (`CRÍTICA` / `ALTA` / `MEDIA` / `BAJA`). Orders muestra este valor; no redefine su cálculo.

## 18. Ordenamiento determinístico

Para la bandeja de pendientes de Orders (`TENDERS/PENDING`), ordenamiento alineado a Dispatch:

1. Urgencia TTL
2. `priority_effective` desc
3. Menor holgura temporal (`response_deadline − now`) asc
4. `planned_start_at` asc
5. `created_at` asc (FIFO)

Para `Mis Compromisos`, el orden recomendado prioriza riesgo operativo en `SCHEDULED`:

1. `OBSERVED` primero
2. Menor holgura temporal al hito comprometido (`ETA at Origen` / `planned_start_at`)
3. `planned_start_at` asc
4. `created_at` asc (FIFO)

## 19. Acciones masivas

| Acción | Condición |
|--------|-----------|
| Decline múltiple | Permitida |
| Accept múltiple | Solo si cada orden tiene Fleetset declarado explícitamente |
| Accept with Changes masivo | No recomendado |

---

# PARTE V — Gobernanza y Principio Rector

## 20. Inmutabilidad e integridad del compromiso

Una vez creado el compromiso:

- No se edita ni reemplaza silenciosamente.
- El Fleetset declarado no puede cambiarse dentro del compromiso vigente.
- Toda modificación requiere ruptura explícita (`Fail After Accept`) y emisión de nuevo tender.

Esto preserva trazabilidad, auditoría y métricas reales de cumplimiento.

## 21. Gobernanza y trazabilidad

- **Fuente de verdad:** `stage + substatus`
- **Una sola máquina de estados** transiciona; no hay cambios paralelos
- **Toda decisión** se registra con actor, trigger, motivo y timestamp
- `Fail After Accept` y `Observed` son eventos auditables con base para penalidad contractual

## 22. Principio rector

ColdSync Orders optimiza **certeza operativa**, no eficiencia de ruta ni costo.

> **Intención → Tender → Decisión → Compromiso → (Transferido a `SCHEDULED/PROGRAMMED` | Roto | Terminado sin compromiso)**

La confiabilidad contractual de ejecución es el único output del módulo.

---

## Referencias

- [ColdSync Dispatch](./dispatch.md)
- [Gestión de Estados](./state-orders.md)
- [ColdSync Matching](./matching-orders.md)

---

**Última actualización:** Febrero 2026
