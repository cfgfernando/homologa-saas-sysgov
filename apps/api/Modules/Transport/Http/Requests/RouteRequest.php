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
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:150'],
            'shift' => ['required', 'string', 'in:morning,afternoon,night,full_day'],
            'route_type' => ['required', 'string', 'in:rural,urban,mixed'],
            'assigned_vehicle_id' => ['nullable', 'exists:transport_vehicles,id'],
            'assigned_driver_id' => ['nullable', 'exists:transport_drivers,id'],
            'distance_paved_km' => ['nullable', 'numeric', 'min:0'],
            'distance_unpaved_km' => ['nullable', 'numeric', 'min:0'],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:0'],
            'shape_geojson' => ['nullable'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('vehicle_id') && !$this->has('assigned_vehicle_id')) {
            $this->merge(['assigned_vehicle_id' => $this->input('vehicle_id')]);
        }
        if ($this->has('driver_id') && !$this->has('assigned_driver_id')) {
            $this->merge(['assigned_driver_id' => $this->input('driver_id')]);
        }
        if ($this->has('distance_km') && !$this->has('distance_paved_km')) {
            $this->merge(['distance_paved_km' => (float) $this->input('distance_km')]);
        }
        if ($this->has('waypoints_geojson') && !$this->has('shape_geojson')) {
            $val = $this->input('waypoints_geojson');
            $this->merge(['shape_geojson' => is_string($val) ? $val : json_encode($val)]);
        }
        if ($this->has('status') && !$this->has('is_active')) {
            $this->merge(['is_active' => $this->input('status') === 'active']);
        }
    }
}
