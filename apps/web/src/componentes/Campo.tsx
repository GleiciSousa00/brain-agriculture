import { useId } from 'react';

interface Props {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  /** Texto por padrão. Número onde a API espera número, como as áreas e o ano da Safra. */
  tipo?: 'text' | 'number';
  /** O salto do controle de número. O metro quadrado nas áreas, uma unidade no ano. */
  passo?: string;
  /** Dica curta sob o campo, como o formato aceito. Nunca mensagem de recusa. */
  ajuda?: string;
  /** A medida do que se digita, escrita dentro do campo, como o "ha" das áreas. */
  unidade?: string;
  /**
   * O teto que a API impõe ao campo, repetido aqui.
   *
   * Sem ele quem digita um nome longo demais só descobre o teto ao ser recusado, depois
   * de ter escrito tudo. O navegador para de aceitar caractere no limite, e a recusa da
   * API continua sendo a que vale.
   */
  tamanhoMaximo?: number;
  /** O campo não pode ir vazio. Anuncia a obrigação a quem ouve; quem recusa é a API. */
  obrigatorio?: boolean;
  /**
   * Abre o teclado numérico no telefone para o campo que é de texto mas se preenche com
   * dígitos, como o Documento. O campo de número já abre o seu.
   */
  tecladoNumerico?: boolean;
}

/**
 * Um campo de digitação com o rótulo preso a ele.
 *
 * Nenhum campo valida: quem recusa é a API, e a tela mostra o texto que ela mandou. Ver
 * o critério de não duplicar mensagem de erro no cliente.
 */
export function Campo({
  rotulo,
  valor,
  aoMudar,
  tipo = 'text',
  passo,
  ajuda,
  unidade,
  tamanhoMaximo,
  obrigatorio = false,
  tecladoNumerico = false,
}: Props) {
  const campoId = useId();
  const ajudaId = useId();

  const entrada = (
    <input
      id={campoId}
      type={tipo}
      step={passo}
      maxLength={tamanhoMaximo}
      required={obrigatorio}
      inputMode={tecladoNumerico ? 'numeric' : undefined}
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
