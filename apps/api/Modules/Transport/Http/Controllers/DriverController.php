<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Pessoas\Models\Pessoa;
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

        if ($request->filled('cnh_category')) {
            $query->where('cnh_category', $request->input('cnh_category'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('cnh_number', 'like', $search)
                    ->orWhereHas('pessoa', function ($sq) use ($search) {
                        $sq->where('nome', 'like', $search)
                           ->orWhere('documento', 'like', $search);
                    });
            });
        }

        $drivers = $query->paginate((int) $request->input('per_page', 25));

        return response()->json($drivers);
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
            $nome = (string) ($request->input('name') ?? $request->input('nome') ?? 'Motorista');

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

        $cnhCategory = strtoupper((string) $request->input('cnh_category', 'D'));
        if (!in_array($cnhCategory, ['D', 'E'], true)) {
            $cnhCategory = 'D';
        }

        $cnhDueDate = $request->input('cnh_due_date') ?? $request->input('cnh_expiration_date') ?? now()->addYears(2)->toDateString();
        $toxicologicalDueDate = $request->input('toxicological_due_date') ?? now()->addYears(1)->toDateString();
        $courseDueDate = $request->input('school_transport_course_due_date') ?? $request->input('course_expiration_date') ?? now()->addYears(3)->toDateString();

        $driver = TransportDriver::create([
            'tenant_id' => $tenantId,
            'pessoa_id' => $pessoaId,
            'cnh_number' => (string) $request->input('cnh_number', '00000000000'),
            'cnh_category' => $cnhCategory,
            'cnh_due_date' => $cnhDueDate,
            'toxicological_due_date' => $toxicologicalDueDate,
            'school_transport_course_due_date' => $courseDueDate,
            'is_active' => filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ]);

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
        $driver = TransportDriver::with('pessoa')->findOrFail($id);
        $before = $driver->toArray();

        // Update Pessoa name/cpf if provided
        if ($driver->pessoa) {
            $updates = [];
            if ($request->filled('name') || $request->filled('nome')) {
                $updates['nome'] = (string) ($request->input('name') ?? $request->input('nome'));
            }
            if ($request->filled('cpf')) {
                $updates['documento'] = preg_replace('/\D/', '', (string) $request->input('cpf'));
            }
            if (!empty($updates)) {
                $driver->pessoa->update($updates);
            }
        }

        $fields = [];
        if ($request->has('cnh_number')) {
            $fields['cnh_number'] = (string) $request->input('cnh_number');
        }
        if ($request->has('cnh_category')) {
            $cat = strtoupper((string) $request->input('cnh_category'));
            $fields['cnh_category'] = in_array($cat, ['D', 'E'], true) ? $cat : 'D';
        }
        if ($request->has('cnh_due_date') || $request->has('cnh_expiration_date')) {
            $fields['cnh_due_date'] = $request->input('cnh_due_date') ?? $request->input('cnh_expiration_date');
        }
        if ($request->has('toxicological_due_date')) {
            $fields['toxicological_due_date'] = $request->input('toxicological_due_date');
        }
        if ($request->has('school_transport_course_due_date') || $request->has('course_expiration_date')) {
            $fields['school_transport_course_due_date'] = $request->input('school_transport_course_due_date') ?? $request->input('course_expiration_date');
        }
        if ($request->has('is_active')) {
            $fields['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }

        $driver->update($fields);

        $this->audit->record(
            'transporte',
            'update',
            'driver:' . $driver->id,
            $before,
            $driver->fresh()->toArray()
        );

        $compliance = $this->complianceService->validateDriver($driver->fresh());

        return response()->json([
            'data' => $driver->fresh()->load('pessoa'),
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
