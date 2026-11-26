<?php

declare(strict_types=1);

namespace Modules\Passeio\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Passeio\Http\Controllers\Concerns\RespondeErroDeNegocio;
use Modules\Passeio\Http\Requests\EstornarPagamentoRequest;
use Modules\Passeio\Http\Requests\RegistrarPagamentoRequest;
use Modules\Passeio\Models\Inscricao;
use Modules\Passeio\Models\Pagamento;
use Modules\Passeio\Services\PagamentoService;

final class PagamentoController extends Controller
{
    use RespondeErroDeNegocio;

    public function __construct(private readonly PagamentoService $pagamentos) {}

    public function index(Inscricao $inscricao): JsonResponse
    {
        $this->authorize('viewAny', [Pagamento::class, $inscricao]);
        $inscricao->load('passeio:id,valor_centavos', 'pagamentos');

        return response()->json([
            'inscricao_id' => $inscricao->id,
            'devido_centavos' => $inscricao->devidoCentavos(),
            'pago_centavos' => $inscricao->pago_centavos,
            'saldo_centavos' => $inscricao->saldo_centavos,
            'situacao_financeira' => $inscricao->situacao_financeira,
            'pagamentos' => $inscricao->pagamentos->sortBy([['data_pagamento', 'asc'], ['id', 'asc']])->values(),
        ]);
    }

    public function store(RegistrarPagamentoRequest $request, Inscricao $inscricao): JsonResponse
    {
        /** @var array{valor_centavos: int, data_pagamento: string, forma_pagamento: string, observacao?: string|null} $dados */
        $dados = $request->validated();

        return $this->executar(fn (): JsonResponse => response()->json($this->pagamentos->registrar($inscricao, $dados), 201));
    }

    public function estornar(EstornarPagamentoRequest $request, Pagamento $pagamento): JsonResponse
    {
        return $this->executar(fn (): JsonResponse => response()->json($this->pagamentos->estornar($pagamento, (string) $request->validated('motivo'))));
    }
}
