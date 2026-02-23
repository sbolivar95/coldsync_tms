import { PageHeader } from '../layouts/PageHeader'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { X, Save, Check } from 'lucide-react'
import { SecondaryButton } from '../components/widgets/SecondaryButton'
import { PrimaryButton } from '../components/widgets/PrimaryButton'
import {
  profileSchema,
  passwordSchema,
  type ProfileFormData,
  type PasswordFormData,
} from '../lib/schemas/profile.schemas'
import { useAppStore } from '../stores/useAppStore'
import { authService } from '../services/database/auth.service'
import { organizationMembersService } from '../services/database/organizationMembers.service'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { ProfileAvatarSection, ProfilePersonalInfoForm, ProfileOrganizationSection, ProfilePasswordForm, ProfileLogoutSection } from '../features/profile'

export function Profile() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Get user, organizationMember and isPlatformUser from store
  const { user, organizationMember, clearAuthSession, setAuthSession, isPlatformUser } =
    useAppStore(
      useShallow((state) => ({
        user: state.user,
        organizationMember: state.organizationMember,
        clearAuthSession: state.clearAuthSession,
        setAuthSession: state.setAuthSession,
        isPlatformUser: state.isPlatformUser,
      }))
    )

  // Get phone from organizationMember first, then fallback to user_metadata
  const getPhone = () => {
    if (organizationMember?.phone) {
      return organizationMember.phone
    }
    return user?.user_metadata?.phone || ''
  }

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.user_metadata?.first_name || '',
      lastName: user?.user_metadata?.last_name || '',
      email: user?.email || '',
      phone: getPhone(),
    },
  })

  // Watch form values to detect changes
  const watchedValues = profileForm.watch()

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!user) return false

    const originalValues = {
      firstName: user.user_metadata?.first_name || '',
      lastName: user.user_metadata?.last_name || '',
      email: user.email || '',
      phone: getPhone(),
    }

    return (
      watchedValues.firstName !== originalValues.firstName ||
      watchedValues.lastName !== originalValues.lastName ||
      watchedValues.email !== originalValues.email ||
      watchedValues.phone !== originalValues.phone
    )
  }, [watchedValues, user, organizationMember])

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      new: '',
      confirm: '',
    },
  })

  // Update profile form when user data changes
  useEffect(() => {
    if (user && !isLoading) {
      profileForm.reset({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        phone: getPhone(),
      })
    }
  }, [user, organizationMember, isLoading])

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setJustSaved(false)

    try {
      // Update user metadata in Supabase Auth
      await authService.updateUserMetadata({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
      })

      // Also update phone in organization_members if user has an organization
      if (organizationMember && user?.id) {
        const { organization } = useAppStore.getState()
        if (organization?.id) {
          // Update organization member phone AND name
          await organizationMembersService.update(user.id, organization.id, {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone || undefined,
          })
        }
      }

      // Refresh user session to get updated data
      const updatedSession = await authService.getCurrentSession()
      if (updatedSession) {
        setAuthSession(updatedSession)
      }

      setJustSaved(true)
      toast.success('Perfil actualizado correctamente')

      // Clear the "just saved" indicator after 3 seconds
      setTimeout(() => setJustSaved(false), 3000)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al actualizar el perfil'
      toast.error(errorMessage)
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsPasswordLoading(true)
    try {
      await authService.changePassword(data.new)
      toast.success('Contraseña cambiada correctamente')
      passwordForm.reset()
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al cambiar la contraseña'
      toast.error(errorMessage)
      console.error('Error changing password:', error)
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      clearAuthSession()
      toast.success('Sesión cerrada correctamente')
      navigate('/login')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al cerrar sesión'
      toast.error(errorMessage)
      console.error('Error logging out:', error)
    }
  }

  const profileWatch = profileForm.watch()
  const displayName =
    `${profileWatch.firstName || ''} ${profileWatch.lastName || ''}`.trim() ||
    user?.email ||
    'Usuario'

  // Get role display name
  const getRoleDisplayName = () => {
    if (isPlatformUser) return 'Administrador de Plataforma'
    return 'Usuario'
  }

  const displayRole = getRoleDisplayName()

  return (
    <div className='flex flex-col h-full'>
      <PageHeader />

      <div className='flex-1 p-6 bg-gray-50 overflow-auto pb-24'>
        <div className='max-w-3xl mx-auto space-y-6'>
          {/* Personal Information */}
          <Card className='p-6'>
            <ProfileAvatarSection
              displayName={displayName}
              displayRole={displayRole}
              firstName={profileWatch.firstName}
              lastName={profileWatch.lastName}
            />

            <ProfilePersonalInfoForm
              form={profileForm}
              onSubmit={onProfileSubmit}
            />
          </Card>

          {/* Organization Information */}
          <Card className='p-6'>
            <ProfileOrganizationSection />
          </Card>

          {/* Change Password */}
          <Card className='p-6'>
            <ProfilePasswordForm
              form={passwordForm}
              onSubmit={onPasswordSubmit}
              isLoading={isPasswordLoading}
            />
          </Card>

          {/* Logout */}
          <Card className='p-6'>
            <ProfileLogoutSection onLogout={handleLogout} />
          </Card>
        </div>
      </div>

      {/* Fixed Footer with Action Buttons */}
      <div className='border-t border-gray-200 bg-white px-6 py-4 shrink-0'>
        <div className='max-w-3xl mx-auto flex justify-end gap-3'>
          <SecondaryButton
            icon={X}
            onClick={() => {
              profileForm.reset()
              setJustSaved(false)
            }}
            disabled={!hasChanges}
          >
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            icon={justSaved ? Check : Save}
            disabled={isLoading || !hasChanges}
            onClick={() => {
              profileForm.handleSubmit(onProfileSubmit)()
            }}
            className={justSaved ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {isLoading ? 'Guardando...' : justSaved ? 'Guardado' : 'Guardar'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
