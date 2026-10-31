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
  Bus,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Accessibility,
  Shield,
  Save,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/core/api/client';

interface VehicleRecord {
  id: number;
  code: string;
  plate: string;
  renavam: string;
  chassis: string;
  brand: string;
  model: string;
  year_manufacture: number;
  year_model: number;
  capacity_seats: number;
  vehicle_type: 'bus' | 'microbus' | 'van' | 'boat' | 'other';
  ownership_type: 'owned' | 'contracted';
  accessibility_adapted: boolean;
  detran_inspection_due_date: string;
  crlv_due_date: string;
  status: 'active' | 'maintenance' | 'decommissioned';
}

const initialForm: Partial<VehicleRecord> = {
  plate: '',
  code: '',
  renavam: '',
  chassis: '',
  brand: 'Mercedes-Benz',
  model: '',
  year_manufacture: 2023,
  year_model: 2024,
  capacity_seats: 44,
  vehicle_type: 'bus',
  ownership_type: 'owned',
  accessibility_adapted: false,
  detran_inspection_due_date: '2027-04-30',
  crlv_due_date: '2027-10-31',
  status: 'active',
};

export const VehicleFleetPage: React.FC = () => {
  const [fleet, setFleet] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<VehicleRecord>>(initialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/transport/vehicles');
      if (response?.data?.data) {
        setFleet(response.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VehicleRecord) => {
    setEditingId(v.id);
    setFormData({
      ...v,
      detran_inspection_due_date: v.detran_inspection_due_date
        ? String(v.detran_inspection_due_date).split('T')[0]
        : '',
      crlv_due_date: v.crlv_due_date ? String(v.crlv_due_date).split('T')[0] : '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate || !formData.model) {
      setFormError('Preencha os campos obrigatórios (Placa e Modelo).');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        code: formData.code || 'VEIC-' + formData.plate?.replace(/[^a-zA-Z0-9]/g, ''),
        plate: formData.plate,
        renavam: formData.renavam || '00000000000',
        chassis: formData.chassis || '00000000000000000',
        brand: formData.brand || 'Mercedes-Benz',
        model: formData.model,
        year_manufacture: Number(formData.year_manufacture) || 2023,
        year_model: Number(formData.year_model) || 2024,
        capacity_seats: Number(formData.capacity_seats) || 44,
        vehicle_type: formData.vehicle_type || 'bus',
        ownership_type: formData.ownership_type || 'owned',
        accessibility_adapted: Boolean(formData.accessibility_adapted),
        detran_inspection_due_date: formData.detran_inspection_due_date || '2027-04-30',
        crlv_due_date: formData.crlv_due_date || '2027-10-31',
        status: formData.status || 'active',
      };

      if (editingId) {
        await apiClient.put(`/transport/vehicles/${editingId}`, payload);
      } else {
        await apiClient.post('/transport/vehicles', payload);
      }

      await fetchVehicles();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar veículo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirma a exclusão deste veículo escolar?')) return;
    try {
      await apiClient.delete(`/transport/vehicles/${id}`);
      setFleet((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      alert('Falha ao excluir veículo: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const filteredFleet = useMemo(() => {
    return fleet.filter((v) => {
      const matchesSearch =
        v.plate.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        v.code.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [fleet, search, statusFilter]);

  const columns = useMemo<ColumnDef<VehicleRecord>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'CÓDIGO / VEÍCULO',
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-emerald-500" />
              {row.original.code}
            </div>
            <div className="text-[11px] text-slate-500">{row.original.brand} - {row.original.model}</div>
          </div>
        ),
      },
      {
        accessorKey: 'plate',
        header: 'PLACA / RENAVAM',
        cell: ({ row }) => (
          <div className="font-mono text-xs tabular-nums">
            <div className="font-bold text-slate-900 dark:text-slate-100">{row.original.plate}</div>
            <div className="text-[11px] text-slate-400">Renavam: {row.original.renavam}</div>
          </div>
        ),
      },
      {
        accessorKey: 'vehicle_type',
        header: 'TIPO / PROPRIEDADE',
        cell: ({ row }) => (
          <div className="text-xs">
            <Badge variant="outline" className="text-[10px] capitalize">
              {row.original.vehicle_type === 'bus' ? 'Ônibus (ORE)' : row.original.vehicle_type}
            </Badge>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {row.original.ownership_type === 'owned' ? 'Frota Própria' : 'Terceirizado'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'capacity_seats',
        header: 'LOTAÇÃO CTB',
        cell: ({ row }) => (
          <div className="font-mono text-xs tabular-nums font-semibold text-slate-800 dark:text-slate-200">
            {row.original.capacity_seats} sentados
          </div>
        ),
      },
      {
        accessorKey: 'accessibility_adapted',
        header: 'ACESSIBILIDADE',
        cell: ({ row }) => (
          <div>
            {row.original.accessibility_adapted ? (
              <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">
                <Accessibility className="w-3 h-3 mr-1 inline" /> Adaptado
              </Badge>
            ) : (
              <span className="text-slate-400 text-xs">Padrão</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'detran_inspection_due_date',
        header: 'VISTORIA DETRAN (CTB 136)',
        cell: ({ row }) => {
          const isExpired = new Date(row.original.detran_inspection_due_date) < new Date();
          return (
            <div className="font-mono text-xs tabular-nums">
              <div>{new Date(row.original.detran_inspection_due_date).toLocaleDateString('pt-BR')}</div>
              {isExpired ? (
                <Badge variant="outline" className="border-rose-500 text-rose-500 text-[10px] mt-0.5">
                  <AlertTriangle className="w-3 h-3 mr-0.5 inline" /> Vencida
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px] mt-0.5">
                  <CheckCircle2 className="w-3 h-3 mr-0.5 inline" /> Regular
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'STATUS',
        cell: ({ row }) => {
          const status = row.original.status;
          return status === 'active' ? (
            <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">Ativo</Badge>
          ) : status === 'maintenance' ? (
            <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px]">Manutenção</Badge>
          ) : (
            <Badge variant="outline" className="border-slate-400 text-slate-400 text-[10px]">Baixado</Badge>
          );
        },
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
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-rose-500"
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
            <Bus className="w-6 h-6 text-emerald-500" />
            Gestão da Frota Escolar (CTB Art. 136)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle de veículos, capacidade sentada, faixa amarela regulamentar, vistorias semestrais e acessibilidade.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Veículo
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por placa, modelo ou código do veículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(val: any) => setStatusFilter(String(val))}
            options={[
              { value: '', label: 'Todos os Status' },
              { value: 'active', label: 'Em Operação Ativa' },
              { value: 'maintenance', label: 'Em Manutenção' },
              { value: 'decommissioned', label: 'Baixado / Reserva' },
            ]}
          />
        </div>
      </div>

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-3">
          <DataTable
            columns={columns}
            data={filteredFleet}
            loading={loading}
            emptyText="Nenhum veículo encontrado."
            pageSize={10}
            pagination={filteredFleet.length > 10}
          />
        </div>
      </Card>

      {/* MODAL DE CADASTRO / EDIÇÃO AMPLIADO (size="2xl") */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingId ? 'Editar Veículo da Frota (CTB 136)' : 'Novo Veículo Escolar (CTB 136)'}
        size="2xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {formError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 flex items-center gap-2 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Placa do Veículo *
              </label>
              <Input
                value={formData.plate || ''}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                placeholder="ABC1D23"
                required
                className="font-mono text-xs uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Código Interno da Frota
              </label>
              <Input
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="VEIC-001"
                className="font-mono text-xs uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nº RENAVAM
              </label>
              <Input
                value={formData.renavam || ''}
                onChange={(e) => setFormData({ ...formData, renavam: e.target.value })}
                placeholder="00123456789"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Marca / Fabricante
              </label>
              <Input
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Mercedes-Benz, Volkswagen, Iveco..."
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Modelo Comercial (Ex: OF-1519 ORE 3) *
              </label>
              <Input
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Ex: Volksbus 8.160 ODR (ORE 1)"
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tipo de Veículo
              </label>
              <Select
                value={formData.vehicle_type || 'bus'}
                onChange={(val: any) => setFormData({ ...formData, vehicle_type: val as any })}
                options={[
                  { value: 'bus', label: 'Ônibus Escolar (ORE)' },
                  { value: 'microbus', label: 'Micro-ônibus' },
                  { value: 'van', label: 'Van / Minibus' },
                  { value: 'boat', label: 'Embarcação Escolar' },
                  { value: 'other', label: 'Outro Veículo' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Propriedade
              </label>
              <Select
                value={formData.ownership_type || 'owned'}
                onChange={(val: any) => setFormData({ ...formData, ownership_type: val as any })}
                options={[
                  { value: 'owned', label: 'Frota Própria (MEC/FNDE)' },
                  { value: 'contracted', label: 'Contratado / Terceirizado' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Lotação Sentada (CTB) *
              </label>
              <Input
                type="number"
                value={formData.capacity_seats || 44}
                onChange={(e) => setFormData({ ...formData, capacity_seats: Number(e.target.value) })}
                required
                min={1}
                className="font-mono text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Status Operacional
              </label>
              <Select
                value={formData.status || 'active'}
                onChange={(val: any) => setFormData({ ...formData, status: val as any })}
                options={[
                  { value: 'active', label: 'Ativo em Linha' },
                  { value: 'maintenance', label: 'Em Oficina / Manutenção' },
                  { value: 'decommissioned', label: 'Baixado / Reserva' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Validade Vistoria DETRAN (Semestral - CTB Art. 136, II)
              </label>
              <Input
                type="date"
                value={formData.detran_inspection_due_date || ''}
                onChange={(e) => setFormData({ ...formData, detran_inspection_due_date: e.target.value })}
                className="font-mono text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Validade Licenciamento CRLV
              </label>
              <Input
                type="date"
                value={formData.crlv_due_date || ''}
                onChange={(e) => setFormData({ ...formData, crlv_due_date: e.target.value })}
                className="font-mono text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <input
              type="checkbox"
              id="accessibility_adapted"
              checked={Boolean(formData.accessibility_adapted)}
              onChange={(e) => setFormData({ ...formData, accessibility_adapted: e.target.checked })}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="accessibility_adapted" className="text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
              Veículo adaptado para alunos com deficiência ou mobilidade reduzida (DPM / Plataforma Elevatória Veicular)
            </label>
          </div>

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
              {saving ? 'Salvando...' : 'Salvar Veículo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
