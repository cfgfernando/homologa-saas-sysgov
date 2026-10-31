<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Transport\Http\Requests\RouteRequest;
use Modules\Transport\Models\TransportRoute;
use Modules\Transport\Services\VehicleFleetService;

final class RouteController extends Controller
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly TenantContext $tenantContext,
        private readonly VehicleFleetService $fleetService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = TransportRoute::query()->with(['vehicle', 'driver']);

        if ($request->filled('shift')) {
            $query->where('shift', $request->input('shift'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('route_type')) {
            $query->where('route_type', $request->input('route_type'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', $search)
                    ->orWhere('name', 'like', $search)
                    ->orWhere('start_location_name', 'like', $search)
                    ->orWhere('end_location_name', 'like', $search);
            });
        }

        $routes = $query->withCount('allocations')->orderBy('code')->paginate((int) $request->input('per_page', 25));

        return response()->json($routes);
    }

    public function store(RouteRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['tenant_id'] = $this->tenantContext->id();

        $route = TransportRoute::create($data);

        $this->audit->record(
            'transporte',
            'create',
            'route:' . $route->id,
            null,
            $route->toArray()
        );

        return response()->json([
            'data' => $route->load(['vehicle', 'driver']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $route = TransportRoute::with(['vehicle', 'driver', 'stops', 'allocations'])->findOrFail($id);

        $capacityStatus = null;
        if ($route->vehicle) {
            $capacityStatus = $this->fleetService->validateCapacity($route->vehicle, $route->allocations->count());
        }

        return response()->json([
            'data' => $route,
            'capacity_status' => $capacityStatus,
        ]);
    }

    public function update(RouteRequest $request, string $id): JsonResponse
    {
        $route = TransportRoute::findOrFail($id);
        $before = $route->toArray();

        $route->update($request->validated());

        $this->audit->record(
            'transporte',
            'update',
            'route:' . $route->id,
            $before,
            $route->fresh()->toArray()
        );

        return response()->json([
            'data' => $route->load(['vehicle', 'driver']),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $route = TransportRoute::findOrFail($id);
        $before = $route->toArray();

        $route->delete();

        $this->audit->record(
            'transporte',
            'delete',
            'route:' . $route->id,
            $before,
            null
        );

        return response()->json(['message' => 'Rota excluída com sucesso.'], 200);
    }
}
