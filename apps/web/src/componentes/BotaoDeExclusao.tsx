import { useState } from 'react';

interface Props {
  /** O que o botão diz, com o registro dentro: "Excluir Ana Lima". */
  rotulo: string;
  /** O que a confirmação pergunta. É onde a cascata é dita, quando existe. */
  pergunta: string;
  aoConfirmar: () => void;
}

/**
 * Exclusão em dois toques.
 *
 * A confirmação é escrita na própria linha, e não num diálogo do navegador, porque a
 * exclusão é física e não tem desfazer: excluir um Produtor leva junto as Propriedades e
 * os Plantios dele. Ver o registro de decisão 0003.
 */
export function BotaoDeExclusao({ rotulo, pergunta, aoConfirmar }: Props) {
  const [perguntando, setPerguntando] = useState(false);

  if (!perguntando) {
    return (
      <button
        type="button"
        className="perigo"
        onClick={() => {
          setPerguntando(true);
        }}
      >
        {rotulo}
      </button>
    );
  }

  return (
    <span className="confirmacao">
      <span role="status">{pergunta}</span>
      <button
        type="button"
        className="perigo"
        onClick={() => {
          setPerguntando(false);
          aoConfirmar();
        }}
      >
        Confirmar
      </button>
      <button
        type="button"
        onClick={() => {
          setPerguntando(false);
        }}
      >
        Cancelar
      </button>
    </span>
  );
}
