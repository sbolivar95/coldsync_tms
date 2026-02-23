import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
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
} from '../components/ui/Form'
import { useAppStore } from '../stores/useAppStore'
import { authService } from '../services/database/auth.service'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const setAuthSession = useAppStore((state) => state.setAuthSession)
  const { isAuthenticated, isInitializing } = useAuth()

  // ✅ IMPORTANT: All hooks must be called before any conditional returns
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-primary-light to-white'>
        <div className='text-center'>
          <div className='mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto'></div>
          <p className='text-sm text-gray-600'>Cargando...</p>
        </div>
      </div>
    )
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    )
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const session = await authService.login({
        email: data.email,
        password: data.password,
      })

      setAuthSession(session)

      // Check if user needs to change password
      if (session.needsPasswordChange) {
        toast.info('Debes cambiar tu contraseña antes de continuar')
        navigate('/set-password')
      } else {
        toast.success('Sesión iniciada correctamente')
        navigate('/dashboard')
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al iniciar sesión'
      toast.error(errorMessage)
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

          {/* Formulario */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6'
            >
              <FormField
                control={form.control}
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

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs text-gray-600'>
                      Contraseña
                    </FormLabel>
                    <div className='relative'>
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder='••••••••'
                          className='pr-10'
                          {...field}
                        />
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex items-center justify-between'>
                <label htmlFor="remember-me" className='flex items-center gap-2 cursor-pointer'>
                  <input
                    id="remember-me"
                    name="remember-me"
                    type='checkbox'
                    autoComplete="off"
                    className='rounded border-gray-300'
                  />
                  <span className='text-sm text-gray-600'>Recordarme</span>
                </label>
                <Link
                  to='/reset-password'
                  className='text-sm text-blue-600 hover:text-blue-700'
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <PrimaryButton
                type='submit'
                className='w-full'
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </PrimaryButton>
            </form>
          </Form>

          {/* Footer */}
          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              ¿No tienes una cuenta?{' '}
              <a
                href='#'
                className='text-primary hover:text-primary-focus'
              >
                Contáctanos
              </a>
            </p>
          </div>

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
