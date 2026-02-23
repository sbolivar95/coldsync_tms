
import { useSearchParams, useParams } from "react-router-dom";
import { PageHeader } from "../../layouts/PageHeader";
import { Button } from "../../components/ui/Button";
import { Filter, ChevronDown } from "lucide-react";
import { TrackingView } from "../../features/control_tower/TrackingView";
import { useControlTower } from "../../features/control_tower/hooks/useControlTower";

export function ControlTowerListPage() {
    const { unitId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = searchParams.get("tab") || "live-tracking";
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

    const clearFilters = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("q");
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
                        id: "live-tracking",
                        label: "Tracking",
                        active: activeTab === "live-tracking",
                        onClick: () => setActiveTab("live-tracking"),
                        badge: counts.liveTracking
                    },
                    {
                        id: "active-orders",
                        label: "En Ejecución",
                        active: activeTab === "active-orders",
                        onClick: () => setActiveTab("active-orders"),
                        badge: counts.activeOrders
                    },
                    {
                        id: "in-transit",
                        label: "En Tránsito",
                        active: activeTab === "in-transit",
                        onClick: () => setActiveTab("in-transit"),
                        badge: counts.inTransit
                    },
                    {
                        id: "at-destination",
                        label: "En Destino",
                        active: activeTab === "at-destination",
                        onClick: () => setActiveTab("at-destination"),
                        badge: counts.atDestination
                    },
                    {
                        id: "delivered",
                        label: "Completadas",
                        active: activeTab === "delivered",
                        onClick: () => setActiveTab("delivered"),
                        badge: counts.delivered
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
                <TrackingView
                    controlTower={controlTower}
                    activeTab={activeTab}
                    hasFilters={Boolean(searchQuery)}
                    onClearFilters={clearFilters}
                    onGoToTracking={() => setActiveTab("live-tracking")}
                />
            </div>
        </div>
    );
}
