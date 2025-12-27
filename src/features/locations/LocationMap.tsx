import { useEffect, useMemo, useRef } from 'react'
import maplibregl, { Map } from 'maplibre-gl'

type LatLng = { lat: number; lng: number }

interface LocationMapProps {
  locationType: 'point' | 'polygon'
  coordinates?: LatLng | null
  polygon?: LatLng[] | null

  /** Circle radius in meters (used in point mode) */
  radiusMeters?: number

  onLocationChange: (
    type: 'point' | 'polygon',
    data: LatLng | LatLng[] | null
  ) => void
}

const MAP_STYLE: any = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
} // free demo style (good for dev)
const DEFAULT_CENTER: LatLng = { lat: -16.4897, lng: -68.1193 } // La Paz

function toGeoJSONPoint(p: LatLng | null) {
  return {
    type: 'Feature' as const,
    geometry: p
      ? {
          type: 'Point' as const,
          coordinates: [p.lng, p.lat] as [number, number],
        }
      : { type: 'Point' as const, coordinates: [0, 0] as [number, number] },
    properties: {},
  }
}

function polygonToGeoJSON(poly: LatLng[] | null) {
  const pts = (poly || []).filter(Boolean)
  const coords: [number, number][] = pts.map((p) => [p.lng, p.lat])

  // close ring if needed
  if (coords.length >= 3) {
    const first = coords[0]
    const last = coords[coords.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first)
  }

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: coords.length >= 4 ? [coords] : [[]],
    },
    properties: {},
  }
}

// Generate a circle polygon (approx) around center with radius in meters
function circleToPolygon(
  center: LatLng,
  radiusMeters: number,
  steps = 64
): LatLng[] {
  const R = 6371000 // Earth radius meters
  const lat1 = (center.lat * Math.PI) / 180
  const lon1 = (center.lng * Math.PI) / 180
  const d = radiusMeters / R

  const points: LatLng[] = []

  for (let i = 0; i <= steps; i++) {
    const brng = (2 * Math.PI * i) / steps

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) +
        Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
    )

    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
      )

    points.push({
      lat: (lat2 * 180) / Math.PI,
      lng: (((lon2 * 180) / Math.PI + 540) % 360) - 180, // normalize to [-180, 180]
    })
  }

  return points
}

