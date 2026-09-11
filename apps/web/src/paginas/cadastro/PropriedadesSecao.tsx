import type { Propriedade } from '@cadastro-rural/contracts';
import { useState } from 'react';
import { Link } from 'react-router';
import { PRIMEIRA_PAGINA, TAMANHO_DA_BUSCA } from '../../api/pagina';
import { listarProdutores } from '../../api/produtores';
import { listarPropriedades, listarPropriedadesDoProdutor } from '../../api/propriedades';
import { BotaoDeExclusao } from '../../componentes/BotaoDeExclusao';
import { Campo } from '../../componentes/Campo';
import { Escolha, type Opcao } from '../../componentes/Escolha';
import { EscolhaComBusca } from '../../componentes/EscolhaComBusca';
import { comoNumero, formatarArea, formatarHectares } from '../../formato';
import { FORA_DO_CATALOGO, useCadastro } from './CadastroContexto';
import {
  PRODUTORES,
  plantiosDe,
  propriedadesDe,
  useEsquecerAbertura,
  useHierarquia,
} from './hierarquia';
import { Listagem } from './Listagem';
import { UNIDADES_FEDERATIVAS } from './unidades-federativas';
import { useTentativa } from './useTentativa';

const CARREGANDO = 'Carregando as Propriedades…';
const VAZIO = 'Nenhuma Propriedade cadastrada ainda.';
const SEM_PRODUTOR = 'Registre um Produtor antes: toda Propriedade é registrada em nome de um.';
const AJUDA_DAS_AREAS =
  'Até o metro quadrado, que são quatro casas decimais. ' +
  'A área agricultável mais a de vegetação não passam do total.';

/** O que o formulário guarda enquanto se digita: texto, como o campo devolve. */
interface Rascunho {
  produtorId: string;
  /** O nome de quem se escolheu, para o campo mostrar o Produtor e não o identificador. */
  produtorNome: string;
  nome: string;
  cidade: string;
  estado: string;
  areaTotal: string;
  areaAgricultavel: string;
  areaDeVegetacao: string;
}

const RASCUNHO_LIMPO: Rascunho = {
  produtorId: '',
  produtorNome: '',
  nome: '',
  cidade: '',
  estado: '',
  areaTotal: '',
  areaAgricultavel: '',
  areaDeVegetacao: '',
};

function rascunhoDe(propriedade: Propriedade): Rascunho {
  return {
    produtorId: propriedade.produtorId,
    produtorNome: '',
    nome: propriedade.nome,
    cidade: propriedade.cidade,
    estado: propriedade.estado,
    areaTotal: String(propriedade.areaTotal),
    areaAgricultavel: String(propriedade.areaAgricultavel),
    areaDeVegetacao: String(propriedade.areaDeVegetacao),
  };
}

/** O corpo que a API aceita na edição: tudo menos o Produtor, que não muda. */
function corpoDe(rascunho: Rascunho) {
  return {
    nome: rascunho.nome,
    cidade: rascunho.cidade,
    estado: rascunho.estado,
    areaTotal: comoNumero(rascunho.areaTotal),
    areaAgricultavel: comoNumero(rascunho.areaAgricultavel),
    areaDeVegetacao: comoNumero(rascunho.areaDeVegetacao),
  };
}

/**
 * O que as três áreas já somam, dito enquanto se digita.
 *
 * A regra é da API e é ela quem recusa. Isto não confere nada: só põe a conta na frente
 * de quem a está fazendo de cabeça, que é o que evita a recusa em vez de explicá-la.
 */
function somaDasAreas(rascunho: Rascunho): string {
  const [total, agricultavel, vegetacao] = [
    rascunho.areaTotal,
    rascunho.areaAgricultavel,
    rascunho.areaDeVegetacao,
  ].map(comoNumero);

  if ([total, agricultavel, vegetacao].every(Number.isNaN)) {
    return AJUDA_DAS_AREAS;
  }

  const repartido = (agricultavel || 0) + (vegetacao || 0);

  return `Agricultável mais vegetação: ${formatarArea(repartido)} ha de ${formatarArea(total || 0)} ha no total.`;
}

/**
 * A seção, presa ao recorte em que se está.
 *
 * A chave remonta tudo quando o recorte muda: o formulário volta a nascer em nome do
 * Produtor certo e a lista volta à primeira página, que é o único comportamento honesto
 * — a terceira página de um Produtor não diz nada sobre outro. Fechar o formulário não
 * remonta nada, e é por isso que a chave ignora o pedido de abertura.
 */
export function PropriedadesSecao() {
  const { produtorId, abrindo } = useHierarquia();

  return <Recorte key={produtorId} produtorId={produtorId} abrindo={abrindo} />;
}

interface PropsDoRecorte {
  produtorId: string;
  abrindo: boolean;
}

