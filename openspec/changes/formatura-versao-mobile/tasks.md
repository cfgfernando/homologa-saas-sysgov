## 1. Componente compartilhado

- [x] 1.1 Adicionar `mobileCards`, `meta.mobilePrimary` e `meta.mobileHidden` ao `DataTable` de `@sysgov/ui`
- [x] 1.2 Exportar o hook `useTelaEstreita` (via `matchMedia`, com tabela como padrão sem `matchMedia`)
- [x] 1.3 Deixar a paginação quebrar linha em tela estreita

## 2. Telas da Formatura

- [x] 2.1 Ligar `mobileCards` nas grades de Formandos, Pagamentos, Relação de Alunos, Turmas e Participantes
- [x] 2.2 Marcar Nome, Formando e Turma como título do cartão
- [x] 2.3 Ajustar cabeçalhos e barras de ação para quebrar linha; seletor de ano em largura total; estorno da ficha com área de toque maior

## 3. Verificação

- [x] 3.1 Teste vitest do modo cartão (Relação de Alunos com `matchMedia` de celular)
- [x] 3.2 `npm run typecheck` e testes da Formatura
- [ ] 3.3 Conferir no celular ou no DevTools (360px) com dados reais e instalar o PWA
