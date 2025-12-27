import { PageHeader } from '../../../../layouts/PageHeader'
import { useState } from 'react'
import { DriverGeneralTab } from './tabs/DriverGeneralTab'
import type { Driver } from '../../../../types/database.types'

interface DriverDetailProps {
  driver?: Driver | null
  onBack: () => void
  onSave?: () => void
  isCreating?: boolean
  carrierId?: number
}

export function DriverDetail({
  driver,
  onBack,
  onSave,
  isCreating = false,
  carrierId,
}: DriverDetailProps) {
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
          <DriverGeneralTab
            driver={driver}
            isCreating={isCreating}
            onSave={handleSaveSuccess}
            onCancel={onBack}
            carrierId={carrierId}
          />
        </div>
      </div>
    </div>
  )
}
