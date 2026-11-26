import earcut from 'earcut';

/** Como o indicador vira altura: linear (proporcional) ou raiz (comprime os extremos, ex.: capital). */
export type EscalaAltura = 'linear' | 'raiz';

/** Opções do modelo para impressão 3D (medidas em milímetros). */
export interface OpcoesStl {
  /** Maior lado do modelo (largura ou profundidade), em mm. */
  ladoMaiorMm: number;
  /** Espessura da base sólida, comum a todas as áreas. */
  baseMm: number;
  /** Relevo da área de maior valor, acima da base. */
  relevoMaximoMm: number;
  /** Relevo mínimo acima da base (áreas com valor zero continuam visíveis e imprimíveis). */
  relevoMinimoMm: number;
  escala: EscalaAltura;
}

export const OPCOES_STL_PADRAO: OpcoesStl = { ladoMaiorMm: 200, baseMm: 3, relevoMaximoMm: 25, relevoMinimoMm: 0.6, escala: 'raiz' };

/** Limites dos controles da tela (também usados para sanear valores digitados). */
export const LIMITES_STL = {
  ladoMaiorMm: [50, 600],
  baseMm: [1, 20],
  relevoMaximoMm: [2, 150],
} as const satisfies Partial<Record<keyof OpcoesStl, readonly [number, number]>>;

const limitar = (v: number, [min, max]: readonly [number, number], padrao: number): number =>
  (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : padrao);

/** Opções com valores dentro dos limites (entrada do usuário). */
export function sanearOpcoes(o: Partial<OpcoesStl>): OpcoesStl {
  const p = OPCOES_STL_PADRAO;
  const relevoMaximoMm = limitar(o.relevoMaximoMm ?? p.relevoMaximoMm, LIMITES_STL.relevoMaximoMm, p.relevoMaximoMm);
  return {
    ladoMaiorMm: limitar(o.ladoMaiorMm ?? p.ladoMaiorMm, LIMITES_STL.ladoMaiorMm, p.ladoMaiorMm),
    baseMm: limitar(o.baseMm ?? p.baseMm, LIMITES_STL.baseMm, p.baseMm),
    relevoMaximoMm,
    relevoMinimoMm: Math.min(relevoMaximoMm / 2, Math.max(0.2, o.relevoMinimoMm ?? p.relevoMinimoMm)),
    escala: o.escala === 'linear' ? 'linear' : 'raiz',
  };
}

/** Fração 0..1 da altura de um valor em relação ao máximo, na escala escolhida (mesma regra do mapa 3D). */
export function fracaoDaAltura(valor: number, maximo: number, escala: EscalaAltura): number {
  if (!(maximo > 0) || !(valor > 0)) return 0;
  const f = Math.min(1, valor / maximo);
  return escala === 'raiz' ? Math.sqrt(f) : f;
}

type Ponto = [number, number];
type Anel = Ponto[];

/** Área com sinal (fórmula do laço): > 0 = anti-horário. */
const areaComSinal = (anel: Anel): number => {
  let a = 0;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) a += (anel[j][0] - anel[i][0]) * (anel[j][1] + anel[i][1]);
  return a / 2;
};

/** Polígonos (anel externo + buracos) de uma geometria GeoJSON; Polygon, MultiPolygon e coleções. */
function poligonos(g: GeoJSON.Geometry | null | undefined): number[][][][] {
  if (!g) return [];
  if (g.type === 'Polygon') return [g.coordinates];
  if (g.type === 'MultiPolygon') return g.coordinates;
  if (g.type === 'GeometryCollection') return g.geometries.flatMap(poligonos);
  return [];
}

/**
 * Projeção de Mercator (conforme: preserva a forma local), em radianos. Para uma UF ou município a variação de
 * escala dentro do recorte é pequena e o resultado é reescalado para milímetros, então dispensa UTM.
 */
