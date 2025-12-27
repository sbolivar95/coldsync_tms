import { PageHeader } from '../../layouts/PageHeader'
import { Button } from '../../components/ui/Button'
import { Filter } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AssignmentsList } from './entities/assignments/AssignmentsList'
import { VehiclesList } from './entities/vehicles/VehiclesList'
import { DriversList } from './entities/drivers/DriversList'
import { TrailersList } from './entities/trailers/TrailersList'
import { HardwareList } from './entities/hardware/HardwareList'

interface FleetListProps {
  onSelectItem: (
    item: any,
    type: 'vehiculo' | 'conductor' | 'remolque' | 'asignacion' | 'hardware'
  ) => void
  onTabChange?: (tab: string) => void
  activeTab?: string
  transportistaNombre?: string
}

export function FleetList({
  onSelectItem,
  onTabChange,
  activeTab: externalActiveTab,
  transportistaNombre,
}: FleetListProps) {
  const [activeTab, setActiveTab] = useState(externalActiveTab || 'vehiculos')
  const [searchTerm, setSearchTerm] = useState('')

  // badge counts (these replace filteredX.length)
  const [counts, setCounts] = useState({
    remolques: 0,
    vehiculos: 0,
    conductores: 0,
    asignaciones: 0,
    hardware: 0,
  })

  const setCount = (key: keyof typeof counts, value: number) => {
    setCounts((prev) =>
      prev[key] === value ? prev : { ...prev, [key]: value }
    )
  }

  // Sync tab from parent
  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      setActiveTab(externalActiveTab)
    }
  }, [externalActiveTab, activeTab])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  const renderContent = () => {
    if (activeTab === 'vehiculos') {
      return (
        <VehiclesList
          onSelectItem={onSelectItem}
          transportistaNombre={transportistaNombre!}
          searchTerm={searchTerm}
          onCountChange={(n: number) => setCount('vehiculos', n)}
        />
      )
    }

    if (activeTab === 'conductores') {
      return (
        <DriversList
          onSelectItem={onSelectItem}
          transportistaNombre={transportistaNombre!}
          searchTerm={searchTerm}
          onCountChange={(n: number) => setCount('conductores', n)}
        />
      )
    }

    if (activeTab === 'remolques') {
      return (
        <TrailersList
          onSelectItem={onSelectItem}
          transportistaNombre={transportistaNombre!}
          searchTerm={searchTerm}
          onCountChange={(n: number) => setCount('remolques', n)}
        />
      )
    }

    if (activeTab === 'hardware') {
      return (
        <HardwareList
          onSelectItem={onSelectItem}
          transportistaNombre={transportistaNombre!}
          searchTerm={searchTerm}
          onCountChange={(n: number) => setCount('hardware', n)}
        />
      )
    }

    if (activeTab === 'asignaciones') {
      return (
        <AssignmentsList
          onSelectItem={onSelectItem}
          transportistaNombre={transportistaNombre}
          searchTerm={searchTerm}
          onCountChange={(n: number) => setCount('asignaciones', n)}
        />
      )
    }

    return null
  }

  return (
    <div className='flex flex-col h-full'>
      <PageHeader
        tabs={[
          {
            id: 'remolques',
            label: 'Remolques',
            badge: counts.remolques,
            active: activeTab === 'remolques',
            onClick: () => handleTabChange('remolques'),
          },
          {
            id: 'vehiculos',
            label: 'Vehículos',
            badge: counts.vehiculos,
            active: activeTab === 'vehiculos',
            onClick: () => handleTabChange('vehiculos'),
          },
          {
            id: 'conductores',
            label: 'Conductores',
            badge: counts.conductores,
            active: activeTab === 'conductores',
            onClick: () => handleTabChange('conductores'),
          },
          {
            id: 'asignaciones',
            label: 'Asignaciones',
            badge: counts.asignaciones,
            active: activeTab === 'asignaciones',
            onClick: () => handleTabChange('asignaciones'),
          },
          {
            id: 'hardware',
            label: 'Conexiones',
            badge: counts.hardware,
            active: activeTab === 'hardware',
            onClick: () => handleTabChange('hardware'),
          },
        ]}
        showSearch
        searchPlaceholder='Buscar...'
        onSearch={(value: string) => setSearchTerm(value)}
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

      {renderContent()}
    </div>
  )
}
