import type { Repository } from 'typeorm';
import type { PropriedadeDoPlantioRepository } from '../../plantios/domain/propriedade-do-plantio.repository';
import { PropriedadeOrmEntity } from './propriedade.orm-entity';

/**
 * A implementação da porta que o módulo de Plantio declara.
 *
 * Ela mora aqui, e não lá, porque quem sabe consultar a tabela de Propriedade é o módulo
 * de Propriedade. Quem liga uma coisa à outra é o arquivo de módulo. Ver o registro 0005.
 */
export class TypeormPropriedadeDoPlantioRepository implements PropriedadeDoPlantioRepository {
  constructor(private readonly linhas: Repository<PropriedadeOrmEntity>) {}

  existe(propriedadeId: string): Promise<boolean> {
    return this.linhas.existsBy({ id: propriedadeId });
  }
}
