# 🔍 Auditoría de Integración: Nuevo Sistema de Estados ColdSync TMS

Este documento presenta un análisis crítico y conceptual sobre la integración del sistema de estados basado en **Stage** (Etapa) y **Substatus** (Subestado) en la plataforma ColdSync. Este modelo busca unificar el lenguaje operativo entre los módulos de Dispatch, Orders, Control Tower y Conciliación bajo un estándar de industria adaptado a la realidad de LATAM.

---

## 1. Auditoría del Modelo de Datos (Supabase)

Tras revisar el esquema actual (`schema.sql`) y la implementación de tipos (`database.types.ts`), se identifican los siguientes puntos críticos:

### 1.1 Coexistencia de Atributos (Legacy vs. New)
Actualmente, la tabla `dispatch_orders` mantiene la columna `status` (legacy) junto con `stage` y `substatus` (new). 
*   **Diagnóstico:** Existe un riesgo de fragmentación de la verdad si no se implementa una lógica de sincronización bidireccional estricta o un plan de "deprecación" total del campo `status`.
*   **Recomendación:** La máquina de estados debe ser el único motor que actualice ambos campos en una sola transacción para evitar que el Gantt (Dispatch) y la Tabla de Órdenes (Orders) muestren realidades distintas.

### 1.2 Registro de Historia y Trazabilidad
La tabla `dispatch_order_state_history` es la pieza fundamental para la auditoría de SLAs.
*   **Fortaleza:** Permite capturar no solo el cambio de estado, sino el `trigger_type` (USER, SYSTEM, GPS), lo cual es vital para distinguir una llegada detectada por geocerca de una confirmación manual.

---

## 2. Análisis por Módulo Operativo

### 2.1 Dispatch (Módulo de Planificación)
El módulo de Dispatch "gobierna" la intención de viaje y gestiona la etapa `DISPATCH`.

*   **Subestados de Dispatch:**
    *   `NEW`: Orden recién creada, sin historial previo
    *   `UNASSIGNED`: Orden con historial que regresó al pool (rechazada, vencida, observada)
    *   `ASSIGNED`: Planificador asignó carrier/fleetset (borrador interno, carrier no lo ve aún)

*   **Flujo de Retorno:** Las órdenes que fallan en etapas posteriores regresan automáticamente a `DISPATCH/UNASSIGNED`:
    *   `TENDERS/REJECTED` → `DISPATCH/UNASSIGNED`
    *   `TENDERS/EXPIRED` → `DISPATCH/UNASSIGNED`
    *   `SCHEDULED/OBSERVED` → `DISPATCH/UNASSIGNED` (cuando no se puede resolver)
    
*   **Transición a Orders:** Solo desde `DISPATCH/ASSIGNED` se puede enviar al carrier (`TENDERS/PENDING`).

### 2.2 Orders (Compromiso del Carrier e Interacción Híbrida)
Este módulo es el guardián de la etapa `TENDERS`. El proceso de negocio es único, pero su interacción es **omnicanal**.

*   **Flujo Core Intacto:** El paso de la intención (Dispatch) al compromiso (Orders) se mantiene bajo la misma lógica de negocio: `DISPATCH/ASSIGNED` → `TENDERS/PENDING` → `TENDERS/ACCEPTED` → `SCHEDULED/PROGRAMMED`. 
*   **WhatsApp como Canal Alternativo:** Para maximizar la adopción, se habilita WhatsApp como canal adicional de interacción con Orders. El transportista puede gestionar tenders vía:
    *   **Portal Web:** Interfaz completa de Orders (bandeja de tenders, acciones, historial)
    *   **WhatsApp:** Formularios automatizados que replican las mismas acciones (Accept, Accept with Changes, Decline)
    *   **Mismo Flujo de Negocio:** Ambos canales alimentan el módulo Orders. Las decisiones tomadas vía WhatsApp ejecutan las mismas transiciones de estado (`TENDERS/PENDING` → `TENDERS/ACCEPTED/REJECTED`) y registran eventos en `dispatch_order_state_history` de forma idéntica al portal web.
    *   **Inmutabilidad Preservada:** Una vez aceptado el tender (`TENDERS/ACCEPTED`), los parámetros del servicio y el Fleetset declarado son inmutables, sin importar el canal usado para la confirmación.

### 2.3 Control Tower (Módulo de Ejecución y Monitoreo)
Este módulo gestiona dos etapas críticas: `SCHEDULED` (pre-embarque) y `EXECUTION` (en ruta).

#### Etapa SCHEDULED (Pre-embarque y Carga)
*   **Subestados:**
    *   `PROGRAMMED`: Orden confirmada, en espera hasta la fecha de salida
    *   `DISPATCHED`: Ticket emitido al conductor, unidad en tránsito al origen
    *   `AT_ORIGIN`: Unidad llegó al punto de carga (geocerca)
    *   `LOADING`: Checklist aprobado, carga en proceso
    *   `OBSERVED`: Fallo en checklist pre-embarque

*   **ETA Predictivo (IoT):** El sistema calcula automáticamente el ETA al punto de carga mediante integración con Flespi/GPS, abandonando la dependencia del reporte manual del chofer.
*   **Alertas de Riesgo:** Si el cálculo (Posición GPS + Velocidad → Origen) indica un retraso, la Torre de Control levanta una alerta proactiva para el Planner.

