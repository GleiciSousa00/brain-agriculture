import { useSearchParams } from 'react-router';

/**
 * Onde se está dentro da hierarquia do cadastro.
 *
 * Produtor, Propriedade e Plantio não são três listas soltas: uma Propriedade pertence a
 * um Produtor, e um Plantio acontece em uma Propriedade. Quem se abre a partir de um
 * registro carrega esse registro consigo, e é isso que estes dois parâmetros guardam.
 *
 * Eles moram no endereço, e não em estado, pelo mesmo motivo que levou as seções a serem
 * sub-rotas: recarregar a página e mandar o link das Propriedades de um Produtor a alguém
 * precisam funcionar. Ver o registro de decisão 0010.
 */
const PRODUTOR = 'produtor';
const PROPRIEDADE = 'propriedade';

/**
 * Chega com o formulário já aberto.
 *
 * Quem clica em "Registrar a primeira" pediu para registrar, e não para olhar uma lista
 * vazia.
 */
const ABRIR = 'novo';

export interface Hierarquia {
  /** O Produtor que recorta a lista de Propriedades, ou vazio. */
  produtorId: string;
  /** A Propriedade cujos Plantios a tela mostra, ou vazio. */
  propriedadeId: string;
  /** Chegou-se aqui pedindo para registrar, e não só para ver. */
  abrindo: boolean;
}

/** Nenhum recorte: o parâmetro ausente e o parâmetro vazio dizem a mesma coisa. */
export const SEM_RECORTE = '';

export function useHierarquia(): Hierarquia {
  const [parametros] = useSearchParams();

  return {
    produtorId: parametros.get(PRODUTOR) ?? SEM_RECORTE,
    propriedadeId: parametros.get(PROPRIEDADE) ?? SEM_RECORTE,
    abrindo: parametros.get(ABRIR) !== null,
  };
}

/**
 * Tira do endereço o pedido para abrir.
 *
 * Sem isto o pedido fica colado no endereço: quem fechou o formulário o veria voltar ao
 * recarregar a página, ao voltar pelo histórico ou ao abrir o link outra vez.
 */
export function useEsquecerAbertura(): () => void {
  const [parametros, definir] = useSearchParams();

  return () => {
    if (!parametros.has(ABRIR)) {
      return;
    }

    const restante = new URLSearchParams(parametros);
    restante.delete(ABRIR);
    // Sem entrada nova no histórico: voltar tem de sair da seção, e não desfazer o fechar.
    definir(restante, { replace: true });
  };
}

/** Monta um endereço com os parâmetros que valem alguma coisa, e só com eles. */
function endereco(caminho: string, parametros: Record<string, string>): string {
  const busca = new URLSearchParams(
    Object.entries(parametros).filter(([, valor]) => valor !== SEM_RECORTE),
  ).toString();

  return busca === '' ? caminho : `${caminho}?${busca}`;
}

/** A lista inteira de Produtores: o topo da hierarquia, sem recorte nenhum. */
export const PRODUTORES = '/cadastro/produtores';

/** As Propriedades de um Produtor, ou todas elas quando não se aponta ninguém. */
export function propriedadesDe(produtorId: string, abrir = false): string {
  return endereco('/cadastro/propriedades', {
    [PRODUTOR]: produtorId,
    [ABRIR]: abrir ? '1' : SEM_RECORTE,
  });
}

/** Os Plantios de uma Propriedade. O Produtor vai junto para o rastro não se perder. */
export function plantiosDe(propriedadeId: string, produtorId: string, abrir = false): string {
  return endereco('/cadastro/plantios', {
    [PROPRIEDADE]: propriedadeId,
    [PRODUTOR]: produtorId,
    [ABRIR]: abrir ? '1' : SEM_RECORTE,
  });
}

/** O catálogo não pertence a Produtor nenhum, então o recorte não vai com ele. */
export const CATALOGOS = '/cadastro/catalogos';
