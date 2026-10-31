# Plano de Implementação: Módulo de Transporte Escolar (`SYS-Transporte`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o módulo completo de Transporte Escolar (`Modules/Transport`) no backend Laravel e no frontend React do SYSGOV, integrando regras do CTB (Arts. 136-138), elegibilidade do PNATE/FNDE, georreferenciamento e multi-tenancy estrito.

**Architecture:** Monólito modular Laravel em `apps/api/Modules/Transport` com isolamento lógico multi-tenant (`tenant_id`), trait `TenantAware`, auditoria via `AuditLogger` e integração com `Modules/Pessoas`. Frontend React 19 + TypeScript no `apps/web-client` utilizando primitivos de `@sysgov/ui` e dados técnicos em `JetBrains Mono`.

**Tech Stack:** PHP 8.3, Laravel 11, nwidart/laravel-modules, MySQL 8.4, React 19, TypeScript, Tailwind CSS v4, `@sysgov/ui`, Leaflet/OpenStreetMap.

**Spec:** [`docs/superpowers/specs/2026-10-31-transporte-escolar-design.md`](../specs/2026-10-31-transporte-escolar-design.md)

## Global Constraints

- **Multi-Tenant:** Todas as tabelas possuem `tenant_id` obrigatório e índices compostos iniciados por `tenant_id`.
- **Cadastro Único de Pessoas:** Condutores e alunos utilizam FK `pessoa_id` apontando para `pessoas.id` (sem duplicação de dados).
- **Valores Monetários:** Representação exata em centavos inteiros (`amount_cents` unsignedBigInteger), nunca `float`.
- **Auditoria:** Toda ação de escrita registra evento imutável em `audit_logs` via `AuditLogger`.
- **Tipografia Técnica:** Placas, códigos, quilometragens, datas e valores em `JetBrains Mono` (`font-mono tabular-nums`).
- **Componentes de UI:** Primitivos importados exclusivamente de `@sysgov/ui`.

---

### Task 1: Scaffolding do Módulo Laravel `Transport`

**Files:**
- Create: `apps/api/Modules/Transport/module.json`
- Create: `apps/api/Modules/Transport/Providers/TransportServiceProvider.php`
- Create: `apps/api/Modules/Transport/Providers/RouteServiceProvider.php`
- Modify: `apps/api/modules_statuses.json`

**Interfaces:**
- Produces: Módulo `Transport` registrado no kernel do Laravel.

- [ ] **Passo 1: Executar o comando de scaffold do SYSGOV**
  Executar no diretório `apps/api`:
  ```bash
  php artisan make:module Transport
  ```
- [ ] **Passo 2: Configurar o `module.json` com metadados de menu e permissões**
  Garantir que `module.json` contenha `name: "Transport"`, `alias: "transport"`, e prioridade de carregamento.
- [ ] **Passo 3: Validar carregamento do módulo no Artisan**
  Executar `php artisan module:list` e verificar status `Enabled`.
- [ ] **Passo 4: Commit**
  ```bash
  git add apps/api/Modules/Transport apps/api/modules_statuses.json
  git commit -m "feat(transport): scaffold module structure"
  ```

---

### Task 2: Migrations das Tabelas do Domínio de Transporte

**Files:**
- Create: `apps/api/Modules/Transport/Database/Migrations/2026_10_31_000001_create_transport_vehicles_table.php`
- Create: `apps/api/Modules/Transport/Database/Migrations/2026_10_31_000002_create_transport_drivers_table.php`
- Create: `apps/api/Modules/Transport/Database/Migrations/2026_10_31_000003_create_transport_stops_table.php`
- Create: `apps/api/Modules/Transport/Database/Migrations/2026_10_31_000004_create_transport_routes_table.php`
- Create: `apps/api/Modules/Transport/Database/Migrations/2026_10_31_000005_create_transport_student_allocations_table.php`
- Create: `apps/api/Modules/Transport/Database/Migrations/2026_10_31_000006_create_transport_maintenance_orders_table.php`

**Interfaces:**
- Produces: Estrutura relacional do banco de dados para frotas, rotas, condutores e alocações.

