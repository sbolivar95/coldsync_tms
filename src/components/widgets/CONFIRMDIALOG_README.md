# ConfirmDialog

Componente reutilizable para diálogos de confirmación basado en AlertDialog de shadcn/ui.

## Ubicación

**Archivo:** `/components/common/ConfirmDialog.tsx`

---

## Características

- ✅ Modal elegante con overlay
- ✅ 3 variantes de estilo (default, destructive, warning)
- ✅ Completamente configurable
- ✅ Animaciones suaves
- ✅ Accesibilidad completa (keyboard navigation, focus trap)
- ✅ z-index optimizado para aparecer sobre drawers (z-60)
- ✅ Responsive

---

## Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `open` | `boolean` | ✅ | - | Controla si el diálogo está visible |
| `onOpenChange` | `(open: boolean) => void` | ✅ | - | Callback cuando cambia el estado del diálogo |
| `title` | `string` | ✅ | - | Título del diálogo |
| `description` | `string \| ReactNode` | ✅ | - | Descripción o contenido del diálogo |
| `onConfirm` | `() => void` | ✅ | - | Callback cuando se confirma la acción |
| `confirmText` | `string` | ❌ | `"Confirmar"` | Texto del botón de confirmación |
| `cancelText` | `string` | ❌ | `"Cancelar"` | Texto del botón de cancelación |
| `variant` | `"default" \| "destructive" \| "warning"` | ❌ | `"default"` | Estilo del botón de confirmación |
| `onCancel` | `() => void` | ❌ | - | Callback opcional cuando se cancela |
| `confirmDisabled` | `boolean` | ❌ | `false` | Deshabilita el botón de confirmación |

---

## Variantes

