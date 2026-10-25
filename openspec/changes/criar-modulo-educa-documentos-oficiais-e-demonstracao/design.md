# Design de Arquitetura: Documentos Oficiais em PDF e Seeder de Demonstração (SYS-Educa)

## 1. Visão Geral e Arquitetura de Renderização de Documentos

A emissão de documentos oficiais educacionais no **SYS-Educa** adota a biblioteca `Barryvdh\DomPDF\Facade\Pdf` para processamento no servidor (gerando PDFs compactos, em conformidade com o formato A4 retrato/paisagem), aliada a templates Blade organizados em `apps/api/Modules/Educa/Resources/views/pdf/`:

```
apps/api/Modules/Educa/
├── Resources/
│   └── views/
│       └── pdf/
│           ├── layout.blade.php           # Template base timbrado (cabeçalho, rodapé, numeração de páginas)
│           ├── boletim.blade.php          # Boletim Escolar com notas dos 4 bimestres e faltas
│           ├── historico_escolar.blade.php# Histórico Escolar Oficial com vida pregressa e etapas LDB
│           ├── declaracao_matricula.blade.php # Declaração de Matrícula e Frequência com QR Code
│           └── ficha_individual.blade.php # Ficha individual anual consolidada do estudante
├── Services/
│   ├── EducaPdfService.php               # Motor de compilação, injeção de dados e rendering
│   └── DocumentosOficiaisService.php      # Regras de negócio de assentamento, médias e validação
├── Http/
│   └── Controllers/
│       └── DocumentosOficiaisController.php # Endpoints HTTP para download e preview dos PDFs
└── Database/
    └── Seeders/
        └── EducaDemonstracaoSeeder.php    # Carga de dados realistas para homologação e demonstração
```

---

## 2. Decisões de Design (Decisions)

### D1: Autenticidade, QR Code e Código de Verificação
- Documentos oficiais de declaração e histórico recebem um código de autenticação único de 16 caracteres (`XXXX-XXXX-XXXX-XXXX`) e um hash SHA-256 gerado a partir de `(tenant_id, aluno_id, tipo_documento, timestamp)`.
- É renderizado um **QR Code PNG** em base64 via `chillerlan\QRCode` apontando para a URL de conferência pública da prefeitura:
  `{PORTAL_URL}/validar-documento/{tenant_slug}/{codigo_autenticidade}`.
- O rodapé inclui a data e hora de expedição e a identificação do operador emissor.

### D2: Paginação Dinâmica via Canvas DomPDF
- Devido a limitações do interpretador CSS do DomPDF com `counter(pages)`, a numeração contínua ("Página {PAGE_NUM} de {PAGE_COUNT}") é injetada diretamente no canvas da biblioteca após a compilação do layout, garantindo consistência mesmo em históricos com múltiplas páginas.

### D3: Tipografia Técnica e Design System
- Em conformidade com o [`DESIGN_SYSTEM.md`](../../../DESIGN_SYSTEM.md) e regras do repositório, todas as notas, percentuais de frequência, cargas horárias, datas, números de documentos (CPF, NIS, Certidão) e códigos de autenticidade são renderizados estritamente em **JetBrains Mono** / Courier tabular no PDF e na tela.
- Cores de cabeçalhos e tabelas seguem o padrão institucional dark navy / cinza neutro oficial do SYSGOV.

### D4: Estrutura do Seeder de Demonstração (`EducaDemonstracaoSeeder`)
- **Tenant Context**: Opera dentro do tenant ativo via `app(TenantContext::class)->get()`.
- **Pessoas Reais**: Utiliza a factory / modelo `Modules\Pessoas\Models\Pessoa` para criar alunos e responsáveis, associando CPF, RG, filiação e contatos reais no Cadastro Único sem duplicidade.
- **Escola e Organograma**: Vincula a escola de demonstração a uma unidade da secretaria de educação em `Modules\OrgChart\Models\OrgUnit`.
- **Cadeia Completa**:
  1. Criação do ano letivo 2026 e 4 bimestres com calendário de 200 dias úteis.
  2. Matriz curricular com 8 componentes da Base Nacional Comum Curricular (BNCC).
  3. Alocação de 3 professores e 1 coordenador pedagógico.
  4. 2 Turmas (Ensino Fundamental): 5º Ano A (30 alunos) e 9º Ano A (25 alunos).
  5. Lançamento de notas nos bimestres 1 a 3, faltas simuladas e diários de classe preenchidos.
  6. Cardápio da alimentação escolar homologado com CRN.
  7. 2 Alunos com cadastro no AEE com metas de PDI ativas.

---

## 3. Especificação dos Endpoints REST

| Método | Rota | Descrição | Permissão RBAC |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/educa/matriculas/{id}/boletim-pdf` | Download do PDF do boletim escolar da matrícula | `educa.pedagogico.visualizar` |
| `GET` | `/api/educa/turmas/{id}/boletins-lote-pdf` | Download consolidado dos boletins de todos os alunos da turma | `educa.pedagogico.visualizar` |
| `GET` | `/api/educa/alunos/{id}/historico-escolar-pdf` | Download do PDF do Histórico Escolar Oficial LDB do aluno | `educa.secretaria.visualizar` |
| `GET` | `/api/educa/matriculas/{id}/declaracao-matricula-pdf` | Emissão de Declaração de Matrícula e Frequência com QR Code | `educa.secretaria.visualizar` |
| `GET` | `/api/educa/matriculas/{id}/ficha-individual-pdf` | Download da Ficha Individual Anual do Aluno | `educa.secretaria.visualizar` |

---

## 4. Testes e Validação de Qualidade

1. **Testes Unitários e de Integração (PHPUnit)**:
   - Validação da renderização dos 4 tipos de PDF sem erros de sintaxe ou layout.
   - Verificação da integridade do QR Code gerado e dados do aluno.
   - Teste de execução do `EducaDemonstracaoSeeder` garantindo integridade das chaves estrangeiras (`tenant_id`, `pessoa_id`, `org_unit_id`).
2. **Compatibilidade do Frontend**:
   - Integração com a camada de download de binários do SDK já existente no `apps/web-client`.
