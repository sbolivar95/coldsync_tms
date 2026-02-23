import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { LocationDetail } from "../../features/locations/LocationDetail";
import { useLocations } from "../../features/locations/useLocations";
import { useAppStore } from "../../stores/useAppStore";

export function LocationCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setBreadcrumbs, organization } = useAppStore();
    const { loadLocations } = useLocations(organization?.id || "");

    useEffect(() => {
        setBreadcrumbs(location.pathname, [
            {
                label: "Ubicaciones",
                onClick: () => navigate("/locations"),
            },
            {
                label: "Nueva Ubicación",
                onClick: undefined,
            },
        ]);
    }, [location.pathname, setBreadcrumbs, navigate]);

    const handleBack = () => {
        navigate("/locations");
    };

    const handleSave = async () => {
        // Después de guardar una nueva, refrescamos el store
        await loadLocations(true);
    };

    return (
        <LocationDetail
            onBack={handleBack}
            onSave={handleSave}
        />
    );
}
