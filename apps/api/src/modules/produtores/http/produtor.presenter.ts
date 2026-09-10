import type { Pagina } from '../../../shared/application/pagina';
import { paginaPara } from '../../../shared/http/pagina.presenter';
import type { Propriedade } from '../../propriedades/domain/propriedade';
import type { ProdutorComPropriedades } from '../application/buscar-produtor.use-case';
import type { Produtor } from '../domain/produtor';
import type {
  ProdutorDetalhadoResposta,
  ProdutorResposta,
  ProdutoresPaginaResposta,
} from './dto/produtor.dto';

/** Monta a resposta a partir do Produtor, mascarando o Documento no caminho. */
export function paraResposta(produtor: Produtor): ProdutorResposta {
  return {
    id: produtor.id,
    nome: produtor.nome,
    documento: produtor.documento.mascarado(),
    tipoDeDocumento: produtor.documento.tipo,
  };
}

/** A mesma resposta, com as Propriedades em nome do Produtor. */
export function paraRespostaDetalhada({
  produtor,
  propriedades,
}: ProdutorComPropriedades): ProdutorDetalhadoResposta {
  return { ...paraResposta(produtor), propriedades: propriedades.map(paraPropriedade) };
}

function paraPropriedade(propriedade: Propriedade) {
  return {
    id: propriedade.id,
    cidade: propriedade.cidade,
    estado: propriedade.estado,
    areaTotal: propriedade.areaTotal.hectares,
    areaAgricultavel: propriedade.areaAgricultavel.hectares,
    areaDeVegetacao: propriedade.areaDeVegetacao.hectares,
  };
}

/** Monta a fatia da listagem. O Documento sai mascarado aqui como sai em qualquer rota. */
export function paraPagina(pagina: Pagina<Produtor>): ProdutoresPaginaResposta {
  return paginaPara(pagina, paraResposta);
}
