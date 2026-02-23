import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { LocationDetail } from "../../features/locations/LocationDetail";
import { useLocations } from "../../features/locations/useLocations";
import { locationsService } from "../../services/database/locations.service";
import { useAppStore } from "../../stores/useAppStore";
import type { Location } from "../../types/database.types";
import { toast } from "sonner";

export function LocationDetailPage() {
    const { locationId } = useParams<{ locationId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { setBreadcrumbs, organization } = useAppStore();
    const orgId = organization?.id || '';
    const { loadLocations } = useLocations(orgId);
    const locations = useAppStore((state) => state.locations);

    // Initialize with data from navigation state or store cache
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(() => {
        if (location.state?.initialData) return location.state.initialData;

        // If not in state, look in store cache
        if (locationId && locations.length > 0) {
            const cached = locations.find(l => l.id === parseInt(locationId, 10));
            if (cached) return cached;
        }
        return null;
    });

    // Use ref to prevent duplicate fetches
    const loadedLocationIdRef = useRef<string | undefined>(undefined);

    // Actualizar breadcrumbs cuando el nombre de la ubicación esté disponible
    useEffect(() => {
        if (selectedLocation) {
            setBreadcrumbs(location.pathname, [
                {
                    label: "Ubicaciones",
                    onClick: () => navigate("/locations"),
                },
                {
                    label: selectedLocation.name,
                    onClick: undefined,
                },
            ]);
        }
    }, [selectedLocation, location.pathname, setBreadcrumbs, navigate]);

    useEffect(() => {
        if (!locationId || !orgId) {
            return;
        }

        // Silent background update if we already have data
        // Only skip fetch if we already fetched accurately for this ID in this session
        if (loadedLocationIdRef.current === locationId) {
            return;
        }

        const loadData = async () => {
            try {
                const data = await locationsService.getById(parseInt(locationId, 10), orgId);
                if (data) {
                    setSelectedLocation(data);
                    loadedLocationIdRef.current = locationId;
                } else {
                    toast.error("Ubicación no encontrada");
                    navigate("/locations");
                }
            } catch (error) {
                console.error("Error loading location:", error);
                // Si ya tenemos datos (del cache), no navegamos fuera, solo informamos
                if (!selectedLocation) {
                    toast.error("Error al cargar la ubicación");
                    navigate("/locations");
                }
            }
        };

        loadData();
    }, [locationId, orgId, navigate, selectedLocation]);

    const handleBack = () => {
        navigate("/locations");
    };

    const handleSave = async (saved: Location) => {
        setSelectedLocation(saved);
        // Refrescamos store y volvemos a la lista
        await loadLocations(true);
        navigate("/locations");
    };

    // Always render LocationDetail - component stays mounted during loading
    return (
        <LocationDetail
            location={selectedLocation}
            onBack={handleBack}
            onSave={handleSave}
            mode="edit"
        />
    );
}
