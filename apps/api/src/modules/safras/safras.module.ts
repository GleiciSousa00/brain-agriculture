import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { CriarSafraUseCase } from './application/criar-safra.use-case';
import { ListarSafrasUseCase } from './application/listar-safras.use-case';
import { SAFRA_REPOSITORY, type SafraRepository } from './domain/safra.repository';
import { SafrasController } from './http/safras.controller';
import { CriaSafras1789050000000 } from './infrastructure/migrations/1789050000000-cria-safras';
import { SafraOrmEntity } from './infrastructure/safra.orm-entity';
import { TypeormSafraRepository } from './infrastructure/typeorm-safra.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SafraOrmEntity])],
  controllers: [SafrasController],
  providers: [
    {
      provide: SAFRA_REPOSITORY,
      inject: [getRepositoryToken(SafraOrmEntity)],
      useFactory: (linhas: Repository<SafraOrmEntity>) => new TypeormSafraRepository(linhas),
    },
    {
      provide: CriarSafraUseCase,
      inject: [SAFRA_REPOSITORY],
      useFactory: (safras: SafraRepository) => new CriarSafraUseCase(safras),
    },
    {
      provide: ListarSafrasUseCase,
      inject: [SAFRA_REPOSITORY],
      useFactory: (safras: SafraRepository) => new ListarSafrasUseCase(safras),
    },
  ],
})
export class SafrasModule {}

/** O que o módulo publica para a raiz de composição montar o catálogo do ORM. */
export const SAFRAS_ENTIDADES = [SafraOrmEntity];

export const SAFRAS_MIGRACOES = [CriaSafras1789050000000];
