# 📡 ColdSync Real-Time
## Capa de Visibilidad Operativa en Vivo (Control Tower)

---

# PARTE I — Contexto y Propósito

## 1. Qué es ColdSync Real-Time

ColdSync Real-Time es la capa de Control Tower que entrega **visibilidad operativa en vivo** de las unidades de flota en la red Line Haul.

Su propósito es responder, en cada momento:

> dónde está la unidad, cómo está su conectividad, cuál es su condición de movimiento y cuál es su estado térmico actual.

No reemplaza planeación ni compromiso contractual; provee la verdad operativa del momento para toma de decisiones.

Nota de propósito:
- En Real-Time, la temperatura se usa principalmente para **observabilidad operativa de la unidad** (lectura de sensores, consistencia del dato y estado del equipo).
- La evaluación de cumplimiento térmico del viaje (normal/warning/critical, desvío, excursión SLA) pertenece al contexto de `Execution`, no al objetivo principal de esta capa.
- Este módulo se diseña para seguimiento 24/7 de flota completa, siguiendo prácticas modernas de telemática para operación ágil por shipper y carrier.

## 2. Qué NO es Real-Time

- No es el módulo de planificación (`DISPATCH`).
- No es el módulo de compromiso del carrier (`ORDERS`).
- No es conciliación financiera.
- No es un rediseño de semántica visual.
- No es un motor de alertas avanzado dentro de este alcance.

## 3. Relación con el resto del flujo

- `Dispatch` y `Orders` gobiernan intención y compromiso.
- `Real-Time` gobierna la **lectura operativa en vivo** de la unidad a nivel flota completa (con o sin viaje activo).
- El dominio de `Execution` existe en la UI como contexto separado para órdenes en ejecución (p. ej. tab `En Ejecución`), pero este documento se enfoca únicamente en la capa realtime.

---

# PARTE II — Modelo Operativo Real-Time (As-Is)

## 4. Unidad operativa de visualización

La unidad operativa en Control Tower Real-Time es el **fleet set activo**:
- `is_active = true`
- `ends_at is null`

Sobre esa unidad operativa se proyecta el estado en vivo para lista, mapa y drawer.

## 5. Fuente de datos vigente

La implementación actual consume estado live desde Supabase:
- capa de estado por dispositivo (`ct_unit_live_state`)
- proyección operativa por fleet set (`ct_fleetset_live`)
- actualización en vivo vía `Supabase Realtime`

Principio de documentación:
- este documento no replica DDL ni catálogo completo de columnas; ese detalle vive en migraciones y DB.

## 6. Estado operativo canónico

El modelo actual separa explícitamente tres dimensiones:

1. `Conectividad`: `ONLINE | STALE | OFFLINE`
2. `Movimiento`: `DRIVING | IDLE | STOPPED` (proyectado en UI)
3. `Temperatura`: telemetría de observabilidad de equipo (disponibilidad de lectura, consistencia y error de sensor)

Regla clave:
- conectividad y temperatura son dimensiones distintas.
- `STALE/OFFLINE` **no** define por sí mismo estado térmico.
- En Real-Time no se interpreta temperatura como “excursión de viaje”; se interpreta como señal de condición del activo/sensores.
- En Real-Time no se clasifica temperatura en `normal/warning/critical` para decisiones operativas de viaje.
- En `MULTI/HYB`, la visualización térmica es estricta por canal (`Temp 1 | Temp 2`), sin replicar ni cruzar valores entre canales.
- Cuando un canal no trae lectura válida o reporta error, se muestra `Sin dato/Error` para ese canal.
- Valores físicamente inválidos (outliers, p. ej. fuera de rango duro) se tratan como `Sin dato/Error` en la vista realtime.

## 7. Freshness y last known position

Reglas operativas implementadas:
- umbrales de señal:
  - `ONLINE`: `<= 120s`
  - `STALE`: `121..900s`
  - `OFFLINE`: `> 900s`
- la unidad no desaparece por falta de señal reciente.
- se conserva **last known position** para continuidad operativa.

---

# PARTE III — Experiencia de Usuario Actual (As-Is)

## 8. Vista principal

Control Tower muestra:
- panel de lista de unidades
- mapa en tiempo real
- drawer de detalle de unidad seleccionada

En la página existen tabs de operación general. Para Real-Time, el comportamiento base de tracking corresponde al **universo completo de unidades visibles en vivo**:
- con viajes activos
- sin viajes activos
- con viajes finalizados previamente

Objetivo operativo: continuidad de visibilidad de flota 24/7, no solo de órdenes en ejecución.

## 9. Lista de unidades

