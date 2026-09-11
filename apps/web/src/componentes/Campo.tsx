import { useId } from 'react';

interface Props {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  /** Texto por padrão. Número onde a API espera número, como as áreas e o ano da Safra. */
  tipo?: 'text' | 'number';
  /** O salto do controle de número. Duas casas nas áreas, uma unidade no ano. */
  passo?: string;
  /** Dica curta sob o campo, como o formato aceito. Nunca mensagem de recusa. */
  ajuda?: string;
  /** A medida do que se digita, escrita dentro do campo, como o "ha" das áreas. */
  unidade?: string;
}

/**
 * Um campo de digitação com o rótulo preso a ele.
 *
 * Nenhum campo valida: quem recusa é a API, e a tela mostra o texto que ela mandou. Ver
 * o critério de não duplicar mensagem de erro no cliente.
 */
export function Campo({ rotulo, valor, aoMudar, tipo = 'text', passo, ajuda, unidade }: Props) {
  const campoId = useId();
  const ajudaId = useId();

  const entrada = (
    <input
      id={campoId}
      type={tipo}
      step={passo}
      value={valor}
      aria-describedby={ajuda === undefined ? undefined : ajudaId}
      onChange={(evento) => {
        aoMudar(evento.target.value);
      }}
    />
  );

  return (
    <p className="campo">
      <label htmlFor={campoId}>{rotulo}</label>
      {/* A unidade fica dentro do campo, e escondida de quem ouve: o rótulo já a diz. */}
      {unidade === undefined ? (
        entrada
      ) : (
        <span className="com-unidade">
          {entrada}
          <span className="unidade" aria-hidden="true">
            {unidade}
          </span>
        </span>
      )}
      {ajuda !== undefined && (
        <span className="ajuda" id={ajudaId}>
          {ajuda}
        </span>
      )}
    </p>
  );
}
