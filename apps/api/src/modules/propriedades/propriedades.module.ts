import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { PROPRIEDADES_DO_PAINEL_REPOSITORY } from '../painel/domain/propriedades-do-painel.repository';
import { PROPRIEDADE_DO_PLANTIO_REPOSITORY } from '../plantios/domain/propriedade-do-plantio.repository';
import { PROPRIEDADES_DO_PRODUTOR_REPOSITORY } from '../produtores/domain/propriedades-do-produtor.repository';
import { CriarPropriedadeUseCase } from './application/criar-propriedade.use-case';
import { EditarPropriedadeUseCase } from './application/editar-propriedade.use-case';
import { ExcluirPropriedadeUseCase } from './application/excluir-propriedade.use-case';
import { ListarPropriedadesUseCase } from './application/listar-propriedades.use-case';
import { PROPRIEDADE_REPOSITORY, type PropriedadeRepository } from './domain/propriedade.repository';
import { PropriedadesController } from './http/propriedades.controller';
import { CriaPropriedades1789070000000 } from './infrastructure/migrations/1789070000000-cria-propriedades';
import { NomeiaPropriedade1789100000000 } from './infrastructure/migrations/1789100000000-nomeia-propriedade';
import { PropriedadeOrmEntity } from './infrastructure/propriedade.orm-entity';
import { TypeormPropriedadeRepository } from './infrastructure/typeorm-propriedade.repository';
import { TypeormPropriedadeDoPlantioRepository } from './infrastructure/typeorm-propriedade-do-plantio.repository';
import { TypeormPropriedadesDoPainelRepository } from './infrastructure/typeorm-propriedades-do-painel.repository';
import { TypeormPropriedadesDoProdutorRepository } from './infrastructure/typeorm-propriedades-do-produtor.repository';

/**
 * O único arquivo do módulo autorizado a enxergar as quatro camadas.
 *
 * Ele também exporta as implementações das portas que outros módulos declaram: a de
 * Produtor, para alcançar as Propriedades dele, a de Plantio, para saber se uma Propriedade
 * existe, e a do painel, para os números agregados. São esses provedores, e só eles, que os
 * outros módulos recebem: eles se falam por portas declaradas em `domain`, e nenhum alcança
 * camada interna do outro. Ver o registro 0005.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PropriedadeOrmEntity])],
  controllers: [PropriedadesController],
  providers: [
    {
      provide: PROPRIEDADE_REPOSITORY,
      inject: [getRepositoryToken(PropriedadeOrmEntity)],
      useFactory: (linhas: Repository<PropriedadeOrmEntity>) =>
        new TypeormPropriedadeRepository(linhas),
    },
    {
      provide: PROPRIEDADES_DO_PRODUTOR_REPOSITORY,
      inject: [getRepositoryToken(PropriedadeOrmEntity)],
      useFactory: (linhas: Repository<PropriedadeOrmEntity>) =>
        new TypeormPropriedadesDoProdutorRepository(linhas),
    },
    {
      provide: PROPRIEDADE_DO_PLANTIO_REPOSITORY,
      inject: [getRepositoryToken(PropriedadeOrmEntity)],
      useFactory: (linhas: Repository<PropriedadeOrmEntity>) =>
        new TypeormPropriedadeDoPlantioRepository(linhas),
    },
    {
      provide: PROPRIEDADES_DO_PAINEL_REPOSITORY,
      inject: [getRepositoryToken(PropriedadeOrmEntity)],
      useFactory: (linhas: Repository<PropriedadeOrmEntity>) =>
        new TypeormPropriedadesDoPainelRepository(linhas),
    },
    {
      provide: CriarPropriedadeUseCase,
      inject: [PROPRIEDADE_REPOSITORY],
      useFactory: (propriedades: PropriedadeRepository) =>
        new CriarPropriedadeUseCase(propriedades),
    },
    {
      provide: ListarPropriedadesUseCase,
      inject: [PROPRIEDADE_REPOSITORY],
      useFactory: (propriedades: PropriedadeRepository) =>
        new ListarPropriedadesUseCase(propriedades),
    },
    {
      provide: EditarPropriedadeUseCase,
      inject: [PROPRIEDADE_REPOSITORY],
      useFactory: (propriedades: PropriedadeRepository) =>
        new EditarPropriedadeUseCase(propriedades),
    },
    {
      provide: ExcluirPropriedadeUseCase,
      inject: [PROPRIEDADE_REPOSITORY],
      useFactory: (propriedades: PropriedadeRepository) =>
        new ExcluirPropriedadeUseCase(propriedades),
    },
  ],
  exports: [
    PROPRIEDADES_DO_PRODUTOR_REPOSITORY,
    PROPRIEDADE_DO_PLANTIO_REPOSITORY,
    PROPRIEDADES_DO_PAINEL_REPOSITORY,
  ],
})
export class PropriedadesModule {}

/** O que o módulo publica para a raiz de composição montar o catálogo do ORM. */
export const PROPRIEDADES_ENTIDADES = [PropriedadeOrmEntity];

/**
 * As vinte e sete siglas, publicadas para fora do módulo.
 *
 * Quem está fora não alcança as quatro camadas, e o arquivo de módulo é a face que o módulo
 * mostra. A carga de volume distribui as Propriedades sintéticas entre os estados e precisa
 * da lista; copiá-la para lá criaria duas listas que divergem. Ver o registro 0005.
 */
export { UNIDADES_FEDERATIVAS } from './domain/propriedade';

export const PROPRIEDADES_MIGRACOES = [
  CriaPropriedades1789070000000,
  NomeiaPropriedade1789100000000,
];
