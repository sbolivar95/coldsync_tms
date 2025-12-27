import { PageHeader } from '../../layouts/PageHeader'
import { useState } from 'react'
import { GeneralTab } from './tabs/GeneralTab'
import type { Location, LocationType } from '../../types/database.types'

type LocationWithRels = Location & {
  location_types?: Pick<LocationType, 'id' | 'name'> | null
  countries?: { id: number; name: string; iso_code: string } | null
}

interface LocationDetailProps {
  location?: LocationWithRels | null
  locationTypes: LocationType[]
  saving?: boolean
  onSave: (values: {
    id?: number | null
    name: string
    code: string
    type_location_id?: number | null
    address: string
    city: string
    country_id: number
    num_docks: number
    is_active: boolean
    geofence_type: 'circular' | 'polygon'
    geofence_data: any
  }) => void
  onBack: () => void
  onCreateLocationType: (
    name: string
  ) => Promise<{ id: number; name: string } | null>
}

export function LocationDetail({
  location,
  locationTypes,
  saving,
  onSave,
  onBack,
  onCreateLocationType,
}: LocationDetailProps) {
  const [activeTab, setActiveTab] = useState('general')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralTab
            ubicacion={location || undefined}
            locationTypes={locationTypes}
            saving={saving}
            onSave={onSave}
            onCancel={onBack}
            onCreateLocationType={onCreateLocationType}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className='flex flex-col h-full'>
      <PageHeader
        tabs={[
          {
            id: 'general',
            label: 'General',
            active: activeTab === 'general',
            onClick: () => setActiveTab('general'),
          },
        ]}
      />

      <div className='flex-1 p-6 overflow-auto bg-gray-50'>
        <div className='max-w-6xl mx-auto'>{renderTabContent()}</div>
      </div>
    </div>
  )
}
