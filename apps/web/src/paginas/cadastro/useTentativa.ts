import { useState } from 'react';
import { mensagemDe } from '../../api/chamada';

export interface Tentativa {
  /** O texto da última recusa, ou nada. É o que a seção mostra no alerta dela. */
  recusa?: string;
  /** O texto do último acerto, ou nada. É o que a seção mostra na região de estado. */
  aviso?: string;
  /**
   * Faz a escrita e diz se ela passou. O desfecho volta como resposta, e não como erro,
   * porque quem chama não trata a recusa: ele só decide se esvazia o formulário.
   *
   * O segundo argumento é o que a tela diz quando a escrita passa. Sem ele, o acerto fica
   * mudo, o que só serve para a escrita cujo efeito a própria tela já mostra.
   */
  tentar: (acao: () => Promise<void>, anuncio?: string) => Promise<boolean>;
  /** Leva recusa e aviso embora sem tentar nada, para quem sai de cima do formulário. */
  limpar: () => void;
}

/**
 * Uma tentativa de escrita, e o que a tela diz dos dois desfechos dela.
 *
 * A regra é sempre a mesma: some com o desfecho anterior, tenta, e o que a API responder
 * vira o texto do alerta, copiado sem reescrita. Ela estava escrita em oito lugares nas
 * cinco seções e já tinha divergido — cada seção decidia por conta própria quando a
 * recusa saía da tela.
 *
 * O acerto também fala. Sem isso, quem registra um Plantio numa Propriedade com mais de
 * uma página de Plantios não recebe sinal nenhum: o formulário esvazia, a linha nova está
 * gravada, e nada na tela diz que ela está. A dúvida leva a operadora a reenviar, e o
 * reenvio volta recusado por repetição.
 *
 * É um gancho, e não estado do contexto, porque o desfecho pertence ao formulário que o
 * recebeu: duas seções abertas, ou o formulário e a exclusão da mesma seção, mostram
 * desfechos diferentes ao mesmo tempo.
 */
export function useTentativa(): Tentativa {
  const [recusa, setRecusa] = useState<string>();
  const [aviso, setAviso] = useState<string>();

  async function tentar(acao: () => Promise<void>, anuncio?: string): Promise<boolean> {
    setRecusa(undefined);
    setAviso(undefined);

    try {
      await acao();
      setAviso(anuncio);

      return true;
    } catch (causa: unknown) {
      setRecusa(mensagemDe(causa));

      return false;
    }
  }

  function limpar(): void {
    setRecusa(undefined);
    setAviso(undefined);
  }

  return { recusa, aviso, tentar, limpar };
}
