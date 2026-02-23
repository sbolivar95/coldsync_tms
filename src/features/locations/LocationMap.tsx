import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Map,
  useMap,
  MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { MapSideControls, MapDrawingToolbar } from "../../components/widgets/MapControls";
import { useMapHistory } from "./hooks/useMapHistory";


// Define internal types to avoid deep dependency on google global during definition if possible
type LatLngLiteral = { lat: number; lng: number };

// --- CIRCLE COMPONENT (Interactive) ---
interface CircleProps {
  center: LatLngLiteral;
  radius: number;
  onCenterChanged?: (center: LatLngLiteral) => void;
  onRadiusChanged?: (radius: number) => void;
  // Options
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWeight?: number;
  clickable?: boolean;
  editable?: boolean;
  draggable?: boolean;
}

function Circle(props: CircleProps) {
  const { onCenterChanged, onRadiusChanged, center, radius, ...options } = props;
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !window.google) return;

    const circle = new google.maps.Circle({
      ...options,
      map,
      center,
      radius,
    });
    circleRef.current = circle;

    // Listeners for interactivity
    const centerListener = circle.addListener("center_changed", () => {
      const newCenter = circle.getCenter();
      if (newCenter && onCenterChanged) {
        onCenterChanged(newCenter.toJSON());
      }
    });

    const radiusListener = circle.addListener("radius_changed", () => {
      const newRadius = circle.getRadius();
      if (onRadiusChanged) {
        onRadiusChanged(newRadius);
      }
    });

    return () => {
      if (centerListener) google.maps.event.removeListener(centerListener);
      if (radiusListener) google.maps.event.removeListener(radiusListener);
      circle.setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Sync props to internal object if changed from outside (form)
  useEffect(() => {
    if (!circleRef.current) return;
    const currentCenter = circleRef.current.getCenter()?.toJSON();
    if (currentCenter && (currentCenter.lat !== center.lat || currentCenter.lng !== center.lng)) {
      circleRef.current.setCenter(center);
    }
    if (circleRef.current.getRadius() !== radius) {
      circleRef.current.setRadius(radius);
    }
  }, [center, radius]);

  return null;
}

// --- POLYGON COMPONENT (Interactive) ---
interface PolygonProps {
  paths: LatLngLiteral[];
  onPathsChanged?: (paths: LatLngLiteral[]) => void;
  // Options
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWeight?: number;
  clickable?: boolean;
  editable?: boolean;
  draggable?: boolean;
}

