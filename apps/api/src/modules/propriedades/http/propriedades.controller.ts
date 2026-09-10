import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { ParametrosDePaginaDto } from '../../../shared/http/dto/pagina.dto';
import { ProblemDetailsDto } from '../../../shared/http/dto/problem-details.dto';
import { CriarPropriedadeUseCase } from '../application/criar-propriedade.use-case';
import { EditarPropriedadeUseCase } from '../application/editar-propriedade.use-case';
import { ExcluirPropriedadeUseCase } from '../application/excluir-propriedade.use-case';
import { ListarPropriedadesUseCase } from '../application/listar-propriedades.use-case';
import { CriarPropriedadeDto, EditarPropriedadeDto } from './dto/criar-propriedade.dto';
import {
  PropriedadeDto,
  PropriedadesPaginaDto,
  type PropriedadeResposta,
  type PropriedadesPaginaResposta,
} from './dto/propriedade.dto';
import { paraPagina, paraResposta } from './propriedade.presenter';

const AREAS_NAO_FECHAM =
  'A entrada não é válida, ou a soma da Área Agricultável com a Área de Vegetação passa da Área Total.';

@ApiTags('Propriedades')
@Controller('propriedades')
export class PropriedadesController {
  constructor(
    private readonly criarPropriedade: CriarPropriedadeUseCase,
    private readonly listarPropriedades: ListarPropriedadesUseCase,
    private readonly editarPropriedade: EditarPropriedadeUseCase,
    private readonly excluirPropriedade: ExcluirPropriedadeUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(PropriedadeDto)
  @ApiOperation({ summary: 'Registra uma Propriedade em nome de um Produtor.' })
  @ApiCreatedResponse({ type: PropriedadeDto })
  @ApiBadRequestResponse({ description: AREAS_NAO_FECHAM, type: ProblemDetailsDto })
  @ApiNotFoundResponse({
    description: 'Não existe Produtor com esse identificador.',
    type: ProblemDetailsDto,
  })
  async criar(@Body() corpo: CriarPropriedadeDto): Promise<PropriedadeResposta> {
    return paraResposta(await this.criarPropriedade.execute(corpo));
  }

  @Get()
  @ZodSerializerDto(PropriedadesPaginaDto)
  @ApiOperation({ summary: 'Lista as Propriedades por cidade, em páginas.' })
  @ApiOkResponse({ type: PropriedadesPaginaDto })
  async listar(@Query() pagina: ParametrosDePaginaDto): Promise<PropriedadesPaginaResposta> {
    return paraPagina(await this.listarPropriedades.execute(pagina));
  }

  @Put(':id')
  @ZodSerializerDto(PropriedadeDto)
  @ApiOperation({ summary: 'Atualiza a localização e as áreas de uma Propriedade.' })
  @ApiOkResponse({ type: PropriedadeDto })
  @ApiBadRequestResponse({ description: AREAS_NAO_FECHAM, type: ProblemDetailsDto })
  @ApiNotFoundResponse({
    description: 'Não existe Propriedade com esse identificador.',
    type: ProblemDetailsDto,
  })
  async editar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() corpo: EditarPropriedadeDto,
  ): Promise<PropriedadeResposta> {
    return paraResposta(await this.editarPropriedade.execute(id, corpo));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui uma Propriedade, e com ela seus Plantios.' })
  @ApiNoContentResponse({ description: 'A Propriedade foi excluída.' })
  @ApiNotFoundResponse({
    description: 'Não existe Propriedade com esse identificador.',
    type: ProblemDetailsDto,
  })
  async excluir(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.excluirPropriedade.execute(id);
  }
}
