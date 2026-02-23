import { useParams, useNavigate } from "react-router-dom";
import { VehicleDetail } from "../../../features/fleet/entities/vehicles/VehicleDetail";
import { useAppStore } from "../../../stores/useAppStore";
import { vehiclesService } from "../../../services/database/vehicles.service";
import type { VehicleFormData } from "../../../lib/schemas/vehicle.schemas";
import { toast } from "sonner";
import { useCarriersBreadcrumbs } from "../../../hooks/useCarriersBreadcrumbs";
import { useFleetStore } from "../../../stores/useFleetStore";

export function VehicleCreatePage() {
    const { carrierId } = useParams<{ carrierId: string }>();
    const navigate = useNavigate();
    const organization = useAppStore((state) => state.organization);
    const loadVehicles = useFleetStore((state) => state.loadVehicles);

    // Auto-generate breadcrumbs
    useCarriersBreadcrumbs();

    const handleBack = () => {
        navigate(`/carriers/${carrierId}/fleet/vehicles`);
    };

    const handleSave = async (data: VehicleFormData) => {
        if (!organization?.id || !carrierId) {
            toast.error("No hay organización o transportista seleccionado");
            return;
        }

        try {
            // Extract reefer data if present (casted as any because Zod schema is strictly database-aligned for now)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { reefer_equipment, ...restData } = data as any;

            // Create vehicle with carrier_id and org_id
            const vehicleData = {
                ...restData,
                carrier_id: parseInt(carrierId),
                org_id: organization.id
            };

            await vehiclesService.createWithReefer(vehicleData, reefer_equipment);

            // Force refresh vehicles in store to update list view
            await loadVehicles(organization.id, true);

            toast.success("Vehículo creado correctamente");
            navigate(`/carriers/${carrierId}/fleet/vehicles`);
        } catch (error) {
            console.error("Error creating vehicle:", error);
            toast.error("Error al crear vehículo");
        }
    };

    return (
        <VehicleDetail
            vehicle={null}
            onBack={handleBack}
            onSave={handleSave}
            mode="create"
            carrierId={carrierId ? parseInt(carrierId) : undefined}
        />
    );
}
