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
      // A maior fatia primeiro, com o identificador desempatando, para a ordem não depender
      // de como o Postgres devolveu os grupos.
      .orderBy('COUNT(*)', 'DESC')
      .addOrderBy('plantio.culturaId', 'ASC');

    if (safraId !== undefined) {
      // Filtrar e agrupar são servidos por `ix_plantios_safra_cultura`, que começa pela
      // coluna do filtro. Sem a Safra, quem serve o agrupamento é `ix_plantios_cultura`.
      consulta.where('plantio.safraId = :safraId', { safraId });
    }

    const linhas = await consulta.getRawMany<LinhaPorCultura>();

    return linhas.map((linha) => ({
      culturaId: linha.culturaId,
      plantios: Number(linha.plantios),
    }));
  }
}
