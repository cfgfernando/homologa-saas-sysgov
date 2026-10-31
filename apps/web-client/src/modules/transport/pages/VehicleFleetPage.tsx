import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Bus,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Accessibility,
  Calendar,
  Shield,
  Wrench,
} from 'lucide-react';

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

const mockFleet: VehicleRecord[] = [
  {
    id: 1,
    code: 'VEIC-001',
    plate: 'BRA2E19',
    renavam: '00987654321',
    chassis: '9BWZZZ377VT004123',
    brand: 'Mercedes-Benz',
    model: 'OF-1519 Ônibus Rural Escolar (ORE 3)',
    year_manufacture: 2022,
    year_model: 2023,
    capacity_seats: 44,
    vehicle_type: 'bus',
    ownership_type: 'owned',
    accessibility_adapted: true,
    detran_inspection_due_date: '2026-12-15',
    crlv_due_date: '2027-04-30',
    status: 'active',
  },
  {
    id: 2,
    code: 'VEIC-002',
    plate: 'RKS8C44',
    renavam: '00123456789',
    chassis: '9BWZZZ377VT009845',
    brand: 'Volkswagen',
    model: 'Volksbus 8.160 ODR (ORE 1)',
    year_manufacture: 2021,
    year_model: 2022,
    capacity_seats: 29,
    vehicle_type: 'microbus',
    ownership_type: 'owned',
    accessibility_adapted: true,
    detran_inspection_due_date: '2026-11-10',
    crlv_due_date: '2027-05-15',
    status: 'active',
  },
  {
    id: 3,
    code: 'VEIC-003',
    plate: 'PQT4A12',
    renavam: '00456123789',
    chassis: '8AFZZZ377VT001122',
    brand: 'Iveco',
    model: 'Daily Minibus 50-170',
    year_manufacture: 2020,
    year_model: 2020,
    capacity_seats: 19,
    vehicle_type: 'van',
    ownership_type: 'contracted',
    accessibility_adapted: false,
    detran_inspection_due_date: '2026-09-30', // expired
    crlv_due_date: '2026-10-31',
    status: 'maintenance',
  },
  {
    id: 4,
    code: 'VEIC-004',
    plate: 'LMN5B88',
    renavam: '00876543210',
    chassis: '9BWZZZ377VT007766',
    brand: 'Mercedes-Benz',
    model: 'OF-1721 Ônibus Padron Escolar',
    year_manufacture: 2023,
    year_model: 2024,
    capacity_seats: 59,
    vehicle_type: 'bus',
    ownership_type: 'owned',
    accessibility_adapted: true,
    detran_inspection_due_date: '2027-01-20',
    crlv_due_date: '2027-06-30',
    status: 'active',
  },
];

export const VehicleFleetPage: React.FC = () => {
  const [fleet] = useState<VehicleRecord[]>(mockFleet);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredFleet = fleet.filter((v) => {
    const matchesSearch =
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.renavam.includes(search);
    const matchesStatus = !statusFilter || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isInspectionExpired = (dateStr: string) => {
    return new Date(dateStr) < new Date('2026-10-31');
  };

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
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs">
          <Plus className="w-4 h-4" />
          Cadastrar Veículo
        </Button>
      </div>

      {/* Requisitos CTB Art. 136 Card Informativo */}
      <Card className="border-l-4 border-l-emerald-500 bg-slate-50 dark:bg-slate-900/40">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Padrão Regulatório Obrigatório (CTB Art. 136):
              </span>{' '}
              <span className="text-slate-600 dark:text-slate-300">
                Faixa amarela horizontal de 40 cm com dístico "ESCOLAR" à meia altura, tacógrafo aferido e registrado no INMETRO,
                cinto de segurança para cada ocupante e inspeção semestral de segurança DETRAN.
              </span>
            </div>
          </div>
        </CardContent>
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

      {/* Tabela de Veículos com JetBrains Mono para dados técnicos */}
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFleet.map((vehicle) => {
              const expired = isInspectionExpired(vehicle.detran_inspection_due_date);

              return (
                <TableRow key={vehicle.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <TableCell className="font-mono text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{vehicle.plate}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">{vehicle.code}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{vehicle.model}</div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {vehicle.brand} • Ano: {vehicle.year_manufacture}/{vehicle.year_model}
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
                        {new Date(vehicle.detran_inspection_due_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {expired && <div className="text-[10px] text-rose-500 font-sans">Vistoria Expirada</div>}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                    {new Date(vehicle.crlv_due_date).toLocaleDateString('pt-BR')}
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
