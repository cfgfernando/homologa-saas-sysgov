import React from 'react';
import { Download } from 'lucide-react';
import { Button, Input, Select } from '@sysgov/ui';
import { LIMITES_STL, type EscalaAltura, type OpcoesStl, dimensoesStl } from '../stl';

/** Exagero vertical do modo 3D (multiplica a altura máxima de referência). */
export const LIMITES_EXAGERO = [0.5, 5] as const;

/** Altura máxima (m) da extrusão no mapa 3D, antes do exagero; o resto é proporcional (linear ou raiz). */
export const ALTURA_3D_REFERENCIA_M = 60000;

/** Expressão de altura do fill-extrusion: base mínima + fração (linear/raiz) do valor em `campo`. */
export function expressaoAltura(campo: string, maximo: number, escala: EscalaAltura, exagero: number): unknown[] {
  const topo = ALTURA_3D_REFERENCIA_M * exagero;
  const minimo = topo * 0.02;
  const fracao = ['/', ['max', 0, ['coalesce', ['get', campo], 0]], Math.max(1, maximo)];
  return ['+', minimo, ['*', topo - minimo, escala === 'raiz' ? ['sqrt', fracao] : fracao]];
}

const ESCALAS = [
  { value: 'raiz', label: 'Raiz (realça os menores)' },
  { value: 'linear', label: 'Linear (proporcional)' },
];

interface Props {
  escala: EscalaAltura;
  onEscala: (e: EscalaAltura) => void;
  /** Exagero vertical do modo 3D; omitido quando o mapa não tem 3D. */
  exagero?: number;
  onExagero?: (v: number) => void;
  opcoes: OpcoesStl;
  onOpcoes: (o: OpcoesStl) => void;
  features: readonly GeoJSON.Feature[];
  onBaixar: () => void;
  /** O que a altura representa (ex.: "eleitorado do TSE"). */
  indicador: string;
}

const numero = (v: string): number => Number(v.replace(',', '.'));

/** Parâmetros do relevo (3D na tela e STL para impressão), com as medidas finais do modelo. */
export const ControlesRelevo: React.FC<Props> = ({ escala, onEscala, exagero, onExagero, opcoes, onOpcoes, features, onBaixar, indicador }) => {
  const medidas = dimensoesStl(features, opcoes);
  const campo = (chave: 'ladoMaiorMm' | 'baseMm' | 'relevoMaximoMm', rotulo: string, passo: number): React.ReactNode => (
    <Input
      label={rotulo} type="number" inputMode="decimal" step={passo} min={LIMITES_STL[chave][0]} max={LIMITES_STL[chave][1]}
      className="font-mono tabular-nums" value={opcoes[chave]}
      onChange={(e) => { const v = numero(e.target.value); if (Number.isFinite(v)) onOpcoes({ ...opcoes, [chave]: v }); }}
    />
  );
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select label="Escala da altura" value={escala} options={ESCALAS} onChange={(v) => onEscala(v === 'linear' ? 'linear' : 'raiz')} />
        {exagero !== undefined && onExagero && (
          <Input
            label="Exagero vertical (3D)" type="number" step={0.5} min={LIMITES_EXAGERO[0]} max={LIMITES_EXAGERO[1]} className="font-mono tabular-nums" value={exagero}
            onChange={(e) => { const v = numero(e.target.value); if (Number.isFinite(v)) onExagero(Math.min(LIMITES_EXAGERO[1], Math.max(LIMITES_EXAGERO[0], v))); }}
          />
        )}
        {campo('ladoMaiorMm', 'Maior lado (mm)', 10)}
        {campo('baseMm', 'Espessura da base (mm)', 0.5)}
        {campo('relevoMaximoMm', 'Relevo máximo (mm)', 1)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Altura = {indicador}, escala {escala === 'raiz' ? 'raiz quadrada' : 'linear'}; cor = camada escolhida.
          {medidas && <> STL: <span className="font-mono tabular-nums">{medidas.largura} × {medidas.profundidade} × {medidas.altura} mm</span> (base sólida, áreas com valor zero ficam com relevo mínimo).</>}
        </p>
        <Button size="sm" variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={onBaixar} disabled={!medidas}>
          Baixar STL (impressão 3D)
        </Button>
      </div>
    </div>
  );
};
