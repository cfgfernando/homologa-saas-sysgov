<?php

declare(strict_types=1);

namespace Modules\Admin\Policies;

use App\Models\User;
use Modules\Admin\Models\Module;

final class ModulePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.modules.view')
            || $user->hasPermission('admin.modules.manage')
            || $user->roles()->where('scope', 'systrat')->exists();
    }

    public function create(User $user): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.modules.manage')
            || $user->roles()->where('scope', 'systrat')->whereIn('slug', ['super_admin', 'admin_ops'])->exists();
    }

    public function view(User $user, Module $module): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.modules.view')
            || $user->hasPermission('admin.modules.manage')
            || $user->roles()->where('scope', 'systrat')->exists();
    }

    public function update(User $user, Module $module): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.modules.manage')
            || $user->roles()->where('scope', 'systrat')->whereIn('slug', ['super_admin', 'admin_ops'])->exists();
    }

    public function delete(User $user, Module $module): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.modules.manage')
            || $user->roles()->where('scope', 'systrat')->where('slug', 'super_admin')->exists();
    }

    public function toggle(User $user, Module $module): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.modules.manage')
            || $user->roles()->where('scope', 'systrat')->whereIn('slug', ['super_admin', 'admin_ops'])->exists();
    }

    public function batchProvision(User $user): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.modules.manage')
            || $user->roles()->where('scope', 'systrat')->whereIn('slug', ['super_admin', 'admin_ops'])->exists();
    }
}