
import { useSearchParams, useParams } from "react-router-dom";
import { PageHeader } from "../../layouts/PageHeader";
import { Button } from "../../components/ui/Button";
import { Filter, ChevronDown } from "lucide-react";
import { TrackingView } from "../../features/control_tower/TrackingView";
import { useControlTower } from "../../features/control_tower/hooks/useControlTower";

export function ControlTowerListPage() {
    const { unitId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = searchParams.get("tab") || "todos";
    const searchQuery = searchParams.get("q") || "";

    const setActiveTab = (tab: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("tab", tab);
        setSearchParams(newParams);
    };

    const setSearchQuery = (q: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (q) {
            newParams.set("q", q);
        } else {
            newParams.delete("q");
        }
        setSearchParams(newParams);
    };

    const controlTower = useControlTower({
        activeTab,
        searchQuery,
        unitId,
    });

    const { counts } = controlTower;

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                tabs={[
                    {
                        id: "todos",
                        label: "Todos",
                        active: activeTab === "todos",
                        onClick: () => setActiveTab("todos"),
                        badge: counts.todos
                    },
                    {
                        id: "programado",
                        label: "Programado",
                        active: activeTab === "programado",
                        onClick: () => setActiveTab("programado"),
                        badge: counts.programado
                    },
                    {
                        id: "excursion-termica",
                        label: "Excursión Térmica",
                        active: activeTab === "excursion-termica",
                        onClick: () => setActiveTab("excursion-termica"),
                        badge: counts.excursionTermica
                    },
                    {
                        id: "en-origen",
                        label: "En Origen",
                        active: activeTab === "en-origen",
                        onClick: () => setActiveTab("en-origen"),
                        badge: counts.enOrigen
                    },
                    {
                        id: "en-ruta",
                        label: "En Ruta",
                        active: activeTab === "en-ruta",
                        onClick: () => setActiveTab("en-ruta"),
                        badge: counts.enRuta
                    },
                    {
                        id: "en-destino",
                        label: "En Destino",
                        active: activeTab === "en-destino",
                        onClick: () => setActiveTab("en-destino"),
                        badge: counts.enDestino
                    },
                    {
                        id: "retrasado",
                        label: "Retrasado",
                        active: activeTab === "retrasado",
                        onClick: () => setActiveTab("retrasado"),
                        badge: counts.retrasado
                    },
                    {
                        id: "finalizado",
                        label: "Finalizado",
                        active: activeTab === "finalizado",
                        onClick: () => setActiveTab("finalizado"),
                        badge: counts.finalizado
                    },
                ]}
                showSearch
                searchPlaceholder="Buscar unidad, conductor, ubicación..."
                onSearch={setSearchQuery}
                searchValue={searchQuery}
                filters={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="w-4 h-4" />
                            Estado
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            Transportista
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            Tipo de Vehículo
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 overflow-hidden">
                <TrackingView controlTower={controlTower} />
            </div>
        </div>
    );
}
