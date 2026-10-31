<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Transport\Http\Requests\AllocationRequest;
use Modules\Transport\Models\TransportRoute;
use Modules\Transport\Models\TransportStudentAllocation;
use Modules\Transport\Services\PnateEligibilityService;
use Modules\Transport\Services\VehicleFleetService;

final class AllocationController extends Controller
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly TenantContext $tenantContext,
        private readonly PnateEligibilityService $pnateService,
        private readonly VehicleFleetService $fleetService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = TransportStudentAllocation::query()->with(['route', 'stop']);

        if ($request->filled('route_id')) {
            $query->where('route_id', $request->input('route_id'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }

        if ($request->filled('school_year')) {
            $query->where('school_year', (int) $request->input('school_year'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $allocations = $query->paginate((int) $request->input('per_page', 25));

        return response()->json($allocations);
    }

    public function store(AllocationRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['tenant_id'] = $this->tenantContext->id();

        $route = TransportRoute::with('vehicle')->findOrFail($data['route_id']);

        // Check vehicle capacity limit if assigned
        if ($route->vehicle) {
            $currentAllocationsCount = TransportStudentAllocation::where('route_id', $route->id)
                ->where('status', 'active')
                ->count();

            $capacityCheck = $this->fleetService->validateCapacity($route->vehicle, $currentAllocationsCount + 1);
            if ($capacityCheck['is_overcapacity']) {
                return response()->json([
                    'message' => 'Lotação máxima excedida para este veículo (' . $capacityCheck['capacity'] . ' passageiros sentados).',
                    'capacity_status' => $capacityCheck,
                ], 422);
            }
        }

        // Calculate PNATE eligibility if distance is informed
        if (isset($data['distance_home_school_km'])) {
            $distance = (float) $data['distance_home_school_km'];
            $isRural = ($route->route_type === 'rural' || $route->route_type === 'mixed');
            $data['is_pnate_eligible'] = $this->pnateService->isEligible($distance, $isRural);
        }

        $allocation = TransportStudentAllocation::create($data);

        $this->audit->record(
            'transporte',
            'create',
            'allocation:' . $allocation->id,
            null,
            $allocation->toArray()
        );

        return response()->json([
            'data' => $allocation->load(['route', 'stop']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $allocation = TransportStudentAllocation::with(['route', 'stop'])->findOrFail($id);

        return response()->json([
            'data' => $allocation,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $allocation = TransportStudentAllocation::findOrFail($id);
        $before = $allocation->toArray();

        $allocation->delete();

        $this->audit->record(
            'transporte',
            'delete',
            'allocation:' . $allocation->id,
            $before,
            null
        );

        return response()->json(['message' => 'Alocação removida com sucesso.'], 200);
    }
}
