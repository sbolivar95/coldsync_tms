import { useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { Lane } from "../../../types/database.types";
import type { LocationWithRelations } from "../../locations/useLocations";
import type { LaneFormData } from "../../../lib/schemas/lane.schemas";

export interface LaneStopState {
    id: string; // React Hook Form field id
    location_id: string;
    stop_type: "PICKUP" | "DROP_OFF" | "MANDATORY_WAYPOINT" | "OPTIONAL_WAYPOINT";
    stop_order: number;
    notes?: string;
    estimated_duration?: number;
}

export function useLaneStops(lane: Lane | null | undefined, locations: LocationWithRelations[]) {
    const { control, setValue, watch } = useFormContext<LaneFormData>();
    const { fields, append, remove, move, replace } = useFieldArray({
        control,
        name: "stops"
    });

    // Watch values to get live updates for controlled inputs
    const watchedStops = watch("stops");

    // Merge stable IDs from fields with live values from watch
    const stops = fields.map((field, index) => ({
        ...field,
        ...(watchedStops?.[index] || {}),
        id: field.id
    })) as unknown as LaneStopState[];

    // Load existing lane stops or defaults
    useEffect(() => {
        if (lane && (lane as any).lane_stops && Array.isArray((lane as any).lane_stops)) {
            const existingStops = (lane as any).lane_stops;

            // Only populate if form stops are empty (initial load)
            if (fields.length === 0) {
                const formattedStops = existingStops
                    .sort((a: any, b: any) => a.stop_order - b.stop_order)
                    .map((stop: any, index: number) => ({
                        location_id: stop.location_id.toString(),
                        stop_type: (stop.stop_type === 'DELIVERY' ? 'DROP_OFF' : stop.stop_type) || "MANDATORY_WAYPOINT",
                        stop_order: index + 1,
                        notes: stop.notes || "",
                        estimated_duration: stop.estimated_duration || 0
                    }));
                replace(formattedStops);
            }
        }
    }, [lane, replace, fields.length]);

    const handleAddStop = () => {
        append({
            location_id: "",
            stop_type: "MANDATORY_WAYPOINT",
            stop_order: fields.length + 1,
            estimated_duration: 0,
            notes: ""
        });
    };

    const handleRemoveStop = (index: number) => {
        remove(index);
    };

    const handleStopChange = (index: number, field: keyof LaneStopState, value: string | number) => {
        setValue(`stops.${index}.${field}` as any, value);

        // Auto-fill default dwell time if location changes
        if (field === 'location_id') {
            const loc = locations.find(l => l.id.toString() === value);
            if (loc) {
                if (loc.default_dwell_time_hours !== null && loc.default_dwell_time_hours !== undefined) {
                    setValue(`stops.${index}.estimated_duration` as any, Number(loc.default_dwell_time_hours));
                }
            }
        }
    };

    const handleMoveStop = (index: number, direction: "up" | "down") => {
        if (direction === "up" && index === 0) return;
        if (direction === "down" && index === fields.length - 1) return;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        move(index, targetIndex);
    };

    const handleReorderStop = (oldIndex: number, newIndex: number) => {
        move(oldIndex, newIndex);
    };

    return {
        stops,
        handleAddStop,
        handleRemoveStop,
        handleStopChange,
        handleMoveStop,
        handleReorderStop
    };
}
