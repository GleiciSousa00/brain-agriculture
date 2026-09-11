import { useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { PRIMEIRA_PAGINA, TAMANHO_DA_BUSCA } from '../../api/pagina';
import { listarPropriedades, listarPropriedadesDoProdutor } from '../../api/propriedades';
import type { Opcao } from '../../componentes/Escolha';
import { EscolhaComBusca } from '../../componentes/EscolhaComBusca';
import { formatarHectares } from '../../formato';
import { useCadastro } from './CadastroContexto';
import { SEM_RECORTE, plantiosDe, propriedadesDe, useHierarquia } from './hierarquia';
import { PlantiosDaPropriedade } from './PlantiosDaPropriedade';

const SEM_PROPRIEDADE = 'Registre uma Propriedade antes: todo Plantio acontece em uma.';
const FORA_DO_CATALOGO = 'Propriedade fora do catálogo';

/**
 * Os Plantios de uma Propriedade de cada vez.
 *
 * Qual Propriedade é isso mora no endereço, e não em estado: chegar aqui pela coluna
 * Plantios da lista de Propriedades e chegar pelo campo de escolha têm de dar no mesmo
 * lugar, e esse lugar tem de sobreviver a recarregar a página.
 */
export function PlantiosSecao() {
  const { produtorId, propriedadeId, abrindo } = useHierarquia();
  const { propriedades, nomeDoProdutor, carregando, erro } = useCadastro();
  const navegar = useNavigate();
  // De quem é cada Propriedade que a busca ofereceu. Escolher é navegar, e navegar pede o
  // Produtor: a Propriedade achada pela busca pode ser uma que o catálogo não alcança.
  const donaDe = useRef(new Map<string, string>());
  const escolhida = propriedades.find((propriedade) => propriedade.id === propriedadeId);
  // A escolha vale mesmo quando o catálogo não a alcança: os Plantios se buscam pelo
  // identificador, e quem chegou pela coluna Plantios de uma Propriedade da centésima
  // primeira página em diante não pode cair numa tela que diz não haver escolha nenhuma.
  const temEscolha = propriedadeId !== SEM_RECORTE;

  /**
   * Quem a busca oferece: as Propriedades cujo nome casa com o que se digitou.
   *
   * Vindo do recorte de um Produtor, procura só entre as dele: a escolha aqui não volta a
   * oferecer o cadastro inteiro só porque passou a procurar. De quem é cada uma fica
   * guardado, porque é o Produtor que compõe o endereço da escolha.
   */
  async function procurarPropriedade(busca: string): Promise<Opcao[]> {
    const encontradas =
      produtorId === ''
        ? await listarPropriedades(PRIMEIRA_PAGINA, TAMANHO_DA_BUSCA, busca)
        : await listarPropriedadesDoProdutor(produtorId, PRIMEIRA_PAGINA, TAMANHO_DA_BUSCA, busca);

    return encontradas.itens.map((propriedade) => {
      donaDe.current.set(propriedade.id, propriedade.produtorId);

      return {
        valor: propriedade.id,
        rotulo:
          produtorId === ''
            ? `${propriedade.nome} · ${nomeDoProdutor(propriedade.produtorId)}`
            : propriedade.nome,
      };
    });
  }

  /** Escolher aqui é navegar: o endereço passa a ser o dessa Propriedade, e o rastro se refaz. */
  function escolherPropriedade({ valor }: Opcao): void {
    navegar(plantiosDe(valor, donaDe.current.get(valor) ?? produtorId));
  }

  // Dizer que não há Propriedade nenhuma exige saber que não há: com o catálogo em voo,
  // ou depois de ele falhar, a lista vazia é ausência de resposta e não de registro.
  if (!temEscolha && !carregando && erro === undefined && propriedades.length === 0) {
    return (
      <div className="convite">
        <p>{SEM_PROPRIEDADE}</p>
        <Link to={propriedadesDe(produtorId)}>Ir para Propriedades</Link>
      </div>
    );
  }

  return (
    <div className="secao">
      <div className="seletor">
        <EscolhaComBusca
          rotulo="Propriedade"
          valor={propriedadeId}
          nomeDoValor={temEscolha ? (escolhida?.nome ?? FORA_DO_CATALOGO) : undefined}
          aoMudar={escolherPropriedade}
          vazia={
            produtorId === ''
              ? 'Procure uma Propriedade pelo nome'
              : `Procure uma Propriedade de ${nomeDoProdutor(produtorId)}`
          }
          procurar={procurarPropriedade}
        />
        {escolhida !== undefined && (
          <span className="detalhe">
            {escolhida.cidade}/{escolhida.estado} · {formatarHectares(escolhida.areaTotal)}
          </span>
        )}
      </div>

      {temEscolha ? (
        <PlantiosDaPropriedade
          key={propriedadeId}
          propriedadeId={propriedadeId}
          nome={escolhida?.nome}
          abrindo={abrindo}
        />
      ) : (
        <SemPropriedadeEscolhida produtorId={produtorId} />
      )}
    </div>
  );
}

interface PropsDoConvite {
  produtorId: string;
}

/** Ninguém escolheu nada ainda, e a tela diz os dois caminhos que existem para escolher. */
function SemPropriedadeEscolhida({ produtorId }: PropsDoConvite) {
  return (
    <p className="convite">
      Escolha uma Propriedade acima, ou venha pela coluna Plantios da lista de{' '}
      <Link to={propriedadesDe(produtorId)}>Propriedades</Link>.
    </p>
  );
}
