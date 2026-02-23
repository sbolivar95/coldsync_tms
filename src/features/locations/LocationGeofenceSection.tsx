import { useFormContext } from "react-hook-form";
import { LocationMap } from "./LocationMap";
import { Input } from "../../components/ui/Input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "../../components/ui/Form";
import type { LocationFormDataWithString } from "../../lib/schemas/location.schemas";

interface LocationGeofenceSectionProps {
  currentGeofenceData: {
    center?: { lat: number; lng: number };
    radius?: number;
    coordinates?: Array<{ lat: number; lng: number }>;
  };
  isEditing?: boolean;
}

export function LocationGeofenceSection({
  currentGeofenceData,
  isEditing = true,
}: LocationGeofenceSectionProps) {
  const form = useFormContext<LocationFormDataWithString>();
  const geofenceType = form.watch("geofence_type");

  const handleGeofenceChange = (
    type: "point" | "polygon" | "radius",
    data: { lat: number; lng: number } | Array<{ lat: number; lng: number }> | number | null
  ) => {
    if (type === "point") {
      if (data === null) {
        form.setValue("geofence_data", { center: { lat: 0, lng: 0 }, radius: 100 } as any, { shouldDirty: true });
        return;
      }
      if (typeof data === "number" || Array.isArray(data)) return;

      const pointData = data as { lat: number; lng: number };
      const radius =
        geofenceType === "circular" && currentGeofenceData && "radius" in currentGeofenceData
          ? currentGeofenceData.radius || 100
          : 100;

      form.setValue("geofence_data", {
        center: pointData,
        radius,
      }, { shouldDirty: true, shouldValidate: true });
      form.setValue("geofence_type", "circular", { shouldDirty: true, shouldValidate: true });
    } else if (type === "polygon") {
      if (data === null) {
        form.setValue("geofence_data", { coordinates: [] }, { shouldDirty: true });
        return;
      }
      if (!Array.isArray(data) || data.length === 0) return;

      const polygonData = data as Array<{ lat: number; lng: number }>;
      form.setValue("geofence_data", {
        coordinates: polygonData,
      }, { shouldDirty: true, shouldValidate: true });
      form.setValue("geofence_type", "polygon", { shouldDirty: true, shouldValidate: true });
    } else if (type === "radius") {
      // Type guard: ensure data is a number
      if (typeof data !== "number" || data === null) {
        return;
      }
      const radiusValue = data as number;
      const currentData = form.getValues("geofence_data");
      if (currentData && "center" in currentData && currentData.center) {
        form.setValue("geofence_data", {
          ...currentData,
          radius: Math.round(radiusValue),
        }, { shouldDirty: true, shouldValidate: true });
      }
    }
  };

  const handleGeofenceTypeChange = (type: "circular" | "polygon") => {
    form.setValue("geofence_type", type, { shouldDirty: true, shouldValidate: true });

    const currentData = form.getValues("geofence_data");
    const isDataValid = (data: any) => {
      if (!data) return false;
      if ("center" in data) return data.center && (data.center.lat !== 0 || data.center.lng !== 0);
      if ("coordinates" in data) return Array.isArray(data.coordinates) && data.coordinates.length > 0;
      return false;
    };

    if (type === "circular") {
      if (isDataValid(currentData) && currentData && "coordinates" in currentData && Array.isArray(currentData.coordinates)) {
        // Convert polygon to circular if valid
        const firstPoint = currentData.coordinates[0];
        form.setValue("geofence_data", {
          center: firstPoint,
          radius: 100,
        }, { shouldDirty: true, shouldValidate: true });
      } else {
        // Just clear data if no valid polygon to convert from
        form.setValue("geofence_data", null as any, { shouldDirty: true });
      }
    } else {
      if (isDataValid(currentData) && currentData && "center" in currentData && currentData.center) {
        // Convert circular to polygon if valid
        const { center, radius = 100 } = currentData;
        const offset = radius / 111000;
        form.setValue("geofence_data", {
          coordinates: [
            { lat: center.lat + offset, lng: center.lng + offset },
            { lat: center.lat + offset, lng: center.lng - offset },
            { lat: center.lat - offset, lng: center.lng - offset },
            { lat: center.lat - offset, lng: center.lng + offset },
          ],
        }, { shouldDirty: true, shouldValidate: true });
      } else {
        // Just clear data if no valid center to convert from
        form.setValue("geofence_data", null as any, { shouldDirty: true });
      }
    }
  };

  const currentGeofence = form.watch("geofence_data");
  const radius =
    geofenceType === "circular" && currentGeofence && "radius" in currentGeofence
      ? currentGeofence.radius
      : 100;
  const coordinates =
    geofenceType === "circular" && currentGeofence && "center" in currentGeofence
      ? currentGeofence.center
      : null;
  const polygon =
    geofenceType === "polygon" && currentGeofence && "coordinates" in currentGeofence
      ? currentGeofence.coordinates
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Ubicación en Mapa
        </h3>
        <div className="flex items-center gap-3">
          {/* Campo de Radio - Siempre visible, deshabilitado en modo polígono */}
          <FormField
            control={form.control}
            name="geofence_data.radius"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0 transition-all duration-300 animate-in fade-in">
                <FormLabel
                  className={`text-xs font-semibold uppercase tracking-tighter transition-colors ${geofenceType === "circular" ? "text-gray-500" : "text-gray-300"
                    }`}
                >
                  Radio (M)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={geofenceType === "circular" ? (field.value ?? 100) : ""}
                    disabled={geofenceType !== "circular" || !isEditing}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 100;
                      field.onChange(val);
                      // Also trigger geofence type update if needed (though usually handled by map)
                    }}
                    min={10}
                    placeholder={geofenceType === "circular" ? "" : "---"}
                    className={`w-20 h-8 text-xs transition-all ${geofenceType !== "circular"
                      ? "bg-gray-50 border-gray-100 text-transparent shadow-none"
                      : "bg-white border-gray-200 text-gray-900"
                      }`}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <LocationMap
        locationType={geofenceType === "circular" ? "point" : "polygon"}
        coordinates={coordinates}
        polygon={polygon}
        radius={radius}
        onLocationChange={handleGeofenceChange}
        onTypeChange={(type) => handleGeofenceTypeChange(type === "point" ? "circular" : "polygon")}
        readOnly={!isEditing}
        showDrawingToolbar={true}
      />
    </div>
  );
}
