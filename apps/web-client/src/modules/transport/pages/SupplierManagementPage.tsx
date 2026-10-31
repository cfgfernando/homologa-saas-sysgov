import React, { useState } from 'react';
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
} from '@sysgov/ui';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';

interface SupplierRecord {
  id: number;
  cnpj: string;
  corporate_name: string;
  trade_name: string;
  service_type: 'transport_service' | 'workshop' | 'fuel_station' | 'parts';
  contract_number: string;
  phone: string;
  email: string;
  is_active: boolean;
}

const mockSuppliers: SupplierRecord[] = [
  {
    id: 1,
    cnpj: '04.123.456/0001-89',
    corporate_name: 'Viação Transcolar Transporte Ltda',
    trade_name: 'Transcolar Escolar',
    service_type: 'transport_service',
    contract_number: 'CT-2025/0114',
    phone: '(41) 3344-5566',
    email: 'operacional@transcolar.com.br',
    is_active: true,
  },
  {
    id: 2,
    cnpj: '11.987.654/0001-20',
    corporate_name: 'Oficina Central Diesel Ltda - ME',
    trade_name: 'Central Diesel',
    service_type: 'workshop',
    contract_number: 'CT-2026/0033',
    phone: '(41) 3388-9900',
    email: 'contato@centraldiesel.com.br',
    is_active: true,
  },
  {
    id: 3,
    cnpj: '78.555.444/0001-12',
    corporate_name: 'Auto Posto e Conveniência Aliança S/A',
    trade_name: 'Posto Aliança',
    service_type: 'fuel_station',
    contract_number: 'CT-2026/0008',
    phone: '(41) 3311-2233',
    email: 'abastecimento@postoalianca.com.br',
    is_active: true,
  },
];

export const SupplierManagementPage: React.FC = () => {
  const [suppliers] = useState<SupplierRecord[]>(mockSuppliers);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = suppliers.filter((s) => {
    const matchesSearch =
      s.corporate_name.toLowerCase().includes(search.toLowerCase()) ||
      s.trade_name.toLowerCase().includes(search.toLowerCase()) ||
      s.cnpj.includes(search);
    const matchesType = !typeFilter || s.service_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getServiceTypeBadge = (type: string) => {
    switch (type) {
      case 'transport_service':
        return <Badge variant="outline" className="border-cyan-500 text-cyan-500 text-[10px]">Prestadora de Transporte</Badge>;
      case 'workshop':
        return <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">Oficina Mecânica</Badge>;
      case 'fuel_station':
        return <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px]">Posto de Combustível</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Auto Peças</Badge>;
    }
  };

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
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs">
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
            onChange={(val) => setTypeFilter(String(val))}
            options={[
              { value: '', label: 'Todos os Serviços' },
              { value: 'transport_service', label: 'Prestadora de Transporte' },
              { value: 'workshop', label: 'Oficina Mecânica' },
              { value: 'fuel_station', label: 'Posto de Combustível' },
            ]}
          />
        </div>
      </div>

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
              <TableHead className="text-xs font-semibold">FORNECEDOR / NOME FANTASIA</TableHead>
              <TableHead className="text-xs font-semibold">CNPJ</TableHead>
              <TableHead className="text-xs font-semibold">RAMO / ATUAÇÃO</TableHead>
              <TableHead className="text-xs font-semibold">CONTRATO / VIGÊNCIA</TableHead>
              <TableHead className="text-xs font-semibold">CONTATO</TableHead>
              <TableHead className="text-xs font-semibold text-center">STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <TableCell className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{s.corporate_name}</div>
                  <div className="text-[11px] text-slate-500">{s.trade_name}</div>
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums text-slate-800 dark:text-slate-200">
                  {s.cnpj}
                </TableCell>
                <TableCell>{getServiceTypeBadge(s.service_type)}</TableCell>
                <TableCell className="font-mono text-xs tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    {s.contract_number}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {s.phone}
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">{s.email}</div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">
                    Ativo
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