- [ ] **Passo 1: Criar migration para `transport_vehicles` com regras do CTB**
  Campos: `tenant_id`, `code`, `plate`, `renavam`, `chassis`, `capacity_seats`, `vehicle_type`, `detran_inspection_due_date`, `status`.
- [ ] **Passo 2: Criar migration para `transport_drivers` vinculado a `pessoas`**
  Campos: `tenant_id`, `pessoa_id`, `cnh_number`, `cnh_category`, `cnh_due_date`, `toxicological_due_date`, `school_transport_course_due_date`.
- [ ] **Passo 3: Criar migration para `transport_stops` e `transport_routes`**
  Georreferenciamento (latitude, longitude, obstáculos rurais) e traçado da linha (`shape_geojson`).
- [ ] **Passo 4: Criar migration para `transport_student_allocations` e `transport_maintenance_orders`**
  Vínculos com alunos, elegibilidade PNATE e ordens de serviço com centavos inteiros (`amount_cents`).
- [ ] **Passo 5: Rodar as migrations**
  ```bash
  php artisan module:migrate Transport
  ```
- [ ] **Passo 6: Commit**
  ```bash
  git add apps/api/Modules/Transport/Database/Migrations
  git commit -m "feat(transport): create domain database migrations"
  ```

---

### Task 3: Models Eloquent com `TenantAware`

**Files:**
- Create: `apps/api/Modules/Transport/Models/TransportVehicle.php`
- Create: `apps/api/Modules/Transport/Models/TransportDriver.php`
- Create: `apps/api/Modules/Transport/Models/TransportStop.php`
- Create: `apps/api/Modules/Transport/Models/TransportRoute.php`
- Create: `apps/api/Modules/Transport/Models/TransportStudentAllocation.php`
- Create: `apps/api/Modules/Transport/Models/TransportMaintenanceOrder.php`

**Interfaces:**
- Consumes: Migrations da Task 2 e Trait `App\Models\Concerns\TenantAware`.
- Produces: Models mapeados com relacionamentos `belongsTo(Pessoa::class)` e escopos de tenant.

- [ ] **Passo 1: Criar `TransportVehicle` com casts de datas e enum**
- [ ] **Passo 2: Criar `TransportDriver` com relação `belongsTo(Pessoa::class, 'pessoa_id')`**
- [ ] **Passo 3: Criar `TransportRoute` com relações para veículo, condutor e pontos**
- [ ] **Passo 4: Criar `TransportStudentAllocation` e `TransportMaintenanceOrder`**
  Garantir cast de `amount_cents` como `integer` e `rural_obstacles` como `array`.
- [ ] **Passo 5: Commit**
  ```bash
  git add apps/api/Modules/Transport/Models
  git commit -m "feat(transport): add TenantAware Eloquent models"
  ```

---

### Task 4: Serviços de Regras de Domínio e Compliance

**Files:**
- Create: `apps/api/Modules/Transport/Services/DriverComplianceService.php`
- Create: `apps/api/Modules/Transport/Services/VehicleFleetService.php`
- Create: `apps/api/Modules/Transport/Services/PnateEligibilityService.php`
- Test: `apps/api/Modules/Transport/Tests/Unit/ComplianceServiceTest.php`

**Interfaces:**
- Produces: Métodos de validação de CTB (`validateDriverForRoute`, `validateVehicleInspection`) e cálculo de elegibilidade PNATE.

- [x] **Passo 1: Escrever teste unitário para `DriverComplianceService`**
  Testar rejeição de CNH categoria "B", CNH vencida e curso vencido.
- [x] **Passo 2: Implementar `DriverComplianceService`**
- [x] **Passo 3: Implementar `VehicleFleetService` com trava de lotação máxima**
- [x] **Passo 4: Implementar `PnateEligibilityService`**
  Calcular distância geodésica entre residência do aluno e escola (regra dos 2 km para zona rural).
- [x] **Passo 5: Executar testes da suíte de compliance**
  ```bash
  php artisan test Modules/Transport/Tests/Unit/ComplianceServiceTest.php
  ```
