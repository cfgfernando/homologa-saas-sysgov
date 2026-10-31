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
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/core/api/client';

interface DriverItem {
  id: number;
  name: string;
  cpf: string;
  cnh_number: string;
  cnh_category: 'D' | 'E';
  cnh_due_date: string;
  school_course_due_date: string;
  toxicological_due_date: string;
  is_compliant: boolean;
  is_active: boolean;
}

interface MonitorItem {
  id: number;
  name: string;
  cpf: string;
  rg: string;
  phone: string;
  assigned_route_id?: number | null;
  assigned_route: string;
  is_active: boolean;
}

const initialDriverForm: Partial<DriverItem> = {
  name: '',
  cpf: '',
  cnh_number: '',
  cnh_category: 'D',
  cnh_due_date: '2028-06-30',
  school_course_due_date: '2028-12-31',
  toxicological_due_date: '2027-12-31',
  is_active: true,
};

const initialMonitorForm: Partial<MonitorItem> = {
  name: '',
  cpf: '',
  rg: '',
  phone: '',
  assigned_route_id: undefined,
  is_active: true,
};

export const DriverAndMonitorPage: React.FC = () => {
  const [subTab, setSubTab] = useState<'drivers' | 'monitors'>('drivers');
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [monitors, setMonitors] = useState<MonitorItem[]>([]);
  const [routes, setRoutes] = useState<{ id: number; code: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Driver Modal state
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [driverFormData, setDriverFormData] = useState<Partial<DriverItem>>(initialDriverForm);

  // Monitor Modal state
  const [isMonitorModalOpen, setIsMonitorModalOpen] = useState(false);
  const [editingMonitorId, setEditingMonitorId] = useState<number | null>(null);
  const [monitorFormData, setMonitorFormData] = useState<Partial<MonitorItem>>(initialMonitorForm);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDrivers = async () => {
    try {
      const res = await apiClient.get('/transport/drivers');
      if (res.data && Array.isArray(res.data.data)) {
        setDrivers(
          res.data.data.map((d: any) => ({
            id: d.id,
            name: d.user?.name || d.pessoa?.nome || 'Motorista ' + d.id,
            cpf: d.cpf || d.pessoa?.cpf || '000.000.000-00',
            cnh_number: d.cnh_number || '00000000000',
            cnh_category: d.cnh_category || 'D',
            cnh_due_date: d.cnh_due_date ? String(d.cnh_due_date).split('T')[0] : '2028-06-30',
            school_course_due_date: d.school_course_due_date ? String(d.school_course_due_date).split('T')[0] : '2028-12-31',
            toxicological_due_date: d.toxicological_due_date ? String(d.toxicological_due_date).split('T')[0] : '2027-12-31',
            is_compliant: Boolean(d.is_compliant),
            is_active: Boolean(d.is_active ?? true),
          }))
        );
      }
    } catch {
      // Fallback
    }
  };

  const fetchMonitors = async () => {
    try {
      const res = await apiClient.get('/transport/monitors');
      if (res.data && Array.isArray(res.data.data)) {
        setMonitors(
          res.data.data.map((m: any) => ({
            id: m.id,
            name: m.user?.name || m.pessoa?.nome || 'Monitor ' + m.id,
            cpf: m.cpf || m.pessoa?.cpf || '000.000.000-00',
            rg: m.rg || '00.000.000-0',
            phone: m.phone || '(00) 00000-0000',
            assigned_route_id: m.assigned_route_id || null,
            assigned_route: m.assigned_route?.code || (m.assigned_route_id ? `Rota #${m.assigned_route_id}` : 'Sem Rota'),
            is_active: Boolean(m.is_active ?? true),
          }))
        );
      }
    } catch {
      // Fallback
    }
  };

  const fetchRoutes = async () => {
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
    Promise.all([fetchDrivers(), fetchMonitors(), fetchRoutes()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Driver handlers
  const handleOpenCreateDriver = () => {
    setEditingDriverId(null);
    setDriverFormData(initialDriverForm);
    setFormError(null);
    setIsDriverModalOpen(true);
  };

  const handleOpenEditDriver = (d: DriverItem) => {
    setEditingDriverId(d.id);
    setDriverFormData({
      ...d,
      cnh_due_date: d.cnh_due_date ? String(d.cnh_due_date).split('T')[0] : '',
      school_course_due_date: d.school_course_due_date ? String(d.school_course_due_date).split('T')[0] : '',
      toxicological_due_date: d.toxicological_due_date ? String(d.toxicological_due_date).split('T')[0] : '',
    });
    setFormError(null);
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverFormData.name || !driverFormData.cnh_number) {
      setFormError('Preencha os campos obrigatórios (Nome e CNH).');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: driverFormData.name,
        cpf: driverFormData.cpf,
        cnh_number: driverFormData.cnh_number,
        cnh_category: driverFormData.cnh_category,
        cnh_due_date: driverFormData.cnh_due_date,
        school_course_due_date: driverFormData.school_course_due_date,
        toxicological_due_date: driverFormData.toxicological_due_date,
        is_compliant: driverFormData.is_compliant ?? true,
        is_active: driverFormData.is_active ?? true,
      };

      if (editingDriverId) {
        await apiClient.put(`/transport/drivers/${editingDriverId}`, payload);
      } else {
        await apiClient.post('/transport/drivers', payload);
      }

      await fetchDrivers();
      setIsDriverModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar dados do condutor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (!window.confirm('Confirma a exclusão deste condutor?')) return;
    try {
      await apiClient.delete(`/transport/drivers/${id}`);
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert('Falha ao excluir condutor: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  // Monitor handlers
  const handleOpenCreateMonitor = () => {
    setEditingMonitorId(null);
    setMonitorFormData(initialMonitorForm);
    setFormError(null);
    setIsMonitorModalOpen(true);
  };

  const handleOpenEditMonitor = (m: MonitorItem) => {
    setEditingMonitorId(m.id);
    setMonitorFormData({ ...m });
    setFormError(null);
    setIsMonitorModalOpen(true);
  };

  const handleSaveMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monitorFormData.name) {
      setFormError('Informe o nome do monitor.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: monitorFormData.name,
        cpf: monitorFormData.cpf,
        rg: monitorFormData.rg,
        phone: monitorFormData.phone,
        assigned_route_id: monitorFormData.assigned_route_id || null,
        is_active: monitorFormData.is_active,
      };

      if (editingMonitorId) {
        await apiClient.put(`/transport/monitors/${editingMonitorId}`, payload);
      } else {
        await apiClient.post('/transport/monitors', payload);
      }

      await fetchMonitors();
      setIsMonitorModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar dados do monitor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMonitor = async (id: number) => {
    if (!window.confirm('Confirma a exclusão deste monitor de bordo?')) return;
    try {
      await apiClient.delete(`/transport/monitors/${id}`);
      setMonitors((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert('Falha ao excluir monitor: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const filteredDrivers = useMemo(() => {
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.cpf.includes(search) ||
        d.cnh_number.includes(search)
    );
  }, [drivers, search]);

  const filteredMonitors = useMemo(() => {
    return monitors.filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.cpf.includes(search) ||
        m.phone.includes(search)
    );
  }, [monitors, search]);

  const driverColumns = useMemo<ColumnDef<DriverItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'MOTORISTA / CPF',
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">{row.original.name}</div>
            <div className="font-mono text-[11px] text-slate-500 tabular-nums">{row.original.cpf}</div>
          </div>
        ),
      },
      {
        accessorKey: 'cnh_number',
        header: 'Nº CNH / CATEGORIA',
        cell: ({ row }) => (
          <div className="font-mono text-xs tabular-nums font-semibold">
            <div>{row.original.cnh_number}</div>
            <Badge variant="outline" className="border-cyan-500 text-cyan-500 text-[10px] py-0 px-1 mt-0.5">
              Cat. {row.original.cnh_category}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'cnh_due_date',
        header: 'VALIDADE CNH',
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
            {row.original.cnh_due_date ? new Date(row.original.cnh_due_date).toLocaleDateString('pt-BR') : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'school_course_due_date',
        header: 'CURSO TRANSPORTE',
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
            {row.original.school_course_due_date ? new Date(row.original.school_course_due_date).toLocaleDateString('pt-BR') : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'toxicological_due_date',
        header: 'TOXICOLÓGICO',
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
            {row.original.toxicological_due_date ? new Date(row.original.toxicological_due_date).toLocaleDateString('pt-BR') : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'is_compliant',
        header: 'STATUS CTB 138',
        cell: ({ row }) =>
          row.original.is_compliant ? (
            <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Conforme
            </Badge>
          ) : (
            <Badge variant="outline" className="border-rose-500 text-rose-500 text-[10px]">
              <AlertTriangle className="w-3 h-3 mr-1 inline" /> Expirado / Pendente
            </Badge>
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
              onClick={() => handleOpenEditDriver(row.original)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-cyan-500"
              title="Editar Condutor"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteDriver(row.original.id)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-rose-500"
              title="Excluir Condutor"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const monitorColumns = useMemo<ColumnDef<MonitorItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'MONITOR / CPF',
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">{row.original.name}</div>
            <div className="font-mono text-[11px] text-slate-500 tabular-nums">{row.original.cpf}</div>
          </div>
        ),
      },
      {
        accessorKey: 'rg',
        header: 'DOCUMENTO RG',
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums text-slate-800 dark:text-slate-200">
            {row.original.rg || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'CONTATO TELEFÔNICO',
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
            {row.original.phone || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'assigned_route',
        header: 'ROTA DESIGNADA',
        cell: ({ row }) => (
          <Badge variant="outline" className="border-cyan-500 text-cyan-500 text-[10px]">
            {row.original.assigned_route || 'Sem Rota'}
          </Badge>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'STATUS',
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">
              <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Ativo
            </Badge>
          ) : (
            <Badge variant="outline" className="border-slate-500 text-slate-400 text-[10px]">
              Inativo
            </Badge>
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
              onClick={() => handleOpenEditMonitor(row.original)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-cyan-500"
              title="Editar Monitor"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteMonitor(row.original.id)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-rose-500"
              title="Excluir Monitor"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Condutores & Monitores de Transporte
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Conformidade CTB Art. 138 (idade &gt; 21 anos, CNH "D" ou "E", curso escolar e exame toxicológico) e monitores de bordo.
          </p>
        </div>
        <Button
          onClick={subTab === 'drivers' ? handleOpenCreateDriver : handleOpenCreateMonitor}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          {subTab === 'drivers' ? 'Cadastrar Motorista' : 'Cadastrar Monitor'}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={subTab === 'drivers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSubTab('drivers')}
            className="text-xs"
          >
            Motoristas Habilitados ({drivers.length})
          </Button>
          <Button
            variant={subTab === 'monitors' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSubTab('monitors')}
            className="text-xs"
          >
            Monitores de Bordo ({monitors.length})
          </Button>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por nome, documento ou CNH..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {subTab === 'drivers' ? (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm p-4">
          <DataTable
            columns={driverColumns}
            data={filteredDrivers}
            loading={loading}
            emptyText="Nenhum condutor cadastrado ou encontrado com os filtros atuais."
            pageSize={10}
            pagination={true}
          />
        </Card>
      ) : (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm p-4">
          <DataTable
            columns={monitorColumns}
            data={filteredMonitors}
            loading={loading}
            emptyText="Nenhum monitor cadastrado ou encontrado com os filtros atuais."
            pageSize={10}
            pagination={true}
          />
        </Card>
      )}

      {/* MODAL: MOTORISTA */}
      <Modal
        open={isDriverModalOpen}
        onOpenChange={setIsDriverModalOpen}
        size="2xl"
        title={editingDriverId ? 'Editar Motorista (CTB 138)' : 'Novo Motorista Escolar (CTB 138)'}
      >
        <form onSubmit={handleSaveDriver} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 flex items-center gap-2 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nome Completo *</label>
              <Input
                value={driverFormData.name || ''}
                onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">CPF *</label>
              <Input
                value={driverFormData.cpf || ''}
                onChange={(e) => setDriverFormData({ ...driverFormData, cpf: e.target.value })}
                className="mt-1 text-xs font-mono"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nº Registro CNH *</label>
              <Input
                value={driverFormData.cnh_number || ''}
                onChange={(e) => setDriverFormData({ ...driverFormData, cnh_number: e.target.value })}
                required
                className="mt-1 text-xs font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Categoria CNH (CTB 138) *</label>
              <Select
                value={driverFormData.cnh_category || 'D'}
                onChange={(val: any) => setDriverFormData({ ...driverFormData, cnh_category: val as any })}
                options={[
                  { value: 'D', label: 'Categoria D (Ônibus e Vans)' },
                  { value: 'E', label: 'Categoria E (Veículos Articulados)' },
                ]}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Validade CNH *</label>
              <Input
                type="date"
                value={driverFormData.cnh_due_date || ''}
                onChange={(e) => setDriverFormData({ ...driverFormData, cnh_due_date: e.target.value })}
                className="mt-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Validade Curso Escolar</label>
              <Input
                type="date"
                value={driverFormData.school_course_due_date || ''}
                onChange={(e) => setDriverFormData({ ...driverFormData, school_course_due_date: e.target.value })}
                className="mt-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Exame Toxicológico</label>
              <Input
                type="date"
                value={driverFormData.toxicological_due_date || ''}
                onChange={(e) => setDriverFormData({ ...driverFormData, toxicological_due_date: e.target.value })}
                className="mt-1 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDriverModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Motorista'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: MONITOR */}
      <Modal
        open={isMonitorModalOpen}
        onOpenChange={setIsMonitorModalOpen}
        size="2xl"
        title={editingMonitorId ? 'Editar Monitor de Bordo' : 'Novo Monitor de Bordo'}
      >
        <form onSubmit={handleSaveMonitor} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 flex items-center gap-2 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nome Completo *</label>
              <Input
                value={monitorFormData.name || ''}
                onChange={(e) => setMonitorFormData({ ...monitorFormData, name: e.target.value })}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">CPF</label>
              <Input
                value={monitorFormData.cpf || ''}
                onChange={(e) => setMonitorFormData({ ...monitorFormData, cpf: e.target.value })}
                className="mt-1 text-xs font-mono"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Documento RG</label>
              <Input
                value={monitorFormData.rg || ''}
                onChange={(e) => setMonitorFormData({ ...monitorFormData, rg: e.target.value })}
                className="mt-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Telefone / Contato</label>
              <Input
                value={monitorFormData.phone || ''}
                onChange={(e) => setMonitorFormData({ ...monitorFormData, phone: e.target.value })}
                className="mt-1 text-xs font-mono"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Rota Designada</label>
            <Select
              value={monitorFormData.assigned_route_id ? String(monitorFormData.assigned_route_id) : ''}
              onChange={(val: any) => setMonitorFormData({ ...monitorFormData, assigned_route_id: val ? Number(val) : null })}
              options={[
                { value: '', label: 'Sem rota vinculada (Disponível)' },
                ...routes.map((r) => ({
                  value: String(r.id),
                  label: `${r.code} - ${r.name}`,
                })),
              ]}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsMonitorModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Monitor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
