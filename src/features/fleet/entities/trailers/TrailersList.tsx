import { DataTable } from '../../../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../../../components/widgets/DataTable/types'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../../../../components/ui/Badge'
import { useState, useEffect, useMemo } from 'react'
import { trailersService } from '../../../../services/trailers.service'
import { carriersService } from '../../../../services/carriers.service'
import { useOrganization } from '../../../../hooks/useOrganization'
import type { Trailer } from '../../../../types/database.types'

interface TrailersListProps {
  onSelectItem: (item: any, type: 'remolque') => void
  transportistaNombre?: string
  searchTerm?: string
  onCountChange?: (count: number) => void
}

export function TrailersList({
  onSelectItem,
  transportistaNombre = '',
  searchTerm = '',
  onCountChange,
}: TrailersListProps) {
  const { orgId, loading: orgLoading } = useOrganization()
  const [trailers, setTrailers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [carrierId, setCarrierId] = useState<number | null>(null)

  // Resolve carrierId from carrier name (if provided)
  useEffect(() => {
    if (!orgId) return

    // If no carrier filter provided, load all trailers
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
        if (!cancelled) {
          setCarrierId(carrier?.id ?? null)
        }
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

  // Load trailers with reefer specs (filtered by carrier if carrierId is set)
  useEffect(() => {
    if (!orgId || orgLoading) return

    let cancelled = false

    async function loadTrailers() {
      try {
        setLoading(true)
        // Get all trailers with reefer specs
        const data = await trailersService.getAllWithReeferSpecs(orgId!)

        // Filter by carrier if carrierId is set
        const filtered = carrierId
          ? data.filter((t: any) => t.carrier_id === carrierId)
          : data

        if (!cancelled) setTrailers(filtered)
      } catch (err) {
        console.error('Error loading trailers:', err)
        if (!cancelled) setTrailers([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTrailers()

    return () => {
      cancelled = true
    }
  }, [orgId, orgLoading, carrierId])

  // Client-side search filter
  const filteredTrailers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return trailers

    return trailers.filter((t) => {
      return [
        t.code,
        t.plate,
        t.operational_status,
        t.trailer_reefer_specs?.refrigeration_brand,
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    })
  }, [trailers, searchTerm])

  // Report count to parent for the badge
  useEffect(() => {
    onCountChange?.(filteredTrailers.length)
  }, [filteredTrailers.length, onCountChange])

  const handleDelete = async (trailer: Trailer) => {
    if (!orgId) return

    if (!confirm(`¿Está seguro de eliminar el remolque "${trailer.code}"?`)) {
      return
    }

    try {
      await trailersService.delete(trailer.id, orgId)
      // Reload trailers with same filter
      const data = await trailersService.getAllWithReeferSpecs(orgId)
      const filtered = carrierId
        ? data.filter((t: any) => t.carrier_id === carrierId)
        : data
      setTrailers(filtered)
    } catch (err) {
      console.error('Error deleting trailer:', err)
      alert('Error al eliminar el remolque')
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

  // Columns for Trailers
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
          {trailer.supports_multi_zone
            ? `Multi-zona (${trailer.compartments})`
            : 'Zona única'}
        </Badge>
      ),
    },
    {
      key: 'capacidad',
      header: 'Capacidad',
      render: (trailer) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>
            {trailer.transport_capacity_weight_tn} TN
          </span>
          <span className='text-xs text-gray-500'>{trailer.volume_m3} m³</span>
        </div>
      ),
      width: 'w-24',
    },
    {
      key: 'dimensiones',
      header: 'Dimensiones',
      render: (trailer) => (
        <span className='text-xs text-gray-900'>
          {trailer.length_m}m × {trailer.width_m}m × {trailer.height_m}m
        </span>
      ),
    },
    {
      key: 'refrigeracion',
      header: 'Refrigeración',
      render: (trailer) => {
        const specs = trailer.trailer_reefer_specs
        if (!specs) return <span className='text-xs text-gray-400'>-</span>
        return (
          <div className='flex flex-col gap-0.5'>
            <span className='text-xs text-gray-900'>
              {specs.refrigeration_brand || specs.brand}
            </span>
            <span className='text-xs text-gray-500'>
              {specs.temp_min_c}°C a {specs.temp_max_c}°C
            </span>
          </div>
        )
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (trailer) => {
        const { style, label } = getStatusBadge(trailer.operational_status)
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
  const trailerActions = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (trailer: any) => onSelectItem(trailer, 'remolque'),
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
          Cargando remolques...
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
            Selecciona una organización en Configuración para ver los remolques
          </p>
        </div>
      </div>
    )
  }

  return (
    <DataTable
      data={filteredTrailers}
      columns={trailerColumns}
      getRowId={(t) => t.id}
      actions={trailerActions}
      itemsPerPage={10}
      emptyMessage='No hay remolques para mostrar'
    />
  )
}
