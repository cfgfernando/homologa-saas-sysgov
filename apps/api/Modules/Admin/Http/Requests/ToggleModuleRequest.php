<?php

declare(strict_types=1);

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class ToggleModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user !== null && (
            $user->is_platform_admin
            || $user->hasPermission('admin.modules.manage')
            || $user->hasRole('admin_ops')
            || $user->roles()->where('scope', 'systrat')->whereIn('slug', ['super_admin', 'admin_ops'])->exists()
        );
    }

    public function rules(): array { return ['enabled' => ['required', 'boolean'], 'settings' => ['sometimes', 'array']]; }
}
