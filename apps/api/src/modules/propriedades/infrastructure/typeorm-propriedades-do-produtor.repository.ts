import type { Repository } from 'typeorm';
import type { Recortados } from '../../../shared/domain/recorte';
import type { Propriedade } from '../domain/propriedade';
import type {
  PropriedadesDoProdutorRepository,
  RecorteDePropriedadesDoProdutor,
} from '../../produtores/domain/propriedades-do-produtor.repository';
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

  async listByProdutor({
    produtorId,
    deslocamento,
    limite,
  }: RecorteDePropriedadesDoProdutor): Promise<Recortados<Propriedade>> {
    // A contagem vem na mesma ida ao banco que a fatia, e é a do Produtor inteiro. O filtro
    // é servido por `ix_propriedades_produtor`, e a ordem é a mesma da listagem do cadastro,
    // para a Propriedade não trocar de lugar conforme a tela por onde se olha.
    const [linhas, total] = await this.linhas.findAndCount({
      where: { produtorId },
      order: { nome: 'ASC', id: 'ASC' },
      skip: deslocamento,
      take: limite,
    });

    return { itens: linhas.map(propriedadeParaDominio), total };
  }
}
