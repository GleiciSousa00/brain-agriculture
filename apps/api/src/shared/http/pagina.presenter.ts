import type { Pagina } from '../application/pagina';

/**
 * Monta a resposta de uma listagem a partir do apresentador de um item.
 *
 * O que muda entre uma listagem e outra é só o apresentador do item. O invólucro é o mesmo
 * em todas, por contrato, e por isso é escrito uma vez.
 */
export function paginaPara<T, R>(pagina: Pagina<T>, paraResposta: (item: T) => R): Pagina<R> {
  // O espalhamento copia só os quatro campos de `Pagina`: quem monta a fatia é `paginar`,
  // então nada além desses quatro pode vazar para o corpo HTTP.
  return { ...pagina, itens: pagina.itens.map(paraResposta) };
}
