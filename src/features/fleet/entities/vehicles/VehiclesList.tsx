import { DataTable } from '../../../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../../../components/widgets/DataTable/types'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../../../../components/ui/Badge'
import { useMemo, useEffect, useState } from 'react'
import { vehiclesService } from '../../../../services/vehicles.service'
import { carriersService } from '../../../../services/carriers.service'
import type { Vehicle } from '../../../../types/database.types'
import { useOrganization } from '../../../../hooks/useOrganization'

interface VehiclesListProps {
  onSelectItem: (item: Vehicle, type: 'vehiculo') => void
  transportistaNombre?: string
  searchTerm?: string
  onCountChange?: (count: number) => void
}

export function VehiclesList({
  onSelectItem,
  transportistaNombre = '',
  searchTerm = '',
  onCountChange,
}: VehiclesListProps) {
  const { orgId, loading: orgLoading } = useOrganization()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  // Load vehicles filtered by carrier
  useEffect(() => {
    if (!orgId || orgLoading) return

    let cancelled = false

    async function loadVehicles() {
      try {
        setLoading(true)

        // If carrier name provided, find carrier ID first
        let carrierId: number | undefined = undefined

        if (transportistaNombre?.trim()) {
          const carriers = await carriersService.search(
            orgId!,
            transportistaNombre
          )
          const carrier = carriers.find(
            (c) => c.commercial_name === transportistaNombre
          )
          carrierId = carrier?.id
        }

        // Load vehicles (with or without carrier filter)
        const data = await vehiclesService.getAll(orgId!, carrierId)

        if (!cancelled) {
          setVehicles(data)
        }
      } catch (err) {
        console.error('Error loading vehicles:', err)
        if (!cancelled) setVehicles([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadVehicles()

    return () => {
      cancelled = true
    }
  }, [orgId, orgLoading, transportistaNombre])

  // Client-side search filter (for PageHeader search)
  const filteredVehicles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return vehicles

    return vehicles.filter((v) => {
      return [
        v.unit_code,
        v.vehicle_code,
        v.plate,
        v.brand,
        v.model,
        v.vehicle_type,
        v.operational_status,
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    })
  }, [vehicles, searchTerm])

  // Report count to parent for the badge
  useEffect(() => {
    onCountChange?.(filteredVehicles.length)
  }, [filteredVehicles.length, onCountChange])

  const handleDelete = async (vehicle: Vehicle) => {
    if (!orgId) return

    if (
      !confirm(
        `¿Está seguro de eliminar el vehículo "${vehicle.vehicle_code}"?`
      )
    )
      return

    try {
      await vehiclesService.delete(vehicle.id, orgId)

      // Reload vehicles with same filter
      let carrierId: number | undefined = undefined
      if (transportistaNombre?.trim()) {
        const carriers = await carriersService.search(
          orgId,
          transportistaNombre
        )
        const carrier = carriers.find(
          (c) => c.commercial_name === transportistaNombre
        )
        carrierId = carrier?.id
      }
      const data = await vehiclesService.getAll(orgId, carrierId)
      setVehicles(data)
    } catch (err) {
      console.error('Error deleting vehicle:', err)
      alert('Error al eliminar el vehículo')
    }
  }

  // Helper to get status badge style
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 hover:bg-green-100',
      IN_MAINTENANCE: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
      IN_TRANSIT: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      IN_SERVICE: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
      OUT_OF_SERVICE: 'bg-red-100 text-red-700 hover:bg-red-100',
      RETIRED: 'bg-gray-300 text-gray-700 hover:bg-gray-300',
    }
    const labels: Record<string, string> = {
      ACTIVE: 'Activo',
      IN_MAINTENANCE: 'En Mantenimiento',
      IN_TRANSIT: 'En Tránsito',
      IN_SERVICE: 'En Servicio',
      OUT_OF_SERVICE: 'Fuera de Servicio',
      RETIRED: 'Retirado',
    }
    return {
      style: styles[status] || 'bg-gray-200 text-gray-700 hover:bg-gray-200',
      label: labels[status] || status,
    }
  }

  // Columns for Vehicles
  const vehicleColumns: DataTableColumn<Vehicle>[] = [
    {
      key: 'unidad',
      header: 'Unidad',
      render: (vehicle) => (
        <div className='flex flex-col gap-0.5'>
          <button
            onClick={() => onSelectItem(vehicle, 'vehiculo')}
            className='text-sm text-left hover:underline font-medium'
            style={{ color: '#004ef0' }}
          >
            {vehicle.unit_code}
          </button>
          <span className='text-xs text-gray-500'>{vehicle.vehicle_code}</span>
        </div>
      ),
    },
    {
      key: 'placa',
      header: 'Placa',
      render: (vehicle) => (
        <span className='text-xs text-gray-900 font-medium'>
          {vehicle.plate}
        </span>
      ),
      width: 'w-24',
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (vehicle) => (
        <Badge
          variant='secondary'
          className='bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
        >
          {vehicle.vehicle_type}
        </Badge>
      ),
    },
    {
      key: 'marca',
      header: 'Marca/Modelo',
      render: (vehicle) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>{vehicle.brand}</span>
          <span className='text-xs text-gray-500'>
            {vehicle.model} ({vehicle.year})
          </span>
        </div>
      ),
    },
    {
      key: 'odometro',
      header: 'Odómetro',
      render: (vehicle) => (
        <span className='text-xs text-gray-900'>
          {vehicle.odometer_value?.toLocaleString()} {vehicle.odometer_unit}
        </span>
      ),
      width: 'w-28',
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (vehicle) => {
        const { style, label } = getStatusBadge(vehicle.operational_status)
        return (
          <Badge
            variant='default'
            className={`${style} text-xs`}
          >
            {label}
          </Badge>
        )
      },
      width: 'w-32',
    },
  ]

  // Row actions
  const vehicleActions = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (vehicle: Vehicle) => onSelectItem(vehicle, 'vehiculo'),
      title: 'Editar',
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      onClick: handleDelete,
      variant: 'destructive' as const,
      title: 'Eliminar',
    },
  ]

  // Show loading state
  if (orgLoading || loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent'></div>
        <span className='ml-2 text-sm text-gray-600'>
          Cargando vehículos...
        </span>
      </div>
    )
  }

  // Show message if no org selected
  if (!orgId) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <p className='text-gray-500 mb-2'>No hay organización seleccionada</p>
          <p className='text-sm text-gray-400'>
            Selecciona una organización en Configuración para ver los vehículos
          </p>
        </div>
      </div>
    )
  }

  return (
    <DataTable
      data={filteredVehicles}
      columns={vehicleColumns}
      getRowId={(v) => v.id}
      actions={vehicleActions}
      itemsPerPage={10}
      emptyMessage='No hay vehículos para mostrar'
    />
  )
}