### **default**
```tsx
variant="default"
```
- Color: Azul primario (#004ef0)
- Uso: Acciones normales sin riesgo

### **destructive**
```tsx
variant="destructive"
```
- Color: Rojo (#d4183d)
- Uso: Acciones destructivas (eliminar, cancelar)

### **warning**
```tsx
variant="warning"
```
- Color: Naranja (#ff6b00)
- Uso: Acciones que requieren atención especial

---

## Ejemplos de Uso

### **Ejemplo 1: Confirmación Destructiva (Cancelar Orden)**

```tsx
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

function OrderDrawer() {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const orderId = "ORD-2001";

  const handleCancelOrder = () => {
    // Lógica para cancelar orden
    console.log("Orden cancelada");
  };

  return (
    <>
      <button onClick={() => setShowCancelDialog(true)}>
        Cancelar Orden
      </button>

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="¿Cancelar esta orden?"
        description={
          <>
            ¿Estás seguro de que deseas cancelar la orden <strong>{orderId}</strong>? 
            Esta acción no se puede deshacer.
          </>
        }
        confirmText="Sí, cancelar orden"
        cancelText="No, mantener"
        variant="destructive"
        onConfirm={handleCancelOrder}
      />
    </>
  );
}
```

---

### **Ejemplo 2: Confirmación Simple**

```tsx
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

function Settings() {
  const [showDialog, setShowDialog] = useState(false);

  const handleSave = () => {
    console.log("Configuración guardada");
  };

  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        Guardar Cambios
      </button>

      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="¿Guardar cambios?"
        description="Se actualizará la configuración del sistema."
        confirmText="Guardar"
        cancelText="Cancelar"
        variant="default"
        onConfirm={handleSave}
      />
    </>
  );
}
```

---

### **Ejemplo 3: Confirmación con Advertencia**

```tsx
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

function DataExport() {
  const [showDialog, setShowDialog] = useState(false);

  const handleExport = () => {
    console.log("Exportando datos...");
  };

  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        Exportar Datos
      </button>

      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="¿Exportar todos los datos?"
        description="Esta operación puede tomar varios minutos y consumir recursos del sistema."
        confirmText="Sí, exportar"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={handleExport}
      />
    </>
  );
}
```

---

### **Ejemplo 4: Con Descripción Compleja**

```tsx
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

function DeleteUser() {
  const [showDialog, setShowDialog] = useState(false);
  const userName = "Juan Pérez";
  const userEmail = "juan@example.com";

  const handleDelete = () => {
    console.log("Usuario eliminado");
  };

  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        Eliminar Usuario
      </button>

      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="¿Eliminar usuario?"
        description={
          <div className="space-y-2">
            <p>
              Se eliminará permanentemente el usuario <strong>{userName}</strong>
            </p>
            <p className="text-xs text-gray-500">Email: {userEmail}</p>
            <p className="text-xs text-red-600">
              Esta acción no se puede deshacer y se perderán todos sus datos.
            </p>
          </div>
        }
        confirmText="Sí, eliminar usuario"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
```

---

### **Ejemplo 5: Con Callback de Cancelación**

```tsx
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

function ImportData() {
  const [showDialog, setShowDialog] = useState(false);

  const handleImport = () => {
    console.log("Importando datos...");
  };

  const handleCancel = () => {
    console.log("Importación cancelada por el usuario");
  };

  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        Importar Datos
      </button>

      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="¿Importar datos desde archivo?"
        description="Los datos existentes pueden ser sobrescritos."
        confirmText="Importar"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={handleImport}
        onCancel={handleCancel}
      />
    </>
  );
}
```

---

## Estilos

### **Tipografía**
- Título: `text-base font-medium`
- Descripción: `text-xs`
- Botones: `text-xs h-9`

### **Colores por Variante**

| Variante | Background | Hover |
|----------|------------|-------|
| `default` | `#004ef0` | `#003bc4` |
| `destructive` | `#d4183d` | `#b01530` |
| `warning` | `#ff6b00` | `#e65f00` |

### **Z-index**
- Overlay: `z-50`
- Contenido: `z-[60]`
- **Nota:** Aparece sobre drawers (que usan z-50)

---

## Accesibilidad

### **Keyboard Navigation**
- `Esc` → Cierra el diálogo (igual que Cancelar)
- `Tab` → Navega entre botones
- `Enter` → Confirma la acción (si el botón Confirmar tiene foco)

### **Focus Management**
- El foco se atrapa dentro del diálogo
- El primer elemento focusable recibe foco automáticamente
- Al cerrar, el foco regresa al elemento que activó el diálogo

### **Screen Readers**
- Título marcado como `AlertDialogTitle`
- Descripción marcada como `AlertDialogDescription`
- ARIA labels automáticos gracias a Radix UI

---

## Integración con el Sistema

### **Diseño Consistente con ColdSync**
- Sigue la paleta de colores del design system
- Usa las mismas clases de tipografía que el resto de la app
- Border radius y sombras consistentes

### **Donde Usar**
- ✅ Acciones destructivas (cancelar, eliminar)
- ✅ Confirmaciones importantes
- ✅ Operaciones que no se pueden deshacer
- ❌ NO usar para validaciones simples (usar toast)
- ❌ NO usar para mensajes informativos (usar Alert)

---

## Comparación con Alternativas

| Método | UX | Personalización | Accesibilidad |
|--------|-----|----------------|---------------|
| `window.confirm()` | ❌ Bloqueante, estilo nativo | ❌ Ninguna | ⚠️ Básica |
| `ConfirmDialog` | ✅ Modal moderno | ✅ Total | ✅ Completa |

---

## Tips de Uso

### ✅ **DO:**
- Usar verbos claros en los botones ("Eliminar", "Cancelar orden")
- Mencionar el elemento específico en la descripción
- Usar `variant="destructive"` para acciones destructivas
- Pasar ReactNode para descripciones complejas

### ❌ **DON'T:**
- No usar textos genéricos ("OK", "Aceptar")
- No omitir el ID o nombre del elemento afectado
- No usar `variant="destructive"` para acciones normales
- No incluir demasiado texto en la descripción

---

## Mantenimiento

### **Si necesitas agregar una nueva variante:**

1. Agregar tipo en `ConfirmVariant`:
```tsx
type ConfirmVariant = "default" | "destructive" | "warning" | "info";
```

2. Agregar estilo en `variantStyles`:
```tsx
const variantStyles: Record<ConfirmVariant, string> = {
  // ... existentes
  info: "bg-blue-500 hover:bg-blue-600",
};
```

---

**Versión:** 1.0  
**Última actualización:** 2025-12-17  
**Mantenedor:** Equipo ColdSync
