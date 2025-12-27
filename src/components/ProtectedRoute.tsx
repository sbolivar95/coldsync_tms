import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOrgMember?: boolean
  requirePlatformAdmin?: boolean
}

export function ProtectedRoute({
  children,
  requireOrgMember = false,
  requirePlatformAdmin = false,
}: ProtectedRouteProps) {
  const { user, organizationMember, isPlatformAdmin, loading } = useAuth()

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent'></div>
          <p className='mt-2 text-sm text-gray-600'>Cargando...</p>
        </div>
      </div>
    )
  }

  // Not logged in - redirect to login
  if (!user) {
    return (
      <Navigate
        to='/login'
        replace
      />
    )
  }

  // Require platform admin but user is not
  if (requirePlatformAdmin && !isPlatformAdmin) {
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    )
  }

  // Require org member but user doesn't have one
  // EXCEPTION: Platform admins can access without org membership
  if (requireOrgMember && !organizationMember && !isPlatformAdmin) {
    // User exists but no org and not platform admin - need to join org
    return (
      <Navigate
        to='/no-organization'
        replace
      />
    )
  }

  // All checks passed - render the protected content
  return <>{children}</>
}
