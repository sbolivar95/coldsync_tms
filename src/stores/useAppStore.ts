import { create } from 'zustand'
import type { AuthUser, AuthSession } from '../services/database/auth.service'
import type { Organization, Location, Carrier, Lane, LaneType, ThermalProfile, Product } from '../types/database.types'
import type { RateCardWithCharges } from '../services/database/rateCards.service'
import type { OrganizationMember, FlespiProtocol, FlespiDeviceType } from '../types/database.types'
import type { Organization as UIOrganization } from '../features/settings/hooks/useOrganizations'
import type { User } from '../types/user.types'
import type { FleetSetWithOrders } from '../features/dispatch/types'
import type { Order } from '../lib/mockData'
import type { DispatchOrder } from '../types/dispatch.types'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface AppState {
  // Autenticación
  isAuthenticated: boolean
  isAuthInitializing: boolean
  setIsAuthenticated: (value: boolean) => void
  setAuthInitializing: (value: boolean) => void

  // Auth state
  user: AuthUser | null
  organization: Organization | null
  organizationMember: OrganizationMember | null
  organizationMembers: OrganizationMember[]
  isPlatformUser: boolean
  setAuthSession: (session: AuthSession | null) => void
  clearAuthSession: () => void

  // UI
  sidebarCollapsed: boolean
  setSidebarCollapsed: (value: boolean) => void
  toggleSidebar: () => void

  // Breadcrumbs
  breadcrumbsState: Record<string, BreadcrumbItem[]>
  setBreadcrumbs: (view: string, breadcrumbs: BreadcrumbItem[]) => void
  clearBreadcrumbs: (view: string) => void

  // Reset trigger para resetear vistas
  resetTrigger: number
  incrementResetTrigger: () => void

  // Tabs activos
  transportistasActiveTab: string
  setTransportistasActiveTab: (tab: string) => void

  settingsActiveTab: string
  setSettingsActiveTab: (tab: string) => void

  // Handlers de creación por ruta
  createHandlers: Record<string, () => void>
  registerCreateHandler: (route: string, handler: () => void) => void
  triggerCreate: (route: string) => void

  // Organizations list (shared state for platform users)
  organizations: UIOrganization[]
  organizationsLoading: boolean
  organizationsLoadedUserId: string | null
  setOrganizations: (organizations: UIOrganization[]) => void
  setOrganizationsLoading: (loading: boolean) => void
  setOrganizationsLoadedUserId: (userId: string | null) => void
  clearOrganizations: () => void

  // Users list (shared state for settings)
  users: User[]
  usersLoading: boolean
  usersLoadedOrgId: string | null
  setUsers: (users: User[]) => void
  setUsersLoading: (loading: boolean) => void
  setUsersLoadedOrgId: (orgId: string | null) => void
  clearUsers: () => void

  // Locations list (shared state)
  locations: Location[]
  locationsLoading: boolean
  locationsLoadedOrgId: string | null
  setLocations: (locations: Location[]) => void
  setLocationsLoading: (loading: boolean) => void
  setLocationsLoadedOrgId: (orgId: string | null) => void
  clearLocations: () => void

  // Carriers list (shared state)
  carriers: Carrier[]
  carriersLoading: boolean
  carriersLoadedOrgId: string | null
  setCarriers: (carriers: Carrier[]) => void
  setCarriersLoading: (loading: boolean) => void
  setCarriersLoadedOrgId: (orgId: string | null) => void
  clearCarriers: () => void

  // Lanes list (shared state)
  lanes: Lane[]
  lanesLoading: boolean
  lanesLoadedOrgId: string | null
  setLanes: (lanes: Lane[]) => void
  setLanesLoading: (loading: boolean) => void
  setLanesLoadedOrgId: (orgId: string | null) => void
  clearLanes: () => void

  // Thermal Profiles list (shared state)
  thermalProfiles: ThermalProfile[]
  thermalProfilesLoading: boolean
  thermalProfilesLoadedOrgId: string | null
  setThermalProfiles: (thermalProfiles: ThermalProfile[]) => void
  setThermalProfilesLoading: (loading: boolean) => void
  setThermalProfilesLoadedOrgId: (orgId: string | null) => void
  clearThermalProfiles: () => void

  // Products list (shared state)
  products: Product[]
  productsLoading: boolean
  productsLoadedOrgId: string | null
  setProducts: (products: Product[]) => void
  setProductsLoading: (loading: boolean) => void
  setProductsLoadedOrgId: (orgId: string | null) => void
  clearProducts: () => void

  // Rate Cards list (shared state)
  rateCards: RateCardWithCharges[]
  rateCardsLoading: boolean
  rateCardsLoadedOrgId: string | null
  setRateCards: (rateCards: RateCardWithCharges[]) => void
  setRateCardsLoading: (loading: boolean) => void
  setRateCardsLoadedOrgId: (orgId: string | null) => void
  clearRateCards: () => void

  // Dispatch Orders list (shared state)
  dispatchOrders: DispatchOrder[]
  dispatchOrdersLoading: boolean
  dispatchOrdersLoadedOrgId: string | null
  setDispatchOrders: (orders: DispatchOrder[]) => void
  setDispatchOrdersLoading: (loading: boolean) => void
  setDispatchOrdersLoadedOrgId: (orgId: string | null) => void
  addDispatchOrder: (order: DispatchOrder) => void
  updateDispatchOrderInStore: (id: string, updates: Partial<DispatchOrder>) => void
  removeDispatchOrder: (id: string) => void
  clearDispatchOrders: () => void

  // Fleet sets with orders (shared state for dispatch calendar)
  fleetSets: FleetSetWithOrders[]
  fleetSetsLoading: boolean
  fleetSetsLoadedOrgId: string | null
  setFleetSets: (fleetSets: FleetSetWithOrders[]) => void
  setFleetSetsLoading: (loading: boolean) => void
  setFleetSetsLoadedOrgId: (orgId: string | null) => void
  clearFleetSets: () => void

  // Carrier Types (Metadata)
  carrierTypeOptions: { value: string; label: string }[]
  setCarrierTypeOptions: (options: { value: string; label: string }[]) => void

  // Hardware Catalog (Flespi)
  flespiProtocols: FlespiProtocol[]
  flespiProtocolsLoading: boolean
  flespiProtocolsLoaded: boolean
  setFlespiProtocols: (protocols: FlespiProtocol[]) => void
  setFlespiProtocolsLoading: (loading: boolean) => void
  setFlespiProtocolsLoaded: (loaded: boolean) => void

  flespiDeviceTypes: FlespiDeviceType[]
  flespiDeviceTypesLoading: boolean
  flespiDeviceTypesLoadedProtocolId: number | null
  flespiDeviceTypesLoaded: boolean
  setFlespiDeviceTypes: (types: FlespiDeviceType[]) => void
  setFlespiDeviceTypesLoading: (loading: boolean) => void
  setFlespiDeviceTypesLoaded: (loaded: boolean) => void

  // Lane Types list (shared state)
  laneTypes: LaneType[]
  laneTypesLoading: boolean
  laneTypesLoadedOrgId: string | null
  setLaneTypes: (types: LaneType[]) => void
  setLaneTypesLoading: (loading: boolean) => void
  setLaneTypesLoadedOrgId: (orgId: string | null) => void
  clearLaneTypes: () => void

  // Orders list (Tenders/Solicitudes)
  orders: Order[]
  ordersLoading: boolean
  ordersLoadedOrgId: string | null
  setOrders: (orders: Order[]) => void
  setOrdersLoading: (loading: boolean) => void
  setOrdersLoadedOrgId: (orgId: string | null) => void
  updateOrderInStore: (id: string, updates: Partial<Order>) => void
  clearOrders: () => void

  // User Preferences
  dispatchViewPreference: 'list' | 'gantt'
  setDispatchViewPreference: (view: 'list' | 'gantt') => void
}

