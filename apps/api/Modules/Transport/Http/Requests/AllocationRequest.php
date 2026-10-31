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
            'stop_id' => ['nullable', 'exists:transport_stops,id'],
            'student_id' => ['required'],
            'school_id' => ['nullable', 'integer'],
            'school_year' => ['required', 'integer'],
            'shift' => ['required', 'string', 'in:morning,afternoon,evening,full_time'],
            'distance_home_school_km' => ['nullable', 'numeric', 'min:0'],
            'is_pnate_eligible' => ['nullable', 'boolean'],
            'special_needs' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:active,transferred,cancelled'],
        ];
    }
}
