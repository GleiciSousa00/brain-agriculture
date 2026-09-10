import type { Painel, Safra } from '@cadastro-rural/contracts';
import { useEffect, useRef, useState } from 'react';
import { ErroDaApi } from '../../api/chamada';
import { buscarPainel, buscarSafras } from '../../api/painel';

/** O valor do controle quando nenhuma Safra recorta a distribuição por Cultura. */
export const TODAS_AS_SAFRAS = '';

const FALHA_SEM_NOME = 'Algo deu errado ao falar com a API.';

function mensagemDe(causa: unknown): string {
  // O texto vem do corpo Problem Details da resposta. O outro ramo é só rede de segurança.
  return causa instanceof ErroDaApi ? causa.message : FALHA_SEM_NOME;
}

export interface PainelEmTela {
  painel?: Painel;
  /**
   * A distribuição por Cultura já recortada pela Safra escolhida. Fica indefinida
   * enquanto o recorte não volta, e continua indefinida se ele falhar.
   */
  porCultura?: Painel['plantiosPorCultura'];
  safras: Safra[];
  safraId: string;
  escolherSafra: (safraId: string) => void;
  carregando: boolean;
  /** Um recorte está em voo, e o número anterior já saiu da tela. */
  recortando: boolean;
  /** Falha da primeira carga: não há o que mostrar. */
  erro?: string;
  /** Falha de um recorte ou do catálogo de Safras: o resto da tela continua de pé. */
  erroDoRecorte?: string;
}

/**
 * Traz os números do painel e mantém o recorte por Safra.
 *
 * Os dois totais e as distribuições por estado e por Uso do Solo são fixados na primeira
 * resposta, porque descrevem o cadastro inteiro e não mudam com a Safra. Trocar a Safra
 * pede o painel de novo e aproveita apenas a distribuição por Cultura.
 */
export function usePainel(): PainelEmTela {
  const [painel, setPainel] = useState<Painel>();
  const [porCultura, setPorCultura] = useState<Painel['plantiosPorCultura']>();
  const [safras, setSafras] = useState<Safra[]>([]);
  const [safraId, setSafraId] = useState(TODAS_AS_SAFRAS);
  const [erro, setErro] = useState<string>();
  const [erroDoRecorte, setErroDoRecorte] = useState<string>();

  // Diz se a resposta que chegar é a primeira, sem depender do estado e sem redisparar
  // o efeito. Sobrevive à montagem dupla do StrictMode.
  const jaVeioOPainel = useRef(false);

  useEffect(() => {
    let cancelado = false;
    setErroDoRecorte(undefined);
    // O número da Safra anterior sai da tela agora. Deixá-lo sob o rótulo da Safra nova
    // seria mostrar um dado e dizer que ele é outro.
    setPorCultura(undefined);

    buscarPainel(safraId === TODAS_AS_SAFRAS ? undefined : safraId)
      .then((resposta) => {
        if (cancelado) {
          return;
        }

        if (!jaVeioOPainel.current) {
          jaVeioOPainel.current = true;
          setPainel(resposta);
        }

        setPorCultura(resposta.plantiosPorCultura);
      })
      .catch((causa: unknown) => {
        if (cancelado) {
          return;
        }

        if (jaVeioOPainel.current) {
          setErroDoRecorte(mensagemDe(causa));
        } else {
          setErro(mensagemDe(causa));
        }
      });

    return () => {
      cancelado = true;
    };
  }, [safraId]);

  useEffect(() => {
    let cancelado = false;

    buscarSafras()
      .then((resposta) => {
        if (!cancelado) {
          setSafras(resposta);
        }
      })
      .catch((causa: unknown) => {
        if (!cancelado) {
          setErroDoRecorte(mensagemDe(causa));
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return {
    painel,
    porCultura,
    safras,
    safraId,
    escolherSafra: setSafraId,
    carregando: painel === undefined && erro === undefined,
    recortando: porCultura === undefined && erroDoRecorte === undefined,
    erro,
    erroDoRecorte,
  };
}
