<?php

declare(strict_types=1);

namespace Modules\Passeio\Services;

use App\Support\AuditLogger;
use App\Support\Money;
use App\Support\OutboxPublisher;
use DomainException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Modules\Passeio\Enums\StatusPasseio;
use Modules\Passeio\Models\Inscricao;
use Modules\Passeio\Models\Pagamento;

/**
 * Pagamentos da inscrição (change passeio-pagamentos-e-receita-finance). Auditoria e evento
 * passeio.pagamento.registrado|estornado no Outbox na mesma transação; o Finance consome o evento (D5).
 */
final class PagamentoService
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly OutboxPublisher $outbox,
    ) {}

    /** @param array{valor_centavos: int, data_pagamento: string, forma_pagamento: string, observacao?: string|null} $dados */
    public function registrar(Inscricao $inscricao, array $dados): Pagamento
    {
        return DB::transaction(function () use ($inscricao, $dados): Pagamento {
            /** @var Inscricao $inscricao */
            $inscricao = Inscricao::query()->with('passeio')->lockForUpdate()->findOrFail($inscricao->id);
            if ($inscricao->passeio?->status === StatusPasseio::Cancelado->value) {
                throw new DomainException('O passeio está cancelado e não recebe pagamentos.');
            }
            if (!$inscricao->vai) {
                throw new DomainException('Marque que o aluno vai ao passeio antes de registrar o pagamento.');
            }
            $saldo = $inscricao->saldo_centavos;
            if ((int) $dados['valor_centavos'] > $saldo) {
                throw new DomainException('O pagamento ultrapassa o saldo da inscrição (R$ ' . number_format((new Money($saldo))->cents / 100, 2, ',', '.') . ').');
            }

            $pagamento = Pagamento::create([
                ...$dados,
                'inscricao_id' => $inscricao->id,
                'registrado_por' => Auth::id(),
            ]);
            $pagamento->setAttribute('escola_id', $inscricao->escola_id)->save();

            $this->registrarMutacao('registrado', $pagamento, $inscricao, null);

            return $pagamento->refresh();
        });
    }

    public function estornar(Pagamento $pagamento, string $motivo): Pagamento
    {
        if ($pagamento->estornado_em !== null) {
            throw new DomainException('Este pagamento já foi estornado.');
        }

        return DB::transaction(function () use ($pagamento, $motivo): Pagamento {
            $antes = $pagamento->toArray();
            $pagamento->update(['estornado_em' => now(), 'estornado_por' => Auth::id(), 'motivo_estorno' => $motivo]);
            /** @var Inscricao $inscricao */
            $inscricao = $pagamento->inscricao()->with('passeio')->firstOrFail();
            $this->registrarMutacao('estornado', $pagamento, $inscricao, $antes);

            return $pagamento;
        });
    }

    /** @param array<string, mixed>|null $antes */
    private function registrarMutacao(string $acao, Pagamento $pagamento, Inscricao $inscricao, ?array $antes): void
    {
        $this->audit->record('passeio', "pagamento.{$acao}", "pagamento:{$pagamento->id}", $antes, $pagamento->toArray());
        $aluno = $inscricao->aluno()->first(['id', 'nome', 'pessoa_id']);
        $this->outbox->publish("passeio.pagamento.{$acao}", [
            'id' => $pagamento->id,
            'escola_id' => $pagamento->escola_id,
            'passeio_id' => $inscricao->passeio_id,
            'passeio_nome' => $inscricao->passeio->nome ?? null,
            'inscricao_id' => $inscricao->id,
            'aluno_nome' => $aluno->nome ?? null,
            'pessoa_id' => $aluno->pessoa_id ?? null,
            'valor_centavos' => $pagamento->valor_centavos,
            'data_pagamento' => $pagamento->data_pagamento->toDateString(),
        ], $pagamento->tenant_id);
    }
}
