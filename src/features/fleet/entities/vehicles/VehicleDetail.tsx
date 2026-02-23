import { PageHeader } from "../../../../layouts/PageHeader";
import { useState, useEffect, useRef } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "../../../../components/ui/ScrollArea";
import { DetailFooter } from "../../../../components/widgets/DetailFooter";
import { useFormChanges } from "../../../../hooks/useFormChanges";
import { toast } from "sonner";
import { VehicleGeneralTab } from "./tabs/VehicleGeneralTab";
import { VehicleSpecificationsTab } from "./tabs/VehicleSpecificationsTab";
import type { Vehicle, FleetSet, ReeferEquipment } from "../../../../types/database.types";
import { vehicleSchema, type VehicleFormData } from "../../../../lib/schemas/vehicle.schemas";
import { fleetSetsService } from "../../../../services/database";
import { useAuth } from "../../../../hooks/useAuth";

interface VehicleDetailProps {
  vehicle: Vehicle | null; // null for create mode
  reeferData?: ReeferEquipment | null;
  onBack: () => void;
  onSave: (data: VehicleFormData) => Promise<void>;
  mode?: "view" | "edit" | "create";
  carrierId?: number;
}

export function VehicleDetail({
  vehicle,
  reeferData,
  onBack,
  onSave,
  mode = "view",
  carrierId,
}: VehicleDetailProps) {
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [originalData, setOriginalData] = useState<VehicleFormData | null>(null);
  const [showSpecificationsTab, setShowSpecificationsTab] = useState(false);

  // Fleet assignment state (moved from tab to parent)
  const [currentAssignment, setCurrentAssignment] = useState<FleetSet | null>(null);
  const loadedVehicleIdRef = useRef<string | null>(null);

  // Single form instance shared across all tabs
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: {
      unit_code: vehicle?.unit_code || "",
      vehicle_type: vehicle?.vehicle_type || "",
      plate: vehicle?.plate || "",
      brand: vehicle?.brand || "",
      model: vehicle?.model || "",
      year: vehicle?.year || new Date().getFullYear(),
      vin: vehicle?.vin || undefined,
      odometer_value: vehicle?.odometer_value ?? 0,
      odometer_unit: vehicle?.odometer_unit || "km",
      additional_info: vehicle?.additional_info || "",
      connection_device_id: vehicle?.connection_device_id || null,
      operational_status: vehicle?.operational_status || "ACTIVE",
      carrier_id: (carrierId || vehicle?.carrier_id) ?? 0,
      // Capacity Fields
      transport_capacity_weight_tn: vehicle?.transport_capacity_weight_tn ?? null,
      volume_m3: vehicle?.volume_m3 ?? null,
      tare_weight_tn: vehicle?.tare_weight_tn ?? null,
      length_m: vehicle?.length_m ?? null,
      width_m: vehicle?.width_m ?? null,
      height_m: vehicle?.height_m ?? null,
      insulation_thickness_cm: vehicle?.insulation_thickness_cm ?? null,
      compartments: vehicle?.compartments ?? 1,
      supports_multi_zone: vehicle?.supports_multi_zone ?? false,
      load_capacity_type: vehicle?.load_capacity_type ?? null,
      load_capacity_quantity: vehicle?.load_capacity_quantity ?? null,
      // Reefer Data - Initialize as object with proper structure or null
      reefer_equipment: (reeferData ? {
        brand: reeferData.brand || null,
        model: reeferData.model || null,
        year: reeferData.year || null,
        serial_number: reeferData.serial_number || null,
        power_type: reeferData.power_type || null,
        reefer_hours: reeferData.reefer_hours || null,
        diesel_capacity_l: reeferData.diesel_capacity_l || null,
        consumption_lph: reeferData.consumption_lph || null,
        temp_min_c: reeferData.temp_min_c || null,
        temp_max_c: reeferData.temp_max_c || null,
      } : null),
    },
  });

  // Watch vehicle type to conditionally show specifications tab
  const vehicleType = useWatch({ control: form.control, name: 'vehicle_type' });
  // RIGID and VAN are load carriers that can have reefer equipment
  const isLoadCarrier = ['RIGID', 'VAN'].includes(vehicleType);

  // Update showSpecificationsTab when vehicle type changes
  useEffect(() => {
    setShowSpecificationsTab(isLoadCarrier);
    // If vehicle type is not a load carrier and we're on specifications tab, switch to general
    if (!isLoadCarrier && activeTab === 'especificaciones') {
      setActiveTab('general');
    }
  }, [isLoadCarrier, activeTab]);

  // Use hook for change detection
  const { hasChanges } = useFormChanges(form as any, originalData, mode);

  // Load fleet assignment when vehicle changes
  useEffect(() => {
    // Skip if no vehicle or organization
    if (!vehicle?.id || !organization?.id) {
      setCurrentAssignment(null);
      loadedVehicleIdRef.current = null;
      return;
    }

    // Skip if we've already loaded this vehicle's assignment
    if (loadedVehicleIdRef.current === vehicle.id) {
      return;
    }

    const fetchAssignment = async () => {
      try {
        const assignment = await fleetSetsService.getCurrentByVehicle(
          organization.id,
          vehicle.id
        );
        setCurrentAssignment(assignment);
        loadedVehicleIdRef.current = vehicle.id;
      } catch (error) {
        console.error("Error fetching vehicle assignment:", error);
        setCurrentAssignment(null);
      }
    };

    fetchAssignment();
  }, [vehicle?.id, organization?.id]);

  // Reset form when vehicle or reeferData changes
  useEffect(() => {
    if (vehicle) {
      const newFormData: VehicleFormData = {
        unit_code: vehicle.unit_code || "",
        vehicle_type: vehicle.vehicle_type || "",
        plate: vehicle.plate || "",
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        year: vehicle.year || new Date().getFullYear(),
        vin: vehicle.vin || undefined,
        odometer_value: vehicle.odometer_value ?? 0,
        odometer_unit: vehicle.odometer_unit || "km",
        additional_info: vehicle.additional_info || "",
        connection_device_id: vehicle.connection_device_id || null,
        operational_status: vehicle.operational_status || "ACTIVE",
        carrier_id: (carrierId || vehicle.carrier_id) ?? 0,
        // Capacity Fields
        transport_capacity_weight_tn: vehicle.transport_capacity_weight_tn ?? null,
        volume_m3: vehicle.volume_m3 ?? null,
        tare_weight_tn: vehicle.tare_weight_tn ?? null,
        length_m: vehicle.length_m ?? null,
        width_m: vehicle.width_m ?? null,
        height_m: vehicle.height_m ?? null,
        insulation_thickness_cm: vehicle.insulation_thickness_cm ?? null,
        compartments: vehicle.compartments ?? 1,
        supports_multi_zone: vehicle.supports_multi_zone ?? false,
        load_capacity_type: vehicle.load_capacity_type ?? null,
        load_capacity_quantity: vehicle.load_capacity_quantity ?? null,
        // Reefer Data - Initialize as object with proper structure or null
        reefer_equipment: (reeferData ? {
          brand: reeferData.brand || null,
          model: reeferData.model || null,
          year: reeferData.year || null,
          serial_number: reeferData.serial_number || null,
          power_type: reeferData.power_type || null,
          reefer_hours: reeferData.reefer_hours || null,
          diesel_capacity_l: reeferData.diesel_capacity_l || null,
          consumption_lph: reeferData.consumption_lph || null,
          temp_min_c: reeferData.temp_min_c || null,
          temp_max_c: reeferData.temp_max_c || null,
        } : null),
      };
      form.reset(newFormData);
      setOriginalData(newFormData);
      setJustSaved(false);
    } else if (carrierId && mode === "create") {
      // Init with carrierId if new
      const newFormData = {
        ...form.getValues(),
        carrier_id: carrierId,
      };
      form.reset(newFormData);
    }
  }, [vehicle, carrierId, form, mode, reeferData]);

  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setIsSubmitting(true);
    setJustSaved(false);

    try {
      const formData = form.getValues();
      
      // Clean up reefer_equipment: remove empty object or convert to null
      // This prevents validation errors with empty objects
      if (formData.reefer_equipment && typeof formData.reefer_equipment === 'object') {
        const hasValues = Object.values(formData.reefer_equipment).some(
          (val) => val !== null && val !== undefined && val !== ''
        );
        if (!hasValues) {
          formData.reefer_equipment = null;
        }
      } else if (!formData.reefer_equipment) {
        formData.reefer_equipment = null;
      }
      
      await onSave(formData);

      // Update original data to reflect saved state
      setOriginalData({ ...formData });
      setJustSaved(true);

      // We don't need to show toast here as parent handles it
      // toast.success("Vehicle saved successfully");

      onBack();

      setTimeout(() => setJustSaved(false), 3000);
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error("Error al guardar el vehículo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onBack();
  };

  // Build tabs array conditionally
  const tabs = [
    {
      id: "general",
      label: "General",
      active: activeTab === "general",
      onClick: () => setActiveTab("general"),
    },
  ];

  if (showSpecificationsTab) {
    tabs.push({
      id: "especificaciones",
      label: "Especificaciones",
      active: activeTab === "especificaciones",
      onClick: () => setActiveTab("especificaciones"),
    });
  }

  return (
    <FormProvider {...form}>
      <div className="flex flex-col h-full">
        <PageHeader tabs={tabs} />

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 bg-gray-50 pb-24">
              <div className="max-w-6xl mx-auto">
                {/* Render both tabs but hide inactive one to preserve form state */}
                <div className={activeTab === "general" ? "" : "hidden"}>
                  <VehicleGeneralTab
                    vehicle={vehicle}
                    carrierId={carrierId}
                    currentAssignment={currentAssignment}
                  />
                </div>

                {showSpecificationsTab && (
                  <div className={activeTab === "especificaciones" ? "" : "hidden"}>
                    <VehicleSpecificationsTab />
                  </div>
                )}
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

