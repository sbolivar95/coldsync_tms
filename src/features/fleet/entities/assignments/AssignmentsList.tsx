import { DataTable } from '../../../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../../../components/widgets/DataTable/types'
import { Pencil, StopCircle } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { Badge } from '../../../../components/ui/Badge'
import { fleetSetsService } from '../../../../services/fleetSets.service'
import { carriersService } from '../../../../services/carriers.service'
import { useOrganization } from '../../../../hooks/useOrganization'

interface AssignmentsListProps {
  onSelectItem: (item: any, type: 'asignacion') => void
  transportistaNombre?: string
  searchTerm?: string
  onCountChange?: (count: number) => void
}

export function AssignmentsList({
  onSelectItem,
  transportistaNombre = '',
  searchTerm = '',
  onCountChange,
}: AssignmentsListProps) {
  const { orgId, loading: orgLoading } = useOrganization()
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [carrierId, setCarrierId] = useState<number | null>(null)

  // Resolve carrierId from carrier name (if provided)
  useEffect(() => {
    if (!orgId) return

    // If no carrier filter provided, load all assignments
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

  // Load assignments (filtered by carrier if carrierId is set)
  useEffect(() => {
    if (!orgId || orgLoading) return

    let cancelled = false

    async function loadAssignments() {
      try {
        setLoading(true)

        let data: any[]
        if (carrierId) {
          // Get assignments for specific carrier
          data = await fleetSetsService.getByCarrier(orgId!, carrierId)
          // Filter to only active ones
          data = data.filter((a: any) => a.ends_at === null)
        } else {
          // Get all active assignments
          data = await fleetSetsService.getActive(orgId!)
        }

        if (!cancelled) setAssignments(data)
      } catch (err) {
        console.error('Error loading assignments:', err)
        if (!cancelled) setAssignments([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAssignments()

    return () => {
      cancelled = true
    }
  }, [orgId, orgLoading, carrierId])

  // Client-side search filter
  const filteredAssignments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return assignments

    return assignments.filter((a) => {
      return [
        a.set_name,
        a.drivers?.name,
        a.drivers?.driver_id,
        a.vehicles?.vehicle_code,
        a.vehicles?.plate,
        a.trailers?.code,
        a.trailers?.plate,
        a.carriers?.commercial_name,
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    })
  }, [assignments, searchTerm])

  // Report count to parent for the badge
  useEffect(() => {
    onCountChange?.(filteredAssignments.length)
  }, [filteredAssignments.length, onCountChange])

  const handleEnd = async (assignment: any) => {
    if (!orgId) return

    if (!confirm(`¿Está seguro de finalizar esta asignación?`)) {
      return
    }

    try {
      await fleetSetsService.end(assignment.id, orgId)

      // Reload assignments with same filter
      let data: any[]
      if (carrierId) {
        data = await fleetSetsService.getByCarrier(orgId, carrierId)
        data = data.filter((a: any) => a.ends_at === null)
      } else {
        data = await fleetSetsService.getActive(orgId)
      }
      setAssignments(data)
    } catch (err) {
      console.error('Error ending assignment:', err)
      alert('Error al finalizar la asignación')
    }
  }

  // Helper to get driver status badge
  const getDriverStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-700',
      DRIVING: 'bg-blue-100 text-blue-700',
      INACTIVE: 'bg-gray-200 text-gray-700',
    }
    const labels: Record<string, string> = {
      AVAILABLE: 'Disponible',
      DRIVING: 'En Ruta',
      INACTIVE: 'Inactivo',
    }
    return {
      style: styles[status] || 'bg-gray-200',
      label: labels[status] || status,
    }
  }

  // Helper to get asset status badge
  const getAssetStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      IN_MAINTENANCE: 'bg-yellow-100 text-yellow-700',
      IN_TRANSIT: 'bg-blue-100 text-blue-700',
      OUT_OF_SERVICE: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      ACTIVE: 'Activo',
      IN_MAINTENANCE: 'Mant.',
      IN_TRANSIT: 'Tránsito',
      OUT_OF_SERVICE: 'Fuera',
    }
    return {
      style: styles[status] || 'bg-gray-200',
      label: labels[status] || status,
    }
  }

  // Columns for Assignments
  const assignmentColumns: DataTableColumn<any>[] = [
    {
      key: 'set_name',
      header: 'Nombre Set',
      render: (assignment) => (
        <div className='flex flex-col gap-0.5'>
          <button
            onClick={() => onSelectItem(assignment, 'asignacion')}
            className='text-sm text-left hover:underline font-medium'
            style={{ color: '#004ef0' }}
          >
            {assignment.set_name || `Set-${assignment.id.slice(0, 8)}`}
          </button>
          <span className='text-xs text-gray-500'>
            {assignment.carriers?.commercial_name || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'Conductor',
      render: (assignment) => {
        const driver = assignment.drivers
        if (!driver) return <span className='text-xs text-gray-400'>-</span>
        const { style, label } = getDriverStatusBadge(driver.status)
        return (
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-gray-900'>{driver.name}</span>
            <Badge
              variant='default'
              className={`${style} text-xs w-fit`}
            >
              {label}
            </Badge>
          </div>
        )
      },
    },
    {
      key: 'vehicle',
      header: 'Vehículo',
      render: (assignment) => {
        const vehicle = assignment.vehicles
        if (!vehicle) return <span className='text-xs text-gray-400'>-</span>
        const { style, label } = getAssetStatusBadge(vehicle.operational_status)
        return (
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-gray-900'>
              {vehicle.vehicle_code}
            </span>
            <div className='flex items-center gap-1'>
              <span className='text-xs text-gray-500'>{vehicle.plate}</span>
              <Badge
                variant='default'
                className={`${style} text-xs`}
              >
                {label}
              </Badge>
            </div>
          </div>
        )
      },
    },
    {
      key: 'trailer',
      header: 'Remolque',
      render: (assignment) => {
        const trailer = assignment.trailers
        if (!trailer) return <span className='text-xs text-gray-400'>-</span>
        const { style, label } = getAssetStatusBadge(trailer.operational_status)
        return (
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-gray-900'>{trailer.code}</span>
            <div className='flex items-center gap-1'>
              <span className='text-xs text-gray-500'>{trailer.plate}</span>
              <Badge
                variant='default'
                className={`${style} text-xs`}
              >
                {label}
              </Badge>
            </div>
          </div>
        )
      },
    },
    {
      key: 'starts_at',
      header: 'Inicio',
      render: (assignment) => (
        <span className='text-xs text-gray-900'>
          {assignment.starts_at
            ? new Date(assignment.starts_at).toLocaleDateString()
            : '-'}
        </span>
      ),
      width: 'w-24',
    },
  ]

  // Row actions
  const assignmentActions = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (assignment: any) => onSelectItem(assignment, 'asignacion'),
      title: 'Ver Detalles',
    },
    {
      icon: <StopCircle className='w-3.5 h-3.5 text-red-600' />,
      onClick: handleEnd,
      variant: 'destructive' as const,
      title: 'Finalizar',
    },
  ]

  // Show loading state
  if (orgLoading || loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent'></div>
        <span className='ml-2 text-sm text-gray-600'>
          Cargando asignaciones...
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
            Selecciona una organización en Configuración para ver las
            asignaciones
          </p>
        </div>
      </div>
    )
  }

  return (
    <DataTable
      data={filteredAssignments}
      columns={assignmentColumns}
      getRowId={(a) => a.id}
      actions={assignmentActions}
      itemsPerPage={10}
      emptyMessage='No hay asignaciones activas para mostrar'
    />
  )
}