- [x] **Passo 6: Commit**
  ```bash
  git add apps/api/Modules/Transport/Services apps/api/Modules/Transport/Tests
  git commit -m "feat(transport): implement compliance and eligibility domain services"
  ```

---

### Task 5: Controllers REST, Policies e Auditoria

**Files:**
- Create: `apps/api/Modules/Transport/Http/Controllers/VehicleController.php`
- Create: `apps/api/Modules/Transport/Http/Controllers/RouteController.php`
- Create: `apps/api/Modules/Transport/Http/Controllers/AllocationController.php`
- Create: `apps/api/Modules/Transport/Policies/TransportRoutePolicy.php`
- Modify: `apps/api/Modules/Transport/Routes/api.php`

**Interfaces:**
- Consumes: Models, Services e `AuditLogger`.
- Produces: Endpoints HTTP protegidos por `auth:sanctum` e `resolve.tenant`.

- [x] **Passo 1: Criar rotas em `Routes/api.php` com prefixo `api/transport`**
- [x] **Passo 2: Implementar `VehicleController` com validação de vistoria e auditoria**
- [x] **Passo 3: Implementar `RouteController` com itinerário e georreferenciamento**
- [x] **Passo 4: Implementar `AllocationController` com alocação e elegibilidade automática**
- [x] **Passo 5: Commit**
  ```bash
  git add apps/api/Modules/Transport/Http apps/api/Modules/Transport/Routes apps/api/Modules/Transport/Policies
  git commit -m "feat(transport): create REST controllers with AuditLogger integration"
  ```

---

### Task 6: Teste de Isolamento Multi-Tenant

**Files:**
- Create: `apps/api/Modules/Transport/Tests/Feature/TenantIsolationTest.php`

**Interfaces:**
- Consumes: Todos os endpoints da Task 5.
- Produces: Garantia de que dados do Município A nunca são acessados pelo Município B.

- [x] **Passo 1: Escrever teste com dois tenants distintos (Tenant 1 e Tenant 2)**
- [x] **Passo 2: Criar veículos e rotas no Tenant 1 e tentar ler com credenciais do Tenant 2**
- [x] **Passo 3: Executar a suíte de testes de isolamento**
  ```bash
  php artisan test Modules/Transport/Tests/Feature/TenantIsolationTest.php
  ```
- [x] **Passo 4: Commit**
  ```bash
  git add apps/api/Modules/Transport/Tests/Feature/TenantIsolationTest.php
  git commit -m "test(transport): verify strict multi-tenant isolation"
  ```

---

### Task 7: Frontend React — Dashboard, Rotas e Mapas (`apps/web-client`)

**Files:**
- Create: `apps/web-client/src/modules/transport/pages/TransportDashboardPage.tsx`
- Create: `apps/web-client/src/modules/transport/pages/RouteManagementPage.tsx`
- Create: `apps/web-client/src/modules/transport/pages/VehicleFleetPage.tsx`
- Create: `apps/web-client/src/modules/transport/components/TransportMapViewer.tsx`
- Modify: `apps/web-client/src/routes/AppRoutes.tsx`

**Interfaces:**
- Consumes: Primitivos do pacote `@sysgov/ui`, endpoints `/api/transport/*`.
- Produces: Interface visual responsiva de gestão do transporte escolar.

- [x] **Passo 1: Criar o `TransportMapViewer` com suporte a Leaflet e camadas GeoJSON**
- [x] **Passo 2: Construir o `TransportDashboardPage` com KPIs e alertas de vistoria**
- [x] **Passo 3: Construir `RouteManagementPage` e `VehicleFleetPage` com dados técnicos em `JetBrains Mono`**
- [x] **Passo 4: Registrar as rotas no App Shell do `apps/web-client`**
- [x] **Passo 5: Validar a compilação do TypeScript e estilos**
  ```bash
  pnpm --filter @sysgov/web-client build
  ```
- [x] **Passo 6: Commit**
  ```bash
  git add apps/web-client/src/modules/transport apps/web-client/src/routes
  git commit -m "feat(transport): create frontend dashboard and map management screens"
  ```

