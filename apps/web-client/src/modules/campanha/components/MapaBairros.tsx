import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { Button, Skeleton } from '@sysgov/ui';
import { campanhaApi, type PontoCalor } from '../api';
import { GRADIENTE_CALOR, formatarNumero } from '../formato';
import { contarPorArea } from '../geometria';
import { useDadosDoMapa } from '../hooks/useDadosDoMapa';
import { alternarRuas, atualizarCalor, carregarMalha, corDaBorda, escapar, larguraDaBorda, limitesDe, criarMapa, maplibregl } from '../maplibre';
import { OPCOES_STL_PADRAO, baixarArquivoStl, gerarStl, type EscalaAltura, type OpcoesStl } from '../stl';
import { ControlesRelevo } from './ControlesRelevo';
import { AvisoMapa, LegendaMapa, MolduraMapa, type ItemLegenda } from './MolduraMapa';

/** Camadas do mapa municipal: eleitores captados por bairro (coroplético) ou mapa de calor. */
export type CamadaBairros = 'eleitores_bairro' | 'mapa_calor';
export const ROTULO_CAMADA_BAIRROS: Record<CamadaBairros, string> = { eleitores_bairro: 'Eleitores por bairro', mapa_calor: 'Mapa de calor (eleitores)' };

interface Props {
  uf: string;
  codigoIbge: number;
  camada: CamadaBairros;
  /** Pontos de eleitores captados (lat, lng, peso), os mesmos do mapa de calor. */
  calor: PontoCalor[];
  altura?: number;
}

/** Classes de cor (azul) por eleitores captados no bairro; 0 = cinza. */
const CLASSES = ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'];
const SEM_ELEITORES = '#e2e8f0';
/** Parte do município sem bairros delimitados (em geral a zona rural). */
const COR_FORA = '#ecfccb';

/**
 * Mapa da campanha municipal (Prefeito/Vereador): só o município, dividido por bairros (IBGE Censo 2022 ou
 * OpenStreetMap). Enquanto a malha de bairros é importada, avisa e tenta de novo a cada 20 s.
 */
