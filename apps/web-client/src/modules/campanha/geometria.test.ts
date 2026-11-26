import { describe, expect, it } from 'vitest';
import { contarPorArea, dentro } from './geometria';
import { coordenadaValida, pontosParaGeoJSON } from './maplibre';

const quadrado = (x0: number, y0: number, x1: number, y1: number): GeoJSON.Feature => ({
  type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]] },
});

describe('geometria do mapa', () => {
  it('testa ponto dentro do polígono', () => {
    expect(dentro([0.5, 0.5], quadrado(0, 0, 1, 1).geometry)).toBe(true);
    expect(dentro([1.5, 0.5], quadrado(0, 0, 1, 1).geometry)).toBe(false);
  });

  it('soma eleitores por bairro e fora dos bairros, ignorando coordenadas inválidas', () => {
    const bairros = [quadrado(0, 0, 1, 1), quadrado(1, 0, 2, 1)];
    const municipio = quadrado(0, 0, 4, 4);
    const r = contarPorArea([[0.5, 0.5, 2], [0.5, 1.5, 3], [3, 3, 1], [NaN, 1, 9], [0, 0, 9], [10, 10, 4]], bairros, municipio);
    expect(r.porArea).toEqual([2, 3]);
    expect(r.fora).toBe(1);
  });

  it('valida coordenadas e gera GeoJSON em [lng, lat]', () => {
    expect(coordenadaValida(-27, -48)).toBe(true);
    expect(coordenadaValida(0, 0)).toBe(false);
    expect(coordenadaValida(95, 10)).toBe(false);
    const g = pontosParaGeoJSON([[-27, -48, 1], [Infinity, 0, 1], [-27, -48, 0]]);
    expect(g.features).toHaveLength(1);
    expect(g.features[0].geometry.coordinates).toEqual([-48, -27]);
  });
});