const mercator = ([lon, lat]: number[]): Ponto => {
  const phi = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  return [(lon * Math.PI) / 180, Math.log(Math.tan(Math.PI / 4 + phi / 2))];
};

interface Enquadramento { minX: number; minY: number; largura: number; profundidade: number; mmPorUnidade: number }

function enquadrar(features: readonly GeoJSON.Feature[], ladoMaiorMm: number): Enquadramento | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of features) for (const p of poligonos(f.geometry)) for (const c of p[0] ?? []) {
    const [x, y] = mercator(c);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  if (!Number.isFinite(minX) || maxX - minX + (maxY - minY) <= 0) return null;
  const mmPorUnidade = ladoMaiorMm / Math.max(maxX - minX, maxY - minY);
  return { minX, minY, largura: (maxX - minX) * mmPorUnidade, profundidade: (maxY - minY) * mmPorUnidade, mmPorUnidade };
}

/**
 * Anel limpo em mm: sem o ponto de fechamento, sem pontos repetidos nem colineares exatos (o earcut descarta
 * esses pontos nas tampas; se as paredes os usassem, a malha teria fendas em "T"), na orientação pedida.
 */
function limparAnel(anel: number[][], projetar: (c: number[]) => Ponto, antiHorario: boolean): Anel | null {
  const pts: Anel = [];
  for (const c of anel) {
    const p = projetar(c);
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    const u = pts[pts.length - 1];
    if (!u || u[0] !== p[0] || u[1] !== p[1]) pts.push(p);
  }
  while (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
  let mudou = true;
  while (mudou && pts.length >= 3) {
    mudou = false;
    for (let i = 0; i < pts.length && pts.length >= 3; i++) {
      const a = pts[(i + pts.length - 1) % pts.length], b = pts[i], c = pts[(i + 1) % pts.length];
      const cruz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (cruz === 0 || (a[0] === c[0] && a[1] === c[1])) { pts.splice(i, 1); mudou = true; i--; }
    }
  }
  if (pts.length < 3) return null;
  const area = areaComSinal(pts);
  if (area === 0) return null;
  if ((area > 0) !== antiHorario) pts.reverse();
  return pts;
}

/**
 * Malha triangular (9 floats por triângulo, mm) com as áreas em relevo. Cada polígono vira um prisma fechado
 * (tampa de cima, tampa de baixo e paredes) de z = 0 até base + relevo: a base sólida é a própria parte de
 * baixo dos prismas. Normais para fora pela regra da mão direita (vértices anti-horários vistos de fora).
 * Áreas vizinhas são cascas fechadas independentes que se tocam nas divisas; os fatiadores as unem.
 */
export function malhaStl(features: readonly GeoJSON.Feature[], valorDe: (f: GeoJSON.Feature) => number, opcoes: Partial<OpcoesStl> = {}): Float32Array {
  const o = sanearOpcoes(opcoes);
  const quadro = enquadrar(features, o.ladoMaiorMm);
  if (!quadro) return new Float32Array(0);
  const projetar = (c: number[]): Ponto => {
    const [x, y] = mercator(c);
    return [(x - quadro.minX) * quadro.mmPorUnidade, (y - quadro.minY) * quadro.mmPorUnidade];
  };
  const valores = features.map((f) => Math.max(0, Number(valorDe(f)) || 0));
  const maximo = Math.max(0, ...valores);

  const saida: number[] = [];
  const tri = (a: number[], b: number[], c: number[]): void => { saida.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };

  features.forEach((f, k) => {
    const topo = o.baseMm + o.relevoMinimoMm + fracaoDaAltura(valores[k], maximo, o.escala) * (o.relevoMaximoMm - o.relevoMinimoMm);
    for (const poligono of poligonos(f.geometry)) {
      const externo = poligono[0] ? limparAnel(poligono[0], projetar, true) : null;
      if (!externo) continue;
      const aneis: Anel[] = [externo, ...poligono.slice(1).map((a) => limparAnel(a, projetar, false)).filter((a): a is Anel => a !== null)];

      const plano: number[] = [];
      const buracos: number[] = [];
      aneis.forEach((anel, i) => { if (i > 0) buracos.push(plano.length / 2); anel.forEach(([x, y]) => plano.push(x, y)); });
      const indices = earcut(plano, buracos, 2);
      const v = (i: number, z: number): number[] => [plano[i * 2], plano[i * 2 + 1], z];
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i], b = indices[i + 1], c = indices[i + 2];
        const cruz = (plano[b * 2] - plano[a * 2]) * (plano[c * 2 + 1] - plano[a * 2 + 1]) - (plano[b * 2 + 1] - plano[a * 2 + 1]) * (plano[c * 2] - plano[a * 2]);
        const [p, q] = cruz > 0 ? [b, c] : [c, b];
        tri(v(a, topo), v(p, topo), v(q, topo)); // topo: normal +z
        tri(v(a, 0), v(q, 0), v(p, 0)); // fundo: normal -z
      }

      // Paredes: externo anti-horário e buracos horários → normal à direita do sentido = para fora do sólido.
      for (const anel of aneis) {
        for (let i = 0; i < anel.length; i++) {
          const [x1, y1] = anel[i];
          const [x2, y2] = anel[(i + 1) % anel.length];
          tri([x1, y1, 0], [x2, y2, 0], [x2, y2, topo]);
          tri([x1, y1, 0], [x2, y2, topo], [x1, y1, topo]);
        }
      }
    }
  });
  return new Float32Array(saida);
}

