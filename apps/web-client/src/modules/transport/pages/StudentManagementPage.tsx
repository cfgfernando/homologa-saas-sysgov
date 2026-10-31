import React, { useState } from 'react';
import {
  Card,
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
  GraduationCap,
  Plus,
  Search,
  Upload,
  FileSpreadsheet,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Accessibility,
} from 'lucide-react';

interface StudentRecord {
  id: number;
  name: string;
  registration: string;
  school_name: string;
  route_code: string;
  stop_name: string;
  shift: 'morning' | 'afternoon' | 'full_day';
  distance_km: number;
  is_pnate: boolean;
  has_special_needs: boolean;
}

const mockStudents: StudentRecord[] = [
  {
    id: 1,
    name: 'Bernardo Alves Santos',
    registration: 'MAT-2026-0891',
    school_name: 'Escola Municipal Castro Alves',
    route_code: 'ROTA-RUR-01',
    stop_name: 'Comunidade São João',
    shift: 'morning',
    distance_km: 4.8,
    is_pnate: true,
    has_special_needs: false,
  },
  {
    id: 2,
    name: 'Beatriz Castro Ferreira',
    registration: 'MAT-2026-0892',
    school_name: 'Escola Municipal Castro Alves',
    route_code: 'ROTA-RUR-01',
    stop_name: 'Fazenda Boa Vista',
    shift: 'morning',
    distance_km: 6.2,
    is_pnate: true,
    has_special_needs: false,
  },
  {
    id: 3,
    name: 'Davi Lucas Ferreira Silva',
    registration: 'MAT-2026-0893',
    school_name: 'Complexo Educacional Darcy Ribeiro',
    route_code: 'ROTA-URB-02',
    stop_name: 'Terminal Central',
    shift: 'afternoon',
    distance_km: 1.4,
    is_pnate: false,
    has_special_needs: true,
  },
  {
    id: 4,
    name: 'Helena Ribeiro de Lima',
    registration: 'MAT-2026-0894',
    school_name: 'Escola Polo Zumbi dos Palmares',
    route_code: 'ROTA-RUR-03',
    stop_name: 'Ponto Rio Verde',
    shift: 'morning',
    distance_km: 8.5,
    is_pnate: true,
    has_special_needs: false,
  },
];

export const StudentManagementPage: React.FC = () => {
  const [students] = useState<StudentRecord[]>(mockStudents);
  const [search, setSearch] = useState('');
  const [routeFilter, setRouteFilter] = useState('');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.registration.toLowerCase().includes(search.toLowerCase()) ||
      s.school_name.toLowerCase().includes(search.toLowerCase());
    const matchesRoute = !routeFilter || s.route_code === routeFilter;
    return matchesSearch && matchesRoute;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-500" />
            Gestão de Alunos Transportados
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mapeamento de residência georreferenciada, trajeto casa-escola, ponto de embarque e elegibilidade ao PNATE.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs font-mono">
            <Upload className="w-4 h-4 text-slate-500" />
            Importar Planilha (SETE/CSV)
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs">
            <Plus className="w-4 h-4" />
            Cadastrar Aluno
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por nome, matrícula ou escola..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={routeFilter}
            onChange={(val) => setRouteFilter(String(val))}
            options={[
              { value: '', label: 'Todas as Rotas' },
              { value: 'ROTA-RUR-01', label: 'ROTA-RUR-01' },
              { value: 'ROTA-URB-02', label: 'ROTA-URB-02' },
              { value: 'ROTA-RUR-03', label: 'ROTA-RUR-03' },
            ]}
          />
        </div>
      </div>

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
              <TableHead className="text-xs font-semibold">MATRÍCULA / ALUNO</TableHead>
              <TableHead className="text-xs font-semibold">UNIDADE ESCOLAR</TableHead>
              <TableHead className="text-xs font-semibold">ROTA / PONTO DE EMBARQUE</TableHead>
              <TableHead className="text-xs font-semibold text-center">TURNO</TableHead>
              <TableHead className="text-xs font-semibold text-right">DISTÂNCIA</TableHead>
              <TableHead className="text-xs font-semibold text-center">PNATE (FNDE)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((s) => (
              <TableRow key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <TableCell className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {s.name}
                    {s.has_special_needs && (
                      <Badge variant="outline" className="border-indigo-500 text-indigo-500 text-[10px] py-0 px-1">
                        <Accessibility className="w-3 h-3 mr-0.5 inline" /> PCD
                      </Badge>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 tabular-nums">{s.registration}</div>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {s.school_name}
                </TableCell>
                <TableCell className="text-xs">
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{s.route_code}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-500" />
                    {s.stop_name}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {s.shift === 'morning' ? 'Matutino' : s.shift === 'afternoon' ? 'Vespertino' : 'Integral'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                  {s.distance_km.toFixed(1)} km
                </TableCell>
                <TableCell className="text-center">
                  {s.is_pnate ? (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Elegível (&gt; 2 km)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-400 text-slate-500 text-[10px]">
                      Não Elegível
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
