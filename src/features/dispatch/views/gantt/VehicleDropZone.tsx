import { useMemo } from 'react'
import { useDroppable, useDndContext } from '@dnd-kit/core'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import type { FleetSetUnit, AssignedTripGantt } from '../../types'
import { canAssignOrderToFleet, type ValidationResult, type ValidationContext } from '../../utils/validation'
import type { DispatchOrderWithRelations } from '../../hooks/useDispatchOrders'
import { UNIT_COL_WIDTH } from '../../constants'

interface VehicleDropZoneProps {
  unit: FleetSetUnit
  children: React.ReactNode
  existingTrips?: AssignedTripGantt[]
  dayColWidth?: number
  startDate: Date // REQUIRED: To validate against past dates
}

export function VehicleDropZone({
  unit,
  children,
  existingTrips = [],
  dayColWidth = 160,
  startDate,
}: VehicleDropZoneProps) {

  const { active } = useDndContext();
  const { setNodeRef, isOver } = useDroppable({
    id: unit.id,
    data: {
      type: 'VEHICLE_ZONE',
      unitId: unit.id,
      unit
    }
  });

  // Logic to check if a specific time range overlaps with existing trips
  const checkOverlap = (startOffset: number, endOffset: number, ignoreTripId?: string): boolean => {
    return existingTrips.some(trip => {
      // Ignore the trip being dragged if it's the same (assigning to same vehicle scenario)
      if (ignoreTripId && trip.orderId === ignoreTripId) return false

      const tripStart = trip.dayOffset
      const tripEnd = trip.dayOffset + trip.duration + (trip.rtaDuration || 0)

      // Check intersection: [start, end) overlaps with [tripStart, tripEnd)
      return startOffset < tripEnd && endOffset > tripStart
    })
  }

  // OPTIMIZATION: Memoize validation results to avoid recalculating on every render
  const validationCache = useMemo(() => new Map<string, ValidationResult>(), [])

  // --- Validation Logic ---
  const { validation, draggedItemDetails } = useMemo(() => {
    if (!active || !isOver) return { validation: null, draggedItemDetails: null };

    const item = active.data.current;
    if (!item) return { validation: null, draggedItemDetails: null };

    let validationResult: ValidationResult | null = null;
    let itemDetails = null;

    // 1. Calculate Time Validity (Overlap)
    let startOffset = -1;
    let duration = 1;
    let rta = 0;
    let orderId = '';

    if (item.type === 'ORDER' && item.order) {
      if (item.order.planned_start_at && startDate) {
        const orderDate = new Date(item.order.planned_start_at);
        const chartStart = new Date(startDate);
        chartStart.setHours(0, 0, 0, 0);
        orderDate.setHours(0, 0, 0, 0);
        startOffset = Math.floor((orderDate.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24));
      }
      duration = (typeof item.order.duration === 'number' ? item.order.duration : 1) || 1;
      rta = (typeof item.order.rtaDuration === 'number' ? item.order.rtaDuration : 0) || 0;
      orderId = item.order.id;
    } else if (item.type === 'TRIP' && item.trip) {
      if (typeof item.trip.dayOffset === 'number') {
        startOffset = item.trip.dayOffset;
      }
      duration = (typeof item.trip.duration === 'number' ? item.trip.duration : 1) || 1;
      rta = (typeof item.trip.rtaDuration === 'number' ? item.trip.rtaDuration : 0) || 0;
      orderId = item.trip.id || item.tripId;
    }

    const endOffset = startOffset + duration + rta;
    const isOverlap = checkOverlap(startOffset, endOffset, orderId);
    const isValidTime = !isOverlap;

    itemDetails = { startOffset, endOffset, isValidTime };

    // 2. Calculate target date for validation context
    // In dnd-kit, calculating mouse-relative position during drag is possible via sensors,
    // but here we can simplify or use the rect if needed. 
    // For now, we'll use the item's own planned date as fallback if mouse delta is not easily available here.
    let targetDate: Date | undefined;
    if (item.type === 'ORDER' && item.order.planned_start_at) {
      targetDate = new Date(item.order.planned_start_at);
    }

    const context: ValidationContext = {
      targetDate,
      startDate,
      existingTrips
    };

    // 3. Technical Validation (Weight, Temp)
    const cacheKey = orderId ? `${orderId}-${unit.id}-${targetDate?.getTime() || 'unknown'}` : null;

    if (cacheKey && validationCache.has(cacheKey)) {
      validationResult = validationCache.get(cacheKey)!;
    } else {
      if (item.type === 'ORDER' && item.order) {
        validationResult = canAssignOrderToFleet(
          item.order as unknown as DispatchOrderWithRelations,
          unit,
          context
        );
      } else if (item.type === 'TRIP' && item.trip) {
        const tripData = item.trip as AssignedTripGantt;
        const syntheticOrder = {
          dispatch_order_items: tripData.compartments?.map((c) => ({
            product_id: c.product,
            quantity: parseFloat(c.weight) || 0,
            unit: 'TN',
            thermal_profile: null,
          })) || [{
            product_id: tripData.product,
            quantity: parseFloat(tripData.weight) || 0,
            unit: 'TN',
            thermal_profile: null,
          }]
        };

        if (syntheticOrder.dispatch_order_items.length > 0) {
          validationResult = canAssignOrderToFleet(
            syntheticOrder as unknown as DispatchOrderWithRelations,
            unit,
            context
          );
        } else {
          validationResult = { isValid: true, errors: [] };
        }
      }

      if (cacheKey && validationResult) {
        validationCache.set(cacheKey, validationResult);
      }
    }

    // 4. Merge Time Validation
    if (validationResult && !isValidTime) {
      validationResult = {
        isValid: false,
        errors: [...validationResult.errors, `Conflicto de horario: La orden se superpone con un viaje existente.`]
      };
    }

    return { validation: validationResult, draggedItemDetails: itemDetails };
  }, [active, isOver, unit, existingTrips, startDate, validationCache]);

  const isActive = isOver && validation?.isValid;
  const isBlocked = isOver && validation && !validation.isValid;
  const isValid = isActive && validation && validation.isValid;

  // UX: Different colors for blocked vs warning states
  const highlightColor = isBlocked ? 'bg-red-50/70' :
    isActive && !isValid ? 'bg-orange-50/70' :
      'bg-green-50/70'
  const borderColor = isBlocked ? 'border-red-500' :
    isActive && !isValid ? 'border-orange-500' :
      'border-green-500'

  return (
    <div
      ref={setNodeRef}
      className={`flex h-[84px] border-b border-gray-200 relative group transition-colors ${isOver ? highlightColor : isBlocked ? 'bg-gray-50/50' : ''
        }`}
      style={{
        cursor: isBlocked ? 'not-allowed' : undefined
      }}
    >
      {(isOver || isBlocked) && (
        <div className={`absolute inset-0 border-2 ${borderColor} border-dashed rounded-md pointer-events-none z-50`} />
      )}

      {/* UX: Show validation feedback for both valid and blocked states */}
      {(isOver || isBlocked) && validation && (
        <div
          className="absolute z-60 pointer-events-none shadow-lg rounded-lg border bg-white p-2 flex flex-col gap-1 min-w-[200px]"
          style={{
            left: `${UNIT_COL_WIDTH + 10}px`,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          {isBlocked ? (
            // BLOCKED STATE: Cannot drop
            <>
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1 border-b border-red-100 pb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>No se puede asignar</span>
              </div>
              {validation.errors.map((error, idx) => (
                <div key={idx} className="text-[10px] text-red-600 leading-tight">
                  • {error}
                </div>
              ))}
              <div className="mt-1 pt-1 border-t border-gray-100 text-[9px] text-gray-500 italic">
                Restricciones físicas/técnicas
              </div>
            </>
          ) : isValid ? (
            // VALID STATE: Can drop
            <div className="flex items-center gap-2 text-green-700 font-bold text-xs">
              <CheckCircle className="w-4 h-4" />
              <span>Requisitos cumplidos</span>
            </div>
          ) : null}
        </div>
      )}

      {isOver && draggedItemDetails && draggedItemDetails.isValidTime && draggedItemDetails.startOffset >= 0 && (
        <div
          className="absolute top-1 z-40 pointer-events-none"
          style={{
            left: `${draggedItemDetails.startOffset * (dayColWidth || 160)}px`,
            width: `${(draggedItemDetails.endOffset - draggedItemDetails.startOffset) * (dayColWidth || 160)}px`,
          }}
        >
          <div className="bg-green-500/20 border border-green-500 text-green-700 text-[9px] px-1 py-0.5 rounded text-center font-medium h-full flex items-center justify-center">
            Disponible aquí
          </div>
        </div>
      )}

      <div
        className="sticky left-0 z-30 bg-white border-r border-gray-200 transition-all cursor-pointer flex flex-col justify-center group-hover:bg-[#e5edff]"
        style={{ width: `${UNIT_COL_WIDTH}px`, padding: '0 12px' }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex flex-col gap-0.5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-900 leading-none">
              {unit.unit}
            </span>
            {unit.isHybridTrailer && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 leading-none">
                HYB
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
            {[unit.trailer, unit.driver].filter(Boolean).join(" · ")}
          </span>
        </div>
      </div>

      <div
        className="flex-1 relative group-hover:bg-[#f8faff] transition-all"
      >
        {children}
      </div>
    </div>
  )
}

