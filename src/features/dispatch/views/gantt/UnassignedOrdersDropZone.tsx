import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'

interface UnassignedOrdersDropZoneProps {
  children: ReactNode
}

/** Drop zone for unassigned column; accepts trips dragged from Gantt to unassign. */
export function UnassignedOrdersDropZone({
  children,
}: UnassignedOrdersDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unassigned-orders-drop-zone',
    data: {
      type: 'UNASSIGN_ZONE'
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-0 flex flex-col ${isOver ? 'bg-blue-50/50 ring-2 ring-blue-300 ring-inset' : ''
        } transition-colors overflow-hidden`}
    >
      {children}
    </div>
  )
}

