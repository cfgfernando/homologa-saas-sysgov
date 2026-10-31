<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Transport\Models\TransportMaintenanceOrder;

final class MaintenanceController extends Controller
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly TenantContext $tenantContext,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = TransportMaintenanceOrder::query()->with('vehicle');

        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', $request->input('vehicle_id'));
        }

        if ($request->filled('service_type')) {
            $query->where('service_type', $request->input('service_type'));
        }

        return response()->json($query->orderByDesc('service_date')->paginate((int) $request->input('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'vehicle_id' => ['required', 'exists:transport_vehicles,id'],
            'service_type' => ['required', 'string', 'in:preventive,corrective,tires,oil_change,inspection'],
            'amount_cents' => ['required', 'integer', 'min:0'],
            'odometer_km' => ['required', 'integer', 'min:0'],
            'service_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['tenant_id'] = $this->tenantContext->id();
        $order = TransportMaintenanceOrder::create($data);

        $this->audit->record('transporte', 'create', 'maintenance_order:' . $order->id, null, $order->toArray());

        return response()->json(['data' => $order->load('vehicle')], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => TransportMaintenanceOrder::with('vehicle')->findOrFail($id)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $order = TransportMaintenanceOrder::findOrFail($id);
        $before = $order->toArray();
        $order->delete();
        $this->audit->record('transporte', 'delete', 'maintenance_order:' . $order->id, $before, null);

        return response()->json(['message' => 'Ordem de serviço removida com sucesso.']);
    }
}
