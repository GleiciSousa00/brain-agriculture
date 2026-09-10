import { useState } from 'react';
import { mensagemDe } from '../../api/chamada';

export interface Tentativa {
  /** O texto da última recusa, ou nada. É o que a seção mostra no alerta dela. */
  recusa?: string;
  /**
   * Faz a escrita e diz se ela passou. O desfecho volta como resposta, e não como erro,
   * porque quem chama não trata a recusa: ele só decide se esvazia o formulário.
   */
  tentar: (acao: () => Promise<void>) => Promise<boolean>;
  /** Leva a recusa embora sem tentar nada, para quem sai de cima do formulário. */
  limpar: () => void;
}

/**
 * Uma tentativa de escrita e a recusa que ela pode receber.
 *
 * A regra é sempre a mesma: some com a recusa anterior, tenta, e o que a API responder
 * vira o texto do alerta, copiado sem reescrita. Ela estava escrita em oito lugares nas
 * cinco seções e já tinha divergido — cada seção decidia por conta própria quando a
 * recusa saía da tela.
 *
 * É um gancho, e não estado do contexto, porque a recusa pertence ao formulário que a
 * recebeu: duas seções abertas, ou o formulário e a exclusão da mesma seção, mostram
 * recusas diferentes ao mesmo tempo.
 */
export function useTentativa(): Tentativa {
  const [recusa, setRecusa] = useState<string>();

  async function tentar(acao: () => Promise<void>): Promise<boolean> {
    setRecusa(undefined);

    try {
      await acao();

      return true;
    } catch (causa: unknown) {
      setRecusa(mensagemDe(causa));

      return false;
    }
  }

  function limpar(): void {
    setRecusa(undefined);
  }

  return { recusa, tentar, limpar };
}
