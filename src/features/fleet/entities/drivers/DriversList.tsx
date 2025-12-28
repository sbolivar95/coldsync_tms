import { DataTable } from '../../../../components/widgets/DataTable/DataTable'
import { DataTableColumn } from '../../../../components/widgets/DataTable/types'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../../../../components/ui/Badge'
import { useState, useEffect, useMemo } from 'react'
import { driversService } from '../../../../services/drivers.service'
import { carriersService } from '../../../../services/carriers.service'
import type { Driver } from '../../../../types/database.types'
import { useOrganization } from '../../../../hooks/useOrganization'

interface DriversListProps {
  onSelectItem: (item: Driver, type: 'conductor') => void
  transportistaNombre?: string
  searchTerm?: string
  onCountChange?: (count: number) => void
}

export function DriversList({
  onSelectItem,
  transportistaNombre = '',
  searchTerm = '',
  onCountChange,
}: DriversListProps) {
  const { orgId, loading: orgLoading } = useOrganization()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  // Load drivers filtered by carrier
  useEffect(() => {
    if (!orgId || orgLoading) return

    let cancelled = false

    async function loadDrivers() {
      try {
        setLoading(true)

        // If carrier name provided, find carrier ID first
        let carrierId: number | undefined = undefined

        if (transportistaNombre?.trim()) {
          const carriers = await carriersService.search(
            orgId!,
            transportistaNombre
          )
          const carrier = carriers.find(
            (c) => c.commercial_name === transportistaNombre
          )
          carrierId = carrier?.id
        }

        // Load drivers (with or without carrier filter)
        let data: Driver[]
        if (carrierId) {
          data = await driversService.getByCarrier(orgId!, carrierId)
        } else {
          data = await driversService.getAll(orgId!)
        }

        if (!cancelled) {
          setDrivers(data)
        }
      } catch (err) {
        console.error('Error loading drivers:', err)
        if (!cancelled) setDrivers([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDrivers()

    return () => {
      cancelled = true
    }
  }, [orgId, orgLoading, transportistaNombre])

  // Client-side search filter
  const filteredDrivers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return drivers

    return drivers.filter((d) => {
      return [
        d.name,
        d.driver_id,
        d.license_number,
        d.phone_number,
        d.email,
        d.city,
        d.status,
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    })
  }, [drivers, searchTerm])

  // Report count to parent for the badge
  useEffect(() => {
    onCountChange?.(filteredDrivers.length)
  }, [filteredDrivers.length, onCountChange])

  const handleDelete = async (driver: Driver) => {
    if (!orgId) return

    if (!confirm(`¿Está seguro de eliminar al conductor "${driver.name}"?`)) {
      return
    }

    try {
      await driversService.delete(driver.id, orgId)

      // Reload drivers with same filter
      let carrierId: number | undefined = undefined
      if (transportistaNombre?.trim()) {
        const carriers = await carriersService.search(
          orgId,
          transportistaNombre
        )
        const carrier = carriers.find(
          (c) => c.commercial_name === transportistaNombre
        )
        carrierId = carrier?.id
      }

      let data: Driver[]
      if (carrierId) {
        data = await driversService.getByCarrier(orgId, carrierId)
      } else {
        data = await driversService.getAll(orgId)
      }
      setDrivers(data)
    } catch (err) {
      console.error('Error deleting driver:', err)
      alert('Error al eliminar el conductor')
    }
  }

  // Helper to get status badge style
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-700 hover:bg-green-100',
      DRIVING: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      INACTIVE: 'bg-gray-200 text-gray-700 hover:bg-gray-200',
    }
    const labels: Record<string, string> = {
      AVAILABLE: 'Disponible',
      DRIVING: 'En Ruta',
      INACTIVE: 'Inactivo',
    }
    return {
      style: styles[status] || 'bg-gray-200 text-gray-700 hover:bg-gray-200',
      label: labels[status] || status,
    }
  }

  // Columns for Drivers
  const driverColumns: DataTableColumn<Driver>[] = [
    {
      key: 'conductor',
      header: 'Conductor',
      render: (driver) => (
        <div className='flex items-center gap-2'>
          <div className='flex flex-col gap-0.5'>
            <button
              onClick={() => onSelectItem(driver, 'conductor')}
              className='text-sm text-left hover:underline font-medium'
              style={{ color: '#004ef0' }}
            >
              {driver.name}
            </button>
            <span className='text-xs text-gray-500'>{driver.driver_id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'licencia',
      header: 'Licencia',
      render: (driver) => (
        <span className='text-xs text-gray-900'>{driver.license_number}</span>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (driver) => (
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-gray-900'>{driver.phone_number}</span>
          <span className='text-xs text-gray-500'>{driver.email}</span>
        </div>
      ),
    },
    {
      key: 'ciudad',
      header: 'Ciudad',
      render: (driver) => (
        <span className='text-xs text-gray-900'>{driver.city}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (driver) => {
        const { style, label } = getStatusBadge(driver.status)
        return (
          <Badge
            variant='default'
            className={`${style} text-xs`}
          >
            {label}
          </Badge>
        )
      },
      width: 'w-28',
    },
  ]

  // Row actions
  const driverActions = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (driver: Driver) => onSelectItem(driver, 'conductor'),
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
          Cargando conductores...
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
            Selecciona una organización en Configuración para ver los
            conductores
          </p>
        </div>
      </div>
    )
  }

  return (
    <DataTable
      data={filteredDrivers}
      columns={driverColumns}
      getRowId={(d) => String(d.id)}
      actions={driverActions}
      itemsPerPage={10}
      emptyMessage='No hay conductores para mostrar'
    />
  )
}
