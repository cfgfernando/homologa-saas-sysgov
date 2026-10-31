<?php

declare(strict_types=1);

namespace Modules\Transport\Services;

use Modules\Transport\Models\TransportDriver;

final class DriverComplianceService
{
    /**
     * Valida se o condutor está plenamente apto segundo o CTB Art. 138.
     *
     * @return array{compliant: bool, violations: list<string>}
     */
    public function validateDriver(TransportDriver $driver): array
    {
        $violations = [];

        if (!$driver->is_active) {
            $violations[] = 'Condutor inativo no sistema.';
        }

        if (!in_array($driver->cnh_category, ['D', 'E'], true)) {
            $violations[] = 'Exigida CNH de categoria D ou E (CTB Art. 138, II). Categoria atual: ' . $driver->cnh_category;
        }

        if ($driver->cnh_due_date->isPast()) {
            $violations[] = 'CNH vencida em ' . $driver->cnh_due_date->format('d/m/Y');
        }

        if ($driver->toxicological_due_date->isPast()) {
            $violations[] = 'Exame toxicológico periódico vencido em ' . $driver->toxicological_due_date->format('d/m/Y');
        }

        if ($driver->school_transport_course_due_date->isPast()) {
            $violations[] = 'Curso especializado de condutor de escolares vencido em ' . $driver->school_transport_course_due_date->format('d/m/Y');
        }

        return [
            'compliant' => empty($violations),
            'violations' => $violations,
        ];
    }
}

