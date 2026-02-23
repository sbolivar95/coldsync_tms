import { useState, useCallback } from "react";

type LatLngLiteral = { lat: number; lng: number };

interface HistoryState {
    type: "point" | "polygon";
    data: LatLngLiteral | LatLngLiteral[] | null;
}

export function useMapHistory(
    onLocationChange: (type: "point" | "polygon" | "radius", data: any) => void
) {
    const [history, setHistory] = useState<{
        past: HistoryState[];
        future: HistoryState[];
    }>({ past: [], future: [] });

    const pushToHistory = useCallback((currentType: "point" | "polygon", currentData: any) => {
        setHistory(prev => ({
            past: [...prev.past, {
                type: currentType,
                data: currentType === "point" ? (currentData ? { ...currentData } : null) : (Array.isArray(currentData) ? [...currentData] : null)
            }],
            future: []
        }));
    }, []);

    const handleUndo = useCallback((currentType: "point" | "polygon", currentData: any) => {
        if (history.past.length === 0) return;
        const previous = history.past[history.past.length - 1];
        const remainingPast = history.past.slice(0, -1);

        setHistory(prev => ({
            past: remainingPast,
            future: [{
                type: currentType,
                data: currentType === "point" ? (currentData ? { ...currentData } : null) : (Array.isArray(currentData) ? [...currentData] : null)
            }, ...prev.future]
        }));

        onLocationChange(previous.type, previous.data);
    }, [history, onLocationChange]);

    const handleRedo = useCallback((currentType: "point" | "polygon", currentData: any) => {
        if (history.future.length === 0) return;
        const next = history.future[0];
        const remainingFuture = history.future.slice(1);

        setHistory(prev => ({
            past: [...prev.past, {
                type: currentType,
                data: currentType === "point" ? (currentData ? { ...currentData } : null) : (Array.isArray(currentData) ? [...currentData] : null)
            }],
            future: remainingFuture
        }));

        onLocationChange(next.type, next.data);
    }, [history, onLocationChange]);

    const resetHistory = useCallback(() => {
        setHistory({ past: [], future: [] });
    }, []);

    return {
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        pushToHistory,
        handleUndo,
        handleRedo,
        resetHistory
    };
}
