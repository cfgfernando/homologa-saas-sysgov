import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Card,
  DataTable,
  Badge,
  Button,
  Input,
  Select,
  Modal,
} from '@sysgov/ui';
import {
  GraduationCap,
  Plus,
  Search,
  Upload,
  MapPin,
  CheckCircle2,
  Accessibility,
  Pencil,
  Trash2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/core/api/client';

interface StudentAllocationItem {
  id: number;
  student_name: string;
  registration: string;
  school_name: string;
  route_id: number;
  route_code: string;
  stop_name: string;
  shift: 'morning' | 'afternoon' | 'full_day';
  distance_home_school_km: number;
  census_eligible_pnate: boolean;
  has_special_needs: boolean;
  status: 'active' | 'transferred' | 'cancelled';
}

const initialStudentForm: Partial<StudentAllocationItem> = {
  student_name: '',
  registration: '',
  school_name: 'Escola Municipal Castro Alves',
  route_id: 1,
  route_code: 'ROTA-RUR-01',
  stop_name: 'Ponto Principal',
  shift: 'morning',
  distance_home_school_km: 3.5,
  census_eligible_pnate: true,
  has_special_needs: false,
  status: 'active',
};

export const StudentManagementPage: React.FC = () => {
  const [students, setStudents] = useState<StudentAllocationItem[]>([]);
  const [routes, setRoutes] = useState<{ id: number; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [routeFilter, setRouteFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<StudentAllocationItem>>(initialStudentForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAllocations = async () => {
    try {
      const res = await apiClient.get('/transport/allocations');
      if (res.data && Array.isArray(res.data.data)) {
        setStudents(
          res.data.data.map((item: any) => ({
            id: item.id,
            student_name: item.student?.nome || item.pessoa?.nome || 'Estudante ' + item.id,
            registration: 'MAT-' + item.id.toString().padStart(4, '0'),
            school_name: 'Escola Polo Municipal',
            route_id: item.route_id,
            route_code: item.route?.code || 'ROTA-' + item.route_id,
            stop_name: item.stop?.name || 'Ponto de Embarque',
            shift: item.shift || 'morning',
            distance_home_school_km: item.distance_home_school_km || 3.8,
            census_eligible_pnate: Boolean(item.census_eligible_pnate || item.is_pnate_eligible),
            has_special_needs: Boolean(item.special_needs),
            status: item.status || 'active',
          }))
        );
      }
    } catch {
      // Fallback
    }
  };

  const fetchRoutesList = async () => {
    try {
      const res = await apiClient.get('/transport/routes');
      if (res.data && Array.isArray(res.data.data)) {
        setRoutes(
          res.data.data.map((r: any) => ({
            id: r.id,
            code: r.code || 'ROTA-' + r.id,
            name: r.name || 'Rota ' + r.id,
          }))
        );
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAllocations(), fetchRoutesList()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      ...initialStudentForm,
      route_id: routes[0]?.id || 1,
      route_code: routes[0]?.code || 'ROTA-01',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: StudentAllocationItem) => {
    setEditingId(s.id);
    setFormData({ ...s });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_name) {
      setFormError('Informe o nome do aluno.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        student_id: editingId || 1,
        route_id: formData.route_id,
        shift: formData.shift,
        distance_home_school_km: Number(formData.distance_home_school_km),
        is_pnate_eligible: Number(formData.distance_home_school_km || 0) >= 2.0,
        special_needs: formData.has_special_needs,
        status: formData.status || 'active',
      };

      if (editingId) {
        await apiClient.put(`/transport/allocations/${editingId}`, payload);
      } else {
        await apiClient.post('/transport/allocations', payload);
      }

      await fetchAllocations();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar dados do aluno.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirma a remoção da alocação de transporte deste aluno?')) return;
    try {
      await apiClient.delete(`/transport/allocations/${id}`);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert('Falha ao excluir alocação: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.student_name.toLowerCase().includes(search.toLowerCase()) ||
        s.registration.toLowerCase().includes(search.toLowerCase()) ||
        s.school_name.toLowerCase().includes(search.toLowerCase());
      const matchesRoute = !routeFilter || s.route_code === routeFilter;
      return matchesSearch && matchesRoute;
    });
  }, [students, search, routeFilter]);

  const columns = useMemo<ColumnDef<StudentAllocationItem>[]>(
    () => [
      {
        accessorKey: 'student_name',
        header: 'MATRÍCULA / ALUNO',
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              {row.original.student_name}
              {row.original.has_special_needs && (
                <Badge variant="outline" className="border-indigo-500 text-indigo-500 text-[10px] py-0 px-1">
                  <Accessibility className="w-3 h-3 mr-0.5 inline" /> PCD
                </Badge>
              )}
            </div>
            <div className="font-mono text-[11px] text-slate-500 tabular-nums">{row.original.registration}</div>
          </div>
        ),
      },
      {
        accessorKey: 'school_name',
        header: 'UNIDADE ESCOLAR',
        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
            {row.original.school_name}
          </span>
        ),
      },
      {
        accessorKey: 'route_code',
        header: 'ROTA / PONTO DE EMBARQUE',
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{row.original.route_code}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-500" />
              {row.original.stop_name}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'shift',
        header: 'TURNO',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] capitalize">
            {row.original.shift === 'morning' ? 'Matutino' : row.original.shift === 'afternoon' ? 'Vespertino' : 'Integral'}
          </Badge>
        ),
      },
      {
        accessorKey: 'distance_home_school_km',
        header: 'DISTÂNCIA',
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums font-semibold text-slate-800 dark:text-slate-200">
            {row.original.distance_home_school_km.toFixed(1)} km
          </span>
        ),
      },
      {
        accessorKey: 'census_eligible_pnate',
        header: 'PNATE (FNDE)',
        cell: ({ row }) =>
          row.original.census_eligible_pnate ? (
            <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Elegível (&gt; 2 km)
            </Badge>
          ) : (
            <Badge variant="outline" className="border-slate-400 text-slate-500 text-[10px]">
              Não Elegível
            </Badge>
          ),
      },
      {
        id: 'actions',
        header: 'AÇÕES',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(row.original)}
              className="h-7 w-7 p-0 text-slate-600 hover:text-emerald-600"
              title="Editar Aluno"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
              title="Excluir Aluno"
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
            <GraduationCap className="w-6 h-6 text-emerald-500" />
            Alunos & Alocação PNATE
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mapeamento de estudantes transportados, regras de elegibilidade FNDE/PNATE (&gt; 2km da escola) e censo escolar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
            onClick={() => alert('Exportando relatório para sincronização com o Censo Escolar MEC/Inep...')}
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            Exportar Censo Inep
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Aluno
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por nome, matrícula ou escola..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={routeFilter}
            onChange={(val: any) => setRouteFilter(String(val))}
            options={[
              { value: '', label: 'Todas as Rotas' },
              ...routes.map((r) => ({ value: r.code, label: r.code })),
            ]}
          />
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <DataTable
          columns={columns}
          data={filteredStudents}
          loading={loading}
          emptyText="Nenhum aluno cadastrado ou encontrado com os filtros atuais."
          pageSize={10}
          pagination={true}
        />
      </Card>

      {/* Modal de Criação / Edição de Aluno */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        size="2xl"
        title={editingId ? 'Editar Aluno Transportado' : 'Cadastrar Aluno no Transporte Escolar'}
        description="Vincule o estudante à unidade escolar, rota de atendimento e calcule a elegibilidade PNATE."
      >
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Nome Completo do Estudante *
            </label>
            <Input
              placeholder="Ex: Bernardo Alves Santos"
              value={formData.student_name || ''}
              onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
              className="text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Escola Destino *
              </label>
              <Input
                placeholder="Ex: Escola Municipal Castro Alves"
                value={formData.school_name || ''}
                onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                className="text-xs"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Rota Escolar *
              </label>
              <Select
                value={String(formData.route_id || '')}
                onChange={(val: any) => {
                  const selRoute = routes.find((r) => String(r.id) === String(val));
                  setFormData({
                    ...formData,
                    route_id: parseInt(String(val), 10),
                    route_code: selRoute?.code || 'ROTA-01',
                  });
                }}
                options={routes.map((r) => ({
                  value: String(r.id),
                  label: `${r.code} - ${r.name}`,
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Ponto de Embarque
              </label>
              <Input
                placeholder="Ex: Comunidade São João"
                value={formData.stop_name || ''}
                onChange={(e) => setFormData({ ...formData, stop_name: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Turno
              </label>
              <Select
                value={formData.shift || 'morning'}
                onChange={(val: any) => setFormData({ ...formData, shift: val as any })}
                options={[
                  { value: 'morning', label: 'Matutino' },
                  { value: 'afternoon', label: 'Vespertino' },
                  { value: 'full_day', label: 'Integral' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Distância Casa-Escola (km)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.distance_home_school_km || 2.5}
                onChange={(e) =>
                  setFormData({ ...formData, distance_home_school_km: parseFloat(e.target.value) || 0 })
                }
                className="font-mono text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(formData.has_special_needs)}
                onChange={(e) => setFormData({ ...formData, has_special_needs: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Estudante com Necessidades Especiais (PCD)
            </label>
          </div>

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
              {saving ? 'Salvando...' : editingId ? 'Atualizar Aluno' : 'Salvar Aluno'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
