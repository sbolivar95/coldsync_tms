import { useState, useEffect } from "react";
import { Badge } from "../../../../components/ui/Badge";
import { CarrierOrder, ordersService } from "../../../../services/database/orders.service";
import { Loader2 } from "lucide-react";

interface OrderHistoryTabProps {
  order: CarrierOrder;
}

interface HistoryEvent {
  id: string;
  timestamp: string;
  status: string;
  statusLabel: string;
  actor: string;
  description: string;
  metadata?: {
    reason?: string;
    fleetChange?: {
      from: string;
      to: string;
    };
    location?: string;
  };
}

export function OrderHistoryTab({ order }: OrderHistoryTabProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!order.id) return;
      
      try {
        setIsLoading(true);
        const historyData = await ordersService.getOrderHistory(order.id);
        
        // Map backend history to UI events
        const mappedEvents: HistoryEvent[] = historyData
            .map((record: any) => {
                let statusLabel = record.outcome;
                let description = "";
                let actor = "Sistema";

                // Resolve Actor Name
                const getActorName = (user?: { first_name: string; last_name: string; email: string }) => {
                    if (!user) return null;
                    const fullName = `${user.first_name} ${user.last_name}`.trim();
                    return fullName !== "Unknown 'Unknown'" ? fullName : user.email; // Fallback to email if name is unknown default
                };

                const responderName = getActorName(record.responded_user);
                const assignerName = getActorName(record.assigned_user);

                if (record.outcome === 'ACCEPTED') {
                    statusLabel = 'Aceptada';
                    description = 'Orden aceptada por el transportista';
                    actor = responderName || record.carrier?.commercial_name || "Carrier";
                } else if (record.outcome === 'REJECTED') {
                    statusLabel = 'Rechazada';
                    description = 'Orden rechazada';
                    actor = responderName || record.carrier?.commercial_name || "Carrier";
                } else if (record.outcome === 'ASSIGNED') {
                    statusLabel = 'Asignada';
                    description = 'Asignada a flota';
                    actor = assignerName || "Planner";
                } else if (record.outcome === 'UNASSIGNED') {
                    statusLabel = 'Desasignada';
                    description = 'Orden desasignada';
                    actor = assignerName || "Planner";
                } else if (record.outcome === 'FAIL_AFTER_ACCEPT') { 
                    statusLabel = 'Falla';
                    description = 'Falla declarada post-aceptación';
                    actor = responderName || record.carrier?.commercial_name || "Carrier";
                } else if (record.outcome === 'PENDING') {
                     statusLabel = 'Pendiente';
                     description = 'Enviada para confirmación';
                     actor = assignerName || "Sistema";
                }

                // Handle fleet set changes metadata
                let fleetChange = undefined;
                if (record.previous_fleet_set || record.new_fleet_set) {
                    const getFleetName = (fs: any) => fs ? `${fs.vehicle?.unit_code || '-'} / ${fs.driver?.name || '-'}` : 'Sin Asignar';
                    fleetChange = {
                        from: getFleetName(record.previous_fleet_set),
                        to: getFleetName(record.new_fleet_set)
                    };
                }

                return {
                    id: record.id,
                    timestamp: record.responded_at || record.assigned_at,
                    status: record.outcome?.toLowerCase() || 'unknown',
                    statusLabel: statusLabel,
                    actor: actor,
                    description: description,
                    metadata: {
                        reason: record.outcome_reason,
                        fleetChange: fleetChange
                    }
                };
            })
            // Filter duplicates: remove sequential events with same status and actor
            .filter((event: HistoryEvent, index: number, self: HistoryEvent[]) => {
                if (index === 0) return true;
                const prev = self[index - 1];
                
                // If timestamp is extremely close (e.g. < 2 seconds) and status/actor match, it's likely a double-click/duplicate
                const timeDiff = new Date(event.timestamp).getTime() - new Date(prev.timestamp).getTime();
                const isDuplicate = 
                    event.status === prev.status && 
                    event.actor === prev.actor &&
                    Math.abs(timeDiff) < 2000; // 2 seconds window
                
                return !isDuplicate;
            });

        // Add "Created" event based on order creation time if available
        // (Optional: depends if we have created_at available in the fetched order object)
        
        setEvents(mappedEvents);
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [order.id]);

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
      );
  }

  if (events.length === 0) {
      return (
          <div className="flex justify-center items-center h-48 text-gray-400 text-sm">
              No hay historial disponible
          </div>
      );
  }

  // Sort events by timestamp ascending (Oldest first -> Newest last)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-0">
      {sortedEvents.map((event, index) => {
        console.log("History Event Item:", event);
        const isLast = index === sortedEvents.length - 1;
        const isFirst = index === 0;
        
        // Status badge colors
        const getBadgeStyles = (status: string) => {
          switch (status) {
            case "created":
              return "bg-gray-100 text-gray-700";
            case "assigned":
              return "bg-blue-100 text-blue-700";
            case "pending":
              return "bg-amber-100 text-amber-700";
            case "accepted":
              return "bg-green-100 text-green-700";
            case "scheduled":
              return "bg-blue-100 text-blue-700";
            case "rejected":
              return "bg-red-100 text-red-700";
            case "observed":
              return "bg-orange-100 text-orange-700";
            case "fail_after_accept":
              return "bg-red-100 text-red-700";
            case "dispatched":
              return "bg-emerald-100 text-emerald-700";
            default:
              return "bg-gray-100 text-gray-600";
          }
        };

        return (
          <div key={event.id} className="flex gap-4 h-32">
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
                <div className={`w-3 h-3 rounded-full ${
                  isFirst ? 'bg-gray-200' : 
                  isLast ? 'bg-primary' : 
                  'bg-gray-400'
                }`} />
              </div>
            </div>
            
            {/* Right column: content */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Top row: Status badge and timestamp */}
              <div className="flex items-center justify-between mb-1.5">
                <Badge 
                  variant="secondary"
                  className={`w-fit text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 hover:bg-opacity-100 ${getBadgeStyles(event.status)}`}
                >
                  {event.statusLabel}
                </Badge>
                <div className="text-[10px] text-gray-500">
                  <span>{new Date(event.timestamp).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
              
              {/* Description */}
              <div className="text-xs font-semibold text-gray-900 mb-1">
                {event.description}
              </div>
              
              {/* Actor */}
              <div className="text-xs text-gray-700 mb-1">
                {event.actor}
              </div>
              
              {/* Metadata (if exists) */}
              {event.metadata && (
                <div className="flex flex-col gap-1 text-[10px] text-gray-500">
                  {event.metadata.reason && (
                    <span>Motivo: {event.metadata.reason}</span>
                  )}
                  {event.metadata.fleetChange && (event.metadata.fleetChange.from !== 'Sin Asignar' || event.metadata.fleetChange.to !== 'Sin Asignar') && (
                    <span>
                      Flota: {event.metadata.fleetChange.from} → {event.metadata.fleetChange.to}
                    </span>
                  )}
                  {event.metadata.location && (
                    <span>Ubicación: {event.metadata.location}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
