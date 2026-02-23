import { PageHeader } from "../../../../layouts/PageHeader";
import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrailerGeneralTab } from "./tabs/TrailerGeneralTab";
import { TrailerSpecificationsTab } from "./tabs/TrailerSpecificationsTab";
import { ScrollArea } from "../../../../components/ui/ScrollArea";
import { DetailFooter } from "../../../../components/widgets/DetailFooter";
import { useFormChanges } from "../../../../hooks/useFormChanges";
import { toast } from "sonner";
import type { Trailer, ReeferEquipment } from "../../../../types/database.types";
import type { TrailerFormData, TrailerReeferSpecsFormData, TrailerCompleteFormData } from "../../../../lib/schemas/trailer.schemas";
import { trailerCompleteSchema } from "../../../../lib/schemas/trailer.schemas";
import { trailerReeferSpecsService } from "../../../../services/database/trailers.service";
import { useAppStore } from "../../../../stores/useAppStore";

interface TrailerDetailProps {
  trailer: Trailer | null; // null for create mode
  onBack: () => void;
  onSave: (data: TrailerFormData, reeferSpecs?: TrailerReeferSpecsFormData) => Promise<void>;
  mode?: "view" | "edit" | "create";
  carrierId?: number; // Required for create mode
}

export function TrailerDetail({
  trailer,
  onBack,
  onSave,
  mode = "view",
  carrierId
}: TrailerDetailProps) {
  const organization = useAppStore((state) => state.organization);
  const [activeTab, setActiveTab] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reeferSpecs, setReeferSpecs] = useState<ReeferEquipment | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [originalData, setOriginalData] = useState<TrailerCompleteFormData | null>(null);

  // Mode effect removed to enforce always-edit state

  // Single form instance shared across all tabs
  const form = useForm<TrailerCompleteFormData>({
    resolver: zodResolver(trailerCompleteSchema) as any,
    defaultValues: {
      code: "",
      plate: "",
      transport_capacity_weight_tn: 0,
      volume_m3: 0,
      tare_weight_tn: 0,
      length_m: 0,
      width_m: 0,
      height_m: 0,
      supports_multi_zone: false,
      compartments: 1,
      insulation_thickness_cm: null,
      notes: null,
      operational_status: "ACTIVE",
      carrier_id: carrierId || 0,
      // Reefer specs defaults
      power_type: undefined,
      reefer_hours: null,
      diesel_capacity_l: null,
      consumption_lph: null,
      brand: null,
      model: null,
      year: null,
      temp_min_c: null,
      temp_max_c: null,
    },
  });

  // Use hook for change detection
  const { hasChanges } = useFormChanges(form, originalData, mode);

  // Load reefer specs when trailer is available
  useEffect(() => {
    const loadReeferSpecs = async () => {
      if (trailer?.id && organization?.id) {
        try {
          const specs = await trailerReeferSpecsService.getByTrailerId(
            trailer.id,
            organization.id
          );
          setReeferSpecs(specs);
        } catch (error) {
          console.error("Error loading reefer specs:", error);
          setReeferSpecs(null);
        }
      } else {
        setReeferSpecs(null);
      }
    };

    loadReeferSpecs();
  }, [trailer?.id, organization?.id]);

  // Reset form when trailer or reefer specs change
  useEffect(() => {
    if (trailer) {
      const newFormData: TrailerCompleteFormData = {
        code: trailer.code || "",
        plate: trailer.plate || "",
        transport_capacity_weight_tn: trailer.transport_capacity_weight_tn || 0,
        volume_m3: trailer.volume_m3 || 0,
        tare_weight_tn: trailer.tare_weight_tn || 0,
        length_m: trailer.length_m || 0,
        width_m: trailer.width_m || 0,
        height_m: trailer.height_m || 0,
        supports_multi_zone: trailer.supports_multi_zone || false,
        compartments: trailer.compartments || 1,
        insulation_thickness_cm: trailer.insulation_thickness_cm || null,
        notes: trailer.notes || null,
        operational_status: trailer.operational_status || "ACTIVE",
        carrier_id: carrierId || (trailer as any)?.carrier_id || 0,
        // Reefer specs
        power_type: reeferSpecs?.power_type || undefined,
        reefer_hours: reeferSpecs?.reefer_hours || null,
        diesel_capacity_l: reeferSpecs?.diesel_capacity_l || null,
        consumption_lph: reeferSpecs?.consumption_lph || null,
        brand: reeferSpecs?.brand || null,
        model: reeferSpecs?.model || null,
        year: reeferSpecs?.year || null,
        temp_min_c: reeferSpecs?.temp_min_c ?? null,
        temp_max_c: reeferSpecs?.temp_max_c ?? null,
      };

      form.reset(newFormData);
      setOriginalData(newFormData);
      setJustSaved(false);
    } else if (carrierId) {
      const newFormData = {
        ...form.getValues(),
        carrier_id: carrierId,
      };
      form.reset(newFormData);
      setOriginalData(newFormData);
      setJustSaved(false);
    }
  }, [trailer, reeferSpecs, carrierId, form]);

  const handleSave = async () => {
    const isValid = await form.trigger(); // Trigger validation for all fields
    if (!isValid) {
      // Find first tab with errors
      const errors = form.formState.errors;
      const hasGeneralErrors = Object.keys(errors).some(
        key => !['power_type', 'reefer_hours', 'diesel_capacity_l', 'consumption_lph',
          'brand', 'model', 'year', 'temp_min_c', 'temp_max_c'].includes(key)
      );

      if (hasGeneralErrors) {
        setActiveTab("general");
      } else {
        setActiveTab("especificaciones");
      }

      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setIsSubmitting(true);
    setJustSaved(false);

    try {
      const formData = form.getValues();

      // Extract trailer data (exclude reefer specs fields)
      const trailerData: TrailerFormData = {
        code: formData.code,
        plate: formData.plate,
        transport_capacity_weight_tn: formData.transport_capacity_weight_tn,
        volume_m3: formData.volume_m3,
        tare_weight_tn: formData.tare_weight_tn,
        length_m: formData.length_m,
        width_m: formData.width_m,
        height_m: formData.height_m,
        supports_multi_zone: formData.supports_multi_zone,
        compartments: formData.compartments,
        insulation_thickness_cm: formData.insulation_thickness_cm,
        notes: formData.notes,
        operational_status: formData.operational_status,
        carrier_id: formData.carrier_id,
      };

      // Extract reefer specs data (only if any field is provided)
      const hasReeferSpecs = formData.power_type !== undefined ||
        formData.reefer_hours !== null ||
        formData.diesel_capacity_l !== null ||
        formData.consumption_lph !== null ||
        formData.brand !== null ||
        formData.model !== null ||
        formData.year !== null ||
        formData.temp_min_c !== null ||
        formData.temp_max_c !== null;

      const reeferSpecsData: TrailerReeferSpecsFormData | undefined = hasReeferSpecs ? {
        power_type: formData.power_type,
        reefer_hours: formData.reefer_hours,
        diesel_capacity_l: formData.diesel_capacity_l,
        consumption_lph: formData.consumption_lph,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        temp_min_c: formData.temp_min_c ?? undefined,
        temp_max_c: formData.temp_max_c ?? undefined,
      } : undefined;

      // Save both forms together
      await onSave(trailerData, reeferSpecsData);

      // Update original data to reflect saved state
      setOriginalData({ ...formData });
      setJustSaved(true);

      // Clear the "just saved" indicator after 3 seconds
      setTimeout(() => setJustSaved(false), 3000);
    } catch (error) {
      console.error("Error saving trailer:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error al guardar el remolque';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Always go back to list when canceling
    onBack();
  };

  return (
    <FormProvider {...form}>
      <div className="flex flex-col h-full">
        <PageHeader
          tabs={[
            { id: "general", label: "General", active: activeTab === "general", onClick: () => setActiveTab("general") },
            { id: "especificaciones", label: "Especificaciones", active: activeTab === "especificaciones", onClick: () => setActiveTab("especificaciones") },
          ]}
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 bg-gray-50 pb-24">
              <div className="max-w-6xl mx-auto">
                {/* Render both tabs but hide inactive one to preserve form state */}
                <div className={activeTab === "general" ? "" : "hidden"}>
                  <TrailerGeneralTab />
                </div>

                <div className={activeTab === "especificaciones" ? "" : "hidden"}>
                  <TrailerSpecificationsTab />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <DetailFooter
          onCancel={handleCancel}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          justSaved={justSaved}
          showFooter={true}
        />
      </div>
    </FormProvider>
  );
}

