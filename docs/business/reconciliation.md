# 💰 Conciliación y Liquidación Financiera (Strategic Settlement)

Este documento describe el pilar de **Conciliación (Settlement)**, el proceso final de auditoría operativa y liquidación financiera que sucede tras el arribo de un viaje de Line Haul.

---

## 📋 Tabla de Contenidos

1. [Visión General: Auditoría de Red](#visión-general)
2. [Auditoría Automática de SLA](#auditoría-automática)
3. [Liquidación de Tarifas y Backhaul](#liquidación-de-tarifas)
4. [Gestión de Evidencias e Incidencias Térmicas](#gestión-de-evidencias)
5. [Resolución de Disputas (Workflow)](#flujo-de-disputa)

---

## 🎯 Visión General

La Conciliación en ColdSync es el proceso que cierra el ciclo de vida de la orden. Su objetivo es transformar la ejecución física (telemetría y eventos) en una obligación financiera justa y auditable. 

Este pilar garantiza que el pago al transportista sea exacto, considerando la tarifa base del contrato, los recargos incurridos, la optimización por **Backhaul** y los descuentos aplicados por incumplimientos de integridad térmica o puntualidad detectados por la Torre de Control.

## Auditoría Automática

El sistema calcula automáticamente:

### Tiempos de Tránsito Reales vs. Planificados

- Comparación entre tiempo estimado y tiempo real de ejecución
- Identificación de retrasos y sus causas

### Auditoría Térmica

- Análisis de gráficos de temperatura histórica
- Detección de min/max fuera de rango
- Cálculo de tiempo y porcentaje de excursiones térmicas
- Clasificación de severidad: Crítica, Media, Leve

### Aplicación de Descuentos Automáticos

- Reglas de Merma configuradas por producto/perfil
- Cálculo automático de descuentos según excursiones térmicas detectadas

## Gestión de Evidencias

**Fuentes de Evidencia:**

1. **Telemetría (Fuente Principal):**
   - Datos en tiempo real del dispositivo
   - Gráficos de temperatura histórica
   - Eventos registrados (aperturas de puertas, paradas, etc.)

2. **BOL Digitalizado:**
   - Respaldo documental
   - Procesamiento mediante OCR

3. **Dataloggers Físicos:**
   - Soporte para carga de archivos de dataloggers físicos (USB)
   - Utilizado para contrastar datos en caso de disputa
   - Validación cruzada con telemetría

## Flujo de Disputa

1. **Detección de Observaciones:**
   - El sistema identifica automáticamente excursiones térmicas o incumplimientos
   - Se aplican descuentos automáticos según reglas configuradas

2. **Apertura de Disputa:**
   - Si hay observaciones → Se abre disputa Shipper/Carrier
   - Notificación automática al Transportista

3. **Presentación de Descargos:**
   - Carrier presenta descargos y evidencias adicionales
   - Puede adjuntar dataloggers físicos, fotos, documentos

4. **Resolución:**
   - Revisión de evidencias por el Shipper
   - Decisión: Procede/No Procede descuento
   - Notificación automática vía Email (Resend) con resultado

5. **Cierre:**
   - Autorización de facturación
   - Envío de reporte final consolidado semanal por Email (Resend)

---

## Estados de Conciliación (Modelo Stage + Substatus)

> **Referencia completa:** Ver [Gestión de Estados](./state-orders.md) para el modelo global de 5 etapas.

La Conciliación es la **etapa CONCILIATION** del ciclo de vida:

| Stage | Substatus | Descripción | Trigger |
| :---- | :-------- | :---------- | :------ |
| CONCILIATION | `PENDING_AUDIT` | Entrega confirmada, auditoría automática en curso | Automático al recibir `DELIVERED` |
| CONCILIATION | `UNDER_REVIEW` | Discrepancias encontradas, revisión humana | Excursión térmica, retraso, entrega parcial |
| CONCILIATION | `DISPUTED` | Disputa abierta, carrier presenta descargos | Automático o manual |
| CONCILIATION | `APPROVED` | Auditoría aprobada o disputa resuelta | Decisión del revisor |
| CONCILIATION | `CLOSED` | Factura generada, ciclo cerrado | Sistema de facturación |

**Camino feliz:** `PENDING_AUDIT` → `APPROVED` → `CLOSED`
**Camino con disputa:** `PENDING_AUDIT` → `UNDER_REVIEW` → `DISPUTED` → `APPROVED` → `CLOSED`

## 🔗 Referencias

- [Gestión de Estados](./state-orders.md) - Modelo global Stage + Substatus
- [Despacho](./dispatch.md) - Origen de las órdenes
- [Torre de Control](./control-tower.md) - Fuente de datos de telemetría
- [KPIs](./kpis.md) - Métricas de calificación
- [Visión General](./README.md) - Macroprocesos del sistema

---

**Última actualización:** Diciembre 2024

