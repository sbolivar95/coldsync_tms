import { useNavigate, useParams } from "react-router-dom";
import { DriverDetail } from "../../../features/fleet/entities/drivers/DriverDetail";
import { useAppStore } from "../../../stores/useAppStore";
import { driversService } from "../../../services/database/drivers.service";
import type { DriverInsert } from "../../../types/database.types";
import type { DriverFormData } from "../../../lib/schemas/driver.schemas";
import { toast } from "sonner";
import { useCarriersBreadcrumbs } from "../../../hooks/useCarriersBreadcrumbs";

export function DriverCreatePage() {
    const { carrierId } = useParams<{ carrierId: string }>();
    const navigate = useNavigate();
    const organization = useAppStore((state) => state.organization);

    // Auto-generate breadcrumbs
    useCarriersBreadcrumbs();

    const handleBack = () => {
        navigate(`/carriers/${carrierId}/fleet/drivers`);
    };

    const handleSave = async (data: DriverFormData) => {
        if (!organization?.id || !carrierId) {
            toast.error("Faltan datos de organización o transportista");
            return;
        }

        try {
            // Transform FormData to DriverInsert
            const newDriver: DriverInsert = {
                ...data,
                // Ensure types match what DB expects
                org_id: organization.id,
                carrier_id: parseInt(carrierId),
                nationality: Number(data.nationality),
                email: data.email || "", // Handle optional email
                // Handle optional/date conversions if necessary
                birth_date: data.birth_date,
                contract_date: data.contract_date,
            };

            await driversService.create(newDriver);
            toast.success("Conductor creado correctamente");

            // Navigation handled by DriverDetail on success call of onSave usually,
            // but here we might rely on handleSave completing successfully.
        } catch (error) {
            console.error("Error creating driver:", error);
            toast.error("Error al crear conductor");
            throw error; // Propagate to stops isSubmitting in child
        }
    };

    return (
        <DriverDetail
            driver={null}
            onBack={handleBack}
            onSave={handleSave}
            mode="create"
            carrierId={carrierId ? parseInt(carrierId) : undefined}
        />
    );
}
