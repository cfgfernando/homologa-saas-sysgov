import React, { useEffect, useRef, useState } from 'react';
import { Box, Map as MapIcon } from 'lucide-react';
import { Button, Skeleton } from '@sysgov/ui';
import { alternarRuas, atualizarCalor, carregarMalha, corDaBorda, criarMapa, escapar, larguraDaBorda, limitesDe, maplibregl } from '../maplibre';
import { useDadosDoMapa } from '../hooks/useDadosDoMapa';
import { AvisoMapa, LegendaMapa, MolduraMapa } from './MolduraMapa';
import { type Camada, type Faixas, type PontoCalor, type PontoMapa, type Situacao } from '../api';
import { OPCOES_STL_PADRAO, baixarArquivoStl, gerarStl, type EscalaAltura, type OpcoesStl } from '../stl';
import { ControlesRelevo, expressaoAltura } from './ControlesRelevo';
import { GRADIENTE_CALOR, corDoMunicipio, dicaDoMunicipio, legenda } from '../formato';

interface Props {
  uf: string;
  pontos: Record<string, PontoMapa>;
  camada: Camada;
  cores: Record<Situacao, string>;
  faixas: Faixas;
  onSelecionar: (ibge: number) => void;
  altura?: number;
  /** Camada "Mapa de calor": pontos arredondados e agregados pelo servidor. */
  calor?: PontoCalor[];
  /** Eleitores captados por município (dica da camada de calor). */
  captados?: Record<number, number>;
}

const FONTE_MALHA = 'malha';
const CAMADA_PREENCHIMENTO = 'municipios-preenchimento';
const CAMADA_CONTORNO = 'municipios-contorno';
const CAMADA_CALOR = 'calor';
const CAMADA_3D = 'municipios-3d';


/**
 * Mapa dos municípios da UF (D7) em MapLibre GL: sem mapa de fundo (nenhuma requisição externa), zoom e
 * arrasto, cor por camada, dica ao passar o mouse e clique que abre a ficha do município.
 */
