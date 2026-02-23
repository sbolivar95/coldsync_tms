import { useState, useEffect, useRef } from "react";
import { Badge } from "../../../../components/ui/Badge";
import { DispatchOrderWithRelations } from "../../hooks/useDispatchOrders";
import { dispatchOrdersService, DispatchOrderCarrierHistory } from "../../../../services/database/dispatchOrders.service";

interface DispatchHistoryTabProps {
  order: DispatchOrderWithRelations;
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
  };
}

export function DispatchHistoryTab({ order }: DispatchHistoryTabProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const loadedOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!order.id) return;
      
      // Skip if already loaded for this order (using ref to avoid re-renders)
      if (loadedOrderIdRef.current === order.id) {
        return;
      }
      
      try {
        const historyData = await dispatchOrdersService.getCarrierHistory(order.id);
        
        const mappedEvents: HistoryEvent[] = [];

        // Mapear eventos reales del historial de carrier
        if (historyData && historyData.length > 0) {
          const carrierEvents = historyData.map((record: DispatchOrderCarrierHistory) => {
            const getActorName = (user?: { first_name: string; last_name: string; email: string }) => {
              if (!user) return null;
              const fullName = `${user.first_name} ${user.last_name}`.trim();
              return fullName !== "Unknown 'Unknown'" ? fullName : user.email;
            };

            const responderName = getActorName(record.responded_user);
            const assignerName = getActorName(record.assigned_user);
            
            let statusLabel = '';
            let description = '';
            let actor = 'Sistema';
            let status = record.outcome?.toLowerCase() || 'unknown';

            switch (record.outcome) {
              case 'PENDING':
                statusLabel = 'Pendiente';
                description = 'Enviada a Orders para confirmación del carrier';
                actor = assignerName || 'Sistema';
                status = 'pending';
                break;
              case 'ACCEPTED':
                if (record.new_fleet_set) {
                  statusLabel = 'Aceptada';
                  description = `Carrier confirmó disponibilidad de recursos`;
                } else {
                  statusLabel = 'Aceptada';
                  description = 'Carrier confirmó disponibilidad de recursos';
                }
                actor = responderName || record.carrier?.commercial_name || 'Carrier';
                status = 'accepted';
                break;
              case 'REJECTED':
                statusLabel = 'Rechazada';
                description = record.outcome_reason || 'Sin razón especificada';
                actor = responderName || record.carrier?.commercial_name || 'Carrier';
                status = 'rejected';
                break;
              case 'REASSIGNED':
                statusLabel = 'Reasignada';
                description = 'Orden reasignada a nueva flota';
                actor = assignerName || 'Planner';
                status = 'assigned';
                break;
              case 'CANCELED_BY_ORG':
                statusLabel = 'Cancelada';
                description = 'Cancelada por la organización';
                actor = assignerName || 'Sistema';
                status = 'cancelled';
                break;
              case 'TIMEOUT':
                statusLabel = 'Tiempo Agotado';
                description = 'Tiempo de respuesta agotado';
                actor = 'Sistema';
                status = 'timeout';
                break;
              case 'CANCELED_OBSERVED':
                statusLabel = 'Cancelada por Observación';
                description = 'Cancelada debido a observaciones';
                actor = assignerName || 'Sistema';
                status = 'cancelled';
                break;
              default:
                statusLabel = record.outcome || 'Evento';
                description = `Estado: ${record.outcome}`;
                actor = 'Sistema';
                status = 'unknown';
            }

            // Handle fleet set changes metadata
            let fleetChange = undefined;
            if (record.previous_fleet_set || record.new_fleet_set) {
              const getFleetName = (fs: typeof record.previous_fleet_set | typeof record.new_fleet_set) => 
                fs ? `${fs.vehicle?.unit_code || '-'} / ${fs.driver?.name || '-'}` : 'Sin Asignar';
              fleetChange = {
                from: getFleetName(record.previous_fleet_set),
                to: getFleetName(record.new_fleet_set)
              };
            }

            return {
              id: record.id || crypto.randomUUID(),
              timestamp: record.responded_at || record.assigned_at,
              status,
              statusLabel,
              actor,
              description,
              metadata: {
                reason: record.outcome_reason || undefined,
                fleetChange
              }
            };
          });
          
          mappedEvents.push(...carrierEvents);
        }

        // SIEMPRE agregar evento de creación al final
        if (order.created_at) {
          mappedEvents.push({
            id: 'created',
            timestamp: order.created_at,
            status: 'created',
            statusLabel: 'Creada',
            actor: 'Sistema',
            description: 'Orden creada en el sistema',
            metadata: {}
          });
        }

        setEvents(mappedEvents);
        loadedOrderIdRef.current = order.id;
      } catch (error) {
        console.error('[DispatchHistoryTab] Error loading history:', error);
      }
    };

    loadHistory();
  }, [order.id, order.created_at]);

  // Show empty state if no events (without loading spinner)
  if (events.length === 0) {
      return (
          <div className="flex justify-center items-center h-48 text-gray-500 text-sm">
              No hay historial disponible
          </div>
      );
  }

  // Sort events by timestamp ascending (oldest first - from created to current)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-0">
      {sortedEvents.map((event, index) => {
        const isLast = index === sortedEvents.length - 1;
        const isFirst = index === 0;
        
        // Status badge colors (same as Orders)
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
            case "cancelled":
              return "bg-slate-100 text-slate-700";
            case "timeout":
              return "bg-orange-100 text-orange-700";
            default:
              return "bg-gray-100 text-gray-600";
          }
        };

        return (
          <div key={event.id} className="flex gap-4 h-32">
            {/* Left column: circle + line */}
            <div className="relative w-7 shrink-0">
              {/* Connecting line */}
              {!isLast && (
                <div 
                  className="absolute top-1/2 w-px h-32 bg-gray-200 -z-10" 
                  style={{ left: '13.5px' }}
                />
              )}
              
              {/* Circle */}
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
              
              {/* Metadata */}
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
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
