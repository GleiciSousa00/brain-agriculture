import { NavLink, Outlet } from 'react-router';
import { CadastroProvider, useCadastro } from './CadastroContexto';

/**
 * As quatro seções do cadastro, cada uma com endereço próprio.
 *
 * São sub-rotas, e não abas guardadas em estado, pelo mesmo motivo que levou o painel e o
 * cadastro a serem rotas: recarregar a página e compartilhar o link de uma seção
 * precisam funcionar. Ver o registro de decisão 0010.
 */
const SECOES = [
  { para: 'produtores', rotulo: 'Produtores' },
  { para: 'propriedades', rotulo: 'Propriedades' },
  { para: 'plantios', rotulo: 'Plantios' },
  { para: 'catalogos', rotulo: 'Culturas e Safras' },
];

const CORTADO =
  'O cadastro passou de cem Produtores ou Propriedades. Os campos de escolha e a coluna de ' +
  'Produtor mostram só os cem primeiros, porque a API lista até aí e não tem busca por texto.';

/**
 * O que há a dizer sobre os catálogos.
 *
 * A falha não derruba a tela: as tabelas de cada seção vêm de outra chamada e continuam
 * de pé. O que fica sem opção é o campo de escolha dos formulários, e é isso que o aviso
 * diz. O corte pelo teto é o mesmo problema em menor grau, e cala se não houver.
 */
function AvisoDosCatalogos() {
  const { erro, cortado } = useCadastro();

  return (
    <>
      {erro !== undefined && <p role="alert">{erro}</p>}
      {cortado && (
        <p className="aviso" role="status">
          {CORTADO}
        </p>
      )}
    </>
  );
}

export function CadastroPage() {
  return (
    <CadastroProvider>
      <h1>Cadastro</h1>
      <nav aria-label="Seções do cadastro" className="secoes">
        {SECOES.map((secao) => (
          <NavLink key={secao.para} to={secao.para}>
            {secao.rotulo}
          </NavLink>
        ))}
      </nav>
      <AvisoDosCatalogos />
      <Outlet />
    </CadastroProvider>
  );
}
