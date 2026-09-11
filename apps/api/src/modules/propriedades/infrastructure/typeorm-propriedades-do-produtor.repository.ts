import type { Repository } from 'typeorm';
import type { Recortados } from '../../../shared/domain/recorte';
import { recortarPorNome } from '../../../shared/infrastructure/busca-por-nome';
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
    busca,
  }: RecorteDePropriedadesDoProdutor): Promise<Recortados<Propriedade>> {
    const [linhas, total] = await recortarPorNome(
      this.linhas
        .createQueryBuilder('propriedade')
        .where('propriedade.produtorId = :produtorId', { produtorId }),
      'propriedade.nome',
      busca,
    )
      .orderBy('propriedade.nome', 'ASC')
      .addOrderBy('propriedade.id', 'ASC')
      .skip(deslocamento)
      .take(limite)
      .getManyAndCount();

    return { itens: linhas.map(propriedadeParaDominio), total };
  }

  async contarPorProdutor(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) {
      return new Map();
    }

    const linhas = await this.linhas
      .createQueryBuilder('propriedade')
      .select('propriedade.produtorId', 'produtorId')
      .addSelect('COUNT(*)', 'propriedades')
      .where('propriedade.produtorId IN (:...ids)', { ids })
      .groupBy('propriedade.produtorId')
      .getRawMany<LinhaDaContagem>();

    return new Map(linhas.map((linha) => [linha.produtorId, Number(linha.propriedades)]));
  }
}

/** O que o banco devolve na contagem por Produtor. `COUNT` vem como texto. */
interface LinhaDaContagem {
  produtorId: string;
  propriedades: string;
}
