<?php

declare(strict_types=1);

namespace Modules\Educa\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LogicException;
use Modules\Educa\Http\Requests\TransportRouteCreateRequest;
use Modules\Educa\Http\Requests\TransportRouteSchoolsRequest;
use Modules\Educa\Http\Requests\TransportRouteUpdateRequest;
use Modules\Educa\Http\Requests\TransportStopCreateRequest;
use Modules\Educa\Models\EducaTransportRoute;
use Modules\Educa\Services\TransportRouteService;

final class TransportRouteController extends Controller
{
    public function __construct(
        private readonly TransportRouteService $routeService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewRotas', EducaTransportRoute::class);

        $rotas = $this->routeService->listar([
            'turno' => $request->query('turno'),
            'tipo_rota' => $request->query('tipo_rota'),
            'ativo' => $request->has('ativo') ? $request->boolean('ativo') : null,
            'busca' => $request->query('busca'),
        ]);

        return response()->json([
            'data' => $rotas,
        ]);
    }

    public function store(TransportRouteCreateRequest $request): JsonResponse
    {
        $this->authorize('manageRotas', EducaTransportRoute::class);

        $dados = $request->validated();
        $dados['tenant_id'] = app(TenantContext::class)->id();

        try {
            $rota = $this->routeService->criar($dados);

            return response()->json([
                'data' => $rota,
            ], 201);
        } catch (LogicException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function show(string $rotaId): JsonResponse
    {
        $this->authorize('viewRotas', EducaTransportRoute::class);

        $rota = $this->routeService->obter($rotaId);

        return response()->json([
            'data' => $rota,
        ]);
    }

    public function update(TransportRouteUpdateRequest $request, string $rotaId): JsonResponse
    {
        $this->authorize('manageRotas', EducaTransportRoute::class);

        try {
            $rota = $this->routeService->atualizar($rotaId, $request->validated());

            return response()->json([
                'data' => $rota,
            ]);
        } catch (LogicException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function adicionarParada(TransportStopCreateRequest $request, string $rotaId): JsonResponse
    {
        $this->authorize('manageRotas', EducaTransportRoute::class);

        $dados = $request->validated();
        $dados['tenant_id'] = app(TenantContext::class)->id();

        try {
            $parada = $this->routeService->adicionarParada($rotaId, $dados);

            return response()->json([
                'data' => $parada,
            ], 201);
        } catch (LogicException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function vincularEscolas(TransportRouteSchoolsRequest $request, string $rotaId): JsonResponse
    {
        $this->authorize('manageRotas', EducaTransportRoute::class);

        $this->routeService->vincularEscolas($rotaId, $request->validated('school_ids'));

        return response()->json([
            'message' => 'Escolas vinculadas à rota com sucesso.',
        ]);
    }

    public function ocupacao(string $rotaId): JsonResponse
    {
        $this->authorize('viewRotas', EducaTransportRoute::class);

        $rota = $this->routeService->obter($rotaId);
        $totalAlunos = \Modules\Educa\Models\EducaTransportStudentAllocation::where('route_id', $rotaId)
            ->where('status', 'ativa')
            ->count();

        $veiculoAlocado = \Modules\Educa\Models\EducaTransportStudentAllocation::where('route_id', $rotaId)
            ->where('status', 'ativa')
            ->with('vehicle')
            ->first()?->vehicle;

        $capacidade = $veiculoAlocado?->capacidade_passageiros ?? 0;
        $taxaOcupacao = $capacidade > 0 ? round(($totalAlunos / $capacidade) * 100, 1) : 0.0;

        $nivel = 'regular';
        if ($taxaOcupacao > 100) {
            $nivel = 'superlotacao';
        } elseif ($taxaOcupacao >= 80) {
            $nivel = 'atencao';
        }

        return response()->json([
            'data' => [
                'route_id' => $rota->id,
                'route_codigo' => $rota->codigo,
                'route_nome' => $rota->nome,
                'vehicle_placa' => $veiculoAlocado?->placa,
                'capacidade_veiculo' => $capacidade,
                'alunos_alocados' => $totalAlunos,
                'taxa_ocupacao_percentual' => $taxaOcupacao,
                'nivel_ocupacao' => $nivel,
                'status_lotacao' => $taxaOcupacao > 100 ? 'superlotado' : 'conforme',
            ],
        ]);
    }

    public function validarRegistro60Censo(): JsonResponse
    {
        $this->authorize('viewRotas', EducaTransportRoute::class);

        $alocacoes = \Modules\Educa\Models\EducaTransportStudentAllocation::query()
            ->where('status', 'ativa')
            ->with(['route', 'vehicle', 'stop', 'alunoPessoa'])
            ->get();

        $total = $alocacoes->count();
        $rural = 0;
        $urbano = 0;
        $especialPcd = 0;
        $inconsistencias = [];

        foreach ($alocacoes as $aloc) {
            if ($aloc->uses_rural_transport || ($aloc->route && $aloc->route->tipo_rota === 'rural')) {
                $rural++;
            } else {
                $urbano++;
            }

            if ($aloc->special_needs_transport || ($aloc->vehicle && $aloc->vehicle->is_accessible_disability)) {
                $especialPcd++;
            }

            $problemas = [];
            if (! $aloc->vehicle_id) {
                $problemas[] = 'Veículo não informado';
            }

            if (! $aloc->stop_id) {
                $problemas[] = 'Ponto de embarque não definido';
            }

            if ($aloc->vehicle && ! $aloc->vehicle->hasVistoriaValida()) {
                $problemas[] = 'Veículo com vistoria do DETRAN vencida ou ausente';
            }

            if (! empty($problemas)) {
                $inconsistencias[] = [
                    'tipo' => 'alerta',
                    'mensagem' => "Inconsistência para {$aloc->alunoPessoa?->nome}",
                    'detalhe' => implode('; ', $problemas),
                    'allocation_id' => $aloc->id,
                    'aluno_nome' => $aloc->alunoPessoa?->nome ?? "Aluno #{$aloc->aluno_pessoa_id}",
                    'route_codigo' => $aloc->route?->codigo,
                    'problemas' => $problemas,
                ];
            }
        }

        $veiculosPcd = \Modules\Educa\Models\EducaTransportVehicle::where('is_accessible_disability', true)->count();
        $empresasTerceirizadas = \Modules\Educa\Models\EducaTransportCompany::where('is_active', true)->count();

        return response()->json([
            'data' => [
                'ano_letivo' => 2026,
                'total_alunos_alocados' => $total,
                'total_alunos_transportados' => $total,
                'total_zona_rural' => $rural,
                'total_zona_urbana' => $urbano,
                'total_atendimento_especial_pcd' => $especialPcd,
                'total_veiculos_acessiveis_pcd' => $veiculosPcd,
                'rotas_superlotadas_ctb' => 0,
                'total_empresas_terceirizadas' => $empresasTerceirizadas,
                'alunos_transporte_rural_pnate' => $rural,
                'alunos_transporte_urbano' => $urbano,
                'alunos_transporte_especial_pcd' => $especialPcd,
                'total_inconsistencias' => count($inconsistencias),
                'status_conformidade' => count($inconsistencias) === 0 ? 'aprovado' : 'pendencias_detectadas',
                'inconsistencias' => $inconsistencias,
            ],
        ]);
    }
}
