<?php

declare(strict_types=1);

namespace Modules\Transport\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Model;

final class TransportGarage extends Model
{
    use TenantAware;

    protected $table = 'transport_garages';

    protected $guarded = ['id'];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'capacity_vehicles' => 'integer',
        'is_active' => 'boolean',
    ];
}
