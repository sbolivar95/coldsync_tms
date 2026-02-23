import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../../layouts/PageHeader";
import { StatusFilter, type StatusFilterValue } from "../../components/ui/StatusFilter";
import { LocationsList } from "../../features/locations/LocationsList";
import { useAppStore } from "../../stores/useAppStore";

export function LocationsListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setBreadcrumbs, registerCreateHandler } = useAppStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");

    // Limpiar breadcrumbs al entrar a la lista
    useEffect(() => {
        setBreadcrumbs(location.pathname, []);
    }, [location.pathname, setBreadcrumbs]);

    const handleCreate = () => {
        navigate("new");
    };

    const handleSelectLocation = (loc: any) => {
        navigate(`${loc.id}`, { state: { initialData: loc } });
    };

    // Registrar handler de creación para el botón del Header global
    useEffect(() => {
        registerCreateHandler(location.pathname, handleCreate);
    }, [location.pathname, registerCreateHandler]);

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                showSearch
                searchPlaceholder="Buscar ubicaciones..."
                onSearch={setSearchTerm}
                filters={
                    <StatusFilter
                        value={statusFilter}
                        onChange={setStatusFilter}
                        label="Estado"
                    />
                }
            />
            <LocationsList
                onSelectLocation={handleSelectLocation}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
            />
        </div>
    );
}