function Polygon(props: PolygonProps) {
  const { paths, onPathsChanged, ...options } = props;
  const map = useMap();
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  useEffect(() => {
    if (!map || !window.google) return;

    const polygon = new google.maps.Polygon({
      ...options,
      map,
      paths,
    });
    polygonRef.current = polygon;

    const updatePaths = () => {
      if (onPathsChanged && polygonRef.current) {
        const newPaths = polygonRef.current.getPath().getArray().map(p => p.toJSON());
        onPathsChanged(newPaths);
      }
    };

    const path = polygon.getPath();
    const listeners = [
      path.addListener("set_at", updatePaths),
      path.addListener("insert_at", updatePaths),
      path.addListener("remove_at", updatePaths),
    ];

    return () => {
      listeners.forEach(l => {
        if (l) google.maps.event.removeListener(l);
      });
      polygon.setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // External sync
  useEffect(() => {
    if (!polygonRef.current) return;
    const currentPaths = polygonRef.current.getPath().getArray().map(p => p.toJSON());
    // Basic comparison to avoid feedback loop
    if (currentPaths.length !== paths.length || JSON.stringify(currentPaths) !== JSON.stringify(paths)) {
      polygonRef.current.setPaths(paths);
    }
  }, [paths]);

  return null;
}

// --- MAIN MAP COMPONENT ---
interface LocationMapProps {
  locationType: "point" | "polygon";
  coordinates?: LatLngLiteral | null;
  polygon?: LatLngLiteral[] | null;
  onLocationChange: (
    type: "point" | "polygon" | "radius",
    data: LatLngLiteral | LatLngLiteral[] | number | null
  ) => void;
  radius?: number;
  readOnly?: boolean;
  showDrawingToolbar?: boolean;
  onTypeChange?: (type: "point" | "polygon") => void;
}

export function LocationMap({
  locationType: initialLocationType,
  coordinates,
  polygon,
  onLocationChange,
  onTypeChange,
  radius = 100,
  readOnly = false,
  showDrawingToolbar = false,
}: LocationMapProps) {
  const [isMapLoading, setIsMapLoading] = useState(true);

  // Calcular centro inicial basado en props o usar un valor regional por defecto (América)
  const initialCenter = useMemo(() => {
    if (coordinates && (coordinates.lat !== 0 || coordinates.lng !== 0)) return coordinates;
    if (polygon && polygon.length > 0) {
      const lat = polygon.reduce((s, p) => s + p.lat, 0) / polygon.length;
      const lng = polygon.reduce((s, p) => s + p.lng, 0) / polygon.length;
      return { lat, lng };
    }
    return null;
  }, [coordinates, polygon]);

  // Si no hay datos, inicializar en una vista de América (evita el 0,0 en el mar)
  const defaultCenter = { lat: -17.3895, lng: -66.1568 }; // Cochabamba, Bolivia
  const [center, setCenter] = useState<LatLngLiteral>(initialCenter || defaultCenter);
  const [zoom, setZoom] = useState(initialCenter ? 16 : 3);

  const [mapTypeId, setMapTypeId] = useState<string>("roadmap");
  const [drawingMode, setDrawingMode] = useState<"point" | "polygon" | "none">("none");
  const map = useMap();

  // Determinar si hay una geocerca válida existente (para decidir si auto-ajustar mapa)
  const isEditingValidData = useMemo(() => !!initialCenter, [initialCenter]);
  const showGrayOverlay = isMapLoading && isEditingValidData;

  // Ref para asegurar que fitBounds solo ocurra una vez al cargar
  const hasFittedRef = useRef<boolean>(false);

  // Usar el tipo de localización dinámico si la toolbar está activa, si no usar el prop
  const activeLocationType = showDrawingToolbar ? (drawingMode === "none" ? initialLocationType : drawingMode) : initialLocationType;

  // --- LÓGICA DE HISTORIAL (HOOK CUSTOM) ---
  const {
    canUndo,
    canRedo,
    pushToHistory,
    handleUndo: undo,
    handleRedo: redo,
    resetHistory
  } = useMapHistory(onLocationChange);

  const handleUndo = useCallback(() => undo(activeLocationType, activeLocationType === "point" ? coordinates : polygon), [undo, activeLocationType, coordinates, polygon]);
  const handleRedo = useCallback(() => redo(activeLocationType, activeLocationType === "point" ? coordinates : polygon), [redo, activeLocationType, coordinates, polygon]);

  const handleClear = useCallback(() => {
    pushToHistory(activeLocationType, activeLocationType === "point" ? coordinates : polygon);
    onLocationChange(activeLocationType, null);
  }, [activeLocationType, pushToHistory, onLocationChange, coordinates, polygon]);

  // Sincronizar el tipo de localización inicial con el modo de dibujo si la toolbar está activa
  useEffect(() => {
    if (showDrawingToolbar) {
      setDrawingMode(initialLocationType === "point" ? "point" : "polygon");
    }
  }, [initialLocationType, showDrawingToolbar]);

  // Si cambia el tipo desde afuera (Cancel/Reset), reseteamos el historial local
  useEffect(() => {
    resetHistory();
  }, [initialLocationType, resetHistory]);

  // Función para alternar entre mapa y satélite
  const toggleMapType = () => {
    setMapTypeId(prev => prev === "roadmap" ? "hybrid" : "roadmap");
  };

  // Ref para rastrear qué geocerca ya fue "ajustada" en el mapa

  // Opciones de estilo para la geocerca
  const shapeOptions = useMemo(() => ({
    fillColor: "#004ef0",
    fillOpacity: 0.15,
    strokeColor: "#004ef0",
    strokeWeight: 2,
    clickable: !readOnly,
    editable: !readOnly,
    draggable: !readOnly,
  }), [readOnly]);

  // Ajustar automáticamente el mapa SOLO cuando se cargan datos existentes por primera vez
  useEffect(() => {
    if (!map || !window.google || !isEditingValidData || hasFittedRef.current) return;

    if (activeLocationType === "point" && coordinates) {
      const radiusInDegrees = (radius || 100) / 111000;
      const bounds = new google.maps.LatLngBounds(
        { lat: coordinates.lat - radiusInDegrees, lng: coordinates.lng - radiusInDegrees },
        { lat: coordinates.lat + radiusInDegrees, lng: coordinates.lng + radiusInDegrees }
      );
      map.fitBounds(bounds, 50);
      hasFittedRef.current = true;
    } else if (activeLocationType === "polygon" && polygon && polygon.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      polygon.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, 50);
      hasFittedRef.current = true;
    }
  }, [map, activeLocationType, isEditingValidData, coordinates, polygon, radius]);

  // Si el tipo cambia (punto <-> polígono), permitimos un re-ajuste único
  useEffect(() => {
    hasFittedRef.current = false;
  }, [activeLocationType]);



  const handleMapClick = useCallback((ev: MapMouseEvent) => {
    if (readOnly || !ev.detail.latLng) return;
    const { lat, lng } = ev.detail.latLng;

    if (activeLocationType === "point") {
      pushToHistory(activeLocationType, coordinates);
      onLocationChange("point", { lat, lng });
    } else if (activeLocationType === "polygon") {
      const current = polygon || [];
      pushToHistory(activeLocationType, polygon);
      onLocationChange("polygon", [...current, { lat, lng }]);
    }
  }, [readOnly, activeLocationType, polygon, coordinates, onLocationChange, pushToHistory]);


  // Función para centrar el mapa en la geocerca actual
  const handleCenterMap = () => {
    if (!map) return;
    if (activeLocationType === "point" && coordinates) {
      map.panTo(coordinates);
      map.setZoom(16);
    } else if (activeLocationType === "polygon" && polygon && polygon.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      polygon.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, 50);
    }
  };

  const hasDataToClear = activeLocationType === "point"
    ? (coordinates && (coordinates.lat !== 0 || coordinates.lng !== 0))
    : (polygon && polygon.length > 0);

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden relative shadow-sm group bg-gray-100" style={{ height: "450px" }}>
      {/* Fondo gris de espera - Solo si estamos esperando datos de edición (Regla 58) */}
      {showGrayOverlay && (
        <div className="absolute inset-0 z-20 bg-gray-100 transition-all duration-300" />
      )}

      {/* El mapa siempre se rinde, el overlay lo tapa solo si es necesario */}
      <Map
        center={center}
        zoom={zoom}
        mapTypeId={mapTypeId}
        onCenterChanged={ev => setCenter(ev.detail.center)}
        onZoomChanged={ev => setZoom(ev.detail.zoom)}
        onClick={readOnly ? undefined : handleMapClick}
        onIdle={() => setIsMapLoading(false)}
        disableDefaultUI={true}
        gestureHandling={readOnly ? "cooperative" : "greedy"}
        draggableCursor={readOnly ? undefined : (activeLocationType === "polygon" ? "crosshair" : undefined)}
      >
        <MapSideControls
          onToggleMapType={toggleMapType}
          onCenterMap={handleCenterMap}
          mapTypeId={mapTypeId}
        />

        {showDrawingToolbar && (
          <MapDrawingToolbar
            selectedMode={activeLocationType}
            onModeChange={(mode) => {
              if (mode !== "none" && onTypeChange) {
                onTypeChange(mode as "point" | "polygon");
              }
            }}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            canUndo={canUndo}
            canRedo={canRedo}
            canClear={!!hasDataToClear}
          />
        )}

        {activeLocationType === "point" && coordinates && (
          <Circle
            center={coordinates}
            radius={radius || 100}
            {...shapeOptions}
            onCenterChanged={newCenter => onLocationChange("point", newCenter)}
            onRadiusChanged={newRadius => onLocationChange("radius", newRadius)}
          />
        )}

        {activeLocationType === "polygon" && polygon && polygon.length > 0 && (
          <Polygon
            paths={polygon}
            {...shapeOptions}
            onPathsChanged={newPaths => onLocationChange("polygon", newPaths)}
          />
        )}
      </Map>

      {/* Tooltip de ayuda contextual */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-light tracking-wide shadow-2xl border border-white/10 uppercase">
          {activeLocationType === "point"
            ? "Haz click para situar • Arrastra para mover"
            : "Haz click para puntos • Arrastra nodos para editar"}
        </div>
      </div>
    </div>
  );
}