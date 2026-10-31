import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@sysgov/ui';
import { LayoutDashboard, Route as RouteIcon, Bus } from 'lucide-react';
import { TransportDashboardPage } from './pages/TransportDashboardPage';
import { RouteManagementPage } from './pages/RouteManagementPage';
import { VehicleFleetPage } from './pages/VehicleFleetPage';

export const TransportModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
          <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs font-medium">
            <LayoutDashboard className="w-4 h-4" />
            Painel Geral & Conformidade
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2 text-xs font-medium">
            <RouteIcon className="w-4 h-4" />
            Rotas & Itinerários
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2 text-xs font-medium">
            <Bus className="w-4 h-4" />
            Frota de Veículos (CTB 136)
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="dashboard">
            <TransportDashboardPage />
          </TabsContent>

          <TabsContent value="routes">
            <RouteManagementPage />
          </TabsContent>

          <TabsContent value="vehicles">
            <VehicleFleetPage />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TransportModule;
