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
import { ProblemDetailsDto } from '../../../shared/http/dto/problem-details.dto';
import { CriarSafraUseCase } from '../application/criar-safra.use-case';
import { ExcluirSafraUseCase } from '../application/excluir-safra.use-case';
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
    private readonly excluirSafra: ExcluirSafraUseCase,
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Tira uma Safra do cadastro.',
    description:
      'A Safra com Plantio registrado nela é recusada: o Plantio é registro do que ' +
      'aconteceu na terra, e não some porque alguém arrumou a lista de Safras.',
  })
  @ApiNoContentResponse({ description: 'A Safra saiu do cadastro.' })
  @ApiNotFoundResponse({
    description: 'Não existe Safra com esse identificador.',
    type: ProblemDetailsDto,
  })
  @ApiConflictResponse({
    description: 'Essa Safra tem pelo menos um Plantio registrado nela.',
    type: ProblemDetailsDto,
  })
  async excluir(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.excluirSafra.execute(id);
  }
}
