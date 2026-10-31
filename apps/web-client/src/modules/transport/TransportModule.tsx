import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@sysgov/ui';
import {
  LayoutDashboard,
  GraduationCap,
  School,
  Route as RouteIcon,
  Bus,
  Wrench,
  Users,
  Building2,
  Coins,
  FileText,
} from 'lucide-react';
import { TransportDashboardPage } from './pages/TransportDashboardPage';
import { StudentManagementPage } from './pages/StudentManagementPage';
import { SchoolManagementPage } from './pages/SchoolManagementPage';
import { RouteManagementPage } from './pages/RouteManagementPage';
import { VehicleFleetPage } from './pages/VehicleFleetPage';
import { MaintenanceOrderPage } from './pages/MaintenanceOrderPage';
import { DriverAndMonitorPage } from './pages/DriverAndMonitorPage';
import { SupplierManagementPage } from './pages/SupplierManagementPage';
import { CostCalculationPage } from './pages/CostCalculationPage';
import { ReportAndCensusPage } from './pages/ReportAndCensusPage';

export const TransportModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 flex flex-wrap gap-1">
          <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs font-medium">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Painel Geral
          </TabsTrigger>
          <TabsTrigger value="alunos" className="flex items-center gap-1.5 text-xs font-medium">
            <GraduationCap className="w-3.5 h-3.5" />
            Alunos
          </TabsTrigger>
          <TabsTrigger value="escolas" className="flex items-center gap-1.5 text-xs font-medium">
            <School className="w-3.5 h-3.5" />
            Escolas
          </TabsTrigger>
          <TabsTrigger value="rotas" className="flex items-center gap-1.5 text-xs font-medium">
            <RouteIcon className="w-3.5 h-3.5" />
            Rotas & Mapas
          </TabsTrigger>
          <TabsTrigger value="veiculos" className="flex items-center gap-1.5 text-xs font-medium">
            <Bus className="w-3.5 h-3.5" />
            Frota & Veículos
          </TabsTrigger>
          <TabsTrigger value="os" className="flex items-center gap-1.5 text-xs font-medium">
            <Wrench className="w-3.5 h-3.5" />
            Ordens de Serviço
          </TabsTrigger>
          <TabsTrigger value="equipe" className="flex items-center gap-1.5 text-xs font-medium">
            <Users className="w-3.5 h-3.5" />
            Motoristas & Monitores
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="flex items-center gap-1.5 text-xs font-medium">
            <Building2 className="w-3.5 h-3.5" />
            Fornecedores
          </TabsTrigger>
          <TabsTrigger value="custos" className="flex items-center gap-1.5 text-xs font-medium">
            <Coins className="w-3.5 h-3.5" />
            Custos Operacionais
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-1.5 text-xs font-medium">
            <FileText className="w-3.5 h-3.5" />
            Relatórios & Censo
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="dashboard">
            <TransportDashboardPage onNavigateTab={setActiveTab} />
          </TabsContent>

          <TabsContent value="alunos">
            <StudentManagementPage />
          </TabsContent>

          <TabsContent value="escolas">
            <SchoolManagementPage />
          </TabsContent>

          <TabsContent value="rotas">
            <RouteManagementPage />
          </TabsContent>

          <TabsContent value="veiculos">
            <VehicleFleetPage />
          </TabsContent>

          <TabsContent value="os">
            <MaintenanceOrderPage />
          </TabsContent>

          <TabsContent value="equipe">
            <DriverAndMonitorPage />
          </TabsContent>

          <TabsContent value="fornecedores">
            <SupplierManagementPage />
          </TabsContent>

          <TabsContent value="custos">
            <CostCalculationPage />
          </TabsContent>

          <TabsContent value="relatorios">
            <ReportAndCensusPage />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TransportModule;
