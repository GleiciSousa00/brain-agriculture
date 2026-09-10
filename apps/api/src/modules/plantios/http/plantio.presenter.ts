import type { Pagina } from '../../../shared/application/pagina';
import type { Plantio } from '../domain/plantio';
import type { PlantioResposta, PlantiosPaginaResposta } from './dto/plantio.dto';

/** Monta a resposta a partir do Plantio. Nada sai por padrão. Ver o registro 0007. */
export function paraResposta(plantio: Plantio): PlantioResposta {
  return {
    id: plantio.id,
    propriedadeId: plantio.propriedadeId,
    culturaId: plantio.culturaId,
    safraId: plantio.safraId,
  };
}

export function paraPagina(pagina: Pagina<Plantio>): PlantiosPaginaResposta {
  return {
    itens: pagina.itens.map(paraResposta),
    total: pagina.total,
    pagina: pagina.pagina,
    tamanho: pagina.tamanho,
  };
}
