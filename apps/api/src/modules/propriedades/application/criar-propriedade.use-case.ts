import { Area } from '../domain/area';
import { Propriedade } from '../domain/propriedade';
import type { PropriedadeRepository } from '../domain/propriedade.repository';

export interface CriarPropriedadeEntrada {
  produtorId: string;
  cidade: string;
  estado: string;
  /** As três áreas chegam em hectares, e viram objeto de valor antes da regra. */
  areaTotal: number;
  areaAgricultavel: number;
  areaDeVegetacao: number;
}

/**
 * Registra uma Propriedade em nome de um Produtor.
 *
 * A regra da soma é conferida pela própria entidade, antes de qualquer ida ao repositório.
 * Que o Produtor exista é garantido pela chave estrangeira, e o repositório traduz a
 * violação dela para erro de domínio.
 */
export class CriarPropriedadeUseCase {
  constructor(private readonly propriedades: PropriedadeRepository) {}

  async execute(entrada: CriarPropriedadeEntrada): Promise<Propriedade> {
    const propriedade = Propriedade.criar({
      produtorId: entrada.produtorId,
      cidade: entrada.cidade,
      estado: entrada.estado,
      areaTotal: Area.criar(entrada.areaTotal),
      areaAgricultavel: Area.criar(entrada.areaAgricultavel),
      areaDeVegetacao: Area.criar(entrada.areaDeVegetacao),
    });

    await this.propriedades.save(propriedade);

    return propriedade;
  }
}
