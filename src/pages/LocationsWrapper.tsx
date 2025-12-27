import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react'
import { useLocation } from 'react-router-dom'
import { LocationsList } from '../features/locations/LocationsList'
import { LocationDetail } from '../features/locations/LocationDetail'
import { useAppStore } from '../stores/useAppStore'
import {
  locationsService,
  locationTypesService,
} from '../services/locations.service'

import type { Location, LocationType } from '../types/database.types'
import { useOrganization } from '@/hooks/useOrganization'

type LocationWithRels = Location & {
  // nested join objects (when selected with PostgREST joins)
  location_types?: Pick<LocationType, 'id' | 'name'> | null
  countries?: { id: number; name: string; iso_code: string } | null
}

export interface LocationsRef {
  handleCreate: () => void
}

export const LocationsWrapper = forwardRef<LocationsRef, {}>((_, ref) => {
  const routeLocation = useLocation()
  const appStore = useAppStore() as any
  const { setBreadcrumbs, resetTrigger, registerCreateHandler } = appStore

  const { orgId } = useOrganization()

  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedLocation, setSelectedLocation] =
    useState<LocationWithRels | null>(null)
  const [locations, setLocations] = useState<LocationWithRels[]>([])
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const prevResetTrigger = useRef(resetTrigger)

  const loadAll = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    try {
      const [locs, types] = await Promise.all([
        locationsService.getAll(orgId) as Promise<LocationWithRels[]>,
        locationTypesService.getAll(orgId),
      ])
      setLocations(locs)
      setLocationTypes(types)
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  // Detect when user clicks the title/breadcrumb reset to go back
  useEffect(() => {
    if (resetTrigger !== prevResetTrigger.current) {
      handleBack()
      prevResetTrigger.current = resetTrigger
    }
  }, [resetTrigger])

  const handleSelectLocation = async (loc: LocationWithRels) => {
    setSelectedLocation(loc)
    setView('detail')

    setBreadcrumbs?.(routeLocation.pathname, [
      {
        label: loc.name,
        onClick: undefined,
      },
    ])

    // Refresh selected location with latest data (in case list is stale)
    if (!orgId) return
    try {
      const fresh = (await locationsService.getById(
        Number(loc.id),
        orgId
      )) as LocationWithRels | null
      if (fresh) setSelectedLocation(fresh)
    } catch {
      // ignore
    }
  }

  const createLocationType = async (name: string) => {
    if (!orgId) return null

    const trimmed = name.trim()
    if (!trimmed) return null

    // optional: avoid duplicates (case-insensitive)
    const existing = locationTypes.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (existing) return existing

    const created = await locationTypesService.create({
      org_id: orgId,
      name: trimmed,
    } as any)

    const next = [...locationTypes, created].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    setLocationTypes(next)

    return created
  }

  const handleBack = () => {
    setView('list')
    setSelectedLocation(null)
    setBreadcrumbs?.(routeLocation.pathname, [])
  }

  const handleCreate = () => {
    setSelectedLocation(null)
    setView('detail')

    setBreadcrumbs?.(routeLocation.pathname, [
      {
        label: 'Nueva Ubicación',
        onClick: undefined,
      },
    ])
  }

  const handleDelete = async (id: number) => {
    if (!orgId) return
    const ok = window.confirm(
      '¿Eliminar esta ubicación? Esta acción no se puede deshacer.'
    )
    if (!ok) return

    await locationsService.hardDelete(id, orgId)
    await loadAll()

    if (selectedLocation?.id === id) {
      handleBack()
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!orgId || ids.length === 0) return
    const ok = window.confirm(
      `¿Eliminar ${ids.length} ubicaci${
        ids.length === 1 ? 'ón' : 'ones'
      }? Esta acción no se puede deshacer.`
    )
    if (!ok) return

    await Promise.all(ids.map((id) => locationsService.hardDelete(id, orgId)))
    await loadAll()
  }

  // ✅ UPDATED: matches your DB schema (country_id, num_docks, geofence fields)
  const handleSave = async (values: {
    id?: number | null
    name: string
    code: string
    type_location_id?: number | null
    address: string
    city: string
    country_id: number
    num_docks: number
    is_active: boolean
    geofence_type: 'circular' | 'polygon'
    geofence_data: any
  }) => {
    if (!orgId) return

    // DB requires code NOT NULL
    if (!values.code?.trim()) {
      alert('El código es requerido')
      return
    }

    setSaving(true)
    try {
      if (values.id) {
        await locationsService.update(values.id, orgId, {
          name: values.name,
          code: values.code.trim(),
          type_location_id: values.type_location_id ?? null,
          address: values.address,
          city: values.city,
          country_id: values.country_id,
          num_docks: values.num_docks,
          is_active: values.is_active,
          geofence_type: values.geofence_type,
          geofence_data: values.geofence_data,
        } as any)
      } else {
        await locationsService.create({
          org_id: orgId,
          name: values.name,
          code: values.code.trim(),
          type_location_id: values.type_location_id ?? null,
          address: values.address,
          city: values.city,
          country_id: values.country_id,
          num_docks: values.num_docks,
          is_active: values.is_active,
          geofence_type: values.geofence_type,
          geofence_data: values.geofence_data,
        } as any)
      }

      await loadAll()
      handleBack()
    } finally {
      setSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({ handleCreate }))

  // Register creation handler for the header create button
  useEffect(() => {
    registerCreateHandler?.(routeLocation.pathname, handleCreate)
  }, [routeLocation.pathname])

  if (view === 'detail') {
    return (
      <LocationDetail
        location={selectedLocation}
        locationTypes={locationTypes}
        saving={saving}
        onSave={handleSave}
        onBack={handleBack}
        onCreateLocationType={createLocationType}
      />
    )
  }

  return (
    <LocationsList
      locations={locations}
      loading={loading}
      onSelectLocation={handleSelectLocation}
      onDeleteLocation={(loc) => handleDelete(Number(loc.id))}
      onBulkDeleteLocations={(ids) => handleBulkDelete(ids)}
    />
  )
})

LocationsWrapper.displayName = 'LocationsWrapper'
