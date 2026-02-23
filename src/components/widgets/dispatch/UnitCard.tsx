import { Circle, TriangleAlert } from "lucide-react";
import { cn } from "../../../lib/utils";

/**
 * UNIT CARD COMPONENT - ColdSync
 * 
 * Reusable component that replicates the left column of the VehicleDropZone.
 * Displays unit information (vehicle) with its status, ID, trailer, driver, etc.
 * 
 * Features:
 * - Status indicator (dot)
 * - Unit and trailer ID
 * - HYB badge for hybrid trailers
 * - Warning icon for issues
 * - Driver name
 * - Hover effects and selection state
 * 
 * @example
 * ```tsx
 * <UnitCard
 *   unit={unitData}
 *   getStatusDotColor={(status, hasActiveTrip) => "fill-green-500"}
 *   isSelected={true}
 *   onClick={() => handleClick()}
 * />
 * ```
 */

export interface UnitCardUnit {
  id: string;
  unit: string; // Unit ID (e.g., TRK-1024)
  trailer?: string; // Trailer ID (e.g., RMQ-456)
  driver: string;
  status: string;
  hasActiveTrip?: boolean;
  isHybridTrailer?: boolean;
  hasIssue?: boolean;
}

export interface UnitCardProps {
  /** Unit data */
  unit: UnitCardUnit;
  /** Function to get status dot color */
  getStatusDotColor: (status: string, hasActiveTrip: boolean) => string;
  /** If the unit is selected */
  isSelected?: boolean;
  /** Callback on card click */
  onClick?: () => void;
  /** Card width (default: 260px like in VehicleDropZone) */
  width?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** If hover effect is shown (default: true) */
  showHover?: boolean;
}

/**
 * UnitCard Component
 * 
 * Exact replica of the left column of VehicleDropZone as a reusable component.
 */
export function UnitCard({
  unit,
  getStatusDotColor,
  isSelected = false,
  onClick,
  width = "260px",
  className,
  showHover = true,
}: UnitCardProps) {
  return (
    <div
      className={cn(
        "bg-white transition-all flex flex-col justify-center cursor-pointer relative",
        "border-l-4", // Always have a border to avoid layout shifts
        showHover && "group",
        showHover && !isSelected && "hover:bg-primary-light",
        isSelected ? "bg-blue-50 border-l-blue-500" : "border-l-transparent border-r border-r-gray-300",
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        padding: "0 12px",
        minHeight: "84px", // Same height as VehicleDropZone
      }}
      onClick={onClick}
    >
      {/* Hover indicator (replicates VehicleDropZone behavior) */}
      {showHover && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {/* Unit Info - Replica of VehicleDropZone */}
      <div className="flex items-center gap-1.5 mb-1">
        <Circle
          className={cn(
            "w-2 h-2 shrink-0",
            getStatusDotColor(unit.status, unit.hasActiveTrip || false)
          )}
        />
        <span className="font-semibold text-xs text-gray-900">
          {unit.unit}
        </span>
        {unit.trailer && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {unit.trailer}
            {/* HYB Badge for hybrid trailers - inline after ID */}
            {unit.isHybridTrailer && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-hibrido-bg text-hibrido-text">
                HYB
              </span>
            )}
          </span>
        )}
        {unit.hasIssue && (
          <TriangleAlert className="w-3 h-3 text-orange-500 ml-auto" />
        )}
      </div>
      <div className="text-xs text-gray-600 pl-3.5">{unit.driver}</div>
    </div>
  );
}

