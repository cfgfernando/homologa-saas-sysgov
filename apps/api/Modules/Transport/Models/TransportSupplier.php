<?php

declare(strict_types=1);

namespace Modules\Transport\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Model;

final class TransportSupplier extends Model
{
    use TenantAware;

    protected $table = 'transport_suppliers';

    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}

