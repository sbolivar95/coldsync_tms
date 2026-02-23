import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CarrierDetail } from "../../features/carriers/CarrierDetail";
import type { Carrier } from "../../types/database.types";
import { useAppStore } from "../../stores/useAppStore";
import { carriersService } from "../../services/database/carriers.service";
import { toast } from "sonner";
import type { CarrierFormData } from "../../lib/schemas/carrier.schemas";
import { useCarriers } from "../../features/carriers/hooks/useCarriers";
import { useCarriersBreadcrumbs } from "../../hooks/useCarriersBreadcrumbs";

export function CarrierDetailPage() {
    const { carrierId } = useParams<{ carrierId: string }>();
    const navigate = useNavigate();
    const organization = useAppStore((state) => state.organization);
    const [carrier, setCarrier] = useState<Carrier | null>(null);
    const [loading, setLoading] = useState(true);

    const { loadCarriers } = useCarriers(organization?.id);

    // Auto-generate breadcrumbs
    useCarriersBreadcrumbs();

    // Load carrier data
    useEffect(() => {
        if (!carrierId || !organization?.id) {
            setLoading(false);
            return;
        }

        const loadCarrier = async () => {
            try {
                setLoading(true);
                const data = await carriersService.getById(parseInt(carrierId), organization.id);

                if (!data) {
                    toast.error("Transportista no encontrado");
                    navigate("/carriers");
                    return;
                }

                setCarrier(data);
            } catch (error) {
                console.error("Error loading carrier:", error);
                toast.error("Error al cargar transportista");
                navigate("/carriers");
            } finally {
                setLoading(false);
            }
        };

        loadCarrier();
    }, [carrierId, organization?.id]);

    const handleBack = () => {
        navigate("/carriers");
    };

    const handleSave = async (data: CarrierFormData) => {
        if (!organization?.id || !carrier) {
            toast.error("No hay organización seleccionada");
            return;
        }

        try {
            const updatedCarrier = await carriersService.update(carrier.id, organization.id, {
                ...data,
                contract_expires_at: data.contract_expires_at || null,
                contract_number: data.contract_number || null,
                currency: data.currency || null,
                bank_name: data.bank_name || null,
                bank_account_number: data.bank_account_number || null,
                bank_cci_swift: data.bank_cci_swift || null,
            });
            toast.success("Transportista actualizado correctamente");
            await loadCarriers(true);
            setCarrier(updatedCarrier);
        } catch (error) {
            console.error("Error saving carrier:", error);
            toast.error("Error al actualizar transportista");
        }
    };

    if (!carrier && !loading) {
        return null;
    }

    return (
        <CarrierDetail
            carrier={carrier}
            onBack={handleBack}
            onSave={handleSave}
            mode="edit"
        />
    );
}
