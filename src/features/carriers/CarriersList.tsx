import { PageHeader } from '../../layouts/PageHeader'
import { Button } from '../../components/ui/Button'
import { Filter, Pencil, Trash2, Container } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../components/widgets/DataTable/types'
import { carriersService } from '../../services/carriers.service'
import { useOrganization } from '../../hooks/useOrganization'
import type { Carrier } from '../../types/database.types'

interface CarriersListProps {
  onSelectCarrier: (carrier: Carrier) => void
  onViewFleet: (carrier: Carrier) => void
  onTabChange?: (tab: string) => void
  activeTab?: string
}

export function CarriersList({
  onSelectCarrier,
  onViewFleet,
  onTabChange,
  activeTab: externalActiveTab,
}: CarriersListProps) {
  const [activeTab, setActiveTab] = useState(externalActiveTab || 'todos')
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Use the hook that supports platform admin selected org
  const { orgId, loading: orgLoading, error: orgError } = useOrganization()

  // Sync tab when it changes from parent
  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      setActiveTab(externalActiveTab)
    }
  }, [externalActiveTab, activeTab])

  // Load carriers when orgId is available
  useEffect(() => {
    if (orgLoading) return

    if (!orgId) {
      setLoading(false)
      setError('No hay organización seleccionada')
      return
    }

    async function loadCarriers() {
      try {
        setLoading(true)
        setError(null)

        let data: Carrier[]

        if (searchTerm) {
          data = await carriersService.search(orgId!, searchTerm)
        } else if (activeTab === 'activos') {
          data = await carriersService.getActive(orgId!)
        } else if (activeTab === 'inactivos') {
          const all = await carriersService.getAll(orgId!)
          data = all.filter((c) => !c.is_active)
        } else {
          data = await carriersService.getAll(orgId!)
        }

        setCarriers(data)
      } catch (err) {
        console.error('Error loading carriers:', err)
        setError('Error al cargar transportistas')
      } finally {
        setLoading(false)
      }
    }

    loadCarriers()
  }, [orgId, orgLoading, activeTab, searchTerm])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)

    if (onTabChange) {
      onTabChange(tab)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleDelete = async (carrier: Carrier) => {
    if (!orgId) return

    if (
      !confirm(
        `¿Está seguro de eliminar el transportista "${carrier.commercial_name}"?`
      )
    ) {
      return
    }

    try {
      await carriersService.softDelete(carrier.id, orgId)

      // Reload carriers
      const data = await carriersService.getAll(orgId)
      setCarriers(data)
    } catch (err) {
      console.error('Error deleting carrier:', err)
      alert('Error al eliminar el transportista')
    }
  }

  const handleBulkDelete = async (selectedIds: string[]) => {
    if (!orgId) return

    if (
      !confirm(`¿Está seguro de eliminar ${selectedIds.length} transportistas?`)
    ) {
      return
    }

    try {
      await Promise.all(
        selectedIds.map((id) => carriersService.softDelete(parseInt(id), orgId))
      )

      // Reload carriers
      const data = await carriersService.getAll(orgId)
      setCarriers(data)
    } catch (err) {
      console.error('Error deleting carriers:', err)
      alert('Error al eliminar los transportistas')
    }
  }

  // Define columns
  const columns: DataTableColumn<Carrier>[] = [
    {
      key: 'transportista',
      header: 'Transportista',
      render: (carrier) => (
        <div className='flex flex-col gap-0.5'>
          <button
            onClick={() => onSelectCarrier(carrier)}
            className='text-sm text-left hover:underline font-medium'
            style={{ color: '#004ef0' }}
          >
            {carrier.commercial_name}
          </button>
          <span className='text-xs text-gray-500'>{carrier.carrier_id}</span>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (carrier) => (
        <Badge
          variant='secondary'
          className='bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
        >
          {carrier.carrier_type === 'OWNER' ? 'Propio' : 'Tercero'}
        </Badge>
      ),
      width: 'w-24',
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (carrier) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>{carrier.contact_name}</span>
          <span className='text-xs text-gray-500'>{carrier.contact_phone}</span>
        </div>
      ),
    },
    {
      key: 'ciudad',
      header: 'Ciudad',
      render: (carrier) => (
        <span className='text-xs text-gray-600'>{carrier.city}</span>
      ),
      width: 'w-28',
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (carrier) => (
        <Badge
          variant='default'
          className={
            carrier.is_active
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
          }
        >
          {carrier.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
      width: 'w-24',
    },
    {
      key: 'fleet',
      header: 'Flota',
      render: (carrier) => (
        <Button
          variant='ghost'
          size='sm'
          className='text-xs gap-1.5 h-7 px-2'
          onClick={(e) => {
            e.stopPropagation()
            onViewFleet(carrier)
          }}
        >
          <Container className='w-3.5 h-3.5' />
          Ver Flota
        </Button>
      ),
      width: 'w-28',
    },
  ]

  // Row actions
  const actions = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (carrier: Carrier) => onSelectCarrier(carrier),
      title: 'Editar',
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      onClick: (carrier: Carrier) => handleDelete(carrier),
      variant: 'destructive' as const,
      title: 'Eliminar',
    },
  ]

  // Bulk actions
  const bulkActions = [
    {
      label: 'Eliminar seleccionados',
      icon: <Trash2 className='w-4 h-4' />,
      onClick: (selectedIds: string[]) => handleBulkDelete(selectedIds),
      variant: 'destructive' as const,
    },
  ]

  // Count carriers by status
  const totalCount = carriers.length
  const activeCount = carriers.filter((c) => c.is_active).length
  const inactiveCount = carriers.filter((c) => !c.is_active).length

  // Show loading state while org is loading
  if (orgLoading) {
    return (
      <div className='flex flex-col h-full'>
        <PageHeader
          tabs={[
            { id: 'todos', label: 'Todos', active: true, onClick: () => {} },
          ]}
          showSearch
          searchPlaceholder='Buscar transportistas...'
        />
        <div className='flex items-center justify-center py-12'>
          <div className='inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent'></div>
          <span className='ml-2 text-sm text-gray-600'>Cargando...</span>
        </div>
      </div>
    )
  }

  // Show message if no org selected (for platform admins)
  if (!orgId) {
    return (
      <div className='flex flex-col h-full'>
        <PageHeader
          tabs={[
            { id: 'todos', label: 'Todos', active: true, onClick: () => {} },
          ]}
          showSearch
          searchPlaceholder='Buscar transportistas...'
        />
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <p className='text-gray-500 mb-2'>
              No hay organización seleccionada
            </p>
            <p className='text-sm text-gray-400'>
              Selecciona una organización en Configuración para ver los
              transportistas
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full'>
      <PageHeader
        tabs={[
          {
            id: 'todos',
            label: 'Todos',
            active: activeTab === 'todos',
            onClick: () => handleTabChange('todos'),
            badge: totalCount,
          },
          {
            id: 'activos',
            label: 'Activos',
            active: activeTab === 'activos',
            onClick: () => handleTabChange('activos'),
            badge: activeCount,
          },
          {
            id: 'inactivos',
            label: 'Inactivos',
            active: activeTab === 'inactivos',
            onClick: () => handleTabChange('inactivos'),
            badge: inactiveCount,
          },
        ]}
        showSearch
        searchPlaceholder='Buscar transportistas...'
        onSearch={handleSearch}
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

      {error && (
        <div className='mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent'></div>
          <span className='ml-2 text-sm text-gray-600'>
            Cargando transportistas...
          </span>
        </div>
      ) : (
        <DataTable
          data={carriers}
          columns={columns}
          getRowId={(carrier) => String(carrier.id)}
          actions={actions}
          bulkActions={bulkActions}
          itemsPerPage={10}
          emptyMessage='No hay transportistas para mostrar'
        />
      )}
    </div>
  )
}
