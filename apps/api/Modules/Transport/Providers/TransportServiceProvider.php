<?php

declare(strict_types=1);

namespace Modules\Transport\Providers;

use Illuminate\Support\ServiceProvider;

final class TransportServiceProvider extends ServiceProvider
{
    protected string $moduleName = 'Transport';
    protected string $moduleNameLower = 'transport';

    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../Config/config.php', 'transport');
        $this->app->register(RouteServiceProvider::class);
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
    }
}

