<?php

declare(strict_types=1);

namespace Modules\Passeio\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Passeio\Enums\FormaPagamento;
use Modules\Passeio\Models\Pagamento;

final class RegistrarPagamentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', [Pagamento::class, $this->route('inscricao')]) === true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'valor_centavos' => ['required', 'integer', 'min:1'],
            'data_pagamento' => ['required', 'date', 'before_or_equal:today'],
            'forma_pagamento' => ['required', Rule::enum(FormaPagamento::class)],
            'observacao' => ['nullable', 'string', 'max:500'],
        ];
    }
}
