import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { ProblemDetailsDto } from '../../../shared/http/dto/problem-details.dto';
import { IdentificadorPipe } from '../../../shared/http/identificador.pipe';
import { CriarPropriedadeUseCase } from '../application/criar-propriedade.use-case';
import { EditarPropriedadeUseCase } from '../application/editar-propriedade.use-case';
import { ExcluirPropriedadeUseCase } from '../application/excluir-propriedade.use-case';
import { ListarPropriedadesUseCase } from '../application/listar-propriedades.use-case';
import { CriarPropriedadeDto, EditarPropriedadeDto } from './dto/criar-propriedade.dto';
import { ParametrosDePropriedadesDto } from './dto/listar-propriedades.dto';
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
  @ApiOperation({
    summary:
      'Lista as Propriedades por nome, em páginas. Recorta pela busca e pelos identificadores, quando houver.',
  })
  @ApiOkResponse({ type: PropriedadesPaginaDto })
  @ApiBadRequestResponse({
    description: 'A página, o tamanho ou algum identificador pedido não é válido.',
    type: ProblemDetailsDto,
  })
  async listar(
    @Query() parametros: ParametrosDePropriedadesDto,
  ): Promise<PropriedadesPaginaResposta> {
    return paraPagina(await this.listarPropriedades.execute(parametros));
  }

  @Put(':id')
  @ZodSerializerDto(PropriedadeDto)
  @ApiOperation({ summary: 'Atualiza o nome, a localização e as áreas de uma Propriedade.' })
  @ApiOkResponse({ type: PropriedadeDto })
  @ApiBadRequestResponse({ description: AREAS_NAO_FECHAM, type: ProblemDetailsDto })
  @ApiNotFoundResponse({
    description: 'Não existe Propriedade com esse identificador.',
    type: ProblemDetailsDto,
  })
  async editar(
    @Param('id', IdentificadorPipe) id: string,
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
  async excluir(@Param('id', IdentificadorPipe) id: string): Promise<void> {
    await this.excluirPropriedade.execute(id);
  }
}
