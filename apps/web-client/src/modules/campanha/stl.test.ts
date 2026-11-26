import { describe, expect, it } from 'vitest';
import { dimensoesStl, fracaoDaAltura, malhaStl, stlBinario } from './stl';

const feicao = (geometry: GeoJSON.Geometry, valor = 0): GeoJSON.Feature => ({ type: 'Feature', properties: { valor }, geometry });
const valor = (f: GeoJSON.Feature): number => Number(f.properties?.valor ?? 0);

/** Em uma malha fechada e orientada, cada aresta dirigida aparece uma vez e a inversa também uma vez. */
function arestasFechadas(t: Float32Array): boolean {
  const chave = (i: number): string => `${t[i]},${t[i + 1]},${t[i + 2]}`;
  const contagem = new Map<string, number>();
  for (let k = 0; k < t.length; k += 9) {
    const v = [chave(k), chave(k + 3), chave(k + 6)];
    for (let j = 0; j < 3; j++) {
      const a = `${v[j]}>${v[(j + 1) % 3]}`;
      contagem.set(a, (contagem.get(a) ?? 0) + 1);
    }
  }
  for (const [a, n] of contagem) {
    const [x, y] = a.split('>');
    if (n !== 1 || contagem.get(`${y}>${x}`) !== 1) return false;
  }
  return true;
}

/** Volume com sinal (teorema da divergência): > 0 quando as normais apontam para fora. */
function volume(t: Float32Array): number {
  let v = 0;
  for (let k = 0; k < t.length; k += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = t.slice(k, k + 9);
    v += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
  }
  return v;
}

const quadrado: GeoJSON.Polygon = { type: 'Polygon', coordinates: [[[-50, -20], [-49.9, -20], [-49.9, -19.9], [-50, -19.9], [-50, -20]]] };
// "L" côncavo, em sentido horário (deve ser reorientado) e com ponto repetido e ponto colinear.
const emL: GeoJSON.Polygon = { type: 'Polygon', coordinates: [[[-49, -20], [-49, -19.8], [-48.9, -19.8], [-48.9, -19.9], [-48.8, -19.9], [-48.8, -20], [-48.8, -20], [-48.9, -20], [-49, -20]]] };
const comFuro: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [[-48, -20], [-47.8, -20], [-47.8, -19.8], [-48, -19.8], [-48, -20]],
    [[-47.95, -19.95], [-47.95, -19.85], [-47.85, -19.85], [-47.85, -19.95], [-47.95, -19.95]],
  ],
};
const multi: GeoJSON.MultiPolygon = { type: 'MultiPolygon', coordinates: [quadrado.coordinates.map((a) => a.map(([x, y]) => [x, y - 1])), comFuro.coordinates.map((a) => a.map(([x, y]) => [x, y - 1]))] };

describe('stl', () => {
  it('quadrado vira prisma fechado com 4n-4 triângulos', () => {
    const t = malhaStl([feicao(quadrado, 10)], valor);
    expect(t.length / 9).toBe(4 * 4 - 4);
    expect(arestasFechadas(t)).toBe(true);
    expect(volume(t)).toBeGreaterThan(0);
  });

  it('polígono côncavo, colinear e horário continua fechado e com normais para fora', () => {
    const t = malhaStl([feicao(emL, 5)], valor);
    expect(t.length / 9).toBe(4 * 6 - 4); // 6 vértices úteis após a limpeza
    expect(arestasFechadas(t)).toBe(true);
    expect(volume(t)).toBeGreaterThan(0);
  });

  it('furos e MultiPolygon geram cascas fechadas', () => {
    const t = malhaStl([feicao(comFuro, 3), feicao(multi, 0), feicao(emL, 9)], valor);
    expect(t.length / 9).toBe(4 * 8 + (4 * 4 - 4) + 4 * 8 + (4 * 6 - 4));
    expect(arestasFechadas(t)).toBe(true);
    expect(volume(t)).toBeGreaterThan(0);
  });

  it('respeita lado maior, base e relevo mínimo para valor zero', () => {
    const opcoes = { ladoMaiorMm: 120, baseMm: 2, relevoMaximoMm: 20, relevoMinimoMm: 0.5, escala: 'linear' as const };
    const t = malhaStl([feicao(quadrado, 0), feicao(emL, 100)], valor, opcoes);
    let maxX = 0, maxY = 0;
    const alturas = new Set<number>();
    for (let i = 0; i < t.length; i += 3) { maxX = Math.max(maxX, t[i]); maxY = Math.max(maxY, t[i + 1]); alturas.add(Math.round(t[i + 2] * 100) / 100); }
    expect(Math.max(maxX, maxY)).toBeCloseTo(120, 3);
    expect([...alturas].sort((a, b) => a - b)).toEqual([0, 2.5, 22]);
    expect(dimensoesStl([feicao(quadrado), feicao(emL)], opcoes)?.altura).toBe(22);
  });

  it('escala raiz e linear', () => {
    expect(fracaoDaAltura(25, 100, 'linear')).toBe(0.25);
    expect(fracaoDaAltura(25, 100, 'raiz')).toBe(0.5);
    expect(fracaoDaAltura(0, 0, 'raiz')).toBe(0);
  });

  it('STL binário: cabeçalho de 80 bytes, contagem e 50 bytes por triângulo', () => {
    const t = malhaStl([feicao(quadrado, 1)], valor);
    const buf = stlBinario(t);
    const dv = new DataView(buf);
    expect(buf.byteLength).toBe(84 + 12 * 50);
    expect(dv.getUint32(80, true)).toBe(12);
    expect(String.fromCharCode(...new Uint8Array(buf, 0, 5))).toBe('SYSGO');
    // Normal do primeiro triângulo (tampa de cima) aponta para +z.
    expect(dv.getFloat32(84 + 8, true)).toBeCloseTo(1, 5);
  });

  it('coleção vazia não gera triângulos', () => {
    expect(malhaStl([], valor).length).toBe(0);
    expect(dimensoesStl([])).toBeNull();
  });
});
