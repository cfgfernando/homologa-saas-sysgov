<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Transport\Models\TransportSupplier;

final class SupplierController extends Controller
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly TenantContext $tenantContext,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = TransportSupplier::query();

        if ($request->filled('service_type')) {
            $query->where('service_type', $request->input('service_type'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('corporate_name', 'like', $search)
                    ->orWhere('cnpj', 'like', $search)
                    ->orWhere('trade_name', 'like', $search);
            });
        }

        return response()->json($query->paginate((int) $request->input('per_page', 25)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cnpj' => ['required', 'string', 'max:20'],
            'corporate_name' => ['required', 'string', 'max:200'],
            'trade_name' => ['nullable', 'string', 'max:150'],
            'service_type' => ['required', 'string', 'in:transport_service,workshop,fuel_station,parts,other'],
            'contract_number' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $data['tenant_id'] = $this->tenantContext->id();
        $supplier = TransportSupplier::create($data);

        $this->audit->record('transporte', 'create', 'supplier:' . $supplier->id, null, $supplier->toArray());

        return response()->json(['data' => $supplier], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => TransportSupplier::findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $supplier = TransportSupplier::findOrFail($id);
        $before = $supplier->toArray();

        $data = $request->validate([
            'cnpj' => ['sometimes', 'required', 'string', 'max:20'],
            'corporate_name' => ['sometimes', 'required', 'string', 'max:200'],
            'trade_name' => ['nullable', 'string', 'max:150'],
            'service_type' => ['sometimes', 'required', 'string', 'in:transport_service,workshop,fuel_station,parts,other'],
            'contract_number' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $supplier->update($data);

        $this->audit->record('transporte', 'update', 'supplier:' . $supplier->id, $before, $supplier->fresh()->toArray());

        return response()->json(['data' => $supplier->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        $supplier = TransportSupplier::findOrFail($id);
        $before = $supplier->toArray();
        $supplier->delete();
        $this->audit->record('transporte', 'delete', 'supplier:' . $supplier->id, $before, null);

        return response()->json(['message' => 'Fornecedor removido com sucesso.']);
    }
}
