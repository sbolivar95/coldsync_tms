import { PageHeader } from '../layouts/PageHeader'
import { Button } from '../components/ui/Button'
import {
  Filter,
  Pencil,
  Trash2,
  Building2,
  Ban,
  CheckCircle,
} from 'lucide-react'
import {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useCallback,
} from 'react'
import { useLocation } from 'react-router-dom'
import { DataTable } from '../components/widgets/DataTable/DataTable'
import type {
  DataTableColumn,
  DataTableAction,
  DataTableBulkAction,
} from '../components/widgets/DataTable/types'
import { Badge } from '../components/ui/Badge'
import { ThermalProfileDialog } from '../features/settings/ThermalProfileDialog'
import { ProductDialog } from '../features/settings/ProductDialog'
import { UserDialog } from '../features/settings/UserDialog'
import {
  OrganizationDialog,
  type OrganizationDisplay,
} from '../features/settings/OrganizationDialog'
import {
  type Product as MockProduct,
  type ThermalProfile as MockThermalProfile,
} from '../lib/mockData'
import { useAppStore } from '../stores/useAppStore'
import { useAuth } from '../lib/auth-context'
import {
  productsService,
  thermalProfilesService,
  productThermalProfilesService,
} from '../services/products.service'
import {
  organizationsService,
  countriesService,
  type Organization,
  type Country,
} from '../services/organizations.service'
import {
  usersService,
  joinCodesService,
  toUserDisplay,
  getRoleLabel,
  type OrganizationMember,
  type OrganizationMemberDisplay,
  type UserRole,
} from '../services/users.service'
import type {
  Product as DBProduct,
  ThermalProfile as DBThermalProfile,
} from '../types/database.types'

// Extended Product type that includes thermal profile information for display
interface ProductWithProfiles extends DBProduct {
  thermalProfiles?: DBThermalProfile[]
}

// Adapter to convert DB Product to Mock Product format for display
const toMockProduct = (
  product: ProductWithProfiles,
  thermalProfiles: DBThermalProfile[]
): MockProduct => ({
  id: String(product.id),
  name: product.name,
  description: product.description || '',
  thermalProfileIds: thermalProfiles
    .filter((tp) => product.thermalProfiles?.some((ptp) => ptp.id === tp.id))
    .map((tp) => String(tp.id)),
  status: product.is_active ? 'Activo' : 'Inactivo',
})

// Adapter to convert DB ThermalProfile to Mock ThermalProfile format for display
const toMockThermalProfile = (
  profile: DBThermalProfile,
  products: DBProduct[]
): MockThermalProfile => ({
  id: String(profile.id),
  name: profile.name,
  description: profile.description || '',
  tempMin: profile.temp_min_c,
  tempMax: profile.temp_max_c,
  products: products.map((p) => p.name),
  status: profile.is_active ? 'Activo' : 'Inactivo',
  compatibility: 'Alta', // Default value since DB doesn't have this field
})

// Adapter to convert DB Organization to display format
const toOrganizationDisplay = (org: Organization): OrganizationDisplay => ({
  id: org.id,
  comercialName: org.comercial_name,
  legalName: org.legal_name,
  city: org.city || '',
  countryId: org.base_country_id,
  countryName: org.country?.name || '',
  status:
    org.status === 'ACTIVE'
      ? 'Activo'
      : org.status === 'SUSPENDED'
      ? 'Suspendido'
      : org.status === 'PAST_DUE'
      ? 'Vencido'
      : 'Cancelado',
})

export interface SettingsRef {
  handleCreate: () => void
}

