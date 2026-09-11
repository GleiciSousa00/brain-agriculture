import type {
  AcrescentarCultura,
  CriarProdutor,
  CriarPropriedade,
  CriarSafra,
  Cultura,
  EditarProdutor,
  EditarPropriedade,
  Propriedade,
  RegistrarPlantio,
  Safra,
} from '@cadastro-rural/contracts';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { mensagemDe } from '../../api/chamada';
import {
  acrescentarCultura,
  criarSafra,
  excluirCultura,
  excluirSafra,
  listarCulturas,
  listarSafras,
} from '../../api/catalogo';
import { PRIMEIRA_PAGINA, TAMANHO_MAXIMO } from '../../api/pagina';
import { excluirPlantio, registrarPlantio } from '../../api/plantios';
import {
  buscarProdutoresPorId,
  criarProdutor,
  editarProdutor,
  excluirProdutor,
  listarProdutores,
} from '../../api/produtores';
import {
  criarPropriedade,
  editarPropriedade,
  excluirPropriedade,
  listarPropriedades,
} from '../../api/propriedades';
import { SEM_RECORTE, useHierarquia } from './hierarquia';

/**
 * O que as seções do cadastro precisam umas das outras.
 *
 * Cultura e Safra são catálogos de verdade: listas curtas e fechadas, que o formulário de
 * Plantio oferece inteiras. As Propriedades vêm junto porque a seção de Plantios mostra os
 * dados da que está escolhida.
 *
 * Produtor não está aqui de propósito: quem precisa de um o pede à API por nome ou por
 * identificador. Ver o registro 0012.
 */
export interface Catalogos {
  propriedades: Propriedade[];
  culturas: Cultura[];
  safras: Safra[];
  /** Há ao menos um Produtor cadastrado. Sem nenhum, não há em nome de quem registrar. */
  temProdutor: boolean;
}

/**
 * O que a tela põe no lugar do nome que não pôde ser resolvido.
 *
 * Vale para a Cultura e para a Safra de um Plantio que apontam para fora do catálogo, e para
 * o dono de uma Propriedade que não pôde ser nomeado. Nos três casos é sintoma de dado
 * inconsistente, e não de lista cortada.
 */
export const FORA_DO_CATALOGO = '—';

const CATALOGOS_VAZIOS: Catalogos = {
  propriedades: [],
  culturas: [],
  safras: [],
  temProdutor: false,
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
   * O nome do Produtor em cujo recorte se está, ou vazio.
   *
   * Ele é pedido à API pelo identificador que está no endereço, e por isso alcança qualquer
   * Produtor do cadastro. Vazio enquanto a resposta não chega, e vazio quando não há recorte
   * nenhum: é o que faz o rastro se calar em vez de nomear o recorte com um travessão.
   */
  nomeDoDono: string;
  nomeDaCultura: (id: string) => string;
  anoDaSafra: (id: string) => string;
  criarProdutor: (corpo: CriarProdutor) => Promise<void>;
  editarProdutor: (id: string, corpo: EditarProdutor) => Promise<void>;
  excluirProdutor: (id: string) => Promise<void>;
  criarPropriedade: (corpo: CriarPropriedade) => Promise<void>;
  editarPropriedade: (id: string, corpo: EditarPropriedade) => Promise<void>;
  excluirPropriedade: (id: string) => Promise<void>;
  acrescentarCultura: (corpo: AcrescentarCultura) => Promise<void>;
  excluirCultura: (id: string) => Promise<void>;
  criarSafra: (corpo: CriarSafra) => Promise<void>;
  excluirSafra: (id: string) => Promise<void>;
  registrarPlantio: (corpo: RegistrarPlantio) => Promise<void>;
  excluirPlantio: (id: string) => Promise<void>;
}

const CadastroContexto = createContext<Cadastro | undefined>(undefined);

/**
 * Os catálogos, pedidos em paralelo e esperados de uma vez.
 *
 * Dos Produtores só se pergunta se existe algum, e por isso a fatia pedida é de um: o que
 * interessa é o total, e não as linhas.
 */
