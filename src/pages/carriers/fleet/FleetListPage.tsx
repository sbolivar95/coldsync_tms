import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FleetList } from "../../../features/fleet/components/FleetList";
import { useAppStore } from "../../../stores/useAppStore";
import { useState, useEffect } from "react";
import { carriersService } from "../../../services/database/carriers.service";
import type { Carrier } from "../../../types/database.types";
import { useCarriersBreadcrumbs } from "../../../hooks/useCarriersBreadcrumbs";

export function FleetListPage() {
    const { carrierId } = useParams<{ carrierId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const organization = useAppStore((state) => state.organization);
    const { registerCreateHandler } = useAppStore();
    const [carrier, setCarrier] = useState<Carrier | null>(null);

    // Auto-generate breadcrumbs
    useCarriersBreadcrumbs();

    // Detect active tab from URL
    const activeTab = (() => {
        const path = location.pathname;
        if (path.includes('/vehicles')) return 'vehiculos';
        if (path.includes('/drivers')) return 'conductores';
        if (path.includes('/trailers')) return 'remolques';
        if (path.includes('/hardware')) return 'hardware';
        if (path.includes('/assignments')) return 'asignaciones';
        return 'remolques'; // default
    })();

    // Load carrier data to get the name
    useEffect(() => {
        if (!carrierId || !organization?.id) return;

        const loadCarrier = async () => {
            try {
                const data = await carriersService.getById(parseInt(carrierId), organization.id);
                setCarrier(data);
            } catch (error) {
                console.error("Error loading carrier:", error);
            }
        };

        loadCarrier();
    }, [carrierId, organization?.id]);

    // Register create handler based on active tab
    useEffect(() => {
        const handleCreate = () => {
            // Navigate to the appropriate create page based on active tab
            const createPaths: Record<string, string> = {
                vehiculos: 'vehicles/new',
                conductores: 'drivers/new',
                remolques: 'trailers/new',
                hardware: 'hardware/new',
            };

            const path = createPaths[activeTab];
            if (path) {
                navigate(`/carriers/${carrierId}/fleet/${path}`);
            }
        };

        registerCreateHandler(location.pathname, handleCreate);
    }, [location.pathname, activeTab, carrierId, registerCreateHandler, navigate]);

    const handleSelectItem = (item: any, type: "vehiculo" | "conductor" | "remolque" | "hardware") => {
        // Navigate to the detail page based on type
        const typeMap = {
            vehiculo: 'vehicles',
            conductor: 'drivers',
            remolque: 'trailers',
            hardware: 'hardware'
        };

        const path = typeMap[type];
        navigate(`/carriers/${carrierId}/fleet/${path}/${item.id}`, {
            state: {
                initialData: item
            }
        });
    };

    const handleTabChange = (tab: string) => {
        // Navigate to the appropriate tab
        const tabMap: Record<string, string> = {
            vehiculos: 'vehicles',
            conductores: 'drivers',
            remolques: 'trailers',
            hardware: 'hardware',
            asignaciones: 'assignments'
        };

        const path = tabMap[tab];
        if (path) {
            navigate(`/carriers/${carrierId}/fleet/${path}`);
        }
    };

    return (
        <FleetList
            onSelectItem={handleSelectItem}
            onTabChange={handleTabChange}
            activeTab={activeTab}
            transportistaNombre={carrier?.commercial_name}
            carrierId={carrierId ? parseInt(carrierId) : undefined}
        />
    );
}
