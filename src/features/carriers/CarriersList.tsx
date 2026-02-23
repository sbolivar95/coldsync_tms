import { Pencil, Trash2, Container } from 'lucide-react'
import { useMemo } from 'react'

import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../components/widgets/DataTable/types'
import type { Carrier } from '../../types/database.types'
import { carriersService } from '../../services/database/carriers.service'
import { useAppStore } from '../../stores/useAppStore'
import { toast } from 'sonner'
import { useCarriers } from './hooks/useCarriers'
import { useCarrierTypeOptions } from './hooks/useCarrierTypeOptions'
import type { StatusFilterValue } from '../../components/ui/StatusFilter'

interface CarriersListProps {
  onSelectCarrier: (carrier: Carrier) => void
  onViewFleet: (carrier: Carrier) => void
  onEditCarrier: (carrier: Carrier) => void
  onDeleteCarrier: (carrier: Carrier) => void
  searchTerm?: string
  statusFilter?: StatusFilterValue
}

export function CarriersList({
  onSelectCarrier,
  onViewFleet,
  onEditCarrier,
  onDeleteCarrier,
  searchTerm = '',
  statusFilter = 'all',
}: CarriersListProps) {
  const organization = useAppStore((state) => state.organization)

  // Use Zustand hook with intelligent caching
  const { carriers: allCarriers, loadCarriers } = useCarriers(organization?.id)
  const { options: carrierTypeOptions } = useCarrierTypeOptions()

  // Filter carriers based on search term and status
  const carriers = useMemo(() => {
    return allCarriers.filter((carrier) => {
      const lowerSearch = searchTerm.toLowerCase()


      // Get carrier type label for search
      const typeOption = carrierTypeOptions.find(opt => opt.value === carrier.carrier_type)
      const carrierTypeLabel = (typeOption?.label || carrier.carrier_type || '').toLowerCase()
      const carrierTypeValue = carrier.carrier_type?.toLowerCase() || ''

      // Search filter
      const matchesSearch =
        carrier.commercial_name.toLowerCase().includes(lowerSearch) ||
        carrier.legal_name.toLowerCase().includes(lowerSearch) ||
        carrier.carrier_id.toLowerCase().includes(lowerSearch) ||
        carrier.tax_id.toLowerCase().includes(lowerSearch) ||
        (carrier.country && carrier.country.toLowerCase().includes(lowerSearch)) ||
        (carrier.city && carrier.city.toLowerCase().includes(lowerSearch)) ||
        (carrier.legal_representative && carrier.legal_representative.toLowerCase().includes(lowerSearch)) ||
        (carrier.contact_phone && carrier.contact_phone.toLowerCase().includes(lowerSearch)) ||
        carrierTypeLabel.includes(lowerSearch) ||
        carrierTypeValue.includes(lowerSearch)

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && carrier.is_active) ||
        (statusFilter === 'inactive' && !carrier.is_active)

      return matchesSearch && matchesStatus
    })
  }, [allCarriers, searchTerm, statusFilter])


  // Definir columnas
  const columns: DataTableColumn<Carrier>[] = [
    {
      key: 'transportista',
      header: 'Transportista',
      render: (carrier) => (
        <div className='flex flex-col gap-0.5'>
          <button
            onClick={() => onSelectCarrier(carrier)}
            className='text-sm text-left hover:underline font-medium text-primary'
          >
            {carrier.commercial_name}
          </button>
          <span className='text-xs text-gray-500'>{carrier.legal_name}</span>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (carrier) => {
        const typeOption = carrierTypeOptions.find(opt => opt.value === carrier.carrier_type);
        return (
          <Badge
            variant='secondary'
            className='bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
          >
            {typeOption ? typeOption.label : carrier.carrier_type}
          </Badge>
        );
      },
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
      title: 'Editar',
      onClick: (carrier: Carrier) => onEditCarrier(carrier),
    },

    {
      icon: <Container className='w-3.5 h-3.5 text-gray-600' />,
      title: 'Ver flota',
      onClick: (carrier: Carrier) => onViewFleet(carrier),
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      title: 'Eliminar',
      onClick: (carrier: Carrier) => onDeleteCarrier(carrier),
    },
  ]

  // Definir acciones masivas
  const bulkActions = [
    {
      icon: <Trash2 className='w-4 h-4' />,
      label: 'Eliminar',
      variant: 'destructive' as const,
      onClick: async (selectedIds: string[]) => {
        if (!organization?.id) return

        try {
          for (const id of selectedIds) {
            await carriersService.softDelete(Number(id), organization.id)
          }
          toast.success(`${selectedIds.length} transportista(s) eliminado(s)`)
          // Refresh list using hook
          await loadCarriers(true)
        } catch (error) {
          console.error('Error deleting carriers:', error)
          toast.error('Error al eliminar transportistas')
        }
      },
    },
  ]

  return (
    <DataTable
      data={carriers}
      columns={columns}
      getRowId={(carrier) => carrier.id.toString()}
      actions={actions}
      bulkActions={bulkActions}
      itemsPerPage={10}
      emptyMessage='No hay transportistas disponibles'
      totalLabel='transportistas'
    />
  )
}
