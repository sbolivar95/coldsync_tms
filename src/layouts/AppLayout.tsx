import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAppStore } from '../stores/useAppStore'
import { PrimaryButton } from '../components/widgets/PrimaryButton'
import { SecondaryButton } from '../components/widgets/SecondaryButton'
import { Button } from '../components/ui/Button'
import { Toaster } from '../components/ui/Sonner'
import { Plus, MoreHorizontal, Mail } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useAuth } from '../hooks/useAuth'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

// Mapeo de rutas a configuración de vista
const viewConfig: Record<
  string,
  {
    title: string
    breadcrumbs?: BreadcrumbItem[]
    dropdown?: { label: string }
    createLabel?: string
    secondaryCreateLabel?: string
  }
> = {
  '/dashboard': {
    title: 'Panel de Control',
    createLabel: 'Crear Reporte',
  },
  '/dispatch': {
    title: 'Despacho',
    createLabel: 'Importar Orden',
    secondaryCreateLabel: 'Crear Orden',
  },
  '/control-tower': {
    title: 'Torre de Control',
    createLabel: 'Crear Orden',
  },
  '/financials': {
    title: 'Conciliación',
    createLabel: 'Crear Factura',
  },
  '/carriers': {
    title: 'Transportistas',
    createLabel: 'Crear Transportista',
  },
  '/locations': {
    title: 'Ubicaciones',
    createLabel: 'Crear Ubicación',
  },
  '/lanes': {
    title: 'Carriles',
    createLabel: 'Crear Carril',
  },
  '/orders': {
    title: 'Órdenes',
  },
  '/alerts': {
    title: 'Alertas',
    createLabel: 'Crear Alerta',
  },
  '/settings': {
    title: 'Configuración',
  },
  '/profile': {
    title: 'Perfil de Usuario',
  },
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isInitializing } = useAuth()

  // ✅ IMPORTANT: All hooks must be called before any conditional returns
  // ✅ Optimizado: Selector múltiple con useShallow para evitar re-renders innecesarios
  const {
    sidebarCollapsed,
    toggleSidebar,
    breadcrumbsState,
    incrementResetTrigger,
    transportistasActiveTab,
    settingsActiveTab,
    setBreadcrumbs,
    triggerCreate,
    organizationMember,
    isPlatformUser,
  } = useAppStore(
    useShallow((state) => ({
      sidebarCollapsed: state.sidebarCollapsed,
      toggleSidebar: state.toggleSidebar,
      breadcrumbsState: state.breadcrumbsState,
      incrementResetTrigger: state.incrementResetTrigger,
      transportistasActiveTab: state.transportistasActiveTab,
      settingsActiveTab: state.settingsActiveTab,
      setBreadcrumbs: state.setBreadcrumbs,
      triggerCreate: state.triggerCreate,
      organizationMember: state.organizationMember,
      isPlatformUser: state.isPlatformUser,
    }))
  )

  // Verificar si el usuario es OWNER
  const isOwner = organizationMember?.role === 'OWNER' && !isPlatformUser

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className='flex h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto'></div>
          <p className='text-sm text-gray-600'>Cargando...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to='/login'
        replace
      />
    )
  }

  // Redirect to reset-password if user is in password reset flow
  // This prevents user from accessing other pages after clicking reset link
  const isPasswordResetInProgress = sessionStorage.getItem('password_reset_in_progress') === 'true'
  if (isPasswordResetInProgress && location.pathname !== '/reset-password') {
    return (
      <Navigate
        to='/reset-password'
        replace
      />
    )
  }

  // Redirect to set-password if user needs to change password (unless already on set-password page)
  // TODO: Implement password change check if needed
  // if (authSession?.needsPasswordChange && location.pathname !== '/set-password') {
  //   return (
  //     <Navigate
  //       to='/set-password'
  //       replace
  //     />
  //   )
  // }

  // Refs para componentes con métodos imperativos

  // Obtener breadcrumbs dinámicos si existen
  const dynamicBreadcrumbs = breadcrumbsState[location.pathname] || []

  // Obtener el label del botón según el contexto
  let createLabel = viewConfig[location.pathname]?.createLabel
  
  // No mostrar botón de crear si estamos en una página de creación
  const isOnCreatePage = location.pathname.endsWith('/new');
  
  // Determinar la pestaña activa basándose en la URL o en el store (fallback)
  let activeTab = settingsActiveTab
  if (location.pathname.includes('/settings/organizations')) {
    activeTab = 'organizaciones'
  } else if (location.pathname.includes('/settings/users')) {
    activeTab = 'usuarios'
  } else if (location.pathname.includes('/settings/products')) {
    activeTab = 'productos'
  } else if (location.pathname.includes('/settings/thermal-profiles')) {
    activeTab = 'perfil-termico'
  } else if (location.pathname.includes('/settings/rate-cards')) {
    activeTab = 'tarifarios'
  }

  if (location.pathname.startsWith('/settings')) {
    // Cambiar el label según el tab activo determinado
    switch (activeTab) {
      case 'organizaciones':
        // OWNER no puede crear organizaciones
        createLabel = isOwner ? undefined : 'Crear Organización'
        break
      case 'usuarios':
        createLabel = 'Crear Usuario'
        break
      case 'productos':
        createLabel = 'Crear Producto'
        break
      case 'perfil-termico':
        createLabel = 'Crear Perfil Térmico'
        break
      case 'tarifarios':
        createLabel = 'Crear Tarifario'
        break
      case 'peso-capacidad':
        createLabel = 'Agregar Peso/Capacidad'
        break
    }
  }

  // Determinar si mostrar el botón de invitación (solo para usuarios)
  const shouldShowInvitationButton =
    (location.pathname.includes('/settings/users') ||
      (location.pathname === '/settings' && settingsActiveTab === 'usuarios')) &&
    !location.pathname.includes('/new') &&
    !location.pathname.includes('/invite') &&
    !location.pathname.includes('/edit')

  // Handler para el botón de invitación
  const handleInvitationClick = () => {
    navigate('/settings/users/invite')
  }

  // Detect fleet tab from URL for create button label
  if (location.pathname.includes('/fleet/')) {
    if (location.pathname.includes('/vehicles')) {
      createLabel = 'Crear Vehículo'
    } else if (location.pathname.includes('/drivers')) {
      createLabel = 'Crear Conductor'
    } else if (location.pathname.includes('/trailers')) {
      createLabel = 'Crear Remolque'
    } else if (location.pathname.includes('/hardware')) {
      createLabel = 'Crear Dispositivo'
    } else if (location.pathname.includes('/assignments')) {
      createLabel = 'Crear Asignación'
    }
  } else if (location.pathname === '/carriers') {
    // Cambiar el label según el tab activo de Transportistas (cuando está en Fleet)
    switch (transportistasActiveTab) {
      case 'vehiculos':
        createLabel = 'Crear Vehículo'
        break
      case 'conductores':
        createLabel = 'Crear Conductor'
        break
      case 'remolques':
        createLabel = 'Crear Remolque'
        break
      case 'hardware':
        createLabel = 'Crear Dispositivo'
        break
      case 'asignaciones':
        createLabel = 'Crear Asignación'
        break
      case 'todos':
      case 'activos':
      case 'inactivos':
        createLabel = 'Crear Transportista'
        break
    }
  }

  // Determine config based on current path or parent paths
  let currentPathConfig = viewConfig[location.pathname]

  // Si no hay config para la ruta exacta, buscar una ruta padre (ej: de /settings/organizaciones a /settings)
  if (!currentPathConfig) {
    const parentPath = Object.keys(viewConfig).find(path =>
      location.pathname.startsWith(path) && path !== '/'
    )
    if (parentPath) {
      currentPathConfig = viewConfig[parentPath]
    }
  }

  const config = {
    ...currentPathConfig,
    createLabel,
    // Don't show title when there are dynamic breadcrumbs
    title:
      dynamicBreadcrumbs.length > 0
        ? ''
        : currentPathConfig?.title || '',
    breadcrumbs:
      dynamicBreadcrumbs.length > 0
        ? dynamicBreadcrumbs
        : currentPathConfig?.breadcrumbs,
  }

  const handleTitleClick = () => {
    // Limpiar breadcrumbs y volver a la lista
    setBreadcrumbs(location.pathname, [])
    // Incrementar el trigger para notificar al wrapper
    incrementResetTrigger()
  }

  const handleViewChange = (view: string) => {
    // Limpiar breadcrumbs de la vista anterior
    setBreadcrumbs(location.pathname, [])
    // Incrementar el trigger para resetear al nivel principal
    incrementResetTrigger()
    // Navegar a la nueva vista (asegurar que empiece con /)
    const route = view.startsWith('/') ? view : `/${view}`
    navigate(route)
  }

  const handleCreateClick = () => {
    // For carriers, use React Router navigation
    if (location.pathname === '/carriers') {
      navigate('/carriers/new')
      return
    }

    // For dispatch, navigate to new order page with context
    if (location.pathname.startsWith('/dispatch')) {
      navigate('/dispatch/new', { state: { from: location.pathname } })
      return
    }

    // For locations, use React Router navigation
    if (location.pathname === '/locations') {
      navigate('/locations/new')
      return
    }

    // For lanes, use React Router navigation
    if (location.pathname === '/lanes') {
      navigate('/lanes/new')
      return
    }

    // For migrated settings tabs
    if (location.pathname.startsWith('/settings')) {
      if (activeTab === 'usuarios') {
        navigate('/settings/users/new')
        return
      }
      if (activeTab === 'organizaciones') {
        navigate('/settings/organizations/new')
        return
      }
    }

    // For other routes, use the old event system (will be migrated later)
    triggerCreate(location.pathname)
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar
        activeView={location.pathname}
        onViewChange={handleViewChange}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Header
          title={config.title || ''}
          breadcrumbs={config.breadcrumbs}
          dropdown={config.dropdown}
          onTitleClick={
            config.breadcrumbs && config.breadcrumbs.length > 0
              ? handleTitleClick
              : undefined
          }
          actions={
            <>
              {shouldShowInvitationButton && (
                <SecondaryButton
                  icon={Mail}
                  onClick={handleInvitationClick}
                >
                  Enviar Invitación
                </SecondaryButton>
              )}
              {!isOnCreatePage && config.createLabel && !config.secondaryCreateLabel && (
                <PrimaryButton
                  icon={Plus}
                  onClick={handleCreateClick}
                >
                  {config.createLabel}
                </PrimaryButton>
              )}
              {!isOnCreatePage && config.createLabel && config.secondaryCreateLabel && (
                <SecondaryButton
                  icon={Plus}
                  onClick={handleCreateClick}
                >
                  {config.createLabel}
                </SecondaryButton>
              )}
              {!isOnCreatePage && config.secondaryCreateLabel && (
                <PrimaryButton
                  icon={Plus}
                  onClick={handleCreateClick}
                >
                  {config.secondaryCreateLabel}
                </PrimaryButton>
              )}
              {!isOnCreatePage && (config.createLabel || config.secondaryCreateLabel) && (
                <Button
                  variant='ghost'
                  size='sm'
                >
                  <MoreHorizontal className='w-4 h-4' />
                </Button>
              )}
            </>
          }
        />

        <main className='flex-1 overflow-hidden bg-gray-50'>
          <Outlet />
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
