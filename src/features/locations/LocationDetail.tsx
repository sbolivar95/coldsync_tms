import { PageHeader } from "../../layouts/PageHeader";
import { useState, useEffect, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GeneralTab } from "./GeneralTab";
import { DetailFooter } from "../../components/widgets/DetailFooter";
import { ScrollArea } from "../../components/ui/ScrollArea";
import { useFormChanges } from "../../hooks/useFormChanges";
import type { Location } from "../../types/database.types";
import {
  locationFormSchema,
  locationToFormData,
  type LocationFormDataWithString
} from "../../lib/schemas/location.schemas";
import { locationsService } from "../../services/database/locations.service";
import { useAppStore } from "../../stores/useAppStore";
import { toast } from "sonner";

interface LocationDetailProps {
  location?: Location | null;
  onBack: () => void;
  onSave?: (location: Location) => void;
  mode?: "edit" | "create";
}

export function LocationDetail({
  location,
  onBack,
  onSave,
  mode: propMode
}: LocationDetailProps) {
  const organization = useAppStore((state) => state.organization);
  const organizationId = organization?.id;

  const [activeTab, setActiveTab] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Store original values to detect changes
  const [originalData, setOriginalData] = useState<LocationFormDataWithString | null>(null);

  // Use provided mode or infer from location
  const mode = propMode || (location ? "edit" : "create");
  const [isEditing, setIsEditing] = useState(mode === "edit" || mode === "create");

  // Use ref to prevent duplicate form resets
  const loadedLocationIdRef = useRef<number | undefined>(undefined);

  // Single form instance for all tabs
  const form = useForm<LocationFormDataWithString>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      city: "",
      country_id: "",
      type_location_id: "",
      geofence_type: "circular",
      geofence_data: null,
      num_docks: 1,
      default_dwell_time_hours: 0,
      is_active: true,
    },
    mode: "onChange",
  });

  // Use hook for change detection
  const { hasChanges } = useFormChanges(form, originalData, mode);

  // Update isEditing when mode changes (consistent with other detail views)
  useEffect(() => {
    setIsEditing(mode === "edit" || mode === "create");
  }, [mode]);

  // Reset form when location changes - component always stays mounted
  // Only reset if it's a different location than the last one we initialized
  useEffect(() => {
    if (mode === "edit" && location) {
      // Only reset if it's a different location than the last one we initialized
      if (location.id !== loadedLocationIdRef.current) {
        const formData = locationToFormData(location as any);
        form.reset(formData);
        setOriginalData(formData);
        loadedLocationIdRef.current = location.id;
        setJustSaved(false);
      }
    } else if (mode === "create") {
      // Initialize with defaults for create mode - only once
      if (loadedLocationIdRef.current === undefined) {
        const defaultFormData: LocationFormDataWithString = {
          name: "",
          code: "",
          address: "",
          city: "",
          country_id: "",
          type_location_id: "",
          geofence_type: "circular",
          geofence_data: null,
          num_docks: 1,
          default_dwell_time_hours: 0,
          is_active: true,
        };
        form.reset(defaultFormData);
        setOriginalData(defaultFormData);
        loadedLocationIdRef.current = undefined; // Mark as initialized
      }
    }
  }, [location, form, mode]);

  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    if (!organizationId) {
      toast.error("No hay organización seleccionada");
      return;
    }

    setIsSubmitting(true);
    setJustSaved(false);

    try {
      const formData = form.getValues();

      const locationData = {
        name: formData.name,
        code: formData.code,
        address: formData.address,
        city: formData.city,
        country_id: parseInt(formData.country_id, 10),
        type_location_id: formData.type_location_id
          ? parseInt(formData.type_location_id, 10)
          : null,
        geofence_type: formData.geofence_type,
        geofence_data: formData.geofence_data,
        num_docks: formData.num_docks,
        default_dwell_time_hours: formData.default_dwell_time_hours,
        is_active: formData.is_active,
        org_id: organizationId
      };

      let result: Location;

      if (location?.id) {
        result = await locationsService.update(
          location.id,
          organizationId,
          locationData
        );
        toast.success("Ubicación actualizada correctamente");
        
        // Sync local state after save
        setOriginalData({ ...formData });
        setJustSaved(true);
        if (onSave) onSave(result);
        
        setTimeout(() => setJustSaved(false), 3000);
      } else {
        result = await locationsService.create(locationData);
        toast.success("Ubicación creada correctamente");
        
        // Call onSave callback to refresh list before navigating back
        if (onSave) onSave(result);
        onBack();
      }

      setTimeout(() => setJustSaved(false), 3000);
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Error al guardar la ubicación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onBack();
  };

  return (
    <FormProvider {...form}>
      <div className="flex flex-col h-full">
        <PageHeader
          tabs={[
            {
              id: "general",
              label: "General",
              active: activeTab === "general",
              onClick: () => setActiveTab("general"),
            },
          ]}
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 bg-gray-50 pb-24">
              <div className="max-w-6xl mx-auto">
                {/* Component always mounted - no skeletons, data updates silently */}
                <div className={activeTab === "general" ? "" : "hidden"}>
                  <GeneralTab isEditing={isEditing} />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Consistent Footer - Follows detail-views-pattern.md */}
        <DetailFooter
          onCancel={handleCancel}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          justSaved={justSaved}
          showFooter={isEditing}
          saveLabel={mode === "create" ? "Crear Ubicación" : "Guardar"}
        />
      </div>
    </FormProvider>
  );
}
