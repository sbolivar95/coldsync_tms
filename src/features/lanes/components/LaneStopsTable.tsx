import { Input } from "../../../components/ui/Input";
import { useFormContext } from "react-hook-form";
import { DataTable } from "../../../components/widgets/DataTable/DataTable";
import type { DataTableColumn, DataTableAction } from "../../../components/widgets/DataTable/types";
import { SmartSelect, type SmartOption } from "../../../components/widgets/SmartSelect";
import { GripVertical, X, ChevronUp, ChevronDown } from "lucide-react";
import type { LocationWithRelations } from "../../locations/useLocations";
import type { LaneStopState } from "../hooks/useLaneStops";

interface LaneStopsTableProps {
    stops: LaneStopState[];
    locations: LocationWithRelations[];
    locationOptions: SmartOption[];
    onRemove: (index: number) => void;
    onChange: (index: number, field: keyof LaneStopState, value: string | number) => void;
    onMove: (index: number, direction: "up" | "down") => void;
    onReorder: (oldIndex: number, newIndex: number) => void;
}

const baseStopTypeOptions: SmartOption[] = [
    { value: "PICKUP", label: "Carga" },
    { value: "DROP_OFF", label: "Descarga" },
    { value: "MANDATORY_WAYPOINT", label: "Control" },
    { value: "OPTIONAL_WAYPOINT", label: "Opcional" },
];

export function LaneStopsTable({
    stops,
    locations,
    locationOptions,
    onRemove,
    onChange,
    onMove,
    onReorder
}: LaneStopsTableProps) {
    const { formState: { errors } } = useFormContext();

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

    // Preparamos los datos inyectando el índice original para que los renders de columnas lo usen
    type LaneStopRow = LaneStopState & {
        originalIndex: number;
        id: string;
    };

    const dataWithIndex: LaneStopRow[] = stops.map((stop, index) => ({
        ...stop,
        originalIndex: index,
        // Usamos el ID estable de React Hook Form si existe
        id: stop.id
    }));

    const columns: DataTableColumn<LaneStopRow>[] = [
        {
            key: "order",
            header: "#",
            width: "80px",
            align: "center",
            render: (item) => (
                <div className="flex items-center justify-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                    <div className="flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 bg-white">
                        <span className="text-xs font-medium text-gray-700">{item.originalIndex + 1}</span>
                    </div>
                </div>
            )
        },
        {
            key: "location",
            header: "UBICACIÓN",
            width: "45%",
            render: (item) => {
                // Validación: No permitir seleccionar la misma ubicación que la parada anterior
                // Filtrar opciones excluyendo la ubicación inmediatamente anterior
                const prevStop = stops[item.originalIndex - 1];
                const prevLocationId = prevStop?.location_id;

                const filteredOptions = locationOptions.filter(opt => {
                    // Siempre permitir la opción seleccionada actualmente (para verla)
                    if (opt.value === item.location_id) return true;
                    // Excluir si es igual a la anterior
                    if (prevLocationId && opt.value === prevLocationId) return false;
                    return true;
                });

                return (
                    <SmartSelect
                        value={item.location_id}
                        onChange={(val) => onChange(item.originalIndex, "location_id", val as string)}
                        options={filteredOptions}
                        placeholder="Seleccionar ubicación..."
                        searchable={true}
                        disabled={locations.length === 0}
                    />
                );
            }
        },
        {
            key: "type",
            header: "TIPO",
            width: "180px",
            render: (item) => (
                <SmartSelect
                    value={item.stop_type}
                    onChange={(val) => onChange(item.originalIndex, "stop_type", val as string)}
                    options={getStopTypeOptions(item.location_id)}
                    placeholder="Tipo..."
                    searchable={false}
                />
            )
        },
        {
            key: "time",
            header: "TIEMPO",
            width: "100px",
            render: (item) => (
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        className="h-9 text-sm w-20 border-gray-200 shadow-none"
                        placeholder="2"
                        step="0.1"
                        value={item.estimated_duration || ""}
                        onChange={(e) => onChange(item.originalIndex, "estimated_duration", e.target.value)}
                    />
                    <span className="text-xs text-gray-500">h</span>
                </div>
            )
        }
    ];

    const actions: DataTableAction<LaneStopRow>[] = [
        {
            icon: <ChevronUp className="w-4 h-4 text-gray-500" />,
            onClick: (item) => onMove(item.originalIndex, 'up'),
            title: "Mover arriba",
            hidden: (item) => item.originalIndex === 0
        },
        {
            icon: <ChevronDown className="w-4 h-4 text-gray-500" />,
            onClick: (item) => onMove(item.originalIndex, 'down'),
            title: "Mover abajo",
            hidden: (item) => item.originalIndex === stops.length - 1
        },
        {
            icon: <X className="w-4 h-4 text-red-500" />,
            onClick: (item) => onRemove(item.originalIndex),
            title: "Eliminar",
            variant: "destructive",
            hidden: () => stops.length <= 2
        }
    ];

    return (
        <div className="space-y-2">
            <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                <DataTable
                    data={dataWithIndex}
                    columns={columns}
                    getRowId={(item) => item.id}
                    actions={actions}
                    onReorder={onReorder}
                    showSelection={false}
                    showPagination={false}
                    allowOverflow={true}
                    emptyMessage="Agrega tu primera ubicación para comenzar. El carril debe tener al menos 2 ubicaciones."
                />
            </div>
            {/* Array-level errors (from superRefine) */}
            {errors.stops?.message && (
                <p className="text-[0.8rem] font-medium text-destructive px-1">
                    {String(errors.stops.message)}
                </p>
            )}
        </div>
    );
}
