<?php

declare(strict_types=1);

namespace Modules\Passeio\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class EstornarPagamentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('estornar', $this->route('pagamento')) === true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['motivo' => ['required', 'string', 'min:3', 'max:500']];
    }
}