async function buscarCatalogos(): Promise<Catalogos> {
  const [produtores, propriedades, culturas, safras] = await Promise.all([
    listarProdutores(PRIMEIRA_PAGINA, 1),
    listarPropriedades(PRIMEIRA_PAGINA, TAMANHO_MAXIMO),
    listarCulturas(),
    listarSafras(),
  ]);

  return {
    propriedades: propriedades.itens,
    culturas,
    safras,
    temProdutor: produtores.total > 0,
  };
}

interface Props {
  children: ReactNode;
}

/**
 * O estado compartilhado do cadastro.
 *
 * Toda escrita passa por aqui, e não pela seção que a disparou, para que os catálogos se
 * refaçam sozinhos: registrar uma Propriedade tem de aparecer na hora no campo de escolha do
 * formulário de Plantio, que fica noutra seção.
 *
 * Depois de uma escrita os catálogos são buscados de novo, e não só o que mudou. É mais
 * simples do que manter uma tabela de quem invalida quem, e é o que faz a exclusão em
 * cascata de um Produtor sumir também com as Propriedades dele da tela, conforme o registro
 * de decisão 0003.
 */
export function CadastroProvider({ children }: Props) {
  const { produtorId } = useHierarquia();
  const [catalogos, setCatalogos] = useState<Catalogos>(CATALOGOS_VAZIOS);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>();
  const [versao, setVersao] = useState(0);
  const [nomeDoDono, setNomeDoDono] = useState('');

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
   * Resolve o nome do dono do recorte, e o resolve de novo a cada escrita, porque uma delas
   * pode ter sido a correção desse nome.
   *
   * A falha fica calada: quem não conseguiu nomear o recorte mostra a lista sem nomeá-lo, e
   * as linhas dela vêm de outra chamada, que continua de pé. O aviso de erro do alto da tela
   * é dos catálogos, e emprestá-lo daqui acusaria de quebrado o que está funcionando.
   */
  useEffect(() => {
    if (produtorId === SEM_RECORTE) {
      setNomeDoDono('');

      return;
    }

    let cancelado = false;

    buscarProdutoresPorId([produtorId])
      .then((encontrados) => {
        if (!cancelado) {
          setNomeDoDono(encontrados.at(0)?.nome ?? '');
        }
      })
      .catch(() => {
        if (!cancelado) {
          setNomeDoDono('');
        }
      });

    return () => {
      cancelado = true;
    };
  }, [produtorId, versao]);

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
   * Escrita de Plantio: nenhum catálogo muda com ela, então só as tabelas se refazem. A
   * lista de Plantios de uma Propriedade não é catálogo de ninguém.
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
      nomeDoDono,
      nomeDaCultura: (id) =>
        catalogos.culturas.find((cultura) => cultura.id === id)?.nome ?? FORA_DO_CATALOGO,
      anoDaSafra: (id) => {
        const safra = catalogos.safras.find((candidata) => candidata.id === id);

        return safra === undefined ? FORA_DO_CATALOGO : String(safra.ano);
      },
      criarProdutor: (corpo) => escrever(() => criarProdutor(corpo)),
      editarProdutor: (id, corpo) => escrever(() => editarProdutor(id, corpo)),
      excluirProdutor: (id) => escrever(() => excluirProdutor(id)),
      criarPropriedade: (corpo) => escrever(() => criarPropriedade(corpo)),
      editarPropriedade: (id, corpo) => escrever(() => editarPropriedade(id, corpo)),
      excluirPropriedade: (id) => escrever(() => excluirPropriedade(id)),
      acrescentarCultura: (corpo) => escrever(() => acrescentarCultura(corpo)),
      excluirCultura: (id) => escrever(() => excluirCultura(id)),
      criarSafra: (corpo) => escrever(() => criarSafra(corpo)),
      excluirSafra: (id) => escrever(() => excluirSafra(id)),
      registrarPlantio: (corpo) => escreverPlantio(() => registrarPlantio(corpo)),
      excluirPlantio: (id) => escreverPlantio(() => excluirPlantio(id)),
    }),
    [catalogos, carregando, erro, versao, nomeDoDono, escrever, escreverPlantio],
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
