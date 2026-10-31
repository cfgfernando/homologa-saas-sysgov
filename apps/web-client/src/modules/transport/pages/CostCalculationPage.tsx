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
  CheckCircle2,
  AlertCircle,
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

export const CostCalculationPage: React.FC = () => {
  const [results, setResults] = useState<RouteCostResult[]>([]);
  const [fuelPrice, setFuelPrice] = useState('5.80');
  const [avgConsumption, setAvgConsumption] = useState('3.80');
  const [maintenancePerKm, setMaintenancePerKm] = useState('1.20');
  const [tirePerKm, setTirePerKm] = useState('0.45');
  const [driverSalary, setDriverSalary] = useState('3200.00');

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchParameters = async () => {
    try {
      const res = await apiClient.get('/transport/costs/parameters');
      if (res.data?.data) {
        const p = res.data.data;
        setFuelPrice((p.fuel_price_cents / 100).toFixed(2));
        setAvgConsumption(Number(p.avg_consumption_km_per_liter).toFixed(2));
        setMaintenancePerKm((p.maintenance_cost_per_km_cents / 100).toFixed(2));
        setTirePerKm((p.tire_cost_per_km_cents / 100).toFixed(2));
        setDriverSalary((p.driver_salary_cents / 100).toFixed(2));
      }
    } catch {
      // Fallback
    }
  };

  const fetchCalculations = async () => {
    try {
      const res = await apiClient.get('/transport/costs/calculate');
      if (res.data && Array.isArray(res.data.data)) {
        setResults(res.data.data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchParameters();
    fetchCalculations();
  }, []);

  const handleSaveParameters = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await apiClient.put('/transport/costs/parameters', {
        fuel_price_cents: Math.round(parseFloat(fuelPrice.replace(',', '.')) * 100),
        avg_consumption_km_per_liter: parseFloat(avgConsumption.replace(',', '.')),
        maintenance_cost_per_km_cents: Math.round(parseFloat(maintenancePerKm.replace(',', '.')) * 100),
        tire_cost_per_km_cents: Math.round(parseFloat(tirePerKm.replace(',', '.')) * 100),
        driver_salary_cents: Math.round(parseFloat(driverSalary.replace(',', '.')) * 100),
      });
      await fetchCalculations();
      setStatusMessage('Parâmetros de custo atualizados e cálculos recalculados com sucesso!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert('Falha ao salvar parâmetros: ' + (err.response?.data?.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const totalMonthlyCost = results.reduce((acc, r) => acc + (r.total_monthly_cost_cents || 0), 0);
  const totalStudents = results.reduce((acc, r) => acc + (r.students_count || 0), 0);
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
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCalculations}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Recalcular Custos
        </Button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 text-xs rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

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
          value={`${results.reduce((acc, r) => acc + (r.monthly_distance_km || 0), 0).toLocaleString('pt-BR')} km`}
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
            <Button
              onClick={handleSaveParameters}
              disabled={saving}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 font-semibold"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Salvando...' : 'Salvar e Recalcular Parâmetros'}
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
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">
                  Nenhuma rota com custo calculado no momento.
                </TableCell>
              </TableRow>
            ) : (
              results.map((r) => (
                <TableRow key={r.route_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <TableCell className="text-xs">
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{r.route_code}</div>
                    <div className="text-[11px] text-slate-500">{r.route_name}</div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs tabular-nums font-semibold">
                    {r.students_count}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                    {r.monthly_distance_km ? r.monthly_distance_km.toFixed(1) : '0.0'} km
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                    {formatCurrency(r.monthly_fuel_cost_cents || 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                    {formatCurrency((r.monthly_maintenance_cost_cents || 0) + (r.monthly_tire_cost_cents || 0))}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(r.total_monthly_cost_cents || 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(r.cost_per_student_cents || 0)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
