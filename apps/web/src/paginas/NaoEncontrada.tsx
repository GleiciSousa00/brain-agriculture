import { Link } from 'react-router';

/**
 * O endereço não existe, e a tela diz isso.
 *
 * Antes ela mandava para o painel calada, o que faz um endereço errado passar por certo:
 * quem seguiu um atalho velho lê o painel achando que leu o que pediu, e nunca descobre
 * que o atalho quebrou.
 */
export function NaoEncontrada() {
  return (
    <div className="convite">
      <h2>Esta página não existe.</h2>
      <p>O endereço pode ter mudado, ou o atalho que trouxe você até aqui está velho.</p>
      <p>
        <Link to="/painel">Ir para o Painel</Link> ou <Link to="/cadastro">ir para o Cadastro</Link>.
      </p>
    </div>
  );
}
