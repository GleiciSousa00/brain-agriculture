import { Cultura } from '../domain/cultura';
import { CulturaDuplicada } from '../domain/cultura.errors';
import type { CulturaRepository } from '../domain/cultura.repository';

export interface AcrescentarCulturaEntrada {
  nome: string;
}

/**
 * Acrescenta uma espécie ao catálogo.
 *
 * A duplicata é conferida pela chave de comparação, não pelo nome digitado: "Café" e
 * "cafe" são a mesma espécie e só uma delas entra.
 */
export class AcrescentarCulturaUseCase {
  constructor(private readonly culturas: CulturaRepository) {}

  async execute({ nome }: AcrescentarCulturaEntrada): Promise<Cultura> {
    const cultura = Cultura.criar({ nome });

    if (await this.culturas.findByChave(cultura.chave)) {
      throw new CulturaDuplicada(cultura.nome);
    }

    await this.culturas.save(cultura);

    return cultura;
  }
}
