# Patrón de Detail Views con Formularios

## Objetivo

Este documento define el patrón estándar para crear vistas de detalle con formularios que sean consistentes, mantenibles y eviten problemas comunes como:
- Footers inconsistentes
- Dobles footers
- Detección de cambios duplicada
- Ubicación inconsistente de botones

## Relación con Reglas de Formularios

Este patrón **extiende y especializa** las reglas generales de formularios definidas en [`ai-rules.md`](./ai-rules.md#formularios-grandes-y-ux). 

**Todas las reglas de formularios se aplican:**
- ✅ Un único `useForm` en el componente padre
- ✅ `FormProvider` y `useFormContext` para tabs
- ✅ Botones Guardar/Cancelar únicos y globales
- ✅ Un único schema Zod para todo el formulario
- ✅ React Hook Form + Zod con `zodResolver`
- ✅ Estado del formulario solo en React Hook Form (no en Zustand)

**Este patrón agrega:**
- Componente reutilizable `DetailFooter` para consistencia visual
- Hook `useFormChanges` para detección de cambios genérica
- Template de referencia para desarrollo rápido

## Patrón Complementario: Modal Content Stepping

Para gestores de entidades que ocurren dentro de un diálogo (ej: Tipos de Ubicación, Roles, etc.), consulta el patrón **Modal Content Stepping** en [`component-reuse.rules.md`](./component-reuse.rules.md#patrón-modal-content-stepping-expert-ux). 

Mientras que este documento se enfoca en **páginas de detalle** completas, el patrón de Modales aplica la misma filosofía de "View Swapping" para evitar diálogos anidados.

## Componentes y Hooks Requeridos

### 1. `DetailFooter` Component

**Ubicación:** `src/components/widgets/DetailFooter.tsx`

**Uso obligatorio** para todos los footers de detail views.

```tsx
import { DetailFooter } from "../../../../components/widgets/DetailFooter";

<DetailFooter
  onCancel={handleCancel}
  onSave={handleSave}
  isSubmitting={isSubmitting}
  hasChanges={hasChanges}
  justSaved={justSaved}
  showFooter={isEditing}
/>
```

**Props:**
- `onCancel: () => void` - Función para cancelar
- `onSave: () => void` - Función para guardar
- `isSubmitting?: boolean` - Estado de guardado
- `hasChanges?: boolean` - Si hay cambios detectados (default: true)
- `justSaved?: boolean` - Si se acaba de guardar
- `saveLabel?: string` - Label del botón guardar (default: "Guardar")
- `cancelLabel?: string` - Label del botón cancelar (default: "Cancelar")
- `showFooter?: boolean` - Control de visibilidad (default: true)

**Características:**
- ✅ Altura y padding consistentes (`px-6 py-4 shrink-0`)
- ✅ Borde superior consistente (`border-t border-gray-200`)
- ✅ Layout consistente (`max-w-6xl mx-auto flex justify-end gap-3`)
- ✅ Deshabilita botón si no hay cambios
- ✅ Feedback visual al guardar (verde con check)

### 2. `useFormChanges` Hook

**Ubicación:** `src/hooks/useFormChanges.ts`

**Uso obligatorio** para detectar cambios en formularios.

```tsx
import { useFormChanges } from "../../../../hooks/useFormChanges";

const form = useForm<FormData>({...});
const [originalData, setOriginalData] = useState<FormData | null>(null);

const { hasChanges } = useFormChanges(form, originalData, mode);
```

**Parámetros:**
- `form: UseFormReturn<T>` - Instancia de useForm
- `originalData: T | null` - Datos originales para comparar
- `mode?: "view" | "edit" | "create"` - Modo del formulario

**Retorna:**
- `hasChanges: boolean` - Si hay cambios detectados
- `watchedValues: T` - Valores actuales del formulario

**Características:**
- ✅ Comparación profunda de todos los campos
- ✅ Maneja null/undefined correctamente
- ✅ Maneja arrays y objetos
- ✅ En modo "create" siempre retorna `true`

## Consistencia con Reglas de Formularios

Este patrón es **100% consistente** con las reglas de formularios en `ai-rules.md`:

✅ **Un único `useForm`** en el componente padre  
✅ **`FormProvider`** envolviendo los tabs  
✅ **Tabs usan `useFormContext()`** en lugar de crear su propio `useForm`  
✅ **Botones Guardar/Cancelar únicos y globales** (en el padre, no en tabs)  
✅ **Un único schema Zod** para todo el formulario  
✅ **React Hook Form + Zod** para validación  
✅ **Estado del formulario solo en React Hook Form** (no en Zustand)  
✅ **Submit maneja todo el formulario como unidad lógica**

Este patrón **extiende** las reglas generales agregando:
- Componente reutilizable `DetailFooter` para consistencia visual
- Hook `useFormChanges` para detección de cambios genérica
- Template de referencia para desarrollo rápido

## Estructura Requerida de Detail Views

### Patrón Completo

```tsx
import { PageHeader } from "../../../../layouts/PageHeader";
import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "../../../../components/ui/ScrollArea";
import { DetailFooter } from "../../../../components/widgets/DetailFooter";
import { useFormChanges } from "../../../../hooks/useFormChanges";
import { toast } from "sonner";

export function EntityDetail({ 
  entity, 
  onBack, 
  onSave, 
  mode = "view"
}: EntityDetailProps) {
  const [isEditing, setIsEditing] = useState(mode === "edit" || mode === "create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [originalData, setOriginalData] = useState<EntityFormData | null>(null);

  // Update isEditing when mode changes
  useEffect(() => {
    setIsEditing(mode === "edit" || mode === "create");
  }, [mode]);

  // Single form instance shared across all tabs
  const form = useForm<EntityFormData>({
    resolver: zodResolver(entitySchema),
    defaultValues: { /* ... */ },
  });

  // Use hook for change detection
  const { hasChanges } = useFormChanges(form, originalData, mode);

  // Reset form when entity changes
  useEffect(() => {
    if (entity) {
      const newFormData: EntityFormData = {
        // Map entity to form data
      };
      form.reset(newFormData);
      setOriginalData(newFormData);
      setJustSaved(false);
    }
  }, [entity, form]);

  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setIsSubmitting(true);
    setJustSaved(false);
    
    try {
      const formData = form.getValues();
      await onSave(formData);
      
      // Update original data to reflect saved state
      setOriginalData({ ...formData });
      setJustSaved(true);
      
      toast.success('Guardado correctamente');
      
      if (mode === "create") {
        onBack();
      } else {
        setIsEditing(false);
      }
      
      setTimeout(() => setJustSaved(false), 3000);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onBack();
  };

  return (
    <FormProvider {...form}>
      <div className="flex flex-col h-full">
        <PageHeader tabs={[...]} />
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 bg-gray-50 pb-24">
              <div className="max-w-6xl mx-auto">
                {/* Tabs content */}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <DetailFooter
          onCancel={handleCancel}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          justSaved={justSaved}
          showFooter={isEditing}
        />
      </div>
    </FormProvider>
  );
}
```

## Checklist Obligatorio

Antes de crear o modificar un Detail View, verifica:

### Formularios (Consistente con ai-rules.md)
- [ ] ¿Hay un único `useForm` en el componente padre? (REQUERIDO)
- [ ] ¿Usa `FormProvider` para envolver los tabs? (REQUERIDO)
- [ ] ¿Los tabs usan `useFormContext()` en lugar de crear su propio `useForm`? (REQUERIDO)
- [ ] ¿Usa un único schema Zod para todo el formulario? (REQUERIDO)
- [ ] ¿Usa React Hook Form + Zod con `zodResolver`? (REQUERIDO)
- [ ] ¿El estado del formulario está solo en React Hook Form (no en Zustand)? (REQUERIDO)
- [ ] ¿El submit maneja todo el formulario como unidad lógica? (REQUERIDO)

### Footer
- [ ] ¿Usa `DetailFooter` component?
- [ ] ¿El footer está fuera del `ScrollArea`?
- [ ] ¿El footer tiene `showFooter={isEditing}` para controlar visibilidad?
- [ ] ¿No hay doble footer (verificar que no haya otro footer dentro del contenido)?

### Detección de Cambios
- [ ] ¿Usa `useFormChanges` hook?
- [ ] ¿Guarda `originalData` cuando se carga/resetea el formulario?
- [ ] ¿Actualiza `originalData` después de guardar exitosamente?
- [ ] ¿El botón Guardar está deshabilitado si `!hasChanges`?

### Estado
- [ ] ¿Tiene `isSubmitting` para el estado de guardado?
- [ ] ¿Tiene `justSaved` para feedback visual?
- [ ] ¿Actualiza `justSaved` después de guardar exitosamente?

### Layout
- [ ] ¿Usa `ScrollArea` para el contenido?
- [ ] ¿El contenido tiene `pb-24` para espacio del footer?
- [ ] ¿El footer está fuera del `ScrollArea`?
- [ ] ¿Usa `max-w-6xl mx-auto` para el ancho máximo?

## Errores Comunes a Evitar

### ❌ NO HACER

1. **Crear footer personalizado**
   ```tsx
   // ❌ NO hacer esto
   <div className="border-t...">
     <button>Guardar</button>
   </div>
   ```
   ✅ **HACER:** Usar `DetailFooter`

2. **Detección de cambios manual**
   ```tsx
   // ❌ NO hacer esto
   const hasChanges = useMemo(() => {
     return form.watch('field1') !== original.field1 || ...
   }, [...]);
   ```
   ✅ **HACER:** Usar `useFormChanges`

3. **Footer dentro del ScrollArea**
   ```tsx
   // ❌ NO hacer esto
   <ScrollArea>
     <Content />
     <Footer /> {/* Footer dentro del scroll */}
   </ScrollArea>
   ```
   ✅ **HACER:** Footer fuera del ScrollArea

4. **Múltiples useForm en tabs**
   ```tsx
   // ❌ NO hacer esto
   function Tab1() {
     const form = useForm(); // ❌
   }
   ```
   ✅ **HACER:** Usar `useFormContext()` en tabs

5. **No actualizar originalData después de guardar**
   ```tsx
   // ❌ NO hacer esto
   await onSave(data);
   // Falta: setOriginalData({ ...formData });
   ```
   ✅ **HACER:** Actualizar `originalData` después de guardar

6. **Loading states que desmontan componentes**
   ```tsx
   // ❌ NO hacer esto
   const [loading, setLoading] = useState(false);
   
   {!loading && <ComponenteImportante />}  // Se desmonta durante loading
   
   // ❌ Tampoco hacer esto
   {vehicle && !loadingAssignment && (
     <CurrentAssignmentCard />  // Se desmonta mientras carga
   )}
   ```
   ✅ **HACER:** Mantener componentes montados, actualizar datos silenciosamente
   ```tsx
   // ✅ Componente siempre montado
   {vehicle && (
     <CurrentAssignmentCard 
       data={currentAssignment}  // Se actualiza sin desmontar
     />
   )}
   ```
   
   **Razón:** Desmontar/montar componentes causa:
   - 🔴 Parpadeos visuales (flickering)
   - 🔴 Pérdida de estado interno del componente
   - 🔴 Re-renders innecesarios
   - 🔴 Mala experiencia de usuario
   
   **Solución:** Usar `useRef` para evitar fetches duplicados y mantener componentes montados

## Ejemplos de Referencia

Componentes que siguen este patrón correctamente:
- ✅ `src/features/carriers/CarrierDetail.tsx`
- ✅ `src/features/fleet/entities/vehicles/VehicleDetail.tsx` - Incluye carga de datos sin desmontar componentes
- ✅ `src/features/fleet/entities/trailers/TrailerDetail.tsx`
- ✅ `src/features/settings/entities/organizations/OrganizationDetail.tsx`

## Beneficios

- 🔄 **Consistencia**: Mismo look & feel en toda la aplicación
- ⚡ **Mantenibilidad**: Cambios en un lugar se reflejan en todos
- 🐛 **Menos bugs**: Componentes probados y reutilizados
- 📏 **Altura consistente**: Mismo padding y layout siempre
- 🎯 **Detección confiable**: Lógica de cambios centralizada y probada
