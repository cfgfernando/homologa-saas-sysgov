import { useEffect, useRef, useState } from 'react';
import { erroApi } from '../../escola/api';
import { MALHA_EM_PREPARO } from '../maplibre';

/** Intervalo entre tentativas enquanto o servidor importa a malha (IBGE/TSE/OSM). */
const ESPERA_MS = 20000;

export interface DadosDoMapa<T> {
  dados: T | null;
  erro: string | null;
  /** O servidor ainda está preparando a malha: o hook tenta de novo sozinho. */
  emPreparo: boolean;
}

/**
 * Carrega os dados geográficos de um mapa. Se a API responder que a malha ainda não existe (importação em
 * andamento), mantém o aviso e tenta de novo a cada 20 s até chegar. Descarta respostas de chaves antigas.
 */
export function useDadosDoMapa<T>(chave: string, carregar: () => Promise<T>): DadosDoMapa<T> {
  const [estado, setEstado] = useState<DadosDoMapa<T>>({ dados: null, erro: null, emPreparo: false });
  const carregarAtual = useRef(carregar);
  carregarAtual.current = carregar;

  useEffect(() => {
    let cancelado = false;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const tentar = (): void => {
      carregarAtual.current().then((dados) => {
        if (!cancelado) setEstado({ dados, erro: null, emPreparo: false });
      }).catch((e) => {
        if (cancelado) return;
        const mensagem = erroApi(e).mensagem;
        const emPreparo = mensagem === MALHA_EM_PREPARO;
        setEstado({ dados: null, erro: mensagem, emPreparo });
        if (emPreparo) espera = setTimeout(tentar, ESPERA_MS);
      });
    };
    setEstado({ dados: null, erro: null, emPreparo: false });
    tentar();
    return () => { cancelado = true; clearTimeout(espera); };
  }, [chave]);

  return estado;
}
