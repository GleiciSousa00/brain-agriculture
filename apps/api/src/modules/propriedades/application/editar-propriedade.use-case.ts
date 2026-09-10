import { Area } from '../domain/area';
import type { Propriedade } from '../domain/propriedade';
import { PropriedadeNaoEncontrada } from '../domain/propriedade.errors';
import type { PropriedadeRepository } from '../domain/propriedade.repository';

export interface EditarPropriedadeEntrada {
  cidade: string;
  estado: string;
  areaTotal: number;
  areaAgricultavel: number;
  areaDeVegetacao: number;
}

/**
 * Atualiza a localização e as áreas de uma Propriedade.
 *
 * A regra da soma é conferida de novo pela entidade: editar é tão capaz de quebrá-la
 * quanto cadastrar, e uma edição que não revalidasse deixaria entrar pela porta dos fundos
 * o que a criação recusa pela da frente.
 */
export class EditarPropriedadeUseCase {
  constructor(private readonly propriedades: PropriedadeRepository) {}

  async execute(id: string, entrada: EditarPropriedadeEntrada): Promise<Propriedade> {
    const propriedade = await this.propriedades.findById(id);

    if (propriedade === null) {
      throw new PropriedadeNaoEncontrada(id);
    }

    const editada = propriedade.editar({
      cidade: entrada.cidade,
      estado: entrada.estado,
      areaTotal: Area.criar(entrada.areaTotal),
      areaAgricultavel: Area.criar(entrada.areaAgricultavel),
      areaDeVegetacao: Area.criar(entrada.areaDeVegetacao),
    });

    await this.propriedades.save(editada);

    return editada;
  }
}
