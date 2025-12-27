import { PageHeader } from '../../../../layouts/PageHeader'
import { useState } from 'react'
import { AssignmentGeneralTab } from './tabs/AssignmentGeneralTab'

interface AssignmentDetailProps {
  assignment?: any | null
  onBack: () => void
  onSave?: () => void
  isCreating?: boolean
  carrierId?: number
}

export function AssignmentDetail({
  assignment,
  onBack,
  onSave,
  isCreating = false,
  carrierId,
}: AssignmentDetailProps) {
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
          <AssignmentGeneralTab
            assignment={assignment}
            isCreating={isCreating}
            onSave={handleSaveSuccess}
            onCancel={onBack}
            preSelectedCarrierId={carrierId}
          />
        </div>
      </div>
    </div>
  )
}
