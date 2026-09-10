import {
  Body,
  Controller,
  Delete,
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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { ProblemDetailsDto } from '../../../shared/http/dto/problem-details.dto';
import { ExcluirPlantioUseCase } from '../application/excluir-plantio.use-case';
import { RegistrarPlantioUseCase } from '../application/registrar-plantio.use-case';
import { PlantioDto, type PlantioResposta } from './dto/plantio.dto';
import { RegistrarPlantioDto } from './dto/registrar-plantio.dto';
import { paraResposta } from './plantio.presenter';

@ApiTags('Plantios')
@Controller('plantios')
export class PlantiosController {
  constructor(
    private readonly registrarPlantio: RegistrarPlantioUseCase,
    private readonly excluirPlantio: ExcluirPlantioUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(PlantioDto)
  @ApiOperation({ summary: 'Liga uma Cultura a uma Propriedade em uma Safra.' })
  @ApiCreatedResponse({ type: PlantioDto })
  @ApiBadRequestResponse({ description: 'A entrada não é válida.', type: ProblemDetailsDto })
  @ApiNotFoundResponse({
    description: 'A Cultura, a Propriedade ou a Safra informada não existe.',
    type: ProblemDetailsDto,
  })
  @ApiConflictResponse({
    description: 'Essa Propriedade já tem essa Cultura registrada nessa Safra.',
    type: ProblemDetailsDto,
  })
  async registrar(@Body() corpo: RegistrarPlantioDto): Promise<PlantioResposta> {
    return paraResposta(await this.registrarPlantio.execute(corpo));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui um Plantio.' })
  @ApiNoContentResponse({ description: 'O Plantio foi excluído.' })
  @ApiNotFoundResponse({
    description: 'Não existe Plantio com esse identificador.',
    type: ProblemDetailsDto,
  })
  async excluir(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.excluirPlantio.execute(id);
  }
}
