import { useState, useEffect } from 'react'
import { PageHeader } from '../../layouts/PageHeader'
import { Button } from '../../components/ui/Button'
import { Filter, Pencil, Trash2, ArrowRight } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/widgets/DataTable/DataTable'
import type {
  DataTableColumn,
  DataTableAction,
  DataTableBulkAction,
} from '../../components/widgets/DataTable/types'
import { routesService } from '../../services/routes.service'

interface RoutesListProps {
  onSelectRoute: (route: any) => void
  orgId: string
}

export function RoutesList({ onSelectRoute, orgId }: RoutesListProps) {
  const [activeTab, setActiveTab] = useState('todas')
  const [routes, setRoutes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load routes
  useEffect(() => {
    loadRoutes()
  }, [orgId])

  const loadRoutes = async () => {
    try {
      setIsLoading(true)
      const data = await routesService.getAllWithStops(orgId)
      setRoutes(data)
    } catch (err) {
      console.error('Error loading routes:', err)
      setError('Error al cargar rutas')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter routes by status
  const filteredRoutes = routes.filter((route) => {
    if (activeTab === 'todas') return true
    if (activeTab === 'activas') return route.is_active === true
    if (activeTab === 'inactivas') return route.is_active === false
    return true
  })

  // Get origin and destination locations from stops
  const getOrigins = (route: any): string => {
    const pickups =
      route.route_stops?.filter((s: any) => s.stop_type === 'PICKUP') || []
    return (
      pickups.map((s: any) => s.locations?.name || 'N/A').join(', ') || 'N/A'
    )
  }

  const getDestinations = (route: any): string => {
    const deliveries =
      route.route_stops?.filter((s: any) => s.stop_type === 'DELIVERY') || []
    return (
      deliveries.map((s: any) => s.locations?.name || 'N/A').join(', ') || 'N/A'
    )
  }

  // Define columns
  const columns: DataTableColumn<any>[] = [
    {
      key: 'name',
      header: 'Ruta',
      render: (item) => (
        <div className='flex flex-col gap-0.5'>
          <button
            onClick={() => onSelectRoute(item)}
            className='text-sm text-[#004ef0] hover:text-blue-800 hover:underline text-left'
          >
            {item.name}
          </button>
          <span className='text-xs text-gray-500'>{item.route_id}</span>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Orígenes → Destinos',
      render: (item) => (
        <div className='flex items-center gap-2'>
          <span className='text-xs text-gray-900'>{getOrigins(item)}</span>
          <ArrowRight className='w-3 h-3 text-gray-400' />
          <span className='text-xs text-gray-900'>{getDestinations(item)}</span>
        </div>
      ),
    },
    {
      key: 'distance',
      header: 'Distancia (km)',
      render: (item) => (
        <span className='text-xs text-gray-900'>{item.distance} km</span>
      ),
    },
    {
      key: 'route_type',
      header: 'Tipo',
      render: (item) => (
        <span className='text-xs text-gray-900'>
          {item.route_types?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item) => (
        <Badge
          variant='default'
          className={
            item.is_active
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
          }
        >
          {item.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      key: 'stops',
      header: 'Paradas',
      render: (item) => (
        <span className='text-xs text-gray-900'>
          {item.route_stops?.length || 0}
        </span>
      ),
    },
  ]

  const handleDelete = async (route: any) => {
    if (
      !confirm(`¿Está seguro de que desea eliminar la ruta "${route.name}"?`)
    ) {
      return
    }

    try {
      await routesService.softDelete(route.id, orgId)
      await loadRoutes()
    } catch (error) {
      console.error('Error deleting route:', error)
      alert('Error al eliminar la ruta')
    }
  }

  const handleBulkDelete = async (selectedIds: string[]) => {
    if (
      !confirm(
        `¿Está seguro de que desea eliminar ${selectedIds.length} rutas?`
      )
    ) {
      return
    }

    try {
      await Promise.all(
        selectedIds.map((id) => routesService.softDelete(id, orgId))
      )
      await loadRoutes()
    } catch (error) {
      console.error('Error bulk deleting routes:', error)
      alert('Error al eliminar rutas')
    }
  }

  const routesActions: DataTableAction<any>[] = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (route) => onSelectRoute(route),
      title: 'Editar',
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      onClick: handleDelete,
      variant: 'destructive',
      title: 'Eliminar',
    },
  ]

  const routesBulkActions: DataTableBulkAction[] = [
    {
      label: 'Eliminar seleccionadas',
      icon: <Trash2 className='w-4 h-4' />,
      onClick: handleBulkDelete,
      variant: 'destructive',
    },
  ]

  if (error) {
    return (
      <div className='flex flex-col h-full'>
        <div className='flex items-center justify-center h-64'>
          <p className='text-red-500'>{error}</p>
        </div>
      </div>
    )
  }

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
        searchPlaceholder='Buscar rutas...'
        filters={
          <Button
            variant='outline'
            size='sm'
            className='gap-2'
          >
            <Filter className='w-4 h-4' />
            Filtros
          </Button>
        }
      />

      <DataTable
        data={filteredRoutes}
        columns={columns}
        getRowId={(item) => item.id}
        actions={routesActions}
        bulkActions={routesBulkActions}
        itemsPerPage={10}
        emptyMessage={
          isLoading ? 'Cargando rutas...' : 'No hay rutas para mostrar'
        }
      />
    </div>
  )
}
