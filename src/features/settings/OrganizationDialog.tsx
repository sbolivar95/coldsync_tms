import { EntityDialog } from '../../components/widgets/EntityDialog'
import { InputField } from '../../components/widgets/FormField'
import { useState, useEffect } from 'react'
import { Badge } from '../../components/ui/Badge'
import type {
  Organization,
  Country,
} from '../../services/organizations.service'

// Display type for the Settings table
export interface OrganizationDisplay {
  id: string
  comercialName: string
  legalName: string
  city: string
  countryId: number
  countryName: string
  status: string
  ownerEmail?: string
  ownerFullName?: string
}

interface OrganizationDialogProps {
  open: boolean
  onClose: () => void
  organization?: OrganizationDisplay
  countries: Country[]
  onSave: (organization: OrganizationDisplay) => void
}

export function OrganizationDialog({
  open,
  onClose,
  organization,
  countries,
  onSave,
}: OrganizationDialogProps) {
  // Form state
  const [comercialName, setComercialName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [city, setCity] = useState('')
  const [countryId, setCountryId] = useState<number | ''>('')

  // Owner fields (only for new organizations)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerFullName, setOwnerFullName] = useState('')

  const isEdit = !!organization

  // Reset form when organization changes or dialog opens
  useEffect(() => {
    if (open) {
      setComercialName(organization?.comercialName || '')
      setLegalName(organization?.legalName || '')
      setCity(organization?.city || '')
      setCountryId(organization?.countryId || '')
      setOwnerEmail(organization?.ownerEmail || '')
      setOwnerFullName(organization?.ownerFullName || '')
    }
  }, [open, organization])

  const handleSave = () => {
    const selectedCountry = countries.find((c) => c.id === countryId)

    onSave({
      id: organization?.id || '',
      comercialName,
      legalName,
      city,
      countryId: countryId as number,
      countryName: selectedCountry?.name || '',
      status: organization?.status || 'Activo',
      ownerEmail: isEdit ? undefined : ownerEmail,
      ownerFullName: isEdit ? undefined : ownerFullName,
    })
    onClose()
  }

  // Form validation
  const isFormValid = isEdit
    ? comercialName && legalName && countryId
    : comercialName && legalName && countryId && ownerEmail && ownerFullName

  return (
    <EntityDialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar Organización' : 'Nueva Organización'}
      description={
        isEdit
          ? 'Modifica los detalles de la organización existente'
          : 'Crea una nueva organización y su usuario propietario'
      }
      onSave={handleSave}
      disableSave={!isFormValid}
      isEdit={isEdit}
      maxWidth='max-w-lg'
    >
      {/* Información de la Organización */}
      <div>
        <h4 className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-3'>
          Información de la Organización
        </h4>
        <div className='space-y-4'>
          {/* Nombre Comercial */}
          <InputField
            label='Nombre Comercial'
            id='comercial-name'
            required
            value={comercialName}
            onChange={(e) => setComercialName(e.target.value)}
            placeholder='Ej: ColdChain Logistics'
          />

          {/* Nombre Legal */}
          <InputField
            label='Razón Social'
            id='legal-name'
            required
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder='Ej: ColdChain Logistics S.A.'
          />

          {/* Ciudad */}
          <InputField
            label='Ciudad'
            id='city'
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder='Ej: Santa Cruz'
          />

          {/* País */}
          <div>
            <label
              htmlFor='country'
              className='block text-xs font-medium text-gray-700 mb-1.5'
            >
              País <span className='text-red-500'>*</span>
            </label>
            <select
              id='country'
              value={countryId}
              onChange={(e) =>
                setCountryId(e.target.value ? Number(e.target.value) : '')
              }
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white'
            >
              <option value=''>Seleccionar país...</option>
              {countries.map((country) => (
                <option
                  key={country.id}
                  value={country.id}
                >
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Información del Propietario (solo para nuevas organizaciones) */}
      {!isEdit && (
        <div>
          <h4 className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-3'>
            Usuario Propietario
          </h4>
          <div className='space-y-4'>
            {/* Nombre Completo del Propietario */}
            <InputField
              label='Nombre Completo'
              id='owner-full-name'
              required
              value={ownerFullName}
              onChange={(e) => setOwnerFullName(e.target.value)}
              placeholder='Ej: Juan Pérez'
            />

            {/* Email del Propietario */}
            <InputField
              label='Correo Electrónico'
              id='owner-email'
              required
              type='email'
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder='Ej: juan.perez@empresa.com'
            />
          </div>

          {/* Información adicional */}
          <div className='mt-4 p-3 bg-blue-50 rounded-md'>
            <p className='text-xs text-blue-700'>
              <strong>Nota:</strong> Se creará una cuenta de usuario para el
              propietario con una contraseña temporal. El propietario recibirá
              las credenciales para acceder al sistema.
            </p>
          </div>
        </div>
      )}

      {/* Estado (solo para edición) */}
      {isEdit && organization && (
        <div>
          <h4 className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-3'>
            Estado
          </h4>
          <div className='flex items-center gap-2'>
            <Badge
              variant='default'
              className={
                organization.status === 'Activo'
                  ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs'
                  : organization.status === 'Suspendido'
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs'
              }
            >
              {organization.status}
            </Badge>
            <span className='text-xs text-gray-500'>
              (El estado se gestiona desde acciones de la tabla)
            </span>
          </div>
        </div>
      )}
    </EntityDialog>
  )
}
