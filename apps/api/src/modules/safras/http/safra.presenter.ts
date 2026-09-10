import type { Safra } from '../domain/safra';
import type { SafraResposta } from './dto/safra.dto';

export function paraResposta(safra: Safra): SafraResposta {
  return { id: safra.id, ano: safra.ano };
}
