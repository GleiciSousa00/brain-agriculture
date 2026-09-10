import { Safra } from '../domain/safra';
import { SafraDuplicada } from '../domain/safra.errors';
import type { SafraRepository } from '../domain/safra.repository';

export interface CriarSafraEntrada {
  ano: number;
}

/** Registra uma Safra nova. Um ano já registrado é recusado. */
export class CriarSafraUseCase {
  constructor(private readonly safras: SafraRepository) {}

  async execute({ ano }: CriarSafraEntrada): Promise<Safra> {
    const safra = Safra.criar({ ano });

    if (await this.safras.findByAno(safra.ano)) {
      throw new SafraDuplicada(safra.ano);
    }

    await this.safras.save(safra);

    return safra;
  }
}
