import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { ParametrosDePaginaDto } from '../../../shared/http/dto/pagina.dto';
import { ListarPlantiosDaPropriedadeUseCase } from '../application/listar-plantios-da-propriedade.use-case';
import { PlantiosPaginaDto, type PlantiosPaginaResposta } from './dto/plantio.dto';
import { paraPagina } from './plantio.presenter';

/**
 * A listagem fica na rota da Propriedade porque é sempre a dela, e nunca a do cadastro
 * inteiro. A rota mora neste módulo, e não no de Propriedade, porque quem responde por
 * Plantio é este módulo.
 */
@ApiTags('Plantios')
@Controller('propriedades/:propriedadeId/plantios')
export class PlantiosDaPropriedadeController {
  constructor(private readonly listarPlantios: ListarPlantiosDaPropriedadeUseCase) {}

  @Get()
  @ZodSerializerDto(PlantiosPaginaDto)
  @ApiOperation({ summary: 'Lista os Plantios de uma Propriedade, em páginas.' })
  @ApiOkResponse({
    description: 'A fatia pedida. Uma Propriedade sem nenhum Plantio devolve a fatia vazia.',
    type: PlantiosPaginaDto,
  })
  async listar(
    @Param('propriedadeId', ParseUUIDPipe) propriedadeId: string,
    @Query() pagina: ParametrosDePaginaDto,
  ): Promise<PlantiosPaginaResposta> {
    return paraPagina(await this.listarPlantios.execute(propriedadeId, pagina));
  }
}
