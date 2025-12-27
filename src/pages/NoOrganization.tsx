import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Snowflake, Building2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'

export function NoOrganization() {
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { refreshUserData } = useAuth()

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Call the join_org_with_code function
      const { data, error: joinError } = await supabase.rpc(
        'join_org_with_code',
        { p_code: joinCode }
      )

      if (joinError) throw joinError

      // Refresh user data to get the new organization membership
      await refreshUserData()

      // Navigate to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error joining organization:', err)
      setError(err.message || 'Código inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100'>
      <div className='w-full max-w-md'>
        <div className='bg-white rounded-lg shadow-xl p-8'>
          {/* Logo */}
          <div className='text-center mb-8'>
            <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4'>
              <Snowflake className='w-8 h-8 text-white' />
            </div>
            <h1 className='text-2xl font-medium text-gray-900 mb-2'>
              ColdSync TMS
            </h1>
          </div>

          {/* No Organization Message */}
          <div className='text-center mb-6'>
            <div className='inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3'>
              <Building2 className='w-6 h-6 text-gray-600' />
            </div>
            <h2 className='text-lg font-medium text-gray-900 mb-2'>
              No estás asociado a ninguna organización
            </h2>
            <p className='text-sm text-gray-600'>
              Para acceder al sistema, necesitas unirte a una organización
              usando un código de invitación.
            </p>
          </div>

          {/* Join Code Form */}
          <form
            onSubmit={handleJoinOrg}
            className='space-y-4'
          >
            <div className='space-y-2'>
              <Label
                htmlFor='joinCode'
                className='text-xs text-gray-600'
              >
                Código de Invitación
              </Label>
              <Input
                id='joinCode'
                type='text'
                placeholder='Ingresa tu código'
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
                className='text-center text-lg tracking-wider font-mono'
              />
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 rounded-md p-3'>
                <p className='text-xs text-red-600'>{error}</p>
              </div>
            )}

            <Button
              type='submit'
              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
              disabled={loading || !joinCode}
            >
              {loading ? 'Verificando...' : 'Unirse a Organización'}
            </Button>
          </form>

          {/* Help Text */}
          <div className='mt-6 pt-6 border-t border-gray-200'>
            <p className='text-xs text-gray-500 text-center mb-4'>
              Si no tienes un código de invitación, contacta al administrador de
              tu organización.
            </p>
            <Button
              variant='outline'
              className='w-full'
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
