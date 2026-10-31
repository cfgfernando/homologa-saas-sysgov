<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Pessoas\Models\Pessoa;
use Modules\Transport\Models\TransportMonitor;

final class MonitorController extends Controller
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly TenantContext $tenantContext,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = TransportMonitor::query()->with(['pessoa', 'route']);

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('rg', 'like', $search)
                    ->orWhere('phone', 'like', $search)
                    ->orWhereHas('pessoa', function ($sq) use ($search) {
                        $sq->where('nome', 'like', $search)
                           ->orWhere('documento', 'like', $search);
                    });
            });
        }

        return response()->json($query->paginate((int) $request->input('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        // 1. Resolve Pessoa
        $pessoaId = $request->input('pessoa_id');
        if (empty($pessoaId)) {
            $cpf = preg_replace('/\D/', '', (string) ($request->input('cpf') ?? $request->input('documento') ?? ''));
            if (empty($cpf)) {
                $cpf = str_pad((string) mt_rand(100000000, 999999999), 11, '0', STR_PAD_LEFT);
            }
            $nome = (string) ($request->input('name') ?? $request->input('nome') ?? 'Monitor de Transporte');

            $pessoa = Pessoa::firstOrCreate(
                ['tenant_id' => $tenantId, 'documento' => $cpf],
                [
                    'tipo' => 'F',
                    'nome' => $nome,
                    'status' => 'ativo',
                ]
            );
            $pessoaId = $pessoa->id;
        }

        $monitor = TransportMonitor::create([
            'tenant_id' => $tenantId,
            'pessoa_id' => $pessoaId,
            'rg' => $request->input('rg'),
            'phone' => $request->input('phone'),
            'assigned_route_id' => $request->input('assigned_route_id'),
            'is_active' => filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ]);

        $this->audit->record('transporte', 'create', 'monitor:' . $monitor->id, null, $monitor->toArray());

        return response()->json(['data' => $monitor->load(['pessoa', 'route'])], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => TransportMonitor::with(['pessoa', 'route'])->findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $monitor = TransportMonitor::with(['pessoa', 'route'])->findOrFail($id);
        $before = $monitor->toArray();

        // Update Pessoa name/cpf if provided
        if ($monitor->pessoa) {
            $updates = [];
            if ($request->filled('name') || $request->filled('nome')) {
                $updates['nome'] = (string) ($request->input('name') ?? $request->input('nome'));
            }
            if ($request->filled('cpf')) {
                $updates['documento'] = preg_replace('/\D/', '', (string) $request->input('cpf'));
            }
            if (!empty($updates)) {
                $monitor->pessoa->update($updates);
            }
        }

        $fields = [];
        if ($request->has('rg')) {
            $fields['rg'] = $request->input('rg');
        }
        if ($request->has('phone')) {
            $fields['phone'] = $request->input('phone');
        }
        if ($request->has('assigned_route_id')) {
            $fields['assigned_route_id'] = $request->input('assigned_route_id') ?: null;
        }
        if ($request->has('is_active')) {
            $fields['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }

        $monitor->update($fields);

        $this->audit->record('transporte', 'update', 'monitor:' . $monitor->id, $before, $monitor->fresh()->toArray());

        return response()->json(['data' => $monitor->fresh()->load(['pessoa', 'route'])]);
    }

    public function destroy(string $id): JsonResponse
    {
        $monitor = TransportMonitor::findOrFail($id);
        $before = $monitor->toArray();
        $monitor->delete();
        $this->audit->record('transporte', 'delete', 'monitor:' . $monitor->id, $before, null);

        return response()->json(['message' => 'Monitor removido com sucesso.']);
    }
}