/** STL binário: cabeçalho de 80 bytes, contagem (uint32 LE) e 50 bytes por triângulo (normal + 3 vértices). */
export function stlBinario(triangulos: Float32Array, cabecalho = 'SYSGOV Campanha - mapa em relevo (mm)'): ArrayBuffer {
  const total = Math.floor(triangulos.length / 9);
  const buffer = new ArrayBuffer(84 + total * 50);
  const dv = new DataView(buffer);
  for (let i = 0; i < 80; i++) dv.setUint8(i, i < cabecalho.length ? cabecalho.charCodeAt(i) & 0x7f : 0x20);
  dv.setUint32(80, total, true);
  let off = 84;
  for (let t = 0; t < total; t++) {
    const k = t * 9;
    const ax = triangulos[k], ay = triangulos[k + 1], az = triangulos[k + 2];
    const ux = triangulos[k + 3] - ax, uy = triangulos[k + 4] - ay, uz = triangulos[k + 5] - az;
    const wx = triangulos[k + 6] - ax, wy = triangulos[k + 7] - ay, wz = triangulos[k + 8] - az;
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    dv.setFloat32(off, nx, true); dv.setFloat32(off + 4, ny, true); dv.setFloat32(off + 8, nz, true);
    off += 12;
    for (let j = 0; j < 9; j++) { dv.setFloat32(off, triangulos[k + j], true); off += 4; }
    dv.setUint16(off, 0, true); off += 2;
  }
  return buffer;
}

/** STL binário pronto para download. */
export function gerarStl(features: readonly GeoJSON.Feature[], valorDe: (f: GeoJSON.Feature) => number, opcoes: Partial<OpcoesStl> = {}): Blob {
  return new Blob([stlBinario(malhaStl(features, valorDe, opcoes))], { type: 'model/stl' });
}

/** Dimensões finais do modelo (mm), para mostrar ao usuário. */
export function dimensoesStl(features: readonly GeoJSON.Feature[], opcoes: Partial<OpcoesStl> = {}): { largura: number; profundidade: number; altura: number } | null {
  const o = sanearOpcoes(opcoes);
  const q = enquadrar(features, o.ladoMaiorMm);
  if (!q) return null;
  return { largura: Math.round(q.largura), profundidade: Math.round(q.profundidade), altura: Math.round((o.baseMm + o.relevoMaximoMm) * 10) / 10 };
}

/** Dispara o download do STL no navegador. */
export function baixarArquivoStl(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
