## Contexto

A Formatura roda no `web-client` (React 19 + Tailwind v4), que já é PWA instalável. O repositório não tem base de app nativo (Capacitor, React Native ou Expo).

## Decisões

- **D1 — Web responsivo + PWA em vez de app nativo.** O PWA já existe e atende instalação na tela inicial. Um app nativo exigiria assinatura, contas de loja, revisão e pipeline de publicação, sem ganho funcional para estas telas. Fica como decisão do produto, fora desta change.
- **D2 — Modo cartão no `DataTable` compartilhado, opcional.** Fazer cartões em cada tela duplicaria a renderização. A opção `mobileCards` reaproveita as `ColumnDef` existentes, incluindo as células com interruptor, chip e menu de ações. Com isso a regra do `@sysgov/ui` obrigatório continua valendo.
- **D3 — Só um layout é renderizado, escolhido por `matchMedia`.** Renderizar tabela e cartões ao mesmo tempo e esconder um deles por CSS duplicaria controles (dois interruptores por aluno) e quebraria leitores de tela e testes. Sem `matchMedia` (jsdom/SSR), o padrão é a tabela.
- **D4 — Rótulo do campo no cartão.** Usa `meta.exportHeader`, depois o `header` em texto, depois o id. A coluna de ações é a de id `acoes`/`actions`.

## Riscos

- Ao girar a tela, o layout troca e a grade remonta. A paginação fica no estado da tabela, que é o mesmo nos dois modos.
