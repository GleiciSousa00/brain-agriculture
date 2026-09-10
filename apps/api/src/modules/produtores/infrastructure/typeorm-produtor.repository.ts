import { QueryFailedError, type Repository } from 'typeorm';
import type { Documento } from '../domain/documento';
import type { Produtor } from '../domain/produtor';
import { ProdutorDuplicado } from '../domain/produtor.errors';
import type { ProdutorRepository } from '../domain/produtor.repository';
import type { DocumentoCrypto } from './crypto/documento-crypto';
import type { ProdutorMapper } from './produtor.mapper';
import { ProdutorOrmEntity } from './produtor.orm-entity';

/** Código do Postgres para violação de restrição de unicidade. */
const UNICIDADE_VIOLADA = '23505';

export class TypeormProdutorRepository implements ProdutorRepository {
  constructor(
    private readonly linhas: Repository<ProdutorOrmEntity>,
    private readonly mapper: ProdutorMapper,
    private readonly crypto: DocumentoCrypto,
  ) {}

  async save(produtor: Produtor): Promise<void> {
    try {
      await this.linhas.insert(this.mapper.paraLinha(produtor));
    } catch (erro) {
      // A rede de baixo: duas requisições simultâneas passam pela conferência do caso de
      // uso e só a restrição do banco separa as duas.
      if (violouUnicidade(erro)) {
        throw new ProdutorDuplicado();
      }

      throw erro;
    }
  }

  async findById(id: string): Promise<Produtor | null> {
    const linha = await this.linhas.findOneBy({ id });

    return linha === null ? null : this.mapper.paraDominio(linha);
  }

  async findByDocumento(documento: Documento): Promise<Produtor | null> {
    // Só igualdade exata: o valor cifrado muda a cada gravação e não serve para busca.
    const linha = await this.linhas.findOneBy({
      documentoImpressao: this.crypto.impressao(documento.valor),
    });

    return linha === null ? null : this.mapper.paraDominio(linha);
  }
}

function violouUnicidade(erro: unknown): boolean {
  return (
    erro instanceof QueryFailedError &&
    (erro.driverError as { code?: string } | undefined)?.code === UNICIDADE_VIOLADA
  );
}
