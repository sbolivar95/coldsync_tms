import { useState } from "react";
import { useLocation } from "react-router-dom";
import type { Trailer } from "../../../../../types/database.types";
import type { TrailerFormData, TrailerReeferSpecsFormData } from "../../../../../lib/schemas/trailer.schemas";
import { trailersService, trailerReeferSpecsService } from "../../../../../services/database/trailers.service";
import { useAppStore } from "../../../../../stores/useAppStore";
import { toast } from "sonner";

interface UseTrailersProps {
  organizationId?: string;
  carrierId?: number;
  onBreadcrumbChange?: (breadcrumbs: Array<{ label: string; onClick?: () => void }>) => void;
  onBack: () => void;
  onItemSaved: (item: Trailer) => void;
}

export function useTrailers({
  organizationId,
  carrierId,
  onBreadcrumbChange,
  onBack,
  onItemSaved,
}: UseTrailersProps) {
  const location = useLocation();
  const { setBreadcrumbs } = useAppStore();
  const [trailerMode, setTrailerMode] = useState<"view" | "edit" | "create">("view");
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);

  const handleSaveTrailer = async (data: TrailerFormData, reeferSpecs?: TrailerReeferSpecsFormData) => {
    if (!organizationId) {
      toast.error("No hay organización seleccionada");
      return;
    }

    if (!carrierId && !data.carrier_id) {
      toast.error("El transportista es requerido");
      return;
    }

    try {
      const finalCarrierId = carrierId || data.carrier_id;

      if (trailerMode === "create") {
        // Create new trailer
        const newTrailer = await trailersService.create({
          ...data,
          carrier_id: finalCarrierId,
          org_id: organizationId,
          tare_weight_tn: data.tare_weight_tn ?? 0,
        });

        // Create reefer specs if provided
        if (reeferSpecs) {
          await trailerReeferSpecsService.create(newTrailer.id, organizationId, reeferSpecs);
        }

        toast.success("Remolque creado correctamente");

        // Navigate to view the new trailer
        setSelectedTrailer(newTrailer);
        setTrailerMode("view");
        onItemSaved(newTrailer);

        // Update breadcrumbs
        const breadcrumbs = [
          {
            label: "Remolques",
            onClick: onBack,
          },
          {
            label: newTrailer.code || "",
            onClick: undefined,
          },
        ];

        if (onBreadcrumbChange) {
          onBreadcrumbChange(breadcrumbs);
        } else {
          setBreadcrumbs(location.pathname, breadcrumbs);
        }
      } else if (trailerMode === "edit" && selectedTrailer) {
        // Update existing trailer
        const updatedTrailer = await trailersService.update(selectedTrailer.id, organizationId, {
          ...data,
          tare_weight_tn: data.tare_weight_tn ?? undefined,
        });

        // Update or create reefer specs if provided
        if (reeferSpecs) {
          const existingSpecs = await trailerReeferSpecsService.getByTrailerId(
            selectedTrailer.id,
            organizationId
          );

          if (existingSpecs) {
            await trailerReeferSpecsService.update(selectedTrailer.id, organizationId, reeferSpecs);
          } else {
            await trailerReeferSpecsService.create(selectedTrailer.id, organizationId, reeferSpecs);
          }
        }

        toast.success("Remolque actualizado correctamente");

        // Refresh the trailer
        const refreshed = await trailersService.getById(updatedTrailer.id, organizationId);
        if (refreshed) {
          setSelectedTrailer(refreshed);
          setTrailerMode("view");
          onItemSaved(refreshed);

          // Update breadcrumbs
          if (onBreadcrumbChange) {
            onBreadcrumbChange([
              {
                label: "Remolques",
                onClick: onBack,
              },
              {
                label: refreshed.code || "",
                onClick: undefined,
              },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Error saving trailer:", error);
      toast.error(trailerMode === "edit" ? "Error al actualizar remolque" : "Error al crear remolque");
      throw error;
    }
  };

  const handleEditTrailer = async (trailer: Trailer) => {
    // Fetch the real trailer from database if we have an ID
    if (trailer.id && organizationId) {
      try {
        const realTrailer = await trailersService.getById(trailer.id, organizationId);
        if (realTrailer) {
          setSelectedTrailer(realTrailer);
        } else {
          setSelectedTrailer(trailer);
        }
      } catch (error) {
        console.error("Error fetching trailer:", error);
        setSelectedTrailer(trailer);
      }
    } else {
      setSelectedTrailer(trailer);
    }

    setTrailerMode("edit");

    // Update breadcrumbs
    if (onBreadcrumbChange) {
      onBreadcrumbChange([
        {
          label: "Remolques",
          onClick: onBack,
        },
        { label: trailer.code || "" },
      ]);
    }
  };

  const startCreate = () => {
    setSelectedTrailer(null);
    setTrailerMode("create");
  };

  const reset = () => {
    setSelectedTrailer(null);
    setTrailerMode("view");
  };

  return {
    trailerMode,
    selectedTrailer,
    setSelectedTrailer,
    setTrailerMode,
    handleSaveTrailer,
    handleEditTrailer,
    startCreate,
    reset,
  };
}
