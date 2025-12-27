import { DataTable } from '../../../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../../../components/widgets/DataTable/types'
import { Pencil, StopCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { fleetSetsService } from '../../../../services/fleetSets.service'
import { useOrganization } from '../../../../hooks/useOrganization'

interface AssignmentsListProps {
  onSelectItem: (item: any, type: 'asignacion') => void
  transportistaNombre?: string
  searchTerm?: string
  onCountChange?: (count: number) => void
}

export function AssignmentsList({
  onSelectItem,
  transportistaNombre,
  searchTerm,
  onCountChange,
}: AssignmentsListProps) {
  const { orgId } = useOrganization()
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load assignments (active only)
  useEffect(() => {
    if (!orgId) return

    async function loadAssignments() {
      try {
        setLoading(true)
        const data = await fleetSetsService.getActive(orgId!)
        setAssignments(data)
      } catch (err) {
        console.error('Error loading assignments:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAssignments()
  }, [orgId])

  const handleEnd = async (assignment: any) => {
    if (!orgId) return

    if (!confirm(`¿Está seguro de finalizar esta asignación?`)) {
      return
    }

    try {
      await fleetSetsService.end(assignment.id, orgId)

      // Reload assignments
      const data = await fleetSetsService.getActive(orgId)
      setAssignments(data)
    } catch (err) {
      console.error('Error ending assignment:', err)
      alert('Error al finalizar la asignación')
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
            {assignment.carriers?.commercial_name || 'Sin transportista'}
          </span>
        </div>
      ),
    },
    {
      key: 'conductor',
      header: 'Conductor',
      render: (assignment) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>
            {assignment.drivers?.name || '-'}
          </span>
          <span className='text-xs text-gray-500'>
            {assignment.drivers?.driver_id || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'vehiculo',
      header: 'Vehículo',
      render: (assignment) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>
            {assignment.vehicles?.unit_code || '-'}
          </span>
          <span className='text-xs text-gray-500'>
            {assignment.vehicles?.plate || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'remolque',
      header: 'Remolque',
      render: (assignment) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>
            {assignment.trailers?.code || '-'}
          </span>
          <span className='text-xs text-gray-500'>
            {assignment.trailers?.plate || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'fechas',
      header: 'Período',
      render: (assignment) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>
            Desde: {new Date(assignment.start_date).toLocaleDateString()}
          </span>
          {assignment.end_date && (
            <span className='text-xs text-gray-500'>
              Hasta: {new Date(assignment.end_date).toLocaleDateString()}
            </span>
          )}
        </div>
      ),
    },
  ]

  // Actions
  const actions = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      title: 'Editar',
      onClick: (assignment: any) => onSelectItem(assignment, 'asignacion'),
    },
    {
      icon: <StopCircle className='w-3.5 h-3.5 text-red-600' />,
      title: 'Finalizar',
      onClick: handleEnd,
    },
  ]

  return (
    <DataTable
      data={assignments}
      columns={assignmentColumns}
      getRowId={(assignment) => assignment.id}
      actions={actions}
      itemsPerPage={10}
      emptyMessage={loading ? 'Cargando...' : 'No hay asignaciones activas'}
      totalLabel='asignaciones'
    />
  )
}
