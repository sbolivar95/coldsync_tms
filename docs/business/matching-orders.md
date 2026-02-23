# 🎯 ColdSync Matching

## Capa de Decisión de Factibilidad y Selección de Capacidad

---

## 1. Naturaleza del Sistema

### 1.1 Qué es ColdSync Matching

ColdSync Matching es la capa conceptual que decide si una orden puede ser atendida por un fleetsets y, entre candidatos factibles, cuál es la mejor opción operativa.

Su función en line haul contractual de cadena de frío es:

- Proteger factibilidad técnica y temporal
- Evitar asignaciones inviables o superpuestas
- Priorizar continuidad operacional con trazabilidad

Resultado esperado:

> Toda asignación en `DISPATCH/ASSIGNED` debe ser física, térmica y temporalmente viable.

---

### 1.2 Qué problema resuelve

Sin matching gobernado, el sistema cae en:

- Sobreasignación de unidades
- Incumplimiento de cita por ETA inviable
- Violación de ciclo de servicio (RTA)
- Asignaciones válidas en papel pero inviables en operación

Matching corrige eso con un pipeline de decisión determinístico.

---

### 1.3 Qué NO es ColdSync Matching

Matching no es:

- Un módulo de ejecución en ruta
- Un módulo de negociación comercial
- Un motor de conciliación financiera
- Un optimizador "caja negra" sin explicabilidad

Matching recomienda y bloquea cuando corresponde; la decisión final del planner debe quedar auditada.

---

## 2. Relación Conceptual con Dispatch y Orders

### 2.1 En Dispatch

Matching opera en fase de planificación para producir una asignación tentativa:

- `DISPATCH/NEW|UNASSIGNED -> DISPATCH/ASSIGNED`

Regla de frontera:

- `DISPATCH/ASSIGNED` representa borrador interno de capacidad (pre-tender).
- El envío formal al carrier (`TENDERS/PENDING`) ocurre en Dispatch tras validación explícita del planner.

Si no hay candidato viable:

- la orden permanece en `DISPATCH/UNASSIGNED` con causa estructurada.

### 2.2 En Orders

Matching no reemplaza la decisión del carrier.  
Orders decide compromiso en `TENDERS`.

### 2.3 En SCHEDULED

Matching no gobierna ejecución, pero debe respetar factibilidad de arribo a origen y ventanas de cita para no transferir riesgo estructural.

---

## 3. Modelo de Decisión del Matching

Matching se ejecuta en seis pasos obligatorios:

1. **Elegibilidad de datos** (input mínimo válido)
2. **Factibilidad dura** (hard constraints)
3. **Factibilidad temporal** (RTA + ETA + ventana)
4. **Detección de conflictos** (solapamientos)
5. **Reglas contractuales de capacidad (allocation/cupos)**
6. **Ranking y selección** (soft constraints)

Salida del motor:

- Candidatos factibles ordenados por score.
- Reason codes de aceptación/rechazo por candidato.
- Propuesta para revisión del planner en Dispatch.

Si cualquier paso obligatorio falla:

- No hay match.
- Se registra motivo.
- La orden se mantiene/retorna a `DISPATCH/UNASSIGNED`.

---

## 4. Contrato mínimo de entrada

Una orden solo entra a matching si tiene:

- Lane válido y activo
- Fecha/hora de servicio y ventana
- Carga definida (`STANDARD` o `HIBRIDA`)
- Peso operativo
- Perfil térmico requerido (uno o múltiples)

Y una unidad candidata debe exponer:

- Fleetset operativo (conductor + vehículo + remolque cuando aplique)
- Capacidad de carga
- Capacidades térmicas
- Compartimentos/multi-zona
- Disponibilidad temporal real

---

## 4.1 Tipos de vehículos soportados

El matching contempla tres tipologías operativas de flota:

### TRACTOR (articulado)

- Requiere remolque para transporte de carga.
- La capacidad de transporte se valida principalmente sobre el remolque.
- La capacidad térmica se valida sobre el reefer asociado al remolque.

