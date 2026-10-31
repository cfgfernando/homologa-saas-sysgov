# Especificação de Design Técnico: Módulo de Transporte Escolar Público (`Modules/Transport`)

- **Data:** 31 de Outubro de 2026
- **Status:** Aprovado
- **Repositório:** SYSGOV (`saas-sysgov`)
- **Arquitetura:** Monólito Modular Laravel (`apps/api/Modules/Transport`) + App Shell React 19 (`apps/web-client`)

---

## 1. Visão Geral e Contexto Regulatório

O submódulo **`SYS-Transporte`** (`Modules/Transport`) é o componente do ecossistema **SYSGOV** dedicado à governança, gestão de frota, planejamento de rotas e assistência ao transporte escolar municipal e estadual. 

O módulo absorve 100% da inteligência operacional do sistema **SETE (CECATE-UFG / FNDE)** e a eleva ao padrão corporativo multi-tenant do SYSGOV, atendendo rigorosamente:
1. **Lei nº 10.880/2004 (PNATE / FNDE):** Elegibilidade e cálculo de repasse de recursos federais para estudantes residentes em áreas rurais.
2. **Código de Trânsito Brasileiro (CTB - Arts. 136 a 139):**
   - Vistoria semestral obrigatória de equipamentos de segurança pelo DETRAN.
   - Condutores com idade superior a 21 anos, CNH categoria "D" ou "E", curso especializado para condutores de escolares e exame toxicológico regular.
   - Lotação máxima restrita à capacidade nominal do veículo.
3. **Censo Escolar da Educação Básica (MEC/Inep - Registro 60):**
   - Declaração de utilização de transporte escolar público, esfera responsável e tipologia do modal (rodoviário ou aquaviário).

---

## 2. Integração com os Pilares Fundacionais do SYSGOV

Seguindo as diretrizes obrigatórias do `AGENTS.md`:
1. **Cadastro de Pessoas (`Modules/Pessoas`):** Alunos, motoristas e monitores **não possuem tabelas de pessoas próprias**. Todos apontam para `pessoas.id` via chave estrangeira `pessoa_id`, garantindo unicidade de CPF, higienização de dados e conformidade com a LGPD. O frontend utiliza `<PessoaPicker>`.
2. **Acesso e Perfis (`Modules/Access`):** Permissões granulares no formato `transport.{recurso}.{acao}` validadas em Policies no backend.
3. **Estrutura Organizacional (`Modules/OrgChart`):** Vínculo da gestão do transporte à Secretaria Municipal de Educação ou Secretaria de Transporte via `org_unit_id`.
4. **Navegação Dinâmica (`Modules/Client`):** Itens de menu injetados dinamicamente via `ClientNavigationService`.
5. **Auditoria Imutável:** Todas as operações de escrita despacham eventos para a tabela `audit_logs` via `AuditLogger`.

---

## 3. Modelo de Dados Relacional (MySQL 8.4)

Todas as tabelas possuem `tenant_id` com índice composto `(tenant_id, created_at)` ou índices específicos para isolamento lógico.

### 3.1 Tabela `transport_vehicles`
```sql
CREATE TABLE transport_vehicles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(50) NOT NULL,
    plate VARCHAR(10) NOT NULL,
    renavam VARCHAR(20) NOT NULL,
    chassis VARCHAR(30) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year_manufacture INT NOT NULL,
    year_model INT NOT NULL,
    capacity_seats INT NOT NULL,
    vehicle_type ENUM('bus', 'microbus', 'van', 'boat', 'other') NOT NULL DEFAULT 'bus',
    ownership_type ENUM('owned', 'contracted') NOT NULL DEFAULT 'owned',
    company_id BIGINT UNSIGNED NULL,
    accessibility_adapted BOOLEAN NOT NULL DEFAULT FALSE,
    detran_inspection_due_date DATE NOT NULL,
    crlv_due_date DATE NOT NULL,
    status ENUM('active', 'maintenance', 'decommissioned') NOT NULL DEFAULT 'active',
    metadata JSON NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    INDEX idx_transp_veh_tenant (tenant_id, status),
    UNIQUE KEY unq_transp_veh_tenant_plate (tenant_id, plate)
);
```

