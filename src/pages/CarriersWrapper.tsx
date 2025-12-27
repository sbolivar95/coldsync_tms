import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { CarriersList } from '../features/carriers/CarriersList'
import { CarrierDetail } from '../features/carriers/CarrierDetail'
import { FleetWrapper } from '../features/fleet/FleetWrapper'
import { VehicleDetail } from '../features/fleet/entities/vehicles/VehicleDetail'
import { DriverDetail } from '../features/fleet/entities/drivers/DriverDetail'
import { TrailerDetail } from '../features/fleet/entities/trailers/TrailerDetail'
import { AssignmentDetail } from '../features/fleet/entities/assignments/AssignmentDetail'
import { HardwareDetail } from '../features/fleet/entities/hardware/HardwareDetail'
import type { Carrier } from '../types/database.types'
import { useAppStore } from '../stores/useAppStore'

export function CarriersWrapper() {
  const location = useLocation()
  const {
    setBreadcrumbs,
    resetTrigger,
    setTransportistasActiveTab,
    registerCreateHandler,
  } = useAppStore()
  const [view, setView] = useState<
    'list' | 'detail' | 'fleet' | 'create' | 'fleet-create'
  >('list')
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null)
  const [fleetCreateType, setFleetCreateType] = useState<
    'vehiculo' | 'conductor' | 'remolque' | 'asignacion' | 'hardware' | null
  >(null)
  const [fleetActiveTab, setFleetActiveTab] = useState<string>('remolques')
  const prevResetTrigger = useRef(resetTrigger)

  // Memoize the create handler to prevent infinite loops
  const handleCreate = useCallback(() => {
    if (view === 'fleet') {
      // We're in fleet view - create fleet item based on active tab
      let createType:
        | 'vehiculo'
        | 'conductor'
        | 'remolque'
        | 'asignacion'
        | 'hardware'
        | null = null
      let breadcrumbLabel = ''

      if (fleetActiveTab === 'vehiculos') {
        createType = 'vehiculo'
        breadcrumbLabel = 'Nuevo Vehículo'
      } else if (fleetActiveTab === 'conductores') {
        createType = 'conductor'
        breadcrumbLabel = 'Nuevo Conductor'
      } else if (fleetActiveTab === 'remolques') {
        createType = 'remolque'
        breadcrumbLabel = 'Nuevo Remolque'
      } else if (fleetActiveTab === 'asignaciones') {
        createType = 'asignacion'
        breadcrumbLabel = 'Nueva Asignación'
      } else if (fleetActiveTab === 'hardware') {
        createType = 'hardware'
        breadcrumbLabel = 'Nueva Conexión'
      }

      if (createType && selectedCarrier) {
        setFleetCreateType(createType)
        setView('fleet-create')

        const carrierName = selectedCarrier.commercial_name || ''
        setBreadcrumbs(location.pathname, [
          {
            label: carrierName,
            onClick: () => {
              setView('fleet') // Go back to fleet, not detail
              setFleetCreateType(null)
              setBreadcrumbs(location.pathname, [
                {
                  label: carrierName,
                  onClick: () => {
                    setView('detail')
                    setBreadcrumbs(location.pathname, [{ label: carrierName }])
                  },
                },
              ])
            },
          },
          {
            label: breadcrumbLabel,
            onClick: undefined,
          },
        ])
      }
    } else {
      // We're in carrier list/detail - create carrier
      setView('create')
      setSelectedCarrier(null)
      setBreadcrumbs(location.pathname, [
        {
          label: 'Nuevo Transportista',
          onClick: undefined,
        },
      ])
    }
  }, [view, fleetActiveTab, selectedCarrier, location.pathname, setBreadcrumbs])

  // Register create handler
  useEffect(() => {
    registerCreateHandler(location.pathname, handleCreate)
  }, [location.pathname, registerCreateHandler, handleCreate])

  // Reset cuando cambia resetTrigger
  useEffect(() => {
    if (resetTrigger !== prevResetTrigger.current) {
      setView('list')
      setSelectedCarrier(null)
      setFleetCreateType(null)
      setBreadcrumbs(location.pathname, [])
      prevResetTrigger.current = resetTrigger
    }
  }, [resetTrigger, location.pathname, setBreadcrumbs])

  const handleCarrierSelect = (carrier: Carrier) => {
    setSelectedCarrier(carrier)
    setView('detail')
    setBreadcrumbs(location.pathname, [
      {
        label: carrier.commercial_name || '',
        onClick: undefined,
      },
    ])
  }

  const handleViewFleet = (carrier: Carrier) => {
    setSelectedCarrier(carrier)
    setView('fleet')
    setFleetCreateType(null)

    const carrierName = carrier.commercial_name || ''

    setBreadcrumbs(location.pathname, [
      {
        label: carrierName,
        onClick: () => {
          setView('detail')
          setFleetCreateType(null)
          setBreadcrumbs(location.pathname, [{ label: carrierName }])
        },
      },
    ])

    setFleetActiveTab('vehiculos')
    setTransportistasActiveTab('vehiculos')
  }

  const handleFleetTabChange = (tab: string) => {
    setFleetActiveTab(tab)
    setTransportistasActiveTab(tab)
  }

  const handleFleetBreadcrumbChange = (
    fleetBreadcrumbs: Array<{ label: string; onClick?: () => void }>
  ) => {
    if (selectedCarrier) {
      const carrierName = selectedCarrier.commercial_name || ''
      const combinedBreadcrumbs = [
        {
          label: carrierName,
          onClick: () => {
            setView('detail')
            setBreadcrumbs(location.pathname, [{ label: carrierName }])
          },
        },
        ...fleetBreadcrumbs,
      ]
      setBreadcrumbs(location.pathname, combinedBreadcrumbs)
    }
  }

  const handleBack = () => {
    setSelectedCarrier(null)
    setView('list')
    setFleetCreateType(null)
    setBreadcrumbs(location.pathname, [])
  }

  const handleSaveSuccess = () => {
    // After successful save, go back to appropriate view
    if (view === 'fleet-create') {
      // After creating fleet item, go back to fleet view
      setView('fleet')
      setFleetCreateType(null)
      if (selectedCarrier) {
        const carrierName = selectedCarrier.commercial_name || ''
        setBreadcrumbs(location.pathname, [{ label: carrierName }])
      }
    } else {
      // After creating carrier, go back to list
      setSelectedCarrier(null)
      setView('list')
      setFleetCreateType(null)
      setBreadcrumbs(location.pathname, [])
    }
  }

  // Render fleet create view
  if (view === 'fleet-create' && fleetCreateType) {
    const handleFleetCreateBack = () => {
      setView('fleet')
      setFleetCreateType(null)
      if (selectedCarrier) {
        const carrierName = selectedCarrier.commercial_name || ''
        setBreadcrumbs(location.pathname, [
          {
            label: carrierName,
            onClick: () => {
              setView('fleet') // Go back to fleet list, not carrier detail
              setFleetCreateType(null)
              setBreadcrumbs(location.pathname, [
                {
                  label: carrierName,
                  onClick: () => {
                    setView('detail')
                    setBreadcrumbs(location.pathname, [{ label: carrierName }])
                  },
                },
              ])
            },
          },
        ])
      }
    }

    if (fleetCreateType === 'vehiculo') {
      return (
        <VehicleDetail
          vehicle={null}
          onBack={handleFleetCreateBack}
          onSave={handleSaveSuccess}
          isCreating={true}
        />
      )
    }

    if (fleetCreateType === 'conductor') {
      return (
        <DriverDetail
          driver={null}
          onBack={handleFleetCreateBack}
          onSave={handleSaveSuccess}
          isCreating={true}
          carrierId={selectedCarrier?.id}
        />
      )
    }

    if (fleetCreateType === 'remolque') {
      return (
        <TrailerDetail
          trailer={null}
          onBack={handleFleetCreateBack}
          onSave={handleSaveSuccess}
          isCreating={true}
        />
      )
    }

    if (fleetCreateType === 'asignacion') {
      return (
        <AssignmentDetail
          assignment={null}
          onBack={handleFleetCreateBack}
          onSave={handleSaveSuccess}
          isCreating={true}
          carrierId={selectedCarrier?.id}
        />
      )
    }

    if (fleetCreateType === 'hardware') {
      return (
        <HardwareDetail
          hardware={null}
          onBack={handleFleetCreateBack}
          onSave={handleSaveSuccess}
          isCreating={true}
        />
      )
    }
  }

  // Render create view
  if (view === 'create') {
    return (
      <CarrierDetail
        carrier={null}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={true}
      />
    )
  }

  // Render fleet view
  if (view === 'fleet' && selectedCarrier) {
    const carrierName = selectedCarrier.commercial_name || ''
    return (
      <FleetWrapper
        transportistaNombre={carrierName}
        onBreadcrumbChange={handleFleetBreadcrumbChange}
        onTabChange={handleFleetTabChange}
        resetTrigger={resetTrigger}
      />
    )
  }

  // Render detail view
  if (view === 'detail' && selectedCarrier) {
    return (
      <CarrierDetail
        carrier={selectedCarrier}
        onBack={handleBack}
        onSave={handleSaveSuccess}
        isCreating={false}
      />
    )
  }

  // Render list view
  return (
    <CarriersList
      onSelectCarrier={handleCarrierSelect}
      onViewFleet={handleViewFleet}
      onTabChange={setTransportistasActiveTab}
      activeTab={undefined}
    />
  )
}
