<?php

declare(strict_types=1);

namespace Modules\Passeio\Tests\Feature;

use App\Models\OutboxEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Passeio\Tests\Concerns\CenarioPasseio;
use Modules\Passeio\Tests\TestCase;

/** Change passeio-pagamentos-e-receita-finance: parcelas, saldo, estorno, Outbox e isolamento. */
final class PagamentosTest extends TestCase
{
    use CenarioPasseio;
    use RefreshDatabase;

    /** @return array{0: static, 1: int, 2: int} cliente autenticado, passeio, inscrição (passeio de 5000) */
    private function cenario(string $slug = 'escola-a'): array
    {
        $tenant = $this->criarTenant($slug);
        $aluno = $this->alunoNaTurma($tenant, 'Ana');
        $passeio = $this->passeio($tenant);
        $cliente = $this->como($this->usuario($tenant), $tenant);
        $inscricao = (int) $cliente->postJson("/api/passeio/passeios/{$passeio}/inscricoes", ['aluno_id' => $aluno->id])->assertCreated()->json('id');

        return [$cliente, $passeio, $inscricao];
    }

    /** @param array<string, mixed> $extra */
    private function pagar(mixed $cliente, int $inscricao, int $valor, array $extra = []): \Illuminate\Testing\TestResponse
    {
        return $cliente->postJson("/api/passeio/inscricoes/{$inscricao}/pagamentos", [
            'valor_centavos' => $valor, 'data_pagamento' => now()->toDateString(), 'forma_pagamento' => 'pix', ...$extra,
        ]);
    }

    public function test_pagamento_em_duas_parcelas_passa_de_parcial_a_quitado(): void
    {
        [$cliente, , $inscricao] = $this->cenario();

        $this->pagar($cliente, $inscricao, 2000)->assertCreated();
        $cliente->getJson("/api/passeio/inscricoes/{$inscricao}/pagamentos")->assertOk()
            ->assertJsonPath('situacao_financeira', 'parcial')->assertJsonPath('saldo_centavos', 3000);

        $this->pagar($cliente, $inscricao, 3000, ['forma_pagamento' => 'dinheiro'])->assertCreated();
        $cliente->getJson("/api/passeio/inscricoes/{$inscricao}/pagamentos")->assertOk()
            ->assertJsonPath('situacao_financeira', 'quitado')->assertJsonPath('pago_centavos', 5000)
            ->assertJsonCount(2, 'pagamentos');
    }

    public function test_pagamento_acima_do_saldo_e_recusado(): void
    {
        [$cliente, , $inscricao] = $this->cenario();
        $this->pagar($cliente, $inscricao, 4000)->assertCreated();

        $this->pagar($cliente, $inscricao, 2000)->assertStatus(422)
            ->assertJsonPath('error', 'O pagamento ultrapassa o saldo da inscrição (R$ 10,00).');
    }

    public function test_quem_nao_vai_e_passeio_cancelado_nao_recebem_pagamento(): void
    {
        [$cliente, $passeio, $inscricao] = $this->cenario();
        $cliente->putJson("/api/passeio/inscricoes/{$inscricao}", ['vai' => false])->assertOk();
        $this->pagar($cliente, $inscricao, 1000)->assertStatus(422)
            ->assertJsonPath('error', 'Marque que o aluno vai ao passeio antes de registrar o pagamento.');

        $cliente->putJson("/api/passeio/inscricoes/{$inscricao}", ['vai' => true])->assertOk();
        $dados = $cliente->getJson("/api/passeio/passeios/{$passeio}")->json();
        $cliente->putJson("/api/passeio/passeios/{$passeio}", [...$dados, 'status' => 'cancelado'])->assertOk();
        $this->pagar($cliente, $inscricao, 1000)->assertStatus(422)
            ->assertJsonPath('error', 'O passeio está cancelado e não recebe pagamentos.');
    }

