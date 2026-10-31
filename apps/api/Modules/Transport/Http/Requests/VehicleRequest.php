<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class VehicleRequest extends FormRequest
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
        $vehicleId = $this->route('vehicle')?->id ?? $this->route('id');

        return [
            'plate' => ['required', 'string', 'max:10'],
            'renavam' => ['nullable', 'string', 'max:15'],
            'chassi' => ['nullable', 'string', 'max:30'],
            'brand' => ['required', 'string', 'max:50'],
            'model' => ['required', 'string', 'max:50'],
            'model_year' => ['required', 'integer', 'min:1970', 'max:' . (date('Y') + 2)],
            'manufacture_year' => ['required', 'integer', 'min:1970', 'max:' . (date('Y') + 1)],
            'capacity_seats' => ['required', 'integer', 'min:1', 'max:150'],
            'vehicle_type' => ['required', 'string', 'in:bus,microbus,van,boat,other'],
            'status' => ['nullable', 'string', 'in:active,maintenance,inactive,out_of_service'],
            'is_adapted_pcd' => ['nullable', 'boolean'],
            'has_seatbelts_for_all' => ['nullable', 'boolean'],
            'has_tacografo' => ['nullable', 'boolean'],
            'ownership_type' => ['nullable', 'string', 'in:own,rented,partner'],
            'contract_number' => ['nullable', 'string', 'max:50'],
            'last_inspection_date' => ['nullable', 'date'],
            'next_inspection_date' => ['nullable', 'date'],
            'insurance_policy' => ['nullable', 'string', 'max:50'],
            'insurance_expiration' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
