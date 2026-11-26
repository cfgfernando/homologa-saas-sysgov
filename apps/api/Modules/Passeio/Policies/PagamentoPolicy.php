<?php

declare(strict_types=1);

namespace Modules\Passeio\Policies;

use App\Models\User;
use App\Support\TenantContext;
use Modules\Passeio\Models\Inscricao;
use Modules\Passeio\Models\Pagamento;

/** Pagamentos das inscrições: leitura com passeio.view, registro e estorno com passeio.pagamentos.manage. */
final class PagamentoPolicy
{
    public function viewAny(User $user, Inscricao $inscricao): bool
    {
        return $this->doTenant($inscricao->tenant_id) && $this->pode($user, 'passeio.view');
    }

    public function create(User $user, Inscricao $inscricao): bool
    {
        return $this->doTenant($inscricao->tenant_id) && $this->pode($user, 'passeio.pagamentos.manage');
    }

    public function estornar(User $user, Pagamento $pagamento): bool
    {
        return $this->doTenant($pagamento->tenant_id) && $this->pode($user, 'passeio.pagamentos.manage');
    }

    private function pode(User $user, string $permissao): bool
    {
        $context = app(TenantContext::class);

        return $context->hasTenant() && $user->hasPermission($permissao, $context->id());
    }

    private function doTenant(int $tenantId): bool
    {
        $context = app(TenantContext::class);

        return $context->hasTenant() && $tenantId === $context->id();
    }
}
