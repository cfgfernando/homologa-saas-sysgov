import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button,
  Input,
  Select,
} from '@sysgov/ui';
import {
  Route as RouteIcon,
  Plus,
  Search,
  MapPin,
  Clock,
  Compass,
  Bus,
  Users,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { TransportMapViewer, RouteMapData } from '../components/TransportMapViewer';

interface RouteRecord {
  id: number;
  code: string;
  name: string;
  shift: 'morning' | 'afternoon' | 'night' | 'full_day';
  route_type: 'rural' | 'urban' | 'mixed';
  distance_paved_km: number;
  distance_unpaved_km: number;
  estimated_duration_minutes: number;
  assigned_vehicle?: {
    id: number;
    plate: string;
    model: string;
    capacity_seats: number;
  };
  assigned_driver?: {
    id: number;
    name: string;
    cnh_category: string;
  };
  total_allocated_students: number;
  is_active: boolean;
  stops: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    students_count: number;
  }[];
}

const mockRoutesData: RouteRecord[] = [
  {
    id: 1,
    code: 'ROTA-RUR-01',
    name: 'Linha Veredas - Assentamento Esperança',
    shift: 'morning',
    route_type: 'rural',
    distance_paved_km: 8.5,
    distance_unpaved_km: 25.7,
    estimated_duration_minutes: 50,
    assigned_vehicle: {
      id: 1,
      plate: 'BRA2E19',
      model: 'Mercedes-Benz ORE 3',
      capacity_seats: 44,
    },
    assigned_driver: {
      id: 10,
      name: 'Carlos Alberto Silva',
      cnh_category: 'D',
    },
    total_allocated_students: 28,
    is_active: true,
    stops: [
      { id: 101, name: 'Comunidade São João', latitude: -15.7801, longitude: -47.892, students_count: 8 },
      { id: 102, name: 'Fazenda Boa Vista', latitude: -15.795, longitude: -47.885, students_count: 6 },
      { id: 103, name: 'Escola Municipal Rural Castro Alves', latitude: -15.81, longitude: -47.872, students_count: 14 },
    ],
  },
  {
    id: 2,
    code: 'ROTA-URB-02',
    name: 'Linha Circular Bairros Sul',
    shift: 'afternoon',
    route_type: 'urban',
    distance_paved_km: 14.8,
    distance_unpaved_km: 0.0,
    estimated_duration_minutes: 35,
    assigned_vehicle: {
      id: 2,
      plate: 'RKS8C44',
      model: 'Volksbus 8.160 ORE 1',
      capacity_seats: 29,
    },
    assigned_driver: {
      id: 11,
      name: 'Maria Helena Souza',
      cnh_category: 'D',
    },
    total_allocated_students: 25,
    is_active: true,
    stops: [
      { id: 201, name: 'Terminal Central', latitude: -15.798, longitude: -47.865, students_count: 12 },
      { id: 202, name: 'Complexo Educacional Darcy Ribeiro', latitude: -15.805, longitude: -47.855, students_count: 13 },
    ],
  },
  {
    id: 3,
    code: 'ROTA-RUR-03',
    name: 'Linha Rio Abaixo - Comunidade Quilombola',
    shift: 'morning',
    route_type: 'rural',
    distance_paved_km: 4.0,
    distance_unpaved_km: 38.0,
    estimated_duration_minutes: 65,
    assigned_vehicle: {
      id: 4,
      plate: 'LMN5B88',
      model: 'Mercedes-Benz OF-1721',
      capacity_seats: 59,
    },
    assigned_driver: {
      id: 12,
      name: 'José Ferreira de Melo',
      cnh_category: 'E',
    },
    total_allocated_students: 54,
    is_active: true,
    stops: [
      { id: 301, name: 'Ponto Rio Verde', latitude: -15.772, longitude: -47.899, students_count: 22 },
      { id: 302, name: 'Escola Polo Zumbi dos Palmares', latitude: -15.765, longitude: -47.91, students_count: 32 },
    ],
  },
];