export const MapaCampanha: React.FC<Props> = ({ uf, pontos, camada, cores, faixas, onSelecionar, altura = 540, calor, captados }) => {
  // Malha ausente: o servidor já agendou a importação da UF (IBGE/TSE); o hook tenta de novo a cada 20 s.
  const { dados: malha, erro, emPreparo } = useDadosDoMapa(uf, () => carregarMalha(uf));
  // Mapa de ruas (OpenStreetMap) só quando o usuário pede: é a única requisição externa do mapa.
  const [ruas, setRuas] = useState(false);
  const [pronto, setPronto] = useState(false);
  // Modo 3D: municípios extrudados pela altura do eleitorado (TSE), cor da camada escolhida.
  const [tresD, setTresD] = useState(false);
  // Relevo (3D e STL): mesma escala nos dois; exagero só na tela, medidas em mm só no STL.
  const [escala, setEscala] = useState<EscalaAltura>('raiz');
  const [exagero, setExagero] = useState(1.5);
  const [opcoesStl, setOpcoesStl] = useState<OpcoesStl>(OPCOES_STL_PADRAO);
  const container = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const atribuicao = useRef<maplibregl.AttributionControl | null>(null);
  // Valores atuais lidos pelos eventos do mapa (criados uma vez por malha).
  const atual = useRef({ pontos, camada, captados, onSelecionar });
  atual.current = { pontos, camada, captados, onSelecionar };

  // Cria o mapa uma vez por malha.
  useEffect(() => {
    if (!malha || !container.current) return;
    const limites = limitesDe(malha.features);
    const m = criarMapa(container.current, limites, 12);
    mapa.current = m;

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '280px', offset: 12 });
    let hover: string | number | undefined;
    const limparHover = (): void => {
      if (hover !== undefined) m.setFeatureState({ source: FONTE_MALHA, id: hover }, { hover: false });
      hover = undefined;
    };

    m.on('load', () => {
      m.addSource(FONTE_MALHA, { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, promoteId: 'codarea' });
      m.addLayer({ id: CAMADA_PREENCHIMENTO, type: 'fill', source: FONTE_MALHA, paint: { 'fill-color': ['coalesce', ['get', '__cor'], '#cbd5e1'], 'fill-opacity': 0.85 } });
      m.addLayer({
        id: CAMADA_CONTORNO, type: 'line', source: FONTE_MALHA,
        paint: {
          'line-color': corDaBorda('#ffffff'),
          'line-width': larguraDaBorda(0.7, 2.2),
        },
      });
      m.addLayer({
        id: CAMADA_3D, type: 'fill-extrusion', source: FONTE_MALHA, layout: { visibility: 'none' },
        paint: {
          'fill-extrusion-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#0c326f', ['coalesce', ['get', '__cor'], '#cbd5e1']],
          'fill-extrusion-height': 0,
          'fill-extrusion-opacity': 0.95,
          'fill-extrusion-vertical-gradient': true,
        },
      });
      // Luz fixa ao mapa (vem do noroeste, convenção cartográfica): faces sombreadas destacam os degraus.
      m.setLight({ anchor: 'map', position: [1.4, 315, 50], intensity: 0.35, color: '#ffffff' });
      if (limites) m.fitBounds(limites, { padding: 12, animate: false });
      setPronto(true);
    });

    m.on('mousemove', CAMADA_PREENCHIMENTO, (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      m.getCanvas().style.cursor = 'pointer';
      if (f.id !== hover) {
        limparHover();
        hover = f.id;
        if (hover !== undefined) m.setFeatureState({ source: FONTE_MALHA, id: hover }, { hover: true });
      }
      const ibge = String(f.properties?.codarea);
      const { pontos: p, camada: c, captados: cap } = atual.current;
      const ponto = p[ibge];
      const linhas = dicaDoMunicipio(ponto, c, cap?.[Number(ibge)]).map((l) => `<div>${escapar(l)}</div>`).join('');
      popup.setLngLat(e.lngLat)
        .setHTML(`<strong>${escapar(ponto?.nome ?? ibge)}</strong>${linhas}<div style="opacity:.7;margin-top:4px">Clique para abrir a ficha</div>`)
        .addTo(m);
    });
    m.on('mouseleave', CAMADA_PREENCHIMENTO, () => {
      m.getCanvas().style.cursor = '';
      limparHover();
      popup.remove();
    });
    m.on('click', CAMADA_PREENCHIMENTO, (e: maplibregl.MapLayerMouseEvent) => {
      const codarea = e.features?.[0]?.properties?.codarea;
      if (codarea !== undefined) atual.current.onSelecionar(Number(codarea));
    });

    return () => {
      popup.remove();
      m.remove();
      mapa.current = null;
      atribuicao.current = null;
      setPronto(false);
    };
  }, [malha]);

  // Cores dos municípios: clona as features com a cor calculada no front.
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m || !malha) return;
    const dados: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: malha.features.map((f) => ({
        ...f,
        properties: { ...f.properties, __cor: corDoMunicipio(pontos[String(f.properties?.codarea)], camada, cores, faixas), __eleitores: pontos[String(f.properties?.codarea)]?.eleitores ?? 0 },
      })),
    };
    (m.getSource(FONTE_MALHA) as maplibregl.GeoJSONSource | undefined)?.setData(dados);
  }, [pronto, malha, pontos, camada, cores, faixas]);

  // Ruas, opacidade e contorno.
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    atribuicao.current = alternarRuas(m, ruas, CAMADA_PREENCHIMENTO, atribuicao.current);
    m.setPaintProperty(CAMADA_PREENCHIMENTO, 'fill-opacity', ruas ? (camada === 'mapa_calor' ? 0.05 : 0.55) : 0.85);
    const borda = camada === 'mapa_calor' && ruas ? '#64748b' : '#ffffff';
    m.setPaintProperty(CAMADA_CONTORNO, 'line-color', corDaBorda(borda));
  }, [pronto, ruas, camada]);

  /** Baixa a UF em relevo (STL binário em mm) com a mesma escala de altura do 3D. */
  const baixarStl = (): void => {
    if (!malha) return;
    baixarArquivoStl(gerarStl(malha.features, (f) => pontos[String(f.properties?.codarea)]?.eleitores ?? 0, { ...opcoesStl, escala }), `mapa-${uf.toLowerCase()}-eleitorado.stl`);
  };
  const maiorEleitorado = Math.max(0, ...Object.values(pontos).map((p) => p.eleitores ?? 0));

  // Modo 3D: liga a extrusão, inclina a câmera e esconde o preenchimento plano (que segue recebendo o mouse).
  const em3D = tresD && camada !== 'mapa_calor';
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    m.setLayoutProperty(CAMADA_3D, 'visibility', em3D ? 'visible' : 'none');
    // O contorno fica visível no 3D: desenha as divisas no chão, entre as bases dos prismas.
    m.setPaintProperty(CAMADA_PREENCHIMENTO, 'fill-opacity', em3D ? 0 : ruas ? (camada === 'mapa_calor' ? 0.05 : 0.55) : 0.85);
    m.easeTo({ pitch: em3D ? 50 : 0, bearing: em3D ? -15 : 0, duration: 900 });
  }, [pronto, em3D, ruas, camada]);

  // Altura da extrusão: mesma escala (linear/raiz) do STL, com exagero vertical ajustável.
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    m.setPaintProperty(CAMADA_3D, 'fill-extrusion-height', expressaoAltura('__eleitores', maiorEleitorado, escala, exagero) as maplibregl.ExpressionSpecification);
  }, [pronto, maiorEleitorado, escala, exagero]);

  // Mapa de calor (D6): heatmap nativo sobre a malha.
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    atualizarCalor(m, CAMADA_CALOR, camada === 'mapa_calor' && calor ? calor : null, {
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 1, 10, 2],
      // Raio visível no zoom da UF (6–7) e crescendo ao aproximar.
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 14, 6, 22, 7, 28, 10, 45],
      'heatmap-opacity': 0.85,
    }, GRADIENTE_CALOR);
  }, [pronto, camada, calor]);

  if (erro) return <AvisoMapa erro={erro} emPreparo={emPreparo} textoPreparo={`Preparando o mapa de ${uf}: buscando municípios, malha e eleitorado no IBGE e no TSE. Isso leva alguns minutos; o mapa aparece aqui sozinho.`} />;
  if (!malha) return <Skeleton className="w-full" style={{ height: altura }} />;

  return (
    <div className="space-y-3">
      <MolduraMapa ref={container} altura={altura} pronto={pronto} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <LegendaMapa itens={legenda(camada, cores, faixas)} />
        <div className="flex flex-wrap gap-2">
        {camada !== 'mapa_calor' && (
          <Button size="sm" variant={tresD ? 'primary' : 'outline'} aria-pressed={tresD} leftIcon={<Box className="h-4 w-4" />} onClick={() => setTresD((v) => !v)}>
            {tresD ? 'Voltar ao 2D' : 'Ver em 3D'}
          </Button>
        )}
        <Button size="sm" variant="outline" aria-pressed={ruas} leftIcon={<MapIcon className="h-4 w-4" />} onClick={() => setRuas((r) => !r)}>
          {ruas ? 'Ocultar ruas' : 'Mostrar ruas'}
        </Button>
        </div>
      </div>
      {em3D && <p className="text-xs text-muted-foreground">Altura de cada município proporcional ao eleitorado (TSE); cor pela camada da legenda. Arraste com o botão direito (ou Ctrl + arrastar) para girar e inclinar; passe o mouse para ver o nome.</p>}
      {camada !== 'mapa_calor' && (
        <ControlesRelevo
          escala={escala} onEscala={setEscala} exagero={em3D ? exagero : undefined} onExagero={setExagero}
          opcoes={opcoesStl} onOpcoes={setOpcoesStl} features={malha.features} onBaixar={baixarStl} indicador="eleitorado (TSE)"
        />
      )}
      {camada === 'mapa_calor' && calor?.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há eleitores captados com localização.</p>}
    </div>
  );
};
