import type { Plantio } from '../../../plantios/domain/plantio';
import type {
  PlantiosDaCultura,
  PlantiosDoPainelRepository,
} from '../../domain/plantios-do-painel.repository';

/**
 * Substituto da porta que o painel abre para o módulo de Plantio.
 *
 * Ele repete a ordem do repositório de verdade: a maior fatia primeiro, com o
 * identificador da Cultura desempatando.
 */
export class PlantiosDoPainelEmMemoria implements PlantiosDoPainelRepository {
  private readonly plantios: Plantio[] = [];

  acrescentar(...novos: Plantio[]): void {
    this.plantios.push(...novos);
  }

  async contarPorCultura(safraId?: string): Promise<PlantiosDaCultura[]> {
    const daSafra =
      safraId === undefined
        ? this.plantios
        : this.plantios.filter((plantio) => plantio.safraId === safraId);
    const contagem = new Map<string, number>();

    for (const plantio of daSafra) {
      contagem.set(plantio.culturaId, (contagem.get(plantio.culturaId) ?? 0) + 1);
    }

    return [...contagem]
      .map(([culturaId, plantios]) => ({ culturaId, plantios }))
      .sort(
        (uma, outra) =>
          outra.plantios - uma.plantios || (uma.culturaId < outra.culturaId ? -1 : 1),
      );
  }
}
