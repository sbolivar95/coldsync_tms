import { PageHeader } from '../../../../layouts/PageHeader'
import { useState } from 'react'
import { VehicleGeneralTab } from './tabs/VehicleGeneralTab'
import type { Vehicle } from '../../../../types/database.types'

interface VehicleDetailProps {
  vehicle?: Vehicle | null
  onBack: () => void
  onSave?: () => void
  isCreating?: boolean
}

export function VehicleDetail({
  vehicle,
  onBack,
  onSave,
  isCreating = false,
}: VehicleDetailProps) {
  const [activeTab, setActiveTab] = useState('general')

  const handleSaveSuccess = () => {
    if (onSave) {
      onSave()
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
        <div className='max-w-6xl mx-auto'>
          <VehicleGeneralTab
            vehicle={vehicle}
            isCreating={isCreating}
            onSave={handleSaveSuccess}
            onCancel={onBack}
          />
        </div>
      </div>
    </div>
  )
}
