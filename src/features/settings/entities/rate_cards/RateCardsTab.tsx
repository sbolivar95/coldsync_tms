import { DataTable } from '../../../../components/widgets/DataTable/DataTable'
import type {
  DataTableColumn,
  DataTableAction,
  DataTableBulkAction,
} from '../../../../components/widgets/DataTable/types'
import { Badge } from '../../../../components/ui/Badge'
import { Pencil, Trash2, RotateCcw, Copy, PowerOff } from 'lucide-react'
import type { RateCardWithCharges } from '../../../../services/database/rateCards.service'
import { formatDateRange } from '../../../../lib/utils/rateCard.utils'
import { useAppStore } from '../../../../stores/useAppStore'
import { useEffect, useState } from 'react'
import { lanesService } from '../../../../services/database/lanes.service'
import { carriersService } from '../../../../services/database/carriers.service'
import { thermalProfilesService } from '../../../../services/database/thermalProfiles.service'
import type { Lane } from '../../../../types/database.types'
import type { Carrier } from '../../../../types/database.types'
import type { ThermalProfile } from '../../../../types/database.types'

interface RateCardsTabProps {
  rateCards: RateCardWithCharges[]
  onEdit: (rateCard: RateCardWithCharges) => void
  onDelete: (rateCard: RateCardWithCharges) => void
  onReactivate: (rateCard: RateCardWithCharges) => void
  onPermanentDelete?: (rateCard: RateCardWithCharges) => void
  onBulkDelete: (rateCardIds: string[]) => void
  onBulkPermanentDelete?: (rateCardIds: string[]) => void
  onDuplicate: (rateCard: RateCardWithCharges) => void
}

/**
 * RateCardsTab - Displays rate cards in a data table with CRUD actions
 * Handles active/inactive rate cards with conditional actions (delete/reactivate)
 */
export function RateCardsTab({
  rateCards,
  onEdit,
  onDelete,
  onReactivate,
  onPermanentDelete,
  onBulkDelete,
  onBulkPermanentDelete,
  onDuplicate,
}: RateCardsTabProps) {
  const organization = useAppStore((state) => state.organization)
  const [lanes, setLanes] = useState<Lane[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [thermalProfiles, setThermalProfiles] = useState<ThermalProfile[]>([])

  // Load related data for display
  useEffect(() => {
    const loadRelatedData = async () => {
      if (!organization?.id) return

      try {
        const [lanesData, carriersData, thermalProfilesData] = await Promise.all([
          lanesService.getAll(organization.id),
          carriersService.getAll(organization.id),
          thermalProfilesService.getAll(organization.id),
        ])
        setLanes(lanesData)
        setCarriers(carriersData)
        setThermalProfiles(thermalProfilesData)
      } catch (error) {
        console.error('Error loading related data:', error)
      }
    }

    loadRelatedData()
  }, [organization?.id])

  const getLaneName = (laneId: string): string => {
    const lane = lanes.find((l) => l.id === laneId)
    return lane?.name || laneId
  }

  const getCarrierName = (carrierId: number | null): string => {
    if (!carrierId) return 'Default'
    const carrier = carriers.find((c) => c.id === carrierId)
    return carrier?.commercial_name || `Carrier ${carrierId}`
  }

  const getThermalProfileName = (thermalProfileId: number | null): string => {
    if (!thermalProfileId) return 'Cualquiera'
    const profile = thermalProfiles.find((p) => p.id === thermalProfileId)
    return profile?.name || `Perfil ${thermalProfileId}`
  }

  const rateCardsActions: DataTableAction<RateCardWithCharges>[] = [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      onClick: onEdit,
      title: 'Editar',
    },
    {
      icon: <Copy className="w-3.5 h-3.5 text-gray-600" />,
      onClick: onDuplicate,
      title: 'Duplicar',
    },
    {
      icon: (item) =>
        item.is_active ? (
          <PowerOff className="w-3.5 h-3.5 text-gray-600" />
        ) : (
          <RotateCcw className="w-3.5 h-3.5 text-green-600" />
        ),
      onClick: (item) => (item.is_active ? onDelete(item) : onReactivate(item)),
      variant: 'default',
      title: (item) => (item.is_active ? 'Desactivar' : 'Reactivar'),
    },
    ...(onPermanentDelete
      ? [
          {
            icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
            onClick: onPermanentDelete,
            variant: 'destructive' as const,
            title: 'Eliminar permanentemente',
          } as DataTableAction<RateCardWithCharges>,
        ]
      : []),
  ]

  const rateCardsBulkActions: DataTableBulkAction[] = [
    {
      label: 'Desactivar',
      icon: <PowerOff className="w-4 h-4" />,
      onClick: onBulkDelete,
      variant: 'destructive',
    },
    ...(onBulkPermanentDelete
      ? [
          {
            label: 'Eliminar permanentemente',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: onBulkPermanentDelete,
            variant: 'destructive' as const,
          } as DataTableBulkAction,
        ]
      : []),
  ]

  const rateCardsColumns: DataTableColumn<RateCardWithCharges>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">{item.name || 'Sin nombre'}</span>
      ),
    },
    {
      key: 'lane',
      header: 'Carril',
      render: (item) => (
        <span className="text-sm text-gray-700">{getLaneName(item.lane_id)}</span>
      ),
    },
    {
      key: 'carrier',
      header: 'Transportista',
      render: (item) => (
        <span className="text-sm text-gray-700">{getCarrierName(item.carrier_id)}</span>
      ),
    },
    {
      key: 'thermal_profile',
      header: 'Perfil Térmico',
      render: (item) => (
        <span className="text-sm text-gray-700">
          {getThermalProfileName(item.thermal_profile_id)}
        </span>
      ),
    },
    {
      key: 'validity',
      header: 'Vigencia',
      render: (item) => (
        <span className="text-xs text-gray-600">{formatDateRange(item.valid_from, item.valid_to)}</span>
      ),
      width: 'w-40',
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (item) => (
        <Badge
          variant={item.is_active ? 'default' : 'secondary'}
          className={
            item.is_active
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs'
          }
        >
          {item.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
      width: 'w-24',
    },
  ]

  return (
    <DataTable
      data={rateCards}
      columns={rateCardsColumns}
      getRowId={(item) => item.id}
      actions={rateCardsActions}
      bulkActions={rateCardsBulkActions}
      itemsPerPage={15}
      emptyMessage="No hay tarifarios para mostrar"
    />
  )
}
