import { DataTable } from '../../../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../../../components/widgets/DataTable/types'
import { Pencil, Trash2, Star } from 'lucide-react'
import { Badge } from '../../../../components/ui/Badge'
import { useState, useEffect } from 'react'
import { driversService } from '../../../../services/drivers.service'
import { carriersService } from '../../../../services/carriers.service'
import type { Driver } from '../../../../types/database.types'
import { useOrganization } from '@/hooks/useOrganization'

interface DriversListProps {
  onSelectItem: (item: Driver, type: 'conductor') => void
  transportistaNombre: string
  searchTerm?: string
  onCountChange?: (count: number) => void
}

export function DriversList({
  onSelectItem,
  transportistaNombre,
  searchTerm,
  onCountChange,
}: DriversListProps) {
  const { orgId } = useOrganization()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [carrierId, setCarrierId] = useState<number | null>(null)

  // Get carrier ID if filtering by carrier name
  useEffect(() => {
    if (!orgId || !transportistaNombre) return

    async function getCarrierId() {
      try {
        const carriers = await carriersService.search(
          orgId!,
          transportistaNombre
        )
        const carrier = carriers.find(
          (c) => c.commercial_name === transportistaNombre
        )
        if (carrier) {
          setCarrierId(carrier.id)
        }
      } catch (err) {
        console.error('Error finding carrier:', err)
      }
    }

    getCarrierId()
  }, [orgId, transportistaNombre])

  // Load drivers
  useEffect(() => {
    if (!orgId) return

    async function loadDrivers() {
      try {
        setLoading(true)

        let data: Driver[]
        if (carrierId) {
          data = await driversService.getByCarrier(orgId!, carrierId)
        } else {
          data = await driversService.getAll(orgId!)
        }

        setDrivers(data)
      } catch (err) {
        console.error('Error loading drivers:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDrivers()
  }, [orgId, carrierId])

  const handleDelete = async (driver: Driver) => {
    if (!orgId) return

    if (!confirm(`¿Está seguro de eliminar al conductor "${driver.name}"?`)) {
      return
    }

    try {
      await driversService.delete(driver.id, orgId)

      // Reload drivers
      const data = await driversService.getAll(orgId)
      setDrivers(data)
    } catch (err) {
      console.error('Error deleting driver:', err)
      alert('Error al eliminar el conductor')
    }
  }

  // Columnas para Conductores
  const driverColumns: DataTableColumn<Driver>[] = [
    {
      key: 'conductor',
      header: 'Conductor',
      render: (driver) => (
        <div className='flex items-center gap-2'>
          <div className='flex flex-col gap-0.5'>
            <div className='flex items-center gap-1'>
              <button
                onClick={() => onSelectItem(driver, 'conductor')}
                className='text-sm text-left hover:underline font-medium'
                style={{ color: '#004ef0' }}
              >
                {driver.name}
              </button>
            </div>
            <span className='text-xs text-gray-500'>{driver.driver_id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'licencia',
      header: 'Licencia',
      render: (driver) => (
        <span className='text-xs text-gray-900'>{driver.license_number}</span>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (driver) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>{driver.phone_number}</span>
          <span className='text-xs text-gray-500'>{driver.email}</span>
        </div>
      ),
    },
    {
      key: 'ciudad',
      header: 'Ciudad',
      render: (driver) => (
        <span className='text-xs text-gray-900'>{driver.city}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (driver) => (
        <Badge
          variant='default'
          className={
            driver.status === 'AVAILABLE'
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : driver.status === 'DRIVING'
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
          }
        >
          {driver.status === 'AVAILABLE'
            ? 'Disponible'
            : driver.status === 'DRIVING'
            ? 'En Ruta'
            : driver.status === 'INACTIVE'
            ? 'Inactivo'
            : driver.status}
        </Badge>
      ),
    },
  ]

  // Acciones
  const actions = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      title: 'Editar',
      onClick: (driver: Driver) => onSelectItem(driver, 'conductor'),
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      title: 'Eliminar',
      onClick: handleDelete,
    },
  ]

  const bulkActions = [
    {
      icon: <Trash2 className='w-4 h-4' />,
      label: 'Eliminar',
      variant: 'destructive' as const,
      onClick: async (selectedIds: string[]) => {
        if (!orgId) return

        if (
          !confirm(
            `¿Está seguro de eliminar ${selectedIds.length} conductores?`
          )
        ) {
          return
        }

        try {
          await Promise.all(
            selectedIds.map((id) => driversService.delete(parseInt(id), orgId))
          )

          const data = await driversService.getAll(orgId)
          setDrivers(data)
        } catch (err) {
          console.error('Error deleting drivers:', err)
          alert('Error al eliminar los conductores')
        }
      },
    },
  ]

  return (
    <DataTable
      data={drivers}
      columns={driverColumns}
      getRowId={(driver) => driver.id.toString()}
      actions={actions}
      bulkActions={bulkActions}
      itemsPerPage={10}
      emptyMessage={loading ? 'Cargando...' : 'No hay conductores disponibles'}
      totalLabel='conductores'
    />
  )
}
