import { PageHeader } from '../../../../layouts/PageHeader'
import { useState } from 'react'
import { TrailerGeneralTab } from './tabs/TrailerGeneralTab'
import { TrailerReeferTab } from './tabs/TrailerReeferTab'

interface TrailerDetailProps {
  trailer?: any | null
  onBack: () => void
  onSave?: () => void
  isCreating?: boolean
}

export function TrailerDetail({
  trailer,
  onBack,
  onSave,
  isCreating = false,
}: TrailerDetailProps) {
  const [activeTab, setActiveTab] = useState('general')

  const handleSaveSuccess = () => {
    if (onSave) {
      onSave()
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <TrailerGeneralTab
            trailer={trailer}
            isCreating={isCreating}
            onSave={handleSaveSuccess}
            onCancel={onBack}
          />
        )
      case 'reefer':
        return (
          <TrailerReeferTab
            trailer={trailer}
            onSave={handleSaveSuccess}
            onCancel={onBack}
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
          {
            id: 'reefer',
            label: 'Especificaciones Reefer',
            active: activeTab === 'reefer',
            onClick: () => setActiveTab('reefer'),
            disabled: isCreating, // Can't edit reefer specs until trailer is created
          },
        ]}
      />

      <div className='flex-1 p-6 overflow-auto bg-gray-50'>
        <div className='max-w-6xl mx-auto'>{renderTabContent()}</div>
      </div>
    </div>
  )
}
