import { Package, Weight, Clock, CheckCircle2, XCircle, AlertCircle, Send, Ban, ClipboardCheck } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { OrderStatus } from "../../../lib/mockData";

// Re-export mapStatusToEnglish from mockData for backward compatibility
export { mapStatusToEnglish } from "../../../lib/mockData";

interface TripCardProps {
  configuration: string;
  route: string;
  weight: string;
  status?: OrderStatus;
  onClick?: () => void;
  className?: string;
  isHybrid?: boolean; // ✅ Nueva prop para identificar órdenes híbridas
}

export function TripCard({
  configuration,
  route,
  weight,
  status = "unassigned",
  onClick,
  className = "",
  isHybrid = false, // ✅ Default false
}: TripCardProps) {
  // Configuración de estados con paleta cálida y consistente
  const estadoConfig: Record<OrderStatus, {
    label: string;
    badgeClassName: string;
    borderLeftColor: string;
    borderOtherColor: string;
    backgroundColor: string;
    borderStyle: "solid" | "dashed";
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    iconColor: string;
  }> = {
    "unassigned": {
      label: "Sin Asignar",
      badgeClassName: "bg-gray-200 text-gray-700",
      borderLeftColor: "#d1d5db", // gray-300
      borderOtherColor: "#e5e7eb", // gray-200
      backgroundColor: "#f9fafb", // gray-50
      borderStyle: "solid",
      icon: Package,
      iconColor: "#6b7280", // gray-500
    },
    "assigned": {
      label: "Asignada",
      badgeClassName: "bg-gray-100 text-gray-600", // ✅ Badge gris claro sin borde
      borderLeftColor: "#6b7280", // ✅ Borde gris medio (gray-500)
      borderOtherColor: "#d1d5db", // ✅ Otros bordes gris claro (gray-300)
      backgroundColor: "#e5e7eb", // ✅ Fondo gris más oscuro (gray-200)
      borderStyle: "dashed",
      icon: CheckCircle2,
      iconColor: "#6b7280", // ✅ Icono gris medio
    },
    "pending": {
      label: "Pendiente",
      badgeClassName: "bg-amber-50 text-amber-700 border border-amber-200",
      borderLeftColor: "#f59e0b", // amber-500
      borderOtherColor: "#fde68a", // amber-200
      backgroundColor: "#f9fafb", // gray-50 - MISMO FONDO
      borderStyle: "solid",
      icon: Clock,
      iconColor: "#f59e0b", // amber-500
    },
    "scheduled": {
      label: "Programada",
      badgeClassName: "bg-blue-50 text-blue-700 border border-blue-200",
      borderLeftColor: "#3b82f6", // blue-500
      borderOtherColor: "#bfdbfe", // blue-200
      backgroundColor: "#f9fafb", // gray-50 - MISMO FONDO
      borderStyle: "solid",
      icon: CheckCircle2,
      iconColor: "#3b82f6", // blue-500
    },
    "at-destination": {
      label: "En Destino",
      badgeClassName: "bg-white text-[#091E42] border border-gray-200",
      borderLeftColor: "#091E42", // Navy
      borderOtherColor: "#d1d5db", // gray-300 (neutral border)
      backgroundColor: "#f9fafb", // gray-50
      borderStyle: "solid",
      icon: ClipboardCheck, // Usando ClipboardCheck como "CheckCircle3" no existe en Lucide std
      iconColor: "#091E42", // Navy
    },
    "rejected": {
      label: "Rechazada",
      badgeClassName: "bg-red-50 text-red-700 border border-red-200",
      borderLeftColor: "#ef4444", // red-500
      borderOtherColor: "#fecaca", // red-200
      backgroundColor: "#f9fafb", // gray-50 - MISMO FONDO
      borderStyle: "solid",
      icon: XCircle,
      iconColor: "#ef4444", // red-500
    },
    "observed": {
      label: "Observada",
      badgeClassName: "bg-orange-50 text-orange-700 border border-orange-200",
      borderLeftColor: "#f97316", // orange-500
      borderOtherColor: "#fed7aa", // orange-200
      backgroundColor: "#f9fafb", // gray-50 - MISMO FONDO
      borderStyle: "solid",
      icon: AlertCircle,
      iconColor: "#f97316", // orange-500
    },
    "dispatched": {
      label: "Despachada",
      badgeClassName: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      borderLeftColor: "#10b981", // emerald-500
      borderOtherColor: "#a7f3d0", // emerald-200
      backgroundColor: "#f9fafb", // gray-50 - MISMO FONDO
      borderStyle: "solid",
      icon: Send,
      iconColor: "#10b981", // emerald-500
    },
    "cancelled": {
      label: "Cancelada",
      badgeClassName: "bg-slate-100 text-slate-700 border border-slate-300",
      borderLeftColor: "#64748b", // slate-500
      borderOtherColor: "#cbd5e1", // slate-300
      backgroundColor: "#f9fafb", // gray-50 - MISMO FONDO
      borderStyle: "solid",
      icon: Ban,
      iconColor: "#64748b", // slate-500
    },
  };

  const estadoInfo = estadoConfig[status];
  const IconComponent = estadoInfo.icon;
  
  return (
    <div
      className={`group relative border-l-4 ${estadoInfo.borderStyle === 'dashed' ? 'border-2 border-dashed' : 'border border-solid'} rounded-sm p-2 h-[70px] hover:shadow-md transition-all cursor-pointer ${status === 'cancelled' ? 'opacity-50 blur-[0.5px]' : ''} ${className}`}
      style={{ 
        borderLeftColor: estadoInfo.borderLeftColor, 
        borderLeftStyle: 'solid', // Borde izquierdo SIEMPRE sólido
        backgroundColor: estadoInfo.backgroundColor,
        borderTopColor: estadoInfo.borderOtherColor,
        borderRightColor: estadoInfo.borderOtherColor,
        borderBottomColor: estadoInfo.borderOtherColor,
      }}
      onClick={onClick}
    >
      {/* Badge HYB - Esquina superior derecha */}
      {isHybrid && (
        <div className="absolute top-1 right-1">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-hibrido-bg text-hibrido-text">
            HYB
          </span>
        </div>
      )}
      
      {/* Header: Icono + Configuración */}
      <div className="flex items-center gap-1 mb-1">
        <IconComponent 
          className="w-3.5 h-3.5 shrink-0" 
          style={{ color: estadoInfo.iconColor }}
        />
        <span className="font-medium text-gray-900 leading-tight text-xs">
          {configuration}
        </span>
      </div>

      {/* Ruta */}
      <div className="flex items-center gap-2 text-[11px] text-gray-600 mb-1">
        <span className="truncate">
          {route.split("→")[0].trim()}
          <span className="mx-1 font-semibold" style={{ color: estadoInfo.borderLeftColor }}>→</span>
          {route.split("→")[1].trim()}
        </span>
      </div>

      {/* Footer: Estado y Peso */}
      <div className="flex items-center justify-between text-xs">
        <Badge className={`${estadoInfo.badgeClassName} text-[9px] px-2 py-0.5 font-bold rounded-full`}>
          {estadoInfo.label}
        </Badge>
        <div className="flex items-center gap-1 text-gray-500">
          <Weight className="w-3 h-3" />
          <span className="font-medium text-[10px]">{weight}</span>
        </div>
      </div>
    </div>
  );
}

