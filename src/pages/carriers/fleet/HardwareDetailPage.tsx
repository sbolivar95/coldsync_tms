import { useParams, useNavigate, useLocation } from "react-router-dom";
import { HardwareDetail } from "../../../features/fleet/entities/hardware/HardwareDetail";
import { useAppStore } from "../../../stores/useAppStore";
import { useState, useEffect } from "react";
import { hardwareService } from "../../../services/database/hardware.service";
import type { ConnectionDevice } from "../../../types/database.types";
import { toast } from "sonner";
import { useCarriersBreadcrumbs } from "../../../hooks/useCarriersBreadcrumbs";

import { useFleetStore } from "../../../stores/useFleetStore";

export function HardwareDetailPage() {
    const { carrierId, hardwareId } = useParams<{ carrierId: string; hardwareId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const organization = useAppStore((state) => state.organization);

    // Initialize with data from navigation state if available
    const [hardware, setHardware] = useState<ConnectionDevice | null>(() => {
        return location.state?.initialData || null;
    });

    // Sync hardware state with location state when hardwareId changes (for navigation between items)
    useEffect(() => {
        if (location.state?.initialData) {
            setHardware(location.state.initialData);
        } else if (hardware && hardware.id !== hardwareId) {
            // If navigating to a different ID without state, reset current hardware to trigger loading
            setHardware(null);
        }
    }, [hardwareId, location.state]);

    // Fleet Store Actions to refresh list cache
    const loadConnectionDevices = useFleetStore((state) => state.loadConnectionDevices);
    const loadVehicles = useFleetStore((state) => state.loadVehicles);
    const loadTrailers = useFleetStore((state) => state.loadTrailers);

    // Auto-generate breadcrumbs
    useCarriersBreadcrumbs();

    // Load hardware data - component stays mounted during loading
    useEffect(() => {
        if (!hardwareId || !organization?.id) {
            return;
        }

        // Check if we already have the correct hardware data
        if (hardware && hardware.id === hardwareId) {
            return;
        }

        const loadHardware = async () => {
            try {
                const data = await hardwareService.getConnectionDeviceById(hardwareId, organization.id);

                if (!data) {
                    toast.error("Dispositivo no encontrado");
                    navigate(`/carriers/${carrierId}/fleet/hardware`);
                    return;
                }

                setHardware(data);
            } catch (error) {
                console.error("Error loading hardware:", error);
                toast.error("Error al cargar dispositivo");
                navigate(`/carriers/${carrierId}/fleet/hardware`);
            }
        };

        loadHardware();
    }, [hardwareId, organization?.id, carrierId, navigate]);

    const handleBack = () => {
        navigate(`/carriers/${carrierId}/fleet/hardware`);
    };

    const handleSuccess = async () => {
        // Reload hardware data silently without dismounting component
        if (organization?.id) {
            // Force refresh global cache so list is updated when we return
            Promise.all([
                loadConnectionDevices(organization.id, true),
                loadVehicles(organization.id, true),
                loadTrailers(organization.id, true)
            ]).catch(console.error);

            if (hardware) {
                const updated = await hardwareService.getConnectionDeviceById(hardware.id, organization.id);
                if (updated) {
                    setHardware(updated);
                }
            }
        }
    };

    // Don't dismount component during loading - always render HardwareDetail
    if (!organization?.id) {
        return null;
    }

    return (
        <HardwareDetail
            connectionDevice={hardware}
            organizationId={organization.id}
            onBack={handleBack}
            onSuccess={handleSuccess}
            carrierId={carrierId ? parseInt(carrierId) : undefined}
            mode={hardware ? "edit" : "create"}
        />
    );
}