function Recorte({ produtorId, abrindo }: PropsDoRecorte) {
  const {
    produtores,
    carregando,
    nomeDoProdutor,
    criarPropriedade,
    editarPropriedade,
    excluirPropriedade,
  } = useCadastro();

  const esquecerAbertura = useEsquecerAbertura();
  const [aberto, setAberto] = useState(abrindo);
  const [emEdicao, setEmEdicao] = useState<Propriedade>();
  const [rascunho, setRascunho] = useState<Rascunho>({
    ...RASCUNHO_LIMPO,
    // Chegando pelo recorte de um Produtor, é em nome dele que se registra.
    produtorId,
  });
  const tentativaDoFormulario = useTentativa();
  const tentativaDaExclusao = useTentativa();

  /**
   * Quem a busca oferece: os Produtores cujo nome casa com o que se digitou.
   *
   * A lista curta vem da API a cada busca, e não do catálogo em memória: é justamente o
   * Produtor que não coube no catálogo que o campo antes não alcançava.
   */
  async function procurarProdutor(busca: string): Promise<Opcao[]> {
    const encontrados = await listarProdutores(PRIMEIRA_PAGINA, TAMANHO_DA_BUSCA, busca);

    return encontrados.itens.map((produtor) => ({ valor: produtor.id, rotulo: produtor.nome }));
  }

  const campo = (chave: keyof Rascunho) => (valor: string) => {
    setRascunho((anterior) => ({ ...anterior, [chave]: valor }));
  };

  /** O nome que o catálogo tem para o identificador, ou nada, quando ele não o alcança. */
  function nomeDeQuemEstaNoCatalogo(id: string): string {
    const nome = id === '' ? '' : nomeDoProdutor(id);

    return nome === FORA_DO_CATALOGO ? '' : nome;
  }

  /** O Produtor escolhido no campo de busca é o dono da Propriedade que se vai registrar. */
  function escolherProdutor({ valor, rotulo }: Opcao): void {
    setRascunho((anterior) => ({ ...anterior, produtorId: valor, produtorNome: rotulo }));
  }

  /** Só o estado do formulário. O desfecho da última escrita sobrevive ao fechamento. */
  function esvaziar(): void {
    setAberto(false);
    setEmEdicao(undefined);
    setRascunho({ ...RASCUNHO_LIMPO, produtorId });
    esquecerAbertura();
  }

  function fechar(): void {
    esvaziar();
    tentativaDoFormulario.limpar();
  }

  function abrirParaRegistrar(): void {
    fechar();
    setAberto(true);
  }

  function abrirParaEditar(propriedade: Propriedade): void {
    setAberto(true);
    setEmEdicao(propriedade);
    setRascunho(rascunhoDe(propriedade));
    tentativaDoFormulario.limpar();
  }

  /** A regra das áreas mora na API. Aqui só se mostra a recusa que ela mandou. */
  async function enviar(): Promise<void> {
    const registrando = emEdicao === undefined;

    const passou = await tentativaDoFormulario.tentar(
      async () => {
        if (registrando) {
          await criarPropriedade({ produtorId: rascunho.produtorId, ...corpoDe(rascunho) });
        } else {
          await editarPropriedade(emEdicao.id, corpoDe(rascunho));
        }
      },
      registrando
        ? `Propriedade ${rascunho.nome} registrada.`
        : `Propriedade ${rascunho.nome} atualizada.`,
    );

    if (passou) {
      esvaziar();
    }
  }

  async function excluir(propriedade: Propriedade): Promise<void> {
    await tentativaDaExclusao.tentar(
      () => excluirPropriedade(propriedade.id),
      `Propriedade ${propriedade.nome} excluída.`,
    );
  }

  // O nome de quem está escolhido: o que a busca trouxe, ou o do recorte, que chega como
  // identificador no endereço e só ganha nome quando o catálogo responde.
  const nomeDoEscolhido = rascunho.produtorNome || nomeDeQuemEstaNoCatalogo(rascunho.produtorId);

    const podeRegistrar = emEdicao !== undefined || produtores.length > 0;
  const recortado = produtorId !== '';
  // Quem é o recorte só se sabe com o catálogo em mãos, e nem sempre se sabe: passando do
  // centésimo Produtor, o dono da lista pode ser um dos que não vieram. Nos dois casos a
  // lista já é a dele, mas ainda não tem nome, e escrever "Propriedades de —" seria pior
  // do que não nomear o recorte.
  const nome = recortado && !carregando ? nomeDoProdutor(produtorId) : FORA_DO_CATALOGO;
  const dono = nome === FORA_DO_CATALOGO ? '' : nome;

  return (
    <div className="secao">
      {aberto &&
        (podeRegistrar ? (
          <form
            className="cartao formulario"
            noValidate
            onSubmit={(evento) => {
              evento.preventDefault();
              void enviar();
            }}
          >
            <h3>{emEdicao === undefined ? 'Nova Propriedade' : `Editar ${emEdicao.nome}`}</h3>
            {emEdicao === undefined ? (
              <EscolhaComBusca
                rotulo="Produtor"
                valor={rascunho.produtorId}
                nomeDoValor={nomeDoEscolhido || undefined}
                aoMudar={escolherProdutor}
                vazia="Procure um Produtor pelo nome"
                procurar={procurarProdutor}
              />
            ) : (
              <p className="campo">
                <span className="rotulo-fixo">Produtor</span>
                <span className="valor-fixo">{nomeDoProdutor(emEdicao.produtorId)}</span>
                <span className="ajuda">Uma Propriedade não muda de Produtor.</span>
              </p>
            )}
            <Campo rotulo="Nome" valor={rascunho.nome} aoMudar={campo('nome')} />
            <Campo rotulo="Cidade" valor={rascunho.cidade} aoMudar={campo('cidade')} />
            <Escolha
              rotulo="Estado"
              valor={rascunho.estado}
              aoMudar={campo('estado')}
              vazia="UF"
              opcoes={UNIDADES_FEDERATIVAS.map((sigla) => ({ valor: sigla, rotulo: sigla }))}
            />
            <fieldset className="medidas largura-inteira">
              <legend>Áreas, em hectares</legend>
              <div className="trio">
                <Campo
                  rotulo="Total"
                  tipo="number"
                  passo="0.01"
                  unidade="ha"
                  valor={rascunho.areaTotal}
                  aoMudar={campo('areaTotal')}
                />
                <Campo
                  rotulo="Agricultável"
                  tipo="number"
                  passo="0.01"
                  unidade="ha"
                  valor={rascunho.areaAgricultavel}
                  aoMudar={campo('areaAgricultavel')}
                />
                <Campo
                  rotulo="Vegetação"
                  tipo="number"
                  passo="0.01"
                  unidade="ha"
                  valor={rascunho.areaDeVegetacao}
                  aoMudar={campo('areaDeVegetacao')}
                />
              </div>
              <span className="ajuda">{somaDasAreas(rascunho)}</span>
            </fieldset>
            {tentativaDoFormulario.recusa !== undefined && (
              <p className="largura-inteira" role="alert">
                {tentativaDoFormulario.recusa}
              </p>
            )}
            <p className="acoes largura-inteira">
              <button type="submit">{emEdicao === undefined ? 'Registrar' : 'Salvar'}</button>
              <button type="button" onClick={fechar}>
                Cancelar
              </button>
            </p>
          </form>
        ) : (
          <div className="cartao formulario">
            <h3>Nova Propriedade</h3>
            <p className="largura-inteira ajuda">{SEM_PRODUTOR}</p>
            <p className="acoes largura-inteira">
              <Link to={PRODUTORES}>Ir para Produtores</Link>
            </p>
          </div>
        ))}

      {tentativaDaExclusao.recusa !== undefined && (
        <p role="alert">{tentativaDaExclusao.recusa}</p>
      )}

      {/* Os dois avisos ficam fora do formulário porque ele some quando a escrita passa. */}
      {tentativaDoFormulario.aviso !== undefined && (
        <p className="acerto" role="status">
          {tentativaDoFormulario.aviso}
        </p>
      )}

      {tentativaDaExclusao.aviso !== undefined && (
        <p className="acerto" role="status">
          {tentativaDaExclusao.aviso}
        </p>
      )}

      <Listagem
        titulo={dono === '' ? 'Propriedades' : `Propriedades de ${dono}`}
        acoes={
          <>
            {recortado && (
              <Link className="ligacao" to={propriedadesDe('')}>
                Ver todas
              </Link>
            )}
            {!aberto && (
              <button type="button" className="abridor" onClick={abrirParaRegistrar}>
                Nova Propriedade
              </button>
            )}
          </>
        }
        listar={(pagina, tamanho) =>
          recortado
            ? listarPropriedadesDoProdutor(produtorId, pagina, tamanho)
            : listarPropriedades(pagina, tamanho)
        }
        carregando={CARREGANDO}
        vazio={
          dono === '' ? VAZIO : `${dono} ainda não tem Propriedade. Registre a primeira acima.`
        }
      >
        {(propriedades) => (
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Produtor</th>
                <th scope="col">Onde</th>
                <th scope="col" className="numero">
                  Área total
                </th>
                <th scope="col">Plantios</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {propriedades.map((propriedade) => (
                <tr
                  key={propriedade.id}
                  className={emEdicao?.id === propriedade.id ? 'em-edicao' : ''}
                >
                  <td>{propriedade.nome}</td>
                  <td>{nomeDoProdutor(propriedade.produtorId)}</td>
                  <td className="apagado">
                    {propriedade.cidade}/{propriedade.estado}
                  </td>
                  <td className="numero">{formatarHectares(propriedade.areaTotal)}</td>
                  <td>
                    <Link
                      className="ligacao"
                      to={plantiosDe(propriedade.id, propriedade.produtorId)}
                      aria-label={`Ver os Plantios de ${propriedade.nome}`}
                    >
                      Ver Plantios ›
                    </Link>
                  </td>
                  <td className="acoes">
                    <button
                      type="button"
                      className="miudo"
                      onClick={() => {
                        abrirParaEditar(propriedade);
                      }}
                    >
                      Editar {propriedade.nome}
                    </button>
                    <BotaoDeExclusao
                      rotulo={`Excluir ${propriedade.nome}`}
                      pergunta={`Excluir ${propriedade.nome}? Os Plantios dessa Propriedade vão junto.`}
                      aoConfirmar={() => {
                        void excluir(propriedade);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Listagem>
    </div>
  );
}
