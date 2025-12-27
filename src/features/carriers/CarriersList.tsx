import { PageHeader } from '../../layouts/PageHeader'
import { Button } from '../../components/ui/Button'
import { Filter, Pencil, Trash2, Container } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../components/widgets/DataTable/types'
import { carriersService } from '../../services/carriers.service'
import { supabase } from '../../lib/supabase'
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
  const [orgId, setOrgId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Sincronizar el tab cuando cambie desde el padre
  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      setActiveTab(externalActiveTab)
    }
  }, [externalActiveTab, activeTab])

  // Get organization ID
  useEffect(() => {
    async function getOrgId() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setError('Usuario no autenticado')
          setLoading(false)
          return
        }

        const { data: member } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (member) {
          setOrgId(member.org_id)
        } else {
          setError('No pertenece a ninguna organización')
        }
      } catch (err) {
        console.error('Error getting organization:', err)
        setError('Error al obtener organización')
      } finally {
        setLoading(false)
      }
    }

    getOrgId()
  }, [])

  // Load carriers
  useEffect(() => {
    if (!orgId) return

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
  }, [orgId, activeTab, searchTerm])

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

  // Definir columnas
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
          {carrier.carrier_type === 'OWNER' ? 'Flota Propia' : 'Tercero'}
        </Badge>
      ),
    },
    {
      key: 'ubicacion',
      header: 'País / Ciudad',
      render: (carrier) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>{carrier.country}</span>
          <span className='text-xs text-gray-500'>{carrier.city}</span>
        </div>
      ),
    },
    {
      key: 'idTributario',
      header: 'ID Tributario',
      render: (carrier) => (
        <span className='text-xs text-gray-900'>{carrier.tax_id}</span>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (carrier) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>
            {carrier.legal_representative}
          </span>
          <span className='text-xs text-gray-500'>{carrier.contact_phone}</span>
        </div>
      ),
    },
    {
      key: 'flota',
      header: 'Flota',
      render: (carrier) => {
        // This would need to be calculated from related tables
        // For now, show placeholder
        return <span className='text-xs text-gray-900 font-medium'>-</span>
      },
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
    },
  ]

  // Definir acciones individuales
  const actions = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      title: 'Ver detalles',
      onClick: (carrier: Carrier) => onSelectCarrier(carrier),
    },
    {
      icon: <Container className='w-3.5 h-3.5 text-gray-600' />,
      title: 'Ver flota',
      onClick: (carrier: Carrier) => onViewFleet(carrier),
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      title: 'Eliminar',
      onClick: (carrier: Carrier) => handleDelete(carrier),
    },
  ]

  // Definir acciones masivas
  const bulkActions = [
    {
      icon: <Trash2 className='w-4 h-4' />,
      label: 'Eliminar',
      variant: 'destructive' as const,
      onClick: handleBulkDelete,
    },
  ]

  if (error) {
    return (
      <div className='flex flex-col h-full items-center justify-center'>
        <p className='text-red-600'>{error}</p>
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
          },
          {
            id: 'activos',
            label: 'Activos',
            active: activeTab === 'activos',
            onClick: () => handleTabChange('activos'),
          },
          {
            id: 'inactivos',
            label: 'Inactivos',
            active: activeTab === 'inactivos',
            onClick: () => handleTabChange('inactivos'),
          },
        ]}
        showSearch
        searchPlaceholder='Buscar transportistas...'
        onSearch={handleSearch}
        filters={
          <>
            <Button
              variant='outline'
              size='sm'
              className='gap-2'
            >
              <Filter className='w-4 h-4' />
              Filtros
            </Button>
          </>
        }
      />

      <DataTable
        data={carriers}
        columns={columns}
        getRowId={(carrier) => carrier.id.toString()}
        actions={actions}
        bulkActions={bulkActions}
        itemsPerPage={10}
        emptyMessage={
          loading ? 'Cargando...' : 'No hay transportistas disponibles'
        }
        totalLabel='transportistas'
      />
    </div>
  )
}
