import type { Recorte, RecorteComBusca, Recortados } from '../domain/recorte';

/**
 * A fatia de uma listagem, dita em vocabulário de caso de uso.
 *
 * Ela vive em `shared/application` porque mais de um módulo lista, e o formato da fatia
 * precisa ser o mesmo em todos: quem consome a API escreve um tratamento só. O limite e o
 * valor padrão de `tamanho` não moram aqui, e sim na camada `http`, que é quem conhece o
 * que chega na consulta.
 */
export interface PedidoDePagina {
  /** A primeira página é a de número um, não a de número zero. */
  pagina: number;
  tamanho: number;
}

export interface Pagina<T> {
  itens: T[];
  /** Quantos registros existem ao todo, e não quantos vieram nesta fatia. */
  total: number;
  pagina: number;
  tamanho: number;
}

/** Quantos registros pular para chegar na página pedida. */
export function deslocamentoDe({ pagina, tamanho }: PedidoDePagina): number {
  return (pagina - 1) * tamanho;
}

/**
 * Traduz o pedido de página para o recorte que a porta entende, e devolve a fatia.
 *
 * Todo caso de uso de listar faz exatamente isto, e só muda em qual porta chama. Escrever
 * a aritmética de novo em cada um é onde ela passa a divergir entre as listagens.
 */
export async function paginar<T>(
  pedido: PedidoDePagina,
  recortar: (recorte: Recorte) => Promise<Recortados<T>>,
): Promise<Pagina<T>> {
  const { itens, total } = await recortar({
    deslocamento: deslocamentoDe(pedido),
    limite: pedido.tamanho,
  });

  return { itens, total, pagina: pedido.pagina, tamanho: pedido.tamanho };
}

/**
 * O pedido de página de uma listagem que também se procura por nome.
 *
 * Mesmo desenho de `RecorteComBusca`, um degrau acima: quem lista sem procurar não passa
 * a declarar um campo que nunca preenche.
 */
export interface PedidoDeBusca extends PedidoDePagina {
  busca?: string;
}

/** Traduz o pedido com busca para o recorte que a porta entende, e devolve a fatia. */
export async function paginarBusca<T>(
  pedido: PedidoDeBusca,
  recortar: (recorte: RecorteComBusca) => Promise<Recortados<T>>,
): Promise<Pagina<T>> {
  const { itens, total } = await recortar({
    deslocamento: deslocamentoDe(pedido),
    limite: pedido.tamanho,
    busca: pedido.busca,
  });

  return { itens, total, pagina: pedido.pagina, tamanho: pedido.tamanho };
}
