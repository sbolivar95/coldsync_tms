
import { TrackingUnit } from "./mock-data";

export const filterUnits = (
    units: TrackingUnit[],
    activeTab: string,
    searchQuery: string
) => {
    return units.filter((unit) => {
        // Filtro por pestaña activa
        const matchesTab = (() => {
            if (activeTab === "todos") return true;
            if (activeTab === "programado") return unit.status === "Programada" || unit.status === "Programado";
            if (activeTab === "excursion-termica") return unit.reeferError?.severity === "critical" || unit.reeferError?.severity === "warning";
            if (activeTab === "en-origen") return unit.status === "En Planta" || unit.status === "En Origen";
            if (activeTab === "en-ruta") return unit.status === "En Ruta";
            if (activeTab === "en-destino") return unit.status === "En Destino";
            if (activeTab === "retrasado") return unit.status === "Retrasado";
            if (activeTab === "finalizado") return unit.status === "Finalizado";
            return true;
        })();

        if (!matchesTab) return false;

        // Filtro por búsqueda
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            unit.unit.toLowerCase().includes(query) ||
            unit.trailer.toLowerCase().includes(query) ||
            unit.driver.toLowerCase().includes(query) ||
            unit.location.toLowerCase().includes(query) ||
            unit.carrier.toLowerCase().includes(query)
        );
    });
};

export const getStatusCounts = (units: TrackingUnit[]) => {
    return {
        todos: units.length,
        programado: units.filter(u => u.status === "Programada" || u.status === "Programado").length,
        excursionTermica: units.filter(u => u.reeferError?.severity === "critical" || u.reeferError?.severity === "warning").length,
        enOrigen: units.filter(u => u.status === "En Planta" || u.status === "En Origen").length,
        enRuta: units.filter(u => u.status === "En Ruta").length,
        enDestino: units.filter(u => u.status === "En Destino").length,
        retrasado: units.filter(u => u.status === "Retrasado").length,
        finalizado: units.filter(u => u.status === "Finalizado").length,
    };
};
