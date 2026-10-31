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
  Select,
} from '@sysgov/ui';
import {
  FileText,
  Download,
  Upload,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Bus,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '@/core/api/client';

export const ReportAndCensusPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('call_list');
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  const fetchRoutes = async () => {
    try {
      const res = await apiClient.get('/transport/routes');
      if (res.data && Array.isArray(res.data.data)) {
        setRoutes(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedRouteId(res.data.data[0].id);
        }
      }
    } catch {
      // Fallback
    }
  };

  const fetchAllocations = async () => {
    try {
      const res = await apiClient.get('/transport/allocations');
      if (res.data && Array.isArray(res.data.data)) {
        setStudents(res.data.data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchAllocations();
  }, []);

  const currentRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const routeStudents = students.filter((s) => !selectedRouteId || s.route_id === selectedRouteId);
  const pnateEligibleCount = students.filter((s) => Boolean(s.census_eligible_pnate)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            Relatórios Operacionais & Censo Escolar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Geração de listas de chamada para condutores, relatórios oficiais do FNDE/PNATE e importação da base do Censo INEP.
          </p>
        </div>
      </div>

      {/* Grid com Seleção de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer border transition-all ${
            selectedReport === 'call_list'
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
          onClick={() => setSelectedReport('call_list')}
        >
          <CardContent className="p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Lista de Chamada</div>
            <div className="text-[11px] text-slate-500">
              Relação nominal de alunos por rota e ponto para controle diário de embarque.
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer border transition-all ${
            selectedReport === 'pnate'
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
          onClick={() => setSelectedReport('pnate')}
        >
          <CardContent className="p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Prestação PNATE / FNDE</div>
            <div className="text-[11px] text-slate-500">
              Demonstrativo de alunos rurais com percurso &gt; 2 km para comprovação de repasse.
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer border transition-all ${
            selectedReport === 'fleet'
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
          onClick={() => setSelectedReport('fleet')}
        >
          <CardContent className="p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Bus className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Vistorias & Frota DETRAN</div>
            <div className="text-[11px] text-slate-500">
              Relatório de conformidade do CTB Art. 136, inspeções semestrais e tacógrafos.
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer border transition-all ${
            selectedReport === 'census'
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
          onClick={() => setSelectedReport('census')}
        >
          <CardContent className="p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Importador Censo INEP</div>
            <div className="text-[11px] text-slate-500">
              Importação da base de dados oficial de matrículas e escolas do Censo Escolar.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo do Relatório Selecionado */}
      {selectedReport === 'call_list' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold">
                Lista de Chamada Diária — {currentRoute ? `${currentRoute.code} - ${currentRoute.name}` : 'Todas as Rotas'}
              </CardTitle>
              {currentRoute && (
                <div className="text-xs text-slate-500 font-mono mt-1">
                  Veículo: {currentRoute.vehicle?.plate || 'Designado'} | Tipo: {currentRoute.route_type}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {routes.length > 0 && (
                <div className="w-48">
                  <Select
                    value={String(selectedRouteId || '')}
                    onChange={(val: any) => setSelectedRouteId(Number(val))}
                    options={routes.map((r) => ({
                      value: String(r.id),
                      label: `${r.code} - ${r.name}`,
                    }))}
                  />
                </div>
              )}
              <Button size="sm" variant="outline" onClick={() => window.print()} className="text-xs flex items-center gap-1.5 font-mono">
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="text-xs font-semibold">Nº</TableHead>
                  <TableHead className="text-xs font-semibold">NOME DO ESTUDANTE</TableHead>
                  <TableHead className="text-xs font-semibold">PONTO DE EMBARQUE</TableHead>
                  <TableHead className="text-xs font-semibold">TURNO</TableHead>
                  <TableHead className="text-xs font-semibold text-center">EMBARCOU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routeStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-xs text-slate-500">
                      Nenhum estudante alocado nesta rota.
                    </TableCell>
                  </TableRow>
                ) : (
                  routeStudents.map((st, idx) => (
                    <TableRow key={st.id}>
                      <TableCell className="font-mono text-xs tabular-nums font-semibold">{String(idx + 1).padStart(2, '0')}</TableCell>
                      <TableCell className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {st.pessoa?.nome || 'Estudante ' + st.id}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {st.stop?.name || st.pickup_stop?.name || 'Ponto de Parada'}
                      </TableCell>
                      <TableCell className="text-xs capitalize text-slate-600 dark:text-slate-400">
                        {st.shift || 'Matutino'}
                      </TableCell>
                      <TableCell className="text-center">
                        <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'census' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold">
              Importação do Arquivo de Matrículas do Censo Escolar (MEC/INEP)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-center">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center gap-2">
              <Upload className="w-8 h-8 text-slate-400" />
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Arraste o arquivo do Censo Escolar (.txt ou .csv) ou clique para selecionar
              </div>
              <div className="text-[11px] text-slate-500">
                Formato suportado: Layout padrão Educacenso / INEP com vínculo aluno-escola.
              </div>
              <Button size="sm" className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Selecionar Arquivo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'pnate' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Demonstrativo de Alunos Elegíveis ao PNATE / FNDE (Exercício 2026)
            </CardTitle>
            <Button size="sm" onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 font-mono">
              <Download className="w-3.5 h-3.5" />
              Exportar Demonstrativo FNDE
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Total de alunos da rede escolar cadastrados: <strong className="font-mono text-slate-900 dark:text-slate-100">{students.length} alunos</strong>.
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Total de alunos elegíveis ao PNATE (zona rural e percurso &gt; 2 km): <strong className="font-mono text-emerald-600 font-bold">{pnateEligibleCount} alunos</strong>.
            </div>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'fleet' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Relatório de Conformidade CTB Art. 136 — Vistorias e Tacógrafos
            </CardTitle>
            <Button size="sm" onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 font-mono">
              <Printer className="w-3.5 h-3.5" />
              Imprimir Vistorias
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Emitido para apresentação junto aos órgãos de fiscalização de trânsito (Detran e Polícia Rodoviária), comprovando a regularidade das vistorias semestrais da frota escolar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
