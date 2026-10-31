<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_drivers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('pessoa_id')->constrained('pessoas')->cascadeOnDelete();
            $table->string('cnh_number', 20);
            $table->enum('cnh_category', ['D', 'E']);
            $table->date('cnh_due_date');
            $table->date('toxicological_due_date');
            $table->date('school_transport_course_due_date');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'cnh_due_date']);
            $table->unique(['tenant_id', 'pessoa_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_drivers');
    }
};
