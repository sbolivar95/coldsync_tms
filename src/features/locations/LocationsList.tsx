import { PageHeader } from '../../layouts/PageHeader'
import { Button } from '../../components/ui/Button'
import { Filter, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import type { Location, LocationType } from '../../types/database.types'
import { DataTable } from '../../components/widgets/DataTable/DataTable'
import type {
  DataTableColumn,
  DataTableAction,
  DataTableBulkAction,
} from '../../components/widgets/DataTable/types'

type LocationWithType = Location & {
  location_types?: Pick<LocationType, 'id' | 'name'> | null
}

interface LocationsListProps {
  locations: LocationWithType[]
  loading?: boolean
  onSelectLocation: (location: LocationWithType) => void
  onDeleteLocation: (location: LocationWithType) => void
  onBulkDeleteLocations: (ids: number[]) => void
}

export function LocationsList({
  locations,
  loading,
  onSelectLocation,
  onDeleteLocation,
  onBulkDeleteLocations,
}: LocationsListProps) {
  const [activeTab, setActiveTab] = useState('todas')

  const filtered = useMemo(() => {
    if (activeTab === 'activas')
      return locations.filter((l) => (l as any).is_active === true)
    if (activeTab === 'inactivas')
      return locations.filter((l) => (l as any).is_active === false)
    return locations
  }, [locations, activeTab])

  const columns: DataTableColumn<LocationWithType>[] = [
    {
      key: 'ubicacion',
      header: 'Ubicación',
      render: (location) => (
        <div className='flex flex-col gap-0.5'>
          <button
            onClick={() => onSelectLocation(location)}
            className='text-sm text-[#004ef0] hover:text-blue-800 hover:underline text-left'
          >
            {location.name}
          </button>
          <span className='text-xs text-gray-500'>{String(location.code)}</span>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (location) => (
        <Badge
          variant='secondary'
          className='bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
        >
          {location.location_types?.name ?? '—'}
        </Badge>
      ),
    },
    {
      key: 'ciudad',
      header: 'Ciudad/País',
      render: (location) => (
        <span className='text-xs text-gray-900'>
          {location.city}/{location.country}
        </span>
      ),
    },
    {
      key: 'direccion',
      header: 'Dirección',
      render: (location) => (
        <span className='text-xs text-gray-900'>{location.address}</span>
      ),
    },
    {
      key: 'docks',
      header: 'Muelles',
      align: 'center',
      render: (location) => (
        <span className='text-xs text-gray-900'>
          {(location as any).num_docks ?? '—'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (location) => (
        <Badge
          variant='default'
          className={
            (location as any).is_active === true
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
          }
        >
          {(location as any).is_active === true ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  const actions: DataTableAction<LocationWithType>[] = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (location) => onSelectLocation(location),
      title: 'Editar',
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      onClick: (location) => onDeleteLocation(location),
      variant: 'destructive',
      title: 'Eliminar',
    },
  ]

  const bulkActions: DataTableBulkAction[] = [
    {
      label: 'Cancelar',
      onClick: () => {},
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className='w-4 h-4' />,
      onClick: (selectedIds) =>
        onBulkDeleteLocations(
          selectedIds.map((id) => Number(id)).filter((n) => !Number.isNaN(n))
        ),
      variant: 'destructive',
    },
  ]

  return (
    <div className='flex flex-col h-full'>
      <PageHeader
        tabs={[
          {
            id: 'todas',
            label: 'Todas',
            active: activeTab === 'todas',
            onClick: () => setActiveTab('todas'),
          },
          {
            id: 'activas',
            label: 'Activas',
            active: activeTab === 'activas',
            onClick: () => setActiveTab('activas'),
          },
          {
            id: 'inactivas',
            label: 'Inactivas',
            active: activeTab === 'inactivas',
            onClick: () => setActiveTab('inactivas'),
          },
        ]}
        showSearch
        searchPlaceholder='Buscar ubicaciones...'
        filters={
          <>
            <Button
              variant='outline'
              size='sm'
              className='gap-2'
            >
              <Filter className='w-4 h-4' />
              Filtros
            </Button>
          </>
        }
      />

      <DataTable
        data={filtered}
        columns={columns}
        getRowId={(location) => String((location as any).id)}
        actions={actions}
        bulkActions={bulkActions}
        itemsPerPage={10}
        totalLabel='ubicaciones'
        emptyMessage={
          loading ? 'Cargando...' : 'No hay ubicaciones disponibles'
        }
      />
    </div>
  )
}
