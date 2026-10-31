<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Transport\Http\Requests\VehicleRequest;
use Modules\Transport\Models\TransportVehicle;
use Modules\Transport\Services\VehicleFleetService;

final class VehicleController extends Controller
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly TenantContext $tenantContext,
        private readonly VehicleFleetService $fleetService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = TransportVehicle::query();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('vehicle_type')) {
            $query->where('vehicle_type', $request->input('vehicle_type'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('plate', 'like', $search)
                    ->orWhere('brand', 'like', $search)
                    ->orWhere('model', 'like', $search)
                    ->orWhere('renavam', 'like', $search);
            });
        }

        $vehicles = $query->orderBy('plate')->paginate((int) $request->input('per_page', 25));

        return response()->json($vehicles);
    }

    public function store(VehicleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['tenant_id'] = $this->tenantContext->id();

        $vehicle = TransportVehicle::create($data);

        $this->audit->record(
            'transporte',
            'create',
            'vehicle:' . $vehicle->id,
            null,
            $vehicle->toArray()
        );

        $compliance = $this->fleetService->validateInspection($vehicle);

        return response()->json([
            'data' => $vehicle,
            'compliance' => $compliance,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $vehicle = TransportVehicle::findOrFail($id);
        $compliance = $this->fleetService->validateInspection($vehicle);

        return response()->json([
            'data' => $vehicle,
            'compliance' => $compliance,
        ]);
    }

    public function update(VehicleRequest $request, string $id): JsonResponse
    {
        $vehicle = TransportVehicle::findOrFail($id);
        $before = $vehicle->toArray();

        $vehicle->update($request->validated());

        $this->audit->record(
            'transporte',
            'update',
            'vehicle:' . $vehicle->id,
            $before,
            $vehicle->fresh()->toArray()
        );

        $compliance = $this->fleetService->validateInspection($vehicle);

        return response()->json([
            'data' => $vehicle,
            'compliance' => $compliance,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $vehicle = TransportVehicle::findOrFail($id);
        $before = $vehicle->toArray();

        $vehicle->delete();

        $this->audit->record(
            'transporte',
            'delete',
            'vehicle:' . $vehicle->id,
            $before,
            null
        );

        return response()->json(['message' => 'Veículo excluído com sucesso.'], 200);
    }
}