### 3.2 Tabela `transport_drivers`
```sql
CREATE TABLE transport_drivers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    pessoa_id BIGINT UNSIGNED NOT NULL,
    cnh_number VARCHAR(20) NOT NULL,
    cnh_category ENUM('D', 'E') NOT NULL,
    cnh_due_date DATE NOT NULL,
    toxicological_due_date DATE NOT NULL,
    school_transport_course_due_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_transp_drv_tenant (tenant_id, is_active),
    UNIQUE KEY unq_transp_drv_tenant_pessoa (tenant_id, pessoa_id)
);
```

### 3.3 Tabela `transport_stops`
```sql
CREATE TABLE transport_stops (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(50) NULL,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NULL,
    neighborhood VARCHAR(100) NULL,
    cep VARCHAR(10) NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    zone_type ENUM('urban', 'rural') NOT NULL DEFAULT 'rural',
    rural_obstacles JSON NULL, -- { porteira: bool, mata_burro: bool, atoleiro: bool, ponte_rustica: bool }
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_transp_stops_tenant (tenant_id, is_active)
);
```

### 3.4 Tabela `transport_routes`
```sql
CREATE TABLE transport_routes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    shift ENUM('morning', 'afternoon', 'night', 'full_day') NOT NULL,
    route_type ENUM('rural', 'urban', 'mixed') NOT NULL DEFAULT 'rural',
    distance_paved_km DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    distance_unpaved_km DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    estimated_duration_minutes INT NOT NULL DEFAULT 0,
    assigned_vehicle_id BIGINT UNSIGNED NULL,
    assigned_driver_id BIGINT UNSIGNED NULL,
    shape_geojson LONGTEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_transp_routes_tenant (tenant_id, is_active),
    UNIQUE KEY unq_transp_routes_tenant_code (tenant_id, code)
);
```

### 3.5 Tabela `transport_student_allocations`
```sql
CREATE TABLE transport_student_allocations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    pessoa_id BIGINT UNSIGNED NOT NULL, -- Aluno
    school_id BIGINT UNSIGNED NOT NULL, -- Escola atendida
    route_id BIGINT UNSIGNED NOT NULL,
    pickup_stop_id BIGINT UNSIGNED NOT NULL,
    dropoff_stop_id BIGINT UNSIGNED NULL,
    census_eligible_pnate BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('active', 'transferred', 'cancelled') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_transp_alloc_tenant (tenant_id, route_id),
    INDEX idx_transp_alloc_student (tenant_id, pessoa_id)
);
```

### 3.6 Tabela `transport_maintenance_orders`
```sql
CREATE TABLE transport_maintenance_orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    vehicle_id BIGINT UNSIGNED NOT NULL,
    service_type ENUM('preventive', 'corrective', 'tires', 'oil_change', 'inspection') NOT NULL,
    amount_cents BIGINT UNSIGNED NOT NULL DEFAULT 0, -- Centavos inteiros
    odometer_km INT NOT NULL,
    service_date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_transp_maint_tenant (tenant_id, vehicle_id)
);
```

---

## 4. Camada de Serviços de Domínio

1. **`DriverComplianceService`:**
   - Validação de categoria CNH (`D` ou `E`), exame toxicológico periódico e curso de condutor escolar antes de associar a qualquer rota.
2. **`VehicleFleetService`:**
   - Controle de vistorias semestrais do DETRAN.
   - Trava de capacidade: bloqueia alocação se $\sum \text{alunos} > \text{capacity\_seats}$.
   - Exigência de acessibilidade para alunos PCD.
3. **`PnateEligibilityService`:**
   - Determinação de elegibilidade do aluno para repasses federais com base na distância da residência até a escola e localização rural.
   - Geração de dados para o Censo Escolar (Registro 60).
4. **`TransportCostCalculatorService`:**
   - Cálculo do custo por quilômetro e custo médio por estudante.

---

## 5. Padrão de Interface e Design System

- **Biblioteca:** Componentes de `@sysgov/ui` (`Button`, `Card`, `Badge`, `Modal`, `Table`, `Select`, `Input`).
- **Padrão Tipográfico:** Dados numéricos, placas, códigos, quilometragens, valores monetários (R$) e datas formatados obrigatoriamente com `JetBrains Mono` (`font-mono tabular-nums`).
- **Cartografia:** Componente de mapas em Leaflet/MapLibre para visualização e desenho de traçados georreferenciados (GeoJSON).

