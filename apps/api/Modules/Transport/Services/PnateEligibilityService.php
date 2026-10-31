<?php

declare(strict_types=1);

namespace Modules\Transport\Services;

use Modules\Transport\Models\TransportStop;

final class PnateEligibilityService
{
    /**
     * Raio médio da Terra em metros.
     */
    private const EARTH_RADIUS_METERS = 6371000;

    /**
     * Calcula a distância geodésica em metros entre duas coordenadas (fórmula de Haversine).
     */
    public function calculateDistanceMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return self::EARTH_RADIUS_METERS * $c;
    }

    /**
     * Determina se o aluno é elegível ao repasse federal do PNATE (Lei 10.880/2004).
     */
    public function isEligibleForPnate(
        TransportStop $pickupStop,
        float $schoolLat,
        float $schoolLon,
        float $minDistanceMeters = 2000.0
    ): bool {
        // Aluno precisa residir em área rural
        if ($pickupStop->zone_type !== 'rural') {
            return false;
        }

        $distance = $this->calculateDistanceMeters(
            $pickupStop->latitude,
            $pickupStop->longitude,
            $schoolLat,
            $schoolLon
        );

        return $distance >= $minDistanceMeters;
    }
}

