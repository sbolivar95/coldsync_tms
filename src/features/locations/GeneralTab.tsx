import { useState, useMemo, memo } from "react";
import { useFormContext } from "react-hook-form";
import { Card } from "../../components/ui/Card";
import { Textarea } from "../../components/ui/Textarea";
import { Alert, AlertDescription } from "../../components/ui/Alert";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/Form";
import { Info } from "lucide-react";
import type { LocationFormDataWithString } from "../../lib/schemas/location.schemas";
import { useAppStore } from "../../stores/useAppStore";
import { LocationGeofenceSection } from "./LocationGeofenceSection";
import { LocationTypeManagerDialog } from "./components/LocationTypeManagerDialog";
import { type StopType } from "./components/locationType.types";
import { LocationFormFields } from "./components/LocationFormFields";
import { useCountries } from "./hooks/useCountries";
import { useLocationTypes } from "./hooks/useLocationTypes";

interface GeneralTabProps {
  isEditing?: boolean;
}

export const GeneralTab = memo(function GeneralTab({ isEditing = true }: GeneralTabProps) {
  const { control, watch } = useFormContext<LocationFormDataWithString>();
  const organization = useAppStore((state) => state.organization);
  const organizationId = organization?.id;

  const [showLocationTypeManager, setShowLocationTypeManager] = useState(false);

  // Custom hooks for data loading
  const { countries, loading: loadingCountries } = useCountries();
  const {
    locationTypes,
    locationTypesData,
    loading: loadingLocationTypes,
    createLocationType,
    updateLocationType,
    deleteLocationType
  } = useLocationTypes(organizationId);

  const geofenceType = watch("geofence_type");

  // Get current geofence data based on type
  const currentGeofenceData = useMemo(() => {
    const data = watch("geofence_data");
    if (geofenceType === "circular") {
      return data as { center: { lat: number; lng: number }; radius: number };
    } else {
      return data as { coordinates: Array<{ lat: number; lng: number }> };
    }
  }, [watch("geofence_data"), geofenceType]);

  // Available stop types for location type manager
  const allowedStopTypes: StopType[] = ['PICKUP', 'DROP_OFF', 'MANDATORY_WAYPOINT', 'OPTIONAL_WAYPOINT'];

  return (
    <div className="space-y-6">
      {/* Formulario Principal */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Grid de 4 columnas con campos alineados verticalmente */}
          <LocationFormFields
            countries={countries}
            locationTypes={locationTypes}
            loadingCountries={loadingCountries}
            loadingLocationTypes={loadingLocationTypes}
            onShowLocationTypeManager={() => setShowLocationTypeManager(true)}
          />

          <FormField
            control={control}
            name="address"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-xs text-gray-600">
                  Dirección Completa <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Av. Industrial 1234, Sector Norte"
                    rows={2}
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <div className="border-t border-gray-200 my-6"></div>

          <LocationGeofenceSection currentGeofenceData={currentGeofenceData} isEditing={isEditing} />
        </div>
      </Card>

      <Alert className="bg-primary-light border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-primary">
          Una vez guardada, esta ubicación podrá ser asignada a despachos, vehículos y rutas en el sistema.
        </AlertDescription>
      </Alert>

      {/* Location Type Manager Dialog */}
      {showLocationTypeManager && (
        <LocationTypeManagerDialog
          locationTypes={locationTypesData}
          allowedStopTypes={allowedStopTypes}
          onClose={() => setShowLocationTypeManager(false)}
          onCreate={createLocationType}
          onUpdate={updateLocationType}
          onDelete={deleteLocationType}
          loading={loadingLocationTypes}
        />
      )}
    </div>
  );
});