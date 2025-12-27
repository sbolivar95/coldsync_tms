import { PageHeader } from '../../layouts/PageHeader'
import { useState } from 'react'
import { GeneralTab } from './tabs/GeneralTab'
import { FinanceTab } from './tabs/FinanceTab'
import type { Carrier } from '../../types/database.types'

interface CarrierDetailProps {
  carrier?: Carrier | null
  onBack: () => void
  onSave?: () => void
  isCreating?: boolean
}

export function CarrierDetail({
  carrier,
  onBack,
  onSave,
  isCreating = false,
}: CarrierDetailProps) {
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
          <GeneralTab
            carrier={carrier}
            isCreating={isCreating}
            onSave={handleSaveSuccess}
            onCancel={onBack}
          />
        )
      case 'finanzas':
        return (
          <FinanceTab
            carrier={carrier}
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
            id: 'finanzas',
            label: 'Finanzas y Legal',
            active: activeTab === 'finanzas',
            onClick: () => setActiveTab('finanzas'),
          },
        ]}
      />

      <div className='flex-1 p-6 overflow-auto bg-gray-50'>
        <div className='max-w-6xl mx-auto'>{renderTabContent()}</div>
      </div>
    </div>
  )
}
