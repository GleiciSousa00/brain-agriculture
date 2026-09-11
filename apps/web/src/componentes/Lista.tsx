import type { ReactNode } from 'react';
import { useId } from 'react';

interface Props {
  /** O que a lista mostra. Vira o nome da região e o título da faixa. */
  titulo: string;
  /** Quantos registros existem, já escrito. Vazio enquanto ainda não se sabe. */
  contagem?: string;
  /** O que se pode fazer com a lista inteira, como abrir o formulário de registro. */
  acoes?: ReactNode;
  /** Formulário curto que sai da própria faixa, como o dos catálogos. */
  embutido?: ReactNode;
  children: ReactNode;
}

/**
 * O cartão de uma lista do cadastro.
 *
 * A faixa do alto responde de uma vez o que a lista mostra, quanto existe e o que se pode
 * fazer com ela. O botão que registra mora ali, e não no meio da tela: é a única ação que
 * vale para a lista inteira, e não para uma linha dela.
 */
export function Lista({ titulo, contagem, acoes, embutido, children }: Props) {
  const tituloId = useId();

  return (
    <section className="lista" aria-labelledby={tituloId}>
      <div className="faixa">
        <h2 id={tituloId}>{titulo}</h2>
        <span className="faixa-lado">
          {contagem}
          {acoes}
        </span>
      </div>
      {embutido}
      {children}
    </section>
  );
}
