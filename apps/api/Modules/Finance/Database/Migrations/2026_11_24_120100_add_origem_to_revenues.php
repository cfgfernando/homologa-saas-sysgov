<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Origem da receita gerada por outro módulo (ex.: passeio_pagamento), idempotente por tenant e origem. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('revenues', function (Blueprint $table): void {
            $table->string('source_type', 60)->nullable()->after('status');
            $table->unsignedBigInteger('source_id')->nullable()->after('source_type');
            $table->unique(['tenant_id', 'source_type', 'source_id'], 'revenues_tenant_origem_unique');
        });
    }

    public function down(): void
    {
        Schema::table('revenues', function (Blueprint $table): void {
            $table->dropUnique('revenues_tenant_origem_unique');
            $table->dropColumn(['source_type', 'source_id']);
        });
    }
};
