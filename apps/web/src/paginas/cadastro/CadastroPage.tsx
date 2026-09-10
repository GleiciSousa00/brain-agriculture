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

/**
 * A falha da carga dos catálogos.
 *
 * Ela não derruba a tela: as tabelas de cada seção vêm de outra chamada e continuam de
 * pé. O que fica sem opção é o campo de escolha dos formulários, e é isso que o aviso diz.
 */
function AvisoDosCatalogos() {
  const { erro } = useCadastro();

  if (erro === undefined) {
    return null;
  }

  return <p role="alert">{erro}</p>;
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
