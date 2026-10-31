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
  Wrench,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/core/api/client';

interface MaintenanceOrder {
  id: number;
  vehicle_id: number;
  order_number: string;
  vehicle_plate: string;
  vehicle_model: string;
  service_type: 'preventive' | 'corrective' | 'tires' | 'oil_change' | 'inspection';
  odometer_km: number;
  service_date: string;
  amount_cents: number;
  workshop_name: string;
  notes: string;
}

interface MaintenanceFormData {
  vehicle_id: number;
  service_type: 'preventive' | 'corrective' | 'tires' | 'oil_change' | 'inspection';
  odometer_km: number;
  service_date: string;
  amount_reais: string;
  notes: string;
}

const initialOrderForm: MaintenanceFormData = {
  vehicle_id: 1,
  service_type: 'preventive',
  odometer_km: 25000,
  service_date: new Date().toISOString().split('T')[0],
  amount_reais: '450,00',
  notes: '',
};

export const MaintenanceOrderPage: React.FC = () => {
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [vehicles, setVehicles] = useState<{ id: number; plate: string; model: string }[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialOrderForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('/transport/maintenance-orders');
      if (res.data && Array.isArray(res.data.data)) {
        setOrders(
          res.data.data.map((o: any) => ({
            id: o.id,
            vehicle_id: o.vehicle_id,
            order_number: 'OS-' + String(o.id).padStart(5, '0'),
            vehicle_plate: o.vehicle?.plate || 'SEM PLACA',
            vehicle_model: o.vehicle?.model || 'Veículo ' + o.vehicle_id,
            service_type: o.service_type || 'preventive',
            odometer_km: o.odometer_km || 0,
            service_date: o.service_date ? String(o.service_date).split('T')[0] : '2026-10-01',
            amount_cents: o.amount_cents || 0,
            workshop_name: o.notes ? o.notes.slice(0, 30) : 'Oficina Municipal',
            notes: o.notes || '',
          }))
        );
      }
    } catch {
      // Fallback
    }
  };

  const fetchVehicles = async () => {
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
    fetchOrders();
    fetchVehicles();
  }, []);

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const parseReaisToCents = (val: string): number => {
    const cleaned = val.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      ...initialOrderForm,
      vehicle_id: vehicles[0]?.id || 1,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: MaintenanceOrder) => {
    setEditingId(order.id);
    setFormData({
      vehicle_id: order.vehicle_id,
      service_type: order.service_type,
      odometer_km: order.odometer_km,
      service_date: order.service_date,
      amount_reais: (order.amount_cents / 100).toFixed(2).replace('.', ','),
      notes: order.notes,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id) {
      setFormError('Selecione um veículo.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const cents = parseReaisToCents(formData.amount_reais);
      const payload = {
        vehicle_id: formData.vehicle_id,
        service_type: formData.service_type,
        odometer_km: Number(formData.odometer_km),
        service_date: formData.service_date,
        amount_cents: cents,
        notes: formData.notes,
      };

      if (editingId) {
        await apiClient.put(`/transport/maintenance-orders/${editingId}`, payload);
      } else {
        await apiClient.post('/transport/maintenance-orders', payload);
      }

      await fetchOrders();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar ordem de serviço.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirma a remoção desta ordem de serviço?')) return;
    try {
      await apiClient.delete(`/transport/maintenance-orders/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      alert('Falha ao excluir ordem de serviço: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.vehicle_plate.toLowerCase().includes(search.toLowerCase()) ||
      o.notes.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || o.service_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getServiceTypeBadge = (type: string) => {
    switch (type) {
      case 'preventive':
        return <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">Preventiva</Badge>;
      case 'corrective':
        return <Badge variant="outline" className="border-rose-500 text-rose-500 text-[10px]">Corretiva</Badge>;
      case 'oil_change':
        return <Badge variant="outline" className="border-cyan-500 text-cyan-500 text-[10px]">Troca de Óleo</Badge>;
      case 'tires':
        return <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px]">Pneus</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Inspeção</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-emerald-500" />
            Ordens de Serviço & Manutenção da Frota
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle de manutenção preventiva e corretiva, trocas de óleo, pneus e custos vinculados a cada veículo escolar.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          Nova Ordem de Serviço
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por número da OS, placa ou oficina..."
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
              { value: 'preventive', label: 'Preventiva' },
              { value: 'corrective', label: 'Corretiva' },
              { value: 'oil_change', label: 'Troca de Óleo' },
              { value: 'tires', label: 'Pneus' },
              { value: 'inspection', label: 'Inspeção' },
            ]}
          />
        </div>
      </div>

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
              <TableHead className="text-xs font-semibold">NÚMERO DA OS</TableHead>
              <TableHead className="text-xs font-semibold">VEÍCULO / MODELO</TableHead>
              <TableHead className="text-xs font-semibold text-center">TIPO SERVIÇO</TableHead>
              <TableHead className="text-xs font-semibold">ODÔMETRO</TableHead>
              <TableHead className="text-xs font-semibold">DATA</TableHead>
              <TableHead className="text-xs font-semibold text-right">VALOR TOTAL</TableHead>
              <TableHead className="text-xs font-semibold text-center w-24">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">
                  Nenhuma ordem de serviço cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                    {order.order_number}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{order.vehicle_plate}</div>
                    <div className="text-[11px] text-slate-500">{order.vehicle_model}</div>
                  </TableCell>
                  <TableCell className="text-center">{getServiceTypeBadge(order.service_type)}</TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" />
                      {order.odometer_km.toLocaleString('pt-BR')} km
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                    {order.service_date ? new Date(order.service_date).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(order.amount_cents)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(order)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-cyan-500"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(order.id)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* MODAL: ORDEM DE SERVIÇO */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingId ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço de Frota'}
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
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Veículo da Frota *</label>
              <Select
                value={String(formData.vehicle_id)}
                onChange={(val: any) => setFormData({ ...formData, vehicle_id: Number(val) })}
                options={vehicles.map((v) => ({
                  value: String(v.id),
                  label: `${v.plate} - ${v.model}`,
                }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tipo de Manutenção *</label>
              <Select
                value={formData.service_type}
                onChange={(val: any) => setFormData({ ...formData, service_type: val as any })}
                options={[
                  { value: 'preventive', label: 'Preventiva (Revisão periódica)' },
                  { value: 'corrective', label: 'Corretiva (Reparo / Quebra)' },
                  { value: 'oil_change', label: 'Troca de Óleo / Filtros' },
                  { value: 'tires', label: 'Pneus / Alinhamento / Balanceamento' },
                  { value: 'inspection', label: 'Inspeção Detran / Tacógrafo' },
                ]}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Odômetro Atual (km) *</label>
              <Input
                type="number"
                value={formData.odometer_km}
                onChange={(e) => setFormData({ ...formData, odometer_km: Number(e.target.value) })}
                required
                className="mt-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Data do Serviço *</label>
              <Input
                type="date"
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                required
                className="mt-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Valor Total (R$) *</label>
              <Input
                value={formData.amount_reais}
                onChange={(e) => setFormData({ ...formData, amount_reais: e.target.value })}
                required
                className="mt-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Observações / Peças / Oficina</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 text-xs"
              placeholder="Descreva as peças substituídas ou nome da oficina contratada"
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
              {saving ? 'Salvando...' : 'Salvar Ordem'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
