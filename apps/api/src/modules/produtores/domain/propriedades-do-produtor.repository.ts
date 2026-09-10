import type { Propriedade } from '../../propriedades/domain/propriedade';

/**
 * O que o módulo de Produtor precisa saber sobre Propriedade.
 *
 * A porta é declarada aqui, no domínio de quem precisa dela, e implementada pelo módulo de
 * Propriedade. É assim que os dois se falam sem que um alcance a `application`, a
 * `infrastructure` ou o `http` do outro: entre módulos só `domain` é território comum.
 * Ver o registro 0005.
 */
export interface PropriedadesDoProdutorRepository {
  listByProdutor(produtorId: string): Promise<Propriedade[]>;
  /** Remove as Propriedades do Produtor, e com elas os Plantios delas. Ver o registro 0003. */
  excluirDoProdutor(produtorId: string): Promise<void>;
}

export const PROPRIEDADES_DO_PRODUTOR_REPOSITORY = Symbol('PropriedadesDoProdutorRepository');
