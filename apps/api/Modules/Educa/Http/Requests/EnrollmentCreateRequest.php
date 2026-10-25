<?php

declare(strict_types=1);

namespace Modules\Educa\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class EnrollmentCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'aluno_pessoa_id' => ['required', 'integer'],
            'school_id' => ['required_without:turma_id', 'nullable', 'uuid'],
            'course_id' => ['required_without:turma_id', 'nullable', 'uuid'],
            'grade_id' => ['required_without:turma_id', 'nullable', 'uuid'],
            'academic_year_id' => ['nullable'],
            'ano' => ['nullable'],
            'turma_id' => ['nullable', 'uuid'],
            'data_matricula' => ['nullable', 'date_format:Y-m-d'],
            'tipo_matricula' => ['nullable', 'string', 'in:inicial,renovacao,transferencia_entrada'],
        ];
    }
}
