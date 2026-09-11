import { paginarBusca, type Pagina, type PedidoDeBusca } from '../../../shared/application/pagina';
import type { Produtor } from '../domain/produtor';
import type { ProdutorRepository } from '../domain/produtor.repository';
import type { PropriedadesDoProdutorRepository } from '../domain/propriedades-do-produtor.repository';

/** O pedido de página da listagem, mais o punhado de identificadores que a recorta. */
export interface PedidoDeProdutores extends PedidoDeBusca {
  ids?: string[];
}

/**
 * O Produtor e quantas Propriedades estão em nome dele, que é o que a listagem mostra.
 *
 * Não é a resposta: quem a monta é o apresentador, e o esquema dela mora em `http`.
 */
export interface ProdutorContado {
  produtor: Produtor;
  propriedades: number;
}

/**
 * Lista os Produtores em fatias, cada um com quantas Propriedades tem.
 *
 * A listagem nunca devolve o cadastro inteiro: com muitos registros isso deixa de ser
 * utilizável, tanto para quem lê quanto para o banco. O recorte vai para o repositório
 * como deslocamento e limite, e a aritmética de página fica deste lado.
 *
 * A contagem vem junto porque é o que distingue, na tela, o Produtor que ainda não tem
 * Propriedade nenhuma. Ela é pedida de uma vez para a página inteira, e não de linha em
 * linha.
 */
export class ListarProdutoresUseCase {
  constructor(
    private readonly produtores: ProdutorRepository,
    private readonly propriedades: PropriedadesDoProdutorRepository,
  ) {}

  async execute(pedido: PedidoDeProdutores): Promise<Pagina<ProdutorContado>> {
    const pagina = await paginarBusca(pedido, (recorte) =>
      this.produtores.list({ ...recorte, ids: pedido.ids }),
    );

    const quantas = await this.propriedades.contarPorProdutor(
      pagina.itens.map((produtor) => produtor.id),
    );

    return {
      ...pagina,
      itens: pagina.itens.map((produtor) => ({
        produtor,
        propriedades: quantas.get(produtor.id) ?? 0,
      })),
    };
  }
}
