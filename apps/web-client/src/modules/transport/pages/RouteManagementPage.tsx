import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  DataTable,
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
  distance_paved_km: 10,
  distance_unpaved_km: 15,
  estimated_duration_minutes: 45,
  assigned_vehicle_id: undefined,
  is_active: true,
};

export const RouteManagementPage: React.FC = () => {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [vehicles, setVehicles] = useState<{ id: number; plate: string; model: string }[]>([]);
  const [drivers, setDrivers] = useState<{ id: number; name: string }[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<RouteRecord>>(initialRouteForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/transport/routes');
      if (response?.data?.data) {
        setRoutes(response.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchVehiclesAndDrivers = async () => {
    try {
      const [resVehicles, resDrivers] = await Promise.all([
        apiClient.get('/transport/vehicles'),
        apiClient.get('/transport/drivers'),
      ]);
      if (resVehicles?.data?.data) {
        setVehicles(resVehicles.data.data);
      }
      if (resDrivers?.data?.data) {
        setDrivers(
          resDrivers.data.data.map((d: any) => ({
            id: d.id,
            name: d.pessoa?.nome || 'Condutor ' + d.id,
          }))
        );
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchVehiclesAndDrivers();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialRouteForm);
    setDrawnPoints([]);
    setIsDrawingMode(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (route: RouteRecord) => {
    setEditingId(route.id);
    setFormData({
      ...route,
      distance_paved_km: Number(route.distance_paved_km || 0),
      distance_unpaved_km: Number(route.distance_unpaved_km || 0),
      estimated_duration_minutes: Number(route.estimated_duration_minutes || 0),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      setFormError('Preencha os campos obrigatórios (Código e Nome da Rota).');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload: any = {
        code: formData.code,
        name: formData.name,
        shift: formData.shift || 'morning',
        route_type: formData.route_type || 'rural',
        distance_paved_km: Number(formData.distance_paved_km) || 0,
        distance_unpaved_km: Number(formData.distance_unpaved_km) || 0,
        estimated_duration_minutes: Number(formData.estimated_duration_minutes) || 30,
        assigned_vehicle_id: formData.assigned_vehicle_id || null,
        assigned_driver_id: formData.assigned_driver_id || null,
        is_active: formData.is_active ?? true,
      };

      if (drawnPoints.length > 0) {
        payload.shape_geojson = JSON.stringify({
          type: 'LineString',
          coordinates: drawnPoints.map((pt) => [pt[1], pt[0]]),
        });
      }

      if (editingId) {
        await apiClient.put(`/transport/routes/${editingId}`, payload);
      } else {
        await apiClient.post('/transport/routes', payload);
      }

      await fetchRoutes();
      setIsModalOpen(false);
      setIsDrawingMode(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar rota escolar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirma a exclusão desta rota escolar?')) return;
    try {
      await apiClient.delete(`/transport/routes/${id}`);
      setRoutes((prev) => prev.filter((r) => r.id !== id));
      if (selectedRouteId === id) setSelectedRouteId(null);
    } catch (err: any) {
      alert('Falha ao excluir rota: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const handlePointAdded = (lat: number, lng: number) => {
    setDrawnPoints((prev) => [...prev, [lat, lng]]);
  };

  const handleClearDrawing = () => {
    setDrawnPoints([]);
  };

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || r.route_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [routes, search, typeFilter]);

  const mapRoutesData: RouteMapData[] = useMemo(() => {
    return routes.map((r) => {
      let waypoints: [number, number][] = [];
      if (r.shape_geojson) {
        try {
          const parsed = JSON.parse(r.shape_geojson);
          if (parsed.type === 'LineString' && Array.isArray(parsed.coordinates)) {
            waypoints = parsed.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          }
        } catch {
          // ignore
        }
      }
      return {
        id: r.id,
        code: r.code,
        name: r.name,
        shift: r.shift,
        route_type: r.route_type,
        distance_km: Number(r.distance_paved_km) + Number(r.distance_unpaved_km),
        waypoints,
        stops: r.stops || [],
      };
    });
  }, [routes]);

  const columns = useMemo<ColumnDef<RouteRecord>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'CÓDIGO / ROTA',
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <RouteIcon className="w-3.5 h-3.5 text-emerald-500" />
              {row.original.code}
            </div>
            <div className="text-[11px] text-slate-500">{row.original.name}</div>
          </div>
        ),
      },
      {
        accessorKey: 'route_type',
        header: 'TIPO / TURNO',
        cell: ({ row }) => (
          <div className="text-xs">
            <Badge variant="outline" className="text-[10px] capitalize">
              {row.original.route_type === 'rural' ? 'Rural' : 'Urbana'}
            </Badge>
            <div className="text-[10px] text-slate-500 mt-0.5 capitalize">
              {row.original.shift === 'morning' ? 'Manhã' : row.original.shift === 'afternoon' ? 'Tarde' : 'Integral'}
            </div>
          </div>
        ),
      },
      {
        id: 'distance',
        header: 'EXTENSÃO (KM)',
        cell: ({ row }) => {
          const total = Number(row.original.distance_paved_km || 0) + Number(row.original.distance_unpaved_km || 0);
          return (
            <div className="font-mono text-xs tabular-nums font-semibold text-slate-800 dark:text-slate-200">
              <div>{total.toFixed(1)} km</div>
              <div className="text-[10px] text-slate-400 font-sans">
                {Number(row.original.distance_unpaved_km || 0).toFixed(1)} km terra
              </div>
            </div>
          );
        },
      },
      {
        id: 'assigned',
        header: 'VEÍCULO / CONDUTOR',
        cell: ({ row }) => (
          <div className="text-xs">
            {row.original.assigned_vehicle ? (
              <div className="font-mono text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1">
                <Bus className="w-3 h-3 text-emerald-500" />
                {row.original.assigned_vehicle.plate}
              </div>
            ) : (
              <span className="text-slate-400 text-[11px]">Sem veículo</span>
            )}
            <div className="text-[11px] text-slate-500">
              {row.original.assigned_driver ? row.original.assigned_driver.name : 'Sem condutor'}
            </div>
          </div>
        ),
      },
      {
        id: 'students',
        header: 'ALUNOS',
        cell: ({ row }) => (
          <div className="font-mono text-xs tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
            {row.original.total_allocated_students || (row.original.stops?.reduce((acc, s) => acc + (s.students_count || 0), 0)) || 0} alunos
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'AÇÕES',
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant={selectedRouteId === row.original.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedRouteId(selectedRouteId === row.original.id ? null : row.original.id)}
              className="h-7 w-7 p-0"
              title="Focar rota no mapa"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(row.original)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-cyan-500"
              title="Editar rota"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-rose-500"
              title="Excluir rota"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [selectedRouteId]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <RouteIcon className="w-6 h-6 text-emerald-500" />
            Gestão de Rotas & Itinerários Escolares
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Traçados georreferenciados, pontos de parada rurais, cálculo de distâncias pavimentadas/não-pavimentadas e vínculo com frota.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isDrawingMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`text-xs flex items-center gap-1.5 font-semibold ${
              isDrawingMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            {isDrawingMode ? 'Concluir Traçado' : 'Desenhar Traçado no Mapa'}
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Nova Rota
          </Button>
        </div>
      </div>

      {/* Visualizador de Mapa Ampliado (height="620px") com Interatividade Completa */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Mapa da Malha de Rotas Municipais</span>
          <span className="font-mono text-cyan-600 font-medium">Clique em qualquer marcador para ver os detalhes completos</span>
        </div>
        <TransportMapViewer
          routes={mapRoutesData}
          selectedRouteId={selectedRouteId}
          height="620px"
          isDrawingMode={isDrawingMode}
          onPointAdded={handlePointAdded}
          drawnPoints={drawnPoints}
          onClearDrawing={handleClearDrawing}
          showCoordinatesTooltip={true}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por código ou nome da rota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={typeFilter}
            onChange={(val: any) => setTypeFilter(String(val))}
            options={[
              { value: '', label: 'Todos os Tipos' },
              { value: 'rural', label: 'Rotas Rurais' },
              { value: 'urban', label: 'Rotas Urbanas' },
              { value: 'mixed', label: 'Rotas Mistas' },
            ]}
          />
        </div>
      </div>

      {/* DATA TABLE DE ROTAS SEGUINDO PADRÃO SYSGOV */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-3">
          <DataTable
            columns={columns}
            data={filteredRoutes}
            loading={loading}
            emptyText="Nenhuma rota cadastrada."
            pageSize={10}
            pagination={filteredRoutes.length > 10}
          />
        </div>
      </Card>

      {/* MODAL DE CADASTRO / EDIÇÃO AMPLIADO (size="2xl") */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingId ? 'Editar Rota Escolar' : 'Nova Rota Escolar'}
        size="2xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {formError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 flex items-center gap-2 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Código da Rota *
              </label>
              <Input
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="ROTA-RUR-01"
                required
                className="font-mono text-xs uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nome do Itinerário *
              </label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Linha Veredas - Assentamento Esperança"
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tipo de Rota
              </label>
              <Select
                value={formData.route_type || 'rural'}
                onChange={(val: any) => setFormData({ ...formData, route_type: val as any })}
                options={[
                  { value: 'rural', label: 'Rota Rural' },
                  { value: 'urban', label: 'Rota Urbana' },
                  { value: 'mixed', label: 'Rota Mista' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Turno de Atendimento
              </label>
              <Select
                value={formData.shift || 'morning'}
                onChange={(val: any) => setFormData({ ...formData, shift: val as any })}
                options={[
                  { value: 'morning', label: 'Matutino (Manhã)' },
                  { value: 'afternoon', label: 'Vespertino (Tarde)' },
                  { value: 'night', label: 'Noturno (Noite)' },
                  { value: 'full_day', label: 'Integral' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Km Pavimentado (Asfalto)
              </label>
              <Input
                type="number"
                step="0.1"
                value={formData.distance_paved_km || 0}
                onChange={(e) => setFormData({ ...formData, distance_paved_km: Number(e.target.value) })}
                className="font-mono text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Km Não Pavimentado (Terra)
              </label>
              <Input
                type="number"
                step="0.1"
                value={formData.distance_unpaved_km || 0}
                onChange={(e) => setFormData({ ...formData, distance_unpaved_km: Number(e.target.value) })}
                className="font-mono text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Duração Estimada (min)
              </label>
              <Input
                type="number"
                value={formData.estimated_duration_minutes || 45}
                onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: Number(e.target.value) })}
                className="font-mono text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Veículo Designado
              </label>
              <Select
                value={formData.assigned_vehicle_id ? String(formData.assigned_vehicle_id) : ''}
                onChange={(val: any) => setFormData({ ...formData, assigned_vehicle_id: val ? Number(val) : null })}
                options={[
                  { value: '', label: 'Nenhum veículo vinculado' },
                  ...vehicles.map((v) => ({
                    value: String(v.id),
                    label: `${v.plate} - ${v.model}`,
                  })),
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Motorista Designado
              </label>
              <Select
                value={formData.assigned_driver_id ? String(formData.assigned_driver_id) : ''}
                onChange={(val: any) => setFormData({ ...formData, assigned_driver_id: val ? Number(val) : null })}
                options={[
                  { value: '', label: 'Nenhum motorista vinculado' },
                  ...drivers.map((d) => ({
                    value: String(d.id),
                    label: d.name,
                  })),
                ]}
              />
            </div>
          </div>

          {drawnPoints.length > 0 && (
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
              <span className="text-emerald-800 dark:text-emerald-300">
                Traçado capturado do mapa: <strong>{drawnPoints.length} pontos georreferenciados</strong>.
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearDrawing}
                className="text-rose-500 hover:text-rose-600 text-xs h-7"
              >
                Remover Traçado
              </Button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 font-semibold"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Rota'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
