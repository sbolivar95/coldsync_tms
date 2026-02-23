import { useParams, useNavigate, useLocation } from "react-router-dom";
import { VehicleDetail } from "../../../features/fleet/entities/vehicles/VehicleDetail";
import { useAppStore } from "../../../stores/useAppStore";
import { useState, useEffect } from "react";
import { vehiclesService } from "../../../services/database/vehicles.service";
import type { Vehicle, VehicleUpdate, ReeferEquipment } from "../../../types/database.types";
import type { VehicleFormData } from "../../../lib/schemas/vehicle.schemas";
import { toast } from "sonner";
import { useCarriersBreadcrumbs } from "../../../hooks/useCarriersBreadcrumbs";
import { useFleetStore } from "../../../stores/useFleetStore";

export function VehicleDetailPage() {
    const { carrierId, vehicleId } = useParams<{ carrierId: string; vehicleId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const organization = useAppStore((state) => state.organization);
    const loadVehicles = useFleetStore((state) => state.loadVehicles);

    // Initialize with data from navigation state if available
    const [vehicle, setVehicle] = useState<Vehicle | null>(() => {
        return location.state?.initialData || null;
    });

    const [reeferData, setReeferData] = useState<ReeferEquipment | null>(null);

    // Auto-generate breadcrumbs
    useCarriersBreadcrumbs({
        vehiclePlate: vehicle?.plate
    });

    // Load vehicle data
    useEffect(() => {
        if (!vehicleId || !organization?.id) {
            return;
        }

        // Check if we already have the correct vehicle data
        // Note: We might want to re-fetch to get reefer data if we only have list data
        if (vehicle && vehicle.id === vehicleId && reeferData !== null) {
            return;
        }

        const loadVehicle = async () => {
            try {
                // Use getWithReefer to fetch both vehicle and its equipment
                const { vehicle: vData, reefer: rData } = await vehiclesService.getWithReefer(vehicleId, organization.id);

                if (!vData) {
                    toast.error("Vehículo no encontrado");
                    navigate(`/carriers/${carrierId}/fleet/vehicles`);
                    return;
                }

                setVehicle(vData);
                setReeferData(rData);
            } catch (error) {
                console.error("Error loading vehicle:", error);
                toast.error("Error al cargar vehículo");
                navigate(`/carriers/${carrierId}/fleet/vehicles`);
            }
        };

        loadVehicle();
    }, [vehicleId, organization?.id, carrierId, navigate]); // Removed vehicle/reeferData dependencies to avoid loop, trust checks inside

    const handleBack = () => {
        navigate(`/carriers/${carrierId}/fleet/vehicles`);
    };

    const handleSave = async (data: VehicleFormData) => {
        if (!organization?.id || !vehicle) {
            toast.error("No hay organización seleccionada");
            return;
        }

        try {
            // Extract reefer data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { reefer_equipment, ...restData } = data as any;

            await vehiclesService.updateWithReefer(
                vehicle.id,
                organization.id,
                restData as unknown as VehicleUpdate,
                reefer_equipment
            );

            // Force refresh vehicles in store to update list view
            await loadVehicles(organization.id, true);

            toast.success("Vehículo actualizado correctamente");
            navigate(`/carriers/${carrierId}/fleet/vehicles`);
        } catch (error) {
            console.error("Error saving vehicle:", error);
            toast.error("Error al actualizar vehículo");
        }
    };

    return (
        <VehicleDetail
            vehicle={vehicle}
            reeferData={reeferData}
            onBack={handleBack}
            onSave={handleSave}
            mode="edit"
        />
    );
}
