import type { Repository } from 'typeorm';
import type {
  PlantiosDaCultura,
  PlantiosDoPainelRepository,
} from '../../painel/domain/plantios-do-painel.repository';
import { PlantioOrmEntity } from './plantio.orm-entity';

interface LinhaPorCultura {
  culturaId: string;
  plantios: string;
}

/**
 * A implementação da porta que o módulo de painel declara.
 *
 * Ela devolve o identificador da Cultura, e não o nome: o nome mora no catálogo, que é de
 * outro módulo, e juntar as duas tabelas aqui faria esta camada conhecer as colunas de
 * outro módulo. Quem junta é o caso de uso, por uma segunda porta. Ver o registro 0005.
 */
export class TypeormPlantiosDoPainelRepository implements PlantiosDoPainelRepository {
  constructor(private readonly linhas: Repository<PlantioOrmEntity>) {}

  async contarPorCultura(safraId?: string): Promise<PlantiosDaCultura[]> {
    const consulta = this.linhas
      .createQueryBuilder('plantio')
      .select('plantio.culturaId', 'culturaId')
      .addSelect('COUNT(*)', 'plantios')
      .groupBy('plantio.culturaId')
      .orderBy('COUNT(*)', 'DESC')
      .addOrderBy('plantio.culturaId', 'ASC');

    if (safraId !== undefined) {
      consulta.where('plantio.safraId = :safraId', { safraId });
    }

    const linhas = await consulta.getRawMany<LinhaPorCultura>();

    return linhas.map((linha) => ({
      culturaId: linha.culturaId,
      plantios: Number(linha.plantios),
    }));
  }
}
