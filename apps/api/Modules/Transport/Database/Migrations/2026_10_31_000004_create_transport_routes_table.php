<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_routes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('name', 150);
            $table->enum('shift', ['morning', 'afternoon', 'night', 'full_day']);
            $table->enum('route_type', ['rural', 'urban', 'mixed'])->default('rural');
            $table->decimal('distance_paved_km', 8, 2)->default(0.00);
            $table->decimal('distance_unpaved_km', 8, 2)->default(0.00);
            $table->unsignedSmallInteger('estimated_duration_minutes')->default(0);
            $table->foreignId('assigned_vehicle_id')->nullable()->constrained('transport_vehicles')->nullOnDelete();
            $table->foreignId('assigned_driver_id')->nullable()->constrained('transport_drivers')->nullOnDelete();
            $table->longText('shape_geojson')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'shift']);
            $table->unique(['tenant_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_routes');
    }
};
