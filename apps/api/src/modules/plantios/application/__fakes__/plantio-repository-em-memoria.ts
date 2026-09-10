import type { LigacaoDoPlantio, Plantio } from '../../domain/plantio';
import type {
  PlantioRepository,
  PlantiosRecortados,
  RecorteDePlantios,
} from '../../domain/plantio.repository';

/**
 * Repositório substituto, usado pelos testes de caso de uso. `__fakes__` fica fora do
 * build: é código de teste e não sobe para a imagem.
 */
export class PlantioRepositoryEmMemoria implements PlantioRepository {
  private readonly plantios = new Map<string, Plantio>();

  async save(plantio: Plantio): Promise<void> {
    this.plantios.set(plantio.id, plantio);
  }

  async findById(id: string): Promise<Plantio | null> {
    return this.plantios.get(id) ?? null;
  }

  async findByLigacao({
    propriedadeId,
    culturaId,
    safraId,
  }: LigacaoDoPlantio): Promise<Plantio | null> {
    for (const plantio of this.plantios.values()) {
      if (
        plantio.propriedadeId === propriedadeId &&
        plantio.culturaId === culturaId &&
        plantio.safraId === safraId
      ) {
        return plantio;
      }
    }

    return null;
  }

  async delete(id: string): Promise<void> {
    this.plantios.delete(id);
  }

  async listByPropriedade({
    propriedadeId,
    deslocamento,
    limite,
  }: RecorteDePlantios): Promise<PlantiosRecortados> {
    // A mesma ordem que o repositório de verdade promete. Um substituto que ordena
    // diferente faz o teste de paginação passar por acidente.
    const daPropriedade = [...this.plantios.values()]
      .filter((plantio) => plantio.propriedadeId === propriedadeId)
      .sort(
        (um, outro) =>
          um.culturaId.localeCompare(outro.culturaId) || um.safraId.localeCompare(outro.safraId),
      );

    return {
      itens: daPropriedade.slice(deslocamento, deslocamento + limite),
      total: daPropriedade.length,
    };
  }
}
