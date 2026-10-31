<?php

declare(strict_types=1);

namespace Modules\Transport\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Pessoas\Models\Pessoa;

final class TransportMonitor extends Model
{
    use TenantAware;

    protected $table = 'transport_monitors';

    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function pessoa(): BelongsTo
    {
        return $this->belongsTo(Pessoa::class, 'pessoa_id');
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(TransportRoute::class, 'assigned_route_id');
    }
}
