## Por quê

O pedido foi uma "versão mobile" da Formatura. Na escola, quem recebe pagamento e confere participação costuma fazer isso pelo celular. As telas já usam `@sysgov/ui` e os formulários se ajustam, mas as grades da Formatura têm até 10 colunas e no celular só funcionam rolando para o lado. O `web-client` já é PWA (`vite-plugin-pwa`, manifest e service worker), então dá para instalar no celular sem precisar de app nativo nem de loja.

## O que muda

- `DataTable` de `@sysgov/ui` ganha a opção `mobileCards`: abaixo de 768px a grade vira uma lista de cartões tocáveis, com título (`meta.mobilePrimary`), ações no canto e os campos em "rótulo: valor". Paginação, busca e exportação continuam iguais. A opção vem desligada e não muda nenhuma outra tela.
- Novo hook `useTelaEstreita` exportado por `@sysgov/ui`.
- Formatura: as grades de Formandos, Pagamentos, Relação de Alunos, Turmas e Participantes passam a usar o modo cartão; cabeçalhos e barras de ação quebram linha no celular; o seletor de ano ocupa a largura toda; o botão de estorno da ficha fica maior para o toque.
- Fora do escopo: app nativo (Capacitor/React Native), publicação em loja, uso offline dos dados da Formatura e mudanças no backend.

## Impacto

- Front: `packages/ui/src/components/DataTable.tsx`, `packages/ui/src/index.ts` e `apps/web-client/src/modules/formatura/**`.
- Backend, permissões, multi-tenant, dinheiro em centavos e auditoria não mudam.
