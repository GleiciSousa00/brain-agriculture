import type { Painel } from '../domain/painel';
import type { PainelResposta } from './dto/painel.dto';

/**
 * Monta a resposta a partir dos números do painel. Ver o registro 0007.
 *
 * É aqui que a medida vira número: a Área é objeto de valor do domínio, e o que sai na
 * resposta é a quantidade de hectares.
 */
export function paraResposta(painel: Painel): PainelResposta {
  return {
    totais: {
      propriedades: painel.totais.propriedades,
      areaTotal: painel.totais.areaTotal.hectares,
    },
    usoDoSolo: {
      areaAgricultavel: painel.usoDoSolo.areaAgricultavel.hectares,
      areaDeVegetacao: painel.usoDoSolo.areaDeVegetacao.hectares,
    },
    propriedadesPorEstado: painel.propriedadesPorEstado.map((fatia) => ({
      estado: fatia.estado,
      propriedades: fatia.propriedades,
    })),
    plantiosPorCultura: painel.plantiosPorCultura.map((fatia) => ({
      culturaId: fatia.culturaId,
      cultura: fatia.cultura,
      plantios: fatia.plantios,
    })),
  };
}
