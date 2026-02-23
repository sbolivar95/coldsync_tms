import { useDraggable } from '@dnd-kit/core'
import { TripCard, type UIStatus } from './TripCard'
import type { AssignedTripGantt } from '../../types'

interface DraggableTripCardProps {
  trip: AssignedTripGantt
  style: React.CSSProperties
  onClick: () => void
  tripPercent: number
  rtaPercent: number
}

export function DraggableTripCard({
  trip,
  style: positionStyle,
  onClick,
  tripPercent,
  rtaPercent,
}: DraggableTripCardProps) {
  // Check if trip is in SCHEDULED status - cannot be reassigned
  const isScheduled = trip.status === "scheduled" || trip.status === "SCHEDULED";

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: trip.orderId,
    data: {
      type: 'TRIP',
      tripId: trip.orderId,
      vehicleId: trip.vehicleId,
      trip
    },
    disabled: isScheduled,
  });

  // Per dnd-kit docs: when using DragOverlay, do NOT apply transform to the source.
  // The DragOverlay handles the visual movement. The source just hides itself.

  // Determine the status to display on the card
  const getDisplayStatus = (): UIStatus => {
    const status = (trip.status || 'assigned').toLowerCase();

    // If the status is "unassigned", show as "assigned" since it's in the Gantt
    if (status === 'unassigned' || status === 'sin-asignar') {
      return 'assigned';
    }

    // Handle at-destination -> dispatched for dispatch module
    if (status === 'at-destination') {
      return 'dispatched';
    }

    return status as UIStatus;
  };

  // Get the weight from trip data
  const getWeight = (): string => {
    const weight = trip.weight || '0';
    return `${weight} Tn`;
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="absolute top-[7px] h-[70px] flex shadow-sm rounded-md overflow-hidden transition-transform hover:scale-[1.02] z-10"
      style={{
        ...positionStyle,
        opacity: isDragging ? 0 : 1,
        cursor: isScheduled ? 'not-allowed' : 'grab',
      }}
    >
      {/* Trip Part */}
      <div
        style={{
          width: `${tripPercent}%`,
        }}
      >
        <TripCard
          configuration={trip.configuration || 'Standard'}
          route={trip.lane || 'No route'}
          weight={getWeight()}
          status={getDisplayStatus()}
          isHybrid={trip.isHybrid}
          className="h-full"
          onClick={onClick}
          assignmentError={trip.assignmentError}
        />
      </div>

      {/* Parte del RTA */}
      {trip.hasRTA && (
        <div
          className="rounded-r h-full bg-gray-100 flex items-center justify-center shrink-0 border-l border-white/50"
          style={{
            width: `${rtaPercent}%`,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          }}
          title="Return to Availability"
        >
          <span className="text-[8px] text-gray-400 font-bold -rotate-90">
            RTA
          </span>
        </div>
      )}
    </div>
  );
}
