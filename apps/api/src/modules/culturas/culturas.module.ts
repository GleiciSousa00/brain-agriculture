import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { AcrescentarCulturaUseCase } from './application/acrescentar-cultura.use-case';
import { ExcluirCulturaUseCase } from './application/excluir-cultura.use-case';
import { ListarCulturasUseCase } from './application/listar-culturas.use-case';
import { CULTURAS_DO_PAINEL_REPOSITORY } from '../painel/domain/culturas-do-painel.repository';
import { CULTURA_REPOSITORY, type CulturaRepository } from './domain/cultura.repository';
import { CulturasController } from './http/culturas.controller';
import { CulturaOrmEntity } from './infrastructure/cultura.orm-entity';
import { CriaCulturas1789060000000 } from './infrastructure/migrations/1789060000000-cria-culturas';
import { TypeormCulturaRepository } from './infrastructure/typeorm-cultura.repository';
import { TypeormCulturasDoPainelRepository } from './infrastructure/typeorm-culturas-do-painel.repository';

/**
 * O catálogo também exporta a implementação da porta que o painel declara: a contagem por
 * Cultura sai do módulo de Plantio com o identificador, e o nome vem daqui.
 */
@Module({
  imports: [TypeOrmModule.forFeature([CulturaOrmEntity])],
  controllers: [CulturasController],
  providers: [
    {
      provide: CULTURA_REPOSITORY,
      inject: [getRepositoryToken(CulturaOrmEntity)],
      useFactory: (linhas: Repository<CulturaOrmEntity>) => new TypeormCulturaRepository(linhas),
    },
    {
      provide: CULTURAS_DO_PAINEL_REPOSITORY,
      inject: [getRepositoryToken(CulturaOrmEntity)],
      useFactory: (linhas: Repository<CulturaOrmEntity>) =>
        new TypeormCulturasDoPainelRepository(linhas),
    },
    {
      provide: AcrescentarCulturaUseCase,
      inject: [CULTURA_REPOSITORY],
      useFactory: (culturas: CulturaRepository) => new AcrescentarCulturaUseCase(culturas),
    },
    {
      provide: ListarCulturasUseCase,
      inject: [CULTURA_REPOSITORY],
      useFactory: (culturas: CulturaRepository) => new ListarCulturasUseCase(culturas),
    },
    {
      provide: ExcluirCulturaUseCase,
      inject: [CULTURA_REPOSITORY],
      useFactory: (culturas: CulturaRepository) => new ExcluirCulturaUseCase(culturas),
    },
  ],
  exports: [CULTURAS_DO_PAINEL_REPOSITORY],
})
export class CulturasModule {}

/** O que o módulo publica para a raiz de composição montar o catálogo do ORM. */
export const CULTURAS_ENTIDADES = [CulturaOrmEntity];

export const CULTURAS_MIGRACOES = [CriaCulturas1789060000000];
