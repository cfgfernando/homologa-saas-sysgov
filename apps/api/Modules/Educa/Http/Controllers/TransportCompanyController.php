<?php

declare(strict_types=1);

namespace Modules\Educa\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Educa\Models\EducaTransportCompany;
use Modules\Educa\Services\TransportCompanyService;

final class TransportCompanyController extends Controller
{
    public function __construct(
        private readonly TransportCompanyService $companyService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', EducaTransportCompany::class);

        $companies = $this->companyService->listar([
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : null,
            'busca' => $request->query('busca'),
        ]);

        return response()->json([
            'data' => $companies,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('manage', EducaTransportCompany::class);

        $dados = $request->validate([
            'razao_social' => ['required', 'string', 'max:255'],
            'nome_fantasia' => ['nullable', 'string', 'max:255'],
            'cnpj' => ['nullable', 'string', 'max:20'],
            'contract_number' => ['nullable', 'string', 'max:100'],
            'contract_start_date' => ['nullable', 'date'],
            'contract_end_date' => ['nullable', 'date'],
            'legal_person_id' => ['nullable', 'integer'],
            'responsible_person_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $company = $this->companyService->criar($dados);

        return response()->json([
            'message' => 'Empresa de transporte cadastrada com sucesso.',
            'data' => $company,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $this->authorize('viewAny', EducaTransportCompany::class);

        $company = $this->companyService->obter($id);

        return response()->json([
            'data' => $company,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $this->authorize('manage', EducaTransportCompany::class);

        $dados = $request->validate([
            'razao_social' => ['nullable', 'string', 'max:255'],
            'nome_fantasia' => ['nullable', 'string', 'max:255'],
            'cnpj' => ['nullable', 'string', 'max:20'],
            'contract_number' => ['nullable', 'string', 'max:100'],
            'contract_start_date' => ['nullable', 'date'],
            'contract_end_date' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $company = $this->companyService->atualizar($id, $dados);

        return response()->json([
            'message' => 'Empresa de transporte atualizada com sucesso.',
            'data' => $company,
        ]);
    }
}
