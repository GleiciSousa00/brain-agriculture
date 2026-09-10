import type { Repository } from 'typeorm';
import type { Propriedade } from '../domain/propriedade';
import type { PropriedadesDoProdutorRepository } from '../../produtores/domain/propriedades-do-produtor.repository';
import { propriedadeParaDominio } from './propriedade.mapper';
import { PropriedadeOrmEntity } from './propriedade.orm-entity';

/**
 * A implementação da porta que o módulo de Produtor declara.
 *
 * Ela mora aqui, e não lá, porque quem sabe consultar a tabela de Propriedade é o módulo
 * de Propriedade. Quem liga uma coisa à outra é o arquivo de módulo. Ver o registro 0005.
 */
export class TypeormPropriedadesDoProdutorRepository implements PropriedadesDoProdutorRepository {
  constructor(private readonly linhas: Repository<PropriedadeOrmEntity>) {}

  async listByProdutor(produtorId: string): Promise<Propriedade[]> {
    const encontradas = await this.linhas.find({
      where: { produtorId },
      order: { criadoEm: 'DESC', id: 'ASC' },
    });

    return encontradas.map(propriedadeParaDominio);
  }

  async excluirDoProdutor(produtorId: string): Promise<void> {
    await this.linhas.delete({ produtorId });
  }
}
