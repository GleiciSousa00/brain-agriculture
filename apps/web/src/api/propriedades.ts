import type { CriarPropriedade, EditarPropriedade, Propriedade } from '@cadastro-rural/contracts';
import { colher, colherVazio } from './chamada';
import { api } from './cliente';
import type { Pagina } from './pagina';
import { buscarProdutoresPorId } from './produtores';

/**
 * A Propriedade e o nome de quem é dono dela.
 *
 * A API entrega a Propriedade apontando para o Produtor por identificador, e o nome é
 * resolvido aqui, pelos identificadores que a página trouxe. Ver o registro 0012.
 */
export interface PropriedadeComDono extends Propriedade {
  produtorNome: string;
}

/** Uma fatia de Propriedades, ordenada por nome. */
export async function listarPropriedades(
  pagina: number,
  tamanho: number,
  busca?: string,
): Promise<Pagina<Propriedade>> {
  return colher(() => api.GET('/propriedades', { params: { query: { pagina, tamanho, busca } } }));
}

/**
 * A mesma fatia, com o nome do dono de cada Propriedade.
 *
 * São duas chamadas, e não uma por linha: os donos da página são pedidos de uma vez, pelos
 * identificadores distintos que ela trouxe.
 */
export async function listarPropriedadesComDono(
  pagina: number,
  tamanho: number,
  busca?: string,
): Promise<Pagina<PropriedadeComDono>> {
  const fatia = await listarPropriedades(pagina, tamanho, busca);
  const donos = await buscarProdutoresPorId([
    ...new Set(fatia.itens.map((propriedade) => propriedade.produtorId)),
  ]);
  const nomes = new Map(donos.map((dono) => [dono.id, dono.nome]));

  return {
    ...fatia,
    itens: fatia.itens.map((propriedade) => ({
      ...propriedade,
      // Vazio só na corrida entre as duas chamadas: quem some entre elas leva as
      // Propriedades junto, pela cascata do registro 0003. Quem mostra decide o que pôr no
      // lugar do nome que não veio.
      produtorNome: nomes.get(propriedade.produtorId) ?? '',
    })),
  };
}

/**
 * Uma fatia das Propriedades de um Produtor.
 *
 * Quem recorta é a rota do Produtor, e a busca por nome vai junto: recortar do lado de cá
 * só recortaria a página que já veio. O Produtor volta para as linhas porque a rota, sendo a
 * dele, não repete de quem cada Propriedade é — e aqui o nome do dono sai de graça, porque a
 * resposta já é a dele.
 */
export async function listarPropriedadesDoProdutor(
  produtorId: string,
  pagina: number,
  tamanho: number,
  busca?: string,
): Promise<Pagina<PropriedadeComDono>> {
  const produtor = await colher(() =>
    api.GET('/produtores/{id}', {
      params: { path: { id: produtorId }, query: { pagina, tamanho, busca } },
    }),
  );

  return {
    ...produtor.propriedades,
    itens: produtor.propriedades.itens.map((propriedade) => ({
      ...propriedade,
      produtorId,
      produtorNome: produtor.nome,
    })),
  };
}

/** Registra uma Propriedade em nome de um Produtor. */
export async function criarPropriedade(corpo: CriarPropriedade): Promise<Propriedade> {
  return colher(() => api.POST('/propriedades', { body: corpo }));
}

/** Atualiza o nome, a localização e as áreas. O Produtor da Propriedade não muda. */
export async function editarPropriedade(
  id: string,
  corpo: EditarPropriedade,
): Promise<Propriedade> {
  return colher(() => api.PUT('/propriedades/{id}', { params: { path: { id } }, body: corpo }));
}

/** Exclui uma Propriedade, e com ela seus Plantios. */
export async function excluirPropriedade(id: string): Promise<void> {
  return colherVazio(() => api.DELETE('/propriedades/{id}', { params: { path: { id } } }));
}
