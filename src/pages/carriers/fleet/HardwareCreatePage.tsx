import { useNavigate, useParams } from "react-router-dom";
import { HardwareDetail } from "../../../features/fleet/entities/hardware/HardwareDetail";
import { useAppStore } from "../../../stores/useAppStore";
import { useCarriersBreadcrumbs } from "../../../hooks/useCarriersBreadcrumbs";

export function HardwareCreatePage() {
    const { carrierId } = useParams<{ carrierId: string }>();
    const navigate = useNavigate();
    const organization = useAppStore((state) => state.organization);

    // Breadcrumbs
    useCarriersBreadcrumbs();

    const handleBack = () => {
        navigate(`/carriers/${carrierId}/fleet/hardware`);
    };

    const handleSuccess = () => {
        // Al crear exitosamente, volvemos a la lista
        navigate(`/carriers/${carrierId}/fleet/hardware`);
    };

    if (!organization?.id) return null;

    return (
        <HardwareDetail
            connectionDevice={null}
            organizationId={organization.id}
            onBack={handleBack}
            onSuccess={handleSuccess}
            carrierId={carrierId ? parseInt(carrierId) : undefined}
            mode="create"
        />
    );
}
