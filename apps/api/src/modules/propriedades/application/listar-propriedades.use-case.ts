import type { Pagina, PedidoDePagina } from '../../../shared/application/pagina';
import { paginar } from '../../../shared/application/pagina';
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

  execute(pedido: PedidoDePagina): Promise<Pagina<Propriedade>> {
    return paginar(pedido, (recorte) => this.propriedades.list(recorte));
  }
}
