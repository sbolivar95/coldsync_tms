import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "../../layouts/PageHeader";
import { StatusFilter, type StatusFilterValue } from "../../components/ui/StatusFilter";
import { CarriersList } from "../../features/carriers/CarriersList";
import { ConfirmDialog } from "../../components/widgets/ConfirmDialog";
import type { Carrier } from "../../types/database.types";
import { useAppStore } from "../../stores/useAppStore";
import { carriersService } from "../../services/database/carriers.service";
import { toast } from "sonner";
import { useCarriers } from "../../features/carriers/hooks/useCarriers";

export function CarriersListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const organization = useAppStore((state) => state.organization);
    const { registerCreateHandler } = useAppStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
    const [carrierToDelete, setCarrierToDelete] = useState<Carrier | null>(null);

    const { loadCarriers } = useCarriers(organization?.id);

    // Register create handler for the header button
    useEffect(() => {
        const handleCreate = () => {
            navigate('/carriers/new');
        };
        registerCreateHandler(location.pathname, handleCreate);
    }, [location.pathname, navigate, registerCreateHandler]);

    const handleCarrierSelect = (carrier: Carrier) => {
        navigate(`/carriers/${carrier.id}`);
    };

    const handleViewFleet = (carrier: Carrier) => {
        navigate(`/carriers/${carrier.id}/fleet/vehicles`);
    };

    const handleEditCarrier = (carrier: Carrier) => {
        navigate(`/carriers/${carrier.id}`);
    };

    const handleDeleteCarrier = (carrier: Carrier) => {
        setCarrierToDelete(carrier);
    };

    const confirmDelete = async () => {
        if (!carrierToDelete || !organization?.id) return;

        try {
            await carriersService.softDelete(carrierToDelete.id, organization.id);
            toast.success("Transportista eliminado correctamente");
            setCarrierToDelete(null);
            await loadCarriers(true);
        } catch (error) {
            console.error("Error deleting carrier:", error);
            toast.error("Error al eliminar transportista");
        }
    };

    return (
        <>
            <div className="flex flex-col h-full">
                <PageHeader
                    showSearch
                    searchPlaceholder="Buscar transportistas..."
                    onSearch={setSearchTerm}
                    filters={
                        <StatusFilter
                            value={statusFilter}
                            onChange={setStatusFilter}
                            label="Estado"
                        />
                    }
                />
                <CarriersList
                    onSelectCarrier={handleCarrierSelect}
                    onViewFleet={handleViewFleet}
                    onEditCarrier={handleEditCarrier}
                    onDeleteCarrier={handleDeleteCarrier}
                    searchTerm={searchTerm}
                    statusFilter={statusFilter}
                />
            </div>

            <ConfirmDialog
                open={!!carrierToDelete}
                onOpenChange={(open) => !open && setCarrierToDelete(null)}
                title="¿Eliminar transportista?"
                description={`¿Estás seguro de que deseas eliminar "${carrierToDelete?.commercial_name}"? Esta acción no se puede deshacer.`}
                variant="destructive"
                onConfirm={confirmDelete}
            />

        </>
    );
}
