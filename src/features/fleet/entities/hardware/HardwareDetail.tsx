import { PageHeader } from "../../../../layouts/PageHeader";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { connectionDeviceSchema, type ConnectionDeviceFormData } from "../../../../lib/schemas/hardware.schemas";
import type { ConnectionDevice } from "../../../../types/database.types";
import { hardwareService, vehiclesService, trailersService } from "../../../../services/database";
import { carriersService } from "../../../../services/database/carriers.service";
import { toast } from "sonner";
import { HardwareGeneralForm } from "./components/HardwareGeneralForm";
import { DetailFooter } from "../../../../components/widgets/DetailFooter";
import { useFormChanges } from "../../../../hooks/useFormChanges";
import { useFleetStore } from "../../../../stores/useFleetStore";
import { useShallow } from 'zustand/react/shallow';
import { useState, useEffect, useMemo } from "react";
import { ScrollArea } from "../../../../components/ui/ScrollArea";

interface HardwareDetailProps {
  connectionDevice: ConnectionDevice | null; // null for create mode
  organizationId: string;
  onBack: () => void;
  onSuccess: () => void;
  carrierId?: number;
  mode?: "view" | "edit" | "create";
}

export function HardwareDetail({
  connectionDevice,
  organizationId,
  onBack,
  onSuccess,
  carrierId,
  mode = "edit",
}: HardwareDetailProps) {
  const [isEditing, setIsEditing] = useState(mode === "edit" || mode === "create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [originalData, setOriginalData] = useState<ConnectionDeviceFormData | null>(null);
  const [carriers, setCarriers] = useState<Array<{ value: string; label: string }>>([]);

  // Update isEditing when mode changes
  useEffect(() => {
    setIsEditing(mode === "edit" || mode === "create");
  }, [mode]);

  // Fleet data for assignment
  const { vehicles, loadVehicles, trailers, loadTrailers, telematicsProviders, loadTelematicsProviders } = useFleetStore(
    useShallow((state) => ({
      vehicles: state.vehicles,
      loadVehicles: state.loadVehicles,
      trailers: state.trailers,
      loadTrailers: state.loadTrailers,
      telematicsProviders: state.telematicsProviders,
      loadTelematicsProviders: state.loadTelematicsProviders
    }))
  );

  // Single form instance
  const form = useForm<ConnectionDeviceFormData>({
    resolver: zodResolver(connectionDeviceSchema) as any,
    defaultValues: {
      provider: null,
      flespi_device_type_id: undefined,
      tracked_entity_type: null,
      ident: '',
      phone_number: null,
      serial: null,
      notes: null,
      carrier_id: carrierId ? carrierId.toString() : undefined as any,
      assigned_entity_id: null,
    },
  });

  // Use hook for change detection
  const { hasChanges } = useFormChanges(form, originalData, mode);

  // Load options from database (without loading states that dismount)
  useEffect(() => {
    if (!organizationId) return;

    const loadOptions = async () => {
      try {
        await Promise.all([
          carriersService.getAll(organizationId).then(data => {
            setCarriers(
              data.map((carrier) => ({
                value: carrier.id.toString(),
                label: carrier.commercial_name,
              }))
            );
          }),
          loadVehicles(organizationId),
          loadTrailers(organizationId),
          loadTelematicsProviders(organizationId)
        ]);
      } catch (error) {
        console.error('Error loading options:', error);
        toast.error('Error al cargar opciones');
      }
    };

    loadOptions();
  }, [organizationId, carrierId, loadVehicles, loadTrailers, loadTelematicsProviders]); // Removed watchedCarrierId

  // Reset form when entity changes
  useEffect(() => {
    if (connectionDevice) {
      const newFormData: any = {
        provider: connectionDevice.provider ? connectionDevice.provider.toString() : null,
        flespi_device_type_id: connectionDevice.flespi_device_type_id ? connectionDevice.flespi_device_type_id.toString() : undefined,
        tracked_entity_type: connectionDevice.tracked_entity_type || null,
        ident: connectionDevice.ident,
        phone_number: connectionDevice.phone_number || null,
        serial: connectionDevice.serial || null,
        notes: connectionDevice.notes || null,
        carrier_id: connectionDevice.carrier_id ? connectionDevice.carrier_id.toString() : undefined,
        assigned_entity_id: null, // Hardwares don't store assignment directly, it's a virtual form field
      };
      form.reset(newFormData);
      setOriginalData(newFormData);
      setJustSaved(false);
    } else {
      // Create mode - Only reset if we don't have originalData yet
      if (!originalData) {
        const newFormData: any = {
          provider: null,
          flespi_device_type_id: undefined,
          tracked_entity_type: null,
          ident: '',
          phone_number: null,
          serial: null,
          notes: null,
          carrier_id: carrierId ? carrierId.toString() : undefined,
          assigned_entity_id: null,
        };
        form.reset(newFormData);
        setOriginalData(newFormData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionDevice, carrierId]);

  const handleSave = async () => {
    // Manually trigger validation
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    const data = form.getValues();

    if (!organizationId) {
      toast.error('No hay organización seleccionada');
      return;
    }

    setIsSubmitting(true);
    setJustSaved(false);

    try {
      // 1. Validate Required Fields
      if (!data.carrier_id) {
        toast.error('El transportista es requerido');
        return;
      }

      if (!data.flespi_device_type_id) {
        toast.error('El modelo de dispositivo es requerido');
        return;
      }

      // 2. Prepare Data
      const deviceData = {
        org_id: organizationId,
        carrier_id: data.carrier_id,
        ident: data.ident,
        provider: data.provider || null,
        flespi_device_type_id: data.flespi_device_type_id,
        phone_number: data.phone_number || null,
        serial: data.serial || null,
        notes: data.notes || null,
        tracked_entity_type: data.tracked_entity_type || null
      };

      let deviceId = connectionDevice?.id;

      // 3. Save Connection Device
      if (connectionDevice) {
        await hardwareService.updateConnectionDevice(connectionDevice.id, organizationId, deviceData);
        toast.success('Dispositivo actualizado correctamente');
      } else {
        const newDevice = await hardwareService.createConnectionDevice(deviceData);
        deviceId = newDevice.id;
        toast.success('Dispositivo creado correctamente');
      }

      // 4. Handle Immediate Assignment (Vehicle-First Logic)
      if (deviceId && data.assigned_entity_id && data.tracked_entity_type) {
        if (data.tracked_entity_type === 'VEHICLE') {
          await vehiclesService.update(data.assigned_entity_id, organizationId, {
            connection_device_id: deviceId
          });
          toast.success('Vinculado a vehículo exitosamente');
        } else if (data.tracked_entity_type === 'TRAILER') {
          await trailersService.update(data.assigned_entity_id, organizationId, {
            connection_device_id: deviceId
          });
          toast.success('Vinculado a remolque exitosamente');
        }
      }

      // Update original data to reflect saved state
      setOriginalData({ ...data });
      setJustSaved(true);

      onSuccess();
      onBack();

      setTimeout(() => setJustSaved(false), 3000);

    } catch (error) {
      console.error("Error saving connection device:", error);
      toast.error('Error al guardar dispositivo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Always navigate back to list as requested by user
    if (mode === "create" || isEditing) {
      onBack();
    } else {
      // If in view mode (future feature), maybe just exit?
      // Currently mode is always edit or create in DetailPage.
      onBack();
    }
  };

  // Options
  const vehicleOptions = useMemo(() => vehicles.map(v => ({
    value: v.id.toString(),
    label: `${v.unit_code} ${v.plate ? `(${v.plate})` : ''}`
  })), [vehicles]);

  const trailerOptions = useMemo(() => trailers.map(t => ({
    value: t.id.toString(),
    label: `${t.unit_code} ${t.plate ? `(${t.plate})` : ''}`
  })), [trailers]);

  return (
    <FormProvider {...form}>
      <div className="flex flex-col h-full">
        <PageHeader
          tabs={[
            { id: "general", label: "General", active: true, onClick: () => { } },
          ]}
        />

        {/* Content - Always mounted, no loading states that dismount */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 bg-gray-50 pb-24">
              <div className="max-w-6xl mx-auto">
                <HardwareGeneralForm
                  carriers={carriers}
                  telematicsProviders={telematicsProviders.map(p => ({ value: p.id.toString(), label: p.name }))}
                  vehicleOptions={vehicleOptions}
                  trailerOptions={trailerOptions}
                  loadingOptions={false}
                  carrierId={carrierId}
                />
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
          showFooter={isEditing}
        />
      </div>
    </FormProvider>
  );
}
