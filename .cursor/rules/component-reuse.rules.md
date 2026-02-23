# Component Reuse Rules – DRY Principle

## Principio DRY (Don't Repeat Yourself)

**SIEMPRE reutiliza componentes existentes antes de crear nuevos.**

## Componentes Reutilizables Disponibles

### Botones y Acciones
- ✅ **`FormActions`** - Botones de acción estándar (Cancelar/Guardar) para formularios
- ✅ **`DialogActions`** - Botones de acción para diálogos
- ✅ **`PrimaryButton`** - Botón principal con estilo de marca
- ✅ **`SecondaryButton`** - Botón secundario con estilo outline

### Diálogos y Confirmaciones
- ✅ **`ConfirmDialog`** - Diálogo de confirmación reutilizable con soporte para navegación interna (`showBackButton`, `onBack`)
- ✅ **`EntityDialog`** - Diálogo estándar con soporte para navegación interna (`showBackButton`, `onBack`)

### Patrones de UX
- 🔄 **Modal Content Stepping** - Preferir "permutar contenido" dentro de un mismo diálogo en lugar de anidar múltiples diálogos.

### Formularios
- ✅ **`FormField`** - Campos de formulario estandarizados (InputField, SelectField, TextareaField)
- ✅ **`FormLabel`** - Labels consistentes para formularios
- ✅ **Componentes `Form` de shadcn** - Form, FormField, FormItem, FormLabel, FormControl, FormMessage

### Selección y Búsqueda
- ✅ **`SmartSelect`** - Selector inteligente (single, multi, smart modes)
- ✅ **`Combobox`** - Combobox con búsqueda
- ✅ **`DropdownSelect`** - Selector dropdown

### Tablas y Datos
- ✅ **`DataTable`** - Tabla de datos con paginación y filtros
- ✅ **`TableToolbar`** - Barra de herramientas para tablas

**⚠️ IMPORTANTE - DataTable Loading Pattern:**
- ✅ SIEMPRE mantener DataTable montado: `<DataTable data={items} emptyMessage="..." />`
- ❌ NUNCA desmontar durante loading: `{isLoading ? <Spinner /> : <DataTable />}` causa recarga completa
- ✅ El DataTable actualiza datos automáticamente cuando cambia el prop `data`

### Otros
- ✅ **`DatePicker`** - Selector de fecha
- ✅ **`TimePicker`** - Selector de hora
- ✅ **`Typography`** - Componentes de tipografía consistentes
- ✅ **`DetailFooter`** - Footer consistente para detail views con botones Guardar/Cancelar

## Reglas de Uso

### ✅ HACER

1. **Buscar primero**: Antes de crear un componente, buscar en `src/components/widgets/` si ya existe algo similar
2. **Reutilizar**: Usar componentes existentes con props para personalización
3. **Extender cuando sea necesario**: Si un componente necesita funcionalidad adicional, extenderlo en lugar de duplicarlo
4. **Mantener consistencia**: Usar los mismos componentes en toda la aplicación

### ❌ NO HACER

1. **NO duplicar código**: No crear botones, diálogos o formularios desde cero si ya existe un componente
2. **NO crear variantes innecesarias**: No crear `CustomButton` si `PrimaryButton` o `SecondaryButton` funcionan
3. **NO mezclar patrones**: No usar diferentes componentes para la misma funcionalidad en diferentes partes

## Ejemplos

### ✅ CORRECTO: Reutilizar FormActions
```tsx
import { FormActions } from "../components/widgets/FormActions";

<FormActions
  onCancel={handleCancel}
  onSave={handleSave}
  saveLabel="Guardar"
/>
```

### ❌ INCORRECTO: Duplicar botones
```tsx
// ❌ NO hacer esto
<div className="flex justify-end gap-3">
  <button onClick={handleCancel}>Cancelar</button>
  <button onClick={handleSave}>Guardar</button>
</div>
```

### ✅ CORRECTO: Reutilizar ConfirmDialog
```tsx
import { ConfirmDialog } from "../components/widgets/ConfirmDialog";

<ConfirmDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  title="¿Confirmar acción?"
  description="Esta acción no se puede deshacer."
  variant="destructive"
  onConfirm={handleConfirm}
/>
```

