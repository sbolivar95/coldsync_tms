import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { PrimaryButton } from '../components/widgets/PrimaryButton'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Toaster } from '../components/ui/Sonner'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '../components/ui/Alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '../components/ui/Form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { supabase } from '../lib/supabase'
import { organizationMembersService } from '../services/database/organizationMembers.service'

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export function SetPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Get token from URL (magic link token) - if present, it's a magic link flow
  const token = searchParams.get('token')

  // Determine flow type: magic link (has token) or forced password change (no token, but authenticated)
  const isMagicLinkFlow = !!token

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true)
    try {
      if (isMagicLinkFlow) {
        // Magic link flow: User clicked magic link, Supabase created user in auth.users
        // Now we need to:
        // 1. Verify user is authenticated (Supabase auto-authenticates on magic link click)
        // 2. Update password
        // 3. Update organization_members record with user_id and is_active = true

        // Get current session (user should be authenticated after clicking magic link)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session?.user) {
          throw new Error('No se pudo obtener la sesión. Por favor, haz click en el enlace de invitación nuevamente.')
        }

        const userId = session.user.id
        const userEmail = session.user.email

        if (!userEmail) {
          throw new Error('No se pudo obtener el email del usuario')
        }

        // Update password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.password
        })

        if (passwordError) {
          throw new Error(`Error al establecer la contraseña: ${passwordError.message}`)
        }

        // Update organization_members record: set user_id and is_active = true
        const updatedMember = await organizationMembersService.acceptInvitation(
          userId,
          userEmail
        )

        if (!updatedMember) {
          // No pending invitation found - might have already been accepted
          toast.warning('La invitación ya fue aceptada o no existe')
        } else {
          toast.success('¡Bienvenido! Tu contraseña ha sido establecida correctamente.')
        }

        // Navigate to dashboard
        navigate('/dashboard')
      } else {
        // Forced password change flow: User is already authenticated with temporary password
        // First, verify that user actually needs to change password
        // Use getSession() first as it's more reliable than getUser()
        let currentUser = null

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session?.user) {
          // If session fails, try getUser() as fallback
          const { data: { user }, error: userError } = await supabase.auth.getUser()

          if (userError || !user) {
            throw new Error('No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.')
          }

          currentUser = user
        } else {
          currentUser = session.user
        }

        // Verify that user actually needs to change password
        const needsPasswordChange = currentUser.user_metadata?.temp_password === true

        if (!needsPasswordChange) {
          // User doesn't need to change password, redirect to dashboard
          navigate('/dashboard')
          return
        }

        // Update password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.password,
          data: {
            temp_password: false // Clear the flag
          }
        })

        if (passwordError) {
          throw new Error(`Error al establecer la contraseña: ${passwordError.message}`)
        }

        toast.success('Contraseña actualizada correctamente')

        // Note: The needsPasswordChange flag is cleared in user_metadata
        // AppLayout will refresh the session on next render, so we don't need to update store here

        // Navigate to dashboard
        navigate('/dashboard')
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al establecer la contraseña'
      console.error('Set password error:', error)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Show error if magic link flow but no token
  if (isMagicLinkFlow && !token) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-primary-light to-white'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-center'>Enlace Inválido</CardTitle>
            <CardDescription className='text-center'>
              El enlace de invitación no es válido o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PrimaryButton
              className='w-full'
              onClick={() => navigate('/login')}
            >
              Volver al Inicio de Sesión
            </PrimaryButton>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100'>
      <div className='w-full max-w-md'>
        <div className='bg-white rounded-lg shadow-xl p-8'>
          {/* Logo */}
          <div className='text-center mb-8'>
            <div className='flex flex-col items-center justify-center'>
              <img
                src="/assets/images/logo/ColdSync.png"
                alt="ColdSync"
                className="h-20 w-auto"
              />
            </div>
          </div>

          {/* Header */}
          <div className='text-center mb-6'>
            <div className='flex justify-center mb-4'>
              <div className={`rounded-full p-3 ${isMagicLinkFlow ? 'bg-primary-light' : 'bg-orange-100'}`}>
                {isMagicLinkFlow ? (
                  <Mail className='h-6 w-6 text-primary' />
                ) : (
                  <LockKeyhole className='h-6 w-6 text-orange-600' />
                )}
              </div>
            </div>
            <h1 className='text-2xl font-semibold text-gray-900 mb-2'>
              {isMagicLinkFlow ? 'Bienvenido a ColdSync TMS' : 'Cambio de Contraseña Requerido'}
            </h1>
            <p className='text-sm text-gray-600 mb-4'>
              {isMagicLinkFlow
                ? 'Completa tu registro definiendo una contraseña segura'
                : 'Por seguridad, debes establecer tu contraseña antes de continuar'}
            </p>

            {/* Alert for forced change flow */}
            {!isMagicLinkFlow && (
              <Alert className='bg-orange-50 border-orange-200'>
                <LockKeyhole className='h-4 w-4 text-orange-600' />
                <AlertDescription className='text-xs text-orange-800'>
                  Esta es una contraseña temporal. Debes cambiarla ahora para acceder al sistema.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Formulario */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6'
            >
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs text-gray-600'>
                      Nueva Contraseña
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder='••••••••'
                          className='pr-10'
                          {...field}
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showPassword ? (
                            <EyeOff className='h-4 w-4 text-gray-500' />
                          ) : (
                            <Eye className='h-4 w-4 text-gray-500' />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription className='text-xs text-gray-500'>
                      Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs text-gray-600'>
                      Confirmar Contraseña
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder='••••••••'
                          className='pr-10'
                          {...field}
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className='h-4 w-4 text-gray-500' />
                          ) : (
                            <Eye className='h-4 w-4 text-gray-500' />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <PrimaryButton
                type='submit'
                className='w-full'
                disabled={isLoading}
              >
                {isLoading
                  ? (isMagicLinkFlow ? 'Configurando contraseña...' : 'Estableciendo contraseña...')
                  : (isMagicLinkFlow ? 'Completar Registro' : 'Establecer Contraseña')
                }
              </PrimaryButton>
            </form>
          </Form>

          {/* Footer - Only show for magic link flow */}
          {isMagicLinkFlow && (
            <div className='mt-6 text-center'>
              <p className='text-sm text-gray-600'>
                ¿Ya tienes una cuenta?{' '}
                <a
                  href='/login'
                  className='text-primary hover:text-primary-focus'
                >
                  Iniciar Sesión
                </a>
              </p>
            </div>
          )}
        </div>

        <p className='text-center mt-6 text-sm text-gray-600'>
          © 2026 ColdSync. Todos los derechos reservados.
        </p>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
