import type { Propriedade } from '../../propriedades/domain/propriedade';
import type { ProdutorComPropriedades } from '../application/buscar-produtor.use-case';
import type { Produtor } from '../domain/produtor';
import type { ProdutorDetalhadoResposta, ProdutorResposta } from './dto/produtor.dto';

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
