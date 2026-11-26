<?php

declare(strict_types=1);

namespace Modules\Finance\Listeners;

use App\Events\OutboxMessage;
use App\Models\Tenant;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Support\Facades\DB;
use Modules\Finance\Models\Revenue;

/**
 * Espelha pagamentos do Passeio como receita recebida, só quando o Finance está ativo no tenant
 * (change passeio-pagamentos-e-receita-finance, D5). Idempotente por origem; o estorno cancela a receita.
 */
final class ReceitaDePagamentoDePasseioListener
{
    public const REGISTRADO = 'passeio.pagamento.registrado';
    public const ESTORNADO = 'passeio.pagamento.estornado';
    public const ORIGEM = 'passeio_pagamento';

    public function __construct(
        private readonly TenantContext $tenantContext,
        private readonly AuditLogger $audit,
    ) {}

    public function handle(OutboxMessage $mensagem): void
    {
        $evento = $mensagem->event;
        if (!in_array($evento->event_type, [self::REGISTRADO, self::ESTORNADO], true) || $evento->tenant_id === null) {
            return;
        }
        if (!$this->financeAtivo((int) $evento->tenant_id)) {
            return;
        }

        $this->tenantContext->set(Tenant::findOrFail($evento->tenant_id));
        try {
            /** @var array<string, mixed> $p */
            $p = $evento->payload;
            DB::transaction(fn () => $evento->event_type === self::REGISTRADO ? $this->registrar($p) : $this->estornar($p));
        } finally {
            $this->tenantContext->clear();
        }
    }

    /** @param array<string, mixed> $p */
    private function registrar(array $p): void
    {
        $receita = Revenue::query()->firstOrCreate(
            ['source_type' => self::ORIGEM, 'source_id' => (int) $p['id']],
            [
                'description' => mb_substr('Passeio ' . ($p['passeio_nome'] ?? '') . ' — ' . ($p['aluno_nome'] ?? ''), 0, 255),
                'amount_cents' => (int) $p['valor_centavos'],
                'occurred_at' => $p['data_pagamento'],
                'paid_at' => $p['data_pagamento'],
                'status' => 'paid',
                'pessoa_id' => $p['pessoa_id'] ?? null,
            ],
        );
        if ($receita->wasRecentlyCreated) {
            $this->audit->record('finance', 'revenue.criada_por_passeio', "revenue:{$receita->id}", null, $receita->toArray());
        }
    }

    /** @param array<string, mixed> $p */
    private function estornar(array $p): void
    {
        $receita = Revenue::query()->where('source_type', self::ORIGEM)->where('source_id', (int) $p['id'])->first();
        if ($receita === null || $receita->status === 'cancelled') {
            return;
        }
        $antes = $receita->toArray();
        $receita->update(['status' => 'cancelled']);
        $this->audit->record('finance', 'revenue.cancelada_por_passeio', "revenue:{$receita->id}", $antes, $receita->toArray());
    }

    private function financeAtivo(int $tenantId): bool
    {
        return DB::table('tenant_module')
            ->join('modules', 'modules.id', '=', 'tenant_module.module_id')
            ->where('tenant_module.tenant_id', $tenantId)
            ->where('modules.alias', 'finance')
            ->where('tenant_module.enabled', true)
            ->exists();
    }
}
