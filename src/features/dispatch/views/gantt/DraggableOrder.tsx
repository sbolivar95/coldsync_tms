import { useDraggable } from '@dnd-kit/core'
import { TripCard, type UIStatus } from './TripCard'
import { Checkbox } from '../../../../components/ui/Checkbox'
import type { UnassignedOrderUI } from '../../types'

interface DraggableOrderProps {
  order: UnassignedOrderUI
  isSelected: boolean
  onSelect: (orderId: string, checked: boolean) => void
  onClick: () => void
  assignmentError?: string
}

export function DraggableOrder({
  order,
  isSelected,
  onSelect,
  onClick,
  assignmentError,
}: DraggableOrderProps) {
  // Check for cancelled status
  const substatus = order.substatus || 'UNASSIGNED';
  const isCancelled = substatus === 'CANCELED';

  // Check for scheduled status
  const isScheduled = substatus === 'PROGRAMMED' || substatus === 'ACCEPTED';


  // Cannot drag if cancelled or scheduled
  // Removed isPastDate from restriction so expired orders can still be dispatched/reassigned
  const canDrag = !isCancelled && !isScheduled;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
    data: {
      type: 'ORDER',
      orderId: order.id,
      order
    },
    disabled: !canDrag,
  });

  // Per dnd-kit docs: when using DragOverlay, do NOT apply transform to the source.
  // The DragOverlay handles the visual movement. The source just hides itself.

  // Determine order status
  const getOrderStatus = (): UIStatus => {
    return substatus.toLowerCase() as UIStatus;
  };

  // Get the route
  const getRoute = (): string => {
    const route = order.lane || order.route;
    if (typeof route === 'string' && route) return route;
    return 'No route';
  };

  // Get weight
  const getWeight = (): string => {
    const weight = order.weight || 0;
    return `${weight} Tn`;
  };

  return (
    <div
      className={`flex items-center gap-2 px-1 ${!canDrag ? 'pointer-events-none' : ''}`}
      style={{
        opacity: isDragging ? 0 : 1,
      }}
    >
      {/* Checkbox outside the card - ONLY show for valid orders */}
      {canDrag && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(order.id, checked === true)}
          className="ml-0.5"
        />
      )}
      {/* Spacer for non-draggable orders */}
      {!canDrag && <div className="w-4 ml-0.5" />}

      {/* Draggable card */}
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="flex-1"
        style={{
          cursor: !canDrag ? 'not-allowed' : 'grab',
        }}
      >
        <TripCard
          configuration={order.configuration || 'Standard'}
          route={getRoute()}
          weight={getWeight()}
          status={getOrderStatus()}
          isHybrid={order.isHybrid}
          onClick={canDrag ? onClick : undefined}
          assignmentError={assignmentError}
          cost={order.cost as number}
        />
      </div>
    </div>
  );
}
