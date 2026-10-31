<?php

declare(strict_types=1);

namespace Modules\Transport\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Model;

final class TransportCostParameter extends Model
{
    use TenantAware;

    protected $table = 'transport_cost_parameters';

    protected $guarded = ['id'];

    protected $casts = [
        'fuel_price_cents' => 'integer',
        'avg_consumption_km_per_liter' => 'float',
        'maintenance_cost_per_km_cents' => 'integer',
        'tire_cost_per_km_cents' => 'integer',
        'driver_salary_cents' => 'integer',
    ];
}
