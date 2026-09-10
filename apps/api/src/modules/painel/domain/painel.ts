import type { Area } from '../../propriedades/domain/area';

/**
 * Os dois totais que descrevem o tamanho da base.
 *
 * Eles não têm dimensão de Safra, e nem poderiam ter: a extensão pertence à Propriedade, e
 * não ao Plantio. Ver a decisão do painel na issue 2.
 */
export interface TotaisDoCadastro {
  propriedades: number;
  areaTotal: Area;
}

/** A repartição da terra entre cultivo e vegetação, somada no cadastro inteiro. */
export interface UsoDoSolo {
  areaAgricultavel: Area;
  areaDeVegetacao: Area;
}

/** Uma fatia do gráfico por estado. */
export interface PropriedadesPorEstado {
  /** A sigla como está gravada. Ler não é hora de reaplicar a regra de escrita. */
  estado: string;
  propriedades: number;
}

/** Uma fatia do gráfico por Cultura, já com o nome que veio do catálogo. */
export interface PlantiosPorCultura {
  culturaId: string;
  cultura: string;
  plantios: number;
}

/**
 * Os números que a gestora vê, reunidos.
 *
 * Nenhum deles é uma entidade: o painel responde perguntas sobre o cadastro, e carregar
 * Propriedades ou Plantios para somá-los em memória é o que o registro 0004 proíbe.
 */
export interface Painel {
  totais: TotaisDoCadastro;
  usoDoSolo: UsoDoSolo;
  propriedadesPorEstado: PropriedadesPorEstado[];
  plantiosPorCultura: PlantiosPorCultura[];
}
