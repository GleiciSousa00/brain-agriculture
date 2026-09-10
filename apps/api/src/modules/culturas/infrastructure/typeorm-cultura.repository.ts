import type { Repository } from 'typeorm';
import { violouUnicidade } from '../../../shared/infrastructure/postgres-errors';
import type { Cultura } from '../domain/cultura';
import { CulturaDuplicada } from '../domain/cultura.errors';
import type { CulturaRepository } from '../domain/cultura.repository';
import { culturaParaDominio, culturaParaLinha } from './cultura.mapper';
import { CulturaOrmEntity } from './cultura.orm-entity';

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
    // `COLLATE "C"` ordena por byte. Sem isso a ordem depende da configuração regional do
    // banco, que trata hífen e espaço de um jeito, enquanto a comparação em JavaScript os
    // trata de outro, e a lista sai diferente conforme onde o Postgres foi instalado.
    const linhas = await this.linhas
      .createQueryBuilder('cultura')
      .orderBy('cultura.chave COLLATE "C"', 'ASC')
      .getMany();

    return linhas.map(culturaParaDominio);
  }
}
