# Especificación Técnica: Catálogo de Motivos de Cancelación

## 1. Contexto y Propósito
Actualmente, las cancelaciones en el módulo de Dispatch se registran como un estado terminal (`CANCELED`), pero carecen de una causa raíz estructurada. Para mejorar la inteligencia de negocio y la eficiencia operativa, se requiere implementar un catálogo de motivos de cancelación que sea específico para cada organización (Shipper).

Este catálogo permitirá diferenciar las cancelaciones controladas por el Shipper (ej. falta de inventario, cambio de fecha del cliente) de los rechazos efectuados por el transportista (Carrier), los cuales ya cuentan con su propio catálogo global (`rejection_reasons`).

---

## 2. Definiciones de Negocio
Basado en [docs/business/dispatch.md](./dispatch.md):

*   **Ownership:** La cancelación es una decisión exclusiva del Shipper.
*   **Etapas Permitidas:** `DISPATCH`, `TENDERS` y `SCHEDULED`.
*   **Semántica de Estado:** Al cancelar, la orden conserva su `stage` y pasa a `substatus = CANCELED` (ej: `DISPATCH/CANCELED`, `TENDERS/CANCELED`, `SCHEDULED/CANCELED`).
*   **Handoff:** Una vez que la orden entra en `EXECUTION / IN_TRANSIT`, la cancelación directa desde dispatch deja de ser el flujo estándar.
*   **Restricción de Datos:** No se permite el uso de texto libre como causa principal. Toda cancelación debe referenciar un código del catálogo.

Este documento define únicamente contrato y reglas de persistencia a nivel de base de datos (DDL, constraints, índices y consistencia multitenant).

---

## 3. Arquitectura de Base de Datos (Enterprise Grade)
La implementación sigue las reglas estipuladas en [.cursor/rules/data-base-rules.md](../../.cursor/rules/data-base-rules.md), utilizando un enfoque de **Seguridad Defensiva** para garantizar la integridad multitenant.

### 3.1 Tabla: `cancellation_reasons`
Define los motivos de cancelación configurables por organización.

```sql
CREATE TABLE public.cancellation_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  code text NOT NULL,             -- ej: 'STOCK_ISSUE', 'CUST_CANCEL', 'OTHER'
  label text NOT NULL,            -- ej: 'Falta de Inventario', 'Otro'
  category text,                  -- ej: 'Operativo', 'Comercial'
  requires_comment boolean DEFAULT false, -- Flag de validación consumido por capa de aplicación
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Necesario para la FK compuesta en dispatch_orders
  CONSTRAINT cancellation_reasons_org_id_id_uniq UNIQUE (org_id, id)
);

-- Índice único case-insensitive para evitar duplicados por mayúsculas/minúsculas
-- Recomendación: normalizar code en UPPER_SNAKE_CASE en capa de aplicación.
CREATE UNIQUE INDEX idx_cancellation_reasons_org_code_upper
ON public.cancellation_reasons (org_id, upper(code));
```

### 3.2 Relación en `dispatch_orders` (Aislamiento Estricto)
Se integra el motivo en la orden de despacho utilizando una **Llave Foránea Compuesta** para asegurar que el motivo pertenezca a la misma organización que la orden.

```sql
-- 1. Añadir columna
ALTER TABLE public.dispatch_orders 
ADD COLUMN cancellation_reason_id uuid;

-- 2. Añadir FK Compuesta (Protección Multitenant)
ALTER TABLE public.dispatch_orders
ADD CONSTRAINT dispatch_orders_cancellation_reason_fk
FOREIGN KEY (org_id, cancellation_reason_id)
REFERENCES public.cancellation_reasons (org_id, id)
ON UPDATE RESTRICT
ON DELETE RESTRICT;

-- 3. Check Constraint (Integridad de Estado)
-- Impide que una orden pase a CANCELED sin registrar un motivo del catálogo.
ALTER TABLE public.dispatch_orders
ADD CONSTRAINT dispatch_orders_cancellation_reason_required_chk
CHECK (
  substatus <> 'CANCELED'::dispatch_order_substatus
  OR (
    cancellation_reason_id IS NOT NULL
    AND stage IN (
      'DISPATCH'::dispatch_order_stage,
      'TENDERS'::dispatch_order_stage,
      'SCHEDULED'::dispatch_order_stage
    )
  )
);
```

### 3.3 Índices de Rendimiento Operativo
Optimización para las vistas principales del Dispatch Board y reportes.

```sql
-- Optimiza la carga del Dispatch Board (Gantt/Lista)
CREATE INDEX idx_dispatch_orders_org_stage_substatus
ON public.dispatch_orders (org_id, stage, substatus);

-- Optimiza reportes de causas de cancelación
CREATE INDEX idx_dispatch_orders_cancellation_reason_id
ON public.dispatch_orders (cancellation_reason_id);
```

---

## 4. Validación de Datos (Contrato de Persistencia)
La base de datos define la regla de obligatoriedad del motivo al cancelar, y expone metadatos para validación a nivel de aplicación:

1.  **Integridad en DB:** `substatus = CANCELED` requiere `cancellation_reason_id`.
2.  **Metadato de catálogo:** `requires_comment` se persiste en `cancellation_reasons` para validación en capa de aplicación.

---

## 5. Comparativa: Cancelación vs. Rechazo

| Atributo | Rejection Reasons (Carrier) | Cancellation Reasons (Shipper) |
| :--- | :--- | :--- |
| **Actor** | Transportista | Planeador de Despacho |
| **Alcance** | Global (Estandarizado) | Por Organización (Privado) |
| **Integridad** | Simple FK | FK Compuesta (Org + ID) |
| **Efecto** | Vuelve a Backlog | Estado terminal (`*/CANCELED`) conservando stage |

---

## 6. Recomendaciones de Implementación

1.  **Patrón Expandir:** Crear `cancellation_reasons` primero.
2.  **Migración de Datos:** Si existen órdenes canceladas, asignar un motivo genérico antes de activar el `CHECK CONSTRAINT`.
3.  **Seguridad RLS:** Políticas filtradas por `org_id` en la nueva tabla.
4.  **Contratos de escritura:** Toda operación de cancelación debe persistir `cancellation_reason_id` y respetar constraints definidos por DB.
