import { Button } from "../../../components/ui/Button";
import { Clock, X, ArrowUp, ArrowDown } from "lucide-react";
import { SmartSelect, type SmartOption } from "../../../components/widgets/SmartSelect";
import { Input } from "../../../components/ui/Input";
import type { LocationWithRelations } from "../../locations/useLocations";
import type { LaneStopState } from "../hooks/useLaneStops";

interface RouteStopItemProps {
    index: number;
    stop: LaneStopState;
    locations: LocationWithRelations[];
    locationOptions: SmartOption[];
    onRemove: (index: number) => void;
    onChange: (index: number, field: keyof LaneStopState, value: string | number) => void;
    onMove: (index: number, direction: "up" | "down") => void;
    isFirst: boolean;
    isLast: boolean;
    canRemove: boolean;
}

const baseStopTypeOptions: SmartOption[] = [
    { value: "PICKUP", label: "Carga (Origen)" },
    { value: "DROP_OFF", label: "Descarga (Destino)" },
    { value: "MANDATORY_WAYPOINT", label: "Punto de Control (Aduana/Peaje)" },
    { value: "OPTIONAL_WAYPOINT", label: "Parada Técnica (Descanso/Garaje)" },
];

export function RouteStopItem({
    index,
    stop,
    locations,
    locationOptions,
    onRemove,
    onChange,
    onMove,
    isFirst,
    isLast,
    canRemove
}: RouteStopItemProps) {

    const getStopTypeOptions = (locationId: string): SmartOption[] => {
        if (!locationId) return baseStopTypeOptions;

        const loc = locations.find(l => l.id.toString() === locationId);
        const allowed = (loc as any)?.location_types?.allowed_stop_types;
        if (!loc || !allowed) return baseStopTypeOptions;

        return baseStopTypeOptions.map(opt => ({
            ...opt,
            disabled: !allowed.includes(opt.value as any)
        }));
    };

    const loc = locations.find(l => l.id.toString() === stop.location_id);
    const isTypeAllowed = !loc?.location_types?.allowed_stop_types ||
        loc.location_types.allowed_stop_types.includes(stop.stop_type as any);

    return (
        <div
            className={`
        relative p-3 rounded-md border text-sm
        ${stop.stop_type === 'PICKUP' ? 'bg-green-50 border-green-200' :
                    stop.stop_type === 'DROP_OFF' ? 'bg-blue-50 border-blue-200' :
                        stop.stop_type === 'MANDATORY_WAYPOINT' ? 'bg-orange-50 border-orange-200' :
                            'bg-slate-50 border-gray-200'}
        group transition-colors
      `}
        >
            <div className="flex items-start gap-2">
                <div className="flex flex-col items-center justify-center gap-1 pt-1">
                    <div className="w-5 h-5 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-medium text-gray-500">
                        {index + 1}
                    </div>
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={() => onMove(index, 'up')}
                            disabled={isFirst}
                            className="text-gray-400 hover:text-primary disabled:opacity-30"
                        >
                            <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onMove(index, 'down')}
                            disabled={isLast}
                            className="text-gray-400 hover:text-primary disabled:opacity-30"
                        >
                            <ArrowDown className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-12 sm:col-span-7">
                            <SmartSelect
                                value={stop.location_id}
                                onChange={(val) => onChange(index, "location_id", val as string)}
                                options={locationOptions}
                                placeholder="Seleccionar ubicación..."
                                searchable={true}
                                disabled={locations.length === 0}
                            />
                        </div>
                        <div className="col-span-12 sm:col-span-5">
                            <SmartSelect
                                value={stop.stop_type}
                                onChange={(val) => onChange(index, "stop_type", val as string)}
                                options={getStopTypeOptions(stop.location_id)}
                                placeholder="Tipo..."
                                searchable={false}
                            />
                        </div>

                        {(stop.stop_type === 'MANDATORY_WAYPOINT' || stop.stop_type === 'PICKUP' || stop.stop_type === 'DROP_OFF') && (
                            <div className="col-span-12 flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <label className="text-xs text-gray-500 mr-2">Dwell Time (h):</label>
                                <Input
                                    type="number"
                                    className="h-7 text-xs w-20"
                                    placeholder="0.5"
                                    step="0.1"
                                    value={stop.estimated_duration}
                                    onChange={(e) => onChange(index, "estimated_duration", parseFloat(e.target.value))}
                                />
                                <span className="text-[10px] text-gray-400 italic">Tiempo de permanencia estimado</span>
                            </div>
                        )}

                        {!isTypeAllowed && loc && (
                            <div className="col-span-12 mt-1 py-1 px-2 bg-red-100 border border-red-200 rounded text-[11px] text-red-700 flex items-center gap-2">
                                <X className="w-3 h-3" />
                                <span>El tipo de punto "{stop.stop_type}" no está permitido para este tipo de ubicación ({(loc as any).location_types?.name}).</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(index)}
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                        disabled={!canRemove}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {!isLast && (
                <div className="absolute left-[22px] -bottom-3 w-px h-3 bg-gray-300 z-0"></div>
            )}
        </div>
    );
}