    public function test_estorno_tira_o_valor_das_somas_sem_apagar(): void
    {
        [$cliente, $passeio, $inscricao] = $this->cenario();
        $this->pagar($cliente, $inscricao, 2000)->assertCreated();
        $parcela = (int) $this->pagar($cliente, $inscricao, 3000)->assertCreated()->json('id');

        $cliente->postJson("/api/passeio/pagamentos/{$parcela}/estorno", [])->assertStatus(422);
        $cliente->postJson("/api/passeio/pagamentos/{$parcela}/estorno", ['motivo' => 'Lançado em duplicidade'])->assertOk()
            ->assertJsonPath('motivo_estorno', 'Lançado em duplicidade');
        $cliente->postJson("/api/passeio/pagamentos/{$parcela}/estorno", ['motivo' => 'De novo'])->assertStatus(422);

        $cliente->getJson("/api/passeio/inscricoes/{$inscricao}/pagamentos")->assertOk()
            ->assertJsonPath('situacao_financeira', 'parcial')->assertJsonCount(2, 'pagamentos');
        $cliente->getJson("/api/passeio/passeios/{$passeio}/indicadores")->assertOk()
            ->assertJsonPath('arrecadado_centavos', 2000)->assertJsonPath('pendente_centavos', 3000)
            ->assertJsonPath('inscricoes_parciais', 1);
    }

    public function test_eventos_de_pagamento_e_estorno_vao_para_o_outbox(): void
    {
        [$cliente, $passeio, $inscricao] = $this->cenario();
        $id = (int) $this->pagar($cliente, $inscricao, 5000)->assertCreated()->json('id');
        $cliente->postJson("/api/passeio/pagamentos/{$id}/estorno", ['motivo' => 'Desistência'])->assertOk();

        $registrado = OutboxEvent::query()->where('event_type', 'passeio.pagamento.registrado')->firstOrFail();
        $this->assertSame(5000, $registrado->payload['valor_centavos']);
        $this->assertSame($passeio, $registrado->payload['passeio_id']);
        $this->assertNotNull($registrado->tenant_id);
        $this->assertTrue(OutboxEvent::query()->where('event_type', 'passeio.pagamento.estornado')->exists());
    }

    public function test_outro_tenant_nao_ve_nem_paga_a_inscricao(): void
    {
        [, , $inscricao] = $this->cenario();
        [$outro] = $this->cenario('escola-b');

        $outro->getJson("/api/passeio/inscricoes/{$inscricao}/pagamentos")->assertNotFound();
        $this->pagar($outro, $inscricao, 1000)->assertNotFound();
    }

    public function test_apoio_consulta_mas_nao_registra(): void
    {
        $tenant = $this->criarTenant();
        $aluno = $this->alunoNaTurma($tenant, 'Bia');
        $passeio = $this->passeio($tenant);
        $inscricao = (int) $this->como($this->usuario($tenant), $tenant)
            ->postJson("/api/passeio/passeios/{$passeio}/inscricoes", ['aluno_id' => $aluno->id])->json('id');
        $apoio = $this->como($this->usuario($tenant, ['passeio_apoio']), $tenant);

        $apoio->getJson("/api/passeio/inscricoes/{$inscricao}/pagamentos")->assertOk();
        $this->pagar($apoio, $inscricao, 1000)->assertForbidden();
    }

    public function test_migracao_converte_pago_em_pagamento_sem_eventos(): void
    {
        [$cliente, , $inscricao] = $this->cenario();
        $migration = require __DIR__ . '/../../Database/Migrations/2026_11_24_120000_create_passeio_pagamentos_table.php';
        $migration->down();
        \Illuminate\Support\Facades\DB::table('passeio_inscricoes')->where('id', $inscricao)->update(['pago' => true]);
        $eventosAntes = OutboxEvent::query()->count();

        $migration->up();

        $this->assertSame(OutboxEvent::query()->count(), $eventosAntes);
        $cliente->getJson("/api/passeio/inscricoes/{$inscricao}/pagamentos")->assertOk()
            ->assertJsonPath('situacao_financeira', 'quitado')
            ->assertJsonPath('pagamentos.0.valor_centavos', 5000)
            ->assertJsonPath('pagamentos.0.observacao', 'Migrado do campo pago');
    }
}
