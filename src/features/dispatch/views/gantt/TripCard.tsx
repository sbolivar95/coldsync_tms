import { Package, Weight, Clock, CheckCircle2, XCircle, AlertCircle, Radio, Ban, DollarSign } from "lucide-react";
import { Badge } from "../../../../components/ui/Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../components/ui/Tooltip";

// UI Status type for display
export type UIStatus = 'unassigned' | 'assigned' | 'pending' | 'scheduled' | 'rejected' | 'observed' | 'dispatched' | 'cancelled' | 'at-origin' | 'at-destination'

interface TripCardProps {
  configuration: string;
  route: string;
  weight: string;
  status?: UIStatus;
  onClick?: () => void;
  className?: string;
  isHybrid?: boolean;

  // Accept string array or fallback to single string (wrapped) for backward compat if needed
  assignmentError?: string[] | string;
  cost?: number | null;
}

export function TripCard({
  configuration,
  route,
  weight,
  status = "unassigned",
  onClick,
  className = "",
  isHybrid = false,
  assignmentError,
  cost,
}: TripCardProps) {
  // Normalize errors to array
  const errors = Array.isArray(assignmentError)
    ? assignmentError
    : assignmentError
      ? [assignmentError]
      : [];

  const statusConfig: Record<UIStatus, {
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
      badgeClassName: "bg-white text-gray-600 border border-gray-300", // ✅ Badge blanco con borde
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
      badgeClassName: "bg-[#0c8e63]/10 border border-[#0c8e63]/20",
      borderLeftColor: "#0c8e63", // Color verde oscuro
      borderOtherColor: "#86efac", // green-300
      backgroundColor: "#f9fafb", // gray-50 - MISMO FONDO
      borderStyle: "solid",
      icon: CheckCircle2,
      iconColor: "#0c8e63", // Color verde oscuro
    },
    "rejected": {
      label: "Rechazada",
      badgeClassName: "bg-red-50 text-red-700 border border-red-200", // ✅ Badge rojo claro con borde
      borderLeftColor: "#ef4444", // ✅ Borde rojo (red-500)
      borderOtherColor: "#fecaca", // ✅ Otros bordes rojo claro (red-200)
      backgroundColor: "#ffffff", // ✅ Fondo blanco
      borderStyle: "solid", // ✅ Borde sólido
      icon: XCircle,
      iconColor: "#ef4444", // ✅ Icono rojo (red-500)
    },
    "observed": {
      label: "Observada",
      badgeClassName: "bg-[#c6171d]/10 border border-[#c6171d]/20",
      borderLeftColor: "#c6171d", // Color personalizado
      borderOtherColor: "#fecaca", // red-200 (similar al color personalizado)
      backgroundColor: "#f9fafb", // gray-50 - MISMO FONDO
      borderStyle: "solid",
      icon: AlertCircle,
      iconColor: "#c6171d", // Color personalizado
    },
    "dispatched": {
      label: "Despachada",
      badgeClassName: "bg-[#004ef0]/10 border border-[#004ef0]/20",
      borderLeftColor: "#004ef0", // Color primario
      borderOtherColor: "#ccd9f9", // Color primario con ~20% de opacidad (similar al badge del drawer)
      backgroundColor: "#f9fafb", // gray-50 - MISMO FONDO
      borderStyle: "solid",
      icon: Radio,
      iconColor: "#004ef0", // Color primario
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
    "at-origin": {
      label: "En Origen",
      badgeClassName: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      borderLeftColor: "#10b981", // emerald-500 (verde menta)
      borderOtherColor: "#a7f3d0", // emerald-200
      backgroundColor: "#f9fafb", // gray-50 - MISMO FONDO
      borderStyle: "solid",
      icon: CheckCircle2,
      iconColor: "#10b981", // emerald-500 (verde menta)
    },
    "at-destination": {
      label: "En Destino",
      badgeClassName: "bg-white text-[#091E42] border border-gray-200",
      borderLeftColor: "#091E42",
      borderOtherColor: "#e5e7eb", // gray-200
      backgroundColor: "#f9fafb", // gray-50 - MISMO FONDO
      borderStyle: "solid",
      icon: CheckCircle2,
      iconColor: "#091E42",
    },
  };

  // Fallback para estados no definidos
  const statusInfo = statusConfig[status] || statusConfig["unassigned"];
  const IconComponent = statusInfo.icon;

  const hasError = errors.length > 0
  const borderColor = hasError ? '#ef4444' : statusInfo.borderLeftColor
  const borderStyle = hasError ? 'solid' : (statusInfo.borderStyle === 'dashed' ? 'border-2 border-dashed' : 'border border-solid')

  return (
    <div
      className={`group relative border-l-4 ${borderStyle} rounded-sm p-2 h-[70px] hover:shadow-md transition-all cursor-pointer ${status === 'cancelled' ? 'opacity-50 blur-[0.5px]' : ''} ${hasError ? 'bg-red-50/30' : ''} ${className}`}
      style={{
        borderLeftColor: borderColor,
        borderLeftStyle: 'solid', // Borde izquierdo SIEMPRE sólido
        backgroundColor: hasError ? '#fef2f2' : statusInfo.backgroundColor,
        borderTopColor: hasError ? '#fecaca' : statusInfo.borderOtherColor,
        borderRightColor: hasError ? '#fecaca' : statusInfo.borderOtherColor,
        borderBottomColor: hasError ? '#fecaca' : statusInfo.borderOtherColor,
      }}
      onClick={onClick}
    >
      {/* Badge HYB - Esquina superior derecha */}
      {isHybrid && (
        <div className="absolute top-1 right-1 z-10">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700">
            HYB
          </span>
        </div>
      )}

      {/* 🆕 Error indicator - Esquina superior derecha (o izquierda si HYB está visible) */}
      {hasError && (
        <div className={`absolute ${isHybrid ? 'top-1 left-1' : 'top-1 right-1'} z-10`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <AlertCircle className="w-4 h-4 text-red-600 hover:text-red-700 transition-colors" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-red-600 text-white border-red-500 max-w-[250px] shadow-lg pointer-events-none p-2">
              <p className="font-semibold mb-1 border-b border-red-400 pb-1 text-xs">Asignación Inválida</p>
              <ul className="text-[10px] leading-tight opacity-95 list-disc pl-3 space-y-0.5 text-left">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Header: Icono + Configuración */}
      <div className="flex items-center gap-1 mb-1">
        <IconComponent
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: statusInfo.iconColor }}
        />
        <span className="font-medium text-gray-900 leading-tight text-xs">
          {configuration}
        </span>
      </div>

      {/* Ruta */}
      <div className="flex items-center gap-2 text-[11px] text-gray-600 mb-1">
        <span className="truncate">
          {route && route.includes("→") ? (
            <>
              {route.split("→")[0]?.trim() || ''}
              <span className="mx-1 font-semibold" style={{ color: statusInfo.borderLeftColor }}>→</span>
              {route.split("→")[1]?.trim() || ''}
            </>
          ) : (
            route || 'Sin ruta'
          )}
        </span>
      </div>

      {/* Footer: Estado, Peso y Costo */}
      <div className="flex items-center justify-between text-xs">
        <Badge
          className={`${statusInfo.badgeClassName} text-[9px] px-2 py-0.5 font-bold rounded-full`}
          style={
            status === "observed"
              ? { color: "#c6171d" }
              : status === "scheduled"
                ? { color: "#0c8e63" }
                : status === "dispatched"
                  ? { color: "#004ef0" }
                  : undefined
          }
        >
          {statusInfo.label}
        </Badge>
        <div className="flex items-center gap-2">
          {cost !== null && cost !== undefined && (
            <div className="flex items-center gap-1 text-[#004ef0] font-semibold">
              <DollarSign className="w-3 h-3" />
              <span className="text-[10px]">${cost.toFixed(0)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-500">
            <Weight className="w-3 h-3" />
            <span className="font-medium text-[10px]">{weight}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

