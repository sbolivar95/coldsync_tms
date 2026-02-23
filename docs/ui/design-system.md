# Sistema de Diseño

## Paleta de Colores

```css
--primary: #004ef0
  /* Azul principal - botones, links, underlines */
  --primary-focus: #003bc4 /* Hover/Active states */
  --primary-light: #e5edff /* Backgrounds suaves */
  --input-background: #f3f3f5 /* Background de inputs */
  --destructive: #d4183d /* Errores y alertas */
```

## Tipografía (Tailwind v4 Utility-First)

⚠️ **IMPORTANTE**: Este proyecto usa **Tailwind v4 puro**. SIEMPRE debes aplicar clases de tipografía explícitamente:

| Elemento | Clases Requeridas       | Uso                 |
| -------- | ----------------------- | ------------------- |
| H1       | `text-2xl font-medium`  | Títulos principales |
| H2       | `text-xl font-medium`   | Títulos de sección  |
| H3       | `text-lg font-medium`   | Subtítulos          |
| Body     | `text-sm`               | Texto general       |
| Label    | `text-xs text-gray-600` | Labels de campos    |
| Button   | `text-sm font-medium`   | Texto de botones    |

**Filosofía Tailwind v4:**

- ✅ NO hay estilos base en CSS para elementos HTML
- ✅ SIEMPRE aplicar clases utility directamente en JSX
- ✅ Usar componentes reutilizables para evitar repetición
- ✅ Configuración en `/styles/globals.css` con `@theme` (no `tailwind.config.js`)

## Espaciado

```tsx
// Entre campos de formulario
space-y-4  // 16px

// Entre label e input
space-y-1.5  // 6px

// Entre secciones (Cards)
space-y-6  // 24px

// Padding de Cards
p-6  // 24px

// Grid gaps
gap-x-8 gap-y-6  // 32px horizontal, 24px vertical
```

---

## Formularios

### Input Fields

**Especificaciones:**

- Altura: `h-9` (36px)
- Padding: `px-3`
- Background: `bg-input-background` (#f3f3f5)
- Border radius: `rounded-md`
- Focus: Ring azul automático

```tsx
// Normal
<Input placeholder="Ingrese valor..." />

// Disabled
<Input disabled className="bg-gray-50 text-gray-500" />

// Campo crítico (emergencias)
<Input className="border-orange-200 focus:border-orange-400" />
```

### Labels

```tsx
<Label htmlFor="field-id" className="text-xs text-gray-600">
  Nombre del Campo <span className="text-red-500">*</span>
</Label>
```

- Tamaño: `text-xs` (12px)
- Color: `text-gray-600`
- Requeridos: Asterisco rojo

### Botones y Acciones

NUNCA crees botones con estilos manuales. Usa siempre los componentes del sistema:

```tsx
// Primario (Acción principal)
import { PrimaryButton } from "@/components/widgets/PrimaryButton";

<PrimaryButton onClick={handleSave}>Guardar</PrimaryButton>

// Secundario / Cancelar
import { SecondaryButton } from "@/components/widgets/SecondaryButton";

<SecondaryButton onClick={handleCancel}>Cancelar</SecondaryButton>

// Base Shadcn (Para variantes específicas)
import { Button } from "@/components/ui/Button";

<Button variant="ghost" size="icon"><ChevronLeft /></Button>
```

### Layout de Formularios

**2 columnas en desktop:**

```tsx
<Card className="p-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
    <div>{/* Columna Izquierda */}</div>
    <div>{/* Columna Derecha */}</div>
  </div>
</Card>
```

**Grid para campos cortos:**

```tsx
<div className="grid grid-cols-2 gap-3">
  <InputField label="Teléfono" />
  <InputField label="Email" />
</div>
```

### Gestión en Diálogos (EntityDialog)

Para formularios que no ocupan una página completa, usa el patrón **Modal Content Stepping** encapsulado en un `EntityDialog`.

```tsx
<EntityDialog
  title="Editar Tipo"
  description="Modifica los detalles"
  showBackButton={true}
  onBack={() => setView('list')}
>
  <FormContent />
</EntityDialog>
```

---

## Tablas

### Uso del DataTable

Para tablas complejas con paginación, multiselección y acciones, usar el componente `DataTable`.

📚 **Ver documentación completa:** `/components/DataTable/README.md`

**Ejemplo básico:**

```tsx
import { DataTable } from "@/components/DataTable";

const columns = [
  {
    key: "name",
    header: "Nombre",
    render: (item) => <span>{item.name}</span>,
  },
  {
    key: "status",
    header: "Estado",
    align: "center",
    render: (item) => <Badge>{item.status}</Badge>,
  },
];

<DataTable
  data={data}
  columns={columns}
  getRowId={(item) => item.id}
  itemsPerPage={10}
/>;
```

### Estándares de Tablas

**Headers:**

- Background: `bg-gray-50` o `style={{ backgroundColor: '#eff5fd' }}`
- Texto: `text-xs text-gray-500 uppercase tracking-wider`
- Padding: `px-4 py-2.5`

**Celdas:**

- Texto: `text-xs text-gray-900`
- Padding: `px-4 py-3`
- Border: `border-b border-gray-100`
- Hover: `hover:bg-gray-50 transition-colors`

**Acciones por fila:**

- Botones: `h-7 w-7 p-0`
- Iconos: `w-3.5 h-3.5`
- Gap: `gap-1`
- Alineación: `justify-end`

### Badges de Estado

| Estado          | Clase                           | Uso                                    |
| --------------- | ------------------------------- | -------------------------------------- |
| Activo/Completo | `bg-green-100 text-green-700`   | Usuarios activos, órdenes completadas  |
| Suspendido      | `bg-gray-100 text-gray-700`    | Usuarios suspendidos                   |
| Pendiente       | `bg-yellow-100 text-yellow-700` | Órdenes de despacho (no usuarios)     |
| Error/Inactivo  | `bg-red-100 text-red-700`       | Errores, órdenes canceladas            |
| En Proceso      | `bg-blue-100 text-blue-700`     | Órdenes en tránsito                    |
| Neutral         | `bg-gray-100 text-gray-700`     | Estados neutros                        |

**Nota sobre estados de usuario**: Los usuarios solo tienen dos estados: **Activo** (verde) y **Suspendido** (gris). El estado "Pendiente" no se aplica a usuarios - cuando se envía una invitación, el usuario pasa directamente a "Activo" al aceptar el magic link.

### Paginación

**Especificaciones:**

- Altura botones: `h-7`
- Botones números: `w-7 p-0 text-xs`
- Gap: `gap-1.5`
- Color activo: `#004ef0`

**Container:**

```tsx
<div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
  <div className="text-sm text-gray-700">
    Mostrando 1 a 10 de 50 registros
  </div>
  {/* Botones de paginación */}
</div>
```
