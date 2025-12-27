# 📦 SmartSelect Component

## Descripción

El **SmartSelect** es un componente reutilizable de selección que soporta tres modos diferentes:

1. **🔵 Single Select**: Selección simple con búsqueda
2. **✅ Multi Select**: Selección múltiple con checkboxes
3. **🧠 Smart Select**: Selección inteligente con scores, filtros y metadata

## Ubicación de Archivos

```
/components/common/
├── SmartSelect.tsx          # Componente principal
├── SmartSelectExamples.tsx  # Ejemplos de uso
└── SMARTSELECT_README.md    # Documentación
```

## Ver la Demo

Para ver todos los ejemplos funcionando, importa temporalmente el componente de demo:

```tsx
// En App.tsx, añade:
import { SmartSelectDemo } from "./components/SmartSelectDemo";

// Y en el renderView(), añade:
case "demo":
  return <SmartSelectDemo />;
```

Luego navega manualmente cambiando `activeView` a `"demo"` o crea un botón temporal.

---

## 📖 Guía de Uso

### 1. Importar el Componente

```tsx
import { SmartSelect, SmartOption } from "./components/common/SmartSelect";
```

### 2. Tipos Disponibles

```typescript
// Opción básica
interface BaseOption {
  value: string;
  label: string;
}

// Opción con metadata (para modo smart)
interface SmartOption extends BaseOption {
  subtitle?: string;        // Texto secundario
  score?: number;           // Puntuación (0-100)
  utilization?: number;     // Porcentaje de utilización
  tags?: string[];          // Etiquetas/badges
  metadata?: Array<{        // Metadata adicional
    label: string;
    value: string;
  }>;
  secondaryId?: string;     // ID secundario
}

// Modos disponibles
type SelectMode = 'single' | 'multi' | 'smart';
```

---

## 🔵 Modo 1: Single Select

**Uso ideal**: Campos de formulario estándar, selección única

```tsx
const [selectedValue, setSelectedValue] = useState("");

<SmartSelect
  label="Tipo de Reefer"
  id="reefer-type"
  mode="single"
  required
  placeholder="Seleccionar tipo..."
  searchPlaceholder="Buscar tipo de reefer..."
  options={[
    { value: "reefer-16m", label: "Reefer 16m" },
    { value: "dry-van", label: "Dry Van 16m" },
    { value: "multi-temp", label: "Multi-Temp 14.6m" },
  ]}
  value={selectedValue}
  onChange={(value) => setSelectedValue(value as string)}
/>
```

**Características**:
- ✅ Búsqueda en tiempo real
- ✅ Selección única
- ✅ Se cierra automáticamente al seleccionar
- ✅ Compatible con formularios

---

## ✅ Modo 2: Multi Select

**Uso ideal**: Filtros, categorías múltiples, tags

```tsx
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

<SmartSelect
  label="Categorías de Producto"
  id="categories"
  mode="multi"
  placeholder="Seleccionar categorías..."
  searchPlaceholder="Buscar categoría..."
  options={[
    { value: "farmaceuticos", label: "Farmacéuticos" },
    { value: "vacunas", label: "Vacunas" },
    { value: "lacteos", label: "Productos Lácteos" },
  ]}
  value={selectedCategories}
  onChange={(value) => setSelectedCategories(value as string[])}
/>
```

**Características**:
- ✅ Checkboxes para selección múltiple
- ✅ Contador de seleccionados en el botón
- ✅ No se cierra al seleccionar (permite múltiples)
- ✅ Búsqueda filtrada

---

## 🧠 Modo 3: Smart Select

**Uso ideal**: Asignación de recursos (remolques, conductores, transportistas), matching inteligente

```tsx
const [selectedResource, setSelectedResource] = useState("");
const [activeFilter, setActiveFilter] = useState("mejor-match");

<SmartSelect
  label="Asignar Remolque"
  id="trailer-assignment"
  mode="smart"
  placeholder="Buscar remolque..."
  searchPlaceholder="Buscar por remolque, conductor, transportista..."
  options={[
    {
      value: "CCE-T203",
      label: "CCE-T203",
      secondaryId: "CCE-103",
      score: 97,
      utilization: 103,
      subtitle: "Multi-Temp 14.6m • David García • FrostLine Logistics",
      tags: [
        "Buena utilización",
        "Temperatura exacta (Comp. 1)",
        "Bajo cupo mínimo"
      ],
      metadata: [
        { label: "Remolque", value: "multi-temperatura (flexible)" }
      ]
    },
    {
      value: "CCE-T204",
      label: "CCE-T204",
      secondaryId: "CCE-104",
      score: 94,
      utilization: 94,
      subtitle: "Reefer 16m • David Thompson • Arctic Transport Inc",
      tags: ["Utilización óptima", "Temperatura exacta"],
    }
  ]}
  filters={[
    { id: "mejor-match", label: "Mejor Match" },
    { id: "disponibles", label: "Disponibles" },
    { id: "todos", label: "Todos" }
  ]}
  activeFilter={activeFilter}
  onFilterChange={setActiveFilter}
  value={selectedResource}
  onChange={(value) => setSelectedResource(value as string)}
  maxHeight="480px"
/>
```

**Características**:
- ✅ Visualización de scores y porcentajes
- ✅ Tags/badges para metadata
- ✅ Subtítulos con información contextual
- ✅ Filtros por tabs (Mejor Match, Disponibles, Todos)
- ✅ IDs secundarios
- ✅ Búsqueda avanzada (busca en labels, subtitles, tags, IDs)

---

## 🎨 Props del Componente

