<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Garagens (Pernoite de Veículos)
        if (!Schema::hasTable('transport_garages')) {
            Schema::create('transport_garages', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->string('name', 150);
                $table->decimal('latitude', 10, 8)->nullable();
                $table->decimal('longitude', 11, 8)->nullable();
                $table->string('address', 255)->nullable();
                $table->unsignedSmallInteger('capacity_vehicles')->default(10);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['tenant_id', 'is_active']);
            });
        }

        // 2. Fornecedores & Terceirizados (Oficinas, Postos, Empresas de Transporte)
        if (!Schema::hasTable('transport_suppliers')) {
            Schema::create('transport_suppliers', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->string('cnpj', 20);
                $table->string('corporate_name', 200);
                $table->string('trade_name', 150)->nullable();
                $table->enum('service_type', ['transport_service', 'workshop', 'fuel_station', 'parts', 'other'])->default('transport_service');
                $table->string('contract_number', 50)->nullable();
                $table->string('phone', 30)->nullable();
                $table->string('email', 100)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['tenant_id', 'service_type']);
            });
        }

        // 3. Monitores de Transporte Escolar
        if (!Schema::hasTable('transport_monitors')) {
            Schema::create('transport_monitors', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignId('pessoa_id')->constrained('pessoas')->cascadeOnDelete();
                $table->string('rg', 30)->nullable();
                $table->string('phone', 30)->nullable();
                $table->foreignId('assigned_route_id')->nullable()->constrained('transport_routes')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['tenant_id', 'is_active']);
            });
        }

        // 4. Parâmetros de Custo Operacional (em centavos de Real para precisão)
        if (!Schema::hasTable('transport_cost_parameters')) {
            Schema::create('transport_cost_parameters', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->unsignedInteger('fuel_price_cents')->default(580); // R$ 5,80
                $table->decimal('avg_consumption_km_per_liter', 5, 2)->default(3.80); // 3,8 km/l para ônibus
                $table->unsignedInteger('maintenance_cost_per_km_cents')->default(120); // R$ 1,20 por km
                $table->unsignedInteger('tire_cost_per_km_cents')->default(45); // R$ 0,45 por km
                $table->unsignedBigInteger('driver_salary_cents')->default(320000); // R$ 3.200,00
                $table->timestamps();

                $table->unique('tenant_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_cost_parameters');
        Schema::dropIfExists('transport_monitors');
        Schema::dropIfExists('transport_suppliers');
        Schema::dropIfExists('transport_garages');
    }
};
