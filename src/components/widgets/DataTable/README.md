# DataTable Component

Componente de tabla genérico y reutilizable para ColdSync, basado en la implementación de Ubicaciones.

## Características

- ✅ **Multiselect con header transformable** - El header cambia cuando hay elementos seleccionados
- ✅ **Paginación inteligente** - Con navegación completa (primera, anterior, siguiente, última)
- ✅ **Acciones por fila** - Botones de acción (editar, eliminar, etc.)
- ✅ **Acciones masivas** - Acciones sobre elementos seleccionados
- ✅ **Configuración flexible** - Columnas totalmente personalizables
- ✅ **Diseño consistente** - Sigue el design system de ColdSync (#004ef0, #eff5fd, #dde9fb)

## Uso Básico

```tsx
import { DataTable, DataTableColumn, DataTableAction, DataTableBulkAction } from "../DataTable";

// 1. Define tus columnas
const columns: DataTableColumn<MyDataType>[] = [
  {
    key: "name",
    header: "Nombre",
    render: (item) => (
      <span className="text-sm text-gray-900">{item.name}</span>
    ),
  },
  {
    key: "status",
    header: "Estado",
    align: "center",
    render: (item) => (
      <Badge variant="default">{item.status}</Badge>
    ),
  },
];

// 2. Define acciones de fila
const actions: DataTableAction<MyDataType>[] = [
  {
    icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
    onClick: (item) => handleEdit(item),
    title: "Editar",
  },
  {
    icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
    onClick: (item) => handleDelete(item),
    variant: "destructive",
    title: "Eliminar",
  },
];

// 3. Define acciones masivas
const bulkActions: DataTableBulkAction[] = [
  {
    label: "Cancelar",
    onClick: () => {},
  },
  {
    label: "Eliminar",
    icon: <Trash2 className="w-4 h-4" />,
    onClick: (selectedIds) => handleBulkDelete(selectedIds),
    variant: "destructive",
  },
];

// 4. Usa el componente
<DataTable
  data={myData}
  columns={columns}
  getRowId={(item) => item.id}
  actions={actions}
  bulkActions={bulkActions}
  itemsPerPage={10}
  totalLabel="elementos"
  emptyMessage="No hay datos disponibles"
/>
```

## Props

### DataTable Props

| Prop | Tipo | Descripción | Requerido |
|------|------|-------------|-----------|
| `data` | `T[]` | Array de datos a mostrar | ✅ |
| `columns` | `DataTableColumn<T>[]` | Configuración de columnas | ✅ |
| `getRowId` | `(item: T) => string` | Función para obtener el ID único de cada fila | ✅ |
| `actions` | `DataTableAction<T>[]` | Acciones disponibles para cada fila | ❌ |
| `bulkActions` | `DataTableBulkAction[]` | Acciones masivas cuando hay elementos seleccionados | ❌ |
| `itemsPerPage` | `number` | Elementos por página (default: 10) | ❌ |
| `emptyMessage` | `string` | Mensaje cuando no hay datos | ❌ |
| `totalLabel` | `string` | Label para el contador de paginación | ❌ |

### DataTableColumn

```tsx
interface DataTableColumn<T> {
  key: string;                    // ID único de la columna
  header: string;                 // Texto del encabezado
  width?: string;                 // Ancho de la columna (ej: "200px", "w-24")
  align?: "left" | "center" | "right";  // Alineación
  render: (item: T) => ReactNode; // Función de renderizado
}
```

### DataTableAction

```tsx
interface DataTableAction<T> {
  icon: ReactNode;                // Icono del botón
  onClick: (item: T) => void;     // Handler al hacer click
  variant?: "default" | "destructive";  // Estilo del botón
  title?: string;                 // Tooltip
}
```

### DataTableBulkAction

```tsx
interface DataTableBulkAction {
  label: string;                  // Texto del botón
  icon?: ReactNode;               // Icono opcional
  onClick: (selectedIds: string[]) => void;  // Handler con IDs seleccionados
  variant?: "default" | "destructive";       // Estilo del botón
}
```

## Ejemplo Completo - Ubicaciones

Ver `/components/ubicaciones/UbicacionesList.tsx` para el ejemplo completo implementado.

## Migrando Tablas Existentes

Para migrar una tabla existente a DataTable:

1. **Extraer la estructura de datos**
   - Identificar el tipo de datos
   - Asegurar que tenga un campo `id` único

2. **Convertir columnas**
   ```tsx
   // Antes
   <th>Nombre</th>
   <td>{item.name}</td>
   
   // Después
   {
     key: "name",
     header: "Nombre",
     render: (item) => <span>{item.name}</span>
   }
   ```

3. **Convertir acciones**
   ```tsx
   // Antes
   <Button onClick={() => handleEdit(item)}>
     <Pencil />
   </Button>
   
   // Después
   {
     icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
     onClick: (item) => handleEdit(item)
   }
   ```

4. **Reemplazar el código de la tabla**
   - Eliminar todo el código de tabla, paginación y selección
   - Usar `<DataTable />` con la configuración

## Próximas Mejoras

- [ ] Ordenamiento de columnas
- [ ] Filtrado por columna
- [ ] Exportación a CSV/Excel
- [ ] Redimensionamiento de columnas
- [ ] Columnas fijas (sticky)
- [ ] Virtualización para grandes datasets
