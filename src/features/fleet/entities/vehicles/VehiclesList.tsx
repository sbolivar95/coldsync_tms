import { DataTable } from '../../../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../../../components/widgets/DataTable/types'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../../../../components/ui/Badge'
import { useMemo, useEffect, useState } from 'react'
import { vehiclesService } from '../../../../services/vehicles.service'
import { carriersService } from '../../../../services/carriers.service'
import type { Vehicle } from '../../../../types/database.types'
import { useOrganization } from '@/hooks/useOrganization'

interface VehiclesListProps {
  onSelectItem: (item: Vehicle, type: 'vehiculo') => void
  transportistaNombre: string
  searchTerm?: string
  onCountChange?: (count: number) => void
}

export function VehiclesList({
  onSelectItem,
  transportistaNombre,
  searchTerm = '',
  onCountChange,
}: VehiclesListProps) {
  const { orgId } = useOrganization()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [carrierId, setCarrierId] = useState<number | null>(null)

  // 1) Resolve carrierId from carrier name (if provided)
  useEffect(() => {
    if (!orgId) return

    // If parent passes empty string or undefined-ish, treat as no filter
    if (!transportistaNombre?.trim()) {
      setCarrierId(null)
      return
    }

    let cancelled = false

    async function getCarrierId() {
      try {
        const carriers = await carriersService.search(
          orgId!,
          transportistaNombre
        )
        const carrier = carriers.find(
          (c) => c.commercial_name === transportistaNombre
        )
        if (!cancelled) setCarrierId(carrier?.id ?? null)
      } catch (err) {
        console.error('Error finding carrier:', err)
        if (!cancelled) setCarrierId(null)
      }
    }

    getCarrierId()

    return () => {
      cancelled = true
    }
  }, [orgId, transportistaNombre])

  // 2) Load vehicles (server-filtered by carrierId if present)
  useEffect(() => {
    if (!orgId) return

    let cancelled = false

    async function loadVehicles() {
      try {
        setLoading(true)

        // ✅ Correct: pass carrierId only if it exists
        const data = await vehiclesService.getAll(
          orgId!,
          carrierId ?? undefined
        )

        if (!cancelled) setVehicles(data)
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
  }, [orgId, carrierId])

  // 3) Client-side search filter (for PageHeader search)
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

  // 4) Report count to parent for the badge
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

      // ✅ Reload with SAME filter
      const data = await vehiclesService.getAll(orgId, carrierId ?? undefined)
      setVehicles(data)
    } catch (err) {
      console.error('Error deleting vehicle:', err)
      alert('Error al eliminar el vehículo')
    }
  }

  // Columnas para Vehículos
  const vehicleColumns: DataTableColumn<Vehicle>[] = [
    {
      key: 'unit_code', // ✅ use real field keys if your DataTable expects it
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
      key: 'vehicle_type',
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
      key: 'brand',
      header: 'Marca / Modelo',
      render: (vehicle) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>{vehicle.brand}</span>
          <span className='text-xs text-gray-500'>{vehicle.model}</span>
        </div>
      ),
    },
    {
      key: 'year',
      header: 'Año',
      render: (vehicle) => (
        <span className='text-xs text-gray-900'>{vehicle.year}</span>
      ),
    },
    {
      key: 'plate',
      header: 'Placa',
      render: (vehicle) => (
        <span className='text-xs text-gray-900'>{vehicle.plate}</span>
      ),
    },
    {
      key: 'odometer_value',
      header: 'Odómetro',
      render: (vehicle) => (
        <span className='text-xs text-gray-900'>
          {vehicle.odometer_value.toLocaleString()} {vehicle.odometer_unit}
        </span>
      ),
    },
    {
      key: 'operational_status',
      header: 'Estado',
      render: (vehicle) => (
        <Badge
          variant='default'
          className={
            vehicle.operational_status === 'ACTIVE'
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : vehicle.operational_status === 'IN_MAINTENANCE'
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs'
              : 'bg-red-100 text-red-700 hover:bg-red-100 text-xs'
          }
        >
          {vehicle.operational_status === 'ACTIVE'
            ? 'Activo'
            : vehicle.operational_status === 'IN_MAINTENANCE'
            ? 'Mantenimiento'
            : vehicle.operational_status === 'IN_SERVICE'
            ? 'En Servicio'
            : vehicle.operational_status === 'OUT_OF_SERVICE'
            ? 'Fuera de Servicio'
            : vehicle.operational_status === 'RETIRED'
            ? 'Retirado'
            : vehicle.operational_status}
        </Badge>
      ),
    },
  ]

  const actions = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      title: 'Editar',
      onClick: (vehicle: Vehicle) => onSelectItem(vehicle, 'vehiculo'),
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
          !confirm(`¿Está seguro de eliminar ${selectedIds.length} vehículos?`)
        )
          return

        try {
          await Promise.all(
            selectedIds.map((id) => vehiclesService.delete(id, orgId))
          )

          // ✅ Reload with SAME filter
          const data = await vehiclesService.getAll(
            orgId,
            carrierId ?? undefined
          )
          setVehicles(data)
        } catch (err) {
          console.error('Error deleting vehicles:', err)
          alert('Error al eliminar los vehículos')
        }
      },
    },
  ]

  return (
    <DataTable
      data={filteredVehicles} // ✅ search-filtered list
      columns={vehicleColumns}
      getRowId={(vehicle) => vehicle.id}
      actions={actions}
      bulkActions={bulkActions}
      itemsPerPage={10}
      emptyMessage={loading ? 'Cargando...' : 'No hay vehículos disponibles'}
      totalLabel='vehículos'
    />
  )
}
