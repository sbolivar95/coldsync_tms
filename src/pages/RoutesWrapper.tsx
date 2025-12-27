import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { useLocation } from 'react-router-dom'
import { RoutesList } from '../features/routes/RoutesList'
import { useAppStore } from '../stores/useAppStore'
import { routesService } from '../services/routes.service'
import { RouteDetail } from '@/features/routes/RouteDetail'
import { useOrganization } from '@/hooks/useOrganization'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

export interface RoutesRef {
  handleCreate: () => void
}

export const RoutesWrapper = forwardRef<RoutesRef, {}>((_, ref) => {
  const location = useLocation()
  const { orgId, loading: orgLoading } = useOrganization()
  const { setBreadcrumbs, resetTrigger, registerCreateHandler } = useAppStore()
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null)
  const prevResetTrigger = useRef(resetTrigger)

  // Detect when clicking on title to go back
  useEffect(() => {
    if (resetTrigger !== prevResetTrigger.current) {
      handleBack()
      prevResetTrigger.current = resetTrigger
    }
  }, [resetTrigger])

  const handleSelectRoute = async (route: any) => {
    if (!orgId) return

    try {
      // Fetch full route details with stops
      const fullRoute = await routesService.getById(route.id, orgId)
      setSelectedRoute(fullRoute)
      setView('detail')

      // Update breadcrumbs
      setBreadcrumbs(location.pathname, [
        {
          label: route.name,
          onClick: undefined, // Current level is not clickable
        },
      ])
    } catch (error) {
      console.error('Error loading route details:', error)
      alert('Error al cargar detalles de la ruta')
    }
  }

  const handleBack = () => {
    setView('list')
    setSelectedRoute(null)

    // Clear breadcrumbs
    setBreadcrumbs(location.pathname, [])
  }

  const handleCreate = () => {
    setSelectedRoute(null)
    setView('detail')

    // Set breadcrumb for new route
    setBreadcrumbs(location.pathname, [
      {
        label: 'Nueva Ruta',
        onClick: undefined,
      },
    ])
  }

  useImperativeHandle(ref, () => ({
    handleCreate,
  }))

  // Register create handler
  useEffect(() => {
    registerCreateHandler(location.pathname, handleCreate)
  }, [location.pathname])

  // Show loading state while org is loading
  if (orgLoading || !orgId) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-gray-500'>Cargando...</p>
      </div>
    )
  }

  if (view === 'detail') {
    return (
      <RouteDetail
        route={selectedRoute}
        onBack={handleBack}
      />
    )
  }

  return (
    <RoutesList
      onSelectRoute={handleSelectRoute}
      orgId={orgId}
    />
  )
})

RoutesWrapper.displayName = 'RoutesWrapper'
