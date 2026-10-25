# Proposta: Emissão de Documentos Oficiais em PDF e Carga de Demonstração (SYS-Educa)

## Por que

Com as 12 verticais transacionais do **SYS-Educa** concluídas (Core, Secretaria, Pedagógico, Servidores, Transporte, Comunicação, Educacenso, Vagas, Quadro de Horários, Alimentação Escolar, AEE e Conselho de Classe), restam duas demandas essenciais para a operacionalização completa em produção e homologação:

1. **Validade Jurídica e Emissão de Documentos Oficiais Escolares**:
   - As secretarias de educação municipais são obrigadas pela **Lei de Diretrizes e Bases da Educação Nacional (LDB - Lei Federal nº 9.394/1996)** e pelas normas do Conselho Nacional de Educação (CNE) a emitir e resguardar documentos oficiais com fé pública:
     - **Histórico Escolar Oficial**: Registro completo da trajetória do aluno, vida pregressa de outras redes, consolidação de notas/conceitos, carga horária cumprida, dias letivos e escrituração em livro, folha e termo de assentamento.
     - **Boletim Escolar Oficial**: Documento periódico de rendimento e assiduidade (individual e em lote por turma).
     - **Declarações Oficiais com Fé Pública**: Declaração de Matrícula, Declaração de Frequência e Guia de Transferência com código verificador e **QR Code** de autenticidade no padrão de segurança do SYSGOV.
     - **Ficha Individual do Aluno**: Registro escolar detalhado anual para arquivo permanente.

2. **Carga e Dados de Demonstração (`EducaDemonstracaoSeeder`)**:
   - Os demais módulos do SYSGOV (Licita, Cemitérios, Cursos, Capd) contam com seeders especializados de dados em volume e cenários reais.
   - O SYS-Educa necessita de um seeder de demonstração completo que popule uma unidade escolar municipal de referência com calendário, turmas, matriz curricular, docentes, alunos vinculados ao Cadastro de Pessoas (`Modules/Pessoas`), lançamentos de notas, frequências, cardápios e atas, viabilizando homologação e demonstração imediata aos municípios.

## O que será construído

1. **Serviço Centralizado de Documentos Oficiais em PDF (`EducaPdfService` / `DocumentosOficiaisService`)**:
   - Utilização do `Barryvdh\DomPDF\Facade\Pdf` e `chillerlan\QRCode` com layout timbrado municipal, cabeçalho da Secretaria de Educação e rodapé de autenticidade institucional.
   - **Histórico Escolar LDB**: Cabeçalho de identificação, dados civis do aluno, tabela de componentes por etapa cursada, carga horária, situação final e campos formais de expedição (Livro/Folha/Termo).
   - **Boletim Escolar Bimestral/Trimestral**: Grade de componentes, notas por período, faltas, frequência percentual e situação de aprovação.
   - **Declaração de Matrícula & Frequência**: Texto institucional timbrado com dados da turma, turno e matrícula ativa, acompanhado de hash SHA-256 e QR Code de validação.
   - **Ficha Individual do Estudante**: Relatório anual compilando dados cadastrais, pedagógicos, ocorrências e pareceres.

2. **Endpoints REST na API (`Modules/Educa`)**:
   - `GET /api/educa/matriculas/{id}/boletim-pdf`: Download/streaming do boletim do estudante.
   - `GET /api/educa/turmas/{id}/boletins-pdf`: Emissão em lote dos boletins da turma em um único PDF.
   - `GET /api/educa/alunos/{id}/historico-escolar-pdf`: Emissão do histórico escolar oficial do aluno.
   - `GET /api/educa/matriculas/{id}/declaracao-matricula-pdf`: Emissão de declaração de matrícula com QR Code.
   - `GET /api/educa/matriculas/{id}/ficha-individual-pdf`: Emissão de ficha individual completa.

3. **Seeder Completo de Demonstração (`EducaDemonstracaoSeeder`)**:
   - Criação da "Escola Municipal Professora Maria da Silva" vinculada ao tenant ativo.
   - Ano letivo 2026 com 4 bimestres e 200 dias letivos regulamentares.
   - Matrizes curriculares completas do Ensino Fundamental (Anos Iniciais e Finais).
   - Servidores e professores alocados com jornadas e disciplinas.
   - Turmas compostas com alunos reais vinculados à tabela de Pessoas físicas (`Modules\Pessoas\Models\Pessoa`).
   - Lançamento de notas, diários de classe, frequências e cardápios para alimentar a emissão imediata dos relatórios e PDFs.

4. **Interface no Frontend (`apps/web-client`)**:
   - Ações de emissão de Boletim, Declarações e Histórico Escolar integradas às telas `SecretariaView.tsx` e `PedagogicoView.tsx`.
   - Botão de impressão/download direto com preview e indicação de status.

## Impacto nos Usuários e na Operação

- **Secretarias Escolares**: Eliminação de preenchimento manual em formulários de papel; emissão instantânea de históricos e declarações com validade jurídica.
- **Famílias e Alunos**: Acesso ágil a declarações para benefícios sociais (Bolsa Família, passe escolar) com autenticação verificável por QR Code.
- **Equipe de Demonstração e Homologação**: Capacidade de subir um ambiente educacional realista completo com um único comando Artisan (`php artisan educa:seed-demo`).
