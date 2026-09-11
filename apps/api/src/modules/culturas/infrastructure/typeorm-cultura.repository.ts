import type { Repository } from 'typeorm';
import {
  violouChaveEstrangeira,
  violouUnicidade,
} from '../../../shared/infrastructure/postgres-errors';
import type { Cultura } from '../domain/cultura';
import { CulturaDuplicada, CulturaEmUso } from '../domain/cultura.errors';
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

  async findById(id: string): Promise<Cultura | null> {
    const linha = await this.linhas.findOneBy({ id });

    return linha === null ? null : culturaParaDominio(linha);
  }

  async findByChave(chave: string): Promise<Cultura | null> {
    const linha = await this.linhas.findOneBy({ chave });

    return linha === null ? null : culturaParaDominio(linha);
  }

  /**
   * Quem recusa a Cultura plantada é a chave `fk_plantios_cultura`, declarada
   * `ON DELETE RESTRICT` na migração dos Plantios. Perguntar antes se ela está em uso
   * responderia sobre o instante anterior, e duas exclusões ao mesmo tempo passariam pela
   * pergunta juntas.
   */
  async delete(id: string): Promise<void> {
    try {
      await this.linhas.delete({ id });
    } catch (erro) {
      if (violouChaveEstrangeira(erro)) {
        throw new CulturaEmUso();
      }

      throw erro;
    }
  }

  async listAll(): Promise<Cultura[]> {
    const linhas = await this.linhas
      .createQueryBuilder('cultura')
      .orderBy('cultura.chave COLLATE "C"', 'ASC')
      .getMany();

    return linhas.map(culturaParaDominio);
  }
}
