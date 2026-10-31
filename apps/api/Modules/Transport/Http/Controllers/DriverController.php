<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Transport\Models\TransportDriver;
use Modules\Transport\Services\DriverComplianceService;

final class DriverController extends Controller
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly TenantContext $tenantContext,
        private readonly DriverComplianceService $complianceService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = TransportDriver::query()->with('pessoa');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('cnh_category')) {
            $query->where('cnh_category', $request->input('cnh_category'));
        }

        $drivers = $query->paginate((int) $request->input('per_page', 25));

        return response()->json($drivers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pessoa_id' => ['required'],
            'cnh_number' => ['required', 'string', 'max:20'],
            'cnh_category' => ['required', 'string', 'in:A,B,C,D,E,AB,AC,AD,AE'],
            'cnh_expiration_date' => ['required', 'date'],
            'has_school_transport_course' => ['required', 'boolean'],
            'course_expiration_date' => ['nullable', 'date'],
            'has_criminal_record_certificate' => ['required', 'boolean'],
            'criminal_record_issued_at' => ['nullable', 'date'],
            'has_no_serious_infractions_last_year' => ['required', 'boolean'],
            'status' => ['nullable', 'string', 'in:active,suspended,inactive'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['tenant_id'] = $this->tenantContext->id();

        $driver = TransportDriver::create($data);

        $this->audit->record(
            'transporte',
            'create',
            'driver:' . $driver->id,
            null,
            $driver->toArray()
        );

        $compliance = $this->complianceService->validateDriver($driver);

        return response()->json([
            'data' => $driver->load('pessoa'),
            'compliance' => $compliance,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $driver = TransportDriver::with('pessoa')->findOrFail($id);
        $compliance = $this->complianceService->validateDriver($driver);

        return response()->json([
            'data' => $driver,
            'compliance' => $compliance,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $driver = TransportDriver::findOrFail($id);
        $before = $driver->toArray();

        $data = $request->validate([
            'cnh_number' => ['sometimes', 'required', 'string', 'max:20'],
            'cnh_category' => ['sometimes', 'required', 'string', 'in:A,B,C,D,E,AB,AC,AD,AE'],
            'cnh_expiration_date' => ['sometimes', 'required', 'date'],
            'has_school_transport_course' => ['sometimes', 'required', 'boolean'],
            'course_expiration_date' => ['nullable', 'date'],
            'has_criminal_record_certificate' => ['sometimes', 'required', 'boolean'],
            'criminal_record_issued_at' => ['nullable', 'date'],
            'has_no_serious_infractions_last_year' => ['sometimes', 'required', 'boolean'],
            'status' => ['nullable', 'string', 'in:active,suspended,inactive'],
            'notes' => ['nullable', 'string'],
        ]);

        $driver->update($data);

        $this->audit->record(
            'transporte',
            'update',
            'driver:' . $driver->id,
            $before,
            $driver->fresh()->toArray()
        );

        $compliance = $this->complianceService->validateDriver($driver);

        return response()->json([
            'data' => $driver->load('pessoa'),
            'compliance' => $compliance,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $driver = TransportDriver::findOrFail($id);
        $before = $driver->toArray();

        $driver->delete();

        $this->audit->record(
            'transporte',
            'delete',
            'driver:' . $driver->id,
            $before,
            null
        );

        return response()->json(['message' => 'Condutor excluído com sucesso.'], 200);
    }
}
