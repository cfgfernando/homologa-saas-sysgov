import React, { useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Popup, Polyline, TileLayer } from 'react-leaflet';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@sysgov/ui';
import { MapPin, Navigation, School, Users } from 'lucide-react';

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

interface TransportMapViewerProps {
  routes?: RouteMapData[];
  selectedRouteId?: number | null;
  height?: string;
}

export const TransportMapViewer: React.FC<TransportMapViewerProps> = ({
  routes = [],
  selectedRouteId,
  height = '500px',
}) => {
  // Center default to Brasilia coordinates if no data
  const defaultCenter: [number, number] = [-15.7938, -47.8827];

  const activeRoutes = useMemo(() => {
    if (selectedRouteId) {
      return routes.filter((r) => r.id === selectedRouteId);
    }
    return routes;
  }, [routes, selectedRouteId]);

  const mapCenter = useMemo((): [number, number] => {
    for (const route of activeRoutes) {
      if (route.stops && route.stops.length > 0) {
        return [route.stops[0].latitude, route.stops[0].longitude];
      }
      if (route.waypoints && route.waypoints.length > 0) {
        return route.waypoints[0];
      }
    }
    return defaultCenter;
  }, [activeRoutes]);

  return (
    <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-500" />
          <CardTitle className="text-sm font-semibold tracking-wide">
            Mapa Georreferenciado de Rotas e Pontos de Parada
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <span>{activeRoutes.length} rota(s) em exibição</span>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: '100%', width: '100%', zIndex: 10 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

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

                {route.stops?.map((stop) => (
                  <CircleMarker
                    key={stop.id}
                    center={[stop.latitude, stop.longitude]}
                    radius={6}
                    pathOptions={{
                      fillColor: '#f59e0b',
                      fillOpacity: 0.9,
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
                            {stop.students_count} aluno(s) embarcando
                          </div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </CardContent>
    </Card>
  );
};
