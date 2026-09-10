import type { Pagina } from '@cadastro-rural/contracts';

/** O invólucro que toda listagem da API devolve, com o formato vindo do contrato. */
export type { Pagina };

/** A primeira página é a de número um, e não a de número zero. */
export const PRIMEIRA_PAGINA = 1;

/** Quantos registros cada tabela da tela mostra por vez. O teto da API é cem. */
export const TAMANHO_DA_PAGINA = 10;

/**
 * Quantos registros um campo de escolha oferece.
 *
 * É o teto da API. Um campo de escolha precisa oferecer também o registro que a tabela
 * não está mostrando, senão a operadora não consegue apontar para ele.
 */
export const TAMANHO_DO_CATALOGO = 100;

/** Quantas páginas o total ocupa. Uma base vazia continua tendo uma página. */
export function quantasPaginas({ total, tamanho }: Pick<Pagina<unknown>, 'total' | 'tamanho'>): number {
  return Math.max(1, Math.ceil(total / tamanho));
}
