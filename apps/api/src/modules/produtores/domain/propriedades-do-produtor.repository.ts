import type { Recorte, Recortados } from '../../../shared/domain/recorte';
import type { Propriedade } from '../../propriedades/domain/propriedade';

/** O recorte comum, mais o Produtor: a lista é sempre a dele, nunca a do cadastro. */
export interface RecorteDePropriedadesDoProdutor extends Recorte {
  produtorId: string;
}

/**
 * A porta pela qual o módulo de Produtor alcança as Propriedades dele.
 *
 * Ela é declarada aqui, no domínio de quem precisa, e implementada pelo módulo de
 * Propriedade. É assim que os dois se falam sem que um alcance a `application`, a
 * `infrastructure` ou o `http` do outro, e é o que o registro 0005 manda fazer quando um
 * caso de uso precisa de algo que vive noutro módulo: entre módulos, só `domain` é
 * território comum.
 */
export interface PropriedadesDoProdutorRepository {
  /**
   * Lista em fatias as Propriedades do Produtor, na mesma ordem da listagem do cadastro.
   *
   * A fatia existe porque nada limita quantas Propriedades um Produtor tem. Devolver
   * todas era carregar a resposta inteira na memória e no JSON, e o tamanho dela passava a
   * depender de um número que ninguém controla.
   */
  listByProdutor(recorte: RecorteDePropriedadesDoProdutor): Promise<Recortados<Propriedade>>;
  /**
   * Remove as Propriedades do Produtor, e com elas os Plantios delas. Ver o registro 0003.
   *
   * Está aqui, e não só na chave estrangeira, para a cascata ficar provável em teste de
   * caso de uso, sem Postgres de pé.
   */
  deleteByProdutor(produtorId: string): Promise<void>;
}

export const PROPRIEDADES_DO_PRODUTOR_REPOSITORY = Symbol('PropriedadesDoProdutorRepository');
