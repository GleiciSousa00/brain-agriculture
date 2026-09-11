import type { Pagina, PedidoDeBusca } from '../../../shared/application/pagina';
import { paginarBusca } from '../../../shared/application/pagina';
import type { Propriedade } from '../domain/propriedade';
import type { PropriedadeRepository } from '../domain/propriedade.repository';

/** O pedido de página da listagem, mais o punhado de identificadores que a recorta. */
export interface PedidoDePropriedades extends PedidoDeBusca {
  ids?: string[];
}

/**
 * Lista as Propriedades em fatias, para a listagem continuar utilizável quando houver
 * muitas.
 *
 * A aritmética de página é feita aqui: a porta fala em deslocamento e limite, que é o
 * vocabulário que `domain` consegue nomear sem enxergar `shared/application`.
 */
export class ListarPropriedadesUseCase {
  constructor(private readonly propriedades: PropriedadeRepository) {}

  execute(pedido: PedidoDePropriedades): Promise<Pagina<Propriedade>> {
    return paginarBusca(pedido, (recorte) =>
      this.propriedades.list({ ...recorte, ids: pedido.ids }),
    );
  }
}