export const useAppStore = create<AppState>((set) => ({
  // Autenticación
  isAuthenticated: false,
  isAuthInitializing: true,
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setAuthInitializing: (value) => set({ isAuthInitializing: value }),

  // Auth state
  user: null,
  organization: null,
  organizationMember: null,
  organizationMembers: [],
  isPlatformUser: false,
  setAuthSession: (session) =>
    set({
      isAuthenticated: !!session,
      user: session?.user || null,
      organization: session?.organization || null,
      organizationMember: session?.organizationMember || null,
      organizationMembers: session?.organizationMembers || [],
      isPlatformUser: session?.isPlatformUser || false,
    }),
  clearAuthSession: () =>
    set({
      isAuthenticated: false,
      user: null,
      organization: null,
      organizationMember: null,
      organizationMembers: [],
      isPlatformUser: false,
      organizations: [],
      organizationsLoadedUserId: null,
      organizationsLoading: false,
      users: [],
      usersLoadedOrgId: null,
      usersLoading: false,
      locations: [],
      locationsLoadedOrgId: null,
      locationsLoading: false,
      carriers: [],
      carriersLoadedOrgId: null,
      carriersLoading: false,
      lanes: [],
      lanesLoadedOrgId: null,
      lanesLoading: false,
      thermalProfiles: [],
      thermalProfilesLoadedOrgId: null,
      thermalProfilesLoading: false,
      products: [],
      productsLoadedOrgId: null,
      productsLoading: false,
      dispatchOrders: [],
      dispatchOrdersLoadedOrgId: null,
      dispatchOrdersLoading: false,
      laneTypes: [],
      laneTypesLoadedOrgId: null,
      laneTypesLoading: false,
      fleetSets: [],
      fleetSetsLoadedOrgId: null,
      fleetSetsLoading: false,
      orders: [],
      ordersLoadedOrgId: null,
      ordersLoading: false,
    }),

  // UI
  sidebarCollapsed: true,
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Breadcrumbs
  breadcrumbsState: {},
  setBreadcrumbs: (view, breadcrumbs) =>
    set((state) => ({
      breadcrumbsState: { ...state.breadcrumbsState, [view]: breadcrumbs },
    })),
  clearBreadcrumbs: (view) =>
    set((state) => {
      const newState = { ...state.breadcrumbsState }
      delete newState[view]
      return { breadcrumbsState: newState }
    }),

  // Reset trigger
  resetTrigger: 0,
  incrementResetTrigger: () =>
    set((state) => ({ resetTrigger: state.resetTrigger + 1 })),

  // Tabs activos
  transportistasActiveTab: 'todos',
  setTransportistasActiveTab: (tab) => set({ transportistasActiveTab: tab }),

  settingsActiveTab: 'usuarios',
  setSettingsActiveTab: (tab) => set({ settingsActiveTab: tab }),

  // Handlers de creación
  createHandlers: {},
  registerCreateHandler: (route, handler) =>
    set((state) => ({
      createHandlers: { ...state.createHandlers, [route]: handler },
    })),
  triggerCreate: (route) => {
    const handler = useAppStore.getState().createHandlers[route]
    if (handler) {
      handler()
    }
  },

  // Organizations list
  organizations: [],
  organizationsLoading: false,
  organizationsLoadedUserId: null,
  setOrganizations: (organizations) => set({ organizations }),
  setOrganizationsLoading: (loading) => set({ organizationsLoading: loading }),
  setOrganizationsLoadedUserId: (userId) => set({ organizationsLoadedUserId: userId }),
  clearOrganizations: () => set({
    organizations: [],
    organizationsLoadedUserId: null,
    organizationsLoading: false
  }),

  // Users list
  users: [],
  usersLoading: false,
  usersLoadedOrgId: null,
  setUsers: (users) => set({ users }),
  setUsersLoading: (loading) => set({ usersLoading: loading }),
  setUsersLoadedOrgId: (orgId) => set({ usersLoadedOrgId: orgId }),
  clearUsers: () => set({
    users: [],
    usersLoadedOrgId: null,
    usersLoading: false
  }),

  // Locations list
  locations: [],
  locationsLoading: false,
  locationsLoadedOrgId: null,
  setLocations: (locations) => set({ locations }),
  setLocationsLoading: (loading) => set({ locationsLoading: loading }),
  setLocationsLoadedOrgId: (orgId) => set({ locationsLoadedOrgId: orgId }),
  clearLocations: () => set({
    locations: [],
    locationsLoadedOrgId: null,
    locationsLoading: false
  }),

  // Carriers list
  carriers: [],
  carriersLoading: false,
  carriersLoadedOrgId: null,
  setCarriers: (carriers) => set({ carriers }),
  setCarriersLoading: (loading) => set({ carriersLoading: loading }),
  setCarriersLoadedOrgId: (orgId) => set({ carriersLoadedOrgId: orgId }),
  clearCarriers: () => set({
    carriers: [],
    carriersLoadedOrgId: null,
    carriersLoading: false
  }),

  // Lanes list
  lanes: [],
  lanesLoading: false,
  lanesLoadedOrgId: null,
  setLanes: (lanes) => set({ lanes }),
  setLanesLoading: (loading) => set({ lanesLoading: loading }),
  setLanesLoadedOrgId: (orgId) => set({ lanesLoadedOrgId: orgId }),
  clearLanes: () => set({
    lanes: [],
    lanesLoadedOrgId: null,
    lanesLoading: false,
  }),

  // Thermal Profiles list
  thermalProfiles: [],
  thermalProfilesLoading: false,
  thermalProfilesLoadedOrgId: null,
  setThermalProfiles: (thermalProfiles) => set({ thermalProfiles }),
  setThermalProfilesLoading: (loading) => set({ thermalProfilesLoading: loading }),
  setThermalProfilesLoadedOrgId: (orgId) => set({ thermalProfilesLoadedOrgId: orgId }),
  clearThermalProfiles: () => set({
    thermalProfiles: [],
    thermalProfilesLoadedOrgId: null,
    thermalProfilesLoading: false,
  }),

  // Products list
  products: [],
  productsLoading: false,
  productsLoadedOrgId: null,
  setProducts: (products) => set({ products }),
  setProductsLoading: (loading) => set({ productsLoading: loading }),
  setProductsLoadedOrgId: (orgId) => set({ productsLoadedOrgId: orgId }),
  clearProducts: () => set({
    products: [],
    productsLoadedOrgId: null,
    productsLoading: false,
  }),

  // Rate Cards list
  rateCards: [],
  rateCardsLoading: false,
  rateCardsLoadedOrgId: null,
  setRateCards: (rateCards) => set({ rateCards }),
  setRateCardsLoading: (loading) => set({ rateCardsLoading: loading }),
  setRateCardsLoadedOrgId: (orgId) => set({ rateCardsLoadedOrgId: orgId }),
  clearRateCards: () => set({
    rateCards: [],
    rateCardsLoadedOrgId: null,
    rateCardsLoading: false,
  }),

  // Dispatch Orders list
  dispatchOrders: [],
  dispatchOrdersLoading: false,
  dispatchOrdersLoadedOrgId: null,
  setDispatchOrders: (orders) => set({ dispatchOrders: orders }),
  setDispatchOrdersLoading: (loading) => set({ dispatchOrdersLoading: loading }),
  setDispatchOrdersLoadedOrgId: (orgId) => set({ dispatchOrdersLoadedOrgId: orgId }),
  addDispatchOrder: (order) => set((state) => ({
    dispatchOrders: [...state.dispatchOrders, order],
  })),
  updateDispatchOrderInStore: (id, updates) => set((state) => ({
    dispatchOrders: state.dispatchOrders.map((order) =>
      order.id === id ? { ...order, ...updates } : order
    ),
  })),
  removeDispatchOrder: (id) => set((state) => ({
    dispatchOrders: state.dispatchOrders.filter((order) => order.id !== id),
  })),
  clearDispatchOrders: () => set({
    dispatchOrders: [],
    dispatchOrdersLoadedOrgId: null,
    dispatchOrdersLoading: false,
  }),

  // Fleet sets with orders
  fleetSets: [],
  fleetSetsLoading: false,
  fleetSetsLoadedOrgId: null,
  setFleetSets: (fleetSets) => set({ fleetSets }),
  setFleetSetsLoading: (loading) => set({ fleetSetsLoading: loading }),
  setFleetSetsLoadedOrgId: (orgId) => set({ fleetSetsLoadedOrgId: orgId }),
  clearFleetSets: () => set({
    fleetSets: [],
    fleetSetsLoadedOrgId: null,
    fleetSetsLoading: false,
  }),

  // Carrier Types
  carrierTypeOptions: [],
  setCarrierTypeOptions: (options) => set({ carrierTypeOptions: options }),

  // Hardware Catalog (Flespi)
  flespiProtocols: [],
  flespiProtocolsLoading: false,
  flespiProtocolsLoaded: false,
  setFlespiProtocols: (protocols) => set({ flespiProtocols: protocols }),
  setFlespiProtocolsLoading: (loading) => set({ flespiProtocolsLoading: loading }),
  setFlespiProtocolsLoaded: (loaded) => set({ flespiProtocolsLoaded: loaded }),

  flespiDeviceTypes: [],
  flespiDeviceTypesLoading: false,
  flespiDeviceTypesLoadedProtocolId: null, // null = all or none specific, use generic loaded flag if needed or manage by cache key
  flespiDeviceTypesLoaded: false, // Global loaded flag
  setFlespiDeviceTypes: (types) => set({ flespiDeviceTypes: types }),
  setFlespiDeviceTypesLoading: (loading) => set({ flespiDeviceTypesLoading: loading }),
  setFlespiDeviceTypesLoaded: (loaded) => set({ flespiDeviceTypesLoaded: loaded }),

  // Lane Types list
  laneTypes: [],
  laneTypesLoading: false,
  laneTypesLoadedOrgId: null,
  setLaneTypes: (laneTypes) => set({ laneTypes }),
  setLaneTypesLoading: (loading) => set({ laneTypesLoading: loading }),
  setLaneTypesLoadedOrgId: (orgId) => set({ laneTypesLoadedOrgId: orgId }),
  clearLaneTypes: () => set({
    laneTypes: [],
    laneTypesLoadedOrgId: null,
    laneTypesLoading: false,
  }),

  // Orders list
  orders: [],
  ordersLoading: false,
  ordersLoadedOrgId: null,
  setOrders: (orders) => set({ orders }),
  setOrdersLoading: (loading) => set({ ordersLoading: loading }),
  setOrdersLoadedOrgId: (orgId) => set({ ordersLoadedOrgId: orgId }),
  updateOrderInStore: (id, updates) => set((state) => ({
    orders: state.orders.map((order) =>
      order.id === id ? { ...order, ...updates } : order
    ),
  })),
  clearOrders: () => set({
    orders: [],
    ordersLoadedOrgId: null,
    ordersLoading: false,
  }),

  // User Preferences (persisted in Zustand)
  dispatchViewPreference: 'list',
  setDispatchViewPreference: (view) => set({ dispatchViewPreference: view }),
}))

