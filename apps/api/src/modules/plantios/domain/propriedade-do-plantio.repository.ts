/**
 * A porta pela qual o módulo de Plantio pergunta se uma Propriedade existe.
 *
 * Ela é declarada aqui, no domínio de quem precisa, e implementada pelo módulo de
 * Propriedade. É assim que os dois se falam sem que um alcance a `application`, a
 * `infrastructure` ou o `http` do outro. Ver o registro 0005.
 *
 * A porta pergunta só isso, e não devolve a Propriedade: quem lista Plantios não tem o que
 * fazer com ela, e uma porta que devolve mais do que se usa vira acoplamento sem motivo.
 */
export interface PropriedadeDoPlantioRepository {
  existe(propriedadeId: string): Promise<boolean>;
}

export const PROPRIEDADE_DO_PLANTIO_REPOSITORY = Symbol('PropriedadeDoPlantioRepository');
