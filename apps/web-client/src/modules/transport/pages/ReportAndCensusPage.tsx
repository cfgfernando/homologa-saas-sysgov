import React, { useState } from 'react';
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

export const ReportAndCensusPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('call_list');

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
          <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Lista de Chamada Diária — ROTA-RUR-01 (Turno Matutino)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="text-xs flex items-center gap-1.5 font-mono">
                <Printer className="w-3.5 h-3.5" />
                Imprimir Lista
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 font-mono">
                <Download className="w-3.5 h-3.5" />
                Exportar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="text-xs text-slate-500 font-mono">
              Condutor: Carlos Alberto Silva (CNH: 01928374650) | Veículo: BRA2E19 (Capacidade: 44 lug.)
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                  <TableHead className="text-xs font-semibold">Nº</TableHead>
                  <TableHead className="text-xs font-semibold">NOME DO ESTUDANTE</TableHead>
                  <TableHead className="text-xs font-semibold">PONTO DE EMBARQUE</TableHead>
                  <TableHead className="text-xs font-semibold">ESCOLA DESTINO</TableHead>
                  <TableHead className="text-xs font-semibold text-center">EMBARCOU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs tabular-nums">01</TableCell>
                  <TableCell className="text-xs font-medium">Bernardo Alves Santos</TableCell>
                  <TableCell className="text-xs">Comunidade São João (06:30)</TableCell>
                  <TableCell className="text-xs">Escola Municipal Castro Alves</TableCell>
                  <TableCell className="text-center">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs tabular-nums">02</TableCell>
                  <TableCell className="text-xs font-medium">Beatriz Castro Ferreira</TableCell>
                  <TableCell className="text-xs">Fazenda Boa Vista (06:50)</TableCell>
                  <TableCell className="text-xs">Escola Municipal Castro Alves</TableCell>
                  <TableCell className="text-center">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600" />
                  </TableCell>
                </TableRow>
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
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 font-mono">
              <Download className="w-3.5 h-3.5" />
              Exportar Demonstrativo FNDE
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Total de alunos da zona rural com trajeto geodésico casa-escola superior a 2,0 km: <strong className="font-mono text-emerald-600">488 alunos</strong>.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