export const Settings = forwardRef<SettingsRef, {}>((_, ref) => {
  const { setSettingsActiveTab, registerCreateHandler } = useAppStore()
  const { organizationMember, isPlatformAdmin } = useAuth()
  const location = useLocation()

  // Tab state - default to 'organizaciones' for platform admins without org
  const [activeTab, setActiveTab] = useState(() => {
    if (isPlatformAdmin && !organizationMember) {
      return 'organizaciones'
    }
    return 'usuarios'
  })

  // Dialog states
  const [thermalProfileDialogOpen, setThermalProfileDialogOpen] =
    useState(false)
  const [selectedThermalProfile, setSelectedThermalProfile] = useState<
    MockThermalProfile | undefined
  >(undefined)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<
    MockProduct | undefined
  >(undefined)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<
    OrganizationMemberDisplay | undefined
  >(undefined)
  const [organizationDialogOpen, setOrganizationDialogOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<
    OrganizationDisplay | undefined
  >(undefined)

  // Data states
  const [products, setProducts] = useState<ProductWithProfiles[]>([])
  const [thermalProfiles, setThermalProfiles] = useState<DBThermalProfile[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [users, setUsers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get organization ID
  const orgId = organizationMember?.org_id

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchProducts = useCallback(async () => {
    if (!orgId) return

    try {
      const data = await productsService.getAllWithThermalProfiles(orgId)
      // Transform the data to include thermal profiles
      const productsWithProfiles: ProductWithProfiles[] = data.map(
        (p: any) => ({
          ...p,
          thermalProfiles:
            p.product_thermal_profiles
              ?.map((ptp: any) => ptp.thermal_profile)
              .filter(Boolean) || [],
        })
      )
      setProducts(productsWithProfiles)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Error al cargar productos')
    }
  }, [orgId])

  const fetchThermalProfiles = useCallback(async () => {
    if (!orgId) return

    try {
      const data = await thermalProfilesService.getAll(orgId)
      setThermalProfiles(data)
    } catch (err) {
      console.error('Error fetching thermal profiles:', err)
      setError('Error al cargar perfiles térmicos')
    }
  }, [orgId])

  const fetchOrganizations = useCallback(async () => {
    if (!isPlatformAdmin) return

    try {
      const data = await organizationsService.getAll()
      setOrganizations(data)
    } catch (err) {
      console.error('Error fetching organizations:', err)
      setError('Error al cargar organizaciones')
    }
  }, [isPlatformAdmin])

  const fetchCountries = useCallback(async () => {
    try {
      const data = await countriesService.getAll()
      setCountries(data)
    } catch (err) {
      console.error('Error fetching countries:', err)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    if (!orgId) return

    try {
      const data = await usersService.getAll(orgId)
      setUsers(data)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Error al cargar usuarios')
    }
  }, [orgId])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const promises = []

    if (orgId) {
      promises.push(fetchProducts(), fetchThermalProfiles(), fetchUsers())
    }

    if (isPlatformAdmin) {
      promises.push(fetchOrganizations(), fetchCountries())
    }

    await Promise.all(promises)

    setLoading(false)
  }, [
    orgId,
    isPlatformAdmin,
    fetchProducts,
    fetchThermalProfiles,
    fetchUsers,
    fetchOrganizations,
    fetchCountries,
  ])

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ============================================================================
  // CRUD OPERATIONS - PRODUCTS
  // ============================================================================

  const handleSaveProduct = async (product: MockProduct) => {
    console.log('handleSaveProduct called with:', product)
    console.log('orgId:', orgId)

    if (!orgId) {
      console.error('No orgId available')
      setError('No se encontró la organización. Por favor, recarga la página.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (selectedProduct) {
        // UPDATE existing product
        const productId = Number(selectedProduct.id)
        console.log('Updating product:', productId)

        await productsService.update(productId, orgId, {
          name: product.name,
          description: product.description,
          is_active: product.status === 'Activo',
        })

        // Update thermal profile links
        const thermalProfileIds = product.thermalProfileIds.map((id) =>
          Number(id)
        )
        await productThermalProfilesService.replaceForProduct(
          productId,
          orgId,
          thermalProfileIds
        )
        console.log('Product updated successfully')
      } else {
        // CREATE new product
        console.log('Creating new product')

        const newProduct = await productsService.create({
          org_id: orgId,
          name: product.name,
          description: product.description,
          is_active: true,
        })

        // Link thermal profiles
        const thermalProfileIds = product.thermalProfileIds.map((id) =>
          Number(id)
        )
        await productThermalProfilesService.replaceForProduct(
          newProduct.id,
          orgId,
          thermalProfileIds
        )
        console.log('Product created successfully:', newProduct)
      }

      // Refresh data
      await fetchProducts()

      // Dialog is already closed by the ProductDialog component
      setSelectedProduct(undefined)
    } catch (err: any) {
      console.error('Error saving product:', err)
      setError(
        `Error al guardar producto: ${err.message || 'Error desconocido'}`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (product: MockProduct) => {
    if (!orgId) return

    if (!confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
      return
    }

    try {
      setLoading(true)
      await productsService.softDelete(Number(product.id), orgId)
      await fetchProducts()
    } catch (err) {
      console.error('Error deleting product:', err)
      setError('Error al eliminar producto')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDeleteProducts = async (selectedIds: string[]) => {
    if (!orgId) return

    if (
      !confirm(`¿Estás seguro de eliminar ${selectedIds.length} productos?`)
    ) {
      return
    }

    try {
      setLoading(true)
      await Promise.all(
        selectedIds.map((id) => productsService.softDelete(Number(id), orgId))
      )
      await fetchProducts()
    } catch (err) {
      console.error('Error deleting products:', err)
      setError('Error al eliminar productos')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // CRUD OPERATIONS - THERMAL PROFILES
  // ============================================================================

  const handleSaveThermalProfile = async (profile: MockThermalProfile) => {
    console.log('handleSaveThermalProfile called with:', profile)
    console.log('orgId:', orgId)

    if (!orgId) {
      console.error('No orgId available')
      setError('No se encontró la organización. Por favor, recarga la página.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (selectedThermalProfile) {
        // UPDATE existing thermal profile
        const profileId = Number(selectedThermalProfile.id)
        console.log('Updating thermal profile:', profileId)

        await thermalProfilesService.update(profileId, orgId, {
          name: profile.name,
          description: profile.description,
          temp_min_c: profile.tempMin,
          temp_max_c: profile.tempMax,
          is_active: profile.status === 'Activo',
        })
        console.log('Thermal profile updated successfully')
      } else {
        // CREATE new thermal profile
        console.log('Creating new thermal profile')

        const newProfile = await thermalProfilesService.create({
          org_id: orgId,
          name: profile.name,
          description: profile.description,
          temp_min_c: profile.tempMin,
          temp_max_c: profile.tempMax,
          is_active: true,
        })
        console.log('Thermal profile created successfully:', newProfile)
      }

      // Refresh data
      await fetchThermalProfiles()

      // Dialog is already closed by the ThermalProfileDialog component
      setSelectedThermalProfile(undefined)
    } catch (err: any) {
      console.error('Error saving thermal profile:', err)
      setError(
        `Error al guardar perfil térmico: ${err.message || 'Error desconocido'}`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteThermalProfile = async (profile: MockThermalProfile) => {
    if (!orgId) return

    if (
      !confirm(`¿Estás seguro de eliminar el perfil térmico "${profile.name}"?`)
    ) {
      return
    }

    try {
      setLoading(true)
      await thermalProfilesService.softDelete(Number(profile.id), orgId)
      await fetchThermalProfiles()
    } catch (err) {
      console.error('Error deleting thermal profile:', err)
      setError('Error al eliminar perfil térmico')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDeleteThermalProfiles = async (selectedIds: string[]) => {
    if (!orgId) return

    if (
      !confirm(
        `¿Estás seguro de eliminar ${selectedIds.length} perfiles térmicos?`
      )
    ) {
      return
    }

    try {
      setLoading(true)
      await Promise.all(
        selectedIds.map((id) =>
          thermalProfilesService.softDelete(Number(id), orgId)
        )
      )
      await fetchThermalProfiles()
    } catch (err) {
      console.error('Error deleting thermal profiles:', err)
      setError('Error al eliminar perfiles térmicos')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // CRUD OPERATIONS - USERS
  // ============================================================================

  const handleSaveUser = async (user: OrganizationMemberDisplay) => {
    console.log('handleSaveUser called with:', user)
    console.log('orgId:', orgId)

    if (!orgId) {
      console.error('No orgId available')
      setError('No se encontró la organización. Por favor, recarga la página.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (selectedUser) {
        // UPDATE existing user
        console.log('Updating user:', selectedUser.id)

        await usersService.update(selectedUser.id, orgId, {
          full_name: user.fullName,
          phone: user.phone || undefined,
        })

        // Update role if changed
        if (selectedUser.role !== user.role) {
          await usersService.updateRole(selectedUser.id, orgId, user.role)
        }

        console.log('User updated successfully')
      } else {
        // CREATE new user via provision (platform admin only)
        console.log('Provisioning new user')

        const result = await usersService.provision({
          org_id: orgId,
          email: user.email,
          full_name: user.fullName,
          role: user.role,
        })

        console.log('User provisioned successfully:', result)

        // Show temporary password to admin
        alert(
          `Usuario creado exitosamente!\n\n` +
            `Nombre: ${user.fullName}\n` +
            `Email: ${user.email}\n` +
            `Rol: ${getRoleLabel(user.role)}\n` +
            `Contraseña temporal: ${result.temp_password}\n\n` +
            `Por favor, comparta estas credenciales con el usuario de forma segura.`
        )
      }

      // Refresh data
      await fetchUsers()

      setUserDialogOpen(false)
      setSelectedUser(undefined)
    } catch (err: any) {
      console.error('Error saving user:', err)
      setError(
        `Error al guardar usuario: ${err.message || 'Error desconocido'}`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInviteCode = async (
    role: UserRole,
    expiresInMinutes: number
  ): Promise<string> => {
    if (!orgId) {
      throw new Error('No se encontró la organización')
    }

    try {
      const code = await joinCodesService.create(orgId, role, expiresInMinutes)
      return code
    } catch (err: any) {
      console.error('Error creating invite code:', err)
      setError(
        `Error al crear código de invitación: ${
          err.message || 'Error desconocido'
        }`
      )
      throw err
    }
  }

  const handleDeleteUser = async (user: OrganizationMemberDisplay) => {
    if (!orgId) return

    if (
      !confirm(
        `¿Estás seguro de eliminar al usuario "${user.fullName}"? Esta acción eliminará su membresía de la organización.`
      )
    ) {
      return
    }

    try {
      setLoading(true)
      await usersService.remove(user.id, orgId)
      await fetchUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      setError('Error al eliminar usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDeleteUsers = async (selectedIds: string[]) => {
    if (!orgId) return

    if (!confirm(`¿Estás seguro de eliminar ${selectedIds.length} usuarios?`)) {
      return
    }

    try {
      setLoading(true)
      await Promise.all(selectedIds.map((id) => usersService.remove(id, orgId)))
      await fetchUsers()
    } catch (err) {
      console.error('Error deleting users:', err)
      setError('Error al eliminar usuarios')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // CRUD OPERATIONS - ORGANIZATIONS
  // ============================================================================

  const handleSaveOrganization = async (org: OrganizationDisplay) => {
    console.log('handleSaveOrganization called with:', org)

    if (!isPlatformAdmin) {
      setError('No tienes permisos para gestionar organizaciones')
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (selectedOrganization) {
        // UPDATE existing organization
        console.log('Updating organization:', selectedOrganization.id)

        await organizationsService.update(selectedOrganization.id, {
          comercial_name: org.comercialName,
          legal_name: org.legalName,
          city: org.city || null,
          base_country_id: org.countryId,
        })
        console.log('Organization updated successfully')
      } else {
        // CREATE new organization with owner
        console.log('Creating new organization with owner')

        if (!org.ownerEmail || !org.ownerFullName) {
          setError(
            'Se requiere email y nombre del propietario para crear una organización'
          )
          return
        }

        const result = await organizationsService.provisionWithOwner({
          owner_email: org.ownerEmail,
          owner_full_name: org.ownerFullName,
          comercial_name: org.comercialName,
          legal_name: org.legalName,
          city: org.city || null,
          base_country_id: org.countryId,
        })

        console.log('Organization created successfully:', result)

        // Show temporary password to admin
        alert(
          `Organización creada exitosamente!\n\n` +
            `Propietario: ${org.ownerFullName}\n` +
            `Email: ${org.ownerEmail}\n` +
            `Contraseña temporal: ${result.temp_password}\n\n` +
            `Por favor, comparta estas credenciales con el propietario de forma segura.`
        )
      }

      // Refresh data
      await fetchOrganizations()

      setOrganizationDialogOpen(false)
      setSelectedOrganization(undefined)
    } catch (err: any) {
      console.error('Error saving organization:', err)
      setError(
        `Error al guardar organización: ${err.message || 'Error desconocido'}`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendOrganization = async (org: OrganizationDisplay) => {
    if (!isPlatformAdmin) return

    if (
      !confirm(
        `¿Estás seguro de suspender la organización "${org.comercialName}"?`
      )
    ) {
      return
    }

    try {
      setLoading(true)
      await organizationsService.updateStatus(org.id, 'SUSPENDED')
      await fetchOrganizations()
    } catch (err) {
      console.error('Error suspending organization:', err)
      setError('Error al suspender organización')
    } finally {
      setLoading(false)
    }
  }

  const handleActivateOrganization = async (org: OrganizationDisplay) => {
    if (!isPlatformAdmin) return

    try {
      setLoading(true)
      await organizationsService.updateStatus(org.id, 'ACTIVE')
      await fetchOrganizations()
    } catch (err) {
      console.error('Error activating organization:', err)
      setError('Error al activar organización')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrganization = async (org: OrganizationDisplay) => {
    if (!isPlatformAdmin) return

    if (
      !confirm(
        `¿Estás seguro de cancelar la organización "${org.comercialName}"? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }

    try {
      setLoading(true)
      await organizationsService.updateStatus(org.id, 'CANCELED')
      await fetchOrganizations()
    } catch (err) {
      console.error('Error canceling organization:', err)
      setError('Error al cancelar organización')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // TAB AND DIALOG HANDLERS
  // ============================================================================

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSettingsActiveTab(tab)
  }

  const handleCreate = () => {
    console.log('handleCreate called, activeTab:', activeTab)
    switch (activeTab) {
      case 'productos':
        setSelectedProduct(undefined)
        setProductDialogOpen(true)
        break
      case 'perfil-termico':
        setSelectedThermalProfile(undefined)
        setThermalProfileDialogOpen(true)
        break
      case 'usuarios':
        setSelectedUser(undefined)
        setUserDialogOpen(true)
        break
      case 'organizaciones':
        setSelectedOrganization(undefined)
        setOrganizationDialogOpen(true)
        break
    }
  }

  // Expose create function to parent component
  useImperativeHandle(ref, () => ({
    handleCreate,
  }))

  // Register create handler
  useEffect(() => {
    registerCreateHandler(location.pathname, handleCreate)
    return () => {
      // Cleanup if needed
    }
  }, [location.pathname, activeTab])

  // ============================================================================
  // CONVERT DATA FOR DISPLAY
  // ============================================================================

  // Convert products for display (using adapter)
  const displayProducts: MockProduct[] = products.map((p) =>
    toMockProduct(p, thermalProfiles)
  )

  // Convert thermal profiles for display with associated products
  const displayThermalProfiles: MockThermalProfile[] = thermalProfiles.map(
    (tp) => {
      // Find products that have this thermal profile
      const associatedProducts = products.filter((p) =>
        p.thermalProfiles?.some((ptp) => ptp.id === tp.id)
      )
      return toMockThermalProfile(tp, associatedProducts)
    }
  )

  // Convert thermal profiles for the ProductDialog dropdown
  const thermalProfilesForDialog: MockThermalProfile[] = thermalProfiles.map(
    (tp) => ({
      id: String(tp.id),
      name: tp.name,
      description: tp.description || '',
      tempMin: tp.temp_min_c,
      tempMax: tp.temp_max_c,
      products: [],
      status: tp.is_active ? 'Activo' : 'Inactivo',
      compatibility: 'Alta',
    })
  )

  // Convert organizations for display
  const displayOrganizations: OrganizationDisplay[] = organizations.map(
    toOrganizationDisplay
  )

  // Convert users for display
  const displayUsers: OrganizationMemberDisplay[] = users.map(toUserDisplay)

  // ============================================================================
  // TABLE ACTIONS
  // ============================================================================

  // Row actions for products
  const productsActions: DataTableAction<MockProduct>[] = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (product) => {
        setSelectedProduct(product)
        setProductDialogOpen(true)
      },
      title: 'Editar',
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      onClick: (product) => handleDeleteProduct(product),
      variant: 'destructive',
      title: 'Eliminar',
    },
  ]

  const productsBulkActions: DataTableBulkAction[] = [
    {
      label: 'Eliminar seleccionadas',
      icon: <Trash2 className='w-4 h-4' />,
      onClick: (selectedIds) => handleBulkDeleteProducts(selectedIds),
      variant: 'destructive',
    },
  ]

  // Row actions for thermal profiles
  const perfilesActions: DataTableAction<MockThermalProfile>[] = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (profile) => {
        setSelectedThermalProfile(profile)
        setThermalProfileDialogOpen(true)
      },
      title: 'Editar',
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      onClick: (profile) => handleDeleteThermalProfile(profile),
      variant: 'destructive',
      title: 'Eliminar',
    },
  ]

  const perfilesBulkActions: DataTableBulkAction[] = [
    {
      label: 'Eliminar seleccionadas',
      icon: <Trash2 className='w-4 h-4' />,
      onClick: (selectedIds) => handleBulkDeleteThermalProfiles(selectedIds),
      variant: 'destructive',
    },
  ]

  // Row actions for users
  const usersActions: DataTableAction<OrganizationMemberDisplay>[] = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (user) => {
        setSelectedUser(user)
        setUserDialogOpen(true)
      },
      title: 'Editar',
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      onClick: (user) => handleDeleteUser(user),
      variant: 'destructive',
      title: 'Eliminar',
    },
  ]

  const usersBulkActions: DataTableBulkAction[] = [
    {
      label: 'Eliminar seleccionados',
      icon: <Trash2 className='w-4 h-4' />,
      onClick: (selectedIds) => handleBulkDeleteUsers(selectedIds),
      variant: 'destructive',
    },
  ]

  // Row actions for organizations
  const organizationsActions: DataTableAction<OrganizationDisplay>[] = [
    {
      icon: <Pencil className='w-3.5 h-3.5 text-gray-600' />,
      onClick: (org) => {
        setSelectedOrganization(org)
        setOrganizationDialogOpen(true)
      },
      title: 'Editar',
    },
    {
      icon: <CheckCircle className='w-3.5 h-3.5 text-green-600' />,
      onClick: (org) => handleActivateOrganization(org),
      title: 'Activar',
      hidden: (org) => org.status === 'Activo',
    },
    {
      icon: <Ban className='w-3.5 h-3.5 text-yellow-600' />,
      onClick: (org) => handleSuspendOrganization(org),
      title: 'Suspender',
      hidden: (org) => org.status !== 'Activo',
    },
    {
      icon: <Trash2 className='w-3.5 h-3.5 text-red-600' />,
      onClick: (org) => handleCancelOrganization(org),
      variant: 'destructive',
      title: 'Cancelar',
    },
  ]

  const organizationsBulkActions: DataTableBulkAction[] = [
    {
      label: 'Suspender seleccionadas',
      icon: <Ban className='w-4 h-4' />,
      onClick: (selectedIds) => {
        selectedIds.forEach((id) => {
          const org = displayOrganizations.find((o) => o.id === id)
          if (org) handleSuspendOrganization(org)
        })
      },
      variant: 'destructive',
    },
  ]

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  // Define columns for products table
  const productsColumns: DataTableColumn<MockProduct>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (item) => (
        <div>
          <div className='text-sm font-medium text-[#004ef0]'>{item.name}</div>
          <div className='text-xs text-gray-500'>{item.id}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (item) => (
        <span className='text-xs text-gray-600 line-clamp-2'>
          {item.description}
        </span>
      ),
    },
    {
      key: 'thermalProfileIds',
      header: 'Perfiles Térmicos',
      render: (item) => (
        <div className='flex flex-wrap gap-1'>
          {item.thermalProfileIds.map((id, index) => {
            const profile = thermalProfilesForDialog.find((p) => p.id === id)
            return profile ? (
              <Badge
                key={index}
                variant='secondary'
                className='bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs'
              >
                {profile.name}
              </Badge>
            ) : null
          })}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item) => (
        <Badge
          variant='default'
          className={
            item.status === 'Activo'
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
          }
        >
          {item.status}
        </Badge>
      ),
      width: 'w-28',
    },
  ]

  // Define columns for thermal profiles table
  const thermalProfilesColumns: DataTableColumn<MockThermalProfile>[] = [
    {
      key: 'name',
      header: 'Nombre del Perfil',
      render: (item) => (
        <div>
          <div className='text-sm font-medium text-[#004ef0]'>{item.name}</div>
          <div className='text-xs text-gray-500'>{item.id}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (item) => (
        <span className='text-xs text-gray-600 line-clamp-2'>
          {item.description}
        </span>
      ),
    },
    {
      key: 'tempMin',
      header: 'Temp. Min',
      render: (item) => (
        <span className='text-xs text-gray-900'>{item.tempMin}°C</span>
      ),
      width: 'w-24',
    },
    {
      key: 'tempMax',
      header: 'Temp. Max',
      render: (item) => (
        <span className='text-xs text-gray-900'>{item.tempMax}°C</span>
      ),
      width: 'w-24',
    },
    {
      key: 'products',
      header: 'Productos',
      render: (item) => (
        <div className='flex flex-wrap gap-1'>
          {item.products.slice(0, 2).map((productName, index) => {
            const product = displayProducts.find((p) => p.name === productName)
            return product ? (
              <Badge
                key={index}
                variant='secondary'
                className='bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs'
              >
                {product.name}
              </Badge>
            ) : (
              <Badge
                key={index}
                variant='secondary'
                className='bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs'
              >
                {productName}
              </Badge>
            )
          })}
          {item.products.length > 2 && (
            <Badge
              variant='secondary'
              className='bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs'
            >
              +{item.products.length - 2} más
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item) => (
        <Badge
          variant='default'
          className={
            item.status === 'Activo'
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
          }
        >
          {item.status}
        </Badge>
      ),
      width: 'w-28',
    },
  ]

  // Define columns for users table
  const usersColumns: DataTableColumn<OrganizationMemberDisplay>[] = [
    {
      key: 'fullName',
      header: 'Nombre',
      render: (item) => (
        <div>
          <div className='text-sm font-medium text-[#004ef0]'>
            {item.fullName}
          </div>
          <div className='text-xs text-gray-500'>{item.email}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (item) => (
        <span className='text-xs text-gray-600'>{item.phone || '-'}</span>
      ),
      width: 'w-32',
    },
    {
      key: 'role',
      header: 'Rol',
      render: (item) => (
        <Badge
          variant='secondary'
          className={
            item.role === 'OWNER'
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs'
              : item.role === 'ADMIN'
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs'
          }
        >
          {getRoleLabel(item.role)}
        </Badge>
      ),
      width: 'w-28',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item) => (
        <Badge
          variant='default'
          className='bg-green-100 text-green-700 hover:bg-green-100 text-xs'
        >
          {item.status}
        </Badge>
      ),
      width: 'w-24',
    },
    {
      key: 'createdAt',
      header: 'Miembro desde',
      render: (item) => (
        <span className='text-xs text-gray-600'>
          {new Date(item.createdAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
      width: 'w-32',
    },
  ]

  // Define columns for organizations table
  const organizationsColumns: DataTableColumn<OrganizationDisplay>[] = [
    {
      key: 'comercialName',
      header: 'Nombre Comercial',
      render: (item) => (
        <div>
          <div className='text-sm font-medium text-[#004ef0]'>
            {item.comercialName}
          </div>
          <div className='text-xs text-gray-500'>{item.id.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      key: 'legalName',
      header: 'Razón Social',
      render: (item) => (
        <span className='text-xs text-gray-600'>{item.legalName}</span>
      ),
    },
    {
      key: 'city',
      header: 'Ciudad',
      render: (item) => (
        <span className='text-xs text-gray-600'>{item.city || '-'}</span>
      ),
      width: 'w-32',
    },
    {
      key: 'countryName',
      header: 'País',
      render: (item) => (
        <Badge
          variant='secondary'
          className='bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs'
        >
          {item.countryName || '-'}
        </Badge>
      ),
      width: 'w-28',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item) => (
        <Badge
          variant='default'
          className={
            item.status === 'Activo'
              ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
              : item.status === 'Suspendido'
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs'
              : item.status === 'Vencido'
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs'
              : 'bg-red-100 text-red-700 hover:bg-red-100 text-xs'
          }
        >
          {item.status}
        </Badge>
      ),
      width: 'w-28',
    },
  ]

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getFiltersForTab = () => {
    return (
      <Button
        variant='outline'
        size='sm'
        className='gap-2'
      >
        <Filter className='w-4 h-4' />
        Filtros
      </Button>
    )
  }

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'usuarios':
        return 'Buscar usuarios...'
      case 'productos':
        return 'Buscar productos...'
      case 'perfil-termico':
        return 'Buscar perfiles térmicos...'
      case 'organizaciones':
        return 'Buscar organizaciones...'
      default:
        return 'Buscar...'
    }
  }

  // Build tabs based on user permissions
  const getTabs = () => {
    const tabs = []

    // Organizations tab - only for platform admins
    if (isPlatformAdmin) {
      tabs.push({
        id: 'organizaciones',
        label: 'Organizaciones',
        active: activeTab === 'organizaciones',
        onClick: () => handleTabChange('organizaciones'),
        icon: <Building2 className='w-4 h-4' />,
      })
    }

    // These tabs require an organization to be selected
    if (orgId || isPlatformAdmin) {
      tabs.push(
        {
          id: 'usuarios',
          label: 'Usuarios',
          active: activeTab === 'usuarios',
          onClick: () => handleTabChange('usuarios'),
        },
        {
          id: 'productos',
          label: 'Productos',
          active: activeTab === 'productos',
          onClick: () => handleTabChange('productos'),
        },
        {
          id: 'perfil-termico',
          label: 'Perfil Térmico',
          active: activeTab === 'perfil-termico',
          onClick: () => handleTabChange('perfil-termico'),
        }
      )
    }

    return tabs
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className='flex flex-col h-full'>
      <PageHeader
        tabs={getTabs()}
        showSearch
        searchPlaceholder={getSearchPlaceholder()}
        filters={getFiltersForTab()}
      />

      {/* Error message */}
      {error && (
        <div className='mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md'>
          <p className='text-sm text-red-600'>{error}</p>
          <button
            onClick={() => setError(null)}
            className='text-xs text-red-500 underline mt-1'
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className='flex items-center justify-center py-8'>
          <div className='inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent'></div>
          <span className='ml-2 text-sm text-gray-600'>Cargando...</span>
        </div>
      )}

      {activeTab === 'organizaciones' && isPlatformAdmin && !loading && (
        <DataTable
          data={displayOrganizations}
          columns={organizationsColumns}
          getRowId={(item) => item.id}
          actions={organizationsActions}
          bulkActions={organizationsBulkActions}
          itemsPerPage={10}
          emptyMessage='No hay organizaciones para mostrar'
        />
      )}

      {activeTab === 'productos' && !loading && orgId && (
        <DataTable
          data={displayProducts}
          columns={productsColumns}
          getRowId={(item) => item.id}
          actions={productsActions}
          bulkActions={productsBulkActions}
          itemsPerPage={10}
          emptyMessage='No hay productos para mostrar'
        />
      )}

      {activeTab === 'usuarios' && !loading && orgId && (
        <DataTable
          data={displayUsers}
          columns={usersColumns}
          getRowId={(item) => item.id}
          actions={usersActions}
          bulkActions={usersBulkActions}
          itemsPerPage={10}
          emptyMessage='No hay usuarios para mostrar'
        />
      )}

      {activeTab === 'perfil-termico' && !loading && orgId && (
        <DataTable
          data={displayThermalProfiles}
          columns={thermalProfilesColumns}
          getRowId={(item) => item.id}
          actions={perfilesActions}
          bulkActions={perfilesBulkActions}
          itemsPerPage={10}
          emptyMessage='No hay perfiles térmicos para mostrar'
        />
      )}

      <ThermalProfileDialog
        open={thermalProfileDialogOpen}
        onClose={() => {
          setThermalProfileDialogOpen(false)
          setSelectedThermalProfile(undefined)
        }}
        profile={selectedThermalProfile}
        onSave={handleSaveThermalProfile}
      />

      <ProductDialog
        open={productDialogOpen}
        onClose={() => {
          setProductDialogOpen(false)
          setSelectedProduct(undefined)
        }}
        product={selectedProduct}
        thermalProfiles={thermalProfilesForDialog}
        onSave={handleSaveProduct}
      />

      <UserDialog
        open={userDialogOpen}
        onClose={() => {
          setUserDialogOpen(false)
          setSelectedUser(undefined)
        }}
        user={selectedUser}
        isPlatformAdmin={isPlatformAdmin}
        onSave={handleSaveUser}
        onCreateInviteCode={handleCreateInviteCode}
      />

      <OrganizationDialog
        open={organizationDialogOpen}
        onClose={() => {
          setOrganizationDialogOpen(false)
          setSelectedOrganization(undefined)
        }}
        organization={selectedOrganization}
        countries={countries}
        onSave={handleSaveOrganization}
      />
    </div>
  )
})

Settings.displayName = 'Settings'
