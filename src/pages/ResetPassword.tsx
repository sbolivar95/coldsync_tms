import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { PrimaryButton } from '../components/widgets/PrimaryButton'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Toaster } from '../components/ui/Sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '../components/ui/Form'
import { authService } from '../services/database/auth.service'
import { supabase } from '../lib/supabase'

// Schema for requesting password reset (step 1)
const requestResetSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
})

// Schema for resetting password (step 2 - with token)
const resetPasswordSchema = z.object({
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

type RequestResetFormData = z.infer<typeof requestResetSchema>
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Check if user is authenticated (Supabase auto-authenticates on password reset link click)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const authenticated = !!session

        // If authenticated from password reset link, mark in sessionStorage
        // This prevents user from navigating away without completing password reset
        if (authenticated) {
          sessionStorage.setItem('password_reset_in_progress', 'true')
        }

        setIsAuthenticated(authenticated)
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsAuthenticated(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  // Get token from URL (if coming from magic link) - legacy support
  const token = searchParams.get('token')
  // User is in reset step if authenticated OR has token in URL
  const isResetStep = isAuthenticated || !!token

  // Form for requesting reset (step 1)
  const requestForm = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: '',
    },
  })

  // Form for resetting password (step 2)
  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onRequestReset = async (data: RequestResetFormData) => {
    setIsLoading(true)
    try {
      await authService.resetPasswordForEmail(data.email)
      toast.success('Se ha enviado un enlace de recuperación a tu correo electrónico')
      setEmailSent(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar el correo de recuperación'
      toast.error(errorMessage)
      console.error('Password reset request error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      // Verify user is authenticated (Supabase auto-authenticates on password reset link click)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        throw new Error('No se pudo obtener la sesión. Por favor, haz click en el enlace de recuperación nuevamente.')
      }

      // Update password using Supabase auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      })

      if (updateError) {
        throw new Error(`Error al restablecer la contraseña: ${updateError.message}`)
      }

      toast.success('Tu contraseña ha sido restablecida correctamente')

      // Clear the password reset flag
      sessionStorage.removeItem('password_reset_in_progress')

      // Sign out to force re-login with new password
      await supabase.auth.signOut()

      // Navigate to login after successful reset
      navigate('/login')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al restablecer la contraseña'
      toast.error(errorMessage)
      console.error('Password reset error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-primary-light to-white'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-sm text-gray-600'>Verificando...</p>
        </div>
      </div>
    )
  }

  // Step 2: Reset password with token (user is authenticated)
  if (isResetStep) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-primary-light to-white'>
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
                <div className='rounded-full bg-primary-light p-3'>
                  <Lock className='h-6 w-6 text-primary' />
                </div>
              </div>
              <h1 className='text-2xl font-semibold text-gray-900 mb-2'>
                Restablecer Contraseña
              </h1>
              <p className='text-sm text-gray-600'>
                Ingresa tu nueva contraseña
              </p>
            </div>

            {/* Formulario */}
            <Form {...resetForm}>
              <form
                onSubmit={resetForm.handleSubmit(onResetPassword)}
                className='space-y-6'
              >
                <FormField
                  control={resetForm.control}
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
                  control={resetForm.control}
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
                  {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                </PrimaryButton>
              </form>
            </Form>

            {/* Footer */}
            <div className='mt-6 text-center'>
              <Link
                to='/login'
                className='text-primary hover:text-primary-focus inline-flex items-center gap-1'
              >
                <ArrowLeft className='h-4 w-4' />
                Volver al Inicio de Sesión
              </Link>
            </div>
          </div>
        </div>

        <Toaster />
      </div>
    )
  }

  // Step 1: Request password reset
  if (emailSent) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-primary-light to-white'>
        <div className='w-full max-w-md'>
          <div className='bg-white rounded-lg shadow-xl p-8 text-center'>
            {/* Logo */}
            <div className='mb-8'>
              <div className='flex flex-col items-center justify-center'>
                <img
                  src="/assets/images/logo/ColdSync.png"
                  alt="ColdSync"
                  className="h-20 w-auto"
                />
              </div>
            </div>

            {/* Success Message */}
            <div className='mb-6'>
              <div className='flex justify-center mb-4'>
                <div className='rounded-full bg-green-100 p-3'>
                  <Mail className='h-6 w-6 text-green-600' />
                </div>
              </div>
              <h1 className='text-2xl font-semibold text-gray-900 mb-2'>
                Email Enviado
              </h1>
              <p className='text-sm text-gray-600 mb-4'>
                Hemos enviado un enlace de restablecimiento a tu correo electrónico.
              </p>
              <p className='text-xs text-gray-500'>
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </p>
            </div>

            <PrimaryButton
              className='w-full'
              onClick={() => navigate('/login')}
            >
              Volver al Inicio de Sesión
            </PrimaryButton>
          </div>
        </div>

        <Toaster />
      </div>
    )
  }

  // Initial state: Request reset form
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
              <div className='rounded-full bg-primary-light p-3'>
                <Lock className='h-6 w-6 text-primary' />
              </div>
            </div>
            <h1 className='text-2xl font-semibold text-gray-900 mb-2'>
              ¿Olvidaste tu contraseña?
            </h1>
            <p className='text-sm text-gray-600'>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {/* Formulario */}
          <Form {...requestForm}>
            <form
              onSubmit={requestForm.handleSubmit(onRequestReset)}
              className='space-y-6'
            >
              <FormField
                control={requestForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs text-gray-600'>
                      Correo Electrónico
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='usuario@ejemplo.com'
                        {...field}
                      />
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
                {isLoading ? 'Enviando...' : 'Restablecer Contraseña'}
              </PrimaryButton>
            </form>
          </Form>

          {/* Footer */}
          <div className='mt-6 text-center'>
            <Link
              to='/login'
              className='text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1'
            >
              <ArrowLeft className='h-4 w-4' />
              Inicio de Sesión
            </Link>
          </div>
        </div>
        <p className='text-center mt-6 text-sm text-gray-600'>
          © 2026 ColdSync. Todos los derechos reservados.
        </p>
      </div>

      <Toaster />
    </div>
  )
}
