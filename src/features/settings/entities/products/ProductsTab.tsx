import { DataTable } from '../../../../components/widgets/DataTable/DataTable'
import type {
  DataTableColumn,
  DataTableAction,
  DataTableBulkAction,
} from '../../../../components/widgets/DataTable/types'
import { Badge } from '../../../../components/ui/Badge'
import { Pencil, Trash2, RotateCcw } from 'lucide-react'
import type { Product } from '../../../../types/database.types'

interface ProductsTabProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onReactivate: (product: Product) => void
  onBulkDelete: (productIds: string[]) => void
}

/**
 * ProductsTab - Displays products in a data table with CRUD actions
 * Handles active/inactive products with conditional actions (delete/reactivate)
 */

export function ProductsTab({
  products,
  onEdit,
  onDelete,
  onReactivate,
  onBulkDelete,
}: ProductsTabProps) {
  const productsActions: DataTableAction<Product>[] = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: onEdit,
      title: 'Editar',
    },
    {
      icon: (item) =>
        item.is_active ? (
          <Trash2 className='w-3.5 h-3.5 text-red-600' />
        ) : (
          <RotateCcw className='w-3.5 h-3.5 text-green-600' />
        ),
      onClick: (item) => (item.is_active ? onDelete(item) : onReactivate(item)),
      variant: (item) => (item.is_active ? 'destructive' : 'default'),
      title: (item) => (item.is_active ? 'Eliminar' : 'Reactivar'),
    },
  ]

  const productsBulkActions: DataTableBulkAction[] = [
    {
      label: 'Eliminar',
      icon: <Trash2 className='w-4 h-4' />,
      onClick: onBulkDelete,
      variant: 'destructive',
    },
  ]

  const productsColumns: DataTableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (item) => (
        <div>
          <div className='text-sm font-medium text-primary'>{item.name}</div>
          <div className='text-xs text-gray-500'>ID: {item.id}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (item) => (
        <span
          className='text-xs text-gray-600 line-clamp-2 max-w-xs'
          title={item.description || 'Sin descripción'}
        >
          {item.description || 'Sin descripción'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (item) => (
        <Badge
          variant={item.is_active ? 'default' : 'secondary'}
          className={
            item.is_active
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs'
          }
        >
          {item.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
      width: 'w-24',
    },
  ]

  return (
    <DataTable
      data={products}
      columns={productsColumns}
      getRowId={(item) => item.id.toString()}
      actions={productsActions}
      bulkActions={productsBulkActions}
      itemsPerPage={10}
      emptyMessage='No hay productos para mostrar'
    />
  )
}
