import { Documento } from '../domain/documento';
import { Produtor } from '../domain/produtor';
import type { DocumentoCrypto } from './crypto/documento-crypto';
import { ProdutorOrmEntity } from './produtor.orm-entity';

/** Traduz entre a entidade de domínio e a linha da tabela, cifrando e decifrando no caminho. */
export class ProdutorMapper {
  constructor(private readonly crypto: DocumentoCrypto) {}

  paraLinha(produtor: Produtor): ProdutorOrmEntity {
    const linha = new ProdutorOrmEntity();
    linha.id = produtor.id;
    linha.nome = produtor.nome;
    linha.documentoCifrado = this.crypto.cifrar(produtor.documento.valor);
    linha.documentoImpressao = this.crypto.impressao(produtor.documento.valor);

    return linha;
  }

  /** A coluna determinística sobre a qual a busca por igualdade acontece. */
  impressaoDe(documento: Documento): string {
    return this.crypto.impressao(documento.valor);
  }

  paraDominio(linha: ProdutorOrmEntity): Produtor {
    return Produtor.restaurar({
      id: linha.id,
      documento: Documento.criar(this.crypto.decifrar(linha.documentoCifrado)),
      nome: linha.nome,
    });
  }
}
