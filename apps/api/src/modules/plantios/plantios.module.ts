import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ExcluirPlantioUseCase } from './application/excluir-plantio.use-case';
import { ListarPlantiosDaPropriedadeUseCase } from './application/listar-plantios-da-propriedade.use-case';
import { RegistrarPlantioUseCase } from './application/registrar-plantio.use-case';
import { PLANTIOS_DO_PAINEL_REPOSITORY } from '../painel/domain/plantios-do-painel.repository';
import { PLANTIO_REPOSITORY, type PlantioRepository } from './domain/plantio.repository';
import {
  PROPRIEDADE_DO_PLANTIO_REPOSITORY,
  type PropriedadeDoPlantioRepository,
} from './domain/propriedade-do-plantio.repository';
import { PropriedadesModule } from '../propriedades/propriedades.module';
import { PlantiosController } from './http/plantios.controller';
import { PlantiosDaPropriedadeController } from './http/plantios-da-propriedade.controller';
import { CriaPlantios1789080000000 } from './infrastructure/migrations/1789080000000-cria-plantios';
import { PlantioOrmEntity } from './infrastructure/plantio.orm-entity';
import { TypeormPlantioRepository } from './infrastructure/typeorm-plantio.repository';
import { TypeormPlantiosDoPainelRepository } from './infrastructure/typeorm-plantios-do-painel.repository';

/**
 * O único arquivo do módulo autorizado a enxergar as quatro camadas.
 *
 * A integridade das três referências fica com as chaves estrangeiras da migração, e não
 * com consulta prévia. A única coisa que este módulo pergunta a outro é se a Propriedade
 * existe, na listagem, e ele pergunta por uma porta declarada no próprio `domain`. O
 * módulo de Propriedade entra aqui só para fornecer a implementação dela.
 *
 * Ele também exporta a implementação da porta que o painel declara, que é a contagem de
 * Plantios por Cultura agregada no banco.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PlantioOrmEntity]), PropriedadesModule],
  controllers: [PlantiosController, PlantiosDaPropriedadeController],
  providers: [
    {
      provide: PLANTIO_REPOSITORY,
      inject: [getRepositoryToken(PlantioOrmEntity)],
      useFactory: (linhas: Repository<PlantioOrmEntity>) => new TypeormPlantioRepository(linhas),
    },
    {
      provide: PLANTIOS_DO_PAINEL_REPOSITORY,
      inject: [getRepositoryToken(PlantioOrmEntity)],
      useFactory: (linhas: Repository<PlantioOrmEntity>) =>
        new TypeormPlantiosDoPainelRepository(linhas),
    },
    {
      provide: RegistrarPlantioUseCase,
      inject: [PLANTIO_REPOSITORY],
      useFactory: (plantios: PlantioRepository) => new RegistrarPlantioUseCase(plantios),
    },
    {
      provide: ListarPlantiosDaPropriedadeUseCase,
      inject: [PLANTIO_REPOSITORY, PROPRIEDADE_DO_PLANTIO_REPOSITORY],
      useFactory: (plantios: PlantioRepository, propriedades: PropriedadeDoPlantioRepository) =>
        new ListarPlantiosDaPropriedadeUseCase(plantios, propriedades),
    },
    {
      provide: ExcluirPlantioUseCase,
      inject: [PLANTIO_REPOSITORY],
      useFactory: (plantios: PlantioRepository) => new ExcluirPlantioUseCase(plantios),
    },
  ],
  exports: [PLANTIOS_DO_PAINEL_REPOSITORY],
})
export class PlantiosModule {}

/** O que o módulo publica para a raiz de composição montar o catálogo do ORM. */
export const PLANTIOS_ENTIDADES = [PlantioOrmEntity];

export const PLANTIOS_MIGRACOES = [CriaPlantios1789080000000];
