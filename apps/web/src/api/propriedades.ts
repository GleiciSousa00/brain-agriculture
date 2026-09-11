import type { CriarPropriedade, EditarPropriedade, Propriedade } from '@cadastro-rural/contracts';
import { colher, colherVazio } from './chamada';
import { api } from './cliente';
import { PRIMEIRA_PAGINA, TAMANHO_MAXIMO, type Pagina } from './pagina';
import { listarProdutores } from './produtores';

/**
 * A Propriedade e o nome de quem é dono dela.
 *
 * A API entrega a Propriedade apontando para o Produtor por identificador, e o nome é
 * resolvido aqui, pelos identificadores que a página trouxe. Resolver aqui, e não na tela, é
 * o que dispensa o catálogo que a tela carregava de antemão: ele parava no teto da listagem
 * e deixava sem nome o dono que viesse depois dele.
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
 * identificadores distintos que ela trouxe. Uma página não passa do teto da listagem, então
 * a lista de identificadores também não.
 */
export async function listarPropriedadesComDono(
  pagina: number,
  tamanho: number,
  busca?: string,
): Promise<Pagina<PropriedadeComDono>> {
  const fatia = await listarPropriedades(pagina, tamanho, busca);
  const ids = [...new Set(fatia.itens.map((propriedade) => propriedade.produtorId))];
  const donos = await listarProdutores(PRIMEIRA_PAGINA, TAMANHO_MAXIMO, undefined, ids);
  const nomes = new Map(donos.itens.map((dono) => [dono.id, dono.nome]));

  return {
    ...fatia,
    itens: fatia.itens.map((propriedade) => ({
      ...propriedade,
      // Vazio só na corrida entre as duas chamadas: quem some entre elas leva as
      // Propriedades junto, pela cascata do registro 0003.
      produtorNome: nomes.get(propriedade.produtorId) ?? '',
    })),
  };
}

/**
 * Uma fatia das Propriedades de um Produtor.
 *
 * Quem recorta é a rota do Produtor, e a busca por nome vai junto: recortar do lado de cá
 * só recortaria a página que já veio. O Produtor volta para as linhas porque a rota, sendo a
 * dele, não repete de quem cada Propriedade é — e aqui o nome do dono não custa chamada
 * nenhuma, porque a resposta já é a dele.
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
