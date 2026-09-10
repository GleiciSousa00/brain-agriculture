import type { Cultura } from '../domain/cultura';
import type { CulturaResposta } from './dto/cultura.dto';

/** A chave de comparação é detalhe interno e não sai na resposta. */
export function paraResposta(cultura: Cultura): CulturaResposta {
  return { id: cultura.id, nome: cultura.nome };
}
