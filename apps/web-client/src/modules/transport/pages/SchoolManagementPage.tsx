import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Card,
  CardContent,
  DataTable,
  Badge,
  Button,
  Input,
  Select,
  Modal,
} from '@sysgov/ui';
import {
  School,
  Plus,
  Search,
  MapPin,
  Users,
  Route as RouteIcon,
  Pencil,
  Trash2,
  Save,
  AlertCircle,
  Compass,
} from 'lucide-react';
import { apiClient } from '@/core/api/client';
import { TransportMapViewer } from '../components/TransportMapViewer';

interface SchoolRecord {
  id: number;
  inep_code: string;
  name: string;
  zone: 'rural' | 'urban';
  address: string;
  latitude: number;
  longitude: number;
  total_transported_students: number;
  routes_count: number;
}

const initialSchoolForm = {
  name: '',
  inep_code: '',
  zone: 'rural' as 'rural' | 'urban',
  address: '',
  latitude: -15.81,
  longitude: -47.872,
};

export const SchoolManagementPage: React.FC = () => {
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showMap, setShowMap] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialSchoolForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/transport/schools');
      if (res.data && Array.isArray(res.data.data)) {
        setSchools(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialSchoolForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (school: SchoolRecord) => {
    setEditingId(school.id);
    setFormData({
      name: school.name,
      inep_code: school.inep_code,
      zone: school.zone,
      address: school.address,
      latitude: school.latitude,
      longitude: school.longitude,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setFormError('Informe o nome da unidade escolar.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: formData.name,
        inep_code: formData.inep_code,
        zone: formData.zone,
        address: formData.address,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      };

      if (editingId) {
        await apiClient.put(`/transport/schools/${editingId}`, payload);
      } else {
        await apiClient.post('/transport/schools', payload);
      }

      await fetchSchools();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar escola.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirma a exclusão desta unidade escolar?')) return;
    try {
      await apiClient.delete(`/transport/schools/${id}`);
      setSchools((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert('Falha ao excluir escola: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const filteredSchools = useMemo(() => {
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.inep_code.includes(search) ||
        s.address.toLowerCase().includes(search.toLowerCase())
    );
  }, [schools, search]);

  const schoolStops = useMemo(() => {
    return filteredSchools.map((s) => ({
      id: s.id,
      name: s.name,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      zone_type: s.zone,
      description: `${s.total_transported_students} alunos transportados | ${s.routes_count} rotas vinculadas`,
      students_count: s.total_transported_students,
    }));
  }, [filteredSchools]);

  const columns = useMemo<ColumnDef<SchoolRecord>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'INEP / ESCOLA',
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-emerald-500" />
              {row.original.name}
            </div>
            <div className="font-mono text-[11px] text-slate-500 tabular-nums">INEP: {row.original.inep_code || '-'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'address',
        header: 'LOCALIZAÇÃO / ENDEREÇO',
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="text-slate-700 dark:text-slate-300">{row.original.address || 'Sem endereço informado'}</div>
            <div className="font-mono text-[11px] text-slate-400 tabular-nums">
              Lat: {Number(row.original.latitude).toFixed(4)} | Lng: {Number(row.original.longitude).toFixed(4)}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'zone',
        header: 'ZONA',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] capitalize">
            {row.original.zone === 'rural' ? 'Zona Rural' : 'Zona Urbana'}
          </Badge>
        ),
      },
      {
        accessorKey: 'routes_count',
        header: 'ROTAS ATENDENDO',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 font-mono text-xs tabular-nums font-semibold text-slate-800 dark:text-slate-200">
            <RouteIcon className="w-3.5 h-3.5 text-cyan-500" />
            {row.original.routes_count} rota(s)
          </div>
        ),
      },
      {
        accessorKey: 'total_transported_students',
        header: 'ALUNOS TRANSPORTADOS',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 font-mono text-xs tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
            <Users className="w-3.5 h-3.5" />
            {row.original.total_transported_students} alunos
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'AÇÕES',
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(row.original)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-cyan-500"
              title="Editar Escola"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-rose-500"
              title="Excluir Escola"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <School className="w-6 h-6 text-emerald-500" />
            Polos & Unidades Escolares Atendidas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão de geolocalização dos polos escolares municipais e estaduais atendidos pelas rotas do PNATE/SETE.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-1.5 text-xs"
          >
            <MapPin className="w-4 h-4 text-emerald-500" />
            {showMap ? 'Ocultar Mapa' : 'Exibir Mapa'}
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Escola
          </Button>
        </div>
      </div>

      {/* Mapa Superior Ampliado */}
      {showMap && (
        <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-500" />
              Georreferenciamento de Polos Escolares ({filteredSchools.length} escolas plotadas)
            </span>
            <span className="text-[11px] text-slate-500">
              Clique em qualquer polo escolar no mapa para visualizar os detalhes completos
            </span>
          </div>
          <TransportMapViewer
            stops={schoolStops}
            interactive={true}
            height="580px"
            className="h-[580px] w-full"
            showCoordinatesTooltip={true}
          />
        </Card>
      )}

      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <Input
          placeholder="Buscar por nome da escola, código INEP ou endereço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <DataTable
          columns={columns}
          data={filteredSchools}
          loading={loading}
          emptyText="Nenhuma escola encontrada com os filtros atuais."
          pageSize={10}
          pagination={true}
        />
      </Card>

      {/* MODAL: UNIDADE ESCOLAR */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        size="2xl"
        title={editingId ? 'Editar Unidade Escolar' : 'Cadastrar Unidade Escolar'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 flex items-center gap-2 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nome da Escola *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Código INEP / MEC</label>
              <Input
                value={formData.inep_code}
                onChange={(e) => setFormData({ ...formData, inep_code: e.target.value })}
                className="mt-1 text-xs font-mono"
                placeholder="41000000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Zona de Localização *</label>
              <Select
                value={formData.zone}
                onChange={(val: any) => setFormData({ ...formData, zone: val as any })}
                options={[
                  { value: 'rural', label: 'Zona Rural' },
                  { value: 'urban', label: 'Zona Urbana' },
                ]}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Endereço / Localidade</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 text-xs"
                placeholder="Estrada, Bairro ou Comunidade"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Latitude (Coordenada GPS) *</label>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                required
                className="mt-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Longitude (Coordenada GPS) *</label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                required
                className="mt-1 text-xs font-mono"
              />
            </div>
          </div>

          {/* Mini-map picker inside modal */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Clique no mapa abaixo para selecionar a localização exata da escola:</span>
              <span className="font-mono text-cyan-500 font-bold">
                {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
              </span>
            </div>
            <TransportMapViewer
              center={[Number(formData.latitude), Number(formData.longitude)]}
              zoom={13}
              interactive={true}
              height="240px"
              onPointAdded={(lat, lng) => {
                setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
              }}
              stops={[
                {
                  id: 99999,
                  name: formData.name || 'Nova Escola',
                  latitude: Number(formData.latitude),
                  longitude: Number(formData.longitude),
                  zone_type: formData.zone,
                },
              ]}
              className="h-60 w-full"
              showCoordinatesTooltip={false}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Escola'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
