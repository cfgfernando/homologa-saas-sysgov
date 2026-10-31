<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_vehicles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('plate', 10);
            $table->string('renavam', 20);
            $table->string('chassis', 30);
            $table->string('brand', 50);
            $table->string('model', 50);
            $table->unsignedSmallInteger('year_manufacture');
            $table->unsignedSmallInteger('year_model');
            $table->unsignedSmallInteger('capacity_seats');
            $table->enum('vehicle_type', ['bus', 'microbus', 'van', 'boat', 'other'])->default('bus');
            $table->enum('ownership_type', ['owned', 'contracted'])->default('owned');
            $table->unsignedBigInteger('company_id')->nullable();
            $table->boolean('accessibility_adapted')->default(false);
            $table->date('detran_inspection_due_date');
            $table->date('crlv_due_date');
            $table->enum('status', ['active', 'maintenance', 'decommissioned'])->default('active');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'detran_inspection_due_date']);
            $table->unique(['tenant_id', 'plate']);
            $table->unique(['tenant_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_vehicles');
    }
};
