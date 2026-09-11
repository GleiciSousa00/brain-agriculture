import type { LigacaoDoPlantio, Plantio } from '../../domain/plantio';
import {
  CulturaDoPlantioNaoEncontrada,
  PlantioDuplicado,
  PropriedadeDoPlantioNaoEncontrada,
  SafraDoPlantioNaoEncontrada,
} from '../../domain/plantio.errors';
import type { Recortados } from '../../../../shared/domain/recorte';
import type { PlantioRepository, RecorteDePlantios } from '../../domain/plantio.repository';

/**
 * O que o cadastro tem, do ponto de vista das três chaves estrangeiras.
 *
 * Só quem passa isso ao construtor é o teste que quer exercitar a referência que não
 * existe. Sem isso o substituto aceita qualquer identificador, porque ele não é um banco e
 * não tem por que fingir que é.
 */
export interface ReferenciasConhecidas {
  propriedades: string[];
  culturas: string[];
  safras: string[];
}

/**
 * Repositório substituto, usado pelos testes de caso de uso. `__fakes__` fica fora do
 * build: é código de teste e não sobe para a imagem.
 *
 * Ele repete as duas recusas que no banco vêm de restrição: a referência que não existe e
 * a ligação repetida. São os caminhos difíceis de provocar contra banco de verdade, e é
 * aqui que a issue 2 manda cobri-los.
 */
export class PlantioRepositoryEmMemoria implements PlantioRepository {
  private readonly plantios = new Map<string, Plantio>();

  constructor(private readonly conhecidas?: ReferenciasConhecidas) {}

  async save(plantio: Plantio): Promise<void> {
    this.conferirReferencias(plantio);

    if (await this.findByLigacao(plantio)) {
      throw new PlantioDuplicado();
    }

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
  }: RecorteDePlantios): Promise<Recortados<Plantio>> {
    const daPropriedade = [...this.plantios.values()].filter(
      (plantio) => plantio.propriedadeId === propriedadeId,
    );

    return {
      itens: daPropriedade.slice(deslocamento, deslocamento + limite),
      total: daPropriedade.length,
    };
  }

  private conferirReferencias(plantio: Plantio): void {
    if (this.conhecidas === undefined) {
      return;
    }

    if (!this.conhecidas.propriedades.includes(plantio.propriedadeId)) {
      throw new PropriedadeDoPlantioNaoEncontrada(plantio.propriedadeId);
    }

    if (!this.conhecidas.culturas.includes(plantio.culturaId)) {
      throw new CulturaDoPlantioNaoEncontrada(plantio.culturaId);
    }

    if (!this.conhecidas.safras.includes(plantio.safraId)) {
      throw new SafraDoPlantioNaoEncontrada(plantio.safraId);
    }
  }
}
