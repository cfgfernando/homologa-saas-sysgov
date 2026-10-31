<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_maintenance_orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained('transport_vehicles')->cascadeOnDelete();
            $table->enum('service_type', ['preventive', 'corrective', 'tires', 'oil_change', 'inspection']);
            $table->unsignedBigInteger('amount_cents')->default(0); // Centavos inteiros
            $table->unsignedInteger('odometer_km');
            $table->date('service_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'vehicle_id']);
            $table->index(['tenant_id', 'service_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_maintenance_orders');
    }
};

