import { Area } from '../../../propriedades/domain/area';
import type {
  Propriedade,
  UnidadeFederativa,
} from '../../../propriedades/domain/propriedade';
import type { PropriedadesPorEstado } from '../../domain/painel';
import type {
  PropriedadesDoPainelRepository,
  ResumoDasPropriedades,
} from '../../domain/propriedades-do-painel.repository';

/**
 * Substituto da porta que o painel abre para o módulo de Propriedade. Como qualquer
 * `__fakes__`, é código de teste e não sobe para a imagem.
 *
 * Ele guarda Propriedades e agrega na hora, na mesma ordem do repositório de verdade: a
 * maior fatia primeiro, com a sigla desempatando.
 */
export class PropriedadesDoPainelEmMemoria implements PropriedadesDoPainelRepository {
  private readonly propriedades: Propriedade[] = [];

  acrescentar(...novas: Propriedade[]): void {
    this.propriedades.push(...novas);
  }

  async resumir(): Promise<ResumoDasPropriedades> {
    return {
      propriedades: this.propriedades.length,
      areaTotal: this.somar((propriedade) => propriedade.areaTotal),
      areaAgricultavel: this.somar((propriedade) => propriedade.areaAgricultavel),
      areaDeVegetacao: this.somar((propriedade) => propriedade.areaDeVegetacao),
    };
  }

  async contarPorEstado(): Promise<PropriedadesPorEstado[]> {
    const contagem = new Map<UnidadeFederativa, number>();

    for (const propriedade of this.propriedades) {
      contagem.set(propriedade.estado, (contagem.get(propriedade.estado) ?? 0) + 1);
    }

    return [...contagem]
      .map(([estado, propriedades]) => ({ estado, propriedades }))
      .sort(
        (uma, outra) =>
          outra.propriedades - uma.propriedades || (uma.estado < outra.estado ? -1 : 1),
      );
  }

  private somar(extrair: (propriedade: Propriedade) => Area): Area {
    return this.propriedades.reduce(
      (soma, propriedade) => soma.somar(extrair(propriedade)),
      Area.restaurar(0),
    );
  }
}
