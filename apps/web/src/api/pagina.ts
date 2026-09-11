import type { Pagina } from '@cadastro-rural/contracts';

/** O invólucro que toda listagem da API devolve, com o formato vindo do contrato. */
export type { Pagina };

/** A primeira página é a de número um, e não a de número zero. */
export const PRIMEIRA_PAGINA = 1;

/** Quantos registros cada tabela da tela mostra por vez. O teto da API é cem. */
export const TAMANHO_DA_PAGINA = 10;

/**
 * O teto de uma listagem da API.
 *
 * É quanto se pede quando se precisa de uma fatia inteira de uma vez, como ao resolver os
 * nomes dos donos de uma página de Propriedades: a página não passa deste teto, e a lista
 * de identificadores que sai dela também não.
 */
export const TAMANHO_MAXIMO = 100;

/** Quantas páginas o total ocupa. Uma base vazia continua tendo uma página. */
export function quantasPaginas({ total, tamanho }: Pick<Pagina<unknown>, 'total' | 'tamanho'>): number {
  return Math.max(1, Math.ceil(total / tamanho));
}

/**
 * Quantos registros o campo de busca oferece por vez.
 *
 * Uma lista curta é o que se lê de relance, e quem não achou aqui digita mais uma letra
 * em vez de rolar. O teto do catálogo continua valendo para quem não digitou nada.
 */
export const TAMANHO_DA_BUSCA = 20;
