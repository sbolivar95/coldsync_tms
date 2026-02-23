# 🚛 Gestión de Activos y Flota Dedicada (Fleet)

Este documento describe las reglas de negocio para la gestión de la flota (propia o dedicada) que opera los carriles de **Line Haul** en ColdSync TMS.

## 1. Entidades Principales

### 1.1 Recursos de Flota
Los recursos base que componen la flota son:

*   **Vehículos (Vehicles):** Unidades tractores o rígidos.
    *   Tipos: `TRACTOR`, `RIGID`, `VAN`.
    *   Identificador principal: Placa (`plate`) y Código de Unidad (`unit_code`).
*   **Conductores (Drivers):** Personal habilitado para conducir.
    *   Vinculados a un Transportista (`Carrier`).
*   **Remolques (Trailers):** Unidades de carga no motorizadas.
    *   Tipos: `Reefer`, `Dry`, etc.
    *   Cuentan con especificaciones de refrigeración (Multi-zona/Single-zona).

### 1.2 Asignaciones (Fleet Sets)
La entidad `fleet_sets` representa la configuración activa de recursos en un momento dado.
Un `FleetSet` vincula:
*   **1 Vehículo** (Obligatorio).
*   **0..1 Conductor** (Opcional - *Spotting*).
*   **0..1 Remolque** (Opcional - *Bobtail*).

---

## 2. Reglas de Negocio de Asignación

### 2.1 Unicidad de Recursos Activos
El sistema garantiza físicamente (vía índices únicos parciales en BD) que un recurso no puede estar en dos asignaciones activas simultáneamente.

*   **Regla:** Un `driver_id` solo puede aparecer una vez en `fleet_sets` donde `is_active = true`.
*   **Regla:** Un `trailer_id` solo puede aparecer una vez en `fleet_sets` donde `is_active = true`.
*   **Regla:** Un `vehicle_id` solo puede aparecer una vez en `fleet_sets` donde `is_active = true`.

### 2.2 Driver Optional (Spotting)
Es válido crear una asignación activa sin conductor.
*   **Semántica:** El vehículo está disponible operativa/técnicamente, o siendo movido en patio (Spotting), pero no tiene un viaje asignado a un conductor específico.
*   **Implementación:** Columna `driver_id` es `NULLABLE`.

### 2.3 Compatibilidad Vehículo-Remolque (Regla Explícita)
La asignación de remolque depende estrictamente del tipo de vehículo.

*   **Regla principal:** Solo un vehículo `TRACTOR` puede tener `trailer_id`.
*   **Regla derivada:** Si `vehicle_type != TRACTOR` (`RIGID` o `VAN`, etc), entonces `trailer_id` debe ser `NULL`.
*   **Semántica operativa:** `RIGID` y `VAN` y cualquier otro tipo de vehículo operan siempre sin remolque.

### 2.4 Drop & Hook y "Robo" de Recursos
El sistema implementa lógica automática de resolución de conflictos conocida como "Steal Logic".

*   **Escenario A (Reasignación Simple):** Si asigno al Conductor A (que estaba en V1) al Vehículo V2:
    1.  Se cierra la asignación de V1 (o se actualiza V1 a "Sin Conductor").
    2.  Se crea/actualiza la asignación de V2 con Conductor A.
*   **Escenario B (Drop & Hook):** Si asigno el Remolque R1 (que estaba en V1) al Vehículo V2:
    1.  V1 libera R1 y queda en estado *Bobtail* (Solo tracto + Conductor).
    2.  V2 engancha R1.
*   **Confirmación:** Estas operaciones requieren confirmación explícita del usuario en la UI (`AssignmentConflictDialog`), informando las consecuencias.

### 2.5 Estados Derivados
*   **Spotting:** Vehículo Activo sin Conductor (En UI: "Sin Conductor").
*   **Bobtail:** Vehículo TRACTOR Activo con Conductor pero sin Remolque.
    *   *Nota:* Aunque "Bobtail" es el término estándar de industria (proveniente del perro sin cola), en la **Interfaz de Usuario (UI)** se debe utilizar **"Sin Remolque"** para facilitar la comprensión del usuario hispanohablante.
*   **Full:** Vehículo TRACTOR Activo con Conductor y Remolque.

### 2.6 Glosario Operativo
*   **Bobtail (operación) = "Sin Remolque" (UI):** ambos términos representan exactamente el estado `TRACTOR` con `trailer_id = NULL`.

---

## 3. Matriz de Validaciones

| Recurso | Estado Actual | Acción | Resultado/Confirmación |
| :--- | :--- | :--- | :--- |
| Conductor | Libre | Asignar a V1 | ✅ Permitido directo. |
| Conductor | En V2 | Asignar a V1 | ⚠️ Confirmar: "Conductor será movido de V2 a V1. V2 quedará en Spotting". |
| Remolque | Libre | Asignar a V1 | ✅ Permitido directo. |
| Remolque | En V2 | Asignar a V1 | ⚠️ Confirmar: "Remolque será movido de V2 a V1. V2 quedará en Bobtail". |
| Vehículo | Spotting | Asignar Cond. | ✅ Actualiza el set existente. |
| Vehículo `RIGID`/`VAN` | Sin remolque | Asignar Remolque | ❌ No permitido por regla de compatibilidad de tipo. |

---

## 4. Implementación Técnica
Ver `src/services/database/fleetSets.service.ts` para la lógica de transacción y validación (`validateFleetSet`).
Ver `docs/requirements/fleetsets-requirements.md` para el historial de implementación detallado.
