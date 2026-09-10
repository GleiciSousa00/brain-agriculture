import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { ProblemDetailsDto } from '../../../shared/http/dto/problem-details.dto';
import { MontarPainelUseCase } from '../application/montar-painel.use-case';
import { FiltroDoPainelDto, PainelDto, type PainelResposta } from './dto/painel.dto';
import { paraResposta } from './painel.presenter';

@ApiTags('Painel')
@Controller('painel')
export class PainelController {
  constructor(private readonly montarPainel: MontarPainelUseCase) {}

  /**
   * Os números vêm numa resposta só porque o painel é uma tela só, e quatro rotas
   * separadas obrigariam a interface a costurar quatro respostas que sempre chegam juntas.
   *
   * Uma Safra que não existe não é erro: a distribuição dela é vazia, e é isso que a
   * resposta diz. Conferir a existência custaria uma porta a mais para responder o mesmo.
   */
  @Get()
  @ZodSerializerDto(PainelDto)
  @ApiOperation({ summary: 'Devolve os totais e as três distribuições do cadastro.' })
  @ApiOkResponse({
    description: 'Os números do painel. Uma base vazia devolve zeros e listas vazias.',
    type: PainelDto,
  })
  @ApiBadRequestResponse({ description: 'O filtro não é válido.', type: ProblemDetailsDto })
  async ver(@Query() filtro: FiltroDoPainelDto): Promise<PainelResposta> {
    return paraResposta(await this.montarPainel.execute(filtro));
  }
}
