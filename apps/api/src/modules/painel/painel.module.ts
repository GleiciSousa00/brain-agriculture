import { Module } from '@nestjs/common';
import { MontarPainelUseCase } from './application/montar-painel.use-case';
import { CulturasModule } from '../culturas/culturas.module';
import {
  CULTURAS_DO_PAINEL_REPOSITORY,
  type CulturasDoPainelRepository,
} from './domain/culturas-do-painel.repository';
import {
  PLANTIOS_DO_PAINEL_REPOSITORY,
  type PlantiosDoPainelRepository,
} from './domain/plantios-do-painel.repository';
import {
  PROPRIEDADES_DO_PAINEL_REPOSITORY,
  type PropriedadesDoPainelRepository,
} from './domain/propriedades-do-painel.repository';
import { PainelController } from './http/painel.controller';
import { IndexaSafraDePlantio1789090000000 } from './infrastructure/migrations/1789090000000-indexa-safra-de-plantio';
import { PlantiosModule } from '../plantios/plantios.module';
import { PropriedadesModule } from '../propriedades/propriedades.module';

/**
 * O único arquivo do módulo autorizado a enxergar as quatro camadas.
 *
 * O painel não tem tabela própria: ele responde perguntas sobre o cadastro dos outros. As
 * três portas que ele declara no `domain` são implementadas por quem tem os dados, e é por
 * isso que os três módulos entram aqui. Ver o registro 0005.
 */
@Module({
  imports: [PropriedadesModule, PlantiosModule, CulturasModule],
  controllers: [PainelController],
  providers: [
    {
      provide: MontarPainelUseCase,
      inject: [
        PROPRIEDADES_DO_PAINEL_REPOSITORY,
        PLANTIOS_DO_PAINEL_REPOSITORY,
        CULTURAS_DO_PAINEL_REPOSITORY,
      ],
      useFactory: (
        propriedades: PropriedadesDoPainelRepository,
        plantios: PlantiosDoPainelRepository,
        culturas: CulturasDoPainelRepository,
      ) => new MontarPainelUseCase(propriedades, plantios, culturas),
    },
  ],
})
export class PainelModule {}

/**
 * O que o módulo publica para a raiz de composição. Não há entidade de ORM: o painel lê as
 * tabelas dos outros módulos pelas portas, e a única coisa que ele acrescenta ao esquema é
 * o índice de que a consulta por Safra precisa.
 */
export const PAINEL_MIGRACOES = [IndexaSafraDePlantio1789090000000];
