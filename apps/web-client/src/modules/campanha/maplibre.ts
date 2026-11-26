import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import urlDoWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { campanhaApi } from './api';

// O Vite empacota o maplibre-gl e perde o caminho relativo do worker ("Worker failed to load"):
// o arquivo do worker é servido como asset e informado explicitamente.
maplibregl.setWorkerUrl(urlDoWorker);

export { maplibregl };

/** Estilo sem mapa de fundo: nenhuma requisição externa (D7). */
export const ESTILO_VAZIO: maplibregl.StyleSpecification = { version: 8, sources: {}, layers: [{ id: 'fundo', type: 'background', paint: { 'background-color': 'rgba(0,0,0,0)' } }] };

/** Malha por UF guardada na sessão da tela (o servidor também responde com ETag). */
const malhas = new Map<string, Promise<GeoJSON.FeatureCollection>>();

export function carregarMalha(uf: string): Promise<GeoJSON.FeatureCollection> {
  if (!malhas.has(uf)) {
    const pedido = campanhaApi.malha(uf);
    pedido.catch(() => malhas.delete(uf));
    malhas.set(uf, pedido);
  }
  return malhas.get(uf) as Promise<GeoJSON.FeatureCollection>;
}

/** Limites [oeste, sul, leste, norte] calculados a partir das coordenadas das feições. */
export type Limites = [number, number, number, number];

export function limitesDe(features: GeoJSON.Feature[]): Limites | null {
  let o = Infinity, s = Infinity, l = -Infinity, n = -Infinity;
  const visitar = (c: unknown): void => {
    if (!Array.isArray(c)) return;
    if (typeof c[0] === 'number') {
      const [x, y] = c as number[];
      o = Math.min(o, x); l = Math.max(l, x); s = Math.min(s, y); n = Math.max(n, y);
      return;
    }
    c.forEach(visitar);
  };
  const geometria = (g: GeoJSON.Geometry | null): void => {
    if (!g) return;
    if (g.type === 'GeometryCollection') g.geometries.forEach(geometria);
    else visitar(g.coordinates);
  };
  features.forEach((f) => geometria(f.geometry));
  return Number.isFinite(o) ? [o, s, l, n] : null;
}

export const escapar = (t: string): string => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** Mensagem da API quando a malha/bairros ainda estão sendo importados (o servidor já agendou a importação). */
export const MALHA_EM_PREPARO = 'Registro não encontrado.';

/** Coordenada utilizável no mapa: finita, dentro do intervalo WGS84 e diferente de (0, 0) (geocodificação vazia). */
export const coordenadaValida = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

/** Pontos [lat, lng, peso] com coordenada válida e peso positivo (descarta lixo antes de desenhar ou contar). */
export const pontosValidos = <T extends readonly [number, number, number]>(pontos: readonly T[]): T[] =>
  pontos.filter(([lat, lng, peso]) => coordenadaValida(lat, lng) && Number.isFinite(peso) && peso > 0);

/** Pontos [lat, lng, peso] como GeoJSON (ordem do GeoJSON: [lng, lat]). */
export function pontosParaGeoJSON(pontos: readonly (readonly [number, number, number])[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: pontosValidos(pontos).map(([lat, lng, peso]) => ({ type: 'Feature', properties: { peso }, geometry: { type: 'Point', coordinates: [lng, lat] } })),
  };
}

/** Maior peso entre os pontos (mínimo 1), para normalizar o heatmap-weight. */
export const pesoMaximo = (pontos: readonly (readonly [number, number, number])[]): number =>
  pontos.reduce((m, p) => (p[2] > m ? p[2] : m), 1);

/** heatmap-color a partir de GRADIENTE_CALOR, com densidade 0 transparente. */
export function corDoCalor(gradiente: Record<string | number, string>): maplibregl.ExpressionSpecification {
  const paradas = Object.entries(gradiente).map(([k, cor]) => [Number(k), cor] as const).sort((a, b) => a[0] - b[0]);
  const expr: unknown[] = ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)'];
  paradas.forEach(([k, cor]) => { if (k > 0) expr.push(k, cor); });
  return expr as maplibregl.ExpressionSpecification;
}

