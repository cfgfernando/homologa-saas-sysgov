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
} from '@sysgov/ui';
import {
  School,
  Plus,
  Search,
  MapPin,
  Users,
  Route as RouteIcon,
  Phone,
} from 'lucide-react';

interface SchoolRecord {
  id: number;
  inep_code: string;
  name: string;
  zone: 'rural' | 'urban';
  address: string;
  latitude: number;
  longitude: number;
  total_transported_students: number;
  routes_count: number;
}

const mockSchools: SchoolRecord[] = [
  {
    id: 1,
    inep_code: '41019283',
    name: 'Escola Municipal Castro Alves',
    zone: 'rural',
    address: 'Estrada Geral do Assentamento Veredas, km 12',
    latitude: -15.81,
    longitude: -47.872,
    total_transported_students: 84,
    routes_count: 3,
  },
  {
    id: 2,
    inep_code: '41088492',
    name: 'Complexo Educacional Darcy Ribeiro',
    zone: 'urban',
    address: 'Av. Brasil Central, 1200 - Centro',
    latitude: -15.805,
    longitude: -47.855,
    total_transported_students: 142,
    routes_count: 5,
  },
  {
    id: 3,
    inep_code: '41033910',
    name: 'Escola Polo Zumbi dos Palmares',
    zone: 'rural',
    address: 'Comunidade Quilombola Rio Abaixo',
    latitude: -15.765,
    longitude: -47.91,
    total_transported_students: 54,
    routes_count: 2,
  },
];

export const SchoolManagementPage: React.FC = () => {
  const [schools] = useState<SchoolRecord[]>(mockSchools);
  const [search, setSearch] = useState('');

  const filteredSchools = schools.filter(
    (sc) =>
      sc.name.toLowerCase().includes(search.toLowerCase()) ||
      sc.inep_code.includes(search) ||
      sc.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <School className="w-6 h-6 text-emerald-500" />
            Unidades Escolares Atendidas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastro de escolas polos e pontos de destino, código INEP/MEC e cruzamento de rotas de atendimento.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs">
          <Plus className="w-4 h-4" />
          Cadastrar Escola
        </Button>
      </div>

      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <Input
          placeholder="Buscar por nome da escola, código INEP ou endereço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
              <TableHead className="text-xs font-semibold">INEP / ESCOLA</TableHead>
              <TableHead className="text-xs font-semibold">LOCALIZAÇÃO / ENDEREÇO</TableHead>
              <TableHead className="text-xs font-semibold text-center">ZONA</TableHead>
              <TableHead className="text-xs font-semibold text-center">ROTAS ATENDENDO</TableHead>
              <TableHead className="text-xs font-semibold text-right">ALUNOS TRANSPORTADOS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchools.map((school) => (
              <TableRow key={school.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <TableCell className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{school.name}</div>
                  <div className="font-mono text-[11px] text-slate-500 tabular-nums">INEP: {school.inep_code}</div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="text-slate-700 dark:text-slate-300">{school.address}</div>
                  <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                    Lat: {school.latitude.toFixed(4)} | Lng: {school.longitude.toFixed(4)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {school.zone === 'rural' ? 'Zona Rural' : 'Zona Urbana'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-mono text-xs tabular-nums font-semibold">
                  <div className="flex items-center justify-center gap-1 text-slate-800 dark:text-slate-200">
                    <RouteIcon className="w-3.5 h-3.5 text-cyan-500" />
                    {school.routes_count} rota(s)
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-center justify-end gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {school.total_transported_students} alunos
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
