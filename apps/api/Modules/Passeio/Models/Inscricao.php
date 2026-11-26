<?php

declare(strict_types=1);

namespace Modules\Passeio\Models;

use App\Models\Concerns\TenantAware;
use Modules\Escola\Models\Concerns\EscolaAware;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Passeio\Enums\SituacaoFinanceira;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Escola\Models\Aluno;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $escola_id
 * @property int $passeio_id
 * @property int $aluno_id
 * @property bool $vai
 * @property bool $autorizacao_entregue
 * @property string|null $observacao
 * @property-read Passeio|null $passeio
 * @property-read Aluno|null $aluno
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Pagamento> $pagamentos
 */
final class Inscricao extends Model
{
    use SoftDeletes;
    use TenantAware;
    use EscolaAware;

    protected $table = 'passeio_inscricoes';

    /** @var list<string> */
    protected $appends = ['pago_centavos', 'saldo_centavos', 'situacao_financeira', 'pago'];

    /** @var list<string> */
    protected $hidden = ['pagamentos'];

    /** @var list<string> */
    protected $fillable = ['tenant_id', 'passeio_id', 'aluno_id', 'vai', 'autorizacao_entregue', 'observacao'];

    /** @var array<string, string> */
    protected $casts = [
        'tenant_id' => 'integer', 'passeio_id' => 'integer', 'aluno_id' => 'integer',
        'vai' => 'boolean', 'autorizacao_entregue' => 'boolean',
    ];

    /** @return BelongsTo<Passeio, $this> */
    public function passeio(): BelongsTo
    {
        return $this->belongsTo(Passeio::class, 'passeio_id');
    }

    /** @return BelongsTo<Aluno, $this> */
    public function aluno(): BelongsTo
    {
        return $this->belongsTo(Aluno::class, 'aluno_id')->withTrashed();
    }

    /** @return HasMany<Pagamento, $this> */
    public function pagamentos(): HasMany
    {
        return $this->hasMany(Pagamento::class, 'inscricao_id');
    }

    /** Valor devido: o do passeio para quem vai; zero para quem não vai. */
    public function devidoCentavos(): int
    {
        return $this->vai ? (int) ($this->passeio->valor_centavos ?? 0) : 0;
    }

    public function getPagoCentavosAttribute(): int
    {
        return (int) $this->pagamentos->whereNull('estornado_em')->sum('valor_centavos');
    }

    public function getSaldoCentavosAttribute(): int
    {
        return max(0, $this->devidoCentavos() - $this->pago_centavos);
    }

    public function getSituacaoFinanceiraAttribute(): string
    {
        return SituacaoFinanceira::de($this->devidoCentavos(), $this->pago_centavos)->value;
    }

    /** @deprecated campo derivado mantido por compatibilidade: use situacao_financeira. */
    public function getPagoAttribute(): bool
    {
        return $this->situacao_financeira === SituacaoFinanceira::Quitado->value;
    }
}