| Prop | Tipo | Por defecto | Descripción |
|------|------|-------------|-------------|
| `mode` | `'single' \| 'multi' \| 'smart'` | `'single'` | Modo de selección |
| `label` | `string` | - | Label del campo |
| `id` | `string` | - | ID del input |
| `placeholder` | `string` | `'Seleccionar...'` | Texto del placeholder |
| `required` | `boolean` | `false` | Campo requerido (muestra *) |
| `disabled` | `boolean` | `false` | Deshabilitar el campo |
| `helpText` | `string` | - | Texto de ayuda debajo del campo |
| `error` | `string` | - | Mensaje de error |
| `options` | `SmartOption[]` | **requerido** | Array de opciones |
| `value` | `string \| string[]` | - | Valor seleccionado |
| `onChange` | `(value: string \| string[]) => void` | - | Callback al cambiar selección |
| `searchable` | `boolean` | `true` | Habilitar búsqueda |
| `searchPlaceholder` | `string` | `'Buscar...'` | Placeholder de búsqueda |
| `filters` | `Array<{id: string, label: string}>` | - | Tabs de filtrado (solo smart) |
| `activeFilter` | `string` | - | Filtro activo |
| `onFilterChange` | `(filterId: string) => void` | - | Callback al cambiar filtro |
| `maxHeight` | `string` | `'320px'` | Altura máxima del dropdown |
| `renderOption` | `(option: SmartOption) => React.ReactNode` | - | Renderizado personalizado |

---

## 💡 Ejemplos de Uso Práctico

### En un Formulario de Transportista

```tsx
<Card className="p-6">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    <SmartSelect
      label="Tipo de Transportista"
      id="tipo-transportista"
      mode="single"
      required
      options={[
        { value: "propia", label: "Flota Propia" },
        { value: "tercero", label: "Tercero" }
      ]}
      value={formData.tipoTransportista}
      onChange={(val) => setFormData({...formData, tipoTransportista: val})}
    />

    <SmartSelect
      label="Categorías de Carga"
      id="categorias"
      mode="multi"
      options={categoriesOptions}
      value={formData.categorias}
      onChange={(val) => setFormData({...formData, categorias: val})}
    />
  </div>
</Card>
```

### En Torre de Control (Asignación)

```tsx
<SmartSelect
  label="Asignar Remolque"
  mode="smart"
  options={availableTrailers}
  filters={[
    { id: "mejor-match", label: "Mejor Match" },
    { id: "disponibles", label: "Disponibles" }
  ]}
  activeFilter={filter}
  onFilterChange={setFilter}
  value={assignment.trailer}
  onChange={(val) => handleAssign(val)}
/>
```

---

## 🎯 Casos de Uso Recomendados

### Single Select
- ✅ Campos de formulario (País, Estado, Tipo, etc.)
- ✅ Filtros de tabla (ordenar por, estado, etc.)
- ✅ Selección de plantillas

### Multi Select  
- ✅ Filtros de búsqueda avanzada
- ✅ Selección de categorías/tags
- ✅ Permisos y roles
- ✅ Tipos de productos permitidos

### Smart Select
- ✅ Asignación de remolques a órdenes
- ✅ Selección de conductores para rutas
- ✅ Matching de transportistas
- ✅ Asignación de recursos con scoring
- ✅ Recomendaciones inteligentes

---

## 🔧 Personalización Avanzada

### Renderizado Personalizado

```tsx
<SmartSelect
  mode="single"
  options={options}
  renderOption={(option) => (
    <div className="p-3 hover:bg-gray-50 cursor-pointer">
      <div className="flex items-center gap-3">
        <img src={option.image} className="w-10 h-10 rounded" />
        <div>
          <div className="font-medium">{option.label}</div>
          <div className="text-xs text-gray-500">{option.subtitle}</div>
        </div>
      </div>
    </div>
  )}
/>
```

---

## 🎨 Consistencia con el Design System

El componente respeta los estándares de ColdSync:

- ✅ Labels: `text-xs text-gray-600`
- ✅ Altura de input: `h-9` (36px)
- ✅ Border radius: `rounded-md`
- ✅ Focus state: `ring-2 ring-blue-100`
- ✅ Disabled state: `bg-gray-50 text-gray-500`
- ✅ Required indicator: asterisco rojo
- ✅ Help text: `text-xs text-gray-500`
- ✅ Error state: `text-xs text-red-500`

---

## 📝 Notas Importantes

1. **Valores**: En modo `single`, el valor es `string`. En modo `multi`, es `string[]`.
2. **Búsqueda**: La búsqueda filtra por `label`, `subtitle`, `secondaryId` y `tags`.
3. **Filtros**: Los filtros solo funcionan en modo `smart` y debes manejar la lógica de filtrado externamente.
4. **Accesibilidad**: El componente incluye `aria-invalid` y roles apropiados.
5. **Responsive**: El dropdown se adapta al ancho del contenedor.

---

## 🚀 Roadmap de Mejoras Futuras

- [ ] Modo "combobox" (permite crear nuevas opciones)
- [ ] Soporte para grupos de opciones
- [ ] Virtual scrolling para listas grandes (>1000 items)
- [ ] Modo "async" con debounce para búsquedas en servidor
- [ ] Drag & drop para reordenar en multi-select
- [ ] Export/import de selecciones
- [ ] Shortcuts de teclado avanzados

---

## 🐛 Troubleshooting

**Problema**: El dropdown se corta en contenedores con `overflow: hidden`  
**Solución**: Usa React Portal o ajusta el `maxHeight`

**Problema**: La búsqueda no encuentra resultados  
**Solución**: Verifica que las opciones tengan `label` y que la búsqueda esté habilitada

**Problema**: En modo multi, los valores no se actualizan  
**Solución**: Asegúrate de pasar un array y usar `value as string[]` en el onChange

---

## 📧 Contacto

Para dudas o mejoras, consulta la documentación del proyecto ColdSync.
