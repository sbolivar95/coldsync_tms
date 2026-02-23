
import { useEffect, useState, useRef } from "react";
import {
    Map,
    useMap,
    AdvancedMarker,
    useMapsLibrary
} from "@vis.gl/react-google-maps";
import { MapSideControls } from "../../../components/widgets/MapControls";
import { TrackingUnit } from "../utils/mock-data";
import FleetUnitMarker from "./FleetUnitMarker";

interface FleetMapProps {
    units: TrackingUnit[];
    selectedUnit?: TrackingUnit | null;
    onUnitClick: (id: string) => void;
}

export function FleetMap({ units, selectedUnit, onUnitClick }: FleetMapProps) {
    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapTypeId, setMapTypeId] = useState<string>("roadmap");
    const map = useMap();
    const coreLibrary = useMapsLibrary("core");

    // Default center (Bolivia Center)
    const defaultCenter = { lat: -17.3895, lng: -66.1568 }; // Cochabamba as central reference

    const [center, setCenter] = useState(defaultCenter);
    const [zoom, setZoom] = useState(6);

    const hasFittedRef = useRef<boolean>(false);

    // Initial boundary fit when units and map are ready
    useEffect(() => {
        if (!map || !coreLibrary || units.length === 0 || hasFittedRef.current) return;

        const bounds = new coreLibrary.LatLngBounds();
        units.forEach(u => bounds.extend(u.coordinates));

        map.fitBounds(bounds, 50);
        hasFittedRef.current = true;
    }, [map, coreLibrary, units]);

    // Pan and zoom when a unit is selected
    useEffect(() => {
        if (selectedUnit && map) {
            map.panTo(selectedUnit.coordinates);
            const currentZoom = map.getZoom() || 4;
            if (currentZoom < 12) {
                map.setZoom(14); // Better visibility for specific unit
            }
        }
    }, [selectedUnit, map]);

    const toggleMapType = () => {
        setMapTypeId(prev => prev === "roadmap" ? "hybrid" : "roadmap");
    };

    const handleCenterMap = () => {
        if (!map || !coreLibrary || units.length === 0) return;
        const bounds = new coreLibrary.LatLngBounds();
        units.forEach(u => bounds.extend(u.coordinates));
        map.fitBounds(bounds, 50);
    };

    return (
        <div className="w-full h-full bg-gray-100 relative group overflow-hidden">
            {/* Loading Overlay (Industry Standard UX) */}
            {isMapLoading && (
                <div className="absolute inset-0 z-20 bg-gray-100 transition-all duration-500 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Sincronizando Flota...</p>
                    </div>
                </div>
            )}

            <Map
                mapId="FLEET_MONITOR_MAP"
                defaultCenter={center}
                defaultZoom={zoom}
                mapTypeId={mapTypeId}
                onCameraChanged={ev => {
                    setCenter(ev.detail.center);
                    setZoom(ev.detail.zoom);
                }}
                disableDefaultUI={true}
                gestureHandling="greedy"
                onIdle={() => setIsMapLoading(false)}
            >
                <MapSideControls
                    onToggleMapType={toggleMapType}
                    onCenterMap={handleCenterMap}
                    mapTypeId={mapTypeId}
                    showCenter={true}
                />

                {units.map((unit) => (
                    <AdvancedMarker
                        key={unit.id}
                        position={unit.coordinates}
                        onClick={() => onUnitClick(unit.id)}
                        zIndex={selectedUnit?.id === unit.id ? 1000 : 10}
                        collisionBehavior="OPTIONAL_AND_HIDES_LOWER_PRIORITY"
                        title={unit.unit}
                    >
                        <FleetUnitMarker
                            unit={unit}
                            isSelected={selectedUnit?.id === unit.id}
                        />
                    </AdvancedMarker>
                ))}
            </Map>
        </div>
    );
}
