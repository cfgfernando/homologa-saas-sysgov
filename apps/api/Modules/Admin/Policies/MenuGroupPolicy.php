<?php

declare(strict_types=1);

namespace Modules\Admin\Policies;

use App\Models\User;
use Modules\Admin\Models\MenuGroup;

final class MenuGroupPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.menus.view')
            || $user->hasPermission('admin.menus.manage')
            || $user->roles()->where('scope', 'systrat')->exists();
    }

    public function view(User $user, MenuGroup $group): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.menus.view')
            || $user->hasPermission('admin.menus.manage')
            || $user->roles()->where('scope', 'systrat')->exists();
    }

    public function create(User $user): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.menus.manage')
            || $user->roles()->where('scope', 'systrat')->whereIn('slug', ['super_admin', 'admin_ops'])->exists();
    }

    public function update(User $user, MenuGroup $group): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.menus.manage')
            || $user->roles()->where('scope', 'systrat')->whereIn('slug', ['super_admin', 'admin_ops'])->exists();
    }

    public function delete(User $user, MenuGroup $group): bool
    {
        return $user->is_platform_admin
            || $user->hasPermission('admin.menus.manage')
            || $user->roles()->where('scope', 'systrat')->where('slug', 'super_admin')->exists();
    }
}
