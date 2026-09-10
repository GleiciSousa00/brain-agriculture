import type { Produtor } from '../domain/produtor';
import type { ProdutorResposta } from './dto/produtor.dto';

/** Monta a resposta a partir do Produtor, mascarando o Documento no caminho. */
export function paraResposta(produtor: Produtor): ProdutorResposta {
  return {
    id: produtor.id,
    nome: produtor.nome,
    documento: produtor.documento.mascarado(),
    tipoDeDocumento: produtor.documento.tipo,
  };
}
