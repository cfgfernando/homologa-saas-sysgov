<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Campanha municipal (Prefeito/Vereador): município de atuação e mapa por bairros.
 * `campanha_ref_bairros` é base pública (sem tenant), como as demais tabelas `campanha_ref_*`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campanha_campanhas', function (Blueprint $table): void {
            $table->unsignedInteger('codigo_ibge')->nullable()->after('uf');
        });

        Schema::create('campanha_ref_bairros', function (Blueprint $table): void {
            $table->unsignedInteger('codigo_ibge')->primary();
            $table->longText('geojson');
            $table->unsignedInteger('bairros')->default(0);
            $table->string('fonte', 255);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campanha_ref_bairros');
        Schema::table('campanha_campanhas', function (Blueprint $table): void {
            $table->dropColumn('codigo_ibge');
        });
    }
};
