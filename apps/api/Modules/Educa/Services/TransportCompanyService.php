<?php

declare(strict_types=1);

namespace Modules\Educa\Services;

use App\Support\AuditLogger;
use Illuminate\Database\Eloquent\Collection;
use Modules\Educa\Models\EducaTransportCompany;

final class TransportCompanyService
{
    public function __construct(
        private readonly AuditLogger $auditLogger
    ) {}

    public function listar(array $filtros = []): Collection
    {
        $query = EducaTransportCompany::query()
            ->with(['legalPerson', 'responsiblePerson', 'vehicles', 'routes']);

        if (isset($filtros['is_active']) && $filtros['is_active'] !== null) {
            $query->where('is_active', (bool) $filtros['is_active']);
        }

        if (! empty($filtros['busca'])) {
            $busca = (string) $filtros['busca'];
            $query->where(function ($q) use ($busca): void {
                $q->where('razao_social', 'like', "%{$busca}%")
                    ->orWhere('nome_fantasia', 'like', "%{$busca}%")
                    ->orWhere('cnpj', 'like', "%{$busca}%")
                    ->orWhere('contract_number', 'like', "%{$busca}%");
            });
        }

        return $query->orderBy('razao_social')->get();
    }

    public function criar(array $dados): EducaTransportCompany
    {
        $company = EducaTransportCompany::create($dados);

        $this->auditLogger->record(
            module: 'educa',
            action: 'create',
            resource: "empresa:{$company->id}",
            after: $company->toArray()
        );

        return $company;
    }

    public function atualizar(string $id, array $dados): EducaTransportCompany
    {
        $company = EducaTransportCompany::findOrFail($id);
        $before = $company->toArray();
        $company->update($dados);

        $this->auditLogger->record(
            module: 'educa',
            action: 'update',
            resource: "empresa:{$company->id}",
            before: $before,
            after: $company->toArray()
        );

        return $company;
    }

    public function obter(string $id): EducaTransportCompany
    {
        return EducaTransportCompany::with(['legalPerson', 'responsiblePerson', 'vehicles', 'routes', 'drivers'])
            ->findOrFail($id);
    }
}
