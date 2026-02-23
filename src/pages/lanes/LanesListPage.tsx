import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../../layouts/PageHeader";
import { StatusFilter, type StatusFilterValue } from "../../components/ui/StatusFilter";
import { LanesList } from "../../features/lanes/LanesList";
import { useAppStore } from "../../stores/useAppStore";
import type { Lane } from "../../types/database.types";

export function LanesListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const setBreadcrumbs = useAppStore((state) => state.setBreadcrumbs);
    const registerCreateHandler = useAppStore((state) => state.registerCreateHandler);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");

    // Limpiar breadcrumbs al entrar a la lista
    useEffect(() => {
        setBreadcrumbs(location.pathname, []);
    }, [location.pathname, setBreadcrumbs]);

    const handleCreate = () => {
        navigate("new");
    };

    const handleSelectLane = (lane: Lane) => {
        navigate(`${lane.id}`, { state: { initialData: lane } });
    };

    // Registrar handler de creación para el botón del Header global
    useEffect(() => {
        registerCreateHandler(location.pathname, handleCreate);
    }, [location.pathname, registerCreateHandler]);

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                showSearch
                searchPlaceholder="Buscar carriles..."
                onSearch={setSearchTerm}
                filters={
                    <StatusFilter
                        value={statusFilter}
                        onChange={setStatusFilter}
                        label="Estado"
                    />
                }
            />
            <LanesList
                onSelectLane={handleSelectLane}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
            />
        </div>
    );
}
