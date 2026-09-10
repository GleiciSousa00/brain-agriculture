import { Plantio, type LigacaoDoPlantio } from '../domain/plantio';
import { PlantioDuplicado } from '../domain/plantio.errors';
import type { PlantioRepository } from '../domain/plantio.repository';

/**
 * Liga uma Cultura a uma Propriedade em uma Safra.
 *
 * A consulta prévia existe para a resposta poder dizer o que está repetido; a restrição de
 * unicidade do banco é que fecha a janela entre conferir e gravar, e o repositório traduz
 * a violação para o mesmo erro. Que a Cultura, a Propriedade e a Safra existam é garantido
 * pelas chaves estrangeiras, pelo mesmo motivo.
 */
export class RegistrarPlantioUseCase {
  constructor(private readonly plantios: PlantioRepository) {}

  async execute(entrada: LigacaoDoPlantio): Promise<Plantio> {
    if (await this.plantios.findByLigacao(entrada)) {
      throw new PlantioDuplicado();
    }

    const plantio = Plantio.criar(entrada);

    await this.plantios.save(plantio);

    return plantio;
  }
}
