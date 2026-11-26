<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Pagamentos da inscrição (change passeio-pagamentos-e-receita-finance). Converte o antigo booleano
 * "pago" em um pagamento do valor cheio, sem eventos no Outbox (D6), e remove a coluna.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('passeio_pagamentos', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('escola_id')->constrained('escola_escolas')->restrictOnDelete();
            $table->foreignId('inscricao_id')->constrained('passeio_inscricoes')->cascadeOnDelete();
            $table->unsignedBigInteger('valor_centavos');
            $table->date('data_pagamento');
            $table->string('forma_pagamento', 20);
            $table->string('observacao', 500)->nullable();
            $table->foreignId('registrado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('estornado_em')->nullable();
            $table->foreignId('estornado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->string('motivo_estorno', 500)->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'inscricao_id']);
            $table->index(['tenant_id', 'escola_id']);
        });

        $agora = now();
        DB::table('passeio_inscricoes as i')
            ->join('passeio_passeios as p', 'p.id', '=', 'i.passeio_id')
            ->where('i.pago', true)->where('i.vai', true)->whereNull('i.deleted_at')->where('p.valor_centavos', '>', 0)
            ->select('i.id', 'i.tenant_id', 'i.escola_id', 'i.updated_at', 'p.valor_centavos')
            ->orderBy('i.id')
            ->chunk(500, function ($linhas) use ($agora): void {
                DB::table('passeio_pagamentos')->insert($linhas->map(fn ($l): array => [
                    'tenant_id' => $l->tenant_id,
                    'escola_id' => $l->escola_id,
                    'inscricao_id' => $l->id,
                    'valor_centavos' => $l->valor_centavos,
                    'data_pagamento' => substr((string) ($l->updated_at ?? $agora), 0, 10),
                    'forma_pagamento' => 'outro',
                    'observacao' => 'Migrado do campo pago',
                    'created_at' => $agora,
                    'updated_at' => $agora,
                ])->all());
            });

        Schema::table('passeio_inscricoes', function (Blueprint $table): void {
            $table->dropColumn('pago');
        });
    }

    public function down(): void
    {
        Schema::table('passeio_inscricoes', function (Blueprint $table): void {
            $table->boolean('pago')->default(false)->after('autorizacao_entregue');
        });
        DB::table('passeio_inscricoes')
            ->whereIn('id', DB::table('passeio_pagamentos')->whereNull('estornado_em')->select('inscricao_id'))
            ->update(['pago' => true]);
        Schema::dropIfExists('passeio_pagamentos');
    }
};
