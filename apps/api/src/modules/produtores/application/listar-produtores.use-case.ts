import { deslocamentoDe, type Pagina, type PedidoDePagina } from '../../../shared/application/pagina';
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

  async execute(pedido: PedidoDePagina): Promise<Pagina<Produtor>> {
    const { itens, total } = await this.produtores.list({
      deslocamento: deslocamentoDe(pedido),
      limite: pedido.tamanho,
    });

    return { itens, total, pagina: pedido.pagina, tamanho: pedido.tamanho };
  }
}
