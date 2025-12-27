import { Clock, User, Package, Truck, AlertCircle, CheckCircle2, XCircle, Ban, Send } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { useMemo } from "react";
import { type Order, mapStatusToEnglish } from "../../../lib/mockData";

interface HistoryTabProps {
  orderData: Order;
}

// Tipos de eventos posibles
type EventType = "created" | "assigned" | "pending" | "confirmed" | "rejected" | "dispatched" | "cancelled" | "observation";

interface HistoryEvent {
  id: string;
  timestamp: string; // ISO string
  action: string;
  user: string;
  details: string;
  type: EventType;
  icon: any;
  color: string;
  bgColor: string;
}

export function HistoryTab({ orderData }: HistoryTabProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // Generar historial dinámico basado en el estado actual
  const historyEvents = useMemo(() => {
    const events: HistoryEvent[] = [];
    const now = new Date();
    
    // Función helper para restar tiempo
    const subtractTime = (date: Date, minutes: number) => {
      return new Date(date.getTime() - minutes * 60000).toISOString();
    };

    // Map status to English if needed
    const statusRaw = orderData.status || (orderData as any).estado || "unassigned";
    const statusEnglish = mapStatusToEnglish(typeof statusRaw === "string" ? statusRaw : String(statusRaw));
    const carrierName = orderData.carrier || "Transportista";
    const vehicleName = orderData.vehicleId || "Unidad";

    // 1. Evento Base: Orden Creada (Siempre existe, es el primero)
    events.push({
      id: "evt-created",
      timestamp: subtractTime(now, 120), // Hace 2 horas
      action: "Orden Creada",
      user: "Juan Pérez",
      details: "Orden creada desde el módulo de Despacho",
      type: "created",
      icon: Package,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    });
    
    // Casos específicos de fallo/finalización temprana
    if (statusEnglish === "cancelled" || statusRaw === "cancelada") {
      events.push({
        id: "evt-cancel",
        timestamp: now.toISOString(),
        action: "Orden Cancelada",
        user: "Admin",
        details: "Orden cancelada manualmente por administración",
        type: "cancelled",
        icon: Ban,
        color: "text-red-600",
        bgColor: "bg-red-100",
      });
      return events;
    }

    // 2. Asignación (Si aplica)
    if (["assigned", "pending", "scheduled", "dispatched", "rejected", "observed", "asignada", "pendiente", "programada", "despachada", "rechazada", "observada"].includes(statusEnglish) || ["asignada", "pendiente", "programada", "despachada", "rechazada", "observada"].includes(statusRaw as string)) {
      events.push({
        id: "evt-assigned",
        timestamp: (statusEnglish === "assigned" || statusRaw === "asignada") ? now.toISOString() : subtractTime(now, 100),
        action: "Asignación Realizada",
        user: "María González",
        details: `Asignado a ${carrierName} - ${vehicleName}`,
        type: "assigned",
        icon: Truck,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      });
    }

    // 3. Enviado a Transportista (Si aplica)
    if (["pending", "scheduled", "dispatched", "rejected", "observed", "pendiente", "programada", "despachada", "rechazada", "observada"].includes(statusEnglish) || ["pendiente", "programada", "despachada", "rechazada", "observada"].includes(statusRaw as string)) {
      events.push({
        id: "evt-sent",
        timestamp: (statusEnglish === "pending" || statusRaw === "pendiente") ? now.toISOString() : subtractTime(now, 90),
        action: "Enviado a Transportista",
        user: "Sistema",
        details: "Solicitud de confirmación enviada",
        type: "pending",
        icon: Send,
        color: "text-amber-600",
        bgColor: "bg-amber-100",
      });
    }

    // Casos de interrupción de flujo (Rechazada / Observada)
    if (statusEnglish === "rejected" || statusRaw === "rechazada") {
      events.push({
        id: "evt-rejected",
        timestamp: now.toISOString(),
        action: "Rechazada por Transportista",
        user: carrierName,
        details: "Transportista rechazó la asignación",
        type: "rejected",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
      });
      return events;
    }

    if (statusEnglish === "observed" || statusRaw === "observada") {
      events.push({
        id: "evt-observed",
        timestamp: now.toISOString(),
        action: "Orden Observada",
        user: carrierName,
        details: "Se han registrado observaciones sobre la orden",
        type: "observation",
        icon: AlertCircle,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      });
      return events;
    }

    // Flujo Normal (Happy Path)
    
    // 4. Confirmado (Si aplica)
    if (["scheduled", "dispatched", "programada", "despachada"].includes(statusEnglish) || ["programada", "despachada"].includes(statusRaw as string)) {
      events.push({
        id: "evt-confirmed",
        timestamp: (statusEnglish === "scheduled" || statusRaw === "programada") ? now.toISOString() : subtractTime(now, 60),
        action: "Confirmado por Transportista",
        user: carrierName,
        details: "Orden confirmada - Unidad lista para programación",
        type: "confirmed",
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-100",
      });
    }

    // 5. Despachada (Si aplica)
    if (statusEnglish === "dispatched" || statusRaw === "despachada") {
      events.push({
        id: "evt-dispatch",
        timestamp: now.toISOString(),
        action: "Orden Despachada",
        user: "Garita Principal",
        details: "Unidad salió de planta correctamente",
        type: "dispatched",
        icon: Truck,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
      });
    }

    return events;
  }, [orderData.status, orderData.carrier, orderData.vehicleId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Historial de Cambios</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Registro cronológico de todas las acciones realizadas sobre esta orden
          </p>
        </div>
        <Badge className="bg-gray-100 text-gray-700 text-[10px]">
          {historyEvents.length} eventos
        </Badge>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Línea vertical */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gray-200" />

        {/* Eventos */}
        <div className="space-y-4">
          {historyEvents.map((event, index) => {
            const Icon = event.icon;
            const { date, time } = formatTimestamp(event.timestamp);
            const isLast = index === historyEvents.length - 1;

            return (
              <div key={event.id} className="relative flex gap-3">
                {/* Icono del evento */}
                <div className={`relative z-10 shrink-0 w-10 h-10 rounded-full ${event.bgColor} flex items-center justify-center border border-white shadow-sm`}>
                  <Icon className={`w-4 h-4 ${event.color}`} />
                </div>

                {/* Contenido del evento */}
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{event.action}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{event.details}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {event.user}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-gray-900">{time}</p>
                      <p className="text-xs text-gray-500">{date}</p>
                    </div>
                  </div>

                  {/* Separador (excepto último) */}
                  {!isLast && (
                    <div className="mt-4 h-px bg-gray-100" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estado actual */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h4 className="text-xs font-medium text-gray-700">Estado Actual</h4>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          La orden se encuentra en estado <span className="font-semibold">{orderData.status || "Sin Asignar"}</span>.
        </p>
      </div>
    </div>
  );
}