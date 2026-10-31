import React, { useState, useEffect } from 'react';
import {
  Card,
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
  Modal,
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
  Pencil,
  Trash2,
  Save,
  AlertCircle,
  PenTool,
} from 'lucide-react';
import { TransportMapViewer, RouteMapData } from '../components/TransportMapViewer';
import { apiClient } from '@/core/api/client';

interface RouteRecord {
  id: number;
  code: string;
  name: string;
  shift: 'morning' | 'afternoon' | 'night' | 'full_day';
  route_type: 'rural' | 'urban' | 'mixed';
  distance_paved_km: number;
  distance_unpaved_km: number;
  estimated_duration_minutes: number;
  assigned_vehicle_id?: number | null;
  assigned_driver_id?: number | null;
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
  total_allocated_students?: number;
  is_active: boolean;
  shape_geojson?: string | null;
  stops?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    students_count?: number;
  }[];
}

const initialRouteForm: Partial<RouteRecord> = {
  code: '',
  name: '',
  shift: 'morning',
  route_type: 'rural',
  distance_paved_km: 10.0,
  distance_unpaved_km: 15.0,
  estimated_duration_minutes: 45,
  is_active: true,
};

export const RouteManagementPage: React.FC = () => {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [vehicles, setVehicles] = useState<{ id: number; plate: string; model: string }[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');

  // Interactive Drawing
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<RouteRecord>>(initialRouteForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRoutes = async () => {
    try {
      const res = await apiClient.get('/transport/routes');
      if (res.data && Array.isArray(res.data.data)) {
        setRoutes(res.data.data);
        if (res.data.data.length > 0 && !selectedRouteId) {
          setSelectedRouteId(res.data.data[0].id);
        }
      }
    } catch {
      // Fallback
    }
  };

  const fetchVehiclesList = async () => {
    try {
      const res = await apiClient.get('/transport/vehicles');
      if (res.data && Array.isArray(res.data.data)) {
        setVehicles(res.data.data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchVehiclesList();
  }, []);

  const handlePointAdded = (lat: number, lng: number) => {
    setDrawnPoints((prev) => [...prev, [lat, lng]]);
  };

  const handleClearDrawing = () => {
    setDrawnPoints([]);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      ...initialRouteForm,
      code: 'ROTA-' + strtoupper(substr(uniqid(), -4)),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  function strtoupper(str: string) {
    return str.toUpperCase();
  }
  function substr(str: string, start: number) {
    return str.slice(start);
  }
  function uniqid() {
    return Math.random().toString(36).substring(2, 9);
  }

  const handleOpenEdit = (route: RouteRecord) => {
    setEditingId(route.id);
    setFormData({ ...route });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      setFormError('Informe o código e o nome da rota.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...formData,
        waypoints_geojson: drawnPoints.length > 0 ? drawnPoints : undefined,
      };

      if (editingId) {
        await apiClient.put(`/transport/routes/${editingId}`, payload);
      } else {
        await apiClient.post('/transport/routes', payload);
      }
      setIsModalOpen(false);
      setDrawnPoints([]);
      setIsDrawingMode(false);
      fetchRoutes();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar rota. Verifique os dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Confirma a exclusão desta rota?')) {
      try {
        await apiClient.delete(`/transport/routes/${id}`);
        fetchRoutes();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Falha ao excluir rota.');
      }
    }
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.assigned_vehicle?.plate.toLowerCase().includes(search.toLowerCase());
    const matchesShift = !shiftFilter || r.shift === shiftFilter;
    return matchesSearch && matchesShift;
  });

  const mapViewerData: RouteMapData[] = routes.map((r) => {
    let parsedWaypoints: [number, number][] | undefined = undefined;
    if (r.shape_geojson) {
      try {
        const parsed = JSON.parse(r.shape_geojson);
        if (Array.isArray(parsed)) parsedWaypoints = parsed;
      } catch {}
    }

    return {
      id: r.id,
      code: r.code,
      name: r.name,
      shift: r.shift,
      route_type: r.route_type,
      distance_km: (r.distance_paved_km || 0) + (r.distance_unpaved_km || 0),
      waypoints: parsedWaypoints,
      stops: r.stops,
    };
  });

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
      {/* Header & Ações */}
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
        <div className="flex items-center gap-2">
          <Button
            variant={isDrawingMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`text-xs flex items-center gap-1.5 font-mono ${
              isDrawingMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            {isDrawingMode ? 'Concluir Desenho' : 'Desenhar Traçado no Mapa'}
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            Nova Rota
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por código, nome, placa do veículo..."
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
                  <TableHead className="text-xs font-semibold">VEÍCULO VINCULADO</TableHead>
                  <TableHead className="text-xs font-semibold text-right">DISTÂNCIA</TableHead>
                  <TableHead className="text-xs font-semibold text-right">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoutes.map((route) => {
                  const totalDist = (route.distance_paved_km || 0) + (route.distance_unpaved_km || 0);
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
                            <span className="text-[10px] text-slate-400 block font-sans">
                              ({route.assigned_vehicle.capacity_seats} lug.)
                            </span>
                          </div>
                        ) : (
                          <span className="text-rose-500 font-sans text-xs">Sem veículo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        <div>{totalDist.toFixed(1)} km</div>
                        <div className="text-[10px] text-slate-400">{route.estimated_duration_minutes || 0} min</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant={isSelected ? 'default' : 'ghost'}
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRouteId(route.id);
                            }}
                            title="Visualizar no Mapa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(route);
                            }}
                            className="h-7 w-7 p-0 text-slate-600 hover:text-emerald-600"
                            title="Editar Rota"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(route.id);
                            }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                            title="Excluir Rota"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mapa Interativo com suporte a desenho e zoom */}
        <div className="lg:col-span-5">
          <TransportMapViewer
            routes={mapViewerData}
            selectedRouteId={selectedRouteId}
            height="520px"
            isDrawingMode={isDrawingMode}
            onPointAdded={handlePointAdded}
            drawnPoints={drawnPoints}
            onClearDrawing={handleClearDrawing}
          />
        </div>
      </div>

      {/* Modal de Criação / Edição de Rota */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingId ? 'Editar Rota Escolar' : 'Cadastrar Nova Rota Escolar'}
        description="Defina os parâmetros do trajeto, tipo de via, veículo designado e coordenadas."
      >
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Código da Rota *
              </label>
              <Input
                placeholder="Ex: ROTA-RUR-01"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="font-mono text-xs uppercase"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Turno de Atendimento *
              </label>
              <Select
                value={formData.shift || 'morning'}
                onChange={(val) => setFormData({ ...formData, shift: val as any })}
                options={[
                  { value: 'morning', label: 'Matutino' },
                  { value: 'afternoon', label: 'Vespertino' },
                  { value: 'night', label: 'Noturno' },
                  { value: 'full_day', label: 'Integral' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nome / Itinerário Descritivo *
            </label>
            <Input
              placeholder="Ex: Linha Veredas - Assentamento Esperança até a Escola Polo"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tipo da Zona
              </label>
              <Select
                value={formData.route_type || 'rural'}
                onChange={(val) => setFormData({ ...formData, route_type: val as any })}
                options={[
                  { value: 'rural', label: 'Rural' },
                  { value: 'urban', label: 'Urbana' },
                  { value: 'mixed', label: 'Mista' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Veículo Designado
              </label>
              <Select
                value={formData.assigned_vehicle_id ? String(formData.assigned_vehicle_id) : ''}
                onChange={(val) =>
                  setFormData({ ...formData, assigned_vehicle_id: val ? parseInt(String(val), 10) : null })
                }
                options={[
                  { value: '', label: 'Nenhum veículo selecionado' },
                  ...vehicles.map((v) => ({
                    value: String(v.id),
                    label: `${v.plate} - ${v.model}`,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Km Asfaltado
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.distance_paved_km || 0}
                onChange={(e) => setFormData({ ...formData, distance_paved_km: parseFloat(e.target.value) || 0 })}
                className="font-mono text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Km Terra / Rural
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.distance_unpaved_km || 0}
                onChange={(e) => setFormData({ ...formData, distance_unpaved_km: parseFloat(e.target.value) || 0 })}
                className="font-mono text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Duração Estimada (min)
              </label>
              <Input
                type="number"
                min="0"
                value={formData.estimated_duration_minutes || 0}
                onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value, 10) || 0 })}
                className="font-mono text-xs tabular-nums"
              />
            </div>
          </div>

          {drawnPoints.length > 0 && (
            <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200">
              ✓ {drawnPoints.length} coordenadas capturadas interativamente no mapa para salvar neste traçado.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Salvando...' : editingId ? 'Atualizar Rota' : 'Salvar Rota'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