/** Ruas do OpenStreetMap (única requisição externa do mapa, só quando o usuário pede). */
export const FONTE_RUAS_OSM: maplibregl.RasterSourceSpecification = {
  type: 'raster',
  tiles: ['a', 'b', 'c'].map((s) => `https://${s}.tile.openstreetmap.org/{z}/{x}/{y}.png`),
  tileSize: 256,
  maxzoom: 19,
  attribution: '&copy; OpenStreetMap',
};

/** Contorno de linha com destaque no hover (feature-state). */
export const corDaBorda = (normal: string): maplibregl.ExpressionSpecification => ['case', ['boolean', ['feature-state', 'hover'], false], '#0c326f', normal];
export const larguraDaBorda = (normal: number, destaque: number): maplibregl.ExpressionSpecification => ['case', ['boolean', ['feature-state', 'hover'], false], destaque, normal];



/** Cria o mapa sem fundo, enquadrado nos limites, com zoom/arrasto e botões de zoom (o chamador faz `remove()`). */
export function criarMapa(container: HTMLElement, limites: Limites | null, padding: number): maplibregl.Map {
  const m = new maplibregl.Map({ container, style: ESTILO_VAZIO, bounds: limites ?? undefined, fitBoundsOptions: { padding }, attributionControl: false });
  m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
  return m;
}

/**
 * Liga/desliga as ruas do OpenStreetMap abaixo de `antesDe`. Devolve o controle de atribuição criado (ou null
 * ao desligar) para o chamador guardar; idempotente.
 */
export function alternarRuas(m: maplibregl.Map, ligar: boolean, antesDe: string | undefined, atribuicao: maplibregl.AttributionControl | null): maplibregl.AttributionControl | null {
  if (ligar && !m.getSource(ID_RUAS)) {
    m.addSource(ID_RUAS, FONTE_RUAS_OSM);
    m.addLayer({ id: ID_RUAS, type: 'raster', source: ID_RUAS }, antesDe && m.getLayer(antesDe) ? antesDe : undefined);
    const controle = new maplibregl.AttributionControl({ compact: false });
    m.addControl(controle, 'bottom-right');
    return controle;
  }
  if (!ligar && m.getSource(ID_RUAS)) {
    if (atribuicao) m.removeControl(atribuicao);
    if (m.getLayer(ID_RUAS)) m.removeLayer(ID_RUAS);
    m.removeSource(ID_RUAS);
    return null;
  }
  return atribuicao;
}
const ID_RUAS = 'ruas';

/**
 * Mantém (ou remove, com `pontos` null) a camada de heatmap `id` com os pontos válidos. O heatmap agrega na
 * GPU, então aguenta dezenas de milhares de pontos sem precisar de cluster.
 */
export function atualizarCalor(m: maplibregl.Map, id: string, pontos: readonly (readonly [number, number, number])[] | null, paint: Omit<maplibregl.HeatmapLayerSpecification['paint'] & object, 'heatmap-weight' | 'heatmap-color'>, gradiente: Record<string | number, string>): void {
  if (!pontos) {
    if (m.getLayer(id)) m.removeLayer(id);
    if (m.getSource(id)) m.removeSource(id);
    return;
  }
  const dados = pontosParaGeoJSON(pontos);
  const peso: maplibregl.ExpressionSpecification = ['interpolate', ['linear'], ['get', 'peso'], 0, 0, pesoMaximo(pontosValidos(pontos)), 1];
  const fonte = m.getSource(id) as maplibregl.GeoJSONSource | undefined;
  if (fonte) fonte.setData(dados);
  else m.addSource(id, { type: 'geojson', data: dados });
  if (m.getLayer(id)) m.setPaintProperty(id, 'heatmap-weight', peso);
  else m.addLayer({ id, type: 'heatmap', source: id, paint: { ...paint, 'heatmap-weight': peso, 'heatmap-color': corDoCalor(gradiente) } });
}
