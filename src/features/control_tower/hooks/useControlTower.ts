
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { mockTrackingUnits, TrackingUnit } from "../utils/mock-data";
import { filterUnits, getStatusCounts } from "../utils/control-tower-helpers";

interface UseControlTowerProps {
    activeTab: string;
    searchQuery: string;
    unitId?: string;
}

export function useControlTower({ activeTab, searchQuery, unitId }: UseControlTowerProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [units] = useState<TrackingUnit[]>(mockTrackingUnits);

    // Derivar unidad seleccionada de la URL
    const selectedUnit = useMemo(() => {
        return unitId ? units.find((u) => u.id === unitId) : null;
    }, [unitId, units]);

    // Filtrar unidades
    const filteredUnits = useMemo(() => {
        return filterUnits(units, activeTab, searchQuery);
    }, [units, activeTab, searchQuery]);

    // Conteos para los tabs
    const counts = useMemo(() => {
        return getStatusCounts(units);
    }, [units]);

    // Handlers
    const handleUnitClick = (id: string) => {
        const params = new URLSearchParams(searchParams);
        navigate(`/control-tower/${id}?${params.toString()}`);
    };

    const closeDrawer = () => {
        const params = new URLSearchParams(searchParams);
        navigate(`/control-tower?${params.toString()}`, { replace: true });
    };

    return {
        units: filteredUnits,
        counts,
        selectedUnit,
        handleUnitClick,
        closeDrawer,
    };
}
