import React, { useMemo, useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Popup, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Badge, Card, CardContent, CardHeader, CardTitle, Button } from '@sysgov/ui';
import { MapPin, Navigation, School, Users, Plus, Trash2, Crosshair, Check } from 'lucide-react';

export interface RouteMapData {
  id: number;
  code: string;
  name: string;
  shift: string;
  route_type: string;
  distance_km?: number;
  waypoints?: [number, number][]; // [lat, lng]
  stops?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    students_count?: number;
  }[];
}

export interface MapStopData {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  zone_type?: string;
  students_count?: number;
}

export interface TransportMapViewerProps {
  routes?: RouteMapData[];
  selectedRouteId?: number | null;
  height?: string;
  isDrawingMode?: boolean;
  interactive?: boolean;
  onPointAdded?: (lat: number, lng: number) => void;
  drawnPoints?: [number, number][];
  onClearDrawing?: () => void;
  stops?: MapStopData[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  showCoordinatesTooltip?: boolean;
}

// Sub-component to manage Leaflet map instance, size invalidation, bounds, and clicks
const MapController: React.FC<{
  routes: RouteMapData[];
  stops: MapStopData[];
  selectedRouteId?: number | null;
  isDrawingMode?: boolean;
  onPointAdded?: (lat: number, lng: number) => void;
  setHoverCoords: (coords: { lat: number; lng: number } | null) => void;
}> = ({ routes, stops, selectedRouteId, isDrawingMode, onPointAdded, setHoverCoords }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate map size to prevent gray tiles on mount / tab switch
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    const points: [number, number][] = [];

    const activeRoutes = selectedRouteId ? routes.filter((r) => r.id === selectedRouteId) : routes;

    for (const r of activeRoutes) {
      if (r.waypoints) {
        points.push(...r.waypoints);
      }
      if (r.stops) {
        for (const s of r.stops) {
          points.push([s.latitude, s.longitude]);
        }
      }
    }

    for (const s of stops) {
      points.push([s.latitude, s.longitude]);
    }

    if (points.length > 0) {
      try {
        const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      } catch {
        // Fallback
      }
    }
  }, [map, routes, stops, selectedRouteId]);

  useMapEvents({
    click(e) {
      if (isDrawingMode && onPointAdded) {
        onPointAdded(e.latlng.lat, e.latlng.lng);
      }
    },
    mousemove(e) {
      setHoverCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    mouseout() {
      setHoverCoords(null);
    },
  });

  return null;
};

