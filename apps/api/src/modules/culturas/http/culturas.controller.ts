import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { IdentificadorPipe } from '../../../shared/http/identificador.pipe';
import { AcrescentarCulturaUseCase } from '../application/acrescentar-cultura.use-case';
import { ExcluirCulturaUseCase } from '../application/excluir-cultura.use-case';
import { ListarCulturasUseCase } from '../application/listar-culturas.use-case';
import { AcrescentarCulturaDto } from './dto/acrescentar-cultura.dto';
import { CulturaDto, CulturasDto, type CulturaResposta } from './dto/cultura.dto';
import { paraResposta } from './cultura.presenter';

@ApiTags('Culturas')
@Controller('culturas')
export class CulturasController {
  constructor(
    private readonly acrescentarCultura: AcrescentarCulturaUseCase,
    private readonly listarCulturas: ListarCulturasUseCase,
    private readonly excluirCultura: ExcluirCulturaUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CulturaDto)
  @ApiOperation({ summary: 'Acrescenta uma espécie ao catálogo.' })
  @ApiCreatedResponse({ type: CulturaDto })
  @ApiBadRequestResponse({ description: 'O nome informado não serve.', type: ProblemDetailsDto })
  @ApiConflictResponse({
    description: 'O catálogo já tem essa espécie, ainda que escrita de outro jeito.',
    type: ProblemDetailsDto,
  })
  async acrescentar(@Body() corpo: AcrescentarCulturaDto): Promise<CulturaResposta> {
    return paraResposta(await this.acrescentarCultura.execute(corpo));
  }

  @Get()
  @ZodSerializerDto(CulturasDto)
  @ApiOperation({ summary: 'Lista o catálogo em ordem alfabética.' })
  @ApiOkResponse({ type: CulturasDto })
  async listar(): Promise<CulturaResposta[]> {
    return (await this.listarCulturas.execute()).map(paraResposta);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Tira uma espécie do catálogo.',
    description:
      'A Cultura registrada em algum Plantio é recusada: o Plantio é registro do que ' +
      'aconteceu na terra, e não some porque alguém arrumou o catálogo.',
  })
  @ApiNoContentResponse({ description: 'A Cultura saiu do catálogo.' })
  @ApiNotFoundResponse({
    description: 'Não existe Cultura com esse identificador.',
    type: ProblemDetailsDto,
  })
  @ApiConflictResponse({
    description: 'Essa Cultura está registrada em pelo menos um Plantio.',
    type: ProblemDetailsDto,
  })
  async excluir(@Param('id', IdentificadorPipe) id: string): Promise<void> {
    await this.excluirCultura.execute(id);
  }
}