### RIGID (rígido)

- Vehículo con caja integrada.
- La capacidad de transporte se valida sobre el vehículo.
- La capacidad térmica se valida sobre el reefer asociado al vehículo.

### VAN (furgoneta)

- Misma lógica de validación que RIGID, en menor escala operativa.
- Capacidad y validación térmica se resuelven sobre el vehículo.

Principio:

> El tipo de vehículo define dónde se valida capacidad/térmico, pero no cambia las reglas rectoras de factibilidad.

---

## 5. Hard Constraints (bloqueantes)

La asignación se bloquea si falla cualquiera de:

1. Estado operativo del activo no habilitado
2. Peso total > capacidad disponible
3. Reefer no cubre envelope térmico requerido
4. Orden híbrida sin compatibilidad de zonas/compartimentos
5. Fecha/hora objetivo en pasado
6. Unidad en ciclo de servicio no disponible (RTA)
7. Imposibilidad matemática de llegar a origen dentro de cita

Regla:

> Hard constraints no se sobreescriben manualmente.

### 5.1 Regla de peso en capacidad contratada

En operación line haul contractual, el peso se valida contra capacidad contratada del fleetset.

- Si la orden define `X tn`, el matching debe buscar capacidad equivalente a `X tn` según política contractual.
- No basta con que la unidad "pueda cargar más"; la sobrecapacidad no se asume válida por defecto.

### 5.2 Regla de peso para órdenes multi-zona

En camiones multi-zona, la carga se distribuye por compartimentos para cumplir perfiles térmicos distintos.

Sin embargo, para matching de peso:

- la validación se realiza sobre el **peso total de la orden**,
- contra la **capacidad total de transporte del fleetset**.

La partición térmica por zona no reemplaza la validación de peso total; la complementa.

### 5.3 Bloqueo temporal de activos (castigo operativo)

En operación real, una unidad puede quedar temporalmente no elegible por riesgo operativo o incumplimiento.

Principios:

- El bloqueo temporal convierte al activo en **no elegible para matching**.
- El bloqueo debe ser explícito, tipificado y con vigencia definida.

Datos mínimos del bloqueo:

- `block_reason_code` (causa estructurada)
- `blocked_from`
- `blocked_until` o condición de liberación
- `blocked_by`
- `evidence_ref` (cuando aplique)

Ciclo de liberación:

1. Corrección de causa raíz
2. Validación/reinspección cuando corresponda
3. Aprobación de liberación por rol autorizado

Reason code de matching:

- `NO_MATCH_ASSET_BLOCKED`

Regla:

> Un activo bloqueado no puede recibir nuevas asignaciones hasta su liberación formal.

---

## 6. Factibilidad temporal (RTA + ETA)

Este punto es obligatorio en matching moderno.

Matching debe validar simultáneamente:

- `RTA`: cuándo la unidad vuelve a estar disponible
- `ETA a origen`: cuándo puede llegar a cargar
- `Ventana/cita`: cuándo debe presentarse

Bloqueo temporal:

- Si `ETA a origen` cae fuera de ventana tolerada, no hay match.
- Si la unidad sigue bloqueada por RTA, no hay match.

---

## 7. Detección de conflictos (no-overlap)

La unidad no puede tener dos compromisos superpuestos.

Reglas:

- Validar conflicto por intervalos reales (timestamp), no solo por día.
- Incluir duración operativa + retorno a disponibilidad.
- Rechazar cualquier asignación con overlap.

---

## 8. Política para STANDARD vs HIBRIDA

### 8.1 STANDARD

- Un perfil térmico principal
- Validación simple de capacidad + rango térmico

### 8.2 HIBRIDA

- Múltiples perfiles térmicos
- Validación por incompatibilidad térmica entre cargas
- Requisito explícito de multi-zona y compartimentos suficientes cuando no hay intersección térmica válida

Regla operativa obligatoria:

