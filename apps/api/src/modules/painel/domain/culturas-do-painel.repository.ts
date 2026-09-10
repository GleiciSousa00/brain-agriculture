/**
 * A porta pela qual o painel alcança o nome da Cultura.
 *
 * Ela é declarada aqui e implementada pelo módulo de Cultura. A contagem por Cultura sai
 * agregada do banco com o identificador, e esta porta traz só os nomes desses
 * identificadores, por chave primária. É uma consulta a mais, e não uma agregação a mais:
 * o registro 0004 continua valendo.
 *
 * A alternativa seria a infraestrutura de Plantio juntar a tabela do catálogo no próprio
 * SQL. Ela economiza uma ida ao banco e faz um módulo passar a conhecer as colunas do
 * outro, acoplamento que o `dependency-cruiser` não pega porque não é importação.
 */
export interface CulturasDoPainelRepository {
  /** O nome de cada Cultura pedida. Identificador sem Cultura no catálogo não vem no mapa. */
  nomesPorId(ids: string[]): Promise<Map<string, string>>;
}

export const CULTURAS_DO_PAINEL_REPOSITORY = Symbol('CulturasDoPainelRepository');
