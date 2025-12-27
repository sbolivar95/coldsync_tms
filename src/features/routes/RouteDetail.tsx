import { useState, useEffect } from 'react'
import { RouteForm } from './RouteForm'
import {
  routesService,
  routeStopsService,
  routeTypesService,
} from '../../services/routes.service'
import { locationsService } from '../../services/locations.service'
import type {
  RouteInsert,
  RouteUpdate,
  Location,
  RouteType,
} from '../../types/database.types'
import { useOrganization } from '@/hooks/useOrganization'

interface RouteDetailProps {
  route?: any | null // Can be Route with joined data or null for new
  onBack: () => void
}

export function RouteDetail({ route, onBack }: RouteDetailProps) {
  const { orgId, loading: orgLoading } = useOrganization()
  const [locations, setLocations] = useState<Location[]>([])
  const [routeTypes, setRouteTypes] = useState<RouteType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load required data
  useEffect(() => {
    // Don't load data until orgId is available
    if (orgLoading || !orgId) return

    const loadData = async () => {
      try {
        setIsLoading(true)
        const [locationsData, routeTypesData] = await Promise.all([
          locationsService.getActive(orgId),
          routeTypesService.getAll(orgId),
        ])
        setLocations(locationsData)
        setRouteTypes(routeTypesData)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Error al cargar datos. Por favor recargue la página.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [orgId, orgLoading])

  const handleSave = async (formData: any) => {
    if (!orgId) {
      alert('Error: Organización no disponible')
      return
    }

    try {
      // Prepare route data for insert/update
      const routeData: RouteInsert | RouteUpdate = {
        route_id: formData.route_id,
        name: formData.name,
        distance: parseFloat(formData.distance),
        service_cycle: formData.service_cycle
          ? parseFloat(formData.service_cycle)
          : null,
        is_active: formData.is_active,
        base_rate: parseFloat(formData.base_rate),
        km_rate: formData.km_rate ? parseFloat(formData.km_rate) : null,
        hourly_rate: formData.hourly_rate
          ? parseFloat(formData.hourly_rate)
          : null,
        loading_time: formData.loading_time
          ? parseFloat(formData.loading_time)
          : null,
        unloading_time: formData.unloading_time
          ? parseFloat(formData.unloading_time)
          : null,
        hoos_hour: formData.hoos_hour ? parseFloat(formData.hoos_hour) : null,
        refuel_time: formData.refuel_time
          ? parseFloat(formData.refuel_time)
          : null,
        operational_buffer: formData.operational_buffer
          ? parseFloat(formData.operational_buffer)
          : null,
        transit_time: formData.transit_time
          ? parseFloat(formData.transit_time)
          : null,
        route_type_id: formData.route_type_id
          ? parseInt(formData.route_type_id)
          : null,
        org_id: orgId,
      }

      // Prepare stops data
      const stopsData = formData.stops.map((stop: any) => ({
        location_id: parseInt(stop.location_id),
        stop_order: stop.stop_order,
        stop_type: stop.stop_type,
        notes: stop.notes || null,
      }))

      if (formData.id) {
        // Update existing route
        await routesService.update(formData.id, orgId, routeData as RouteUpdate)

        // Replace stops
        await routeStopsService.replaceForRoute(formData.id, orgId, stopsData)
      } else {
        // Create new route with stops
        await routesService.createWithStops(routeData as RouteInsert, stopsData)
      }

      // Success - go back to list
      onBack()
    } catch (error: any) {
      console.error('Error saving route:', error)

      // Check for duplicate route_id error
      if (error.message?.includes('duplicate') || error.code === '23505') {
        alert('El código de ruta ya existe. Por favor use un código diferente.')
      } else {
        alert('Error al guardar la ruta. Por favor intente nuevamente.')
      }
      throw error
    }
  }

  // Show loading while org is loading or data is loading
  if (orgLoading || !orgId || isLoading) {
    return (
      <div className='flex flex-col h-full'>
        <div className='flex-1 p-6 overflow-auto bg-gray-50'>
          <div className='max-w-6xl mx-auto'>
            <div className='flex items-center justify-center h-64'>
              <p className='text-gray-500'>Cargando...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex flex-col h-full'>
        <div className='flex-1 p-6 overflow-auto bg-gray-50'>
          <div className='max-w-6xl mx-auto'>
            <div className='flex items-center justify-center h-64'>
              <p className='text-red-500'>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 p-6 overflow-auto bg-gray-50'>
        <div className='max-w-6xl mx-auto'>
          <RouteForm
            route={route}
            locations={locations}
            routeTypes={routeTypes}
            onSave={handleSave}
            onCancel={onBack}
            orgId={orgId}
          />
        </div>
      </div>
    </div>
  )
}
