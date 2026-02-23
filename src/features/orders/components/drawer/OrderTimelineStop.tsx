import { Badge } from "../../../../components/ui/Badge";
import type { Location } from "../../../../lib/mockData";

interface OrderTimelineStopProps {
  index: number;
  stopName: string;
  location?: Partial<Location>; // Make Location partial to accept simpler objects
  isFirst: boolean;
  isLast: boolean;
  type?: 'pickup' | 'dropoff';
  time?: string;
}

export function OrderTimelineStop({ 
  index, 
  stopName, 
  location, 
  isFirst, 
  isLast,
  type,
  time
}: OrderTimelineStopProps) {
  // Stop types according to lanes.md
  let stopLabel = 'PARADA'; 
  if (type === 'pickup' || isFirst) stopLabel = 'CARGA';
  if (type === 'dropoff' || isLast) stopLabel = 'DESCARGA';
  
  // Format time if available
  let formattedTime = "";
  if (time && time !== "-") {
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
          // Format: 08 Feb • 14:30
          const day = date.getDate().toString().padStart(2, '0');
          const month = date.toLocaleDateString("es-US", { month: "short" });
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          formattedTime = `${day} ${month} • ${hours}:${minutes}`;
      }
  }

  // Distinctive styles for start and end
  const badgeStyles = stopLabel === 'CARGA' || stopLabel === 'DESCARGA'
    ? "w-fit text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-primary hover:bg-blue-100"
    : "w-fit text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 hover:bg-gray-100";

  return (
    <div className="flex gap-4 h-32">
      {/* Left column: circle + line */}
      <div className="relative w-7 shrink-0">
        {/* Connecting line - behind circle, centered exactly */}
        {!isLast && (
          <div 
            className="absolute top-1/2 w-px h-32 bg-gray-200 -z-10" 
            style={{ left: '13.5px' }}
          />
        )}
        
        {/* Circle centered vertically - above the line */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full border-2 border-gray-200 bg-white z-10">
          <span className="text-xs font-semibold text-gray-700">{index + 1}</span>
        </div>
      </div>
      
      {/* Right column: content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Top row: Badge and Date/Time */}
        <div className="flex items-center justify-between mb-1.5">
          <Badge 
            variant="secondary"
            className={badgeStyles}
          >
            {stopLabel}
          </Badge>
          <div className="text-[10px] text-gray-500">
            <span>{formattedTime}</span>
          </div>
        </div>
        
        {/* Name in bold */}
        <div className="text-xs font-semibold text-gray-900 mb-1">
          {location?.name || stopName}
        </div>
        
        {/* Address */}
        {location?.address && (
          <div className="text-xs text-gray-700 mb-1">
            {location.address}
          </div>
        )}
        
        {/* City and type */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          {location?.city && <span>{location.city}</span>}
          {location?.city && location?.type && <span>•</span>}
          {location?.type && <span>{location.type}</span>}
        </div>
      </div>
    </div>
  );
}
