import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import type { User } from '../../../types/user.types'
import { organizationMembersService, mapMemberToUser } from '../../../services/database/organizationMembers.service'
import type { UserRole } from '../../../types/database.types'
import { useAppStore } from '../../../stores/useAppStore'
import { canModifyRole as canModifyRolePermission, mapStringToUserRole } from '../../../lib/permissions'

/**
 * Custom hook for managing users state and operations
 * Uses Zustand store for shared state between components (similar to useOrganizations)
 */
export function useUsers() {
  const organization = useAppStore((state) => state.organization)
  const orgId = organization?.id || ''
  const isPlatformUser = useAppStore((state) => state.isPlatformUser)
  const navigate = useNavigate()

  // Use Zustand store for users (shared state)
  const users = useAppStore((state) => state.users)
  const isLoading = useAppStore((state) => state.usersLoading)
  const usersLoadedOrgId = useAppStore((state) => state.usersLoadedOrgId)
  const setUsers = useAppStore((state) => state.setUsers)
  const setUsersLoading = useAppStore((state) => state.setUsersLoading)
  const setUsersLoadedOrgId = useAppStore((state) => state.setUsersLoadedOrgId)

  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [userInvitationSendDialogOpen, setUserInvitationSendDialogOpen] = useState(false)

  // Confirmation dialogs state
  const [suspendUserDialogOpen, setSuspendUserDialogOpen] = useState(false)
  const [reactivateUserDialogOpen, setReactivateUserDialogOpen] = useState(false)
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false)
  const [bulkDeleteUserDialogOpen, setBulkDeleteUserDialogOpen] = useState(false)
  const [userToAction, setUserToAction] = useState<User | undefined>(undefined)
  const [usersToDelete, setUsersToDelete] = useState<string[]>([])

  // Credentials dialog state
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
    firstName: string
    lastName: string
  } | undefined>(undefined)

  const [userDialogStep, setUserDialogStep] = useState<'form' | 'credentials'>('form')

  // Load users data
  const loadUsers = async (force = false) => {
    if (!orgId) {
      setUsers([])
      setUsersLoadedOrgId(null)
      return
    }

    // Skip if already loaded for this orgId and not forcing reload
    if (!force && usersLoadedOrgId === orgId && users.length > 0) {
      return
    }

    try {
      setUsersLoading(true)
      const members = await organizationMembersService.getAll(orgId)
      const mappedUsers = members.map(mapMemberToUser)
      setUsers(mappedUsers)
      setUsersLoadedOrgId(orgId)
    } catch (error) {
      toast.error('Error al cargar los usuarios')
      setUsers([])
      setUsersLoadedOrgId(null)
    } finally {
      setUsersLoading(false)
    }
  }

  // Load users only when orgId changes (not on every mount)
  useEffect(() => {
    // Only load if orgId changed or hasn't been loaded yet
    if (orgId && (usersLoadedOrgId !== orgId || users.length === 0)) {
      loadUsers()
    } else if (!orgId) {
      setUsers([])
      setUsersLoadedOrgId(null)
    }
  }, [orgId, usersLoadedOrgId, users.length])

  // Handlers
  const handleUserEdit = (user: User) => {
    setSelectedUser(user)
    setUserDialogStep('form')
    setUserDialogOpen(true)
  }

  const handleUserEditById = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      handleUserEdit(user)
    }
  }, [users])

  const handleUserDelete = (user: User) => {
    // Platform users (DEV/PLATFORM_ADMIN) can manage any user
    if (!isPlatformUser) {
      // Validate permissions before opening dialog for organization members
      const currentOrgMember = useAppStore.getState().organizationMember
      if (currentOrgMember?.role) {
        // Check if current user can manage target user
        if (!canModifyRolePermission(
          currentOrgMember.role,
          user.role || user.rol || 'STAFF',
          isPlatformUser
        )) {
          toast.error('No tienes permisos para eliminar este usuario')
          return
        }
      } else {
        toast.error('No tienes permisos para eliminar este usuario')
        return
      }
    }

    // Open confirmation dialog
    setUserToAction(user)
    setDeleteUserDialogOpen(true)
  }

  const handleConfirmDeleteUser = async () => {
    if (!userToAction || !orgId || !userToAction.id) {
      toast.error('Error: usuario o organización no válidos')
      return
    }

    try {
      // Find the member by member ID
      const member = await organizationMembersService.getById(userToAction.id, orgId)
      if (!member) {
        toast.error('Usuario no encontrado')
        return
      }

      // Handle deletion: if user_id is null (pending), delete by member id
      if (member.user_id === null || member.user_id === undefined) {
        await organizationMembersService.removeById(member.id, orgId)
      } else {
        await organizationMembersService.remove(member.user_id, orgId)
      }

      toast.success(`Usuario ${userToAction.firstName} ${userToAction.lastName} eliminado correctamente`)

      // Force reload after delete - clear cache first
      setUsersLoadedOrgId(null)
      await loadUsers(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el usuario'
      toast.error(errorMessage)
    } finally {
      setDeleteUserDialogOpen(false)
      // Note: Data cleanup (setUserToAction) is handled by onClose/dialog state management
      // to avoid flickering during the closing animation.
    }
  }

  const handleUserBulkDelete = (userIds: string[]) => {
    // Open confirmation dialog
    setUsersToDelete(userIds)
    setBulkDeleteUserDialogOpen(true)
  }

  const handleConfirmBulkDeleteUser = async () => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      setBulkDeleteUserDialogOpen(false)
      setUsersToDelete([])
      return
    }

    if (usersToDelete.length === 0) {
      setBulkDeleteUserDialogOpen(false)
      setUsersToDelete([])
      return
    }

    try {
      // Get all members and filter by IDs
      const members = await organizationMembersService.getAll(orgId)
      const membersToDelete = members.filter((m) => usersToDelete.includes(m.id))

      await Promise.all(
        membersToDelete.map((member) => {
          // Handle deletion: if user_id is null (pending), delete by member id
          if (member.user_id === null || member.user_id === undefined) {
            return organizationMembersService.removeById(member.id, orgId)
          } else {
            return organizationMembersService.remove(member.user_id, orgId)
          }
        })
      )

      toast.success(`${usersToDelete.length} usuario(s) eliminado(s) correctamente`)

      // Force reload after bulk delete - clear cache first
      setUsersLoadedOrgId(null)
      await loadUsers(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar los usuarios'
      toast.error(errorMessage)
    } finally {
      setBulkDeleteUserDialogOpen(false)
      // Note: Data cleanup (setUsersToDelete) is handled by dialog state management
    }
  }

  const handleUserSave = async (user: User) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      if (!user.id) {
        // Create new user using DIRECT CREATE (generates temp password)
        const role = mapStringToUserRole(user.role) as UserRole
        const targetOrgId = user.organizationId || orgId

        if (!targetOrgId) {
          toast.error('Organización requerida')
          return
        }

        // Check if user already exists (by email) using our new service method
        const existingMember = await organizationMembersService.getByEmail(user.email, orgId)

        if (existingMember) {
          // Calculate status using our logic helper
          const userStatus = mapMemberToUser(existingMember).status

          if (userStatus === 'Activo' || userStatus === 'Suspendido') {
            toast.error(`El usuario ya existe con estado: ${userStatus}`)
            return
          }

          // If Inactivo (soft-deleted), offer to reactivate or just reactivate
          // Since it's a "create" action, we'll auto-reactivate and update details
          if (userStatus === 'Inactivo') {
            // If user_id is null, it's a pending invite we re-send
            if (existingMember.user_id === null || existingMember.user_id === undefined) {
              // Update details first
              const { error: updateError } = await supabase
                .from('organization_members')
                .update({
                  role: mapStringToUserRole(user.role),
                  first_name: user.firstName,
                  last_name: user.lastName,
                  phone: user.phone || undefined,
                  status: 'active', // Should look "active" in UI as per new logic (Activo covers invitations)
                  is_active: true,
                  is_carrier_member: user.isCarrierMember,
                  carrier_id: user.carrierId,
                  driver_id: user.driverId
                })
                .eq('id', existingMember.id)

              if (updateError) throw updateError

              // Resend updated invitation
              await organizationMembersService.resendInvitation(
                orgId,
                user.email,
                mapStringToUserRole(user.role) as UserRole,
                user.firstName,
                user.lastName,
                user.phone, // Include phone number
                user.isCarrierMember,
                user.carrierId,
                user.driverId
              )

              toast.success(`Invitación reenviada a ${user.email}`)
            } else {
              // If existing user (soft deleted), just reactivate
              const { error: updateError } = await supabase
                .from('organization_members')
                .update({
                  role: mapStringToUserRole(user.role),
                  first_name: user.firstName,
                  last_name: user.lastName,
                  phone: user.phone || undefined,
                  status: 'active',
                  is_active: true,
                  is_carrier_member: user.isCarrierMember,
                  carrier_id: user.carrierId,
                  driver_id: user.driverId
                })
                .eq('id', existingMember.id)

              if (updateError) throw updateError
              toast.success(`Usuario reactivado y actualizado exitosamente`)
            }

            setUserDialogOpen(false)
            setSelectedUser(undefined)
            loadUsers(true)
            return
          }
        }

        // Use createDirectly instead of generic provison
        const result = await organizationMembersService.createDirectly({
          org_id: targetOrgId,
          email: user.email,
          role,
          first_name: user.firstName,
          last_name: user.lastName,
          phone: user.phone || undefined,
          is_carrier_member: user.isCarrierMember,
          carrier_id: user.carrierId,
          driver_id: user.driverId,
        })

        if (result.temp_password) {
          // Per business spec (line 171): Modal MUST show credentials for copying
          setCreatedCredentials({
            email: user.email,
            password: result.temp_password,
            firstName: user.firstName,
            lastName: user.lastName
          })

          // Swapping views instead of closing dialog (Modal Content Stepping pattern)
          setUserDialogStep('credentials')
          toast.success(`Usuario ${user.firstName} ${user.lastName} creado correctamente`)
        } else {
          // Fallback (shouldn't happen with direct_create: true)
          setUserDialogOpen(false)
          setSelectedUser(undefined)
          toast.success(`Usuario ${user.firstName} ${user.lastName} creado correctamente`)
        }

        loadUsers(true) // Force reload after create
      } else {
        // Update existing user
        const member = await organizationMembersService.getById(user.id, orgId)
        if (!member) {
          toast.error('Usuario no encontrado')
          return
        }

        // Check if user is trying to modify their own role
        const currentUser = useAppStore.getState().user
        const currentOrgMember = useAppStore.getState().organizationMember

        if (currentUser?.id && currentOrgMember?.user_id === currentUser.id) {
          // Check if this is the same user being edited
          if (member.user_id === currentUser.id) {
            // User is editing themselves - check if role changed
            const currentRole = mapStringToUserRole(currentOrgMember.role || 'STAFF') as UserRole
            const newRole = mapStringToUserRole(user.role) as UserRole

            if (currentRole !== newRole) {
              toast.error('No puedes modificar tu propio rol')
              return
            }
          }
        }

        const role = mapStringToUserRole(user.role) as UserRole
        const targetUserCurrentRole = member.role ? mapStringToUserRole(member.role) : 'STAFF'

        // Check if role is being changed and if current user has permission
        if (role !== targetUserCurrentRole) {
          if (!canModifyRolePermission(
            currentOrgMember?.role,
            role,
            isPlatformUser
          )) {
            toast.error('No tienes permisos para modificar este rol')
            return
          }
        }

        // Update organization member
        // If user_id is null (pending invitation), we can't update via user_id
        // Instead, we need to update by member id
        if (member.user_id === null || member.user_id === undefined) {
          // Update pending invitation by member id
          const { error } = await supabase
            .from('organization_members')
            .update({
              role,
              first_name: user.firstName,
              last_name: user.lastName,
              phone: user.phone || undefined,
              is_carrier_member: user.isCarrierMember,
              carrier_id: user.carrierId,
              driver_id: user.driverId,
            })
            .eq('id', member.id)
            .eq('org_id', orgId)

          if (error) throw error
        } else {
          // Update accepted member by user_id
          await organizationMembersService.update(member.user_id, orgId, {
            role,
            first_name: user.firstName,
            last_name: user.lastName,
            phone: user.phone || undefined,
            is_carrier_member: user.isCarrierMember,
            carrier_id: user.carrierId,
            driver_id: user.driverId,
          })
        }

        setUserDialogOpen(false)
        toast.success(`Usuario ${user.firstName} ${user.lastName} actualizado correctamente`)
        loadUsers(true) // Force reload after update
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el usuario'
      toast.error(errorMessage)
    }
  }

  const handleUserCreate = () => {
    setSelectedUser(undefined)
    setUserDialogStep('form')
    setUserDialogOpen(true)
  }

  const handleUserDialogClose = () => {
    setUserDialogOpen(false)
    setSelectedUser(undefined)
    setUserDialogStep('form')
    setCreatedCredentials(undefined)
    // Go back to base route if we are in a sub-route
    if (window.location.pathname.includes('/settings/users/')) {
      navigate('/settings/users')
    }
  }

  const handleCredentialsDialogClose = () => {
    handleUserDialogClose()
  }

  // Invitation handlers
  const handleUserInvitationSend = () => {
    setUserInvitationSendDialogOpen(true)
  }

  const handleUserInvitationSendDialogClose = () => {
    setUserInvitationSendDialogOpen(false)
    // Go back to base route if we are in a sub-route
    if (window.location.pathname.includes('/settings/users/invite')) {
      navigate('/settings/users')
    }
  }

  const handleUserInvitationSubmit = async (data: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    role: string
    organizationId: string
  }) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      const role = mapStringToUserRole(data.role) as UserRole

      await organizationMembersService.invite({
        org_id: data.organizationId || orgId,
        email: data.email,
        role,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone, // Include phone number
      })

      setUserInvitationSendDialogOpen(false)
      toast.info(`Invitación enviada a ${data.email} correctamente`)
      loadUsers(true) // Force reload after invitation
    } catch (error) {
      toast.error('Error al enviar la invitación')
    }
  }

  // Confirmation dialog handlers
  const handleUserSuspend = (user: User) => {
    // Platform users (DEV/PLATFORM_ADMIN) can manage any user
    if (!isPlatformUser) {
      // Validate permissions before opening dialog for organization members
      const currentOrgMember = useAppStore.getState().organizationMember
      if (currentOrgMember?.role) {
        // Check if current user can manage target user
        if (!canModifyRolePermission(
          currentOrgMember.role,
          user.role || user.rol || 'STAFF',
          isPlatformUser
        )) {
          toast.error('No tienes permisos para suspender este usuario')
          return
        }
      } else {
        toast.error('No tienes permisos para suspender este usuario')
        return
      }
    }

    setUserToAction(user)
    setSuspendUserDialogOpen(true)
  }

  const handleConfirmSuspendUser = async () => {
    if (!userToAction || !userToAction.id || !userToAction.organizationId) {
      toast.error('Error: Datos del usuario incompletos')
      return
    }

    try {
      await organizationMembersService.suspend(userToAction.id, userToAction.organizationId)
      toast.success(`Usuario ${userToAction.firstName} ${userToAction.lastName} suspendido correctamente`)
      loadUsers(true) // Force reload after suspend
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al suspender usuario'
      toast.error(errorMessage)
    } finally {
      setSuspendUserDialogOpen(false)
    }
  }

  const handleUserReactivate = (user: User) => {
    // Platform users (DEV/PLATFORM_ADMIN) can manage any user
    if (!isPlatformUser) {
      // Validate permissions before opening dialog for organization members
      const currentOrgMember = useAppStore.getState().organizationMember
      if (currentOrgMember?.role) {
        // Check if current user can manage target user
        if (!canModifyRolePermission(
          currentOrgMember.role,
          user.role || user.rol || 'STAFF',
          isPlatformUser
        )) {
          toast.error('No tienes permisos para reactivar este usuario')
          return
        }
      } else {
        toast.error('No tienes permisos para reactivar este usuario')
        return
      }
    }

    setUserToAction(user)
    setReactivateUserDialogOpen(true)
  }

  const handleConfirmReactivateUser = async () => {
    if (!userToAction || !userToAction.id || !userToAction.organizationId) {
      toast.error('Error: Datos del usuario incompletos')
      return
    }

    try {
      await organizationMembersService.reactivate(userToAction.id, userToAction.organizationId)
      toast.success(`Usuario ${userToAction.firstName} ${userToAction.lastName} reactivado correctamente`)
      loadUsers(true) // Force reload after reactivate
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al reactivar usuario'
      toast.error(errorMessage)
    } finally {
      setReactivateUserDialogOpen(false)
    }
  }

  return {
    // Data
    users,
    isLoading,

    // State
    selectedUser,
    userDialogOpen,
    userInvitationSendDialogOpen,
    suspendUserDialogOpen,
    reactivateUserDialogOpen,
    deleteUserDialogOpen,
    bulkDeleteUserDialogOpen,
    userToAction,
    usersToDelete,
    userDialogStep,
    createdCredentials,

    // Actions
    handleUserEdit,
    handleUserDelete,
    handleConfirmDeleteUser,
    handleUserBulkDelete,
    handleConfirmBulkDeleteUser,
    handleUserSave,
    handleUserCreate,
    handleUserDialogClose,
    handleUserInvitationSend,
    handleUserInvitationSendDialogClose,
    handleUserInvitationSubmit,
    handleUserEditById,
    handleUserSuspend,
    handleConfirmSuspendUser,
    handleUserReactivate,
    handleConfirmReactivateUser,
    setSuspendUserDialogOpen,
    setReactivateUserDialogOpen,
    setDeleteUserDialogOpen,
    setBulkDeleteUserDialogOpen,
    handleCredentialsDialogClose,
    setUserDialogStep
  }
}
