import type {
  AcrescentarCultura,
  CriarProdutor,
  CriarPropriedade,
  CriarSafra,
  Cultura,
  EditarProdutor,
  EditarPropriedade,
  Produtor,
  Propriedade,
  RegistrarPlantio,
  Safra,
} from '@cadastro-rural/contracts';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { mensagemDe } from '../../api/chamada';
import { acrescentarCultura, criarSafra, listarCulturas, listarSafras } from '../../api/catalogo';
import { PRIMEIRA_PAGINA, TAMANHO_DO_CATALOGO } from '../../api/pagina';
import { excluirPlantio, registrarPlantio } from '../../api/plantios';
import { criarProdutor, editarProdutor, excluirProdutor, listarProdutores } from '../../api/produtores';
import {
  criarPropriedade,
  editarPropriedade,
  excluirPropriedade,
  listarPropriedades,
} from '../../api/propriedades';

/**
 * O que as seções do cadastro precisam umas das outras.
 *
 * O formulário de Propriedade escolhe um Produtor, e o de Plantio escolhe uma
 * Propriedade, uma Cultura e uma Safra. Nenhuma dessas listas pertence à seção que a
 * mostra, e é por isso que elas vivem aqui e não em cada tela.
 *
 * As listas são a primeira página no tamanho máximo que a API aceita: um campo de escolha
 * tem de oferecer também o registro que a tabela ao lado não está mostrando.
 */
export interface Catalogos {
  produtores: Produtor[];
  propriedades: Propriedade[];
  culturas: Cultura[];
  safras: Safra[];
  /**
   * O cadastro passou do teto de cem e o catálogo veio cortado.
   *
   * A API não tem busca por texto, então não há como alcançar o que ficou de fora. Quem
   * opera precisa saber disso, porque é o que explica o campo de escolha sem o Produtor
   * que existe e a coluna de Produtor sem nome.
   */
  cortado: boolean;
}

/**
 * O que a tela põe no lugar do nome que não pôde ser resolvido.
 *
 * É o sintoma de `cortado`: o catálogo veio até cem e o registro apontado ficou de fora.
 * Quem explica o travessão é o aviso do alto do cadastro, e não a célula onde ele aparece.
 */
export const FORA_DO_CATALOGO = '—';

const CATALOGOS_VAZIOS: Catalogos = {
  produtores: [],
  propriedades: [],
  culturas: [],
  safras: [],
  cortado: false,
};

export interface Cadastro extends Catalogos {
  /** A primeira carga dos catálogos ainda está em voo. */
  carregando: boolean;
  /** Os catálogos não vieram. Os campos de escolha ficam sem opção, ou com opção velha. */
  erro?: string;
  /**
   * Sobe a cada escrita. As tabelas paginadas das seções observam este número para se
   * refazerem, porque a fatia que elas mostram não passa por aqui.
   */
  versao: number;
  /**
   * O nome de quem só chegou como identificador, ou o travessão.
   *
   * A API entrega Propriedade e Plantio apontando para Produtor, Cultura e Safra, e quem
   * tem o nome é o catálogo que já está aqui para os campos de escolha. Resolver o nome é
   * do contexto, e não de cada tabela, porque o travessão é a mesma resposta em todas.
   */
  nomeDoProdutor: (id: string) => string;
  nomeDaCultura: (id: string) => string;
  anoDaSafra: (id: string) => string;
  /**
   * Quantas Propriedades um Produtor tem, contadas no catálogo que já está em memória.
   *
   * É o número que a coluna de Propriedades mostra, e é ele que distingue o Produtor sem
   * Propriedade nenhuma — o único a quem a tela oferece registrar a primeira. Só vale com
   * o catálogo inteiro em mãos: enquanto ele não chega, e quando `cortado` diz que ele
   * veio pela metade, a conta é do que veio e a coluna deixa de contar.
   */
  quantasPropriedadesDe: (produtorId: string) => number;
  criarProdutor: (corpo: CriarProdutor) => Promise<void>;
  editarProdutor: (id: string, corpo: EditarProdutor) => Promise<void>;
  excluirProdutor: (id: string) => Promise<void>;
  criarPropriedade: (corpo: CriarPropriedade) => Promise<void>;
  editarPropriedade: (id: string, corpo: EditarPropriedade) => Promise<void>;
  excluirPropriedade: (id: string) => Promise<void>;
  acrescentarCultura: (corpo: AcrescentarCultura) => Promise<void>;
  criarSafra: (corpo: CriarSafra) => Promise<void>;
  registrarPlantio: (corpo: RegistrarPlantio) => Promise<void>;
  excluirPlantio: (id: string) => Promise<void>;
}

const CadastroContexto = createContext<Cadastro | undefined>(undefined);

