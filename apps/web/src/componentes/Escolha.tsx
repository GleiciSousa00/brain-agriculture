import { useId } from 'react';

/** Uma opção da lista: o que vai para a API e o que a operadora lê. */
export interface Opcao {
  valor: string;
  rotulo: string;
}

interface Props {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  opcoes: Opcao[];
  /** A opção neutra do topo, como "Escolha uma Propriedade". */
  vazia: string;
}

/**
 * Um campo que só aceita o que está na lista.
 *
 * Cultura, Safra, Produtor e Propriedade se apontam, nunca se digitam: é o que impede o
 * catálogo de virar texto livre, e é o que a issue pede no formulário de Plantio.
 */
export function Escolha({ rotulo, valor, aoMudar, opcoes, vazia }: Props) {
  const campoId = useId();

  return (
    <p className="campo">
      <label htmlFor={campoId}>{rotulo}</label>
      <select
        id={campoId}
        value={valor}
        onChange={(evento) => {
          aoMudar(evento.target.value);
        }}
      >
        <option value="">{vazia}</option>
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </p>
  );
}
