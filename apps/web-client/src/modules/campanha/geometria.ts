import { type Limites, limitesDe, pontosValidos } from './maplibre';


/** Ponto [lng, lat] dentro de polígono (anel externo + buracos), regra par/ímpar. */
export function dentro([x, y]: [number, number], g: GeoJSON.Geometry | null): boolean {
  if (!g) return false;
  const poligonos = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return poligonos.some((aneis) => {
    let c = false;
    for (const anel of aneis) {
      for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
        const [xi, yi] = anel[i];
        const [xj, yj] = anel[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
    }
    return c;
  });
}

const naCaixa = ([x, y]: [number, number], b: Limites | null): boolean => b !== null && x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3];

export interface ContagemPorArea {
  /** Soma dos pesos por feição, na mesma ordem de `areas.features`. */
  porArea: number[];
  /** Soma dos pesos dentro do contorno mas fora de todas as áreas (ex.: zona rural). */
  fora: number;
}

/**
 * Soma os pesos dos pontos [lat, lng, peso] por polígono em uma única passada. Cada ponto conta para a primeira
 * área que o contém (bairros não se sobrepõem); a caixa envolvente de cada área descarta a maioria dos testes
 * de polígono, o que mantém a conta rápida com milhares de pontos. Coordenadas inválidas são ignoradas.
 */
export function contarPorArea(pontos: readonly (readonly [number, number, number])[], areas: GeoJSON.Feature[], contorno: GeoJSON.Feature | null): ContagemPorArea {
  const caixas = areas.map((f) => limitesDe([f]));
  const caixaContorno = contorno ? limitesDe([contorno]) : null;
  const porArea = areas.map(() => 0);
  let fora = 0;
  for (const [lat, lng, peso] of pontosValidos(pontos)) {
    const p: [number, number] = [lng, lat];
    const i = areas.findIndex((f, k) => naCaixa(p, caixas[k]) && dentro(p, f.geometry));
    if (i >= 0) porArea[i] += peso;
    else if (contorno && naCaixa(p, caixaContorno) && dentro(p, contorno.geometry)) fora += peso;
  }
  return { porArea, fora };
}
