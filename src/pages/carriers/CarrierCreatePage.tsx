import { useNavigate, useLocation } from "react-router-dom";
import { CarrierDetail } from "../../features/carriers/CarrierDetail";
import { useAppStore } from "../../stores/useAppStore";
import { carriersService } from "../../services/database/carriers.service";
import { toast } from "sonner";
import type { CarrierFormData } from "../../lib/schemas/carrier.schemas";
import { useCarriers } from "../../features/carriers/hooks/useCarriers";
import { useEffect } from "react";

export function CarrierCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const organization = useAppStore((state) => state.organization);
    const { setBreadcrumbs } = useAppStore();
    const { loadCarriers } = useCarriers(organization?.id);

    useEffect(() => {
        // Set breadcrumbs
        setBreadcrumbs(location.pathname, [
            {
                label: "Nuevo Transportista",
                onClick: undefined
            }
        ]);
    }, []);

    const handleBack = () => {
        navigate("/carriers");
        setBreadcrumbs(location.pathname, []);
    };

    const handleSave = async (data: CarrierFormData) => {
        if (!organization?.id) {
            toast.error("No hay organización seleccionada");
            return;
        }

        try {
            const newCarrier = await carriersService.create({
                ...data,
                org_id: organization.id,
                is_active: true,
                contract_expires_at: data.contract_expires_at || null,
                contract_number: data.contract_number || null,
                currency: data.currency || null,
                bank_name: data.bank_name || null,
                bank_account_number: data.bank_account_number || null,
                bank_cci_swift: data.bank_cci_swift || null,
            });
            toast.success("Transportista creado correctamente");
            await loadCarriers(true);

            // Navigate to the new carrier detail
            navigate(`/carriers/${newCarrier.id}`);
        } catch (error) {
            console.error("Error creating carrier:", error);
            toast.error("Error al crear transportista");
        }
    };

    return (
        <CarrierDetail
            carrier={null}
            onBack={handleBack}
            onSave={handleSave}
            mode="create"
        />
    );
}
