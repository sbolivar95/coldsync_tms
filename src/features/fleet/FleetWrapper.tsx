import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { FleetList } from './FleetList'
import { VehicleDetail } from './entities/vehicles/VehicleDetail'
import { DriverDetail } from './entities/drivers/DriverDetail'
import { TrailerDetail } from './entities/trailers/TrailerDetail'
import { AssignmentDetail } from './entities/assignments/AssignmentDetail'
import { HardwareDetail } from './entities/hardware/HardwareDetail'
import { useAppStore } from '../../stores/useAppStore'

interface FleetWrapperProps {
  onBreadcrumbChange?: (
    breadcrumbs: Array<{ label: string; onClick?: () => void }>
  ) => void
  onTabChange?: (tab: string) => void
  resetTrigger?: number
  transportistaNombre?: string
}

export function FleetWrapper({
  onBreadcrumbChange,
  onTabChange,
  resetTrigger,
  transportistaNombre,
}: FleetWrapperProps) {
  const location = useLocation()
  const { registerCreateHandler, setBreadcrumbs } = useAppStore()
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [itemType, setItemType] = useState<
    'vehiculo' | 'conductor' | 'remolque' | 'asignacion' | 'hardware' | null
  >(null)
  const [activeTab, setActiveTab] = useState('remolques')
  const [isCreating, setIsCreating] = useState(false)
  const prevResetTrigger = useRef(resetTrigger)

  // Reset when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== prevResetTrigger.current) {
      handleBack()
      prevResetTrigger.current = resetTrigger
    }
  }, [resetTrigger])

  useEffect(() => {
    if (onTabChange && !selectedItem) {
      onTabChange('remolques')
    }
  }, [])

  // Only register create handler when NOT in carrier context (standalone fleet page)
  useEffect(() => {
    // If transportistaNombre is provided, we're in carrier context
    // Don't register - carrier wrapper will handle navigation
    if (transportistaNombre) {
      return
    }

    const handleCreate = () => {
      // Determine what to create based on active tab
      let createType:
        | 'vehiculo'
        | 'conductor'
        | 'remolque'
        | 'asignacion'
        | 'hardware'
        | null = null
      let breadcrumbLabel = ''

      if (activeTab === 'vehiculos') {
        createType = 'vehiculo'
        breadcrumbLabel = 'Nuevo Vehículo'
      } else if (activeTab === 'conductores') {
        createType = 'conductor'
        breadcrumbLabel = 'Nuevo Conductor'
      } else if (activeTab === 'remolques') {
        createType = 'remolque'
        breadcrumbLabel = 'Nuevo Remolque'
      } else if (activeTab === 'asignaciones') {
        createType = 'asignacion'
        breadcrumbLabel = 'Nueva Asignación'
      } else if (activeTab === 'hardware') {
        createType = 'hardware'
        breadcrumbLabel = 'Nueva Conexión'
      }

      if (createType) {
        setItemType(createType)
        setSelectedItem(null)
        setIsCreating(true)

        setBreadcrumbs(location.pathname, [
          {
            label: breadcrumbLabel,
            onClick: undefined,
          },
        ])
      }
    }

    registerCreateHandler(location.pathname, handleCreate)
  }, [
    activeTab,
    transportistaNombre,
    location.pathname,
    registerCreateHandler,
    setBreadcrumbs,
  ])

  const handleSelectItem = (
    item: any,
    type: 'vehiculo' | 'conductor' | 'remolque' | 'asignacion' | 'hardware'
  ) => {
    setSelectedItem(item)
    setItemType(type)
    setIsCreating(false)

    const sectionName =
      type === 'vehiculo'
        ? 'Vehículos'
        : type === 'conductor'
        ? 'Conductores'
        : type === 'remolque'
        ? 'Remolques'
        : type === 'asignacion'
        ? 'Asignaciones'
        : 'Conexión'

    const itemName =
      type === 'vehiculo'
        ? item.unit_code
        : type === 'conductor'
        ? item.name
        : type === 'remolque'
        ? item.code
        : type === 'asignacion'
        ? item.set_name || `Set-${item.id.slice(0, 8)}`
        : item.connectionId

    const breadcrumbs = [
      {
        label: sectionName,
        onClick: handleBack,
      },
      { label: itemName },
    ]

    if (onBreadcrumbChange) {
      // In carrier context - use callback
      onBreadcrumbChange(breadcrumbs)
    } else {
      // Standalone fleet module - use global store
      setBreadcrumbs(location.pathname, breadcrumbs)
    }
  }

  const handleBack = () => {
    const previousType = itemType

    setSelectedItem(null)
    setItemType(null)
    setIsCreating(false)

    if (onBreadcrumbChange) {
      // In carrier context - use callback
      onBreadcrumbChange([])
    } else {
      // Standalone fleet module - use global store
      setBreadcrumbs(location.pathname, [])
    }

    if (onTabChange && previousType) {
      let targetTab = 'remolques'
      if (previousType === 'vehiculo') {
        targetTab = 'vehiculos'
      } else if (previousType === 'conductor') {
        targetTab = 'conductores'
      } else if (previousType === 'remolque') {
        targetTab = 'remolques'
      } else if (previousType === 'asignacion') {
        targetTab = 'asignaciones'
      } else if (previousType === 'hardware') {
        targetTab = 'hardware'
      }
      setActiveTab(targetTab)
      onTabChange(targetTab)
    }
  }

  const handleSaveSuccess = () => {
    handleBack()
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (onTabChange) {
      onTabChange(tab)
    }
  }

  // Render create view for vehicle
  if (isCreating && itemType === 'vehiculo') {
    return (
      <VehicleDetail
        vehicle={null}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={true}
      />
    )
  }

  // Render create view for driver
  if (isCreating && itemType === 'conductor') {
    return (
      <DriverDetail
        driver={null}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={true}
      />
    )
  }

  // Render create view for trailer
  if (isCreating && itemType === 'remolque') {
    return (
      <TrailerDetail
        trailer={null}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={true}
      />
    )
  }

  // Render create view for assignment
  if (isCreating && itemType === 'asignacion') {
    return (
      <AssignmentDetail
        assignment={null}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={true}
      />
    )
  }

  // Render create view for hardware
  if (isCreating && itemType === 'hardware') {
    return (
      <HardwareDetail
        hardware={null}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={true}
      />
    )
  }

  // Render detail views
  if (selectedItem && itemType === 'vehiculo') {
    return (
      <VehicleDetail
        vehicle={selectedItem}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={false}
      />
    )
  }

  if (selectedItem && itemType === 'conductor') {
    return (
      <DriverDetail
        driver={selectedItem}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={false}
      />
    )
  }

  if (selectedItem && itemType === 'remolque') {
    return (
      <TrailerDetail
        trailer={selectedItem}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={false}
      />
    )
  }

  if (selectedItem && itemType === 'asignacion') {
    return (
      <AssignmentDetail
        assignment={selectedItem}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={false}
      />
    )
  }

  if (selectedItem && itemType === 'hardware') {
    return (
      <HardwareDetail
        hardware={selectedItem}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={false}
      />
    )
  }

  // Render list view
  return (
    <FleetList
      onSelectItem={handleSelectItem}
      onTabChange={handleTabChange}
      activeTab={activeTab}
      transportistaNombre={transportistaNombre}
    />
  )
}