export function LocationMap({
  locationType,
  coordinates,
  polygon,
  radiusMeters = 100,
  onLocationChange,
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)

  const pointMarkerRef = useRef<maplibregl.Marker | null>(null)
  const vertexMarkersRef = useRef<maplibregl.Marker[]>([])

  const polygonDraftRef = useRef<LatLng[]>(polygon || [])

  const center = useMemo<LatLng>(() => {
    if (locationType === 'point' && coordinates) return coordinates
    if (
      locationType === 'polygon' &&
      (polygon?.length || polygonDraftRef.current.length)
    ) {
      const pts = (
        polygon && polygon.length ? polygon : polygonDraftRef.current
      ) as LatLng[]
      return pts[0] || DEFAULT_CENTER
    }
    return DEFAULT_CENTER
  }, [locationType, coordinates, polygon])

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [center.lng, center.lat],
      zoom: 13,
    })

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'top-left'
    )

    map.on('load', () => {
      // sources
      if (!map.getSource('geofence-point')) {
        map.addSource('geofence-point', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [toGeoJSONPoint(null)] },
        })
      }

      if (!map.getSource('geofence-circle')) {
        map.addSource('geofence-circle', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [polygonToGeoJSON(null)],
          },
        })
      }

      if (!map.getSource('geofence-polygon')) {
        map.addSource('geofence-polygon', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [polygonToGeoJSON(null)],
          },
        })
      }

      // layers (circle)
      if (!map.getLayer('circle-fill')) {
        map.addLayer({
          id: 'circle-fill',
          type: 'fill',
          source: 'geofence-circle',
          paint: {
            'fill-opacity': 0.12,
          },
        })
      }
      if (!map.getLayer('circle-line')) {
        map.addLayer({
          id: 'circle-line',
          type: 'line',
          source: 'geofence-circle',
          paint: {
            'line-opacity': 0.7,
            'line-width': 2,
          },
        })
      }

      // layers (polygon)
      if (!map.getLayer('poly-fill')) {
        map.addLayer({
          id: 'poly-fill',
          type: 'fill',
          source: 'geofence-polygon',
          paint: {
            'fill-opacity': 0.12,
          },
        })
      }
      if (!map.getLayer('poly-line')) {
        map.addLayer({
          id: 'poly-line',
          type: 'line',
          source: 'geofence-polygon',
          paint: {
            'line-opacity': 0.8,
            'line-width': 2,
          },
        })
      }

      // (optional) render a tiny point dot via layer (marker still used for dragging)
      if (!map.getLayer('point-dot')) {
        map.addLayer({
          id: 'point-dot',
          type: 'circle',
          source: 'geofence-point',
          paint: {
            'circle-radius': 5,
            'circle-opacity': 0.9,
          },
        })
      }
    })

    // click behavior
    const onClick = (e: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      const latlng = { lat: e.lngLat.lat, lng: e.lngLat.lng }

      if (locationType === 'point') {
        onLocationChange('point', latlng)
        return
      }

      // polygon: add vertex
      const next = [...polygonDraftRef.current, latlng]
      polygonDraftRef.current = next
      onLocationChange('polygon', next)
    }

    map.on('click', onClick)

    mapRef.current = map

    return () => {
      map.off('click', onClick)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep draft synced with prop polygon (e.g. switching records)
  useEffect(() => {
    polygonDraftRef.current = polygon ? [...polygon] : []
  }, [polygon])

  // Update map center gently (when incoming data changes)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Don’t constantly fly; only recenter when we have meaningful geometry
    if (locationType === 'point' && coordinates) {
      map.easeTo({ center: [coordinates.lng, coordinates.lat], duration: 300 })
    }
    if (locationType === 'polygon' && polygon && polygon.length >= 2) {
      map.easeTo({ center: [polygon[0].lng, polygon[0].lat], duration: 300 })
    }
  }, [locationType, coordinates, polygon])

  // Update geojson sources (point/circle/polygon)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const pointSource = map.getSource('geofence-point') as
      | maplibregl.GeoJSONSource
      | undefined
    const circleSource = map.getSource('geofence-circle') as
      | maplibregl.GeoJSONSource
      | undefined
    const polySource = map.getSource('geofence-polygon') as
      | maplibregl.GeoJSONSource
      | undefined

    if (!pointSource || !circleSource || !polySource) return

    // Point source
    pointSource.setData({
      type: 'FeatureCollection',
      features: [toGeoJSONPoint(coordinates || null)],
    })

    // Circle source (only when in point mode + has center)
    if (locationType === 'point' && coordinates) {
      const circlePoly = circleToPolygon(coordinates, radiusMeters)
      circleSource.setData({
        type: 'FeatureCollection',
        features: [polygonToGeoJSON(circlePoly)],
      })
    } else {
      circleSource.setData({
        type: 'FeatureCollection',
        features: [polygonToGeoJSON(null)],
      })
    }

    // Polygon source (only when in polygon mode)
    const polyPts = locationType === 'polygon' ? polygonDraftRef.current : []
    polySource.setData({
      type: 'FeatureCollection',
      features: [polygonToGeoJSON(polyPts.length ? polyPts : null)],
    })
  }, [locationType, coordinates, radiusMeters, polygon])

  // Marker handling (draggable point marker & polygon vertex markers)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear all vertex markers
    vertexMarkersRef.current.forEach((m) => m.remove())
    vertexMarkersRef.current = []

    // Point mode: draggable marker for center
    if (locationType === 'point') {
      if (coordinates) {
        if (!pointMarkerRef.current) {
          pointMarkerRef.current = new maplibregl.Marker({ draggable: true })
            .setLngLat([coordinates.lng, coordinates.lat])
            .addTo(map)

          pointMarkerRef.current.on('dragend', () => {
            const ll = pointMarkerRef.current?.getLngLat()
            if (!ll) return
            onLocationChange('point', { lat: ll.lat, lng: ll.lng })
          })
        } else {
          pointMarkerRef.current.setLngLat([coordinates.lng, coordinates.lat])
        }
      } else {
        if (pointMarkerRef.current) {
          pointMarkerRef.current.remove()
          pointMarkerRef.current = null
        }
      }
      return
    }

    // Polygon mode: remove point marker
    if (pointMarkerRef.current) {
      pointMarkerRef.current.remove()
      pointMarkerRef.current = null
    }

    // Create draggable markers for each vertex
    const pts = polygonDraftRef.current
    pts.forEach((p, idx) => {
      const marker = new maplibregl.Marker({ draggable: true })
        .setLngLat([p.lng, p.lat])
        .addTo(map)

      marker.on('dragend', () => {
        const ll = marker.getLngLat()
        const next = [...polygonDraftRef.current]
        next[idx] = { lat: ll.lat, lng: ll.lng }
        polygonDraftRef.current = next
        onLocationChange('polygon', next)
      })

      vertexMarkersRef.current.push(marker)
    })
  }, [locationType, coordinates, polygon, onLocationChange])

  const undoLast = () => {
    if (locationType !== 'polygon') return
    const next = polygonDraftRef.current.slice(0, -1)
    polygonDraftRef.current = next
    onLocationChange('polygon', next.length ? next : null)
  }

  const clearAll = () => {
    if (locationType === 'point') {
      onLocationChange('point', null)
      return
    }
    polygonDraftRef.current = []
    onLocationChange('polygon', null)
  }

  return (
    <div
      className='relative border border-gray-300 rounded-md overflow-hidden bg-gray-50'
      style={{ height: 300 }}
    >
      <div
        ref={containerRef}
        className='w-full h-full'
      />

      <div className='absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs text-gray-700 shadow'>
        {locationType === 'point'
          ? 'Click para definir el centro del círculo (puedes arrastrar el pin)'
          : 'Click para agregar puntos (arrastra vértices para ajustar)'}
      </div>

      <div className='absolute top-2 right-2 flex gap-2'>
        {locationType === 'polygon' && (
          <button
            type='button'
            onClick={undoLast}
            className='px-2 py-1 bg-white rounded text-xs shadow border border-gray-200 hover:bg-gray-50'
          >
            Deshacer
          </button>
        )}
        <button
          type='button'
          onClick={clearAll}
          className='px-2 py-1 bg-white rounded text-xs shadow border border-gray-200 hover:bg-gray-50'
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}
