import type { Repository } from 'typeorm';
import {
  violouChaveEstrangeira,
  violouUnicidade,
} from '../../../shared/infrastructure/postgres-errors';
import type { Safra } from '../domain/safra';
import { SafraDuplicada, SafraEmUso } from '../domain/safra.errors';
import type { SafraRepository } from '../domain/safra.repository';
import { safraParaDominio, safraParaLinha } from './safra.mapper';
import { SafraOrmEntity } from './safra.orm-entity';

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

  async findById(id: string): Promise<Safra | null> {
    const linha = await this.linhas.findOneBy({ id });

    return linha === null ? null : safraParaDominio(linha);
  }

  async findByAno(ano: number): Promise<Safra | null> {
    const linha = await this.linhas.findOneBy({ ano });

    return linha === null ? null : safraParaDominio(linha);
  }

  /**
   * Quem recusa a Safra plantada é a chave `fk_plantios_safra`, declarada
   * `ON DELETE RESTRICT` na migração dos Plantios. Perguntar antes se ela está em uso
   * responderia sobre o instante anterior, e duas exclusões ao mesmo tempo passariam pela
   * pergunta juntas.
   */
  async delete(id: string): Promise<void> {
    try {
      await this.linhas.delete({ id });
    } catch (erro) {
      if (violouChaveEstrangeira(erro)) {
        throw new SafraEmUso();
      }

      throw erro;
    }
  }

  async listAll(): Promise<Safra[]> {
    const linhas = await this.linhas.find({ order: { ano: 'DESC' } });

    return linhas.map(safraParaDominio);
  }
}
