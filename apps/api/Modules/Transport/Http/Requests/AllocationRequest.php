<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class AllocationRequest extends FormRequest
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
            'route_id' => ['required', 'exists:transport_routes,id'],
            'student_id' => ['nullable'],
            'pessoa_id' => ['nullable'],
            'student_name' => ['nullable', 'string', 'max:255'],
            'cpf' => ['nullable', 'string', 'max:20'],
            'stop_id' => ['nullable', 'exists:transport_stops,id'],
            'pickup_stop_id' => ['nullable', 'exists:transport_stops,id'],
            'school_id' => ['nullable', 'integer'],
            'shift' => ['nullable', 'string', 'in:morning,afternoon,evening,full_day'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
            'distance_home_school_km' => ['nullable', 'numeric', 'min:0'],
            'census_eligible_pnate' => ['nullable', 'boolean'],
            'is_pnate_eligible' => ['nullable', 'boolean'],
            'special_needs' => ['nullable', 'boolean'],
            'has_special_needs' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:active,transferred,cancelled'],
        ];
    }
}
