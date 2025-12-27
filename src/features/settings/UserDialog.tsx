import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/Dialog'
import { DialogActions } from '../../components/widgets/DialogActions'
import { InputField } from '../../components/widgets/FormField'
import { Badge } from '../../components/ui/Badge'
import { Copy, Check, Link, UserPlus } from 'lucide-react'
import {
  type OrganizationMemberDisplay,
  type UserRole,
  ROLE_OPTIONS,
  getRoleLabel,
} from '../../services/users.service'

type CreateMode = 'provision' | 'invite'

interface UserDialogProps {
  open: boolean
  onClose: () => void
  user?: OrganizationMemberDisplay
  isPlatformAdmin: boolean
  onSave: (user: OrganizationMemberDisplay) => void
  onCreateInviteCode: (
    role: UserRole,
    expiresInMinutes: number
  ) => Promise<string>
}

export function UserDialog({
  open,
  onClose,
  user,
  isPlatformAdmin,
  onSave,
  onCreateInviteCode,
}: UserDialogProps) {
  const isEdit = !!user

  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('STAFF')

  // Create mode state (only for new users)
  const [createMode, setCreateMode] = useState<CreateMode>(
    isPlatformAdmin ? 'provision' : 'invite'
  )

  // Invite code state
  const [expiresInMinutes, setExpiresInMinutes] = useState(60)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Reset form when dialog opens or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        setFullName(user.fullName)
        setEmail(user.email)
        setPhone(user.phone)
        setRole(user.role)
      } else {
        setFullName('')
        setEmail('')
        setPhone('')
        setRole('STAFF')
        setCreateMode(isPlatformAdmin ? 'provision' : 'invite')
        setGeneratedCode(null)
        setCopied(false)
      }
    }
  }, [open, user, isPlatformAdmin])

  const handleSave = () => {
    if (createMode === 'invite' && !isEdit) {
      // For invite mode, we don't save a user directly
      // The invite code is already generated
      onClose()
      return
    }

    onSave({
      id: user?.id || '',
      orgId: user?.orgId || '',
      userId: user?.userId || '',
      fullName,
      email,
      phone,
      role,
      status: 'Activo',
      createdAt: user?.createdAt || new Date().toISOString(),
    })
  }

  const handleGenerateCode = async () => {
    setIsGenerating(true)
    try {
      const code = await onCreateInviteCode(role, expiresInMinutes)
      setGeneratedCode(code)
    } catch (err) {
      console.error('Error generating invite code:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyCode = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isFormValid = isEdit
    ? fullName && role
    : createMode === 'provision'
    ? fullName && email && role
    : role // For invite mode, only role is required

  const expirationOptions = [
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 1440, label: '24 horas' },
    { value: 10080, label: '7 días' },
  ]

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
    >
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-base font-semibold'>
            {isEdit ? 'Editar Usuario' : 'Agregar Usuario'}
          </DialogTitle>
          <DialogDescription className='text-xs text-gray-500'>
            {isEdit
              ? 'Actualiza la información del usuario en el sistema.'
              : 'Agrega un nuevo usuario a la organización.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5 py-4'>
          {/* Mode selector (only for new users) */}
          {!isEdit && (
            <div>
              <label className='block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3'>
                Método de Creación
              </label>
              <div className='grid grid-cols-2 gap-3'>
                {/* Invite Code Option - Available to all */}
                <button
                  type='button'
                  onClick={() => {
                    setCreateMode('invite')
                    setGeneratedCode(null)
                  }}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
                    ${
                      createMode === 'invite'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <Link
                    className={`w-6 h-6 ${
                      createMode === 'invite'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      createMode === 'invite'
                        ? 'text-blue-700'
                        : 'text-gray-600'
                    }`}
                  >
                    Código de Invitación
                  </span>
                  <span className='text-xs text-gray-500 text-center'>
                    Genera un código para que el usuario se registre
                  </span>
                </button>

                {/* Provision Option - Only for platform admins */}
                {isPlatformAdmin && (
                  <button
                    type='button'
                    onClick={() => {
                      setCreateMode('provision')
                      setGeneratedCode(null)
                    }}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
                      ${
                        createMode === 'provision'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <UserPlus
                      className={`w-6 h-6 ${
                        createMode === 'provision'
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        createMode === 'provision'
                          ? 'text-blue-700'
                          : 'text-gray-600'
                      }`}
                    >
                      Crear Usuario
                    </span>
                    <span className='text-xs text-gray-500 text-center'>
                      Crea el usuario directamente con contraseña temporal
                    </span>
                  </button>
                )}

                {/* If not platform admin, show disabled provision option */}
                {!isPlatformAdmin && (
                  <div className='flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-100 bg-gray-50 opacity-50'>
                    <UserPlus className='w-6 h-6 text-gray-300' />
                    <span className='text-sm font-medium text-gray-400'>
                      Crear Usuario
                    </span>
                    <span className='text-xs text-gray-400 text-center'>
                      Solo disponible para administradores de plataforma
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Provision Mode Fields */}
          {(isEdit || createMode === 'provision') && (
            <>
              {/* Full Name */}
              <InputField
                label='Nombre Completo'
                id='full-name'
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder='Ej: Juan Pérez'
              />

              {/* Email (only for new users in provision mode) */}
              {!isEdit && (
                <InputField
                  label='Correo Electrónico'
                  id='email'
                  required
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='Ej: juan.perez@empresa.com'
                />
              )}

              {/* Email (read-only for edit mode) */}
              {isEdit && (
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                    Correo Electrónico
                  </label>
                  <div className='px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-600'>
                    {email}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    El correo no se puede modificar
                  </p>
                </div>
              )}

              {/* Phone */}
              <InputField
                label='Teléfono'
                id='phone'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='Ej: +591 70000000'
              />
            </>
          )}

          {/* Role Selector (always shown) */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>
              Rol <span className='text-red-500'>*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white'
            >
              {ROLE_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Invite Code Mode - Expiration & Generate */}
          {!isEdit && createMode === 'invite' && (
            <>
              {/* Expiration Time */}
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                  Tiempo de Expiración
                </label>
                <select
                  value={expiresInMinutes}
                  onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white'
                >
                  {expirationOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              {!generatedCode && (
                <button
                  type='button'
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                  className='w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                >
                  {isGenerating ? (
                    <>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Link className='w-4 h-4' />
                      Generar Código de Invitación
                    </>
                  )}
                </button>
              )}

              {/* Generated Code Display */}
              {generatedCode && (
                <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-xs font-medium text-green-700 uppercase tracking-wider'>
                      Código Generado
                    </span>
                    <Badge
                      variant='secondary'
                      className='bg-green-100 text-green-700 text-xs'
                    >
                      {getRoleLabel(role)}
                    </Badge>
                  </div>
                  <div className='flex items-center gap-2'>
                    <code className='flex-1 px-3 py-2 bg-white border border-green-300 rounded-md text-lg font-mono font-bold text-green-800 tracking-widest'>
                      {generatedCode}
                    </code>
                    <button
                      type='button'
                      onClick={handleCopyCode}
                      className='p-2 bg-white border border-green-300 rounded-md hover:bg-green-50 transition-colors'
                      title='Copiar código'
                    >
                      {copied ? (
                        <Check className='w-5 h-5 text-green-600' />
                      ) : (
                        <Copy className='w-5 h-5 text-green-600' />
                      )}
                    </button>
                  </div>
                  <p className='text-xs text-green-600 mt-2'>
                    Este código expira en{' '}
                    {
                      expirationOptions.find(
                        (o) => o.value === expiresInMinutes
                      )?.label
                    }
                    . Compártelo con el usuario para que pueda unirse a la
                    organización.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Info Note for Provision Mode */}
          {!isEdit && createMode === 'provision' && (
            <div className='p-3 bg-blue-50 border border-blue-200 rounded-md'>
              <p className='text-xs text-blue-700'>
                <strong>Nota:</strong> Se creará una cuenta de usuario con una
                contraseña temporal. Deberás compartir las credenciales de
                acceso con el usuario de forma segura.
              </p>
            </div>
          )}
        </div>

        <DialogActions
          onCancel={onClose}
          onSave={handleSave}
          saveLabel={
            isEdit
              ? 'Guardar Cambios'
              : createMode === 'invite'
              ? generatedCode
                ? 'Cerrar'
                : 'Cancelar'
              : 'Crear Usuario'
          }
          cancelLabel={
            createMode === 'invite' && generatedCode ? undefined : 'Cancelar'
          }
          disableSave={
            createMode === 'invite'
              ? false // Always allow closing for invite mode
              : !isFormValid
          }
        />
      </DialogContent>
    </Dialog>
  )
}
