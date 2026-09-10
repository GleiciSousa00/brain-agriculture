/**
 * Uma fatia da contagem por Cultura, ainda sem o nome.
 *
 * O nome mora no catálogo, que é de outro módulo, e o Plantio guarda apenas o
 * identificador. Quem junta os dois é o caso de uso.
 */
export interface PlantiosDaCultura {
  culturaId: string;
  plantios: number;
}

/**
 * A porta pela qual o painel alcança a contagem de Plantios.
 *
 * Ela é declarada aqui e implementada pelo módulo de Plantio. Ver o registro 0005.
 */
export interface PlantiosDoPainelRepository {
  /**
   * Conta os Plantios agrupados por Cultura, da maior fatia para a menor, com o
   * identificador desempatando as de mesmo tamanho.
   *
   * A Safra é o único filtro do painel, e existe só aqui: o Plantio é a única entidade que
   * liga Cultura, Propriedade e Safra. Sem ela, a contagem é a de todas as Safras.
   */
  contarPorCultura(safraId?: string): Promise<PlantiosDaCultura[]>;
}

export const PLANTIOS_DO_PAINEL_REPOSITORY = Symbol('PlantiosDoPainelRepository');