La tarjeta de unidad muestra, con datos actuales:
- identificador de unidad/remolque
- conductor
- ubicación
- estado de movilidad/conectividad
- velocidad
- temperatura
- última señal

Búsqueda actual:
- unidad
- remolque
- conductor
- ubicación
- transportista

## 10. Mapa y marcador

Semántica vigente del marcador:
- `MobilityIndicator` como estándar visual de movimiento/conectividad.
- condición sin señal o señal no vigente representada en escala neutral.
- temperatura mostrada como telemetría del activo para verificar disponibilidad de lectura/sensor.
- en realtime el marcador no muestra punto térmico de rango (`normal/warning/critical`).
- cuando un canal entra en error, se muestra ícono de error en ese canal.
- cuando no hay lectura válida del canal esperado, la UI muestra `--` y estado de error de canal.
- el color térmico en marker realtime usa semántica técnica: neutral con señal no vigente (`STALE/OFFLINE/sin mensaje`) y color primario con señal vigente.
- la semántica contractual de excursión (normal/warning/critical por rango de viaje), incluido el punto térmico de rango, pertenece a `Execution`.

Interpretación de la capa térmica en Real-Time:
- Es una lectura operativa del activo (sensor/equipo) para monitoreo en vivo.
- No constituye por sí sola una clasificación de incumplimiento térmico contractual del viaje.
- La semántica `normal/warning/critical` se reserva para `Execution` cuando existe contexto de viaje/carga.

## 11. Drawer y consistencia transversal

Regla obligatoria de producto:
- lista, mapa y drawer deben proyectar el **mismo modelo de estado**.
- no se permiten términos distintos para el mismo estado entre vistas.
- no se permite reinterpretar conectividad/movimiento/temperatura por componente.

Campos operativos mostrados en tab `Estado`:
- Conectividad
- Última señal
- Movimiento
- Ignición
- Temperatura

### 11.1 Tabs del drawer en modo Real-Time (as-is actual)

Tabs visibles hoy en implementación:
- `Estado`
- `Info`
- `Reefer` (solo si `has_can = true`)

Regla aplicada:
- tabs orientados a ejecución (`General`, `Temperatura`, `Gráficos`) no forman parte del drawer realtime.

---

# PARTE IV — Reglas de Negocio Realtime Vigentes

## 12. Reglas activas

- El estándar visual base es `MobilityIndicator`.
- La capa térmica en Real-Time expresa disponibilidad/calidad de lectura de sensor; no reemplaza movilidad.
- `STALE/OFFLINE` se trata como conectividad, no como estado térmico.
- En esta capa no se calcula ni se comunica “desvío térmico de viaje” como outcome operativo.
- En esta capa no se usa `normal/warning/critical` como clasificación operacional de temperatura.
- En esta capa, la temperatura no se interpreta como cumplimiento térmico de viaje (rango objetivo, warning o excursión).
- La semántica de punto térmico para rango (`normal/warning/excursión`) queda reservada a `Execution`.
- Sin mensaje conocido, la UI muestra estado “sin datos” donde corresponda.
- Si el dispositivo no tiene CAN, la experiencia reefer se limita según capacidad disponible.
- La ingesta realtime preserva `last known good` cuando llegan mensajes parciales (no sobrescribe campos faltantes con `null`).
- Regla de canal actual: en `MULTI`, cada canal se evalúa por separado; si trae valor válido se muestra, y si no trae valor válido se muestra `--` con error en ese canal.

## 13. Alcance explícito de esta versión

Incluido:
- lectura en vivo por fleet set activo con visibilidad transversal de flota (con o sin viaje)
- actualización por realtime
- consistencia semántica entre lista/mapa/drawer
- semántica térmica vigente en marcador
- documentación `as-is` de tabs visibles hoy en drawer realtime (`Estado`, `Info`, `Reefer` condicional)

Fuera de alcance en este documento:
- diseño funcional de Execution
- health scoring avanzado de flota como nueva semántica obligatoria
- rediseño de la UI actual
- implementación de semántica de excursión térmica operacional en realtime

---

# PARTE V — Gobierno Documental

## 14. Fuente de verdad técnica

Para detalle técnico usar:
- migraciones de Supabase
- objetos existentes en DB
- servicios implementados en `src/services/database/controlTowerRealtime.service.ts`
- hooks y componentes de `src/features/control_tower/*`

Este documento debe mantenerse como **especificación conceptual as-is** del comportamiento real de Real-Time.

---

# PARTE VI — Referencias

- [Dispatch](./dispatch.md)
- [Orders](./orders.md)
- [Gestión de Estados](./state-orders.md)
- [Control Tower (visión general previa)](./control-tower.md)
