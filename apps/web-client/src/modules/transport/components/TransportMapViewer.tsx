import React, { useMemo, useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Popup, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Badge, Card, CardContent, CardHeader, CardTitle, Button, Modal } from '@sysgov/ui';
import {
  MapPin,
  Navigation,
  School,
  Users,
  Plus,
  Trash2,
  Crosshair,
  Check,
  Compass,
  Copy,
  Info,
} from 'lucide-react';

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
  route_code?: string;
  route_name?: string;
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
  onSelectStop?: (stop: MapStopData) => void;
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
  height = '560px',
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
  onSelectStop,
}) => {
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedStopDetail, setSelectedStopDetail] = useState<MapStopData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const effectiveDrawing = interactive !== undefined ? interactive : isDrawingMode;
  const defaultCenter: [number, number] = center || [-15.7938, -47.8827];

  const activeRoutes = useMemo(() => {
    if (selectedRouteId) {
      return routes.filter((r) => r.id === selectedRouteId);
    }
    return routes;
  }, [routes, selectedRouteId]);

  const handleMarkerClick = (stopData: MapStopData) => {
    setSelectedStopDetail(stopData);
    setIsDetailModalOpen(true);
    if (onSelectStop) {
      onSelectStop(stopData);
    }
  };

  const handleCopyCoords = () => {
    if (!selectedStopDetail) return;
    const text = `${selectedStopDetail.latitude.toFixed(6)}, ${selectedStopDetail.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card className={`overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col ${className}`}>
        {showCoordinatesTooltip && (
          <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-500" />
              <CardTitle className="text-sm font-semibold tracking-wide">
                Georreferenciamento & Traçados de Transporte Escolar
              </CardTitle>
              {effectiveDrawing && (
                <Badge variant="outline" className="border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-950/40 text-[10px] animate-pulse">
                  Modo Interativo Ativo: Clique no mapa para definir pontos / traçados
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {hoverCoords && (
                <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  Lat: {hoverCoords.lat.toFixed(5)} | Lng: {hoverCoords.lng.toFixed(5)}
                </span>
              )}
              {drawnPoints.length > 0 && onClearDrawing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearDrawing}
                  className="h-7 text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-mono"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Traçado ({drawnPoints.length})
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

            {/* Standalone Stops / Schools */}
            {stops.map((stop) => (
              <CircleMarker
                key={stop.id}
                center={[stop.latitude, stop.longitude]}
                radius={9}
                pathOptions={{
                  fillColor: stop.zone_type === 'rural' ? '#10b981' : '#0ea5e9',
                  fillOpacity: 0.95,
                  color: '#ffffff',
                  weight: 2.5,
                }}
                eventHandlers={{
                  click: () => handleMarkerClick(stop),
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <School className="w-3.5 h-3.5 text-emerald-500" />
                      {stop.name}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                      Lat: {stop.latitude.toFixed(5)} | Lng: {stop.longitude.toFixed(5)}
                    </div>
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-emerald-600 font-semibold cursor-pointer">
                      Clique para ver detalhes completos ➜
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Render Routes */}
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
                      radius={8}
                      pathOptions={{
                        fillColor: '#f59e0b',
                        fillOpacity: 0.95,
                        color: '#ffffff',
                        weight: 2.5,
                      }}
                      eventHandlers={{
                        click: () =>
                          handleMarkerClick({
                            id: stop.id,
                            name: stop.name,
                            latitude: stop.latitude,
                            longitude: stop.longitude,
                            students_count: stop.students_count,
                            route_code: route.code,
                            route_name: route.name,
                            zone_type: route.route_type,
                          }),
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 text-xs">
                          <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            {stop.name}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300">
                            Rota: <span className="font-mono font-medium">{route.code}</span> ({route.name})
                          </div>
                          <div className="font-mono text-slate-500 text-[11px] tabular-nums">
                            Lat: {stop.latitude.toFixed(5)} | Lng: {stop.longitude.toFixed(5)}
                          </div>
                          <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-amber-600 font-semibold cursor-pointer">
                            Clique para ver detalhes completos ➜
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </React.Fragment>
              );
            })}

            {/* Drawn Points in Realtime */}
            {drawnPoints.length > 0 && (
              <>
                {drawnPoints.length > 1 && (
                  <Polyline
                    positions={drawnPoints}
                    pathOptions={{
                      color: '#f43f5e',
                      weight: 3.5,
                      dashArray: '5, 5',
                    }}
                  />
                )}
                {drawnPoints.map((pt, index) => (
                  <CircleMarker
                    key={index}
                    center={pt}
                    radius={6}
                    pathOptions={{
                      fillColor: '#f43f5e',
                      fillOpacity: 1,
                      color: '#ffffff',
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-xs font-mono">
                        Ponto Traçado {index + 1}: [{pt[0].toFixed(5)}, {pt[1].toFixed(5)}]
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </>
            )}
          </MapContainer>
        </CardContent>
      </Card>

      {/* MODAL DE INFORMAÇÕES DO PONTO DO MAPA */}
      <Modal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        title={selectedStopDetail?.name || 'Detalhes do Ponto Georreferenciado'}
        size="lg"
      >
        {selectedStopDetail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedStopDetail.name}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Ponto de Parada / Embarque Escolar
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="capitalize text-xs font-semibold">
                {selectedStopDetail.zone_type === 'rural' ? 'Zona Rural' : 'Zona Urbana'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-md border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Latitude</span>
                <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {selectedStopDetail.latitude.toFixed(6)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-md border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Longitude</span>
                <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {selectedStopDetail.longitude.toFixed(6)}
                </span>
              </div>
            </div>

            {selectedStopDetail.route_code && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-md border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Rota Vinculada</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono border-cyan-500 text-cyan-600">
                    {selectedStopDetail.route_code}
                  </Badge>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {selectedStopDetail.route_name}
                  </span>
                </div>
              </div>
            )}

            {selectedStopDetail.students_count !== undefined && (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-md border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Estudantes Alocados neste Ponto:
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-emerald-600 tabular-nums">
                  {selectedStopDetail.students_count} aluno(s)
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCoords}
                className="text-xs flex items-center gap-1.5 font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Coordenadas Copiadas!' : 'Copiar Coordenadas GPS'}
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
