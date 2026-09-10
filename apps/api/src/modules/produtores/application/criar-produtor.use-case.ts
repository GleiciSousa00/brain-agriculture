import { Documento } from '../domain/documento';
import { Produtor } from '../domain/produtor';
import { ProdutorDuplicado } from '../domain/produtor.errors';
import type { ProdutorRepository } from '../domain/produtor.repository';

export interface CriarProdutorEntrada {
  /** O Documento como a operadora digitou, com ou sem máscara. */
  documento: string;
  nome: string;
}

/**
 * Registra um Produtor novo.
 *
 * A conferência do Documento acontece antes de qualquer ida ao repositório, e a duplicata
 * é recusada aqui para a mensagem ser clara. A restrição de unicidade do banco continua
 * valendo como rede de baixo, para o caso de duas requisições simultâneas.
 */
export class CriarProdutorUseCase {
  constructor(private readonly produtores: ProdutorRepository) {}

  async execute({ documento, nome }: CriarProdutorEntrada): Promise<Produtor> {
    const documentoConferido = Documento.criar(documento);

    if (await this.produtores.findByDocumento(documentoConferido)) {
      throw new ProdutorDuplicado();
    }

    const produtor = Produtor.criar({ documento: documentoConferido, nome });
    await this.produtores.save(produtor);

    return produtor;
  }
}
