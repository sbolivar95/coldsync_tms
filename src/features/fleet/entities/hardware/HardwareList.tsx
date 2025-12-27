import { DataTable } from '../../../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../../../components/widgets/DataTable/types'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../../../../components/ui/Badge'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useOrganization } from '../../../../hooks/useOrganization'

interface HardwareListProps {
  onSelectItem: (item: any, type: 'hardware') => void
  transportistaNombre?: string
}

export function HardwareList({
  onSelectItem,
  transportistaNombre,
}: HardwareListProps) {
  const { orgId } = useOrganization()
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load connections
  useEffect(() => {
    if (!orgId) return

    async function loadConnections() {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from('connection_device')
          .select(
            `
            *,
            hardware_device:hardware (
              id,
              name,
              flespi_device_type_id
            ),
            telematics_provider:provider (
              id,
              name
            )
          `
          )
          .eq('org_id', orgId)
          .order('ident')

        if (error) throw error

        setConnections(data || [])
      } catch (err) {
        console.error('Error loading connections:', err)
      } finally {
        setLoading(false)
      }
    }

    loadConnections()
  }, [orgId])

  const handleDelete = async (connection: any) => {
    if (!orgId) return

    if (
      !confirm(`¿Está seguro de eliminar la conexión "${connection.ident}"?`)
    ) {
      return
    }

    try {
      const { error } = await supabase
        .from('connection_device')
        .delete()
        .eq('id', connection.id)
        .eq('org_id', orgId)

      if (error) throw error

      // Reload connections
      const { data } = await supabase
        .from('connection_device')
        .select(
          `
          *,
          hardware_device:hardware (
            id,
            name,
            flespi_device_type_id
          ),
          telematics_provider:provider (
            id,
            name
          )
        `
        )
        .eq('org_id', orgId)
        .order('ident')

      setConnections(data || [])
    } catch (err) {
      console.error('Error deleting connection:', err)
      alert('Error al eliminar la conexión')
    }
  }

  // Columns for Hardware Connections
  const connectionColumns: DataTableColumn<any>[] = [
    {
      key: 'identificador',
      header: 'Identificador',
      render: (connection) => (
        <div className='flex flex-col gap-0.5'>
          <button
            onClick={() => onSelectItem(connection, 'hardware')}
            className='text-sm text-left hover:underline font-medium'
            style={{ color: '#004ef0' }}
          >
            {connection.ident}
          </button>
          <span className='text-xs text-gray-500'>
            {connection.hardware_device?.name || 'Sin hardware'}
          </span>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Asignado a',
      render: (connection) => (
        <Badge
          variant='secondary'
          className={
            connection.tracked_entity_type === 'VEHICLE'
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs'
          }
        >
          {connection.tracked_entity_type === 'VEHICLE'
            ? 'Vehículo'
            : 'Remolque'}
        </Badge>
      ),
    },
    {
      key: 'proveedor',
      header: 'Proveedor',
      render: (connection) => (
        <span className='text-xs text-gray-900'>
          {connection.telematics_provider?.name || '-'}
        </span>
      ),
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (connection) => (
        <span className='text-xs text-gray-900'>
          {connection.phone_number || '-'}
        </span>
      ),
    },
    {
      key: 'serial',
      header: 'Serial',
      render: (connection) => (
        <span className='text-xs text-gray-900'>
          {connection.serial || '-'}
        </span>
      ),
    },
    {
      key: 'flespi',
      header: 'Flespi Device ID',
      render: (connection) => (
        <span className='text-xs text-gray-900'>
          {connection.flespi_device_id || '-'}
        </span>
      ),
    },
  ]

  // Actions
  const actions = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      title: 'Editar',
      onClick: (connection: any) => onSelectItem(connection, 'hardware'),
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
          !confirm(`¿Está seguro de eliminar ${selectedIds.length} conexiones?`)
        ) {
          return
        }

        try {
          const { error } = await supabase
            .from('connection_device')
            .delete()
            .in('id', selectedIds)
            .eq('org_id', orgId)

          if (error) throw error

          const { data } = await supabase
            .from('connection_device')
            .select(
              `
              *,
              hardware_device:hardware (
                id,
                name,
                flespi_device_type_id
              ),
              telematics_provider:provider (
                id,
                name
              )
            `
            )
            .eq('org_id', orgId)
            .order('ident')

          setConnections(data || [])
        } catch (err) {
          console.error('Error deleting connections:', err)
          alert('Error al eliminar las conexiones')
        }
      },
    },
  ]

  return (
    <DataTable
      data={connections}
      columns={connectionColumns}
      getRowId={(connection) => connection.id}
      actions={actions}
      bulkActions={bulkActions}
      itemsPerPage={10}
      emptyMessage={loading ? 'Cargando...' : 'No hay conexiones disponibles'}
      totalLabel='conexiones'
    />
  )
}
