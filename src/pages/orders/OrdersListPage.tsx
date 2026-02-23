
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../layouts/PageHeader";
import { OrdersList } from "../../features/orders/OrdersList";
import { useOrders } from "../../features/orders/hooks/useOrders";
import { OrdersContextualFilter, type OrdersContextualFilterValue } from "../../components/ui/OrdersContextualFilter";

export function OrdersListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [contextualFilter, setContextualFilter] = useState<OrdersContextualFilterValue>("all");

    const activeTab = searchParams.get("tab") || "solicitudes";
    const searchValue = searchParams.get("q") || "";

    const setActiveTab = (tab: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("tab", tab);
        setSearchParams(newParams);
    };

    const setSearchValue = (q: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (q) {
            newParams.set("q", q);
        } else {
            newParams.delete("q");
        }
        setSearchParams(newParams);
    };

    // Hook de lógica sincronizado con el estado de la URL
    const orders = useOrders({
        activeTab,
        searchValue,
        contextualFilter
    });

    const { counts } = orders;

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                tabs={[
                    {
                        id: "solicitudes",
                        label: "Solicitudes",
                        active: activeTab === "solicitudes",
                        onClick: () => setActiveTab("solicitudes"),
                        badge: counts.solicitudes,
                    },
                    {
                        id: "compromisos",
                        label: "Mis Compromisos",
                        active: activeTab === "compromisos",
                        onClick: () => setActiveTab("compromisos"),
                        badge: counts.compromisos,
                    },
                    {
                        id: "historial",
                        label: "Historial",
                        active: activeTab === "historial",
                        onClick: () => setActiveTab("historial"),
                        badge: counts.historial,
                    },
                ]}
                showSearch
                searchPlaceholder="Buscar por ID, ruta, origen, destino o producto..."
                onSearch={setSearchValue}
                searchValue={searchValue}
                filters={
                    <OrdersContextualFilter
                        activeTab={activeTab}
                        value={contextualFilter}
                        onChange={setContextualFilter}
                    />
                }
            />
            <OrdersList orders={orders} activeTab={activeTab} />
        </div>
    );
}