### ❌ INCORRECTO: Crear diálogo desde cero
```tsx
// ❌ NO hacer esto
<Dialog open={showDialog}>
  <DialogContent>
    <DialogTitle>¿Confirmar?</DialogTitle>
    <DialogDescription>...</DialogDescription>
    <button onClick={handleConfirm}>Confirmar</button>
  </DialogContent>
</Dialog>
```

## Checklist Antes de Crear un Componente

Antes de crear un nuevo componente, pregúntate:

1. [ ] ¿Existe un componente similar en `src/components/widgets/`?
2. [ ] ¿Puedo extender un componente existente en lugar de crear uno nuevo?
3. [ ] ¿Este componente será usado en más de un lugar?
4. [ ] ¿Estoy siguiendo el patrón establecido en el proyecto?
5. [ ] **Navegación en Modales**: Si mi diálogo tiene sub-vistas (ej: Lista -> Editar), ¿estoy usando "View Swapping" en un solo `EntityDialog` en lugar de abrir un nuevo diálogo sobre otro?

## Patrón: Modal Content Stepping (Expert UX)

**SIEMPRE** prefiere cambiar el contenido dentro de un `EntityDialog` existente en lugar de abrir diálogos anidados.

### Cómo Implementar:
1. Definir un estado de vista: `type ViewMode = 'list' | 'form' | 'confirm'`.
2. Usar las props de navegación de `EntityDialog`:
```tsx
<EntityDialog
  title={view === 'list' ? 'Gestionar' : 'Editar'}
  showBackButton={view !== 'list'}
  onBack={() => setView('list')}
  // ...
>
  {view === 'list' ? <StaticList /> : <DynamicForm />}
</EntityDialog>
```

### Por qué:
- Evita el parpadeo del overlay oscuro.
- Mantiene la continuidad visual y el foco de accesibilidad.
- Se siente como una navegación "nativa" y rápida.

Si todas las respuestas son "sí", entonces reutiliza o extiende. Si no, considera crear el componente en `src/components/widgets/` para que sea reutilizable.

## Límites entre features (ownership)

**Reutilizar un componente genérico** (Button, ConfirmDialog, DataTable) en cualquier módulo es correcto.

**No es correcto** que un módulo A importe pantallas, diálogos o drawers completos del módulo B solo porque “se parecen”. Eso acopla dominios y rompe la coherencia (ej.: usar un diálogo de creación de usuario en la sección de productos).

### Regla general: ownership por entidad

- La **pantalla, drawer o diálogo de detalle de una entidad** pertenece al **módulo que posee esa entidad**.
- Si otro módulo necesita mostrar lo mismo:
  - **Opción A**: Importar el componente del módulo dueño de la entidad (un solo lugar como dueño).
  - **Opción B**: Compartir solo **subcomponentes** (tabs, resúmenes) en un lugar común o en el módulo dueño, y cada feature compone su propia pantalla.

### Checklist antes de importar un componente de otra feature

1. ¿Es un componente **genérico** (UI, widget sin lógica de negocio de la otra feature)? → Reutilizar está bien.
2. ¿Es una **pantalla/diálogo/drawer** que representa una entidad cuyo dueño es **otra feature**? → No importar desde esa feature; el componente debe vivir en el módulo dueño de la entidad, o se comparten solo subcomponentes.

## Ubicación de Componentes

- **`src/components/ui/`** - Componentes base de shadcn/ui (Input, Button, Card, etc.)
- **`src/components/widgets/`** - Componentes reutilizables específicos del proyecto
- **`src/features/*/`** - Componentes específicos de una feature (solo si no son reutilizables)

## Beneficios

- 🔄 **Consistencia**: Misma apariencia y comportamiento en toda la app
- ⚡ **Mantenibilidad**: Cambios en un lugar se reflejan en todos los usos
- 🚀 **Velocidad**: Desarrollo más rápido al reutilizar
- 🐛 **Menos bugs**: Componentes probados y usados en múltiples lugares


