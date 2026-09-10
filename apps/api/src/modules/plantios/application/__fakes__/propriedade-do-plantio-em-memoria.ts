import type { PropriedadeDoPlantioRepository } from '../../domain/propriedade-do-plantio.repository';

/** Substituto da porta de Propriedade. `__fakes__` fica fora do build. */
export class PropriedadeDoPlantioEmMemoria implements PropriedadeDoPlantioRepository {
  constructor(private readonly existentes: string[]) {}

  async existe(propriedadeId: string): Promise<boolean> {
    return this.existentes.includes(propriedadeId);
  }
}
