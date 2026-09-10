import type { Pagina, PedidoDePagina } from '../../../shared/application/pagina';
import { deslocamentoDe } from '../../../shared/application/pagina';
import type { Propriedade } from '../domain/propriedade';
import type { PropriedadeRepository } from '../domain/propriedade.repository';

/**
 * Lista as Propriedades em fatias, para a listagem continuar utilizável quando houver
 * muitas.
 *
 * A aritmética de página é feita aqui: a porta fala em deslocamento e limite, que é o
 * vocabulário que `domain` consegue nomear sem enxergar `shared/application`.
 */
export class ListarPropriedadesUseCase {
  constructor(private readonly propriedades: PropriedadeRepository) {}

  async execute(pedido: PedidoDePagina): Promise<Pagina<Propriedade>> {
    const { itens, total } = await this.propriedades.list({
      deslocamento: deslocamentoDe(pedido),
      limite: pedido.tamanho,
    });

    return { itens, total, pagina: pedido.pagina, tamanho: pedido.tamanho };
  }
}
