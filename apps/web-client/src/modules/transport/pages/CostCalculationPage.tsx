import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button,
  Input,
  KpiCard,
} from '@sysgov/ui';
import {
  DollarSign,
  Fuel,
  TrendingUp,
  Save,
  Calculator,
  RefreshCw,
  Coins,
} from 'lucide-react';
import { apiClient } from '@/core/api/client';

interface RouteCostResult {
  route_id: number;
  route_code: string;
  route_name: string;
  daily_distance_km: number;
  monthly_distance_km: number;
  students_count: number;
  monthly_fuel_cost_cents: number;
  monthly_maintenance_cost_cents: number;
  monthly_tire_cost_cents: number;
  monthly_driver_cost_cents: number;
  total_monthly_cost_cents: number;
  cost_per_student_cents: number;
}

const mockCalculations: RouteCostResult[] = [
  {
    route_id: 1,
    route_code: 'ROTA-RUR-01',
    route_name: 'Linha Veredas - Assentamento Esperança',
    daily_distance_km: 68.4,
    monthly_distance_km: 1368.0,
    students_count: 28,
    monthly_fuel_cost_cents: 208800, // R$ 2.088,00
    monthly_maintenance_cost_cents: 164160, // R$ 1.641,60
    monthly_tire_cost_cents: 61560, // R$ 615,60
    monthly_driver_cost_cents: 320000, // R$ 3.200,00
    total_monthly_cost_cents: 754520, // R$ 7.545,20
    cost_per_student_cents: 26947, // R$ 269,47
  },
  {
    route_id: 2,
    route_code: 'ROTA-URB-02',
    route_name: 'Linha Circular Bairros Sul',
    daily_distance_km: 29.6,
    monthly_distance_km: 592.0,
    students_count: 25,
    monthly_fuel_cost_cents: 90360,
    monthly_maintenance_cost_cents: 71040,
    monthly_tire_cost_cents: 26640,
    monthly_driver_cost_cents: 320000,
    total_monthly_cost_cents: 508040,
    cost_per_student_cents: 20322,
  },
  {
    route_id: 3,
    route_code: 'ROTA-RUR-03',
    route_name: 'Linha Rio Abaixo - Comunidade Quilombola',
    daily_distance_km: 84.0,
    monthly_distance_km: 1680.0,
    students_count: 54,
    monthly_fuel_cost_cents: 256420,
    monthly_maintenance_cost_cents: 201600,
    monthly_tire_cost_cents: 75600,
    monthly_driver_cost_cents: 320000,
    total_monthly_cost_cents: 853620,
    cost_per_student_cents: 15808,
  },
];

export const CostCalculationPage: React.FC = () => {
  const [results] = useState<RouteCostResult[]>(mockCalculations);
  const [fuelPrice, setFuelPrice] = useState('5.80');
  const [avgConsumption, setAvgConsumption] = useState('3.80');
  const [maintenancePerKm, setMaintenancePerKm] = useState('1.20');
  const [tirePerKm, setTirePerKm] = useState('0.45');
  const [driverSalary, setDriverSalary] = useState('3200.00');

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const totalMonthlyCost = results.reduce((acc, r) => acc + r.total_monthly_cost_cents, 0);
  const totalStudents = results.reduce((acc, r) => acc + r.students_count, 0);
  const averageCostPerStudent = totalStudents > 0 ? totalMonthlyCost / totalStudents : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-500" />
            Custos Operacionais do Transporte Escolar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Metodologia SETE: Cálculo de consumo de combustível, depreciação, pneus, salários e custo médio mensal por aluno.
          </p>
        </div>
      </div>

      {/* KPIs de Custo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="CUSTO TOTAL MENSAL ESTIMADO"
          value={formatCurrency(totalMonthlyCost)}
          subtitle="Combustível + Manutenção + Pessoal"
          accentClassName="border-l-emerald-500"
          valueClassName="font-mono tabular-nums text-slate-900 dark:text-slate-100 font-bold"
        />

        <KpiCard
          title="CUSTO MÉDIO POR ALUNO / MÊS"
          value={formatCurrency(averageCostPerStudent)}
          subtitle={`${totalStudents} estudantes atendidos`}
          accentClassName="border-l-cyan-500"
          valueClassName="font-mono tabular-nums text-slate-900 dark:text-slate-100 font-bold"
        />

        <KpiCard
          title="QUILOMETRAGEM TOTAL / MÊS"
          value={`${results.reduce((acc, r) => acc + r.monthly_distance_km, 0).toLocaleString('pt-BR')} km`}
          subtitle="Estimativa 20 dias letivos"
          accentClassName="border-l-amber-500"
          valueClassName="font-mono tabular-nums text-slate-900 dark:text-slate-100 font-bold"
        />
      </div>

      {/* Formulário de Parâmetros de Custo */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-500" />
            Parâmetros Gerais de Custo Municipal (SETE)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Preço Diesel (R$/L)
              </label>
              <Input
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value)}
                className="font-mono text-xs tabular-nums mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Consumo Médio (Km/L)
              </label>
              <Input
                value={avgConsumption}
                onChange={(e) => setAvgConsumption(e.target.value)}
                className="font-mono text-xs tabular-nums mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Manutenção (R$/Km)
              </label>
              <Input
                value={maintenancePerKm}
                onChange={(e) => setMaintenancePerKm(e.target.value)}
                className="font-mono text-xs tabular-nums mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Pneus (R$/Km)
              </label>
              <Input
                value={tirePerKm}
                onChange={(e) => setTirePerKm(e.target.value)}
                className="font-mono text-xs tabular-nums mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Salário Condutor (R$)
              </label>
              <Input
                value={driverSalary}
                onChange={(e) => setDriverSalary(e.target.value)}
                className="font-mono text-xs tabular-nums mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" />
              Salvar Parâmetros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Resultados por Rota */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
              <TableHead className="text-xs font-semibold">ROTA / ITINERÁRIO</TableHead>
              <TableHead className="text-xs font-semibold text-center">ALUNOS</TableHead>
              <TableHead className="text-xs font-semibold text-right">KM / MÊS</TableHead>
              <TableHead className="text-xs font-semibold text-right">COMBUSTÍVEL</TableHead>
              <TableHead className="text-xs font-semibold text-right">MANUTENÇÃO</TableHead>
              <TableHead className="text-xs font-semibold text-right">CUSTO TOTAL / MÊS</TableHead>
              <TableHead className="text-xs font-semibold text-right">CUSTO / ALUNO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.route_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <TableCell className="text-xs">
                  <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{r.route_code}</div>
                  <div className="text-[11px] text-slate-500">{r.route_name}</div>
                </TableCell>
                <TableCell className="text-center font-mono text-xs tabular-nums font-semibold">
                  {r.students_count}
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                  {r.monthly_distance_km.toFixed(1)} km
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                  {formatCurrency(r.monthly_fuel_cost_cents)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                  {formatCurrency(r.monthly_maintenance_cost_cents + r.monthly_tire_cost_cents)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(r.total_monthly_cost_cents)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(r.cost_per_student_cents)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
