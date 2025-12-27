import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrimaryButton } from '../components/widgets/PrimaryButton'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Snowflake } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      // Redirect will be handled by the auth provider and route protection
      navigate('/auth/redirect')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100'>
      <div className='w-full max-w-md'>
        <div className='bg-white rounded-lg shadow-xl p-8'>
          {/* Logo y Título */}
          <div className='text-center mb-8'>
            <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4'>
              <Snowflake className='w-8 h-8 text-white' />
            </div>
            <h1 className='text-2xl font-medium text-gray-900 mb-2'>
              Cold Sync
            </h1>
            <p className='text-sm text-gray-600'>Gestión de Cadena de Frío</p>
          </div>

          {/* Formulario */}
          <form
            onSubmit={handleSubmit}
            className='space-y-6'
          >
            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='text-xs text-gray-600'
              >
                Correo Electrónico
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='usuario@ejemplo.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='password'
                className='text-xs text-gray-600'
              >
                Contraseña
              </Label>
              <Input
                id='password'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className='flex items-center justify-between'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  className='rounded border-gray-300'
                />
                <span className='text-sm text-gray-600'>Recordarme</span>
              </label>
              <a
                href='#'
                className='text-sm text-blue-600 hover:text-blue-700'
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <PrimaryButton
              type='submit'
              className='w-full'
              disabled={loading}
            >
              Iniciar Sesión
            </PrimaryButton>
          </form>

          {/* Footer */}
          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              ¿No tienes una cuenta?{' '}
              <a
                href='#'
                className='text-blue-600 hover:text-blue-700'
              >
                Contáctanos
              </a>
            </p>
          </div>
        </div>

        <p className='text-center mt-6 text-sm text-gray-600'>
          © 2025 Cold Sync. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
