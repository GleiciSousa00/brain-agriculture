import type { Area } from '../../propriedades/domain/area';
import type { PropriedadesPorEstado } from './painel';

/**
 * Os quatro números que saem da mesma varredura da tabela de Propriedade.
 *
 * A contagem, a soma de Área Total e as duas somas do Uso do Solo vêm juntas porque são
 * uma agregação só, sem agrupamento. Separá-las em duas portas seria duas idas ao banco
 * para ler as mesmas linhas.
 */
export interface ResumoDasPropriedades {
  propriedades: number;
  areaTotal: Area;
  areaAgricultavel: Area;
  areaDeVegetacao: Area;
}

/**
 * A porta pela qual o painel alcança os números da Propriedade.
 *
 * Ela é declarada aqui, no domínio de quem precisa, e implementada pelo módulo de
 * Propriedade, que é quem sabe consultar a tabela. Ver o registro 0005.
 *
 * Os dois métodos devolvem números já agregados, e nunca Propriedades: a aplicação não
 * carrega o cadastro para somar em memória. Ver o registro 0004.
 */
export interface PropriedadesDoPainelRepository {
  resumir(): Promise<ResumoDasPropriedades>;
  /** As fatias da maior para a menor, com a sigla desempatando as de mesmo tamanho. */
  contarPorEstado(): Promise<PropriedadesPorEstado[]>;
}

export const PROPRIEDADES_DO_PAINEL_REPOSITORY = Symbol('PropriedadesDoPainelRepository');
