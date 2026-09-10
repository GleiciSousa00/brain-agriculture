import type { Pagina, PedidoDePagina } from '../../../shared/application/pagina';
import { deslocamentoDe } from '../../../shared/application/pagina';
import type { Plantio } from '../domain/plantio';
import type { PlantioRepository } from '../domain/plantio.repository';

/**
 * Lista em fatias os Plantios de uma Propriedade.
 *
 * Não se confere que a Propriedade existe: uma Propriedade pode não ter nenhum Plantio, e
 * a fatia vazia é a resposta certa nos dois casos. Conferir custaria uma porta para o
 * módulo de Propriedade sem mudar o que a operadora vê.
 *
 * A aritmética de página é feita aqui: a porta fala em deslocamento e limite, que é o
 * vocabulário que `domain` consegue nomear sem enxergar `shared/application`.
 */
export class ListarPlantiosDaPropriedadeUseCase {
  constructor(private readonly plantios: PlantioRepository) {}

  async execute(propriedadeId: string, pedido: PedidoDePagina): Promise<Pagina<Plantio>> {
    const { itens, total } = await this.plantios.listByPropriedade({
      propriedadeId,
      deslocamento: deslocamentoDe(pedido),
      limite: pedido.tamanho,
    });

    return { itens, total, pagina: pedido.pagina, tamanho: pedido.tamanho };
  }
}
