import { DataTable } from '../../../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../../../components/widgets/DataTable/types'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../../../../components/ui/Badge'
import { useState, useEffect } from 'react'
import { trailersService } from '../../../../services/trailers.service'
import { carriersService } from '../../../../services/carriers.service'
import { useOrganization } from '@/hooks/useOrganization'
import type { Trailer } from '../../../../types/database.types'

interface TrailersListProps {
  onSelectItem: (item: any, type: 'remolque') => void
  transportistaNombre: string
  searchTerm?: string
  onCountChange?: (count: number) => void
}

export function TrailersList({
  onSelectItem,
  transportistaNombre,
}: TrailersListProps) {
  const { orgId } = useOrganization()
  const [trailers, setTrailers] = useState<any[]>([])
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

  // Load trailers with reefer specs
  useEffect(() => {
    if (!orgId) return

    async function loadTrailers() {
      try {
        setLoading(true)
        const data = await trailersService.getAllWithReeferSpecs(orgId!)

        // Filter by carrier if provided (Note: you may need to add carrier relationship)
        const filtered = data

        setTrailers(filtered)
      } catch (err) {
        console.error('Error loading trailers:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTrailers()
  }, [orgId, carrierId])

  const handleDelete = async (trailer: Trailer) => {
    if (!orgId) return

    if (!confirm(`¿Está seguro de eliminar el remolque "${trailer.code}"?`)) {
      return
    }

    try {
      await trailersService.delete(trailer.id, orgId)

      // Reload trailers
      const data = await trailersService.getAllWithReeferSpecs(orgId)
      setTrailers(data)
    } catch (err) {
      console.error('Error deleting trailer:', err)
      alert('Error al eliminar el remolque')
    }
  }

  // Columnas para Remolques
  const trailerColumns: DataTableColumn<any>[] = [
    {
      key: 'unidad',
      header: 'Unidad',
      render: (trailer) => (
        <div className='flex flex-col gap-0.5'>
          <button
            onClick={() => onSelectItem(trailer, 'remolque')}
            className='text-sm text-left hover:underline font-medium'
            style={{ color: '#004ef0' }}
          >
            {trailer.code}
          </button>
          <span className='text-xs text-gray-500'>{trailer.plate}</span>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Configuración',
      render: (trailer) => (
        <Badge
          variant='secondary'
          className={
            trailer.supports_multi_zone
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
          }
        >
          {trailer.supports_multi_zone ? 'Multi-zona' : 'Simple'}
        </Badge>
      ),
    },
    {
      key: 'compartimentos',
      header: 'Compartimentos',
      render: (trailer) => (
        <span className='text-xs text-gray-900'>{trailer.compartments}</span>
      ),
    },
    {
      key: 'capacidad',
      header: 'Capacidad',
      render: (trailer) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>
            {trailer.transport_capacity_weight_tn} Tn
          </span>
          <span className='text-xs text-gray-500'>{trailer.volume_m3} m³</span>
        </div>
      ),
    },
    {
      key: 'dimensiones',
      header: 'Dimensiones (L×W×H)',
      render: (trailer) => (
        <span className='text-xs text-gray-900'>
          {trailer.length_m}×{trailer.width_m}×{trailer.height_m}m
        </span>
      ),
    },
    {
      key: 'rangoTermico',
      header: 'Rango Térmico',
      render: (trailer) => {
        const specs = trailer.trailer_reefer_specs
        if (!specs || specs.temp_min_c === null || specs.temp_max_c === null) {
          return <span className='text-xs text-gray-500'>-</span>
        }
        return (
          <span className='text-xs text-gray-900'>
            {specs.temp_min_c}°C a {specs.temp_max_c}°C
          </span>
        )
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (trailer) => (
        <Badge
          variant='default'
          className={
            trailer.operational_status === 'ACTIVE'
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : trailer.operational_status === 'IN_MAINTENANCE'
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs'
              : 'bg-red-100 text-red-700 hover:bg-red-100 text-xs'
          }
        >
          {trailer.operational_status === 'ACTIVE'
            ? 'Activo'
            : trailer.operational_status === 'IN_MAINTENANCE'
            ? 'Mantenimiento'
            : trailer.operational_status === 'IN_SERVICE'
            ? 'En Servicio'
            : trailer.operational_status === 'OUT_OF_SERVICE'
            ? 'Fuera de Servicio'
            : trailer.operational_status}
        </Badge>
      ),
    },
  ]

  // Acciones
  const actions = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      title: 'Editar',
      onClick: (trailer: any) => onSelectItem(trailer, 'remolque'),
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
          !confirm(`¿Está seguro de eliminar ${selectedIds.length} remolques?`)
        ) {
          return
        }

        try {
          await Promise.all(
            selectedIds.map((id) => trailersService.delete(id, orgId))
          )

          const data = await trailersService.getAllWithReeferSpecs(orgId)
          setTrailers(data)
        } catch (err) {
          console.error('Error deleting trailers:', err)
          alert('Error al eliminar los remolques')
        }
      },
    },
  ]

  return (
    <DataTable
      data={trailers}
      columns={trailerColumns}
      getRowId={(trailer) => trailer.id}
      actions={actions}
      bulkActions={bulkActions}
      itemsPerPage={10}
      emptyMessage={loading ? 'Cargando...' : 'No hay remolques disponibles'}
      totalLabel='remolques'
    />
  )
}
