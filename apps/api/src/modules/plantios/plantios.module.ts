import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ExcluirPlantioUseCase } from './application/excluir-plantio.use-case';
import { ListarPlantiosDaPropriedadeUseCase } from './application/listar-plantios-da-propriedade.use-case';
import { RegistrarPlantioUseCase } from './application/registrar-plantio.use-case';
import { PLANTIO_REPOSITORY, type PlantioRepository } from './domain/plantio.repository';
import { PlantiosController } from './http/plantios.controller';
import { PlantiosDaPropriedadeController } from './http/plantios-da-propriedade.controller';
import { CriaPlantios1789080000000 } from './infrastructure/migrations/1789080000000-cria-plantios';
import { PlantioOrmEntity } from './infrastructure/plantio.orm-entity';
import { TypeormPlantioRepository } from './infrastructure/typeorm-plantio.repository';

/**
 * O único arquivo do módulo autorizado a enxergar as quatro camadas.
 *
 * O módulo não importa Propriedade, Cultura nem Safra: ele guarda os identificadores das
 * três e deixa a integridade com as chaves estrangeiras da migração. Não há porta entre
 * módulos aqui, e é por isso que não há nada a exportar.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PlantioOrmEntity])],
  controllers: [PlantiosController, PlantiosDaPropriedadeController],
  providers: [
    {
      provide: PLANTIO_REPOSITORY,
      inject: [getRepositoryToken(PlantioOrmEntity)],
      useFactory: (linhas: Repository<PlantioOrmEntity>) => new TypeormPlantioRepository(linhas),
    },
    {
      provide: RegistrarPlantioUseCase,
      inject: [PLANTIO_REPOSITORY],
      useFactory: (plantios: PlantioRepository) => new RegistrarPlantioUseCase(plantios),
    },
    {
      provide: ListarPlantiosDaPropriedadeUseCase,
      inject: [PLANTIO_REPOSITORY],
      useFactory: (plantios: PlantioRepository) =>
        new ListarPlantiosDaPropriedadeUseCase(plantios),
    },
    {
      provide: ExcluirPlantioUseCase,
      inject: [PLANTIO_REPOSITORY],
      useFactory: (plantios: PlantioRepository) => new ExcluirPlantioUseCase(plantios),
    },
  ],
})
export class PlantiosModule {}

/** O que o módulo publica para a raiz de composição montar o catálogo do ORM. */
export const PLANTIOS_ENTIDADES = [PlantioOrmEntity];

export const PLANTIOS_MIGRACOES = [CriaPlantios1789080000000];
