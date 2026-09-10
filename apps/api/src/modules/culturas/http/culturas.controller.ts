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
import { AcrescentarCulturaUseCase } from '../application/acrescentar-cultura.use-case';
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
}
