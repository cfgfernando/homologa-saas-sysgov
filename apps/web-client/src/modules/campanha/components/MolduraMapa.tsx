import React from 'react';
import { Skeleton } from '@sysgov/ui';

export interface ItemLegenda { cor: string; rotulo: React.ReactNode; chave?: string }

/** Área do mapa: o MapLibre desenha no div do ref; esqueleto até o estilo carregar. */
export const MolduraMapa = React.forwardRef<HTMLDivElement, { altura: number; pronto: boolean }>(({ altura, pronto }, ref) => (
  // isolate: os controles do mapa não passam por cima do cabeçalho fixo do painel.
  <div className="relative isolate overflow-hidden rounded-lg border border-border bg-muted/40" style={{ height: altura }}>
    <div ref={ref} className="h-full w-full" />
    {!pronto && <Skeleton className="absolute inset-0 h-full w-full" />}
  </div>
));
MolduraMapa.displayName = 'MolduraMapa';

/** Legenda de cores do mapa (quadradinho + rótulo). */
export const LegendaMapa: React.FC<{ itens: ItemLegenda[] }> = ({ itens }) => (
  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legenda do mapa">
    {itens.map((item, i) => (
      <li key={item.chave ?? (typeof item.rotulo === 'string' ? item.rotulo : `${item.cor}-${i}`)} className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: item.cor }} aria-hidden />
        {item.rotulo}
      </li>
    ))}
  </ul>
);

/** Aviso no lugar do mapa: preparo da malha (com texto próprio de cada tela) ou erro da API. */
export const AvisoMapa: React.FC<{ erro: string; emPreparo: boolean; textoPreparo: string }> = ({ erro, emPreparo, textoPreparo }) => (
  <p role="status" className="rounded-md border border-border p-4 text-sm text-muted-foreground">{emPreparo ? textoPreparo : erro}</p>
);