/** Os quatro catálogos, pedidos em paralelo e esperados de uma vez. */
async function buscarCatalogos(): Promise<Catalogos> {
  const [produtores, propriedades, culturas, safras] = await Promise.all([
    listarProdutores(PRIMEIRA_PAGINA, TAMANHO_DO_CATALOGO),
    listarPropriedades(PRIMEIRA_PAGINA, TAMANHO_DO_CATALOGO),
    listarCulturas(),
    listarSafras(),
  ]);

  return {
    produtores: produtores.itens,
    propriedades: propriedades.itens,
    culturas,
    safras,
    cortado:
      produtores.total > TAMANHO_DO_CATALOGO || propriedades.total > TAMANHO_DO_CATALOGO,
  };
}

interface Props {
  children: ReactNode;
}

/**
 * O estado compartilhado do cadastro.
 *
 * Toda escrita passa por aqui, e não pela seção que a disparou, para que os catálogos se
 * refaçam sozinhos: registrar um Produtor tem de aparecer na hora no campo de escolha do
 * formulário de Propriedade, que fica noutra seção.
 *
 * Depois de uma escrita os quatro catálogos são buscados de novo, e não só o que mudou.
 * É mais simples do que manter uma tabela de quem invalida quem, e é o que faz a exclusão
 * em cascata de um Produtor sumir também com as Propriedades dele da tela, conforme o
 * registro de decisão 0003.
 */
export function CadastroProvider({ children }: Props) {
  const [catalogos, setCatalogos] = useState<Catalogos>(CATALOGOS_VAZIOS);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>();
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let cancelado = false;

    buscarCatalogos()
      .then((resposta) => {
        if (!cancelado) {
          setCatalogos(resposta);
        }
      })
      .catch((causa: unknown) => {
        if (!cancelado) {
          setErro(mensagemDe(causa));
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCarregando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  /**
   * Faz a escrita, refaz os catálogos e avisa as tabelas.
   *
   * A recusa da escrita sobe para quem chamou, que é quem sabe onde mostrá-la. A falha da
   * releitura dos catálogos, não: ela vira o aviso do alto da tela, porque a escrita
   * passou e deixá-la subir faria a seção acusar de recusado o que foi gravado.
   */
  const escrever = useCallback(async (acao: () => Promise<unknown>): Promise<void> => {
    await acao();
    setVersao((anterior) => anterior + 1);

    try {
      setCatalogos(await buscarCatalogos());
      setErro(undefined);
    } catch (causa: unknown) {
      setErro(mensagemDe(causa));
    }
  }, []);

  /**
   * Escrita de Plantio: nenhum dos quatro catálogos muda com ela, então só as tabelas se
   * refazem. A lista de Plantios de uma Propriedade não é catálogo de ninguém.
   */
  const escreverPlantio = useCallback(async (acao: () => Promise<unknown>): Promise<void> => {
    await acao();
    setVersao((anterior) => anterior + 1);
  }, []);

  const valor = useMemo<Cadastro>(
    () => ({
      ...catalogos,
      carregando,
      erro,
      versao,
      nomeDoProdutor: (id) =>
        catalogos.produtores.find((produtor) => produtor.id === id)?.nome ?? FORA_DO_CATALOGO,
      nomeDaCultura: (id) =>
        catalogos.culturas.find((cultura) => cultura.id === id)?.nome ?? FORA_DO_CATALOGO,
      anoDaSafra: (id) => {
        const safra = catalogos.safras.find((candidata) => candidata.id === id);

        return safra === undefined ? FORA_DO_CATALOGO : String(safra.ano);
      },
      quantasPropriedadesDe: (produtorId) =>
        catalogos.propriedades.filter((propriedade) => propriedade.produtorId === produtorId)
          .length,
      criarProdutor: (corpo) => escrever(() => criarProdutor(corpo)),
      editarProdutor: (id, corpo) => escrever(() => editarProdutor(id, corpo)),
      excluirProdutor: (id) => escrever(() => excluirProdutor(id)),
      criarPropriedade: (corpo) => escrever(() => criarPropriedade(corpo)),
      editarPropriedade: (id, corpo) => escrever(() => editarPropriedade(id, corpo)),
      excluirPropriedade: (id) => escrever(() => excluirPropriedade(id)),
      acrescentarCultura: (corpo) => escrever(() => acrescentarCultura(corpo)),
      criarSafra: (corpo) => escrever(() => criarSafra(corpo)),
      registrarPlantio: (corpo) => escreverPlantio(() => registrarPlantio(corpo)),
      excluirPlantio: (id) => escreverPlantio(() => excluirPlantio(id)),
    }),
    [catalogos, carregando, erro, versao, escrever, escreverPlantio],
  );

  return <CadastroContexto.Provider value={valor}>{children}</CadastroContexto.Provider>;
}

/** O estado compartilhado do cadastro. Fora do provedor, é erro de programação. */
export function useCadastro(): Cadastro {
  const cadastro = useContext(CadastroContexto);

  if (cadastro === undefined) {
    throw new Error('useCadastro precisa estar dentro de CadastroProvider.');
  }

  return cadastro;
}
