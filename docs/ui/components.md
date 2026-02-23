# 🧩 Componentes UI - ColdSyn TMS

Este documento describe el sistema de componentes UI basado en Radix UI y los widgets personalizados.

---

## 📋 Tabla de Contenidos

1. [Sistema de Componentes](#sistema-de-componentes)
2. [Componentes Base (Radix UI)](#componentes-base-radix-ui)
3. [Widgets Personalizados](#widgets-personalizados)
4. [Uso de Componentes](#uso-de-componentes)
5. [Mejores Prácticas](#mejores-prácticas)

---

## 🎨 Sistema de Componentes

### Arquitectura

El sistema de componentes tiene dos niveles:

1. **Componentes Base** (`components/ui/`) - Componentes headless de Radix UI
2. **Widgets** (`components/widgets/`) - Componentes de alto nivel personalizados

### Radix UI

Todos los componentes base están basados en **Radix UI**, que proporciona:

- ✅ Accesibilidad (a11y) por defecto
- ✅ Componentes headless (sin estilos)
- ✅ Completamente tipados
- ✅ Keyboard navigation
- ✅ Focus management

### Tailwind CSS

Los estilos se aplican con **Tailwind CSS**:

- ✅ Utility-first
- ✅ Responsive design
- ✅ Dark mode ready
- ✅ Customizable

---

## 🧱 Componentes Base (Radix UI)

### Ubicación

Todos los componentes base están en `src/components/ui/`:

```
components/ui/
├── Accordion.tsx
├── Alert.tsx
├── AlertDialog.tsx
├── Button.tsx
├── Card.tsx
├── Dialog.tsx
├── DropdownMenu.tsx
├── Input.tsx
├── Select.tsx
├── Table.tsx
├── Tabs.tsx
└── ... (50+ componentes)
```

### Componentes Principales

#### Button

```typescript
import { Button } from '@/components/ui/Button';

<Button variant="default" size="sm">
  Click me
</Button>

// Variantes: default, destructive, outline, secondary, ghost, link
// Tamaños: default, sm, lg, icon
```

#### Input

```typescript
import { Input } from '@/components/ui/Input';

<Input
  type="text"
  placeholder="Enter text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

#### Dialog

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <p>Content</p>
  </DialogContent>
</Dialog>
```

#### Select

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Table

```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item 1</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### Tabs

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

---

## 🎁 Widgets Personalizados

### Ubicación

Los widgets están en `src/components/widgets/`:

```
components/widgets/
├── DataTable/              # Tabla de datos completa
├── DatePicker.tsx          # Selector de fechas
├── TimePicker.tsx          # Selector de hora
├── SmartSelect.tsx         # Selector inteligente
├── EntityDialog.tsx        # Diálogo genérico
├── EditableFields/         # Campos editables
├── FormField.tsx           # Campo de formulario
├── FormLabel.tsx           # Label de formulario
├── ConfirmDialog.tsx        # Diálogo de confirmación
└── TableToolbar.tsx        # Barra de herramientas
```

### DataTable

Tabla de datos completa con paginación, selección y acciones.

```typescript
import { DataTable } from '@/components/widgets/DataTable';

<DataTable
  data={vehicles}
  columns={columns}
  getRowId={(row) => row.id}
  actions={[
    {
      label: 'Edit',
      onClick: (row) => handleEdit(row),
    },
    {
      label: 'Delete',
      onClick: (row) => handleDelete(row),
      variant: 'destructive',
    },
  ]}
  bulkActions={[
    {
      label: 'Delete Selected',
      onClick: (selected) => handleBulkDelete(selected),
    },
  ]}
  itemsPerPage={10}
/>
```

### DatePicker

Selector de fechas con calendario.

```typescript
import { DatePicker } from '@/components/widgets/DatePicker';

<DatePicker
  value={date}
  onChange={setDate}
  placeholder="Select date"
/>
```

### SmartSelect

Selector inteligente con búsqueda.

```typescript
import { SmartSelect } from '@/components/widgets/SmartSelect';

<SmartSelect
  options={vehicles}
  value={selectedVehicle}
  onChange={setSelectedVehicle}
  getLabel={(v) => v.vehicle_code}
  getValue={(v) => v.id}
  placeholder="Select vehicle"
  searchable
/>
```

### ConfirmDialog

Diálogo de confirmación con variantes visuales y soporte para navegación interna. Útil para pasos de confirmación finales o flujos de borrado.

**Props:**
- `variant`: `default`, `destructive`, `warning`.
- `showBackButton`: Booleano para mostrar el botón de retroceso (`ChevronLeft`).
- `onBack`: Función que se ejecuta al pulsar el botón de retroceso (usualmente vuelve a una vista previa de edición).
- `title/description`: Título y cuerpo del mensaje (soporta `ReactNode`).

```typescript
import { ConfirmDialog } from '@/components/widgets/ConfirmDialog';

<ConfirmDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="¿Seguro que deseas eliminar?"
  description="Esta acción marcará el elemento como inactivo."
  variant="destructive"
  showBackButton={true}
  onBack={() => setView('edit')}
  onConfirm={handleDelete}
/>
```

### EntityDialog

Diálogo estandarizado para la gestión de entidades. Ahora soporta navegación interna fluyendo entre diferentes estados sin necesidad de cerrar la ventana.

**Nuevas Props:**
- `showBackButton`: Booleano para mostrar el botón de retroceso.
- `onBack`: Función que se ejecuta al pulsar el botón de retroceso (usualmente vuelve a una vista de lista).
- `title/description`: Soportan `ReactNode` para personalización avanzada.

```typescript
import { EntityDialog } from '@/components/widgets/EntityDialog';

<EntityDialog
  open={isOpen}
  onClose={onClose}
  title="Gestionar Tipos"
  showBackButton={view !== 'list'}
  onBack={() => setView('list')}
  onSave={handleSave}
>
  {view === 'list' ? <ListComponent /> : <FormComponent />}
</EntityDialog>
```

### EditableFields

Campos editables inline.

```typescript
import { EditableField } from '@/components/widgets/EditableFields';

<EditableField
  value={vehicle.vehicle_code}
  onSave={(newValue) => handleSave(newValue)}
  label="Vehicle Code"
/>
```

---

## 💻 Uso de Componentes

### Importación

```typescript
// Componentes UI base
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';

// Widgets
import { DataTable } from '@/components/widgets/DataTable';
import { DatePicker } from '@/components/widgets/DatePicker';
```

### Composición

```typescript
function VehicleForm() {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Vehicle</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Vehicle Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## ✅ Mejores Prácticas

### 1. Usar Componentes Base para UI Simple

```typescript
// ✅ Bueno - Usar componente base
<Button variant="outline">Cancel</Button>

// ❌ Malo - Crear componente desde cero
<button className="px-4 py-2 border rounded">Cancel</button>
```

### 2. Usar Widgets para Funcionalidad Compleja

```typescript
// ✅ Bueno - Usar widget DataTable
<DataTable data={vehicles} columns={columns} />

// ❌ Malo - Crear tabla desde cero
<table>
  {/* Mucho código repetitivo */}
</table>
```

### 3. Componer Componentes

```typescript
// ✅ Bueno - Componer componentes pequeños
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <Form>
      <FormField>
        <Input />
      </FormField>
    </Form>
  </DialogContent>
</Dialog>
```

### 4. Mantener Consistencia

```typescript
// ✅ Bueno - Mismo estilo en toda la app
<Button variant="default" size="sm">Save</Button>
<Button variant="outline" size="sm">Cancel</Button>

// ❌ Malo - Estilos inconsistentes
<button className="bg-blue-500">Save</button>
<button className="border-gray-300">Cancel</button>
```

### 5. Usar Tipos Correctamente

```typescript
// ✅ Bueno - Tipos explícitos
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  children: React.ReactNode;
}

// ❌ Malo - Sin tipos
function Button(props: any) {
  // ...
}
```

---

## 🔗 Referencias

- [Sistema de Diseño](./design-system.md)
- [Navegación](./navigation.md)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)

---

**Última actualización:** Diciembre 2024

