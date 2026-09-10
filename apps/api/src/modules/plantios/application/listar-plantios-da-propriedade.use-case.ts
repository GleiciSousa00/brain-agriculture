import type { Pagina, PedidoDePagina } from '../../../shared/application/pagina';
import { paginar } from '../../../shared/application/pagina';
import type { Plantio } from '../domain/plantio';
import { PropriedadeDoPlantioNaoEncontrada } from '../domain/plantio.errors';
import type { PlantioRepository } from '../domain/plantio.repository';
import type { PropriedadeDoPlantioRepository } from '../domain/propriedade-do-plantio.repository';

/**
 * Lista em fatias os Plantios de uma Propriedade.
 *
 * A existência da Propriedade é conferida antes, por uma porta que o módulo de Propriedade
 * implementa. Sem ela, uma Propriedade que não existe devolveria a fatia vazia, e um
 * identificador digitado errado ficaria indistinguível de uma Propriedade sem nenhum
 * Plantio. Não ter nenhum Plantio é normal, e continua devolvendo a fatia vazia.
 */
export class ListarPlantiosDaPropriedadeUseCase {
  constructor(
    private readonly plantios: PlantioRepository,
    private readonly propriedades: PropriedadeDoPlantioRepository,
  ) {}

  async execute(propriedadeId: string, pedido: PedidoDePagina): Promise<Pagina<Plantio>> {
    if (!(await this.propriedades.existe(propriedadeId))) {
      throw new PropriedadeDoPlantioNaoEncontrada(propriedadeId);
    }

    return paginar(pedido, (recorte) =>
      this.plantios.listByPropriedade({ propriedadeId, ...recorte }),
    );
  }
}
