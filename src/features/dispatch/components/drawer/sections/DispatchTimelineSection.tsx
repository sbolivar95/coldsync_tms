import { DispatchTimelineStop } from "../DispatchTimelineStop";
import type { DispatchOrderWithRelations } from "../../../hooks/useDispatchOrders";

interface DispatchTimelineSectionProps {
  order: DispatchOrderWithRelations;
}

export function DispatchTimelineSection({ order }: DispatchTimelineSectionProps) {
  // Build stops array from lane data
  let stops: { name: string, city?: string, address?: string, time?: string, type: 'pickup' | 'dropoff' }[] = [];
  
  if (order.lanes && order.lanes.lane_stops) {
    const sortedStops = [...order.lanes.lane_stops].sort((a, b) => a.stop_order - b.stop_order);
    stops = sortedStops.map((s, idx) => ({
      name: s.locations?.name || "",
      city: s.locations?.city,
      address: s.locations?.address,
      type: idx === 0 ? 'pickup' : 'dropoff',
      time: idx === 0 ? order.planned_start_at : (idx === sortedStops.length - 1 ? (order.planned_end_at || "") : "")
    }));
  }

  if (stops.length === 0) {
    return null;
  }

  return (
    <div className="pb-6">
      <div className="space-y-0">
        {stops.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === stops.length - 1;
          
          const location = { 
            name: stop.name, 
            city: stop.city, 
            address: stop.address || "" 
          };

          return (
            <DispatchTimelineStop
              key={`${stop.name}-${index}`}
              index={index}
              stopName={stop.name}
              location={location}
              isFirst={isFirst}
              isLast={isLast}
              type={stop.type}
              time={stop.time}
            />
          );
        })}
      </div>
    </div>
  );
}
