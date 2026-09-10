import { QueryFailedError, type Repository } from 'typeorm';
import type { Safra } from '../domain/safra';
import { SafraDuplicada } from '../domain/safra.errors';
import type { SafraRepository } from '../domain/safra.repository';
import { safraParaDominio, safraParaLinha } from './safra.mapper';
import { SafraOrmEntity } from './safra.orm-entity';

/** Código do Postgres para violação de restrição de unicidade. */
const UNICIDADE_VIOLADA = '23505';

export class TypeormSafraRepository implements SafraRepository {
  constructor(private readonly linhas: Repository<SafraOrmEntity>) {}

  async save(safra: Safra): Promise<void> {
    try {
      await this.linhas.insert(safraParaLinha(safra));
    } catch (erro) {
      if (violouUnicidade(erro)) {
        throw new SafraDuplicada(safra.ano);
      }

      throw erro;
    }
  }

  async findByAno(ano: number): Promise<Safra | null> {
    const linha = await this.linhas.findOneBy({ ano });

    return linha === null ? null : safraParaDominio(linha);
  }

  async listAll(): Promise<Safra[]> {
    const linhas = await this.linhas.find({ order: { ano: 'DESC' } });

    return linhas.map(safraParaDominio);
  }
}

function violouUnicidade(erro: unknown): boolean {
  return (
    erro instanceof QueryFailedError &&
    (erro.driverError as { code?: string } | undefined)?.code === UNICIDADE_VIOLADA
  );
}
