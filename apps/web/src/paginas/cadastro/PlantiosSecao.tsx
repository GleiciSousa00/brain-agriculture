import { useId } from 'react';
import { Link, useNavigate } from 'react-router';
import { NADA_ESCOLHIDO } from '../../componentes/Escolha';
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
  const campoId = useId();

  // O recorte por Produtor manda também aqui: vindo das Propriedades de alguém, a escolha
  // não volta a oferecer o cadastro inteiro.
  const oferecidas =
    produtorId === ''
      ? propriedades
      : propriedades.filter((propriedade) => propriedade.produtorId === produtorId);
  const escolhida = propriedades.find((propriedade) => propriedade.id === propriedadeId);
  // A escolha vale mesmo quando o catálogo não a alcança: os Plantios se buscam pelo
  // identificador, e quem chegou pela coluna Plantios de uma Propriedade da centésima
  // primeira página em diante não pode cair numa tela que diz não haver escolha nenhuma.
  const temEscolha = propriedadeId !== SEM_RECORTE;

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
        <label htmlFor={campoId}>Propriedade</label>
        <select
          id={campoId}
          value={propriedadeId}
          onChange={(evento) => {
            const escolhido = evento.target.value;
            const dona = propriedades.find((propriedade) => propriedade.id === escolhido);

            // Escolher aqui é navegar: o endereço passa a ser o dessa Propriedade, e o
            // rastro do alto se refaz com ela.
            navegar(plantiosDe(escolhido, dona?.produtorId ?? produtorId));
          }}
        >
          <option value={NADA_ESCOLHIDO}>
            {produtorId === ''
              ? 'Escolha uma Propriedade'
              : `Escolha uma Propriedade de ${nomeDoProdutor(produtorId)}`}
          </option>
          {/* O que manda é a lista oferecida, e não o catálogo inteiro: a escolha pode
              ser de outro Produtor que não o do recorte, e um valor sem opção deixaria o
              campo mostrando o texto neutro sobre uma lista que já tem dona. */}
          {temEscolha && !oferecidas.some((propriedade) => propriedade.id === propriedadeId) && (
            <option value={propriedadeId}>{escolhida?.nome ?? FORA_DO_CATALOGO}</option>
          )}
          {oferecidas.map((propriedade) => (
            <option key={propriedade.id} value={propriedade.id}>
              {produtorId === ''
                ? `${propriedade.nome} · ${nomeDoProdutor(propriedade.produtorId)}`
                : propriedade.nome}
            </option>
          ))}
        </select>
        {escolhida !== undefined && (
          <span className="detalhe">
            {escolhida.cidade}/{escolhida.estado} · {formatarHectares(escolhida.areaTotal)}
          </span>
        )}
      </div>

      {temEscolha ? (
        // A chave refaz a lista ao trocar de Propriedade, e com ela a página em que se
        // estava: a terceira página de uma Propriedade não diz nada sobre a outra.
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
