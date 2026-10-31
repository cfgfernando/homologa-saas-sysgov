<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_student_allocations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('pessoa_id')->constrained('pessoas')->cascadeOnDelete();
            $table->foreignId('school_id')->nullable();
            $table->foreignId('route_id')->constrained('transport_routes')->cascadeOnDelete();
            $table->foreignId('pickup_stop_id')->constrained('transport_stops')->cascadeOnDelete();
            $table->foreignId('dropoff_stop_id')->nullable()->constrained('transport_stops')->nullOnDelete();
            $table->boolean('census_eligible_pnate')->default(false);
            $table->enum('status', ['active', 'transferred', 'cancelled'])->default('active');
            $table->timestamps();

            $table->index(['tenant_id', 'route_id']);
            $table->index(['tenant_id', 'status']);
            $table->unique(['tenant_id', 'pessoa_id', 'route_id'], 'unq_transp_alloc_student_route');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_student_allocations');
    }
};

