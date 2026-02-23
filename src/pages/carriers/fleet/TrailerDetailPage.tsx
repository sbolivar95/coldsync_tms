import { useParams, useNavigate } from "react-router-dom";
import { TrailerDetail } from "../../../features/fleet/entities/trailers/TrailerDetail";
import { useAppStore } from "../../../stores/useAppStore";
import { useState, useEffect } from "react";
import { trailersService, trailerReeferSpecsService } from "../../../services/database/trailers.service";
import type { Trailer, TrailerUpdate } from "../../../types/database.types";
import type { TrailerFormData, TrailerReeferSpecsFormData } from "../../../lib/schemas/trailer.schemas";
import { toast } from "sonner";
import { useCarriersBreadcrumbs } from "../../../hooks/useCarriersBreadcrumbs";
import { useFleetStore } from "../../../stores/useFleetStore";

export function TrailerDetailPage() {
    const { carrierId, trailerId } = useParams<{ carrierId: string; trailerId: string }>();
    const navigate = useNavigate();
    const organization = useAppStore((state) => state.organization);
    const loadTrailers = useFleetStore((state) => state.loadTrailers);
    const [trailer, setTrailer] = useState<Trailer | null>(null);

    // Auto-generate breadcrumbs with trailer plate
    useCarriersBreadcrumbs({ trailerPlate: trailer?.plate });

    // Load trailer data with reefer specs
    useEffect(() => {
        if (!trailerId || !organization?.id) {
            return;
        }

        const loadTrailer = async () => {
            try {
                // Use getWithReeferSpecs to get both trailer and its equipment
                const data = await trailersService.getWithReeferSpecs(trailerId, organization.id);

                if (!data) {
                    toast.error("Remolque no encontrado");
                    navigate(`/carriers/${carrierId}/fleet/trailers`);
                    return;
                }

                setTrailer(data);
            } catch (error) {
                console.error("Error loading trailer:", error);
                toast.error("Error al cargar remolque");
                navigate(`/carriers/${carrierId}/fleet/trailers`);
            }
        };

        loadTrailer();
    }, [trailerId, organization?.id, carrierId, navigate]);

    const handleBack = () => {
        navigate(`/carriers/${carrierId}/fleet/trailers`);
    };

    const handleSave = async (data: TrailerFormData, reeferSpecs?: TrailerReeferSpecsFormData) => {
        if (!organization?.id || !trailer) {
            toast.error("No hay organización seleccionada");
            return;
        }

        try {
            await trailersService.update(trailer.id, organization.id, data as unknown as TrailerUpdate);

            if (reeferSpecs) {
                const existingSpecs = await trailerReeferSpecsService.getByTrailerId(trailer.id, organization.id);
                if (existingSpecs) {
                    await trailerReeferSpecsService.update(trailer.id, organization.id, reeferSpecs);
                } else {
                    await trailerReeferSpecsService.create(trailer.id, organization.id, reeferSpecs);
                }
            }

            // Force refresh trailers in store to update list view
            await loadTrailers(organization.id, true);

            toast.success("Remolque actualizado correctamente");

            // Navigate back to list
            navigate(`/carriers/${carrierId}/fleet/trailers`);
        } catch (error) {
            console.error("Error saving trailer:", error);
            toast.error("Error al actualizar remolque");
        }
    };

    return (
        <TrailerDetail
            trailer={trailer}
            onBack={handleBack}
            onSave={handleSave}
            mode="view"
            carrierId={carrierId ? parseInt(carrierId) : undefined}
        />
    );
}
