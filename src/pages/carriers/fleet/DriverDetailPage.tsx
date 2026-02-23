import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DriverDetail } from "../../../features/fleet/entities/drivers/DriverDetail";
import { useAppStore } from "../../../stores/useAppStore";
import { useState, useEffect } from "react";
import { driversService } from "../../../services/database/drivers.service";
import type { Driver, DriverUpdate } from "../../../types/database.types";
import type { DriverFormData } from "../../../lib/schemas/driver.schemas";
import { toast } from "sonner";
import { useCarriersBreadcrumbs } from "../../../hooks/useCarriersBreadcrumbs";
import { useFleetStore } from "../../../stores/useFleetStore";

export function DriverDetailPage() {
    const { carrierId, driverId } = useParams<{ carrierId: string; driverId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const organization = useAppStore((state) => state.organization);
    const loadDrivers = useFleetStore((state) => state.loadDrivers);

    // Initialize with data from navigation state if available
    const [driver, setDriver] = useState<Driver | null>(() => {
        return location.state?.initialData || null;
    });

    // Auto-generate breadcrumbs
    useCarriersBreadcrumbs({
        driverName: driver?.name
    });

    // Load driver data
    useEffect(() => {
        if (!driverId || !organization?.id) {
            return;
        }

        // Check if we already have the correct driver data
        if (driver && driver.id === parseInt(driverId)) {
            return;
        }

        const loadDriver = async () => {
            try {
                const data = await driversService.getById(parseInt(driverId), organization.id);

                if (!data) {
                    toast.error("Conductor no encontrado");
                    navigate(`/carriers/${carrierId}/fleet/drivers`);
                    return;
                }

                setDriver(data);
            } catch (error) {
                console.error("Error loading driver:", error);
                toast.error("Error al cargar conductor");
                navigate(`/carriers/${carrierId}/fleet/drivers`);
            }
        };

        loadDriver();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [driverId, organization?.id, carrierId, navigate]);

    const handleBack = () => {
        navigate(`/carriers/${carrierId}/fleet/drivers`);
    };

    const handleSave = async (data: DriverFormData) => {
        if (!organization?.id || !driver) {
            toast.error("No hay organización seleccionada");
            return;
        }

        try {
            // Construct a clean update payload
            const updateData = {
                driver_id: data.driver_id,
                name: data.name,
                license_number: data.license_number,
                phone_number: data.phone_number,
                email: data.email || null,
                birth_date: data.birth_date,
                nationality: Number(data.nationality),
                address: data.address,
                city: data.city,
                status: data.status,
                contract_date: data.contract_date,
                notes: data.notes || null
            } as unknown as DriverUpdate;



            await driversService.update(driver.id, organization.id, updateData);

            // Force refresh drivers in store to update list view
            await loadDrivers(organization.id, true);

            toast.success("Conductor actualizado correctamente");
            navigate(`/carriers/${carrierId}/fleet/drivers`);
        } catch (error) {
            console.error("Error saving driver:", error);

            if (typeof error === 'object' && error !== null && 'message' in error) {
                toast.error(`Error: ${(error as any).message}`);
            } else {
                toast.error("Error al actualizar conductor");
            }
            throw error;
        }
    };

    return (
        <DriverDetail
            driver={driver}
            onBack={handleBack}
            onSave={handleSave}
            mode="edit"
            carrierId={carrierId ? parseInt(carrierId) : undefined}
        />
    );
}
