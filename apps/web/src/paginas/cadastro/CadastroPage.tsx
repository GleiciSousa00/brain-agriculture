import { Link, NavLink, Outlet } from 'react-router';
import { FORA_DO_CATALOGO, CadastroProvider, useCadastro } from './CadastroContexto';
import { CATALOGOS, PRODUTORES, plantiosDe, propriedadesDe, useHierarquia } from './hierarquia';

const CORTADO =
  'O cadastro passou de cem Produtores ou Propriedades. A coluna de Produtor tem nome só ' +
  'para os cem primeiros, porque a listagem vai até aí. Os campos de escolha alcançam o ' +
  'cadastro inteiro: procure pelo nome.';

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
  const nomeDoDono = carregando ? FORA_DO_CATALOGO : nomeDoProdutor(produtorId);

  // Um rastro de travessões diz menos do que rastro nenhum, e a saída para o cadastro
  // inteiro continua na faixa da lista. Cala-se enquanto o catálogo não chega e quando
  // ele não alcança o Produtor do recorte.
  if (produtorId === '' || nomeDoDono === FORA_DO_CATALOGO) {
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
        <span aria-current="location">{nomeDoDono}</span>
      ) : (
        <>
          <Link to={propriedadesDe(produtorId)}>{nomeDoDono}</Link>
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
