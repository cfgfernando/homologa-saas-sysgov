<?php

declare(strict_types=1);

namespace Modules\Transport\Services;

use Modules\Transport\Models\TransportRoute;
use Modules\Transport\Models\TransportVehicle;

final class VehicleFleetService
{
    /**
     * Valida se o veículo está apto a operar segundo o CTB Art. 136.
     *
     * @return array{compliant: bool, violations: list<string>}
     */
    public function validateVehicle(TransportVehicle $vehicle): array
    {
        $violations = [];

        if ($vehicle->status !== 'active') {
            $violations[] = "Veículo não está ativo (Status: {$vehicle->status}).";
        }

        if ($vehicle->isDetranInspectionExpired()) {
            $violations[] = 'Vistoria semestral do DETRAN vencida em ' . $vehicle->detran_inspection_due_date->format('d/m/Y');
        }

        if ($vehicle->crlv_due_date->isPast()) {
            $violations[] = 'Licenciamento anual (CRLV) vencido em ' . $vehicle->crlv_due_date->format('d/m/Y');
        }

        return [
            'compliant' => empty($violations),
            'violations' => $violations,
        ];
    }

    /**
     * Valida se a rota ainda tem capacidade para receber mais um aluno.
     */
    public function canAllocateStudentToRoute(TransportRoute $route, bool $studentRequiresAccessibility = false): bool
    {
        $vehicle = $route->assignedVehicle;
        if (!$vehicle) {
            return false;
        }

        if ($studentRequiresAccessibility && !$vehicle->accessibility_adapted) {
            return false;
        }

        $currentAllocations = $route->activeAllocationsCount();
        return $currentAllocations < $vehicle->capacity_seats;
    }
}

