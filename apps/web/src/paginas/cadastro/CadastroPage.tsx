import { Link, NavLink, Outlet } from 'react-router';
import { CadastroProvider, useCadastro } from './CadastroContexto';
import { CATALOGOS, PRODUTORES, plantiosDe, propriedadesDe, useHierarquia } from './hierarquia';

const CORTADO =
  'O cadastro passou de cem Produtores ou Propriedades. Os campos de escolha e a coluna de ' +
  'Produtor mostram só os cem primeiros, porque a API lista até aí e não tem busca por texto.';

/**
 * O que há a dizer sobre os catálogos.
 *
 * A falha não derruba a tela: as listas de cada seção vêm de outra chamada e continuam
 * de pé. O que fica sem opção é o campo de escolha dos formulários, e é isso que o aviso
 * diz. O corte pelo teto é o mesmo problema em menor grau, e cala se não houver.
 */
function AvisoDosCatalogos() {
  const { erro, cortado } = useCadastro();

  return (
    <>
      {erro !== undefined && <p role="alert">{erro}</p>}
      {cortado && (
        <p className="recado" role="status">
          {CORTADO}
        </p>
      )}
    </>
  );
}

/**
 * De onde se veio, quando se veio de um registro.
 *
 * Sem isto a lista recortada mente: "Propriedades" com uma linha só parece um cadastro de
 * uma Propriedade, e não o recorte de um Produtor. O rastro diz qual é o recorte e, em
 * cada degrau, oferece a saída para o de cima.
 */
function Rastro() {
  const { produtorId, propriedadeId } = useHierarquia();
  const { nomeDoProdutor, propriedades, carregando } = useCadastro();

  // Sem catálogo ainda não há nome, e um rastro de travessões diria menos do que nada.
  if (produtorId === '' || carregando) {
    return null;
  }

  const propriedade = propriedades.find((candidata) => candidata.id === propriedadeId);

  return (
    <nav aria-label="Contexto" className="migalhas">
      <Link to={PRODUTORES}>Todos os Produtores</Link>
      <span aria-hidden="true" className="seta">
        ›
      </span>
      {propriedade === undefined ? (
        <span aria-current="location">{nomeDoProdutor(produtorId)}</span>
      ) : (
        <>
          <Link to={propriedadesDe(produtorId)}>{nomeDoProdutor(produtorId)}</Link>
          <span aria-hidden="true" className="seta">
            ›
          </span>
          <span aria-current="location">{propriedade.nome}</span>
        </>
      )}
    </nav>
  );
}

/**
 * A trilha das seções.
 *
 * As três se encadeiam na ordem em que uma depende da outra: um Plantio precisa de uma
 * Propriedade, que precisa de um Produtor. A seta entre elas não é enfeite — é a ordem
 * que a operadora tem de seguir numa base recém-criada.
 *
 * O recorte em que se está viaja junto: sair das Propriedades de um Produtor para os
 * Plantios e voltar não pode obrigar a escolher o Produtor de novo. O catálogo fica de
 * fora do trilho porque não pertence à cadeia — Cultura e Safra valem para todo mundo.
 */
function Trilha() {
  const { produtorId, propriedadeId } = useHierarquia();

  const cadeia = [
    { rotulo: 'Produtores', para: PRODUTORES },
    { rotulo: 'Propriedades', para: propriedadesDe(produtorId) },
    { rotulo: 'Plantios', para: plantiosDe(propriedadeId, produtorId) },
  ];

  return (
    <nav aria-label="Seções do cadastro" className="secoes">
      <div className="trilha">
        {cadeia.map((secao, indice) => (
          <span key={secao.rotulo} className="degrau">
            {indice > 0 && (
              <span aria-hidden="true" className="seta">
                ›
              </span>
            )}
            <NavLink to={secao.para}>{secao.rotulo}</NavLink>
          </span>
        ))}
      </div>
      <span className="grupo-de-secoes">
        <span className="rotulo-do-grupo">Catálogo</span>
        <span className="trilha">
          <NavLink to={CATALOGOS}>Culturas e Safras</NavLink>
        </span>
      </span>
    </nav>
  );
}

export function CadastroPage() {
  return (
    <CadastroProvider>
      <div className="cabeca-do-cadastro">
        <h1>Cadastro</h1>
        <Trilha />
      </div>
      <Rastro />
      <AvisoDosCatalogos />
      <Outlet />
    </CadastroProvider>
  );
}
