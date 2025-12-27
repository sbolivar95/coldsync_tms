import { PageHeader } from '../../../../layouts/PageHeader'
import { useState } from 'react'
import { HardwareGeneralTab } from './tabs/HardwareGeneralTab'

interface HardwareDetailProps {
  hardware?: any | null
  onBack: () => void
  onSave?: () => void
  isCreating?: boolean
}

export function HardwareDetail({
  hardware,
  onBack,
  onSave,
  isCreating = false,
}: HardwareDetailProps) {
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
          <HardwareGeneralTab
            hardware={hardware}
            isCreating={isCreating}
            onSave={handleSaveSuccess}
            onCancel={onBack}
          />
        </div>
      </div>
    </div>
  )
}
