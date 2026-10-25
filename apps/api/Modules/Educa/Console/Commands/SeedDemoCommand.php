<?php

declare(strict_types=1);

namespace Modules\Educa\Console\Commands;

use Illuminate\Console\Command;
use Modules\Educa\Database\Seeders\EducaDemonstracaoSeeder;

final class SeedDemoCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'educa:seed-demo {--tenant= : ID opcional do Tenant municipal}';

    /**
     * @var string
     */
    protected $description = 'Popula a escola modelo e dados de demonstração do SYS-Educa (alunos, notas, turmas, PNAE e AEE)';

    public function handle(EducaDemonstracaoSeeder $seeder): int
    {
        $tenantId = $this->option('tenant') !== null ? (int) $this->option('tenant') : null;

        $this->info('Iniciando semeadura de dados de demonstração do SYS-Educa...');
        $seeder->setCommand($this);
        $seeder->run($tenantId);

        $this->info('Semeadura concluída com sucesso!');
        return self::SUCCESS;
    }
}
