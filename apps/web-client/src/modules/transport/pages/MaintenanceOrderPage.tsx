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
  Wrench,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Gauge,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface MaintenanceOrder {
  id: number;
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

const mockOrders: MaintenanceOrder[] = [
  {
    id: 1,
    order_number: 'OS-2026/0042',
    vehicle_plate: 'BRA2E19',
    vehicle_model: 'Mercedes-Benz ORE 3',
    service_type: 'preventive',
    odometer_km: 42150,
    service_date: '2026-10-18',
    amount_cents: 185000, // R$ 1.850,00
    workshop_name: 'Oficina Central Diesel Ltda',
    notes: 'Revisão preventiva semestral, troca de pastilhas de freio e filtros.',
  },
  {
    id: 2,
    order_number: 'OS-2026/0039',
    vehicle_plate: 'RKS8C44',
    vehicle_model: 'Volksbus 8.160 ORE 1',
    service_type: 'oil_change',
    odometer_km: 31200,
    service_date: '2026-10-05',
    amount_cents: 68000, // R$ 680,00
    workshop_name: 'Posto e Lubrificantes Aliança',
    notes: 'Troca de óleo motor 15W40 e filtro de combustível.',
  },
  {
    id: 3,
    order_number: 'OS-2026/0028',
    vehicle_plate: 'PQT4A12',
    vehicle_model: 'Iveco Daily Minibus',
    service_type: 'corrective',
    odometer_km: 89400,
    service_date: '2026-09-22',
    amount_cents: 345000, // R$ 3.450,00
    workshop_name: 'Mecânica Especializada Três Irmãos',
    notes: 'Substituição do alternador e correia do motor.',
  },
];

export const MaintenanceOrderPage: React.FC = () => {
  const [orders] = useState<MaintenanceOrder[]>(mockOrders);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.vehicle_plate.toLowerCase().includes(search.toLowerCase()) ||
      o.workshop_name.toLowerCase().includes(search.toLowerCase());
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
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs">
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
            onChange={(val) => setTypeFilter(String(val))}
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
              <TableHead className="text-xs font-semibold">OFICINA / FORNECEDOR</TableHead>
              <TableHead className="text-xs font-semibold">DATA</TableHead>
              <TableHead className="text-xs font-semibold text-right">VALOR TOTAL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
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
                <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                  {order.workshop_name}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                  {new Date(order.service_date).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(order.amount_cents)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
