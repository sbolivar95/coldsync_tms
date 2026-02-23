import { ControlPosition, MapControl, useMap } from "@vis.gl/react-google-maps";
import { Plus, Minus, Layers, Maximize, Circle as CircleIcon, Pentagon, Undo2, Redo2, } from "lucide-react";

/**
 * Componente interno para botones individuales de mapa.
 * Mantiene la estética premium shadow-sm y border-gray-100.
 */
function MapControlButton({
    onClick,
    icon,
    title,
    className = "",
    active = false
}: {
    onClick?: () => void,
    icon: React.ReactNode,
    title: string,
    className?: string,
    active?: boolean
}) {
    return (
        <button
            onClick={onClick}
            className={`p-2.5 transition-colors flex items-center justify-center ${active ? "bg-blue-50 text-blue-600" : "bg-white text-gray-700 hover:bg-gray-50"
                } ${className}`}
            title={title}
            aria-label={title}
            type="button"
        >
            {icon}
        </button>
    );
}

/**
 * Toolbar Superior para Dibujo y Edición (TOP_CENTER).
 */
export function MapDrawingToolbar({
    selectedMode,
    onModeChange,
    onUndo,
    onRedo,
    onClear,
    canUndo = false,
    canRedo = false,
    canClear = false
}: {
    selectedMode?: "point" | "polygon" | "none",
    onModeChange?: (mode: "point" | "polygon" | "none") => void,
    onUndo?: () => void,
    onRedo?: () => void,
    onClear?: () => void,
    canUndo?: boolean,
    canRedo?: boolean,
    canClear?: boolean
}) {
    return (
        <MapControl position={ControlPosition.TOP_CENTER}>
            <div style={{ padding: "10px" }} className="flex items-center gap-3">
                {/* Grupo 1: Herramientas de Dibujo */}
                <div className="flex bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                    <MapControlButton
                        onClick={() => onModeChange?.("point")}
                        active={selectedMode === "point"}
                        icon={<CircleIcon size={16} strokeWidth={2.5} />}
                        title="Dibujar Círculo"
                        className="border-r border-gray-100"
                    />
                    <MapControlButton
                        onClick={() => onModeChange?.("polygon")}
                        active={selectedMode === "polygon"}
                        icon={<Pentagon size={16} strokeWidth={2.5} />}
                        title="Dibujar Polígono"
                    />
                </div>

                {/* Grupo 2: Acciones de Edición */}
                <div className="flex bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                    <MapControlButton
                        onClick={onUndo}
                        icon={<Undo2 size={14} strokeWidth={2.5} className={!canUndo ? "opacity-30" : ""} />}
                        title="Deshacer"
                        className="border-r border-gray-100"
                    />
                    <MapControlButton
                        onClick={onRedo}
                        icon={<Redo2 size={14} strokeWidth={2.5} className={!canRedo ? "opacity-30" : ""} />}
                        title="Rehacer"
                        className="border-r border-gray-100"
                    />
                    <button
                        onClick={onClear}
                        disabled={!canClear}
                        className={`px-4 py-1 text-xs font-medium transition-colors uppercase tracking-tight ${canClear ? "text-gray-500 hover:bg-red-50 hover:text-red-600" : "text-gray-300 cursor-not-allowed"
                            }`}
                        title="Borrar todo"
                        type="button"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </MapControl>
    );
}

interface MapSideControlsProps {
    position?: ControlPosition;
    onToggleMapType?: () => void;
    onCenterMap?: () => void;
    mapTypeId?: string;
    showLayers?: boolean;
    showZoom?: boolean;
    showCenter?: boolean;
}

/**
 * Control lateral unificado en columna.
 * Agrupa Capas, Zoom y Centrado. Altamente personalizable mediante flags.
 */
export function MapSideControls({
    position = ControlPosition.TOP_RIGHT,
    onToggleMapType,
    onCenterMap,
    mapTypeId = "roadmap",
    showLayers = true,
    showZoom = true,
    showCenter = true
}: MapSideControlsProps) {
    const map = useMap();

    return (
        <MapControl position={position}>
            <div style={{ padding: "10px" }} className="flex flex-col gap-2">
                {/* Isla de Capas */}
                {showLayers && (
                    <div className="flex flex-col bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                        <MapControlButton
                            onClick={onToggleMapType}
                            icon={<Layers size={16} strokeWidth={2.5} />}
                            title={mapTypeId === "roadmap" ? "Ver Satélite" : "Ver Mapa"}
                        />
                    </div>
                )}

                {/* Isla de Zoom (Agrupada) */}
                {showZoom && (
                    <div className="flex flex-col bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => map?.setZoom((map.getZoom() || 0) + 1)}
                            className="p-2.5 hover:bg-gray-50 text-gray-700 transition-colors border-b border-gray-100 flex items-center justify-center"
                            title="Acercar"
                            type="button"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => map?.setZoom((map.getZoom() || 0) - 1)}
                            className="p-2.5 hover:bg-gray-50 text-gray-700 transition-colors flex items-center justify-center"
                            title="Alejar"
                            type="button"
                        >
                            <Minus size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                )}

                {/* Isla de Centrado (Ajustar vista) */}
                {showCenter && (
                    <div className="flex flex-col bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                        <MapControlButton
                            onClick={onCenterMap}
                            icon={<Maximize size={16} strokeWidth={2.5} />}
                            title="Ajustar vista a la ubicación"
                        />
                    </div>
                )}
            </div>
        </MapControl>
    );
}
