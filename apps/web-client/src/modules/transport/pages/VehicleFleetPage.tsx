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
      const res = await apiClient.get('/transport/vehicles');
      if (res.data && Array.isArray(res.data.data)) {
        setFleet(res.data.data);
      }
    } catch {
      // Fallback preserves existing state
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

  const handleOpenEdit = (vehicle: VehicleRecord) => {
    setEditingId(vehicle.id);
    setFormData({ ...vehicle });
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
      if (editingId) {
        await apiClient.put(`/transport/vehicles/${editingId}`, formData);
      } else {
        await apiClient.post('/transport/vehicles', formData);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar veículo. Verifique os campos.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Confirma a exclusão deste veículo da frota escolar?')) {
      try {
        await apiClient.delete(`/transport/vehicles/${id}`);
        fetchVehicles();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Falha ao excluir veículo.');
      }
    }
  };

  const isInspectionExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date('2026-10-31');
  };

  const filteredFleet = fleet.filter((v) => {
    const matchesSearch =
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.code?.toLowerCase().includes(search.toLowerCase()) ||
      v.model?.toLowerCase().includes(search.toLowerCase()) ||
      v.renavam?.includes(search);
    const matchesStatus = !statusFilter || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Ação de Cadastro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bus className="w-6 h-6 text-emerald-500" />
            Frota de Transporte Escolar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão cadastral, requisitos do CTB Art. 136 (faixa escolar, tacógrafo, cintos) e controle de inspeções semestrais.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Veículo
        </Button>
      </div>

      {/* Requisitos CTB Art. 136 Card Informativo */}
      <Card className="border-l-4 border-l-emerald-500 bg-slate-50 dark:bg-slate-900/40">
        <div className="p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Padrão Regulatório Obrigatório (CTB Art. 136):
            </span>{' '}
            <span className="text-slate-600 dark:text-slate-300">
              Faixa amarela horizontal de 40 cm com dístico "ESCOLAR" à meia altura, tacógrafo aferido pelo INMETRO,
              cinto de segurança para cada ocupante e inspeção semestral de segurança emitida pelo DETRAN.
            </span>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por placa, código, renavam ou modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(String(val))}
            options={[
              { value: '', label: 'Todos os Status' },
              { value: 'active', label: 'Ativo em Circulação' },
              { value: 'maintenance', label: 'Em Manutenção' },
              { value: 'decommissioned', label: 'Desativado' },
            ]}
          />
        </div>
      </div>

      {/* Tabela de Veículos com Botões de Edição */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
              <TableHead className="text-xs font-semibold">CÓDIGO / PLACA</TableHead>
              <TableHead className="text-xs font-semibold">MODELO & MARCA</TableHead>
              <TableHead className="text-xs font-semibold">TIPO / VÍNCULO</TableHead>
              <TableHead className="text-xs font-semibold text-center">LOT. MÁX.</TableHead>
              <TableHead className="text-xs font-semibold text-center">PCD</TableHead>
              <TableHead className="text-xs font-semibold">VISTORIA DETRAN</TableHead>
              <TableHead className="text-xs font-semibold">CRLV</TableHead>
              <TableHead className="text-xs font-semibold text-center">STATUS</TableHead>
              <TableHead className="text-xs font-semibold text-right">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFleet.map((vehicle) => {
              const expired = isInspectionExpired(vehicle.detran_inspection_due_date);

              return (
                <TableRow key={vehicle.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <TableCell className="font-mono text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{vehicle.plate}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">{vehicle.code || '-'}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{vehicle.model}</div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {vehicle.brand} • Ano: {vehicle.year_manufacture || '-'}/{vehicle.year_model || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="capitalize font-medium">{vehicle.vehicle_type}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {vehicle.ownership_type === 'owned' ? 'Próprio' : 'Terceirizado'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs tabular-nums font-semibold">
                    {vehicle.capacity_seats} lug.
                  </TableCell>
                  <TableCell className="text-center">
                    {vehicle.accessibility_adapted ? (
                      <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">
                        <Accessibility className="w-3 h-3 mr-1 inline" /> Sim
                      </Badge>
                    ) : (
                      <span className="text-slate-400 font-mono text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    <div className="flex items-center gap-1.5">
                      {expired ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span className={expired ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {vehicle.detran_inspection_due_date
                          ? new Date(vehicle.detran_inspection_due_date).toLocaleDateString('pt-BR')
                          : '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                    {vehicle.crlv_due_date
                      ? new Date(vehicle.crlv_due_date).toLocaleDateString('pt-BR')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {vehicle.status === 'active' && (
                      <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[11px]">
                        Ativo
                      </Badge>
                    )}
                    {vehicle.status === 'maintenance' && (
                      <Badge variant="outline" className="border-amber-500 text-amber-500 text-[11px]">
                        Manutenção
                      </Badge>
                    )}
                    {vehicle.status === 'decommissioned' && (
                      <Badge variant="outline" className="border-slate-500 text-slate-500 text-[11px]">
                        Desativado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(vehicle)}
                        className="h-7 w-7 p-0 text-slate-600 hover:text-emerald-600"
                        title="Editar Veículo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(vehicle.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                        title="Excluir Veículo"
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

      {/* Modal de Criação / Edição de Veículo */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingId ? 'Editar Veículo da Frota' : 'Cadastrar Novo Veículo Escolar'}
        description="Preencha os dados do veículo e os parâmetros de conformidade regulatória (CTB Art. 136 e DETRAN)."
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
                Placa do Veículo *
              </label>
              <Input
                placeholder="Ex: ABC1D23"
                value={formData.plate || ''}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                className="font-mono text-xs uppercase"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Código Interno
              </label>
              <Input
                placeholder="Ex: VEIC-01"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Modelo / Descrição *
              </label>
              <Input
                placeholder="Ex: OF-1519 Ônibus Rural Escolar (ORE 3)"
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="text-xs"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Marca / Fabricante
              </label>
              <Input
                placeholder="Ex: Mercedes-Benz, Volkswagen"
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                RENAVAM
              </label>
              <Input
                placeholder="00123456789"
                value={formData.renavam || ''}
                onChange={(e) => setFormData({ ...formData, renavam: e.target.value })}
                className="font-mono text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Capacidade (Lugares Sentados) *
              </label>
              <Input
                type="number"
                min="1"
                max="150"
                value={formData.capacity_seats || 44}
                onChange={(e) => setFormData({ ...formData, capacity_seats: parseInt(e.target.value, 10) || 0 })}
                className="font-mono text-xs tabular-nums"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tipo de Veículo
              </label>
              <Select
                value={formData.vehicle_type || 'bus'}
                onChange={(val) => setFormData({ ...formData, vehicle_type: val as any })}
                options={[
                  { value: 'bus', label: 'Ônibus' },
                  { value: 'microbus', label: 'Micro-ônibus' },
                  { value: 'van', label: 'Van / Perua' },
                  { value: 'boat', label: 'Embarcação / Barco' },
                  { value: 'other', label: 'Outro' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Validade Vistoria DETRAN Semestral
              </label>
              <Input
                type="date"
                value={formData.detran_inspection_due_date || ''}
                onChange={(e) => setFormData({ ...formData, detran_inspection_due_date: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Validade do CRLV
              </label>
              <Input
                type="date"
                value={formData.crlv_due_date || ''}
                onChange={(e) => setFormData({ ...formData, crlv_due_date: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(formData.accessibility_adapted)}
                onChange={(e) => setFormData({ ...formData, accessibility_adapted: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Adaptado para PCD / Acessibilidade (DTI)
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
              {saving ? 'Salvando...' : editingId ? 'Atualizar Veículo' : 'Salvar Veículo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
