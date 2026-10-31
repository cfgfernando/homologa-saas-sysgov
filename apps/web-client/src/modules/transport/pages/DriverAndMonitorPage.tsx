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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@sysgov/ui';
import {
  Users,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  IdCard,
} from 'lucide-react';

interface DriverItem {
  id: number;
  name: string;
  cpf: string;
  cnh_number: string;
  cnh_category: 'D' | 'E';
  cnh_due_date: string;
  school_course_due_date: string;
  toxicological_due_date: string;
  is_compliant: boolean;
}

interface MonitorItem {
  id: number;
  name: string;
  cpf: string;
  rg: string;
  phone: string;
  assigned_route: string;
  is_active: boolean;
}

const mockDrivers: DriverItem[] = [
  {
    id: 1,
    name: 'Carlos Alberto Silva',
    cpf: '123.456.789-00',
    cnh_number: '01928374650',
    cnh_category: 'D',
    cnh_due_date: '2028-05-20',
    school_course_due_date: '2027-11-15',
    toxicological_due_date: '2027-04-10',
    is_compliant: true,
  },
  {
    id: 2,
    name: 'Maria Helena Souza',
    cpf: '987.654.321-11',
    cnh_number: '09812736450',
    cnh_category: 'D',
    cnh_due_date: '2027-08-14',
    school_course_due_date: '2028-02-28',
    toxicological_due_date: '2027-06-30',
    is_compliant: true,
  },
  {
    id: 3,
    name: 'José Ferreira de Melo',
    cpf: '456.789.123-22',
    cnh_number: '05544332211',
    cnh_category: 'E',
    cnh_due_date: '2026-09-30', // expired
    school_course_due_date: '2027-01-10',
    toxicological_due_date: '2026-10-15',
    is_compliant: false,
  },
];

const mockMonitors: MonitorItem[] = [
  {
    id: 1,
    name: 'Ana Paula Rodrigues',
    cpf: '333.222.111-44',
    rg: '12.345.678-9 SSP/PR',
    phone: '(41) 98877-6655',
    assigned_route: 'ROTA-RUR-01',
    is_active: true,
  },
  {
    id: 2,
    name: 'Juliana Mendes Santos',
    cpf: '555.444.333-88',
    rg: '98.765.432-1 SSP/PR',
    phone: '(41) 99122-3344',
    assigned_route: 'ROTA-URB-02',
    is_active: true,
  },
];

export const DriverAndMonitorPage: React.FC = () => {
  const [subTab, setSubTab] = useState<'drivers' | 'monitors'>('drivers');
  const [drivers] = useState<DriverItem[]>(mockDrivers);
  const [monitors] = useState<MonitorItem[]>(mockMonitors);
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Condutores & Monitores de Transporte
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Conformidade CTB Art. 138 (idade &gt; 21 anos, CNH "D" ou "E", curso escolar e exame toxicológico) e monitores de bordo.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs">
          <Plus className="w-4 h-4" />
          {subTab === 'drivers' ? 'Cadastrar Motorista' : 'Cadastrar Monitor'}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={subTab === 'drivers' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSubTab('drivers')}
          className="text-xs"
        >
          Motoristas Habilitados ({drivers.length})
        </Button>
        <Button
          variant={subTab === 'monitors' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSubTab('monitors')}
          className="text-xs"
        >
          Monitores de Bordo ({monitors.length})
        </Button>
      </div>

      {subTab === 'drivers' ? (
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="text-xs font-semibold">MOTORISTA / CPF</TableHead>
                <TableHead className="text-xs font-semibold">Nº CNH / CATEGORIA</TableHead>
                <TableHead className="text-xs font-semibold">VALIDADE CNH</TableHead>
                <TableHead className="text-xs font-semibold">CURSO TRANSPORTE</TableHead>
                <TableHead className="text-xs font-semibold">TOXICOLÓGICO</TableHead>
                <TableHead className="text-xs font-semibold text-center">STATUS CTB 138</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((d) => (
                <TableRow key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <TableCell className="text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{d.name}</div>
                    <div className="font-mono text-[11px] text-slate-500 tabular-nums">{d.cpf}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums font-semibold">
                    <div>{d.cnh_number}</div>
                    <Badge variant="outline" className="border-cyan-500 text-cyan-500 text-[10px] py-0 px-1 mt-0.5">
                      Cat. {d.cnh_category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                    {new Date(d.cnh_due_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                    {new Date(d.school_course_due_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                    {new Date(d.toxicological_due_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-center">
                    {d.is_compliant ? (
                      <Badge variant="outline" className="border-emerald-500 text-emerald-500 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Conforme
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-rose-500 text-rose-500 text-[10px]">
                        <AlertTriangle className="w-3 h-3 mr-1 inline" /> CNH Vencida
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="text-xs font-semibold">MONITOR / CPF</TableHead>
                <TableHead className="text-xs font-semibold">DOCUMENTO RG</TableHead>
                <TableHead className="text-xs font-semibold">CONTATO TELEFÔNICO</TableHead>
                <TableHead className="text-xs font-semibold">ROTA DESIGNADA</TableHead>
                <TableHead className="text-xs font-semibold text-center">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitors.map((m) => (
                <TableRow key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <TableCell className="text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                    <div className="font-mono text-[11px] text-slate-500 tabular-nums">{m.cpf}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                    {m.rg}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                    {m.phone}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {m.assigned_route}
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
      )}
    </div>
  );
};
