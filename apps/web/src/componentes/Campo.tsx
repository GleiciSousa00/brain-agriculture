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
}

/**
 * Um campo de digitação com o rótulo preso a ele.
 *
 * Nenhum campo valida: quem recusa é a API, e a tela mostra o texto que ela mandou. Ver
 * o critério de não duplicar mensagem de erro no cliente.
 */
export function Campo({ rotulo, valor, aoMudar, tipo = 'text', passo, ajuda }: Props) {
  const campoId = useId();
  const ajudaId = useId();

  return (
    <p className="campo">
      <label htmlFor={campoId}>{rotulo}</label>
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
      {ajuda !== undefined && (
        <span className="ajuda" id={ajudaId}>
          {ajuda}
        </span>
      )}
    </p>
  );
}
