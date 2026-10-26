<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabela de Empresas Prestadoras de Serviço / Contratos Terceirizados
        if (! Schema::hasTable('educa_transport_companies')) {
            Schema::create('educa_transport_companies', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignId('legal_person_id')->nullable()->constrained('pessoas')->nullOnDelete();
                $table->foreignId('responsible_person_id')->nullable()->constrained('pessoas')->nullOnDelete();
                $table->string('razao_social', 255);
                $table->string('nome_fantasia', 255)->nullable();
                $table->string('cnpj', 20)->nullable();
                $table->string('contract_number', 100)->nullable();
                $table->date('contract_start_date')->nullable();
                $table->date('contract_end_date')->nullable();
                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['tenant_id', 'is_active'], 'idx_transp_comp_tenant_active');
            });
        }

        // 2. Colunas complementares de Veículos (Censo Escolar Registro 60 e Acessibilidade)
        Schema::table('educa_transport_vehicles', function (Blueprint $table): void {
            if (! Schema::hasColumn('educa_transport_vehicles', 'company_id')) {
                $table->foreignUuid('company_id')->nullable()->after('tenant_id')->constrained('educa_transport_companies')->nullOnDelete();
            }
            if (! Schema::hasColumn('educa_transport_vehicles', 'chassis')) {
                $table->string('chassis', 30)->nullable()->after('renavam');
            }
            if (! Schema::hasColumn('educa_transport_vehicles', 'vehicle_type_inep')) {
                $table->unsignedSmallInteger('vehicle_type_inep')->default(2)->after('tipologia'); // 1: Van, 2: Microonibus, 3: Onibus
            }
            if (! Schema::hasColumn('educa_transport_vehicles', 'is_exclusive_school_use')) {
                $table->boolean('is_exclusive_school_use')->default(true)->after('status');
            }
            if (! Schema::hasColumn('educa_transport_vehicles', 'is_accessible_disability')) {
                $table->boolean('is_accessible_disability')->default(false)->after('is_exclusive_school_use');
            }
        });

        // 3. Colunas complementares de Motoristas e Condutores
        Schema::table('educa_transport_drivers', function (Blueprint $table): void {
            if (! Schema::hasColumn('educa_transport_drivers', 'company_id')) {
                $table->foreignUuid('company_id')->nullable()->after('pessoa_id')->constrained('educa_transport_companies')->nullOnDelete();
            }
            if (! Schema::hasColumn('educa_transport_drivers', 'toxicological_exam_date')) {
                $table->date('toxicological_exam_date')->nullable()->after('validade_curso');
            }
            if (! Schema::hasColumn('educa_transport_drivers', 'toxicological_expiration_date')) {
                $table->date('toxicological_expiration_date')->nullable()->after('toxicological_exam_date');
            }
        });

        // 4. Colunas complementares de Rotas (Extensão Pavimentada/Não Pavimentada e Censo)
        Schema::table('educa_transport_routes', function (Blueprint $table): void {
            if (! Schema::hasColumn('educa_transport_routes', 'company_id')) {
                $table->foreignUuid('company_id')->nullable()->after('tenant_id')->constrained('educa_transport_companies')->nullOnDelete();
            }
            if (! Schema::hasColumn('educa_transport_routes', 'academic_year')) {
                $table->unsignedSmallInteger('academic_year')->default(2026)->after('nome');
            }
            if (! Schema::hasColumn('educa_transport_routes', 'km_paved')) {
                $table->decimal('km_paved', 8, 2)->default(0)->after('quilometragem_estimada');
            }
            if (! Schema::hasColumn('educa_transport_routes', 'km_unpaved')) {
                $table->decimal('km_unpaved', 8, 2)->default(0)->after('km_paved');
            }
            if (! Schema::hasColumn('educa_transport_routes', 'return_departure_time')) {
                $table->string('return_departure_time', 10)->nullable()->after('horario_chegada');
            }
            if (! Schema::hasColumn('educa_transport_routes', 'is_outsourced')) {
                $table->boolean('is_outsourced')->default(false)->after('return_departure_time');
            }
        });

        // 5. Colunas complementares de Alocações de Estudantes (Registro 60 do Censo / PNATE)
        Schema::table('educa_transport_student_allocations', function (Blueprint $table): void {
            if (! Schema::hasColumn('educa_transport_student_allocations', 'uses_rural_transport')) {
                $table->boolean('uses_rural_transport')->default(false)->after('status');
            }
            if (! Schema::hasColumn('educa_transport_student_allocations', 'public_transport_jurisdiction')) {
                $table->unsignedSmallInteger('public_transport_jurisdiction')->default(2)->after('uses_rural_transport'); // 1: Estadual, 2: Municipal, 3: Compartilhado
            }
            if (! Schema::hasColumn('educa_transport_student_allocations', 'special_needs_transport')) {
                $table->boolean('special_needs_transport')->default(false)->after('public_transport_jurisdiction');
            }
            if (! Schema::hasColumn('educa_transport_student_allocations', 'special_needs_notes')) {
                $table->text('special_needs_notes')->nullable()->after('special_needs_transport');
            }
        });
    }

    public function down(): void
    {
        Schema::table('educa_transport_student_allocations', function (Blueprint $table): void {
            $table->dropColumn(['uses_rural_transport', 'public_transport_jurisdiction', 'special_needs_transport', 'special_needs_notes']);
        });

        Schema::table('educa_transport_routes', function (Blueprint $table): void {
            $table->dropForeign(['company_id']);
            $table->dropColumn(['company_id', 'academic_year', 'km_paved', 'km_unpaved', 'return_departure_time', 'is_outsourced']);
        });

        Schema::table('educa_transport_drivers', function (Blueprint $table): void {
            $table->dropForeign(['company_id']);
            $table->dropColumn(['company_id', 'toxicological_exam_date', 'toxicological_expiration_date']);
        });

        Schema::table('educa_transport_vehicles', function (Blueprint $table): void {
            $table->dropForeign(['company_id']);
            $table->dropColumn(['company_id', 'chassis', 'vehicle_type_inep', 'is_exclusive_school_use', 'is_accessible_disability']);
        });

        Schema::dropIfExists('educa_transport_companies');
    }
};
