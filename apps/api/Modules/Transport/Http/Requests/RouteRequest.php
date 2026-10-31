<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class RouteRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:30'],
            'name' => ['required', 'string', 'max:100'],
            'shift' => ['required', 'string', 'in:morning,afternoon,evening,full_time'],
            'route_type' => ['required', 'string', 'in:rural,urban,mixed'],
            'vehicle_id' => ['nullable', 'exists:transport_vehicles,id'],
            'driver_id' => ['nullable', 'exists:transport_drivers,id'],
            'start_location_name' => ['nullable', 'string', 'max:150'],
            'start_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'start_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'end_location_name' => ['nullable', 'string', 'max:150'],
            'end_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'end_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'string', 'in:active,inactive,suspended'],
            'waypoints_geojson' => ['nullable'],
        ];
    }
}
