<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            $query->whereHas('pessoa', function ($q) use ($search) {
                $q->where('nome', 'like', $search);
            });
        }

        return response()->json($query->paginate((int) $request->input('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pessoa_id' => ['required'],
            'rg' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:30'],
            'assigned_route_id' => ['nullable', 'exists:transport_routes,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $data['tenant_id'] = $this->tenantContext->id();
        $monitor = TransportMonitor::create($data);

        $this->audit->record('transporte', 'create', 'monitor:' . $monitor->id, null, $monitor->toArray());

        return response()->json(['data' => $monitor->load(['pessoa', 'route'])], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => TransportMonitor::with(['pessoa', 'route'])->findOrFail($id)]);
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