- Si la orden requiere zonas térmicas incompatibles, el activo debe cumplir simultáneamente:
  - `supports_multi_zone = true`
  - `compartments >= required_compartments`

Donde `required_compartments` representa la necesidad real de compartimientos de la orden.

Política 1:1 de compartimientos:

- Si la orden requiere 3 compartimientos, un activo con 2 no puede matchear.
- Si la orden requiere 2 compartimientos, un activo con 2 sí puede matchear (si cumple térmico/peso/tiempo).

### 8.3 Uso de unidad híbrida con orden de perfil único

Una unidad multi-zona/híbrida **sí puede** atender una orden con un solo perfil térmico.

Regla:

- El hecho de ser híbrida no restringe su uso a órdenes híbridas.
- Debe cumplir los mismos hard constraints de cualquier orden estándar:
  - perfil térmico soportado por reefer,
  - capacidad de peso,
  - factibilidad temporal.

Principio:

> Multi-zona amplía capacidad operativa; no limita elegibilidad para cargas de perfil único.

No usar número de productos como único proxy de compartimentos; se debe usar criterio térmico-zonal real.

---

## 9. Ranking y selección (soft constraints)

Entre candidatos factibles, matching debe priorizar por objetivo operativo.

Objetivo recomendado:

1. Menor riesgo temporal de incumplimiento
2. Mayor afinidad técnica con requerimiento de carga
3. Cumplimiento de reglas de cupo/allocación por carrier y lane
4. Menor costo operativo incremental
5. Menor impacto negativo en capacidad futura crítica

Desempate:

1. Menor riesgo de tardanza
2. Mejor ajuste térmico/capacidad
3. Mejor posición respecto a cupo contractual
4. Menor costo incremental

---

## 9.1 Allocation Rules y cupos (contractual constraints)

El matching debe respetar reglas de asignación contractual (`carrier_allocation_rules`) por carrier, lane y ventana temporal.

Tipos de regla recomendados:

- **Cupo máximo (hard cap):** no se puede asignar por encima del límite.
- **Cupo objetivo (target):** se puede exceder, pero con penalización de score y trazabilidad.
- **Cupo mínimo comprometido:** prioriza carriers con déficit de asignación para cerrar compromiso contractual.

Comportamiento operativo:

1. Validar cupo vigente antes de asignar.
2. Si viola hard cap -> `NO_MATCH_ALLOCATION_CAP`.
3. Si no viola hard cap pero rompe target -> permitir con penalización y motivo explícito.
4. Registrar impacto de asignación en métricas de cuota en tiempo real.

Principio:

> El matching no solo optimiza factibilidad técnica; también ejecuta disciplina contractual de capacidad.

---

## 9.2 Balance de cupos y recuperación por causa

En line haul contractual, la gestión de cupos debe distinguir explícitamente la causa de desbalance:

- cancelación por shipper
- rechazo/expiración por carrier
- ruptura post-aceptación por carrier (`Fail After Accept`)

### A. Cancelación por shipper (crédito de recuperación)

Cuando el shipper cancela una orden ya asignada al cupo de un carrier:

- el cupo no se considera incumplimiento del carrier,
- se registra como **crédito de recuperación a favor del carrier** (`shipper_cancel_credit`),
- el sistema debe intentar recuperar ese cupo en la misma semana operativa,
- si no se logra, se arrastra a la semana siguiente con prioridad alta de asignación.

### B. Rechazo/expiración por carrier (pérdida de cupo por carrier)

Cuando el carrier rechaza (`TENDERS/REJECTED`) o deja vencer (`TENDERS/EXPIRED`):

- el cupo se registra como **pérdida atribuible al carrier** (`carrier_breach_loss`),
- ese cupo no genera crédito de recuperación para el carrier,
- el sistema puede aplicar degradación de prioridad o regla contractual de penalidad.

### C. Fail After Accept (incumplimiento agravado)

Si el carrier rompe compromiso después de aceptar:

