import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { BuscarProdutorUseCase } from '../application/buscar-produtor.use-case';
import { CriarProdutorUseCase } from '../application/criar-produtor.use-case';
import { CriarProdutorDto } from './dto/criar-produtor.dto';
import { ProdutorDto, type ProdutorResposta } from './dto/produtor.dto';
import { paraResposta } from './produtor.presenter';

@ApiTags('Produtores')
@Controller('produtores')
export class ProdutoresController {
  constructor(
    private readonly criarProdutor: CriarProdutorUseCase,
    private readonly buscarProdutor: BuscarProdutorUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(ProdutorDto)
  @ApiOperation({ summary: 'Registra um Produtor.' })
  @ApiCreatedResponse({ type: ProdutorDto })
  @ApiBadRequestResponse({ description: 'O Documento ou o nome informado não é válido.' })
  @ApiConflictResponse({ description: 'Já existe um Produtor com esse Documento.' })
  async criar(@Body() corpo: CriarProdutorDto): Promise<ProdutorResposta> {
    return paraResposta(await this.criarProdutor.execute(corpo));
  }

  @Get(':id')
  @ZodSerializerDto(ProdutorDto)
  @ApiOperation({ summary: 'Recupera um Produtor, com o Documento mascarado.' })
  @ApiOkResponse({ type: ProdutorDto })
  @ApiNotFoundResponse({ description: 'Não existe Produtor com esse identificador.' })
  async buscar(@Param('id', ParseUUIDPipe) id: string): Promise<ProdutorResposta> {
    return paraResposta(await this.buscarProdutor.execute(id));
  }
}
