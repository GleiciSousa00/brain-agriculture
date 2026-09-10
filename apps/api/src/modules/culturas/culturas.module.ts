import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { AcrescentarCulturaUseCase } from './application/acrescentar-cultura.use-case';
import { ListarCulturasUseCase } from './application/listar-culturas.use-case';
import { CULTURA_REPOSITORY, type CulturaRepository } from './domain/cultura.repository';
import { CulturasController } from './http/culturas.controller';
import { CulturaOrmEntity } from './infrastructure/cultura.orm-entity';
import { CriaCulturas1789060000000 } from './infrastructure/migrations/1789060000000-cria-culturas';
import { TypeormCulturaRepository } from './infrastructure/typeorm-cultura.repository';

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
      provide: AcrescentarCulturaUseCase,
      inject: [CULTURA_REPOSITORY],
      useFactory: (culturas: CulturaRepository) => new AcrescentarCulturaUseCase(culturas),
    },
    {
      provide: ListarCulturasUseCase,
      inject: [CULTURA_REPOSITORY],
      useFactory: (culturas: CulturaRepository) => new ListarCulturasUseCase(culturas),
    },
  ],
})
export class CulturasModule {}

/** O que o módulo publica para a raiz de composição montar o catálogo do ORM. */
export const CULTURAS_ENTIDADES = [CulturaOrmEntity];

export const CULTURAS_MIGRACOES = [CriaCulturas1789060000000];
