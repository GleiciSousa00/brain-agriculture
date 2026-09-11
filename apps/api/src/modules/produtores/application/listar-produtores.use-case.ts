import { paginarBusca, type Pagina, type PedidoDeBusca } from '../../../shared/application/pagina';
import type { Produtor } from '../domain/produtor';
import type { ProdutorRepository } from '../domain/produtor.repository';

/**
 * Lista os Produtores em fatias.
 *
 * A listagem nunca devolve o cadastro inteiro: com muitos registros isso deixa de ser
 * utilizável, tanto para quem lê quanto para o banco. O recorte vai para o repositório
 * como deslocamento e limite, e a aritmética de página fica deste lado.
 */
export class ListarProdutoresUseCase {
  constructor(private readonly produtores: ProdutorRepository) {}

  execute(pedido: PedidoDeBusca): Promise<Pagina<Produtor>> {
    return paginarBusca(pedido, (recorte) => this.produtores.list(recorte));
  }
}
