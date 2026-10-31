<?php

declare(strict_types=1);

namespace Modules\Transport\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Pessoas\Models\Pessoa;

final class TransportDriver extends Model
{
    use TenantAware;

    protected $table = 'transport_drivers';

    protected $guarded = ['id', 'tenant_id'];

    protected $casts = [
        'cnh_due_date' => 'date',
        'toxicological_due_date' => 'date',
        'school_transport_course_due_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function pessoa(): BelongsTo
    {
        return $this->belongsTo(Pessoa::class, 'pessoa_id');
    }

    public function routes(): HasMany
    {
        return $this->hasMany(TransportRoute::class, 'assigned_driver_id');
    }

    public function isCompliant(): bool
    {
        return $this->is_active
            && in_array($this->cnh_category, ['D', 'E'], true)
            && !$this->cnh_due_date->isPast()
            && !$this->toxicological_due_date->isPast()
            && !$this->school_transport_course_due_date->isPast();
    }
}
