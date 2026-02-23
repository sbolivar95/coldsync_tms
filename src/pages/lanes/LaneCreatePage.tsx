import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { LaneDetail } from "../../features/lanes/LaneDetail";
import { useLanes } from "../../features/lanes/hooks/useLanes";
import { useAppStore } from "../../stores/useAppStore";
import type { Lane } from "../../types/database.types";

export function LaneCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const setBreadcrumbs = useAppStore((state) => state.setBreadcrumbs);
    const { loadLanes } = useLanes();

    useEffect(() => {
        setBreadcrumbs(location.pathname, [
            {
                label: "Carriles",
                onClick: () => navigate("/lanes"),
            },
            {
                label: "Nuevo Carril",
                onClick: undefined,
            },
        ]);
    }, [location.pathname, setBreadcrumbs, navigate]);

    const handleBack = () => {
        navigate("/lanes");
    };

    const handleSave = async (_saved: Lane) => {
        // Después de guardar una nueva, refrescamos el store y volvemos a la lista
        await loadLanes(true);
        navigate("/lanes");
    };

    return (
        <LaneDetail
            lane={null}
            onBack={handleBack}
            onSave={handleSave}
            mode="create"
        />
    );
}
