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
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  FileText,
  Pencil,
  Trash2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/core/api/client';

interface SupplierRecord {
  id: number;
  cnpj: string;
  corporate_name: string;
  trade_name: string;
  service_type: 'transport_service' | 'workshop' | 'fuel_station' | 'parts' | 'other';
  contract_number: string;
  phone: string;
  email: string;
  is_active: boolean;
}

const initialSupplierForm: Partial<SupplierRecord> = {
  cnpj: '',
  corporate_name: '',
  trade_name: '',
  service_type: 'transport_service',
  contract_number: '',
  phone: '',
  email: '',
  is_active: true,
};

export const SupplierManagementPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<SupplierRecord>>(initialSupplierForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/transport/suppliers');
      if (res.data && Array.isArray(res.data.data)) {
        setSuppliers(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialSupplierForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: SupplierRecord) => {
    setEditingId(s.id);
    setFormData({ ...s });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.corporate_name || !formData.cnpj) {
      setFormError('Informe a Razão Social e o CNPJ.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        cnpj: formData.cnpj,
        corporate_name: formData.corporate_name,
        trade_name: formData.trade_name,
        service_type: formData.service_type,
        contract_number: formData.contract_number,
        phone: formData.phone,
        email: formData.email,
        is_active: formData.is_active ?? true,
      };

      if (editingId) {
        await apiClient.put(`/transport/suppliers/${editingId}`, payload);
      } else {
        await apiClient.post('/transport/suppliers', payload);
      }

      await fetchSuppliers();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Falha ao salvar fornecedor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirma a exclusão deste fornecedor?')) return;
    try {
      await apiClient.delete(`/transport/suppliers/${id}`);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert('Falha ao excluir fornecedor: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch =
        s.corporate_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.trade_name && s.trade_name.toLowerCase().includes(search.toLowerCase())) ||
        s.cnpj.includes(search);
      const matchesType = !typeFilter || s.service_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [suppliers, search, typeFilter]);

  const getServiceTypeBadge = (type: string) => {
    switch (type) {
      case 'transport_service':
        return <Badge variant="outline" className="border-cyan-500 text-cyan-500 text-[10px]">Prestadora de Transporte</Badge>;
      case 'workshop':
        return <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">Oficina Mecânica</Badge>;
      case 'fuel_station':
        return <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px]">Posto de Combustível</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Auto Peças / Outros</Badge>;
    }
  };

  const columns = useMemo<ColumnDef<SupplierRecord>[]>(
    () => [
      {
        accessorKey: 'corporate_name',
        header: 'FORNECEDOR / NOME FANTASIA',
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">{row.original.corporate_name}</div>
            <div className="text-[11px] text-slate-500">{row.original.trade_name || '-'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'cnpj',
        header: 'CNPJ',
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums text-slate-800 dark:text-slate-200">
            {row.original.cnpj}
          </span>
        ),
      },
      {
        accessorKey: 'service_type',
        header: 'RAMO / ATUAÇÃO',
        cell: ({ row }) => getServiceTypeBadge(row.original.service_type),
      },
      {
        accessorKey: 'contract_number',
        header: 'CONTRATO / VIGÊNCIA',
        cell: ({ row }) => (
          <div className="font-mono text-xs tabular-nums font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            {row.original.contract_number || 'Sem Contrato'}
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'CONTATO',
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {row.original.phone || '-'}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              {row.original.email || '-'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'STATUS',
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">Ativo</Badge>
          ) : (
            <Badge variant="outline" className="border-slate-500 text-slate-400 text-[10px]">Inativo</Badge>
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
              title="Editar Fornecedor"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              className="h-7 w-7 p-0 text-slate-500 hover:text-rose-500"
              title="Excluir Fornecedor"
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
            <Building2 className="w-6 h-6 text-emerald-500" />
            Fornecedores & Contratos de Transporte
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Empresas terceirizadas de transporte de alunos, oficinas mecânicas conveniadas e postos de abastecimento.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Fornecedor
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
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
              { value: '', label: 'Todos os Serviços' },
              { value: 'transport_service', label: 'Prestadora de Transporte' },
              { value: 'workshop', label: 'Oficina Mecânica' },
              { value: 'fuel_station', label: 'Posto de Combustível' },
              { value: 'parts', label: 'Auto Peças' },
              { value: 'other', label: 'Outros Serviços' },
            ]}
          />
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyText="Nenhum fornecedor cadastrado ou encontrado."
          pageSize={10}
          pagination={true}
        />
      </Card>

      {/* MODAL: FORNECEDOR */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        size="2xl"
        title={editingId ? 'Editar Fornecedor / Contrato' : 'Cadastrar Novo Fornecedor'}
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
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Razão Social *</label>
              <Input
                value={formData.corporate_name || ''}
                onChange={(e) => setFormData({ ...formData, corporate_name: e.target.value })}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nome Fantasia</label>
              <Input
                value={formData.trade_name || ''}
                onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">CNPJ *</label>
              <Input
                value={formData.cnpj || ''}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
                className="mt-1 text-xs font-mono"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Ramo / Atuação *</label>
              <Select
                value={formData.service_type || 'transport_service'}
                onChange={(val: any) => setFormData({ ...formData, service_type: val as any })}
                options={[
                  { value: 'transport_service', label: 'Prestadora de Transporte Escolar' },
                  { value: 'workshop', label: 'Oficina Mecânica / Manutenção' },
                  { value: 'fuel_station', label: 'Posto de Combustível' },
                  { value: 'parts', label: 'Auto Peças e Componentes' },
                  { value: 'other', label: 'Outros Serviços' },
                ]}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nº do Contrato / Licitação</label>
              <Input
                value={formData.contract_number || ''}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                className="mt-1 text-xs font-mono uppercase"
                placeholder="CT-2026/001"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Telefone</label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 text-xs font-mono"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">E-mail de Contato</label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 text-xs"
                placeholder="contato@empresa.com.br"
              />
            </div>
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
              {saving ? 'Salvando...' : 'Salvar Fornecedor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
