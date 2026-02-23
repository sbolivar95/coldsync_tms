import { useImperativeHandle, forwardRef, useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { PageHeader } from '../layouts/PageHeader'
import type { User } from '../types/user.types'
import { StatusFilter } from '../components/ui/StatusFilter'
import { EntityStatusFilter } from '../components/ui/EntityStatusFilter'
import { OrganizationDetail } from '../features/settings/entities/organizations/OrganizationDetail'
import { RateCardDetail } from '../features/settings/entities/rate_cards/RateCardDetail'
import { SettingsDialogs } from '../features/settings/components/SettingsDialogs'
import { OrganizationsTab } from '../features/settings/entities/organizations/OrganizationsTab'
import { UsersTab } from '../features/settings/entities/users/UsersTab'
import { ProductsTab } from '../features/settings/entities/products/ProductsTab'
import { ThermalProfilesTab } from '../features/settings/entities/thermal_profiles/ThermalProfilesTab'
import { RateCardsTab } from '../features/settings/entities/rate_cards/RateCardsTab'

import { useAppStore } from '../stores/useAppStore' // existing import

import {
  useProducts,
  useThermalProfiles,
  useOrganizations,
  useUsers,
  useRateCards,
  useSettingsFilters,
  useSettingsTabs,
} from '../features/settings/hooks'
import type { Organization } from '../features/settings/hooks/useOrganizations'
import type { OrganizationFormData } from '../lib/schemas/organization.schemas'

export interface SettingsRef {
  handleCreate: () => void
}

/**
 * Settings - Main settings page with tabbed interface
 * Orchestrates entity management using custom hooks for better organization
 */
export const Settings = forwardRef<SettingsRef, {}>((_, ref) => {
  // Store - Use specific selectors to avoid unnecessary re-renders
  const registerCreateHandler = useAppStore((state) => state.registerCreateHandler)
  const organization = useAppStore((state) => state.organization)
  const isPlatformUser = useAppStore((state) => state.isPlatformUser)
  const organizationMember = useAppStore((state) => state.organizationMember)
  const location = useLocation()
  const { orgId, userId, profileId, productId, rateCardId } = useParams()
  const orgIdFromStore = organization?.id || ''

  // Check if user is OWNER
  const isOwner = organizationMember?.role === 'OWNER'
  const canAccessOrganizations = isPlatformUser || isOwner

  // Custom hooks for entity management
  const products = useProducts(orgIdFromStore)
  const thermalProfiles = useThermalProfiles(orgIdFromStore)
  const rateCards = useRateCards(orgIdFromStore)
  const organizations = useOrganizations()
  const users = useUsers()

  // Settings tabs and navigation hook
  const tabs = useSettingsTabs({
    canAccessOrganizations,
    isPlatformUser,
    organization,
    organizationMember,
  })

  // Settings filters hook
  const filters = useSettingsFilters({
    activeTab: tabs.activeTab,
    searchTerm: tabs.searchTerm,
    statusFilter: tabs.statusFilter,
    entityStatusFilter: tabs.entityStatusFilter,
    organizations: organizations.organizations,
    users: users.users,
    products: products.products,
    thermalProfiles: thermalProfiles.thermalProfiles,
    rateCards: rateCards.rateCards,
    organizationMember,
    isPlatformUser,
  })

  // Use refs to maintain stable references to handlers and prevent infinite loops
  const handlersRef = useRef({
    organizations: tabs.handleOrganizationCreate,
    products: products.handleProductCreate,
    thermalProfiles: thermalProfiles.handleThermalProfileCreate,
    users: users.handleUserCreate,
    rateCards: tabs.handleRateCardCreate,
  })

  // Update refs synchronously (refs don't cause re-renders)
  handlersRef.current.organizations = tabs.handleOrganizationCreate
  handlersRef.current.products = products.handleProductCreate
  handlersRef.current.thermalProfiles = thermalProfiles.handleThermalProfileCreate
  handlersRef.current.users = users.handleUserCreate
  handlersRef.current.rateCards = tabs.handleRateCardCreate

  // User action handlers - use handlers from useUsers hook
  const handleUserSuspend = (user: User) => {
    users.handleUserSuspend(user)
  }

  const handleUserReactivate = (user: User) => {
    users.handleUserReactivate(user)
  }

  // Organization detail save handler
  const handleOrganizationDetailSave = async (data: OrganizationFormData) => {
    if (tabs.selectedOrganizationForDetail?.id) {
      // Update existing organization
      await organizations.handleOrganizationSave({
        ...tabs.selectedOrganizationForDetail,
        ...data,
        base_country_id: parseInt(data.base_country_id),
      })
    } else {
      // Create new organization
      await organizations.handleOrganizationSave({
        id: '',
        ...data,
        base_country_id: parseInt(data.base_country_id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Organization)

      // Navigate back to list only after successful creation
      tabs.handleOrganizationDetailBack()
    }
  }

  // Handlers - Create Actions
  // Use refs to access handlers without causing re-renders
  const handleCreate = () => {
    switch (tabs.activeTab) {
      case 'organizaciones':
        // Only platform users can create organizations
        if (isPlatformUser) {
          tabs.handleOrganizationCreate()
        }
        break
      case 'productos':
        tabs.handleProductCreate()
        break
      case 'perfil-termico':
        tabs.handleThermalProfileCreate()
        break
      case 'tarifarios':
        handlersRef.current.rateCards()
        break
      case 'usuarios':
        handlersRef.current.users()
        break
    }
  }

  // Effects
  useImperativeHandle(ref, () => ({
    handleCreate,
  }))

  useEffect(() => {
    registerCreateHandler(location.pathname, handleCreate)
  }, [location.pathname, tabs.activeTab, registerCreateHandler, handleCreate])

  // Auto-load organization when entering via URL if not already selected
  useEffect(() => {
    if (orgId && orgId !== 'new' && !tabs.selectedOrganizationForDetail && organizations.organizations.length > 0) {
      const org = organizations.organizations.find(o => o.id === orgId)
      if (org) {
        tabs.setSelectedOrganizationForDetail(org)
      }
    }
  }, [orgId, organizations.organizations, tabs.selectedOrganizationForDetail, tabs])

  // Auto-load OWNER's organization when entering organizations tab
  useEffect(() => {
    if (isOwner && tabs.activeTab === 'organizaciones' && organization?.id) {
      // Load the organization but keep it in list view
      // The user can click on the organization to see details
      organizations.loadOrganizations(true)
    }
  }, [isOwner, tabs.activeTab, organization?.id, organizations])

  // Listen for invitation dialog events from AppLayout
  useEffect(() => {
    const handleInvitationEvent = (event: CustomEvent) => {
      const { tab } = event.detail
      if (tab === 'usuarios') {
        users.handleUserInvitationSend()
      }
    }

    window.addEventListener('openInvitationDialog', handleInvitationEvent as EventListener)

    return () => {
      window.removeEventListener('openInvitationDialog', handleInvitationEvent as EventListener)
    }
  }, [users])

  // Sync User Dialogs with URL
  useEffect(() => {
    if (tabs.activeTab === 'usuarios') {
      const path = location.pathname

      if (path.endsWith('/users/new')) {
        if (!users.userDialogOpen) users.handleUserCreate()
      } else if (path.endsWith('/users/invite')) {
        if (!users.userInvitationSendDialogOpen) users.handleUserInvitationSend()
      } else if (path.includes('/users/') && path.endsWith('/edit') && userId) {
        if (!users.userDialogOpen) users.handleUserEditById(userId)
      }
    }
  }, [location.pathname, tabs.activeTab, userId, users.users.length]) // Depend on users length to ensure data is loaded before auto-editing

  // Sync Thermal Profile Dialogs with URL
  useEffect(() => {
    if (tabs.activeTab === 'perfil-termico') {
      const path = location.pathname

      if (path.endsWith('/thermal-profiles/new')) {
        if (!thermalProfiles.thermalProfileDialogOpen) thermalProfiles.handleThermalProfileCreate()
      } else if (path.includes('/thermal-profiles/') && path.endsWith('/edit') && profileId) {
        if (!thermalProfiles.thermalProfileDialogOpen) thermalProfiles.handleThermalProfileEditById(profileId)
      }
    }
  }, [location.pathname, tabs.activeTab, profileId, thermalProfiles.thermalProfiles.length]) // Depend on thermal profiles length to ensure data is loaded before auto-editing

  // Sync Product Dialogs with URL
  useEffect(() => {
    if (tabs.activeTab === 'productos') {
      const path = location.pathname

      if (path.endsWith('/products/new')) {
        if (!products.productDialogOpen) products.handleProductCreate()
      } else if (path.includes('/products/') && path.endsWith('/edit') && productId) {
        if (!products.productDialogOpen) products.handleProductEditById(productId)
      }
    }
  }, [location.pathname, tabs.activeTab, productId, products.products.length]) // Depend on products length to ensure data is loaded before auto-editing

  // Rate card detail path: show full-page form instead of list + dialog
  const isRateCardDetailPath =
    location.pathname.includes('/settings/rate-cards/') &&
    (location.pathname.endsWith('/new') || !!rateCardId)

  if (tabs.activeTab === 'tarifarios' && isRateCardDetailPath) {
    const resolvedRateCard = rateCardId
      ? rateCards.rateCards.find((rc) => rc.id === rateCardId)
      : undefined
    return (
      <RateCardDetail
        rateCard={resolvedRateCard}
        onBack={tabs.handleRateCardDetailBack}
        onSave={async (data, existingRateCard, thermalModifiers) => {
          await rateCards.handleRateCardSaveFromDetail(
            existingRateCard ?? resolvedRateCard,
            data,
            thermalModifiers
          )
        }}
      />
    )
  }

  // Show OrganizationDetail when in detail view (full screen, no PageHeader)
  // Check both tab state and URL to ensure consistency
  const isOrganizationDetailPath = location.pathname.includes('/settings/organizations/') && (orgId || location.pathname.endsWith('/new'))

  if (
    canAccessOrganizations &&
    tabs.activeTab === 'organizaciones' &&
    (tabs.organizationView === 'detail' || isOrganizationDetailPath)
  ) {
    return (
      <OrganizationDetail
        organization={tabs.selectedOrganizationForDetail || undefined}
        onBack={tabs.handleOrganizationDetailBack}
        onSave={handleOrganizationDetailSave}
      />
    )
  }

  // Render filter component based on configuration
  const filterConfig = tabs.getFilterConfig()
  const renderFilter = () => {
    if (filterConfig.type === 'status') {
      return (
        <StatusFilter
          value={tabs.statusFilter}
          onChange={tabs.handleStatusFilterChange}
          label="Estado"
        />
      )
    }
    if (filterConfig.type === 'entity' && filterConfig.options) {
      return (
        <EntityStatusFilter
          value={tabs.entityStatusFilter}
          onChange={tabs.handleEntityStatusFilterChange}
          options={filterConfig.options}
          label="Estado"
        />
      )
    }
    return null
  }

  // Show normal settings view with PageHeader
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        tabs={tabs.tabs}
        showSearch
        searchPlaceholder={tabs.getSearchPlaceholder() || 'Buscar...'}
        onSearch={tabs.handleSearchChange}
        filters={renderFilter()}
      />

      {/* Tab Content */}
      {canAccessOrganizations &&
        tabs.activeTab === 'organizaciones' &&
        tabs.organizationView === 'list' && (
          <OrganizationsTab
            organizations={filters.filteredOrganizations}
            onDelete={organizations.handleOrganizationDelete}
            onBulkDelete={organizations.handleOrganizationBulkDelete}
            onRowClick={tabs.handleOrganizationRowClick}
            isOwner={isOwner}
          />
        )}

      {tabs.activeTab === 'usuarios' && (
        <UsersTab
          users={filters.filteredUsers}
          onEdit={(user) => user.id && tabs.handleUserEdit(user.id)}
          onDelete={users.handleUserDelete}
          onBulkDelete={users.handleUserBulkDelete}
          onSuspend={handleUserSuspend}
          onReactivate={handleUserReactivate}
        />
      )}

      {tabs.activeTab === 'productos' && (
        <ProductsTab
          products={filters.filteredProducts}
          onEdit={(product) => tabs.handleProductEdit(product.id.toString())}
          onDelete={products.handleProductDelete}
          onReactivate={products.handleProductReactivate}
          onBulkDelete={products.handleProductBulkDelete}
        />
      )}

      {tabs.activeTab === 'perfil-termico' && (
        <ThermalProfilesTab
          thermalProfiles={filters.filteredThermalProfiles}
          onEdit={(profile) => tabs.handleThermalProfileEdit(profile.id.toString())}
          onDelete={thermalProfiles.handleThermalProfileDelete}
          onReactivate={thermalProfiles.handleThermalProfileReactivate}
          onBulkDelete={thermalProfiles.handleThermalProfileBulkDelete}
        />
      )}

      {tabs.activeTab === 'tarifarios' && (
        <RateCardsTab
          rateCards={filters.filteredRateCards}
          onEdit={(rateCard) => tabs.handleRateCardEdit(rateCard.id)}
          onDelete={rateCards.handleRateCardDelete}
          onReactivate={rateCards.handleRateCardReactivate}
          onPermanentDelete={rateCards.handlePermanentDeleteRequest}
          onBulkDelete={rateCards.handleRateCardBulkDelete}
          onBulkPermanentDelete={rateCards.handleBulkPermanentDeleteRequest}
          onDuplicate={rateCards.handleOpenBatchDuplicateDialog}
        />
      )}

      {/* Dialogs */}
      <SettingsDialogs
        isPlatformUser={isPlatformUser}
        orgId={orgIdFromStore}
        organizations={organizations}
        users={users}
        products={products}
        thermalProfiles={thermalProfiles}
        rateCards={rateCards}
      />
    </div>
  )
})

Settings.displayName = 'Settings'
