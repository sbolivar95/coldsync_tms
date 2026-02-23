import { useParams, useNavigate } from "react-router-dom";
import { TrailerDetail } from "../../../features/fleet/entities/trailers/TrailerDetail";
import { useAppStore } from "../../../stores/useAppStore";
import { trailersService, trailerReeferSpecsService } from "../../../services/database/trailers.service";
import type { TrailerFormData, TrailerReeferSpecsFormData } from "../../../lib/schemas/trailer.schemas";
import { toast } from "sonner";
import { useCarriersBreadcrumbs } from "../../../hooks/useCarriersBreadcrumbs";
import { useFleetStore } from "../../../stores/useFleetStore";

export function TrailerCreatePage() {
    const { carrierId } = useParams<{ carrierId: string }>();
    const navigate = useNavigate();
    const organization = useAppStore((state) => state.organization);
    const loadTrailers = useFleetStore((state) => state.loadTrailers);

    // Auto-generate breadcrumbs
    useCarriersBreadcrumbs();

    const handleBack = () => {
        navigate(`/carriers/${carrierId}/fleet/trailers`);
    };

    const handleSave = async (data: TrailerFormData, reeferSpecs?: TrailerReeferSpecsFormData) => {
        if (!organization?.id || !carrierId) {
            toast.error("No hay organización o transportista seleccionado");
            return;
        }

        try {
            // Create trailer with carrier_id and org_id
            const trailerData = {
                ...data,
                carrier_id: parseInt(carrierId),
                org_id: organization.id
            };

            const newTrailer = await trailersService.create(trailerData);

            // Create reefer specs if provided
            if (reeferSpecs && newTrailer.id) {
                await trailerReeferSpecsService.create(newTrailer.id, organization.id, reeferSpecs);
            }

            // Force refresh trailers in store to update list view
            await loadTrailers(organization.id, true);

            toast.success("Remolque creado correctamente");
            navigate(`/carriers/${carrierId}/fleet/trailers`);
        } catch (error) {
            console.error("Error creating trailer:", error);
            toast.error("Error al crear remolque");
        }
    };

    return (
        <TrailerDetail
            trailer={null}
            onBack={handleBack}
            onSave={handleSave}
            mode="create"
            carrierId={carrierId ? parseInt(carrierId) : undefined}
        />
    );
}