#### Etapa EXECUTION (En Ruta)
*   **Subestados:**
    *   `IN_TRANSIT`: Carga sellada, unidad en ruta
    *   `AT_DESTINATION`: Unidad llegó al punto de entrega (geocerca)
    *   `DELIVERED`: Entrega completada con POD (Proof of Delivery)

*   **Monitoreo Continuo:** GPS, temperatura, alertas automáticas (sin cambiar substatus, son eventos superpuestos)

### 2.4 Reconciliation (Módulo Financiero)
Este módulo gestiona la etapa final `CONCILIATION` con auditoría y liquidación.

*   **Subestados:**
    *   `PENDING_AUDIT`: Entrega confirmada, auditoría automática en curso
    *   `UNDER_REVIEW`: Discrepancias encontradas, revisión humana necesaria
    *   `DISPUTED`: Disputa abierta, carrier presenta descargos
    *   `APPROVED`: Auditoría aprobada o disputa resuelta — listo para facturar
    *   `CLOSED`: Factura generada, ciclo de pago cerrado

*   **Trigger de Auditoría:** El paso de `EXECUTION/DELIVERED` a `CONCILIATION/PENDING_AUDIT` es automático y dispara el motor de auditoría de SLAs (puntualidad e integridad térmica).

---

## 3. El Stage SCHEDULED: De la Reactividad a la Predicción

`SCHEDULED` no es un espacio para la negociación de fechas, sino la fase de aseguramiento de la llegada.

### A. Inmutabilidad del Servicio
A diferencia de los recursos (Fleetset), los parámetros del servicio (Origen, Destino, Fecha, Perfil Térmico) son **inmutables** para el Carrier. El compromiso aceptado en el módulo de Orders es la "Ley" del viaje. Si el carrier no puede cumplir con el "cuándo", el sistema debe forzar una ruptura de compromiso (`Fail After Accept`) para que Dispatch pueda salvar la operación con otro transportista.

### B. Torre de Control Predictiva (IoT vs. Conversación)
Abandonamos la dependencia de la respuesta humana para la visibilidad. El sistema gestionará la etapa mediante:

*   **Cálculo de Proximidad:** $X$ horas antes de la carga, el sistema inicia el monitoreo de telemetría de forma automática.
*   **Alertas de Desviación:** Si el cálculo matemático (**Posición GPS + Velocidad → Destino Origen**) indica un retraso potencial frente a la cita, la Torre de Control notifica al Planner por excepción.
*   **WhatsApp como Notificador, no como Input:** WhatsApp se utiliza para enviar información proactiva al transportista (*"Vas tarde, tu cita es en 1h"*) y no para consultar un ETA que el sistema ya calculó con mayor precisión mediante IoT.

### C. Gestión "En Origen"
El substatus `AT_ORIGIN` es el hito de éxito de esta etapa. Se activa mediante geocerca automática y es la señal para que el Inspector de Origen prepare su equipo para el loading. Representa el fin de la incertidumbre operativa y el inicio del proceso físico de enfriamiento y validación de carga.

### D. El Hito de Pre-cooling e Integridad Térmica
El pre-enfriamiento es el requisito técnico indispensable para transicionar de `AT_ORIGIN` a `LOADING`.

*   **Validación IoT de Perfil Térmico:** El sistema cruza en tiempo real el dato de telemetría (Sensor de Retorno/Suministro) con el Perfil Térmico de la orden. 
*   **Detección de Loading:** El estado `LOADING` se activa mediante la **Acción del Inspector** en el portal de Control de Origen tras aprobar el checklist pre-embarque, o mediante el sensor de apertura de puertas en el dique de carga.
*   **Gestión de Excepciones (OBSERVED):** Si la unidad no alcanza la temperatura requerida o falla el checklist, el sistema marca la orden como `SCHEDULED/OBSERVED`, notificando al Carrier para intervención inmediata.
*   **Resolución de OBSERVED:**
    *   `OBSERVED` → `LOADING` (problema resuelto, continuar carga)
    *   `OBSERVED` → `AT_ORIGIN` (reinspección tras corrección)
    *   `OBSERVED` → `DISPATCH/UNASSIGNED` (no se puede resolver, reasignar)

---

## 4. Conclusiones y Recomendaciones de Expertis

1.  **Unificación de Lenguaje:** La aplicación debe evaluar el par `(stage, substatus)` como fuente única de verdad para el renderizado de UI.
2.  **WhatsApp como Notificador:** El uso de WhatsApp se centra en el envío de información (Tickets, Links de Acción, Alertas) y no en la consulta de ETAs, que será delegada a la telemetría IoT.
3.  **Transiciones Automáticas:** El sistema debe aspirar a que el 80% de los movimientos de estado en `SCHEDULED` y `EXECUTION` sean detonados por eventos sistémicos (Geocercas/GPS/Checklist de Inspector).
4.  **Terminología Unificada:** Se adopta el término **"En Origen"** (AT_ORIGIN) como el estándar operativo para referirse a unidades en planta o patio de carga.

**Estatus de la Auditoría:** Aprobado para fase de implementación asistida por Capa Conversacional e IoT.
