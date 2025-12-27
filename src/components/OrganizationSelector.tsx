import { useState, useEffect } from 'react'
import { Building2, ChevronDown, X, Check } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  organizationsService,
  type Organization,
} from '@/services/organizations.service'

interface OrganizationSelectorProps {
  variant?: 'header' | 'inline'
  onSelect?: (orgId: string | null) => void
}

export function OrganizationSelector({
  variant = 'header',
  onSelect,
}: OrganizationSelectorProps) {
  const { organizationMember, isPlatformAdmin, refreshUserData } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Only show for platform admins
  if (!isPlatformAdmin) {
    return null
  }

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrgs = async () => {
      setLoading(true)
      try {
        const data = await organizationsService.getAll()
        setOrganizations(data)
      } catch (err) {
        console.error('Error fetching organizations:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrgs()
  }, [])

  const selectedOrg = organizationMember?.organization

  const handleSelectOrg = async (orgId: string) => {
    // Save to localStorage
    localStorage.setItem('platform_admin_selected_org', orgId)

    // Refresh user data to pick up the new org
    await refreshUserData()

    setIsOpen(false)
    onSelect?.(orgId)
  }

  const handleClearSelection = async () => {
    // Remove from localStorage
    localStorage.removeItem('platform_admin_selected_org')

    // Refresh user data
    await refreshUserData()

    setIsOpen(false)
    onSelect?.(null)
  }

  // Filter organizations by search term
  const filteredOrgs = organizations.filter(
    (org) =>
      org.comercial_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.legal_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (variant === 'header') {
    return (
      <div className='relative'>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-colors border
            ${
              selectedOrg
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }
          `}
        >
          <Building2 className='w-4 h-4' />
          <span className='max-w-[200px] truncate'>
            {selectedOrg ? selectedOrg.comercial_name : 'Seleccionar Org'}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className='fixed inset-0 z-40'
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className='absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50'>
              {/* Header */}
              <div className='p-3 border-b border-gray-100'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Organización Activa
                  </span>
                  {selectedOrg && (
                    <button
                      onClick={handleClearSelection}
                      className='text-xs text-red-600 hover:text-red-700 flex items-center gap-1'
                    >
                      <X className='w-3 h-3' />
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Search */}
                <input
                  type='text'
                  placeholder='Buscar organización...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500'
                />
              </div>

              {/* Organization List */}
              <div className='max-h-64 overflow-y-auto'>
                {loading ? (
                  <div className='p-4 text-center text-sm text-gray-500'>
                    Cargando...
                  </div>
                ) : filteredOrgs.length === 0 ? (
                  <div className='p-4 text-center text-sm text-gray-500'>
                    No se encontraron organizaciones
                  </div>
                ) : (
                  filteredOrgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleSelectOrg(org.id)}
                      className={`
                        w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between
                        ${selectedOrg?.id === org.id ? 'bg-blue-50' : ''}
                      `}
                    >
                      <div className='flex-1 min-w-0'>
                        <div className='text-sm font-medium text-gray-900 truncate'>
                          {org.comercial_name}
                        </div>
                        <div className='text-xs text-gray-500 truncate'>
                          {org.legal_name}
                        </div>
                      </div>
                      {selectedOrg?.id === org.id && (
                        <Check className='w-4 h-4 text-blue-600 flex-shrink-0 ml-2' />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer with current selection info */}
              {selectedOrg && (
                <div className='p-3 border-t border-gray-100 bg-gray-50'>
                  <p className='text-xs text-gray-500'>
                    Gestionando como{' '}
                    <span className='font-medium text-gray-700'>Admin</span> de{' '}
                    {selectedOrg.comercial_name}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  // Inline variant for Settings page
  return (
    <div className='bg-white border border-gray-200 rounded-lg p-4'>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <Building2 className='w-5 h-5 text-gray-400' />
          <h3 className='text-sm font-medium text-gray-900'>
            Organización Seleccionada
          </h3>
        </div>
        {selectedOrg && (
          <button
            onClick={handleClearSelection}
            className='text-xs text-red-600 hover:text-red-700 flex items-center gap-1'
          >
            <X className='w-3 h-3' />
            Limpiar selección
          </button>
        )}
      </div>

      {selectedOrg ? (
        <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100'>
          <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
            <Building2 className='w-5 h-5 text-blue-600' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-gray-900 truncate'>
              {selectedOrg.comercial_name}
            </p>
            <p className='text-xs text-gray-500 truncate'>
              {selectedOrg.legal_name}
            </p>
          </div>
        </div>
      ) : (
        <div className='text-center py-4'>
          <p className='text-sm text-gray-500 mb-3'>
            No hay organización seleccionada. Selecciona una para gestionar sus
            datos.
          </p>
        </div>
      )}

      {/* Organization Selector Dropdown */}
      <div className='mt-3'>
        <label className='block text-xs font-medium text-gray-700 mb-1.5'>
          Cambiar organización
        </label>
        <select
          value={selectedOrg?.id || ''}
          onChange={(e) => {
            if (e.target.value) {
              handleSelectOrg(e.target.value)
            } else {
              handleClearSelection()
            }
          }}
          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white'
        >
          <option value=''>-- Vista global (sin organización) --</option>
          {organizations.map((org) => (
            <option
              key={org.id}
              value={org.id}
            >
              {org.comercial_name} - {org.legal_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
