import { useEffect, useId, useRef, useState } from 'react';

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
 *
 * A pergunta substitui o botão que a disparou, então o foco iria para o nada. Ele passa
 * para o Confirmar, que aponta para a pergunta pelo `aria-describedby`: é assim que ela é
 * lida em voz alta, e não como região viva, que nasce com texto e costuma não ser
 * anunciada.
 */
export function BotaoDeExclusao({ rotulo, pergunta, aoConfirmar }: Props) {
  const [perguntando, setPerguntando] = useState(false);
  const confirmar = useRef<HTMLButtonElement>(null);
  const perguntaId = useId();

  useEffect(() => {
    if (perguntando) {
      confirmar.current?.focus();
    }
  }, [perguntando]);

  if (!perguntando) {
    return (
      <button
        type="button"
        className="perigo miudo"
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
      <span className="pergunta" id={perguntaId}>
        {pergunta}
      </span>
      <button
        ref={confirmar}
        type="button"
        className="perigo principal miudo"
        aria-describedby={perguntaId}
        onClick={() => {
          setPerguntando(false);
          aoConfirmar();
        }}
      >
        Confirmar
      </button>
      <button
        type="button"
        className="miudo"
        onClick={() => {
          setPerguntando(false);
        }}
      >
        Cancelar
      </button>
    </span>
  );
}