- se registra como incumplimiento agravado,
- el cupo se considera pérdida del carrier,
- se habilita impacto contractual reforzado (penalidad/menor prioridad futura).

### D. Política de priorización de recuperación

El motor de matching debe considerar en ranking:

1. recuperación de `shipper_cancel_credit` dentro de la semana,
2. recuperación arrastrada de semana previa,
3. cumplimiento de cuota mínima vigente,
4. menor prioridad para carriers con `carrier_breach_loss` recurrente.

### E. Ledger mínimo de cupos (conceptual)

Por carrier + lane + semana:

- `assigned_quota_units`
- `shipper_cancel_credit`
- `carrier_breach_loss`
- `recovered_quota_units`
- `net_quota_compliance`

Nota:

- `quota_units` debe modelarse en la unidad contractual real de la operación (por ejemplo: viajes/slots), no necesariamente en volumen físico.

Principio:

> La disciplina de cupos no se evalúa solo por asignación bruta, sino por cumplimiento neto ajustado por causa de desbalance.

---

## 10. Resultado explicable (reason codes)

Toda decisión de matching debe emitir razones estructuradas:

- `MATCH_SUCCESS`
- `NO_MATCH_CAPACITY`
- `NO_MATCH_THERMAL`
- `NO_MATCH_MULTI_ZONE`
- `NO_MATCH_RTA`
- `NO_MATCH_ETA_WINDOW`
- `NO_MATCH_OVERLAP`
- `NO_MATCH_ALLOCATION_CAP`
- `NO_MATCH_ASSET_BLOCKED`
- `NO_MATCH_DATA_INCOMPLETE`

Esto es obligatorio para auditoría y mejora continua.

---

## 11. Concurrencia, consistencia e idempotencia

Para evitar asignaciones corruptas:

- La confirmación de asignación debe ser transaccional
- El sistema debe validar nuevamente antes de commit
- Reintentos deben ser idempotentes
- No se permite doble commit sobre misma unidad/ventana

---

## 12. Gestión de excepciones del Matching

Cuando no hay match:

1. Orden permanece en `DISPATCH/UNASSIGNED`
2. Se registra motivo estructurado
3. Se dispara decisión operativa:
   - reintentar matching (incluyendo ajuste de criterio/candidato)
   - reprogramar cita
   - cancelar según política

Regla de gobierno:

- El motor puede sugerir re-matching, pero no ejecutar reasignación silenciosa sin decisión explícita del planner.

### 12.1 Mejores prácticas recomendadas (No-Match)

Para mantener operación simple y controlada, un `No-Match` se resuelve con decisión explícita del planner:

1. **Causa obligatoria**
- Persistir `reason_code` estructurado del `No-Match`.

2. **Decisión operativa explícita**
- El planner decide una sola acción:
  - reintentar matching,
  - reprogramar cita,
  - cancelar orden según política.

3. **Cancelación con motivo estructurado**
- Si decide cancelar, debe registrar:
  - `cancel_reason_code`,
  - actor,
  - timestamp,
  - comentario operativo.

4. **Trazabilidad mínima**
- Registrar la decisión final y su resultado para auditoría.

Principio:

> No-Match no es fin de flujo; es un estado gestionado de recuperación operacional.

---

## 13. Métricas clave del motor

- `% órdenes con match en primer intento`
- `% no-match por tipo de causa`
- `% asignaciones revertidas por conflicto temporal`
- `% fallas post-aceptación atribuibles a match débil`
- `lead time de resolución de no-match`

---

## 14. Principio Rector

ColdSync Matching para line haul frío dedicado no debe priorizar “llenar por llenar”, sino:

- Factibilidad real
- Cumplimiento de cita
- Integridad térmica
- Eficiencia contractual de capacidad (evitar transporte de aire fuera de política)
- Explicabilidad de decisión

---

## 15. Referencias

- [ColdSync Dispatch](./dispatch.md)
- [ColdSync Orders](./orders.md)
- [Gestión de Estados](./state-orders.md)

---

**Última actualización:** Febrero 2026