export const RouteManagementPage: React.FC = () => {
  const [routes] = useState<RouteRecord[]>(mockRoutesData);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(1);
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.assigned_vehicle?.plate.toLowerCase().includes(search.toLowerCase()) ||
      r.assigned_driver?.name.toLowerCase().includes(search.toLowerCase());
    const matchesShift = !shiftFilter || r.shift === shiftFilter;
    return matchesSearch && matchesShift;
  });

  const mapViewerData: RouteMapData[] = routes.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    shift: r.shift,
    route_type: r.route_type,
    distance_km: r.distance_paved_km + r.distance_unpaved_km,
    stops: r.stops,
  }));

  const getShiftLabel = (shift: string) => {
    switch (shift) {
      case 'morning':
        return 'Matutino';
      case 'afternoon':
        return 'Vespertino';
      case 'night':
        return 'Noturno';
      default:
        return 'Integral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Ação de Cadastro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <RouteIcon className="w-6 h-6 text-emerald-500" />
            Gestão de Rotas & Itinerários Escolares
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mapeamento de trajetos rurais/urbanos, pontos de parada georreferenciados e controle de capacidade do veículo.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs">
          <Plus className="w-4 h-4" />
          Nova Rota
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por código, nome, placa ou condutor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={shiftFilter}
            onChange={(val) => setShiftFilter(String(val))}
            options={[
              { value: '', label: 'Todos os Turnos' },
              { value: 'morning', label: 'Matutino' },
              { value: 'afternoon', label: 'Vespertino' },
              { value: 'night', label: 'Noturno' },
              { value: 'full_day', label: 'Integral' },
            ]}
          />
        </div>
      </div>

      {/* Grid com Tabela e Mapa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="text-xs font-semibold">ROTA / ITINERÁRIO</TableHead>
                  <TableHead className="text-xs font-semibold">TURNO / TIPO</TableHead>
                  <TableHead className="text-xs font-semibold">VEÍCULO / CONDUTOR</TableHead>
                  <TableHead className="text-xs font-semibold text-center">OCUPAÇÃO</TableHead>
                  <TableHead className="text-xs font-semibold text-right">DISTÂNCIA</TableHead>
                  <TableHead className="text-xs font-semibold text-center">MAPA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoutes.map((route) => {
                  const totalDist = route.distance_paved_km + route.distance_unpaved_km;
                  const capacity = route.assigned_vehicle?.capacity_seats ?? 0;
                  const occupiedPercent = capacity > 0 ? (route.total_allocated_students / capacity) * 100 : 0;
                  const isOvercapacity = occupiedPercent > 100;
                  const isSelected = selectedRouteId === route.id;

                  return (
                    <TableRow
                      key={route.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer ${
                        isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-l-2 border-emerald-500' : ''
                      }`}
                      onClick={() => setSelectedRouteId(route.id)}
                    >
                      <TableCell className="text-xs">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{route.code}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{route.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {route.stops.length} ponto(s) de embarque
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {getShiftLabel(route.shift)}
                        </Badge>
                        <div className="text-[11px] text-slate-500 capitalize mt-1">
                          Zona {route.route_type}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {route.assigned_vehicle ? (
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {route.assigned_vehicle.plate}
                          </div>
                        ) : (
                          <span className="text-rose-500 font-sans text-xs">Sem veículo</span>
                        )}
                        {route.assigned_driver ? (
                          <div className="text-[11px] text-slate-500 font-sans truncate max-w-[130px]">
                            {route.assigned_driver.name}
                          </div>
                        ) : (
                          <span className="text-amber-500 font-sans text-xs">Sem condutor</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs tabular-nums">
                        <div
                          className={`font-bold ${
                            isOvercapacity
                              ? 'text-rose-500'
                              : occupiedPercent >= 85
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {route.total_allocated_students} / {capacity}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {capacity > 0 ? `${occupiedPercent.toFixed(0)}%` : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        <div>{totalDist.toFixed(1)} km</div>
                        <div className="text-[10px] text-slate-400">{route.estimated_duration_minutes} min</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={isSelected ? 'default' : 'ghost'}
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRouteId(route.id);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mapa Interativo ao Lado */}
        <div className="lg:col-span-5">
          <TransportMapViewer routes={mapViewerData} selectedRouteId={selectedRouteId} height="520px" />
        </div>
      </div>
    </div>
  );
};
