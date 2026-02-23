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

- **Header con Tabs de Filtrado:** 8 tabs para filtrar unidades según estado operativo
- **Barra de Búsqueda Global:** Búsqueda por Unidad, Remolque, Conductor, Ubicación o Transportista
- **Filtros Adicionales:** Estado, Transportista, Tipo de Vehículo
- **Layout Principal:**
  - **Lista de Unidades (Panel Izquierdo):** Tarjetas compactas de cada unidad con información resumida
  - **Mapa en Tiempo Real (Área Principal):** Visualización geográfica de la flota
  - **Drawer de Detalles:** Panel flotante inferior con información detallada de la unidad seleccionada

## Sistema de Tabs de Filtrado

Los tabs permiten filtrar los viajes activos según su estado operativo:

| Tab                   | Descripción                                        | Contenido                              |
| :-------------------- | :------------------------------------------------- | :------------------------------------- |
| **Todos**             | Todas las unidades visibles (con y sin viaje)      | Tracking general de flota + Viajes     |
| **Programado**        | Ticket enviado, aún no salió de su base            | Solo unidades con viaje programado     |
| **En Origen**         | Dentro de geocerca de carga (cargando o esperando) | Solo unidades en origen                |
| **En Ruta**           | Viaje en marcha – estado principal del día a día   | Solo unidades en tránsito              |
| **En Destino**        | Acaba de llegar al destino                         | Solo unidades en destino               |
| **Retrasado**         | ETA peor que la planificada (leve o grave)         | Solo unidades con retraso               |
| **Excursión Térmica** | Temperatura fuera de rango – alarma máxima         | Solo unidades con alerta térmica       |
| **Finalizado**        | Descargado y auditoría OK – desaparece del mapa    | Solo viajes completados                |

> **⚠️ Nota:** El tab "Todos" muestra también unidades **sin viaje activo** (tracking general de flota), mientras que el resto de tabs solo muestran unidades con viajes asignados.

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

## Estados Operativos en Control Tower (Modelo Stage + Substatus)

> **Referencia completa:** Ver [Gestión de Estados](./state-orders.md) para el modelo global de 5 etapas.

La Torre de Control muestra órdenes en las etapas **SCHEDULED** y **EXECUTION**:

| Stage | Substatus | Nombre en UI | Comentario operativo |
| :---- | :-------- | :----------- | :------------------- |
| SCHEDULED | `PROGRAMMED` | Programado | Ticket enviado, aún no salió de su base |
| SCHEDULED | `AT_ORIGIN` | En Origen | Dentro de geocerca de carga (cargando o esperando) |
| SCHEDULED | `LOADING` | En Carga | Checklist aprobado, carga en proceso |
| EXECUTION | `IN_TRANSIT` | En Ruta | Viaje en marcha – estado principal del día a día |
| EXECUTION | `AT_DESTINATION` | En Destino | Acaba de llegar al destino |
| EXECUTION | `DELIVERED` | Entregado | POD recibido – pasa a CONCILIATION |

> **Nota:** "Retrasado" y "Excursión Térmica" no son substatus sino **flags calculados** superpuestos al estado actual. Una orden `IN_TRANSIT` con alerta térmica sigue siendo `EXECUTION/IN_TRANSIT` — la alerta es contexto adicional, no un cambio de estado.

## Tracking de Flota General vs Tracking de Viaje

**Torre de Control maneja dos niveles de tracking:**

**Nivel 1: Tracking General de Flota**
- Unidades visibles incluso **sin viaje activo**
- Útil para planificar asignaciones futuras
- Muestra ubicación actual, estado del vehículo y conductor disponible
- Visible en tab "Todos"

**Nivel 2: Tracking de Viaje Activo**
- Solo unidades con viaje asignado
- Incluye información de carga, origen, destino y ETA
- Monitoreo de cumplimiento térmico y ruta
- Alertas operativas específicas del viaje
- Visible en tabs específicos (En Ruta, Retrasado, etc.)

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

