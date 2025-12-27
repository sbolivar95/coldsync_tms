import { useState, useRef } from 'react'
import { Sidebar } from './layouts/Sidebar'
import { Header } from './layouts/Header'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Dispatch, DispatchRef } from './pages/Dispatch'
import { ControlTower } from './pages/ControlTower'
import { Reconciliation } from './pages/Reconciliation'
import { CarriersWrapper } from './pages/CarriersWrapper'
import { LocationsWrapper, LocationsRef } from './pages/LocationsWrapper'
import { RoutesWrapper, RoutesRef } from './pages/RoutesWrapper'
import { Alerts } from './pages/Alerts'
import { Settings, SettingsRef } from './pages/Settings'
import { Profile } from './pages/Profile'
import { PrimaryButton } from './components/widgets/PrimaryButton'
import { SecondaryButton } from './components/widgets/SecondaryButton'
import { Button } from './components/ui/Button'
import { Plus, MoreHorizontal } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [activeView, setActiveView] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [breadcrumbsState, setBreadcrumbsState] = useState<
    Record<string, BreadcrumbItem[]>
  >({})
  const [resetTrigger, setResetTrigger] = useState(0)
  const [transportistasActiveTab, setTransportistasActiveTab] =
    useState('todos') // Estado para el tab activo de Transportistas
  const [settingsActiveTab, setSettingsActiveTab] = useState('usuarios') // Estado para el tab activo de Settings

  // Refs para componentes con métodos imperativos
  const despachoRef = useRef<DispatchRef>(null)
  const settingsRef = useRef<SettingsRef>(null)
  const ubicacionesRef = useRef<LocationsRef>(null)
  const rutasRef = useRef<RoutesRef>(null)

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
    dashboard: {
      title: 'Panel de Control',
      createLabel: 'Crear Reporte',
    },
    dispatch: {
      title: 'Despacho',
      createLabel: 'Importar Orden',
      secondaryCreateLabel: 'Crear Orden',
    },
    'control-tower': {
      title: 'Torre de Control',
      createLabel: 'Crear Orden',
    },
    financials: {
      title: 'Conciliación',
      createLabel: 'Nueva Factura',
    },
    carriers: {
      title: 'Transportistas',
      createLabel: 'Agregar Transportista',
    },
    locations: {
      title: 'Ubicaciones',
      createLabel: 'Agregar Ubicación',
    },
    routes: {
      title: 'Rutas',
      createLabel: 'Crear Ruta',
    },
    alerts: {
      title: 'Alertas',
      createLabel: 'Configurar Alerta',
    },
    settings: {
      title: 'Configuración',
    },
    profile: {
      title: 'Perfil de Usuario',
    },
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />
      case 'dispatch':
        return (
          <Dispatch
            ref={despachoRef}
            onBreadcrumbChange={(breadcrumbs) => {
              setBreadcrumbsState({
                ...breadcrumbsState,
                dispatch: breadcrumbs,
              })
            }}
            resetTrigger={resetTrigger}
          />
        )
      case 'control-tower':
        return <ControlTower />
      case 'financials':
        return <Reconciliation />
      case 'carriers':
        return (
          <CarriersWrapper
            onBreadcrumbChange={(breadcrumbs) => {
              setBreadcrumbsState({
                ...breadcrumbsState,
                carriers: breadcrumbs,
              })
            }}
            resetTrigger={resetTrigger}
            onTabChange={setTransportistasActiveTab}
          />
        )
      case 'locations':
        return (
          <LocationsWrapper
            ref={ubicacionesRef}
            onBreadcrumbChange={(breadcrumbs) => {
              setBreadcrumbsState({
                ...breadcrumbsState,
                locations: breadcrumbs,
              })
            }}
            resetTrigger={resetTrigger}
          />
        )
      case 'routes':
        return (
          <RoutesWrapper
            ref={rutasRef}
            onBreadcrumbChange={(breadcrumbs) => {
              setBreadcrumbsState({ ...breadcrumbsState, routes: breadcrumbs })
            }}
            resetTrigger={resetTrigger}
          />
        )
      case 'alerts':
        return <Alerts />
      case 'settings':
        return (
          <Settings
            onTabChange={setSettingsActiveTab}
            ref={settingsRef}
          />
        )
      case 'profile':
        return <Profile />
      default:
        return <Dashboard />
    }
  }

  // Obtener breadcrumbs dinámicos si existen
  const dynamicBreadcrumbs = breadcrumbsState[activeView] || []

  // Obtener el label del botón según el contexto
  let createLabel = viewConfig[activeView].createLabel
  if (activeView === 'settings') {
    // Cambiar el label según el tab activo de Settings
    switch (settingsActiveTab) {
      case 'usuarios':
        createLabel = 'Agregar Usuario'
        break
      case 'productos':
        createLabel = 'Agregar Producto'
        break
      case 'perfil-termico':
        createLabel = 'Crear Perfil'
        break
      case 'peso-capacidad':
        createLabel = 'Agregar Peso/Capacidad'
        break
      case 'organizaciones':
        createLabel = 'Nueva Organización'
        break
    }
  }

  if (activeView === 'carriers') {
    // Cambiar el label según el tab activo de Transportistas (cuando está en Fleet)
    switch (transportistasActiveTab) {
      case 'vehiculos':
        createLabel = 'Nuevo Vehículo'
        break
      case 'conductores':
        createLabel = 'Nuevo Conductor'
        break
      case 'remolques':
        createLabel = 'Nuevo Remolque'
        break
      case 'hardware':
        createLabel = 'Nueva Conexión'
        break
      case 'asignaciones':
        createLabel = 'Nueva Asignación'
        break
      case 'todos':
      case 'activos':
      case 'inactivos':
        createLabel = 'Agregar Transportista'
        break
    }
  }

  const config = {
    ...viewConfig[activeView],
    createLabel,
    breadcrumbs:
      dynamicBreadcrumbs.length > 0
        ? dynamicBreadcrumbs
        : viewConfig[activeView].breadcrumbs,
  }

  const handleTitleClick = () => {
    // Limpiar breadcrumbs y volver a la lista
    setBreadcrumbsState({ ...breadcrumbsState, [activeView]: [] })
    // Incrementar el trigger para notificar al wrapper
    setResetTrigger(resetTrigger + 1)
  }

  const handleViewChange = (view: string) => {
    // Limpiar breadcrumbs de la vista anterior
    setBreadcrumbsState({ ...breadcrumbsState, [view]: [] })
    // Incrementar el trigger para resetear al nivel principal
    setResetTrigger(resetTrigger + 1)
    // Cambiar la vista
    setActiveView(view)
  }

  const handleCreateClick = () => {
    if (activeView === 'settings') {
      settingsRef.current?.handleCreate()
    } else if (activeView === 'locations') {
      ubicacionesRef.current?.handleCreate()
    } else if (activeView === 'routes') {
      rutasRef.current?.handleCreate()
    } else if (activeView === 'dispatch') {
      despachoRef.current?.openOrdenDialog()
    }
    // TODO: Agregar handlers para otras vistas si es necesario
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Header
          title={config.title}
          breadcrumbs={config.breadcrumbs}
          dropdown={config.dropdown}
          onTitleClick={
            config.breadcrumbs && config.breadcrumbs.length > 0
              ? handleTitleClick
              : undefined
          }
          actions={
            <>
              {config.createLabel && !config.secondaryCreateLabel && (
                <PrimaryButton
                  icon={Plus}
                  onClick={handleCreateClick}
                >
                  {config.createLabel}
                </PrimaryButton>
              )}
              {config.createLabel && config.secondaryCreateLabel && (
                <SecondaryButton
                  icon={Plus}
                  onClick={handleCreateClick}
                >
                  {config.createLabel}
                </SecondaryButton>
              )}
              {config.secondaryCreateLabel && (
                <PrimaryButton
                  icon={Plus}
                  onClick={handleCreateClick}
                >
                  {config.secondaryCreateLabel}
                </PrimaryButton>
              )}
              {(config.createLabel || config.secondaryCreateLabel) && (
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

        <main className='flex-1 overflow-auto bg-gray-50'>{renderView()}</main>
      </div>
    </div>
  )
}
