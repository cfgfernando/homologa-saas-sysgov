# Tarefas: Documentos Oficiais em PDF e Seeder de Demonstração (SYS-Educa)

## Fase 1: Motor de Renderização de PDFs e Templates Blade
- [ ] 1.1 Configurar o diretório de views e registrar `$this->loadViewsFrom` no `EducaServiceProvider`.
- [ ] 1.2 Criar layout base timbrado em `apps/api/Modules/Educa/Resources/views/pdf/layout.blade.php`.
- [ ] 1.3 Criar template Blade do Boletim Escolar (`boletim.blade.php`) com notas bimestrais, faltas, situação e tipografia técnica.
- [ ] 1.4 Criar template Blade do Histórico Escolar LDB (`historico_escolar.blade.php`) com cabeçalho oficial, dados de vida pregressa, etapas cursadas, livro/folha/termo.
- [ ] 1.5 Criar template Blade da Declaração de Matrícula e Frequência (`declaracao_matricula.blade.php`) com dados timbrados, autenticidade e QR Code.
- [ ] 1.6 Criar template Blade da Ficha Individual do Estudante (`ficha_individual.blade.php`).

## Fase 2: Serviços e Endpoints da API
- [ ] 2.1 Implementar `EducaPdfService` encapsulando a compilação do DomPDF, injeção de canvas de paginação e geração de QR Code.
- [ ] 2.2 Implementar `DocumentosOficiaisService` para agregação de dados de matrículas, notas, turmas e histórico para o PDF.
- [ ] 2.3 Implementar `DocumentosOficiaisController` com os 5 endpoints de streaming/download de PDF.
- [ ] 2.4 Registrar rotas de documentos oficiais em `apps/api/Modules/Educa/Routes/api.php` com middlewares de autenticação e RBAC.

## Fase 3: Seeder de Demonstração e Volume
- [ ] 3.1 Implementar `EducaDemonstracaoSeeder` populando Escola de Demonstração, Unidade Orgânica, Ano Letivo 2026 e Calendário Escolar.
- [ ] 3.2 Integrar a criação de alunos com o Cadastro Único de Pessoas (`Modules\Pessoas\Models\Pessoa`) sem duplicidade.
- [ ] 3.3 Popular Turmas, Matrizes Curriculares, Componentes e Lotação de Professores.
- [ ] 3.4 Inserir lançamentos de notas, frequências, cardápio da merenda e atendimento AEE.
- [ ] 3.5 Criar comando Artisan `php artisan educa:seed-demo` para invocação direta via CLI.

## Fase 4: Frontend e Ações de Emissão
- [ ] 4.1 Adicionar botões de emissão de Boletim, Declaração e Histórico na `SecretariaView.tsx` e `PedagogicoView.tsx`.
- [ ] 4.2 Integrar o download de PDF com tratamento de blob e visualização rápida no navegador.

## Fase 5: Testes Automatizados e Validação
- [ ] 5.1 Criar teste Feature em PHPUnit `DocumentosOficiaisPdfTest.php` validando geração de PDFs sem erros e com dados corretos.
- [ ] 5.2 Testar execução do `EducaDemonstracaoSeeder` e verificar integridade referencial de chaves no banco.
