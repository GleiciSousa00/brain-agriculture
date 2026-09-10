import { QueryFailedError, type Repository } from 'typeorm';
import type { Cultura } from '../domain/cultura';
import { CulturaDuplicada } from '../domain/cultura.errors';
import type { CulturaRepository } from '../domain/cultura.repository';
import { culturaParaDominio, culturaParaLinha } from './cultura.mapper';
import { CulturaOrmEntity } from './cultura.orm-entity';

/** Código do Postgres para violação de restrição de unicidade. */
const UNICIDADE_VIOLADA = '23505';

export class TypeormCulturaRepository implements CulturaRepository {
  constructor(private readonly linhas: Repository<CulturaOrmEntity>) {}

  async save(cultura: Cultura): Promise<void> {
    try {
      await this.linhas.insert(culturaParaLinha(cultura));
    } catch (erro) {
      if (violouUnicidade(erro)) {
        throw new CulturaDuplicada(cultura.nome);
      }

      throw erro;
    }
  }

  async findByChave(chave: string): Promise<Cultura | null> {
    const linha = await this.linhas.findOneBy({ chave });

    return linha === null ? null : culturaParaDominio(linha);
  }

  async listAll(): Promise<Cultura[]> {
    const linhas = await this.linhas.find({ order: { chave: 'ASC' } });

    return linhas.map(culturaParaDominio);
  }
}

function violouUnicidade(erro: unknown): boolean {
  return (
    erro instanceof QueryFailedError &&
    (erro.driverError as { code?: string } | undefined)?.code === UNICIDADE_VIOLADA
  );
}
