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
        return [
            'code' => ['nullable', 'string', 'max:50'],
            'plate' => ['required', 'string', 'max:10'],
            'renavam' => ['nullable', 'string', 'max:20'],
            'chassis' => ['nullable', 'string', 'max:30'],
            'brand' => ['required', 'string', 'max:50'],
            'model' => ['required', 'string', 'max:100'],
            'year_manufacture' => ['nullable', 'integer', 'min:1970'],
            'year_model' => ['nullable', 'integer', 'min:1970'],
            'capacity_seats' => ['required', 'integer', 'min:1', 'max:200'],
            'vehicle_type' => ['nullable', 'string', 'in:bus,microbus,van,boat,other'],
            'ownership_type' => ['nullable', 'string', 'in:owned,contracted'],
            'accessibility_adapted' => ['nullable', 'boolean'],
            'detran_inspection_due_date' => ['nullable', 'date'],
            'crlv_due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:active,maintenance,decommissioned'],
            'metadata' => ['nullable'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('code') || empty($this->input('code'))) {
            $this->merge(['code' => 'VEIC-' . strtoupper(substr(uniqid(), -5))]);
        }
        if (!$this->has('year_manufacture')) {
            $this->merge(['year_manufacture' => (int) date('Y')]);
        }
        if (!$this->has('year_model')) {
            $this->merge(['year_model' => (int) date('Y')]);
        }
        if (!$this->has('detran_inspection_due_date')) {
            $this->merge(['detran_inspection_due_date' => date('Y-m-d', strtotime('+6 months'))]);
        }
        if (!$this->has('crlv_due_date')) {
            $this->merge(['crlv_due_date' => date('Y-m-d', strtotime('+1 year'))]);
        }
        if (!$this->has('vehicle_type')) {
            $this->merge(['vehicle_type' => 'bus']);
        }
        if (!$this->has('status')) {
            $this->merge(['status' => 'active']);
        }
        if (!$this->has('ownership_type')) {
            $this->merge(['ownership_type' => 'owned']);
        }
    }
}
