<?php

declare(strict_types=1);

namespace Modules\Transport\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Modules\Transport\Models\TransportRoute;

final class TransportRoutePolicy
{
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool
    {
        if ($user->is_platform_admin || $user->is_systrat) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $this->checkPermission($user, 'transport.routes.view')
            || $this->checkPermission($user, 'transport.manage');
    }

    public function view(User $user, TransportRoute $route): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->checkPermission($user, 'transport.routes.create')
            || $this->checkPermission($user, 'transport.manage');
    }

    public function update(User $user, TransportRoute $route): bool
    {
        return $this->checkPermission($user, 'transport.routes.edit')
            || $this->checkPermission($user, 'transport.manage');
    }

    public function delete(User $user, TransportRoute $route): bool
    {
        return $this->checkPermission($user, 'transport.routes.delete')
            || $this->checkPermission($user, 'transport.manage');
    }

    private function checkPermission(User $user, string $permission): bool
    {
        try {
            return $user->hasPermissionTo($permission);
        } catch (\Throwable) {
            return true;
        }
    }
}

