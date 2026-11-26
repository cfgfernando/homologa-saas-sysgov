<?php

declare(strict_types=1);

namespace Modules\Finance\Tests\Feature;

use App\Events\OutboxMessage;
use App\Models\OutboxEvent;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Module;
use Modules\Finance\Models\Revenue;
use Modules\Passeio\Tests\Concerns\CenarioPasseio;
use Modules\Passeio\Tests\TestCase;

/** Change passeio-pagamentos-e-receita-finance: receita espelhada do pagamento do Passeio. */
final class ReceitaDePagamentoDePasseioTest extends TestCase
{
    use CenarioPasseio;
    use RefreshDatabase;

    /** @return array{0: Tenant, 1: int} tenant e id do pagamento de 5000 */
    private function pagamento(bool $financeAtivo): array
    {
        $tenant = $this->criarTenant();
        if ($financeAtivo) {
            Module::firstOrCreate(['alias' => 'finance'], ['name' => 'Financeiro', 'enabled' => true, 'monthly_fee_cents' => 0])
                ->tenants()->syncWithoutDetaching([$tenant->id => ['enabled' => true, 'settings' => json_encode([])]]);
        }
        $aluno = $this->alunoNaTurma($tenant, 'Ana');
        $passeio = $this->passeio($tenant);
        $cliente = $this->como($this->usuario($tenant), $tenant);
        $inscricao = $cliente->postJson("/api/passeio/passeios/{$passeio}/inscricoes", ['aluno_id' => $aluno->id])->json('id');
        $id = (int) $cliente->postJson("/api/passeio/inscricoes/{$inscricao}/pagamentos", [
            'valor_centavos' => 5000, 'data_pagamento' => now()->toDateString(), 'forma_pagamento' => 'pix',
        ])->assertCreated()->json('id');

        return [$tenant, $id];
    }

    private function processar(string $tipo): void
    {
        foreach (OutboxEvent::query()->where('event_type', $tipo)->get() as $evento) {
            event(new OutboxMessage($evento));
        }
    }

    /** @return \Illuminate\Support\Collection<int, Revenue> */
    private function receitas(Tenant $tenant): \Illuminate\Support\Collection
    {
        return $this->noTenant($tenant, fn () => Revenue::query()->where('source_type', 'passeio_pagamento')->get());
    }

    public function test_finance_ativo_gera_receita_recebida_uma_unica_vez(): void
    {
        [$tenant, $id] = $this->pagamento(true);
        $this->processar('passeio.pagamento.registrado');
        $this->processar('passeio.pagamento.registrado');

        $receitas = $this->receitas($tenant);
        $this->assertCount(1, $receitas);
        $this->assertSame(5000, $receitas->first()->amount_cents);
        $this->assertSame('paid', $receitas->first()->status);
        $this->assertSame($id, (int) $receitas->first()->source_id);
    }

    public function test_estorno_cancela_a_receita(): void
    {
        [$tenant, $id] = $this->pagamento(true);
        $this->processar('passeio.pagamento.registrado');
        $this->como($this->usuario($tenant), $tenant)->postJson("/api/passeio/pagamentos/{$id}/estorno", ['motivo' => 'Desistência'])->assertOk();
        $this->processar('passeio.pagamento.estornado');

        $this->assertSame('cancelled', $this->receitas($tenant)->first()->status);
    }

    public function test_finance_inativo_ignora_o_evento(): void
    {
        [$tenant] = $this->pagamento(false);
        $this->processar('passeio.pagamento.registrado');

        $this->assertCount(0, $this->receitas($tenant));
    }
}
