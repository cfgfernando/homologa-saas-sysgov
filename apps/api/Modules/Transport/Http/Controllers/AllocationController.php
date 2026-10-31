<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Pessoas\Models\Pessoa;
use Modules\Transport\Http\Requests\AllocationRequest;
use Modules\Transport\Models\TransportRoute;
use Modules\Transport\Models\TransportStop;
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
        $query = TransportStudentAllocation::query()->with(['route', 'stop', 'pickupStop', 'pessoa']);

        if ($request->filled('route_id')) {
            $query->where('route_id', $request->input('route_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->whereHas('pessoa', function ($sq) use ($search) {
                $sq->where('nome', 'like', $search)
                   ->orWhere('documento', 'like', $search);
            });
        }

        $allocations = $query->paginate((int) $request->input('per_page', 50));

        return response()->json($allocations);
    }

    public function store(AllocationRequest $request): JsonResponse
    {
        $tenantId = $this->tenantContext->id();
        $validated = $request->validated();

        // 1. Resolve Pessoa (student)
        $pessoaId = $validated['pessoa_id'] ?? $validated['student_id'] ?? null;
        if (empty($pessoaId)) {
            $cpf = preg_replace('/\D/', '', (string) ($validated['cpf'] ?? ''));
            if (empty($cpf)) {
                $cpf = str_pad((string) mt_rand(100000000, 999999999), 11, '0', STR_PAD_LEFT);
            }
            $nome = (string) ($validated['student_name'] ?? 'Aluno ' . mt_rand(100, 999));

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

        // 2. Resolve Route & Capacity
        $route = TransportRoute::with('vehicle')->findOrFail($validated['route_id']);
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

        // 3. Resolve Pickup Stop
        $pickupStopId = $validated['pickup_stop_id'] ?? $validated['stop_id'] ?? null;
        if (empty($pickupStopId)) {
            $defaultStop = TransportStop::where('tenant_id', $tenantId)->first();
            if (!$defaultStop) {
                $defaultStop = TransportStop::create([
                    'tenant_id' => $tenantId,
                    'code' => 'PNT-001',
                    'name' => 'Ponto Principal',
                    'latitude' => -15.7900,
                    'longitude' => -47.8800,
                    'zone_type' => 'rural',
                    'is_active' => true,
                ]);
            }
            $pickupStopId = $defaultStop->id;
        }

        // 4. Distance and PNATE eligibility
        $distance = (float) ($validated['distance_km'] ?? $validated['distance_home_school_km'] ?? 3.0);
        $isRural = ($route->route_type === 'rural' || $route->route_type === 'mixed');
        $eligiblePnate = $validated['census_eligible_pnate'] ?? $validated['is_pnate_eligible'] ?? $this->pnateService->isEligible($distance, $isRural);

        $shift = $validated['shift'] ?? 'morning';
        $hasSpecialNeeds = filter_var($validated['has_special_needs'] ?? $validated['special_needs'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $allocation = TransportStudentAllocation::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'pessoa_id' => $pessoaId,
                'route_id' => $route->id,
            ],
            [
                'school_id' => $validated['school_id'] ?? null,
                'pickup_stop_id' => $pickupStopId,
                'distance_km' => $distance,
                'shift' => $shift,
                'has_special_needs' => $hasSpecialNeeds,
                'census_eligible_pnate' => $eligiblePnate,
                'status' => $validated['status'] ?? 'active',
            ]
        );

        $this->audit->record(
            'transporte',
            'create',
            'allocation:' . $allocation->id,
            null,
            $allocation->toArray()
        );

        return response()->json([
            'data' => $allocation->load(['route', 'stop', 'pessoa']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $allocation = TransportStudentAllocation::with(['route', 'stop', 'pessoa'])->findOrFail($id);

        return response()->json([
            'data' => $allocation,
        ]);
    }

    public function update(AllocationRequest $request, string $id): JsonResponse
    {
        $allocation = TransportStudentAllocation::with(['route', 'stop', 'pessoa'])->findOrFail($id);
        $before = $allocation->toArray();
        $validated = $request->validated();

        if ($allocation->pessoa && !empty($validated['student_name'])) {
            $allocation->pessoa->update(['nome' => $validated['student_name']]);
        }

        $fields = [];
        if (isset($validated['route_id'])) {
            $fields['route_id'] = $validated['route_id'];
        }
        if (isset($validated['pickup_stop_id']) || isset($validated['stop_id'])) {
            $fields['pickup_stop_id'] = $validated['pickup_stop_id'] ?? $validated['stop_id'];
        }
        if (isset($validated['shift'])) {
            $fields['shift'] = $validated['shift'];
        }
        if (isset($validated['distance_km']) || isset($validated['distance_home_school_km'])) {
            $fields['distance_km'] = (float) ($validated['distance_km'] ?? $validated['distance_home_school_km']);
        }
        if (isset($validated['has_special_needs']) || isset($validated['special_needs'])) {
            $fields['has_special_needs'] = filter_var($validated['has_special_needs'] ?? $validated['special_needs'], FILTER_VALIDATE_BOOLEAN);
        }
        if (isset($validated['census_eligible_pnate']) || isset($validated['is_pnate_eligible'])) {
            $fields['census_eligible_pnate'] = filter_var($validated['census_eligible_pnate'] ?? $validated['is_pnate_eligible'], FILTER_VALIDATE_BOOLEAN);
        }
        if (isset($validated['status'])) {
            $fields['status'] = $validated['status'];
        }

        $allocation->update($fields);

        $this->audit->record(
            'transporte',
            'update',
            'allocation:' . $allocation->id,
            $before,
            $allocation->fresh()->toArray()
        );

        return response()->json([
            'data' => $allocation->fresh()->load(['route', 'stop', 'pessoa']),
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
