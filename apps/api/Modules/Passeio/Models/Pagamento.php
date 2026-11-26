<?php

declare(strict_types=1);

namespace Modules\Passeio\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Escola\Models\Concerns\EscolaAware;

/**
 * Pagamento de uma inscrição. Nunca é apagado: o estorno marca data, usuário e motivo (D2).
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $escola_id
 * @property int $inscricao_id
 * @property int $valor_centavos
 * @property \Illuminate\Support\Carbon $data_pagamento
 * @property string $forma_pagamento
 * @property string|null $observacao
 * @property int|null $registrado_por
 * @property \Illuminate\Support\Carbon|null $estornado_em
 * @property int|null $estornado_por
 * @property string|null $motivo_estorno
 * @property-read Inscricao|null $inscricao
 */
final class Pagamento extends Model
{
    use TenantAware;
    use EscolaAware;

    protected $table = 'passeio_pagamentos';

    /** @var list<string> */
    protected $fillable = [
        'tenant_id', 'inscricao_id', 'valor_centavos', 'data_pagamento', 'forma_pagamento', 'observacao',
        'registrado_por', 'estornado_em', 'estornado_por', 'motivo_estorno',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'tenant_id' => 'integer', 'escola_id' => 'integer', 'inscricao_id' => 'integer', 'valor_centavos' => 'integer',
        'data_pagamento' => 'date:Y-m-d', 'registrado_por' => 'integer', 'estornado_em' => 'datetime', 'estornado_por' => 'integer',
    ];

    /** @return BelongsTo<Inscricao, $this> */
    public function inscricao(): BelongsTo
    {
        return $this->belongsTo(Inscricao::class, 'inscricao_id');
    }

    /** @param Builder<Pagamento> $query */
    public function scopeValidos(Builder $query): void
    {
        $query->whereNull('estornado_em');
    }
}
