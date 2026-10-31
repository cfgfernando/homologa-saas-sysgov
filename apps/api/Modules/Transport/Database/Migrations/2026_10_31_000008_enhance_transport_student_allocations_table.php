<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transport_student_allocations', function (Blueprint $table): void {
            if (!Schema::hasColumn('transport_student_allocations', 'distance_km')) {
                $table->decimal('distance_km', 6, 2)->nullable()->after('dropoff_stop_id');
            }
            if (!Schema::hasColumn('transport_student_allocations', 'shift')) {
                $table->enum('shift', ['morning', 'afternoon', 'evening', 'full_day'])->default('morning')->after('distance_km');
            }
            if (!Schema::hasColumn('transport_student_allocations', 'has_special_needs')) {
                $table->boolean('has_special_needs')->default(false)->after('shift');
            }
        });
    }

    public function down(): void
    {
        Schema::table('transport_student_allocations', function (Blueprint $table): void {
            $table->dropColumn(['distance_km', 'shift', 'has_special_needs']);
        });
    }
};

