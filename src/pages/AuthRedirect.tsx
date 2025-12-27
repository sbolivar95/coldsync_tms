import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { Snowflake } from 'lucide-react'

export function AuthRedirect() {
  const navigate = useNavigate()
  const { user, organizationMember, isPlatformAdmin, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    // Determine where to redirect based on user status
    if (!user) {
      // No user session - go to login
      navigate('/login', { replace: true })
      return
    }

    // Platform admins always get full access, even without org
    if (isPlatformAdmin) {
      navigate('/dashboard', { replace: true })
      return
    }

    // Has organization membership - go to dashboard
    if (organizationMember) {
      navigate('/dashboard', { replace: true })
      return
    }

    // User exists but no org and not platform admin - need to join org
    navigate('/no-organization', { replace: true })
  }, [user, organizationMember, isPlatformAdmin, loading, navigate])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100'>
      <div className='text-center'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4'>
          <Snowflake className='w-8 h-8 text-white animate-spin' />
        </div>
        <h2 className='text-lg font-medium text-gray-900 mb-2'>
          Redirigiendo...
        </h2>
        <p className='text-sm text-gray-600'>Por favor espera un momento</p>
      </div>
    </div>
  )
}
