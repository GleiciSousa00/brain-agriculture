import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { ProblemDetailsDto } from '../../../shared/http/dto/problem-details.dto';
import { CriarSafraUseCase } from '../application/criar-safra.use-case';
import { ListarSafrasUseCase } from '../application/listar-safras.use-case';
import { CriarSafraDto } from './dto/criar-safra.dto';
import { SafraDto, SafrasDto, type SafraResposta } from './dto/safra.dto';
import { paraResposta } from './safra.presenter';

@ApiTags('Safras')
@Controller('safras')
export class SafrasController {
  constructor(
    private readonly criarSafra: CriarSafraUseCase,
    private readonly listarSafras: ListarSafrasUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(SafraDto)
  @ApiOperation({ summary: 'Registra uma Safra, compartilhada por todas as Propriedades.' })
  @ApiCreatedResponse({ type: SafraDto })
  @ApiBadRequestResponse({ description: 'O ano informado não serve.', type: ProblemDetailsDto })
  @ApiConflictResponse({ description: 'Já existe Safra para esse ano.', type: ProblemDetailsDto })
  async criar(@Body() corpo: CriarSafraDto): Promise<SafraResposta> {
    return paraResposta(await this.criarSafra.execute(corpo));
  }

  @Get()
  @ZodSerializerDto(SafrasDto)
  @ApiOperation({ summary: 'Lista as Safras, da mais recente para a mais antiga.' })
  @ApiOkResponse({ type: SafrasDto })
  async listar(): Promise<SafraResposta[]> {
    return (await this.listarSafras.execute()).map(paraResposta);
  }
}
