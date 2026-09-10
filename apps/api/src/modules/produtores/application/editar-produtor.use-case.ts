import type { Produtor } from '../domain/produtor';
import { ProdutorNaoEncontrado } from '../domain/produtor.errors';
import type { ProdutorRepository } from '../domain/produtor.repository';

export interface EditarProdutorEntrada {
  id: string;
  nome: string;
}

/**
 * Corrige o nome de um Produtor já cadastrado.
 *
 * O Documento não entra: ele é o que identifica o Produtor, e trocá-lo seria cadastrar
 * outro em vez de corrigir este. Por isso a entrada não tem o campo, e não porque alguém
 * se esqueceu de aceitá-lo.
 */
export class EditarProdutorUseCase {
  constructor(private readonly produtores: ProdutorRepository) {}

  async execute({ id, nome }: EditarProdutorEntrada): Promise<Produtor> {
    const produtor = await this.produtores.findById(id);

    if (produtor === null) {
      throw new ProdutorNaoEncontrado(id);
    }

    const renomeado = produtor.renomear(nome);
    await this.produtores.update(renomeado);

    return renomeado;
  }
}
