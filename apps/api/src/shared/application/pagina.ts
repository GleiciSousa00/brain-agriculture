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