export const MapaBairros: React.FC<Props> = ({ uf, codigoIbge, camada, calor, altura = 540 }) => {
  // Bairros do município + contorno (da malha da UF); o hook repete enquanto o servidor importa.
  const { dados, erro, emPreparo } = useDadosDoMapa(`${uf}:${codigoIbge}`, () =>
    Promise.all([campanhaApi.bairros(codigoIbge), carregarMalha(uf)]).then(([b, malhaUf]) => ({
      bairros: b,
      contorno: malhaUf.features.find((f) => String(f.properties?.codarea) === String(codigoIbge)) ?? null,
    })));
  const bairros = dados?.bairros ?? null;
  const contorno = dados?.contorno ?? null;
  const [ruas, setRuas] = useState(false);
  const [escala, setEscala] = useState<EscalaAltura>('raiz');
  const [opcoesStl, setOpcoesStl] = useState<OpcoesStl>(OPCOES_STL_PADRAO);
  const [pronto, setPronto] = useState(false);
  const container = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const atribuicao = useRef<maplibregl.AttributionControl | null>(null);

  // Eleitores captados por bairro e fora dos bairros (zona rural), em uma passada com pré-filtro por caixa.
  const { porArea: contagem, fora } = useMemo(
    () => (bairros ? contarPorArea(calor, bairros.features, contorno) : { porArea: [] as number[], fora: 0 }),
    [bairros, contorno, calor],
  );
  const maximo = Math.max(0, ...contagem);
  const corDe = (n: number): string => (n <= 0 ? SEM_ELEITORES : CLASSES[Math.min(CLASSES.length - 1, Math.floor((n / Math.max(1, maximo)) * CLASSES.length - 1e-9))]);
  const atual = useRef({ contagem, fora });
  atual.current = { contagem, fora };

  // Cria o mapa uma vez por malha de bairros.
  useEffect(() => {
    if (!bairros || !container.current) return;
    // Enquadra o município inteiro (bairros + zona rural).
    const limites = limitesDe(contorno ? [contorno] : bairros.features);
    const m = criarMapa(container.current, limites, 16);
    mapa.current = m;
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '260px', offset: 12 });
    let hover: number | undefined;

    m.on('load', () => {
      if (contorno) {
        m.addSource('municipio', { type: 'geojson', data: contorno });
        m.addLayer({ id: 'municipio-fundo', type: 'fill', source: 'municipio', paint: { 'fill-color': COR_FORA, 'fill-opacity': 0.9 } });
      }
      m.addSource('bairros', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, generateId: true });
      m.addLayer({ id: 'bairros-fill', type: 'fill', source: 'bairros', paint: { 'fill-color': ['coalesce', ['get', '__cor'], SEM_ELEITORES], 'fill-opacity': 0.85 } });
      m.addLayer({
        id: 'bairros-linha', type: 'line', source: 'bairros',
        paint: { 'line-color': corDaBorda('#ffffff'), 'line-width': larguraDaBorda(0.8, 2.4) },
      });
      if (contorno) m.addLayer({ id: 'municipio-linha', type: 'line', source: 'municipio', paint: { 'line-color': '#0c326f', 'line-width': 1.6 } });
      setPronto(true);
    });

    m.on('mousemove', 'bairros-fill', (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      m.getCanvas().style.cursor = 'default';
      if (f.id !== hover) {
        if (hover !== undefined) m.setFeatureState({ source: 'bairros', id: hover }, { hover: false });
        hover = f.id as number;
        m.setFeatureState({ source: 'bairros', id: hover }, { hover: true });
      }
      const n = atual.current.contagem[Number(f.properties?.__i)] ?? 0;
      popup.setLngLat(e.lngLat).setHTML(`<strong>${escapar(String(f.properties?.nome ?? 'Bairro'))}</strong><div>${formatarNumero(n)} eleitor(es) captado(s)</div>`).addTo(m);
    });
    // A parte do município sem bairro fica por baixo da camada de bairros: só recebe o mouse onde não há bairro.
    m.on('mousemove', 'municipio-fundo', (e: maplibregl.MapLayerMouseEvent) => {
      if (m.queryRenderedFeatures(e.point, { layers: ['bairros-fill'] }).length > 0) return;
      popup.setLngLat(e.lngLat).setHTML(`<strong>Área rural / fora dos bairros</strong><div>${formatarNumero(atual.current.fora)} eleitor(es) captado(s)</div>`).addTo(m);
    });
    m.on('mouseleave', 'municipio-fundo', () => popup.remove());
    m.on('mouseleave', 'bairros-fill', () => {
      if (hover !== undefined) m.setFeatureState({ source: 'bairros', id: hover }, { hover: false });
      hover = undefined;
      popup.remove();
    });

    return () => { popup.remove(); m.remove(); mapa.current = null; atribuicao.current = null; setPronto(false); };
  }, [bairros, contorno]);

  // Cores por bairro.
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m || !bairros) return;
    const dados: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: bairros.features.map((f, i) => ({ ...f, properties: { ...f.properties, __i: i, __cor: corDe(contagem[i]) } })) };
    (m.getSource('bairros') as maplibregl.GeoJSONSource | undefined)?.setData(dados);
    m.setPaintProperty('bairros-fill', 'fill-opacity', camada === 'mapa_calor' ? (ruas ? 0.05 : 0.25) : ruas ? 0.55 : 0.85);
    // corDe depende só de contagem/maximo, já nas dependências.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, bairros, contagem, camada, ruas]);

  // Ruas (OpenStreetMap) só quando pedidas.
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    // Com o contorno, as ruas ficam abaixo dos bairros e o fundo rural some; sem ele, por cima de tudo.
    atribuicao.current = alternarRuas(m, ruas, m.getLayer('municipio-fundo') ? 'bairros-fill' : undefined, atribuicao.current);
    if (m.getLayer('municipio-fundo')) m.setLayoutProperty('municipio-fundo', 'visibility', ruas ? 'none' : 'visible');
  }, [pronto, ruas]);

  // Mapa de calor.
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    atualizarCalor(m, 'calor', camada === 'mapa_calor' && calor.length > 0 ? calor : null, {
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 18, 12, 32, 15, 60],
      'heatmap-opacity': 0.85,
    }, GRADIENTE_CALOR);
  }, [pronto, camada, calor]);

  if (erro) return <AvisoMapa erro={erro} emPreparo={emPreparo} textoPreparo="Preparando o mapa do município: buscando os bairros no IBGE (Censo 2022) e, se faltar, no OpenStreetMap. Leva até alguns minutos; o mapa aparece aqui sozinho." />;
  if (!bairros) return <Skeleton className="w-full" style={{ height: altura }} />;

  const semBairros = bairros.features.length === 0;
  /** Município em relevo (STL): cada bairro pela quantidade de eleitores captados. */
  const baixarStl = (): void => {
    const indice = new Map(bairros.features.map((f, i) => [f, i]));
    baixarArquivoStl(gerarStl(bairros.features, (f) => contagem[indice.get(f) ?? -1] ?? 0, { ...opcoesStl, escala }), `bairros-${codigoIbge}-eleitores.stl`);
  };
  const passos = CLASSES.map((cor, i) => ({ cor, de: Math.floor((i / CLASSES.length) * maximo) + 1, ate: Math.floor(((i + 1) / CLASSES.length) * maximo) }));
  const itensLegenda: ItemLegenda[] = camada === 'eleitores_bairro'
    ? [
      ...(contorno ? [{ cor: COR_FORA, chave: 'fora', rotulo: <>Área rural / fora dos bairros (<span className="font-mono tabular-nums">{formatarNumero(fora)}</span>)</> }] : []),
      { cor: SEM_ELEITORES, rotulo: 'Sem eleitores captados' },
      ...(maximo > 0 ? passos.filter((p) => p.ate >= p.de).map((p) => ({
        cor: p.cor, chave: p.cor,
        rotulo: <span className="font-mono tabular-nums">{p.de === p.ate ? formatarNumero(p.de) : `${formatarNumero(p.de)}–${formatarNumero(p.ate)}`}</span>,
      })) : []),
    ]
    : [{ cor: '#3b82f6', rotulo: 'Poucos eleitores' }, { cor: '#facc15', rotulo: 'Concentração média' }, { cor: '#ef4444', rotulo: 'Alta concentração' }];

  return (
    <div className="space-y-3">
      <MolduraMapa ref={container} altura={altura} pronto={pronto} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <LegendaMapa itens={itensLegenda} />
        <Button size="sm" variant="outline" aria-pressed={ruas} leftIcon={<MapIcon className="h-4 w-4" />} onClick={() => setRuas((r) => !r)}>
          {ruas ? 'Ocultar ruas' : 'Mostrar ruas'}
        </Button>
      </div>
      {!semBairros && contorno && <p className="text-xs text-muted-foreground">Os bairros vêm do IBGE (Censo 2022), que só delimita a área urbana; o restante do município aparece como área rural.</p>}
      {semBairros && <p className="text-sm text-muted-foreground">Este município não tem bairros delimitados no IBGE nem no OpenStreetMap: o mapa mostra o município inteiro.</p>}
      {camada === 'eleitores_bairro' && !semBairros && (
        <ControlesRelevo escala={escala} onEscala={setEscala} opcoes={opcoesStl} onOpcoes={setOpcoesStl} features={bairros.features} onBaixar={baixarStl} indicador="eleitores captados no bairro" />
      )}
      {camada === 'mapa_calor' && calor.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há eleitores captados com localização.</p>}
    </div>
  );
};
