import type { Pagina } from '../application/pagina';

/** O formato único de fatia que toda listagem da API devolve, já montado. */
interface PaginaResposta<R> {
  itens: R[];
  total: number;
  pagina: number;
  tamanho: number;
}

/**
 * Monta a resposta de uma listagem a partir do apresentador de um item.
 *
 * O que muda entre uma listagem e outra é só o apresentador do item. O invólucro é o mesmo
 * em todas, por contrato, e por isso é escrito uma vez.
 */
export function paginaPara<T, R>(
  pagina: Pagina<T>,
  paraResposta: (item: T) => R,
): PaginaResposta<R> {
  return {
    itens: pagina.itens.map(paraResposta),
    total: pagina.total,
    pagina: pagina.pagina,
    tamanho: pagina.tamanho,
  };
}