export const TransportMapViewer: React.FC<TransportMapViewerProps> = ({
  routes = [],
  selectedRouteId,
  height = '450px',
  isDrawingMode = false,
  interactive,
  onPointAdded,
  drawnPoints = [],
  onClearDrawing,
  stops = [],
  center,
  zoom = 12,
  className = '',
  showCoordinatesTooltip = true,
}) => {
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lng: number } | null>(null);

  const effectiveDrawing = interactive !== undefined ? interactive : isDrawingMode;
  const defaultCenter: [number, number] = center || [-15.7938, -47.8827];

  const activeRoutes = useMemo(() => {
    if (selectedRouteId) {
      return routes.filter((r) => r.id === selectedRouteId);
    }
    return routes;
  }, [routes, selectedRouteId]);

  return (
    <Card className={`overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col ${className}`}>
      {showCoordinatesTooltip && (
        <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 py-2.5 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-500" />
            <CardTitle className="text-sm font-semibold tracking-wide">
              Mapa Interativo & Georreferenciamento de Transporte
            </CardTitle>
            {effectiveDrawing && (
              <Badge variant="outline" className="border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-950/40 text-[10px] animate-pulse">
                Modo Interativo: Clique no mapa para definir pontos / coordenadas
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hoverCoords && (
              <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                Lat: {hoverCoords.lat.toFixed(5)} | Lng: {hoverCoords.lng.toFixed(5)}
              </span>
            )}
            {drawnPoints.length > 0 && onClearDrawing && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearDrawing}
                className="h-7 text-[11px] text-rose-500 hover:text-rose-600 flex items-center gap-1 font-mono"
              >
                <Trash2 className="w-3 h-3" />
                Limpar ({drawnPoints.length})
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0 relative flex-1" style={{ minHeight: height }}>
        <MapContainer
          center={defaultCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%', minHeight: height, zIndex: 10 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController
            routes={routes}
            stops={stops}
            selectedRouteId={selectedRouteId}
            isDrawingMode={effectiveDrawing}
            onPointAdded={onPointAdded}
            setHoverCoords={setHoverCoords}
          />

          {/* Render standalone stops/schools */}
          {stops.map((stop) => (
            <CircleMarker
              key={stop.id}
              center={[stop.latitude, stop.longitude]}
              radius={8}
              pathOptions={{
                fillColor: stop.zone_type === 'rural' ? '#10b981' : '#0ea5e9',
                fillOpacity: 0.9,
                color: '#ffffff',
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-emerald-500" />
                    {stop.name}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                    Lat: {stop.latitude.toFixed(5)} | Lng: {stop.longitude.toFixed(5)}
                  </div>
                  {stop.zone_type && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {stop.zone_type === 'rural' ? 'Zona Rural' : 'Zona Urbana'}
                    </Badge>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Render routes */}
          {activeRoutes.map((route) => {
            const polylinePositions: [number, number][] =
              route.waypoints && route.waypoints.length > 0
                ? route.waypoints
                : route.stops && route.stops.length > 1
                ? route.stops.map((s) => [s.latitude, s.longitude])
                : [];

            const isRural = route.route_type === 'rural';
            const routeColor = isRural ? '#10b981' : '#6366f1';

            return (
              <React.Fragment key={route.id}>
                {polylinePositions.length > 1 && (
                  <Polyline
                    positions={polylinePositions}
                    pathOptions={{
                      color: routeColor,
                      weight: 4,
                      opacity: 0.85,
                      dashArray: isRural ? '6, 6' : undefined,
                    }}
                  />
                )}

                {route.stops?.map((stop, idx) => (
                  <CircleMarker
                    key={stop.id || idx}
                    center={[stop.latitude, stop.longitude]}
                    radius={7}
                    pathOptions={{
                      fillColor: '#f59e0b',
                      fillOpacity: 0.95,
                      color: '#ffffff',
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          {stop.name}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300">
                          Rota: <span className="font-mono font-medium">{route.code}</span> ({route.name})
                        </div>
                        <div className="font-mono text-slate-500 text-[11px] tabular-nums">
                          Lat: {stop.latitude.toFixed(5)} | Lng: {stop.longitude.toFixed(5)}
                        </div>
                        {stop.students_count !== undefined && (
                          <div className="flex items-center gap-1 text-slate-700 font-mono text-[11px] pt-1 border-t border-slate-200">
                            <Users className="w-3 h-3 text-emerald-600" />
                            {stop.students_count} aluno(s) neste ponto
                          </div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </React.Fragment>
            );
          })}

          {/* Render points drawn in realtime */}
          {drawnPoints.length > 0 && (
            <>
              {drawnPoints.length > 1 && (
                <Polyline
                  positions={drawnPoints}
                  pathOptions={{
                    color: '#f43f5e',
                    weight: 3,
                    dashArray: '4, 4',
                  }}
                />
              )}
              {drawnPoints.map((pt, index) => (
                <CircleMarker
                  key={index}
                  center={pt}
                  radius={5}
                  pathOptions={{
                    fillColor: '#f43f5e',
                    fillOpacity: 1,
                    color: '#ffffff',
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-xs font-mono">
                      Ponto {index + 1}: [{pt[0].toFixed(5)}, {pt[1].toFixed(5)}]
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </>
          )}
        </MapContainer>
      </CardContent>
    </Card>
  );
};
