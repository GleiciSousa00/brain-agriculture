import type { Pagina } from '../../../shared/application/pagina';
import { paginaPara } from '../../../shared/http/pagina.presenter';
import type { Propriedade } from '../domain/propriedade';
import type { PropriedadeResposta, PropriedadesPaginaResposta } from './dto/propriedade.dto';

/** Monta a resposta a partir da Propriedade, trocando o objeto de valor por hectares. */
export function paraResposta(propriedade: Propriedade): PropriedadeResposta {
  return {
    id: propriedade.id,
    produtorId: propriedade.produtorId,
    cidade: propriedade.cidade,
    estado: propriedade.estado,
    areaTotal: propriedade.areaTotal.hectares,
    areaAgricultavel: propriedade.areaAgricultavel.hectares,
    areaDeVegetacao: propriedade.areaDeVegetacao.hectares,
  };
}

export function paraPagina(pagina: Pagina<Propriedade>): PropriedadesPaginaResposta {
  return paginaPara(pagina, paraResposta);
}
