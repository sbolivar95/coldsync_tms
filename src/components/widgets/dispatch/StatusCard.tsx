import {
  Weight,
  LucideIcon,
} from "lucide-react";
import { Badge } from "../../ui/Badge";
import { cn } from "../../../lib/utils";

/**
 * STATUS CARD COMPONENT - ColdSync
 * 
 * Componente reutilizable para mostrar tarjetas de estado con información de órdenes, rutas, etc.
 * 
 * Características:
 * - Soporte para dos variantes: con y sin RTA (Return to Availability)
 * - Indicador de orden híbrida (badge HYB)
 * - Estados visuales configurables mediante StatusConfig
 * - Estilos personalizables (colores, bordes, iconos)
 * - Soporte para estados cancelados (opacidad reducida)
 * 
 * @example
 * ```tsx
 * <StatusCard
 *   title="Refrigerado/Congelado"
 *   route="Planta-FAE → NCD-LPZ"
 *   weight="12 Tn"
 *   statusConfig={dispatchStatusConfigs.unassigned}
 *   isHybrid={false}
 *   hasRTA={true}
 *   onClick={() => handleClick()}
 * />
 * ```
 */

/**
 * Configuración de estado para la tarjeta
 * Define los estilos visuales, iconos y colores para cada estado
 */
export interface StatusConfig {
  /** Etiqueta del estado (ej: "Sin Asignar", "Despachada") */
  label: string;
  /** Clases CSS para el badge del estado */
  badgeClassName: string;
  /** Clases CSS para los bordes (excepto el borde izquierdo) */
  borderOtherClassName: string;
  /** Clases CSS para el color de fondo */
  backgroundColorClassName: string;
  /** Clases CSS para el color del icono (fallback si no se usa iconColor) */
  iconClassName: string;
  /** Estilo del borde: sólido o punteado */
  borderStyle: "solid" | "dashed";
  /** Componente de icono de Lucide React */
  icon: LucideIcon;
  /** Color hexadecimal para el borde izquierdo */
  borderLeftColor: string;
  /** Color hexadecimal para el icono (tiene prioridad sobre iconClassName) */
  iconColor: string;
}

/**
 * Props del componente StatusCard
 */
export interface StatusCardProps {
  /** Título de la tarjeta (ej: tipo de producto o servicio) */
  title: string;
  /** Ruta en formato "Origen → Destino" */
  route: string;
  /** Peso o cantidad (ej: "12 Tn") */
  weight: string;
  /** Configuración del estado visual */
  statusConfig: StatusConfig;
  /** Si es true, muestra el badge "HYB" (Híbrido) */
  isHybrid?: boolean;
  /** Si es true, muestra la sección RTA (Return to Availability) */
  hasRTA?: boolean;
  /** Porcentaje de ancho para la sección RTA (default: 30) */
  rtaPercent?: number;
  /** Callback cuando se hace click en la tarjeta */
  onClick?: () => void;
  /** Clases CSS adicionales para personalizar el contenedor */
  className?: string;
  /** Altura de la tarjeta (default: "70px") */
  height?: string;
  /** Si es true, aplica opacidad reducida y blur (para estados cancelados) */
  isCancelled?: boolean;
}

/**
 * Componente StatusCard
 * 
 * Renderiza una tarjeta de estado con información de orden/ruta.
 * Soporta dos variantes: con y sin sección RTA (Return to Availability).
 * 
 * @param props - Props del componente StatusCard
 * @returns Componente React de tarjeta de estado
 */
