import { PlantioNaoEncontrado } from '../domain/plantio.errors';
import type { PlantioRepository } from '../domain/plantio.repository';

/**
 * Apaga um Plantio.
 *
 * A exclusão é física, conforme o registro 0003, e não leva nada junto: o Plantio é a
 * ponta da cascata. A conferência prévia existe para a resposta poder dizer que não
 * existe, em vez de responder que apagou o que nunca esteve lá.
 */
export class ExcluirPlantioUseCase {
  constructor(private readonly plantios: PlantioRepository) {}

  async execute(id: string): Promise<void> {
    if ((await this.plantios.findById(id)) === null) {
      throw new PlantioNaoEncontrado(id);
    }

    await this.plantios.delete(id);
  }
}
