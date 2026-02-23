import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { ConfirmDialog } from '../../components/widgets/ConfirmDialog'

interface ProfileLogoutSectionProps {
  onLogout: () => Promise<void>
}

export function ProfileLogoutSection({ onLogout }: ProfileLogoutSectionProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  return (
    <>
      <div className='flex items-center justify-between'>
        <div>
          <h4 className='text-sm font-semibold text-gray-900'>Sesión</h4>
          <p className='text-xs text-gray-500 mt-1'>
            Cierra tu sesión de forma segura
          </p>
        </div>
        <button
          onClick={() => setShowLogoutDialog(true)}
          className='flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 hover:underline transition-colors'
        >
          <LogOut className='w-4 h-4' />
          Cerrar Sesión
        </button>
      </div>

      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title='¿Cerrar sesión?'
        description='Se cerrará tu sesión actual y deberás iniciar sesión nuevamente para acceder al sistema.'
        confirmText='Sí, cerrar sesión'
        cancelText='Cancelar'
        variant='destructive'
        onConfirm={onLogout}
      />
    </>
  )
}