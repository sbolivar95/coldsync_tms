# 🏗️ Torre de Control: Ejecución e Integridad Térmica

Este documento describe el pilar de **Ejecución (Real-Time Control)** de ColdSync, encargado del monitoreo persistente de la red de Line Haul una vez que el despacho ha sido completado.

---

## 📋 Tabla de Contenidos

1. [Visión General: El Control de la Red](#visión-general)
2. [Arquitectura de la Vista](#arquitectura-de-la-vista)
3. [Monitoreo de Carriles (Lanes)](#sistema-de-tabs-de-filtrado)
4. [Gestión de Activos en Ruta](#lista-de-unidades)
5. [Trazabilidad IoT y Térmica](#integración-con-telemetría)
6. [Gestión de Alertas y Observancias](#orquestación-de-alertas)
7. [Drawer de Detalles de Viaje](#drawer-de-detalles-de-unidad)

---

## 🎯 Visión General

La Torre de Control es el cerebro de la fase de **Ejecución**. En un modelo de Line Haul, no basta con saber dónde está el camión; es crítico asegurar la **integridad térmica** y el cumplimiento de la ruta programada a través de cientos o miles de kilómetros. 

Este módulo fusiona la telemetría IoT (vía Flespi) con los datos del contrato y la ruta para garantizar que el SLA acordado en la planificación se cumpla en la realidad.

## Arquitectura de la Vista

La Torre de Control está organizada en:

- **Header con Tabs de Filtrado:** 5 tabs para filtrar universo de tracking y estado de ejecución
- **Barra de Búsqueda Global:** Búsqueda por Unidad, Remolque, Conductor, Ubicación o Transportista
- **Filtros Adicionales:** Estado, Transportista, Tipo de Vehículo
- **Layout Principal:**
  - **Lista de Unidades (Panel Izquierdo):** Tarjetas compactas de cada unidad con información resumida
  - **Mapa en Tiempo Real (Área Principal):** Visualización geográfica de la flota
  - **Drawer de Detalles:** Panel flotante inferior con información detallada de la unidad seleccionada

## Sistema de Tabs de Filtrado

Los tabs implementados actualmente son:

| Tab UI            | ID interno         | Regla de filtrado implementada                                                                 |
| :---------------- | :----------------- | :---------------------------------------------------------------------------------------------- |
| **Tracking**      | `live-tracking`    | Muestra todas las unidades visibles en el universo de tracking (`true`).                       |
| **En Ejecución**  | `active-orders`    | Unidades con viaje activo (`hasActiveTrip = executionSubstatus != null && != DELIVERED`).     |
| **En Tránsito**   | `in-transit`       | `executionSubstatus === IN_TRANSIT`.                                                           |
| **En Destino**    | `at-destination`   | `executionSubstatus === AT_DESTINATION`.                                                       |
| **Completadas**   | `delivered`        | `executionSubstatus === DELIVERED`.                                                            |

> **Nota:** Los botones visuales de filtros adicionales (`Estado`, `Transportista`, `Tipo de Vehículo`) están en el header, pero hoy no aplican filtrado de datos en la consulta.

## Lista de Unidades

Panel lateral con tarjetas compactas de cada unidad.

**Información mostrada por tarjeta:**

- **Header:** Unidad (TRK-1024) + Remolque (RMQ-456)
- **Conductor:** Nombre completo
- **Ubicación:** Ciudad, Estado/País
- **Estado Operativo:** Badge con color semántico
  - En Ruta: Verde
  - Detenido: Amarillo
  - En Planta: Azul
- **Métricas en tiempo real:**
  - Velocidad actual (km/h)
  - Temperatura del reefer
  - Última actualización (tiempo transcurrido)
- **Indicadores:**
  - Icono de alerta si hay errores de reefer
  - Badge "Con Viaje" / "Sin Viaje"

**Interacción:**
- Click en tarjeta → Selecciona unidad en el mapa + Abre Drawer de Detalles
- Scroll vertical para navegar todas las unidades

## Mapa en Tiempo Real

Área principal con visualización geográfica de la flota.

**Características:**

- Visualización de unidades en tiempo real
- Controles de zoom (In/Out)
- Selección de unidad desde el mapa
- **Marcadores dinámicos** con iconos según estado
- **Geocercas** de origen/destino visibles
- **Ruta planificada** vs **ruta real** (cuando aplica)
- **Clustering** de unidades cercanas

### Semántica de Color para Puntos de Temperatura (Marker)

Para el marker de Control Tower, cada compartimiento térmico debe mostrar su punto de estado con esta convención:

- `primaryCold` (dentro de rango): `primary`
- `warning` (desviación): `var(--color-orange-500)`
- `critical` (crítico/excursión): `var(--color-red-600)`
- `neutral` (sin actividad / `STALE` / `OFFLINE` en marker): `var(--color-gray-400)`

**Regla de render:**
- **Standard:** `[Barra] + [Placa] [T1] [Punto]`
- **Híbrido:** `[Barra] + [Placa] [T1] [Punto] | [T2] [Punto]`

## Drawer de Detalles de Unidad

Panel flotante inferior que aparece al seleccionar una unidad. Tiene **3 estados redimensionables**:

| Estado         | Descripción                             |
| :------------- | :-------------------------------------- |
| **Minimizado** | Solo muestra barra con nombre de unidad |
| **Medio**      | Muestra tabs + contenido básico         |
| **Completo**   | Vista expandida con gráficos grandes    |

### Sistema de Tabs del Drawer (6 tabs)

**1. General**
- Información del viaje activo
- Origen → Destino
- Producto transportado
- Transportista asignado
- Hora de salida y ETA
- Progreso del viaje (barra de progreso)

**2. Temperatura**
- Temperatura actual del reefer
- Setpoint configurado
- Rango térmico permitido (min/max)
- Estado térmico: Normal / Advertencia / Crítico
- Indicador visual de desviación
- Sensor return air / supply air (si aplica)

**3. Gráficos**
- Gráfico de temperatura histórica (últimas 24h)
- Gráfico de velocidad
- Gráfico de eventos (paradas, aperturas de puertas)

**4. Reefer**
- Estado del motor de frío
- Modo de operación: Continuo / Start-Stop
- Horas de motor (Hours Run)
- Consumo de combustible estimado
- Códigos de error activos (si aplica)
- Presión de refrigerante
- Estado de sensores

**5. Info**
- Datos del conductor
- Datos del vehículo (placa, marca, modelo)
- Datos del remolque (placa, capacidad)
- Transportista
- Base de operación
- Último mantenimiento

**6. Alertas** (con indicador de alertas activas)
- Lista de alertas activas y recientes
- Tipos de alertas:
  - Excursión térmica (crítica/media/leve)
  - Apertura de puertas no autorizada
  - Desvío de ruta
  - Velocidad excedida
  - Error de reefer
  - Pérdida de señal GPS
- Severidad con colores: Crítica (Roja), Media (Amarilla), Leve (Azul)
- Timestamp de cada alerta
- Botón "Marcar como resuelta"

**Controles del Drawer:**
- **Botón ↑:** Expandir (Minimizado → Medio o Medio → Completo)
- **Botón ↓:** Contraer (Completo → Medio o Medio → Minimizado)
- **Botón X:** Cerrar drawer completamente

## Estados Operativos en Control Tower (Modelo StageStatus: Stage + Substatus)

> **Referencia completa:** Ver [Gestión de Estados](./state-orders.md) para el modelo global de 5 etapas.

La Torre de Control filtra estado de órdenes sobre el modelo `stage + substatus`, y actualmente consume:

- `stage = EXECUTION`
- `substatus in (IN_TRANSIT, AT_DESTINATION, DELIVERED)`

Mapeo actual de substatus en la UI:

| Stage | Substatus | Nombre en UI | Comentario operativo |
| :---- | :-------- | :----------- | :------------------- |
| EXECUTION | `IN_TRANSIT` | En Ruta | Viaje en marcha – estado principal del día a día |
| EXECUTION | `AT_DESTINATION` | En Destino | Acaba de llegar al destino |
| EXECUTION | `DELIVERED` | Entregado | POD recibido – pasa a CONCILIATION |

> **Nota importante:** En Control Tower también existe un **estado operativo de unidad** (telemetría) separado del StageStatus de orden. Ejemplo: `THERMAL_EXCURSION`, `STALE`, `OFFLINE` son estados operativos/flags de tracking y no substatus de `dispatch_orders`.

## Tracking de Flota General vs Tracking de Viaje

**Torre de Control maneja dos niveles de tracking:**

**Nivel 1: Tracking General de Flota**
- Unidades visibles incluso **sin viaje activo**
- Útil para planificar asignaciones futuras
- Muestra ubicación actual, estado del vehículo y conductor disponible
- Visible en tab **Tracking**

**Nivel 2: Tracking de Viaje Activo**
- Solo unidades con viaje asignado
- Incluye información de carga, origen, destino y ETA
- Monitoreo de cumplimiento térmico y ruta
- Alertas operativas específicas del viaje
- Visible en tabs de ejecución: **En Ejecución**, **En Tránsito**, **En Destino**, **Completadas**

## Orquestación de Alertas

**Flujo automático de notificaciones:**

- Alertas de excursión térmica → envío vía Email (Resend) + WhatsApp
- Alertas de desvío de ruta → notificación al dispatcher
- Alertas de apertura de puertas no autorizada → alerta inmediata
- Notificaciones de ETA actualizado → email vía Resend con gráficos adjuntos
- Contingencias operativas → escalamiento automático

**Canales de notificación:**

- **Email (Resend):** Reportes detallados con gráficos
- **WhatsApp:** Alertas urgentes y actualizaciones de ETA
- **SMS:** Backup para alertas críticas
- **Push (futuro):** Notificaciones en tiempo real en la app

## Integración con Telemetría

**Fuente de datos en tiempo real:**

- **GPS:** Coordenadas lat/lng actualizadas cada 30-60 segundos
- **Velocidad:** Velocidad instantánea y promedio
- **Temperatura:** Datos de sensores del reefer (return air / supply air)
- **Eventos:** Encendido/apagado motor, apertura puertas, geocercas
- **Datos CAN Reefer:** Modo de operación, setpoint, códigos de error, horas de motor

**Procesamiento:**

- Gateway de Telemetría → Webhook → Base de Datos
- Actualización en tiempo real del estado de la unidad
- Trigger automático de alertas según reglas configuradas
- Histórico de telemetría para auditoría post-viaje

---

## 🔗 Referencias

- [Gestión de Estados](./state-orders.md) - Modelo global Stage + Substatus
- [Despacho](./dispatch.md) - Flujo previo al seguimiento
- [Conciliación](./reconciliation.md) - Auditoría post-viaje
- [KPIs](./kpis.md) - Métricas de desempeño
- [Visión General](./README.md) - Macroprocesos del sistema

---

**Última actualización:** Enero 2026
