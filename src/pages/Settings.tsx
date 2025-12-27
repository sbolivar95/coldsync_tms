import { PageHeader } from '../layouts/PageHeader'
import { Button } from '../components/ui/Button'
import { Filter, Pencil, Trash2 } from 'lucide-react'
import { useState, useImperativeHandle, forwardRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { DataTable } from '../components/widgets/DataTable/DataTable'
import type {
  DataTableColumn,
  DataTableAction,
  DataTableBulkAction,
} from '../components/widgets/DataTable/types'
import { Badge } from '../components/ui/Badge'
import { ThermalProfileDialog } from '../features/settings/ThermalProfileDialog'
import { ProductDialog } from '../features/settings/ProductDialog'
import { UserDialog } from '../features/settings/UserDialog'
import {
  mockProducts,
  mockThermalProfiles,
  mockUsers,
  type Product,
  type ThermalProfile,
  type User,
} from '../lib/mockData'
import { useAppStore } from '../stores/useAppStore'

// Using centralized mockUsers from mockData.ts

export interface SettingsRef {
  handleCreate: () => void
}

export const Settings = forwardRef<SettingsRef, {}>((_, ref) => {
  const { setSettingsActiveTab, registerCreateHandler } = useAppStore()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('usuarios')
  const [thermalProfileDialogOpen, setThermalProfileDialogOpen] =
    useState(false)
  const [selectedThermalProfile, setSelectedThermalProfile] = useState<
    ThermalProfile | undefined
  >(undefined)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(
    undefined
  )
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSettingsActiveTab(tab)
  }

  // Función pública para abrir diálogo de creación según el tab activo
  const handleCreate = () => {
    switch (activeTab) {
      case 'productos':
        setSelectedProduct(undefined)
        setProductDialogOpen(true)
        break
      case 'perfil-termico':
        setSelectedThermalProfile(undefined)
        setThermalProfileDialogOpen(true)
        break
      case 'usuarios':
        setSelectedUser(undefined)
        setUserDialogOpen(true)
        break
    }
  }

  // Exponer función de creación al componente padre
  useImperativeHandle(ref, () => ({
    handleCreate,
  }))

  // Registrar handler de creación
  useEffect(() => {
    registerCreateHandler(location.pathname, handleCreate)
    return () => {
      // Cleanup si es necesario
    }
  }, [location.pathname, activeTab])

  // Row actions for products
  const productsActions: DataTableAction<Product>[] = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (product) => {
        setSelectedProduct(product)
        setProductDialogOpen(true)
      },
      title: 'Editar',
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      onClick: (product) => console.log('Eliminar producto:', product),
      variant: 'destructive',
      title: 'Eliminar',
    },
  ]

  const productsBulkActions: DataTableBulkAction[] = [
    {
      label: 'Eliminar seleccionadas',
      icon: <Trash2 className='w-4 h-4' />,
      onClick: (selectedIds) => console.log('Eliminar productos:', selectedIds),
      variant: 'destructive',
    },
  ]

  // Acciones de fila para perfiles térmicos
  const perfilesActions: DataTableAction<ThermalProfile>[] = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (profile) => {
        setSelectedThermalProfile(profile)
        setThermalProfileDialogOpen(true)
      },
      title: 'Editar',
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      onClick: (profile) => console.log('Eliminar perfil térmico:', profile),
      variant: 'destructive',
      title: 'Eliminar',
    },
  ]

  const perfilesBulkActions: DataTableBulkAction[] = [
    {
      label: 'Eliminar seleccionadas',
      icon: <Trash2 className='w-4 h-4' />,
      onClick: (selectedIds) => console.log('Eliminar perfiles:', selectedIds),
      variant: 'destructive',
    },
  ]

  // Row actions for users
  const usersActions: DataTableAction<User>[] = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (user) => {
        setSelectedUser(user)
        setUserDialogOpen(true)
      },
      title: 'Editar',
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      onClick: (user) => console.log('Eliminar usuario:', user),
      variant: 'destructive',
      title: 'Eliminar',
    },
  ]

  const usersBulkActions: DataTableBulkAction[] = [
    {
      label: 'Eliminar seleccionadas',
      icon: <Trash2 className='w-4 h-4' />,
      onClick: (selectedIds) => console.log('Eliminar usuarios:', selectedIds),
      variant: 'destructive',
    },
  ]

  // Define columns for products table
  const productsColumns: DataTableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (item) => (
        <div>
          <div className='text-sm font-medium text-[#004ef0]'>{item.name}</div>
          <div className='text-xs text-gray-500'>{item.id}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (item) => (
        <span className='text-xs text-gray-600 line-clamp-2'>
          {item.description}
        </span>
      ),
    },
    {
      key: 'thermalProfileIds',
      header: 'Perfiles Térmicos',
      render: (item) => (
        <div className='flex flex-wrap gap-1'>
          {item.thermalProfileIds.map((id, index) => {
            const profile = mockThermalProfiles.find((p) => p.id === id)
            return profile ? (
              <Badge
                key={index}
                variant='secondary'
                className='bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs'
              >
                {profile.name}
              </Badge>
            ) : null
          })}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item) => (
        <Badge
          variant='default'
          className={
            item.status === 'Activo'
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
          }
        >
          {item.status}
        </Badge>
      ),
      width: 'w-28',
    },
  ]

  // Definir columnas para la tabla de perfiles térmicos
  const thermalProfilesColumns: DataTableColumn<ThermalProfile>[] = [
    {
      key: 'name',
      header: 'Nombre del Perfil',
      render: (item) => (
        <div>
          <div className='text-sm font-medium text-[#004ef0]'>{item.name}</div>
          <div className='text-xs text-gray-500'>{item.id}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (item) => (
        <span className='text-xs text-gray-600 line-clamp-2'>
          {item.description}
        </span>
      ),
    },
    {
      key: 'tempMin',
      header: 'Temp. Min',
      render: (item) => (
        <span className='text-xs text-gray-900'>{item.tempMin}°C</span>
      ),
      width: 'w-24',
    },
    {
      key: 'tempMax',
      header: 'Temp. Max',
      render: (item) => (
        <span className='text-xs text-gray-900'>{item.tempMax}°C</span>
      ),
      width: 'w-24',
    },
    {
      key: 'products',
      header: 'Productos',
      render: (item) => (
        <div className='flex flex-wrap gap-1'>
          {item.products.slice(0, 2).map((productName, index) => {
            const product = mockProducts.find((p) => p.name === productName)
            return product ? (
              <Badge
                key={index}
                variant='secondary'
                className='bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs'
              >
                {product.name}
              </Badge>
            ) : (
              <Badge
                key={index}
                variant='secondary'
                className='bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs'
              >
                {productName}
              </Badge>
            )
          })}
          {item.products.length > 2 && (
            <Badge
              variant='secondary'
              className='bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs'
            >
              +{item.products.length - 2} más
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item) => (
        <Badge
          variant='default'
          className={
            item.status === 'Activo'
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
          }
        >
          {item.status}
        </Badge>
      ),
      width: 'w-28',
    },
  ]

  // Define columns for users table
  const usersColumns: DataTableColumn<User>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (item) => (
        <div>
          <div className='text-sm font-medium text-[#004ef0]'>
            {item.firstName || item.nombre} {item.lastName || item.apellido}
          </div>
          <div className='text-xs text-gray-500'>{item.id}</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Correo',
      render: (item) => (
        <span className='text-xs text-gray-600'>
          {item.email || item.correo}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      render: (item) => (
        <Badge
          variant='secondary'
          className='bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs'
        >
          {item.role || item.rol}
        </Badge>
      ),
      width: 'w-24',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item) => (
        <Badge
          variant='default'
          className={
            (item.status || item.estado) === 'Activo'
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
          }
        >
          {item.status || item.estado}
        </Badge>
      ),
      width: 'w-28',
    },
  ]

  const getFiltersForTab = () => {
    return (
      <Button
        variant='outline'
        size='sm'
        className='gap-2'
      >
        <Filter className='w-4 h-4' />
        Filtros
      </Button>
    )
  }

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'usuarios':
        return 'Buscar usuarios...'
      case 'productos':
        return 'Buscar productos...'
      case 'perfil-termico':
        return 'Buscar perfiles térmicos...'
      default:
        return 'Buscar...'
    }
  }

  return (
    <div className='flex flex-col h-full'>
      <PageHeader
        tabs={[
          {
            id: 'usuarios',
            label: 'Usuarios',
            active: activeTab === 'usuarios',
            onClick: () => handleTabChange('usuarios'),
          },
          {
            id: 'productos',
            label: 'Productos',
            active: activeTab === 'productos',
            onClick: () => handleTabChange('productos'),
          },
          {
            id: 'perfil-termico',
            label: 'Perfil Térmico',
            active: activeTab === 'perfil-termico',
            onClick: () => handleTabChange('perfil-termico'),
          },
        ]}
        showSearch
        searchPlaceholder={getSearchPlaceholder()}
        filters={getFiltersForTab()}
      />

      {activeTab === 'productos' && (
        <DataTable
          data={mockProducts}
          columns={productsColumns}
          getRowId={(item) => item.id}
          actions={productsActions}
          bulkActions={productsBulkActions}
          itemsPerPage={10}
          emptyMessage='No hay productos para mostrar'
        />
      )}

      {activeTab === 'usuarios' && (
        <DataTable
          data={mockUsers}
          columns={usersColumns}
          getRowId={(item) => item.id || ''}
          actions={usersActions}
          bulkActions={usersBulkActions}
          itemsPerPage={10}
          emptyMessage='No hay usuarios para mostrar'
        />
      )}

      {activeTab === 'perfil-termico' && (
        <DataTable
          data={mockThermalProfiles}
          columns={thermalProfilesColumns}
          getRowId={(item) => item.id}
          actions={perfilesActions}
          bulkActions={perfilesBulkActions}
          itemsPerPage={10}
          emptyMessage='No hay perfiles térmicos para mostrar'
        />
      )}

      <ThermalProfileDialog
        open={thermalProfileDialogOpen}
        onClose={() => {
          setThermalProfileDialogOpen(false)
          setSelectedThermalProfile(undefined)
        }}
        profile={selectedThermalProfile}
        onSave={(profile: any) => {
          console.log('Guardar perfil térmico:', profile)
          setThermalProfileDialogOpen(false)
          setSelectedThermalProfile(undefined)
        }}
      />

      <ProductDialog
        open={productDialogOpen}
        onClose={() => {
          setProductDialogOpen(false)
          setSelectedProduct(undefined)
        }}
        product={selectedProduct}
        thermalProfiles={mockThermalProfiles}
        onSave={(product: Product) => {
          console.log('Guardar producto:', product)
          setProductDialogOpen(false)
          setSelectedProduct(undefined)
        }}
      />

      <UserDialog
        open={userDialogOpen}
        onClose={() => {
          setUserDialogOpen(false)
          setSelectedUser(undefined)
        }}
        user={selectedUser}
        onSave={(user: User) => {
          console.log('Guardar usuario:', user)
          setUserDialogOpen(false)
          setSelectedUser(undefined)
        }}
      />
    </div>
  )
})

Settings.displayName = 'Settings'
