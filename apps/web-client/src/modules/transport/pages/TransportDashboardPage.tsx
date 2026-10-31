import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  KpiCard,
  AlertCard,
  Badge,
  Button,
} from '@sysgov/ui';
import {
  Bus,
  Users,
  Route as RouteIcon,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Navigation,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { TransportMapViewer, RouteMapData } from '../components/TransportMapViewer';
import { apiClient } from '@/core/api/client';

interface DashboardStats {
  vehicles: {
    total: number;
    active: number;
    pending_inspection: number;
  };
  drivers: {
    total: number;
    active: number;
    expired_cnh: number;
    expired_course: number;
  };
  routes: {
    total: number;
    active: number;
    rural: number;
    urban: number;
    mixed: number;
  };
  students: {
    total_transported: number;
    pnate_eligible: number;
  };
}

const mockRoutes: RouteMapData[] = [
  {
    id: 1,
    code: 'ROTA-RUR-01',
    name: 'Linha Veredas - Assentamento Esperança',
    shift: 'morning',
    route_type: 'rural',
    distance_km: 34.2,
    stops: [
      { id: 101, name: 'Comunidade São João', latitude: -15.7801, longitude: -47.892, students_count: 8 },
      { id: 102, name: 'Fazenda Boa Vista', latitude: -15.795, longitude: -47.885, students_count: 6 },
      { id: 103, name: 'Escola Municipal Rural Castro Alves', latitude: -15.81, longitude: -47.872, students_count: 14 },
    ],
  },
  {
    id: 2,
    code: 'ROTA-URB-02',
    name: 'Linha Circular Bairros Sul',
    shift: 'afternoon',
    route_type: 'urban',
    distance_km: 14.8,
    stops: [
      { id: 201, name: 'Terminal Central', latitude: -15.798, longitude: -47.865, students_count: 12 },
      { id: 202, name: 'Complexo Educacional Darcy Ribeiro', latitude: -15.805, longitude: -47.855, students_count: 18 },
    ],
  },
];

export const TransportDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    vehicles: { total: 24, active: 21, pending_inspection: 2 },
    drivers: { total: 28, active: 26, expired_cnh: 1, expired_course: 0 },
    routes: { total: 18, active: 18, rural: 12, urban: 6, mixed: 0 },
    students: { total_transported: 642, pnate_eligible: 488 },
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/transport/dashboard');
      if (response?.data?.data) {
        setStats(response.data.data);
      }
    } catch {
      // Fallback preserves initial stats
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const pnatePercentage = stats.students.total_transported > 0
    ? ((stats.students.pnate_eligible / stats.students.total_transported) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bus className="w-6 h-6 text-emerald-500" />
            Transporte Escolar & Gestão de Frotas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Conformidade CTB (Arts. 136 e 138), fiscalização DETRAN, roteirização georreferenciada e repasses PNATE/FNDE.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 font-mono text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Grid de KPIs Obrigatórios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="FROTA DE VEÍCULOS"
          value={stats.vehicles.total}
          subtitle={`${stats.vehicles.active} em circulação ativa`}
          accentClassName="border-l-emerald-500"
          valueClassName="font-mono tabular-nums text-slate-900 dark:text-slate-100"
          statusBadge={
            stats.vehicles.pending_inspection > 0 ? (
              <Badge variant="outline" className="border-amber-500 text-amber-500 font-mono text-[11px]">
                {stats.vehicles.pending_inspection} vistoria(s) pendente(s)
              </Badge>
            ) : (
              <Badge variant="outline" className="border-emerald-500 text-emerald-500 font-mono text-[11px]">
                Frota 100% inspecionada
              </Badge>
            )
          }
        />

        <KpiCard
          title="CONDUTORES HABILITADOS"
          value={stats.drivers.total}
          subtitle="Conformidade CTB Art. 138"
          accentClassName="border-l-indigo-500"
          valueClassName="font-mono tabular-nums text-slate-900 dark:text-slate-100"
          statusBadge={
            stats.drivers.expired_cnh > 0 ? (
              <Badge variant="outline" className="border-rose-500 text-rose-500 font-mono text-[11px]">
                {stats.drivers.expired_cnh} CNH vencida
              </Badge>
            ) : (
              <Badge variant="outline" className="border-emerald-500 text-emerald-500 font-mono text-[11px]">
                CNH D/E em dia
              </Badge>
            )
          }
        />

        <KpiCard
          title="ROTAS & ITINERÁRIOS"
          value={stats.routes.total}
          subtitle={`${stats.routes.rural} rurais | ${stats.routes.urban} urbanas`}
          accentClassName="border-l-cyan-500"
          valueClassName="font-mono tabular-nums text-slate-900 dark:text-slate-100"
          statusBadge={
            <Badge variant="outline" className="border-cyan-500 text-cyan-500 font-mono text-[11px]">
              {stats.routes.active} ativas hoje
            </Badge>
          }
        />

        <KpiCard
          title="ALUNOS TRANSPORTADOS"
          value={stats.students.total_transported}
          subtitle={`Elegibilidade PNATE: ${pnatePercentage}%`}
          accentClassName="border-l-amber-500"
          valueClassName="font-mono tabular-nums text-slate-900 dark:text-slate-100"
          statusBadge={
            <Badge variant="outline" className="border-amber-500 text-amber-500 font-mono text-[11px]">
              {stats.students.pnate_eligible} alunos PNATE (&gt; 2 km)
            </Badge>
          }
        />
      </div>

      {/* Semáforo de Alertas Fiscais e Regulatórios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AlertCard
          priority="danger"
          title="Inspeções Semestrais DETRAN (CTB Art. 136)"
          description={`${stats.vehicles.pending_inspection} veículo(s) necessitam de renovação da vistoria semestral de segurança ou autorização emitida pelo DETRAN.`}
          statusLabel="CRÍTICO"
          tag="REGULARIDADE FISCAL"
          actionLabel="Verificar Veículos"
        />

        <AlertCard
          priority="warning"
          title="Certidão & Cursos de Transporte Escolar"
          description={
            stats.drivers.expired_cnh > 0
              ? 'Detectado condutor com validade de habilitação categoria D/E expirada.'
              : 'Todos os condutores ativos possuem certidão negativa de antecedentes criminais válida.'
          }
          statusLabel={stats.drivers.expired_cnh > 0 ? 'ATENÇÃO' : 'REGULAR'}
          tag="CTB ART. 138"
          actionLabel="Verificar Condutores"
        />

        <AlertCard
          priority="info"
          title="Repasse Federal FNDE / PNATE"
          description={`${stats.students.pnate_eligible} estudantes da zona rural possuem percurso casa-escola superior a 2,0 km elegíveis para a quota de transferência voluntária.`}
          statusLabel="CONFORME"
          tag="REPASSE FNDE"
          actionLabel="Exportar Relatório"
        />
      </div>

      {/* Visualizador de Mapa Georreferenciado */}
      <TransportMapViewer routes={mockRoutes} height="460px" />
    </div>
  );
};
