import type { Repository } from 'typeorm';
import { violouChaveEstrangeira } from '../../../shared/infrastructure/postgres-errors';
import type { Propriedade } from '../domain/propriedade';
import { ProdutorDaPropriedadeNaoEncontrado } from '../domain/propriedade.errors';
import type { Recortados } from '../../../shared/domain/recorte';
import { recortarPorNome } from '../../../shared/infrastructure/busca-por-nome';
import type {
  PropriedadeRepository,
  RecorteDePropriedades,
} from '../domain/propriedade.repository';
import { propriedadeParaDominio, propriedadeParaLinha } from './propriedade.mapper';
import { PropriedadeOrmEntity } from './propriedade.orm-entity';

export class TypeormPropriedadeRepository implements PropriedadeRepository {
  constructor(private readonly linhas: Repository<PropriedadeOrmEntity>) {}

  async save(propriedade: Propriedade): Promise<void> {
    try {
      await this.linhas.save(propriedadeParaLinha(propriedade));
    } catch (erro) {
      if (violouChaveEstrangeira(erro)) {
        throw new ProdutorDaPropriedadeNaoEncontrado(propriedade.produtorId);
      }

      throw erro;
    }
  }

  async findById(id: string): Promise<Propriedade | null> {
    const linha = await this.linhas.findOneBy({ id });

    return linha === null ? null : propriedadeParaDominio(linha);
  }

  async delete(id: string): Promise<void> {
    await this.linhas.delete({ id });
  }

  async list({
    deslocamento,
    limite,
    busca,
    ids,
  }: RecorteDePropriedades): Promise<Recortados<Propriedade>> {
    // Pedir nenhum identificador é pedir nenhuma Propriedade. A consulta nem sai: `IN ()`
    // não é SQL válido, e o construtor de consulta o montaria assim mesmo.
    if (ids !== undefined && ids.length === 0) {
      return { itens: [], total: 0 };
    }

    const consulta = recortarPorNome(
      this.linhas.createQueryBuilder('propriedade'),
      'propriedade.nome',
      busca,
    );

    if (ids !== undefined) {
      consulta.andWhere('propriedade.id IN (:...ids)', { ids });
    }

    const [linhas, total] = await consulta
      .orderBy('propriedade.nome', 'ASC')
      .addOrderBy('propriedade.id', 'ASC')
      .skip(deslocamento)
      .take(limite)
      .getManyAndCount();

    return { itens: linhas.map(propriedadeParaDominio), total };
  }
}
