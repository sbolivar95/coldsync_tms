import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { LaneDetail } from "../../features/lanes/LaneDetail";
import { useLanes } from "../../features/lanes/hooks/useLanes";
import { lanesService } from "../../services/database/lanes.service";
import { useAppStore } from "../../stores/useAppStore";
import type { Lane } from "../../types/database.types";
import { toast } from "sonner";

export function LaneDetailPage() {
    const { laneId } = useParams<{ laneId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const setBreadcrumbs = useAppStore((state) => state.setBreadcrumbs);
    const organization = useAppStore((state) => state.organization);
    const orgId = organization?.id || '';

    const { loadLanes } = useLanes();
    const lanes = useAppStore((state) => state.lanes);

    // Initialize with data from navigation state or store cache
    const [selectedLane, setSelectedLane] = useState<Lane | null>(() => {
        if (location.state?.initialData) return location.state.initialData;

        if (laneId && lanes.length > 0) {
            const cached = lanes.find(l => l.lane_id === laneId || l.id?.toString() === laneId);
            if (cached) return cached;
        }
        return null;
    });

    // Use ref to prevent duplicate fetches
    const loadedLaneIdRef = useRef<string | undefined>(undefined);

    // Use ref to track last breadcrumbs set to avoid loops
    const lastBreadcrumbRef = useRef<string>("");

    useEffect(() => {
        const breadcrumbKey = `${location.pathname}-${selectedLane?.name}`;
        if (selectedLane && lastBreadcrumbRef.current !== breadcrumbKey) {
            setBreadcrumbs(location.pathname, [
                {
                    label: "Carriles",
                    onClick: () => navigate("/lanes"),
                },
                {
                    label: selectedLane.name,
                    onClick: undefined,
                },
            ]);
            lastBreadcrumbRef.current = breadcrumbKey;
        }
    }, [selectedLane, location.pathname, setBreadcrumbs, navigate]);

    useEffect(() => {
        if (!laneId || !orgId) {
            return;
        }

        // Si ya estamos cargando o ya cargamos esta carril, no hacer nada
        if (loadedLaneIdRef.current === laneId) {
            return;
        }

        const loadData = async () => {
            try {
                const data = await lanesService.getById(laneId, orgId);
                if (data) {
                    setSelectedLane(data);
                    loadedLaneIdRef.current = laneId;
                }
            } catch (error) {
                console.error("Error loading lane:", error);
                if (!selectedLane) {
                    toast.error("Error al cargar el carril");
                    navigate("/lanes");
                }
            }
        };

        loadData();
    }, [laneId, orgId, navigate]);

    const handleBack = () => {
        navigate("/lanes");
    };

    const handleSave = async (saved: Lane) => {
        setSelectedLane(saved);
        // Refresh store in background 
        loadLanes(true);
        navigate("/lanes");
    };

    return (
        <LaneDetail
            lane={selectedLane}
            onBack={handleBack}
            onSave={handleSave}
            mode="edit"
        />
    );
}
