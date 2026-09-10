import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
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
import { BuscarProdutorUseCase } from '../application/buscar-produtor.use-case';
import { CriarProdutorUseCase } from '../application/criar-produtor.use-case';
import { EditarProdutorUseCase } from '../application/editar-produtor.use-case';
import { ExcluirProdutorUseCase } from '../application/excluir-produtor.use-case';
import { ListarProdutoresUseCase } from '../application/listar-produtores.use-case';
import { CriarProdutorDto } from './dto/criar-produtor.dto';
import { EditarProdutorDto } from './dto/editar-produtor.dto';
import {
  ProdutorDetalhadoDto,
  ProdutorDto,
  ProdutoresPaginaDto,
  type ProdutorDetalhadoResposta,
  type ProdutorResposta,
  type ProdutoresPaginaResposta,
} from './dto/produtor.dto';
import { paraPagina, paraResposta, paraRespostaDetalhada } from './produtor.presenter';

const NAO_ENCONTRADO = 'Não existe Produtor com esse identificador.';

@ApiTags('Produtores')
@Controller('produtores')
export class ProdutoresController {
  constructor(
    private readonly criarProdutor: CriarProdutorUseCase,
    private readonly buscarProdutor: BuscarProdutorUseCase,
    private readonly listarProdutores: ListarProdutoresUseCase,
    private readonly editarProdutor: EditarProdutorUseCase,
    private readonly excluirProdutor: ExcluirProdutorUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(ProdutorDto)
  @ApiOperation({ summary: 'Registra um Produtor.' })
  @ApiCreatedResponse({ type: ProdutorDto })
  @ApiBadRequestResponse({
    description: 'O Documento ou o nome informado não é válido.',
    type: ProblemDetailsDto,
  })
  @ApiConflictResponse({
    description: 'Já existe um Produtor com esse Documento.',
    type: ProblemDetailsDto,
  })
  async criar(@Body() corpo: CriarProdutorDto): Promise<ProdutorResposta> {
    return paraResposta(await this.criarProdutor.execute(corpo));
  }

  @Get()
  @ZodSerializerDto(ProdutoresPaginaDto)
  @ApiOperation({ summary: 'Lista Produtores por nome, em páginas, com o Documento mascarado.' })
  @ApiOkResponse({ type: ProdutoresPaginaDto })
  @ApiBadRequestResponse({
    description: 'A página ou o tamanho pedido não é válido.',
    type: ProblemDetailsDto,
  })
  async listar(@Query() parametros: ParametrosDePaginaDto): Promise<ProdutoresPaginaResposta> {
    return paraPagina(await this.listarProdutores.execute(parametros));
  }

  @Get(':id')
  @ZodSerializerDto(ProdutorDetalhadoDto)
  @ApiOperation({
    summary: 'Recupera um Produtor e suas Propriedades, com o Documento mascarado.',
  })
  @ApiOkResponse({ type: ProdutorDetalhadoDto })
  @ApiNotFoundResponse({ description: NAO_ENCONTRADO, type: ProblemDetailsDto })
  async buscar(@Param('id', ParseUUIDPipe) id: string): Promise<ProdutorDetalhadoResposta> {
    return paraRespostaDetalhada(await this.buscarProdutor.execute(id));
  }

  @Patch(':id')
  @ZodSerializerDto(ProdutorDto)
  @ApiOperation({ summary: 'Corrige o nome de um Produtor. O Documento não é editável.' })
  @ApiOkResponse({ type: ProdutorDto })
  @ApiBadRequestResponse({ description: 'O nome informado não é válido.', type: ProblemDetailsDto })
  @ApiNotFoundResponse({ description: NAO_ENCONTRADO, type: ProblemDetailsDto })
  async editar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() corpo: EditarProdutorDto,
  ): Promise<ProdutorResposta> {
    return paraResposta(await this.editarProdutor.execute({ id, nome: corpo.nome }));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Exclui um Produtor, e com ele suas Propriedades e seus Plantios.',
    description:
      'A exclusão é física e não tem desfazer, conforme o registro de decisão 0003 sobre o direito à eliminação.',
  })
  @ApiNoContentResponse({ description: 'O Produtor foi excluído.' })
  @ApiNotFoundResponse({ description: NAO_ENCONTRADO, type: ProblemDetailsDto })
  async excluir(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.excluirProdutor.execute(id);
  }
}
