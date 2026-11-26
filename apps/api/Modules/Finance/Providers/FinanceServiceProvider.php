<?php

declare(strict_types=1);

namespace Modules\Finance\Providers;

use App\Events\OutboxMessage;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Modules\Finance\Listeners\ReceitaDePagamentoDePasseioListener;
use Illuminate\Support\ServiceProvider;
use Modules\Finance\Models\Expense;
use Modules\Finance\Models\Invoice;
use Modules\Finance\Models\Revenue;
use Modules\Finance\Models\Transfer;
use Modules\Finance\Policies\FinanceEntryPolicy;

final class FinanceServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::policy(Revenue::class, FinanceEntryPolicy::class);
        Gate::policy(Expense::class, FinanceEntryPolicy::class);
        Gate::policy(Invoice::class, FinanceEntryPolicy::class);
        Gate::policy(Transfer::class, FinanceEntryPolicy::class);
        Event::listen(OutboxMessage::class, ReceitaDePagamentoDePasseioListener::class);
        $this->loadRoutesFrom(__DIR__.'/../Routes/api.php');
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
    }
}