export function StatusCard({
  title,
  route,
  weight,
  statusConfig,
  isHybrid = false,
  hasRTA = false,
  rtaPercent = 30,
  onClick,
  className = "",
  height = "70px",
  isCancelled = false,
}: StatusCardProps) {
  const IconComponent = statusConfig.icon;

  // Variante sin RTA: tarjeta simple

  if (!hasRTA) {
    return (
      <div
        className={cn(
          "group relative border-l-4 rounded-sm p-2 hover:shadow-md transition-all",
          statusConfig.borderStyle === "dashed"
            ? "border-2 border-dashed"
            : "border border-solid",
          statusConfig.borderOtherClassName,
          statusConfig.backgroundColorClassName,
          onClick ? "cursor-pointer" : "",
          isCancelled ? "opacity-50 blur-[0.5px]" : "",
          className
        )}
        style={{
          height,
          borderLeftColor: statusConfig.borderLeftColor,
          borderLeftStyle: "solid",
        }}
        onClick={onClick}
      >
        {isHybrid && (
          <div className="absolute top-1 right-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-hibrido-bg text-hibrido-text">
              HYB
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 mb-1">
          <IconComponent
            className={cn(
              "w-3.5 h-3.5 shrink-0",
              !statusConfig.iconColor && statusConfig.iconClassName
                ? statusConfig.iconClassName
                : ""
            )}
            style={{
              ...(statusConfig.iconColor && { color: statusConfig.iconColor }),
            }}
          />
          <span className="font-medium text-gray-900 leading-tight text-xs">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-600 mb-1">
          <span className="truncate">
            {route.split("→")[0].trim()}
            <span
              className="mx-1 font-semibold"
              style={{ color: statusConfig.borderLeftColor }}
            >
              →
            </span>
            {route.split("→")[1].trim()}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <Badge
            className={cn(
              statusConfig.badgeClassName,
              "text-[9px] px-2 py-0.5 font-bold rounded-full"
            )}
          >
            {statusConfig.label}
          </Badge>
          <div className="flex items-center gap-1 text-gray-500">
            <Weight className="w-3 h-3" />
            <span className="font-medium text-[10px]">{weight}</span>
          </div>
        </div>
      </div>
    );
  }

  // Variante con RTA: tarjeta dividida con sección RTA
  const mainContentWidth = `${100 - rtaPercent}%`;
  const rtaWidth = `${rtaPercent}%`;

  return (
    <div
      className={cn(
        "group relative flex border-l-4 rounded-sm overflow-hidden hover:shadow-md transition-all",
        statusConfig.borderStyle === "dashed"
          ? "border-2 border-dashed"
          : "border border-solid",
        statusConfig.borderStyle === "dashed"
          ? "border-t-gray-300 border-b-gray-300"
          : "border-t-gray-200 border-b-gray-200",
        "border-r-transparent",
        statusConfig.backgroundColorClassName,
        onClick ? "cursor-pointer" : "",
        isCancelled ? "opacity-50 blur-[0.5px]" : "",
        className
      )}
      style={{
        height,
        borderLeftColor: statusConfig.borderLeftColor,
        borderLeftStyle: "solid",
        borderLeftWidth: "4px",
        borderTopStyle: statusConfig.borderStyle,
        borderBottomStyle: statusConfig.borderStyle,
      }}
      onClick={onClick}
    >
      <div
        className="flex flex-col p-2 relative"
        style={{ width: mainContentWidth }}
      >
        {isHybrid && (
          <div className="absolute top-1 right-1 z-10">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-hibrido-bg text-hibrido-text">
              HYB
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 mb-1">
          <IconComponent
            className={cn(
              "w-3.5 h-3.5 shrink-0",
              !statusConfig.iconColor && statusConfig.iconClassName
                ? statusConfig.iconClassName
                : ""
            )}
            style={{
              ...(statusConfig.iconColor && { color: statusConfig.iconColor }),
            }}
          />
          <span className="font-medium text-gray-900 leading-tight text-xs">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-600 mb-1">
          <span className="truncate">
            {route.split("→")[0].trim()}
            <span
              className="mx-1 font-semibold"
              style={{ color: statusConfig.borderLeftColor }}
            >
              →
            </span>
            {route.split("→")[1].trim()}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <Badge
            className={cn(
              statusConfig.badgeClassName,
              "text-[9px] px-2 py-0.5 font-bold rounded-full"
            )}
          >
            {statusConfig.label}
          </Badge>
          <div className="flex items-center gap-1 text-gray-500">
            <Weight className="w-3 h-3" />
            <span className="font-medium text-[10px]">{weight}</span>
          </div>
        </div>
      </div>

      <div
        className="rounded-r h-full bg-gray-100 flex items-center justify-center shrink-0 border-l border-white/50"
        style={{
          width: rtaWidth,
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }}
        title="Return to Availability"
      >
        <span className="text-[8px] text-gray-400 font-bold -rotate-90">
          RTA
        </span>
      </div>
    </div>
  );
}
