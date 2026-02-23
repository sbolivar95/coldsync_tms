import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../stores/useAppStore'
import type { StatusFilterValue } from '../../../components/ui/StatusFilter'
import type { EntityStatusFilterValue } from '../../../components/ui/EntityStatusFilter'
import type { Organization } from './useOrganizations'

interface UseSettingsTabsProps {
  canAccessOrganizations: boolean
  isPlatformUser: boolean
  organization?: { id: string } | null
  organizationMember?: { role: string } | null
}

/**
 * Custom hook for managing tabs, search, filters, and navigation in Settings page
 * Handles tab state, search term, filters, and organization navigation
 */
export function useSettingsTabs({
  canAccessOrganizations,
  isPlatformUser,
  organizationMember,
}: UseSettingsTabsProps): {
  activeTab: string
  searchTerm: string
  statusFilter: StatusFilterValue
  entityStatusFilter: EntityStatusFilterValue
  organizationView: 'list' | 'detail'
  selectedOrganizationForDetail: Organization | null
  tabs: Array<{
    id: string
    label: string
    active: boolean
    onClick: () => void
  }>
  handleTabChange: (tab: string) => void
  handleSearchChange: (value: string) => void
  handleStatusFilterChange: (value: StatusFilterValue) => void
  handleEntityStatusFilterChange: (value: EntityStatusFilterValue) => void
  handleOrganizationRowClick: (org: Organization) => void
  handleOrganizationCreate: () => void
  handleOrganizationDetailBack: () => void
  handleUserCreate: () => void
  handleUserInvite: () => void
  handleUserEdit: (userId: string) => void
  handleThermalProfileCreate: () => void
  handleThermalProfileEdit: (profileId: string) => void
  handleProductCreate: () => void
  handleProductEdit: (productId: string) => void
  handleRateCardCreate: () => void
  handleRateCardEdit: (rateCardId: string) => void
  handleRateCardDetailBack: () => void
  getFilterConfig: () => {
    type: 'status' | 'entity' | null
    options?: Array<{ value: string; label: string }>
  }
  getSearchPlaceholder: () => string
  setSelectedOrganizationForDetail: (org: Organization | null) => void
} {
  const location = useLocation()
  const navigate = useNavigate()
  const setSettingsActiveTab = useAppStore((state) => state.setSettingsActiveTab)
  const setBreadcrumbs = useAppStore((state) => state.setBreadcrumbs)
  const resetTrigger = useAppStore((state) => state.resetTrigger)
  const prevResetTrigger = useRef(resetTrigger)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all')
  const [entityStatusFilter, setEntityStatusFilter] = useState<EntityStatusFilterValue>('all')

  // Organization navigation state
  const [organizationView, setOrganizationView] = useState<'list' | 'detail'>('list')
  const [selectedOrganizationForDetail, setSelectedOrganizationForDetail] =
    useState<Organization | null>(null)

  const settingsActiveTab = useAppStore((state) => state.settingsActiveTab)

  // 1. Derivar Active Tab (Fuente de la verdad: URL > Store > Default)
  const activeTab = useMemo(() => {
    const path = location.pathname
    if (path.includes('/settings/organizations')) return 'organizaciones'
    if (path.includes('/settings/users')) return 'usuarios'
    if (path.includes('/settings/products')) return 'productos'
    if (path.includes('/settings/thermal-profiles')) return 'perfil-termico'
    if (path.includes('/settings/rate-cards')) return 'tarifarios'


    // Si estamos en la base /settings, usamos el store o el default
    return settingsActiveTab || (canAccessOrganizations ? 'organizaciones' : 'usuarios')
  }, [location.pathname, canAccessOrganizations, settingsActiveTab])

  // 2. Sincronizar el store global para que el Header lo vea
  useEffect(() => {
    if (settingsActiveTab !== activeTab) {
      setSettingsActiveTab(activeTab)
    }
  }, [activeTab, settingsActiveTab, setSettingsActiveTab])

  // Mapeo de tabs en español a rutas en inglés
  const getRouteFromTab = (tab: string): string => {
    const tabToRouteMap: Record<string, string> = {
      'organizaciones': 'organizations',
      'usuarios': 'users',
      'productos': 'products',
      'perfil-termico': 'thermal-profiles',
      'tarifarios': 'rate-cards',
    }
    return tabToRouteMap[tab] || tab
  }

  // Mapeo inverso: rutas en español a rutas en inglés (para redirecciones)
  const routeRedirectMap: Record<string, string> = {
    '/settings/usuarios': '/settings/users',
    '/settings/organizaciones': '/settings/organizations',
    '/settings/productos': '/settings/products',
    '/settings/perfil-termico': '/settings/thermal-profiles',
    '/settings/tarifarios': '/settings/rate-cards',
  }

  // Redirección automática para rutas en español obsoletas
  useEffect(() => {
    const path = location.pathname
    if (routeRedirectMap[path]) {
      navigate(routeRedirectMap[path], { replace: true })
      return
    }
    // También manejar sub-rutas en español (ej: /settings/usuarios/new)
    if (path.startsWith('/settings/usuarios/')) {
      const subPath = path.replace('/settings/usuarios', '/settings/users')
      navigate(subPath, { replace: true })
      return
    }
    if (path.startsWith('/settings/organizaciones/')) {
      const subPath = path.replace('/settings/organizaciones', '/settings/organizations')
      navigate(subPath, { replace: true })
      return
    }
    if (path.startsWith('/settings/perfil-termico/')) {
      const subPath = path.replace('/settings/perfil-termico', '/settings/thermal-profiles')
      navigate(subPath, { replace: true })
      return
    }
    if (path.startsWith('/settings/productos/')) {
      const subPath = path.replace('/settings/productos', '/settings/products')
      navigate(subPath, { replace: true })
      return
    }
    if (path.startsWith('/settings/tarifarios/')) {
      const subPath = path.replace('/settings/tarifarios', '/settings/rate-cards')
      navigate(subPath, { replace: true })
      return
    }
  }, [location.pathname, navigate])

  // Redirección automática si estamos solo en /settings
  useEffect(() => {
    if (location.pathname === '/settings' || location.pathname === '/settings/') {
      const targetTab = settingsActiveTab || (canAccessOrganizations ? 'organizaciones' : 'usuarios')
      const targetRoute = getRouteFromTab(targetTab)
      navigate(`/settings/${targetRoute}`, { replace: true })
    }
  }, [location.pathname, canAccessOrganizations, settingsActiveTab, navigate])

  // 3. Sincronizar Breadcrumbs y View State basado en la URL
  useEffect(() => {
    if (location.pathname.includes('/settings/organizations/')) {
      setOrganizationView('detail')
      const isNew = location.pathname.endsWith('/new')

      const label = isNew
        ? 'Nueva Organización'
        : (selectedOrganizationForDetail?.comercial_name || '...')

      setBreadcrumbs(location.pathname, [
        { label: 'Empresas', onClick: () => navigate('/settings/organizations') },
        { label, onClick: undefined }
      ])
    } else if (location.pathname.includes('/settings/users/')) {
      const isNew = location.pathname.endsWith('/new')
      const isInvite = location.pathname.endsWith('/invite')
      const isEdit = location.pathname.includes('/edit')

      const label = isNew
        ? 'Nuevo Usuario'
        : isInvite
          ? 'Enviar Invitación'
          : isEdit
            ? 'Editar Usuario'
            : '...'

      setBreadcrumbs(location.pathname, [
        { label: 'Usuarios', onClick: () => navigate('/settings/users') },
        { label, onClick: undefined }
      ])
    } else if (location.pathname.includes('/settings/thermal-profiles/')) {
      const isNew = location.pathname.endsWith('/new')
      const isEdit = location.pathname.includes('/edit')

      const label = isNew
        ? 'Nuevo Perfil Térmico'
        : isEdit
          ? 'Editar Perfil Térmico'
          : '...'

      setBreadcrumbs(location.pathname, [
        { label: 'Perfiles Térmicos', onClick: () => navigate('/settings/thermal-profiles') },
        { label, onClick: undefined }
      ])
    } else if (location.pathname.includes('/settings/products/')) {
      const isNew = location.pathname.endsWith('/new')
      const isEdit = location.pathname.includes('/edit')

      const label = isNew
        ? 'Nuevo Producto'
        : isEdit
          ? 'Editar Producto'
          : '...'

      setBreadcrumbs(location.pathname, [
        { label: 'Productos', onClick: () => navigate('/settings/products') },
        { label, onClick: undefined }
      ])
    } else if (location.pathname.includes('/settings/rate-cards/')) {
      const isNew = location.pathname.endsWith('/new')
      const isEdit = !isNew && location.pathname !== '/settings/rate-cards' // :rateCardId or .../edit

      const label = isNew
        ? 'Nuevo Tarifario'
        : isEdit
          ? 'Editar Tarifario'
          : '...'

      setBreadcrumbs(location.pathname, [
        { label: 'Tarifarios', onClick: () => navigate('/settings/rate-cards') },
        { label, onClick: undefined }
      ])
    } else {
      setOrganizationView('list')
      if (location.pathname.startsWith('/settings')) {
        setBreadcrumbs(location.pathname, [])
      }
    }
  }, [location.pathname, selectedOrganizationForDetail, setBreadcrumbs, navigate])

  // Handlers - Tab Management
  const handleTabChange = useCallback(
    (tab: string) => {
      // Para rutas migradas, navegamos a la URL correspondiente
      if (tab === 'organizaciones') {
        navigate('/settings/organizations')
      } else if (tab === 'usuarios') {
        navigate('/settings/users')
      } else if (tab === 'perfil-termico') {
        navigate('/settings/thermal-profiles')
      } else if (tab === 'productos') {
        navigate('/settings/products')
      } else if (tab === 'tarifarios') {
        navigate('/settings/rate-cards')
      } else {
        // Para rutas no migradas aún, actualizamos el store y vamos a la base
        setSettingsActiveTab(tab)
        navigate('/settings')
      }

      setSearchTerm('')
      setStatusFilter('all')
      setEntityStatusFilter('all')

      // Reset organization state if coming from detail
      if (organizationView === 'detail') {
        setSelectedOrganizationForDetail(null)
        setBreadcrumbs(location.pathname, [])
      }
    },
    [setSettingsActiveTab, setBreadcrumbs, location.pathname, organizationView, navigate]
  )

  // Reset when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== prevResetTrigger.current) {
      setOrganizationView('list')
      setSelectedOrganizationForDetail(null)
      setBreadcrumbs(location.pathname, [])
      prevResetTrigger.current = resetTrigger
    }
  }, [resetTrigger, location.pathname, setBreadcrumbs])

  // Sync initial tab with user role
  useEffect(() => {
    const userRole = organizationMember?.role || ''
    const isStaff = userRole === 'STAFF' || userRole === 'Personal'
    const isDriver = userRole === 'DRIVER' || userRole === 'Conductor'

    // If user cannot access organizations and currently on "organizaciones" tab, switch to "usuarios"
    if (!canAccessOrganizations && activeTab === 'organizaciones') {
      navigate('/settings/users', { replace: true })
    }

    // If STAFF or DRIVER is on a restricted tab, switch to "usuarios"
    if ((isStaff || isDriver) && (activeTab === 'productos' || activeTab === 'perfil-termico' || activeTab === 'tarifarios')) {
      navigate('/settings/users', { replace: true })
    }

    // If user can access organizations and currently on a non-existent tab, switch to "organizaciones"
    if (
      canAccessOrganizations &&
      !['organizaciones', 'usuarios', 'productos', 'perfil-termico', 'tarifarios'].includes(activeTab)
    ) {
      navigate('/settings/organizations', { replace: true })
    }

    // If user cannot access organizations and on a non-existent tab, switch to "usuarios"
    if (
      !canAccessOrganizations &&
      !['usuarios', 'productos', 'perfil-termico', 'tarifarios'].includes(activeTab)
    ) {
      navigate('/settings/users', { replace: true })
    }
  }, [canAccessOrganizations, activeTab, navigate, organizationMember])

  // Handlers - Search and Filters
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleStatusFilterChange = (value: StatusFilterValue) => {
    setStatusFilter(value)
  }

  const handleEntityStatusFilterChange = (value: EntityStatusFilterValue) => {
    setEntityStatusFilter(value)
  }

  // Organization navigation handlers
  const handleOrganizationRowClick = (org: Organization) => {
    setSelectedOrganizationForDetail(org)
    navigate(`/settings/organizations/${org.id}`)
  }

  const handleOrganizationCreate = () => {
    setSelectedOrganizationForDetail(null)
    navigate('/settings/organizations/new')
  }

  const handleOrganizationDetailBack = () => {
    navigate('/settings/organizations')
  }

  const handleUserCreate = () => {
    navigate('/settings/users/new')
  }

  const handleUserInvite = () => {
    navigate('/settings/users/invite')
  }

  const handleUserEdit = (userId: string) => {
    navigate(`/settings/users/${userId}/edit`)
  }

  const handleThermalProfileCreate = () => {
    navigate('/settings/thermal-profiles/new')
  }

  const handleThermalProfileEdit = (profileId: string) => {
    navigate(`/settings/thermal-profiles/${profileId}/edit`)
  }

  const handleProductCreate = () => {
    navigate('/settings/products/new')
  }

  const handleProductEdit = (productId: string) => {
    navigate(`/settings/products/${productId}/edit`)
  }

  const handleRateCardCreate = () => {
    navigate('/settings/rate-cards/new')
  }

  const handleRateCardEdit = (rateCardId: string) => {
    navigate(`/settings/rate-cards/${rateCardId}`)
  }

  const handleRateCardDetailBack = () => {
    navigate('/settings/rate-cards')
  }

  // UI Helpers - Return filter configuration instead of JSX
  const getFilterConfig = () => {
    // Status filter for products, thermal profiles, and rate cards (is_active field)
    if (activeTab === 'productos' || activeTab === 'perfil-termico' || activeTab === 'tarifarios') {
      return {
        type: 'status' as const,
      }
    }

    // Entity status filter for users
    if (activeTab === 'usuarios') {
      return {
        type: 'entity' as const,
        options: [
          { value: 'Activo', label: 'Activos' },
          { value: 'Suspendido', label: 'Suspendidos' },
        ],
      }
    }

    // Entity status filter for organizations (only platform users)
    if (activeTab === 'organizaciones' && isPlatformUser) {
      return {
        type: 'entity' as const,
        options: [
          { value: 'ACTIVE', label: 'Activos' },
          { value: 'INACTIVE', label: 'Inactivos' },
        ],
      }
    }

    // OWNER doesn't see status filter (only sees their own organization)
    return {
      type: null,
    }
  }

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'organizaciones':
        return 'Buscar organizaciones...'
      case 'usuarios':
        return 'Buscar usuarios...'
      case 'productos':
        return 'Buscar productos...'
      case 'perfil-termico':
        return 'Buscar perfiles térmicos...'
      case 'tarifarios':
        return 'Buscar tarifarios...'
      default:
        return 'Buscar...'
    }
  }

  // Build tabs array based on user role
  // Platform Admins (DEV/PLATFORM_ADMIN): Empresas, Usuarios, Perfiles Térmicos, Productos
  // OWNER: Empresas (solo su organización), Usuarios, Perfiles Térmicos, Productos
  // ADMIN: Usuarios, Perfiles Térmicos, Productos (no "Empresas")
  // STAFF: Solo Usuarios (no "Empresas", "Perfiles Térmicos", ni "Productos")
  // DRIVER: Solo Usuarios (no "Empresas", "Perfiles Térmicos", ni "Productos")

  // Determine user role
  const userRole = organizationMember?.role || ''
  const isStaff = userRole === 'STAFF' || userRole === 'Personal'
  const isDriver = userRole === 'DRIVER' || userRole === 'Conductor'
  const canAccessProductsAndThermalProfiles = !isStaff && !isDriver

  const tabs = [
    ...(canAccessOrganizations
      ? [
        {
          id: 'organizaciones',
          label: 'Empresas',
          active: activeTab === 'organizaciones',
          onClick: () => handleTabChange('organizaciones'),
        },
      ]
      : []),
    {
      id: 'usuarios',
      label: 'Usuarios',
      active: activeTab === 'usuarios',
      onClick: () => handleTabChange('usuarios'),
    },
    ...(canAccessProductsAndThermalProfiles
      ? [

        {
          id: 'perfil-termico',
          label: 'Perfiles Térmicos',
          active: activeTab === 'perfil-termico',
          onClick: () => handleTabChange('perfil-termico'),
        },
        {
          id: 'productos',
          label: 'Productos',
          active: activeTab === 'productos',
          onClick: () => handleTabChange('productos'),
        },
        {
          id: 'tarifarios',
          label: 'Tarifarios',
          active: activeTab === 'tarifarios',
          onClick: () => handleTabChange('tarifarios'),
        },
      ]
      : []),
  ]

  return {
    // State
    activeTab,
    searchTerm,
    statusFilter,
    entityStatusFilter,
    organizationView,
    selectedOrganizationForDetail,
    tabs,
    // Handlers
    handleTabChange,
    handleSearchChange,
    handleStatusFilterChange,
    handleEntityStatusFilterChange,
    handleOrganizationRowClick,
    handleOrganizationCreate,
    handleOrganizationDetailBack,
    handleUserCreate,
    handleUserInvite,
    handleUserEdit,
    handleThermalProfileCreate,
    handleThermalProfileEdit,
    handleProductCreate,
    handleProductEdit,
    handleRateCardCreate,
    handleRateCardEdit,
    handleRateCardDetailBack,
    // UI Helpers
    getFilterConfig,
    getSearchPlaceholder,
    // Setters (for organization detail)
    setSelectedOrganizationForDetail,
  }
}
